from sqlalchemy import Column, Integer, String, Float, Date, Enum
from enum import Enum as PyEnum
from database import Base

class RevenueType(str, PyEnum):
    PNL = "PNL"
    MANAGEMENT_FEE = "MANAGEMENT_FEE"
    PROP_PAYOUT = "PROP_PAYOUT"

class ExpenseCategory(str, PyEnum):
    CHALLENGE = "CHALLENGE"
    COMMISSION = "COMMISSION"
    TOOLS = "TOOLS"
    VPS = "VPS"
    OTHER = "OTHER"

class Revenue(Base):
    __tablename__ = "revenues"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    source = Column(String, nullable=False)  # Darwinex, FTMO, MFF etc.
    type = Column(Enum(RevenueType), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="EUR")
    note = Column(String, default="")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    category = Column(Enum(ExpenseCategory), nullable=False)
    vendor = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="EUR")
    note = Column(String, default="")
