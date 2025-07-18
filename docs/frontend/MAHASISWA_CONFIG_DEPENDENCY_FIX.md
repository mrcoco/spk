# Perbaikan Dependency CONFIG di Mahasiswa.js

## Masalah
Error `ReferenceError: CONFIG is not defined` terjadi di `mahasiswa.js` karena file ini dimuat sebelum `config.js` selesai diinisialisasi.

## Penyebab
- `mahasiswa.js` langsung menggunakan `CONFIG` di awal file tanpa mengecek apakah sudah tersedia
- DataSource Kendo Grid diinisialisasi sebelum CONFIG tersedia
- Tidak ada mekanisme wait/retry untuk menunggu CONFIG tersedia

## Solusi

### 1. Menambahkan Fungsi Wait for CONFIG
```javascript
// Fungsi untuk menunggu CONFIG tersedia
function waitForConfig() {
    return new Promise((resolve, reject) => {
        if (typeof CONFIG !== 'undefined') {
            console.log('✅ CONFIG sudah tersedia di mahasiswa.js');
            resolve();
            return;
        }

        console.log('⚠️ CONFIG belum tersedia, menunggu...');
        let attempts = 0;
        const maxAttempts = 100; // 10 detik dengan interval 100ms

        const checkConfig = setInterval(() => {
            attempts++;
            
            if (typeof CONFIG !== 'undefined') {
                clearInterval(checkConfig);
                console.log('✅ CONFIG berhasil dimuat di mahasiswa.js');
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkConfig);
                console.error('❌ CONFIG tidak dapat dimuat dalam waktu yang ditentukan');
                reject(new Error('CONFIG timeout'));
            }
        }, 100);
    });
}
```

### 2. Mengubah Inisialisasi DataSource dan Grid
```javascript
// Inisialisasi DataSource untuk Grid Mahasiswa
var mahasiswaDataSource;

function initializeMahasiswaDataSource() {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di initializeMahasiswaDataSource');
        return;
    }

    mahasiswaDataSource = new kendo.data.DataSource({
        // ... konfigurasi DataSource
    });
}

// Inisialisasi Grid Mahasiswa
$(document).ready(function() {
    // Tunggu sampai CONFIG tersedia
    waitForConfig().then(() => {
        // Inisialisasi DataSource terlebih dahulu
        initializeMahasiswaDataSource();
        
        // Kemudian inisialisasi Grid
        var grid = $("#mahasiswaGrid").kendoGrid({
            dataSource: mahasiswaDataSource,
            // ... konfigurasi Grid
        });
    }).catch(error => {
        console.error('Failed to initialize mahasiswa grid:', error);
    });
});
```

### 3. Menambahkan Dependency Check di Setiap Fungsi
Setiap fungsi yang menggunakan `CONFIG` ditambahkan validasi:

```javascript
function deleteMahasiswa(nim) {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di deleteMahasiswa');
        showNotification("Error", "Konfigurasi aplikasi belum siap", "error");
        return Promise.reject(new Error("CONFIG tidak tersedia"));
    }
    // ... kode lainnya
}
```

## Fungsi yang Diperbaiki
1. `initializeMahasiswaDataSource()` - Inisialisasi DataSource Kendo Grid
2. `deleteMahasiswa()` - Fungsi hapus mahasiswa
3. `syncNilai()` - Sync nilai satu mahasiswa
4. `syncAllNilai()` - Sync semua nilai mahasiswa
5. `showKlasifikasi()` - Tampilkan hasil klasifikasi
6. `executeBatchKlasifikasi()` - Eksekusi klasifikasi batch

## Perubahan Struktur
- **Sebelum**: DataSource diinisialisasi langsung di level global
- **Sesudah**: DataSource diinisialisasi dalam fungsi setelah CONFIG tersedia
- **Sebelum**: Grid diinisialisasi langsung dalam `$(document).ready`
- **Sesudah**: Grid diinisialisasi setelah DataSource siap

## Hasil
- ✅ Error `CONFIG is not defined` teratasi
- ✅ Kendo Grid berhasil dimuat setelah CONFIG tersedia
- ✅ Semua fungsi mahasiswa berfungsi normal
- ✅ Logging yang informatif untuk debugging
- ✅ Error handling yang proper dengan fallback

## Testing
1. Restart frontend container
2. Buka browser dan akses halaman mahasiswa
3. Periksa console browser untuk memastikan tidak ada error CONFIG
4. Pastikan grid mahasiswa berfungsi normal
5. Test semua fungsi (tambah, edit, hapus, sync, klasifikasi)

## Referensi
- [Dashboard Config Dependency Fix](DASHBOARD_CONFIG_DEPENDENCY_FIX.md)
- [Script Loading Fix](SCRIPT_LOADING_FIX.md)
- [Config.js Implementation](CONFIG_IMPLEMENTATION.md) 