-- Script untuk update data contoh dengan status lulus aktual
-- Jalankan script ini setelah ALTER TABLE berhasil

-- 1. Update mahasiswa dengan status LULUS
UPDATE mahasiswa 
SET status_lulus_aktual = 'LULUS', 
    tanggal_lulus = '2024-01-15 00:00:00' 
WHERE nim IN (
    '19812141079',
    '19812141080', 
    '19812141081',
    '19812141088',
    '19812141089',
    '19812141090',
    '19812141091',
    '19812141092',
    '19812141093',
    '19812141094'
)
AND nim IN (SELECT nim FROM mahasiswa LIMIT 10);

-- 2. Update mahasiswa dengan status BELUM_LULUS
UPDATE mahasiswa 
SET status_lulus_aktual = 'BELUM_LULUS' 
WHERE nim IN (
    '19812141082',
    '19812141083',
    '19812141084',
    '19812141095',
    '19812141096',
    '19812141097',
    '19812141098',
    '19812141099',
    '19812141100',
    '19812141101'
)
AND nim IN (SELECT nim FROM mahasiswa LIMIT 10);

-- 3. Update mahasiswa dengan status DROPOUT
UPDATE mahasiswa 
SET status_lulus_aktual = 'DROPOUT' 
WHERE nim IN (
    '19812141085',
    '19812141086',
    '19812141087',
    '19812141102',
    '19812141103',
    '19812141104',
    '19812141105',
    '19812141106',
    '19812141107',
    '19812141108'
)
AND nim IN (SELECT nim FROM mahasiswa LIMIT 10);

-- 4. Verifikasi data yang diupdate
SELECT 
    status_lulus_aktual,
    COUNT(*) as jumlah_mahasiswa,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM mahasiswa), 2) as persentase
FROM mahasiswa 
WHERE status_lulus_aktual IS NOT NULL
GROUP BY status_lulus_aktual
ORDER BY status_lulus_aktual;

-- 5. Tampilkan sample data
SELECT 
    nim, 
    nama, 
    ipk,
    sks,
    persen_dek,
    status_lulus_aktual, 
    tanggal_lulus
FROM mahasiswa 
WHERE status_lulus_aktual IS NOT NULL
ORDER BY nim
LIMIT 20;

-- 6. Cek data untuk evaluasi FIS
SELECT 
    m.nim,
    m.nama,
    m.status_lulus_aktual,
    k.kategori as prediksi_fis,
    k.nilai_fuzzy
FROM mahasiswa m
LEFT JOIN klasifikasi_kelulusan k ON m.nim = k.nim
WHERE m.status_lulus_aktual IS NOT NULL
ORDER BY m.nim
LIMIT 15; 