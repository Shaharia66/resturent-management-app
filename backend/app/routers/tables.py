from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_admin
from app.inventory import consume_ingredients_for_order

router = APIRouter(prefix="/api/admin", tags=["dine-in"])

# Forward-only status progression for a table order
STATUS_ORDER = [
    models.TableOrderStatus.received,
    models.TableOrderStatus.delivered,
    models.TableOrderStatus.bill_given,
    models.TableOrderStatus.bill_received,
]


def _serialize_table(db: Session, table: models.DiningTable) -> schemas.DiningTableOut:
    active_order = (
        db.query(models.TableOrder)
        .filter(models.TableOrder.table_id == table.id, models.TableOrder.is_closed == False)  # noqa: E712
        .order_by(models.TableOrder.created_at.desc())
        .first()
    )
    return schemas.DiningTableOut(
        id=table.id,
        name=table.name,
        capacity=table.capacity,
        is_active=table.is_active,
        is_occupied=active_order is not None,
        active_order_id=active_order.id if active_order else None,
        active_order_status=active_order.status if active_order else None,
    )


def _serialize_table_order(order: models.TableOrder) -> schemas.TableOrderOut:
    items = [
        schemas.TableOrderItemOut(
            id=oi.id,
            food_item_id=oi.food_item_id,
            name=oi.food_item.name if oi.food_item else "Unknown item",
            quantity=oi.quantity,
            price_at_order=oi.price_at_order,
            notes=oi.notes,
        )
        for oi in order.items
    ]
    return schemas.TableOrderOut(
        id=order.id,
        table_id=order.table_id,
        table_name=order.table.name if order.table else None,
        status=order.status,
        total_amount=order.total_amount,
        is_closed=order.is_closed,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items,
    )


# ---------- Table management (Settings page) ----------

@router.get("/tables", response_model=List[schemas.DiningTableOut])
def list_tables(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    tables = db.query(models.DiningTable).order_by(models.DiningTable.name).all()
    return [_serialize_table(db, t) for t in tables]


@router.post("/tables", response_model=schemas.DiningTableOut)
def create_table(
    payload: schemas.DiningTableCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    existing = db.query(models.DiningTable).filter(models.DiningTable.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A table with this name already exists")
    table = models.DiningTable(name=payload.name, capacity=payload.capacity)
    db.add(table)
    db.commit()
    db.refresh(table)
    return _serialize_table(db, table)


@router.put("/tables/{table_id}", response_model=schemas.DiningTableOut)
def update_table(
    table_id: int,
    payload: schemas.DiningTableUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    table = db.query(models.DiningTable).filter(models.DiningTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(table, field, value)
    db.commit()
    db.refresh(table)
    return _serialize_table(db, table)


@router.delete("/tables/{table_id}")
def delete_table(
    table_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)
):
    table = db.query(models.DiningTable).filter(models.DiningTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    active_order = (
        db.query(models.TableOrder)
        .filter(models.TableOrder.table_id == table.id, models.TableOrder.is_closed == False)  # noqa: E712
        .first()
    )
    if active_order:
        raise HTTPException(status_code=400, detail="Cannot delete a table with an active order")
    db.delete(table)
    db.commit()
    return {"detail": "Table deleted"}


# ---------- Table orders (dine-in floor operations) ----------

@router.get("/table-orders", response_model=List[schemas.TableOrderOut])
def list_table_orders(
    active_only: bool = True,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    query = db.query(models.TableOrder)
    if active_only:
        query = query.filter(models.TableOrder.is_closed == False)  # noqa: E712
    orders = query.order_by(models.TableOrder.created_at.desc()).all()
    return [_serialize_table_order(o) for o in orders]


@router.get("/table-orders/{order_id}", response_model=schemas.TableOrderOut)
def get_table_order(
    order_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)
):
    order = db.query(models.TableOrder).filter(models.TableOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _serialize_table_order(order)


@router.post("/table-orders", response_model=schemas.TableOrderOut)
def create_table_order(
    payload: schemas.TableOrderCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    table = db.query(models.DiningTable).filter(models.DiningTable.id == payload.table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    if not table.is_active:
        raise HTTPException(status_code=400, detail="This table is not active")

    existing_active = (
        db.query(models.TableOrder)
        .filter(models.TableOrder.table_id == table.id, models.TableOrder.is_closed == False)  # noqa: E712
        .first()
    )
    if existing_active:
        raise HTTPException(status_code=400, detail="This table already has an active order")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Order must include at least one item")

    order = models.TableOrder(table_id=table.id, status=models.TableOrderStatus.received, total_amount=0)
    db.add(order)
    db.flush()  # get order.id before commit

    total = 0.0
    for item_in in payload.items:
        food_item = db.query(models.FoodItem).filter(models.FoodItem.id == item_in.food_item_id).first()
        if not food_item:
            continue
        order_item = models.TableOrderItem(
            table_order_id=order.id,
            food_item_id=food_item.id,
            quantity=item_in.quantity,
            price_at_order=food_item.price,
            notes=item_in.notes,
        )
        db.add(order_item)
        total += food_item.price * item_in.quantity
        consume_ingredients_for_order(db, food_item, item_in.quantity)

    order.total_amount = round(total, 2)
    db.commit()
    db.refresh(order)
    return _serialize_table_order(order)


@router.put("/table-orders/{order_id}/add-item", response_model=schemas.TableOrderOut)
def add_item_to_table_order(
    order_id: int,
    payload: schemas.TableOrderAddItem,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    order = db.query(models.TableOrder).filter(models.TableOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.is_closed:
        raise HTTPException(status_code=400, detail="This order is already closed")

    food_item = db.query(models.FoodItem).filter(models.FoodItem.id == payload.food_item_id).first()
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found")

    order_item = models.TableOrderItem(
        table_order_id=order.id,
        food_item_id=food_item.id,
        quantity=payload.quantity,
        price_at_order=food_item.price,
        notes=payload.notes,
    )
    db.add(order_item)
    consume_ingredients_for_order(db, food_item, payload.quantity)
    order.total_amount = round(order.total_amount + food_item.price * payload.quantity, 2)
    db.commit()
    db.refresh(order)
    return _serialize_table_order(order)


@router.put("/table-orders/{order_id}/status", response_model=schemas.TableOrderOut)
def update_table_order_status(
    order_id: int,
    payload: schemas.TableOrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    order = db.query(models.TableOrder).filter(models.TableOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.is_closed:
        raise HTTPException(status_code=400, detail="This order is already closed")

    current_idx = STATUS_ORDER.index(order.status)
    new_idx = STATUS_ORDER.index(payload.status)
    if new_idx != current_idx + 1:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move from '{order.status.value}' to '{payload.status.value}' directly",
        )

    order.status = payload.status
    if payload.status == models.TableOrderStatus.bill_received:
        order.is_closed = True
        order.closed_at = datetime.utcnow()

    db.commit()
    db.refresh(order)
    return _serialize_table_order(order)
