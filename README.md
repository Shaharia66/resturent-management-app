# Olive & Ember — Restaurant Management System

A full-stack restaurant management web app with:

- **Backend:** Python FastAPI, MySQL (via SQLAlchemy), Redis (cart + AI response caching), JWT authentication
- **Frontend:** React (Vite) + Tailwind CSS
- **AI:** Groq API — two AI assistants:
  - **Admin AI** — ask about employees and food inventory (what's low on stock, what to buy, staffing summary, etc.)
  - **Customer AI** — ask about menu items, prices, ratings, and what other customers are saying
- **Infrastructure:** Docker & Docker Compose (MySQL container + Redis container + backend + frontend)

---

## 1. Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed
- A free Groq API key from https://console.groq.com/keys (for the AI features)

---

## 2. Setup

### Step 1 — Add your Groq API key

Open `backend/.env` and set:

```
GROQ_API_KEY=your_groq_api_key_here
```

(The app works fine without it — you'll just get a friendly "AI not configured" message from the AI endpoints until you add a key.)

You can also change the default admin login and JWT secret in that same file:

```
JWT_SECRET_KEY=change_this_to_a_long_random_secret_string
DEFAULT_ADMIN_EMAIL=admin@restaurant.com
DEFAULT_ADMIN_PASSWORD=Admin@123
```

### Step 2 — Start everything with Docker Compose

From the project root:

```bash
docker compose up --build
```

This starts 4 containers:

| Service  | URL                     | Notes                                  |
|----------|-------------------------|-----------------------------------------|
| frontend | http://localhost:5173   | React app                               |
| backend  | http://localhost:8000   | FastAPI, docs at `/docs`                |
| mysql    | localhost:3306           | Data is persisted in a Docker volume    |
| redis    | localhost:6379           | Used for shopping cart + AI cache       |

On first boot, the backend automatically:
- Creates all database tables
- Seeds a default **admin account** and **sample menu items / employees**

### Step 3 — Log in

- **Admin:** `admin@restaurant.com` / `Admin@123` (change this in `backend/.env` before going live)
- **Customer:** click "Sign up" to create a new account

---

## 3. Project structure

```
restaurant-app/
├── backend/                  FastAPI application
│   ├── app/
│   │   ├── main.py           App entrypoint, router registration, DB init
│   │   ├── config.py         Settings (env vars)
│   │   ├── database.py       SQLAlchemy engine/session
│   │   ├── redis_client.py   Redis connection
│   │   ├── models.py         SQLAlchemy ORM models
│   │   ├── schemas.py        Pydantic request/response schemas
│   │   ├── security.py       Password hashing & JWT
│   │   ├── deps.py           Auth dependencies (current user / admin)
│   │   ├── groq_client.py    Groq AI API wrapper
│   │   ├── seed.py           Seeds default admin + sample data
│   │   └── routers/
│   │       ├── auth.py       Register / login / me
│   │       ├── food.py       Food items, categories, ratings, comments
│   │       ├── employees.py  Employee CRUD (admin only)
│   │       ├── cart.py       Redis-backed shopping cart
│   │       ├── orders.py     Checkout, order history, order status
│   │       └── ai.py         Admin AI + Customer AI endpoints
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env                  Environment variables (edit this!)
│
├── frontend/                 React application
│   └── src/
│       ├── api/client.js     Axios instance with JWT interceptor
│       ├── context/          Auth & Cart React contexts
│       ├── components/       Navbar, FoodCard, StarRating, ChatPanel, ...
│       └── pages/
│           ├── Home, Menu, FoodDetail, Cart, Checkout, MyOrders, CustomerAI
│           └── admin/        AdminDashboard, AdminFoodItems, AdminEmployees,
│                              AdminOrders, AdminAI
│
└── docker-compose.yml
```

---

## 4. Feature overview

### Customers
- Browse the menu by category or search
- View a dish's price, description, average star rating, and all comments
- Rate dishes (1–5 stars) and leave comments
- Add items to a cart (stored in Redis, persists across sessions for 3 days)
- Checkout with delivery address, phone, and notes
- Track order status (pending → confirmed → preparing → out for delivery → delivered)
- **Ask AI** — chat with an assistant that knows the current menu, prices, ratings and recent comments

### Admin
- Dashboard with revenue, order, and staffing stats, plus a low-stock alert list
- Full CRUD for food items, including stock quantity, unit, and reorder threshold
- Full CRUD for employees (position, department, salary, contact info, active status)
- View and update the status of every order placed
- **Ask AI** — chat with an assistant that knows all employee and inventory data, and can answer
  things like "which items should I restock?" or "how many people work in the kitchen?"

---

## 5. Running without Docker (optional, for local development)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# make sure MySQL and Redis are running locally and .env points to them
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 6. Notes

- The cart is stored in **Redis** as a hash (`cart:{user_id}` → `{food_item_id: quantity}`), which is
  a natural fit for ephemeral, high-read/write session data. AI responses are also cached briefly in
  Redis to avoid duplicate calls for repeated questions.
- Stock quantities automatically decrease when an order is placed.
- JWT tokens are valid for 24 hours by default (`ACCESS_TOKEN_EXPIRE_MINUTES` in `backend/.env`).
- This is a demo/learning project — before deploying publicly, change all default secrets and
  passwords in `backend/.env` and `.env`.
