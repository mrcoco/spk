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
    
    Referensi definisi sesuai FIS_SAW_fix.ipynb
    """
    def __init__(self):
        # Batas-batas untuk fungsi keanggotaan IPK
        # Sesuai dengan: ipk['rendah/sedang/tinggi'] di FIS_SAW_fix.ipynb
        self.ipk_rendah = (0.0, 2.0, 2.5, 3.0)  # trapesium (min, a, b, max)
        self.ipk_sedang = (2.8, 3.2, 3.6)  # segitiga (a, b, c)
        self.ipk_tinggi = (3.4, 3.7, 4.0, 4.0)  # trapesium (min, a, b, max)

        # Batas-batas untuk fungsi keanggotaan SKS
        # Sesuai dengan: sks['sedikit/sedang/banyak'] di FIS_SAW_fix.ipynb
        self.sks_rendah = (40, 90, 100, 120)  # trapesium (min, a, b, max)
        self.sks_sedang = (118, 140, 160)  # segitiga (a, b, c)
        self.sks_tinggi = (155, 170, 190, 200)  # trapesium (min, a, b, max)

        # Batas-batas untuk fungsi keanggotaan nilai D, E, K
        # Sesuai dengan: nilai_dek['sedikit/sedang/banyak'] di FIS_SAW_fix.ipynb
        self.nilai_dk_baik = (0, 0, 4, 8)  # trapesium (min, a, b, max)
        self.nilai_dk_sedang = (7, 12, 18)  # segitiga (a, b, c)
        self.nilai_dk_buruk = (16, 20, 45, 70)  # trapesium (min, a, b, max)

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
        
        sedang = self._calculate_membership_triangle(ipk,
            self.ipk_sedang[0], self.ipk_sedang[1], self.ipk_sedang[2])
        
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
        
        sedang = self._calculate_membership_triangle(sks,
            self.sks_sedang[0], self.sks_sedang[1], self.sks_sedang[2])
        
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
        
        sedang = self._calculate_membership_triangle(persen_dek,
            self.nilai_dk_sedang[0], self.nilai_dk_sedang[1], self.nilai_dk_sedang[2])
        
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

        # Rule 1: Peluang Tinggi (sesuai FIS_SAW_fix.ipynb)
        peluang_tinggi = max([
            min(ipk_tinggi, sks_tinggi, nilai_dk_baik),    # tinggi & banyak & sedikit
            min(ipk_sedang, sks_sedang, nilai_dk_baik),    # sedang & sedang & sedikit
            min(ipk_tinggi, sks_sedang, nilai_dk_baik),    # tinggi & sedang & sedikit
            min(ipk_sedang, sks_tinggi, nilai_dk_baik)     # sedang & banyak & sedikit
        ])

        # Rule 2: Peluang Sedang (sesuai FIS_SAW_fix.ipynb)
        peluang_sedang = max([
            min(ipk_sedang, sks_sedang, nilai_dk_sedang),  # sedang & sedang & sedang
            min(ipk_rendah, sks_sedang, nilai_dk_baik),    # rendah & sedang & sedikit
            min(ipk_rendah, sks_sedang, nilai_dk_sedang),  # rendah & sedang & sedang
            min(ipk_rendah, sks_tinggi, nilai_dk_sedang),  # rendah & banyak & sedang
            min(ipk_sedang, sks_tinggi, nilai_dk_sedang),  # sedang & banyak & sedang
            min(ipk_rendah, sks_tinggi, nilai_dk_baik),    # rendah & banyak & sedikit
            min(ipk_tinggi, sks_sedang, nilai_dk_sedang)   # tinggi & sedang & sedang
        ])

        # Rule 3: Peluang Kecil (sesuai FIS_SAW_fix.ipynb)
        peluang_kecil = max([
            min(ipk_rendah, sks_rendah, nilai_dk_buruk),   # rendah & sedikit & banyak
            min(ipk_rendah, sks_sedang, nilai_dk_buruk),   # rendah & sedang & banyak
            min(ipk_tinggi, sks_sedang, nilai_dk_buruk),   # tinggi & sedang & banyak
            min(ipk_sedang, sks_tinggi, nilai_dk_buruk),   # sedang & banyak & banyak
            min(ipk_tinggi, sks_tinggi, nilai_dk_buruk),   # tinggi & banyak & banyak
            min(ipk_sedang, sks_rendah, nilai_dk_baik),    # sedang & sedikit & sedikit
            min(ipk_rendah, sks_tinggi, nilai_dk_buruk),   # rendah & banyak & banyak
            min(ipk_rendah, sks_rendah, nilai_dk_baik),    # rendah & sedikit & sedikit
            min(ipk_tinggi, sks_rendah, nilai_dk_baik),    # tinggi & sedikit & sedikit
            min(ipk_sedang, sks_rendah, nilai_dk_sedang),  # sedang & sedikit & sedang
            min(ipk_rendah, sks_rendah, nilai_dk_sedang),  # rendah & sedikit & sedang
            min(ipk_sedang, sks_rendah, nilai_dk_buruk),   # sedang & sedikit & banyak
            min(ipk_tinggi, sks_rendah, nilai_dk_sedang),  # tinggi & sedikit & sedang
            min(ipk_tinggi, sks_rendah, nilai_dk_buruk)    # tinggi & sedikit & banyak
        ])

        return (peluang_kecil, peluang_sedang, peluang_tinggi)

    def defuzzification(self, peluang_memberships: Tuple[float, float, float]) -> Tuple[float, KategoriPeluang]:
        """
        Melakukan defuzzifikasi menggunakan metode weighted average
        
        CATATAN: Jika menggunakan scikit-fuzzy, defuzzifikasi akan berbeda:
        - Scikit-fuzzy menggunakan metode centroid yang menghitung pusat massa 
          dari fungsi keanggotaan output pada rentang 0-100
        - Contoh output scikit-fuzzy:
          * Peluang_Lulus_Kecil = fuzz.trimf([0, 0, 40]) → centroid ~20
          * Peluang_Lulus_Sedang = fuzz.trimf([30, 50, 70]) → centroid ~50  
          * Peluang_Lulus_Tinggi = fuzz.trimf([60, 100, 100]) → centroid ~80
        - Hasil scikit-fuzzy akan berupa nilai 0-100, sedangkan implementasi ini 0-1
        - Untuk konversi: nilai_scikit_fuzzy / 100 ≈ nilai_implementasi_ini
        """
        peluang_kecil, peluang_sedang, peluang_tinggi = peluang_memberships
        
        # Nilai tengah untuk setiap kategori (equivalent dengan centroid scikit-fuzzy)
        # Kecil: 0.25 (setara ~25 di scikit-fuzzy)
        # Sedang: 0.5 (setara ~50 di scikit-fuzzy)  
        # Tinggi: 0.75 (setara ~75 di scikit-fuzzy)
        nilai_kecil = 0.25
        nilai_sedang = 0.5
        nilai_tinggi = 0.75

        # Weighted average (simplified centroid calculation)
        numerator = (peluang_kecil * nilai_kecil + 
                    peluang_sedang * nilai_sedang + 
                    peluang_tinggi * nilai_tinggi)
        denominator = peluang_kecil + peluang_sedang + peluang_tinggi

        if denominator == 0:
            nilai_crisp = 0
        else:
            nilai_crisp = numerator / denominator

        # Menentukan kategori berdasarkan nilai crisp
        # Threshold disesuaikan dengan FIS_SAW_fix.ipynb: 0.4 dan 0.6
        # 
        # CATATAN: Jika menggunakan scikit-fuzzy, kategori ditentukan berbeda:
        # - Scikit-fuzzy: otomatis menentukan kategori dari nilai centroid tertinggi
        # - Di FIS_SAW_fix.ipynb menggunakan threshold:
        #   * output >= 60 → "Peluang Lulus Tinggi"
        #   * output >= 40 → "Peluang Lulus Sedang"
        #   * output < 40 → "Peluang Lulus Kecil"
        # - Threshold ini setara dengan 0.4 dan 0.6 dalam skala 0-1
        if nilai_crisp < 0.4:  # < 40 jika menggunakan scikit-fuzzy scale (0-100)
            kategori = KategoriPeluang.KECIL
        elif nilai_crisp < 0.6:  # 40-60 jika menggunakan scikit-fuzzy scale (0-100)
            kategori = KategoriPeluang.SEDANG
        else:  # >= 60 jika menggunakan scikit-fuzzy scale (0-100)
            kategori = KategoriPeluang.TINGGI

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