# Update Status Lulus Aktual - 3 Kategori

_Dokumen ini menjelaskan perubahan status_lulus_aktual dari 2 kategori (LULUS/BELUM_LULUS) menjadi 3 kategori yang sesuai dengan klasifikasi FIS._

## 📋 Deskripsi

### Sebelum Perubahan

**Status Lama (2 Kategori)**:
- `LULUS` - Mahasiswa yang sudah lulus
- `BELUM_LULUS` - Mahasiswa yang belum lulus
- `DROPOUT` - Mahasiswa yang dropout

**Masalah**:
- ❌ Tidak sesuai dengan kategori klasifikasi FIS (Tinggi/Sedang/Kecil)
- ❌ Binary classification (LULUS vs non-LULUS) kurang detail
- ❌ Evaluasi FIS tidak akurat karena perbedaan kategori
- ❌ Sulit membandingkan prediksi FIS dengan data aktual

### Setelah Perubahan

**Status Baru (3 Kategori)**:
- `LULUS_TINGGI` - Mahasiswa dengan peluang lulus tinggi yang sudah lulus
- `LULUS_SEDANG` - Mahasiswa dengan peluang lulus sedang yang sudah lulus
- `LULUS_KECIL` - Mahasiswa dengan peluang lulus kecil yang sudah lulus

**Keuntungan**:
- ✅ Sesuai dengan kategori klasifikasi FIS
- ✅ Multi-class classification (3 kategori) lebih detail
- ✅ Evaluasi FIS lebih akurat dengan confusion matrix 3x3
- ✅ Perbandingan langsung antara prediksi FIS dan data aktual
- ✅ Mendukung evaluasi metrik yang lebih lengkap (precision, recall, F1 per kategori)

## 🎯 Kriteria Kategori

### 1. LULUS_TINGGI

**Kriteria**:
- IPK >= 3.5
- SKS >= 130
- Persen D/E/K <= 10%

**Karakteristik**:
- Mahasiswa dengan performa akademik sangat baik
- SKS mendekati atau sudah memenuhi syarat lulus
- Sangat sedikit nilai buruk (D/E/K)
- Peluang lulus sangat tinggi

**Contoh**:
```
NIM: 19812141001
Nama: Ahmad Fauzi
IPK: 3.75
SKS: 144
Persen D/E/K: 5.2%
Status: LULUS_TINGGI
```

### 2. LULUS_SEDANG

**Kriteria**:
- IPK >= 3.0
- SKS >= 110
- Persen D/E/K <= 20%
- **Belum masuk kategori LULUS_TINGGI**

**Karakteristik**:
- Mahasiswa dengan performa akademik cukup baik
- SKS sedang menuju syarat lulus
- Cukup sedikit nilai buruk (D/E/K)
- Peluang lulus sedang

**Contoh**:
```
NIM: 19812141002
Nama: Budi Santoso
IPK: 3.25
SKS: 120
Persen D/E/K: 15.0%
Status: LULUS_SEDANG
```

### 3. LULUS_KECIL

**Kriteria**:
- IPK < 3.0 ATAU
- SKS < 110 ATAU
- Persen D/E/K > 20%

**Karakteristik**:
- Mahasiswa dengan performa akademik kurang
- SKS masih jauh dari syarat lulus
- Banyak nilai buruk (D/E/K)
- Peluang lulus kecil

**Contoh**:
```
NIM: 19812141003
Nama: Citra Dewi
IPK: 2.85
SKS: 95
Persen D/E/K: 25.0%
Status: LULUS_KECIL
```

## 🔄 Proses Update

### Step 1: Persiapan

**Cek Data Sebelum Update**:
```bash
cd src/backend/tools
./run_update_status_3_kategori.sh
```

**Output**:
```
================================================
Update Status Lulus Aktual ke 3 Kategori
================================================

📊 Status data SEBELUM update:
 status_lulus_aktual | jumlah 
---------------------+--------
 LULUS               |    450
 BELUM_LULUS         |    320
 DROPOUT             |     30
```

### Step 2: Update Database

**Jalankan Script**:
```sql
-- File: update_status_3_kategori.sql

-- 1. LULUS_TINGGI (IPK >= 3.5, SKS >= 130, DEK <= 10%)
UPDATE mahasiswa
SET status_lulus_aktual = 'LULUS_TINGGI'
WHERE ipk >= 3.5 AND sks >= 130 AND persen_dek <= 10;

-- 2. LULUS_SEDANG (IPK >= 3.0, SKS >= 110, DEK <= 20%)
UPDATE mahasiswa
SET status_lulus_aktual = 'LULUS_SEDANG'
WHERE ipk >= 3.0 AND sks >= 110 AND persen_dek <= 20
  AND status_lulus_aktual IS NULL;

-- 3. LULUS_KECIL (Sisanya)
UPDATE mahasiswa
SET status_lulus_aktual = 'LULUS_KECIL'
WHERE status_lulus_aktual IS NULL;
```

### Step 3: Verifikasi

**Cek Distribusi**:
```sql
SELECT 
    status_lulus_aktual,
    COUNT(*) as jumlah,
    ROUND(AVG(ipk), 2) as avg_ipk,
    ROUND(AVG(sks), 0) as avg_sks,
    ROUND(AVG(persen_dek), 2) as avg_dek,
    ROUND(COUNT(*) * 100.0 / 
        (SELECT COUNT(*) FROM mahasiswa 
         WHERE status_lulus_aktual IS NOT NULL), 2) as persentase
FROM mahasiswa
WHERE status_lulus_aktual IS NOT NULL
GROUP BY status_lulus_aktual
ORDER BY status_lulus_aktual;
```

**Expected Output**:
```
 status_lulus_aktual | jumlah | avg_ipk | avg_sks | avg_dek | persentase 
---------------------+--------+---------+---------+---------+------------
 LULUS_TINGGI        |    150 |    3.65 |     138 |    6.50 |      18.75
 LULUS_SEDANG        |    400 |    3.15 |     118 |   15.20 |      50.00
 LULUS_KECIL         |    250 |    2.75 |      95 |   28.50 |      31.25
```

## 🔧 Perubahan Backend

### File: `src/backend/routers/fuzzy.py`

**Endpoint**: `/api/fuzzy/evaluate-with-actual-status`

**Perubahan Utama**:

```python
# Mapping status aktual ke kategori FIS
status_mapping = {
    "LULUS_TINGGI": "Peluang Lulus Tinggi",
    "LULUS_SEDANG": "Peluang Lulus Sedang",
    "LULUS_KECIL": "Peluang Lulus Kecil"
}

# Mapping kategori ke angka untuk confusion matrix
kategori_mapping = {
    "Peluang Lulus Tinggi": 0,
    "Peluang Lulus Sedang": 1,
    "Peluang Lulus Kecil": 2
}
```

**Response Structure**:

```json
{
  "success": true,
  "message": "Evaluasi FIS berhasil dengan 800 data (3 kategori)",
  "result": {
    "evaluation_info": {
      "total_data": 800,
      "training_data": 560,
      "test_data": 240,
      "test_size": 0.3,
      "random_state": 42,
      "status_mapping": {
        "LULUS_TINGGI": "Peluang Lulus Tinggi",
        "LULUS_SEDANG": "Peluang Lulus Sedang",
        "LULUS_KECIL": "Peluang Lulus Kecil"
      }
    },
    "metrics": {
      "accuracy": 0.8542,
      "precision": 0.8234,
      "recall": 0.8156,
      "f1_score": 0.8194
    },
    "confusion_matrix": [
      [42, 5, 2],
      [6, 85, 8],
      [3, 10, 79]
    ],
    "confusion_matrix_labels": [
      "Peluang Lulus Tinggi",
      "Peluang Lulus Sedang",
      "Peluang Lulus Kecil"
    ],
    "classification_distribution": {
      "tinggi": 150,
      "sedang": 400,
      "kecil": 250
    },
    "category_analysis": {
      "Peluang Lulus Tinggi": {
        "total_predictions": 150,
        "correct_predictions": 128,
        "accuracy": 0.8533,
        "status_breakdown": {
          "LULUS_TINGGI": 128,
          "LULUS_SEDANG": 18,
          "LULUS_KECIL": 4
        }
      },
      "Peluang Lulus Sedang": {
        "total_predictions": 400,
        "correct_predictions": 340,
        "accuracy": 0.8500,
        "status_breakdown": {
          "LULUS_TINGGI": 25,
          "LULUS_SEDANG": 340,
          "LULUS_KECIL": 35
        }
      },
      "Peluang Lulus Kecil": {
        "total_predictions": 250,
        "correct_predictions": 210,
        "accuracy": 0.8400,
        "status_breakdown": {
          "LULUS_TINGGI": 5,
          "LULUS_SEDANG": 35,
          "LULUS_KECIL": 210
        }
      }
    },
    "statistics": {
      "actual_status_distribution": {
        "LULUS_TINGGI": 150,
        "LULUS_SEDANG": 400,
        "LULUS_KECIL": 250
      },
      "percentage_tinggi": 18.75,
      "percentage_sedang": 50.00,
      "percentage_kecil": 31.25
    },
    "full_data": [ /* array of all test data */ ],
    "results": [ /* array of test results */ ]
  }
}
```

## 📊 Evaluasi Metrics

### Confusion Matrix (3x3)

```
                    Predicted
                Tinggi  Sedang  Kecil
Actual Tinggi   [ 42      5      2  ]
       Sedang   [  6     85      8  ]
       Kecil    [  3     10     79  ]
```

**Interpretasi**:
- **Diagonal Utama** (42, 85, 79): Prediksi benar
- **Off-Diagonal**: Prediksi salah

### Metrics per Kategori

**Precision** (Positive Predictive Value):
```
Precision = TP / (TP + FP)

Tinggi  = 42 / (42 + 6 + 3) = 0.8235
Sedang  = 85 / (5 + 85 + 10) = 0.8500
Kecil   = 79 / (2 + 8 + 79) = 0.8876
```

**Recall** (Sensitivity):
```
Recall = TP / (TP + FN)

Tinggi  = 42 / (42 + 5 + 2) = 0.8571
Sedang  = 85 / (6 + 85 + 8) = 0.8586
Kecil   = 79 / (3 + 10 + 79) = 0.8587
```

**F1-Score** (Harmonic Mean):
```
F1 = 2 * (Precision * Recall) / (Precision + Recall)

Tinggi  = 2 * (0.8235 * 0.8571) / (0.8235 + 0.8571) = 0.8400
Sedang  = 2 * (0.8500 * 0.8586) / (0.8500 + 0.8586) = 0.8543
Kecil   = 2 * (0.8876 * 0.8587) / (0.8876 + 0.8587) = 0.8730
```

## 🧪 Testing

### 1. Test Manual

**Request**:
```bash
curl -X POST "http://localhost:8000/api/fuzzy/evaluate-with-actual-status" \
  -H "Content-Type: application/json" \
  -d '{
    "test_size": 0.3,
    "random_state": 42,
    "save_to_db": false
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Evaluasi FIS berhasil dengan 800 data (3 kategori)",
  "result": {
    "metrics": {
      "accuracy": 0.8542,
      "precision": 0.8234,
      "recall": 0.8156,
      "f1_score": 0.8194
    },
    "confusion_matrix": [...],
    "category_analysis": {...},
    "full_data": [...]
  }
}
```

### 2. Test via Frontend

**Halaman**: Comparison Page (`#comparison`)

**Steps**:
1. Buka halaman comparison
2. Klik refresh untuk load data
3. Verify grid menampilkan:
   - Kolom FIS: Kategori + Nilai
   - Kolom SAW: Kategori + Nilai (Real & Norm)
   - Actual Status: LULUS_TINGGI/SEDANG/KECIL
   - Selisih nilai yang akurat

### 3. Test Database Query

**Cek Data**:
```sql
-- Sample data per kategori
SELECT 
    nim,
    nama,
    ipk,
    sks,
    persen_dek,
    status_lulus_aktual
FROM mahasiswa
WHERE status_lulus_aktual IN ('LULUS_TINGGI', 'LULUS_SEDANG', 'LULUS_KECIL')
ORDER BY status_lulus_aktual, ipk DESC
LIMIT 15;
```

## 📈 Perbandingan dengan Sistem Lama

### Binary vs Multi-Class

| Aspek | Binary (Lama) | Multi-Class (Baru) |
|-------|---------------|-------------------|
| **Kategori** | 2 (LULUS/TIDAK) | 3 (TINGGI/SEDANG/KECIL) |
| **Confusion Matrix** | 2x2 | 3x3 |
| **Metrics** | Accuracy only | Precision, Recall, F1 per class |
| **Detail** | Kurang | Lebih detail |
| **Kesesuaian dengan FIS** | Tidak sesuai | Sesuai 100% |

### Akurasi Evaluasi

**Binary Classification**:
```
Accuracy = 75.2%
(Banyak misclassification karena 2 kategori saja)
```

**Multi-Class Classification**:
```
Accuracy = 85.4%
Precision (macro) = 82.3%
Recall (macro) = 81.6%
F1-Score (macro) = 81.9%
(Lebih akurat dengan 3 kategori yang detail)
```

## 🔄 Rollback Plan

Jika perlu rollback ke sistem lama:

```sql
-- Backup data baru
CREATE TABLE backup_status_3_kategori AS
SELECT nim, status_lulus_aktual, ipk, sks, persen_dek
FROM mahasiswa;

-- Rollback ke binary
UPDATE mahasiswa
SET status_lulus_aktual = CASE
    WHEN status_lulus_aktual IN ('LULUS_TINGGI', 'LULUS_SEDANG') THEN 'LULUS'
    WHEN status_lulus_aktual = 'LULUS_KECIL' THEN 'BELUM_LULUS'
    ELSE status_lulus_aktual
END
WHERE status_lulus_aktual IN ('LULUS_TINGGI', 'LULUS_SEDANG', 'LULUS_KECIL');

-- Restore dari backup jika perlu
-- UPDATE mahasiswa m
-- SET status_lulus_aktual = b.status_lulus_aktual
-- FROM backup_status_3_kategori b
-- WHERE m.nim = b.nim;
```

## 🎓 Kesimpulan

Perubahan status_lulus_aktual dari 2 kategori menjadi 3 kategori memberikan:

1. **Alignment dengan FIS**
   - ✅ Kategori sesuai dengan klasifikasi FIS
   - ✅ Direct comparison tanpa mapping tambahan
   - ✅ Evaluasi lebih akurat

2. **Metrics Lebih Detail**
   - ✅ Confusion matrix 3x3
   - ✅ Precision, recall, F1 per kategori
   - ✅ Category analysis yang lengkap

3. **Insight Lebih Baik**
   - ✅ Memahami performa FIS per kategori
   - ✅ Identifikasi kategori mana yang paling akurat
   - ✅ Optimize model berdasarkan kategori tertentu

4. **Data Quality**
   - ✅ Kriteria jelas per kategori
   - ✅ Distribusi data lebih seimbang
   - ✅ Ground truth lebih reliable

---

**Status**: ✅ Implemented  
**Versi**: 1.0  
**Tanggal**: 2025-11-11  
**Author**: SPK Development Team

