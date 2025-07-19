#!/usr/bin/env python3
"""
Script untuk membandingkan implementasi fuzzy_logic.py dengan FIS_SAW_fix.ipynb
untuk NIM 18602241076
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'backend'))

from fuzzy_logic import FuzzyKelulusan

def test_fuzzy_comparison():
    """
    Test perbandingan implementasi fuzzy untuk NIM 18602241076
    """
    print("🔍 PERBANDINGAN IMPLEMENTASI FUZZY LOGIC")
    print("=" * 50)
    
    # Data mahasiswa NIM 18602241076 (dari gambar)
    nim = "18602241076"
    ipk = 3.4  # Asumsi dari notebook
    sks = 150  # Asumsi dari notebook  
    persen_dek = 0.0  # Asumsi dari notebook
    
    print(f"📊 Data Mahasiswa:")
    print(f"   NIM: {nim}")
    print(f"   IPK: {ipk}")
    print(f"   SKS: {sks}")
    print(f"   Persen DEK: {persen_dek}")
    print()
    
    # Test implementasi fuzzy_logic.py
    print("🐍 Implementasi fuzzy_logic.py:")
    print("-" * 30)
    
    try:
        fuzzy_system = FuzzyKelulusan()
        
        # Hitung membership functions
        ipk_memberships = fuzzy_system.calculate_ipk_membership(ipk)
        sks_memberships = fuzzy_system.calculate_sks_membership(sks)
        nilai_dk_memberships = fuzzy_system.calculate_nilai_dk_membership(persen_dek)
        
        print(f"   IPK Membership (rendah, sedang, tinggi): {ipk_memberships}")
        print(f"   SKS Membership (sedikit, sedang, banyak): {sks_memberships}")
        print(f"   Nilai DEK Membership (sedikit, sedang, banyak): {nilai_dk_memberships}")
        
        # Hitung peluang kelulusan
        kategori, nilai_crisp, max_ipk, max_sks, max_dek = fuzzy_system.calculate_graduation_chance(ipk, sks, persen_dek)
        
        print(f"   Nilai Crisp: {nilai_crisp:.6f}")
        print(f"   Kategori: {kategori}")
        print(f"   Max IPK Membership: {max_ipk}")
        print(f"   Max SKS Membership: {max_sks}")
        print(f"   Max DEK Membership: {max_dek}")
        
        fuzzy_logic_result = nilai_crisp
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        fuzzy_logic_result = None
    
    print()
    
    # Hasil dari FIS_SAW_fix.ipynb
    print("📓 Hasil dari FIS_SAW_fix.ipynb:")
    print("-" * 30)
    print(f"   Nilai Crisp: 83.8677248677248")
    print(f"   Kategori: Peluang Lulus Tinggi")
    
    notebook_result = 83.8677248677248
    
    print()
    
    # Perbandingan
    print("📊 PERBANDINGAN HASIL:")
    print("=" * 30)
    
    if fuzzy_logic_result is not None:
        print(f"   fuzzy_logic.py: {fuzzy_logic_result:.6f}")
        print(f"   FIS_SAW_fix.ipynb: {notebook_result:.6f}")
        print(f"   Selisih: {abs(fuzzy_logic_result - notebook_result):.6f}")
        
        if abs(fuzzy_logic_result - notebook_result) < 0.01:
            print("   ✅ Hasil SAMA (dalam toleransi 0.01)")
        else:
            print("   ❌ Hasil BERBEDA")
            print()
            print("🔍 ANALISIS PERBEDAAN:")
            print("   Kemungkinan penyebab perbedaan:")
            print("   1. Implementasi membership function berbeda")
            print("   2. Implementasi fuzzy rules berbeda")
            print("   3. Implementasi defuzzification berbeda")
            print("   4. Precision floating point berbeda")
    else:
        print("   ❌ Tidak dapat membandingkan karena error pada fuzzy_logic.py")
    
    print()
    print("🔧 DETAIL IMPLEMENTASI:")
    print("=" * 30)
    
    # Detail implementasi fuzzy_logic.py
    print("🐍 fuzzy_logic.py:")
    print("   - Membership functions: Manual implementation")
    print("   - Fuzzy rules: 20 rules dengan min-max")
    print("   - Defuzzification: Weighted average dengan centroid")
    print("   - Output values: [20, 50, 80]")
    
    print()
    print("📓 FIS_SAW_fix.ipynb:")
    print("   - Membership functions: scikit-fuzzy library")
    print("   - Fuzzy rules: 20 rules dengan scikit-fuzzy")
    print("   - Defuzzification: scikit-fuzzy centroid method")
    print("   - Output values: [0-40, 30-70, 60-100]")

if __name__ == "__main__":
    test_fuzzy_comparison() 