from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func

from database import get_db
from models import Mahasiswa, KlasifikasiKelulusan, Nilai
from schemas import (
    MahasiswaCreate, MahasiswaUpdate, MahasiswaResponse, MahasiswaSearchResponse,
    GridResponse
)
from fuzzy_logic import FuzzyKelulusan

router = APIRouter(prefix="/api/mahasiswa", tags=["mahasiswa"])
fuzzy_system = FuzzyKelulusan()

@router.get("", response_model=GridResponse)
def get_mahasiswa(
    skip: int = Query(0, ge=0, description="Offset untuk paginasi"),
    limit: int = Query(10, ge=1, description="Limit data per halaman"),
    search: Optional[str] = None,
    program_studi: Optional[str] = None,
    min_ipk: Optional[float] = None,
    max_ipk: Optional[float] = None,
    min_sks: Optional[int] = None,
    max_sks: Optional[int] = None,
    sort: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Mahasiswa)
    
    # Filter
    if search:
        query = query.filter(
            (Mahasiswa.nim.ilike(f"%{search}%")) |
            (Mahasiswa.nama.ilike(f"%{search}%"))
        )
    if program_studi:
        query = query.filter(Mahasiswa.program_studi == program_studi)
    if min_ipk is not None:
        query = query.filter(Mahasiswa.ipk >= min_ipk)
    if max_ipk is not None:
        query = query.filter(Mahasiswa.ipk <= max_ipk)
    if min_sks is not None:
        query = query.filter(Mahasiswa.sks >= min_sks)
    if max_sks is not None:
        query = query.filter(Mahasiswa.sks <= max_sks)
    
    # Hitung total records untuk paginasi
    total = query.count()
    
    # Sorting
    if sort:
        # Format sort: field-direction (e.g., "nim-asc" atau "ipk-desc")
        try:
            field, direction = sort.split('-')
            if direction == 'asc':
                query = query.order_by(getattr(Mahasiswa, field).asc())
            else:
                query = query.order_by(getattr(Mahasiswa, field).desc())
        except:
            # Jika format sorting tidak valid, gunakan default
            query = query.order_by(Mahasiswa.nim.asc())
    else:
        # Default sorting
        query = query.order_by(Mahasiswa.nim.asc())
    
    # Paginasi
    mahasiswa = query.offset(skip).limit(limit).all()
    
    return {
        "data": mahasiswa,
        "total": total
    }

@router.post("", response_model=MahasiswaResponse)
def create_mahasiswa(mahasiswa: MahasiswaCreate, db: Session = Depends(get_db)):
    db_mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == mahasiswa.nim).first()
    if db_mahasiswa:
        raise HTTPException(status_code=400, detail="NIM sudah terdaftar")
    
    db_mahasiswa = Mahasiswa(**mahasiswa.dict())
    db.add(db_mahasiswa)
    db.commit()
    db.refresh(db_mahasiswa)
    return db_mahasiswa

@router.get("/search", response_model=List[MahasiswaSearchResponse])
def search_mahasiswa_for_dropdown(
    q: str = Query(..., description="Query pencarian minimal 3 karakter"),
    limit: int = Query(20, ge=1, le=100, description="Limit hasil pencarian"),
    db: Session = Depends(get_db)
):
    """
    Endpoint untuk pencarian mahasiswa yang digunakan oleh dropdown.
    Memerlukan minimal 3 karakter untuk melakukan pencarian.
    """
    # Handle placeholder untuk query yang tidak valid
    if q == "___INVALID___" or len(q) < 3:
        return []
    
    # Pencarian berdasarkan NIM atau nama
    query = db.query(Mahasiswa).filter(
        (Mahasiswa.nim.ilike(f"%{q}%")) |
        (Mahasiswa.nama.ilike(f"%{q}%"))
    ).order_by(Mahasiswa.nama.asc()).limit(limit)
    
    mahasiswa_list = query.all()
    return mahasiswa_list

@router.get("/{nim}", response_model=MahasiswaResponse)
def get_mahasiswa_by_nim(nim: str, db: Session = Depends(get_db)):
    mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == nim).first()
    if not mahasiswa:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan")
    return mahasiswa

@router.put("/{nim}", response_model=MahasiswaResponse)
def update_mahasiswa(nim: str, mahasiswa: MahasiswaUpdate, db: Session = Depends(get_db)):
    db_mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == nim).first()
    if not db_mahasiswa:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan")
    
    update_data = mahasiswa.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_mahasiswa, field, value)
    
    db_mahasiswa.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_mahasiswa)
    return db_mahasiswa

@router.delete("/{nim}")
def delete_mahasiswa(nim: str, db: Session = Depends(get_db)):
    mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == nim).first()
    if not mahasiswa:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan")
    
    db.delete(mahasiswa)
    db.commit()
    return {"message": "Mahasiswa berhasil dihapus"}

@router.post("/sync-all-nilai")
def sync_semua_nilai(db: Session = Depends(get_db)):
    # Ambil semua mahasiswa
    mahasiswa_list = db.query(Mahasiswa).all()
    results = []
    
    for mahasiswa in mahasiswa_list:
        # Hitung total nilai
        total_mk = db.query(func.count(Nilai.id))\
            .filter(Nilai.nim == mahasiswa.nim)\
            .scalar() or 0
        
        if total_mk == 0:
            mahasiswa.persen_dek = 0
            results.append({
                "nim": mahasiswa.nim,
                "persen_dek": 0,
                "total_mk": 0,
                "total_dek": 0
            })
            continue
        
        # Hitung jumlah nilai D, E, dan K
        dek_count = db.query(func.count(Nilai.id))\
            .filter(Nilai.nim == mahasiswa.nim)\
            .filter(Nilai.nilai.in_(['D', 'E', 'K']))\
            .scalar() or 0
        
        # Hitung persentase
        persen_dek = (dek_count / total_mk) * 100
        mahasiswa.persen_dek = round(persen_dek, 2)
        
        results.append({
            "nim": mahasiswa.nim,
            "persen_dek": mahasiswa.persen_dek,
            "total_mk": total_mk,
            "total_dek": dek_count
        })
    
    db.commit()
    return {
        "message": "Semua nilai berhasil disinkronkan",
        "results": results
    }

@router.post("/klasifikasi-batch")
def batch_klasifikasi_mahasiswa(db: Session = Depends(get_db)):
    try:
        # Ambil semua mahasiswa
        mahasiswa_list = db.query(Mahasiswa).all()
        
        for mahasiswa in mahasiswa_list:
            # Hitung klasifikasi untuk setiap mahasiswa
            kategori, nilai_fuzzy, ipk_membership, sks_membership, nilai_dk_membership = fuzzy_system.calculate_graduation_chance(
                mahasiswa.ipk,
                mahasiswa.sks,
                mahasiswa.persen_dek
            )
            
            # Cek apakah sudah ada klasifikasi sebelumnya
            existing_klasifikasi = db.query(KlasifikasiKelulusan).filter(
                KlasifikasiKelulusan.nim == mahasiswa.nim
            ).first()
            
            if existing_klasifikasi:
                # Update klasifikasi yang ada
                existing_klasifikasi.nilai_fuzzy = nilai_fuzzy
                existing_klasifikasi.kategori = kategori
                existing_klasifikasi.ipk_membership = ipk_membership
                existing_klasifikasi.sks_membership = sks_membership
                existing_klasifikasi.nilai_dk_membership = nilai_dk_membership
                existing_klasifikasi.updated_at = datetime.utcnow()
            else:
                # Buat klasifikasi baru
                new_klasifikasi = KlasifikasiKelulusan(
                    nim=mahasiswa.nim,
                    nilai_fuzzy=nilai_fuzzy,
                    kategori=kategori,
                    ipk_membership=ipk_membership,
                    sks_membership=sks_membership,
                    nilai_dk_membership=nilai_dk_membership
                )
                db.add(new_klasifikasi)
        
        # Commit semua perubahan
        db.commit()
        
        return {
            "message": f"Berhasil melakukan klasifikasi untuk {len(mahasiswa_list)} mahasiswa",
            "total_processed": len(mahasiswa_list)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat melakukan batch klasifikasi: {str(e)}"
        )

@router.post("/{nim}/sync-nilai")
def sync_nilai_mahasiswa(nim: str, db: Session = Depends(get_db)):
    # Cek apakah mahasiswa ada
    mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == nim).first()
    if not mahasiswa:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan")
    
    # Hitung total nilai D, E, dan K
    total_mk = db.query(func.count(Nilai.id))\
        .filter(Nilai.nim == nim)\
        .scalar() or 0
    
    if total_mk == 0:
        # Update persen_dek menjadi 0 jika tidak ada nilai
        mahasiswa.persen_dek = 0
        db.commit()
        return {"message": "Nilai berhasil disinkronkan", "persen_dek": 0}
    
    # Hitung jumlah nilai D, E, dan K
    dek_count = db.query(func.count(Nilai.id))\
        .filter(Nilai.nim == nim)\
        .filter(Nilai.nilai.in_(['D', 'E', 'K']))\
        .scalar() or 0
    
    # Hitung persentase
    persen_dek = (dek_count / total_mk) * 100
    
    # Update nilai persen_dek mahasiswa
    mahasiswa.persen_dek = round(persen_dek, 2)
    db.commit()
    
    return {
        "message": "Nilai berhasil disinkronkan",
        "persen_dek": mahasiswa.persen_dek,
        "total_mk": total_mk,
        "total_dek": dek_count
    } 
    