from pydantic import BaseModel
from datetime import date
from enum import Enum

class RevenueType(str, Enum):
    PNL = "PNL"
    MANAGEMENT_FEE = "MANAGEMENT_FEE"
    PROP_PAYOUT = "PROP_PAYOUT"

class ExpenseCategory(str, Enum):
    CHALLENGE = "CHALLENGE"
    COMMISSION = "COMMISSION"
    TOOLS = "TOOLS"
    VPS = "VPS"
    OTHER = "OTHER"

class RevenueBase(BaseModel):
    date: date
    source: str
    type: RevenueType
    amount: float
    currency: str = "EUR"
    note: str = ""

class RevenueCreate(RevenueBase):
    pass

class Revenue(RevenueBase):
    id: int
    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    date: date
    category: ExpenseCategory
    vendor: str
    amount: float
    currency: str = "EUR"
    note: str = ""

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    class Config:
        from_attributes = True

class Summary(BaseModel):
    period: str
    total_revenue: float
    total_expense: float
    net_profit: float
    by_revenue_type: dict
    by_expense_category: dict
