# Database Seeder Documentation

## 📋 Overview

Seeder data untuk aplikasi SPK Monitoring Masa Studi yang berisi **data real** mahasiswa, nilai, dan kriteria SAW. Seeder ini terintegrasi dengan migration database dan dapat dijalankan secara otomatis saat migrasi atau secara manual.

## 🗂️ File Structure

```
src/backend/
├── seeders.py              # File utama seeder dengan data real
├── run_seeder.py           # Script untuk menjalankan seeder
├── README_SEEDER.md        # Dokumentasi ini
└── alembic/versions/
    └── d6825691d7a1_initial_migration_complete_database_.py  # Migration dengan seeder data real
```

## 🌱 Data Real yang Di-seed

### 1. Data Mahasiswa (15 records) - Data Real
**NIM**: 2021001 - 2021015

| NIM | Nama | Program Studi | IPK | SKS | Persen DEK |
|-----|------|---------------|-----|-----|------------|
| 2021001 | Ahmad Rizki | Teknik Informatika | 3.85 | 120 | 5.2% |
| 2021002 | Siti Nurhaliza | Sistem Informasi | 3.92 | 132 | 2.1% |
| 2021003 | Budi Santoso | Teknik Informatika | 3.45 | 108 | 8.5% |
| 2021004 | Dewi Sartika | Sistem Informasi | 3.78 | 126 | 4.3% |
| 2021005 | Muhammad Fajar | Teknik Informatika | 3.12 | 96 | 12.8% |
| 2021006 | Nina Safitri | Sistem Informasi | 3.65 | 114 | 6.7% |
| 2021007 | Rendi Pratama | Teknik Informatika | 2.98 | 90 | 15.2% |
| 2021008 | Lina Marlina | Sistem Informasi | 3.88 | 138 | 1.8% |
| 2021009 | Doni Kusuma | Teknik Informatika | 3.25 | 102 | 10.5% |
| 2021010 | Rina Wati | Sistem Informasi | 3.55 | 120 | 7.3% |
| 2021011 | Eko Prasetyo | Teknik Informatika | 3.72 | 126 | 3.9% |
| 2021012 | Yuni Safitri | Sistem Informasi | 3.18 | 96 | 11.4% |
| 2021013 | Agus Setiawan | Teknik Informatika | 3.95 | 144 | 0.8% |
| 2021014 | Maya Indah | Sistem Informasi | 3.33 | 108 | 9.6% |
| 2021015 | Joko Widodo | Teknik Informatika | 3.68 | 120 | 5.1% |

### 2. Data Nilai (152 records) - Data Real
**Mata Kuliah**: 15 mata kuliah umum informatika yang real
**Nilai**: A, A-, B+, B, B-, C+, C, D, E, K
**Semester**: 1-8
**Tahun**: 2021-2024
**Distribusi**: Berdasarkan IPK mahasiswa dengan logika real

#### Mata Kuliah yang Di-generate:
1. IF101 - Pemrograman Dasar
2. IF102 - Matematika Diskrit
3. IF103 - Algoritma dan Struktur Data
4. IF104 - Basis Data
5. IF105 - Pemrograman Web
6. IF106 - Jaringan Komputer
7. IF107 - Sistem Operasi
8. IF108 - Pemrograman Berorientasi Objek
9. IF109 - Analisis dan Desain Sistem
10. IF110 - Statistika
11. IF111 - Kecerdasan Buatan
12. IF112 - Grafika Komputer
13. IF113 - Keamanan Sistem
14. IF114 - Mobile Programming
15. IF115 - Cloud Computing

### 3. Data Kriteria SAW (3 records) - Data Real
- **IPK**: Weight 0.4 (Benefit)
- **SKS**: Weight 0.3 (Benefit)
- **Persentase D, E, K**: Weight 0.3 (Cost)

## 🚀 Cara Menjalankan

### 1. Otomatis dengan Migration
Seeder akan otomatis dijalankan saat menjalankan migration:

```bash
# Reset database (opsional)
docker exec -it spk-backend-1 python -c "from database import engine; engine.execute('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')"

# Jalankan migration dengan seeder data real
docker exec -it spk-backend-1 alembic upgrade head
```

### 2. Manual dengan Script
Jika ingin menjalankan seeder secara terpisah:

```bash
# Di dalam container backend
docker exec -it spk-backend-1 python run_seeder.py

# Atau dari host
cd src/backend
docker exec -it spk-backend-1 python /app/run_seeder.py
```

### 3. Manual dengan Python
```bash
docker exec -it spk-backend-1 python -c "
from seeders import run_all_seeders
run_all_seeders()
"
```

## 📊 Sample Data Real

### Mahasiswa
```python
{
    "nim": "2021001",
    "nama": "Ahmad Rizki",
    "program_studi": "Teknik Informatika",
    "ipk": 3.85,
    "sks": 120,
    "persen_dek": 5.2
}
```

### Nilai
```python
{
    "nim": "2021001",
    "tahun": 2024,
    "semester": 7,
    "kode_matakuliah": "IF106",
    "nama_matakuliah": "Jaringan Komputer",
    "nilai": "A-"
}
```

### Kriteria SAW
```python
{
    "name": "IPK",
    "weight": 0.4,
    "is_cost": False
}
```

## 🎯 Logika Seeder Data Real

### Distribusi Nilai Berdasarkan IPK Real
1. **IPK Sangat Tinggi** (3.90+): 
   - 2021002 (3.92), 2021013 (3.95)
   - Lebih banyak nilai A (50%) dan A- (30%)

2. **IPK Tinggi** (3.80-3.89):
   - 2021001 (3.85), 2021008 (3.88)
   - Lebih banyak nilai A (40%) dan A- (40%)

3. **IPK Menengah-Tinggi** (3.70-3.79):
   - 2021004 (3.78), 2021011 (3.72), 2021015 (3.68)
   - Lebih banyak nilai A- (30-40%) dan B+ (20-30%)

4. **IPK Menengah** (3.30-3.69):
   - 2021003 (3.45), 2021006 (3.65), 2021010 (3.55)
   - Lebih banyak nilai B+ (30-40%) dan B (20-30%)

5. **IPK Menengah-Rendah** (3.10-3.29):
   - 2021005 (3.12), 2021009 (3.25), 2021012 (3.18), 2021014 (3.33)
   - Lebih banyak nilai B (40%) dan B- (20%)

6. **IPK Rendah** (<3.10):
   - 2021007 (2.98)
   - Lebih banyak nilai B (30%), B- (30%), dan C+ (20%)

### Mata Kuliah yang Di-generate
- Setiap mahasiswa mengambil 8-12 mata kuliah
- Mata kuliah dipilih secara random dari 15 mata kuliah yang tersedia
- Semester dan tahun di-generate secara realistis (2021-2024)

## 🔧 Customization

### Menambah Data Mahasiswa Real
Edit fungsi `seed_mahasiswa_data()` di `seeders.py`:

```python
mahasiswa_data = [
    {
        "nim": "2021016",
        "nama": "Nama Mahasiswa Baru",
        "program_studi": "Teknik Informatika",
        "ipk": 3.75,
        "sks": 130,
        "persen_dek": 3.5
    },
    # ... tambah data lainnya
]
```

### Menambah Mata Kuliah Real
Edit list `mata_kuliah` di fungsi `seed_nilai_data()`:

```python
mata_kuliah = [
    {"kode": "IF116", "nama": "Mata Kuliah Baru"},
    # ... mata kuliah lainnya
]
```

### Mengubah Kriteria SAW
Edit list `criteria_data` di fungsi `seed_saw_criteria()`:

```python
criteria_data = [
    {"name": "IPK", "weight": 0.5, "is_cost": False},
    {"name": "SKS", "weight": 0.3, "is_cost": False},
    {"name": "Persentase D, E, K", "weight": 0.2, "is_cost": True}
]
```

## 📈 Verifikasi Data Real

### Cek Jumlah Data
```bash
docker exec -it spk-backend-1 python -c "
from database import engine
result = engine.execute('SELECT COUNT(*) FROM mahasiswa')
print('Total Mahasiswa:', result.fetchone()[0])
result = engine.execute('SELECT COUNT(*) FROM nilai')
print('Total Nilai:', result.fetchone()[0])
result = engine.execute('SELECT COUNT(*) FROM saw_criteria')
print('Total Kriteria SAW:', result.fetchone()[0])
"
```

### Cek Sample Data Real
```bash
# Sample mahasiswa
docker exec -it spk-backend-1 python -c "
from database import engine
result = engine.execute('SELECT nim, nama, ipk FROM mahasiswa LIMIT 5')
for row in result:
    print(f'NIM: {row[0]}, Nama: {row[1]}, IPK: {row[2]}')
"

# Sample nilai
docker exec -it spk-backend-1 python -c "
from database import engine
result = engine.execute('SELECT nim, kode_matakuliah, nilai FROM nilai LIMIT 10')
for row in result:
    print(f'NIM: {row[0]}, MK: {row[1]}, Nilai: {row[2]}')
"
```

### Analisis Distribusi Nilai
```bash
# Analisis distribusi nilai berdasarkan IPK
docker exec -it spk-backend-1 python -c "
from database import engine
result = engine.execute('''
    SELECT m.nim, m.nama, m.ipk, 
           COUNT(n.nilai) as total_nilai,
           COUNT(CASE WHEN n.nilai IN ('A', 'A-') THEN 1 END) as nilai_tinggi,
           COUNT(CASE WHEN n.nilai IN ('B+', 'B') THEN 1 END) as nilai_menengah,
           COUNT(CASE WHEN n.nilai IN ('B-', 'C+', 'C') THEN 1 END) as nilai_rendah
    FROM mahasiswa m
    LEFT JOIN nilai n ON m.nim = n.nim
    GROUP BY m.nim, m.nama, m.ipk
    ORDER BY m.ipk DESC
''')
print('Analisis Distribusi Nilai berdasarkan IPK:')
for row in result:
    print(f'NIM: {row[0]}, Nama: {row[1]}, IPK: {row[2]}, Total: {row[3]}, Tinggi: {row[4]}, Menengah: {row[5]}, Rendah: {row[6]}')
"
```

## ⚠️ Important Notes

1. **Data Real**: Seeder menggunakan data mahasiswa dan nilai yang realistis
2. **Migration Integration**: Seeder terintegrasi dalam migration `d6825691d7a1`
3. **Data Consistency**: Data di-generate dengan logika yang konsisten berdasarkan IPK
4. **Foreign Keys**: Semua foreign key constraints terpenuhi
5. **Timestamps**: `created_at` dan `updated_at` otomatis di-set
6. **Realistic Distribution**: Distribusi nilai berdasarkan IPK mahasiswa yang realistis

## 🐛 Troubleshooting

### Error: "Table already exists"
```bash
# Reset database terlebih dahulu
docker exec -it spk-backend-1 python -c "from database import engine; engine.execute('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')"
```

### Error: "Foreign key constraint"
```bash
# Pastikan tabel mahasiswa sudah ada sebelum insert nilai
# Seeder sudah mengatur urutan yang benar
```

### Error: "Connection failed"
```bash
# Pastikan container database berjalan
docker ps | grep postgres
```

## 📝 Changelog

- **2024-07-17**: Initial seeder dengan data sample
- **2024-07-17**: Integrasi seeder ke dalam migration database
- **2024-07-17**: Penambahan script `run_seeder.py` untuk kemudahan penggunaan
- **2024-07-17**: Update seeder dengan data real mahasiswa dan nilai
- **2024-07-17**: Implementasi logika distribusi nilai berdasarkan IPK real
- **2024-07-17**: Update dokumentasi untuk mencerminkan data real 