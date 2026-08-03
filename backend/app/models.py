import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime,
    ForeignKey, Enum, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    customer = "customer"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    preparing = "preparing"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    cancelled = "cancelled"

class TableOrderStatus(str, enum.Enum):
    received = "received"
    delivered = "delivered"
    bill_given = "bill_given"
    bill_received = "bill_received"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.customer, nullable=False)
    phone = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")
    ratings = relationship("Rating", back_populates="user")
    comments = relationship("Comment", back_populates="user")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    position = Column(String(100), nullable=False)
    department = Column(String(100), nullable=True)
    salary = Column(Float, default=0)
    phone = Column(String(30), nullable=True)
    email = Column(String(150), nullable=True)
    hire_date = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class FoodCategory(Base):
    __tablename__ = "food_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

    items = relationship("FoodItem", back_populates="category")


class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)
    category_id = Column(Integer, ForeignKey("food_categories.id"), nullable=True)

    # Inventory / stock fields
    stock_quantity = Column(Float, default=0)   # current quantity on hand
    unit = Column(String(30), default="pcs")     # kg, pcs, liters etc
    reorder_threshold = Column(Float, default=10)  # below this -> needs restock
    is_available = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("FoodCategory", back_populates="items")
    ratings = relationship("Rating", back_populates="food_item", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="food_item", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="food_item")

    @property
    def needs_restock(self) -> bool:
        return self.stock_quantity <= self.reorder_threshold


class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (UniqueConstraint("user_id", "food_item_id", name="uq_user_food_rating"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    food_item_id = Column(Integer, ForeignKey("food_items.id"), nullable=False)
    stars = Column(Integer, nullable=False)  # 1-5
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="ratings")
    food_item = relationship("FoodItem", back_populates="ratings")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    food_item_id = Column(Integer, ForeignKey("food_items.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="comments")
    food_item = relationship("FoodItem", back_populates="comments")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending, nullable=False)
    total_amount = Column(Float, default=0)
    delivery_address = Column(String(500), nullable=True)
    phone = Column(String(30), nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    food_item_id = Column(Integer, ForeignKey("food_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    price_at_order = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    food_item = relationship("FoodItem", back_populates="order_items")

class DiningTable(Base):
    __tablename__ = "dining_tables"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    capacity = Column(Integer, default=4)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("TableOrder", back_populates="table")


class TableOrder(Base):
    __tablename__ = "table_orders"

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("dining_tables.id"), nullable=False)
    status = Column(Enum(TableOrderStatus), default=TableOrderStatus.received, nullable=False)
    total_amount = Column(Float, default=0)
    is_closed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    table = relationship("DiningTable", back_populates="orders")
    items = relationship("TableOrderItem", back_populates="table_order", cascade="all, delete-orphan")


class TableOrderItem(Base):
    __tablename__ = "table_order_items"

    id = Column(Integer, primary_key=True, index=True)
    table_order_id = Column(Integer, ForeignKey("table_orders.id"), nullable=False)
    food_item_id = Column(Integer, ForeignKey("food_items.id"), nullable=False)
    quantity = Column(Integer, default=1)
    price_at_order = Column(Float, nullable=False)
    notes = Column(String(300), nullable=True)

    table_order = relationship("TableOrder", back_populates="items")
    food_item = relationship("FoodItem")
    