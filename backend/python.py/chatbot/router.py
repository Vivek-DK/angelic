from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import requests

load_dotenv()
router = APIRouter()

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if not OPENROUTER_KEY:
        return {
            "type": "error",
            "data": "**OpenRouter Error:** Missing API key in environment variables."
        }

    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "openai/gpt-3.5-turbo",  
            "messages": [
                {"role": "user", "content": req.message}
            ]
        }

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )

        print("Status:", response.status_code)
        print("Response:", response.text)

        response.raise_for_status()
        data = response.json()

        reply = data["choices"][0]["message"]["content"].strip()
        return {"type": "text", "data": reply}

    except requests.exceptions.HTTPError as http_err:
        return {"type": "error", "data": f"**OpenRouter HTTP Error:** {str(http_err)}"}
    except Exception as e:
        return {"type": "error", "data": f"**OpenRouter Error:** {str(e)}"}
