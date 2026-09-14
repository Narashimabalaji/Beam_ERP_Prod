from pydantic import BaseModel

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    input_tokens: int
    output_tokens: int
    session_id: str
