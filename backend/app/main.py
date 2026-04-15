from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from . import models, schemas
from .database import engine, get_db
from .services.smart_parser import parse_transaction_query
from .auth import get_password_hash, create_access_token, get_current_user, verify_password

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Intelligent Expense Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/auth/signup", response_model=schemas.Token)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/sessions/new", response_model=schemas.MonthSessionResponse)
def create_new_session(request: schemas.NewSessionRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    old_session = db.query(models.MonthSession).filter(models.MonthSession.user_id == user.id, models.MonthSession.is_active == True).first()
    if old_session:
        old_session.is_active = False

    new_date = datetime.strptime(request.start_date, "%Y-%m-%d")
    new_session = models.MonthSession(user_id=user.id, total_budget=request.total_budget, start_date=new_date, is_active=True)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    if request.already_spent > 0:
        tx = models.Transaction(user_id=user.id, amount=request.already_spent, description="Prior expenditure", session_id=new_session.id)
        db.add(tx)
        db.commit()

    return schemas.MonthSessionResponse(
        id=new_session.id,
        total_budget=new_session.total_budget,
        start_date=new_session.start_date,
        is_active=new_session.is_active,
        remaining_budget=new_session.total_budget - request.already_spent
    )

@app.patch("/api/session/current")
def update_current_session(request: schemas.UpdateSessionRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(models.MonthSession).filter(models.MonthSession.user_id == user.id, models.MonthSession.is_active == True).first()
    if not session:
        raise HTTPException(status_code=404, detail="No active session found")
    session.total_budget = request.total_budget
    db.commit()
    db.refresh(session)
    transactions = db.query(models.Transaction).filter(models.Transaction.session_id == session.id).all()
    spent = sum(t.amount for t in transactions)
    return schemas.MonthSessionResponse(
        id=session.id, total_budget=session.total_budget, start_date=session.start_date,
        is_active=session.is_active, remaining_budget=session.total_budget - spent
    )

@app.get("/api/session/current", response_model=schemas.MonthSessionResponse)
def get_current_session(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(models.MonthSession).filter(models.MonthSession.user_id == user.id, models.MonthSession.is_active == True).first()
    if not session:
        raise HTTPException(status_code=404, detail="No active session found")
        
    transactions = db.query(models.Transaction).filter(models.Transaction.session_id == session.id).all()
    spent = sum(t.amount for t in transactions)
        
    return schemas.MonthSessionResponse(
        id=session.id,
        total_budget=session.total_budget,
        start_date=session.start_date,
        is_active=session.is_active,
        remaining_budget=session.total_budget - spent
    )

@app.get("/api/transactions", response_model=List[schemas.TransactionResponse])
def get_transactions(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Transaction).filter(models.Transaction.user_id == user.id).order_by(models.Transaction.date.desc()).all()

@app.post("/api/transactions/smart", response_model=schemas.TransactionResponse)
def add_smart_transaction(request: schemas.SmartTransactionRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        amount, description, category_id = parse_transaction_query(request.query, db, user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    session = db.query(models.MonthSession).filter(models.MonthSession.user_id == user.id, models.MonthSession.is_active == True).first()
    session_id = session.id if session else None
    
    event_id = None
    if request.event_name:
        event = db.query(models.Event).filter(models.Event.user_id == user.id, models.Event.name == request.event_name).first()
        if not event:
            event = models.Event(user_id=user.id, name=request.event_name)
            db.add(event)
            db.commit()
            db.refresh(event)
        event_id = event.id

    tx_date = datetime.utcnow()
    if request.date:
        try:
            tx_date = datetime.strptime(request.date, "%Y-%m-%d")
        except ValueError:
            pass

    transaction = models.Transaction(
        user_id=user.id,
        amount=amount,
        description=description,
        category_id=category_id,
        session_id=session_id,
        event_id=event_id,
        date=tx_date
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction

@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == transaction_id, models.Transaction.user_id == user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
    return {"ok": True}

@app.post("/api/transactions/refund", response_model=schemas.TransactionResponse)
def add_refund(request: schemas.RefundRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Log a refund / return. Stored as a negative amount so category totals
    and total_spent automatically decrease without any schema changes."""
    session = db.query(models.MonthSession).filter(
        models.MonthSession.user_id == user.id,
        models.MonthSession.is_active == True
    ).first()
    session_id = session.id if session else None

    tx_date = datetime.utcnow()
    if request.date:
        try:
            tx_date = datetime.strptime(request.date, "%Y-%m-%d")
        except ValueError:
            pass

    description = request.description or "Refund"

    transaction = models.Transaction(
        user_id=user.id,
        amount=-abs(request.amount),   # always negative
        description=description,
        category_id=request.category_id,
        session_id=session_id,
        date=tx_date
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

@app.get("/api/categories", response_model=List[schemas.CategoryResponse])
def get_categories(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Category).filter(models.Category.user_id == user.id).all()

@app.post("/api/categories", response_model=schemas.CategoryResponse)
def create_category(request: schemas.CategoryCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    category = models.Category(
        user_id=user.id,
        name=request.name.lower(),
        budget=request.budget,
        keywords=request.keywords
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@app.put("/api/categories/{category_id}", response_model=schemas.CategoryResponse)
def update_category(category_id: int, request: schemas.CategoryCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    cat = db.query(models.Category).filter(models.Category.id == category_id, models.Category.user_id == user.id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.name = request.name.lower()
    cat.budget = request.budget
    cat.keywords = request.keywords
    db.commit()
    db.refresh(cat)
    return cat

@app.delete("/api/categories/{category_id}")
def delete_category(category_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    cat = db.query(models.Category).filter(models.Category.id == category_id, models.Category.user_id == user.id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"ok": True}

@app.get("/api/insights/weekly", response_model=schemas.WeeklyInsightsResponse)
def get_weekly_insights(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(models.MonthSession).filter(models.MonthSession.user_id == user.id, models.MonthSession.is_active == True).first()
    if not session:
        raise HTTPException(status_code=404, detail="No active session found")
        
    transactions = db.query(models.Transaction).filter(models.Transaction.session_id == session.id).all()
    
    days_passed = max(1, (datetime.utcnow() - session.start_date).days)
    total_days = 30
    weeks_left = max(1, (total_days - days_passed) / 7.0)
    
    total_spent = sum(t.amount for t in transactions)
    
    cat_breakdown = {}
    for t in transactions:
        cname = t.category.name if t.category else "Other"
        cat_breakdown[cname] = cat_breakdown.get(cname, 0) + t.amount

    daily_budget = session.total_budget / total_days
    expected_spend = daily_budget * days_passed
    over_under = total_spent - expected_spend
    
    remaining_budget = session.total_budget - total_spent
    next_week_budget = remaining_budget / weeks_left

    messages = []
    if over_under > 0:
        messages.append(f"You overspent by ₹{over_under:.0f} this tracking cycle.")
    else:
        messages.append(f"You are saving well! Under budget by ₹{abs(over_under):.0f}.")
        
    if remaining_budget > 0:
        messages.append(f"Limit next week's spending to ₹{next_week_budget:.0f}.")
    
    if cat_breakdown:
        highest_cat = max(cat_breakdown, key=cat_breakdown.get)
        messages.append(f"'{highest_cat}' is your highest spending category.")
        
    return schemas.WeeklyInsightsResponse(
        total_spent=total_spent,
        category_breakdown=cat_breakdown,
        expected_spend=expected_spend,
        over_under=over_under,
        next_week_budget=next_week_budget,
        messages=messages
    )

# --- CASH WALLET ENDPOINTS ---

@app.get("/api/cash/wallet", response_model=schemas.CashWalletResponse)
def get_cash_wallet(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet = db.query(models.CashWallet).filter(models.CashWallet.user_id == user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Cash wallet not setup")
    
    transactions = db.query(models.CashTransaction).filter(models.CashTransaction.user_id == user.id).order_by(models.CashTransaction.date.desc()).all()
    spent_or_added = sum(t.amount for t in transactions)
    current_balance = wallet.opening_balance + spent_or_added
    
    return schemas.CashWalletResponse(
        opening_balance=wallet.opening_balance,
        current_balance=current_balance,
        transactions=transactions
    )

@app.post("/api/cash/wallet/setup")
def setup_cash_wallet(request: schemas.CashWalletSetup, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet = db.query(models.CashWallet).filter(models.CashWallet.user_id == user.id).first()
    if wallet:
        wallet.opening_balance = request.opening_balance
    else:
        wallet = models.CashWallet(user_id=user.id, opening_balance=request.opening_balance)
        db.add(wallet)
    db.commit()
    return {"ok": True}

@app.post("/api/cash/add", response_model=schemas.CashTransactionResponse)
def add_cash(request: schemas.CashTransactionCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx_date = datetime.utcnow()
    if request.date:
        try:
            tx_date = datetime.strptime(request.date, "%Y-%m-%d")
        except ValueError:
            pass

    transaction = models.CashTransaction(
        user_id=user.id,
        amount=abs(request.amount), # Positive amount for adding cash
        description=request.description,
        date=tx_date
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

@app.post("/api/cash/spend", response_model=schemas.CashTransactionResponse)
def spend_cash(request: schemas.CashTransactionCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx_date = datetime.utcnow()
    if request.date:
        try:
            tx_date = datetime.strptime(request.date, "%Y-%m-%d")
        except ValueError:
            pass

    transaction = models.CashTransaction(
        user_id=user.id,
        amount=-abs(request.amount), # Negative amount for spending cash
        description=request.description,
        date=tx_date
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

@app.delete("/api/cash/transactions/{transaction_id}")
def delete_cash_transaction(transaction_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx = db.query(models.CashTransaction).filter(models.CashTransaction.id == transaction_id, models.CashTransaction.user_id == user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Cash transaction not found")
    db.delete(tx)
    db.commit()
    return {"ok": True}

