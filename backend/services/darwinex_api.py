# Placeholder d'intégration Darwinex.
# Remplace par la vraie API quand tu auras les clés.
from datetime import date
from typing import List, Dict

def fetch_pnl_demo() -> List[Dict]:
    return [
        {"date": date(2025, 8, 5), "amount": 420.5, "note": "PnL journalier"},
        {"date": date(2025, 8, 12), "amount": -120.8, "note": "Drawdown"},
        {"date": date(2025, 9, 3), "amount": 980.0, "note": "PnL swing"},
    ]

def fetch_management_fees_demo() -> List[Dict]:
    return [
        {"date": date(2025, 9, 30), "amount": 160.0, "note": "DARWIN fees Q3"},
        {"date": date(2025, 10, 31), "amount": 210.0, "note": "DARWIN fees Oct"},
    ]

