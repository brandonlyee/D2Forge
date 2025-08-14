from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add the current directory to Python path so we can import our modules
sys.path.append(os.path.dirname(__file__))

from main import solve_with_milp_multiple, generate_piece_types, STAT_NAMES, calculate_actual_stats, CLASS_ITEM_ROLLS

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Set CORS headers
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
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
            
            # Run the optimization with full 30-second timeout (Vercel Hobby allows 300s)
            solutions_list, deviations_list = solve_with_milp_multiple(
                desired_totals, 
                piece_types, 
                piece_stats, 
                max_solutions=10,
                allow_tuned=allow_tuned,
                require_exotic=use_exotic,
                total_timeout=30,
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
                    
                    # Calculate actual stats achieved by this solution
                    actual_stats = calculate_actual_stats(sol, piece_stats)
                    
                    formatted_solutions.append({
                        "pieces": pieces_dict,
                        "deviation": float(deviation),
                        "actualStats": actual_stats
                    })
                
                response = {
                    "solutions": formatted_solutions,
                    "message": f"Found {len(formatted_solutions)} optimal solution(s)"
                }
            
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