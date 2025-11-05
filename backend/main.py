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

# --- AJOUTS: exports CSV + rapport periodique ---

from fastapi import UploadFile, File, Form
import csv, io

@app.post("/import/csv/revenues")
async def import_revenues_csv(file: UploadFile = File(...), source: str = Form("CSV"), db: Session = Depends(get_db)):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    count = 0
    for row in reader:
        try:
            payload = schemas.RevenueCreate(
                date=row["date"],
                source=row.get("source", source),
                type=schemas.RevenueType(row["type"]),
                amount=float(row["amount"]),
                currency=row.get("currency","EUR"),
                note=row.get("note","")
            )
            crud.create_revenue(db, payload); count += 1
        except Exception:
            continue
    return {"status":"ok","imported":count}

@app.post("/import/csv/expenses")
async def import_expenses_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    count = 0
    for row in reader:
        try:
            payload = schemas.ExpenseCreate(
                date=row["date"],
                category=schemas.ExpenseCategory(row["category"]),
                vendor=row["vendor"],
                amount=float(row["amount"]),
                currency=row.get("currency","EUR"),
                note=row.get("note","")
            )
            crud.create_expense(db, payload); count += 1
        except Exception:
            continue
    return {"status":"ok","imported":count}

