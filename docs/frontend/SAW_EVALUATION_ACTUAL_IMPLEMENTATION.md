# Implementasi Evaluasi SAW dengan Data Aktual

## **📊 Overview**

Dokumen ini menjelaskan implementasi lengkap fitur evaluasi SAW (Simple Additive Weighting) dengan data aktual pada sistem SPK Monitoring Masa Studi. Fitur ini memungkinkan evaluasi performa metode SAW dengan membandingkan hasil klasifikasi terhadap status kelulusan yang sebenarnya dari mahasiswa.

## **🎯 Tujuan Implementasi**

1. **Evaluasi Akurat**: Mengukur performa metode SAW menggunakan data historis kelulusan yang sebenarnya
2. **Perbandingan Data**: Membandingkan hasil evaluasi dengan data synthetic vs data aktual
3. **Analisis Komprehensif**: Memberikan metrik evaluasi lengkap (accuracy, precision, recall, F1-score, specificity)
4. **Visualisasi Data**: Menampilkan hasil evaluasi dalam bentuk grafik dan tabel yang informatif

## **🏗️ Arsitektur Implementasi**

### **Frontend Components**

#### **1. HTML Structure (`index.html`)**
```html
<!-- SAW Evaluation with Actual Data Section -->
<div id="sawEvaluationActualSection" class="section" style="display: none;">
    <div class="content-container">
        <h2><i class="fas fa-chart-line"></i> Evaluasi SAW dengan Data Aktual</h2>
        
        <!-- Control Panel -->
        <div class="evaluation-control-panel">
            <!-- Form pengaturan evaluasi -->
        </div>
        
        <!-- Summary Section -->
        <div class="evaluation-section">
            <!-- Ringkasan evaluasi -->
        </div>
        
        <!-- Metrics Section -->
        <div class="evaluation-section">
            <!-- Metrik evaluasi -->
        </div>
        
        <!-- Confusion Matrix Section -->
        <div class="evaluation-section">
            <!-- Confusion matrix -->
        </div>
        
        <!-- Results Grid Section -->
        <div class="evaluation-section">
            <!-- Grid hasil evaluasi -->
        </div>
        
        <!-- Charts Section -->
        <div class="evaluation-section">
            <!-- Visualisasi grafik -->
        </div>
    </div>
</div>
```

#### **2. JavaScript Module (`saw-evaluation-actual.js`)**
```javascript
class SAWEvaluationActual {
    constructor() {
        this.config = window.CONFIG || {
            API_BASE_URL: 'http://localhost:8000',
            API_PREFIX: '/api',
            API_VERSION: 'v1'
        };
        this.init();
    }

    // Methods:
    // - calculateEvaluation()
    // - displayResults()
    // - updatePerformanceAnalysis()
    // - updateConfusionMatrix()
    // - updateResultsGrid()
    // - updateCharts()
    // - exportData()
    // - printReport()
}
```

#### **3. Routing Configuration**
```javascript
// app.js - Route mapping
const routes = {
    '#saw-evaluation-actual': 'sawEvaluationActualSection'
};

// router.js - Section initialization
case 'saw-evaluation-actual':
    if (typeof window.sawEvaluationActual !== 'undefined') {
        if (!window.sawEvaluationActualInitialized) {
            window.sawEvaluationActualInitialized = true;
            console.log('Router: Initializing SAW Evaluation with Actual Data');
        }
    }
    break;
```

### **Backend Components**

#### **1. Router Endpoints (`routers/saw.py`)**
```python
@router.post("/evaluate-actual")
def evaluate_saw_actual(request: SAWEvaluationRequest, db: Session = Depends(get_db)):
    """
    Evaluasi performa metode SAW dengan data aktual (status_lulus_aktual)
    """
    # Implementation...

@router.get("/export-evaluation-actual")
def export_saw_evaluation_actual(db: Session = Depends(get_db)):
    """
    Export hasil evaluasi SAW dengan data aktual
    """
    # Implementation...
```

#### **2. Logic Implementation (`saw_logic.py`)**
```python
def evaluate_saw_performance(
    db: Session, 
    mahasiswa_list: List[Mahasiswa] = None,
    weights: Dict[str, float] = None,
    test_size: float = 0.3,
    random_state: int = 42,
    use_actual_data: bool = False,
    save_to_db: bool = False
) -> Dict[str, Any]:
    """
    Evaluasi performa metode SAW dengan dukungan data aktual
    """
    # Implementation...
```

## **🔧 Fitur Utama**

### **1. Control Panel**
- **Bobot Kriteria**: Pengaturan bobot IPK, SKS, dan DEK (0-100%)
- **Validasi Bobot**: Total bobot harus 100%
- **Parameter Evaluasi**: Test size, random state, save to database
- **Action Buttons**: Calculate, Export, Print

### **2. Summary Section**
- **Total Data**: Jumlah data mahasiswa dengan status_lulus_aktual
- **Training Data**: Jumlah data untuk training
- **Test Data**: Jumlah data untuk testing
- **Akurasi**: Akurasi keseluruhan model

### **3. Metrics Section**
- **Precision**: Proporsi prediksi positif yang benar
- **Recall**: Proporsi kasus positif yang terdeteksi
- **F1-Score**: Harmonic mean dari precision dan recall
- **Specificity**: Proporsi prediksi negatif yang benar

### **4. Confusion Matrix**
- **Visual Matrix**: Tabel confusion matrix dengan warna
- **Legend**: Penjelasan TP, FP, FN, TN
- **Percentage**: Persentase setiap cell

### **5. Results Grid**
- **Kendo UI Grid**: Tabel hasil evaluasi dengan fitur:
  - Sorting
  - Filtering
  - Pagination
  - Export
- **Columns**: NIM, Nama, IPK, SKS, DEK, Status Aktual, Prediksi, Nilai Akhir, Benar/Salah

### **6. Charts Visualization**
- **Classification Distribution**: Pie chart distribusi klasifikasi
- **Metrics Comparison**: Bar chart perbandingan metrik
- **Interactive**: Hover effects dan tooltips

### **7. Performance Analysis**
- **Narrative Analysis**: Penjelasan hasil dalam bahasa natural
- **Recommendations**: Rekomendasi berdasarkan hasil evaluasi
- **Interpretation**: Interpretasi setiap metrik

## **📊 Alur Proses Evaluasi**

### **1. Data Preparation**
```python
# Ambil data mahasiswa dengan status_lulus_aktual
mahasiswa_list = db.query(Mahasiswa).filter(
    Mahasiswa.status_lulus_aktual.isnot(None)
).all()
```

### **2. Data Splitting**
```python
# Split data training dan testing
split_index = int(len(mahasiswa_list) * (1 - test_size))
training_data = mahasiswa_list[:split_index]
test_data = mahasiswa_list[split_index:]
```

### **3. SAW Calculation**
```python
def calculate_saw_score(mahasiswa):
    # Normalisasi
    normalized_ipk = (mahasiswa.ipk - min_values['ipk']) / (max_values['ipk'] - min_values['ipk'])
    normalized_sks = (mahasiswa.sks - min_values['sks']) / (max_values['sks'] - min_values['sks'])
    normalized_dek = (mahasiswa.persen_dek - min_values['dek']) / (max_values['dek'] - min_values['dek'])
    
    # Hitung skor SAW
    saw_score = (
        weights['ipk'] * normalized_ipk +
        weights['sks'] * normalized_sks +
        weights['dek'] * (1 - normalized_dek)
    )
    return saw_score
```

### **4. Classification**
```python
def classify_saw_score(score):
    if score >= 0.7:
        return "Peluang Lulus Tinggi"
    elif score >= 0.45:
        return "Peluang Lulus Sedang"
    else:
        return "Peluang Lulus Kecil"

def classify_actual(mahasiswa):
    if use_actual_data and mahasiswa.status_lulus_aktual:
        if mahasiswa.status_lulus_aktual.upper() == 'LULUS':
            return "Peluang Lulus Tinggi"
        else:
            return "Peluang Lulus Kecil"
```

### **5. Metrics Calculation**
```python
# Hitung metrik evaluasi
accuracy = accuracy_score(y_true, y_pred)
precision = precision_score(y_true, y_pred, average='macro', zero_division=0)
recall = recall_score(y_true, y_pred, average='macro', zero_division=0)
f1 = f1_score(y_true, y_pred, average='macro', zero_division=0)
cm = confusion_matrix(y_true, y_pred, labels=["Peluang Lulus Tinggi", "Peluang Lulus Sedang", "Peluang Lulus Kecil"])
```

## **🎨 UI/UX Features**

### **1. Responsive Design**
- **Mobile-friendly**: Layout menyesuaikan ukuran layar
- **Grid System**: Bootstrap grid untuk layout yang fleksibel
- **Touch-friendly**: Button dan input yang mudah digunakan di mobile

### **2. Interactive Elements**
- **Loading States**: Spinner saat proses evaluasi
- **Real-time Validation**: Validasi bobot secara real-time
- **Hover Effects**: Efek hover pada cards dan buttons
- **Animations**: Smooth transitions dan animations

### **3. Visual Feedback**
- **Color Coding**: Warna berbeda untuk setiap metrik
- **Progress Indicators**: Progress bar untuk performance
- **Status Icons**: Icon untuk status benar/salah
- **Alert Messages**: Notifikasi sukses/error

### **4. Data Visualization**
- **Chart.js Integration**: Grafik interaktif
- **Custom Styling**: Styling khusus untuk charts
- **Legend**: Penjelasan warna dan simbol
- **Export Options**: Export ke CSV/PDF

## **🔍 Perbedaan dengan Evaluasi SAW Biasa**

| Aspek | Evaluasi SAW Biasa | Evaluasi SAW dengan Data Aktual |
|-------|-------------------|--------------------------------|
| **Data Source** | Semua data mahasiswa | Hanya mahasiswa dengan status_lulus_aktual |
| **Ground Truth** | Aturan synthetic (IPK ≥ 3.0, SKS ≥ 120, DEK ≤ 10%) | Status_lulus_aktual dari database |
| **Accuracy** | Berdasarkan aturan ideal | Berdasarkan realitas historis |
| **Use Case** | Validasi awal model | Evaluasi produksi model |
| **Reliability** | Teoritis | Praktis |

## **🚀 Cara Penggunaan**

### **1. Akses Menu**
1. Buka aplikasi SPK Monitoring Masa Studi
2. Klik menu "Evaluasi SAW dengan Data Aktual" di sidebar

### **2. Konfigurasi Evaluasi**
1. Set bobot kriteria (IPK, SKS, DEK) - total harus 100%
2. Atur ukuran data test (10-50%)
3. Set random state untuk reproduksi hasil
4. Pilih opsi "Simpan ke Database" jika diperlukan

### **3. Jalankan Evaluasi**
1. Klik tombol "Hitung Evaluasi SAW dengan Data Aktual"
2. Tunggu proses evaluasi selesai
3. Lihat hasil di berbagai section

### **4. Analisis Hasil**
1. **Summary**: Lihat ringkasan data dan akurasi
2. **Metrics**: Analisis precision, recall, F1-score, specificity
3. **Confusion Matrix**: Pahami kesalahan klasifikasi
4. **Results Grid**: Lihat detail per mahasiswa
5. **Charts**: Visualisasi distribusi dan perbandingan
6. **Analysis**: Baca interpretasi dan rekomendasi

### **5. Export & Print**
1. **Export Data**: Download hasil dalam format CSV
2. **Print Report**: Cetak laporan evaluasi

## **📈 Metrik Evaluasi**

### **1. Accuracy (Akurasi)**
```
Accuracy = (TP + TN) / (TP + TN + FP + FN)
```
- **Interpretasi**: Persentase prediksi yang benar secara keseluruhan
- **Range**: 0-100%
- **Target**: >80% untuk model yang baik

### **2. Precision (Presisi)**
```
Precision = TP / (TP + FP)
```
- **Interpretasi**: Dari semua yang diprediksi LULUS, berapa persen yang benar
- **Range**: 0-100%
- **Target**: >75% untuk model yang presisi

### **3. Recall (Sensitivitas)**
```
Recall = TP / (TP + FN)
```
- **Interpretasi**: Dari semua yang seharusnya LULUS, berapa persen yang terdeteksi
- **Range**: 0-100%
- **Target**: >75% untuk model yang sensitif

### **4. F1-Score**
```
F1-Score = 2 × (Precision × Recall) / (Precision + Recall)
```
- **Interpretasi**: Rata-rata harmonik precision dan recall
- **Range**: 0-100%
- **Target**: >75% untuk balance yang baik

### **5. Specificity**
```
Specificity = TN / (TN + FP)
```
- **Interpretasi**: Kemampuan model mengidentifikasi mahasiswa yang tidak lulus
- **Range**: 0-100%
- **Target**: >75% untuk spesifisitas yang baik

## **🔧 Troubleshooting**

### **1. Error: "Tidak ada data mahasiswa dengan status_lulus_aktual"**
**Penyebab**: Belum ada data mahasiswa dengan field status_lulus_aktual
**Solusi**: 
- Pastikan field status_lulus_aktual sudah ditambahkan ke tabel mahasiswa
- Update data mahasiswa dengan status kelulusan yang sebenarnya

### **2. Error: "Total bobot harus 100%"**
**Penyebab**: Total bobot IPK + SKS + DEK tidak sama dengan 100%
**Solusi**: Sesuaikan bobot agar totalnya tepat 100%

### **3. Error: "Minimal diperlukan 10 data mahasiswa"**
**Penyebab**: Data mahasiswa dengan status_lulus_aktual kurang dari 10
**Solusi**: Tambahkan lebih banyak data mahasiswa dengan status_lulus_aktual

### **4. Chart tidak muncul**
**Penyebab**: Chart.js belum dimuat atau ada error JavaScript
**Solusi**: 
- Refresh halaman
- Periksa console browser untuk error
- Pastikan Chart.js sudah dimuat

## **📝 Kesimpulan**

Implementasi evaluasi SAW dengan data aktual memberikan kemampuan untuk:

1. **Evaluasi Realistis**: Mengukur performa model berdasarkan data historis yang sebenarnya
2. **Analisis Komprehensif**: Memberikan metrik evaluasi lengkap dan interpretasi yang detail
3. **Visualisasi Informatif**: Menampilkan hasil dalam bentuk grafik dan tabel yang mudah dipahami
4. **Kemudahan Penggunaan**: Interface yang user-friendly dengan validasi real-time
5. **Fleksibilitas**: Konfigurasi parameter yang dapat disesuaikan

Fitur ini sangat penting untuk memvalidasi performa metode SAW sebelum digunakan dalam pengambilan keputusan nyata, sehingga dapat memberikan hasil yang lebih akurat dan dapat dipercaya. 