from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import time

# Add the current directory to Python path so we can import our modules
sys.path.append(os.path.dirname(__file__))

from main import solve_with_milp_multiple, generate_piece_types, STAT_NAMES, calculate_actual_stats, CLASS_ITEM_ROLLS
from cache import optimization_cache
from rate_limiter import rate_limiter

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        start_time = time.time()
        try:
            # Get client IP for rate limiting
            client_ip = self.headers.get('X-Forwarded-For', self.client_address[0]).split(',')[0].strip()
            
            # Check rate limit
            is_allowed, retry_after = rate_limiter.is_allowed(client_ip)
            if not is_allowed:
                self.send_response(429)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Retry-After', str(retry_after))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                error_response = {
                    "error": "Rate limit exceeded. Please wait before making another request.",
                    "retry_after_seconds": retry_after
                }
                self.wfile.write(json.dumps(error_response).encode('utf-8'))
                return
            
            # Read request body first
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Try to get cached response first
            cached_response = optimization_cache.get(request_data)
            if cached_response:
                # Return cached response immediately  
                response = cached_response.get('response', cached_response)
                response['cached'] = True
                response['cache_age_seconds'] = int(time.time() - cached_response.get('cached_at', time.time()))
                
                # Send cache hit response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.send_header('X-Cache-Status', 'HIT')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return
            
            # Set CORS headers for cache miss
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('X-Cache-Status', 'MISS')
            self.end_headers()
            
            # Extract parameters with defaults
            allow_tuned = request_data.get('allow_tuned', True)
            use_exotic = request_data.get('use_exotic', False)
            use_class_item_exotic = request_data.get('use_class_item_exotic', False)
            exotic_perks = request_data.get('exotic_perks')
            minimum_constraints = request_data.get('minimum_constraints')
            
            # Convert to desired totals array
            desired_totals = [
                request_data.get('Health', 0),
                request_data.get('Melee', 0),
                request_data.get('Grenade', 0),
                request_data.get('Super', 0),
                request_data.get('Class', 0),
                request_data.get('Weapons', 0)
            ]
            
            # Validate exotic perk combination if using exotic class item
            exotic_perks_tuple = None
            if use_exotic and use_class_item_exotic:
                if not exotic_perks or len(exotic_perks) != 2:
                    self.send_error(400, "exotic_perks must be a list of exactly 2 perk names when using exotic class item")
                    return
                
                exotic_perks_tuple = tuple(exotic_perks)
                if exotic_perks_tuple not in CLASS_ITEM_ROLLS:
                    available_combinations = list(CLASS_ITEM_ROLLS.keys())
                    error_msg = f"Invalid exotic perk combination: {exotic_perks_tuple}. Available combinations: {available_combinations}"
                    self.send_error(400, error_msg)
                    return
            
            # Generate piece types and their stats
            piece_types, piece_stats = generate_piece_types(
                allow_tuned=allow_tuned,
                use_exotic=use_exotic,
                use_class_item_exotic=use_class_item_exotic,
                exotic_perks=exotic_perks_tuple
            )
            
            # Run optimization with reduced timeout for better resource efficiency
            # Most users get good results within 15 seconds
            solutions_list, deviations_list = solve_with_milp_multiple(
                desired_totals, 
                piece_types, 
                piece_stats, 
                max_solutions=8,  # Slightly fewer solutions for faster computation
                allow_tuned=allow_tuned,
                require_exotic=use_exotic,
                total_timeout=15,  # Reduced from 30 to 15 seconds
                minimum_constraints=minimum_constraints
            )
            
            if not solutions_list:
                response = {
                    "solutions": [],
                    "message": "No solutions found for the given stat requirements"
                }
            else:
                # Convert solutions to the format expected by the frontend
                formatted_solutions = []
                for sol, deviation in zip(solutions_list, deviations_list):
                    # Convert piece types to JSON strings for frontend consumption
                    pieces_dict = {}
                    tuning_requirements = {}
                    flexible_pieces = 0
                    
                    for piece_type, count in sol.items():
                        # Convert PieceType namedtuple to dict then to JSON string
                        piece_dict = {
                            'arch': piece_type.arch,
                            'tertiary': piece_type.tertiary,
                            'tuning_mode': piece_type.tuning_mode,
                            'mod_target': piece_type.mod_target,
                            'tuned_stat': piece_type.tuned_stat,
                            'siphon_from': piece_type.siphon_from
                        }
                        pieces_dict[json.dumps(piece_dict)] = count
                        
                        # Track tuning requirements separately
                        if piece_type.tuning_mode == "tuned":
                            # Store as {stat: [{"count": count, "siphon_from": stat}, ...]}
                            if piece_type.tuned_stat not in tuning_requirements:
                                tuning_requirements[piece_type.tuned_stat] = []
                            tuning_requirements[piece_type.tuned_stat].append({
                                "count": count,
                                "siphon_from": piece_type.siphon_from
                            })
                            # This piece can accept flexible tuning
                            flexible_pieces += count
                        elif piece_type.tuning_mode == "none" and not str(piece_type.arch).lower().startswith("exotic "):
                            # Non-exotic, non-balanced pieces can accept any +5/-5 tuning
                            flexible_pieces += count
                    
                    # Calculate actual stats achieved by this solution
                    actual_stats = calculate_actual_stats(sol, piece_stats)
                    
                    formatted_solutions.append({
                        "pieces": pieces_dict,
                        "deviation": float(deviation),
                        "actualStats": actual_stats,
                        "tuningRequirements": tuning_requirements,
                        "flexiblePieces": flexible_pieces
                    })
                
                response = {
                    "solutions": formatted_solutions,
                    "message": f"Found {len(formatted_solutions)} optimal solution(s)",
                    "compute_time_seconds": round(time.time() - start_time, 2),
                    "cached": False
                }
            
            # Cache the response for future requests
            optimization_cache.set(request_data, response)
            
            # Periodic cleanup to prevent memory leaks (every ~100 requests)
            if int(start_time) % 100 == 0:
                rate_limiter.cleanup_old_entries()
            
            # Send response
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_error(500, f"Optimization failed: {str(e)}")
    
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()