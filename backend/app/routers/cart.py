from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.redis_client import redis_client

router = APIRouter(prefix="/api/cart", tags=["cart"])


def _cart_key(user_id: int) -> str:
    return f"cart:{user_id}"


def _build_cart_out(db: Session, user_id: int) -> schemas.CartOut:
    raw = redis_client.hgetall(_cart_key(user_id))
    items = []
    total = 0.0
    for food_item_id_str, quantity_str in raw.items():
        food_item_id = int(food_item_id_str)
        quantity = int(quantity_str)
        item = db.query(models.FoodItem).filter(models.FoodItem.id == food_item_id).first()
        if not item:
            continue
        subtotal = round(item.price * quantity, 2)
        total += subtotal
        items.append(
            schemas.CartItemOut(
                food_item_id=item.id,
                name=item.name,
                price=item.price,
                quantity=quantity,
                image_url=item.image_url,
                subtotal=subtotal,
            )
        )
    return schemas.CartOut(items=items, total=round(total, 2))


@router.get("", response_model=schemas.CartOut)
def get_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return _build_cart_out(db, current_user.id)


@router.post("/add", response_model=schemas.CartOut)
def add_to_cart(
    payload: schemas.CartItemIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = db.query(models.FoodItem).filter(models.FoodItem.id == payload.food_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    if not item.is_available:
        raise HTTPException(status_code=400, detail="This item is currently unavailable")

    key = _cart_key(current_user.id)
    redis_client.hincrby(key, str(payload.food_item_id), payload.quantity)
    redis_client.expire(key, 60 * 60 * 24 * 3)  # cart expires after 3 days of inactivity
    return _build_cart_out(db, current_user.id)


@router.put("/update", response_model=schemas.CartOut)
def update_cart_item(
    payload: schemas.CartItemIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    key = _cart_key(current_user.id)
    if payload.quantity <= 0:
        redis_client.hdel(key, str(payload.food_item_id))
    else:
        redis_client.hset(key, str(payload.food_item_id), payload.quantity)
    return _build_cart_out(db, current_user.id)


@router.delete("/remove/{food_item_id}", response_model=schemas.CartOut)
def remove_from_cart(
    food_item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    redis_client.hdel(_cart_key(current_user.id), str(food_item_id))
    return _build_cart_out(db, current_user.id)


@router.delete("/clear")
def clear_cart(current_user: models.User = Depends(get_current_user)):
    redis_client.delete(_cart_key(current_user.id))
    return {"detail": "Cart cleared"}
