from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Nilai
from schemas import NilaiCreate, NilaiUpdate, NilaiResponse

router = APIRouter()

@router.get("/api/nilai")
def get_nilai(
    skip: int = Query(0, ge=0),
    take: int = Query(10, ge=1),
    filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Mengambil daftar nilai dengan pagination dan filter.
    """
    query = db.query(Nilai)
    
    # Terapkan filter jika ada
    if filter:
        filter = f"%{filter}%"
        query = query.filter(
            (Nilai.nim.ilike(filter)) |
            (Nilai.kode_matakuliah.ilike(filter)) |
            (Nilai.nama_matakuliah.ilike(filter)) |
            (Nilai.nilai.ilike(filter))
        )
    
    # Hitung total data
    total = query.count()
    
    # Terapkan pagination
    nilai_list = query.offset(skip).limit(take).all()
    
    # Konversi ke response model
    response_data = [nilai.to_dict() for nilai in nilai_list]
    
    return {"data": response_data, "total": total}

@router.get("/api/nilai/{nilai_id}", response_model=NilaiResponse)
def get_nilai_by_id(nilai_id: int, db: Session = Depends(get_db)):
    """
    Mengambil detail nilai berdasarkan ID.
    """
    nilai = db.query(Nilai).filter(Nilai.id == nilai_id).first()
    if not nilai:
        raise HTTPException(status_code=404, detail="Nilai tidak ditemukan")
    return nilai

@router.post("/api/nilai", response_model=NilaiResponse)
def create_nilai(nilai: NilaiCreate, db: Session = Depends(get_db)):
    """
    Membuat data nilai baru.
    """
    db_nilai = Nilai(**nilai.dict())
    db.add(db_nilai)
    db.commit()
    db.refresh(db_nilai)
    return db_nilai

@router.put("/api/nilai/{nilai_id}", response_model=NilaiResponse)
def update_nilai(nilai_id: int, nilai: NilaiUpdate, db: Session = Depends(get_db)):
    """
    Memperbarui data nilai berdasarkan ID.
    """
    db_nilai = db.query(Nilai).filter(Nilai.id == nilai_id).first()
    if not db_nilai:
        raise HTTPException(status_code=404, detail="Nilai tidak ditemukan")
    
    # Update nilai yang tidak None
    for key, value in nilai.dict(exclude_unset=True).items():
        setattr(db_nilai, key, value)
    
    db.commit()
    db.refresh(db_nilai)
    return db_nilai

@router.delete("/api/nilai/{nilai_id}")
def delete_nilai(nilai_id: int, db: Session = Depends(get_db)):
    """
    Menghapus data nilai berdasarkan ID.
    """
    db_nilai = db.query(Nilai).filter(Nilai.id == nilai_id).first()
    if not db_nilai:
        raise HTTPException(status_code=404, detail="Nilai tidak ditemukan")
    
    db.delete(db_nilai)
    db.commit()
    return {"message": "Nilai berhasil dihapus"} 