from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from database import get_db
from models import Mahasiswa, KlasifikasiKelulusan, SAWResults, SAWFinalResults, KategoriPeluang
from fuzzy_logic import FuzzyKelulusan
from saw_logic import calculate_saw, get_saw_result_from_db
import logging

router = APIRouter(
    prefix="/api/comparison",
    tags=["comparison"],
    responses={404: {"description": "Not found"}}
)

logger = logging.getLogger(__name__)

@router.get("/methods")
async def compare_methods(db: Session = Depends(get_db)):
    """
    Endpoint untuk membandingkan hasil klasifikasi FIS dan SAW
    
    Returns:
        - Statistik perbandingan
        - Data detail perbandingan per mahasiswa
        - Analisis perbedaan
    """
    try:
        logger.info("Starting comparison methods calculation")
        
        # Ambil semua mahasiswa
        mahasiswa_list = db.query(Mahasiswa).all()
        logger.info(f"Found {len(mahasiswa_list)} mahasiswa")
        
        if not mahasiswa_list:
            raise HTTPException(status_code=404, detail="Tidak ada data mahasiswa")
        
        # Inisialisasi fuzzy system
        fuzzy_system = FuzzyKelulusan()
        
        # Data perbandingan
        comparison_data = []
        fis_distribution = {"Peluang Lulus Tinggi": 0, "Peluang Lulus Sedang": 0, "Peluang Lulus Kecil": 0}
        saw_distribution = {"Peluang Lulus Tinggi": 0, "Peluang Lulus Sedang": 0, "Peluang Lulus Kecil": 0}
        
        # Hitung total untuk statistik
        total_mahasiswa = len(mahasiswa_list)
        total_consistent = 0
        total_different = 0
        
        for mahasiswa in mahasiswa_list:
            try:
                # Hitung FIS
                fis_kategori, fis_nilai, fis_ipk_membership, fis_sks_membership, fis_nilai_dk_membership = fuzzy_system.calculate_graduation_chance(
                    mahasiswa.ipk,
                    mahasiswa.sks,
                    mahasiswa.persen_dek
                )
                
                # Hitung SAW
                saw_result = calculate_saw(db, mahasiswa.nim, save_to_db=False)
                
                if saw_result:
                    saw_kategori = saw_result["klasifikasi"]
                    saw_nilai = saw_result["final_value"]
                    
                    # Update distribusi
                    fis_distribution[fis_kategori] += 1
                    saw_distribution[saw_kategori] += 1
                    
                    # Hitung konsistensi
                    is_consistent = fis_kategori == saw_kategori
                    if is_consistent:
                        total_consistent += 1
                    else:
                        total_different += 1
                    
                    # Hitung selisih nilai
                    nilai_selisih = abs(fis_nilai - saw_nilai)
                    
                    # Tambahkan ke data perbandingan
                    comparison_data.append({
                        "nim": mahasiswa.nim,
                        "nama": mahasiswa.nama,
                        "ipk": mahasiswa.ipk,
                        "sks": mahasiswa.sks,
                        "persen_dek": mahasiswa.persen_dek,
                        "fis_kategori": fis_kategori,
                        "fis_nilai": round(fis_nilai, 3),
                        "fis_details": {
                            "ipk_membership": round(fis_ipk_membership, 3),
                            "sks_membership": round(fis_sks_membership, 3),
                            "nilai_dk_membership": round(fis_nilai_dk_membership, 3)
                        },
                        "saw_kategori": saw_kategori,
                        "saw_nilai": round(saw_nilai, 3),
                        "saw_details": {
                            "ipk_normalized": round(saw_result["normalized_values"]["IPK"], 3),
                            "sks_normalized": round(saw_result["normalized_values"]["SKS"], 3),
                            "nilai_dek_normalized": round(saw_result["normalized_values"]["Nilai D/E/K"], 3)
                        },
                        "is_consistent": is_consistent,
                        "nilai_selisih": round(nilai_selisih, 3),
                        "selisih_category": get_selisih_category(nilai_selisih)
                    })
                else:
                    # Jika SAW gagal, tetap tambahkan data FIS saja
                    logger.warning(f"SAW calculation failed for NIM {mahasiswa.nim}, adding FIS data only")
                    fis_distribution[fis_kategori] += 1
                    
                    comparison_data.append({
                        "nim": mahasiswa.nim,
                        "nama": mahasiswa.nama,
                        "ipk": mahasiswa.ipk,
                        "sks": mahasiswa.sks,
                        "persen_dek": mahasiswa.persen_dek,
                        "fis_kategori": fis_kategori,
                        "fis_nilai": round(fis_nilai, 3),
                        "fis_details": {
                            "ipk_membership": round(fis_ipk_membership, 3),
                            "sks_membership": round(fis_sks_membership, 3),
                            "nilai_dk_membership": round(fis_nilai_dk_membership, 3)
                        },
                        "saw_kategori": "Tidak dapat dihitung",
                        "saw_nilai": 0,
                        "saw_details": {
                            "ipk_normalized": 0,
                            "sks_normalized": 0,
                            "nilai_dek_normalized": 0
                        },
                        "is_consistent": False,
                        "nilai_selisih": round(fis_nilai, 3),
                        "selisih_category": "Error SAW"
                    })
                    
            except Exception as e:
                logger.error(f"Error processing mahasiswa {mahasiswa.nim}: {str(e)}")
                # Tambahkan data error untuk mahasiswa ini
                comparison_data.append({
                    "nim": mahasiswa.nim,
                    "nama": mahasiswa.nama,
                    "ipk": mahasiswa.ipk,
                    "sks": mahasiswa.sks,
                    "persen_dek": mahasiswa.persen_dek,
                    "fis_kategori": "Error",
                    "fis_nilai": 0,
                    "fis_details": {"ipk_membership": 0, "sks_membership": 0, "nilai_dk_membership": 0},
                    "saw_kategori": "Error",
                    "saw_nilai": 0,
                    "saw_details": {"ipk_normalized": 0, "sks_normalized": 0, "nilai_dek_normalized": 0},
                    "is_consistent": False,
                    "nilai_selisih": 0,
                    "selisih_category": "Error"
                })
        
        # Hitung statistik perbandingan
        accuracy_percentage = (total_consistent / total_mahasiswa) * 100 if total_mahasiswa > 0 else 0
        
        # Analisis distribusi
        distribution_analysis = analyze_distribution_differences(fis_distribution, saw_distribution, total_mahasiswa)
        
        # Ranking berdasarkan nilai
        fis_ranking = sorted(comparison_data, key=lambda x: x["fis_nilai"], reverse=True)
        saw_ranking = sorted(comparison_data, key=lambda x: x["saw_nilai"], reverse=True)
        
        # Hitung korelasi ranking
        ranking_correlation = calculate_ranking_correlation(fis_ranking, saw_ranking)
        
        logger.info(f"Comparison calculation completed. Total data: {len(comparison_data)}")
        logger.info(f"Statistics: consistent={total_consistent}, different={total_different}, accuracy={accuracy_percentage}%")
        
        response_data = {
            "status": "success",
            "total_mahasiswa": total_mahasiswa,
            "statistics": {
                "total_consistent": total_consistent,
                "total_different": total_different,
                "total_fis": total_mahasiswa,
                "total_saw": total_mahasiswa,
                "accuracy_percentage": round(accuracy_percentage, 2),
                "ranking_correlation": round(ranking_correlation, 3)
            },
            "fis_distribution": fis_distribution,
            "saw_distribution": saw_distribution,
            "distribution_analysis": distribution_analysis,
            "comparison_data": comparison_data,
            "method_characteristics": {
                "fis": {
                    "name": "Fuzzy Inference System",
                    "type": "Fuzzy Logic",
                    "strengths": [
                        "Menangani ketidakpastian data dengan baik",
                        "Menggunakan logika fuzzy untuk penalaran",
                        "Fleksibel dalam pembuatan aturan",
                        "Cocok untuk data yang tidak presisi"
                    ],
                    "weaknesses": [
                        "Kompleksitas lebih tinggi",
                        "Membutuhkan tuning parameter",
                        "Proses inference lebih lambat"
                    ]
                },
                "saw": {
                    "name": "Simple Additive Weighting",
                    "type": "Multi-Criteria Decision Making",
                    "strengths": [
                        "Perhitungan sederhana dan cepat",
                        "Mudah dalam penyesuaian bobot",
                        "Transparansi dalam perhitungan",
                        "Cocok untuk kriteria yang jelas"
                    ],
                    "weaknesses": [
                        "Tidak menangani ketidakpastian",
                        "Sensitif terhadap normalisasi",
                        "Asumsi independensi kriteria"
                    ]
                }
            }
        }
        
        logger.info("Returning comparison data successfully")
        return response_data
        
    except Exception as e:
        logger.error(f"Error in compare_methods: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan: {str(e)}")

@router.get("/details/{nim}")
async def get_comparison_details(nim: str, db: Session = Depends(get_db)):
    """
    Endpoint untuk mendapatkan detail perbandingan satu mahasiswa
    
    Args:
        nim: NIM mahasiswa
        
    Returns:
        Detail perbandingan FIS dan SAW untuk mahasiswa tertentu
    """
    try:
        # Ambil data mahasiswa
        mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == nim).first()
        
        if not mahasiswa:
            raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan")
        
        # Inisialisasi fuzzy system
        fuzzy_system = FuzzyKelulusan()
        
        # Hitung FIS
        fis_kategori, fis_nilai, fis_ipk_membership, fis_sks_membership, fis_nilai_dk_membership = fuzzy_system.calculate_graduation_chance(
            mahasiswa.ipk,
            mahasiswa.sks,
            mahasiswa.persen_dek
        )
        
        # Hitung SAW
        saw_result = calculate_saw(db, nim, save_to_db=False)
        
        if not saw_result:
            raise HTTPException(status_code=404, detail="Tidak dapat menghitung SAW untuk mahasiswa ini")
        
        # Buat detail perbandingan
        comparison_detail = {
            "mahasiswa": {
                "nim": mahasiswa.nim,
                "nama": mahasiswa.nama,
                "program_studi": mahasiswa.program_studi,
                "ipk": mahasiswa.ipk,
                "sks": mahasiswa.sks,
                "persen_dek": mahasiswa.persen_dek
            },
            "fis_analysis": {
                "kategori": fis_kategori,
                "nilai_fuzzy": round(fis_nilai, 3),
                "membership_values": {
                    "ipk_membership": round(fis_ipk_membership, 3),
                    "sks_membership": round(fis_sks_membership, 3),
                    "nilai_dk_membership": round(fis_nilai_dk_membership, 3)
                },
                "explanation": get_fis_explanation(fis_ipk_membership, fis_sks_membership, fis_nilai_dk_membership)
            },
            "saw_analysis": {
                "kategori": saw_result["klasifikasi"],
                "nilai_saw": round(saw_result["final_value"], 3),
                "normalized_values": {
                    "ipk_normalized": round(saw_result["normalized_values"]["IPK"], 3),
                    "sks_normalized": round(saw_result["normalized_values"]["SKS"], 3),
                    "nilai_dek_normalized": round(saw_result["normalized_values"]["Nilai D/E/K"], 3)
                },
                "weighted_values": {
                    "ipk_weighted": round(saw_result["weighted_values"]["IPK"], 3),
                    "sks_weighted": round(saw_result["weighted_values"]["SKS"], 3),
                    "nilai_dek_weighted": round(saw_result["weighted_values"]["Nilai D/E/K"], 3)
                },
                "explanation": get_saw_explanation(saw_result)
            },
            "comparison": {
                "is_consistent": fis_kategori == saw_result["klasifikasi"],
                "nilai_selisih": round(abs(fis_nilai - saw_result["final_value"]), 3),
                "strength_analysis": compare_method_strengths(fis_nilai, saw_result["final_value"], fis_kategori, saw_result["klasifikasi"])
            }
        }
        
        return {
            "status": "success",
            "data": comparison_detail
        }
        
    except Exception as e:
        logger.error(f"Error in get_comparison_details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan: {str(e)}")

def get_selisih_category(selisih: float) -> str:
    """Kategorikan selisih nilai"""
    if selisih <= 0.1:
        return "Sangat Mirip"
    elif selisih <= 0.25:
        return "Mirip"
    elif selisih <= 0.5:
        return "Cukup Berbeda"
    else:
        return "Sangat Berbeda"

def analyze_distribution_differences(fis_dist: Dict, saw_dist: Dict, total: int) -> Dict:
    """Analisis perbedaan distribusi FIS dan SAW"""
    analysis = {}
    
    for kategori in ["Peluang Lulus Tinggi", "Peluang Lulus Sedang", "Peluang Lulus Kecil"]:
        fis_pct = (fis_dist[kategori] / total) * 100 if total > 0 else 0
        saw_pct = (saw_dist[kategori] / total) * 100 if total > 0 else 0
        difference = saw_pct - fis_pct
        
        analysis[kategori] = {
            "fis_count": fis_dist[kategori],
            "saw_count": saw_dist[kategori],
            "fis_percentage": round(fis_pct, 2),
            "saw_percentage": round(saw_pct, 2),
            "difference": round(difference, 2),
            "trend": "Naik" if difference > 0 else "Turun" if difference < 0 else "Stabil"
        }
    
    return analysis

def calculate_ranking_correlation(fis_ranking: List, saw_ranking: List) -> float:
    """Hitung korelasi ranking antara FIS dan SAW menggunakan Spearman's rank correlation"""
    n = len(fis_ranking)
    if n == 0:
        return 0.0
    
    # Buat mapping nim ke ranking
    fis_rank_map = {item["nim"]: i + 1 for i, item in enumerate(fis_ranking)}
    saw_rank_map = {item["nim"]: i + 1 for i, item in enumerate(saw_ranking)}
    
    # Hitung perbedaan ranking
    sum_d_squared = 0
    for nim in fis_rank_map:
        d = fis_rank_map[nim] - saw_rank_map[nim]
        sum_d_squared += d * d
    
    # Spearman's rank correlation coefficient
    correlation = 1 - (6 * sum_d_squared) / (n * (n * n - 1))
    
    return correlation

def get_fis_explanation(ipk_mem: float, sks_mem: float, nilai_dk_mem: float) -> str:
    """Penjelasan hasil FIS"""
    explanations = []
    
    if ipk_mem > 0.7:
        explanations.append("IPK menunjukkan performa tinggi")
    elif ipk_mem > 0.3:
        explanations.append("IPK menunjukkan performa sedang")
    else:
        explanations.append("IPK menunjukkan performa rendah")
    
    if sks_mem > 0.7:
        explanations.append("SKS menunjukkan progress tinggi")
    elif sks_mem > 0.3:
        explanations.append("SKS menunjukkan progress sedang")
    else:
        explanations.append("SKS menunjukkan progress rendah")
    
    if nilai_dk_mem > 0.7:
        explanations.append("Nilai D/E/K sangat baik")
    elif nilai_dk_mem > 0.3:
        explanations.append("Nilai D/E/K cukup baik")
    else:
        explanations.append("Nilai D/E/K perlu perbaikan")
    
    return "; ".join(explanations)

def get_saw_explanation(saw_result: Dict) -> str:
    """Penjelasan hasil SAW"""
    explanations = []
    
    ipk_contrib = saw_result["weighted_values"]["IPK"]
    sks_contrib = saw_result["weighted_values"]["SKS"]
    dek_contrib = saw_result["weighted_values"]["Nilai D/E/K"]
    
    if ipk_contrib > 0.25:
        explanations.append(f"IPK memberikan kontribusi tinggi ({ipk_contrib:.3f})")
    elif ipk_contrib > 0.15:
        explanations.append(f"IPK memberikan kontribusi sedang ({ipk_contrib:.3f})")
    else:
        explanations.append(f"IPK memberikan kontribusi rendah ({ipk_contrib:.3f})")
    
    if sks_contrib > 0.25:
        explanations.append(f"SKS memberikan kontribusi tinggi ({sks_contrib:.3f})")
    elif sks_contrib > 0.15:
        explanations.append(f"SKS memberikan kontribusi sedang ({sks_contrib:.3f})")
    else:
        explanations.append(f"SKS memberikan kontribusi rendah ({sks_contrib:.3f})")
    
    if dek_contrib > 0.25:
        explanations.append(f"Nilai D/E/K memberikan kontribusi tinggi ({dek_contrib:.3f})")
    elif dek_contrib > 0.15:
        explanations.append(f"Nilai D/E/K memberikan kontribusi sedang ({dek_contrib:.3f})")
    else:
        explanations.append(f"Nilai D/E/K memberikan kontribusi rendah ({dek_contrib:.3f})")
    
    return "; ".join(explanations)

def compare_method_strengths(fis_nilai: float, saw_nilai: float, fis_kategori: str, saw_kategori: str) -> str:
    """Analisis kekuatan masing-masing metode"""
    if fis_kategori == saw_kategori:
        return "Kedua metode konsisten dalam klasifikasi"
    
    explanations = []
    
    if fis_nilai > saw_nilai:
        explanations.append("FIS memberikan nilai lebih tinggi, menunjukkan pendekatan fuzzy yang lebih optimis")
    else:
        explanations.append("SAW memberikan nilai lebih tinggi, menunjukkan pendekatan weighted yang lebih optimis")
    
    if "Tinggi" in fis_kategori and "Sedang" in saw_kategori:
        explanations.append("FIS lebih baik menangani ketidakpastian data")
    elif "Sedang" in fis_kategori and "Tinggi" in saw_kategori:
        explanations.append("SAW lebih sensitif terhadap normalisasi kriteria")
    
    return "; ".join(explanations) 