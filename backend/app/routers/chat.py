from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.mistral import generate_marketing_ai_reply
from app.db.database import get_db
from app.models.models import Conversation, Message, User
from app.routers.auth import get_current_db_user
from app.schemas.chat import ChatRequest, ChatResponse, ChatHistoryResponse

router = APIRouter()


@router.get("/test")
def test_mistral():
    reply = generate_marketing_ai_reply(
        user_message="Test message. Create a short marketing plan for a bakery.",
        business_name="Test Bakery",
        industry="Bakery",
    )

    return {
        "success": True,
        "model": settings.HF_TEXT_MODEL,
        "reply": reply,
    }


@router.post("/plan", response_model=ChatResponse)
def generate_marketing_plan(
    data: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_db_user),
):
    if data.conversation_id:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == data.conversation_id,
                Conversation.user_id == user.id,
            )
            .first()
        )

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found"
            )
    else:
        title = data.message[:60] if data.message else "New Marketing Chat"

        conversation = Conversation(
            user_id=user.id,
            title=title,
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=data.message,
    )

    db.add(user_message)
    db.commit()

    reply = generate_marketing_ai_reply(
        user_message=data.message,
        business_name=data.business_name or "My Business",
        industry=data.industry,
    )

    ai_message = Message(
        conversation_id=conversation.id,
        role="ai",
        content=reply,
    )

    db.add(ai_message)
    db.commit()
    db.refresh(conversation)

    return ChatResponse(
        reply=reply,
        conversation_id=str(conversation.id),
    )


@router.get(
    "/history/{conversation_id}",
    response_model=ChatHistoryResponse
)
def get_chat_history(
    conversation_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_db_user),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    return ChatHistoryResponse(
        conversation_id=str(conversation.id),
        title=conversation.title,
        messages=[
            {
                "role": message.role,
                "content": message.content,
            }
            for message in conversation.messages
        ],
    )


@router.get("/conversations")
def get_conversations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_db_user),
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    return {
        "success": True,
        "conversations": [
            {
                "id": str(conversation.id),
                "title": conversation.title,
                "created_at": conversation.created_at.isoformat(),
                "updated_at": conversation.updated_at.isoformat(),
            }
            for conversation in conversations
        ],
    }