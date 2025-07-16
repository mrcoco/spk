from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_
from database import get_db
from models import Mahasiswa, Nilai, KlasifikasiKelulusan
from schemas import DashboardResponse
from typing import Dict, List

router = APIRouter()

@router.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Mengambil statistik untuk dashboard
    """
    # Total mahasiswa
    total_mahasiswa = db.query(Mahasiswa).count()
    
    # Rata-rata IPK
    rata_rata_ipk = db.query(func.avg(Mahasiswa.ipk)).scalar() or 0.0
    
    # Rata-rata SKS
    rata_rata_sks = db.query(func.avg(Mahasiswa.sks)).scalar() or 0
    
    # Distribusi IPK
    distribusi_ipk = db.query(
        case(
            (Mahasiswa.ipk < 2.5, "<2.5"),
            (and_(Mahasiswa.ipk >= 2.5, Mahasiswa.ipk < 3.0), "2.5-2.99"),
            (and_(Mahasiswa.ipk >= 3.0, Mahasiswa.ipk < 3.5), "3.0-3.49"),
            (Mahasiswa.ipk >= 3.5, "3.5-4.0"),
        ).label("range"),
        func.count().label("count")
    ).group_by("range").all()
    
    distribusi_dict = {
        "<2.5": 0,
        "2.5-2.99": 0,
        "3.0-3.49": 0,
        "3.5-4.0": 0
    }
    
    for range, count in distribusi_ipk:
        if range:
            distribusi_dict[range] = count
    
    return {
        "total_mahasiswa": total_mahasiswa,
        "rata_rata_ipk": round(float(rata_rata_ipk), 2),
        "rata_rata_sks": round(float(rata_rata_sks), 1),
        "distribusi_ipk": distribusi_dict
    }

@router.get("/api/dashboard/klasifikasi")
def get_klasifikasi_stats(db: Session = Depends(get_db)):
    """
    Mengambil statistik klasifikasi
    """
    # Total klasifikasi per kategori
    klasifikasi_stats = db.query(
        KlasifikasiKelulusan.kategori,
        func.count().label("count")
    ).group_by(KlasifikasiKelulusan.kategori).all()
    
    # Konversi ke dictionary
    klasifikasi_dict = {
        kategori: count for kategori, count in klasifikasi_stats
    }
    
    # Statistik nilai
    nilai_stats = db.query(
        Nilai.nilai,
        func.count().label("count")
    ).group_by(Nilai.nilai).all()
    
    nilai_dict = {
        nilai: count for nilai, count in nilai_stats
    }
    
    return {
        "klasifikasi": klasifikasi_dict,
        "nilai": nilai_dict
    }

@router.get("/api/dashboard/fuzzy-distribution")
def get_fuzzy_distribution(db: Session = Depends(get_db)):
    """
    Mengambil distribusi klasifikasi fuzzy logic
    """
    # Query distribusi klasifikasi fuzzy
    distribusi = db.query(
        KlasifikasiKelulusan.kategori,
        func.count().label("count")
    ).group_by(KlasifikasiKelulusan.kategori).all()
    
    # Inisialisasi dengan nilai default
    distribusi_dict = {
        "Peluang Lulus Tinggi": 0,
        "Peluang Lulus Sedang": 0,
        "Peluang Lulus Kecil": 0
    }
    
    # Update dengan data dari database
    for kategori, count in distribusi:
        if kategori in distribusi_dict:
            distribusi_dict[kategori] = count
    
    # Hitung total dan persentase
    total = sum(distribusi_dict.values())
    persentase = {}
    if total > 0:
        persentase = {
            kategori: round((count / total) * 100, 1)
            for kategori, count in distribusi_dict.items()
        }
    else:
        persentase = {kategori: 0.0 for kategori in distribusi_dict.keys()}
    
    return {
        "distribusi": distribusi_dict,
        "persentase": persentase,
        "total": total
    }

@router.get("/api/dashboard/saw-distribution")
def get_saw_distribution_endpoint(db: Session = Depends(get_db)):
    """
    Mengambil distribusi klasifikasi SAW
    """
    from saw_logic import get_saw_distribution
    
    try:
        distribution_data = get_saw_distribution(db)
        return distribution_data
    except Exception as e:
        # Jika ada error, return data default
        return {
            "distribusi": {
                "Peluang Lulus Tinggi": 0,
                "Peluang Lulus Sedang": 0,
                "Peluang Lulus Kecil": 0
            },
            "persentase": {
                "Peluang Lulus Tinggi": 0.0,
                "Peluang Lulus Sedang": 0.0,
                "Peluang Lulus Kecil": 0.0
            },
            "total": 0
        }

@router.get("/api/dashboard/trend")
def get_trend_stats(db: Session = Depends(get_db)):
    """
    Mengambil statistik trend IPK dan SKS per tahun
    """
    # Trend IPK per tahun
    ipk_trend = db.query(
        Mahasiswa.program_studi,
        func.avg(Mahasiswa.ipk).label("avg_ipk")
    ).group_by(Mahasiswa.program_studi).all()
    
    # Trend SKS per tahun
    sks_trend = db.query(
        Mahasiswa.program_studi,
        func.avg(Mahasiswa.sks).label("avg_sks")
    ).group_by(Mahasiswa.program_studi).all()
    
    return {
        "ipk_trend": {
            prodi: round(float(avg_ipk), 2)
            for prodi, avg_ipk in ipk_trend
        },
        "sks_trend": {
            prodi: round(float(avg_sks), 1)
            for prodi, avg_sks in sks_trend
        }
    } 