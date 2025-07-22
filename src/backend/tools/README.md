# Tools untuk Evaluasi FIS

Direktori ini berisi berbagai tools untuk membantu evaluasi dan perbandingan sistem FIS (Fuzzy Inference System).

## **🔬 Script Perbandingan Evaluasi FIS**

### **File Utama**
- `compare_evaluations.py` - Script Python untuk membandingkan evaluasi FIS
- `run_comparison.sh` - Script bash untuk menjalankan perbandingan dengan mudah

### **Cara Penggunaan**

#### **1. Menggunakan Script Bash (Direkomendasikan)**
```bash
# Dari root project
cd src/backend/tools

# Jalankan dengan default settings
./run_comparison.sh

# Jalankan dengan backend URL custom
./run_comparison.sh -u http://localhost:8001

# Skip pre-flight checks
./run_comparison.sh --skip-checks

# Tampilkan bantuan
./run_comparison.sh --help
```

#### **2. Menggunakan Script Python Langsung**
```bash
cd src/backend/tools
python3 compare_evaluations.py
```

#### **3. Menggunakan Python dengan Parameter**
```python
from compare_evaluations import FISEvaluationComparator

# Inisialisasi comparator
comparator = FISEvaluationComparator(base_url="http://localhost:8000")

# Jalankan perbandingan
comparison = comparator.run_full_comparison(
    test_size=0.3,
    random_state=42,
    save_results=True
)

# Tampilkan hasil
if comparison:
    comparator.print_comparison(comparison)
```

### **Prerequisites**

#### **1. Backend Berjalan**
```bash
# Pastikan backend berjalan
docker-compose up backend

# Atau jika menggunakan development server
cd src/backend
python main.py
```

#### **2. Data Tersedia**
- Data mahasiswa harus tersedia di database
- Status lulus aktual harus diisi untuk evaluasi dengan data aktual
- Klasifikasi FIS harus sudah dilakukan

#### **3. Dependensi Python**
```bash
# Install requests jika belum ada
pip install requests
```

### **Output yang Dihasilkan**

#### **1. Console Output**
Script akan menampilkan hasil perbandingan di console dengan format yang mudah dibaca.

#### **2. JSON File**
Hasil perbandingan akan disimpan dalam file JSON dengan format:
```
fis_evaluation_comparison_YYYYMMDD_HHMMSS.json
```

#### **3. Struktur Output**
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
    }
  },
  "data_comparison": {
    "total_data": {
      "previous": 400,
      "actual": 150
    }
  },
  "summary": {
    "better_metrics": ["accuracy", "precision"],
    "worse_metrics": [],
    "overall_assessment": "Evaluasi dengan data aktual lebih baik"
  }
}
```

## **📊 Metrik yang Dibandingkan**

### **Evaluasi Sebelumnya (Tanpa Data Aktual)**
- **Classification Type**: Multi-class (3 kategori)
- **Confusion Matrix**: 3x3 matrix
- **Metrics**: Accuracy, Precision, Recall, F1-Score per kategori
- **Output**: Macro averages

### **Evaluasi dengan Data Aktual**
- **Classification Type**: Binary (Lulus/Belum Lulus)
- **Confusion Matrix**: 2x2 matrix
- **Metrics**: Overall Accuracy, Precision, Recall, F1-Score
- **Output**: Category analysis, sample data, statistics

## **🔧 Troubleshooting**

### **Error: Backend tidak dapat diakses**
```bash
# Solusi: Pastikan backend berjalan
docker-compose up backend

# Atau cek status container
docker-compose ps
```

### **Error: Module 'requests' tidak tersedia**
```bash
# Solusi: Install requests
pip install requests

# Atau jika menggunakan virtual environment
source venv/bin/activate
pip install requests
```

### **Error: Script tidak ditemukan**
```bash
# Solusi: Pastikan berada di direktori yang benar
cd src/backend/tools
ls -la compare_evaluations.py
```

### **Error: Data tidak cukup untuk evaluasi**
```bash
# Solusi: Pastikan data tersedia
# 1. Cek jumlah data mahasiswa
# 2. Pastikan status lulus aktual diisi
# 3. Jalankan klasifikasi FIS terlebih dahulu
```

### **Error: Timeout saat evaluasi**
```bash
# Solusi: 
# 1. Cek koneksi internet
# 2. Pastikan backend tidak overload
# 3. Coba dengan data yang lebih kecil
```

## **📈 Interpretasi Hasil**

### **Metrik yang Lebih Baik**
- Jika evaluasi dengan data aktual lebih baik: Gunakan untuk production
- Jika evaluasi sebelumnya lebih baik: Perlu analisis lebih lanjut
- Jika sama: Kedua metode dapat digunakan

### **Perbedaan Signifikan**
- Perbedaan > 0.1: Signifikan, perlu perhatian
- Perbedaan 0.05-0.1: Moderat, perlu monitoring
- Perbedaan < 0.05: Kecil, dapat diabaikan

### **Rekomendasi Berdasarkan Hasil**
1. **Evaluasi aktual lebih baik**: Migrasi ke evaluasi dengan data aktual
2. **Evaluasi sebelumnya lebih baik**: Perlu investigasi data aktual
3. **Sama**: Gunakan evaluasi yang lebih sederhana

## **🔗 Integrasi dengan Sistem**

### **Frontend Integration**
Script ini dapat diintegrasikan dengan frontend untuk:
- Menampilkan perbandingan real-time
- Export hasil perbandingan
- Dashboard monitoring

### **Backend Integration**
Script ini dapat diintegrasikan dengan backend untuk:
- Automated testing
- Continuous evaluation
- Performance monitoring

### **CI/CD Integration**
Script ini dapat diintegrasikan dengan CI/CD untuk:
- Automated evaluation pada setiap deployment
- Quality gates
- Performance regression testing

## **📚 Referensi**

- [Dokumentasi Lengkap Perbandingan](../../../docs/evaluation/PERBANDINGAN_EVALUASI_FIS.md)
- [Ringkasan Perbandingan](../../../docs/evaluation/RINGKASAN_PERBANDINGAN.md)
- [Contoh Output](../../../docs/evaluation/CONTOH_OUTPUT_PERBANDINGAN.md)
- [API Documentation](../../../docs/api/README.md)

## **🤝 Kontribusi**

Untuk menambahkan fitur baru atau memperbaiki bug:

1. Fork repository
2. Buat branch baru
3. Implementasikan perubahan
4. Test dengan berbagai skenario
5. Submit pull request

## **📄 License**

Tools ini merupakan bagian dari proyek SPK Monitoring Masa Studi dan mengikuti license yang sama.

---

**💡 Tips**: Gunakan script ini secara berkala untuk memantau performa sistem FIS dan memastikan kualitas evaluasi yang konsisten. 