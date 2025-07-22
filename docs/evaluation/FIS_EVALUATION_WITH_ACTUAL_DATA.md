# Evaluasi FIS dengan Data Status Lulus Aktual

## **Overview**

Evaluasi FIS (Fuzzy Inference System) dengan data status lulus aktual adalah proses membandingkan hasil klasifikasi FIS dengan status lulus yang sebenarnya dari mahasiswa. Ini memungkinkan kita untuk mengukur akurasi dan performa sistem FIS dalam memprediksi kelulusan mahasiswa.

## **Struktur Data yang Diperlukan**

### **1. Data Hasil Klasifikasi FIS**
- **Tabel:** `klasifikasi_kelulusan`
- **Field:**
  - `kategori`: "Peluang Lulus Tinggi/Sedang/Kecil"
  - `nilai_fuzzy`: Nilai fuzzy akhir
  - `ipk_membership`, `sks_membership`, `nilai_dk_membership`

### **2. Data Status Lulus Aktual**
- **Tabel:** `mahasiswa` (field baru)
- **Field:**
  - `status_lulus_aktual`: "LULUS", "BELUM_LULUS", "DROPOUT"
  - `tanggal_lulus`: Tanggal lulus jika sudah lulus

## **Langkah-langkah Implementasi**

### **1. Persiapan Database**

#### **A. Menjalankan Migration**
```bash
# Di direktori backend
alembic upgrade head
```

#### **B. Mengisi Data Status Lulus Aktual**
```sql
-- Update beberapa mahasiswa dengan status lulus aktual
UPDATE mahasiswa 
SET status_lulus_aktual = 'LULUS', 
    tanggal_lulus = '2024-01-15' 
WHERE nim IN ('19812141079', '19812141080', '19812141081');

UPDATE mahasiswa 
SET status_lulus_aktual = 'BELUM_LULUS' 
WHERE nim IN ('19812141082', '19812141083', '19812141084');

UPDATE mahasiswa 
SET status_lulus_aktual = 'DROPOUT' 
WHERE nim IN ('19812141085', '19812141086');
```

### **2. API Endpoint**

#### **Endpoint Evaluasi FIS**
```http
POST /api/fuzzy/evaluate-with-actual-status
```

**Parameters:**
- `test_size`: Proporsi data test (0.1 - 0.5, default: 0.3)
- `random_state`: Random state untuk reproducibility (default: 42)

**Response:**
```json
{
  "success": true,
  "message": "Evaluasi FIS berhasil dengan 50 data",
  "result": {
    "evaluation_info": {
      "total_data": 50,
      "test_size": 0.3,
      "random_state": 42,
      "evaluation_date": "2024-01-20T10:00:00"
    },
    "metrics": {
      "accuracy": 0.85,
      "precision": 0.82,
      "recall": 0.88,
      "f1_score": 0.85
    },
    "confusion_matrix": {
      "matrix": [[15, 3], [4, 28]],
      "labels": ["Belum Lulus", "Lulus"]
    },
    "category_analysis": {
      "Peluang Lulus Tinggi": {
        "total_predictions": 32,
        "correct_predictions": 28,
        "accuracy": 0.875,
        "actual_lulus": 28,
        "actual_belum_lulus": 4
      },
      "Peluang Lulus Sedang": {
        "total_predictions": 12,
        "correct_predictions": 8,
        "accuracy": 0.667,
        "actual_lulus": 8,
        "actual_belum_lulus": 4
      },
      "Peluang Lulus Kecil": {
        "total_predictions": 6,
        "correct_predictions": 2,
        "accuracy": 0.333,
        "actual_lulus": 2,
        "actual_belum_lulus": 4
      }
    },
    "statistics": {
      "total_actual_lulus": 38,
      "total_actual_belum_lulus": 12,
      "percentage_actual_lulus": 76.0,
      "percentage_actual_belum_lulus": 24.0
    },
    "sample_data": [...]
  }
}
```

### **3. Frontend Implementation**

#### **A. Button Evaluasi**
```html
<button id="btnEvaluateFISActual" class="k-button k-button-md k-rounded-md k-button-solid custom-button-sync">
    <i class="fas fa-chart-line"></i> Evaluasi FIS dengan Data Aktual
</button>
```

#### **B. JavaScript Function**
```javascript
function evaluateFISWithActualStatus() {
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + '/evaluate-with-actual-status',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            test_size: 0.3,
            random_state: 42
        }),
        success: function(response) {
            if (response.success) {
                displayFISEvaluationResults(response.result);
            }
        }
    });
}
```

## **Metrik Evaluasi**

### **1. Accuracy (Akurasi)**
- **Rumus:** `(TP + TN) / (TP + TN + FP + FN)`
- **Keterangan:** Persentase prediksi yang benar secara keseluruhan

### **2. Precision (Presisi)**
- **Rumus:** `TP / (TP + FP)`
- **Keterangan:** Dari semua yang diprediksi lulus, berapa yang benar-benar lulus

### **3. Recall (Sensitivitas)**
- **Rumus:** `TP / (TP + FN)`
- **Keterangan:** Dari semua yang benar-benar lulus, berapa yang berhasil diprediksi

### **4. F1-Score**
- **Rumus:** `2 * (Precision * Recall) / (Precision + Recall)`
- **Keterangan:** Rata-rata harmonik dari precision dan recall

## **Confusion Matrix**

```
                    Prediksi
                Belum Lulus | Lulus
Aktual Belum Lulus    TN   |  FP
Aktual Lulus          FN   |  TP
```

**Keterangan:**
- **TN (True Negative):** Benar memprediksi tidak lulus
- **FP (False Positive):** Salah memprediksi lulus
- **FN (False Negative):** Salah memprediksi tidak lulus
- **TP (True Positive):** Benar memprediksi lulus

## **Analisis per Kategori**

### **1. Peluang Lulus Tinggi**
- Mahasiswa dengan IPK tinggi, SKS cukup, dan persentase DEK rendah
- Diharapkan memiliki akurasi tinggi dalam memprediksi kelulusan

### **2. Peluang Lulus Sedang**
- Mahasiswa dengan kriteria menengah
- Akurasi prediksi biasanya sedang

### **3. Peluang Lulus Kecil**
- Mahasiswa dengan IPK rendah, SKS kurang, atau persentase DEK tinggi
- Akurasi prediksi mungkin lebih rendah

## **Cara Menggunakan**

### **1. Persiapan Data**
```sql
-- Pastikan ada data status lulus aktual
SELECT COUNT(*) as total_with_status 
FROM mahasiswa 
WHERE status_lulus_aktual IS NOT NULL;

-- Minimal diperlukan 10 data untuk evaluasi
```

### **2. Menjalankan Evaluasi**
1. Buka halaman FIS di aplikasi
2. Klik tombol "Evaluasi FIS dengan Data Aktual"
3. Tunggu proses evaluasi selesai
4. Lihat hasil evaluasi yang ditampilkan

### **3. Interpretasi Hasil**
- **Accuracy > 80%:** Sistem FIS sangat akurat
- **Accuracy 60-80%:** Sistem FIS cukup akurat
- **Accuracy < 60%:** Sistem FIS perlu perbaikan

## **Perbaikan Sistem FIS**

### **1. Analisis Kesalahan**
- Lihat confusion matrix untuk memahami jenis kesalahan
- Analisis kategori mana yang paling sering salah

### **2. Penyesuaian Parameter**
- Ubah membership function untuk IPK, SKS, dan persentase DEK
- Sesuaikan rule base berdasarkan analisis kesalahan

### **3. Penambahan Data Training**
- Tambahkan lebih banyak data dengan status lulus aktual
- Pastikan data representatif untuk semua kategori

## **Contoh Penggunaan Praktis**

### **Scenario 1: Evaluasi Awal**
```javascript
// Evaluasi dengan 30% data test
evaluateFISWithActualStatus(0.3, 42);
```

### **Scenario 2: Evaluasi dengan Data Lebih Banyak**
```javascript
// Evaluasi dengan 20% data test untuk data yang lebih besar
evaluateFISWithActualStatus(0.2, 42);
```

### **Scenario 3: Evaluasi Berulang**
```javascript
// Evaluasi dengan random state berbeda untuk validasi
evaluateFISWithActualStatus(0.3, 123);
```

## **Troubleshooting**

### **Error: "Minimal diperlukan 10 data"**
- **Solusi:** Tambahkan lebih banyak data status lulus aktual

### **Error: "Data tidak konsisten"**
- **Solusi:** Pastikan format data status lulus aktual sesuai ("LULUS", "BELUM_LULUS", "DROPOUT")

### **Akurasi Rendah**
- **Solusi:** 
  1. Analisis confusion matrix
  2. Perbaiki parameter FIS
  3. Tambah data training
  4. Sesuaikan rule base

## **Kesimpulan**

Evaluasi FIS dengan data status lulus aktual memberikan gambaran yang akurat tentang performa sistem dalam memprediksi kelulusan mahasiswa. Dengan metrik yang tepat dan analisis yang mendalam, sistem FIS dapat terus diperbaiki untuk mencapai akurasi yang optimal. 