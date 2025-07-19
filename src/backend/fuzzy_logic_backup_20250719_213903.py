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
        # Batas-batas untuk fungsi keanggotaan IPK - DIPERBAIKI SESUAI FIS_SAW_FIX.IPYNB
        # IPK: trapmf untuk 'rendah' dan 'tinggi', trimf untuk 'sedang'
        self.ipk_rendah = (0.0, 2.0, 2.5, 3.0)  # trapmf [0, 2, 2.5, 3.0]
        self.ipk_sedang = (2.8, 3.2, 3.6)       # trimf [2.8, 3.2, 3.6]
        self.ipk_tinggi = (3.4, 3.7, 4.0, 4.0)  # trapmf [3.4, 3.7, 4.0, 4.0]

        # Batas-batas untuk fungsi keanggotaan SKS - DIPERBAIKI SESUAI FIS_SAW_FIX.IPYNB
        # SKS: trapmf untuk 'sedikit' dan 'banyak', trimf untuk 'sedang'
        self.sks_sedikit = (40, 90, 100, 120)   # trapmf [40, 90, 100, 120]
        self.sks_sedang = (118, 140, 160)       # trimf [118, 140, 160]
        self.sks_banyak = (155, 170, 190, 200)  # trapmf [155, 170, 190, 200]

        # Batas-batas untuk fungsi keanggotaan nilai D, E, K - DIPERBAIKI SESUAI FIS_SAW_FIX.IPYNB
        # Nilai DEK: trapmf untuk 'sedikit' dan 'banyak', trimf untuk 'sedang'
        self.nilai_dek_sedikit = (0, 0, 4, 8)   # trapmf [0, 0, 4, 8]
        self.nilai_dek_sedang = (7, 12, 18)     # trimf [7, 12, 18]
        self.nilai_dek_banyak = (16, 20, 45, 70) # trapmf [16, 20, 45, 70]
        
        # Output crisp values yang disesuaikan dengan FIS_SAW_FIX.IPYNB
        # Peluang_Lulus_Kecil = 20 (centroid dari fuzz.trimf([0, 0, 40]))
        # Peluang_Lulus_Sedang = 50 (centroid dari fuzz.trimf([30, 50, 70]))
        # Peluang_Lulus_Tinggi = 80 (centroid dari fuzz.trimf([60, 100, 100]))
        self.output_values = {
            'kecil': 20,    # Peluang_Lulus_Kecil
            'sedang': 50,   # Peluang_Lulus_Sedang
            'tinggi': 80    # Peluang_Lulus_Tinggi
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
        Menghitung nilai keanggotaan IPK untuk setiap kategori sesuai FIS_SAW_fix.ipynb
        
        CATATAN: IPK 'sedang' menggunakan trimf, 'rendah' dan 'tinggi' menggunakan trapmf
        """
        rendah = self._calculate_membership_trapezoid(ipk, 
            self.ipk_rendah[0], self.ipk_rendah[1], self.ipk_rendah[2], self.ipk_rendah[3])
        
        sedang = self._calculate_membership_triangle(ipk,
            self.ipk_sedang[0], self.ipk_sedang[1], self.ipk_sedang[2])
        
        tinggi = self._calculate_membership_trapezoid(ipk,
            self.ipk_tinggi[0], self.ipk_tinggi[1], self.ipk_tinggi[2], self.ipk_tinggi[3])
        
        return (rendah, sedang, tinggi)

    def calculate_sks_membership(self, sks: int) -> Tuple[float, float, float]:
        """
        Menghitung nilai keanggotaan SKS untuk setiap kategori sesuai FIS_SAW_fix.ipynb
        
        CATATAN: SKS 'sedang' menggunakan trimf, 'sedikit' dan 'banyak' menggunakan trapmf
        """
        sedikit = self._calculate_membership_trapezoid(sks,
            self.sks_sedikit[0], self.sks_sedikit[1], self.sks_sedikit[2], self.sks_sedikit[3])
        
        sedang = self._calculate_membership_triangle(sks,
            self.sks_sedang[0], self.sks_sedang[1], self.sks_sedang[2])
        
        banyak = self._calculate_membership_trapezoid(sks,
            self.sks_banyak[0], self.sks_banyak[1], self.sks_banyak[2], self.sks_banyak[3])
        
        return (sedikit, sedang, banyak)

    def calculate_nilai_dk_membership(self, persen_dek: float) -> Tuple[float, float, float]:
        """
        Menghitung nilai keanggotaan untuk prosentase nilai D, E, dan K sesuai FIS_SAW_fix.ipynb
        
        CATATAN: Nilai DEK 'sedang' menggunakan trimf, 'sedikit' dan 'banyak' menggunakan trapmf
        """
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
        """
        Menerapkan aturan fuzzy sesuai FIS_SAW_fix.ipynb (20 rules)
        
        CATATAN: Rules ini disesuaikan dengan notebook
        Mapping nama variabel:
        - sedikit → sedikit (SKS & nilai_dk)
        - sedang → sedang (SKS & nilai_dk) 
        - banyak → banyak (SKS & nilai_dk)
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