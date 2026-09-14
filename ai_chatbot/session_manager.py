import uuid
from typing import List, Dict

# In-memory storage for sessions (Use Redis/Database in production)
_sessions: Dict[str, List[Dict[str, str]]] = {}

def get_or_create_session(session_id: str = None) -> tuple[str, List[Dict[str, str]]]:
    """Retrieve existing session history or create a new one."""
    if not session_id or session_id not in _sessions:
        session_id = str(uuid.uuid4())
        _sessions[session_id] = []
    
    return session_id, _sessions[session_id]

def add_message_to_session(session_id: str, role: str, content: str):
    """Add a message to the conversation history."""
    if session_id in _sessions:
        _sessions[session_id].append({"role": role, "content": content})
