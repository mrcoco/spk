# Perbaikan Grid SAW yang Menampilkan N/A

## Masalah
Grid hasil klasifikasi SAW pada halaman SAW menampilkan nilai N/A untuk semua kolom (IPK, SKS, D/E/K, Skor SAW, Klasifikasi).

## Penyebab
1. **Endpoint yang Salah**: Fungsi `loadSAWGridLazy()` masih menggunakan endpoint `/results` yang mengembalikan struktur data berbeda dengan yang diharapkan template grid.
2. **Struktur Data Tidak Sesuai**: Endpoint `/results` mengembalikan field `nilai_akhir` bukan `skor_saw`, dan tidak ada field `ipk`, `sks`, `persen_dek`, `klasifikasi_saw`.

## Solusi
1. **Mengubah Endpoint**: Mengubah endpoint dari `/results` ke `/batch` di fungsi `loadSAWGridLazy()`.
2. **Memastikan Konsistensi**: Semua fungsi yang memuat data SAW sekarang menggunakan endpoint `/batch` yang memberikan data lengkap.

## Perubahan Kode

### Sebelum (Masalah)
```javascript
// Di fungsi loadSAWGridLazy()
$.ajax({
    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW + '/results'), // ❌ Endpoint salah
    type: 'GET',
    // ...
});
```

### Sesudah (Perbaikan)
```javascript
// Di fungsi loadSAWGridLazy()
$.ajax({
    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW + '/batch'), // ✅ Endpoint benar
    type: 'GET',
    // ...
});
```

## Struktur Data yang Benar
Endpoint `/batch` mengembalikan data dengan struktur:
```json
{
  "nim": "19808141031",
  "nama": "Cinta Tiara Ayu Aprillia",
  "ipk": 3.93,
  "sks": 163.0,
  "persen_dek": 0.0,
  "skor_saw": 1.0384615384615383,
  "klasifikasi_saw": "Peluang Lulus Tinggi"
}
```

## Template Grid yang Digunakan
```javascript
columns: [
    { field: "nim", title: "NIM", width: 120 },
    { field: "nama", title: "Nama", width: 200 },
    { 
        field: "ipk", 
        title: "IPK", 
        width: 80, 
        template: function(dataItem) {
            return dataItem.ipk ? dataItem.ipk.toFixed(2) : 'N/A';
        }
    },
    { 
        field: "sks", 
        title: "SKS", 
        width: 80,
        template: function(dataItem) {
            return dataItem.sks ? dataItem.sks : 'N/A';
        }
    },
    { 
        field: "persen_dek", 
        title: "D/E/K (%)", 
        width: 100,
        template: function(dataItem) {
            return dataItem.persen_dek ? dataItem.persen_dek.toFixed(1) : 'N/A';
        }
    },
    { 
        field: "skor_saw", 
        title: "Skor SAW", 
        width: 120,
        template: function(dataItem) {
            return dataItem.skor_saw ? dataItem.skor_saw.toFixed(4) : 'N/A';
        }
    },
    { 
        field: "klasifikasi_saw", 
        title: "Klasifikasi", 
        width: 180,
        template: function(dataItem) {
            const color = getClassificationColor(dataItem.klasifikasi_saw);
            return `<span style="color: ${color}; font-weight: bold;">${dataItem.klasifikasi_saw || 'N/A'}</span>`;
        }
    }
]
```

## Verifikasi
Setelah perbaikan, grid SAW akan menampilkan:
- ✅ IPK dengan format 2 desimal
- ✅ SKS sebagai angka bulat
- ✅ D/E/K dengan format 1 desimal dan simbol %
- ✅ Skor SAW dengan format 4 desimal
- ✅ Klasifikasi dengan warna sesuai kategori

## File yang Diubah
- `src/frontend/js/saw.js` - Fungsi `loadSAWGridLazy()`

## Testing
1. Buka halaman SAW di aplikasi
2. Scroll ke bagian "Hasil Klasifikasi SAW"
3. Grid seharusnya menampilkan data lengkap tanpa N/A
4. Semua kolom terisi dengan nilai yang sesuai 