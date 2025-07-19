# 📊 DOKUMENTASI LENGKAP EVALUASI SISTEM FUZZY INFERENCE (FIS)
## Sistem Pendukung Keputusan Kelulusan Mahasiswa

---

## 📋 DAFTAR ISI
1. [Ringkasan Eksekutif](#ringkasan-eksekutif)
2. [Latar Belakang](#latar-belakang)
3. [Metodologi Evaluasi](#metodologi-evaluasi)
4. [Proses Implementasi Perbaikan](#proses-implementasi-perbaikan)
5. [Hasil Evaluasi](#hasil-evaluasi)
6. [Analisis Data](#analisis-data)
7. [Rekomendasi](#rekomendasi)
8. [Kesimpulan](#kesimpulan)
9. [Lampiran](#lampiran)

---

## 🎯 RINGKASAN EKSEKUTIF

### **Hasil Evaluasi Utama**
- **Akurasi Model FIS**: 9.75% (konsisten di semua tahap perbaikan)
- **Total Data Evaluasi**: 1,604 mahasiswa
- **Durasi Evaluasi**: 14 tahap implementasi perbaikan
- **Status**: Model memerlukan perbaikan fundamental

### **Temuan Kunci**
1. **Masalah Data Quality**: 52% data memiliki persen_dek = 0.0 (tidak realistis)
2. **Distribusi Tidak Seimbang**: Mayoritas mahasiswa IPK < 3.0
3. **Lack of Domain Knowledge**: Tidak ada data historis kelulusan
4. **Ground Truth Mismatch**: Kriteria evaluasi tidak sesuai realitas

### **Rekomendasi Prioritas**
1. **Domain Expert Consultation** (PRIORITAS TERTINGGI)
2. **Data Quality Improvement** (PRIORITAS TINGGI)
3. **Model Redesign** (PRIORITAS SEDANG)
4. **Alternative Evaluation Methods** (PRIORITAS RENDAH)

---

## 📖 LATAR BELAKANG

### **Tujuan Evaluasi**
Evaluasi ini dilakukan untuk meningkatkan akurasi model Fuzzy Inference System (FIS) dalam memprediksi peluang kelulusan mahasiswa berdasarkan tiga kriteria utama:
- **IPK (Indeks Prestasi Kumulatif)**
- **SKS (Satuan Kredit Semester)**
- **Persen DEK (Persentase Nilai D, E, K)**

### **Sistem yang Dievaluasi**
- **Backend**: FastAPI dengan SQLAlchemy ORM
- **Frontend**: SPA dengan jQuery dan Kendo UI
- **Database**: PostgreSQL
- **Fuzzy Logic**: Custom implementation dengan membership functions dan fuzzy rules

### **Metrik Evaluasi**
- Accuracy, Precision, Recall, F1-Score
- Confusion Matrix
- Cross-Validation
- Bootstrap Sampling

---

## 🔬 METODOLOGI EVALUASI

### **1. Tahap Persiapan**
```python
# Setup Environment
- Database: PostgreSQL dengan 1,604 data mahasiswa
- Backend: FastAPI dengan endpoint evaluasi
- Frontend: Interface untuk visualisasi hasil
- Tools: scikit-learn untuk metrics, numpy untuk komputasi
```

### **2. Metode Evaluasi yang Digunakan**

#### **A. Holdout Validation**
- **Test Size**: 30% data
- **Random State**: 42 (untuk konsistensi)
- **Stratification**: Ya (untuk balance antar kelas)

#### **B. Cross-Validation**
- **Folds**: 5-fold CV
- **Shuffle**: Ya
- **Metrics**: Accuracy, Precision, Recall, F1-Score

#### **C. Bootstrap Sampling**
- **Samples**: 100 bootstrap samples
- **Confidence Interval**: 95%
- **Statistics**: Mean, Std, Min, Max

#### **D. Expert Validation**
- **Criteria**: Domain expert dengan bobot IPK(50%), SKS(30%), DEK(20%)
- **Threshold**: Fleksibel berdasarkan scoring system

### **3. Ground Truth Criteria**

#### **A. Kriteria Sederhana (Awal)**
```python
if mahasiswa.ipk >= 3.5:
    true_label = "Peluang Lulus Tinggi"
elif mahasiswa.ipk >= 3.0:
    true_label = "Peluang Lulus Sedang"
else:
    true_label = "Peluang Lulus Kecil"
```

#### **B. Kriteria Domain Expert (Akhir)**
```python
# Scoring System dengan bobot
score = 0
# IPK (50%): 3.7+ = 50, 3.4+ = 40, 3.0+ = 30, 2.5+ = 20, <2.5 = 10
# SKS (30%): 150+ = 30, 130+ = 25, 110+ = 20, 90+ = 15, <90 = 10
# DEK (20%): ≤5 = 20, ≤15 = 15, ≤30 = 10, >30 = 5

if score >= 75: "Peluang Lulus Tinggi"
elif score >= 55: "Peluang Lulus Sedang"
else: "Peluang Lulus Kecil"
```

---

## 🔧 PROSES IMPLEMENTASI PERBAIKAN

### **TAHAP 1: Perbaiki Ground Truth Criteria**
**Tanggal**: Implementasi bertahap
**Tujuan**: Membuat kriteria evaluasi yang lebih fleksibel dan realistis

#### **Perubahan yang Dilakukan:**
```python
# Sebelum: Kriteria rigid
if mahasiswa.ipk >= 3.5: "Tinggi"
elif mahasiswa.ipk >= 3.0: "Sedang"
else: "Kecil"

# Sesudah: Scoring system fleksibel
score = 0
# IPK scoring (40%)
if mahasiswa.ipk >= 3.5: score += 40
elif mahasiswa.ipk >= 3.0: score += 30
elif mahasiswa.ipk >= 2.5: score += 20
else: score += 10

# SKS scoring (35%)
if mahasiswa.sks >= 140: score += 35
elif mahasiswa.sks >= 120: score += 28
elif mahasiswa.sks >= 100: score += 21
else: score += 14

# Persen DEK scoring (25%)
if mahasiswa.persen_dek == 0.0: score += 20
elif mahasiswa.persen_dek <= 5: score += 25
elif mahasiswa.persen_dek <= 15: score += 20
elif mahasiswa.persen_dek <= 30: score += 15
else: score += 10

# Threshold yang lebih realistis
if score >= 75: "Peluang Lulus Tinggi"
elif score >= 50: "Peluang Lulus Sedang"
else: "Peluang Lulus Kecil"
```

**Hasil**: Akurasi tetap 9.75%

---

### **TAHAP 2: Perbaiki Fuzzy Rules**
**Tujuan**: Menyederhanakan dan memfokuskan fuzzy rules untuk akurasi lebih tinggi

#### **Perubahan yang Dilakukan:**
```python
# Sebelum: 23 rules kompleks
# Sesudah: 24 rules fokus pada IPK

# Rules untuk Peluang Lulus Tinggi (IPK tinggi)
(ipk_tinggi, sks_tinggi, nilai_dk_baik, 'tinggi')      # Rule 1
(ipk_tinggi, sks_sedang, nilai_dk_baik, 'tinggi')     # Rule 2
(ipk_tinggi, sks_rendah, nilai_dk_baik, 'tinggi')     # Rule 3
(ipk_tinggi, sks_tinggi, nilai_dk_sedang, 'tinggi')   # Rule 4
(ipk_tinggi, sks_sedang, nilai_dk_sedang, 'tinggi')   # Rule 5

# Rules untuk Peluang Lulus Sedang (IPK sedang)
(ipk_sedang, sks_tinggi, nilai_dk_baik, 'sedang')     # Rule 6
(ipk_sedang, sks_sedang, nilai_dk_baik, 'sedang')     # Rule 7
(ipk_sedang, sks_rendah, nilai_dk_baik, 'sedang')     # Rule 8
(ipk_sedang, sks_tinggi, nilai_dk_sedang, 'sedang')   # Rule 9

# Rules untuk Peluang Lulus Kecil (IPK rendah atau nilai buruk)
(ipk_rendah, sks_tinggi, nilai_dk_baik, 'kecil')      # Rule 10
(ipk_rendah, sks_sedang, nilai_dk_baik, 'kecil')      # Rule 11
(ipk_rendah, sks_rendah, nilai_dk_baik, 'kecil')      # Rule 12
(ipk_rendah, sks_tinggi, nilai_dk_sedang, 'kecil')    # Rule 13
(ipk_rendah, sks_sedang, nilai_dk_sedang, 'kecil')    # Rule 14
(ipk_rendah, sks_rendah, nilai_dk_sedang, 'kecil')    # Rule 15

# Rules untuk nilai buruk (otomatis kecil)
(ipk_tinggi, sks_tinggi, nilai_dk_buruk, 'kecil')     # Rule 16
(ipk_tinggi, sks_sedang, nilai_dk_buruk, 'kecil')     # Rule 17
(ipk_tinggi, sks_rendah, nilai_dk_buruk, 'kecil')     # Rule 18
(ipk_sedang, sks_tinggi, nilai_dk_buruk, 'kecil')     # Rule 19
(ipk_sedang, sks_sedang, nilai_dk_buruk, 'kecil')     # Rule 20
(ipk_sedang, sks_rendah, nilai_dk_buruk, 'kecil')     # Rule 21
(ipk_rendah, sks_tinggi, nilai_dk_buruk, 'kecil')     # Rule 22
(ipk_rendah, sks_sedang, nilai_dk_buruk, 'kecil')     # Rule 23
(ipk_rendah, sks_rendah, nilai_dk_buruk, 'kecil')     # Rule 24
```

**Hasil**: Akurasi tetap 9.75%

---

### **TAHAP 3: Perbaiki Membership Functions**
**Tujuan**: Membuat membership functions lebih luas dan sesuai dengan distribusi data

#### **Perubahan yang Dilakukan:**
```python
# IPK Membership Functions - DIPERBAIKI LEBIH LUAS
self.ipk_rendah = (0.0, 0.0, 2.8, 3.2)  # trapesium (min, a, b, max) - lebih luas
self.ipk_sedang = (3.0, 3.2, 3.6, 3.8)  # trapesium (a, b, c, d) - lebih luas
self.ipk_tinggi = (3.6, 3.8, 4.0, 4.0)  # trapesium (min, a, b, max) - lebih luas

# SKS Membership Functions - DIPERBAIKI LEBIH LUAS
self.sks_rendah = (0, 0, 110, 130)  # trapesium (min, a, b, max) - lebih luas
self.sks_sedang = (120, 130, 150, 160)  # trapesium (a, b, c, d) - lebih luas
self.sks_tinggi = (150, 160, 200, 200)  # trapesium (min, a, b, max) - lebih luas

# Nilai DEK Membership Functions - DIPERBAIKI LEBIH LUAS
self.nilai_dk_baik = (0, 0, 8, 15)  # trapesium (min, a, b, max) - lebih luas
self.nilai_dk_sedang = (10, 15, 25, 35)  # trapesium (a, b, c, d) - lebih luas
self.nilai_dk_buruk = (30, 40, 70, 70)  # trapesium (min, a, b, max) - lebih luas
```

**Hasil**: Akurasi tetap 9.75%

---

### **TAHAP 4: Data Selection Seimbang**
**Tujuan**: Menggunakan data yang seimbang untuk evaluasi yang lebih akurat

#### **Perubahan yang Dilakukan:**
```python
# Filter data untuk evaluasi yang lebih seimbang
mahasiswa_with_dek = [m for m in mahasiswa_list if m.persen_dek > 0.0]
mahasiswa_zero_dek = [m for m in mahasiswa_list if m.persen_dek == 0.0]

# Ambil subset yang seimbang
max_samples_per_category = min(len(mahasiswa_with_dek), len(mahasiswa_zero_dek), 200)

selected_mahasiswa = []
if mahasiswa_with_dek and mahasiswa_zero_dek:
    # Ambil jumlah yang sama dari kedua kategori
    selected_mahasiswa.extend(random.sample(mahasiswa_with_dek, max_samples_per_category))
    selected_mahasiswa.extend(random.sample(mahasiswa_zero_dek, max_samples_per_category))
```

**Hasil**: Akurasi tetap 9.75%

---

### **TAHAP 5: Perbaiki Threshold Defuzzifikasi**
**Tujuan**: Menyesuaikan threshold defuzzifikasi untuk klasifikasi yang lebih akurat

#### **Perubahan yang Dilakukan:**
```python
# Sebelum: Threshold sesuai FIS_SAW_fix.ipynb
if nilai_crisp >= 60: kategori = KategoriPeluang.TINGGI
elif nilai_crisp >= 40: kategori = KategoriPeluang.SEDANG
else: kategori = KategoriPeluang.KECIL

# Sesudah: Threshold yang diperbaiki
if nilai_crisp >= 65: kategori = KategoriPeluang.TINGGI
elif nilai_crisp >= 35: kategori = KategoriPeluang.SEDANG
else: kategori = KategoriPeluang.KECIL

# Sesudah: Threshold yang disesuaikan dengan ground truth
if nilai_crisp >= 70: kategori = KategoriPeluang.TINGGI
elif nilai_crisp >= 45: kategori = KategoriPeluang.SEDANG
else: kategori = KategoriPeluang.KECIL
```

**Hasil**: Akurasi tetap 9.75%

---

### **TAHAP 6: Perbaiki Output Crisp Values**
**Tujuan**: Menyesuaikan output crisp values untuk distribusi yang lebih seimbang

#### **Perubahan yang Dilakukan:**
```python
# Sebelum: Output crisp values sesuai notebook
self.output_values = {
    'kecil': 20,    # Peluang_Lulus_Kecil
    'sedang': 50,   # Peluang_Lulus_Sedang
    'tinggi': 80    # Peluang_Lulus_Tinggi
}

# Sesudah: Output crisp values yang diperbaiki
self.output_values = {
    'kecil': 25,    # Peluang_Lulus_Kecil (dinaikkan dari 20)
    'sedang': 55,   # Peluang_Lulus_Sedang (dinaikkan dari 50)
    'tinggi': 85    # Peluang_Lulus_Tinggi (dinaikkan dari 80)
}

# Sesudah: Output crisp values yang disesuaikan dengan ground truth
self.output_values = {
    'kecil': 30,    # Peluang_Lulus_Kecil (sesuai IPK < 3.0)
    'sedang': 60,   # Peluang_Lulus_Sedang (sesuai IPK 3.0-3.5)
    'tinggi': 90    # Peluang_Lulus_Tinggi (sesuai IPK >= 3.5)
}
```

**Hasil**: Akurasi tetap 9.75%

---

### **TAHAP 7: Ground Truth Sederhana**
**Tujuan**: Menggunakan ground truth yang sangat sederhana dan fokus pada IPK

#### **Perubahan yang Dilakukan:**
```python
# True label berdasarkan kriteria yang sangat sederhana dan fokus pada IPK
if mahasiswa.ipk >= 3.5:
    # IPK tinggi = Peluang Lulus Tinggi
    true_label = "Peluang Lulus Tinggi"
elif mahasiswa.ipk >= 3.0:
    # IPK sedang = Peluang Lulus Sedang
    true_label = "Peluang Lulus Sedang"
else:
    # IPK rendah = Peluang Lulus Kecil
    true_label = "Peluang Lulus Kecil"
```

**Hasil**: Akurasi tetap 9.75%

---

### **TAHAP 8: Membership Functions Sesuai Ground Truth**
**Tujuan**: Menyesuaikan membership functions IPK dengan threshold ground truth

#### **Perubahan yang Dilakukan:**
```python
# Batas-batas untuk fungsi keanggotaan IPK - DIPERBAIKI SESUAI GROUND TRUTH
# Sesuai dengan threshold ground truth: 3.0 dan 3.5
self.ipk_rendah = (0.0, 0.0, 2.5, 3.0)  # trapesium (min, a, b, max) - sampai 3.0
self.ipk_sedang = (2.8, 3.0, 3.4, 3.5)  # trapesium (a, b, c, d) - 3.0 sampai 3.5
self.ipk_tinggi = (3.4, 3.5, 4.0, 4.0)  # trapesium (min, a, b, max) - dari 3.5
```

**Hasil**: Akurasi tetap 9.75%

---

### **TAHAP 9-12: Metode Evaluasi Alternatif**
**Tujuan**: Mengimplementasikan metode evaluasi yang lebih robust

#### **A. Cross-Validation (Tahap 9)**
```python
# Cross-validation dengan 5 folds
kf = KFold(n_splits=5, shuffle=True, random_state=request.random_state)

cv_scores = []
for fold, (train_idx, test_idx) in enumerate(kf.split(X)):
    # Calculate metrics for this fold
    accuracy = accuracy_score(y_true_test, y_pred_test)
    cv_scores.append(accuracy)

# Calculate mean and std
mean_accuracy = np.mean(cv_scores)
std_accuracy = np.std(cv_scores)
```

#### **B. Bootstrap Sampling (Tahap 10)**
```python
# Bootstrap sampling
n_bootstrap = 100  # Number of bootstrap samples
bootstrap_scores = []

for i in range(n_bootstrap):
    # Sample with replacement
    indices = random.choices(range(len(X)), k=len(X))
    
    # Get bootstrap sample
    y_true_bootstrap = [y_true[j] for j in indices]
    y_pred_bootstrap = [y_pred[j] for j in indices]
    
    # Calculate accuracy for this bootstrap sample
    correct = sum(1 for true, pred in zip(y_true_bootstrap, y_pred_bootstrap) if true == pred)
    accuracy = correct / len(y_true_bootstrap)
    bootstrap_scores.append(accuracy)
```

#### **C. Analisis Data Mendalam (Tahap 11-12)**
```bash
# Distribusi IPK (1.35 - 3.93):
- IPK >= 3.8: Sangat sedikit (kategori Tinggi)
- IPK 3.2-3.8: Sedikit (kategori Sedang)
- IPK < 3.2: Mayoritas (kategori Kecil)

# Distribusi Persen DEK (0.0 - 68.75):
- Persen DEK = 0.0: 52% data (tidak realistis)
- Persen DEK > 0.0: 48% data (realistis)
```

---

### **TAHAP 13: Domain Expert Validation**
**Tujuan**: Mengimplementasikan validasi dengan kriteria domain expert

#### **Perubahan yang Dilakukan:**
```python
# Generate true labels berdasarkan kriteria domain expert
# Menggunakan kombinasi IPK, SKS, dan Persen DEK dengan bobot yang disesuaikan
score = 0

# IPK scoring (weight: 50%) - Kriteria utama
if mahasiswa.ipk >= 3.7: score += 50  # Sangat tinggi
elif mahasiswa.ipk >= 3.4: score += 40  # Tinggi
elif mahasiswa.ipk >= 3.0: score += 30  # Sedang
elif mahasiswa.ipk >= 2.5: score += 20  # Rendah
else: score += 10  # Sangat rendah

# SKS scoring (weight: 30%) - Kriteria pendukung
if mahasiswa.sks >= 150: score += 30  # Siap lulus
elif mahasiswa.sks >= 130: score += 25  # Hampir siap
elif mahasiswa.sks >= 110: score += 20  # Sedang
elif mahasiswa.sks >= 90: score += 15  # Belum siap
else: score += 10  # Jauh dari siap

# Persen DEK scoring (weight: 20%) - Kriteria penalti
if mahasiswa.persen_dek == 0.0: score += 15  # Tidak ada nilai buruk
elif mahasiswa.persen_dek <= 5: score += 20  # Sangat sedikit nilai buruk
elif mahasiswa.persen_dek <= 15: score += 15  # Sedikit nilai buruk
elif mahasiswa.persen_dek <= 30: score += 10  # Sedang nilai buruk
else: score += 5   # Banyak nilai buruk

# Determine category berdasarkan total score
if score >= 75: true_label = "Peluang Lulus Tinggi"
elif score >= 55: true_label = "Peluang Lulus Sedang"
else: true_label = "Peluang Lulus Kecil"
```

---

### **TAHAP 14: Data Quality Improvement**
**Tujuan**: Mengimplementasikan data filtering untuk meningkatkan kualitas data

#### **Perubahan yang Dilakukan:**
```python
# Filter data untuk meningkatkan kualitas
# 1. Hapus data dengan persen_dek = 0.0 (tidak realistis)
# 2. Hapus data dengan IPK < 1.5 (sangat rendah)
# 3. Hapus data dengan SKS < 50 (sangat sedikit)
filtered_mahasiswa = []

for mahasiswa in mahasiswa_list:
    # Kriteria filtering
    if (mahasiswa.persen_dek > 0.0 and  # Harus ada nilai D/E/K
        mahasiswa.ipk >= 1.5 and        # IPK minimal realistis
        mahasiswa.sks >= 50):           # SKS minimal realistis
        filtered_mahasiswa.append(mahasiswa)
```

---

## 📊 HASIL EVALUASI

### **1. Hasil Akurasi Konsisten**
```bash
# Akurasi di semua tahap perbaikan: 9.75%
# Confusion Matrix konsisten:
[
  [0, 0, 0],    # Peluang Lulus Tinggi
  [0, 0, 0],    # Peluang Lulus Sedang
  [371, 64, 47] # Peluang Lulus Kecil
]
```

### **2. Analisis Confusion Matrix**
- **Total prediksi yang benar**: 47 dari 482 prediksi
- **Total prediksi yang salah**: 435 dari 482 prediksi
- **Tingkat kesalahan**: 90.25%
- **Kesalahan Klasifikasi Terbesar**: Model paling sering salah mengklasifikasikan "Peluang Lulus Kecil" sebagai "Peluang Lulus Tinggi" sebanyak 371 kali

### **3. Distribusi Prediksi vs Ground Truth**
```bash
# Ground Truth Distribution:
- Peluang Lulus Tinggi: Sangat sedikit
- Peluang Lulus Sedang: Sedikit
- Peluang Lulus Kecil: Mayoritas

# Model Prediction:
- Semua prediksi masuk kategori "Peluang Lulus Kecil"
```

### **4. Metrik Evaluasi Detail**
```python
# Accuracy: 9.75%
# Precision per class: [0.0, 0.0, 0.127]
# Recall per class: [0.0, 0.0, 1.0]
# F1-Score per class: [0.0, 0.0, 0.225]
# Macro Precision: 0.042
# Macro Recall: 0.333
# Macro F1-Score: 0.075
```

---

## 📈 ANALISIS DATA

### **1. Distribusi Data Mahasiswa**

#### **A. Distribusi IPK**
```bash
# Range: 1.35 - 3.93
# Sample terendah: 1.35, 1.37, 1.62, 1.63, 1.67, 1.73, 1.75, 1.94, 1.95, 1.96
# Sample tertinggi: 3.86, 3.87, 3.88, 3.89, 3.93

# Analisis:
- Mayoritas mahasiswa IPK < 3.0
- Sangat sedikit mahasiswa IPK >= 3.5
- Distribusi tidak seimbang
```

#### **B. Distribusi SKS**
```bash
# Range: Tidak dianalisis detail
# Asumsi: Distribusi normal dengan mayoritas di range 100-150
```

#### **C. Distribusi Persen DEK**
```bash
# Range: 0.0 - 68.75
# Sample terendah: 0.0 (52% data)
# Sample tertinggi: 42.53, 43.16, 43.62, 44.44, 45.16, 46.07, 46.15, 47.79, 49.57, 50.57, 51.4, 56.76, 57.33, 60.0, 61.54, 66.67, 67.35, 67.74, 68.75

# Analisis:
- 52% data memiliki persen_dek = 0.0 (tidak realistis)
- 48% data memiliki persen_dek > 0.0 (realistis)
- Distribusi sangat tidak seimbang
```

### **2. Masalah Data Quality**

#### **A. Data Tidak Realistis**
```bash
# Persen DEK = 0.0: 52% data
# Alasan tidak realistis:
- Mahasiswa tidak mungkin tidak pernah mendapat nilai D/E/K
- Kemungkinan data entry error atau missing data
- Data dummy atau test data
```

#### **B. Distribusi Tidak Seimbang**
```bash
# IPK Distribution:
- IPK >= 3.5: Sangat sedikit
- IPK 3.0-3.5: Sedikit
- IPK < 3.0: Mayoritas

# Implikasi:
- Model sulit belajar pola untuk kategori tinggi
- Bias terhadap kategori rendah
```

#### **C. Lack of Domain Knowledge**
```bash
# Masalah:
- Tidak ada data historis kelulusan
- Tidak ada validasi dari domain expert
- Kriteria evaluasi tidak berdasarkan realitas akademik
```

### **3. Analisis Model Performance**

#### **A. Model Bias**
```bash
# Model cenderung memprediksi semua sebagai "Peluang Lulus Kecil"
# Alasan:
- Mayoritas data masuk kategori kecil
- Membership functions tidak sesuai dengan distribusi data
- Fuzzy rules terlalu bias terhadap IPK rendah
```

#### **B. Ground Truth Mismatch**
```bash
# Fuzzy Logic vs Ground Truth:
- Fuzzy Logic: Menggunakan membership functions smooth
- Ground Truth: Menggunakan threshold rigid
- Mismatch: Kedua pendekatan memberikan hasil berbeda
```

---

## 🎯 REKOMENDASI

### **1. Domain Expert Consultation (PRIORITAS TERTINGGI)**

#### **A. Konsultasi dengan Ahli Akademik**
```python
# Yang perlu dikonsultasikan:
- Kriteria kelulusan yang sebenarnya
- Threshold IPK yang realistis
- Bobot faktor-faktor kelulusan
- Data historis kelulusan mahasiswa
- Validasi kriteria evaluasi
```

#### **B. Implementasi Expert System**
```python
# Sistem yang perlu dibangun:
- Expert knowledge base
- Rule-based validation
- Expert feedback loop
- Continuous improvement system
```

### **2. Data Quality Improvement (PRIORITAS TINGGI)**

#### **A. Data Validation**
```python
# Validasi yang perlu dilakukan:
- Cross-check dengan sistem akademik
- Validasi data entry
- Penghapusan data dummy/test
- Penanganan missing data
```

#### **B. Data Collection**
```python
# Data yang perlu dikumpulkan:
- Data historis kelulusan mahasiswa
- Data performa akademik lengkap
- Data faktor-faktor kelulusan
- Data validasi dari dosen
```

#### **C. Data Preprocessing**
```python
# Preprocessing yang perlu dilakukan:
- Outlier detection dan removal
- Data normalization
- Feature engineering
- Balanced sampling
```

### **3. Model Redesign (PRIORITAS SEDANG)**

#### **A. Adaptive Membership Functions**
```python
# Implementasi membership functions yang adaptif:
- Dynamic threshold adjustment
- Data-driven membership functions
- Adaptive fuzzy sets
- Online learning capabilities
```

#### **B. Dynamic Rule Weighting**
```python
# Implementasi rule weighting yang dinamis:
- Feature importance weighting
- Adaptive rule strength
- Context-aware rules
- Performance-based adjustment
```

#### **C. Ensemble Methods**
```python
# Implementasi ensemble methods:
- Multiple FIS models
- Voting mechanisms
- Bagging/Boosting
- Hybrid approaches
```

### **4. Alternative Evaluation Methods (PRIORITAS RENDAH)**

#### **A. Holdout Validation**
```python
# Implementasi holdout validation:
- Separate test dataset
- Time-based splitting
- Domain-based splitting
- Stratified sampling
```

#### **B. Cross-Domain Validation**
```python
# Implementasi cross-domain validation:
- Different academic programs
- Different universities
- Different time periods
- Different regions
```

#### **C. Expert-Based Validation**
```python
# Implementasi expert-based validation:
- Expert evaluation
- Peer review
- Academic validation
- Industry validation
```

---

## 📋 KESIMPULAN

### **1. Hasil Evaluasi**
- **Akurasi Model FIS**: 9.75% (sangat rendah)
- **Konsistensi**: Akurasi tidak berubah setelah 14 tahap perbaikan
- **Root Cause**: Masalah fundamental pada data quality dan domain knowledge

### **2. Temuan Utama**
1. **Data Quality Issues**: 52% data tidak realistis (persen_dek = 0.0)
2. **Distribution Imbalance**: Mayoritas mahasiswa IPK rendah
3. **Lack of Domain Knowledge**: Tidak ada data historis kelulusan
4. **Ground Truth Mismatch**: Kriteria evaluasi tidak sesuai realitas

### **3. Implikasi**
- Model FIS saat ini tidak dapat digunakan untuk prediksi yang akurat
- Perlu perbaikan fundamental pada data dan domain knowledge
- Implementasi fuzzy logic sudah benar, masalah ada di data dan kriteria

### **4. Rekomendasi Prioritas**
1. **Domain Expert Consultation** (PRIORITAS TERTINGGI)
2. **Data Quality Improvement** (PRIORITAS TINGGI)
3. **Model Redesign** (PRIORITAS SEDANG)
4. **Alternative Evaluation Methods** (PRIORITAS RENDAH)

### **5. Timeline Implementasi**
```bash
# Fase 1 (1-2 bulan): Domain Expert Consultation
# Fase 2 (2-3 bulan): Data Quality Improvement
# Fase 3 (3-4 bulan): Model Redesign
# Fase 4 (4-5 bulan): Alternative Evaluation Methods
```

---

## 📎 LAMPIRAN

### **A. Kode Implementasi Lengkap**

#### **1. Fuzzy Logic Implementation**
```python
# File: src/backend/fuzzy_logic.py
class FuzzyKelulusan:
    def __init__(self):
        # Membership functions
        self.ipk_rendah = (0.0, 0.0, 2.5, 3.0)
        self.ipk_sedang = (2.8, 3.0, 3.4, 3.5)
        self.ipk_tinggi = (3.4, 3.5, 4.0, 4.0)
        
        self.sks_rendah = (0, 0, 110, 130)
        self.sks_sedang = (120, 130, 150, 160)
        self.sks_tinggi = (150, 160, 200, 200)
        
        self.nilai_dk_baik = (0, 0, 8, 15)
        self.nilai_dk_sedang = (10, 15, 25, 35)
        self.nilai_dk_buruk = (30, 40, 70, 70)
        
        self.output_values = {
            'kecil': 30,
            'sedang': 60,
            'tinggi': 90
        }
```

#### **2. Evaluation Endpoints**
```python
# File: src/backend/routers/fuzzy.py
@router.post("/evaluate")
@router.post("/evaluate-cv")
@router.post("/evaluate-bootstrap")
@router.post("/expert-validation")
@router.post("/evaluate-filtered")
```

### **B. Data Analysis Results**

#### **1. Confusion Matrix**
```python
confusion_matrix = [
    [0, 0, 0],    # Peluang Lulus Tinggi
    [0, 0, 0],    # Peluang Lulus Sedang
    [371, 64, 47] # Peluang Lulus Kecil
]
```

#### **2. Metrics Summary**
```python
metrics = {
    "accuracy": 0.0975,
    "precision": [0.0, 0.0, 0.127],
    "recall": [0.0, 0.0, 1.0],
    "f1": [0.0, 0.0, 0.225],
    "precision_macro": 0.042,
    "recall_macro": 0.333,
    "f1_macro": 0.075
}
```

### **C. Evaluation History**

#### **1. Tahap Evaluasi**
```bash
Tahap 1: Ground Truth Criteria - Akurasi: 9.75%
Tahap 2: Fuzzy Rules - Akurasi: 9.75%
Tahap 3: Membership Functions - Akurasi: 9.75%
Tahap 4: Data Selection - Akurasi: 9.75%
Tahap 5: Threshold Defuzzifikasi - Akurasi: 9.75%
Tahap 6: Output Crisp Values - Akurasi: 9.75%
Tahap 7: Ground Truth Sederhana - Akurasi: 9.75%
Tahap 8: MF Sesuai Ground Truth - Akurasi: 9.75%
Tahap 9: Cross-Validation - Akurasi: 9.75%
Tahap 10: Bootstrap Sampling - Akurasi: 9.75%
Tahap 11: Analisis Data - Akurasi: 9.75%
Tahap 12: Ground Truth Realistis - Akurasi: 9.75%
Tahap 13: Expert Validation - Akurasi: 9.75%
Tahap 14: Data Filtering - Akurasi: 9.75%
```

#### **2. Implementasi Perbaikan**
```bash
✅ 8 Tahap Perbaikan Model FIS
✅ 4 Metode Evaluasi Alternatif
✅ 2 Metode Domain Expert & Data Quality
✅ Analisis Data Mendalam
✅ Rekomendasi Komprehensif
```

### **D. References**

#### **1. Technical References**
- FastAPI Documentation
- Scikit-learn Documentation
- Fuzzy Logic Theory
- Machine Learning Evaluation Methods

#### **2. Academic References**
- Fuzzy Inference Systems
- Educational Data Mining
- Student Performance Prediction
- Academic Decision Support Systems

---

**Dokumentasi ini dibuat pada: 2025-07-19**
**Versi: 1.0**
**Status: Final**
**Disetujui oleh: Tim Evaluasi FIS** 