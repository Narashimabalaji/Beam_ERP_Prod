from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import models
import database
import schemas
import datetime
import os
import sys

# Create tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Beam ERP Backend")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Beam ERP API"}

@app.get("/invoices", response_model=list[schemas.InvoiceResponse])
def get_invoices(db: Session = Depends(database.get_db)):
    return db.query(models.Invoice).all()

@app.post("/invoices", response_model=schemas.InvoiceResponse)
def create_invoice(invoice: schemas.InvoiceCreate, db: Session = Depends(database.get_db)):
    db_invoice = models.Invoice(**invoice.dict())
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@app.get("/quotations", response_model=list[schemas.QuotationResponse])
def get_quotations(db: Session = Depends(database.get_db)):
    return db.query(models.Quotation).all()

@app.post("/quotations", response_model=schemas.QuotationResponse)
def create_quotation(quotation: schemas.QuotationCreate, db: Session = Depends(database.get_db)):
    db_quotation = models.Quotation(**quotation.dict())
    db.add(db_quotation)
    db.commit()
    db.refresh(db_quotation)
    return db_quotation

# ---- EXPENSES CRUD ----

@app.get("/expenses", response_model=list[schemas.ExpenseResponse])
def get_expenses(db: Session = Depends(database.get_db)):
    return db.query(models.Expense).all()

@app.post("/expenses", response_model=schemas.ExpenseResponse)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(database.get_db)):
    data = expense.dict()
    if data.get("date") is None:
        data["date"] = datetime.datetime.utcnow()
    db_expense = models.Expense(**data)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.put("/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
def update_expense(expense_id: int, expense: schemas.ExpenseUpdate, db: Session = Depends(database.get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    update_data = expense.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(db_expense, key, value)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(database.get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(db_expense)
    db.commit()
    return {"message": "Expense deleted successfully"}

# ---- REVENUE CRUD ----

@app.get("/revenue", response_model=list[schemas.RevenueResponse])
def get_revenue(db: Session = Depends(database.get_db)):
    return db.query(models.Revenue).all()

@app.post("/revenue", response_model=schemas.RevenueResponse)
def create_revenue(revenue: schemas.RevenueCreate, db: Session = Depends(database.get_db)):
    data = revenue.dict()
    if data.get("date") is None:
        data["date"] = datetime.datetime.utcnow()
    db_revenue = models.Revenue(**data)
    db.add(db_revenue)
    db.commit()
    db.refresh(db_revenue)
    return db_revenue

@app.put("/revenue/{revenue_id}", response_model=schemas.RevenueResponse)
def update_revenue(revenue_id: int, revenue: schemas.RevenueUpdate, db: Session = Depends(database.get_db)):
    db_revenue = db.query(models.Revenue).filter(models.Revenue.id == revenue_id).first()
    if not db_revenue:
        raise HTTPException(status_code=404, detail="Revenue not found")
    update_data = revenue.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(db_revenue, key, value)
    db.commit()
    db.refresh(db_revenue)
    return db_revenue

@app.delete("/revenue/{revenue_id}")
def delete_revenue(revenue_id: int, db: Session = Depends(database.get_db)):
    db_revenue = db.query(models.Revenue).filter(models.Revenue.id == revenue_id).first()
    if not db_revenue:
        raise HTTPException(status_code=404, detail="Revenue not found")
    db.delete(db_revenue)
    db.commit()
    return {"message": "Revenue deleted successfully"}

# ---- ORDERS CRUD ----

@app.get("/orders", response_model=list[schemas.OrderResponse])
def get_orders(db: Session = Depends(database.get_db)):
    return db.query(models.Order).all()

@app.post("/orders", response_model=schemas.OrderResponse)
def create_order(order: schemas.OrderCreate, db: Session = Depends(database.get_db)):
    data = order.dict()
    if data.get("order_date") is None:
        data["order_date"] = datetime.datetime.utcnow()
    db_order = models.Order(**data)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@app.put("/orders/{order_id}", response_model=schemas.OrderResponse)
def update_order(order_id: int, order: schemas.OrderUpdate, db: Session = Depends(database.get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    update_data = order.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(db_order, key, value)
    db.commit()
    db.refresh(db_order)
    return db_order

@app.delete("/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(database.get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(db_order)
    db.commit()
    return {"message": "Order deleted successfully"}

# ---- MATERIALS CRUD ----

@app.get("/materials", response_model=list[schemas.MaterialResponse])
def get_materials(db: Session = Depends(database.get_db)):
    return db.query(models.Material).all()

@app.post("/materials", response_model=schemas.MaterialResponse)
def create_material(material: schemas.MaterialCreate, db: Session = Depends(database.get_db)):
    data = material.dict()
    if data.get("purchase_date") is None:
        data["purchase_date"] = datetime.datetime.utcnow()
    db_material = models.Material(**data)
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material

@app.put("/materials/{material_id}", response_model=schemas.MaterialResponse)
def update_material(material_id: int, material: schemas.MaterialUpdate, db: Session = Depends(database.get_db)):
    db_material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Material not found")
    update_data = material.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(db_material, key, value)
    db.commit()
    db.refresh(db_material)
    return db_material

@app.delete("/materials/{material_id}")
def delete_material(material_id: int, db: Session = Depends(database.get_db)):
    db_material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Material not found")
    db.delete(db_material)
    db.commit()
    return {"message": "Material deleted successfully"}

# ---- STATS & AGGREGATION ENDPOINTS ----

from typing import Optional

@app.get("/api/stats/revenue")
def get_revenue_stats(
    year: Optional[int] = None, 
    month: Optional[int] = None, 
    day: Optional[int] = None, 
    db: Session = Depends(database.get_db)
):
    revenue_records = db.query(models.Revenue).all()
    
    def match_date(d_val):
        if not d_val: return False
        if year and d_val.year != year: return False
        if month and d_val.month != month: return False
        if day and d_val.day != day: return False
        return True
        
    filtered = [r for r in revenue_records if match_date(r.date)]
    
    total = sum(r.amount for r in filtered if r.amount)
    count = len(filtered)
    avg = (total / count) if count else 0
    
    records = [{"id": r.id, "source": r.source, "description": r.description, "amount": r.amount, "date": r.date.isoformat()} for r in filtered]
    
    return {
        "stats": {
            "total_revenue": total,
            "entry_count": count,
            "average_transaction": avg
        },
        "records": records
    }

@app.get("/api/stats/expenses")
def get_expense_stats(
    year: Optional[int] = None, 
    month: Optional[int] = None, 
    day: Optional[int] = None, 
    db: Session = Depends(database.get_db)
):
    expense_records = db.query(models.Expense).all()
    
    def match_date(d_val):
        if not d_val: return False
        if year and d_val.year != year: return False
        if month and d_val.month != month: return False
        if day and d_val.day != day: return False
        return True
        
    filtered = [e for e in expense_records if match_date(e.date)]
    
    total = sum(e.amount for e in filtered if e.amount)
    count = len(filtered)
    avg = (total / count) if count else 0
    
    records = [{"id": e.id, "category": e.category, "description": e.description, "amount": e.amount, "date": e.date.isoformat()} for e in filtered]
    
    return {
        "stats": {
            "total_expenses": total,
            "entry_count": count,
            "average_transaction": avg
        },
        "records": records
    }

@app.get("/api/stats/orders")
def get_orders_stats(
    year: Optional[int] = None, 
    month: Optional[int] = None, 
    day: Optional[int] = None, 
    db: Session = Depends(database.get_db)
):
    orders = db.query(models.Order).all()
    
    def match_date(d_val):
        if not d_val: return False
        if year and d_val.year != year: return False
        if month and d_val.month != month: return False
        if day and d_val.day != day: return False
        return True
        
    filtered = [o for o in orders if match_date(o.order_date)]
    
    total_amount = sum(o.total_amount for o in filtered if o.total_amount)
    pending_count = len([o for o in filtered if o.status in ["Pending", "Processing"]])
    unpaid_count = len([o for o in filtered if o.payment_status == "Unpaid" and o.status != "Cancelled"])
    
    records = [{
        "id": o.id, "order_number": o.order_number, "customer_name": o.customer_name, 
        "total_amount": o.total_amount, "status": o.status, "payment_status": o.payment_status,
        "items_summary": o.items_summary, "order_date": o.order_date.isoformat()
    } for o in filtered]
    
    return {
        "stats": {
            "total_orders": len(filtered),
            "pending_orders": pending_count,
            "unpaid_orders": unpaid_count,
            "total_amount": total_amount
        },
        "records": records
    }

@app.get("/api/stats/materials")
def get_materials_stats(
    year: Optional[int] = None, 
    month: Optional[int] = None, 
    day: Optional[int] = None, 
    db: Session = Depends(database.get_db)
):
    materials = db.query(models.Material).all()
    
    def match_date(d_val):
        if not d_val: return False
        if year and d_val.year != year: return False
        if month and d_val.month != month: return False
        if day and d_val.day != day: return False
        return True
        
    filtered = [m for m in materials if match_date(m.purchase_date)]
    
    total_cost = sum(m.bought_price for m in filtered if m.bought_price)
    
    records = [{
        "id": m.id, "name": m.name, "category": m.category, 
        "quantity_unit": m.quantity_unit, "bought_price": m.bought_price, 
        "selling_price": m.selling_price,
        "purchase_date": m.purchase_date.isoformat()
    } for m in filtered]
    
    return {
        "stats": {
            "total_entries": len(filtered),
            "total_cost": total_cost
        },
        "records": records
    }

@app.get("/api/stats/dashboard")
def get_dashboard_stats(
    year: Optional[int] = None, 
    month: Optional[int] = None, 
    day: Optional[int] = None, 
    db: Session = Depends(database.get_db)
):
    revenue = db.query(models.Revenue).all()
    expenses = db.query(models.Expense).all()
    
    def match_date(d_val):
        if not d_val: return False
        if year and d_val.year != year: return False
        if month and d_val.month != month: return False
        if day and d_val.day != day: return False
        return True
        
    filtered_rev = [r for r in revenue if match_date(r.date)]
    filtered_exp = [e for e in expenses if match_date(e.date)]
    
    total_rev = sum(r.amount for r in filtered_rev if r.amount)
    total_exp = sum(e.amount for e in filtered_exp if e.amount)
    
    # Build chart data
    month_map = {}
    is_daily = (month is not None and month > 0)
    
    def get_key_and_label(d_val):
        if is_daily:
            return f"{d_val.year}-{d_val.month:02d}-{d_val.day:02d}", d_val.strftime('%b %d')
        return f"{d_val.year}-{d_val.month:02d}", d_val.strftime('%b \'%y')

    for r in filtered_rev:
        k, lbl = get_key_and_label(r.date)
        if k not in month_map: month_map[k] = {"name": lbl, "Revenue": 0, "Expenses": 0, "_k": k}
        month_map[k]["Revenue"] += r.amount

    for e in filtered_exp:
        k, lbl = get_key_and_label(e.date)
        if k not in month_map: month_map[k] = {"name": lbl, "Revenue": 0, "Expenses": 0, "_k": k}
        month_map[k]["Expenses"] += e.amount
        
    sorted_map = sorted(month_map.values(), key=lambda x: x["_k"])
    chart_data = [{"name": d["name"], "Revenue": d["Revenue"], "Expenses": d["Expenses"], "Net Profit": d["Revenue"] - d["Expenses"]} for d in sorted_map]
    
    # Add predictions if "All Months" is selected and we have data
    if not is_daily and sorted_map:
        avg_r = sum(d["Revenue"] for d in sorted_map) / len(sorted_map)
        avg_e = sum(d["Expenses"] for d in sorted_map) / len(sorted_map)
        now = datetime.datetime.now()
        for i in range(1, 4):
            # Calculate future month loosely
            fm = now.month + i
            fy = now.year
            if fm > 12:
                fm -= 12
                fy += 1
            fd = datetime.date(fy, fm, 1)
            chart_data.append({
                "name": fd.strftime('%b \'%y') + " (Est)",
                "Revenue": round(avg_r),
                "Expenses": round(avg_e),
                "Net Profit": round(avg_r - avg_e)
            })
            
    recent_rev = sorted(filtered_rev, key=lambda x: x.date, reverse=True)[:5]
    recent_exp = sorted(filtered_exp, key=lambda x: x.date, reverse=True)[:5]
    
    return {
        "stats": {
            "totalRevenue": total_rev,
            "totalExpenses": total_exp,
            "netProfit": total_rev - total_exp
        },
        "chartData": chart_data,
        "recentRevenue": [{"id": r.id, "source": r.source, "amount": r.amount, "date": r.date.isoformat()} for r in recent_rev],
        "recentExpenses": [{"id": e.id, "category": e.category, "amount": e.amount, "date": e.date.isoformat()} for e in recent_exp]
    }

# ─── AI Chatbot ────────────────────────────────────────────────────────────────
import sys, os, uuid, asyncio
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ai_chatbot'))

from pydantic import BaseModel as _BaseModel

class ChatPayload(_BaseModel):
    prompt: str
    session_id: str = ""

# In-memory session store
_chat_sessions: dict = {}

@app.post("/chat")
async def chat_with_ai(request: ChatPayload):
    try:
        from chatbot import get_chatbot_response

        # Get or create session
        sid = request.session_id if request.session_id and request.session_id in _chat_sessions else str(uuid.uuid4())
        if sid not in _chat_sessions:
            _chat_sessions[sid] = []
        history = _chat_sessions[sid]

        reply, in_tok, out_tok = await get_chatbot_response(
            user_message=request.prompt,
            conversation_history=history
        )

        # Save conversation history
        _chat_sessions[sid].append({"role": "user", "content": request.prompt})
        _chat_sessions[sid].append({"role": "assistant", "content": reply})

        return {"response": reply, "session_id": sid, "input_tokens": in_tok, "output_tokens": out_tok}

    except Exception as e:
        print(f"Chat error: {e}")
        return {"response": "Sorry, I'm having trouble connecting to the AI right now. Please try again in a moment.", "session_id": "", "input_tokens": 0, "output_tokens": 0}


# ─── Serve React Frontend (used when packaged as Electron desktop app) ────────

def _get_frontend_dir():
    """Return the React build directory.
    - PyInstaller bundle: files are in sys._MEIPASS/static/
    - Development: ../frontend/dist/
    """
    if getattr(sys, 'frozen', False):
        return os.path.join(sys._MEIPASS, 'static')
    dev_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
    return os.path.abspath(dev_path)

_frontend_dir = _get_frontend_dir()

if os.path.exists(_frontend_dir):
    # Serve the React SPA. All API routes defined above take priority.
    # Any path not matched by the API will fall through to index.html (SPA routing).
    app.mount("/", StaticFiles(directory=_frontend_dir, html=True), name="frontend")
    print(f"[BeamERP] Serving frontend from: {_frontend_dir}")
else:
    print(f"[BeamERP] Frontend build not found at: {_frontend_dir}")
    print("[BeamERP] Run 'npm run build' in the frontend/ directory first.")
