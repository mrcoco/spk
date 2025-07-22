-- Script ALTER TABLE untuk menambahkan field status_lulus_aktual dan tanggal_lulus
-- ke tabel mahasiswa

-- 1. Menambahkan kolom status_lulus_aktual
ALTER TABLE mahasiswa 
ADD COLUMN status_lulus_aktual VARCHAR(20) NULL;

-- 2. Menambahkan kolom tanggal_lulus
ALTER TABLE mahasiswa 
ADD COLUMN tanggal_lulus TIMESTAMP NULL;

-- 3. Menambahkan index untuk optimasi performa
CREATE INDEX idx_mahasiswa_status_lulus ON mahasiswa(status_lulus_aktual);

-- 4. Menambahkan comment untuk dokumentasi
COMMENT ON COLUMN mahasiswa.status_lulus_aktual IS 'Status lulus yang sebenarnya: LULUS, BELUM_LULUS, DROPOUT';
COMMENT ON COLUMN mahasiswa.tanggal_lulus IS 'Tanggal lulus jika status_lulus_aktual = LULUS';

-- 5. Verifikasi perubahan
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'mahasiswa' 
AND column_name IN ('status_lulus_aktual', 'tanggal_lulus')
ORDER BY column_name;

-- 6. Contoh update data untuk testing
-- Uncomment baris di bawah jika ingin mengisi data contoh

/*
-- Update beberapa mahasiswa dengan status lulus
UPDATE mahasiswa 
SET status_lulus_aktual = 'LULUS', 
    tanggal_lulus = '2024-01-15 00:00:00' 
WHERE nim IN ('19812141079', '19812141080', '19812141081')
LIMIT 3;

-- Update beberapa mahasiswa dengan status belum lulus
UPDATE mahasiswa 
SET status_lulus_aktual = 'BELUM_LULUS' 
WHERE nim IN ('19812141082', '19812141083', '19812141084')
LIMIT 3;

-- Update beberapa mahasiswa dengan status dropout
UPDATE mahasiswa 
SET status_lulus_aktual = 'DROPOUT' 
WHERE nim IN ('19812141085', '19812141086', '19812141087')
LIMIT 3;

-- Verifikasi data yang diupdate
SELECT 
    nim, 
    nama, 
    status_lulus_aktual, 
    tanggal_lulus
FROM mahasiswa 
WHERE status_lulus_aktual IS NOT NULL
ORDER BY nim;
*/ 