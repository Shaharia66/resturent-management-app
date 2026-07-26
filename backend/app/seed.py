from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.security import hash_password


def run_seed(db: Session):
    # Default admin
    admin = db.query(models.User).filter(models.User.email == settings.DEFAULT_ADMIN_EMAIL).first()
    if not admin:
        admin = models.User(
            name=settings.DEFAULT_ADMIN_NAME,
            email=settings.DEFAULT_ADMIN_EMAIL,
            hashed_password=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
            role=models.UserRole.admin,
        )
        db.add(admin)

    # Categories
    category_names = ["Appetizers", "Main Course", "Desserts", "Beverages"]
    categories = {}
    for name in category_names:
        cat = db.query(models.FoodCategory).filter(models.FoodCategory.name == name).first()
        if not cat:
            cat = models.FoodCategory(name=name)
            db.add(cat)
            db.flush()
        categories[name] = cat

    db.commit()

    # Sample food items (only seed if table empty)
    if db.query(models.FoodItem).count() == 0:
        sample_items = [
            dict(
                name="Chicken Momo",
                description="Steamed dumplings filled with spiced minced chicken, served with tomato chutney.",
                price=6.50,
                category_id=categories["Appetizers"].id,
                stock_quantity=40,
                unit="plates",
                reorder_threshold=10,
                image_url="https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600",
            ),
            dict(
                name="Vegetable Spring Rolls",
                description="Crispy rolls stuffed with fresh vegetables, served with sweet chili sauce.",
                price=5.00,
                category_id=categories["Appetizers"].id,
                stock_quantity=8,
                unit="plates",
                reorder_threshold=10,
                image_url="https://images.unsplash.com/photo-1548811256-1627d99e3771?w=600",
            ),
            dict(
                name="Grilled Chicken Steak",
                description="Tender grilled chicken breast with herb butter, served with mashed potatoes.",
                price=12.90,
                category_id=categories["Main Course"].id,
                stock_quantity=25,
                unit="plates",
                reorder_threshold=8,
                image_url="https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600",
            ),
            dict(
                name="Beef Burger Deluxe",
                description="Juicy beef patty, cheddar cheese, lettuce and house sauce in a brioche bun.",
                price=9.75,
                category_id=categories["Main Course"].id,
                stock_quantity=5,
                unit="plates",
                reorder_threshold=10,
                image_url="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
            ),
            dict(
                name="Margherita Pizza",
                description="Classic pizza with fresh mozzarella, tomato sauce and basil.",
                price=10.50,
                category_id=categories["Main Course"].id,
                stock_quantity=18,
                unit="pizzas",
                reorder_threshold=6,
                image_url="https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600",
            ),
            dict(
                name="Chocolate Lava Cake",
                description="Warm chocolate cake with a molten center, served with vanilla ice cream.",
                price=6.00,
                category_id=categories["Desserts"].id,
                stock_quantity=3,
                unit="pieces",
                reorder_threshold=8,
                image_url="https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600",
            ),
            dict(
                name="New York Cheesecake",
                description="Creamy classic cheesecake with a graham cracker crust.",
                price=5.50,
                category_id=categories["Desserts"].id,
                stock_quantity=20,
                unit="slices",
                reorder_threshold=6,
                image_url="https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600",
            ),
            dict(
                name="Fresh Lemonade",
                description="Freshly squeezed lemonade with mint leaves.",
                price=3.00,
                category_id=categories["Beverages"].id,
                stock_quantity=50,
                unit="glasses",
                reorder_threshold=15,
                image_url="https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600",
            ),
            dict(
                name="Cappuccino",
                description="Rich espresso with steamed milk foam.",
                price=3.75,
                category_id=categories["Beverages"].id,
                stock_quantity=6,
                unit="cups",
                reorder_threshold=10,
                image_url="https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600",
            ),
        ]
        for data in sample_items:
            db.add(models.FoodItem(**data))

    # Sample employees
    if db.query(models.Employee).count() == 0:
        sample_employees = [
            dict(name="Maria Gonzalez", position="Head Chef", department="Kitchen", salary=3800, phone="555-0101", email="maria@restaurant.com"),
            dict(name="James Lee", position="Sous Chef", department="Kitchen", salary=2900, phone="555-0102", email="james@restaurant.com"),
            dict(name="Aisha Rahman", position="Waiter", department="Service", salary=1800, phone="555-0103", email="aisha@restaurant.com"),
            dict(name="Tom Becker", position="Waiter", department="Service", salary=1750, phone="555-0104", email="tom@restaurant.com"),
            dict(name="Priya Nair", position="Cashier", department="Front Desk", salary=1900, phone="555-0105", email="priya@restaurant.com"),
            dict(name="Carlos Mendes", position="Delivery Rider", department="Logistics", salary=1600, phone="555-0106", email="carlos@restaurant.com"),
        ]
        for data in sample_employees:
            db.add(models.Employee(**data))

    db.commit()
