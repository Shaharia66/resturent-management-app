import hashlib
import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, get_current_admin
from app.groq_client import ask_groq
from app.redis_client import redis_client

router = APIRouter(prefix="/api/ai", tags=["ai"])

CACHE_TTL_SECONDS = 120


def _cache_key(prefix: str, question: str, extra: str = "") -> str:
    digest = hashlib.sha256((question + extra).encode()).hexdigest()
    return f"ai_cache:{prefix}:{digest}"


# ---------- Admin AI: employees + inventory (what to buy / what to store) ----------

@router.post("/admin/ask", response_model=schemas.AIAnswer)
async def admin_ask(
    payload: schemas.AIQuestion,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    cache_key = _cache_key("admin", payload.question)
    cached = redis_client.get(cache_key)
    if cached:
        return schemas.AIAnswer(answer=cached)

    employees = db.query(models.Employee).all()
    food_items = db.query(models.FoodItem).all()

    employees_summary = [
        {
            "name": e.name,
            "position": e.position,
            "department": e.department,
            "salary": e.salary,
            "active": e.is_active,
            "hire_date": e.hire_date.strftime("%Y-%m-%d") if e.hire_date else None,
        }
        for e in employees
    ]

    food_summary = [
        {
            "name": f.name,
            "category": f.category.name if f.category else None,
            "price": f.price,
            "stock_quantity": f.stock_quantity,
            "unit": f.unit,
            "reorder_threshold": f.reorder_threshold,
            "needs_restock": f.needs_restock,
            "available": f.is_available,
        }
        for f in food_items
    ]

    needs_restock = [f["name"] for f in food_summary if f["needs_restock"]]
    well_stocked = [f["name"] for f in food_summary if not f["needs_restock"]]

    system_prompt = f"""You are an AI operations assistant for a restaurant's admin dashboard.
You help the admin understand staffing and inventory at a glance.

EMPLOYEE DATA (JSON):
{json.dumps(employees_summary, indent=2)}

FOOD / INVENTORY DATA (JSON):
{json.dumps(food_summary, indent=2)}

Items currently needing restock (at or below reorder threshold): {needs_restock or "None"}
Items currently well stocked: {well_stocked or "None"}

Answer the admin's question using ONLY the data above. Be concise, use bullet points
where helpful, and give clear, actionable recommendations (e.g. what to buy, how many
employees are in each role, who might be understaffed, which items are overstocked).
If the question cannot be answered from the data, say so honestly."""

    answer = await ask_groq(system_prompt, payload.question)
    redis_client.setex(cache_key, CACHE_TTL_SECONDS, answer)
    return schemas.AIAnswer(answer=answer)


# ---------- Customer AI: food info, ratings, comments ----------

@router.post("/customer/ask", response_model=schemas.AIAnswer)
async def customer_ask(
    payload: schemas.AIQuestion,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cache_key = _cache_key("customer", payload.question, str(payload.food_item_id or ""))
    cached = redis_client.get(cache_key)
    if cached:
        return schemas.AIAnswer(answer=cached)

    query = db.query(models.FoodItem)
    if payload.food_item_id:
        query = query.filter(models.FoodItem.id == payload.food_item_id)
    items = query.filter(models.FoodItem.is_available == True).all()  # noqa: E712

    menu_summary = []
    for item in items:
        agg = (
            db.query(func.avg(models.Rating.stars), func.count(models.Rating.id))
            .filter(models.Rating.food_item_id == item.id)
            .first()
        )
        avg_rating = round(agg[0], 2) if agg and agg[0] else None
        rating_count = agg[1] if agg else 0

        recent_comments = (
            db.query(models.Comment)
            .filter(models.Comment.food_item_id == item.id)
            .order_by(models.Comment.created_at.desc())
            .limit(5)
            .all()
        )

        menu_summary.append(
            {
                "name": item.name,
                "description": item.description,
                "price": item.price,
                "category": item.category.name if item.category else None,
                "average_rating": avg_rating,
                "rating_count": rating_count,
                "recent_comments": [c.content for c in recent_comments],
            }
        )

    system_prompt = f"""You are a friendly AI assistant for restaurant customers.
You help customers learn about menu items, prices, ratings and what other
customers are saying, and give recommendations.

MENU DATA (JSON):
{json.dumps(menu_summary, indent=2)}

Answer the customer's question using ONLY the data above. Be warm and helpful.
If asked for a recommendation, prefer items with higher average ratings.
If the data doesn't contain the answer, say so honestly and suggest browsing the menu."""

    answer = await ask_groq(system_prompt, payload.question)
    redis_client.setex(cache_key, CACHE_TTL_SECONDS, answer)
    return schemas.AIAnswer(answer=answer)
