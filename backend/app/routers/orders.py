from typing import List
from app.inventory import consume_ingredients_for_order

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, get_current_admin
from app.redis_client import redis_client
from app.routers.cart import _cart_key

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _serialize_order(order: models.Order) -> schemas.OrderOut:
    items = [
        schemas.OrderItemOut(
            id=oi.id,
            food_item_id=oi.food_item_id,
            name=oi.food_item.name if oi.food_item else "Unknown item",
            quantity=oi.quantity,
            price_at_order=oi.price_at_order,
        )
        for oi in order.items
    ]
    return schemas.OrderOut(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        total_amount=order.total_amount,
        delivery_address=order.delivery_address,
        phone=order.phone,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items,
    )


@router.post("/checkout", response_model=schemas.OrderOut)
def checkout(
    payload: schemas.CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cart_key = _cart_key(current_user.id)
    raw_cart = redis_client.hgetall(cart_key)
    if not raw_cart:
        raise HTTPException(status_code=400, detail="Your cart is empty")

    order = models.Order(
        user_id=current_user.id,
        status=models.OrderStatus.pending,
        delivery_address=payload.delivery_address,
        phone=payload.phone,
        notes=payload.notes,
        total_amount=0,
    )
    db.add(order)
    db.flush()  # get order.id before commit

    total = 0.0
    for food_item_id_str, quantity_str in raw_cart.items():
        food_item_id = int(food_item_id_str)
        quantity = int(quantity_str)
        item = db.query(models.FoodItem).filter(models.FoodItem.id == food_item_id).first()
        if not item:
            continue

        order_item = models.OrderItem(
            order_id=order.id,
            food_item_id=item.id,
            quantity=quantity,
            price_at_order=item.price,
        )
        db.add(order_item)
        total += item.price * quantity

        consume_ingredients_for_order(db, item, quantity)
        
    order.total_amount = round(total, 2)
    db.commit()
    db.refresh(order)

    redis_client.delete(cart_key)

    return _serialize_order(order)


@router.get("/my", response_model=List[schemas.OrderOut])
def my_orders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    orders = (
        db.query(models.Order)
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return [_serialize_order(o) for o in orders]


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(
    order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not allowed")
    return _serialize_order(order)


# ---------- Admin ----------

@router.get("", response_model=List[schemas.OrderOut])
def list_all_orders(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    orders = db.query(models.Order).order_by(models.Order.created_at.desc()).all()
    return [_serialize_order(o) for o in orders]


@router.put("/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(
    order_id: int,
    payload: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return _serialize_order(order)
