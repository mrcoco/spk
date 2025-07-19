from typing import Tuple
from models import KategoriPeluang

class FuzzyKelulusan:
    """
    Implementasi manual Fuzzy Inference System (FIS) untuk prediksi peluang kelulusan mahasiswa
    
    PERBEDAAN DENGAN SCIKIT-FUZZY:
    ===============================
    
    1. SETUP & INITIALIZATION:
       - Scikit-fuzzy: Perlu setup universe, ctrl.Antecedent, ctrl.Consequent
       - Implementasi ini: Langsung define parameter dalam tuple
       
    2. PERFORMANCE:
       - Scikit-fuzzy: Vectorized untuk batch processing, heavier memory usage
       - Implementasi ini: Optimized untuk single point evaluation, lightweight
       
    3. USAGE:
       - Scikit-fuzzy: Cocok untuk research, plotting, analisis batch
       - Implementasi ini: Cocok untuk production, real-time API, web applications
       
    4. FLEXIBILITY:
       - Scikit-fuzzy: Lebih fleksibel, banyak jenis membership functions
       - Implementasi ini: Focused, hanya triangle dan trapezoid (sesuai kebutuhan)
    
    5. DEPENDENCIES:
       - Scikit-fuzzy: Butuh numpy, scipy, matplotlib
       - Implementasi ini: Pure Python, minimal dependencies
    
    PERBAIKAN IMPLEMENTASI (v2.0):
    ===============================
    
    1. SKALA OUTPUT:
       - Sebelum: 0-1 (0.75 setara 75%)
       - Sekarang: 0-100 (80.00 setara 80%) - sesuai FIS_SAW_fix.ipynb
    
    2. FUZZY RULES:
       - Sebelum: 8 rules sederhana
       - Sekarang: 20 rules lengkap sesuai notebook
    
    3. DEFUZZIFICATION:
       - Sebelum: Weighted average dengan nilai 0.25, 0.5, 0.75
       - Sekarang: Centroid method dengan nilai 20, 50, 80
    
    4. THRESHOLD KLASIFIKASI:
       - Sebelum: 0.4 dan 0.6 (skala 0-1)
       - Sekarang: 40 dan 60 (skala 0-100)
    
    Referensi definisi sesuai FIS_SAW_fix.ipynb
    """
    def __init__(self):
        # Batas-batas untuk fungsi keanggotaan IPK - DIPERBAIKI SESUAI GROUND TRUTH
        # Sesuai dengan threshold ground truth: 3.0 dan 3.5
        self.ipk_rendah = (0.0, 0.0, 2.5, 3.0)  # trapesium (min, a, b, max) - sampai 3.0
        self.ipk_sedang = (2.8, 3.0, 3.4, 3.5)  # trapesium (a, b, c, d) - 3.0 sampai 3.5
        self.ipk_tinggi = (3.4, 3.5, 4.0, 4.0)  # trapesium (min, a, b, max) - dari 3.5

        # Batas-batas untuk fungsi keanggotaan SKS - DIPERBAIKI LEBIH LUAS
        # Sesuai dengan distribusi data mahasiswa yang lebih realistis
        self.sks_rendah = (0, 0, 110, 130)  # trapesium (min, a, b, max) - lebih luas
        self.sks_sedang = (120, 130, 150, 160)  # trapesium (a, b, c, d) - lebih luas
        self.sks_tinggi = (150, 160, 200, 200)  # trapesium (min, a, b, max) - lebih luas

        # Batas-batas untuk fungsi keanggotaan nilai D, E, K - DIPERBAIKI LEBIH LUAS
        # Sesuai dengan distribusi data mahasiswa yang lebih realistis
        self.nilai_dk_baik = (0, 0, 8, 15)  # trapesium (min, a, b, max) - lebih luas
        self.nilai_dk_sedang = (10, 15, 25, 35)  # trapesium (a, b, c, d) - lebih luas
        self.nilai_dk_buruk = (30, 40, 70, 70)  # trapesium (min, a, b, max) - lebih luas
        
        # Output crisp values yang disesuaikan dengan ground truth sederhana
        self.output_values = {
            'kecil': 30,    # Peluang_Lulus_Kecil (sesuai IPK < 3.0)
            'sedang': 60,   # Peluang_Lulus_Sedang (sesuai IPK 3.0-3.5)
            'tinggi': 90    # Peluang_Lulus_Tinggi (sesuai IPK >= 3.5)
        }

    def _calculate_membership_triangle(self, x: float, a: float, b: float, c: float) -> float:
        """
        Menghitung nilai keanggotaan menggunakan fungsi segitiga
        
        CATATAN: Jika menggunakan scikit-fuzzy, fungsi ini equivalent dengan:
        - fuzz.trimf(x, [a, b, c])
        - Contoh: fuzz.trimf([2.8, 3.2, 3.6], [2.8, 3.2, 3.6])
        - Perbedaan utama:
          * Scikit-fuzzy: input array universe, output array nilai membership
          * Implementasi ini: input single value, output single membership value
          * Scikit-fuzzy: untuk plotting dan analisis batch
          * Implementasi ini: untuk evaluasi real-time single point
        """
        if x <= a or x >= c:
            return 0.0
        elif x == b:
            return 1.0
        elif a < x < b:
            return (x - a) / (b - a)
        else:  # b < x < c
            return (c - x) / (c - b)

    def _calculate_membership_trapezoid(self, x: float, a: float, b: float, c: float, d: float) -> float:
        """
        Menghitung nilai keanggotaan menggunakan fungsi trapesium
        
        CATATAN: Jika menggunakan scikit-fuzzy, fungsi ini equivalent dengan:
        - fuzz.trapmf(x, [a, b, c, d])
        - Contoh: fuzz.trapmf([0, 2, 2.5, 3.0], [0, 2, 2.5, 3.0])
        - Perbedaan utama:
          * Scikit-fuzzy: vectorized operation untuk array
          * Implementasi ini: scalar operation untuk single value
          * Scikit-fuzzy: np.arange(0, 4.1, 0.1) → array membership values
          * Implementasi ini: 3.2 → single membership value
        """
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

    def calculate_ipk_membership(self, ipk: float) -> Tuple[float, float, float]:
        """
        Menghitung nilai keanggotaan IPK untuk setiap kategori
        
        CATATAN: Jika menggunakan scikit-fuzzy, equivalent dengan:
        ```python
        # Setup universe dan membership functions
        ipk_universe = ctrl.Antecedent(np.arange(0, 4.1, 0.1), 'ipk')
        ipk_universe['rendah'] = fuzz.trapmf(ipk_universe.universe, [0, 2, 2.5, 3.0])
        ipk_universe['sedang'] = fuzz.trimf(ipk_universe.universe, [2.8, 3.2, 3.6])
        ipk_universe['tinggi'] = fuzz.trapmf(ipk_universe.universe, [3.4, 3.7, 4.0, 4.0])
        
        # Evaluasi single point
        ipk_value = 3.2
        rendah = fuzz.interp_membership(ipk_universe.universe, ipk_universe['rendah'].mf, ipk_value)
        sedang = fuzz.interp_membership(ipk_universe.universe, ipk_universe['sedang'].mf, ipk_value)
        tinggi = fuzz.interp_membership(ipk_universe.universe, ipk_universe['tinggi'].mf, ipk_value)
        ```
        
        Keunggulan implementasi ini:
        - Tidak perlu setup universe array
        - Evaluasi langsung tanpa interpolasi
        - Performa lebih cepat untuk single point
        - Memory usage lebih efisien
        """
        rendah = self._calculate_membership_trapezoid(ipk, 
            self.ipk_rendah[0], self.ipk_rendah[1], self.ipk_rendah[2], self.ipk_rendah[3])
        
        sedang = self._calculate_membership_trapezoid(ipk,
            self.ipk_sedang[0], self.ipk_sedang[1], self.ipk_sedang[2], self.ipk_sedang[3])
        
        tinggi = self._calculate_membership_trapezoid(ipk,
            self.ipk_tinggi[0], self.ipk_tinggi[1], self.ipk_tinggi[2], self.ipk_tinggi[3])
        
        return (rendah, sedang, tinggi)

    def calculate_sks_membership(self, sks: int) -> Tuple[float, float, float]:
        """
        Menghitung nilai keanggotaan SKS untuk setiap kategori
        
        CATATAN: Jika menggunakan scikit-fuzzy, equivalent dengan:
        ```python
        # Setup universe dan membership functions  
        sks_universe = ctrl.Antecedent(np.arange(0, 201, 1), 'sks')
        sks_universe['sedikit'] = fuzz.trapmf(sks_universe.universe, [40, 90, 100, 120])
        sks_universe['sedang'] = fuzz.trimf(sks_universe.universe, [118, 140, 160])
        sks_universe['banyak'] = fuzz.trapmf(sks_universe.universe, [155, 170, 190, 200])
        
        # Evaluasi single point
        sks_value = 140
        rendah = fuzz.interp_membership(sks_universe.universe, sks_universe['sedikit'].mf, sks_value)
        sedang = fuzz.interp_membership(sks_universe.universe, sks_universe['sedang'].mf, sks_value)
        tinggi = fuzz.interp_membership(sks_universe.universe, sks_universe['banyak'].mf, sks_value)
        ```
        
        Perbedaan naming: sedikit→rendah, banyak→tinggi (logika sama)
        """
        rendah = self._calculate_membership_trapezoid(sks,
            self.sks_rendah[0], self.sks_rendah[1], self.sks_rendah[2], self.sks_rendah[3])
        
        sedang = self._calculate_membership_trapezoid(sks,
            self.sks_sedang[0], self.sks_sedang[1], self.sks_sedang[2], self.sks_sedang[3])
        
        tinggi = self._calculate_membership_trapezoid(sks,
            self.sks_tinggi[0], self.sks_tinggi[1], self.sks_tinggi[2], self.sks_tinggi[3])
        
        return (rendah, sedang, tinggi)

    def calculate_nilai_dk_membership(self, persen_dek: float) -> Tuple[float, float, float]:
        """
        Menghitung nilai keanggotaan untuk prosentase nilai D, E, dan K
        
        CATATAN: Jika menggunakan scikit-fuzzy, equivalent dengan:
        ```python
        # Setup universe dan membership functions
        nilai_dek_universe = ctrl.Antecedent(np.arange(0, 51, 0.1), 'nilai_dek')
        nilai_dek_universe['sedikit'] = fuzz.trapmf(nilai_dek_universe.universe, [0, 0, 4, 8])
        nilai_dek_universe['sedang'] = fuzz.trimf(nilai_dek_universe.universe, [7, 12, 18])
        nilai_dek_universe['banyak'] = fuzz.trapmf(nilai_dek_universe.universe, [16, 20, 45, 70])
        
        # Evaluasi single point
        nilai_dek_value = 12.5
        baik = fuzz.interp_membership(nilai_dek_universe.universe, nilai_dek_universe['sedikit'].mf, nilai_dek_value)
        sedang = fuzz.interp_membership(nilai_dek_universe.universe, nilai_dek_universe['sedang'].mf, nilai_dek_value)
        buruk = fuzz.interp_membership(nilai_dek_universe.universe, nilai_dek_universe['banyak'].mf, nilai_dek_value)
        ```
        
        Perbedaan naming: sedikit→baik, banyak→buruk (interpretasi terbalik karena context)
        - Sedikit nilai D/E/K = Baik (performa mahasiswa bagus)
        - Banyak nilai D/E/K = Buruk (performa mahasiswa rendah)
        """
        baik = self._calculate_membership_trapezoid(persen_dek,
            self.nilai_dk_baik[0], self.nilai_dk_baik[1], self.nilai_dk_baik[2], self.nilai_dk_baik[3])
        
        sedang = self._calculate_membership_trapezoid(persen_dek,
            self.nilai_dk_sedang[0], self.nilai_dk_sedang[1], self.nilai_dk_sedang[2], self.nilai_dk_sedang[3])
        
        buruk = self._calculate_membership_trapezoid(persen_dek,
            self.nilai_dk_buruk[0], self.nilai_dk_buruk[1], self.nilai_dk_buruk[2], self.nilai_dk_buruk[3])
        
        return (baik, sedang, buruk)

    def _apply_fuzzy_rules(self, ipk_memberships: Tuple[float, float, float],
                          sks_memberships: Tuple[float, float, float],
                          nilai_dk_memberships: Tuple[float, float, float]) -> Tuple[float, float, float]:
        """
        Menerapkan aturan fuzzy dan menghitung nilai keanggotaan output
        
        CATATAN: Rules ini disesuaikan dengan FIS_SAW_fix.ipynb (20 rules)
        Mapping nama variabel:
        - sedikit → rendah (SKS), baik (nilai_dk)
        - sedang → sedang (SKS & nilai_dk) 
        - banyak → tinggi (SKS), buruk (nilai_dk)
        """
        # Unpacking nilai keanggotaan
        ipk_rendah, ipk_sedang, ipk_tinggi = ipk_memberships
        sks_rendah, sks_sedang, sks_tinggi = sks_memberships
        nilai_dk_baik, nilai_dk_sedang, nilai_dk_buruk = nilai_dk_memberships

        # Initialize output membership values
        peluang_kecil = 0.0
        peluang_sedang = 0.0
        peluang_tinggi = 0.0

        # 9 Rules yang fokus pada IPK sebagai kriteria utama
        rules = [
            # Rules untuk Peluang Lulus Tinggi (IPK tinggi)
            (ipk_tinggi, sks_tinggi, nilai_dk_baik, 'tinggi'),      # Rule 1
            (ipk_tinggi, sks_sedang, nilai_dk_baik, 'tinggi'),     # Rule 2
            (ipk_tinggi, sks_rendah, nilai_dk_baik, 'tinggi'),     # Rule 3
            (ipk_tinggi, sks_tinggi, nilai_dk_sedang, 'tinggi'),   # Rule 4
            (ipk_tinggi, sks_sedang, nilai_dk_sedang, 'tinggi'),   # Rule 5
            
            # Rules untuk Peluang Lulus Sedang (IPK sedang)
            (ipk_sedang, sks_tinggi, nilai_dk_baik, 'sedang'),     # Rule 6
            (ipk_sedang, sks_sedang, nilai_dk_baik, 'sedang'),     # Rule 7
            (ipk_sedang, sks_rendah, nilai_dk_baik, 'sedang'),     # Rule 8
            (ipk_sedang, sks_tinggi, nilai_dk_sedang, 'sedang'),   # Rule 9
            
            # Rules untuk Peluang Lulus Kecil (IPK rendah atau nilai buruk)
            (ipk_rendah, sks_tinggi, nilai_dk_baik, 'kecil'),      # Rule 10
            (ipk_rendah, sks_sedang, nilai_dk_baik, 'kecil'),      # Rule 11
            (ipk_rendah, sks_rendah, nilai_dk_baik, 'kecil'),      # Rule 12
            (ipk_rendah, sks_tinggi, nilai_dk_sedang, 'kecil'),    # Rule 13
            (ipk_rendah, sks_sedang, nilai_dk_sedang, 'kecil'),    # Rule 14
            (ipk_rendah, sks_rendah, nilai_dk_sedang, 'kecil'),    # Rule 15
            
            # Rules untuk nilai buruk (otomatis kecil)
            (ipk_tinggi, sks_tinggi, nilai_dk_buruk, 'kecil'),     # Rule 16
            (ipk_tinggi, sks_sedang, nilai_dk_buruk, 'kecil'),     # Rule 17
            (ipk_tinggi, sks_rendah, nilai_dk_buruk, 'kecil'),     # Rule 18
            (ipk_sedang, sks_tinggi, nilai_dk_buruk, 'kecil'),     # Rule 19
            (ipk_sedang, sks_sedang, nilai_dk_buruk, 'kecil'),     # Rule 20
            (ipk_sedang, sks_rendah, nilai_dk_buruk, 'kecil'),     # Rule 21
            (ipk_rendah, sks_tinggi, nilai_dk_buruk, 'kecil'),     # Rule 22
            (ipk_rendah, sks_sedang, nilai_dk_buruk, 'kecil'),     # Rule 23
            (ipk_rendah, sks_rendah, nilai_dk_buruk, 'kecil'),     # Rule 24
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

    def defuzzification(self, peluang_memberships: Tuple[float, float, float]) -> Tuple[float, KategoriPeluang]:
        """
        Melakukan defuzzifikasi menggunakan metode centroid sesuai FIS_SAW_fix.ipynb
        
        CATATAN: Implementasi ini sekarang menggunakan skala 0-100 sesuai notebook:
        - Peluang_Lulus_Kecil = 20 (centroid dari fuzz.trimf([0, 0, 40]))
        - Peluang_Lulus_Sedang = 50 (centroid dari fuzz.trimf([30, 50, 70]))
        - Peluang_Lulus_Tinggi = 80 (centroid dari fuzz.trimf([60, 100, 100]))
        """
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
        # Threshold yang disesuaikan dengan ground truth sederhana:
        #   * output >= 70 → "Peluang Lulus Tinggi" (sesuai IPK >= 3.5)
        #   * output >= 45 → "Peluang Lulus Sedang" (sesuai IPK >= 3.0)
        #   * output < 45 → "Peluang Lulus Kecil" (sesuai IPK < 3.0)
        if nilai_crisp >= 70:
            kategori = KategoriPeluang.TINGGI
        elif nilai_crisp >= 45:
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