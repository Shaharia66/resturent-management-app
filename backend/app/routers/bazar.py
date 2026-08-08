from typing import List

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


# ---------- Making Food Info (recipes) ----------

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

    # Replace the whole recipe in one go
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

