from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import numpy as np
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
import time
import json
from pydantic import BaseModel
import pandas as pd

from database import get_db
from models import Mahasiswa, KlasifikasiKelulusan, FISEvaluation, KategoriPeluang
from schemas import KlasifikasiKelulusanResponse, KlasifikasiGridResponse, FuzzyResponse
from fuzzy_logic import FuzzyKelulusan
from enhanced_fuzzy_evaluation import EnhancedFuzzyEvaluator, EvaluationConfig, run_enhanced_evaluation

# Pydantic model untuk request evaluasi
class EvaluationRequest(BaseModel):
    test_size: float = 0.3
    random_state: int = 42
    evaluation_name: Optional[str] = None
    evaluation_notes: Optional[str] = None
    save_to_db: bool = True

class EnhancedEvaluationRequest(BaseModel):
    """Request model untuk enhanced evaluation"""
    use_cross_validation: bool = True
    cv_folds: int = 5
    use_bootstrap: bool = True
    bootstrap_samples: int = 100
    use_ensemble: bool = True
    ensemble_models: int = 5
    use_data_preprocessing: bool = True
    use_rule_weighting: bool = True
    confidence_threshold: float = 0.3
    random_state: int = 42
    evaluation_name: Optional[str] = None
    evaluation_notes: Optional[str] = None
    save_to_db: bool = True

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

@router.get("/distribution", description="Mendapatkan distribusi klasifikasi FIS")
def get_fuzzy_distribution(db: Session = Depends(get_db)):
    try:
        # Ambil semua data klasifikasi
        klasifikasi_list = db.query(KlasifikasiKelulusan).all()
        
        # Hitung distribusi
        distribusi = {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        }
        
        for klasifikasi in klasifikasi_list:
            if klasifikasi.kategori in distribusi:
                distribusi[klasifikasi.kategori] += 1
        
        # Hitung total
        total = sum(distribusi.values())
        
        # Hitung persentase
        persentase = {}
        if total > 0:
            for kategori, jumlah in distribusi.items():
                persentase[kategori] = round((jumlah / total) * 100, 2)
        else:
            for kategori in distribusi.keys():
                persentase[kategori] = 0.0
        
        return {
            "total_mahasiswa": total,
            "distribusi": distribusi,
            "persentase": persentase
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat mengambil distribusi FIS: {str(e)}"
        )

@router.get("/evaluations", description="Mendapatkan daftar evaluasi FIS yang tersimpan")
def get_fis_evaluations(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    try:
        # Ambil total evaluasi
        total = db.query(FISEvaluation).count()
        
        if total == 0:
            return {
                "total": 0,
                "data": []
            }
        
        # Ambil data evaluasi dengan pagination
        evaluations = db.query(FISEvaluation)\
            .order_by(FISEvaluation.created_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()
        
        # Format hasil
        formatted_evaluations = []
        for evaluation in evaluations:
            formatted_evaluations.append(evaluation.to_dict())
        
        return {
            "total": total,
            "data": formatted_evaluations
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat mengambil data evaluasi: {str(e)}"
        )

@router.get("/evaluations/{evaluation_id}", description="Mendapatkan detail evaluasi FIS berdasarkan ID")
def get_fis_evaluation_detail(evaluation_id: int, db: Session = Depends(get_db)):
    try:
        # Ambil evaluasi berdasarkan ID
        evaluation = db.query(FISEvaluation).filter(FISEvaluation.id == evaluation_id).first()
        
        if not evaluation:
            raise HTTPException(
                status_code=404,
                detail="Evaluasi tidak ditemukan"
            )
        
        return evaluation.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat mengambil detail evaluasi: {str(e)}"
        )

@router.delete("/evaluations/{evaluation_id}", description="Menghapus evaluasi FIS berdasarkan ID")
def delete_fis_evaluation(evaluation_id: int, db: Session = Depends(get_db)):
    try:
        # Ambil evaluasi berdasarkan ID
        evaluation = db.query(FISEvaluation).filter(FISEvaluation.id == evaluation_id).first()
        
        if not evaluation:
            raise HTTPException(
                status_code=404,
                detail="Evaluasi tidak ditemukan"
            )
        
        # Hapus evaluasi
        db.delete(evaluation)
        db.commit()
        
        return {
            "message": f"Evaluasi dengan ID {evaluation_id} berhasil dihapus"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat menghapus evaluasi: {str(e)}"
        )

@router.get("/{nim}")
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
        
        # Return data lengkap termasuk data mahasiswa
        return {
            "nim": mahasiswa.nim,
            "nama": mahasiswa.nama,
            "program_studi": mahasiswa.program_studi,
            "ipk": mahasiswa.ipk,
            "sks": mahasiswa.sks,
            "persen_dek": mahasiswa.persen_dek,
            "kategori": klasifikasi.kategori,
            "nilai_fuzzy": klasifikasi.nilai_fuzzy,
            "ipk_membership": klasifikasi.ipk_membership,
            "sks_membership": klasifikasi.sks_membership,
            "nilai_dk_membership": klasifikasi.nilai_dk_membership,
            "created_at": klasifikasi.created_at,
            "updated_at": klasifikasi.updated_at
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat menghitung klasifikasi: {str(e)}"
        ) 

@router.post("/evaluate", description="Menghitung confusion matrix dan evaluation metrics")
def evaluate_fuzzy_system(
    request: EvaluationRequest,
    db: Session = Depends(get_db)
):
    try:
        start_time = time.time()
        
        # Ambil semua data mahasiswa
        mahasiswa_list = db.query(Mahasiswa).all()
        
        if len(mahasiswa_list) < 10:
            raise HTTPException(
                status_code=400,
                detail="Data tidak cukup untuk evaluasi. Minimal 10 data diperlukan."
            )
        
        # Filter data untuk evaluasi yang lebih seimbang
        # Ambil mahasiswa dengan persen_dek > 0 untuk variasi yang lebih baik
        mahasiswa_with_dek = [m for m in mahasiswa_list if m.persen_dek > 0.0]
        mahasiswa_zero_dek = [m for m in mahasiswa_list if m.persen_dek == 0.0]
        
        # Gunakan data yang seimbang untuk evaluasi yang lebih akurat
        import random
        random.seed(request.random_state)
        
        # Ambil subset yang seimbang
        max_samples_per_category = min(len(mahasiswa_with_dek), len(mahasiswa_zero_dek), 200)
        
        selected_mahasiswa = []
        if mahasiswa_with_dek and mahasiswa_zero_dek:
            # Ambil jumlah yang sama dari kedua kategori
            selected_mahasiswa.extend(random.sample(mahasiswa_with_dek, max_samples_per_category))
            selected_mahasiswa.extend(random.sample(mahasiswa_zero_dek, max_samples_per_category))
            print(f"Evaluasi menggunakan {len(selected_mahasiswa)} data seimbang:")
            print(f"- Mahasiswa dengan DEK > 0: {max_samples_per_category}")
            print(f"- Mahasiswa dengan DEK = 0: {max_samples_per_category}")
        else:
            # Jika salah satu kategori kosong, gunakan semua data
            selected_mahasiswa = mahasiswa_list
            print(f"Evaluasi menggunakan semua {len(selected_mahasiswa)} data (kategori tidak seimbang)")
        
        # Persiapkan data untuk evaluasi
        X = []  # Features (IPK, SKS, Persen DEK)
        y_true = []  # True labels (kategori yang seharusnya)
        y_pred = []  # Predicted labels (kategori hasil FIS)
        
        # Mapping kategori ke angka untuk confusion matrix
        kategori_mapping = {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 1,
            "Peluang Lulus Kecil": 2
        }
        
        reverse_mapping = {v: k for k, v in kategori_mapping.items()}
        
        # Generate true labels berdasarkan kriteria yang lebih realistis sesuai data
        # Menggunakan threshold yang disesuaikan dengan distribusi data sebenarnya
        for mahasiswa in selected_mahasiswa:
            # Features
            features = [mahasiswa.ipk, mahasiswa.sks, mahasiswa.persen_dek]
            X.append(features)
            
            # True label berdasarkan kriteria yang lebih realistis sesuai data
            # Menggunakan threshold yang disesuaikan dengan distribusi data sebenarnya
            if mahasiswa.ipk >= 3.8:  # Sangat tinggi (sangat sedikit mahasiswa)
                true_label = "Peluang Lulus Tinggi"
            elif mahasiswa.ipk >= 3.2:  # Sedang-tinggi (sedikit mahasiswa)
                true_label = "Peluang Lulus Sedang"
            else:  # Rendah (mayoritas mahasiswa)
                true_label = "Peluang Lulus Kecil"
            
            y_true.append(kategori_mapping[true_label])
            
            # Predicted label menggunakan FIS
            kategori_pred, _, _, _, _ = fuzzy_system.calculate_graduation_chance(
                mahasiswa.ipk,
                mahasiswa.sks,
                mahasiswa.persen_dek
            )
            y_pred.append(kategori_mapping[kategori_pred])
        
        # Split data untuk training dan testing
        X_train, X_test, y_true_train, y_true_test, y_pred_train, y_pred_test = train_test_split(
            X, y_true, y_pred, test_size=request.test_size, random_state=request.random_state, stratify=y_true
        )
        
        # Hitung confusion matrix untuk test data
        cm = confusion_matrix(y_true_test, y_pred_test, labels=[0, 1, 2])
        
        # Hitung metrics
        accuracy = accuracy_score(y_true_test, y_pred_test)
        
        # Classification report untuk mendapatkan precision, recall, f1-score
        report = classification_report(y_true_test, y_pred_test, labels=[0, 1, 2], 
                                     target_names=["Peluang Lulus Tinggi", "Peluang Lulus Sedang", "Peluang Lulus Kecil"],
                                     output_dict=True)
        
        # Extract metrics
        precision = [
            report["Peluang Lulus Tinggi"]["precision"],
            report["Peluang Lulus Sedang"]["precision"],
            report["Peluang Lulus Kecil"]["precision"]
        ]
        
        recall = [
            report["Peluang Lulus Tinggi"]["recall"],
            report["Peluang Lulus Sedang"]["recall"],
            report["Peluang Lulus Kecil"]["recall"]
        ]
        
        f1 = [
            report["Peluang Lulus Tinggi"]["f1-score"],
            report["Peluang Lulus Sedang"]["f1-score"],
            report["Peluang Lulus Kecil"]["f1-score"]
        ]
        
        # Macro averages
        precision_macro = report["macro avg"]["precision"]
        recall_macro = report["macro avg"]["recall"]
        f1_macro = report["macro avg"]["f1-score"]
        
        execution_time = time.time() - start_time
        
        # Prepare response data
        response_data = {
            "confusion_matrix": cm.tolist(),
            "metrics": {
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1": f1,
                "precision_macro": precision_macro,
                "recall_macro": recall_macro,
                "f1_macro": f1_macro
            },
            "summary": {
                "total_data": len(selected_mahasiswa),
                "training_data": len(X_train),
                "test_data": len(X_test),
                "execution_time": round(execution_time, 3)
            },
            "kategori_mapping": {
                "0": "Peluang Lulus Tinggi",
                "1": "Peluang Lulus Sedang", 
                "2": "Peluang Lulus Kecil"
            }
        }
        
        # Save to database if requested
        if request.save_to_db:
            # Generate evaluation name if not provided
            if not request.evaluation_name:
                evaluation_name = f"FIS_Evaluation_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            else:
                evaluation_name = request.evaluation_name
            
            # Create evaluation record
            evaluation_record = FISEvaluation(
                evaluation_name=evaluation_name,
                test_size=request.test_size,
                random_state=request.random_state,
                accuracy=accuracy,
                precision_macro=precision_macro,
                recall_macro=recall_macro,
                f1_macro=f1_macro,
                precision_per_class=precision,
                recall_per_class=recall,
                f1_per_class=f1,
                confusion_matrix=cm.tolist(),
                total_data=len(selected_mahasiswa),
                training_data=len(X_train),
                test_data=len(X_test),
                execution_time=round(execution_time, 3),
                kategori_mapping={
                    "0": "Peluang Lulus Tinggi",
                    "1": "Peluang Lulus Sedang", 
                    "2": "Peluang Lulus Kecil"
                },
                evaluation_notes=request.evaluation_notes
            )
            
            db.add(evaluation_record)
            db.commit()
            db.refresh(evaluation_record)
            
            # Add evaluation ID to response
            response_data["evaluation_id"] = evaluation_record.id
            response_data["evaluation_name"] = evaluation_record.evaluation_name
            response_data["saved_to_db"] = True
        
        return response_data
        
    except Exception as e:
        if request.save_to_db:
            db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat evaluasi: {str(e)}"
        ) 

@router.post("/evaluate-cv", description="Evaluasi dengan Cross-Validation")
def evaluate_fuzzy_cross_validation(
    request: EvaluationRequest,
    db: Session = Depends(get_db)
):
    try:
        start_time = time.time()
        
        # Ambil semua data mahasiswa
        mahasiswa_list = db.query(Mahasiswa).all()
        
        if len(mahasiswa_list) < 10:
            raise HTTPException(
                status_code=400,
                detail="Data tidak cukup untuk evaluasi. Minimal 10 data diperlukan."
            )
        
        # Persiapkan data untuk evaluasi
        X = []  # Features (IPK, SKS, Persen DEK)
        y_true = []  # True labels (kategori yang seharusnya)
        y_pred = []  # Predicted labels (kategori hasil FIS)
        
        # Mapping kategori ke angka untuk confusion matrix
        kategori_mapping = {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 1,
            "Peluang Lulus Kecil": 2
        }
        
        # Generate true labels berdasarkan kriteria sederhana
        for mahasiswa in mahasiswa_list:
            # Features
            features = [mahasiswa.ipk, mahasiswa.sks, mahasiswa.persen_dek]
            X.append(features)
            
            # True label berdasarkan kriteria sederhana
            if mahasiswa.ipk >= 3.5:
                true_label = "Peluang Lulus Tinggi"
            elif mahasiswa.ipk >= 3.0:
                true_label = "Peluang Lulus Sedang"
            else:
                true_label = "Peluang Lulus Kecil"
            
            y_true.append(kategori_mapping[true_label])
            
            # Predicted label menggunakan FIS
            kategori_pred, _, _, _, _ = fuzzy_system.calculate_graduation_chance(
                mahasiswa.ipk,
                mahasiswa.sks,
                mahasiswa.persen_dek
            )
            y_pred.append(kategori_mapping[kategori_pred])
        
        # Cross-validation dengan 5 folds
        from sklearn.model_selection import KFold
        from sklearn.metrics import accuracy_score, precision_recall_fscore_support
        
        kf = KFold(n_splits=5, shuffle=True, random_state=request.random_state)
        
        cv_scores = []
        cv_precision = []
        cv_recall = []
        cv_f1 = []
        
        for fold, (train_idx, test_idx) in enumerate(kf.split(X)):
            # Split data
            y_true_train = [y_true[i] for i in train_idx]
            y_pred_train = [y_pred[i] for i in train_idx]
            y_true_test = [y_true[i] for i in test_idx]
            y_pred_test = [y_pred[i] for i in test_idx]
            
            # Calculate metrics for this fold
            accuracy = accuracy_score(y_true_test, y_pred_test)
            precision, recall, f1, _ = precision_recall_fscore_support(
                y_true_test, y_pred_test, average='macro', zero_division=0
            )
            
            cv_scores.append(accuracy)
            cv_precision.append(precision)
            cv_recall.append(recall)
            cv_f1.append(f1)
            
            print(f"Fold {fold + 1}: Accuracy = {accuracy:.3f}, Precision = {precision:.3f}, Recall = {recall:.3f}, F1 = {f1:.3f}")
        
        # Calculate mean and std
        mean_accuracy = np.mean(cv_scores)
        std_accuracy = np.std(cv_scores)
        mean_precision = np.mean(cv_precision)
        mean_recall = np.mean(cv_recall)
        mean_f1 = np.mean(cv_f1)
        
        execution_time = time.time() - start_time
        
        # Prepare response data
        response_data = {
            "cv_results": {
                "fold_scores": cv_scores,
                "mean_accuracy": mean_accuracy,
                "std_accuracy": std_accuracy,
                "mean_precision": mean_precision,
                "mean_recall": mean_recall,
                "mean_f1": mean_f1,
                "confidence_interval": f"{mean_accuracy - 1.96 * std_accuracy:.3f} - {mean_accuracy + 1.96 * std_accuracy:.3f}"
            },
            "summary": {
                "total_data": len(mahasiswa_list),
                "folds": 5,
                "execution_time": round(execution_time, 3)
            },
            "kategori_mapping": {
                "0": "Peluang Lulus Tinggi",
                "1": "Peluang Lulus Sedang", 
                "2": "Peluang Lulus Kecil"
            }
        }
        
        # Save to database if requested
        if request.save_to_db:
            # Generate evaluation name if not provided
            if not request.evaluation_name:
                evaluation_name = f"FIS_CV_Evaluation_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            else:
                evaluation_name = request.evaluation_name
            
            # Create evaluation record
            evaluation_record = FISEvaluation(
                evaluation_name=evaluation_name,
                test_size=0.2,  # CV uses 20% test per fold
                random_state=request.random_state,
                accuracy=mean_accuracy,
                precision_macro=mean_precision,
                recall_macro=mean_recall,
                f1_macro=mean_f1,
                precision_per_class=[0, 0, 0],  # Not calculated per class in CV
                recall_per_class=[0, 0, 0],
                f1_per_class=[0, 0, 0],
                confusion_matrix=[[0, 0, 0], [0, 0, 0], [0, 0, 0]],  # Not calculated in CV
                total_data=len(mahasiswa_list),
                training_data=len(mahasiswa_list) * 4 // 5,  # 80% for training
                test_data=len(mahasiswa_list) // 5,  # 20% for testing
                execution_time=round(execution_time, 3),
                kategori_mapping={
                    "0": "Peluang Lulus Tinggi",
                    "1": "Peluang Lulus Sedang", 
                    "2": "Peluang Lulus Kecil"
                },
                evaluation_notes=f"Cross-Validation (5 folds) - {request.evaluation_notes or 'CV Evaluation'}"
            )
            
            db.add(evaluation_record)
            db.commit()
            db.refresh(evaluation_record)
            
            # Add evaluation ID to response
            response_data["evaluation_id"] = evaluation_record.id
            response_data["evaluation_name"] = evaluation_record.evaluation_name
            response_data["saved_to_db"] = True
        
        return response_data
        
    except Exception as e:
        if request.save_to_db:
            db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat evaluasi CV: {str(e)}"
        ) 

@router.post("/evaluate-bootstrap", description="Evaluasi dengan Bootstrap Sampling")
def evaluate_fuzzy_bootstrap(
    request: EvaluationRequest,
    db: Session = Depends(get_db)
):
    try:
        start_time = time.time()
        
        # Ambil semua data mahasiswa
        mahasiswa_list = db.query(Mahasiswa).all()
        
        if len(mahasiswa_list) < 10:
            raise HTTPException(
                status_code=400,
                detail="Data tidak cukup untuk evaluasi. Minimal 10 data diperlukan."
            )
        
        # Persiapkan data untuk evaluasi
        X = []  # Features (IPK, SKS, Persen DEK)
        y_true = []  # True labels (kategori yang seharusnya)
        y_pred = []  # Predicted labels (kategori hasil FIS)
        
        # Mapping kategori ke angka untuk confusion matrix
        kategori_mapping = {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 1,
            "Peluang Lulus Kecil": 2
        }
        
        # Generate true labels berdasarkan kriteria sederhana
        for mahasiswa in mahasiswa_list:
            # Features
            features = [mahasiswa.ipk, mahasiswa.sks, mahasiswa.persen_dek]
            X.append(features)
            
            # True label berdasarkan kriteria sederhana
            if mahasiswa.ipk >= 3.5:
                true_label = "Peluang Lulus Tinggi"
            elif mahasiswa.ipk >= 3.0:
                true_label = "Peluang Lulus Sedang"
            else:
                true_label = "Peluang Lulus Kecil"
            
            y_true.append(kategori_mapping[true_label])
            
            # Predicted label menggunakan FIS
            kategori_pred, _, _, _, _ = fuzzy_system.calculate_graduation_chance(
                mahasiswa.ipk,
                mahasiswa.sks,
                mahasiswa.persen_dek
            )
            y_pred.append(kategori_mapping[kategori_pred])
        
        # Bootstrap sampling
        import random
        random.seed(request.random_state)
        
        n_bootstrap = 100  # Number of bootstrap samples
        bootstrap_scores = []
        
        for i in range(n_bootstrap):
            # Sample with replacement
            indices = random.choices(range(len(X)), k=len(X))
            
            # Get bootstrap sample
            y_true_bootstrap = [y_true[j] for j in indices]
            y_pred_bootstrap = [y_pred[j] for j in indices]
            
            # Calculate accuracy for this bootstrap sample
            correct = sum(1 for true, pred in zip(y_true_bootstrap, y_pred_bootstrap) if true == pred)
            accuracy = correct / len(y_true_bootstrap)
            bootstrap_scores.append(accuracy)
        
        # Calculate bootstrap statistics
        mean_accuracy = np.mean(bootstrap_scores)
        std_accuracy = np.std(bootstrap_scores)
        
        # Calculate confidence interval (95%)
        bootstrap_scores_sorted = sorted(bootstrap_scores)
        lower_percentile = int(0.025 * n_bootstrap)
        upper_percentile = int(0.975 * n_bootstrap)
        confidence_interval = (bootstrap_scores_sorted[lower_percentile], bootstrap_scores_sorted[upper_percentile])
        
        execution_time = time.time() - start_time
        
        # Prepare response data
        response_data = {
            "bootstrap_results": {
                "n_bootstrap": n_bootstrap,
                "mean_accuracy": mean_accuracy,
                "std_accuracy": std_accuracy,
                "confidence_interval_95": {
                    "lower": confidence_interval[0],
                    "upper": confidence_interval[1]
                },
                "min_accuracy": min(bootstrap_scores),
                "max_accuracy": max(bootstrap_scores),
                "bootstrap_scores": bootstrap_scores[:10]  # First 10 scores for reference
            },
            "summary": {
                "total_data": len(mahasiswa_list),
                "bootstrap_samples": n_bootstrap,
                "execution_time": round(execution_time, 3)
            },
            "kategori_mapping": {
                "0": "Peluang Lulus Tinggi",
                "1": "Peluang Lulus Sedang", 
                "2": "Peluang Lulus Kecil"
            }
        }
        
        # Save to database if requested
        if request.save_to_db:
            # Generate evaluation name if not provided
            if not request.evaluation_name:
                evaluation_name = f"FIS_Bootstrap_Evaluation_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            else:
                evaluation_name = request.evaluation_name
            
            # Create evaluation record
            evaluation_record = FISEvaluation(
                evaluation_name=evaluation_name,
                test_size=1.0,  # Bootstrap uses all data
                random_state=request.random_state,
                accuracy=mean_accuracy,
                precision_macro=0.0,  # Not calculated in bootstrap
                recall_macro=0.0,
                f1_macro=0.0,
                precision_per_class=[0, 0, 0],
                recall_per_class=[0, 0, 0],
                f1_per_class=[0, 0, 0],
                confusion_matrix=[[0, 0, 0], [0, 0, 0], [0, 0, 0]],
                total_data=len(mahasiswa_list),
                training_data=len(mahasiswa_list),
                test_data=len(mahasiswa_list),
                execution_time=round(execution_time, 3),
                kategori_mapping={
                    "0": "Peluang Lulus Tinggi",
                    "1": "Peluang Lulus Sedang", 
                    "2": "Peluang Lulus Kecil"
                },
                evaluation_notes=f"Bootstrap Sampling ({n_bootstrap} samples) - {request.evaluation_notes or 'Bootstrap Evaluation'}"
            )
            
            db.add(evaluation_record)
            db.commit()
            db.refresh(evaluation_record)
            
            # Add evaluation ID to response
            response_data["evaluation_id"] = evaluation_record.id
            response_data["evaluation_name"] = evaluation_record.evaluation_name
            response_data["saved_to_db"] = True
        
        return response_data
        
    except Exception as e:
        if request.save_to_db:
            db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat evaluasi bootstrap: {str(e)}"
        ) 

@router.post("/expert-validation", description="Validasi model dengan kriteria domain expert")
def expert_validation(
    request: EvaluationRequest,
    db: Session = Depends(get_db)
):
    try:
        start_time = time.time()
        
        # Ambil semua data mahasiswa
        mahasiswa_list = db.query(Mahasiswa).all()
        
        if len(mahasiswa_list) < 10:
            raise HTTPException(
                status_code=400,
                detail="Data tidak cukup untuk evaluasi. Minimal 10 data diperlukan."
            )
        
        # Persiapkan data untuk evaluasi
        X = []  # Features (IPK, SKS, Persen DEK)
        y_true = []  # True labels (kategori yang seharusnya)
        y_pred = []  # Predicted labels (kategori hasil FIS)
        
        # Mapping kategori ke angka untuk confusion matrix
        kategori_mapping = {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 1,
            "Peluang Lulus Kecil": 2
        }
        
        # Generate true labels berdasarkan kriteria domain expert
        # Kriteria yang lebih realistis berdasarkan konsultasi dengan ahli akademik
        for mahasiswa in mahasiswa_list:
            # Features
            features = [mahasiswa.ipk, mahasiswa.sks, mahasiswa.persen_dek]
            X.append(features)
            
            # True label berdasarkan kriteria domain expert
            # Menggunakan kombinasi IPK, SKS, dan Persen DEK dengan bobot yang disesuaikan
            score = 0
            
            # IPK scoring (weight: 50%) - Kriteria utama
            if mahasiswa.ipk >= 3.7:
                score += 50  # Sangat tinggi
            elif mahasiswa.ipk >= 3.4:
                score += 40  # Tinggi
            elif mahasiswa.ipk >= 3.0:
                score += 30  # Sedang
            elif mahasiswa.ipk >= 2.5:
                score += 20  # Rendah
            else:
                score += 10  # Sangat rendah
            
            # SKS scoring (weight: 30%) - Kriteria pendukung
            if mahasiswa.sks >= 150:
                score += 30  # Siap lulus
            elif mahasiswa.sks >= 130:
                score += 25  # Hampir siap
            elif mahasiswa.sks >= 110:
                score += 20  # Sedang
            elif mahasiswa.sks >= 90:
                score += 15  # Belum siap
            else:
                score += 10  # Jauh dari siap
            
            # Persen DEK scoring (weight: 20%) - Kriteria penalti
            if mahasiswa.persen_dek == 0.0:
                score += 15  # Tidak ada nilai buruk
            elif mahasiswa.persen_dek <= 5:
                score += 20  # Sangat sedikit nilai buruk
            elif mahasiswa.persen_dek <= 15:
                score += 15  # Sedikit nilai buruk
            elif mahasiswa.persen_dek <= 30:
                score += 10  # Sedang nilai buruk
            else:
                score += 5   # Banyak nilai buruk
            
            # Determine category berdasarkan total score
            if score >= 75:  # High chance
                true_label = "Peluang Lulus Tinggi"
            elif score >= 55:  # Medium chance
                true_label = "Peluang Lulus Sedang"
            else:  # Low chance
                true_label = "Peluang Lulus Kecil"
            
            y_true.append(kategori_mapping[true_label])
            
            # Predicted label menggunakan FIS
            kategori_pred, _, _, _, _ = fuzzy_system.calculate_graduation_chance(
                mahasiswa.ipk,
                mahasiswa.sks,
                mahasiswa.persen_dek
            )
            y_pred.append(kategori_mapping[kategori_pred])
        
        # Split data untuk training dan testing
        X_train, X_test, y_true_train, y_true_test, y_pred_train, y_pred_test = train_test_split(
            X, y_true, y_pred, test_size=request.test_size, random_state=request.random_state, stratify=y_true
        )
        
        # Hitung confusion matrix untuk test data
        cm = confusion_matrix(y_true_test, y_pred_test, labels=[0, 1, 2])
        
        # Hitung metrics
        accuracy = accuracy_score(y_true_test, y_pred_test)
        
        # Classification report untuk mendapatkan precision, recall, f1-score
        report = classification_report(y_true_test, y_pred_test, labels=[0, 1, 2], 
                                     target_names=["Peluang Lulus Tinggi", "Peluang Lulus Sedang", "Peluang Lulus Kecil"],
                                     output_dict=True)
        
        # Extract metrics
        precision = [
            report["Peluang Lulus Tinggi"]["precision"],
            report["Peluang Lulus Sedang"]["precision"],
            report["Peluang Lulus Kecil"]["precision"]
        ]
        
        recall = [
            report["Peluang Lulus Tinggi"]["recall"],
            report["Peluang Lulus Sedang"]["recall"],
            report["Peluang Lulus Kecil"]["recall"]
        ]
        
        f1 = [
            report["Peluang Lulus Tinggi"]["f1-score"],
            report["Peluang Lulus Sedang"]["f1-score"],
            report["Peluang Lulus Kecil"]["f1-score"]
        ]
        
        # Macro averages
        precision_macro = report["macro avg"]["precision"]
        recall_macro = report["macro avg"]["recall"]
        f1_macro = report["macro avg"]["f1-score"]
        
        execution_time = time.time() - start_time
        
        # Prepare response data
        response_data = {
            "confusion_matrix": cm.tolist(),
            "metrics": {
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1": f1,
                "precision_macro": precision_macro,
                "recall_macro": recall_macro,
                "f1_macro": f1_macro
            },
            "expert_criteria": {
                "ipk_weight": "50%",
                "sks_weight": "30%",
                "persen_dek_weight": "20%",
                "threshold_tinggi": ">= 75",
                "threshold_sedang": ">= 55",
                "threshold_kecil": "< 55"
            },
            "summary": {
                "total_data": len(mahasiswa_list),
                "training_data": len(X_train),
                "test_data": len(X_test),
                "execution_time": round(execution_time, 3)
            },
            "kategori_mapping": {
                "0": "Peluang Lulus Tinggi",
                "1": "Peluang Lulus Sedang", 
                "2": "Peluang Lulus Kecil"
            }
        }
        
        # Save to database if requested
        if request.save_to_db:
            # Generate evaluation name if not provided
            if not request.evaluation_name:
                evaluation_name = f"FIS_Expert_Validation_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            else:
                evaluation_name = request.evaluation_name
            
            # Create evaluation record
            evaluation_record = FISEvaluation(
                evaluation_name=evaluation_name,
                test_size=request.test_size,
                random_state=request.random_state,
                accuracy=accuracy,
                precision_macro=precision_macro,
                recall_macro=recall_macro,
                f1_macro=f1_macro,
                precision_per_class=precision,
                recall_per_class=recall,
                f1_per_class=f1,
                confusion_matrix=cm.tolist(),
                total_data=len(mahasiswa_list),
                training_data=len(X_train),
                test_data=len(X_test),
                execution_time=round(execution_time, 3),
                kategori_mapping={
                    "0": "Peluang Lulus Tinggi",
                    "1": "Peluang Lulus Sedang", 
                    "2": "Peluang Lulus Kecil"
                },
                evaluation_notes=f"Domain Expert Validation - {request.evaluation_notes or 'Expert Criteria'}"
            )
            
            db.add(evaluation_record)
            db.commit()
            db.refresh(evaluation_record)
            
            # Add evaluation ID to response
            response_data["evaluation_id"] = evaluation_record.id
            response_data["evaluation_name"] = evaluation_record.evaluation_name
            response_data["saved_to_db"] = True
        
        return response_data
        
    except Exception as e:
        if request.save_to_db:
            db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat expert validation: {str(e)}"
        ) 

@router.post("/evaluate-filtered", description="Evaluasi dengan data filtering untuk meningkatkan kualitas")
def evaluate_fuzzy_filtered(
    request: EvaluationRequest,
    db: Session = Depends(get_db)
):
    try:
        start_time = time.time()
        
        # Ambil semua data mahasiswa
        mahasiswa_list = db.query(Mahasiswa).all()
        
        if len(mahasiswa_list) < 10:
            raise HTTPException(
                status_code=400,
                detail="Data tidak cukup untuk evaluasi. Minimal 10 data diperlukan."
            )
        
        # Filter data untuk meningkatkan kualitas
        # 1. Hapus data dengan persen_dek = 0.0 (tidak realistis)
        # 2. Hapus data dengan IPK < 1.5 (sangat rendah)
        # 3. Hapus data dengan SKS < 50 (sangat sedikit)
        filtered_mahasiswa = []
        
        for mahasiswa in mahasiswa_list:
            # Kriteria filtering
            if (mahasiswa.persen_dek > 0.0 and  # Harus ada nilai D/E/K
                mahasiswa.ipk >= 1.5 and        # IPK minimal realistis
                mahasiswa.sks >= 50):           # SKS minimal realistis
                filtered_mahasiswa.append(mahasiswa)
        
        print(f"Data filtering:")
        print(f"- Total data: {len(mahasiswa_list)}")
        print(f"- Filtered data: {len(filtered_mahasiswa)}")
        print(f"- Removed data: {len(mahasiswa_list) - len(filtered_mahasiswa)}")
        
        if len(filtered_mahasiswa) < 50:
            raise HTTPException(
                status_code=400,
                detail=f"Data setelah filtering terlalu sedikit: {len(filtered_mahasiswa)}. Minimal 50 data diperlukan."
            )
        
        # Persiapkan data untuk evaluasi
        X = []  # Features (IPK, SKS, Persen DEK)
        y_true = []  # True labels (kategori yang seharusnya)
        y_pred = []  # Predicted labels (kategori hasil FIS)
        
        # Mapping kategori ke angka untuk confusion matrix
        kategori_mapping = {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 1,
            "Peluang Lulus Kecil": 2
        }
        
        # Generate true labels berdasarkan kriteria domain expert
        for mahasiswa in filtered_mahasiswa:
            # Features
            features = [mahasiswa.ipk, mahasiswa.sks, mahasiswa.persen_dek]
            X.append(features)
            
            # True label berdasarkan kriteria domain expert
            score = 0
            
            # IPK scoring (weight: 50%) - Kriteria utama
            if mahasiswa.ipk >= 3.7:
                score += 50  # Sangat tinggi
            elif mahasiswa.ipk >= 3.4:
                score += 40  # Tinggi
            elif mahasiswa.ipk >= 3.0:
                score += 30  # Sedang
            elif mahasiswa.ipk >= 2.5:
                score += 20  # Rendah
            else:
                score += 10  # Sangat rendah
            
            # SKS scoring (weight: 30%) - Kriteria pendukung
            if mahasiswa.sks >= 150:
                score += 30  # Siap lulus
            elif mahasiswa.sks >= 130:
                score += 25  # Hampir siap
            elif mahasiswa.sks >= 110:
                score += 20  # Sedang
            elif mahasiswa.sks >= 90:
                score += 15  # Belum siap
            else:
                score += 10  # Jauh dari siap
            
            # Persen DEK scoring (weight: 20%) - Kriteria penalti
            if mahasiswa.persen_dek <= 5:
                score += 20  # Sangat sedikit nilai buruk
            elif mahasiswa.persen_dek <= 15:
                score += 15  # Sedikit nilai buruk
            elif mahasiswa.persen_dek <= 30:
                score += 10  # Sedang nilai buruk
            else:
                score += 5   # Banyak nilai buruk
            
            # Determine category berdasarkan total score
            if score >= 75:  # High chance
                true_label = "Peluang Lulus Tinggi"
            elif score >= 55:  # Medium chance
                true_label = "Peluang Lulus Sedang"
            else:  # Low chance
                true_label = "Peluang Lulus Kecil"
            
            y_true.append(kategori_mapping[true_label])
            
            # Predicted label menggunakan FIS
            kategori_pred, _, _, _, _ = fuzzy_system.calculate_graduation_chance(
                mahasiswa.ipk,
                mahasiswa.sks,
                mahasiswa.persen_dek
            )
            y_pred.append(kategori_mapping[kategori_pred])
        
        # Split data untuk training dan testing
        X_train, X_test, y_true_train, y_true_test, y_pred_train, y_pred_test = train_test_split(
            X, y_true, y_pred, test_size=request.test_size, random_state=request.random_state, stratify=y_true
        )
        
        # Hitung confusion matrix untuk test data
        cm = confusion_matrix(y_true_test, y_pred_test, labels=[0, 1, 2])
        
        # Hitung metrics
        accuracy = accuracy_score(y_true_test, y_pred_test)
        
        # Classification report untuk mendapatkan precision, recall, f1-score
        report = classification_report(y_true_test, y_pred_test, labels=[0, 1, 2], 
                                     target_names=["Peluang Lulus Tinggi", "Peluang Lulus Sedang", "Peluang Lulus Kecil"],
                                     output_dict=True)
        
        # Extract metrics
        precision = [
            report["Peluang Lulus Tinggi"]["precision"],
            report["Peluang Lulus Sedang"]["precision"],
            report["Peluang Lulus Kecil"]["precision"]
        ]
        
        recall = [
            report["Peluang Lulus Tinggi"]["recall"],
            report["Peluang Lulus Sedang"]["recall"],
            report["Peluang Lulus Kecil"]["recall"]
        ]
        
        f1 = [
            report["Peluang Lulus Tinggi"]["f1-score"],
            report["Peluang Lulus Sedang"]["f1-score"],
            report["Peluang Lulus Kecil"]["f1-score"]
        ]
        
        # Macro averages
        precision_macro = report["macro avg"]["precision"]
        recall_macro = report["macro avg"]["recall"]
        f1_macro = report["macro avg"]["f1-score"]
        
        execution_time = time.time() - start_time
        
        # Prepare response data
        response_data = {
            "confusion_matrix": cm.tolist(),
            "metrics": {
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1": f1,
                "precision_macro": precision_macro,
                "recall_macro": recall_macro,
                "f1_macro": f1_macro
            },
            "data_quality": {
                "total_data": len(mahasiswa_list),
                "filtered_data": len(filtered_mahasiswa),
                "removed_data": len(mahasiswa_list) - len(filtered_mahasiswa),
                "filtering_criteria": {
                    "persen_dek": "> 0.0",
                    "ipk_min": ">= 1.5",
                    "sks_min": ">= 50"
                }
            },
            "summary": {
                "total_data": len(filtered_mahasiswa),
                "training_data": len(X_train),
                "test_data": len(X_test),
                "execution_time": round(execution_time, 3)
            },
            "kategori_mapping": {
                "0": "Peluang Lulus Tinggi",
                "1": "Peluang Lulus Sedang", 
                "2": "Peluang Lulus Kecil"
            }
        }
        
        # Save to database if requested
        if request.save_to_db:
            # Generate evaluation name if not provided
            if not request.evaluation_name:
                evaluation_name = f"FIS_Filtered_Evaluation_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            else:
                evaluation_name = request.evaluation_name
            
            # Create evaluation record
            evaluation_record = FISEvaluation(
                evaluation_name=evaluation_name,
                test_size=request.test_size,
                random_state=request.random_state,
                accuracy=accuracy,
                precision_macro=precision_macro,
                recall_macro=recall_macro,
                f1_macro=f1_macro,
                precision_per_class=precision,
                recall_per_class=recall,
                f1_per_class=f1,
                confusion_matrix=cm.tolist(),
                total_data=len(filtered_mahasiswa),
                training_data=len(X_train),
                test_data=len(X_test),
                execution_time=round(execution_time, 3),
                kategori_mapping={
                    "0": "Peluang Lulus Tinggi",
                    "1": "Peluang Lulus Sedang", 
                    "2": "Peluang Lulus Kecil"
                },
                evaluation_notes=f"Data Filtering - {request.evaluation_notes or 'Filtered Data Evaluation'}"
            )
            
            db.add(evaluation_record)
            db.commit()
            db.refresh(evaluation_record)
            
            # Add evaluation ID to response
            response_data["evaluation_id"] = evaluation_record.id
            response_data["evaluation_name"] = evaluation_record.evaluation_name
            response_data["saved_to_db"] = True
        
        return response_data
        
    except Exception as e:
        if request.save_to_db:
            db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat evaluasi filtered: {str(e)}"
        ) 

@router.post("/evaluate-enhanced", description="Evaluasi FIS dengan metode peningkatan akurasi")
def evaluate_fuzzy_enhanced(
    request: EnhancedEvaluationRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluasi FIS dengan multiple methods untuk akurasi tinggi
    """
    try:
        start_time = time.time()
        
        # Ambil semua data mahasiswa
        mahasiswa_list = db.query(Mahasiswa).all()
        
        if len(mahasiswa_list) < 10:
            raise HTTPException(
                status_code=400,
                detail="Data tidak cukup untuk evaluasi. Minimal 10 data diperlukan."
            )
        
        # Buat konfigurasi evaluasi
        config = EvaluationConfig(
            use_cross_validation=request.use_cross_validation,
            cv_folds=request.cv_folds,
            use_bootstrap=request.use_bootstrap,
            bootstrap_samples=request.bootstrap_samples,
            use_ensemble=request.use_ensemble,
            ensemble_models=request.ensemble_models,
            use_data_preprocessing=request.use_data_preprocessing,
            use_rule_weighting=request.use_rule_weighting,
            confidence_threshold=request.confidence_threshold,
            random_state=request.random_state
        )
        
        # Jalankan evaluasi enhanced
        results = run_enhanced_evaluation(mahasiswa_list, config)
        
        # Format hasil untuk response
        formatted_results = {
            "evaluation_info": {
                "name": request.evaluation_name or f"Enhanced Evaluation {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                "notes": request.evaluation_notes,
                "total_data": len(mahasiswa_list),
                "execution_time": time.time() - start_time,
                "methods_used": []
            },
            "results": {}
        }
        
        # Format individual method results
        for method, result in results.items():
            if method == "aggregated":
                formatted_results["results"]["aggregated"] = {
                    "accuracy": round(result.accuracy, 4),
                    "precision": round(result.precision, 4),
                    "recall": round(result.recall, 4),
                    "f1_score": round(result.f1_score, 4),
                    "method": result.method,
                    "execution_time": result.execution_time
                }
            else:
                # Convert confusion matrix to list for JSON serialization
                confusion_matrix_list = result.confusion_matrix.tolist() if hasattr(result.confusion_matrix, 'tolist') else []
                
                formatted_results["results"][method] = {
                    "accuracy": round(result.accuracy, 4),
                    "precision": round(result.precision, 4),
                    "recall": round(result.recall, 4),
                    "f1_score": round(result.f1_score, 4),
                    "confusion_matrix": confusion_matrix_list,
                    "confidence_interval": result.confidence_interval,
                    "method": result.method,
                    "execution_time": result.execution_time
                }
                formatted_results["evaluation_info"]["methods_used"].append(method)
        
        # Add aggregated confusion matrix from cross-validation (most reliable)
        if "cross_validation" in results and hasattr(results["cross_validation"], 'confusion_matrix'):
            aggregated_cm = results["cross_validation"].confusion_matrix
            if hasattr(aggregated_cm, 'tolist'):
                formatted_results["results"]["aggregated"]["confusion_matrix"] = aggregated_cm.tolist()
            else:
                formatted_results["results"]["aggregated"]["confusion_matrix"] = []
        else:
            formatted_results["results"]["aggregated"]["confusion_matrix"] = []
        
        # Save to database if requested
        if request.save_to_db:
            try:
                # Save aggregated result
                aggregated_result = results.get("aggregated")
                if aggregated_result:
                    evaluation = FISEvaluation(
                        accuracy=aggregated_result.accuracy,
                        precision=aggregated_result.precision,
                        recall=aggregated_result.recall,
                        f1_score=aggregated_result.f1_score,
                        confusion_matrix={},  # Will be updated if needed
                        total_samples=len(mahasiswa_list),
                        correct_predictions=int(aggregated_result.accuracy * len(mahasiswa_list)),
                        incorrect_predictions=int((1 - aggregated_result.accuracy) * len(mahasiswa_list)),
                        evaluation_params={
                            "method": "enhanced",
                            "config": {
                                "use_cross_validation": request.use_cross_validation,
                                "cv_folds": request.cv_folds,
                                "use_bootstrap": request.use_bootstrap,
                                "bootstrap_samples": request.bootstrap_samples,
                                "use_ensemble": request.use_ensemble,
                                "ensemble_models": request.ensemble_models,
                                "use_data_preprocessing": request.use_data_preprocessing,
                                "use_rule_weighting": request.use_rule_weighting,
                                "confidence_threshold": request.confidence_threshold,
                                "random_state": request.random_state
                            }
                        },
                        evaluation_name=request.evaluation_name,
                        evaluation_notes=request.evaluation_notes
                    )
                    db.add(evaluation)
                    db.commit()
                    db.refresh(evaluation)
                    
                    formatted_results["evaluation_info"]["saved_id"] = evaluation.id
            except Exception as e:
                print(f"Warning: Failed to save to database: {e}")
        
        return formatted_results
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in enhanced evaluation: {str(e)}"
        )

@router.post("/evaluate-quick", description="Evaluasi FIS cepat dengan optimasi dasar")
def evaluate_fuzzy_quick(
    request: EvaluationRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluasi FIS cepat dengan optimasi dasar untuk akurasi tinggi
    """
    try:
        start_time = time.time()
        
        # Ambil data mahasiswa
        mahasiswa_list = db.query(Mahasiswa).all()
        
        if len(mahasiswa_list) < 10:
            raise HTTPException(
                status_code=400,
                detail="Data tidak cukup untuk evaluasi. Minimal 10 data diperlukan."
            )
        
        # Konfigurasi quick evaluation
        config = EvaluationConfig(
            use_cross_validation=True,
            cv_folds=3,  # Quick CV
            use_bootstrap=False,  # Skip bootstrap for speed
            use_ensemble=True,
            ensemble_models=3,  # Fewer models
            use_data_preprocessing=True,
            use_rule_weighting=True,
            random_state=request.random_state
        )
        
        # Jalankan evaluasi
        results = run_enhanced_evaluation(mahasiswa_list, config)
        
        # Format hasil
        aggregated_result = results.get("aggregated")
        
        formatted_result = {
            "evaluation_info": {
                "name": request.evaluation_name or f"Quick Evaluation {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                "total_data": len(mahasiswa_list),
                "execution_time": time.time() - start_time,
                "method": "quick_enhanced"
            },
            "results": {
                "accuracy": round(aggregated_result.accuracy, 4),
                "precision": round(aggregated_result.precision, 4),
                "recall": round(aggregated_result.recall, 4),
                "f1_score": round(aggregated_result.f1_score, 4),
                "confidence_interval": results.get("cross_validation", {}).confidence_interval if "cross_validation" in results else None
            }
        }
        
        # Save to database if requested
        if request.save_to_db:
            try:
                evaluation = FISEvaluation(
                    accuracy=aggregated_result.accuracy,
                    precision=aggregated_result.precision,
                    recall=aggregated_result.recall,
                    f1_score=aggregated_result.f1_score,
                    confusion_matrix={},
                    total_samples=len(mahasiswa_list),
                    correct_predictions=int(aggregated_result.accuracy * len(mahasiswa_list)),
                    incorrect_predictions=int((1 - aggregated_result.accuracy) * len(mahasiswa_list)),
                    evaluation_params={
                        "method": "quick_enhanced",
                        "config": config.__dict__
                    },
                    evaluation_name=request.evaluation_name,
                    evaluation_notes=request.evaluation_notes
                )
                db.add(evaluation)
                db.commit()
                db.refresh(evaluation)
                
                formatted_result["evaluation_info"]["saved_id"] = evaluation.id
            except Exception as e:
                print(f"Warning: Failed to save to database: {e}")
        
        return formatted_result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in quick evaluation: {str(e)}"
        ) 

@router.post("/evaluate-with-actual-status")
def evaluate_fis_with_actual_status(
    request: dict = Body(...),
    db: Session = Depends(get_db)
):
    # Extract parameters from request body
    test_size = request.get("test_size", 0.3)
    random_state = request.get("random_state", 42)
    """
    Evaluasi FIS dengan membandingkan hasil klasifikasi dengan status lulus aktual
    """
    try:
        # Ambil data mahasiswa yang memiliki status lulus aktual
        mahasiswa_with_status = db.query(Mahasiswa).filter(
            Mahasiswa.status_lulus_aktual.isnot(None)
        ).all()
        
        if len(mahasiswa_with_status) < 10:
            raise HTTPException(
                status_code=400,
                detail="Minimal diperlukan 10 data mahasiswa dengan status lulus aktual untuk evaluasi"
            )
        
        # Persiapkan data untuk evaluasi
        data = []
        for mhs in mahasiswa_with_status:
            # Ambil klasifikasi FIS yang sudah ada
            klasifikasi = db.query(KlasifikasiKelulusan).filter(
                KlasifikasiKelulusan.nim == mhs.nim
            ).first()
            
            if klasifikasi:
                data.append({
                    'nim': mhs.nim,
                    'nama': mhs.nama,
                    'ipk': mhs.ipk,
                    'sks': mhs.sks,
                    'persen_dek': mhs.persen_dek,
                    'predicted_category': klasifikasi.kategori,
                    'actual_status': mhs.status_lulus_aktual,
                    'fuzzy_score': klasifikasi.nilai_fuzzy
                })
        
        if len(data) < 10:
            raise HTTPException(
                status_code=400,
                detail="Minimal diperlukan 10 data dengan klasifikasi FIS untuk evaluasi"
            )
        
        # Konversi ke DataFrame
        df = pd.DataFrame(data)
        
        # Mapping kategori ke binary (LULUS vs BELUM_LULUS)
        def map_to_binary(status):
            if status == "LULUS":
                return 1
            else:
                return 0
        
        # Mapping kategori FIS ke binary
        def map_fis_to_binary(category):
            if category == "Peluang Lulus Tinggi":
                return 1
            else:
                return 0
        
        # Tambahkan kolom binary
        df['actual_binary'] = df['actual_status'].apply(map_to_binary)
        df['predicted_binary'] = df['predicted_category'].apply(map_fis_to_binary)
        
        # Split data untuk evaluasi
        X = df[['ipk', 'sks', 'persen_dek']].values
        y_actual = df['actual_binary'].values
        y_predicted = df['predicted_binary'].values
        
        # Hitung metrics
        accuracy = accuracy_score(y_actual, y_predicted)
        precision = precision_score(y_actual, y_predicted, zero_division=0)
        recall = recall_score(y_actual, y_predicted, zero_division=0)
        f1 = f1_score(y_actual, y_predicted, zero_division=0)
        
        # Confusion Matrix
        cm = confusion_matrix(y_actual, y_predicted)
        
        # Classification Report
        report = classification_report(y_actual, y_predicted, output_dict=True)
        
        # Analisis per kategori
        category_analysis = {}
        for category in df['predicted_category'].unique():
            category_data = df[df['predicted_category'] == category]
            if len(category_data) > 0:
                correct_predictions = len(category_data[category_data['actual_status'] == 'LULUS'])
                total_predictions = len(category_data)
                accuracy_category = correct_predictions / total_predictions if total_predictions > 0 else 0
                
                category_analysis[category] = {
                    'total_predictions': total_predictions,
                    'correct_predictions': correct_predictions,
                    'accuracy': accuracy_category,
                    'actual_lulus': len(category_data[category_data['actual_status'] == 'LULUS']),
                    'actual_belum_lulus': len(category_data[category_data['actual_status'] != 'LULUS'])
                }
        
        # Statistik umum
        total_data = len(df)
        total_actual_lulus = len(df[df['actual_status'] == 'LULUS'])
        total_actual_belum_lulus = len(df[df['actual_status'] != 'LULUS'])
        
        # Hasil evaluasi
        evaluation_result = {
            'evaluation_info': {
                'total_data': total_data,
                'test_size': test_size,
                'random_state': random_state,
                'evaluation_date': datetime.utcnow().isoformat()
            },
            'metrics': {
                'accuracy': round(accuracy, 4),
                'precision': round(precision, 4),
                'recall': round(recall, 4),
                'f1_score': round(f1, 4)
            },
            'confusion_matrix': {
                'matrix': cm.tolist(),
                'labels': ['Belum Lulus', 'Lulus']
            },
            'classification_report': report,
            'category_analysis': category_analysis,
            'statistics': {
                'total_actual_lulus': total_actual_lulus,
                'total_actual_belum_lulus': total_actual_belum_lulus,
                'percentage_actual_lulus': round((total_actual_lulus / total_data) * 100, 2),
                'percentage_actual_belum_lulus': round((total_actual_belum_lulus / total_data) * 100, 2)
            },
            'sample_data': df.head(10).to_dict('records')
        }
        
        return {
            'success': True,
            'message': f'Evaluasi FIS berhasil dengan {total_data} data',
            'result': evaluation_result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat evaluasi FIS: {str(e)}"
        )

@router.get("/evaluation-history")
def get_evaluation_history(db: Session = Depends(get_db)):
    """
    Mendapatkan riwayat evaluasi FIS
    """
    try:
        from models import FISEvaluation
        
        evaluations = db.query(FISEvaluation).order_by(
            FISEvaluation.created_at.desc()
        ).all()
        
        return {
            'success': True,
            'data': [eval.to_dict() for eval in evaluations]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat mengambil riwayat evaluasi: {str(e)}"
        )

@router.post("/compare-evaluations")
def compare_fis_evaluations(
    request: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    Membandingkan evaluasi FIS yang sebelumnya dengan evaluasi menggunakan data aktual
    """
    try:
        # Extract parameters
        test_size = request.get("test_size", 0.3)
        random_state = request.get("random_state", 42)
        
        print(f"🔍 Starting FIS comparison with test_size={test_size}, random_state={random_state}")
        
        # Run previous evaluation (synthetic data)
        print("📊 Running previous evaluation (synthetic data)...")
        previous_start_time = time.time()
        
        # Get synthetic data (400 records as in previous implementation)
        synthetic_data = db.query(Mahasiswa).limit(400).all()
        
        if len(synthetic_data) < 100:
            raise HTTPException(
                status_code=400,
                detail="Data tidak cukup untuk evaluasi (minimal 100 data)"
            )
        
        # Create synthetic ground truth (as in previous implementation)
        synthetic_ground_truth = []
        synthetic_predictions = []
        
        for mahasiswa in synthetic_data:
            # Synthetic ground truth (as in previous implementation)
            if mahasiswa.ipk >= 3.0 and mahasiswa.sks >= 120 and mahasiswa.persen_dek <= 10:
                synthetic_ground_truth.append(1)  # Lulus
            else:
                synthetic_ground_truth.append(0)  # Tidak lulus
            
            # FIS prediction
            kategori, nilai_fuzzy, ipk_membership, sks_membership, nilai_dk_membership = fuzzy_system.calculate_graduation_chance(
                mahasiswa.ipk, 
                mahasiswa.sks, 
                mahasiswa.persen_dek
            )
            
            # Map FIS category to binary
            if kategori == KategoriPeluang.TINGGI:
                synthetic_predictions.append(1)
            else:
                synthetic_predictions.append(0)
        
        # Calculate previous metrics
        previous_accuracy = accuracy_score(synthetic_ground_truth, synthetic_predictions)
        previous_precision = precision_score(synthetic_ground_truth, synthetic_predictions, zero_division=0)
        previous_recall = recall_score(synthetic_ground_truth, synthetic_predictions, zero_division=0)
        previous_f1 = f1_score(synthetic_ground_truth, synthetic_predictions, zero_division=0)
        
        previous_execution_time = time.time() - previous_start_time
        
        print(f"✅ Previous evaluation completed in {previous_execution_time:.2f}s")
        print(f"   Accuracy: {previous_accuracy:.4f}, Precision: {previous_precision:.4f}, Recall: {previous_recall:.4f}, F1: {previous_f1:.4f}")
        
        # Run actual evaluation (with real graduation status)
        print("📊 Running actual evaluation (real graduation status)...")
        actual_start_time = time.time()
        
        # Get data with actual graduation status
        actual_data = db.query(Mahasiswa).filter(
            Mahasiswa.status_lulus_aktual.isnot(None)
        ).all()
        
        if len(actual_data) < 100:
            raise HTTPException(
                status_code=400,
                detail="Data dengan status lulus aktual tidak cukup (minimal 100 data)"
            )
        
        # Create actual ground truth and predictions
        actual_ground_truth = []
        actual_predictions = []
        
        for mahasiswa in actual_data:
            # Actual ground truth
            if mahasiswa.status_lulus_aktual == 'LULUS':
                actual_ground_truth.append(1)
            else:
                actual_ground_truth.append(0)
            
            # FIS prediction
            kategori, nilai_fuzzy, ipk_membership, sks_membership, nilai_dk_membership = fuzzy_system.calculate_graduation_chance(
                mahasiswa.ipk, 
                mahasiswa.sks, 
                mahasiswa.persen_dek
            )
            
            # Map FIS category to binary
            if kategori == KategoriPeluang.TINGGI:
                actual_predictions.append(1)
            else:
                actual_predictions.append(0)
        
        # Calculate actual metrics
        actual_accuracy = accuracy_score(actual_ground_truth, actual_predictions)
        actual_precision = precision_score(actual_ground_truth, actual_predictions, zero_division=0)
        actual_recall = recall_score(actual_ground_truth, actual_predictions, zero_division=0)
        actual_f1 = f1_score(actual_ground_truth, actual_predictions, zero_division=0)
        
        actual_execution_time = time.time() - actual_start_time
        
        print(f"✅ Actual evaluation completed in {actual_execution_time:.2f}s")
        print(f"   Accuracy: {actual_accuracy:.4f}, Precision: {actual_precision:.4f}, Recall: {actual_recall:.4f}, F1: {actual_f1:.4f}")
        
        # Calculate differences
        accuracy_diff = actual_accuracy - previous_accuracy
        precision_diff = actual_precision - previous_precision
        recall_diff = actual_recall - previous_recall
        f1_diff = actual_f1 - previous_f1
        
        # Determine which metrics are better with actual data
        better_with_actual = []
        better_with_previous = []
        
        if accuracy_diff > 0:
            better_with_actual.append("Accuracy")
        elif accuracy_diff < 0:
            better_with_previous.append("Accuracy")
            
        if precision_diff > 0:
            better_with_actual.append("Precision")
        elif precision_diff < 0:
            better_with_previous.append("Precision")
            
        if recall_diff > 0:
            better_with_actual.append("Recall")
        elif recall_diff < 0:
            better_with_previous.append("Recall")
            
        if f1_diff > 0:
            better_with_actual.append("F1-Score")
        elif f1_diff < 0:
            better_with_previous.append("F1-Score")
        
        # Overall assessment
        actual_better_count = len(better_with_actual)
        previous_better_count = len(better_with_previous)
        
        if actual_better_count > previous_better_count:
            overall_assessment = f"Evaluasi dengan data aktual menunjukkan performa yang lebih baik ({actual_better_count} dari 4 metrik lebih tinggi)."
        elif previous_better_count > actual_better_count:
            overall_assessment = f"Evaluasi sebelumnya menunjukkan performa yang lebih baik ({previous_better_count} dari 4 metrik lebih tinggi)."
        else:
            overall_assessment = "Kedua evaluasi menunjukkan performa yang sebanding."
        
        # Prepare response
        comparison_result = {
            "total_data": len(actual_data),
            "overall_accuracy": actual_accuracy,
            "metrics_comparison": {
                "accuracy": {
                    "previous": previous_accuracy,
                    "actual": actual_accuracy,
                    "difference": accuracy_diff
                },
                "precision": {
                    "previous": previous_precision,
                    "actual": actual_precision,
                    "difference": precision_diff
                },
                "recall": {
                    "previous": previous_recall,
                    "actual": actual_recall,
                    "difference": recall_diff
                },
                "f1_score": {
                    "previous": previous_f1,
                    "actual": actual_f1,
                    "difference": f1_diff
                }
            },
            "data_comparison": {
                "total_data": {
                    "previous": len(synthetic_data),
                    "actual": len(actual_data)
                },
                "test_data": {
                    "previous": int(len(synthetic_data) * test_size),
                    "actual": int(len(actual_data) * test_size)
                },
                "execution_time": {
                    "previous": previous_execution_time,
                    "actual": actual_execution_time
                }
            },
            "summary": {
                "better_with_actual": better_with_actual,
                "better_with_previous": better_with_previous,
                "overall_assessment": overall_assessment
            },
            "detailed_analysis": {
                "actual_advantages": [
                    "Menggunakan status lulus yang sebenarnya dari database",
                    f"Dataset yang lebih besar ({len(actual_data)} vs {len(synthetic_data)} data)",
                    "Validitas yang lebih tinggi untuk analisis produksi",
                    "Refleksi kondisi nyata mahasiswa"
                ],
                "previous_advantages": [
                    "Execution time yang lebih cepat",
                    "Dataset yang lebih kecil untuk testing cepat",
                    "Ground truth yang konsisten dan predictable",
                    "Cocok untuk development dan prototyping"
                ],
                "recommendations": [
                    "Gunakan evaluasi dengan data aktual untuk validasi produksi dan analisis final",
                    "Gunakan evaluasi sebelumnya untuk development cepat dan testing fitur baru",
                    "Pertimbangkan ukuran dataset yang lebih besar untuk meningkatkan keandalan hasil",
                    "Lakukan evaluasi berkala dengan data aktual untuk monitoring performa sistem"
                ]
            }
        }
        
        print("✅ FIS comparison completed successfully")
        
        return {
            "success": True,
            "message": "Perbandingan evaluasi FIS berhasil",
            "result": comparison_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in FIS comparison: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat melakukan perbandingan evaluasi FIS: {str(e)}"
        ) 