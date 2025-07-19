#!/usr/bin/env python3
"""
Script test sederhana untuk memverifikasi implementasi fuzzy_logic.py yang baru
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'backend'))

# Simulasi enum KategoriPeluang
class KategoriPeluang:
    KECIL = "Peluang Lulus Kecil"
    SEDANG = "Peluang Lulus Sedang"
    TINGGI = "Peluang Lulus Tinggi"

def test_new_fuzzy_implementation():
    """Test implementasi fuzzy_logic.py yang baru"""
    print("🧪 TESTING IMPLEMENTASI FUZZY_LOGIC.PY YANG BARU")
    print("=" * 50)
    
    try:
        # Import fuzzy_logic yang baru dengan mock models
        import importlib.util
        spec = importlib.util.spec_from_file_location("fuzzy_logic", "src/backend/fuzzy_logic.py")
        fuzzy_logic = importlib.util.module_from_spec(spec)
        sys.modules["models"] = type(sys)("models")
        sys.modules["models"].KategoriPeluang = KategoriPeluang
        spec.loader.exec_module(fuzzy_logic)
        
        # Test dengan NIM 18602241076
        fuzzy_system = fuzzy_logic.FuzzyKelulusan()
        
        # Data test
        ipk = 3.4
        sks = 150
        persen_dek = 0.0
        
        print(f"📊 Data Test:")
        print(f"   IPK: {ipk}")
        print(f"   SKS: {sks}")
        print(f"   Persen DEK: {persen_dek}")
        print()
        
        # Hitung membership functions
        ipk_memberships = fuzzy_system.calculate_ipk_membership(ipk)
        sks_memberships = fuzzy_system.calculate_sks_membership(sks)
        nilai_dk_memberships = fuzzy_system.calculate_nilai_dk_membership(persen_dek)
        
        print(f"📈 Membership Functions:")
        print(f"   IPK (rendah, sedang, tinggi): {ipk_memberships}")
        print(f"   SKS (sedikit, sedang, banyak): {sks_memberships}")
        print(f"   DEK (sedikit, sedang, banyak): {nilai_dk_memberships}")
        print()
        
        # Hitung peluang kelulusan
        kategori, nilai_crisp, max_ipk, max_sks, max_dek = fuzzy_system.calculate_graduation_chance(ipk, sks, persen_dek)
        
        print(f"🎯 Hasil Perhitungan:")
        print(f"   Nilai Crisp: {nilai_crisp:.6f}")
        print(f"   Kategori: {kategori}")
        print(f"   Max IPK Membership: {max_ipk}")
        print(f"   Max SKS Membership: {max_sks}")
        print(f"   Max DEK Membership: {max_dek}")
        print()
        
        # Perbandingan dengan notebook
        notebook_result = 83.8677248677248
        diff = abs(nilai_crisp - notebook_result)
        
        print(f"📊 PERBANDINGAN DENGAN NOTEBOOK:")
        print(f"   Implementasi Baru: {nilai_crisp:.6f}")
        print(f"   FIS_SAW_fix.ipynb: {notebook_result:.6f}")
        print(f"   Selisih: {diff:.6f}")
        
        if diff <= 0.1:
            print(f"   ✅ KONSISTEN (dalam toleransi 0.1)")
            print(f"   🎉 IMPLEMENTASI BARU BERHASIL!")
            return True
        else:
            print(f"   ❌ MASIH BERBEDA")
            print(f"   🔧 Perlu perbaikan lebih lanjut")
            return False
            
    except Exception as e:
        print(f"❌ Error saat testing: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print("🎯 VERIFIKASI IMPLEMENTASI FUZZY_LOGIC.PY BARU")
    print("=" * 60)
    
    if test_new_fuzzy_implementation():
        print("\n✅ VERIFIKASI BERHASIL!")
        print("📋 Implementasi fuzzy_logic.py yang baru sudah konsisten dengan notebook")
        print("🚀 Sistem siap digunakan dengan implementasi yang diperbaiki")
    else:
        print("\n❌ VERIFIKASI GAGAL!")
        print("🔧 Perlu pemeriksaan dan perbaikan lebih lanjut")

if __name__ == "__main__":
    main() 