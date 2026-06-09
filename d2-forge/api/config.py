"""Shared configuration constants for the D2 Forge API."""

# Response cache
CACHE_TTL_SECONDS = 7200  # 2 hours; optimization results are deterministic

# Rate limiting (per client IP)
RATE_LIMIT_MAX_REQUESTS = 4
RATE_LIMIT_WINDOW_SECONDS = 60

# Solver
EXACT_TIMEOUT_SECONDS = 15  # Phase 1 (exact) timeout
OPTIMIZATION_TIMEOUT_SECONDS = 15  # Phase 2 (approximate) timeout

# Stats
MAX_POSSIBLE_TOTAL = 515  # 5 pieces * 103 max per piece (with balanced tuning)