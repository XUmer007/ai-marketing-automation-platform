import traceback

from fastapi import HTTPException, status
from google import genai
from google.genai import types

from app.core.config import settings


def get_gemini_client():
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "GEMINI_API_KEY is missing in backend .env file",
                "fix": "Add GEMINI_API_KEY=your_key_here inside backend/.env and restart uvicorn",
            },
        )

    return genai.Client(api_key=settings.GEMINI_API_KEY)


def generate_marketing_ai_reply(
    user_message: str,
    business_name: str = "your business",
    industry: str | None = None,
):
    client = get_gemini_client()

    prompt = f"""
You are a professional AI marketing strategist.

Help this business owner create a practical marketing plan.

Business Name:
{business_name}

Industry:
{industry or "Not specified"}

User Message:
{user_message}

Create the response in this format:

1. Business Understanding
2. Target Audience
3. Marketing Strategy
4. Weekly Facebook Content Plan
5. 3 Ready-to-Use Facebook Captions
6. 3 Image Generation Prompts
7. Next Step

Important:
- Keep the answer practical.
- Use simple business language.
- For image prompts, use beige and mehroon classic premium theme.
"""

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=1200,
            ),
        )

        reply = getattr(response, "text", None)

        if not reply:
            raise Exception(f"Gemini returned empty response: {response}")

        return reply

    except Exception as error:
        print("\n========== GEMINI API ERROR ==========")
        print(str(error))
        traceback.print_exc()
        print("=====================================\n")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Gemini API failed",
                "error": str(error),
                "model": settings.GEMINI_MODEL,
            },
        )