from sqlalchemy.orm import Session

from app import models


def consume_ingredients_for_order(db: Session, food_item: models.FoodItem, quantity: int) -> None:
    """Deduct raw ingredients from the Bazar List according to the food item's recipe.

    If the food item has no recipe defined yet, falls back to decrementing the food
    item's own manual stock_quantity field (legacy behavior).
    """
    recipe_rows = (
        db.query(models.RecipeIngredient)
        .filter(models.RecipeIngredient.food_item_id == food_item.id)
        .all()
    )

    if recipe_rows:
        for row in recipe_rows:
            bazar_item = row.bazar_item
            if bazar_item:
                consumed = row.quantity_per_unit * quantity
                bazar_item.quantity = max(0, bazar_item.quantity - consumed)
    else:
        food_item.stock_quantity = max(0, food_item.stock_quantity - quantity)