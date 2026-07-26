from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_admin

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("", response_model=List[schemas.EmployeeOut])
def list_employees(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    return db.query(models.Employee).order_by(models.Employee.name).all()


@router.get("/{employee_id}", response_model=schemas.EmployeeOut)
def get_employee(
    employee_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)
):
    emp = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.post("", response_model=schemas.EmployeeOut)
def create_employee(
    payload: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    emp = models.Employee(**payload.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@router.put("/{employee_id}", response_model=schemas.EmployeeOut)
def update_employee(
    employee_id: int,
    payload: schemas.EmployeeUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    emp = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(emp, field, value)
    db.commit()
    db.refresh(emp)
    return emp


@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)
):
    emp = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()
    return {"detail": "Employee deleted"}
