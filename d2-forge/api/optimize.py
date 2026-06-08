from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import time

# Add the current directory to Python path so we can import our modules
sys.path.append(os.path.dirname(__file__))

from main import solve_with_milp_multiple, generate_piece_types, calculate_actual_stats, CLASS_ITEM_ROLLS
from cache import optimization_cache
from rate_limiter import rate_limiter
from config import OPTIMIZATION_TIMEOUT_SECONDS
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
            use_exotic = request_data.get('use_exotic', False)
            use_class_item_exotic = request_data.get('use_class_item_exotic', False)
            exotic_perks = request_data.get('exotic_perks')
            minimum_constraints = request_data.get('minimum_constraints')

            desired_totals = [
                request_data.get('Health', 0),
                request_data.get('Melee', 0),
                request_data.get('Grenade', 0),
                request_data.get('Super', 0),
                request_data.get('Class', 0),
                request_data.get('Weapons', 0),
            ]

            # Validate exotic perk combination if using an exotic class item
            exotic_perks_tuple = None
            if use_exotic and use_class_item_exotic:
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
                use_exotic=use_exotic,
                use_class_item_exotic=use_class_item_exotic,
                exotic_perks=exotic_perks_tuple,
            )

            solutions_list, deviations_list = solve_with_milp_multiple(
                desired_totals,
                piece_types,
                piece_stats,
                max_solutions=8,
                allow_tuned=allow_tuned,
                require_exotic=use_exotic,
                total_timeout=OPTIMIZATION_TIMEOUT_SECONDS,
                minimum_constraints=minimum_constraints,
            )

            if not solutions_list:
                response = {
                    "solutions": [],
                    "message": "No solutions found for the given stat requirements",
                }
            else:
                response = {
                    "solutions": _format_solutions(solutions_list, deviations_list, piece_stats),
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


def _format_solutions(solutions_list, deviations_list, piece_stats):
    """Convert solver output into the JSON shape the frontend expects."""
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
            }
            pieces_dict[json.dumps(piece_dict)] = count

            if piece_type.tuning_mode == "tuned":
                # Track tuning requirements: {stat: [{"count": n, "siphon_from": stat}, ...]}
                tuning_requirements.setdefault(piece_type.tuned_stat, []).append({
                    "count": count,
                    "siphon_from": piece_type.siphon_from,
                })
                flexible_pieces += count
            elif piece_type.tuning_mode == "none" and not str(piece_type.arch).lower().startswith("exotic "):
                # Non-exotic, non-balanced pieces can accept any +5/-5 tuning
                flexible_pieces += count

        formatted_solutions.append({
            "pieces": pieces_dict,
            "deviation": float(deviation),
            "actualStats": calculate_actual_stats(sol, piece_stats),
            "tuningRequirements": tuning_requirements,
            "flexiblePieces": flexible_pieces,
        })

    return formatted_solutions
