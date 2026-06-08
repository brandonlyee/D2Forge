from http.server import BaseHTTPRequestHandler
import sys
import os

# Add the current directory to Python path so we can import our modules
sys.path.append(os.path.dirname(__file__))

from main import STAT_NAMES
from config import MAX_POSSIBLE_TOTAL
from http_utils import send_json, send_preflight


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            send_json(self, {
                "stat_names": STAT_NAMES,
                "max_possible_total": MAX_POSSIBLE_TOTAL,
                "description": "Destiny 2 has 6 stats that can be optimized through armor selection and modding",
            })
        except Exception as e:
            send_json(self, {"error": f"Failed to get stats info: {str(e)}"}, status=500)

    def do_OPTIONS(self):
        send_preflight(self)
