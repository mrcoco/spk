# Perbandingan Evaluasi FIS: Sebelum vs Dengan Data Aktual

## **Overview**

Dokumen ini membandingkan dua jenis evaluasi FIS (Fuzzy Inference System) yang telah diimplementasikan dalam sistem SPK Monitoring Masa Studi:

1. **Evaluasi FIS Sebelumnya** - Evaluasi tanpa data status lulus aktual
2. **Evaluasi FIS dengan Data Aktual** - Evaluasi dengan membandingkan hasil klasifikasi terhadap status lulus yang sebenarnya

## **1. Evaluasi FIS Sebelumnya (Tanpa Data Aktual)**

### **Endpoint Backend**
```
POST /api/fuzzy/evaluate
```

### **Karakteristik Evaluasi**
- **Data Sumber**: Hanya menggunakan data mahasiswa (IPK, SKS, Persen DEK)
- **Ground Truth**: Dibuat secara sintetis berdasarkan kriteria yang ditentukan
- **Metode Validasi**: Menggunakan threshold yang disesuaikan dengan distribusi data

### **Algoritma Evaluasi**
```python
# True label berdasarkan kriteria sintetis
if mahasiswa.ipk >= 3.8:
    true_label = "Peluang Lulus Tinggi"
elif mahasiswa.ipk >= 3.2:
    true_label = "Peluang Lulus Sedang"
else:
    true_label = "Peluang Lulus Kecil"
```

### **Keterbatasan**
1. **Ground Truth Sintetis**: Status lulus dibuat berdasarkan asumsi, bukan data nyata
2. **Bias Threshold**: Kriteria evaluasi mungkin tidak mencerminkan kondisi sebenarnya
3. **Validitas Terbatas**: Hasil evaluasi tidak dapat diandalkan untuk prediksi nyata
4. **Tidak Ada Verifikasi**: Tidak ada cara untuk memverifikasi akurasi prediksi

### **Metrik yang Dihasilkan**
- Accuracy, Precision, Recall, F1-Score per kategori
- Confusion Matrix 3x3 (Tinggi, Sedang, Kecil)
- Macro averages untuk semua kategori

## **2. Evaluasi FIS dengan Data Aktual**

### **Endpoint Backend**
```
POST /api/fuzzy/evaluate-with-actual-status
```

### **Karakteristik Evaluasi**
- **Data Sumber**: Data mahasiswa + status lulus aktual dari database
- **Ground Truth**: Status lulus yang sebenarnya (LULUS, BELUM_LULUS, DROPOUT)
- **Metode Validasi**: Perbandingan langsung dengan data nyata

### **Struktur Data yang Diperlukan**
```sql
-- Field baru di tabel mahasiswa
ALTER TABLE mahasiswa ADD COLUMN status_lulus_aktual VARCHAR(20) NULL;
ALTER TABLE mahasiswa ADD COLUMN tanggal_lulus TIMESTAMP NULL;
```

### **Algoritma Evaluasi**
```python
# Mapping status aktual ke binary
def map_to_binary(status):
    if status == "LULUS":
        return 1
    else:
        return 0

# Mapping kategori FIS ke binary
def map_fis_to_binary(category):
    if category == "Peluang Lulus Tinggi":
        return 1
    else:
        return 0
```

### **Keunggulan**
1. **Data Nyata**: Menggunakan status lulus yang sebenarnya
2. **Validitas Tinggi**: Hasil evaluasi mencerminkan performa sebenarnya
3. **Verifikasi Akurat**: Dapat memverifikasi prediksi dengan data nyata
4. **Insight Mendalam**: Memberikan analisis per kategori yang detail

### **Metrik yang Dihasilkan**
- Accuracy, Precision, Recall, F1-Score (binary classification)
- Confusion Matrix 2x2 (Lulus vs Belum Lulus)
- Analisis per kategori FIS
- Statistik distribusi data aktual

## **3. Perbandingan Detail**

### **3.1 Perbedaan Metodologi**

| Aspek | Evaluasi Sebelumnya | Evaluasi dengan Data Aktual |
|-------|-------------------|---------------------------|
| **Data Ground Truth** | Sintetis (berdasarkan IPK) | Nyata (status lulus aktual) |
| **Validitas** | Terbatas | Tinggi |
| **Kompleksitas** | Sederhana | Lebih kompleks |
| **Kebutuhan Data** | Hanya data mahasiswa | Data mahasiswa + status aktual |
| **Akurasi Evaluasi** | Tidak dapat diverifikasi | Dapat diverifikasi |

### **3.2 Perbedaan Metrik**

| Metrik | Evaluasi Sebelumnya | Evaluasi dengan Data Aktual |
|--------|-------------------|---------------------------|
| **Classification Type** | Multi-class (3 kategori) | Binary (Lulus/Belum Lulus) |
| **Confusion Matrix** | 3x3 matrix | 2x2 matrix |
| **Precision/Recall** | Per kategori | Overall + per kategori |
| **F1-Score** | Macro average | Binary F1-score |
| **Accuracy** | Multi-class accuracy | Binary accuracy |

### **3.3 Perbedaan Output**

#### **Evaluasi Sebelumnya**
```json
{
  "confusion_matrix": [[x, y, z], [a, b, c], [d, e, f]],
  "metrics": {
    "accuracy": 0.75,
    "precision": [0.8, 0.7, 0.6],
    "recall": [0.8, 0.7, 0.6],
    "f1": [0.8, 0.7, 0.6]
  },
  "kategori_mapping": {
    "0": "Peluang Lulus Tinggi",
    "1": "Peluang Lulus Sedang", 
    "2": "Peluang Lulus Kecil"
  }
}
```

#### **Evaluasi dengan Data Aktual**
```json
{
  "evaluation_info": {
    "total_data": 150,
    "test_size": 0.3,
    "evaluation_date": "2024-01-20T10:00:00"
  },
  "metrics": {
    "accuracy": 0.82,
    "precision": 0.85,
    "recall": 0.78,
    "f1_score": 0.81
  },
  "confusion_matrix": {
    "matrix": [[45, 12], [8, 85]],
    "labels": ["Belum Lulus", "Lulus"]
  },
  "category_analysis": {
    "Peluang Lulus Tinggi": {
      "total_predictions": 30,
      "correct_predictions": 25,
      "accuracy": 0.83
    }
  },
  "statistics": {
    "total_actual_lulus": 97,
    "total_actual_belum_lulus": 53,
    "percentage_actual_lulus": 64.67
  }
}
```

## **4. Implementasi Frontend**

### **4.1 Evaluasi Sebelumnya**
- **Section**: `#evaluation`
- **Menu**: "Evaluasi FIS"
- **Fungsi**: `evaluateFuzzySystem()`
- **UI**: Form sederhana dengan parameter test_size dan random_state

### **4.2 Evaluasi dengan Data Aktual**
- **Section**: `#fis-actual-evaluation`
- **Menu**: "Evaluasi FIS Aktual"
- **Fungsi**: `evaluateFISWithActualStatusFromSection()`
- **UI**: Form lengkap dengan parameter dan hasil yang detail

### **4.3 Perbedaan UI**

| Komponen | Evaluasi Sebelumnya | Evaluasi dengan Data Aktual |
|----------|-------------------|---------------------------|
| **Form Parameter** | Test size, Random state | Test size, Random state |
| **Hasil Display** | Confusion matrix, metrics | Summary, metrics, category analysis, sample data |
| **Loading State** | Sederhana | Detail dengan progress |
| **Error Handling** | Basic | Comprehensive |
| **Export/Print** | Tidak ada | Tersedia |

## **5. Rekomendasi Penggunaan**

### **5.1 Kapan Menggunakan Evaluasi Sebelumnya**
- **Development/Testing**: Saat mengembangkan dan menguji sistem
- **Data Terbatas**: Ketika belum ada data status lulus aktual
- **Prototyping**: Untuk membuat prototipe sistem
- **Validasi Konsep**: Untuk memvalidasi konsep FIS

### **5.2 Kapan Menggunakan Evaluasi dengan Data Aktual**
- **Production**: Untuk evaluasi sistem yang sudah berjalan
- **Validasi Akurat**: Ketika ingin validasi yang akurat
- **Research**: Untuk penelitian dan analisis mendalam
- **Decision Making**: Untuk pengambilan keputusan berdasarkan data nyata

## **6. Migrasi dari Evaluasi Sebelumnya**

### **6.1 Persiapan Data**
```sql
-- 1. Tambahkan kolom status lulus aktual
ALTER TABLE mahasiswa ADD COLUMN status_lulus_aktual VARCHAR(20) NULL;
ALTER TABLE mahasiswa ADD COLUMN tanggal_lulus TIMESTAMP NULL;

-- 2. Buat index untuk optimasi
CREATE INDEX idx_mahasiswa_status_lulus ON mahasiswa(status_lulus_aktual);

-- 3. Update data dengan status aktual
UPDATE mahasiswa 
SET status_lulus_aktual = 'LULUS', 
    tanggal_lulus = '2024-01-15 00:00:00' 
WHERE nim IN ('19812141079', '19812141080', '19812141081');
```

### **6.2 Update Frontend**
- Tambahkan menu "Evaluasi FIS Aktual"
- Implementasikan fungsi evaluasi dengan data aktual
- Tambahkan UI untuk menampilkan hasil yang detail

### **6.3 Validasi**
- Pastikan minimal 10 data dengan status lulus aktual
- Verifikasi mapping kategori FIS ke binary
- Test dengan berbagai skenario data

## **7. Kesimpulan**

### **7.1 Evaluasi Sebelumnya**
- **Kelebihan**: Sederhana, cepat, tidak memerlukan data tambahan
- **Kekurangan**: Validitas terbatas, ground truth sintetis
- **Kegunaan**: Development, testing, prototyping

### **7.2 Evaluasi dengan Data Aktual**
- **Kelebihan**: Validitas tinggi, data nyata, insight mendalam
- **Kekurangan**: Memerlukan data tambahan, lebih kompleks
- **Kegunaan**: Production, research, decision making

### **7.3 Rekomendasi**
1. **Gunakan evaluasi sebelumnya** untuk development dan testing
2. **Migrasi ke evaluasi dengan data aktual** untuk production
3. **Kombinasikan kedua metode** untuk analisis yang komprehensif
4. **Lakukan validasi berkala** dengan data aktual terbaru

## **8. Referensi**

- [Dokumentasi Evaluasi FIS](./README.md)
- [Implementasi Enhanced Evaluation](./enhanced_evaluation.md)
- [Troubleshooting Evaluasi](./troubleshooting/README.md)
- [API Documentation](../api/README.md) 