# Perbaikan Loading Script (env-loader.js Dependency)

## Masalah
Error `❌ env-loader.js harus dimuat sebelum config.js` terjadi karena script di-load secara asynchronous, sehingga `config.js` dapat dimuat sebelum `env-loader.js` selesai dimuat.

## Analisis Masalah

### Root Cause
1. **Async Loading**: Script di-load secara asynchronous tanpa menunggu dependency
2. **Race Condition**: `config.js` dapat dimuat sebelum `env-loader.js` selesai
3. **No Dependency Management**: Tidak ada mekanisme untuk memastikan urutan loading

### Error Message
```
config.js?v=1752766360535:8 ❌ env-loader.js harus dimuat sebelum config.js
```

## Solusi Implementasi

### 1. Sequential Script Loading
**File**: `src/frontend/index.html`

**Sebelum (Async Loading):**
```javascript
// Load JS
jsFiles.forEach(src => {
    const script = document.createElement('script');
    script.src = addVersion(src);
    document.head.appendChild(script);
});
```

**Sesudah (Sequential Loading):**
```javascript
// Load JS dengan urutan yang benar
function loadScriptsSequentially(files, index = 0) {
    if (index >= files.length) {
        console.log('✅ Semua script berhasil dimuat');
        return;
    }
    
    const script = document.createElement('script');
    script.src = addVersion(files[index]);
    
    script.onload = function() {
        console.log(`✅ Script loaded: ${files[index]}`);
        loadScriptsSequentially(files, index + 1);
    };
    
    script.onerror = function() {
        console.error(`❌ Error loading script: ${files[index]}`);
        // Lanjutkan ke script berikutnya meski ada error
        loadScriptsSequentially(files, index + 1);
    };
    
    document.head.appendChild(script);
}

// Mulai loading script secara berurutan
loadScriptsSequentially(jsFiles);
```

### 2. Improved Dependency Handling
**File**: `src/frontend/js/config.js`

**Sebelum (Simple Check):**
```javascript
if (typeof window.envLoader === 'undefined') {
    console.error('❌ env-loader.js harus dimuat sebelum config.js');
    // Fallback ke default values
    window.envLoader = { /* ... */ };
}
```

**Sesudah (Wait and Retry):**
```javascript
if (typeof window.envLoader === 'undefined') {
    console.warn('⚠️ env-loader.js belum dimuat, menunggu...');
    
    // Tunggu sampai env-loader.js dimuat
    let attempts = 0;
    const maxAttempts = 50; // 5 detik dengan interval 100ms
    
    const waitForEnvLoader = setInterval(() => {
        attempts++;
        
        if (typeof window.envLoader !== 'undefined') {
            clearInterval(waitForEnvLoader);
            console.log('✅ env-loader.js berhasil dimuat');
            initializeConfig();
        } else if (attempts >= maxAttempts) {
            clearInterval(waitForEnvLoader);
            console.error('❌ env-loader.js tidak dapat dimuat, menggunakan fallback');
            // Fallback ke default values
            window.envLoader = { /* ... */ };
            initializeConfig();
        }
    }, 100);
} else {
    console.log('✅ env-loader.js sudah tersedia');
    initializeConfig();
}

// Fungsi untuk inisialisasi konfigurasi
function initializeConfig() {
    // ... konfigurasi CONFIG object
}
```

## Script Loading Order

### Urutan Loading yang Benar
1. `js/env-loader.js` - Environment loader
2. `js/env-updater.js` - Environment updater
3. `js/config.js` - Configuration (memerlukan env-loader)
4. `js/router.js` - Router (memerlukan config)
5. `js/dashboard.js` - Dashboard (memerlukan config)
6. `js/mahasiswa.js` - Mahasiswa (memerlukan config)
7. `js/nilai.js` - Nilai (memerlukan config)
8. `js/fis.js` - FIS (memerlukan config)
9. `js/saw.js` - SAW (memerlukan config)
10. `app.js` - Main app (memerlukan semua dependencies)

### Dependencies
```
env-loader.js ← config.js ← router.js
                    ↓
              dashboard.js, mahasiswa.js, nilai.js, fis.js, saw.js
                    ↓
                  app.js
```

## Error Handling

### 1. Script Loading Error
**Penyebab:** File script tidak ditemukan atau network error
**Solusi:** Log error dan lanjutkan ke script berikutnya

### 2. Dependency Not Found
**Penyebab:** Script dependency belum dimuat
**Solusi:** Wait and retry mechanism dengan timeout

### 3. Timeout Error
**Penyebab:** Dependency tidak dapat dimuat dalam waktu yang ditentukan
**Solusi:** Fallback ke default values

## Console Logs

### Success Flow
```
✅ Script loaded: js/env-loader.js
✅ Script loaded: js/env-updater.js
✅ env-loader.js sudah tersedia
✅ Script loaded: js/config.js
✅ Script loaded: js/router.js
✅ Script loaded: js/dashboard.js
✅ Script loaded: js/mahasiswa.js
✅ Script loaded: js/nilai.js
✅ Script loaded: js/fis.js
✅ Script loaded: js/saw.js
✅ Script loaded: app.js
✅ Semua script berhasil dimuat
```

### Error Flow
```
⚠️ env-loader.js belum dimuat, menunggu...
✅ env-loader.js berhasil dimuat
✅ Script loaded: js/config.js
❌ Error loading script: js/router.js
✅ Script loaded: js/dashboard.js
...
```

## Performance Considerations

### 1. Loading Time
- **Sequential Loading**: Lebih lambat tapi aman
- **Parallel Loading**: Lebih cepat tapi berisiko race condition
- **Hybrid Approach**: Load non-critical scripts in parallel

### 2. Timeout Configuration
- **Default Timeout**: 5 detik (50 attempts × 100ms)
- **Configurable**: Dapat disesuaikan berdasarkan kebutuhan
- **Fallback**: Default values jika timeout

### 3. Error Recovery
- **Graceful Degradation**: Aplikasi tetap berfungsi meski ada error
- **Partial Loading**: Script yang berhasil dimuat tetap digunakan
- **User Feedback**: Console logs untuk debugging

## Testing

### 1. Normal Loading
- Buka halaman di browser
- Cek console untuk memastikan urutan loading benar
- Verifikasi semua script berhasil dimuat

### 2. Network Error Simulation
- Matikan network connection
- Refresh halaman
- Cek error handling dan fallback

### 3. Slow Network Simulation
- Throttle network di DevTools
- Cek timeout handling
- Verifikasi retry mechanism

## File yang Diubah
- `src/frontend/index.html` - Perbaikan sequential script loading
- `src/frontend/js/config.js` - Perbaikan dependency handling

## Status
✅ **SELESAI** - Script loading sudah diperbaiki dengan sequential loading dan dependency handling yang robust. Error `env-loader.js harus dimuat sebelum config.js` sudah tidak muncul lagi. 