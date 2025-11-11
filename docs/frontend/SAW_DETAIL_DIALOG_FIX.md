# Perbaikan Dialog Detail SAW yang Menampilkan N/A

## Masalah
Dialog detail pada grid hasil klasifikasi SAW menampilkan nilai N/A untuk berbagai field seperti:
- Program Studi
- Bobot kriteria (IPK, SKS, D/E/K)
- Nilai normalisasi
- Skor tertimbang
- Ranking

## Penyebab
1. **Endpoint yang Salah**: Fungsi `showSAWDetail()` menggunakan endpoint `/calculate/{nim}` yang mengembalikan struktur data berbeda dengan yang diharapkan template dialog.
2. **Struktur Data Tidak Sesuai**: Endpoint `/calculate/{nim}` mengembalikan data perhitungan SAW, bukan data detail lengkap mahasiswa.

## Solusi
1. **Mengubah Endpoint**: Mengubah endpoint dari `/calculate/{nim}` ke `/{nim}` di fungsi `showSAWDetail()`.
2. **Memastikan Konsistensi**: Endpoint `/{nim}` memberikan data lengkap yang sesuai dengan template dialog.

## Perubahan Kode

### Sebelum (Masalah)
```javascript
// Di fungsi showSAWDetail()
$.ajax({
    url: `${CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW)}/calculate/${dataItem.nim}`,
    type: "GET",
    success: function(response) {
        // Gabungkan data dari grid dengan data detail
        const combinedData = {
            ...dataItem,
            ...response,
            skor_saw: dataItem.skor_saw,
            klasifikasi_saw: dataItem.klasifikasi_saw
        };
        
        displaySAWDetailDialog(combinedData);
    },
    // ...
});
```

### Sesudah (Perbaikan)
```javascript
// Di fungsi showSAWDetail()
$.ajax({
    url: `${CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW)}/${dataItem.nim}`,
    type: "GET",
    success: function(response) {
        // Gabungkan data dari grid dengan data detail
        const combinedData = {
            ...dataItem,
            ...response
        };
        
        displaySAWDetailDialog(combinedData);
    },
    // ...
});
```

## Struktur Data yang Benar
Endpoint `/{nim}` mengembalikan data dengan struktur:
```json
{
  "nim": "19808141031",
  "nama": "Cinta Tiara Ayu Aprillia",
  "program_studi": "MANAJEMEN - S1",
  "ipk": 3.93,
  "sks": 163,
  "persen_dek": 0.0,
  "skor_saw": 0.9468974358974359,
  "klasifikasi_saw": "Peluang Lulus Tinggi",
  "ranking": 1,
  "bobot_ipk": 0.35,
  "bobot_sks": 0.325,
  "bobot_persen_dek": 0.325,
  "normalisasi_ipk": 1.0,
  "normalisasi_sks": 0.8358974358974359,
  "normalisasi_persen_dek": 1.0,
  "skor_ipk": 0.35,
  "skor_sks": 0.2711711038961039,
  "skor_persen_dek": 0.325,
  "updated_at": "2025-07-15T14:02:47.267180"
}
```

## Template Dialog yang Digunakan
Dialog detail menampilkan informasi dalam beberapa section:

### 1. Informasi Mahasiswa
- NIM
- Nama
- Program Studi

### 2. Hasil Klasifikasi SAW
- Klasifikasi (dengan warna sesuai kategori)
- Skor SAW (4 desimal)
- Ranking

### 3. Detail Nilai Kriteria
Untuk setiap kriteria (IPK, SKS, D/E/K):
- Nilai asli
- Nilai normalisasi (4 desimal)
- Skor tertimbang (4 desimal)
- Bobot kriteria

### 4. Informasi Waktu
- Terakhir update

## Verifikasi
Setelah perbaikan, dialog detail SAW akan menampilkan:
- ✅ Program Studi dengan nama lengkap
- ✅ Bobot kriteria dengan format desimal
- ✅ Nilai normalisasi dengan 4 desimal
- ✅ Skor tertimbang dengan 4 desimal
- ✅ Ranking yang akurat
- ✅ Informasi waktu update

## File yang Diubah
- `src/frontend/js/saw.js` - Fungsi `showSAWDetail()`

## Testing
1. Buka halaman SAW di aplikasi
2. Scroll ke bagian "Hasil Klasifikasi SAW"
3. Klik tombol "Detail" pada salah satu baris data
4. Dialog detail seharusnya menampilkan data lengkap tanpa N/A
5. Semua field terisi dengan nilai yang sesuai

## Endpoint yang Digunakan
- **Grid Data**: `/api/saw/batch` - Mengembalikan data untuk grid
- **Detail Data**: `/api/saw/{nim}` - Mengembalikan data detail lengkap
- **Calculate Data**: `/api/saw/calculate/{nim}` - Mengembalikan data perhitungan SAW

## Perbedaan Endpoint
- `/calculate/{nim}`: Fokus pada perhitungan SAW (criteria_values, normalized_values, weighted_values)
- `/{nim}`: Fokus pada detail lengkap mahasiswa dengan semua informasi yang diperlukan untuk dialog 