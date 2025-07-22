# Ringkasan Perbandingan Evaluasi FIS

## **📊 Perbandingan Singkat**

| Aspek | Evaluasi Sebelumnya | Evaluasi dengan Data Aktual |
|-------|-------------------|---------------------------|
| **Validitas** | ⚠️ Terbatas | ✅ Tinggi |
| **Data Ground Truth** | ❌ Sintetis | ✅ Nyata |
| **Kompleksitas** | 🟢 Sederhana | 🟡 Menengah |
| **Kebutuhan Data** | 🟢 Minimal | 🟡 Tambahan |
| **Akurasi Evaluasi** | ❌ Tidak dapat diverifikasi | ✅ Dapat diverifikasi |

## **🎯 Kapan Menggunakan Masing-masing**

### **Evaluasi Sebelumnya (Tanpa Data Aktual)**
- ✅ **Development & Testing** - Saat mengembangkan sistem
- ✅ **Prototyping** - Untuk membuat prototipe
- ✅ **Data Terbatas** - Ketika belum ada status lulus aktual
- ✅ **Validasi Konsep** - Untuk memvalidasi konsep FIS

### **Evaluasi dengan Data Aktual**
- ✅ **Production** - Untuk sistem yang sudah berjalan
- ✅ **Research** - Untuk penelitian dan analisis mendalam
- ✅ **Decision Making** - Untuk pengambilan keputusan
- ✅ **Validasi Akurat** - Ketika ingin validasi yang akurat

## **🔧 Cara Menjalankan Perbandingan**

### **1. Menggunakan Script Otomatis**
```bash
# Dari root project
cd src/backend/tools
./run_comparison.sh

# Atau dengan parameter custom
./run_comparison.sh -u http://localhost:8001
```

### **2. Menggunakan Script Python Langsung**
```bash
cd src/backend/tools
python3 compare_evaluations.py
```

### **3. Melalui Frontend**
1. Buka aplikasi di browser
2. Pilih menu "Evaluasi FIS" untuk evaluasi sebelumnya
3. Pilih menu "Evaluasi FIS Aktual" untuk evaluasi dengan data aktual
4. Bandingkan hasil secara manual

## **📈 Metrik yang Dibandingkan**

### **Evaluasi Sebelumnya**
- **Classification Type**: Multi-class (3 kategori)
- **Confusion Matrix**: 3x3 matrix
- **Metrics**: Accuracy, Precision, Recall, F1-Score per kategori
- **Output**: Macro averages

### **Evaluasi dengan Data Aktual**
- **Classification Type**: Binary (Lulus/Belum Lulus)
- **Confusion Matrix**: 2x2 matrix
- **Metrics**: Overall Accuracy, Precision, Recall, F1-Score
- **Output**: Category analysis, sample data, statistics

## **🚀 Langkah Migrasi**

### **1. Persiapan Data**
```sql
-- Tambahkan kolom status lulus aktual
ALTER TABLE mahasiswa ADD COLUMN status_lulus_aktual VARCHAR(20) NULL;
ALTER TABLE mahasiswa ADD COLUMN tanggal_lulus TIMESTAMP NULL;

-- Buat index untuk optimasi
CREATE INDEX idx_mahasiswa_status_lulus ON mahasiswa(status_lulus_aktual);
```

### **2. Update Data**
```sql
-- Contoh update data dengan status aktual
UPDATE mahasiswa 
SET status_lulus_aktual = 'LULUS', 
    tanggal_lulus = '2024-01-15 00:00:00' 
WHERE nim IN ('19812141079', '19812141080', '19812141081');
```

### **3. Validasi**
- Pastikan minimal 10 data dengan status lulus aktual
- Test dengan berbagai skenario data
- Verifikasi mapping kategori FIS ke binary

## **📋 Checklist Perbandingan**

### **Sebelum Menjalankan Perbandingan**
- [ ] Backend berjalan dan dapat diakses
- [ ] Data mahasiswa tersedia
- [ ] Status lulus aktual sudah diisi (untuk evaluasi aktual)
- [ ] Klasifikasi FIS sudah dilakukan
- [ ] Dependensi Python tersedia (requests)

### **Setelah Menjalankan Perbandingan**
- [ ] Hasil perbandingan tersimpan
- [ ] Metrik dapat dibandingkan
- [ ] Ringkasan perbandingan dibuat
- [ ] Rekomendasi penggunaan dibuat

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
1. **Gunakan evaluasi dengan data aktual** untuk hasil yang valid
2. **Dokumentasikan perbandingan** untuk referensi
3. **Analisis mendalam** per kategori dan metrik

## **📚 Referensi**

- [Dokumentasi Lengkap Perbandingan](./PERBANDINGAN_EVALUASI_FIS.md)
- [Implementasi Enhanced Evaluation](./enhanced_evaluation.md)
- [Troubleshooting Evaluasi](./troubleshooting/README.md)
- [API Documentation](../api/README.md)

## **🔗 Quick Links**

- **Script Perbandingan**: `src/backend/tools/compare_evaluations.py`
- **Script Runner**: `src/backend/tools/run_comparison.sh`
- **Frontend Evaluasi**: Menu "Evaluasi FIS" dan "Evaluasi FIS Aktual"
- **Backend Endpoints**: 
  - `/api/fuzzy/evaluate` (sebelumnya)
  - `/api/fuzzy/evaluate-with-actual-status` (dengan data aktual)

---

**💡 Tips**: Gunakan evaluasi sebelumnya untuk development dan evaluasi dengan data aktual untuk production. Kombinasikan keduanya untuk analisis yang komprehensif. 