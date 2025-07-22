# Evaluasi FIS (Fuzzy Inference System)

Direktori ini berisi dokumentasi dan implementasi untuk evaluasi sistem FIS dalam SPK Monitoring Masa Studi.

## **📋 Daftar Isi**

1. [Ringkasan Perbandingan](./RINGKASAN_PERBANDINGAN.md) - Ringkasan cepat perbandingan evaluasi FIS
2. [Perbandingan Lengkap](./PERBANDINGAN_EVALUASI_FIS.md) - Dokumentasi detail perbandingan evaluasi FIS
3. [Contoh Output](./CONTOH_OUTPUT_PERBANDINGAN.md) - Contoh output perbandingan evaluasi FIS
4. [Enhanced Evaluation](./enhanced_evaluation.md) - Implementasi evaluasi yang ditingkatkan
5. [FIS dengan Data Aktual](./FIS_EVALUATION_WITH_ACTUAL_DATA.md) - Evaluasi FIS menggunakan data status lulus aktual

## **🔬 Jenis Evaluasi FIS**

### **1. Evaluasi FIS Sebelumnya (Tanpa Data Aktual)**
- **Endpoint**: `POST /api/fuzzy/evaluate`
- **Karakteristik**: Menggunakan ground truth sintetis
- **Validitas**: Terbatas, tidak dapat diverifikasi
- **Kegunaan**: Development, testing, prototyping

### **2. Evaluasi FIS dengan Data Aktual**
- **Endpoint**: `POST /api/fuzzy/evaluate-with-actual-status`
- **Karakteristik**: Menggunakan status lulus yang sebenarnya
- **Validitas**: Tinggi, dapat diverifikasi
- **Kegunaan**: Production, research, decision making

### **3. Enhanced Evaluation**
- **Endpoint**: `POST /api/fuzzy/evaluate-enhanced`
- **Karakteristik**: Evaluasi dengan metode peningkatan akurasi
- **Validitas**: Sangat tinggi dengan berbagai teknik validasi
- **Kegunaan**: Research, analisis mendalam, optimasi sistem

## **🛠️ Tools Perbandingan**

### **Script Perbandingan**
- **File**: `src/backend/tools/compare_evaluations.py`
- **Runner**: `src/backend/tools/run_comparison.sh`
- **Fungsi**: Membandingkan hasil evaluasi FIS yang sebelumnya dengan evaluasi menggunakan data aktual

### **Cara Penggunaan**
```bash
# Menggunakan script bash
cd src/backend/tools
./run_comparison.sh

# Menggunakan script Python langsung
python3 compare_evaluations.py
```

## **📊 Metrik Evaluasi**

### **Metrik Dasar**
- **Accuracy**: Proporsi prediksi yang benar
- **Precision**: Proporsi prediksi positif yang benar
- **Recall**: Proporsi kasus positif yang terdeteksi
- **F1-Score**: Rata-rata harmonik precision dan recall

### **Metrik Tambahan**
- **Confusion Matrix**: Matriks kesalahan klasifikasi
- **Classification Report**: Laporan detail per kategori
- **Category Analysis**: Analisis per kategori FIS
- **Sample Data**: Data sampel untuk validasi

## **🎯 Rekomendasi Penggunaan**

### **Untuk Development**
1. **Mulai dengan evaluasi sebelumnya** untuk validasi konsep
2. **Gunakan evaluasi dengan data aktual** untuk testing yang akurat
3. **Kombinasikan kedua metode** untuk analisis komprehensif

### **Untuk Production**
1. **Migrasi ke evaluasi dengan data aktual** untuk validasi yang akurat
2. **Lakukan validasi berkala** dengan data terbaru
3. **Monitor performa** secara kontinu

### **Untuk Research**
1. **Gunakan enhanced evaluation** untuk analisis mendalam
2. **Dokumentasikan perbandingan** untuk referensi
3. **Analisis berbagai skenario** untuk optimasi

## **🔧 Implementasi Frontend**

### **Menu Evaluasi**
- **Evaluasi FIS**: Evaluasi sebelumnya (tanpa data aktual)
- **Evaluasi FIS Aktual**: Evaluasi dengan data aktual
- **Enhanced Evaluation**: Evaluasi yang ditingkatkan

### **Fitur UI**
- Form parameter evaluasi
- Loading states dan progress indicators
- Hasil evaluasi yang detail
- Export dan print functionality
- Error handling yang komprehensif

## **📈 Interpretasi Hasil**

### **Perbandingan Metrik**
- **Evaluasi aktual lebih baik**: Migrasi ke evaluasi dengan data aktual
- **Evaluasi sebelumnya lebih baik**: Perlu investigasi data aktual
- **Sama**: Gunakan evaluasi yang lebih sederhana

### **Analisis Kategori**
- **Peluang Lulus Tinggi**: Biasanya memiliki akurasi tertinggi
- **Peluang Lulus Sedang**: Akurasi menengah, perlu monitoring
- **Peluang Lulus Kecil**: Akurasi terendah, perlu perbaikan

### **Rekomendasi Perbaikan**
1. **Tingkatkan akurasi kategori rendah**
2. **Optimasi parameter fuzzy logic**
3. **Tambah data training yang seimbang**
4. **Implementasi ensemble methods**

## **🚀 Langkah Selanjutnya**

### **1. Implementasi Perbaikan**
- Optimasi algoritma FIS berdasarkan hasil evaluasi
- Implementasi ensemble methods
- Penambahan fitur evaluasi real-time

### **2. Monitoring Berkelanjutan**
- Automated evaluation pipeline
- Performance dashboard
- Alert system untuk degradasi performa

### **3. Dokumentasi dan Training**
- User guide untuk interpretasi hasil
- Training material untuk tim development
- Best practices untuk evaluasi FIS

## **📚 Referensi**

### **Dokumentasi Teknis**
- [API Documentation](../api/README.md)
- [Database Schema](../database/README_DATABASE_RESTORE.md)
- [Backend Implementation](../backend/README.md)

### **Troubleshooting**
- [Error Handling](./troubleshooting/README.md)
- [Common Issues](./troubleshooting/SUMMARY_PERBAIKAN_ERROR.md)
- [Performance Optimization](./troubleshooting/ENHANCED_EVALUATION_FIXED.md)

### **Research dan Analisis**
- [FIS Implementation Analysis](../technical/SPK_SYSTEM_DOCUMENTATION.md)
- [Accuracy Improvement](../technical/CARA_MENINGKATKAN_AKURASI_FIS.md)
- [Evaluation Results](../technical/DOCUMENTATION_EVALUASI_FIS.md)

## **🔗 Quick Links**

- **Script Perbandingan**: `src/backend/tools/compare_evaluations.py`
- **Frontend Evaluasi**: Menu "Evaluasi FIS" dan "Evaluasi FIS Aktual"
- **Backend Endpoints**: `/api/fuzzy/evaluate*`
- **Database Migration**: `src/backend/alembic/versions/`

---

**💡 Tips**: Gunakan evaluasi sebelumnya untuk development dan evaluasi dengan data aktual untuk production. Kombinasikan keduanya untuk analisis yang komprehensif dan validasi yang akurat. 