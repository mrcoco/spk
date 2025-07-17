# Troubleshooting Environment Variables di Production

Dokumentasi ini menjelaskan cara mengatasi masalah environment variables di frontend saat production menggunakan IP 139.59.236.100.

## Masalah Umum di Production

### 1. API Base URL tidak sesuai dengan production server

**Gejala:**
- Frontend masih menggunakan `localhost:8000` untuk API calls
- Error CORS atau connection refused
- API calls gagal di production

**Penyebab:**
- Meta tags di `index.html` masih menggunakan development URL
- Environment detection tidak berfungsi
- `env-updater.js` tidak mengupdate meta tags dengan benar

**Solusi:**

#### A. Periksa Environment Detection
```javascript
// Di browser console
console.log('Hostname:', window.location.hostname);
console.log('Environment:', window.envUpdater.getCurrentEnvironment());
console.log('API Base URL:', window.CONFIG.API_BASE_URL);
```

#### B. Periksa Meta Tags
```javascript
// Di browser console
document.querySelectorAll('meta[name^="env-"]').forEach(meta => {
    console.log(meta.getAttribute('name'), ':', meta.getAttribute('content'));
});
```

#### C. Force Update Environment Variables
```javascript
// Di browser console
window.envUpdater.reload();
```

### 2. Environment Variables tidak ter-load

**Gejala:**
- `window.CONFIG` undefined
- `window.envLoader` undefined
- `window.envUpdater` undefined

**Penyebab:**
- Script tidak dimuat dengan urutan yang benar
- Error di JavaScript
- File tidak ditemukan

**Solusi:**

#### A. Periksa Urutan Loading Script
Pastikan urutan di `index.html`:
```html
<script src="js/env-loader.js"></script>
<script src="js/env-updater.js"></script>
<script src="js/config.js"></script>
```

#### B. Periksa Console Errors
```javascript
// Di browser console
console.log('envLoader:', window.envLoader);
console.log('envUpdater:', window.envUpdater);
console.log('CONFIG:', window.CONFIG);
```

### 3. CORS Issues di Production

**Gejala:**
- Error CORS di browser console
- API calls blocked oleh browser

**Penyebab:**
- Backend CORS configuration tidak sesuai
- Frontend dan backend domain berbeda

**Solusi:**

#### A. Update Backend CORS Configuration
Di `config.py` backend:
```python
CORS_ORIGINS = [
    "http://139.59.236.100:80",
    "http://139.59.236.100", 
    "http://localhost:80",
    "http://localhost:3000"
]
```

#### B. Periksa Frontend CORS Settings
```javascript
// Di browser console
console.log('CORS Origins:', window.CONFIG.getArray('CORS_ORIGINS'));
```

## File Environment yang Tersedia

### 1. `env.frontend` (Development)
Konfigurasi untuk development environment.

### 2. `env.production` (Production)
Konfigurasi untuk production environment dengan IP 139.59.236.100.

## Script Testing

### 1. `test-env-production.js`
Script untuk test environment variables di production.

**Cara menggunakan:**
1. Buka browser di production server
2. Buka Developer Tools (F12)
3. Lihat Console untuk hasil test

**Output yang diharapkan:**
```
🧪 Starting Environment Variables Production Test...
============================================================

🔍 Testing Environment Detection...
  Expected: production
  Actual: production
  Result: ✅ PASS

🔗 Testing API Base URL...
  Expected: http://139.59.236.100:8000
  Actual: http://139.59.236.100:8000
  Result: ✅ PASS

📊 TEST RESULTS SUMMARY
============================================================
✅ Passed: 6/6 (100%)
🎉 ALL TESTS PASSED! Environment variables working correctly.
```

### 2. Manual Testing
```javascript
// Test environment detection
console.log('Environment:', window.envUpdater.getCurrentEnvironment());

// Test API URL
console.log('API URL:', window.CONFIG.API_BASE_URL);

// Test meta tags
document.querySelector('meta[name="env-API_BASE_URL"]').getAttribute('content');

// Test API call
fetch(window.CONFIG.getApiUrl('/dashboard'))
    .then(response => response.json())
    .then(data => console.log('API Response:', data))
    .catch(error => console.error('API Error:', error));
```

## Konfigurasi Production

### Environment Variables yang Benar untuk Production

```bash
# API Configuration
API_BASE_URL=http://139.59.236.100:8000
API_PREFIX=/api
API_VERSION=v1

# Production Configuration
DEBUG=false
ENVIRONMENT=production
LOG_LEVEL=warn

# CORS Configuration
CORS_ORIGINS=["http://139.59.236.100:80", "http://139.59.236.100", "http://localhost:80"]

# Error Handling
SHOW_ERROR_DETAILS=false
LOG_ERRORS=true
```

### Meta Tags yang Benar untuk Production

```html
<meta name="env-API_BASE_URL" content="http://139.59.236.100:8000">
<meta name="env-API_PREFIX" content="/api">
<meta name="env-API_VERSION" content="v1">
<meta name="env-ENVIRONMENT" content="production">
<meta name="env-DEBUG" content="false">
```

## Debugging Steps

### Step 1: Periksa Environment Detection
```javascript
// Di browser console
console.log('Location:', window.location.href);
console.log('Hostname:', window.location.hostname);
console.log('Port:', window.location.port);
console.log('Environment:', window.envUpdater.getCurrentEnvironment());
```

### Step 2: Periksa Meta Tags
```javascript
// Di browser console
const metaTags = document.querySelectorAll('meta[name^="env-"]');
metaTags.forEach(meta => {
    console.log(meta.getAttribute('name'), ':', meta.getAttribute('content'));
});
```

### Step 3: Periksa Config Object
```javascript
// Di browser console
console.log('CONFIG:', window.CONFIG);
console.log('API Base URL:', window.CONFIG.API_BASE_URL);
console.log('Environment:', window.CONFIG.ENVIRONMENT);
console.log('Debug Mode:', window.CONFIG.DEBUG);
```

### Step 4: Test API Connection
```javascript
// Di browser console
fetch(window.CONFIG.getApiUrl('/dashboard'))
    .then(response => {
        console.log('Response Status:', response.status);
        return response.json();
    })
    .then(data => console.log('API Data:', data))
    .catch(error => console.error('API Error:', error));
```

## Troubleshooting Checklist

- [ ] Environment detection berfungsi (production/development)
- [ ] Meta tags ter-update dengan benar
- [ ] API Base URL mengarah ke production server
- [ ] CONFIG object ter-load dengan benar
- [ ] API calls berhasil tanpa CORS error
- [ ] Debug mode dimatikan di production
- [ ] Error details disembunyikan di production

## Kontak Support

Jika masalah masih berlanjut:

1. **Periksa Console Errors** di browser
2. **Jalankan Test Script** `test-env-production.js`
3. **Periksa Network Tab** untuk API calls
4. **Verifikasi Backend** berjalan di port 8000
5. **Periksa Firewall** dan port accessibility

## Contoh Debug Output

### Sukses
```
🌍 Environment detected: production
🔗 API Base URL: http://139.59.236.100:8000
✅ Meta tags updated for environment: production
⚙️  Application Config: {
  API_BASE_URL: "http://139.59.236.100:8000",
  API_PREFIX: "/api",
  API_VERSION: "v1",
  ENVIRONMENT: "production",
  DEBUG: false
}
```

### Error
```
❌ Environment Detection: FAIL
  Expected: production
  Actual: development
  Details: Hostname: 139.59.236.100, Port: 80

❌ API Base URL: FAIL
  Expected: http://139.59.236.100:8000
  Actual: http://localhost:8000
``` 