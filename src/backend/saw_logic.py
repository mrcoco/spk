from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Optional, Union, Any
from models import Mahasiswa, SAWCriteria, SAWResults, SAWFinalResults, KategoriPeluang
from schemas import CriteriaDetailsResponse
from datetime import datetime

# Cache untuk nilai min/max
_stats_cache = {}
_stats_cache_timestamp = None
_cache_duration = 300  # 5 menit

# Mengambil statistik min/max dengan cache untuk efisiensi query
# Fungsi ini akan mengambil nilai maksimum dan minimum dari kolom IPK, SKS, dan Nilai D/E/K pada tabel Mahasiswa.
# Untuk menghemat query ke database, hasilnya disimpan dalam cache selama 5 menit.
# Jika cache masih valid, data diambil dari cache, jika tidak maka query baru dilakukan ke database.
def get_cached_stats(db: Session):
    """
    Mendapatkan statistik min/max dengan caching untuk performa
    """
    global _stats_cache, _stats_cache_timestamp
    
    current_time = datetime.utcnow()
    
    # Check if cache is still valid
    if (_stats_cache and _stats_cache_timestamp and 
        (current_time - _stats_cache_timestamp).total_seconds() < _cache_duration):
        return _stats_cache
    
    # Query database untuk mendapatkan statistik
    stats = db.query(
        func.max(Mahasiswa.ipk).label('ipk_max'),
        func.max(Mahasiswa.sks).label('sks_max'),
        func.min(Mahasiswa.persen_dek).label('nilai_dek_min'),
        func.max(Mahasiswa.persen_dek).label('nilai_dek_max')
    ).first()
    
    # Update cache
    _stats_cache = {
        'ipk_max': stats.ipk_max or 4.0,
        'sks_max': stats.sks_max or 200.0,
        'nilai_dek_min': stats.nilai_dek_min or 0.0,
        'nilai_dek_max': stats.nilai_dek_max or 100.0
    }
    _stats_cache_timestamp = current_time
    
    return _stats_cache

# Menghapus cache statistik min/max
# Fungsi ini menghapus isi cache statistik dan timestamp-nya, sehingga query berikutnya akan mengambil data baru dari database.
def clear_stats_cache():
    """
    Clear cache statistik
    """
    global _stats_cache, _stats_cache_timestamp
    _stats_cache = {}
    _stats_cache_timestamp = None

# Inisialisasi kriteria SAW di database jika belum ada
# Fungsi ini akan mengecek apakah tabel kriteria SAW sudah terisi.
# Jika belum, maka akan menambahkan tiga kriteria default (IPK, SKS, Nilai D/E/K) beserta bobot dan tipe cost/benefit-nya.
def initialize_saw_criteria(db: Session):
    """
    Inisialisasi kriteria SAW jika belum ada
    """
    existing_criteria = db.query(SAWCriteria).count()
    if existing_criteria == 0:
        criteria_data = [
            {"name": "IPK", "weight": 0.35, "is_cost": False},
            {"name": "SKS", "weight": 0.375, "is_cost": False},
            {"name": "Nilai D/E/K", "weight": 0.375, "is_cost": True}
        ]
        
        for criteria in criteria_data:
            db_criteria = SAWCriteria(
                name=criteria["name"],
                weight=criteria["weight"],
                is_cost=criteria["is_cost"]
            )
            db.add(db_criteria)
        
        db.commit()
        print("SAW criteria initialized successfully")

# Menyimpan hasil perhitungan SAW ke database (update jika sudah ada)
# Fungsi ini menyimpan hasil perhitungan SAW (nilai akhir dan ranking) untuk satu mahasiswa ke tabel SAWResults.
# Jika data untuk NIM tersebut sudah ada, maka akan diupdate, jika belum maka akan dibuat data baru.
def save_saw_result(db: Session, nim: str, final_score: float, ranking: int) -> SAWResults:
    """
    Menyimpan hasil SAW ke database
    """
    # Cek apakah sudah ada hasil untuk mahasiswa ini
    existing_result = db.query(SAWResults).filter(SAWResults.nim == nim).first()
    
    if existing_result:
        # Update existing result
        existing_result.nilai_akhir = final_score
        existing_result.ranking = ranking
        existing_result.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_result)
        return existing_result
    else:
        # Create new result
        new_result = SAWResults(
            nim=nim,
            nilai_akhir=final_score,
            ranking=ranking
        )
        db.add(new_result)
        db.commit()
        db.refresh(new_result)
        return new_result

# Menyimpan hasil akhir SAW ke database (update jika sudah ada)
# Fungsi ini mirip dengan save_saw_result, namun menyimpan ke tabel SAWFinalResults.
# Data yang disimpan adalah NIM, skor akhir, dan ranking. Jika sudah ada, akan diupdate.
def save_saw_final_result(db: Session, nim: str, final_score: float, rank: int) -> SAWFinalResults:
    """
    Menyimpan hasil SAW final ke database
    """
    # Cek apakah sudah ada hasil untuk mahasiswa ini
    existing_result = db.query(SAWFinalResults).filter(SAWFinalResults.nim == nim).first()
    
    if existing_result:
        # Update existing result
        existing_result.final_score = final_score
        existing_result.rank = rank
        existing_result.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_result)
        return existing_result
    else:
        # Create new result
        new_result = SAWFinalResults(
            nim=nim,
            final_score=final_score,
            rank=rank
        )
        db.add(new_result)
        db.commit()
        db.refresh(new_result)
        return new_result

# Menghitung nilai SAW untuk satu mahasiswa berdasarkan kriteria dan bobot
# Fungsi ini mengambil data mahasiswa berdasarkan NIM, lalu melakukan normalisasi nilai IPK, SKS, dan Nilai D/E/K.
# Nilai normalisasi dikalikan dengan bobot, lalu dijumlahkan untuk mendapatkan skor akhir.
# Skor akhir digunakan untuk menentukan klasifikasi peluang lulus (Tinggi/Sedang/Kecil).
# Jika save_to_db=True, hasilnya juga disimpan ke database.
def calculate_saw(db: Session, nim: str, save_to_db: bool = True) -> Optional[Dict[str, Any]]:
    """
    Menghitung nilai SAW berdasarkan implementasi di FIS_SAW_fix.ipynb
    
    Normalisasi:
    - IPK (benefit): nilai / nilai_max
    - SKS (benefit): nilai / nilai_max  
    - Nilai D/E/K (cost): (nilai_max - nilai) / (nilai_max - nilai_min)
    
    Bobot sesuai FIS_SAW_fix.ipynb:
    - IPK: 0.35 (35%)
    - SKS: 0.375 (37.5%)
    - Nilai D/E/K: 0.375 (37.5%)
    
    Klasifikasi:
    - Skor >= 0.7: "Peluang Lulus Tinggi"
    - Skor >= 0.45: "Peluang Lulus Sedang"
    - Skor < 0.45: "Peluang Lulus Kecil"
    """
    # Inisialisasi kriteria jika belum ada
    initialize_saw_criteria(db)
    
    # Ambil data mahasiswa
    mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == nim).first()
    if not mahasiswa:
        return None

    # Ambil nilai min/max untuk normalisasi dengan caching
    stats = get_cached_stats(db)
    ipk_max = stats['ipk_max']
    sks_max = stats['sks_max']
    nilai_dek_min = stats['nilai_dek_min']
    nilai_dek_max = stats['nilai_dek_max']
    
    # Nilai kriteria mahasiswa
    criteria_values = {
        "IPK": float(mahasiswa.ipk),
        "SKS": float(mahasiswa.sks),
        "Nilai D/E/K": float(mahasiswa.persen_dek)
    }

    # Normalisasi yang benar untuk cost criteria
    # IPK dan SKS adalah benefit criteria (semakin tinggi semakin baik)
    # Nilai D/E/K adalah cost criteria (semakin rendah semakin baik)
    
    # Normalisasi cost criteria: (max - nilai) / (max - min)
    # Jika max = min, maka semua nilai sama, berikan skor 1.0
    if nilai_dek_max == nilai_dek_min:
        nilai_dek_normalized = 1.0
    else:
        nilai_dek_normalized = (nilai_dek_max - criteria_values["Nilai D/E/K"]) / (nilai_dek_max - nilai_dek_min)
    
    normalized_values = {
        "IPK": criteria_values["IPK"] / ipk_max,
        "SKS": criteria_values["SKS"] / sks_max,
        "Nilai D/E/K": nilai_dek_normalized
    }
    
    # Bobot sesuai FIS_SAW_fix.ipynb
    weights = {
        "IPK": 0.35,
        "SKS": 0.375,
        "Nilai D/E/K": 0.375
    }

    # Hitung nilai terbobot
    weighted_values = {
        "IPK": normalized_values["IPK"] * weights["IPK"],
        "SKS": normalized_values["SKS"] * weights["SKS"],
        "Nilai D/E/K": normalized_values["Nilai D/E/K"] * weights["Nilai D/E/K"]
    }

    # Hitung skor akhir SAW
    final_value = sum(weighted_values.values())

    # Klasifikasi sesuai FIS_SAW_fix.ipynb
    if final_value >= 0.7:
        klasifikasi = "Peluang Lulus Tinggi"
    elif final_value >= 0.45:
        klasifikasi = "Peluang Lulus Sedang"
    else:
        klasifikasi = "Peluang Lulus Kecil"

    # Simpan ke database jika diminta
    if save_to_db:
        try:
            # Hitung ranking sementara (akan diperbaharui di batch_calculate_saw)
            ranking = 1  # Default ranking
            save_saw_result(db, nim, final_value, ranking)
            save_saw_final_result(db, nim, final_value, ranking)
        except Exception as e:
            print(f"Error saving SAW result for {nim}: {e}")

    return {
        "criteria_values": criteria_values,
        "normalized_values": normalized_values,
        "weighted_values": weighted_values,
        "final_value": final_value,
        "klasifikasi": klasifikasi
    }

# Menghitung SAW untuk semua mahasiswa sekaligus (batch processing)
# Fungsi ini mengambil seluruh data mahasiswa, lalu menghitung skor SAW untuk masing-masing mahasiswa secara batch.
# Nilai min/max diambil sekali untuk seluruh batch agar efisien.
# Hasil perhitungan (termasuk normalisasi, skor, dan klasifikasi) disimpan ke database jika save_to_db=True.
def batch_calculate_saw(db: Session, save_to_db: bool = True) -> List[Dict[str, Any]]:
    """
    Menghitung SAW untuk semua mahasiswa sekaligus (batch processing)
    """
    # Inisialisasi kriteria jika belum ada
    initialize_saw_criteria(db)
    
    # Ambil semua mahasiswa dengan satu query
    all_mahasiswa = db.query(Mahasiswa).all()
    
    # Ambil nilai min/max untuk normalisasi dengan satu query yang dioptimasi
    stats = db.query(
        func.max(Mahasiswa.ipk).label('ipk_max'),
        func.max(Mahasiswa.sks).label('sks_max'),
        func.min(Mahasiswa.persen_dek).label('nilai_dek_min'),
        func.max(Mahasiswa.persen_dek).label('nilai_dek_max')
    ).first()
    
    ipk_max = stats.ipk_max or 4.0
    sks_max = stats.sks_max or 200.0
    nilai_dek_min = stats.nilai_dek_min or 0.0
    nilai_dek_max = stats.nilai_dek_max or 100.0
    
    # Bobot sesuai FIS_SAW_fix.ipynb
    weights = {
        "IPK": 0.35,
        "SKS": 0.375,
        "Nilai D/E/K": 0.375
    }
    
    results = []
    
    # Batch process semua mahasiswa
    for mahasiswa in all_mahasiswa:
        # Nilai kriteria
        criteria_values = {
            "IPK": float(mahasiswa.ipk),
            "SKS": float(mahasiswa.sks),
            "Nilai D/E/K": float(mahasiswa.persen_dek)
        }
        
        # Normalisasi yang benar untuk cost criteria
        # Normalisasi cost criteria: (max - nilai) / (max - min)
        if nilai_dek_max == nilai_dek_min:
            nilai_dek_normalized = 1.0
        else:
            nilai_dek_normalized = (nilai_dek_max - criteria_values["Nilai D/E/K"]) / (nilai_dek_max - nilai_dek_min)
        
        # Normalisasi
        normalized_values = {
            "IPK": criteria_values["IPK"] / ipk_max,
            "SKS": criteria_values["SKS"] / sks_max,
            "Nilai D/E/K": nilai_dek_normalized
        }
        
        # Nilai terbobot
        weighted_values = {
            "IPK": normalized_values["IPK"] * weights["IPK"],
            "SKS": normalized_values["SKS"] * weights["SKS"],
            "Nilai D/E/K": normalized_values["Nilai D/E/K"] * weights["Nilai D/E/K"]
        }
        
        # Skor akhir
        final_value = sum(weighted_values.values())
        
        # Klasifikasi
        if final_value >= 0.7:
            klasifikasi = "Peluang Lulus Tinggi"
        elif final_value >= 0.45:
            klasifikasi = "Peluang Lulus Sedang"
        else:
            klasifikasi = "Peluang Lulus Kecil"
        
        results.append({
            "nim": mahasiswa.nim,
            "nama": mahasiswa.nama,
            "ipk": criteria_values["IPK"],
            "sks": criteria_values["SKS"],
            "persen_dek": criteria_values["Nilai D/E/K"],
            "ipk_norm": normalized_values["IPK"],
            "sks_norm": normalized_values["SKS"],
            "nilai_dek_norm": normalized_values["Nilai D/E/K"],
            "skor_saw": final_value,
            "klasifikasi_saw": klasifikasi
        })
    
    # Urutkan berdasarkan skor SAW untuk menentukan ranking
    results.sort(key=lambda x: x["skor_saw"], reverse=True)
    
    # Simpan ke database jika diminta dengan batch operation yang dioptimasi
    if save_to_db:
        try:
            # Clear existing results first dengan satu operasi
            db.query(SAWResults).delete()
            db.query(SAWFinalResults).delete()
            db.commit()
            
            # Batch insert new results untuk performa yang lebih baik
            saw_results_batch = []
            saw_final_results_batch = []
            
            for idx, result in enumerate(results):
                ranking = idx + 1
                
                # Prepare SAWResults
                saw_results_batch.append(SAWResults(
                    nim=result["nim"],
                    nilai_akhir=result["skor_saw"],
                    ranking=ranking
                ))
                
                # Prepare SAWFinalResults
                saw_final_results_batch.append(SAWFinalResults(
                    nim=result["nim"],
                    final_score=result["skor_saw"],
                    rank=ranking
                ))
            
            # Batch insert untuk performa optimal
            db.bulk_save_objects(saw_results_batch)
            db.bulk_save_objects(saw_final_results_batch)
            db.commit()
            
        except Exception as e:
            db.rollback()
            print(f"Error saving batch SAW results: {e}")
    
    return results

# Mengambil hasil SAW dari database dengan pagination
# Fungsi ini mengambil data hasil perhitungan SAW dari tabel SAWResults, diurutkan berdasarkan ranking, dan bisa dipaging.
def get_saw_results_from_db(db: Session, skip: int = 0, limit: int = 10) -> List[SAWResults]:
    """Mengambil hasil SAW dari database"""
    return db.query(SAWResults).order_by(SAWResults.ranking).offset(skip).limit(limit).all()

# Mengambil hasil SAW untuk satu mahasiswa dari database
# Fungsi ini mengambil satu baris hasil SAW dari tabel SAWResults berdasarkan NIM mahasiswa.
def get_saw_result_from_db(db: Session, nim: str) -> Optional[SAWResults]:
    """Mengambil hasil SAW untuk mahasiswa tertentu dari database"""
    return db.query(SAWResults).filter(SAWResults.nim == nim).first()

# Mengambil hasil akhir SAW dari database dengan pagination
# Fungsi ini mengambil data hasil akhir SAW dari tabel SAWFinalResults, diurutkan berdasarkan ranking, dan bisa dipaging.
def get_saw_final_results_from_db(db: Session, skip: int = 0, limit: int = 10) -> List[SAWFinalResults]:
    """Mengambil hasil SAW final dari database"""
    return db.query(SAWFinalResults).order_by(SAWFinalResults.rank).offset(skip).limit(limit).all()

# Mengambil hasil akhir SAW untuk satu mahasiswa dari database
# Fungsi ini mengambil satu baris hasil akhir SAW dari tabel SAWFinalResults berdasarkan NIM mahasiswa.
def get_saw_final_result_from_db(db: Session, nim: str) -> Optional[SAWFinalResults]:
    """Mengambil hasil SAW final untuk mahasiswa tertentu dari database"""
    return db.query(SAWFinalResults).filter(SAWFinalResults.nim == nim).first()

# Mendapatkan detail kriteria, normalisasi, dan bobot SAW untuk satu mahasiswa
# Fungsi ini memanggil calculate_saw dengan save_to_db=False untuk mendapatkan detail nilai kriteria, hasil normalisasi, bobot, dan skor akhir untuk satu mahasiswa.
def get_criteria_details(db: Session, nim: str) -> Optional[CriteriaDetailsResponse]:
    """Mendapatkan detail kriteria SAW untuk mahasiswa"""
    result = calculate_saw(db, nim, save_to_db=False)  # Tidak perlu save saat get detail
    if not result:
        return None
    
    return CriteriaDetailsResponse(
        nim=nim,
        criteria_values=result["criteria_values"],
        normalized_values=result["normalized_values"],
        weighted_values=result["weighted_values"],
        final_value=result["final_value"]
    )

# Membuat kriteria SAW baru di database
# Fungsi ini menambahkan satu kriteria baru ke tabel SAWCriteria dengan nama, bobot, dan tipe cost/benefit sesuai parameter.
def create_saw_criteria(db: Session, name: str, weight: float, is_cost: bool = False) -> SAWCriteria:
    """Membuat kriteria SAW baru"""
    db_criteria = SAWCriteria(name=name, weight=weight, is_cost=is_cost)
    db.add(db_criteria)
    db.commit()
    db.refresh(db_criteria)
    return db_criteria

# Mengambil semua kriteria SAW dari database
# Fungsi ini mengambil seluruh data kriteria SAW dari tabel SAWCriteria.
def get_saw_criteria(db: Session) -> List[SAWCriteria]:
    """Mengambil semua kriteria SAW"""
    return db.query(SAWCriteria).all()

# Mendapatkan nama kolom database dari nama kriteria SAW
# Fungsi ini mengembalikan nama kolom pada tabel Mahasiswa yang sesuai dengan nama kriteria SAW (misal: "IPK" -> "ipk").
def get_column_name(criteria_name: str) -> str:
    """
    Mendapatkan nama kolom di database berdasarkan nama kriteria
    """
    mapping = {
        "IPK": "ipk",
        "SKS": "sks",
        "Nilai D/E/K": "persen_dek"
    }
    return mapping.get(criteria_name, "")

# Mengambil distribusi klasifikasi hasil SAW dari database (atau hitung jika belum ada)
# Fungsi ini menghitung jumlah mahasiswa pada masing-masing kategori klasifikasi SAW (Tinggi/Sedang/Kecil).
# Jika data belum ada di database, maka akan dilakukan perhitungan batch terlebih dahulu.
def get_saw_distribution(db: Session) -> Dict[str, Any]:
    """
    Mendapatkan distribusi klasifikasi SAW dari database
    
    Menggunakan data yang sudah ada di database alih-alih menghitung ulang
    untuk performa yang lebih baik
    """
    # Periksa apakah ada data di database
    saw_results_count = db.query(SAWFinalResults).count()
    
    if saw_results_count == 0:
        # Jika tidak ada data, baru lakukan batch calculation
        print("No SAW results found in database, performing batch calculation...")
        results = batch_calculate_saw(db, save_to_db=True)
        
        # Hitung distribusi dari hasil batch calculation
        distribusi = {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        }
        
        for result in results:
            klasifikasi = result["klasifikasi"]
            if klasifikasi in distribusi:
                distribusi[klasifikasi] += 1
    else:
        # Gunakan data yang sudah ada di database
        print(f"Using existing SAW results from database ({saw_results_count} records)")
        distribusi = {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        }
        
        # Hitung distribusi berdasarkan skor SAW
        saw_results = db.query(SAWFinalResults).all()
        
        for result in saw_results:
            # Klasifikasi berdasarkan skor
            if result.final_score >= 0.7:
                klasifikasi = "Peluang Lulus Tinggi"
            elif result.final_score >= 0.45:
                klasifikasi = "Peluang Lulus Sedang"
            else:
                klasifikasi = "Peluang Lulus Kecil"
            
            if klasifikasi in distribusi:
                distribusi[klasifikasi] += 1
    
    # Hitung persentase
    total = sum(distribusi.values())
    persentase = {}
    if total > 0:
        persentase = {
            kategori: round((count / total) * 100, 1)
            for kategori, count in distribusi.items()
        }
    else:
        persentase = {kategori: 0.0 for kategori in distribusi.keys()}
    
    return {
        "distribusi": distribusi,
        "persentase": persentase,
        "total": total
    }

# Menghapus semua hasil SAW dari database
# Fungsi ini menghapus seluruh data pada tabel SAWResults dan SAWFinalResults.
def clear_saw_results(db: Session):
    """Menghapus semua hasil SAW dari database"""
    db.query(SAWResults).delete()
    db.query(SAWFinalResults).delete()
    db.commit()
    print("SAW results cleared from database")

# Hitung ulang seluruh hasil SAW dan simpan ke database
# Fungsi ini akan menghapus seluruh hasil SAW lama, lalu melakukan perhitungan batch dan menyimpan hasil baru ke database.
def recalculate_all_saw(db: Session):
    """Hitung ulang semua hasil SAW dan simpan ke database"""
    # Hapus hasil lama
    clear_saw_results(db)
    
    # Hitung ulang dan simpan
    results = batch_calculate_saw(db, save_to_db=True)
    
    print(f"Recalculated and saved {len(results)} SAW results to database")
    return results

# ============================================================================
# EVALUASI SAW FUNCTIONS
# ============================================================================
# Melakukan evaluasi performa metode SAW menggunakan cross-validation dan data aktual/sintetik
# Fungsi ini membagi data mahasiswa menjadi data latih dan data uji, lalu menghitung skor SAW pada data uji.
# Hasil prediksi dibandingkan dengan ground truth (synthetic/aktual) untuk menghasilkan metrik evaluasi seperti akurasi, presisi, recall, F1, dan confusion matrix.
def evaluate_saw_performance(
    db: Session, 
    mahasiswa_list: List[Mahasiswa] = None,
    weights: Dict[str, float] = None,
    test_size: float = 0.3,
    random_state: int = 42,
    use_actual_data: bool = False,
    save_to_db: bool = False
) -> Dict[str, Any]:
    """
    Evaluasi performa metode SAW menggunakan cross-validation
    
    Args:
        db: Database session
        weights: Dictionary dengan bobot kriteria {'ipk': 0.4, 'sks': 0.35, 'dek': 0.25}
        test_size: Proporsi data untuk testing (0.1 - 0.5)
        random_state: Seed untuk reproduksi hasil
        save_to_db: Apakah menyimpan hasil evaluasi ke database
    
    Returns:
        Dictionary dengan hasil evaluasi
    """
    import random
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
    import numpy as np
    
    # Set random seed
    random.seed(random_state)
    np.random.seed(random_state)
    
    # Default weights jika tidak diberikan
    if weights is None:
        weights = {'ipk': 0.4, 'sks': 0.35, 'dek': 0.25}
    
    # Validasi weights
    total_weight = sum(weights.values())
    if abs(total_weight - 1.0) > 0.01:
        raise ValueError(f"Total bobot harus 1.0, saat ini: {total_weight}")
    
    # Ambil data mahasiswa jika tidak diberikan
    if mahasiswa_list is None:
        if use_actual_data:
            mahasiswa_list = db.query(Mahasiswa).filter(
                Mahasiswa.status_lulus_aktual.isnot(None)
            ).all()
        else:
            mahasiswa_list = db.query(Mahasiswa).all()
    
    if len(mahasiswa_list) < 10:
        raise ValueError("Minimal diperlukan 10 data mahasiswa untuk evaluasi")
    
    # Shuffle data
    random.shuffle(mahasiswa_list)
    
    # Split data
    split_index = int(len(mahasiswa_list) * (1 - test_size))
    training_data = mahasiswa_list[:split_index]
    test_data = mahasiswa_list[split_index:]
    
    print(f"Training data: {len(training_data)}, Test data: {len(test_data)}")
    
    # Hitung nilai maksimum dan minimum dari training data untuk normalisasi
    max_values = {
        'ipk': max(m.ipk for m in training_data),
        'sks': max(m.sks for m in training_data),
        'dek': max(m.persen_dek for m in training_data)
    }
    
    min_values = {
        'ipk': min(m.ipk for m in training_data),
        'sks': min(m.sks for m in training_data),
        'dek': min(m.persen_dek for m in training_data)
    }
    
    # Fungsi untuk menghitung skor SAW
    def calculate_saw_score(mahasiswa):
        # Normalisasi
        normalized_ipk = (mahasiswa.ipk - min_values['ipk']) / (max_values['ipk'] - min_values['ipk'])
        normalized_sks = (mahasiswa.sks - min_values['sks']) / (max_values['sks'] - min_values['sks'])
        normalized_dek = (mahasiswa.persen_dek - min_values['dek']) / (max_values['dek'] - min_values['dek'])
        
        # Hitung skor SAW
        saw_score = (
            weights['ipk'] * normalized_ipk +
            weights['sks'] * normalized_sks +
            weights['dek'] * (1 - normalized_dek)  # D/E/K adalah cost criteria
        )
        
        return saw_score
    
    # Fungsi untuk klasifikasi berdasarkan skor SAW
    def classify_saw_score(score):
        if score >= 0.7:
            return "Peluang Lulus Tinggi"
        elif score >= 0.45:
            return "Peluang Lulus Sedang"
        else:
            return "Peluang Lulus Kecil"
    
    # Fungsi untuk klasifikasi berdasarkan data aktual (ground truth)
    def classify_actual(mahasiswa):
        if use_actual_data and mahasiswa.status_lulus_aktual:
            # Gunakan status_lulus_aktual jika tersedia
            if mahasiswa.status_lulus_aktual.upper() == 'LULUS':
                return "Peluang Lulus Tinggi"
            else:
                return "Peluang Lulus Kecil"
        else:
            # Klasifikasi berdasarkan IPK dan SKS (synthetic)
            if mahasiswa.ipk >= 3.0 and mahasiswa.sks >= 100:
                return "Peluang Lulus Tinggi"
            elif mahasiswa.ipk >= 2.5 and mahasiswa.sks >= 80:
                return "Peluang Lulus Sedang"
            else:
                return "Peluang Lulus Kecil"
    
    # Evaluasi pada test data
    y_true = []
    y_pred = []
    results = []
    
    for mahasiswa in test_data:
        # Prediksi menggunakan SAW
        saw_score = calculate_saw_score(mahasiswa)
        predicted_class = classify_saw_score(saw_score)
        
        # Ground truth
        actual_class = classify_actual(mahasiswa)
        
        y_true.append(actual_class)
        y_pred.append(predicted_class)
        
        result_item = {
            "nim": mahasiswa.nim,
            "nama": mahasiswa.nama,
            "ipk": mahasiswa.ipk,
            "sks": mahasiswa.sks,
            "persen_dek": mahasiswa.persen_dek,
            "actual_status": mahasiswa.status_lulus_aktual if use_actual_data else None,
            "actual_class": actual_class,
            "predicted_class": predicted_class,
            "final_value": saw_score,
            "is_correct": actual_class == predicted_class
        }
        results.append(result_item)
    
    # Hitung metrik evaluasi
    accuracy = accuracy_score(y_true, y_pred)
    
    # Precision, Recall, F1-Score (macro average untuk multi-class)
    precision = precision_score(y_true, y_pred, average='macro', zero_division=0)
    recall = recall_score(y_true, y_pred, average='macro', zero_division=0)
    f1 = f1_score(y_true, y_pred, average='macro', zero_division=0)
    
    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred, labels=["Peluang Lulus Tinggi", "Peluang Lulus Sedang", "Peluang Lulus Kecil"])
    
    # Hitung specificity (True Negative Rate)
    # Specificity = TN / (TN + FP)
    specificity = 0
    if len(cm) >= 2:
        tn = cm[1, 1] + cm[2, 2]  # True negatives for class 0
        fp = cm[1, 0] + cm[2, 0]  # False positives for class 0
        if (tn + fp) > 0:
            specificity = tn / (tn + fp)
    
    # Distribusi klasifikasi
    classification_distribution = {
        "tinggi": sum(1 for pred in y_pred if pred == "Peluang Lulus Tinggi"),
        "sedang": sum(1 for pred in y_pred if pred == "Peluang Lulus Sedang"),
        "kecil": sum(1 for pred in y_pred if pred == "Peluang Lulus Kecil")
    }
    
    # Confusion matrix untuk response
    confusion_matrix_dict = {
        "tp": int(cm[0, 0]) if len(cm) > 0 else 0,  # True Positive (Tinggi predicted as Tinggi)
        "fp": int(cm[0, 1] + cm[0, 2]) if len(cm) > 0 else 0,  # False Positive
        "fn": int(cm[1, 0] + cm[2, 0]) if len(cm) > 1 else 0,  # False Negative
        "tn": int(cm[1, 1] + cm[1, 2] + cm[2, 1] + cm[2, 2]) if len(cm) > 1 else 0  # True Negative
    }
    
    evaluation_result = {
        "total_data": len(mahasiswa_list),
        "training_data": len(training_data),
        "test_data": len(test_data),
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "specificity": float(specificity),
        "confusion_matrix": cm.tolist(),  # array 2D
        "confusion_matrix_dict": confusion_matrix_dict,  # dictionary (opsional)
        "classification_distribution": classification_distribution,
        "results": results,
        "weights": weights,
        "test_size": test_size,
        "random_state": random_state
    }
    
    # Simpan ke database jika diminta
    if save_to_db:
        # TODO: Implementasi penyimpanan hasil evaluasi ke database
        pass
    
    return evaluation_result

# Mengambil riwayat evaluasi SAW dari database (belum diimplementasikan)
# Fungsi ini disiapkan untuk mengambil riwayat hasil evaluasi SAW, namun belum diimplementasikan.
def get_saw_evaluation_history(db: Session) -> List[Dict[str, Any]]:
    """
    Mendapatkan riwayat evaluasi SAW dari database
    """
    # TODO: Implementasi untuk mengambil riwayat evaluasi
    return []

# Menyimpan hasil evaluasi SAW ke database (belum diimplementasikan)
# Fungsi ini disiapkan untuk menyimpan hasil evaluasi SAW ke database, namun belum diimplementasikan.
def save_saw_evaluation_result(db: Session, evaluation_data: Dict[str, Any]) -> bool:
    """
    Menyimpan hasil evaluasi SAW ke database
    """
    # TODO: Implementasi untuk menyimpan hasil evaluasi
    return True 