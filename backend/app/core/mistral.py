import os

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=os.environ["HF_TEXT_TOKEN"],
)


def generate_marketing_ai_reply(
    user_message: str,
    business_name: str,
    industry: str,
) -> str:

    prompt = f"""
You are an AI marketing assistant.

Business Name: {business_name}
Industry: {industry}

User Request:
{user_message}

Provide a useful and practical marketing response.
Keep the response clear, professional, and easy to understand.
"""

    completion = client.chat.completions.create(
        model=os.environ["HF_TEXT_MODEL"],
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    return completion.choices[0].message.content
