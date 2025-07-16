from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from database import get_db
from models import Mahasiswa, KlasifikasiKelulusan
from schemas import KlasifikasiKelulusanResponse, KlasifikasiGridResponse
from fuzzy_logic import FuzzyKelulusan

router = APIRouter(prefix="/api/fuzzy", tags=["fuzzy"])
fuzzy_system = FuzzyKelulusan()

@router.get("/check", description="Endpoint untuk memeriksa data")
def check_data(db: Session = Depends(get_db)):
    try:
        mahasiswa_count = db.query(Mahasiswa).count()
        klasifikasi_count = db.query(KlasifikasiKelulusan).count()
        
        # Ambil sample data mahasiswa
        sample_mahasiswa = db.query(Mahasiswa).first()
        sample_klasifikasi = db.query(KlasifikasiKelulusan).first()
        
        return {
            "mahasiswa_count": mahasiswa_count,
            "klasifikasi_count": klasifikasi_count,
            "sample_mahasiswa": sample_mahasiswa.to_dict() if sample_mahasiswa else None,
            "sample_klasifikasi": sample_klasifikasi.to_dict() if sample_klasifikasi else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat memeriksa data: {str(e)}"
        )

@router.get("/results", response_model=KlasifikasiGridResponse)
def get_klasifikasi_results(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    try:
        # Ambil total data
        total = db.query(KlasifikasiKelulusan).count()
        
        if total == 0:
            return {
                "total": 0,
                "data": []
            }
        
        # Ambil data dengan pagination
        results = db.query(KlasifikasiKelulusan, Mahasiswa)\
            .select_from(KlasifikasiKelulusan)\
            .join(Mahasiswa, KlasifikasiKelulusan.nim == Mahasiswa.nim)\
            .order_by(KlasifikasiKelulusan.updated_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()
        
        # Format hasil
        formatted_results = []
        for klasifikasi, mahasiswa in results:
            formatted_results.append({
                "nim": klasifikasi.nim,
                "nama": mahasiswa.nama,
                "kategori": klasifikasi.kategori,
                "nilai_fuzzy": klasifikasi.nilai_fuzzy,
                "ipk_membership": klasifikasi.ipk_membership,
                "sks_membership": klasifikasi.sks_membership,
                "nilai_dk_membership": klasifikasi.nilai_dk_membership,
                "updated_at": klasifikasi.updated_at
            })
        
        return {
            "total": total,
            "data": formatted_results
        }
        
    except Exception as e:
        # Log error untuk debugging
        print(f"Error in get_klasifikasi_results: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat mengambil data klasifikasi: {str(e)}"
        )

@router.post("/batch-klasifikasi", description="Melakukan klasifikasi untuk semua mahasiswa")
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

@router.get("/{nim}", response_model=KlasifikasiKelulusanResponse)
def get_fuzzy_result(nim: str, db: Session = Depends(get_db)):
    # Cek apakah mahasiswa ada
    mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == nim).first()
    if not mahasiswa:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan")

    try:
        # Hitung klasifikasi fuzzy
        kategori, nilai_fuzzy, ipk_membership, sks_membership, nilai_dk_membership = fuzzy_system.calculate_graduation_chance(
            ipk=mahasiswa.ipk,
            sks=mahasiswa.sks,
            persen_dek=mahasiswa.persen_dek
        )

        # Simpan atau update hasil klasifikasi
        klasifikasi = db.query(KlasifikasiKelulusan).filter(KlasifikasiKelulusan.nim == nim).first()
        if not klasifikasi:
            klasifikasi = KlasifikasiKelulusan(
                nim=nim,
                kategori=kategori,
                nilai_fuzzy=nilai_fuzzy,
                ipk_membership=ipk_membership,
                sks_membership=sks_membership,
                nilai_dk_membership=nilai_dk_membership
            )
            db.add(klasifikasi)
        else:
            klasifikasi.kategori = kategori
            klasifikasi.nilai_fuzzy = nilai_fuzzy
            klasifikasi.ipk_membership = ipk_membership
            klasifikasi.sks_membership = sks_membership
            klasifikasi.nilai_dk_membership = nilai_dk_membership
            klasifikasi.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(klasifikasi)
        return klasifikasi

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat menghitung klasifikasi: {str(e)}"
        ) 