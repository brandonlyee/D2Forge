from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import time

# Add the current directory to Python path so we can import our modules
sys.path.append(os.path.dirname(__file__))

from main import (
    solve_with_milp_multiple,
    generate_piece_types,
    add_locked_pieces,
    calculate_actual_stats,
    CLASS_ITEM_ROLLS,
    STAT_NAMES,
)
from cache import optimization_cache
from rate_limiter import rate_limiter
from config import EXACT_TIMEOUT_SECONDS, OPTIMIZATION_TIMEOUT_SECONDS
from http_utils import send_json, send_preflight

METHODS = 'POST, OPTIONS'


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        start_time = time.time()
        try:
            # Rate limit by client IP
            client_ip = self.headers.get('X-Forwarded-For', self.client_address[0]).split(',')[0].strip()
            is_allowed, retry_after = rate_limiter.is_allowed(client_ip)
            if not is_allowed:
                send_json(self, {
                    "error": "Rate limit exceeded. Please wait before making another request.",
                    "retry_after_seconds": retry_after,
                }, status=429, methods=METHODS, extra_headers={'Retry-After': str(retry_after)})
                return

            # Parse request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))

            # Serve from cache when possible
            cached_response = optimization_cache.get(request_data)
            if cached_response:
                response = cached_response.get('response', cached_response)
                response['cached'] = True
                response['cache_age_seconds'] = int(time.time() - cached_response.get('cached_at', time.time()))
                send_json(self, response, methods=METHODS, extra_headers={'X-Cache-Status': 'HIT'})
                return

            # Extract parameters with defaults
            allow_tuned = request_data.get('allow_tuned', True)
            use_class_item_exotic = request_data.get('use_class_item_exotic', False)
            exotic_perks = request_data.get('exotic_perks')
            minimum_constraints = request_data.get('minimum_constraints')

            # Subclass fragments shift the player's baseline stats. The armor only needs to make
            # up the difference, so we subtract the fragment bonus from every target before
            # solving and fold it back into the reported stats afterward.
            fragment_bonuses = request_data.get('fragment_bonuses') or {}

            desired_totals = [
                request_data.get(s, 0) - fragment_bonuses.get(s, 0)
                for s in STAT_NAMES
            ]

            # Shift any minimum constraints onto the same armor-only basis.
            if minimum_constraints:
                minimum_constraints = {
                    s: (None if minimum_constraints.get(s) is None
                        else minimum_constraints[s] - fragment_bonuses.get(s, 0))
                    for s in STAT_NAMES
                }

            # User-locked pieces ("build around these"). Up to 4 owned pieces every build must
            # include; the solver fills the remaining slots optimally. This composes with the
            # exotic class item feature — the only conflict is the class slot, since an exotic
            # class item and a locked class item both want it.
            locked_pieces = request_data.get('locked_pieces') or []
            if locked_pieces:
                if len(locked_pieces) > 4:
                    send_json(self, {
                        "error": "At most 4 locked pieces are allowed.",
                    }, status=400, methods=METHODS)
                    return
                slots = [p.get('slot') for p in locked_pieces]
                if len(set(slots)) != len(slots):
                    send_json(self, {
                        "error": "Each locked piece must use a different gear slot.",
                    }, status=400, methods=METHODS)
                    return
                if 'class' in slots and use_class_item_exotic:
                    send_json(self, {
                        "error": "A locked class item conflicts with the exotic class item; "
                                 "both occupy the class slot. Disable one.",
                    }, status=400, methods=METHODS)
                    return

            # Validate exotic perk combination if using an exotic class item
            exotic_perks_tuple = None
            if use_class_item_exotic:
                if not exotic_perks or len(exotic_perks) != 2:
                    send_json(self, {
                        "error": "exotic_perks must be a list of exactly 2 perk names when using exotic class item",
                    }, status=400, methods=METHODS)
                    return

                exotic_perks_tuple = tuple(exotic_perks)
                if exotic_perks_tuple not in CLASS_ITEM_ROLLS:
                    send_json(self, {
                        "error": f"Invalid exotic perk combination: {exotic_perks_tuple}",
                        "available_combinations": list(CLASS_ITEM_ROLLS.keys()),
                    }, status=400, methods=METHODS)
                    return

            # Generate piece types and solve
            piece_types, piece_stats = generate_piece_types(
                allow_tuned=allow_tuned,
                use_class_item_exotic=use_class_item_exotic,
                exotic_perks=exotic_perks_tuple,
            )

            # Register locked pieces (their specs are validated here via ValueError -> 400).
            try:
                locked_groups = add_locked_pieces(piece_types, piece_stats, locked_pieces)
            except ValueError as e:
                send_json(self, {"error": f"Invalid locked piece: {str(e)}"}, status=400, methods=METHODS)
                return

            solutions_list, deviations_list = solve_with_milp_multiple(
                desired_totals,
                piece_types,
                piece_stats,
                max_solutions=5,
                allow_tuned=allow_tuned,
                require_class_item=use_class_item_exotic,
                total_timeout=OPTIMIZATION_TIMEOUT_SECONDS,
                exact_timeout=EXACT_TIMEOUT_SECONDS,
                minimum_constraints=minimum_constraints,
                locked_groups=locked_groups,
            )

            if not solutions_list:
                response = {
                    "solutions": [],
                    "message": "No solutions found for the given stat requirements",
                }
            else:
                response = {
                    "solutions": _format_solutions(solutions_list, deviations_list, piece_stats, fragment_bonuses),
                    "message": f"Found {len(solutions_list)} optimal solution(s)",
                    "compute_time_seconds": round(time.time() - start_time, 2),
                    "cached": False,
                }

            # Cache the response for future identical requests
            optimization_cache.set(request_data, response)

            send_json(self, response, methods=METHODS, extra_headers={'X-Cache-Status': 'MISS'})

        except Exception as e:
            send_json(self, {"error": f"Optimization failed: {str(e)}"}, status=500, methods=METHODS)

    def do_OPTIONS(self):
        send_preflight(self, methods=METHODS)


def _format_solutions(solutions_list, deviations_list, piece_stats, fragment_bonuses=None):
    """Convert solver output into the JSON shape the frontend expects.

    ``fragment_bonuses`` (a {stat: delta} dict) is the baseline shift from subclass fragments.
    It is added back into the reported ``actualStats`` so the frontend compares true totals
    (armor + fragments) against the user's desired totals.
    """
    fragment_bonuses = fragment_bonuses or {}
    bonus_vec = [fragment_bonuses.get(s, 0) for s in STAT_NAMES]
    formatted_solutions = []
    for sol, deviation in zip(solutions_list, deviations_list):
        pieces_dict = {}
        tuning_requirements = {}
        flexible_pieces = 0

        for piece_type, count in sol.items():
            # Convert PieceType namedtuple to a JSON string key for frontend consumption
            piece_dict = {
                'arch': piece_type.arch,
                'tertiary': piece_type.tertiary,
                'tuning_mode': piece_type.tuning_mode,
                'mod_target': piece_type.mod_target,
                'tuned_stat': piece_type.tuned_stat,
                'siphon_from': piece_type.siphon_from,
                # None for solver-chosen pieces; "armor"/"class" for user-locked (owned) pieces.
                'slot': piece_type.slot,
            }
            pieces_dict[json.dumps(piece_dict)] = count

            if piece_type.tuning_mode == "tuned":
                # Track tuning requirements: {stat: [{"count": n, "siphon_from": stat}, ...]}
                tuning_requirements.setdefault(piece_type.tuned_stat, []).append({
                    "count": count,
                    "siphon_from": piece_type.siphon_from,
                })
                flexible_pieces += count
            elif piece_type.tuning_mode == "none":
                # Every piece (including the Exotic Class Item) has an open tuning slot and
                # can accept any +5/-5 tuning mod.
                flexible_pieces += count

        armor_stats = calculate_actual_stats(sol, piece_stats)
        total_stats = [armor_stats[i] + bonus_vec[i] for i in range(6)]
        formatted_solutions.append({
            "pieces": pieces_dict,
            "deviation": float(deviation),
            "actualStats": total_stats,
            "tuningRequirements": tuning_requirements,
            "flexiblePieces": flexible_pieces,
        })

    return formatted_solutions
