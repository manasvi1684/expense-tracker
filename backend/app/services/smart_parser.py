import re
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models import Category

def parse_transaction_query(query: str, db: Session, user_id: int) -> Tuple[float, str, Optional[int]]:
    """
    Parses a string like "120 lunch" or "cab 300"
    Returns (amount, description, category_id)
    """
    # Find amount (first number in the string)
    match = re.search(r'\d+(\.\d+)?', query)
    if not match:
        raise ValueError("Could not find amount in query")
    
    amount = float(match.group())
    description = query.replace(match.group(), "", 1).strip()
    
    # Keyword detection for category
    categories = db.query(Category).filter(Category.user_id == user_id).all()
    
    detected_category_id = None
    query_lower = description.lower()
    
    for category in categories:
        if category.keywords:
            keywords = [k.strip().lower() for k in category.keywords.split(',')]
            if any(k in query_lower for k in keywords):
                detected_category_id = category.id
                break
                
        # Also check category name
        if detected_category_id is None and category.name.lower() in query_lower:
            detected_category_id = category.id
            break

    return amount, description, detected_category_id
