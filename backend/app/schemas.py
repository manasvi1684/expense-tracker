from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class CategoryBase(BaseModel):
    name: str
    budget: Optional[float] = None
    keywords: Optional[str] = ""

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    amount: float
    description: str
    category_id: Optional[int] = None
    session_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class SmartTransactionRequest(BaseModel):
    query: str
    event_name: Optional[str] = None
    date: Optional[str] = None  # e.g. "2026-04-10", defaults to today if not provided

class RefundRequest(BaseModel):
    amount: float          # positive number — stored as negative internally
    description: Optional[str] = None
    category_id: Optional[int] = None
    date: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    date: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

class MonthSessionBase(BaseModel):
    total_budget: float

class MonthSessionCreate(MonthSessionBase):
    start_date: Optional[datetime] = None

class NewSessionRequest(BaseModel):
    total_budget: float
    start_date: str
    already_spent: float

class UpdateSessionRequest(BaseModel):
    total_budget: float

class MonthSessionResponse(MonthSessionBase):
    id: int
    start_date: datetime
    is_active: bool
    remaining_budget: float

    class Config:
        from_attributes = True

class WeeklyInsightsResponse(BaseModel):
    total_spent: float
    category_breakdown: dict
    expected_spend: float
    over_under: float
    next_week_budget: float
    messages: List[str]

class CashTransactionBase(BaseModel):
    amount: float
    description: str

class CashTransactionCreate(CashTransactionBase):
    date: Optional[str] = None

class CashTransactionResponse(CashTransactionBase):
    id: int
    date: datetime

    class Config:
        from_attributes = True

class CashWalletSetup(BaseModel):
    opening_balance: float

class CashWalletResponse(BaseModel):
    opening_balance: float
    current_balance: float
    transactions: List[CashTransactionResponse]
