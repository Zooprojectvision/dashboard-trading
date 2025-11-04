from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from .database import Base, engine, get_db
from . import schemas, crud
from .services.accounting import summarize
from .services import darwinex_api as dx

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ZooProjectVision API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/revenues", response_model=schemas.Revenue)
async def add_revenue(payload: schemas.RevenueCreate, db: Session = Depends(get_db)):
    return crud.create_revenue(db, payload)

@app.get("/revenues", response_model=list[schemas.Revenue])
async def get_revenues(start: Optional[date] = None, end: Optional[date] = None, db: Session = Depends(get_db)):
    return crud.list_revenues(db, start, end)

@app.post("/expenses", response_model=schemas.Expense)
async def add_expense(payload: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    return crud.create_expense(db, payload)

@app.get("/expenses", response_model=list[schemas.Expense])
async def get_expenses(start: Optional[date] = None, end: Optional[date] = None, db: Session = Depends(get_db)):
    return crud.list_expenses(db, start, end)

@app.get("/summary", response_model=schemas.Summary)
async def summary(start: Optional[date] = None, end: Optional[date] = None, db: Session = Depends(get_db)):
    revs = crud.list_revenues(db, start, end)
    exps = crud.list_expenses(db, start, end)
    s = summarize(revs, exps)
    return {
        "period": f"{start or 'min'} → {end or 'max'}",
        **s,
    }

@app.post("/import/darwinex-demo")
async def import_darwinex_demo(db: Session = Depends(get_db)):
    pnl = dx.fetch_pnl_demo()
    fees = dx.fetch_management_fees_demo()
    for p in pnl:
        crud.create_revenue(db, schemas.RevenueCreate(
            date=p["date"], source="Darwinex", type=schemas.RevenueType.PNL,
            amount=p["amount"], note=p.get("note", "")
        ))
    for f in fees:
        crud.create_revenue(db, schemas.RevenueCreate(
            date=f["date"], source="DARWIN", type=schemas.RevenueType.MANAGEMENT_FEE,
            amount=f["amount"], note=f.get("note", "")
        ))
    return {"status": "ok", "imported": len(pnl) + len(fees)}

