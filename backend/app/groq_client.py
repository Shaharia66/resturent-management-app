import httpx

from app.config import settings

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


async def ask_groq(system_prompt: str, user_question: str) -> str:
    if not settings.GROQ_API_KEY:
        return (
            "AI assistant is not configured yet. Please set GROQ_API_KEY in the "
            "backend .env file to enable this feature."
        )

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_question},
        ],
        "temperature": 0.4,
        "max_tokens": 800,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(GROQ_API_URL, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as e:
        return f"AI request failed ({e.response.status_code}): {e.response.text[:300]}"
    except Exception as e:
        return f"AI request failed: {str(e)}"
