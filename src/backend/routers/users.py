from fastapi import APIRouter, HTTPException, Depends, Query, Body, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserCreate, UserRead, UserUpdate
from typing import List, Optional
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm
import jwt
from datetime import datetime, timedelta

SECRET_KEY = "spk_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

router = APIRouter(prefix="/users", tags=["users"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

@router.get("/", response_model=List[UserRead])
def list_users(q: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(User)
    if q:
        query = query.filter(
            (User.username.ilike(f"%{q}%")) |
            (User.email.ilike(f"%{q}%")) |
            (User.full_name.ilike(f"%{q}%"))
        )
    return query.order_by(User.id.desc()).all()

@router.post("/", response_model=UserRead)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    hashed_pw = hash_password(user.password)
    db_user = User(username=user.username, email=user.email, full_name=user.full_name, role=user.role, hashed_password=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=UserRead)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in user.dict(exclude_unset=True).items():
        setattr(db_user, field, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return {"ok": True}

@router.post("/{user_id}/reset-password")
def reset_password(user_id: int, data: dict = Body(...), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    new_password = data.get("password")
    if not new_password:
        raise HTTPException(status_code=400, detail="Password is required")
    db_user.hashed_password = hash_password(new_password)
    db.commit()
    db.refresh(db_user)
    return {"ok": True, "message": "Password updated successfully"}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username atau password salah")
    to_encode = {"sub": user.username, "user_id": user.id, "role": user.role, "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user.id, "username": user.username, "role": user.role, "full_name": user.full_name}} 