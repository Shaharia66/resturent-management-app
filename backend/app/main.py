from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, wait_for_db, SessionLocal
from app.seed import run_seed
from app.routers import auth, food, employees, cart, orders, ai, tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    wait_for_db()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Restaurant Management API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(food.router)
app.include_router(employees.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(ai.router)
app.include_router(tables.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
