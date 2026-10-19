from slowapi import Limiter
from slowapi.util import get_remote_address

# Uses in-memory storage by default.
# Key function extracts the client's IP address.
limiter = Limiter(key_func=get_remote_address)