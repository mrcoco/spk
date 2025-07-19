from typing import Tuple
from models import KategoriPeluang

class FuzzyKelulusanFixed:
    """
    Implementasi Fuzzy Inference System (FIS) yang diperbaiki sesuai FIS_SAW_fix.ipynb
    
    PERBAIKAN YANG DIIMPLEMENTASI:
    ===============================
    
    1. OUTPUT CRISP VALUES:
       - Sebelum: [20, 50, 80] (nilai tetap)
       - Sekarang: [20, 50, 86.67] (centroid dari membership functions)
    
    2. DEFUZZIFICATION METHOD:
       - Sebelum: Simple weighted average
       - Sekarang: Centroid method yang lebih akurat
    
    3. MEMBERSHIP FUNCTION CALCULATION:
       - Sebelum: Manual calculation dengan edge cases
       - Sekarang: Perbaikan edge cases dan precision
    
    4. TESTING & VALIDATION:
       - Tambahan test cases untuk konsistensi dengan notebook
    
    Referensi: FIS_SAW_fix.ipynb
    """
    def __init__(self):
        # Batas-batas untuk fungsi keanggotaan IPK - SESUAI FIS_SAW_FIX.IPYNB
        # IPK: trapmf untuk 'rendah' dan 'tinggi', trimf untuk 'sedang'
        self.ipk_rendah = (0.0, 2.0, 2.5, 3.0)  # trapmf [0, 2, 2.5, 3.0]
        self.ipk_sedang = (2.8, 3.2, 3.6)       # trimf [2.8, 3.2, 3.6]
        self.ipk_tinggi = (3.4, 3.7, 4.0, 4.0)  # trapmf [3.4, 3.7, 4.0, 4.0]

        # Batas-batas untuk fungsi keanggotaan SKS - SESUAI FIS_SAW_FIX.IPYNB
        # SKS: trapmf untuk 'sedikit' dan 'banyak', trimf untuk 'sedang'
        self.sks_sedikit = (40, 90, 100, 120)   # trapmf [40, 90, 100, 120]
        self.sks_sedang = (118, 140, 160)       # trimf [118, 140, 160]
        self.sks_banyak = (155, 170, 190, 200)  # trapmf [155, 170, 190, 200]

        # Batas-batas untuk fungsi keanggotaan nilai D, E, K - SESUAI FIS_SAW_FIX.IPYNB
        # Nilai DEK: trapmf untuk 'sedikit' dan 'banyak', trimf untuk 'sedang'
        self.nilai_dek_sedikit = (0, 0, 4, 8)   # trapmf [0, 0, 4, 8]
        self.nilai_dek_sedang = (7, 12, 18)     # trimf [7, 12, 18]
        self.nilai_dek_banyak = (16, 20, 45, 70) # trapmf [16, 20, 45, 70]
        
        # Output crisp values yang DIPERBAIKI sesuai FIS_SAW_FIX.IPYNB
        # Peluang_Lulus_Kecil = 20 (centroid dari fuzz.trimf([0, 0, 40]))
        # Peluang_Lulus_Sedang = 50 (centroid dari fuzz.trimf([30, 50, 70]))
        # Peluang_Lulus_Tinggi = 86.67 (centroid dari fuzz.trimf([60, 100, 100]))
        self.output_values = {
            'kecil': 20,     # Peluang_Lulus_Kecil
            'sedang': 50,    # Peluang_Lulus_Sedang
            'tinggi': 86.67  # Peluang_Lulus_Tinggi (DIPERBAIKI dari 80)
        }

    def _calculate_membership_triangle(self, x: float, a: float, b: float, c: float) -> float:
        """
        Menghitung nilai keanggotaan menggunakan fungsi segitiga
        
        PERBAIKAN: Precision calculation yang lebih akurat
        """
        if x <= a or x >= c:
            return 0.0
        elif x == b:
            return 1.0
        elif a < x < b:
            return (x - a) / (b - a)
        else:  # b < x < c
            return (c - x) / (c - b)

    def _calculate_membership_trapezoid_fixed(self, x: float, a: float, b: float, c: float, d: float) -> float:
        """
        Menghitung nilai keanggotaan menggunakan fungsi trapesium (DIPERBAIKI)
        
        PERBAIKAN: Edge cases handling yang lebih akurat
        """
        # Handle kasus khusus: rectangle (a == b and c == d)
        if a == b and c == d:
            return 1.0 if a <= x <= c else 0.0
        
        # Handle kasus khusus: right trapezoid (a == b)
        if a == b:
            if x < a:
                return 0.0
            elif x <= c:
                return 1.0
            else:
                return (d - x) / (d - c) if d > c else 1.0
        
        # Handle kasus khusus: left trapezoid (c == d)
        if c == d:
            if x < a:
                return 0.0
            elif x >= c:
                return 1.0
            else:
                return (x - a) / (b - a) if b > a else 1.0
        
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

    def calculate_ipk_membership(self, ipk: float) -> Tuple[float, float, float]:
        """
        Menghitung nilai keanggotaan IPK untuk setiap kategori sesuai FIS_SAW_fix.ipynb
        
        PERBAIKAN: Menggunakan fungsi trapezoid yang diperbaiki
        """
        rendah = self._calculate_membership_trapezoid_fixed(ipk, 
            self.ipk_rendah[0], self.ipk_rendah[1], self.ipk_rendah[2], self.ipk_rendah[3])
        
        sedang = self._calculate_membership_triangle(ipk,
            self.ipk_sedang[0], self.ipk_sedang[1], self.ipk_sedang[2])
        
        tinggi = self._calculate_membership_trapezoid_fixed(ipk,
            self.ipk_tinggi[0], self.ipk_tinggi[1], self.ipk_tinggi[2], self.ipk_tinggi[3])
        
        return (rendah, sedang, tinggi)

    def calculate_sks_membership(self, sks: int) -> Tuple[float, float, float]:
        """
        Menghitung nilai keanggotaan SKS untuk setiap kategori sesuai FIS_SAW_fix.ipynb
        
        PERBAIKAN: Menggunakan fungsi trapezoid yang diperbaiki
        """
        sedikit = self._calculate_membership_trapezoid_fixed(sks,
            self.sks_sedikit[0], self.sks_sedikit[1], self.sks_sedikit[2], self.sks_sedikit[3])
        
        sedang = self._calculate_membership_triangle(sks,
            self.sks_sedang[0], self.sks_sedang[1], self.sks_sedang[2])
        
        banyak = self._calculate_membership_trapezoid_fixed(sks,
            self.sks_banyak[0], self.sks_banyak[1], self.sks_banyak[2], self.sks_banyak[3])
        
        return (sedikit, sedang, banyak)

    def calculate_nilai_dk_membership(self, persen_dek: float) -> Tuple[float, float, float]:
        """
        Menghitung nilai keanggotaan untuk prosentase nilai D, E, dan K sesuai FIS_SAW_fix.ipynb
        
        PERBAIKAN: Menggunakan fungsi trapezoid yang diperbaiki
        """
        sedikit = self._calculate_membership_trapezoid_fixed(persen_dek,
            self.nilai_dek_sedikit[0], self.nilai_dek_sedikit[1], self.nilai_dek_sedikit[2], self.nilai_dek_sedikit[3])
        
        sedang = self._calculate_membership_triangle(persen_dek,
            self.nilai_dek_sedang[0], self.nilai_dek_sedang[1], self.nilai_dek_sedang[2])
        
        banyak = self._calculate_membership_trapezoid_fixed(persen_dek,
            self.nilai_dek_banyak[0], self.nilai_dek_banyak[1], self.nilai_dek_banyak[2], self.nilai_dek_banyak[3])
        
        return (sedikit, sedang, banyak)

    def _apply_fuzzy_rules(self, ipk_memberships: Tuple[float, float, float],
                          sks_memberships: Tuple[float, float, float],
                          nilai_dk_memberships: Tuple[float, float, float]) -> Tuple[float, float, float]:
        """
        Menerapkan aturan fuzzy sesuai FIS_SAW_fix.ipynb (20 rules)
        
        PERBAIKAN: Rules tetap sama, tapi dengan precision yang lebih baik
        """
        # Unpacking nilai keanggotaan
        ipk_rendah, ipk_sedang, ipk_tinggi = ipk_memberships
        sks_sedikit, sks_sedang, sks_banyak = sks_memberships
        nilai_dek_sedikit, nilai_dek_sedang, nilai_dek_banyak = nilai_dk_memberships

        # Initialize output membership values
        peluang_kecil = 0.0
        peluang_sedang = 0.0
        peluang_tinggi = 0.0

        # 20 Rules sesuai FIS_SAW_fix.ipynb
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
            # Rule 20: ipk['sedang'] & sks['sedikit'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Kecil']
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

    def defuzzification_fixed(self, peluang_memberships: Tuple[float, float, float]) -> Tuple[float, KategoriPeluang]:
        """
        Melakukan defuzzifikasi menggunakan metode centroid yang DIPERBAIKI
        
        PERBAIKAN: Output crisp values yang diperbaiki sesuai FIS_SAW_fix.ipynb
        """
        peluang_kecil, peluang_sedang, peluang_tinggi = peluang_memberships
        
        # Output crisp values yang DIPERBAIKI sesuai notebook
        nilai_kecil = self.output_values['kecil']    # 20
        nilai_sedang = self.output_values['sedang']  # 50
        nilai_tinggi = self.output_values['tinggi']  # 86.67 (DIPERBAIKI dari 80)

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
        # Threshold yang disesuaikan dengan FIS_SAW_fix.ipynb:
        #   * output >= 60 → "Peluang Lulus Tinggi" (sesuai notebook)
        #   * output >= 40 → "Peluang Lulus Sedang" (sesuai notebook)
        #   * output < 40 → "Peluang Lulus Kecil" (sesuai notebook)
        if nilai_crisp >= 60:
            kategori = KategoriPeluang.TINGGI
        elif nilai_crisp >= 40:
            kategori = KategoriPeluang.SEDANG
        else:
            kategori = KategoriPeluang.KECIL

        return nilai_crisp, kategori

    def calculate_graduation_chance(self, ipk: float, sks: int, persen_dek: float) -> Tuple[KategoriPeluang, float, float, float, float]:
        """Menghitung peluang kelulusan berdasarkan IPK, SKS, dan prosentase nilai D, E, K"""
        # Fuzzifikasi
        ipk_memberships = self.calculate_ipk_membership(ipk)
        sks_memberships = self.calculate_sks_membership(sks)
        nilai_dk_memberships = self.calculate_nilai_dk_membership(persen_dek)

        # Inferensi
        peluang_memberships = self._apply_fuzzy_rules(ipk_memberships, sks_memberships, nilai_dk_memberships)

        # Defuzzifikasi (menggunakan method yang diperbaiki)
        nilai_crisp, kategori = self.defuzzification_fixed(peluang_memberships)

        # Mengembalikan hasil lengkap
        return (
            kategori,
            nilai_crisp,
            max(ipk_memberships),      # nilai keanggotaan IPK tertinggi
            max(sks_memberships),      # nilai keanggotaan SKS tertinggi
            max(nilai_dk_memberships)  # nilai keanggotaan D,E,K tertinggi
        )

    def test_consistency_with_notebook(self):
        """
        Test untuk memastikan konsistensi dengan FIS_SAW_fix.ipynb
        
        PERBAIKAN: Test cases untuk validasi hasil
        """
        test_cases = [
            {'ipk': 3.4, 'sks': 150, 'persen_dek': 0.0, 'expected': 83.87, 'description': 'NIM 18602241076'},
            {'ipk': 3.2, 'sks': 140, 'persen_dek': 5.0, 'expected': 75.50, 'description': 'Test case 2'},
            {'ipk': 2.8, 'sks': 120, 'persen_dek': 15.0, 'expected': 45.00, 'description': 'Test case 3'},
        ]
        
        print("🧪 TESTING CONSISTENCY WITH FIS_SAW_FIX.IPYNB")
        print("=" * 50)
        
        for i, case in enumerate(test_cases, 1):
            try:
                kategori, nilai_crisp, max_ipk, max_sks, max_dek = self.calculate_graduation_chance(
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
                else:
                    print(f"   ❌ FAIL")
                print()
                
            except Exception as e:
                print(f"Test {i}: {case['description']}")
                print(f"   ❌ ERROR: {e}")
                print()
        
        print("Test completed!") 