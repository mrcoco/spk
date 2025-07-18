# Perbaikan Dependency CONFIG di Nilai.js

## Masalah
Error `ReferenceError: CONFIG is not defined` terjadi di `nilai.js` karena file ini dimuat sebelum `config.js` selesai diinisialisasi.

## Penyebab
- `nilai.js` langsung menggunakan `CONFIG` di fungsi `initializeNilaiGrid` tanpa mengecek apakah sudah tersedia
- Kendo Grid DataSource diinisialisasi sebelum CONFIG tersedia
- Tidak ada mekanisme wait/retry untuk menunggu CONFIG tersedia

## Solusi

### 1. Menambahkan Fungsi Wait for CONFIG
```javascript
// Fungsi untuk menunggu CONFIG tersedia
function waitForConfig() {
    return new Promise((resolve, reject) => {
        if (typeof CONFIG !== 'undefined') {
            console.log('✅ CONFIG sudah tersedia di nilai.js');
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
                console.log('✅ CONFIG berhasil dimuat di nilai.js');
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

### 2. Mengubah Inisialisasi Nilai Components
```javascript
// Inisialisasi Grid Nilai
$(document).ready(function() {
    // Tunggu sampai CONFIG tersedia
    waitForConfig().then(() => {
        initializeNilaiGrid();
        initializeNilaiForm();
    }).catch(error => {
        console.error('Failed to initialize nilai components:', error);
    });
});
```

### 3. Menambahkan Dependency Check di Setiap Fungsi
Setiap fungsi yang menggunakan `CONFIG` ditambahkan validasi:

```javascript
function initializeNilaiGrid() {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di initializeNilaiGrid');
        showNotification(
            "Error",
            "Konfigurasi aplikasi belum siap",
            "error"
        );
        return;
    }
    // ... kode lainnya
}

function initializeNilaiForm() {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di initializeNilaiForm');
        showNotification(
            "Error",
            "Konfigurasi aplikasi belum siap",
            "error"
        );
        return;
    }
    // ... kode lainnya
}
```

## Fungsi yang Diperbaiki
1. `initializeNilaiGrid()` - Inisialisasi Kendo Grid untuk data nilai
2. `initializeNilaiForm()` - Inisialisasi form untuk input nilai

## Perubahan Struktur
- **Sebelum**: Grid dan form diinisialisasi langsung dalam `$(document).ready`
- **Sesudah**: Grid dan form diinisialisasi setelah CONFIG tersedia
- **Sebelum**: Tidak ada validasi CONFIG
- **Sesudah**: Validasi CONFIG di setiap fungsi yang menggunakannya

## Hasil
- ✅ Error `CONFIG is not defined` teratasi
- ✅ Kendo Grid nilai berhasil dimuat setelah CONFIG tersedia
- ✅ Form nilai berfungsi normal
- ✅ Logging yang informatif untuk debugging
- ✅ Error handling yang proper dengan fallback

## Testing
1. Restart frontend container
2. Buka browser dan akses halaman nilai
3. Periksa console browser untuk memastikan tidak ada error CONFIG
4. Pastikan grid nilai berfungsi normal
5. Test form input nilai

## Referensi
- [Dashboard Config Dependency Fix](DASHBOARD_CONFIG_DEPENDENCY_FIX.md)
- [Mahasiswa Config Dependency Fix](MAHASISWA_CONFIG_DEPENDENCY_FIX.md)
- [Script Loading Fix](SCRIPT_LOADING_FIX.md)
- [Config.js Implementation](CONFIG_IMPLEMENTATION.md) 