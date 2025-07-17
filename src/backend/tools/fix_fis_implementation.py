#!/usr/bin/env python3
"""
Script untuk memperbaiki implementasi FIS agar sesuai dengan notebook
dan menghasilkan nilai yang konsisten
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import Mahasiswa, KategoriPeluang
import numpy as np

class FixedFuzzyKelulusan:
    """
    Implementasi FIS yang diperbaiki agar sesuai dengan FIS_SAW_fix.ipynb
    """
    def __init__(self):
        # Membership functions sesuai notebook
        # IPK
        self.ipk_ranges = {
            'rendah': (0, 2, 2.5, 3.0),      # trapesium
            'sedang': (2.8, 3.2, 3.6),       # segitiga
            'tinggi': (3.4, 3.7, 4.0, 4.0)   # trapesium
        }
        
        # SKS
        self.sks_ranges = {
            'sedikit': (40, 90, 100, 120),    # trapesium
            'sedang': (118, 140, 160),        # segitiga
            'banyak': (155, 170, 190, 200)    # trapesium
        }
        
        # Nilai D/E/K
        self.nilai_ranges = {
            'sedikit': (0, 0, 4, 8),         # trapesium
            'sedang': (7, 12, 18),           # segitiga
            'banyak': (16, 20, 45, 70)       # trapesium
        }
        
        # Output crisp values sesuai notebook
        self.output_values = {
            'Peluang_Lulus_Kecil': 20,
            'Peluang_Lulus_Sedang': 50,
            'Peluang_Lulus_Tinggi': 80
        }
    
    def membership_triangle(self, x, a, b, c):
        """Triangular membership function"""
        if x <= a or x >= c:
            return 0.0
        elif x == b:
            return 1.0
        elif a < x < b:
            return (x - a) / (b - a)
        else:  # b < x < c
            return (c - x) / (c - b)
    
    def membership_trapezoid(self, x, a, b, c, d):
        """Trapezoidal membership function"""
        if x < a or x > d:
            return 0.0
        elif b <= x <= c:
            return 1.0
        elif a <= x < b:
            return (x - a) / (b - a) if b > a else 1.0
        else:  # c < x <= d
            return (d - x) / (d - c) if d > c else 1.0
    
    def fuzzify_ipk(self, ipk):
        """Fuzzify IPK value"""
        return {
            'rendah': self.membership_trapezoid(ipk, *self.ipk_ranges['rendah']),
            'sedang': self.membership_triangle(ipk, *self.ipk_ranges['sedang']),
            'tinggi': self.membership_trapezoid(ipk, *self.ipk_ranges['tinggi'])
        }
    
    def fuzzify_sks(self, sks):
        """Fuzzify SKS value"""
        return {
            'sedikit': self.membership_trapezoid(sks, *self.sks_ranges['sedikit']),
            'sedang': self.membership_triangle(sks, *self.sks_ranges['sedang']),
            'banyak': self.membership_trapezoid(sks, *self.sks_ranges['banyak'])
        }
    
    def fuzzify_nilai(self, nilai):
        """Fuzzify % D/E/K value"""
        return {
            'sedikit': self.membership_trapezoid(nilai, *self.nilai_ranges['sedikit']),
            'sedang': self.membership_triangle(nilai, *self.nilai_ranges['sedang']),
            'banyak': self.membership_trapezoid(nilai, *self.nilai_ranges['banyak'])
        }
    
    def apply_rules(self, ipk_fuzzy, sks_fuzzy, nilai_fuzzy):
        """Apply fuzzy rules sesuai notebook"""
        output = {
            'Peluang_Lulus_Kecil': 0.0,
            'Peluang_Lulus_Sedang': 0.0,
            'Peluang_Lulus_Tinggi': 0.0
        }
        
        # Rules sesuai notebook (20 rules)
        rules = [
            # Rule 1: IPK tinggi & SKS banyak & nilai sedikit -> Tinggi
            ('tinggi', 'banyak', 'sedikit', 'Peluang_Lulus_Tinggi'),
            # Rule 2: IPK sedang & SKS sedang & nilai sedang -> Sedang
            ('sedang', 'sedang', 'sedang', 'Peluang_Lulus_Sedang'),
            # Rule 3: IPK rendah & SKS sedikit & nilai banyak -> Kecil
            ('rendah', 'sedikit', 'banyak', 'Peluang_Lulus_Kecil'),
            # Rule 4: IPK sedang & SKS sedang & nilai sedikit -> Tinggi
            ('sedang', 'sedang', 'sedikit', 'Peluang_Lulus_Tinggi'),
            # Rule 5: IPK rendah & SKS sedang & nilai banyak -> Kecil
            ('rendah', 'sedang', 'banyak', 'Peluang_Lulus_Kecil'),
            # Rule 6: IPK tinggi & SKS sedang & nilai sedikit -> Tinggi
            ('tinggi', 'sedang', 'sedikit', 'Peluang_Lulus_Tinggi'),
            # Rule 7: IPK sedang & SKS banyak & nilai banyak -> Kecil
            ('sedang', 'banyak', 'banyak', 'Peluang_Lulus_Kecil'),
            # Rule 8: IPK tinggi & SKS banyak & nilai banyak -> Kecil
            ('tinggi', 'banyak', 'banyak', 'Peluang_Lulus_Kecil'),
            # Rule 9: IPK rendah & SKS sedang & nilai sedikit -> Sedang
            ('rendah', 'sedang', 'sedikit', 'Peluang_Lulus_Sedang'),
            # Rule 10: IPK rendah & SKS sedang & nilai sedang -> Sedang
            ('rendah', 'sedang', 'sedang', 'Peluang_Lulus_Sedang'),
            # Rule 11: IPK sedang & SKS banyak & nilai sedikit -> Tinggi
            ('sedang', 'banyak', 'sedikit', 'Peluang_Lulus_Tinggi'),
            # Rule 12: IPK sedang & SKS sedikit & nilai sedikit -> Kecil
            ('sedang', 'sedikit', 'sedikit', 'Peluang_Lulus_Kecil'),
            # Rule 13: IPK rendah & SKS banyak & nilai banyak -> Kecil
            ('rendah', 'banyak', 'banyak', 'Peluang_Lulus_Kecil'),
            # Rule 14: IPK rendah & SKS banyak & nilai sedang -> Sedang
            ('rendah', 'banyak', 'sedang', 'Peluang_Lulus_Sedang'),
            # Rule 15: IPK sedang & SKS banyak & nilai sedang -> Sedang
            ('sedang', 'banyak', 'sedang', 'Peluang_Lulus_Sedang'),
            # Rule 16: IPK rendah & SKS sedikit & nilai sedikit -> Kecil
            ('rendah', 'sedikit', 'sedikit', 'Peluang_Lulus_Kecil'),
            # Rule 17: IPK rendah & SKS banyak & nilai sedikit -> Sedang
            ('rendah', 'banyak', 'sedikit', 'Peluang_Lulus_Sedang'),
            # Rule 18: IPK tinggi & SKS sedikit & nilai sedikit -> Kecil
            ('tinggi', 'sedikit', 'sedikit', 'Peluang_Lulus_Kecil'),
            # Rule 19: IPK tinggi & SKS sedang & nilai sedang -> Sedang
            ('tinggi', 'sedang', 'sedang', 'Peluang_Lulus_Sedang'),
            # Rule 20: IPK sedang & SKS sedikit & nilai sedang -> Kecil
            ('sedang', 'sedikit', 'sedang', 'Peluang_Lulus_Kecil'),
        ]
        
        for ipk_term, sks_term, nilai_term, output_term in rules:
            rule_strength = min(
                ipk_fuzzy[ipk_term],
                sks_fuzzy[sks_term],
                nilai_fuzzy[nilai_term]
            )
            output[output_term] = max(output[output_term], rule_strength)
        
        return output
    
    def defuzzify(self, output_fuzzy):
        """Defuzzify menggunakan centroid method"""
        numerator = sum(output_fuzzy[category] * self.output_values[category] 
                       for category in output_fuzzy)
        denominator = sum(output_fuzzy.values())
        
        if denominator == 0:
            return 0.0
        
        return numerator / denominator
    
    def calculate_kelulusan(self, ipk, sks, nilai_dek):
        """Calculate kelulusan probability"""
        # Fuzzification
        ipk_fuzzy = self.fuzzify_ipk(ipk)
        sks_fuzzy = self.fuzzify_sks(sks)
        nilai_fuzzy = self.fuzzify_nilai(nilai_dek)
        
        # Apply rules
        output_fuzzy = self.apply_rules(ipk_fuzzy, sks_fuzzy, nilai_fuzzy)
        
        # Defuzzification
        output_value = self.defuzzify(output_fuzzy)
        
        # Determine category
        if output_value >= 60:
            category = "Peluang Lulus Tinggi"
        elif output_value >= 40:
            category = "Peluang Lulus Sedang"
        else:
            category = "Peluang Lulus Kecil"
        
        return {
            'value': output_value,
            'category': category,
            'fuzzy_output': output_fuzzy,
            'ipk_membership': ipk_fuzzy,
            'sks_membership': sks_fuzzy,
            'nilai_membership': nilai_fuzzy
        }

def test_fixed_implementation():
    """Test implementasi yang diperbaiki"""
    print("🔧 Testing Fixed FIS Implementation")
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
    
    # Test dengan implementasi yang diperbaiki
    fuzzy_system = FixedFuzzyKelulusan()
    result = fuzzy_system.calculate_kelulusan(ipk, sks, nilai_dek)
    
    print("📊 Membership Values:")
    print(f"IPK: {result['ipk_membership']}")
    print(f"SKS: {result['sks_membership']}")
    print(f"% D/E/K: {result['nilai_membership']}")
    print()
    
    print("📈 Fuzzy Output:")
    print(f"Output Fuzzy: {result['fuzzy_output']}")
    print()
    
    print("🎯 Final Result:")
    print(f"Nilai Fuzzy: {result['value']:.2f}")
    print(f"Kategori: {result['category']}")
    print()
    
    return result

def compare_with_notebook():
    """Bandingkan dengan hasil notebook"""
    print("📊 COMPARISON: Fixed Implementation vs Notebook")
    print("=" * 60)
    
    # Hasil dari notebook (dari analisis sebelumnya)
    notebook_value = 80.00
    notebook_category = "Peluang Lulus Tinggi"
    
    # Hasil dari implementasi yang diperbaiki
    fixed_result = test_fixed_implementation()
    fixed_value = fixed_result['value']
    fixed_category = fixed_result['category']
    
    print("📈 COMPARISON RESULTS:")
    print("=" * 40)
    print(f"Notebook Implementation:")
    print(f"  - Nilai Fuzzy: {notebook_value:.2f}")
    print(f"  - Kategori: {notebook_category}")
    print()
    
    print(f"Fixed Implementation:")
    print(f"  - Nilai Fuzzy: {fixed_value:.2f}")
    print(f"  - Kategori: {fixed_category}")
    print()
    
    print(f"Difference:")
    print(f"  - Nilai: {abs(notebook_value - fixed_value):.2f}")
    print(f"  - Kategori sama: {notebook_category == fixed_category}")
    
    if abs(notebook_value - fixed_value) < 1:
        print("✅ SUCCESS: Implementasi sudah sesuai dengan notebook!")
    else:
        print("⚠️  WARNING: Masih ada perbedaan dengan notebook")

def update_database_with_fixed_result():
    """Update database dengan hasil yang diperbaiki"""
    print("💾 Updating Database with Fixed Result")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == '18209241051').first()
        
        if mahasiswa:
            # Hitung dengan implementasi yang diperbaiki
            fuzzy_system = FixedFuzzyKelulusan()
            result = fuzzy_system.calculate_kelulusan(
                mahasiswa.ipk, mahasiswa.sks, mahasiswa.persen_dek
            )
            
            # Update klasifikasi
            from models import KlasifikasiKelulusan
            from datetime import datetime
            
            existing_klasifikasi = db.query(KlasifikasiKelulusan).filter(
                KlasifikasiKelulusan.nim == '18209241051'
            ).first()
            
            if existing_klasifikasi:
                # Update existing
                existing_klasifikasi.nilai_fuzzy = result['value']
                existing_klasifikasi.kategori = result['category']
                existing_klasifikasi.ipk_membership = max(result['ipk_membership'].values())
                existing_klasifikasi.sks_membership = max(result['sks_membership'].values())
                existing_klasifikasi.nilai_dk_membership = max(result['nilai_membership'].values())
                existing_klasifikasi.updated_at = datetime.utcnow()
            else:
                # Create new
                new_klasifikasi = KlasifikasiKelulusan(
                    nim='18209241051',
                    nilai_fuzzy=result['value'],
                    kategori=result['category'],
                    ipk_membership=max(result['ipk_membership'].values()),
                    sks_membership=max(result['sks_membership'].values()),
                    nilai_dk_membership=max(result['nilai_membership'].values())
                )
                db.add(new_klasifikasi)
            
            db.commit()
            print("✅ Database berhasil diupdate!")
            print(f"Nilai Fuzzy baru: {result['value']:.2f}")
            print(f"Kategori baru: {result['category']}")
            
        else:
            print("❌ Mahasiswa dengan NIM 18209241051 tidak ditemukan")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 FIS Implementation Fix for NIM 18209241051")
    print("=" * 80)
    
    # Test implementasi yang diperbaiki
    compare_with_notebook()
    
    print("\n" + "="*80 + "\n")
    
    # Update database
    update_database_with_fixed_result() 