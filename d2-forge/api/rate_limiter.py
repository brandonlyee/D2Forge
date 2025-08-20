import time
from collections import defaultdict, deque

class SimpleRateLimiter:
    """Simple in-memory rate limiter to prevent API abuse."""
    
    def __init__(self, max_requests=5, window_seconds=60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(deque)  # IP -> deque of timestamps
    
    def is_allowed(self, client_ip: str) -> tuple[bool, int]:
        """
        Check if request is allowed for this IP.
        Returns (is_allowed, retry_after_seconds)
        """
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

# Global rate limiter
# Allow 4 requests per minute per IP (with optimization timeout of 15s, this is reasonable)
rate_limiter = SimpleRateLimiter(max_requests=4, window_seconds=60)