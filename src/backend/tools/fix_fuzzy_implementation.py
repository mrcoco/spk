#!/usr/bin/env python3
"""
Script untuk memperbaiki implementasi fuzzy_logic.py agar sesuai dengan FIS_SAW_fix.ipynb
"""

# Simulasi enum KategoriPeluang
class KategoriPeluang:
    KECIL = "Peluang Lulus Kecil"
    SEDANG = "Peluang Lulus Sedang"
    TINGGI = "Peluang Lulus Tinggi"

class FuzzyKelulusanFixed:
    """
    Implementasi Fuzzy Inference System (FIS) yang diperbaiki sesuai FIS_SAW_fix.ipynb
    """
    def __init__(self):
        # Membership functions sesuai notebook
        # IPK: trapmf untuk 'rendah' dan 'tinggi', trimf untuk 'sedang'
        self.ipk_rendah = (0.0, 2.0, 2.5, 3.0)  # trapmf [0, 2, 2.5, 3.0]
        self.ipk_sedang = (2.8, 3.2, 3.6)       # trimf [2.8, 3.2, 3.6]
        self.ipk_tinggi = (3.4, 3.7, 4.0, 4.0)  # trapmf [3.4, 3.7, 4.0, 4.0]

        # SKS: trapmf untuk 'sedikit' dan 'banyak', trimf untuk 'sedang'
        self.sks_sedikit = (40, 90, 100, 120)   # trapmf [40, 90, 100, 120]
        self.sks_sedang = (118, 140, 160)       # trimf [118, 140, 160]
        self.sks_banyak = (155, 170, 190, 200)  # trapmf [155, 170, 190, 200]

        # Nilai DEK: trapmf untuk 'sedikit' dan 'banyak', trimf untuk 'sedang'
        self.nilai_dek_sedikit = (0, 0, 4, 8)   # trapmf [0, 0, 4, 8]
        self.nilai_dek_sedang = (7, 12, 18)     # trimf [7, 12, 18]
        self.nilai_dek_banyak = (16, 20, 45, 70) # trapmf [16, 20, 45, 70]

        # Output crisp values sesuai notebook (centroid method)
        # Peluang_Lulus_Kecil = 20 (centroid dari fuzz.trimf([0, 0, 40]))
        # Peluang_Lulus_Sedang = 50 (centroid dari fuzz.trimf([30, 50, 70]))
        # Peluang_Lulus_Tinggi = 80 (centroid dari fuzz.trimf([60, 100, 100]))
        self.output_values = {
            'kecil': 20,    # Peluang_Lulus_Kecil
            'sedang': 50,   # Peluang_Lulus_Sedang
            'tinggi': 80    # Peluang_Lulus_Tinggi
        }

    def _calculate_membership_triangle(self, x: float, a: float, b: float, c: float) -> float:
        """Menghitung nilai keanggotaan menggunakan fungsi segitiga (trimf)"""
        if x <= a or x >= c:
            return 0.0
        elif x == b:
            return 1.0
        elif a < x < b:
            return (x - a) / (b - a)
        else:  # b < x < c
            return (c - x) / (c - b)

    def _calculate_membership_trapezoid(self, x: float, a: float, b: float, c: float, d: float) -> float:
        """Menghitung nilai keanggotaan menggunakan fungsi trapesium (trapmf)"""
        # Handle kasus khusus: trapezoid dengan sisi flat kanan (c = d)
        if c == d:
            if x < a:
                return 0.0
            elif x >= c:
                return 1.0
            elif a <= x < b:
                return (x - a) / (b - a) if b > a else 1.0
            else:  # b <= x < c
                return 1.0
        
        # Handle kasus khusus: trapezoid dengan sisi flat kiri (a = b)
        if a == b:
            if x < a:
                return 0.0
            elif x > d:
                return 0.0
            elif a <= x <= c:
                return 1.0
            else:  # c < x <= d
                return (d - x) / (d - c) if d > c else 1.0
        
        # Handle kasus normal: trapezoid dengan semua sisi
        if x < a or x > d:
            return 0.0
        elif x == d:  # Special case: x = d should return 0.0 for trapezoid
            return 0.0
        elif b <= x <= c:
            return 1.0
        elif a <= x < b:
            return (x - a) / (b - a) if b > a else 1.0
        else:  # c < x < d
            return (d - x) / (d - c) if d > c else 1.0

    def calculate_ipk_membership(self, ipk: float):
        """Menghitung nilai keanggotaan IPK sesuai notebook"""
        rendah = self._calculate_membership_trapezoid(ipk, 
            self.ipk_rendah[0], self.ipk_rendah[1], self.ipk_rendah[2], self.ipk_rendah[3])
        
        sedang = self._calculate_membership_triangle(ipk,
            self.ipk_sedang[0], self.ipk_sedang[1], self.ipk_sedang[2])
        
        tinggi = self._calculate_membership_trapezoid(ipk,
            self.ipk_tinggi[0], self.ipk_tinggi[1], self.ipk_tinggi[2], self.ipk_tinggi[3])
        
        return (rendah, sedang, tinggi)

    def calculate_sks_membership(self, sks: int):
        """Menghitung nilai keanggotaan SKS sesuai notebook"""
        sedikit = self._calculate_membership_trapezoid(sks,
            self.sks_sedikit[0], self.sks_sedikit[1], self.sks_sedikit[2], self.sks_sedikit[3])
        
        sedang = self._calculate_membership_triangle(sks,
            self.sks_sedang[0], self.sks_sedang[1], self.sks_sedang[2])
        
        banyak = self._calculate_membership_trapezoid(sks,
            self.sks_banyak[0], self.sks_banyak[1], self.sks_banyak[2], self.sks_banyak[3])
        
        return (sedikit, sedang, banyak)

    def calculate_nilai_dk_membership(self, persen_dek: float):
        """Menghitung nilai keanggotaan nilai DEK sesuai notebook"""
        sedikit = self._calculate_membership_trapezoid(persen_dek,
            self.nilai_dek_sedikit[0], self.nilai_dek_sedikit[1], self.nilai_dek_sedikit[2], self.nilai_dek_sedikit[3])
        
        sedang = self._calculate_membership_triangle(persen_dek,
            self.nilai_dek_sedang[0], self.nilai_dek_sedang[1], self.nilai_dek_sedang[2])
        
        banyak = self._calculate_membership_trapezoid(persen_dek,
            self.nilai_dek_banyak[0], self.nilai_dek_banyak[1], self.nilai_dek_banyak[2], self.nilai_dek_banyak[3])
        
        return (sedikit, sedang, banyak)

    def _apply_fuzzy_rules(self, ipk_memberships, sks_memberships, nilai_dk_memberships):
        """Menerapkan aturan fuzzy sesuai notebook (20 rules)"""
        # Unpacking nilai keanggotaan
        ipk_rendah, ipk_sedang, ipk_tinggi = ipk_memberships
        sks_sedikit, sks_sedang, sks_banyak = sks_memberships
        nilai_dek_sedikit, nilai_dek_sedang, nilai_dek_banyak = nilai_dk_memberships

        # Initialize output membership values
        peluang_kecil = 0.0
        peluang_sedang = 0.0
        peluang_tinggi = 0.0

        # 20 Rules sesuai notebook
        rules = [
            # Rule 1: ipk['tinggi'] & sks['banyak'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Tinggi']
            (ipk_tinggi, sks_banyak, nilai_dek_sedikit, 'tinggi'),
            # Rule 2: ipk['sedang'] & sks['sedang'] & nilai_dek['sedang'] → kelulusan['Peluang_Lulus_Sedang']
            (ipk_sedang, sks_sedang, nilai_dek_sedang, 'sedang'),
            # Rule 3: ipk['rendah'] & sks['sedikit'] & nilai_dek['banyak'] → kelulusan['Peluang_Lulus_Kecil']
            (ipk_rendah, sks_sedikit, nilai_dek_banyak, 'kecil'),
            # Rule 4: ipk['sedang'] & sks['sedang'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Tinggi']
            (ipk_sedang, sks_sedang, nilai_dek_sedikit, 'tinggi'),
            # Rule 5: ipk['rendah'] & sks['sedang'] & nilai_dek['banyak'] → kelulusan['Peluang_Lulus_Kecil']
            (ipk_rendah, sks_sedang, nilai_dek_banyak, 'kecil'),
            # Rule 6: ipk['tinggi'] & sks['sedang'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Tinggi']
            (ipk_tinggi, sks_sedang, nilai_dek_sedikit, 'tinggi'),
            # Rule 7: ipk['sedang'] & sks['banyak'] & nilai_dek['banyak'] → kelulusan['Peluang_Lulus_Kecil']
            (ipk_sedang, sks_banyak, nilai_dek_banyak, 'kecil'),
            # Rule 8: ipk['tinggi'] & sks['banyak'] & nilai_dek['banyak'] → kelulusan['Peluang_Lulus_Kecil']
            (ipk_tinggi, sks_banyak, nilai_dek_banyak, 'kecil'),
            # Rule 9: ipk['rendah'] & sks['sedang'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Sedang']
            (ipk_rendah, sks_sedang, nilai_dek_sedikit, 'sedang'),
            # Rule 10: ipk['rendah'] & sks['sedang'] & nilai_dek['sedang'] → kelulusan['Peluang_Lulus_Sedang']
            (ipk_rendah, sks_sedang, nilai_dek_sedang, 'sedang'),
            # Rule 11: ipk['sedang'] & sks['banyak'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Tinggi']
            (ipk_sedang, sks_banyak, nilai_dek_sedikit, 'tinggi'),
            # Rule 12: ipk['sedang'] & sks['sedikit'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Kecil']
            (ipk_sedang, sks_sedikit, nilai_dek_sedikit, 'kecil'),
            # Rule 13: ipk['rendah'] & sks['banyak'] & nilai_dek['banyak'] → kelulusan['Peluang_Lulus_Kecil']
            (ipk_rendah, sks_banyak, nilai_dek_banyak, 'kecil'),
            # Rule 14: ipk['rendah'] & sks['banyak'] & nilai_dek['sedang'] → kelulusan['Peluang_Lulus_Sedang']
            (ipk_rendah, sks_banyak, nilai_dek_sedang, 'sedang'),
            # Rule 15: ipk['sedang'] & sks['banyak'] & nilai_dek['sedang'] → kelulusan['Peluang_Lulus_Sedang']
            (ipk_sedang, sks_banyak, nilai_dek_sedang, 'sedang'),
            # Rule 16: ipk['rendah'] & sks['sedikit'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Kecil']
            (ipk_rendah, sks_sedikit, nilai_dek_sedikit, 'kecil'),
            # Rule 17: ipk['rendah'] & sks['banyak'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Sedang']
            (ipk_rendah, sks_banyak, nilai_dek_sedikit, 'sedang'),
            # Rule 18: ipk['tinggi'] & sks['sedikit'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Kecil']
            (ipk_tinggi, sks_sedikit, nilai_dek_sedikit, 'kecil'),
            # Rule 19: ipk['tinggi'] & sks['sedang'] & nilai_dek['sedang'] → kelulusan['Peluang_Lulus_Sedang']
            (ipk_tinggi, sks_sedang, nilai_dek_sedang, 'sedang'),
            # Rule 20: ipk['sedang'] & sks['sedikit'] & nilai_dek['sedang'] → kelulusan['Peluang_Lulus_Kecil']
            (ipk_sedang, sks_sedikit, nilai_dek_sedang, 'kecil'),
        ]

        # Apply all rules
        for ipk_val, sks_val, nilai_val, output_category in rules:
            rule_strength = min(ipk_val, sks_val, nilai_val)
            
            if output_category == 'kecil':
                peluang_kecil = max(peluang_kecil, rule_strength)
            elif output_category == 'sedang':
                peluang_sedang = max(peluang_sedang, rule_strength)
            elif output_category == 'tinggi':
                peluang_tinggi = max(peluang_tinggi, rule_strength)

        return (peluang_kecil, peluang_sedang, peluang_tinggi)

    def defuzzification(self, peluang_memberships):
        """Melakukan defuzzifikasi menggunakan metode centroid sesuai notebook"""
        peluang_kecil, peluang_sedang, peluang_tinggi = peluang_memberships
        
        # Output crisp values sesuai notebook (skala 0-100)
        nilai_kecil = self.output_values['kecil']    # 20
        nilai_sedang = self.output_values['sedang']  # 50
        nilai_tinggi = self.output_values['tinggi']  # 80

        # Weighted average (centroid method)
        numerator = (peluang_kecil * nilai_kecil + 
                    peluang_sedang * nilai_sedang + 
                    peluang_tinggi * nilai_tinggi)
        denominator = peluang_kecil + peluang_sedang + peluang_tinggi

        if denominator == 0:
            nilai_crisp = 0
        else:
            nilai_crisp = numerator / denominator

        # Menentukan kategori berdasarkan nilai crisp (skala 0-100)
        # Threshold sesuai notebook: 40 dan 60
        if nilai_crisp >= 60:
            kategori = KategoriPeluang.TINGGI
        elif nilai_crisp >= 40:
            kategori = KategoriPeluang.SEDANG
        else:
            kategori = KategoriPeluang.KECIL

        return nilai_crisp, kategori

    def calculate_graduation_chance(self, ipk: float, sks: int, persen_dek: float):
        """Menghitung peluang kelulusan berdasarkan IPK, SKS, dan prosentase nilai D, E, K"""
        # Fuzzifikasi
        ipk_memberships = self.calculate_ipk_membership(ipk)
        sks_memberships = self.calculate_sks_membership(sks)
        nilai_dk_memberships = self.calculate_nilai_dk_membership(persen_dek)

        # Inferensi
        peluang_memberships = self._apply_fuzzy_rules(ipk_memberships, sks_memberships, nilai_dk_memberships)

        # Defuzzifikasi
        nilai_crisp, kategori = self.defuzzification(peluang_memberships)

        # Mengembalikan hasil lengkap
        return (
            kategori,
            nilai_crisp,
            max(ipk_memberships),      # nilai keanggotaan IPK tertinggi
            max(sks_memberships),      # nilai keanggotaan SKS tertinggi
            max(nilai_dk_memberships)  # nilai keanggotaan D,E,K tertinggi
        )

def test_fixed_implementation():
    """Test implementasi yang diperbaiki"""
    print("🔧 TESTING FIXED FUZZY IMPLEMENTATION")
    print("=" * 50)
    
    # Data mahasiswa NIM 18602241076
    nim = 18602241076
    ipk = 3.4
    sks = 150
    persen_dek = 0.0
    
    print(f"NIM: {nim}")
    print(f"IPK: {ipk}")
    print(f"SKS: {sks}")
    print(f"Persen DEK: {persen_dek}")
    print()
    
    # Test implementasi yang diperbaiki
    fuzzy_system = FuzzyKelulusanFixed()
    
    # Hitung membership functions
    ipk_memberships = fuzzy_system.calculate_ipk_membership(ipk)
    sks_memberships = fuzzy_system.calculate_sks_membership(sks)
    nilai_dk_memberships = fuzzy_system.calculate_nilai_dk_membership(persen_dek)
    
    print("📊 MEMBERSHIP FUNCTIONS (FIXED):")
    print(f"IPK (rendah, sedang, tinggi): {ipk_memberships}")
    print(f"SKS (sedikit, sedang, banyak): {sks_memberships}")
    print(f"Nilai DEK (sedikit, sedang, banyak): {nilai_dk_memberships}")
    print()
    
    # Hitung hasil akhir
    kategori, nilai_crisp, max_ipk, max_sks, max_nilai_dk = fuzzy_system.calculate_graduation_chance(ipk, sks, persen_dek)
    
    print("🎯 HASIL FIXED IMPLEMENTATION:")
    print(f"Nilai Crisp: {nilai_crisp}")
    print(f"Kategori: {kategori}")
    print(f"Max IPK membership: {max_ipk}")
    print(f"Max SKS membership: {max_sks}")
    print(f"Max Nilai DEK membership: {max_nilai_dk}")
    print()
    
    return nilai_crisp, kategori

def compare_all_implementations():
    """Membandingkan semua implementasi"""
    print("🔍 COMPARISON OF ALL IMPLEMENTATIONS")
    print("=" * 50)
    
    # Data mahasiswa NIM 18602241076
    nim = 18602241076
    ipk = 3.4
    sks = 150
    persen_dek = 0.0
    
    print(f"Testing with NIM: {nim}")
    print(f"IPK: {ipk}, SKS: {sks}, Persen DEK: {persen_dek}")
    print()
    
    # Test implementasi yang diperbaiki
    fuzzy_result, fuzzy_category = test_fixed_implementation()
    
    # Hasil notebook
    notebook_result = 83.8677248677248
    notebook_category = "Peluang Lulus Tinggi"
    
    print("📊 FINAL COMPARISON:")
    print(f"Original fuzzy_logic.py: 60.00 (Peluang Lulus Sedang)")
    print(f"Fixed fuzzy_logic.py: {fuzzy_result:.2f} ({fuzzy_category})")
    print(f"FIS_SAW_fix.ipynb: {notebook_result:.2f} ({notebook_category})")
    print()
    
    print("✅ IMPROVEMENTS MADE:")
    print("1. Membership Functions:")
    print("   - IPK 'sedang' menggunakan trimf [2.8, 3.2, 3.6]")
    print("   - SKS 'sedang' menggunakan trimf [118, 140, 160]")
    print("   - Nilai DEK 'sedang' menggunakan trimf [7, 12, 18]")
    print()
    print("2. Fuzzy Rules:")
    print("   - Menggunakan 20 rules sesuai notebook")
    print("   - Mapping: sedikit→sedikit, sedang→sedang, banyak→banyak")
    print()
    print("3. Defuzzification:")
    print("   - Output values: 20, 50, 80 (sesuai centroid notebook)")
    print("   - Threshold: 40 dan 60 (sesuai notebook)")
    print()
    
    # Check if fixed implementation matches notebook
    if abs(fuzzy_result - notebook_result) < 1.0:
        print("🎉 SUCCESS: Fixed implementation matches notebook!")
    else:
        print("⚠️  WARNING: Still some differences remain")

if __name__ == "__main__":
    compare_all_implementations() 