#!/usr/bin/env python3
"""
Script untuk menganalisis evaluasi FIS dan memahami masalah akurasi rendah
"""

from database import get_db
from models import Mahasiswa
from fuzzy_logic import FuzzyKelulusan
from sklearn.model_selection import train_test_split
import numpy as np

def analyze_evaluation_data():
    """Menganalisis data evaluasi untuk memahami masalah akurasi"""
    
    # Get database session
    db = next(get_db())
    
    # Get all mahasiswa data
    mahasiswa_list = db.query(Mahasiswa).all()
    
    print(f"Total mahasiswa: {len(mahasiswa_list)}")
    
    # Analyze data distribution
    ipk_values = [m.ipk for m in mahasiswa_list]
    sks_values = [m.sks for m in mahasiswa_list]
    persen_dek_values = [m.persen_dek for m in mahasiswa_list]
    
    print(f"\n=== DISTRIBUSI DATA ===")
    print(f"IPK - Min: {min(ipk_values):.2f}, Max: {max(ipk_values):.2f}, Mean: {np.mean(ipk_values):.2f}")
    print(f"SKS - Min: {min(sks_values)}, Max: {max(sks_values)}, Mean: {np.mean(sks_values):.1f}")
    print(f"Persen DEK - Min: {min(persen_dek_values):.2f}, Max: {max(persen_dek_values):.2f}, Mean: {np.mean(persen_dek_values):.2f}")
    
    # Analyze persen_dek distribution
    persen_dek_zero = sum(1 for p in persen_dek_values if p == 0.0)
    persen_dek_low = sum(1 for p in persen_dek_values if 0.0 < p <= 10.0)
    persen_dek_medium = sum(1 for p in persen_dek_values if 10.0 < p <= 30.0)
    persen_dek_high = sum(1 for p in persen_dek_values if p > 30.0)
    
    print(f"\n=== DISTRIBUSI PERSEN DEK ===")
    print(f"Persen DEK = 0.0: {persen_dek_zero} ({persen_dek_zero/len(mahasiswa_list)*100:.1f}%)")
    print(f"Persen DEK 0.1-10.0: {persen_dek_low} ({persen_dek_low/len(mahasiswa_list)*100:.1f}%)")
    print(f"Persen DEK 10.1-30.0: {persen_dek_medium} ({persen_dek_medium/len(mahasiswa_list)*100:.1f}%)")
    print(f"Persen DEK > 30.0: {persen_dek_high} ({persen_dek_high/len(mahasiswa_list)*100:.1f}%)")
    
    # Generate ground truth labels
    fuzzy_system = FuzzyKelulusan()
    
    ground_truth_labels = []
    predicted_labels = []
    scores = []
    
    for mahasiswa in mahasiswa_list:
        # Calculate ground truth score
        score = 0
        
        # IPK scoring (weight: 45%)
        if mahasiswa.ipk >= 3.7:
            score += 45
        elif mahasiswa.ipk >= 3.4:
            score += 35
        elif mahasiswa.ipk >= 3.0:
            score += 25
        elif mahasiswa.ipk >= 2.5:
            score += 15
        else:
            score += 5
        
        # SKS scoring (weight: 35%)
        if mahasiswa.sks >= 150:
            score += 35
        elif mahasiswa.sks >= 130:
            score += 28
        elif mahasiswa.sks >= 110:
            score += 21
        elif mahasiswa.sks >= 90:
            score += 14
        else:
            score += 7
        
        # Persen DEK scoring (weight: 20%)
        if mahasiswa.persen_dek == 0.0:
            score += 20
        elif mahasiswa.persen_dek <= 5:
            score += 18
        elif mahasiswa.persen_dek <= 10:
            score += 15
        elif mahasiswa.persen_dek <= 20:
            score += 12
        elif mahasiswa.persen_dek <= 35:
            score += 8
        else:
            score += 4
        
        scores.append(score)
        
        # Determine ground truth category
        if score >= 80:
            ground_truth_labels.append("Peluang Lulus Tinggi")
        elif score >= 55:
            ground_truth_labels.append("Peluang Lulus Sedang")
        else:
            ground_truth_labels.append("Peluang Lulus Kecil")
        
        # Get predicted category
        kategori_pred, _, _, _, _ = fuzzy_system.calculate_graduation_chance(
            mahasiswa.ipk, mahasiswa.sks, mahasiswa.persen_dek
        )
        predicted_labels.append(kategori_pred)
    
    # Analyze ground truth distribution
    gt_tinggi = ground_truth_labels.count("Peluang Lulus Tinggi")
    gt_sedang = ground_truth_labels.count("Peluang Lulus Sedang")
    gt_kecil = ground_truth_labels.count("Peluang Lulus Kecil")
    
    print(f"\n=== DISTRIBUSI GROUND TRUTH ===")
    print(f"Peluang Lulus Tinggi: {gt_tinggi} ({gt_tinggi/len(mahasiswa_list)*100:.1f}%)")
    print(f"Peluang Lulus Sedang: {gt_sedang} ({gt_sedang/len(mahasiswa_list)*100:.1f}%)")
    print(f"Peluang Lulus Kecil: {gt_kecil} ({gt_kecil/len(mahasiswa_list)*100:.1f}%)")
    
    # Analyze predicted distribution
    pred_tinggi = predicted_labels.count("Peluang Lulus Tinggi")
    pred_sedang = predicted_labels.count("Peluang Lulus Sedang")
    pred_kecil = predicted_labels.count("Peluang Lulus Kecil")
    
    print(f"\n=== DISTRIBUSI PREDIKSI FIS ===")
    print(f"Peluang Lulus Tinggi: {pred_tinggi} ({pred_tinggi/len(mahasiswa_list)*100:.1f}%)")
    print(f"Peluang Lulus Sedang: {pred_sedang} ({pred_sedang/len(mahasiswa_list)*100:.1f}%)")
    print(f"Peluang Lulus Kecil: {pred_kecil} ({pred_kecil/len(mahasiswa_list)*100:.1f}%)")
    
    # Analyze score distribution
    print(f"\n=== DISTRIBUSI SCORE ===")
    print(f"Score - Min: {min(scores)}, Max: {max(scores)}, Mean: {np.mean(scores):.1f}")
    
    score_high = sum(1 for s in scores if s >= 80)
    score_medium = sum(1 for s in scores if 55 <= s < 80)
    score_low = sum(1 for s in scores if s < 55)
    
    print(f"Score >= 80: {score_high} ({score_high/len(scores)*100:.1f}%)")
    print(f"Score 55-79: {score_medium} ({score_medium/len(scores)*100:.1f}%)")
    print(f"Score < 55: {score_low} ({score_low/len(scores)*100:.1f}%)")
    
    # Show some examples
    print(f"\n=== CONTOH DATA ===")
    for i in range(min(10, len(mahasiswa_list))):
        m = mahasiswa_list[i]
        print(f"NIM: {m.nim}, IPK: {m.ipk:.2f}, SKS: {m.sks}, DEK: {m.persen_dek:.2f}%")
        print(f"  Score: {scores[i]}, GT: {ground_truth_labels[i]}, Pred: {predicted_labels[i]}")
        print()
    
    db.close()

if __name__ == "__main__":
    analyze_evaluation_data() 