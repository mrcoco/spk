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

@router.get("/api/dashboard/evaluation-summary")
def get_evaluation_summary(db: Session = Depends(get_db)):
    """
    Mengambil ringkasan evaluasi FIS dan SAW dengan data aktual
    Menggunakan evaluasi cepat untuk performa optimal
    """
    try:
        # Import di dalam fungsi untuk menghindari circular import
        import sys
        import os
        
        # Ambil data mahasiswa dengan status lulus aktual
        mahasiswa_with_status = db.query(Mahasiswa).filter(
            Mahasiswa.status_lulus_aktual.in_(['LULUS_TINGGI', 'LULUS_SEDANG', 'LULUS_KECIL']),
            Mahasiswa.ipk.isnot(None),
            Mahasiswa.sks.isnot(None),
            Mahasiswa.persen_dek.isnot(None)
        ).all()
        
        total_data = len(mahasiswa_with_status)
        
        if total_data < 10:
            # Return default jika data tidak cukup
            return {
                "fis": {
                    "total_data": 0,
                    "accuracy": 0.0,
                    "precision": 0.0,
                    "recall": 0.0,
                    "f1_score": 0.0,
                    "available": False
                },
                "saw": {
                    "total_data": 0,
                    "accuracy": 0.0,
                    "precision": 0.0,
                    "recall": 0.0,
                    "f1_score": 0.0,
                    "available": False
                }
            }
        
        # Evaluasi FIS dengan data aktual
        fis_result = None
        try:
            # Import di dalam try untuk menghindari circular import
            from routers.fuzzy import evaluate_fis_with_actual_status
            
            # Panggil fungsi evaluasi FIS langsung
            request_body = {}
            fis_evaluation = evaluate_fis_with_actual_status(
                request=request_body,
                db=db
            )
            
            if fis_evaluation and "result" in fis_evaluation:
                result = fis_evaluation["result"]
                metrics = result.get("metrics", {})
                evaluation_info = result.get("evaluation_info", {})
                fis_result = {
                    "total_data": evaluation_info.get("total_data", total_data),
                    "accuracy": round(float(metrics.get("accuracy", 0.0)) * 100, 2),
                    "precision": round(float(metrics.get("precision", 0.0)) * 100, 2),
                    "recall": round(float(metrics.get("recall", 0.0)) * 100, 2),
                    "f1_score": round(float(metrics.get("f1_score", 0.0)) * 100, 2),
                    "available": True
                }
        except Exception as e:
            print(f"Error evaluating FIS: {str(e)}")
            import traceback
            traceback.print_exc()
            fis_result = {
                "total_data": total_data,
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "available": False,
                "error": str(e)
            }
        
        # Evaluasi SAW dengan data aktual
        saw_result = None
        try:
            # Import di dalam try untuk menghindari circular import
            from routers.saw import evaluate_saw_actual, SAWEvaluationRequest
            
            saw_request = SAWEvaluationRequest(
                weights={"ipk": 0.35, "sks": 0.325, "dek": 0.325},
                test_size=1.0,  # Full data untuk evaluasi aktual
                random_state=42,
                save_to_db=False
            )
            
            saw_evaluation = evaluate_saw_actual(
                request=saw_request,
                db=db
            )
            
            if saw_evaluation and "evaluation" in saw_evaluation:
                eval_data = saw_evaluation["evaluation"]
                saw_result = {
                    "total_data": eval_data.get("test_data", total_data),
                    "accuracy": round(float(eval_data.get("accuracy", 0.0)) * 100, 2),
                    "precision": round(float(eval_data.get("precision", 0.0)) * 100, 2),
                    "recall": round(float(eval_data.get("recall", 0.0)) * 100, 2),
                    "f1_score": round(float(eval_data.get("f1_score", 0.0)) * 100, 2),
                    "available": True
                }
        except Exception as e:
            print(f"Error evaluating SAW: {str(e)}")
            import traceback
            traceback.print_exc()
            saw_result = {
                "total_data": total_data,
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "available": False,
                "error": str(e)
            }
        
        return {
            "fis": fis_result or {
                "total_data": total_data,
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "available": False
            },
            "saw": saw_result or {
                "total_data": total_data,
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "available": False
            }
        }
        
    except Exception as e:
        print(f"Error in get_evaluation_summary: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return default on error
        return {
            "fis": {
                "total_data": 0,
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "available": False,
                "error": str(e)
            },
            "saw": {
                "total_data": 0,
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "available": False,
                "error": str(e)
            }
        }

@router.get("/api/dashboard/comparison-summary")
def get_comparison_summary(db: Session = Depends(get_db)):
    """
    Mengambil ringkasan perbandingan FIS vs SAW untuk quick comparison di dashboard
    """
    try:
        # Import di dalam fungsi untuk menghindari circular import
        from routers.fuzzy import evaluate_fis_with_actual_status
        from routers.saw import evaluate_saw_actual, SAWEvaluationRequest
        
        # Ambil data mahasiswa dengan status lulus aktual
        mahasiswa_with_status = db.query(Mahasiswa).filter(
            Mahasiswa.status_lulus_aktual.in_(['LULUS_TINGGI', 'LULUS_SEDANG', 'LULUS_KECIL']),
            Mahasiswa.ipk.isnot(None),
            Mahasiswa.sks.isnot(None),
            Mahasiswa.persen_dek.isnot(None)
        ).all()
        
        total_data = len(mahasiswa_with_status)
        
        if total_data < 10:
            return {
                "consistency": 0.0,
                "correlation": 0.0,
                "accuracy_diff": 0.0,
                "fis_metrics": {
                    "accuracy": 0.0,
                    "precision": 0.0,
                    "recall": 0.0,
                    "f1_score": 0.0
                },
                "saw_metrics": {
                    "accuracy": 0.0,
                    "precision": 0.0,
                    "recall": 0.0,
                    "f1_score": 0.0
                },
                "fis_distribution": {
                    "Peluang Lulus Tinggi": 0,
                    "Peluang Lulus Sedang": 0,
                    "Peluang Lulus Kecil": 0
                },
                "saw_distribution": {
                    "Peluang Lulus Tinggi": 0,
                    "Peluang Lulus Sedang": 0,
                    "Peluang Lulus Kecil": 0
                },
                "available": False
            }
        
        # Evaluasi FIS
        fis_result = None
        fis_evaluation = None
        try:
            request_body = {}
            fis_evaluation = evaluate_fis_with_actual_status(
                request=request_body,
                db=db
            )
            
            if fis_evaluation and "result" in fis_evaluation:
                result = fis_evaluation["result"]
                metrics = result.get("metrics", {})
                fis_result = {
                    "accuracy": round(float(metrics.get("accuracy", 0.0)) * 100, 2),
                    "precision": round(float(metrics.get("precision", 0.0)) * 100, 2),
                    "recall": round(float(metrics.get("recall", 0.0)) * 100, 2),
                    "f1_score": round(float(metrics.get("f1_score", 0.0)) * 100, 2),
                    "full_data": result.get("full_data", [])
                }
        except Exception as e:
            print(f"Error evaluating FIS for comparison: {str(e)}")
            fis_result = None
        
        # Evaluasi SAW
        saw_result = None
        saw_evaluation = None
        try:
            saw_request = SAWEvaluationRequest(
                weights={"ipk": 0.35, "sks": 0.325, "dek": 0.325},
                test_size=1.0,
                random_state=42,
                save_to_db=False
            )
            
            saw_evaluation = evaluate_saw_actual(
                request=saw_request,
                db=db
            )
            
            if saw_evaluation and "evaluation" in saw_evaluation:
                eval_data = saw_evaluation["evaluation"]
                saw_result = {
                    "accuracy": round(float(eval_data.get("accuracy", 0.0)) * 100, 2),
                    "precision": round(float(eval_data.get("precision", 0.0)) * 100, 2),
                    "recall": round(float(eval_data.get("recall", 0.0)) * 100, 2),
                    "f1_score": round(float(eval_data.get("f1_score", 0.0)) * 100, 2),
                    "results": eval_data.get("results", [])
                }
        except Exception as e:
            print(f"Error evaluating SAW for comparison: {str(e)}")
            saw_result = None
        
        # Jika salah satu evaluasi gagal, return default
        if not fis_result or not saw_result:
            return {
                "consistency": 0.0,
                "correlation": 0.0,
                "accuracy_diff": 0.0,
                "fis_metrics": fis_result or {
                    "accuracy": 0.0,
                    "precision": 0.0,
                    "recall": 0.0,
                    "f1_score": 0.0
                },
                "saw_metrics": saw_result or {
                    "accuracy": 0.0,
                    "precision": 0.0,
                    "recall": 0.0,
                    "f1_score": 0.0
                },
                "fis_distribution": {
                    "Peluang Lulus Tinggi": 0,
                    "Peluang Lulus Sedang": 0,
                    "Peluang Lulus Kecil": 0
                },
                "saw_distribution": {
                    "Peluang Lulus Tinggi": 0,
                    "Peluang Lulus Sedang": 0,
                    "Peluang Lulus Kecil": 0
                },
                "available": False
            }
        
        # Hitung konsistensi dan korelasi
        fis_full_data = fis_result.get("full_data", [])
        saw_results = saw_result.get("results", [])
        
        # Buat map untuk lookup cepat
        saw_map = {}
        for item in saw_results:
            saw_map[item.get("nim")] = item
        
        # Hitung konsistensi (persentase hasil yang sama)
        consistent_count = 0
        total_comparison = 0
        
        # Data untuk korelasi ranking
        comparison_items = []
        
        for fis_item in fis_full_data:
            nim = fis_item.get("nim")
            saw_item = saw_map.get(nim)
            
            if saw_item:
                total_comparison += 1
                fis_category = fis_item.get("predicted_class") or fis_item.get("predicted_category")
                saw_category = saw_item.get("predicted_class") or saw_item.get("predicted_category")
                
                if fis_category == saw_category:
                    consistent_count += 1
                
                # Simpan untuk korelasi ranking
                fis_value = fis_item.get("final_value") or fis_item.get("fuzzy_score") or 0
                saw_value = saw_item.get("final_value") or saw_item.get("saw_score") or 0
                
                comparison_items.append({
                    "nim": nim,
                    "fis_value": float(fis_value),
                    "saw_value": float(saw_value) if saw_value <= 1 else float(saw_value) / 100
                })
        
        consistency = (consistent_count / total_comparison * 100) if total_comparison > 0 else 0.0
        
        # Hitung korelasi ranking (Spearman's)
        correlation = 0.0
        if len(comparison_items) > 1:
            # Sort by FIS value
            fis_sorted = sorted(comparison_items, key=lambda x: x["fis_value"], reverse=True)
            fis_rank_map = {item["nim"]: idx + 1 for idx, item in enumerate(fis_sorted)}
            
            # Sort by SAW value
            saw_sorted = sorted(comparison_items, key=lambda x: x["saw_value"], reverse=True)
            saw_rank_map = {item["nim"]: idx + 1 for idx, item in enumerate(saw_sorted)}
            
            # Calculate Spearman's correlation
            n = len(comparison_items)
            sum_d_squared = sum(
                (fis_rank_map[item["nim"]] - saw_rank_map[item["nim"]]) ** 2
                for item in comparison_items
            )
            
            correlation = 1 - (6 * sum_d_squared) / (n * (n * n - 1))
        
        # Hitung perbedaan akurasi
        accuracy_diff = fis_result["accuracy"] - saw_result["accuracy"]
        
        # Hitung distribusi klasifikasi
        fis_distribution = {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        }
        
        for item in fis_full_data:
            category = item.get("predicted_class") or item.get("predicted_category")
            if category in fis_distribution:
                fis_distribution[category] += 1
        
        saw_distribution = {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        }
        
        for item in saw_results:
            category = item.get("predicted_class") or item.get("predicted_category")
            if category in saw_distribution:
                saw_distribution[category] += 1
        
        return {
            "consistency": round(consistency, 2),
            "correlation": round(correlation, 3),
            "accuracy_diff": round(accuracy_diff, 2),
            "fis_metrics": {
                "accuracy": fis_result["accuracy"],
                "precision": fis_result["precision"],
                "recall": fis_result["recall"],
                "f1_score": fis_result["f1_score"]
            },
            "saw_metrics": {
                "accuracy": saw_result["accuracy"],
                "precision": saw_result["precision"],
                "recall": saw_result["recall"],
                "f1_score": saw_result["f1_score"]
            },
            "fis_distribution": fis_distribution,
            "saw_distribution": saw_distribution,
            "available": True
        }
        
    except Exception as e:
        print(f"Error in get_comparison_summary: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "consistency": 0.0,
            "correlation": 0.0,
            "accuracy_diff": 0.0,
            "fis_metrics": {
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0
            },
            "saw_metrics": {
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0
            },
            "fis_distribution": {
                "Peluang Lulus Tinggi": 0,
                "Peluang Lulus Sedang": 0,
                "Peluang Lulus Kecil": 0
            },
            "saw_distribution": {
                "Peluang Lulus Tinggi": 0,
                "Peluang Lulus Sedang": 0,
                "Peluang Lulus Kecil": 0
            },
            "available": False,
            "error": str(e)
        }

@router.get("/api/dashboard/actual-status-stats")
def get_actual_status_stats(db: Session = Depends(get_db)):
    """
    Mengambil statistik status lulus aktual dengan 3 kategori untuk dashboard
    """
    try:
        # Query untuk menghitung distribusi status lulus aktual
        status_stats = db.query(
            Mahasiswa.status_lulus_aktual,
            func.count().label("count")
        ).filter(
            Mahasiswa.status_lulus_aktual.in_(['LULUS_TINGGI', 'LULUS_SEDANG', 'LULUS_KECIL'])
        ).group_by(Mahasiswa.status_lulus_aktual).all()
        
        # Inisialisasi distribusi
        distribution = {
            "LULUS_TINGGI": 0,
            "LULUS_SEDANG": 0,
            "LULUS_KECIL": 0
        }
        
        # Update distribusi dari query results
        for status, count in status_stats:
            if status in distribution:
                distribution[status] = count
        
        # Hitung total
        total = sum(distribution.values())
        
        # Hitung persentase
        percentages = {}
        if total > 0:
            percentages = {
                status: round((count / total) * 100, 2)
                for status, count in distribution.items()
            }
        else:
            percentages = {status: 0.0 for status in distribution.keys()}
        
        # Untuk perbandingan dengan prediksi, kita perlu data evaluasi
        # Ambil sample data untuk perbandingan
        comparison_data = {
            "available": False,
            "fis_distribution": {
                "Peluang Lulus Tinggi": 0,
                "Peluang Lulus Sedang": 0,
                "Peluang Lulus Kecil": 0
            },
            "saw_distribution": {
                "Peluang Lulus Tinggi": 0,
                "Peluang Lulus Sedang": 0,
                "Peluang Lulus Kecil": 0
            }
        }
        
        # Coba ambil data evaluasi untuk perbandingan (optional, tidak wajib)
        try:
            from routers.fuzzy import evaluate_fis_with_actual_status
            from routers.saw import evaluate_saw_actual, SAWEvaluationRequest
            
            # Evaluasi FIS (quick, hanya untuk distribusi)
            fis_evaluation = evaluate_fis_with_actual_status(
                request={},
                db=db
            )
            
            if fis_evaluation and "result" in fis_evaluation:
                result = fis_evaluation["result"]
                full_data = result.get("full_data", [])
                
                # Hitung distribusi prediksi FIS
                fis_pred_dist = {
                    "Peluang Lulus Tinggi": 0,
                    "Peluang Lulus Sedang": 0,
                    "Peluang Lulus Kecil": 0
                }
                
                for item in full_data:
                    category = item.get("predicted_class") or item.get("predicted_category")
                    if category in fis_pred_dist:
                        fis_pred_dist[category] += 1
                
                comparison_data["fis_distribution"] = fis_pred_dist
                comparison_data["available"] = True
            
            # Evaluasi SAW (quick, hanya untuk distribusi)
            saw_request = SAWEvaluationRequest(
                weights={"ipk": 0.35, "sks": 0.325, "dek": 0.325},
                test_size=1.0,
                random_state=42,
                save_to_db=False
            )
            
            saw_evaluation = evaluate_saw_actual(
                request=saw_request,
                db=db
            )
            
            if saw_evaluation and "evaluation" in saw_evaluation:
                eval_data = saw_evaluation["evaluation"]
                results = eval_data.get("results", [])
                
                # Hitung distribusi prediksi SAW
                saw_pred_dist = {
                    "Peluang Lulus Tinggi": 0,
                    "Peluang Lulus Sedang": 0,
                    "Peluang Lulus Kecil": 0
                }
                
                for item in results:
                    category = item.get("predicted_class") or item.get("predicted_category")
                    if category in saw_pred_dist:
                        saw_pred_dist[category] += 1
                
                comparison_data["saw_distribution"] = saw_pred_dist
                comparison_data["available"] = True
                
        except Exception as e:
            print(f"Warning: Could not load comparison data: {str(e)}")
            # Comparison data tidak wajib, lanjutkan tanpa error
        
        return {
            "total": total,
            "distribution": distribution,
            "percentages": percentages,
            "comparison": comparison_data,
            "available": total > 0
        }
        
    except Exception as e:
        print(f"Error in get_actual_status_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "total": 0,
            "distribution": {
                "LULUS_TINGGI": 0,
                "LULUS_SEDANG": 0,
                "LULUS_KECIL": 0
            },
            "percentages": {
                "LULUS_TINGGI": 0.0,
                "LULUS_SEDANG": 0.0,
                "LULUS_KECIL": 0.0
            },
            "comparison": {
                "available": False,
                "fis_distribution": {
                    "Peluang Lulus Tinggi": 0,
                    "Peluang Lulus Sedang": 0,
                    "Peluang Lulus Kecil": 0
                },
                "saw_distribution": {
                    "Peluang Lulus Tinggi": 0,
                    "Peluang Lulus Sedang": 0,
                    "Peluang Lulus Kecil": 0
                }
            },
            "available": False,
            "error": str(e)
        } 