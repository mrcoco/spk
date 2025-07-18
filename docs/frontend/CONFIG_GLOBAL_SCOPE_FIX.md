# Perbaikan Ekspos CONFIG ke Global Scope

## Masalah
Error `CONFIG timeout` terjadi di semua file JavaScript karena `CONFIG` tidak diekspos ke global scope. Meskipun `config.js` berhasil dimuat, variabel `CONFIG` hanya tersedia di dalam fungsi `initializeConfig()` dan tidak dapat diakses oleh file JavaScript lainnya.

## Penyebab
- `CONFIG` didefinisikan di dalam fungsi `initializeConfig()` dengan scope lokal
- Tidak ada ekspos ke global scope (`window.CONFIG`)
- File JavaScript lain tidak dapat mengakses `CONFIG` meskipun sudah dimuat

## Solusi

### Menambahkan Ekspos ke Global Scope
```javascript
// Log konfigurasi di development
CONFIG.logConfig();

// Ekspos CONFIG ke global scope
window.CONFIG = CONFIG;

// Mencegah modifikasi objek CONFIG
Object.freeze(CONFIG);
Object.freeze(CONFIG.ENDPOINTS);

console.log('✅ CONFIG berhasil diinisialisasi dan diekspos ke global scope');
```

## Perubahan yang Dilakukan

### File: `src/frontend/js/config.js`

**Sebelum:**
```javascript
// CONFIG hanya tersedia di dalam fungsi initializeConfig()
const CONFIG = {
    // ... konfigurasi
};

// Log konfigurasi di development
CONFIG.logConfig();

// Mencegah modifikasi objek CONFIG
Object.freeze(CONFIG);
Object.freeze(CONFIG.ENDPOINTS);
```

**Sesudah:**
```javascript
// CONFIG tersedia di dalam fungsi initializeConfig()
const CONFIG = {
    // ... konfigurasi
};

// Log konfigurasi di development
CONFIG.logConfig();

// Ekspos CONFIG ke global scope
window.CONFIG = CONFIG;

// Mencegah modifikasi objek CONFIG
Object.freeze(CONFIG);
Object.freeze(CONFIG.ENDPOINTS);

console.log('✅ CONFIG berhasil diinisialisasi dan diekspos ke global scope');
```

## Hasil Perbaikan
- ✅ **Global Access**: `CONFIG` sekarang dapat diakses dari semua file JavaScript
- ✅ **No More Timeout**: Tidak ada lagi error `CONFIG timeout`
- ✅ **Proper Initialization**: Semua komponen dapat mengakses CONFIG setelah inisialisasi
- ✅ **Better Logging**: Logging yang informatif untuk debugging

## Testing
1. Restart frontend container
2. Buka browser dan akses aplikasi
3. Periksa console browser untuk memastikan:
   - `✅ CONFIG berhasil diinisialisasi dan diekspos ke global scope`
   - Tidak ada error `CONFIG timeout`
   - Semua komponen berfungsi normal

## Dampak pada File Lain
Sekarang semua file JavaScript yang menggunakan `waitForConfig()` akan berhasil:
- ✅ `dashboard.js` - Dashboard dan statistik
- ✅ `mahasiswa.js` - Grid dan form mahasiswa  
- ✅ `nilai.js` - Grid dan form nilai
- ✅ `fis.js` - Metode FIS
- ✅ `saw.js` - Metode SAW

## Referensi
- [Dashboard Config Dependency Fix](DASHBOARD_CONFIG_DEPENDENCY_FIX.md)
- [Mahasiswa Config Dependency Fix](MAHASISWA_CONFIG_DEPENDENCY_FIX.md)
- [Nilai Config Dependency Fix](NILAI_CONFIG_DEPENDENCY_FIX.md)
- [Script Loading Fix](SCRIPT_LOADING_FIX.md)
- [Config.js Implementation](CONFIG_IMPLEMENTATION.md) 