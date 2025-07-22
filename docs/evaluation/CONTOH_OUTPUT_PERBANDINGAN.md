# Contoh Output Perbandingan Evaluasi FIS

## **📊 Output Script Perbandingan**

Berikut adalah contoh output yang dihasilkan oleh script `compare_evaluations.py`:

```
🔬 FIS Evaluation Comparator
==================================================
🔧 Konfigurasi:
   Backend URL: http://localhost:8000
   Skip Checks: false

🔍 Melakukan pre-flight checks...

🔍 Mengecek status backend...
✅ Backend berjalan di http://localhost:8000

✅ Script perbandingan ditemukan: compare_evaluations.py

🔍 Mengecek dependensi Python...
✅ Module 'requests' tersedia

✅ Semua checks berhasil!

🚀 Menjalankan perbandingan evaluasi FIS...
📊 Parameter: test_size=0.3, random_state=42

🔄 Menjalankan evaluasi FIS yang sebelumnya...
✅ Evaluasi FIS yang sebelumnya berhasil

🔄 Menjalankan evaluasi FIS dengan data aktual...
✅ Evaluasi FIS dengan data aktual berhasil

================================================================================
📊 HASIL PERBANDINGAN EVALUASI FIS
================================================================================

🔍 PERBANDINGAN METRIK:
--------------------------------------------------

ACCURACY:
  Sebelumnya: 0.75
  Data Aktual: 0.82
  Perbedaan: 0.07

PRECISION:
  Sebelumnya: 0.73
  Data Aktual: 0.85
  Perbedaan: 0.12

RECALL:
  Sebelumnya: 0.71
  Data Aktual: 0.78
  Perbedaan: 0.07

F1_SCORE:
  Sebelumnya: 0.72
  Data Aktual: 0.81
  Perbedaan: 0.09

📈 PERBANDINGAN DATA:
--------------------------------------------------

Total Data:
  Sebelumnya: 400
  Data Aktual: 150

Test Data:
  Sebelumnya: 120
  Data Aktual: N/A

Execution Time:
  Sebelumnya: 2.345
  Data Aktual: N/A

📋 RINGKASAN:
--------------------------------------------------

Metrik yang lebih baik dengan data aktual: accuracy, precision, recall, f1_score
Metrik yang lebih baik sebelumnya: Tidak ada
Metrik yang sama: Tidak ada

Penilaian Keseluruhan: Evaluasi dengan data aktual lebih baik (4 vs 0 metrik)

================================================================================

💾 Hasil perbandingan disimpan ke: fis_evaluation_comparison_20240120_143022.json

✅ Perbandingan evaluasi FIS berhasil diselesaikan!
📁 Hasil perbandingan disimpan di direktori: /path/to/src/backend/tools

🎉 Selesai!
```

## **📄 Output JSON Perbandingan**

Contoh file JSON yang dihasilkan (`fis_evaluation_comparison_20240120_143022.json`):

```json
{
  "evaluation_date": "2024-01-20T14:30:22.123456",
  "metrics_comparison": {
    "accuracy": {
      "previous": 0.75,
      "actual": 0.82,
      "difference": 0.07
    },
    "precision": {
      "previous": 0.73,
      "actual": 0.85,
      "difference": 0.12
    },
    "recall": {
      "previous": 0.71,
      "actual": 0.78,
      "difference": 0.07
    },
    "f1_score": {
      "previous": 0.72,
      "actual": 0.81,
      "difference": 0.09
    }
  },
  "data_comparison": {
    "total_data": {
      "previous": 400,
      "actual": 150
    },
    "test_data": {
      "previous": 120,
      "actual": "N/A"
    },
    "execution_time": {
      "previous": 2.345,
      "actual": "N/A"
    }
  },
  "summary": {
    "better_metrics": [
      "accuracy",
      "precision", 
      "recall",
      "f1_score"
    ],
    "worse_metrics": [],
    "equal_metrics": [],
    "overall_assessment": "Evaluasi dengan data aktual lebih baik (4 vs 0 metrik)"
  }
}
```

## **🖥️ Output Frontend Evaluasi Sebelumnya**

Contoh tampilan di frontend untuk evaluasi FIS yang sebelumnya:

```
📊 Hasil Evaluasi FIS (Tanpa Data Aktual)

Confusion Matrix:
┌─────────────────────────────────────────────────────────┐
│                    Predicted                            │
│           Tinggi    Sedang    Kecil                     │
├─────────────────────────────────────────────────────────┤
│ Tinggi │    25        5        2    │    32            │
│ Sedang │     3       45        8    │    56            │
│ Kecil  │     1        6       61    │    68            │
├─────────────────────────────────────────────────────────┤
│ Total  │    29       56       71    │   156            │
└─────────────────────────────────────────────────────────┘

Metrik Evaluasi:
• Accuracy: 0.75 (75%)
• Precision: [0.86, 0.80, 0.86]
• Recall: [0.78, 0.80, 0.90]
• F1-Score: [0.82, 0.80, 0.88]
• Macro Average Precision: 0.73
• Macro Average Recall: 0.71
• Macro Average F1-Score: 0.72

Ringkasan:
• Total Data: 400
• Training Data: 280
• Test Data: 120
• Execution Time: 2.345 detik
```

## **🖥️ Output Frontend Evaluasi dengan Data Aktual**

Contoh tampilan di frontend untuk evaluasi FIS dengan data aktual:

```
📊 Hasil Evaluasi FIS dengan Data Aktual

Ringkasan Evaluasi:
┌─────────────────────────────────────────────────────────┐
│ Total Data: 150                                         │
│ Data Lulus: 97 (64.67%)                                 │
│ Data Belum Lulus: 53 (35.33%)                          │
│ Persentase Lulus: 64.67%                                │
└─────────────────────────────────────────────────────────┘

Metrik Evaluasi:
┌─────────────────────────────────────────────────────────┐
│ Overall Metrics:                                        │
│ • Accuracy: 0.82 (82%)                                  │
│ • Precision: 0.85 (85%)                                 │
│ • Recall: 0.78 (78%)                                    │
│ • F1-Score: 0.81 (81%)                                  │
└─────────────────────────────────────────────────────────┘

Confusion Matrix:
┌─────────────────────────────────────────────────────────┐
│                    Predicted                            │
│              Lulus    Belum Lulus                       │
├─────────────────────────────────────────────────────────┤
│ Lulus      │    85        12    │    97                │
│ Belum Lulus│     8        45    │    53                │
├─────────────────────────────────────────────────────────┤
│ Total      │    93        57    │   150                │
└─────────────────────────────────────────────────────────┘

Analisis per Kategori FIS:
┌─────────────────────────────────────────────────────────┐
│ 🟢 Peluang Lulus Tinggi:                                │
│    • Total Prediksi: 30                                 │
│    • Benar Lulus: 25                                    │
│    • Akurasi: 83.33%                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🟡 Peluang Lulus Sedang:                                │
│    • Total Prediksi: 45                                 │
│    • Benar Lulus: 35                                    │
│    • Akurasi: 77.78%                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🔴 Peluang Lulus Kecil:                                 │
│    • Total Prediksi: 75                                 │
│    • Benar Lulus: 37                                    │
│    • Akurasi: 49.33%                                    │
└─────────────────────────────────────────────────────────┘

Sample Data Evaluasi:
┌─────────────────────────────────────────────────────────┐
│ NIM           │ Nama        │ Predicted │ Actual │ Match │
├─────────────────────────────────────────────────────────┤
│ 19812141079   │ John Doe    │ Tinggi    │ Lulus  │ ✅    │
│ 19812141080   │ Jane Smith  │ Sedang    │ Lulus  │ ✅    │
│ 19812141081   │ Bob Johnson │ Kecil     │ Lulus  │ ❌    │
│ 19812141082   │ Alice Brown │ Tinggi    │ Lulus  │ ✅    │
│ 19812141083   │ Charlie Lee │ Sedang    │ Lulus  │ ✅    │
└─────────────────────────────────────────────────────────┘
```

## **📊 Interpretasi Hasil**

### **Kesimpulan dari Contoh Output:**

1. **Evaluasi dengan Data Aktual Lebih Baik**
   - Semua metrik (accuracy, precision, recall, f1-score) lebih tinggi
   - Perbedaan signifikan pada precision (+0.12)

2. **Data yang Lebih Realistis**
   - Evaluasi aktual menggunakan 150 data vs 400 data sintetis
   - Distribusi lulus 64.67% lebih realistis

3. **Insight Mendalam**
   - Kategori "Peluang Lulus Tinggi" memiliki akurasi tertinggi (83.33%)
   - Kategori "Peluang Lulus Kecil" memiliki akurasi terendah (49.33%)

4. **Rekomendasi**
   - Gunakan evaluasi dengan data aktual untuk production
   - Perbaiki algoritma untuk kategori "Peluang Lulus Kecil"
   - Lakukan validasi berkala dengan data terbaru

## **🔧 Cara Menggunakan Output**

### **1. Analisis Metrik**
- Bandingkan nilai accuracy, precision, recall, f1-score
- Identifikasi metrik mana yang lebih baik
- Analisis perbedaan signifikan

### **2. Analisis Data**
- Bandingkan jumlah data yang digunakan
- Analisis distribusi data
- Identifikasi bias dalam data

### **3. Analisis Kategori**
- Identifikasi kategori mana yang paling akurat
- Analisis false positive dan false negative
- Buat rekomendasi perbaikan

### **4. Pengambilan Keputusan**
- Pilih metode evaluasi yang sesuai
- Buat rencana perbaikan sistem
- Dokumentasikan hasil untuk referensi

---

**💡 Tips**: Gunakan output ini sebagai template untuk menganalisis hasil perbandingan evaluasi FIS Anda sendiri. 