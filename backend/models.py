from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String, index=True)
    client_name = Column(String, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    total_amount = Column(Float)
    status = Column(String, default="Saved")
    data = Column(String) # JSON string of full invoice payload
    
class Quotation(Base):
    __tablename__ = "quotations"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String, index=True)
    client_name = Column(String, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    total_amount = Column(Float)
    status = Column(String, default="Saved")
    data = Column(String) # JSON string of full quotation payload

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True)
    amount = Column(Float)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    description = Column(String)

class Revenue(Base):
    __tablename__ = "revenue"
    
    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, index=True)
    amount = Column(Float)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    description = Column(String)

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True)
    customer_name = Column(String, index=True)
    order_date = Column(DateTime, default=datetime.datetime.utcnow)
    total_amount = Column(Float)
    status = Column(String, default="Pending") # Pending, Processing, Completed, Cancelled
    payment_status = Column(String, default="Unpaid") # Unpaid, Paid, Refunded
    items_summary = Column(String)

class Material(Base):
    __tablename__ = "materials"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    quantity_unit = Column(String)
    bought_price = Column(Float, nullable=True)
    selling_price = Column(Float, nullable=True)
    purchase_date = Column(DateTime, default=datetime.datetime.utcnow)
