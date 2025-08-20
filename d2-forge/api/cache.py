import hashlib
import json
import os
import time
from typing import Dict, Any, Optional, Tuple

class ResponseCache:
    """Simple file-based cache for optimization responses."""
    
    def __init__(self, cache_dir: str = "/tmp/d2forge_cache", ttl_seconds: int = 3600):
        self.cache_dir = cache_dir
        self.ttl_seconds = ttl_seconds  # 1 hour default
        self._ensure_cache_dir()
    
    def _ensure_cache_dir(self):
        """Create cache directory if it doesn't exist."""
        try:
            os.makedirs(self.cache_dir, exist_ok=True)
        except:
            # If we can't create cache dir, disable caching
            self.cache_dir = None
    
    def _get_cache_key(self, request_data: Dict[str, Any]) -> str:
        """Generate a hash key for the request."""
        # Extract only the relevant optimization parameters
        cache_params = {
            'Health': request_data.get('Health', 0),
            'Melee': request_data.get('Melee', 0),
            'Grenade': request_data.get('Grenade', 0),
            'Super': request_data.get('Super', 0),
            'Class': request_data.get('Class', 0),
            'Weapons': request_data.get('Weapons', 0),
            'allow_tuned': request_data.get('allow_tuned', True),
            'use_exotic': request_data.get('use_exotic', False),
            'use_class_item_exotic': request_data.get('use_class_item_exotic', False),
            'exotic_perks': request_data.get('exotic_perks'),
            'minimum_constraints': request_data.get('minimum_constraints')
        }
        
        # Create deterministic hash
        cache_string = json.dumps(cache_params, sort_keys=True)
        return hashlib.sha256(cache_string.encode()).hexdigest()
    
    def _get_cache_path(self, cache_key: str) -> str:
        """Get the file path for a cache key."""
        return os.path.join(self.cache_dir, f"{cache_key}.json")
    
    def get(self, request_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get cached response if it exists and is not expired."""
        if not self.cache_dir:
            return None
            
        try:
            cache_key = self._get_cache_key(request_data)
            cache_path = self._get_cache_path(cache_key)
            
            if not os.path.exists(cache_path):
                return None
            
            # Check if cache is expired
            if time.time() - os.path.getmtime(cache_path) > self.ttl_seconds:
                try:
                    os.remove(cache_path)
                except:
                    pass
                return None
            
            # Load and return cached response
            with open(cache_path, 'r') as f:
                cached_data = json.load(f)
                return cached_data
                
        except Exception:
            # If any error occurs, just return None (cache miss)
            return None
    
    def set(self, request_data: Dict[str, Any], response_data: Dict[str, Any]) -> bool:
        """Cache the response data."""
        if not self.cache_dir:
            return False
            
        try:
            cache_key = self._get_cache_key(request_data)
            cache_path = self._get_cache_path(cache_key)
            
            # Add cache metadata
            cached_data = {
                'response': response_data,
                'cached_at': time.time(),
                'cache_key': cache_key
            }
            
            # Write to cache file
            with open(cache_path, 'w') as f:
                json.dump(cached_data, f)
            
            return True
            
        except Exception:
            # If caching fails, don't fail the request
            return False
    
    def clear_expired(self):
        """Clear expired cache entries."""
        if not self.cache_dir:
            return
            
        try:
            current_time = time.time()
            for filename in os.listdir(self.cache_dir):
                if filename.endswith('.json'):
                    filepath = os.path.join(self.cache_dir, filename)
                    if current_time - os.path.getmtime(filepath) > self.ttl_seconds:
                        try:
                            os.remove(filepath)
                        except:
                            pass
        except Exception:
            pass

# Global cache instance
# Set TTL to 2 hours for optimization responses since they're deterministic
optimization_cache = ResponseCache(ttl_seconds=7200)