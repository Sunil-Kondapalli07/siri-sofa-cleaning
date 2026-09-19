"""
Siri Sofa Services — Rate Limiting Engine
Thread-safe sliding-window rate limiter for protecting sensitive authentication,
OTP generation/verification, and administrative endpoints against brute-force and DoS attacks.
"""

import time
import threading
from typing import Tuple, Dict, List

class SlidingWindowRateLimiter:
    def __init__(self):
        self._lock = threading.Lock()
        self._hits: Dict[str, List[float]] = {}

    def check(self, key: str, max_requests: int, window_seconds: int) -> Tuple[bool, int]:
        """
        Check if an action is permitted under the rate limit.
        Returns (is_allowed, retry_after_seconds).
        """
        now = time.time()
        with self._lock:
            timestamps = self._hits.get(key, [])
            # Prune timestamps outside the window
            cutoff = now - window_seconds
            timestamps = [t for t in timestamps if t > cutoff]
            
            if len(timestamps) >= max_requests:
                earliest = timestamps[0]
                retry_after = max(1, int(window_seconds - (now - earliest)))
                self._hits[key] = timestamps
                return False, retry_after

            timestamps.append(now)
            self._hits[key] = timestamps
            return True, 0

    def record_failure(self, key: str) -> None:
        """Explicitly record a failed attempt (e.g. invalid password or invalid OTP)"""
        now = time.time()
        with self._lock:
            if key not in self._hits:
                self._hits[key] = []
            self._hits[key].append(now)

    def reset(self, key: str) -> None:
        """Clear rate limit records for a given key (e.g. on successful login)"""
        with self._lock:
            if key in self._hits:
                del self._hits[key]

# Singleton rate limiter instances
limiter = SlidingWindowRateLimiter()
