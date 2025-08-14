from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add the current directory to Python path so we can import our modules
sys.path.append(os.path.dirname(__file__))

from main import STAT_NAMES

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Set CORS headers
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                "stat_names": STAT_NAMES,
                "max_possible_total": 515,  # 5 pieces * 103 max per piece (with balanced tuning)  
                "description": "Destiny 2 has 6 stats that can be optimized through armor selection and modding"
            }
            
            # Send response
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_error(500, f"Failed to get stats info: {str(e)}")
    
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()