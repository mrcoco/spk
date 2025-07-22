# Hasil Perbandingan Evaluasi FIS dengan Docker

## **📊 Overview**

Dokumen ini mencatat hasil perbandingan evaluasi FIS yang dijalankan menggunakan Docker container pada tanggal 22 Juli 2025.

## **🛠️ Cara Menjalankan dengan Docker**

### **1. Menggunakan Script Python Langsung**
```bash
docker exec -it spk-backend-1 python /app/tools/compare_evaluations.py
```

### **2. Menggunakan Script Bash**
```bash
docker exec -it spk-backend-1 bash /app/tools/run_comparison.sh
```

### **3. Copy Hasil ke Host Machine**
```bash
docker cp spk-backend-1:/app/fis_evaluation_comparison_*.json ./hasil_perbandingan.json
```

## **📈 Hasil Perbandingan**

### **Metrik Evaluasi**

| Metrik | Evaluasi Sebelumnya | Evaluasi dengan Data Aktual | Perbedaan | Status |
|--------|-------------------|---------------------------|-----------|---------|
| **Accuracy** | 0.2333 (23.33%) | 0.2637 (26.37%) | +0.0304 | ✅ Aktual lebih baik |
| **Precision** | 0.5830 (58.30%) | 0.0986 (9.86%) | -0.4844 | ❌ Sebelumnya lebih baik |
| **Recall** | 0.5871 (58.71%) | 0.8129 (81.29%) | +0.2258 | ✅ Aktual lebih baik |
| **F1-Score** | 0.3524 (35.24%) | 0.1759 (17.59%) | -0.1765 | ❌ Sebelumnya lebih baik |

### **Perbandingan Data**

| Aspek | Evaluasi Sebelumnya | Evaluasi dengan Data Aktual |
|-------|-------------------|---------------------------|
| **Total Data** | 400 | 1,604 |
| **Test Data** | 120 | N/A |
| **Execution Time** | 0.016-0.04 detik | N/A |

## **📋 Analisis Hasil**

### **1. Accuracy (Akurasi)**
- **Evaluasi Aktual**: 26.37% (lebih tinggi)
- **Evaluasi Sebelumnya**: 23.33%
- **Perbedaan**: +3.04%
- **Interpretasi**: Evaluasi dengan data aktual menunjukkan akurasi yang sedikit lebih tinggi

### **2. Precision (Presisi)**
- **Evaluasi Aktual**: 9.86% (lebih rendah)
- **Evaluasi Sebelumnya**: 58.30%
- **Perbedaan**: -48.44%
- **Interpretasi**: Evaluasi sebelumnya memiliki presisi yang jauh lebih tinggi

### **3. Recall (Sensitivitas)**
- **Evaluasi Aktual**: 81.29% (lebih tinggi)
- **Evaluasi Sebelumnya**: 58.71%
- **Perbedaan**: +22.58%
- **Interpretasi**: Evaluasi dengan data aktual memiliki recall yang jauh lebih tinggi

### **4. F1-Score**
- **Evaluasi Aktual**: 17.59% (lebih rendah)
- **Evaluasi Sebelumnya**: 35.24%
- **Perbedaan**: -17.65%
- **Interpretasi**: Evaluasi sebelumnya memiliki F1-score yang lebih tinggi

## **🎯 Penilaian Keseluruhan**

### **Ringkasan**
- **Metrik yang lebih baik dengan data aktual**: 2 (accuracy, recall)
- **Metrik yang lebih baik sebelumnya**: 2 (precision, f1_score)
- **Metrik yang sama**: 0
- **Kesimpulan**: Kedua evaluasi memiliki performa yang sebanding

### **Analisis Detail**

#### **Kelebihan Evaluasi dengan Data Aktual**
1. **Recall yang tinggi (81.29%)** - Dapat mendeteksi sebagian besar kasus positif
2. **Accuracy yang lebih baik (26.37%)** - Akurasi keseluruhan sedikit lebih tinggi
3. **Data yang lebih besar (1,604 vs 400)** - Menggunakan dataset yang lebih representatif

#### **Kelebihan Evaluasi Sebelumnya**
1. **Precision yang tinggi (58.30%)** - Prediksi positif yang lebih akurat
2. **F1-Score yang lebih baik (35.24%)** - Keseimbangan precision dan recall yang lebih baik
3. **Execution time yang cepat** - Proses evaluasi yang lebih efisien

## **🔍 Interpretasi Hasil**

### **1. Trade-off Precision vs Recall**
- Evaluasi dengan data aktual memiliki **high recall, low precision**
- Evaluasi sebelumnya memiliki **high precision, low recall**
- Ini menunjukkan trade-off klasik dalam machine learning

### **2. Perbedaan Dataset**
- **Evaluasi sebelumnya**: 400 data (sintetis)
- **Evaluasi aktual**: 1,604 data (nyata)
- Dataset yang lebih besar memberikan gambaran yang lebih realistis

### **3. Validitas Evaluasi**
- **Evaluasi aktual**: Menggunakan ground truth yang sebenarnya
- **Evaluasi sebelumnya**: Menggunakan ground truth sintetis
- Evaluasi aktual lebih valid untuk pengambilan keputusan

## **🚀 Rekomendasi Berdasarkan Hasil**

### **1. Untuk Development**
- **Gunakan evaluasi sebelumnya** untuk validasi konsep dan prototyping
- **Kecepatan dan precision** yang tinggi cocok untuk iterasi cepat

### **2. Untuk Production**
- **Gunakan evaluasi dengan data aktual** untuk validasi yang akurat
- **Recall yang tinggi** penting untuk tidak melewatkan kasus positif
- **Dataset yang besar** memberikan kepercayaan diri yang lebih tinggi

### **3. Untuk Optimasi**
- **Fokus pada peningkatan precision** evaluasi aktual
- **Pertahankan recall yang tinggi** sambil meningkatkan precision
- **Implementasi ensemble methods** untuk keseimbangan yang lebih baik

## **📊 File Hasil**

### **File JSON yang Dihasilkan**
```json
{
  "evaluation_date": "2025-07-22T01:59:15.247470",
  "metrics_comparison": {
    "accuracy": {
      "previous": 0.23333333333333334,
      "actual": 0.2637,
      "difference": 0.0304
    },
    "precision": {
      "previous": 0.5830029619503304,
      "actual": 0.0986,
      "difference": -0.4844
    },
    "recall": {
      "previous": 0.5871345029239766,
      "actual": 0.8129,
      "difference": 0.2258
    },
    "f1_score": {
      "previous": 0.3523554075718338,
      "actual": 0.1759,
      "difference": -0.1765
    }
  },
  "data_comparison": {
    "total_data": {
      "previous": 400,
      "actual": 1604
    }
  },
  "summary": {
    "better_metrics": ["accuracy", "recall"],
    "worse_metrics": ["precision", "f1_score"],
    "equal_metrics": [],
    "overall_assessment": "Kedua evaluasi memiliki performa yang sebanding"
  }
}
```

## **🔧 Troubleshooting Docker**

### **Masalah yang Ditemui**
1. **File disimpan di `/app` bukan `/app/tools`**
   - **Solusi**: Gunakan `find` untuk mencari file
   - **Command**: `docker exec -it spk-backend-1 find /app -name "fis_evaluation_comparison_*.json"`

2. **Permission issues**
   - **Solusi**: Pastikan container berjalan dengan user yang tepat
   - **Command**: `docker exec -it spk-backend-1 ls -la /app/`

3. **Network connectivity**
   - **Solusi**: Pastikan backend dapat diakses dari dalam container
   - **Command**: `docker exec -it spk-backend-1 curl http://localhost:8000/`

## **📈 Langkah Selanjutnya**

### **1. Optimasi Sistem**
- Implementasi teknik untuk meningkatkan precision evaluasi aktual
- Eksperimen dengan parameter fuzzy logic yang berbeda
- Implementasi ensemble methods

### **2. Monitoring Berkelanjutan**
- Jalankan perbandingan secara berkala
- Monitor perubahan performa dari waktu ke waktu
- Dokumentasikan tren dan pola

### **3. Validasi Tambahan**
- Test dengan dataset yang berbeda
- Validasi dengan domain expert
- Implementasi cross-validation

## **🎉 Kesimpulan**

Perbandingan evaluasi FIS dengan Docker berhasil dijalankan dan memberikan insight yang berharga:

1. **Evaluasi dengan data aktual** memiliki recall yang tinggi dan dataset yang lebih besar
2. **Evaluasi sebelumnya** memiliki precision dan F1-score yang lebih baik
3. **Kedua metode** memiliki nilai dalam konteks yang berbeda
4. **Docker** menyediakan environment yang konsisten untuk evaluasi

### **Rekomendasi Utama**
- **Development**: Gunakan evaluasi sebelumnya untuk iterasi cepat
- **Production**: Gunakan evaluasi dengan data aktual untuk validasi yang akurat
- **Research**: Kombinasikan keduanya untuk analisis komprehensif

---

**💡 Tips**: Jalankan perbandingan ini secara berkala untuk memantau performa sistem FIS dan memastikan kualitas evaluasi yang konsisten. 