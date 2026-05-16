from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

import os
import httpx
from typing import Optional


load_dotenv()

router = APIRouter()

OPENROUTER_KEY = os.getenv(
    "OPENROUTER_API_KEY"
)


# ==========================================
# REQUEST MODEL
# ==========================================

class ChatRequest(BaseModel):

    message: str

    skinTone: Optional[str] = None

    faceShape: Optional[str] = None

    season: Optional[str] = None

# ==========================================
# CHAT ENDPOINT
# ==========================================

@router.post("/chat")
async def chat_endpoint(
    req: ChatRequest
):

    if not OPENROUTER_KEY:

        return JSONResponse(

            status_code=500,

            content={

                "type": "error",

                "data":
                    "Missing OpenRouter API key."
            }
        )

    try:

        payload = {

            "model":
                "deepseek/deepseek-v4-flash",

            "messages": [

                {

                    "role": "system",

                    "content": f"""

You are Angelic AI,
a professional fashion and styling assistant.

You ONLY answer questions related to:

- fashion
- clothing
- outfits
- styling
- color combinations
- skin tone styling
- face shape styling
- seasonal palettes
- wardrobe advice
- accessories
- men's fashion
- women's fashion
- occasion dressing
- fashion trends

STRICT RULES:

- Always respond ONLY in English.
- Never generate programming code.
- Never answer coding questions.
- Never answer math/science questions.
- Never answer unrelated topics.
- If user asks unrelated questions,
  politely refuse and redirect
  toward fashion advice.

Example refusal:

"I'm specialized only in fashion,
styling, outfit recommendations,
and personal appearance guidance."

USER PROFILE:

- Skin Tone:
  {req.skinTone or "Unknown"}

- Face Shape:
  {req.faceShape or "Unknown"}

- Season:
  {req.season or "Unknown"}

Use this profile to provide
personalized fashion advice.

Keep responses:
- stylish
- modern
- practical
- concise
- premium sounding

"""
                },

                {

                    "role": "user",

                    "content":
                        req.message
                }
            ],

            "stream": False
        }

        headers = {

            "Authorization":
                f"Bearer {OPENROUTER_KEY}",

            "Content-Type":
                "application/json"
        }

        async with httpx.AsyncClient(

            timeout=60

        ) as client:

            response = await client.post(

                "https://openrouter.ai/api/v1/chat/completions",

                headers=headers,

                json=payload
            )

        response.raise_for_status()

        data = response.json()

        reply = (

            data["choices"][0]

            ["message"]

            ["content"]

            .strip()
        )

        return JSONResponse(

            status_code=200,

            content={

                "type": "text",

                "data": reply
            }
        )

    except httpx.HTTPStatusError as e:

        return JSONResponse(

            status_code=500,

            content={

                "type": "error",

                "data": e.response.text
            }
        )

    except Exception as e:

        return JSONResponse(

            status_code=500,

            content={

                "type": "error",

                "data": str(e)
            }
        )