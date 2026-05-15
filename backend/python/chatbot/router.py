from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import requests
import json

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
            "data": "Missing OpenRouter API key."
        }

    try:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "google/gemma-3n-e4b-it:free",
            "messages": [
                {"role": "user", "content": req.message}
            ],
            "stream": False      # NON-STREAM MODE → normal JSON response
        }

        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=60
        )

        response.raise_for_status()
        data = response.json()

        # Extract clean reply
        reply = data["choices"][0]["message"]["content"].strip()
        return {"type": "text", "data": reply}

    except Exception as e:
        return {"type": "error", "data": str(e)}
