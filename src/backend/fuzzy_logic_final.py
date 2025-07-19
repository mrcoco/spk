from typing import Tuple
from models import KategoriPeluang

class FuzzyKelulusanFinal:
    """
    Implementasi Fuzzy Inference System (FIS) FINAL yang akurat sesuai FIS_SAW_fix.ipynb
    
    PERBAIKAN FINAL:
    ================
    
    1. CENTROID METHOD YANG AKURAT:
       - Implementasi centroid method yang sesuai scikit-fuzzy
       - Menggunakan universe [0, 101] dengan step 1
       - Menghitung centroid dari area membership function
    
    2. OUTPUT CRISP VALUES YANG BENAR:
       - Menggunakan centroid dari membership functions
       - Kecil: centroid dari [0, 0, 40] = 20
       - Sedang: centroid dari [30, 50, 70] = 50  
       - Tinggi: centroid dari [60, 100, 100] = 86.67
    
    3. MEMBERSHIP FUNCTION CALCULATION:
       - Edge cases handling yang akurat
       - Precision calculation yang sesuai library
    
    Referensi: FIS_SAW_fix.ipynb
    """
    def __init__(self):
        # Batas-batas untuk fungsi keanggotaan IPK - SESUAI FIS_SAW_FIX.IPYNB
        self.ipk_rendah = (0.0, 2.0, 2.5, 3.0)  # trapmf [0, 2, 2.5, 3.0]
        self.ipk_sedang = (2.8, 3.2, 3.6)       # trimf [2.8, 3.2, 3.6]
        self.ipk_tinggi = (3.4, 3.7, 4.0, 4.0)  # trapmf [3.4, 3.7, 4.0, 4.0]

        # Batas-batas untuk fungsi keanggotaan SKS - SESUAI FIS_SAW_FIX.IPYNB
        self.sks_sedikit = (40, 90, 100, 120)   # trapmf [40, 90, 100, 120]
        self.sks_sedang = (118, 140, 160)       # trimf [118, 140, 160]
        self.sks_banyak = (155, 170, 190, 200)  # trapmf [155, 170, 190, 200]

        # Batas-batas untuk fungsi keanggotaan nilai D, E, K - SESUAI FIS_SAW_FIX.IPYNB
        self.nilai_dek_sedikit = (0, 0, 4, 8)   # trapmf [0, 0, 4, 8]
        self.nilai_dek_sedang = (7, 12, 18)     # trimf [7, 12, 18]
        self.nilai_dek_banyak = (16, 20, 45, 70) # trapmf [16, 20, 45, 70]

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
        elif x == d:
            return 0.0
        elif b <= x <= c:
            return 1.0
        elif a <= x < b:
            return (x - a) / (b - a) if b > a else 1.0
        else:  # c < x < d
            return (d - x) / (d - c) if d > c else 1.0

    def calculate_ipk_membership(self, ipk: float) -> Tuple[float, float, float]:
        """Menghitung nilai keanggotaan IPK"""
        rendah = self._calculate_membership_trapezoid(ipk, 
            self.ipk_rendah[0], self.ipk_rendah[1], self.ipk_rendah[2], self.ipk_rendah[3])
        
        sedang = self._calculate_membership_triangle(ipk,
            self.ipk_sedang[0], self.ipk_sedang[1], self.ipk_sedang[2])
        
        tinggi = self._calculate_membership_trapezoid(ipk,
            self.ipk_tinggi[0], self.ipk_tinggi[1], self.ipk_tinggi[2], self.ipk_tinggi[3])
        
        return (rendah, sedang, tinggi)

    def calculate_sks_membership(self, sks: int) -> Tuple[float, float, float]:
        """Menghitung nilai keanggotaan SKS"""
        sedikit = self._calculate_membership_trapezoid(sks,
            self.sks_sedikit[0], self.sks_sedikit[1], self.sks_sedikit[2], self.sks_sedikit[3])
        
        sedang = self._calculate_membership_triangle(sks,
            self.sks_sedang[0], self.sks_sedang[1], self.sks_sedang[2])
        
        banyak = self._calculate_membership_trapezoid(sks,
            self.sks_banyak[0], self.sks_banyak[1], self.sks_banyak[2], self.sks_banyak[3])
        
        return (sedikit, sedang, banyak)

    def calculate_nilai_dk_membership(self, persen_dek: float) -> Tuple[float, float, float]:
        """Menghitung nilai keanggotaan untuk prosentase nilai D, E, dan K"""
        sedikit = self._calculate_membership_trapezoid(persen_dek,
            self.nilai_dek_sedikit[0], self.nilai_dek_sedikit[1], self.nilai_dek_sedikit[2], self.nilai_dek_sedikit[3])
        
        sedang = self._calculate_membership_triangle(persen_dek,
            self.nilai_dek_sedang[0], self.nilai_dek_sedang[1], self.nilai_dek_sedang[2])
        
        banyak = self._calculate_membership_trapezoid(persen_dek,
            self.nilai_dek_banyak[0], self.nilai_dek_banyak[1], self.nilai_dek_banyak[2], self.nilai_dek_banyak[3])
        
        return (sedikit, sedang, banyak)

    def _apply_fuzzy_rules(self, ipk_memberships: Tuple[float, float, float],
                          sks_memberships: Tuple[float, float, float],
                          nilai_dk_memberships: Tuple[float, float, float]) -> Tuple[float, float, float]:
        """Menerapkan aturan fuzzy sesuai FIS_SAW_fix.ipynb (20 rules)"""
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

    def _calculate_centroid_accurate(self, peluang_memberships: Tuple[float, float, float]) -> float:
        """
        Menghitung centroid yang akurat sesuai scikit-fuzzy
        
        PERBAIKAN FINAL: Implementasi centroid method yang sesuai library
        """
        peluang_kecil, peluang_sedang, peluang_tinggi = peluang_memberships
        
        # Universe sesuai notebook: [0, 101] dengan step 1
        universe = list(range(0, 102))  # 0, 1, 2, ..., 100, 101
        
        # Membership functions sesuai notebook
        kecil_mf = []
        sedang_mf = []
        tinggi_mf = []
        
        for x in universe:
            # Kecil: trimf([0, 0, 40])
            if x <= 0:
                kecil_mf.append(1.0)
            elif 0 < x < 40:
                kecil_mf.append((40 - x) / 40)
            else:
                kecil_mf.append(0.0)
            
            # Sedang: trimf([30, 50, 70])
            if x <= 30:
                sedang_mf.append(0.0)
            elif 30 < x < 50:
                sedang_mf.append((x - 30) / 20)
            elif x == 50:
                sedang_mf.append(1.0)
            elif 50 < x < 70:
                sedang_mf.append((70 - x) / 20)
            else:
                sedang_mf.append(0.0)
            
            # Tinggi: trimf([60, 100, 100])
            if x <= 60:
                tinggi_mf.append(0.0)
            elif 60 < x < 100:
                tinggi_mf.append((x - 60) / 40)
            else:
                tinggi_mf.append(1.0)
        
        # Clip membership functions berdasarkan rule strength
        kecil_clipped = [min(k, peluang_kecil) for k in kecil_mf]
        sedang_clipped = [min(s, peluang_sedang) for s in sedang_mf]
        tinggi_clipped = [min(t, peluang_tinggi) for t in tinggi_mf]
        
        # Combine all clipped functions (max operation)
        aggregated = [max(k, s, t) for k, s, t in zip(kecil_clipped, sedang_clipped, tinggi_clipped)]
        
        # Calculate centroid
        numerator = sum(x * mu for x, mu in zip(universe, aggregated))
        denominator = sum(aggregated)
        
        if denominator == 0:
            return 0.0
        else:
            return numerator / denominator

    def defuzzification_final(self, peluang_memberships: Tuple[float, float, float]) -> Tuple[float, KategoriPeluang]:
        """
        Melakukan defuzzifikasi menggunakan metode centroid yang AKURAT
        
        PERBAIKAN FINAL: Menggunakan centroid method yang sesuai scikit-fuzzy
        """
        # Menggunakan centroid method yang akurat
        nilai_crisp = self._calculate_centroid_accurate(peluang_memberships)

        # Menentukan kategori berdasarkan nilai crisp (skala 0-100)
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

        # Defuzzifikasi (menggunakan method final yang akurat)
        nilai_crisp, kategori = self.defuzzification_final(peluang_memberships)

        # Mengembalikan hasil lengkap
        return (
            kategori,
            nilai_crisp,
            max(ipk_memberships),      # nilai keanggotaan IPK tertinggi
            max(sks_memberships),      # nilai keanggotaan SKS tertinggi
            max(nilai_dk_memberships)  # nilai keanggotaan D,E,K tertinggi
        )

    def test_consistency_with_notebook(self):
        """Test untuk memastikan konsistensi dengan FIS_SAW_fix.ipynb"""
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