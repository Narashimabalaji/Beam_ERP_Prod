from fastapi import APIRouter, HTTPException
from schemas import ChatRequest, ChatResponse
from session_manager import get_or_create_session, add_message_to_session
from chatbot import get_chatbot_response

router = APIRouter(prefix="/api/chat", tags=["Chatbot"])

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # 1. Get Conversation History
        session_id, history = get_or_create_session(request.session_id)
        
        # 2. Get AI Response from NVIDIA via chatbot.py
        reply, in_tokens, out_tokens = await get_chatbot_response(
            user_message=request.message,
            conversation_history=history,
            knowledge_entries=None,
            image_entries=None
        )
        
        # 3. Update History for next time
        add_message_to_session(session_id, "user", request.message)
        add_message_to_session(session_id, "assistant", reply)
        
        return ChatResponse(
            reply=reply,
            input_tokens=in_tokens,
            output_tokens=out_tokens,
            session_id=session_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
