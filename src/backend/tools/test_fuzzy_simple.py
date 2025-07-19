#!/usr/bin/env python3
"""
Script sederhana untuk membandingkan implementasi fuzzy_logic.py dengan FIS_SAW_fix.ipynb
untuk NIM 18602241076 tanpa bergantung pada database
"""

# Simulasi implementasi fuzzy_logic.py
class SimpleFuzzyKelulusan:
    def __init__(self):
        # Batas-batas untuk fungsi keanggotaan IPK
        self.ipk_rendah = (0.0, 2.0, 2.5, 3.0)  # trapmf
        self.ipk_sedang = (2.8, 3.2, 3.6)       # trimf
        self.ipk_tinggi = (3.4, 3.7, 4.0, 4.0)  # trapmf

        # Batas-batas untuk fungsi keanggotaan SKS
        self.sks_sedikit = (40, 90, 100, 120)   # trapmf
        self.sks_sedang = (118, 140, 160)       # trimf
        self.sks_banyak = (155, 170, 190, 200)  # trapmf

        # Batas-batas untuk fungsi keanggotaan nilai D, E, K
        self.nilai_dek_sedikit = (0, 0, 4, 8)   # trapmf
        self.nilai_dek_sedang = (7, 12, 18)     # trimf
        self.nilai_dek_banyak = (16, 20, 45, 70) # trapmf
        
        # Output crisp values
        self.output_values = {
            'kecil': 20,    # Peluang_Lulus_Kecil
            'sedang': 50,   # Peluang_Lulus_Sedang
            'tinggi': 80    # Peluang_Lulus_Tinggi
        }

    def _calculate_membership_triangle(self, x: float, a: float, b: float, c: float) -> float:
        """Menghitung nilai keanggotaan menggunakan fungsi segitiga"""
        if x <= a or x >= c:
            return 0.0
        elif x == b:
            return 1.0
        elif a < x < b:
            return (x - a) / (b - a)
        else:  # b < x < c
            return (c - x) / (c - b)

    def _calculate_membership_trapezoid(self, x: float, a: float, b: float, c: float, d: float) -> float:
        """Menghitung nilai keanggotaan menggunakan fungsi trapesium"""
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
        elif x == d:
            return 0.0
        elif b <= x <= c:
            return 1.0
        elif a <= x < b:
            return (x - a) / (b - a) if b > a else 1.0
        else:  # c < x < d
            return (d - x) / (d - c) if d > c else 1.0

    def calculate_ipk_membership(self, ipk: float):
        """Menghitung nilai keanggotaan IPK"""
        rendah = self._calculate_membership_trapezoid(ipk, 
            self.ipk_rendah[0], self.ipk_rendah[1], self.ipk_rendah[2], self.ipk_rendah[3])
        
        sedang = self._calculate_membership_triangle(ipk,
            self.ipk_sedang[0], self.ipk_sedang[1], self.ipk_sedang[2])
        
        tinggi = self._calculate_membership_trapezoid(ipk,
            self.ipk_tinggi[0], self.ipk_tinggi[1], self.ipk_tinggi[2], self.ipk_tinggi[3])
        
        return (rendah, sedang, tinggi)

    def calculate_sks_membership(self, sks: int):
        """Menghitung nilai keanggotaan SKS"""
        sedikit = self._calculate_membership_trapezoid(sks,
            self.sks_sedikit[0], self.sks_sedikit[1], self.sks_sedikit[2], self.sks_sedikit[3])
        
        sedang = self._calculate_membership_triangle(sks,
            self.sks_sedang[0], self.sks_sedang[1], self.sks_sedang[2])
        
        banyak = self._calculate_membership_trapezoid(sks,
            self.sks_banyak[0], self.sks_banyak[1], self.sks_banyak[2], self.sks_banyak[3])
        
        return (sedikit, sedang, banyak)

    def calculate_nilai_dk_membership(self, persen_dek: float):
        """Menghitung nilai keanggotaan untuk prosentase nilai D, E, dan K"""
        sedikit = self._calculate_membership_trapezoid(persen_dek,
            self.nilai_dek_sedikit[0], self.nilai_dek_sedikit[1], self.nilai_dek_sedikit[2], self.nilai_dek_sedikit[3])
        
        sedang = self._calculate_membership_triangle(persen_dek,
            self.nilai_dek_sedang[0], self.nilai_dek_sedang[1], self.nilai_dek_sedang[2])
        
        banyak = self._calculate_membership_trapezoid(persen_dek,
            self.nilai_dek_banyak[0], self.nilai_dek_banyak[1], self.nilai_dek_banyak[2], self.nilai_dek_banyak[3])
        
        return (sedikit, sedang, banyak)

    def _apply_fuzzy_rules(self, ipk_memberships, sks_memberships, nilai_dk_memberships):
        """Menerapkan aturan fuzzy (20 rules)"""
        ipk_rendah, ipk_sedang, ipk_tinggi = ipk_memberships
        sks_sedikit, sks_sedang, sks_banyak = sks_memberships
        nilai_dek_sedikit, nilai_dek_sedang, nilai_dek_banyak = nilai_dk_memberships

        # Initialize output membership values
        peluang_kecil = 0.0
        peluang_sedang = 0.0
        peluang_tinggi = 0.0

        # 20 Rules sesuai FIS_SAW_fix.ipynb
        rules = [
            (ipk_tinggi, sks_banyak, nilai_dek_sedikit, 'tinggi'),
            (ipk_sedang, sks_sedang, nilai_dek_sedang, 'sedang'),
            (ipk_rendah, sks_sedikit, nilai_dek_banyak, 'kecil'),
            (ipk_sedang, sks_sedang, nilai_dek_sedikit, 'tinggi'),
            (ipk_rendah, sks_sedang, nilai_dek_banyak, 'kecil'),
            (ipk_tinggi, sks_sedang, nilai_dek_sedikit, 'tinggi'),
            (ipk_sedang, sks_banyak, nilai_dek_banyak, 'kecil'),
            (ipk_tinggi, sks_banyak, nilai_dek_banyak, 'kecil'),
            (ipk_rendah, sks_sedang, nilai_dek_sedikit, 'sedang'),
            (ipk_rendah, sks_sedang, nilai_dek_sedang, 'sedang'),
            (ipk_sedang, sks_banyak, nilai_dek_sedikit, 'tinggi'),
            (ipk_sedang, sks_sedikit, nilai_dek_sedikit, 'kecil'),
            (ipk_rendah, sks_banyak, nilai_dek_banyak, 'kecil'),
            (ipk_rendah, sks_banyak, nilai_dek_sedang, 'sedang'),
            (ipk_sedang, sks_banyak, nilai_dek_sedang, 'sedang'),
            (ipk_rendah, sks_sedikit, nilai_dek_sedikit, 'kecil'),
            (ipk_rendah, sks_banyak, nilai_dek_sedikit, 'sedang'),
            (ipk_tinggi, sks_sedikit, nilai_dek_sedikit, 'kecil'),
            (ipk_tinggi, sks_sedang, nilai_dek_sedang, 'sedang'),
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
        """Melakukan defuzzifikasi menggunakan metode centroid"""
        peluang_kecil, peluang_sedang, peluang_tinggi = peluang_memberships
        
        # Output crisp values
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

        return nilai_crisp

    def calculate_graduation_chance(self, ipk: float, sks: int, persen_dek: float):
        """Menghitung peluang kelulusan"""
        # Fuzzifikasi
        ipk_memberships = self.calculate_ipk_membership(ipk)
        sks_memberships = self.calculate_sks_membership(sks)
        nilai_dk_memberships = self.calculate_nilai_dk_membership(persen_dek)

        # Inferensi
        peluang_memberships = self._apply_fuzzy_rules(ipk_memberships, sks_memberships, nilai_dk_memberships)

        # Defuzzifikasi
        nilai_crisp = self.defuzzification(peluang_memberships)

        return nilai_crisp

def test_fuzzy_comparison():
    """Test perbandingan implementasi fuzzy untuk NIM 18602241076"""
    print("🔍 PERBANDINGAN IMPLEMENTASI FUZZY LOGIC")
    print("=" * 50)
    
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
    
    # Test implementasi fuzzy_logic.py
    print("🐍 Implementasi fuzzy_logic.py:")
    print("-" * 30)
    
    try:
        fuzzy_system = SimpleFuzzyKelulusan()
        
        # Hitung membership functions
        ipk_memberships = fuzzy_system.calculate_ipk_membership(ipk)
        sks_memberships = fuzzy_system.calculate_sks_membership(sks)
        nilai_dk_memberships = fuzzy_system.calculate_nilai_dk_membership(persen_dek)
        
        print(f"   IPK Membership (rendah, sedang, tinggi): {ipk_memberships}")
        print(f"   SKS Membership (sedikit, sedang, banyak): {sks_memberships}")
        print(f"   Nilai DEK Membership (sedikit, sedang, banyak): {nilai_dk_memberships}")
        
        # Hitung peluang kelulusan
        nilai_crisp = fuzzy_system.calculate_graduation_chance(ipk, sks, persen_dek)
        
        print(f"   Nilai Crisp: {nilai_crisp:.6f}")
        
        fuzzy_logic_result = nilai_crisp
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        fuzzy_logic_result = None
    
    print()
    
    # Hasil dari FIS_SAW_fix.ipynb
    print("📓 Hasil dari FIS_SAW_fix.ipynb:")
    print("-" * 30)
    print(f"   Nilai Crisp: 83.8677248677248")
    
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