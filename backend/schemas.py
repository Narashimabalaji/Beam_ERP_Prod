from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InvoiceBase(BaseModel):
    invoice_no: Optional[str] = None
    client_name: str
    total_amount: float
    status: str = "Saved"
    data: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceResponse(InvoiceBase):
    id: int
    date: datetime
    
    class Config:
        from_attributes = True

class QuotationBase(BaseModel):
    invoice_no: Optional[str] = None
    client_name: str
    total_amount: float
    status: str = "Saved"
    data: Optional[str] = None

class QuotationCreate(QuotationBase):
    pass

class QuotationResponse(QuotationBase):
    id: int
    date: datetime
    
    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    category: str
    amount: float
    description: Optional[str] = None
    date: Optional[datetime] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class ExpenseResponse(ExpenseBase):
    id: int
    date: datetime
    
    class Config:
        from_attributes = True

class RevenueBase(BaseModel):
    source: str
    amount: float
    description: Optional[str] = None
    date: Optional[datetime] = None

class RevenueCreate(RevenueBase):
    pass

class RevenueUpdate(BaseModel):
    source: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class RevenueResponse(RevenueBase):
    id: int
    date: datetime
    
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    order_number: str
    customer_name: str
    total_amount: float
    status: str = "Pending"
    payment_status: str = "Unpaid"
    items_summary: Optional[str] = None
    order_date: Optional[datetime] = None

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    order_number: Optional[str] = None
    customer_name: Optional[str] = None
    total_amount: Optional[float] = None
    status: Optional[str] = None
    payment_status: Optional[str] = None
    items_summary: Optional[str] = None
    order_date: Optional[datetime] = None

class OrderResponse(OrderBase):
    id: int
    order_date: datetime
    
    class Config:
        from_attributes = True

class MaterialBase(BaseModel):
    name: str
    category: str
    quantity_unit: str
    bought_price: Optional[float] = None
    selling_price: Optional[float] = None
    purchase_date: Optional[datetime] = None

class MaterialCreate(MaterialBase):
    pass

class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity_unit: Optional[str] = None
    bought_price: Optional[float] = None
    selling_price: Optional[float] = None
    purchase_date: Optional[datetime] = None

class MaterialResponse(MaterialBase):
    id: int
    purchase_date: datetime
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    prompt: str

