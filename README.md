# ZooProjectVision (MVP)

## Prérequis
- Python 3.11+
- Node 18+

## Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -c "from seed_demo import seed; seed()"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
