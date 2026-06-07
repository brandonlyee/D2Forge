from http.server import BaseHTTPRequestHandler
import sys
import os

# Add the current directory to Python path so we can import our modules
sys.path.append(os.path.dirname(__file__))

from main import CLASS_ITEM_ROLLS
from http_utils import send_json, send_preflight


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # CLASS_ITEM_ROLLS is keyed by (perk1, perk2) tuples, which aren't valid
            # JSON object keys, so expose it as a list of explicit entries.
            send_json(self, {
                "available_combinations": [list(perks) for perks in CLASS_ITEM_ROLLS.keys()],
                "class_item_rolls": [
                    {"perks": list(perks), "stats": list(stats)}
                    for perks, stats in CLASS_ITEM_ROLLS.items()
                ],
                "description": "Available perk combinations for exotic class items",
            })
        except Exception as e:
            send_json(self, {"error": f"Failed to get exotic perks: {str(e)}"}, status=500)

    def do_OPTIONS(self):
        send_preflight(self)
