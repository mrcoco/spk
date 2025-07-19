from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import numpy as np
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
from sklearn.model_selection import train_test_split
import time
import json

from database import get_db
from models import Mahasiswa, KlasifikasiKelulusan, FISEvaluation
from schemas import KlasifikasiKelulusanResponse, KlasifikasiGridResponse, FuzzyResponse
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
    test_size: float = 0.3,
    random_state: int = 42,
    evaluation_name: str = None,
    evaluation_notes: str = None,
    save_to_db: bool = True,
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
        
        reverse_mapping = {v: k for k, v in kategori_mapping.items()}
        
        # Generate true labels berdasarkan kriteria sederhana
        for mahasiswa in mahasiswa_list:
            # Features
            features = [mahasiswa.ipk, mahasiswa.sks, mahasiswa.persen_dek]
            X.append(features)
            
            # True label berdasarkan kriteria sederhana
            if mahasiswa.ipk >= 3.5 and mahasiswa.sks >= 120 and mahasiswa.persen_dek >= 80:
                true_label = "Peluang Lulus Tinggi"
            elif mahasiswa.ipk >= 3.0 and mahasiswa.sks >= 100 and mahasiswa.persen_dek >= 70:
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
        
        # Split data untuk training dan testing
        X_train, X_test, y_true_train, y_true_test, y_pred_train, y_pred_test = train_test_split(
            X, y_true, y_pred, test_size=test_size, random_state=random_state, stratify=y_true
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
        if save_to_db:
            # Generate evaluation name if not provided
            if not evaluation_name:
                evaluation_name = f"FIS_Evaluation_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            
            # Create evaluation record
            evaluation_record = FISEvaluation(
                evaluation_name=evaluation_name,
                test_size=test_size,
                random_state=random_state,
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
                evaluation_notes=evaluation_notes
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
        if save_to_db:
            db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat evaluasi: {str(e)}"
        ) 