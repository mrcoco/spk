-- Script untuk mengupdate status_lulus_aktual menjadi 3 kategori
-- Kategori: LULUS_TINGGI, LULUS_SEDANG, LULUS_KECIL
-- Berdasarkan kriteria IPK, SKS, dan Persen D/E/K

-- ============================================
-- 1. LULUS_TINGGI
-- Kriteria: IPK >= 3.5, SKS >= 130, Persen D/E/K <= 10
-- ============================================
UPDATE mahasiswa
SET status_lulus_aktual = 'LULUS_TINGGI'
WHERE ipk >= 3.5 
  AND sks >= 130 
  AND persen_dek <= 10
  AND (status_lulus_aktual IS NULL OR status_lulus_aktual != 'LULUS_TINGGI');

-- ============================================
-- 2. LULUS_SEDANG
-- Kriteria: IPK >= 3.0, SKS >= 110, Persen D/E/K <= 20
-- (yang belum masuk kategori LULUS_TINGGI)
-- ============================================
UPDATE mahasiswa
SET status_lulus_aktual = 'LULUS_SEDANG'
WHERE ipk >= 3.0 
  AND sks >= 110 
  AND persen_dek <= 20
  AND status_lulus_aktual IS NULL;

-- ============================================
-- 3. LULUS_KECIL
-- Kriteria: Sisanya (IPK < 3.0 OR SKS < 110 OR Persen D/E/K > 20)
-- ============================================
UPDATE mahasiswa
SET status_lulus_aktual = 'LULUS_KECIL'
WHERE status_lulus_aktual IS NULL;

-- ============================================
-- Verifikasi hasil update
-- ============================================
SELECT 
    status_lulus_aktual,
    COUNT(*) as jumlah,
    ROUND(AVG(ipk), 2) as avg_ipk,
    ROUND(AVG(sks), 0) as avg_sks,
    ROUND(AVG(persen_dek), 2) as avg_persen_dek,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM mahasiswa WHERE status_lulus_aktual IS NOT NULL), 2) as persentase
FROM mahasiswa
WHERE status_lulus_aktual IS NOT NULL
GROUP BY status_lulus_aktual
ORDER BY 
    CASE status_lulus_aktual
        WHEN 'LULUS_TINGGI' THEN 1
        WHEN 'LULUS_SEDANG' THEN 2
        WHEN 'LULUS_KECIL' THEN 3
    END;

-- ============================================
-- Statistik detail per kategori
-- ============================================
\echo '\n=== Statistik Detail per Kategori ==='

-- LULUS_TINGGI
\echo '\n--- LULUS_TINGGI ---'
SELECT 
    'LULUS_TINGGI' as kategori,
    COUNT(*) as total,
    MIN(ipk) as min_ipk,
    MAX(ipk) as max_ipk,
    AVG(ipk) as avg_ipk,
    MIN(sks) as min_sks,
    MAX(sks) as max_sks,
    AVG(sks) as avg_sks,
    MIN(persen_dek) as min_dek,
    MAX(persen_dek) as max_dek,
    AVG(persen_dek) as avg_dek
FROM mahasiswa
WHERE status_lulus_aktual = 'LULUS_TINGGI';

-- LULUS_SEDANG
\echo '\n--- LULUS_SEDANG ---'
SELECT 
    'LULUS_SEDANG' as kategori,
    COUNT(*) as total,
    MIN(ipk) as min_ipk,
    MAX(ipk) as max_ipk,
    AVG(ipk) as avg_ipk,
    MIN(sks) as min_sks,
    MAX(sks) as max_sks,
    AVG(sks) as avg_sks,
    MIN(persen_dek) as min_dek,
    MAX(persen_dek) as max_dek,
    AVG(persen_dek) as avg_dek
FROM mahasiswa
WHERE status_lulus_aktual = 'LULUS_SEDANG';

-- LULUS_KECIL
\echo '\n--- LULUS_KECIL ---'
SELECT 
    'LULUS_KECIL' as kategori,
    COUNT(*) as total,
    MIN(ipk) as min_ipk,
    MAX(ipk) as max_ipk,
    AVG(ipk) as avg_ipk,
    MIN(sks) as min_sks,
    MAX(sks) as max_sks,
    AVG(sks) as avg_sks,
    MIN(persen_dek) as min_dek,
    MAX(persen_dek) as max_dek,
    AVG(persen_dek) as avg_dek
FROM mahasiswa
WHERE status_lulus_aktual = 'LULUS_KECIL';

-- ============================================
-- Sample data per kategori
-- ============================================
\echo '\n=== Sample Data per Kategori (5 data per kategori) ==='

-- LULUS_TINGGI samples
\echo '\n--- Sample LULUS_TINGGI ---'
SELECT 
    nim,
    nama,
    ipk,
    sks,
    persen_dek,
    status_lulus_aktual
FROM mahasiswa
WHERE status_lulus_aktual = 'LULUS_TINGGI'
ORDER BY ipk DESC, sks DESC
LIMIT 5;

-- LULUS_SEDANG samples
\echo '\n--- Sample LULUS_SEDANG ---'
SELECT 
    nim,
    nama,
    ipk,
    sks,
    persen_dek,
    status_lulus_aktual
FROM mahasiswa
WHERE status_lulus_aktual = 'LULUS_SEDANG'
ORDER BY ipk DESC, sks DESC
LIMIT 5;

-- LULUS_KECIL samples
\echo '\n--- Sample LULUS_KECIL ---'
SELECT 
    nim,
    nama,
    ipk,
    sks,
    persen_dek,
    status_lulus_aktual
FROM mahasiswa
WHERE status_lulus_aktual = 'LULUS_KECIL'
ORDER BY ipk DESC, sks DESC
LIMIT 5;

