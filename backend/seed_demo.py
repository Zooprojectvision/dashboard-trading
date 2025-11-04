from datetime import date
from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from . import schemas, crud

def seed():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    demo_revs = [
        schemas.RevenueCreate(date=date(2025, 10, 10), source="FTMO", type=schemas.RevenueType.PROP_PAYOUT, amount=1500.0, note="Payout FTMO"),
        schemas.RevenueCreate(date=date(2025, 10, 25), source="MFF", type=schemas.RevenueType.PROP_PAYOUT, amount=800.0, note="Payout MFF"),
    ]

    demo_exps = [
        schemas.ExpenseCreate(date=date(2025, 8, 1), category=schemas.ExpenseCategory.CHALLENGE, vendor="FTMO", amount=155.0, note="Challenge 10k"),
        schemas.ExpenseCreate(date=date(2025, 8, 2), category=schemas.ExpenseCategory.TOOLS, vendor="ChartIQ", amount=29.0, note="Licence mensuelle"),
        schemas.ExpenseCreate(date=date(2025, 9, 15), category=schemas.ExpenseCategory.VPS, vendor="Contabo", amount=19.0, note="VPS"),
        schemas.ExpenseCreate(date=date(2025, 10, 5), category=schemas.ExpenseCategory.COMMISSION, vendor="Darwinex", amount=75.0, note="Commissions trading"),
    ]

    for r in demo_revs:
        crud.create_revenue(db, r)
    for e in demo_exps:
        crud.create_expense(db, e)

    db.close()

if __name__ == "__main__":
    seed()
