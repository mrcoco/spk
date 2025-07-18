from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from database import get_db
from models import Mahasiswa, SAWResults, SAWCriteria, SAWFinalResults
from schemas import CriteriaDetailsResponse
from saw_logic import (
    calculate_saw, 
    batch_calculate_saw, 
    get_saw_distribution,
    get_criteria_details,
    get_saw_results_from_db,
    get_saw_result_from_db,
    get_saw_final_results_from_db,
    get_saw_final_result_from_db,
    recalculate_all_saw,
    clear_saw_results,
    initialize_saw_criteria
)

router = APIRouter(prefix="/api/saw", tags=["saw"])

@router.get("/check", description="Endpoint untuk memeriksa data SAW")
def check_saw_data(db: Session = Depends(get_db)):
    """
    Endpoint untuk memeriksa data dan status SAW
    """
    try:
        mahasiswa_count = db.query(Mahasiswa).count()
        saw_results_count = db.query(SAWResults).count()
        saw_final_results_count = db.query(SAWFinalResults).count()
        saw_criteria_count = db.query(SAWCriteria).count()
        
        # Inisialisasi kriteria jika belum ada
        initialize_saw_criteria(db)
        
        # Ambil sample calculation
        sample_mahasiswa = db.query(Mahasiswa).first()
        sample_calculation = None
        
        if sample_mahasiswa:
            sample_calculation = calculate_saw(db, sample_mahasiswa.nim, save_to_db=False)
        
        return {
            "mahasiswa_count": mahasiswa_count,
            "saw_results_count": saw_results_count,
            "saw_final_results_count": saw_final_results_count,
            "saw_criteria_count": saw_criteria_count,
            "sample_calculation": sample_calculation,
            "status": "SAW system ready"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat memeriksa data SAW: {str(e)}"
        )

@router.get("/calculate/{nim}")
def calculate_saw_individual(nim: str, db: Session = Depends(get_db)):
    """
    Menghitung SAW untuk mahasiswa individual berdasarkan NIM
    """
    try:
        # Validasi mahasiswa exists
        mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == nim).first()
        if not mahasiswa:
            raise HTTPException(
                status_code=404,
                detail=f"Mahasiswa dengan NIM {nim} tidak ditemukan"
            )
        
        # Hitung SAW dan simpan ke database
        result = calculate_saw(db, nim, save_to_db=True)
        if not result:
            raise HTTPException(
                status_code=500,
                detail="Gagal menghitung SAW untuk mahasiswa ini"
            )
        
        return {
            "nim": nim,
            "nama": mahasiswa.nama,
            "ipk": mahasiswa.ipk,
            "sks": mahasiswa.sks,
            "persen_dek": mahasiswa.persen_dek,
            "criteria_values": result["criteria_values"],
            "normalized_values": result["normalized_values"],
            "weighted_values": result["weighted_values"],
            "final_value": result["final_value"],
            "klasifikasi": result["klasifikasi"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat menghitung SAW: {str(e)}"
        )

@router.get("/batch")
def calculate_saw_batch(db: Session = Depends(get_db)):
    """
    Menghitung SAW untuk semua mahasiswa (batch processing) dan simpan ke database
    """
    try:
        results = batch_calculate_saw(db, save_to_db=True)
        
        return {
            "total_mahasiswa": len(results),
            "message": "Hasil SAW telah disimpan ke database",
            "data": results
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat menghitung SAW batch: {str(e)}"
        )

@router.get("/results")
def get_saw_results(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Mengambil hasil SAW dari database dengan pagination
    """
    try:
        # Ambil data dari database
        results = get_saw_results_from_db(db, skip, limit)
        total = db.query(SAWResults).count()
        
        # Jika tidak ada data, hitung dan simpan
        if total == 0:
            print("No SAW results found in database, calculating...")
            batch_results = batch_calculate_saw(db, save_to_db=True)
            results = get_saw_results_from_db(db, skip, limit)
            total = db.query(SAWResults).count()
        
        # Format hasil
        formatted_results = []
        for result in results:
            mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == result.nim).first()
            formatted_results.append({
                "nim": result.nim,
                "nama": mahasiswa.nama if mahasiswa else "Unknown",
                "nilai_akhir": result.nilai_akhir,
                "ranking": result.ranking,
                "created_at": result.created_at.isoformat() if result.created_at else None
            })
        
        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "data": formatted_results
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat mengambil hasil SAW: {str(e)}"
        )

@router.get("/results/final")
def get_saw_final_results(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Mengambil hasil SAW final dari database dengan pagination
    """
    try:
        # Ambil data dari database
        results = get_saw_final_results_from_db(db, skip, limit)
        total = db.query(SAWFinalResults).count()
        
        # Jika tidak ada data, hitung dan simpan
        if total == 0:
            print("No SAW final results found in database, calculating...")
            batch_results = batch_calculate_saw(db, save_to_db=True)
            results = get_saw_final_results_from_db(db, skip, limit)
            total = db.query(SAWFinalResults).count()
        
        # Format hasil
        formatted_results = []
        for result in results:
            mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == result.nim).first()
            formatted_results.append({
                "nim": result.nim,
                "nama": mahasiswa.nama if mahasiswa else "Unknown",
                "final_score": result.final_score,
                "rank": result.rank,
                "created_at": result.created_at.isoformat() if result.created_at else None
            })
        
        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "data": formatted_results
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat mengambil hasil SAW final: {str(e)}"
        )

@router.get("/distribution")
def get_saw_distribution_endpoint(db: Session = Depends(get_db)):
    """
    Mengambil distribusi klasifikasi SAW
    
    Menggunakan data yang sudah ada di database untuk performa yang lebih baik
    """
    try:
        distribution = get_saw_distribution(db)
        
        return {
            "status": "success",
            "distribusi": distribution["distribusi"],
            "persentase": distribution["persentase"],
            "total": distribution["total"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat mengambil distribusi SAW: {str(e)}"
        )

@router.post("/distribution/refresh")
def refresh_saw_distribution(db: Session = Depends(get_db)):
    """
    Force refresh distribusi SAW dengan menghitung ulang semua data
    
    Endpoint ini akan menghitung ulang semua hasil SAW dan menyimpannya ke database
    """
    try:
        # Hapus data lama
        clear_saw_results(db)
        
        # Hitung ulang semua data
        results = batch_calculate_saw(db, save_to_db=True)
        
        # Dapatkan distribusi baru
        distribution = get_saw_distribution(db)
        
        return {
            "status": "success",
            "message": f"Berhasil menghitung ulang distribusi SAW untuk {len(results)} mahasiswa",
            "distribusi": distribution["distribusi"],
            "persentase": distribution["persentase"],
            "total": distribution["total"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal refresh distribusi SAW: {str(e)}"
        )

@router.get("/{nim}")
def get_saw_detail(nim: str, db: Session = Depends(get_db)):
    """
    Mendapatkan detail lengkap hasil SAW untuk mahasiswa tertentu
    """
    try:
        # Validasi mahasiswa exists
        mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == nim).first()
        if not mahasiswa:
            raise HTTPException(
                status_code=404,
                detail=f"Mahasiswa dengan NIM {nim} tidak ditemukan"
            )
        
        # Hitung SAW untuk mahasiswa ini
        result = calculate_saw(db, nim, save_to_db=False)
        if not result:
            raise HTTPException(
                status_code=500,
                detail="Gagal menghitung SAW untuk mahasiswa ini"
            )
        
        # Ambil ranking dari database jika ada
        saw_final_result = get_saw_final_result_from_db(db, nim)
        ranking = saw_final_result.rank if saw_final_result else None
        
        # Ambil bobot kriteria
        weights = {
            "IPK": 0.35,
            "SKS": 0.375,
            "Nilai D/E/K": 0.375
        }
        
        return {
            "nim": nim,
            "nama": mahasiswa.nama,
            "program_studi": mahasiswa.program_studi,
            "ipk": mahasiswa.ipk,
            "sks": mahasiswa.sks,
            "persen_dek": mahasiswa.persen_dek,
            "skor_saw": result["final_value"],
            "klasifikasi_saw": result["klasifikasi"],
            "ranking": ranking,
            "bobot_ipk": weights["IPK"],
            "bobot_sks": weights["SKS"],
            "bobot_persen_dek": weights["Nilai D/E/K"],
            "normalisasi_ipk": result["normalized_values"]["IPK"],
            "normalisasi_sks": result["normalized_values"]["SKS"],
            "normalisasi_persen_dek": result["normalized_values"]["Nilai D/E/K"],
            "skor_ipk": result["weighted_values"]["IPK"],
            "skor_sks": result["weighted_values"]["SKS"],
            "skor_persen_dek": result["weighted_values"]["Nilai D/E/K"],
            "updated_at": mahasiswa.updated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat mengambil detail SAW: {str(e)}"
        )

@router.get("/criteria/{nim}")
def get_saw_criteria_details(nim: str, db: Session = Depends(get_db)):
    """
    Mendapatkan detail kriteria SAW untuk mahasiswa tertentu
    """
    try:
        # Validasi mahasiswa exists
        mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == nim).first()
        if not mahasiswa:
            raise HTTPException(
                status_code=404,
                detail=f"Mahasiswa dengan NIM {nim} tidak ditemukan"
            )
        
        # Ambil detail kriteria
        criteria_details = get_criteria_details(db, nim)
        if not criteria_details:
            raise HTTPException(
                status_code=500,
                detail="Gagal mendapatkan detail kriteria SAW"
            )
        
        return {
            "nim": nim,
            "nama": mahasiswa.nama,
            "criteria_values": criteria_details.criteria_values,
            "normalized_values": criteria_details.normalized_values,
            "weighted_values": criteria_details.weighted_values,
            "final_value": criteria_details.final_value
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat mengambil detail kriteria: {str(e)}"
        )

@router.post("/recalculate")
def recalculate_saw_results(db: Session = Depends(get_db)):
    """
    Hitung ulang semua hasil SAW dan simpan ke database
    """
    try:
        results = recalculate_all_saw(db)
        
        return {
            "message": "Semua hasil SAW telah dihitung ulang dan disimpan",
            "total_processed": len(results),
            "saw_results_count": db.query(SAWResults).count(),
            "saw_final_results_count": db.query(SAWFinalResults).count()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat menghitung ulang SAW: {str(e)}"
        )

@router.delete("/clear")
def clear_saw_results_endpoint(db: Session = Depends(get_db)):
    """
    Menghapus semua hasil SAW dari database
    """
    try:
        clear_saw_results(db)
        
        return {
            "message": "Semua hasil SAW telah dihapus dari database",
            "saw_results_count": db.query(SAWResults).count(),
            "saw_final_results_count": db.query(SAWFinalResults).count()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat menghapus hasil SAW: {str(e)}"
        )

@router.get("/weights")
def get_saw_weights():
    """
    Mendapatkan bobot kriteria SAW yang digunakan
    """
    try:
        weights = {
            "IPK": 0.35,
            "SKS": 0.375,
            "Nilai D/E/K": 0.375
        }
        
        return {
            "weights": weights,
            "total": sum(weights.values()),
            "description": "Bobot kriteria sesuai dengan penelitian FIS_SAW_fix.ipynb"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat mengambil bobot: {str(e)}"
        )

@router.get("/classification-info")
def get_classification_info():
    """
    Informasi tentang klasifikasi SAW
    """
    try:
        return {
            "thresholds": {
                "Peluang Lulus Tinggi": "≥ 0.7",
                "Peluang Lulus Sedang": "0.45 - 0.699",
                "Peluang Lulus Kecil": "< 0.45"
            },
            "criteria_types": {
                "IPK": "Benefit (semakin tinggi semakin baik)",
                "SKS": "Benefit (semakin tinggi semakin baik)",
                "Nilai D/E/K": "Cost (semakin rendah semakin baik)"
            },
            "normalization_formulas": {
                "Benefit": "R_ij = X_ij / max(X_ij)",
                "Cost": "R_ij = min(X_ij) / X_ij"
            },
            "saw_formula": "V_i = Σ(w_j × r_ij)"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat mengambil informasi klasifikasi: {str(e)}"
        ) 