import os
import sys
import time
from collections import defaultdict, deque

# Ensure sibling modules are importable regardless of import order
sys.path.append(os.path.dirname(__file__))

from config import RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_SECONDS

class SimpleRateLimiter:
    """Simple in-memory rate limiter to prevent API abuse."""

    def __init__(self, max_requests=RATE_LIMIT_MAX_REQUESTS, window_seconds=RATE_LIMIT_WINDOW_SECONDS, cleanup_every=100):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.cleanup_every = cleanup_every
        self.requests = defaultdict(deque)  # IP -> deque of timestamps
        self._calls_since_cleanup = 0

    def is_allowed(self, client_ip: str) -> tuple[bool, int]:
        """
        Check if request is allowed for this IP.
        Returns (is_allowed, retry_after_seconds)
        """
        # Periodically purge stale IPs to keep memory bounded (counter-based so it
        # actually fires every N requests, not by wall-clock chance).
        self._calls_since_cleanup += 1
        if self._calls_since_cleanup >= self.cleanup_every:
            self._calls_since_cleanup = 0
            self.cleanup_old_entries()

        now = time.time()
        ip_requests = self.requests[client_ip]

        # Remove old requests outside the window
        while ip_requests and ip_requests[0] < now - self.window_seconds:
            ip_requests.popleft()

        # Check if under limit
        if len(ip_requests) < self.max_requests:
            ip_requests.append(now)
            return True, 0

        # Calculate retry after time
        oldest_request = ip_requests[0]
        retry_after = int(oldest_request + self.window_seconds - now) + 1
        return False, retry_after

    def cleanup_old_entries(self):
        """Clean up old entries to prevent memory leaks."""
        now = time.time()
        cutoff = now - self.window_seconds * 2  # Keep extra buffer

        to_remove = []
        for ip, requests in self.requests.items():
            # Remove old requests
            while requests and requests[0] < cutoff:
                requests.popleft()

            # Mark empty queues for removal
            if not requests:
                to_remove.append(ip)

        # Remove empty entries
        for ip in to_remove:
            del self.requests[ip]

# Global rate limiter (limits configured in config.py)
rate_limiter = SimpleRateLimiter()
