from collections import defaultdict
from typing import Iterable
from ..models import Revenue, Expense

def summarize(revenues: Iterable[Revenue], expenses: Iterable[Expense]):
    total_rev = sum(r.amount for r in revenues)
    total_exp = sum(e.amount for e in expenses)
    by_rtype = defaultdict(float)
    for r in revenues:
        by_rtype[r.type] += r.amount
    by_ecat = defaultdict(float)
    for e in expenses:
        by_ecat[e.category] += e.amount
    return {
        "total_revenue": total_rev,
        "total_expense": total_exp,
        "net_profit": total_rev - total_exp,
        "by_revenue_type": dict(by_rtype),
        "by_expense_category": dict(by_ecat),
    }
