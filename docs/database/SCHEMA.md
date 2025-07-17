# Database Schema

## 🗄️ Overview

Skema database untuk aplikasi SPK Monitoring Masa Studi menggunakan PostgreSQL. Database ini menyimpan data mahasiswa, nilai, hasil perhitungan SAW, dan klasifikasi fuzzy logic.

## 📊 Database Structure

### Database Information
- **Database Name**: `spk_db`
- **Character Set**: UTF-8
- **Collation**: en_US.UTF-8
- **Version**: PostgreSQL 13+

### Tables Overview
```
spk_db
├── alembic_version          # Migration tracking
├── mahasiswa               # Data mahasiswa
├── nilai                   # Data nilai mahasiswa
├── klasifikasi_kelulusan   # Hasil klasifikasi fuzzy
├── saw_criteria            # Kriteria SAW
├── saw_results             # Hasil perhitungan SAW
└── saw_final_results       # Hasil akhir SAW
```

## 📋 Table Details

### 1. alembic_version
Tabel untuk tracking database migrations.

```sql
CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
```

**Columns:**
- `version_num` (VARCHAR(32)) - Version number dari migration

**Sample Data:**
```sql
INSERT INTO alembic_version VALUES ('8151d38adc71');
```

### 2. mahasiswa
Tabel utama untuk data mahasiswa.

```sql
CREATE TABLE mahasiswa (
    id SERIAL PRIMARY KEY,
    nim VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    jurusan VARCHAR(50) NOT NULL,
    semester INTEGER NOT NULL,
    ipk DECIMAL(3,2) NOT NULL,
    sks INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id` (SERIAL) - Primary key, auto increment
- `nim` (VARCHAR(20)) - Nomor Induk Mahasiswa, unique
- `nama` (VARCHAR(100)) - Nama lengkap mahasiswa
- `jurusan` (VARCHAR(50)) - Program studi/jurusan
- `semester` (INTEGER) - Semester saat ini
- `ipk` (DECIMAL(3,2)) - Indeks Prestasi Kumulatif
- `sks` (INTEGER) - Total SKS yang sudah diambil
- `status` (VARCHAR(20)) - Status mahasiswa (Aktif/Cuti/Lulus)
- `created_at` (TIMESTAMP) - Waktu pembuatan record
- `updated_at` (TIMESTAMP) - Waktu update terakhir

**Indexes:**
```sql
CREATE INDEX idx_mahasiswa_nim ON mahasiswa(nim);
CREATE INDEX idx_mahasiswa_jurusan ON mahasiswa(jurusan);
CREATE INDEX idx_mahasiswa_status ON mahasiswa(status);
```

**Sample Data:**
```sql
INSERT INTO mahasiswa (nim, nama, jurusan, semester, ipk, sks, status) VALUES
('2021001', 'John Doe', 'Informatika', 6, 3.50, 120, 'Aktif'),
('2021002', 'Jane Smith', 'Sistem Informasi', 8, 3.20, 140, 'Aktif');
```

### 3. nilai
Tabel untuk data nilai mahasiswa per mata kuliah.

```sql
CREATE TABLE nilai (
    id SERIAL PRIMARY KEY,
    mahasiswa_id INTEGER NOT NULL,
    mata_kuliah VARCHAR(100) NOT NULL,
    nilai_angka INTEGER NOT NULL,
    nilai_huruf VARCHAR(2) NOT NULL,
    sks INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    tahun_ajaran VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);
```

**Columns:**
- `id` (SERIAL) - Primary key, auto increment
- `mahasiswa_id` (INTEGER) - Foreign key ke tabel mahasiswa
- `mata_kuliah` (VARCHAR(100)) - Nama mata kuliah
- `nilai_angka` (INTEGER) - Nilai dalam bentuk angka (0-100)
- `nilai_huruf` (VARCHAR(2)) - Nilai dalam bentuk huruf (A/B/C/D/E)
- `sks` (INTEGER) - SKS mata kuliah
- `semester` (INTEGER) - Semester mata kuliah
- `tahun_ajaran` (VARCHAR(10)) - Tahun ajaran (2021/2022)
- `created_at` (TIMESTAMP) - Waktu pembuatan record

**Indexes:**
```sql
CREATE INDEX idx_nilai_mahasiswa_id ON nilai(mahasiswa_id);
CREATE INDEX idx_nilai_mata_kuliah ON nilai(mata_kuliah);
CREATE INDEX idx_nilai_semester ON nilai(semester);
CREATE INDEX idx_nilai_tahun_ajaran ON nilai(tahun_ajaran);
```

**Sample Data:**
```sql
INSERT INTO nilai (mahasiswa_id, mata_kuliah, nilai_angka, nilai_huruf, sks, semester, tahun_ajaran) VALUES
(1, 'Pemrograman Web', 85, 'A', 3, 1, '2021/2022'),
(1, 'Basis Data', 78, 'B', 3, 1, '2021/2022');
```

### 4. klasifikasi_kelulusan
Tabel untuk hasil klasifikasi fuzzy logic.

```sql
CREATE TABLE klasifikasi_kelulusan (
    id SERIAL PRIMARY KEY,
    mahasiswa_id INTEGER NOT NULL UNIQUE,
    ipk DECIMAL(3,2) NOT NULL,
    sks INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    klasifikasi VARCHAR(20) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    fuzzy_sets JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);
```

**Columns:**
- `id` (SERIAL) - Primary key, auto increment
- `mahasiswa_id` (INTEGER) - Foreign key ke tabel mahasiswa, unique
- `ipk` (DECIMAL(3,2)) - IPK mahasiswa
- `sks` (INTEGER) - Total SKS
- `semester` (INTEGER) - Semester saat ini
- `klasifikasi` (VARCHAR(20)) - Hasil klasifikasi (Tepat Waktu/Terlambat/Sangat Terlambat)
- `confidence` (DECIMAL(3,2)) - Tingkat kepercayaan hasil klasifikasi
- `fuzzy_sets` (JSONB) - Data fuzzy sets dalam format JSON
- `created_at` (TIMESTAMP) - Waktu pembuatan record

**Indexes:**
```sql
CREATE INDEX idx_klasifikasi_mahasiswa_id ON klasifikasi_kelulusan(mahasiswa_id);
CREATE INDEX idx_klasifikasi_klasifikasi ON klasifikasi_kelulusan(klasifikasi);
CREATE INDEX idx_klasifikasi_confidence ON klasifikasi_kelulusan(confidence);
```

**Sample Data:**
```sql
INSERT INTO klasifikasi_kelulusan (mahasiswa_id, ipk, sks, semester, klasifikasi, confidence, fuzzy_sets) VALUES
(1, 3.50, 120, 6, 'Tepat Waktu', 0.85, '{"ipk": {"rendah": 0, "sedang": 0.5, "tinggi": 0.5}}');
```

### 5. saw_criteria
Tabel untuk kriteria SAW (Simple Additive Weighting).

```sql
CREATE TABLE saw_criteria (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    weight DECIMAL(3,2) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('benefit', 'cost')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id` (SERIAL) - Primary key, auto increment
- `name` (VARCHAR(50)) - Nama kriteria
- `weight` (DECIMAL(3,2)) - Bobot kriteria (0.0 - 1.0)
- `type` (VARCHAR(10)) - Tipe kriteria (benefit/cost)
- `description` (TEXT) - Deskripsi kriteria
- `created_at` (TIMESTAMP) - Waktu pembuatan record

**Constraints:**
```sql
ALTER TABLE saw_criteria ADD CONSTRAINT chk_weight CHECK (weight >= 0 AND weight <= 1);
```

**Sample Data:**
```sql
INSERT INTO saw_criteria (name, weight, type, description) VALUES
('IPK', 0.40, 'benefit', 'Indeks Prestasi Kumulatif'),
('SKS', 0.30, 'benefit', 'Total SKS yang sudah diambil'),
('Semester', 0.30, 'cost', 'Semester saat ini');
```

### 6. saw_results
Tabel untuk hasil perhitungan SAW per mahasiswa.

```sql
CREATE TABLE saw_results (
    id SERIAL PRIMARY KEY,
    mahasiswa_id INTEGER NOT NULL,
    criteria_id INTEGER NOT NULL,
    raw_value DECIMAL(10,4) NOT NULL,
    normalized_value DECIMAL(10,4) NOT NULL,
    weighted_value DECIMAL(10,4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES saw_criteria(id) ON DELETE CASCADE
);
```

**Columns:**
- `id` (SERIAL) - Primary key, auto increment
- `mahasiswa_id` (INTEGER) - Foreign key ke tabel mahasiswa
- `criteria_id` (INTEGER) - Foreign key ke tabel saw_criteria
- `raw_value` (DECIMAL(10,4)) - Nilai asli
- `normalized_value` (DECIMAL(10,4)) - Nilai setelah normalisasi
- `weighted_value` (DECIMAL(10,4)) - Nilai setelah pembobotan
- `created_at` (TIMESTAMP) - Waktu pembuatan record

**Indexes:**
```sql
CREATE INDEX idx_saw_results_mahasiswa_id ON saw_results(mahasiswa_id);
CREATE INDEX idx_saw_results_criteria_id ON saw_results(criteria_id);
```

**Sample Data:**
```sql
INSERT INTO saw_results (mahasiswa_id, criteria_id, raw_value, normalized_value, weighted_value) VALUES
(1, 1, 3.50, 0.875, 0.350),
(1, 2, 120, 0.800, 0.240);
```

### 7. saw_final_results
Tabel untuk hasil akhir perhitungan SAW.

```sql
CREATE TABLE saw_final_results (
    id SERIAL PRIMARY KEY,
    mahasiswa_id INTEGER NOT NULL UNIQUE,
    total_score DECIMAL(10,4) NOT NULL,
    rank INTEGER NOT NULL,
    criteria_used JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);
```

**Columns:**
- `id` (SERIAL) - Primary key, auto increment
- `mahasiswa_id` (INTEGER) - Foreign key ke tabel mahasiswa, unique
- `total_score` (DECIMAL(10,4)) - Total skor SAW
- `rank` (INTEGER) - Peringkat berdasarkan skor
- `criteria_used` (JSONB) - Kriteria yang digunakan dalam format JSON
- `created_at` (TIMESTAMP) - Waktu pembuatan record

**Indexes:**
```sql
CREATE INDEX idx_saw_final_mahasiswa_id ON saw_final_results(mahasiswa_id);
CREATE INDEX idx_saw_final_total_score ON saw_final_results(total_score);
CREATE INDEX idx_saw_final_rank ON saw_final_results(rank);
```

**Sample Data:**
```sql
INSERT INTO saw_final_results (mahasiswa_id, total_score, rank, criteria_used) VALUES
(1, 0.840, 1, '{"criteria": [{"name": "IPK", "weight": 0.4}, {"name": "SKS", "weight": 0.3}]}');
```

## 🔗 Relationships

### Entity Relationship Diagram
```
mahasiswa (1) ←→ (N) nilai
mahasiswa (1) ←→ (1) klasifikasi_kelulusan
mahasiswa (1) ←→ (1) saw_final_results
mahasiswa (1) ←→ (N) saw_results
saw_criteria (1) ←→ (N) saw_results
```

### Foreign Key Constraints
```sql
-- nilai.mahasiswa_id → mahasiswa.id
ALTER TABLE nilai ADD CONSTRAINT fk_nilai_mahasiswa 
FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE;

-- klasifikasi_kelulusan.mahasiswa_id → mahasiswa.id
ALTER TABLE klasifikasi_kelulusan ADD CONSTRAINT fk_klasifikasi_mahasiswa 
FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE;

-- saw_results.mahasiswa_id → mahasiswa.id
ALTER TABLE saw_results ADD CONSTRAINT fk_saw_results_mahasiswa 
FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE;

-- saw_results.criteria_id → saw_criteria.id
ALTER TABLE saw_results ADD CONSTRAINT fk_saw_results_criteria 
FOREIGN KEY (criteria_id) REFERENCES saw_criteria(id) ON DELETE CASCADE;

-- saw_final_results.mahasiswa_id → mahasiswa.id
ALTER TABLE saw_final_results ADD CONSTRAINT fk_saw_final_mahasiswa 
FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE;
```

## 📊 Data Statistics

### Table Sizes
```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;
```

### Record Counts
```sql
-- Count records per table
SELECT 'mahasiswa' as table_name, COUNT(*) as record_count FROM mahasiswa
UNION ALL
SELECT 'nilai', COUNT(*) FROM nilai
UNION ALL
SELECT 'klasifikasi_kelulusan', COUNT(*) FROM klasifikasi_kelulusan
UNION ALL
SELECT 'saw_criteria', COUNT(*) FROM saw_criteria
UNION ALL
SELECT 'saw_results', COUNT(*) FROM saw_results
UNION ALL
SELECT 'saw_final_results', COUNT(*) FROM saw_final_results;
```

### Data Distribution
```sql
-- IPK distribution
SELECT 
    CASE 
        WHEN ipk >= 3.5 THEN 'Sangat Baik (3.5-4.0)'
        WHEN ipk >= 3.0 THEN 'Baik (3.0-3.49)'
        WHEN ipk >= 2.5 THEN 'Cukup (2.5-2.99)'
        ELSE 'Kurang (< 2.5)'
    END as ipk_range,
    COUNT(*) as count
FROM mahasiswa 
GROUP BY ipk_range 
ORDER BY ipk_range;

-- Semester distribution
SELECT semester, COUNT(*) as count
FROM mahasiswa 
GROUP BY semester 
ORDER BY semester;

-- Jurusan distribution
SELECT jurusan, COUNT(*) as count
FROM mahasiswa 
GROUP BY jurusan 
ORDER BY count DESC;
```

## 🔍 Common Queries

### Get Student with Complete Information
```sql
SELECT 
    m.id,
    m.nim,
    m.nama,
    m.jurusan,
    m.semester,
    m.ipk,
    m.sks,
    m.status,
    k.klasifikasi,
    k.confidence,
    sfr.total_score,
    sfr.rank
FROM mahasiswa m
LEFT JOIN klasifikasi_kelulusan k ON m.id = k.mahasiswa_id
LEFT JOIN saw_final_results sfr ON m.id = sfr.mahasiswa_id
WHERE m.status = 'Aktif'
ORDER BY sfr.rank NULLS LAST;
```

### Get Top Students by SAW Score
```sql
SELECT 
    m.nim,
    m.nama,
    m.jurusan,
    m.ipk,
    m.sks,
    sfr.total_score,
    sfr.rank
FROM mahasiswa m
JOIN saw_final_results sfr ON m.id = sfr.mahasiswa_id
ORDER BY sfr.rank
LIMIT 10;
```

### Get Classification Statistics
```sql
SELECT 
    k.klasifikasi,
    COUNT(*) as count,
    ROUND(AVG(k.confidence), 2) as avg_confidence,
    ROUND(AVG(m.ipk), 2) as avg_ipk,
    ROUND(AVG(m.sks), 2) as avg_sks
FROM klasifikasi_kelulusan k
JOIN mahasiswa m ON k.mahasiswa_id = m.id
GROUP BY k.klasifikasi
ORDER BY count DESC;
```

### Get Student Grades
```sql
SELECT 
    m.nim,
    m.nama,
    n.mata_kuliah,
    n.nilai_angka,
    n.nilai_huruf,
    n.sks,
    n.semester,
    n.tahun_ajaran
FROM mahasiswa m
JOIN nilai n ON m.id = n.mahasiswa_id
WHERE m.nim = '2021001'
ORDER BY n.semester, n.mata_kuliah;
```

## 🔧 Maintenance

### Index Maintenance
```sql
-- Analyze tables for query optimization
ANALYZE mahasiswa;
ANALYZE nilai;
ANALYZE klasifikasi_kelulusan;
ANALYZE saw_results;
ANALYZE saw_final_results;

-- Reindex if needed
REINDEX TABLE mahasiswa;
REINDEX TABLE nilai;
```

### Data Integrity Checks
```sql
-- Check for orphaned records
SELECT COUNT(*) as orphaned_nilai
FROM nilai n
LEFT JOIN mahasiswa m ON n.mahasiswa_id = m.id
WHERE m.id IS NULL;

-- Check for duplicate NIM
SELECT nim, COUNT(*) as count
FROM mahasiswa
GROUP BY nim
HAVING COUNT(*) > 1;

-- Check for invalid IPK values
SELECT id, nim, ipk
FROM mahasiswa
WHERE ipk < 0 OR ipk > 4;
```

### Performance Optimization
```sql
-- Create composite indexes for common queries
CREATE INDEX idx_mahasiswa_jurusan_status ON mahasiswa(jurusan, status);
CREATE INDEX idx_nilai_mahasiswa_semester ON nilai(mahasiswa_id, semester);
CREATE INDEX idx_saw_results_mahasiswa_criteria ON saw_results(mahasiswa_id, criteria_id);

-- Partition large tables if needed
-- (For tables with millions of records)
```

## 📈 Backup & Recovery

### Backup Specific Tables
```sql
-- Backup mahasiswa table
pg_dump -h localhost -U spk_user -d spk_db -t mahasiswa > backup_mahasiswa.sql

-- Backup all tables
pg_dump -h localhost -U spk_user -d spk_db > backup_full.sql

-- Backup with compression
pg_dump -h localhost -U spk_user -d spk_db | gzip > backup_full.sql.gz
```

### Restore Tables
```sql
-- Restore specific table
psql -h localhost -U spk_user -d spk_db < backup_mahasiswa.sql

-- Restore full database
psql -h localhost -U spk_user -d spk_db < backup_full.sql
```

---

**Database Schema** - SPK Monitoring Masa Studi 🗄️ 