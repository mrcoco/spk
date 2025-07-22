# Dokumentasi Lengkap Evaluasi FIS

_Dokumen ini merupakan bagian dari SPK Monitoring Mahasiswa Akhir Masa Studi._

## 1. Teori Dasar Fuzzy Inference System (FIS) untuk Klasifikasi Kelulusan

Fuzzy Inference System (FIS) adalah metode kecerdasan buatan yang digunakan untuk pengambilan keputusan berbasis logika fuzzy. Dalam konteks klasifikasi kelulusan mahasiswa, FIS digunakan untuk memprediksi peluang kelulusan berdasarkan beberapa parameter utama:
- **IPK (Indeks Prestasi Kumulatif)**
- **SKS (Jumlah SKS yang telah ditempuh)**
- **Persentase Nilai D/E/K (DEK)**

### a. Fuzzyfikasi
Setiap parameter diubah menjadi derajat keanggotaan fuzzy:
- IPK: Rendah, Sedang, Tinggi
- SKS: Sedikit, Sedang, Banyak
- DEK: Sedikit, Sedang, Banyak

### b. Inferensi Fuzzy
Aturan IF-THEN digunakan, misal:
- IF IPK Tinggi AND SKS Banyak AND DEK Sedikit THEN Peluang Lulus Tinggi
- IF IPK Rendah OR DEK Banyak THEN Peluang Lulus Kecil

### c. Defuzzifikasi
Hasil inferensi (output fuzzy) diubah menjadi nilai crisp (angka pasti) menggunakan metode weighted average.

### d. Mapping Hasil
Nilai crisp dikategorikan menjadi:
- **Tinggi**: Peluang lulus tinggi
- **Sedang**: Peluang lulus sedang
- **Kecil**: Peluang lulus kecil

## 2. Data yang Digunakan dalam Evaluasi

Pada proses evaluasi FIS, kualitas dan jenis data yang digunakan sangat menentukan validitas hasil evaluasi. Berikut penjelasan rinci mengenai data yang digunakan pada dua jenis evaluasi:

### Penjelasan Istilah Penting
- **Ground Truth**: Istilah ini merujuk pada label atau nilai kebenaran yang dijadikan acuan utama dalam evaluasi model. Dalam konteks klasifikasi kelulusan, ground truth adalah status kelulusan mahasiswa yang dianggap benar (baik hasil sintetik maupun data aktual dari database). Ground truth digunakan untuk membandingkan hasil prediksi model dengan kenyataan sebenarnya.
- **Synthetic Data**: Data yang dibuat atau ditandai secara artifisial berdasarkan aturan tertentu, bukan berdasarkan hasil nyata di lapangan.
- **Data Aktual**: Data yang diambil langsung dari hasil nyata di database, misalnya status kelulusan mahasiswa yang benar-benar terjadi.

### a. Evaluasi FIS Sebelumnya (Synthetic Data)
- **Sumber Data**: Data mahasiswa diambil dari database, namun status kelulusan (ground truth) tidak diambil dari data aktual, melainkan ditentukan menggunakan aturan sederhana yang dibuat oleh pengembang atau pakar.
- **Penentuan Ground Truth Synthetic**: Setiap mahasiswa diberi label "LULUS" atau "TIDAK LULUS" berdasarkan aturan logika, misalnya:
  - Jika IPK >= 3.0, SKS >= 120, dan Persen_DEK <= 10%, maka dianggap LULUS.
  - Jika tidak memenuhi syarat di atas, dianggap TIDAK LULUS.
- **Tujuan Penggunaan Synthetic Data**: Synthetic data digunakan untuk validasi awal logika sistem FIS. Dengan data ini, pengembang dapat memastikan bahwa sistem berjalan sesuai aturan yang diharapkan sebelum diuji pada data nyata.
- **Kelebihan**: Proses cepat, mudah dikontrol, dan sangat cocok untuk debugging serta pengembangan awal.
- **Kekurangan**: Tidak merefleksikan kompleksitas dan variasi nyata pada data mahasiswa. Model cenderung overfit pada aturan yang dibuat.
- **Contoh Kasus**: Seorang mahasiswa dengan IPK 3.2, SKS 130, dan Persen_DEK 5% akan otomatis diberi label "LULUS" oleh sistem synthetic, meskipun di dunia nyata bisa saja belum lulus karena faktor lain.

### b. Evaluasi FIS dengan Data Aktual
- **Sumber Data**: Data mahasiswa diambil dari database, dan status kelulusan (ground truth) diambil dari field `status_lulus_aktual` yang diisi berdasarkan hasil kelulusan nyata (misal: "LULUS", "BELUM_LULUS", "DROPOUT").
- **Penentuan Ground Truth Aktual**: Label kelulusan diambil langsung dari data yang sudah diverifikasi oleh institusi, sehingga benar-benar mencerminkan outcome mahasiswa di dunia nyata.
- **Tujuan Penggunaan Data Aktual**: Untuk mengukur performa model FIS dalam memprediksi kelulusan mahasiswa secara riil, serta mengidentifikasi gap antara model dan kenyataan di lapangan.
- **Kelebihan**: Validitas tinggi, hasil evaluasi sangat relevan untuk pengambilan keputusan dan monitoring sistem.
- **Kekurangan**: Data aktual seringkali mengandung noise, outlier, atau kasus khusus yang tidak tercover oleh aturan sederhana, sehingga akurasi model bisa lebih rendah.
- **Contoh Kasus**: Seorang mahasiswa dengan IPK 3.2, SKS 130, dan Persen_DEK 5% di data aktual bisa saja berstatus "BELUM_LULUS" karena belum menyelesaikan skripsi, meskipun secara synthetic dianggap "LULUS".

#### Contoh Struktur Data Mahasiswa
| NIM         | Nama         | IPK  | SKS | Persen_DEK | status_lulus_aktual | tanggal_lulus   |
|-------------|--------------|------|-----|------------|---------------------|-----------------|
| 19812141079 | Andi         | 3.78 | 151 | 0.0        | LULUS               | 2024-01-15      |
| 19812141080 | Budi         | 2.95 | 110 | 12.5       | BELUM_LULUS         | NULL            |
| 19812141081 | Citra        | 3.10 | 130 | 5.0        | LULUS               | 2024-01-15      |

**Kesimpulan:**
- Synthetic data sangat berguna untuk validasi awal dan pengembangan, namun tidak boleh dijadikan satu-satunya acuan performa model.
- Data aktual wajib digunakan untuk evaluasi akhir sebelum model diimplementasikan dalam pengambilan keputusan nyata, karena hanya data ini yang benar-benar merefleksikan outcome mahasiswa.

## 3. Proses Evaluasi FIS

Bagian ini menjelaskan secara detail proses evaluasi FIS baik menggunakan data synthetic maupun data aktual, termasuk rumus perhitungan, algoritma, dan contoh perhitungan step-by-step.

### a. Evaluasi FIS Sebelumnya (Synthetic Data)

#### **Rumus Perhitungan Ground Truth Synthetic**
Ground truth untuk evaluasi synthetic ditentukan berdasarkan aturan logika sederhana yang mengkombinasikan ketiga parameter utama:

```
Ground Truth = {
    1 (LULUS)  jika: IPK ≥ 3.0 AND SKS ≥ 120 AND Persen_DEK ≤ 10%
    0 (TIDAK LULUS)  jika: kondisi di atas tidak terpenuhi
}
```

**Penjelasan Rumus:**
- **IPK ≥ 3.0**: Mahasiswa harus memiliki IPK minimal 3.0 (skala 4.0)
- **SKS ≥ 120**: Mahasiswa harus menyelesaikan minimal 120 SKS
- **Persen_DEK ≤ 10%**: Persentase DEK tidak boleh lebih dari 10%

**Contoh Perhitungan:**
```
Mahasiswa A: IPK = 3.5, SKS = 130, Persen_DEK = 8%
→ Ground Truth = 1 (LULUS) karena semua kondisi terpenuhi

Mahasiswa B: IPK = 2.8, SKS = 125, Persen_DEK = 5%
→ Ground Truth = 0 (TIDAK LULUS) karena IPK < 3.0

Mahasiswa C: IPK = 3.2, SKS = 110, Persen_DEK = 7%
→ Ground Truth = 0 (TIDAK LULUS) karena SKS < 120
```

#### **Rumus Perhitungan Prediksi FIS**
Prediksi menggunakan sistem FIS dengan proses fuzzyfikasi, inferensi, dan defuzzifikasi:

```
Prediksi = {
    1 (LULUS)  jika: Kategori_FIS = "TINGGI"
    0 (TIDAK LULUS)  jika: Kategori_FIS = "SEDANG" atau "KECIL"
}
```

**Proses FIS Step-by-Step:**

1. **Fuzzyfikasi (Membership Function)**
   ```
   μ_IPK_TINGGI(x) = {
       0                    jika x < 2.5
       (x - 2.5) / 0.5     jika 2.5 ≤ x < 3.0
       1                    jika x ≥ 3.0
   }
   
   μ_SKS_TINGGI(x) = {
       0                    jika x < 100
       (x - 100) / 20      jika 100 ≤ x < 120
       1                    jika x ≥ 120
   }
   
   μ_DEK_RENDAH(x) = {
       1                    jika x ≤ 5
       (15 - x) / 10       jika 5 < x ≤ 15
       0                    jika x > 15
   }
   ```

2. **Inferensi (Fuzzy Rules)**
   ```
   Rule 1: IF IPK_TINGGI AND SKS_TINGGI AND DEK_RENDAH THEN KELULUSAN_TINGGI
   Rule 2: IF IPK_SEDANG AND SKS_SEDANG AND DEK_SEDANG THEN KELULUSAN_SEDANG
   Rule 3: IF IPK_RENDAH OR SKS_RENDAH OR DEK_TINGGI THEN KELULUSAN_KECIL
   ```

3. **Defuzzifikasi (Center of Gravity)**
   ```
   Nilai_Crisp = Σ(μ_i × y_i) / Σ(μ_i)
   ```
   Dimana:
   - μ_i = derajat keanggotaan output
   - y_i = nilai crisp output

### b. Evaluasi FIS dengan Data Aktual

#### **Rumus Perhitungan Ground Truth Aktual**
Ground truth untuk evaluasi aktual diambil langsung dari data historis kelulusan:

```
Ground Truth = {
    1 (LULUS)  jika: status_lulus_aktual = "LULUS"
    0 (TIDAK LULUS)  jika: status_lulus_aktual = "TIDAK LULUS"
}
```

**Penjelasan:**
- Data aktual merepresentasikan hasil kelulusan yang benar-benar terjadi
- Tidak ada perhitungan rumus, hanya mapping langsung dari database
- Lebih akurat karena berdasarkan realitas historis

#### **Rumus Perhitungan Prediksi FIS**
Sama dengan evaluasi synthetic, menggunakan sistem FIS yang identik:

```
Prediksi = {
    1 (LULUS)  jika: Kategori_FIS = "TINGGI"
    0 (TIDAK LULUS)  jika: Kategori_FIS = "SEDANG" atau "KECIL"
}
```

### c. Rumus Perhitungan Metrik Evaluasi

#### **1. Accuracy (Akurasi)**
```
Accuracy = (TP + TN) / (TP + TN + FP + FN)
```
Dimana:
- TP (True Positive) = Prediksi LULUS, Aktual LULUS
- TN (True Negative) = Prediksi TIDAK LULUS, Aktual TIDAK LULUS
- FP (False Positive) = Prediksi LULUS, Aktual TIDAK LULUS
- FN (False Negative) = Prediksi TIDAK LULUS, Aktual LULUS

**Interpretasi:** Persentase prediksi yang benar secara keseluruhan

#### **2. Precision (Presisi)**
```
Precision = TP / (TP + FP)
```
**Interpretasi:** Dari semua yang diprediksi LULUS, berapa persen yang benar-benar LULUS

#### **3. Recall (Sensitivitas)**
```
Recall = TP / (TP + FN)
```
**Interpretasi:** Dari semua yang seharusnya LULUS, berapa persen yang berhasil diprediksi LULUS

#### **4. F1-Score**
```
F1-Score = 2 × (Precision × Recall) / (Precision + Recall)
```
**Interpretasi:** Rata-rata harmonik dari precision dan recall, memberikan balance antara keduanya

#### **5. Confusion Matrix**
```
Confusion Matrix = [
    [TN, FP],
    [FN, TP]
]
```

### d. Contoh Perhitungan Lengkap

**Data Sample:**
```
Mahasiswa 1: IPK=3.2, SKS=125, DEK=8%, Aktual=LULUS
Mahasiswa 2: IPK=2.8, SKS=110, DEK=15%, Aktual=TIDAK LULUS
Mahasiswa 3: IPK=3.5, SKS=130, DEK=5%, Aktual=LULUS
Mahasiswa 4: IPK=2.5, SKS=100, DEK=20%, Aktual=TIDAK LULUS
```

**Perhitungan Ground Truth Synthetic:**
```
Mahasiswa 1: GT = 1 (3.2≥3.0 AND 125≥120 AND 8≤10)
Mahasiswa 2: GT = 0 (2.8<3.0)
Mahasiswa 3: GT = 1 (3.5≥3.0 AND 130≥120 AND 5≤10)
Mahasiswa 4: GT = 0 (2.5<3.0)
```

**Perhitungan Ground Truth Aktual:**
```
Mahasiswa 1: GT = 1 (LULUS)
Mahasiswa 2: GT = 0 (TIDAK LULUS)
Mahasiswa 3: GT = 1 (LULUS)
Mahasiswa 4: GT = 0 (TIDAK LULUS)
```

**Perhitungan Prediksi FIS (contoh):**
```
Mahasiswa 1: Prediksi = 1 (Kategori=TINGGI)
Mahasiswa 2: Prediksi = 0 (Kategori=SEDANG)
Mahasiswa 3: Prediksi = 1 (Kategori=TINGGI)
Mahasiswa 4: Prediksi = 0 (Kategori=KECIL)
```

**Perhitungan Metrik (untuk Aktual):**
```
Confusion Matrix:
[[1, 0],  # TN=1, FP=0
 [0, 3]]  # FN=0, TP=3

Accuracy = (1+3)/(1+3+0+0) = 4/4 = 100%
Precision = 3/(3+0) = 3/3 = 100%
Recall = 3/(3+0) = 3/3 = 100%
F1-Score = 2×(100%×100%)/(100%+100%) = 100%
```

### e. Interpretasi Hasil Perhitungan

#### **Accuracy 100%:**
- Semua prediksi benar
- Model sangat akurat untuk dataset ini
- Namun perlu diwaspadai overfitting

#### **Precision 100%:**
- Tidak ada false positive
- Setiap prediksi LULUS benar-benar LULUS
- Model sangat presisi dalam memprediksi kelulusan

#### **Recall 100%:**
- Tidak ada false negative
- Semua mahasiswa yang seharusnya LULUS berhasil diprediksi
- Model tidak melewatkan mahasiswa yang layak lulus

#### **F1-Score 100%:**
- Balance sempurna antara precision dan recall
- Model optimal untuk dataset ini

**Kesimpulan:**
Proses evaluasi FIS menggunakan rumus matematika yang terstandar dan dapat diverifikasi. Perbedaan utama antara evaluasi synthetic dan aktual terletak pada sumber ground truth, sementara proses prediksi FIS dan perhitungan metrik tetap konsisten. Hal ini memungkinkan perbandingan yang adil dan objektif antara kedua jenis evaluasi.

## 4. Implementasi Python & Endpoint Evaluasi

Bagian ini menjelaskan secara naratif dan bertahap bagaimana script Python untuk evaluasi FIS diimplementasikan, mulai dari pengambilan data, proses fuzzy, hingga evaluasi metrik dan integrasi dengan endpoint FastAPI.

### a. Alur Utama Script Evaluasi FIS
1. **Pengambilan Data**
   - Script mengambil data mahasiswa dari database menggunakan ORM (SQLAlchemy).
   - Untuk evaluasi synthetic, data diambil tanpa memperhatikan status kelulusan aktual.
   - Untuk evaluasi aktual, hanya mahasiswa yang memiliki field `status_lulus_aktual` yang diikutkan.

2. **Penentuan Ground Truth**
   - Pada evaluasi synthetic, label ground truth ditentukan dengan aturan logika sederhana (misal: IPK >= 3.0, SKS >= 120, Persen_DEK <= 10% → LULUS).
   - Pada evaluasi aktual, label ground truth diambil langsung dari field `status_lulus_aktual` di database.

3. **Prediksi FIS**
   - Untuk setiap mahasiswa, script memanggil fungsi utama `calculate_graduation_chance(ipk, sks, persen_dek)`.
   - Fungsi ini melakukan fuzzyfikasi (menghitung derajat keanggotaan), inferensi (mengaplikasikan aturan IF-THEN), defuzzifikasi (menghasilkan nilai crisp), dan mapping ke kategori (TINGGI/SEDANG/KECIL).
   - Hasil kategori kemudian dipetakan ke label prediksi: biasanya "TINGGI" dianggap prediksi lulus (1), selain itu tidak lulus (0).

4. **Evaluasi Metrik**
   - Setelah seluruh data diproses, script membandingkan array ground truth dan prediksi menggunakan fungsi-fungsi dari scikit-learn:
     - `accuracy_score`, `precision_score`, `recall_score`, `f1_score`, dan `confusion_matrix`.
   - Hasil metrik ini digunakan untuk menilai performa model pada synthetic maupun data aktual.

### b. Penjelasan Fungsi Utama
```python
# Fuzzy System (cuplikan)
def calculate_graduation_chance(ipk, sks, persen_dek):
    # 1. Fuzzyfikasi: Hitung derajat keanggotaan untuk setiap parameter
    # 2. Inferensi: Terapkan aturan IF-THEN untuk menghasilkan output fuzzy
    # 3. Defuzzifikasi: Gabungkan output fuzzy menjadi nilai crisp
    # 4. Mapping: Tentukan kategori (TINGGI/SEDANG/KECIL) berdasarkan nilai crisp
    return kategori, nilai_fuzzy, ipk_membership, sks_membership, dek_membership
```
- Fungsi ini adalah inti dari sistem FIS, mengenkapsulasi seluruh proses fuzzy dalam satu pemanggilan.
- Output kategori digunakan untuk menentukan prediksi kelulusan.

### c. Proses Evaluasi Synthetic dan Aktual
```python
# Evaluasi Synthetic
ground_truth = []
predictions = []
for mhs in synthetic_data:
    gt = 1 if mhs.ipk >= 3.0 and mhs.sks >= 120 and mhs.persen_dek <= 10 else 0
    ground_truth.append(gt)
    kategori, *_ = calculate_graduation_chance(mhs.ipk, mhs.sks, mhs.persen_dek)
    pred = 1 if kategori == 'TINGGI' else 0
    predictions.append(pred)

# Evaluasi Aktual
ground_truth = []
predictions = []
for mhs in actual_data:
    gt = 1 if mhs.status_lulus_aktual == 'LULUS' else 0
    ground_truth.append(gt)
    kategori, *_ = calculate_graduation_chance(mhs.ipk, mhs.sks, mhs.persen_dek)
    pred = 1 if kategori == 'TINGGI' else 0
    predictions.append(pred)
```
- Dua loop di atas hanya berbeda pada cara penentuan ground truth.
- Proses prediksi FIS tetap sama untuk kedua jenis evaluasi.

### d. Evaluasi dan Analisis Metrik
```python
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
accuracy = accuracy_score(ground_truth, predictions)
precision = precision_score(ground_truth, predictions)
recall = recall_score(ground_truth, predictions)
f1 = f1_score(ground_truth, predictions)
cm = confusion_matrix(ground_truth, predictions)
```
- Fungsi-fungsi ini menghitung metrik evaluasi secara objektif dan terstandar.
- Hasil metrik digunakan untuk membandingkan performa model pada synthetic vs aktual.

### e. Integrasi dengan Endpoint FastAPI
```python
@router.post("/fuzzy/compare-evaluations")
def compare_fis_evaluations(request: dict = Body(...), db: Session = Depends(get_db)):
    # Jalankan evaluasi synthetic dan aktual, hitung metrik, kembalikan hasil perbandingan
    return {"success": True, "result": comparison_result}
```
- Endpoint ini menerima request dari frontend (misal: parameter test_size, random_state).
- Backend menjalankan kedua evaluasi (synthetic dan aktual) secara otomatis, menghitung metrik, dan mengembalikan hasil perbandingan dalam format JSON.
- Hasil ini kemudian divisualisasikan di frontend untuk analisis lebih lanjut.

### f. Kaitan antara Script, Evaluasi Synthetic, dan Evaluasi Aktual
- Script Python yang sama digunakan untuk kedua jenis evaluasi, hanya berbeda pada sumber dan penentuan ground truth.
- Dengan desain ini, pengembang dapat dengan mudah membandingkan performa model pada data ideal (synthetic) dan data nyata (aktual) secara objektif dan terukur.
- Integrasi dengan endpoint API memungkinkan proses evaluasi dilakukan secara otomatis, konsisten, dan dapat diakses oleh frontend maupun tools analisis lain.

**Kesimpulan:**
Implementasi script Python untuk evaluasi FIS dirancang modular dan terintegrasi, sehingga mudah digunakan untuk validasi awal, evaluasi produksi, maupun pengembangan model lebih lanjut. Semua proses mulai dari pengambilan data, fuzzyfikasi, prediksi, hingga evaluasi metrik dan integrasi API sudah diotomatisasi dan terdokumentasi dengan baik.

## 5. Hasil Evaluasi & Perbandingan

### a. Tabel Metrik Evaluasi
| Metrik     | Evaluasi Sebelumnya | Evaluasi Data Aktual | Perbedaan |
|------------|---------------------|---------------------|-----------|
| Accuracy   | 98.00%              | 26.37%              | -71.63%   |
| Precision  | 99.70%              | 9.86%               | -89.84%   |
| Recall     | 97.92%              | 81.29%              | -16.63%   |
| F1-Score   | 98.80%              | 17.59%              | -81.22%   |

### b. Confusion Matrix (Contoh)
#### Evaluasi Sebelumnya
|            | Prediksi Lulus | Prediksi Tidak Lulus |
|------------|----------------|----------------------|
| Lulus      | 380            | 5                    |
| Tidak Lulus| 3              | 12                   |

#### Evaluasi Data Aktual
|            | Prediksi Lulus | Prediksi Tidak Lulus |
|------------|----------------|----------------------|
| Lulus      | 120            | 28                   |
| Tidak Lulus| 15             | 10                   |

### c. Interpretasi Hasil
- **Evaluasi Sebelumnya**: Akurasi dan precision sangat tinggi karena ground truth synthetic sangat sesuai dengan aturan FIS. Namun, ini tidak merefleksikan kondisi nyata.
- **Evaluasi Data Aktual**: Akurasi dan precision turun drastis, recall masih cukup baik. Hal ini menunjukkan bahwa model FIS cenderung overfit pada aturan synthetic dan kurang mampu menangkap variasi nyata pada data aktual.

## 6. Narasi Penjelasan Proses & Rekomendasi

### a. Proses Evaluasi
- **Evaluasi FIS Sebelumnya** digunakan untuk validasi awal logika fuzzy, memastikan sistem berjalan sesuai ekspektasi developer.
- **Evaluasi FIS dengan Data Aktual** adalah langkah penting untuk menguji performa sistem pada data nyata, mengukur seberapa baik model memprediksi kelulusan mahasiswa secara riil.

### b. Kelebihan & Kekurangan
- **Evaluasi Sebelumnya**:
  - + Sangat cepat, predictable, cocok untuk pengembangan awal
  - - Tidak merefleksikan realita, rawan overfitting
- **Evaluasi Data Aktual**:
  - + Validitas tinggi, hasil lebih relevan untuk pengambilan keputusan
  - - Akurasi bisa lebih rendah, menuntut perbaikan model

### c. Rekomendasi
- Gunakan **evaluasi dengan data aktual** untuk validasi akhir dan analisis produksi.
- Evaluasi sebelumnya tetap berguna untuk pengujian cepat dan pengembangan fitur baru.
- Lakukan evaluasi berkala dengan data terbaru untuk monitoring performa sistem.
- Pertimbangkan pengembangan model hybrid atau penyesuaian aturan fuzzy berdasarkan hasil evaluasi aktual.

---
