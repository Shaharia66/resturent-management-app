from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field

from app.models import UserRole, OrderStatus, TableOrderStatus


# ---------- Auth / User ----------

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Employee ----------

class EmployeeBase(BaseModel):
    name: str
    position: str
    department: Optional[str] = None
    salary: float = 0
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    salary: Optional[float] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeOut(EmployeeBase):
    id: int
    hire_date: datetime

    class Config:
        from_attributes = True


# ---------- Food Category ----------

class CategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# ---------- Food Item ----------

class FoodItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    stock_quantity: float = 0
    unit: str = "pcs"
    reorder_threshold: float = 10
    is_available: bool = True


class FoodItemCreate(FoodItemBase):
    pass


class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    stock_quantity: Optional[float] = None
    unit: Optional[str] = None
    reorder_threshold: Optional[float] = None
    is_available: Optional[bool] = None


class FoodItemOut(FoodItemBase):
    id: int
    created_at: datetime
    needs_restock: bool
    average_rating: float = 0
    rating_count: int = 0

    class Config:
        from_attributes = True


# ---------- Rating ----------

class RatingCreate(BaseModel):
    stars: int = Field(ge=1, le=5)


class RatingOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    food_item_id: int
    stars: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Comment ----------

class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class CommentOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    food_item_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Cart (stored in Redis) ----------

class CartItemIn(BaseModel):
    food_item_id: int
    quantity: int = Field(ge=1, default=1)


class CartItemOut(BaseModel):
    food_item_id: int
    name: str
    price: float
    quantity: int
    image_url: Optional[str] = None
    subtotal: float


class CartOut(BaseModel):
    items: List[CartItemOut]
    total: float


# ---------- Orders ----------

class CheckoutRequest(BaseModel):
    delivery_address: str
    phone: str
    notes: Optional[str] = None


class OrderItemOut(BaseModel):
    id: int
    food_item_id: int
    name: str
    quantity: int
    price_at_order: float

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    user_id: int
    status: OrderStatus
    total_amount: float
    delivery_address: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# ---------- AI ----------

class AIQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    food_item_id: Optional[int] = None


class AIAnswer(BaseModel):
    answer: str

# ---------- Dine-in tables ----------

class DiningTableCreate(BaseModel):
    name: str
    capacity: int = 4


class DiningTableUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None


class DiningTableOut(BaseModel):
    id: int
    name: str
    capacity: int
    is_active: bool
    is_occupied: bool = False
    active_order_id: Optional[int] = None
    active_order_status: Optional[TableOrderStatus] = None

    class Config:
        from_attributes = True


class TableOrderItemIn(BaseModel):
    food_item_id: int
    quantity: int = Field(ge=1, default=1)
    notes: Optional[str] = None


class TableOrderCreate(BaseModel):
    table_id: int
    items: List[TableOrderItemIn]


class TableOrderItemOut(BaseModel):
    id: int
    food_item_id: int
    name: str
    quantity: int
    price_at_order: float
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class TableOrderOut(BaseModel):
    id: int
    table_id: int
    table_name: Optional[str] = None
    status: TableOrderStatus
    total_amount: float
    is_closed: bool
    created_at: datetime
    updated_at: datetime
    items: List[TableOrderItemOut] = []

    class Config:
        from_attributes = True


class TableOrderStatusUpdate(BaseModel):
    status: TableOrderStatus


class TableOrderAddItem(BaseModel):
    food_item_id: int
    quantity: int = Field(ge=1, default=1)
    notes: Optional[str] = None

