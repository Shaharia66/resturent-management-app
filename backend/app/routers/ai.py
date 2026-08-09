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
from app.routers.food import _serialize_food_item

router = APIRouter(prefix="/api/ai", tags=["ai"])

CACHE_TTL_SECONDS = 120


def _cache_key(prefix: str, question: str, extra: str = "") -> str:
    digest = hashlib.sha256((question + extra).encode()).hexdigest()
    return f"ai_cache:{prefix}:{digest}"


# ---------- Admin AI: employees, inventory, bazar list, recipes, dine-in tables ----------

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

    # --- Employees ---
    employees = db.query(models.Employee).all()
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

    # --- Food items (reuses the same stock computation as the Food & Inventory page,
    # so recipe-based dishes show their live, ingredient-derived stock here too) ---
    food_items = db.query(models.FoodItem).all()
    food_summary = []
    for f in food_items:
        serialized = _serialize_food_item(db, f)
        food_summary.append(
            {
                "name": serialized.name,
                "category": f.category.name if f.category else None,
                "price": serialized.price,
                "stock_quantity": serialized.stock_quantity,
                "unit": serialized.unit,
                "needs_restock": serialized.needs_restock,
                "available": serialized.is_available,
                "stock_tracking": "recipe-based (auto)" if serialized.has_recipe else "manual",
            }
        )
    needs_restock_dishes = [f["name"] for f in food_summary if f["needs_restock"]]

    # --- Bazar List (raw ingredients) ---
    bazar_items = db.query(models.BazarItem).all()
    bazar_summary = [
        {
            "name": b.name,
            "quantity": b.quantity,
            "unit": b.unit,
            "reorder_threshold": b.reorder_threshold,
            "needs_restock": b.needs_restock,
        }
        for b in bazar_items
    ]
    needs_restock_ingredients = [b["name"] for b in bazar_summary if b["needs_restock"]]

    # --- Recipes (which dishes use which raw ingredients) ---
    recipe_rows = db.query(models.RecipeIngredient).all()
    recipes_by_dish = {}
    for row in recipe_rows:
        dish_name = row.food_item.name if row.food_item else "Unknown dish"
        recipes_by_dish.setdefault(dish_name, []).append(
            {
                "ingredient": row.bazar_item.name if row.bazar_item else "Unknown",
                "quantity_per_unit": row.quantity_per_unit,
                "unit": row.bazar_item.unit if row.bazar_item else "",
            }
        )

    # --- Dine-in tables (current floor status) ---
    tables = db.query(models.DiningTable).filter(models.DiningTable.is_active == True).all()  # noqa: E712
    tables_summary = []
    for t in tables:
        active_order = (
            db.query(models.TableOrder)
            .filter(models.TableOrder.table_id == t.id, models.TableOrder.is_closed == False)  # noqa: E712
            .first()
        )
        tables_summary.append(
            {
                "table": t.name,
                "capacity": t.capacity,
                "status": active_order.status.value if active_order else "free",
            }
        )

    # --- Today's bazar purchases (what's already been bought today) ---
    from datetime import date as date_type
    today_entries = (
        db.query(models.TodayBazarEntry)
        .filter(models.TodayBazarEntry.purchase_date == date_type.today())
        .all()
    )
    today_bazar_summary = [
        {
            "ingredient": e.bazar_item.name if e.bazar_item else "Unknown",
            "quantity_purchased": e.quantity_purchased,
            "unit": e.bazar_item.unit if e.bazar_item else "",
        }
        for e in today_entries
    ]

    system_prompt = f"""You are an AI operations assistant for a restaurant's admin dashboard.
You help the admin understand staffing, inventory, dine-in tables, and ingredient purchasing at a glance.
All data below is live and current as of this exact question — always answer using it, never guess.

EMPLOYEE DATA (JSON):
{json.dumps(employees_summary, indent=2)}

DISHES / FOOD & INVENTORY (JSON) — "stock_tracking" tells you if a dish's stock is entered manually
or calculated automatically from its recipe and the Bazar List:
{json.dumps(food_summary, indent=2)}
Dishes currently needing restock: {needs_restock_dishes or "None"}

BAZAR LIST — raw ingredient stock (JSON):
{json.dumps(bazar_summary, indent=2)}
Ingredients currently needing restock: {needs_restock_ingredients or "None"}

RECIPES — which raw ingredients each dish needs per unit made (JSON):
{json.dumps(recipes_by_dish, indent=2)}

DINE-IN TABLES — current floor status (JSON):
{json.dumps(tables_summary, indent=2)}

TODAY'S BAZAR PURCHASES SO FAR (JSON):
{json.dumps(today_bazar_summary, indent=2)}

Answer the admin's question using ONLY the data above. Be concise, use bullet points
where helpful, and give clear, actionable recommendations (e.g. what to buy, staffing
breakdowns, which tables are occupied, which ingredients or dishes need restocking).
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
        avg_rating = round(float(agg[0]), 2) if agg and agg[0] else None
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
