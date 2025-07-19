#!/usr/bin/env python3
"""
Script untuk analisis data mahasiswa secara mendalam
"""

from database import get_db
from models import Mahasiswa
import numpy as np
from collections import Counter

def analyze_mahasiswa_data():
    """Menganalisis distribusi data mahasiswa secara mendalam"""
    
    # Get database session
    db = next(get_db())
    
    # Get all mahasiswa data
    mahasiswa_list = db.query(Mahasiswa).all()
    
    print(f"=== ANALISIS DATA MAHASISWA ===")
    print(f"Total mahasiswa: {len(mahasiswa_list)}")
    
    # Extract data
    ipk_values = [m.ipk for m in mahasiswa_list]
    sks_values = [m.sks for m in mahasiswa_list]
    persen_dek_values = [m.persen_dek for m in mahasiswa_list]
    program_studi = [m.program_studi for m in mahasiswa_list]
    
    print(f"\n=== DISTRIBUSI IPK ===")
    print(f"Min: {min(ipk_values):.2f}")
    print(f"Max: {max(ipk_values):.2f}")
    print(f"Mean: {np.mean(ipk_values):.2f}")
    print(f"Median: {np.median(ipk_values):.2f}")
    print(f"Std: {np.std(ipk_values):.2f}")
    
    # IPK ranges
    ipk_ranges = {
        "IPK < 2.0": sum(1 for ipk in ipk_values if ipk < 2.0),
        "IPK 2.0-2.5": sum(1 for ipk in ipk_values if 2.0 <= ipk < 2.5),
        "IPK 2.5-3.0": sum(1 for ipk in ipk_values if 2.5 <= ipk < 3.0),
        "IPK 3.0-3.5": sum(1 for ipk in ipk_values if 3.0 <= ipk < 3.5),
        "IPK 3.5-4.0": sum(1 for ipk in ipk_values if 3.5 <= ipk <= 4.0),
    }
    
    print(f"\nDistribusi IPK:")
    for range_name, count in ipk_ranges.items():
        percentage = (count / len(ipk_values)) * 100
        print(f"  {range_name}: {count} ({percentage:.1f}%)")
    
    print(f"\n=== DISTRIBUSI SKS ===")
    print(f"Min: {min(sks_values)}")
    print(f"Max: {max(sks_values)}")
    print(f"Mean: {np.mean(sks_values):.1f}")
    print(f"Median: {np.median(sks_values):.1f}")
    print(f"Std: {np.std(sks_values):.1f}")
    
    # SKS ranges
    sks_ranges = {
        "SKS < 100": sum(1 for sks in sks_values if sks < 100),
        "SKS 100-120": sum(1 for sks in sks_values if 100 <= sks < 120),
        "SKS 120-140": sum(1 for sks in sks_values if 120 <= sks < 140),
        "SKS 140-160": sum(1 for sks in sks_values if 140 <= sks < 160),
        "SKS >= 160": sum(1 for sks in sks_values if sks >= 160),
    }
    
    print(f"\nDistribusi SKS:")
    for range_name, count in sks_ranges.items():
        percentage = (count / len(sks_values)) * 100
        print(f"  {range_name}: {count} ({percentage:.1f}%)")
    
    print(f"\n=== DISTRIBUSI PERSEN DEK ===")
    print(f"Min: {min(persen_dek_values):.2f}")
    print(f"Max: {max(persen_dek_values):.2f}")
    print(f"Mean: {np.mean(persen_dek_values):.2f}")
    print(f"Median: {np.median(persen_dek_values):.2f}")
    print(f"Std: {np.std(persen_dek_values):.2f}")
    
    # Persen DEK ranges
    dek_ranges = {
        "DEK = 0.0": sum(1 for dek in persen_dek_values if dek == 0.0),
        "DEK 0.1-5.0": sum(1 for dek in persen_dek_values if 0.0 < dek <= 5.0),
        "DEK 5.1-10.0": sum(1 for dek in persen_dek_values if 5.0 < dek <= 10.0),
        "DEK 10.1-20.0": sum(1 for dek in persen_dek_values if 10.0 < dek <= 20.0),
        "DEK > 20.0": sum(1 for dek in persen_dek_values if dek > 20.0),
    }
    
    print(f"\nDistribusi Persen DEK:")
    for range_name, count in dek_ranges.items():
        percentage = (count / len(persen_dek_values)) * 100
        print(f"  {range_name}: {count} ({percentage:.1f}%)")
    
    print(f"\n=== DISTRIBUSI PROGRAM STUDI ===")
    program_counter = Counter(program_studi)
    for program, count in program_counter.most_common(10):
        percentage = (count / len(program_studi)) * 100
        print(f"  {program}: {count} ({percentage:.1f}%)")
    
    # Analyze correlations
    print(f"\n=== KORELASI ANTAR VARIABEL ===")
    correlation_ipk_sks = np.corrcoef(ipk_values, sks_values)[0, 1]
    correlation_ipk_dek = np.corrcoef(ipk_values, persen_dek_values)[0, 1]
    correlation_sks_dek = np.corrcoef(sks_values, persen_dek_values)[0, 1]
    
    print(f"Korelasi IPK-SKS: {correlation_ipk_sks:.3f}")
    print(f"Korelasi IPK-DEK: {correlation_ipk_dek:.3f}")
    print(f"Korelasi SKS-DEK: {correlation_sks_dek:.3f}")
    
    # Analyze ground truth distribution
    print(f"\n=== DISTRIBUSI GROUND TRUTH ===")
    ground_truth_labels = []
    for mahasiswa in mahasiswa_list:
        if mahasiswa.ipk >= 3.5:
            ground_truth_labels.append("Peluang Lulus Tinggi")
        elif mahasiswa.ipk >= 3.0:
            ground_truth_labels.append("Peluang Lulus Sedang")
        else:
            ground_truth_labels.append("Peluang Lulus Kecil")
    
    gt_counter = Counter(ground_truth_labels)
    for label, count in gt_counter.items():
        percentage = (count / len(ground_truth_labels)) * 100
        print(f"  {label}: {count} ({percentage:.1f}%)")
    
    # Analyze data quality issues
    print(f"\n=== MASALAH KUALITAS DATA ===")
    
    # Check for unrealistic values
    unrealistic_ipk = sum(1 for ipk in ipk_values if ipk < 1.0 or ipk > 4.0)
    unrealistic_sks = sum(1 for sks in sks_values if sks < 0 or sks > 200)
    unrealistic_dek = sum(1 for dek in persen_dek_values if dek < 0 or dek > 100)
    
    print(f"IPK tidak realistis (< 1.0 atau > 4.0): {unrealistic_ipk}")
    print(f"SKS tidak realistis (< 0 atau > 200): {unrealistic_sks}")
    print(f"Persen DEK tidak realistis (< 0 atau > 100): {unrealistic_dek}")
    
    # Check for missing or zero values
    zero_ipk = sum(1 for ipk in ipk_values if ipk == 0.0)
    zero_sks = sum(1 for sks in sks_values if sks == 0)
    zero_dek = sum(1 for dek in persen_dek_values if dek == 0.0)
    
    print(f"IPK = 0.0: {zero_ipk}")
    print(f"SKS = 0: {zero_sks}")
    print(f"Persen DEK = 0.0: {zero_dek}")
    
    # Sample data analysis
    print(f"\n=== SAMPLE DATA ANALYSIS ===")
    print("Sample mahasiswa dengan IPK tinggi (>= 3.5):")
    high_ipk_samples = [m for m in mahasiswa_list if m.ipk >= 3.5][:5]
    for m in high_ipk_samples:
        print(f"  NIM: {m.nim}, IPK: {m.ipk:.2f}, SKS: {m.sks}, DEK: {m.persen_dek:.2f}%")
    
    print(f"\nSample mahasiswa dengan IPK rendah (< 3.0):")
    low_ipk_samples = [m for m in mahasiswa_list if m.ipk < 3.0][:5]
    for m in low_ipk_samples:
        print(f"  NIM: {m.nim}, IPK: {m.ipk:.2f}, SKS: {m.sks}, DEK: {m.persen_dek:.2f}%")
    
    print(f"\nSample mahasiswa dengan DEK > 0:")
    dek_samples = [m for m in mahasiswa_list if m.persen_dek > 0.0][:5]
    for m in dek_samples:
        print(f"  NIM: {m.nim}, IPK: {m.ipk:.2f}, SKS: {m.sks}, DEK: {m.persen_dek:.2f}%")
    
    db.close()

if __name__ == "__main__":
    analyze_mahasiswa_data() 