from typing import List, Optional
import math

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, get_current_admin
from app.redis_client import redis_client

router = APIRouter(prefix="/api", tags=["food"])


def _serialize_food_item(db: Session, item: models.FoodItem) -> schemas.FoodItemOut:
    agg = (
        db.query(func.avg(models.Rating.stars), func.count(models.Rating.id))
        .filter(models.Rating.food_item_id == item.id)
        .first()
    )
    avg_rating = round(float(agg[0]), 2) if agg and agg[0] else 0.0
    count = agg[1] if agg else 0

    out = schemas.FoodItemOut.model_validate(item)
    out.average_rating = avg_rating
    out.rating_count = count

    recipe_rows = (
        db.query(models.RecipeIngredient)
        .filter(models.RecipeIngredient.food_item_id == item.id)
        .all()
    )

    if recipe_rows:
        # Stock is computed live from the Bazar List: how many units can currently be made
        makeable_counts = []
        any_ingredient_low = False
        for row in recipe_rows:
            bazar_item = row.bazar_item
            if bazar_item and row.quantity_per_unit > 0:
                makeable_counts.append(math.floor(bazar_item.quantity / row.quantity_per_unit))
                if bazar_item.needs_restock:
                    any_ingredient_low = True
        computed_stock = min(makeable_counts) if makeable_counts else 0
        out.stock_quantity = computed_stock
        out.needs_restock = any_ingredient_low or computed_stock <= item.reorder_threshold
        out.has_recipe = True
    else:
        out.needs_restock = item.needs_restock
        out.has_recipe = False

    return out


# ---------- Categories ----------

@router.get("/categories", response_model=List[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(models.FoodCategory).order_by(models.FoodCategory.name).all()


@router.post("/categories", response_model=schemas.CategoryOut)
def create_category(
    name: str, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)
):
    existing = db.query(models.FoodCategory).filter(models.FoodCategory.name == name).first()
    if existing:
        return existing
    cat = models.FoodCategory(name=name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


# ---------- Food Items ----------

@router.get("/food-items", response_model=List[schemas.FoodItemOut])
def list_food_items(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    only_available: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(models.FoodItem)
    if category_id:
        query = query.filter(models.FoodItem.category_id == category_id)
    if search:
        query = query.filter(models.FoodItem.name.ilike(f"%{search}%"))
    if only_available:
        query = query.filter(models.FoodItem.is_available == True)  # noqa: E712
    items = query.order_by(models.FoodItem.name).all()
    return [_serialize_food_item(db, i) for i in items]


@router.get("/food-items/{item_id}", response_model=schemas.FoodItemOut)
def get_food_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.FoodItem).filter(models.FoodItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    return _serialize_food_item(db, item)


@router.post("/food-items", response_model=schemas.FoodItemOut)
def create_food_item(
    payload: schemas.FoodItemCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    item = models.FoodItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize_food_item(db, item)


@router.put("/food-items/{item_id}", response_model=schemas.FoodItemOut)
def update_food_item(
    item_id: int,
    payload: schemas.FoodItemUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    item = db.query(models.FoodItem).filter(models.FoodItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return _serialize_food_item(db, item)


@router.delete("/food-items/{item_id}")
def delete_food_item(
    item_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    item = db.query(models.FoodItem).filter(models.FoodItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    db.delete(item)
    db.commit()
    return {"detail": "Food item deleted"}


# ---------- Ratings ----------

@router.get("/food-items/{item_id}/ratings", response_model=List[schemas.RatingOut])
def list_ratings(item_id: int, db: Session = Depends(get_db)):
    ratings = (
        db.query(models.Rating).filter(models.Rating.food_item_id == item_id).all()
    )
    result = []
    for r in ratings:
        result.append(
            schemas.RatingOut(
                id=r.id,
                user_id=r.user_id,
                user_name=r.user.name if r.user else None,
                food_item_id=r.food_item_id,
                stars=r.stars,
                created_at=r.created_at,
            )
        )
    return result


@router.post("/food-items/{item_id}/ratings", response_model=schemas.RatingOut)
def rate_food_item(
    item_id: int,
    payload: schemas.RatingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = db.query(models.FoodItem).filter(models.FoodItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")

    existing = (
        db.query(models.Rating)
        .filter(
            models.Rating.food_item_id == item_id,
            models.Rating.user_id == current_user.id,
        )
        .first()
    )
    if existing:
        existing.stars = payload.stars
        db.commit()
        db.refresh(existing)
        r = existing
    else:
        r = models.Rating(food_item_id=item_id, user_id=current_user.id, stars=payload.stars)
        db.add(r)
        db.commit()
        db.refresh(r)

    return schemas.RatingOut(
        id=r.id,
        user_id=r.user_id,
        user_name=current_user.name,
        food_item_id=r.food_item_id,
        stars=r.stars,
        created_at=r.created_at,
    )


# ---------- Comments ----------

@router.get("/food-items/{item_id}/comments", response_model=List[schemas.CommentOut])
def list_comments(item_id: int, db: Session = Depends(get_db)):
    comments = (
        db.query(models.Comment)
        .filter(models.Comment.food_item_id == item_id)
        .order_by(models.Comment.created_at.desc())
        .all()
    )
    return [
        schemas.CommentOut(
            id=c.id,
            user_id=c.user_id,
            user_name=c.user.name if c.user else None,
            food_item_id=c.food_item_id,
            content=c.content,
            created_at=c.created_at,
        )
        for c in comments
    ]


@router.post("/food-items/{item_id}/comments", response_model=schemas.CommentOut)
def add_comment(
    item_id: int,
    payload: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = db.query(models.FoodItem).filter(models.FoodItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")

    comment = models.Comment(
        food_item_id=item_id, user_id=current_user.id, content=payload.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Invalidate any cached "popular items" key in redis (example of cache usage)
    redis_client.delete("popular_food_items")

    return schemas.CommentOut(
        id=comment.id,
        user_id=comment.user_id,
        user_name=current_user.name,
        food_item_id=comment.food_item_id,
        content=comment.content,
        created_at=comment.created_at,
    )
