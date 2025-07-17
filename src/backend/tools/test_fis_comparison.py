#!/usr/bin/env python3
"""
Script untuk membandingkan hasil FIS dari implementasi project dengan implementasi notebook
untuk NIM 18209241051
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import Mahasiswa
from fuzzy_logic import FuzzyKelulusan
import numpy as np

def test_fis_notebook_implementation():
    """Test implementasi FIS sesuai dengan notebook"""
    print("🔍 Testing FIS Implementation sesuai Notebook")
    print("=" * 60)
    
    # Data mahasiswa NIM 18209241051
    ipk = 3.79
    sks = 152
    nilai_dek = 0.0
    
    print(f"Data Mahasiswa:")
    print(f"IPK: {ipk}")
    print(f"SKS: {sks}")
    print(f"% D/E/K: {nilai_dek}")
    print()
    
    # Implementasi sesuai notebook
    # Membership functions dari notebook
    def membership_ipk_notebook(ipk_val):
        """Membership function IPK sesuai notebook"""
        # IPK rendah: [0, 2, 2.5, 3.0] - trapezoid
        if ipk_val <= 2.0:
            ipk_rendah = 1.0
        elif 2.0 < ipk_val <= 2.5:
            ipk_rendah = (2.5 - ipk_val) / (2.5 - 2.0)
        elif 2.5 < ipk_val <= 3.0:
            ipk_rendah = (3.0 - ipk_val) / (3.0 - 2.5)
        else:
            ipk_rendah = 0.0
            
        # IPK sedang: [2.8, 3.2, 3.6] - triangular
        if ipk_val <= 2.8 or ipk_val >= 3.6:
            ipk_sedang = 0.0
        elif 2.8 < ipk_val <= 3.2:
            ipk_sedang = (ipk_val - 2.8) / (3.2 - 2.8)
        else:  # 3.2 < ipk_val < 3.6
            ipk_sedang = (3.6 - ipk_val) / (3.6 - 3.2)
            
        # IPK tinggi: [3.4, 3.7, 4.0, 4.0] - trapezoid
        if ipk_val <= 3.4:
            ipk_tinggi = 0.0
        elif 3.4 < ipk_val <= 3.7:
            ipk_tinggi = (ipk_val - 3.4) / (3.7 - 3.4)
        else:
            ipk_tinggi = 1.0
            
        return {
            'rendah': ipk_rendah,
            'sedang': ipk_sedang,
            'tinggi': ipk_tinggi
        }
    
    def membership_sks_notebook(sks_val):
        """Membership function SKS sesuai notebook"""
        # SKS sedikit: [40, 90, 100, 120] - trapezoid
        if sks_val <= 40:
            sks_sedikit = 0.0
        elif 40 < sks_val <= 90:
            sks_sedikit = (sks_val - 40) / (90 - 40)
        elif 90 < sks_val <= 100:
            sks_sedikit = 1.0
        elif 100 < sks_val <= 120:
            sks_sedikit = (120 - sks_val) / (120 - 100)
        else:
            sks_sedikit = 0.0
            
        # SKS sedang: [118, 140, 160] - triangular
        if sks_val <= 118 or sks_val >= 160:
            sks_sedang = 0.0
        elif 118 < sks_val <= 140:
            sks_sedang = (sks_val - 118) / (140 - 118)
        else:  # 140 < sks_val < 160
            sks_sedang = (160 - sks_val) / (160 - 140)
            
        # SKS banyak: [155, 170, 190, 200] - trapezoid
        if sks_val <= 155:
            sks_banyak = 0.0
        elif 155 < sks_val <= 170:
            sks_banyak = (sks_val - 155) / (170 - 155)
        elif 170 < sks_val <= 190:
            sks_banyak = 1.0
        elif 190 < sks_val <= 200:
            sks_banyak = (200 - sks_val) / (200 - 190)
        else:
            sks_banyak = 0.0
            
        return {
            'sedikit': sks_sedikit,
            'sedang': sks_sedang,
            'banyak': sks_banyak
        }
    
    def membership_nilai_notebook(nilai_val):
        """Membership function % D/E/K sesuai notebook"""
        # Nilai sedikit: [0, 0, 4, 8] - trapezoid
        if nilai_val <= 0:
            nilai_sedikit = 1.0
        elif 0 < nilai_val <= 4:
            nilai_sedikit = (4 - nilai_val) / (4 - 0)
        elif 4 < nilai_val <= 8:
            nilai_sedikit = (8 - nilai_val) / (8 - 4)
        else:
            nilai_sedikit = 0.0
            
        # Nilai sedang: [7, 12, 18] - triangular
        if nilai_val <= 7 or nilai_val >= 18:
            nilai_sedang = 0.0
        elif 7 < nilai_val <= 12:
            nilai_sedang = (nilai_val - 7) / (12 - 7)
        else:  # 12 < nilai_val < 18
            nilai_sedang = (18 - nilai_val) / (18 - 12)
            
        # Nilai banyak: [16, 20, 45, 70] - trapezoid
        if nilai_val <= 16:
            nilai_banyak = 0.0
        elif 16 < nilai_val <= 20:
            nilai_banyak = (nilai_val - 16) / (20 - 16)
        elif 20 < nilai_val <= 45:
            nilai_banyak = 1.0
        elif 45 < nilai_val <= 70:
            nilai_banyak = (70 - nilai_val) / (70 - 45)
        else:
            nilai_banyak = 0.0
            
        return {
            'sedikit': nilai_sedikit,
            'sedang': nilai_sedang,
            'banyak': nilai_banyak
        }
    
    # Hitung membership values
    ipk_membership = membership_ipk_notebook(ipk)
    sks_membership = membership_sks_notebook(sks)
    nilai_membership = membership_nilai_notebook(nilai_dek)
    
    print("📊 Membership Values (Notebook Implementation):")
    print(f"IPK: {ipk_membership}")
    print(f"SKS: {sks_membership}")
    print(f"% D/E/K: {nilai_membership}")
    print()
    
    # Apply fuzzy rules sesuai notebook
    # Rule yang relevan untuk data ini:
    # IPK tinggi (0.975) & SKS banyak (0.8) & Nilai sedikit (1.0) -> Peluang Lulus Tinggi
    # IPK tinggi (0.975) & SKS sedang (0.6) & Nilai sedikit (1.0) -> Peluang Lulus Tinggi
    
    # Hitung rule strength
    rule1_strength = min(ipk_membership['tinggi'], sks_membership['banyak'], nilai_membership['sedikit'])
    rule2_strength = min(ipk_membership['tinggi'], sks_membership['sedang'], nilai_membership['sedikit'])
    
    print("🔍 Rule Analysis:")
    print(f"Rule 1 (IPK Tinggi & SKS Banyak & Nilai Sedikit): {rule1_strength}")
    print(f"Rule 2 (IPK Tinggi & SKS Sedang & Nilai Sedikit): {rule2_strength}")
    print()
    
    # Defuzzifikasi sederhana (centroid method)
    # Output crisp values: Kecil=20, Sedang=50, Tinggi=80
    total_strength = rule1_strength + rule2_strength
    if total_strength > 0:
        output_value = (rule1_strength * 80 + rule2_strength * 80) / total_strength
    else:
        output_value = 0
    
    print("📈 Defuzzification Result:")
    print(f"Output Value: {output_value:.2f}")
    
    # Klasifikasi
    if output_value >= 60:
        kategori = "Peluang Lulus Tinggi"
    elif output_value >= 40:
        kategori = "Peluang Lulus Sedang"
    else:
        kategori = "Peluang Lulus Kecil"
    
    print(f"Kategori: {kategori}")
    print()
    
    return output_value, kategori

def test_fis_project_implementation():
    """Test implementasi FIS dari project"""
    print("🔍 Testing FIS Implementation dari Project")
    print("=" * 60)
    
    # Ambil data dari database
    db = SessionLocal()
    try:
        mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == '18209241051').first()
        
        if mahasiswa:
            print(f"Data Mahasiswa dari Database:")
            print(f"NIM: {mahasiswa.nim}")
            print(f"Nama: {mahasiswa.nama}")
            print(f"IPK: {mahasiswa.ipk}")
            print(f"SKS: {mahasiswa.sks}")
            print(f"% D/E/K: {mahasiswa.persen_dek}")
            print()
            
            # Test dengan fuzzy logic project
            fuzzy_system = FuzzyKelulusan()
            kategori, nilai_fuzzy, ipk_membership, sks_membership, nilai_dk_membership = fuzzy_system.calculate_graduation_chance(
                mahasiswa.ipk, mahasiswa.sks, mahasiswa.persen_dek
            )
            
            print("📊 Membership Values (Project Implementation):")
            print(f"IPK: {ipk_membership}")
            print(f"SKS: {sks_membership}")
            print(f"% D/E/K: {nilai_dk_membership}")
            print()
            
            print("📈 Project Result:")
            print(f"Nilai Fuzzy: {nilai_fuzzy}")
            print(f"Kategori: {kategori}")
            print()
            
            return nilai_fuzzy, kategori
        else:
            print("❌ Mahasiswa dengan NIM 18209241051 tidak ditemukan")
            return None, None
            
    finally:
        db.close()

def compare_implementations():
    """Bandingkan kedua implementasi"""
    print("🔄 COMPARISON: Notebook vs Project Implementation")
    print("=" * 80)
    
    # Test notebook implementation
    notebook_value, notebook_kategori = test_fis_notebook_implementation()
    
    print("\n" + "="*80 + "\n")
    
    # Test project implementation
    project_value, project_kategori = test_fis_project_implementation()
    
    print("\n" + "="*80 + "\n")
    
    # Comparison
    print("📊 COMPARISON RESULTS:")
    print("=" * 40)
    
    if notebook_value is not None and project_value is not None:
        print(f"Notebook Implementation:")
        print(f"  - Nilai Fuzzy: {notebook_value:.2f}")
        print(f"  - Kategori: {notebook_kategori}")
        print()
        
        print(f"Project Implementation:")
        print(f"  - Nilai Fuzzy: {project_value:.2f}")
        print(f"  - Kategori: {project_kategori}")
        print()
        
        print(f"Difference:")
        print(f"  - Nilai: {abs(notebook_value - project_value):.2f}")
        print(f"  - Kategori sama: {notebook_kategori == project_kategori}")
        
        if abs(notebook_value - project_value) > 5:
            print("⚠️  WARNING: Perbedaan nilai signifikan (>5)")
        else:
            print("✅ Nilai cukup konsisten")
    else:
        print("❌ Tidak dapat membandingkan karena data tidak lengkap")

if __name__ == "__main__":
    compare_implementations() 