"""Shared HTTP helpers for the Vercel Function handlers.

Centralizes the CORS headers and JSON response writing that every endpoint
otherwise duplicates.
"""

import json

ALLOW_HEADERS = 'Content-Type'


def _write_cors(handler, methods):
    handler.send_header('Access-Control-Allow-Origin', '*')
    handler.send_header('Access-Control-Allow-Methods', methods)
    handler.send_header('Access-Control-Allow-Headers', ALLOW_HEADERS)


def send_json(handler, payload, status=200, methods='GET, OPTIONS', extra_headers=None):
    """Write a JSON response with consistent CORS headers."""
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json')
    _write_cors(handler, methods)
    if extra_headers:
        for key, value in extra_headers.items():
            handler.send_header(key, value)
    handler.end_headers()
    handler.wfile.write(json.dumps(payload).encode('utf-8'))


def send_preflight(handler, methods='GET, OPTIONS'):
    """Respond to a CORS preflight (OPTIONS) request."""
    handler.send_response(200)
    _write_cors(handler, methods)
    handler.end_headers()
