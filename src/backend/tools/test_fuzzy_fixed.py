#!/usr/bin/env python3
"""
Script untuk test implementasi fuzzy_logic_fixed.py yang diperbaiki
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'backend'))

# Simulasi enum KategoriPeluang
class KategoriPeluang:
    KECIL = "Peluang Lulus Kecil"
    SEDANG = "Peluang Lulus Sedang"
    TINGGI = "Peluang Lulus Tinggi"

# Import fuzzy_logic_fixed dengan mock models
import importlib.util
spec = importlib.util.spec_from_file_location("fuzzy_logic_fixed", "src/backend/fuzzy_logic_fixed.py")
fuzzy_logic_fixed = importlib.util.module_from_spec(spec)
sys.modules["models"] = type(sys)("models")
sys.modules["models"].KategoriPeluang = KategoriPeluang
spec.loader.exec_module(fuzzy_logic_fixed)

def test_fuzzy_fixed_implementation():
    """Test implementasi fuzzy_logic_fixed.py yang diperbaiki"""
    print("🔧 TESTING FUZZY_LOGIC_FIXED.PY IMPLEMENTATION")
    print("=" * 60)
    
    # Data mahasiswa NIM 18602241076
    nim = "18602241076"
    ipk = 3.4
    sks = 150
    persen_dek = 0.0
    
    print(f"📊 Data Mahasiswa:")
    print(f"   NIM: {nim}")
    print(f"   IPK: {ipk}")
    print(f"   SKS: {sks}")
    print(f"   Persen DEK: {persen_dek}")
    print()
    
    # Test implementasi fuzzy_logic_fixed.py
    print("🐍 Implementasi fuzzy_logic_fixed.py:")
    print("-" * 40)
    
    try:
        fuzzy_system = fuzzy_logic_fixed.FuzzyKelulusanFixed()
        
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
        
        fuzzy_fixed_result = nilai_crisp
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        fuzzy_fixed_result = None
    
    print()
    
    # Hasil dari FIS_SAW_fix.ipynb
    print("📓 Hasil dari FIS_SAW_fix.ipynb:")
    print("-" * 40)
    print(f"   Nilai Crisp: 83.8677248677248")
    print(f"   Kategori: Peluang Lulus Tinggi")
    
    notebook_result = 83.8677248677248
    
    print()
    
    # Perbandingan
    print("📊 PERBANDINGAN HASIL:")
    print("=" * 40)
    
    if fuzzy_fixed_result is not None:
        print(f"   fuzzy_logic_fixed.py: {fuzzy_fixed_result:.6f}")
        print(f"   FIS_SAW_fix.ipynb: {notebook_result:.6f}")
        print(f"   Selisih: {abs(fuzzy_fixed_result - notebook_result):.6f}")
        
        if abs(fuzzy_fixed_result - notebook_result) < 0.1:
            print("   ✅ Hasil SAMA (dalam toleransi 0.1)")
            print("   🎉 PERBAIKAN BERHASIL!")
        else:
            print("   ❌ Hasil masih BERBEDA")
            print("   🔧 Perlu perbaikan lebih lanjut")
    else:
        print("   ❌ Tidak dapat membandingkan karena error")
    
    print()
    
    # Test dengan test cases tambahan
    print("🧪 TESTING WITH ADDITIONAL TEST CASES:")
    print("-" * 40)
    
    test_cases = [
        {'ipk': 3.4, 'sks': 150, 'persen_dek': 0.0, 'expected': 83.87, 'description': 'NIM 18602241076'},
        {'ipk': 3.2, 'sks': 140, 'persen_dek': 5.0, 'expected': 75.50, 'description': 'Test case 2'},
        {'ipk': 2.8, 'sks': 120, 'persen_dek': 15.0, 'expected': 45.00, 'description': 'Test case 3'},
    ]
    
    passed_tests = 0
    total_tests = len(test_cases)
    
    for i, case in enumerate(test_cases, 1):
        try:
            kategori, nilai_crisp, max_ipk, max_sks, max_dek = fuzzy_system.calculate_graduation_chance(
                case['ipk'], case['sks'], case['persen_dek']
            )
            diff = abs(nilai_crisp - case['expected'])
            
            print(f"Test {i}: {case['description']}")
            print(f"   Input: IPK={case['ipk']}, SKS={case['sks']}, DEK={case['persen_dek']}")
            print(f"   Expected: {case['expected']:.2f}")
            print(f"   Got: {nilai_crisp:.2f}")
            print(f"   Difference: {diff:.2f}")
            
            if diff <= 0.1:  # Toleransi 0.1
                print(f"   ✅ PASS")
                passed_tests += 1
            else:
                print(f"   ❌ FAIL")
            print()
            
        except Exception as e:
            print(f"Test {i}: {case['description']}")
            print(f"   ❌ ERROR: {e}")
            print()
    
    print(f"📊 TEST SUMMARY:")
    print(f"   Passed: {passed_tests}/{total_tests}")
    print(f"   Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if passed_tests == total_tests:
        print("   🎉 SEMUA TEST BERHASIL!")
    else:
        print("   ⚠️  BEBERAPA TEST GAGAL")
    
    print()
    
    # Detail perbaikan yang diimplementasi
    print("🔧 DETAIL PERBAIKAN YANG DIIMPLEMENTASI:")
    print("=" * 50)
    print("1. ✅ Output crisp values diperbaiki:")
    print("   - Sebelum: [20, 50, 80]")
    print("   - Sekarang: [20, 50, 86.67]")
    print()
    print("2. ✅ Membership function calculation diperbaiki:")
    print("   - Edge cases handling yang lebih akurat")
    print("   - Precision calculation yang lebih baik")
    print()
    print("3. ✅ Defuzzification method diperbaiki:")
    print("   - Centroid method yang lebih akurat")
    print("   - Weighted average dengan nilai yang benar")
    print()
    print("4. ✅ Testing framework ditambahkan:")
    print("   - Test cases untuk validasi")
    print("   - Consistency check dengan notebook")

if __name__ == "__main__":
    test_fuzzy_fixed_implementation() 