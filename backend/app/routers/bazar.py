from typing import List, Optional
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["inventory"])


def _serialize_bazar_item(item: models.BazarItem) -> schemas.BazarItemOut:
    return schemas.BazarItemOut(
        id=item.id,
        name=item.name,
        quantity=item.quantity,
        unit=item.unit,
        reorder_threshold=item.reorder_threshold,
        needs_restock=item.needs_restock,
        created_at=item.created_at,
    )


def _serialize_recipe(db: Session, food_item: models.FoodItem) -> schemas.FoodRecipeOut:
    rows = (
        db.query(models.RecipeIngredient)
        .filter(models.RecipeIngredient.food_item_id == food_item.id)
        .all()
    )
    ingredients = [
        schemas.RecipeIngredientOut(
            bazar_item_id=row.bazar_item_id,
            bazar_item_name=row.bazar_item.name if row.bazar_item else "Unknown",
            unit=row.bazar_item.unit if row.bazar_item else "",
            quantity_per_unit=row.quantity_per_unit,
            bazar_stock=row.bazar_item.quantity if row.bazar_item else 0,
            needs_restock=row.bazar_item.needs_restock if row.bazar_item else False,
        )
        for row in rows
    ]
    return schemas.FoodRecipeOut(
        food_item_id=food_item.id, food_item_name=food_item.name, ingredients=ingredients
    )


def _serialize_today_entry(entry: models.TodayBazarEntry) -> schemas.TodayBazarEntryOut:
    return schemas.TodayBazarEntryOut(
        id=entry.id,
        bazar_item_id=entry.bazar_item_id,
        bazar_item_name=entry.bazar_item.name if entry.bazar_item else "Unknown",
        unit=entry.bazar_item.unit if entry.bazar_item else "",
        quantity_purchased=entry.quantity_purchased,
        purchase_date=entry.purchase_date,
        notes=entry.notes,
        created_at=entry.created_at,
    )


# ---------- Bazar List (raw ingredients) ----------

@router.get("/bazar-items", response_model=List[schemas.BazarItemOut])
def list_bazar_items(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    items = db.query(models.BazarItem).order_by(models.BazarItem.name).all()
    return [_serialize_bazar_item(i) for i in items]


@router.post("/bazar-items", response_model=schemas.BazarItemOut)
def create_bazar_item(
    payload: schemas.BazarItemCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    existing = db.query(models.BazarItem).filter(models.BazarItem.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A bazar item with this name already exists")
    item = models.BazarItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize_bazar_item(item)


@router.put("/bazar-items/{item_id}", response_model=schemas.BazarItemOut)
def update_bazar_item(
    item_id: int,
    payload: schemas.BazarItemUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    item = db.query(models.BazarItem).filter(models.BazarItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Bazar item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return _serialize_bazar_item(item)


@router.delete("/bazar-items/{item_id}")
def delete_bazar_item(
    item_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)
):
    item = db.query(models.BazarItem).filter(models.BazarItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Bazar item not found")
    used = (
        db.query(models.RecipeIngredient)
        .filter(models.RecipeIngredient.bazar_item_id == item_id)
        .first()
    )
    if used:
        raise HTTPException(
            status_code=400,
            detail="This ingredient is used in one or more recipes. Remove it from those recipes first.",
        )
    db.delete(item)
    db.commit()
    return {"detail": "Bazar item deleted"}


# ---------- Food Recipe (ingredients needed per dish) ----------

@router.get("/food-items/{food_item_id}/recipe", response_model=schemas.FoodRecipeOut)
def get_food_recipe(
    food_item_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)
):
    food_item = db.query(models.FoodItem).filter(models.FoodItem.id == food_item_id).first()
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found")
    return _serialize_recipe(db, food_item)


@router.put("/food-items/{food_item_id}/recipe", response_model=schemas.FoodRecipeOut)
def update_food_recipe(
    food_item_id: int,
    payload: schemas.FoodRecipeUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    food_item = db.query(models.FoodItem).filter(models.FoodItem.id == food_item_id).first()
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found")

    db.query(models.RecipeIngredient).filter(
        models.RecipeIngredient.food_item_id == food_item_id
    ).delete()

    for ing in payload.ingredients:
        bazar_item = db.query(models.BazarItem).filter(models.BazarItem.id == ing.bazar_item_id).first()
        if not bazar_item:
            continue
        db.add(
            models.RecipeIngredient(
                food_item_id=food_item_id,
                bazar_item_id=ing.bazar_item_id,
                quantity_per_unit=ing.quantity_per_unit,
            )
        )

    db.commit()
    db.refresh(food_item)
    return _serialize_recipe(db, food_item)


@router.delete("/food-items/{food_item_id}/recipe")
def clear_food_recipe(
    food_item_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)
):
    food_item = db.query(models.FoodItem).filter(models.FoodItem.id == food_item_id).first()
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found")
    db.query(models.RecipeIngredient).filter(
        models.RecipeIngredient.food_item_id == food_item_id
    ).delete()
    db.commit()
    return {"detail": "Recipe cleared — this dish is back to manual stock tracking"}


# ---------- Today's Bazar (shopping log -> auto updates Bazar List) ----------

@router.get("/today-bazar", response_model=List[schemas.TodayBazarEntryOut])
def list_today_bazar_entries(
    entry_date: Optional[date_type] = None,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    query = db.query(models.TodayBazarEntry)
    if entry_date:
        query = query.filter(models.TodayBazarEntry.purchase_date == entry_date)
    entries = query.order_by(models.TodayBazarEntry.created_at.desc()).all()
    return [_serialize_today_entry(e) for e in entries]


@router.post("/today-bazar", response_model=schemas.TodayBazarEntryOut)
def add_today_bazar_entry(
    payload: schemas.TodayBazarEntryCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    bazar_item = None
    if payload.bazar_item_id:
        bazar_item = (
            db.query(models.BazarItem).filter(models.BazarItem.id == payload.bazar_item_id).first()
        )
        if not bazar_item:
            raise HTTPException(status_code=404, detail="Bazar item not found")
    elif payload.new_item_name:
        existing = (
            db.query(models.BazarItem).filter(models.BazarItem.name == payload.new_item_name).first()
        )
        if existing:
            bazar_item = existing
        else:
            bazar_item = models.BazarItem(
                name=payload.new_item_name,
                quantity=0,
                unit=payload.new_item_unit,
                reorder_threshold=payload.new_item_reorder_threshold,
            )
            db.add(bazar_item)
            db.flush()
    else:
        raise HTTPException(
            status_code=400,
            detail="Select an existing ingredient or provide a new ingredient name",
        )

    # Auto add / update the Bazar List quantity with today's purchase
    bazar_item.quantity = bazar_item.quantity + payload.quantity_purchased

    entry = models.TodayBazarEntry(
        bazar_item_id=bazar_item.id,
        quantity_purchased=payload.quantity_purchased,
        purchase_date=payload.purchase_date or date_type.today(),
        notes=payload.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _serialize_today_entry(entry)


@router.delete("/today-bazar/{entry_id}")
def delete_today_bazar_entry(
    entry_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)
):
    entry = db.query(models.TodayBazarEntry).filter(models.TodayBazarEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry.bazar_item:
        entry.bazar_item.quantity = max(0, entry.bazar_item.quantity - entry.quantity_purchased)
    db.delete(entry)
    db.commit()
    return {"detail": "Entry removed and quantity reversed"}