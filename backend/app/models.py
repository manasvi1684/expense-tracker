from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    budget = Column(Float, nullable=True)
    keywords = Column(String)  # comma separated e.g. "zomato,food,lunch"

class MonthSession(Base):
    __tablename__ = "month_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start_date = Column(DateTime, default=datetime.utcnow)
    total_budget = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    date = Column(DateTime, default=datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    description = Column(String)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=True)
    session_id = Column(Integer, ForeignKey("month_sessions.id"), nullable=True)
    date = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category")
    event = relationship("Event")

class CashWallet(Base):
    __tablename__ = "cash_wallets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    opening_balance = Column(Float, default=0.0)

class CashTransaction(Base):
    __tablename__ = "cash_transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    description = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
