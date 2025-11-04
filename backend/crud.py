from sqlalchemy.orm import Session
from sqlalchemy import select
from . import models, schemas
from datetime import date

# Revenues
def create_revenue(db: Session, r: schemas.RevenueCreate):
    rev = models.Revenue(**r.model_dump())
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return rev

def list_revenues(db: Session, start: date | None = None, end: date | None = None):
    q = select(models.Revenue)
    if start:
        q = q.where(models.Revenue.date >= start)
    if end:
        q = q.where(models.Revenue.date <= end)
    return db.execute(q).scalars().all()

# Expenses
def create_expense(db: Session, e: schemas.ExpenseCreate):
    exp = models.Expense(**e.model_dump())
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp

def list_expenses(db: Session, start: date | None = None, end: date | None = None):
    q = select(models.Expense)
    if start:
        q = q.where(models.Expense.date >= start)
    if end:
        q = q.where(models.Expense.date <= end)
    return db.execute(q).scalars().all()
