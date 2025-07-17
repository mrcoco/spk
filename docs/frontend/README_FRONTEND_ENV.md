# Frontend Environment Variables Documentation

Dokumentasi lengkap untuk environment variables yang digunakan dalam frontend aplikasi SPK Monitoring Masa Studi.

## Overview

Frontend menggunakan environment variables untuk konfigurasi yang fleksibel dan aman. Environment variables dapat diatur melalui berbagai cara:

1. **Meta Tags** - Environment variables disimpan dalam meta tags HTML
2. **URL Parameters** - Environment variables dapat diatur melalui URL
3. **LocalStorage** - Environment variables disimpan di browser (development)
4. **Server Injection** - Environment variables diinjeksi oleh server

## File Structure

### 1. `env.frontend` - Environment Variables Template
File template yang berisi semua environment variables yang diperlukan frontend.

### 2. `js/env-loader.js` - Environment Variables Loader
Script untuk membaca environment variables dari berbagai sumber.

### 3. `js/env-updater.js` - Environment Variables Updater
Script untuk mengupdate meta tags berdasarkan environment variables.

### 4. `js/config.js` - Application Configuration
Konfigurasi aplikasi yang menggunakan environment variables.

## Environment Variables

### API Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:8000` | Base URL untuk API backend |
| `API_PREFIX` | `/api` | Prefix untuk semua endpoint API |
| `API_VERSION` | `v1` | Version API |

### Application Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `SPK Monitoring Masa Studi` | Nama aplikasi |
| `APP_VERSION` | `1.0.0` | Version aplikasi |
| `APP_DESCRIPTION` | `Sistem Pendukung Keputusan Monitoring Masa Studi Mahasiswa` | Deskripsi aplikasi |

### Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `development` | Environment (development/production) |
| `DEBUG` | `true` | Debug mode |
| `LOG_LEVEL` | `info` | Log level |

### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_SAW` | `true` | Enable metode SAW |
| `ENABLE_FUZZY` | `true` | Enable metode Fuzzy Logic |
| `ENABLE_COMPARISON` | `true` | Enable fitur perbandingan |
| `ENABLE_BATCH_PROCESSING` | `true` | Enable batch processing |

### UI Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `THEME` | `default` | Theme aplikasi |
| `LANGUAGE` | `id` | Bahasa aplikasi |
| `TIMEZONE` | `Asia/Jakarta` | Timezone aplikasi |

### File Upload Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_FILE_SIZE` | `10485760` | Max file size (10MB) |
| `ALLOWED_EXTENSIONS` | `["csv", "xlsx", "xls"]` | Allowed file extensions |

### Pagination Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_PAGE_SIZE` | `10` | Default page size |
| `MAX_PAGE_SIZE` | `100` | Max page size |

### Cache Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CACHE_ENABLED` | `true` | Enable cache |
| `CACHE_TTL` | `300000` | Cache TTL (5 minutes) |

### Error Handling

| Variable | Default | Description |
|----------|---------|-------------|
| `SHOW_ERROR_DETAILS` | `true` | Show error details |
| `LOG_ERRORS` | `true` | Log errors |

## Cara Penggunaan

### 1. Development Environment

**Setup environment variables:**
```bash
# Copy template
cp src/frontend/env.frontend src/frontend/.env

# Edit file .env
nano src/frontend/.env
```

**Atau gunakan meta tags di HTML:**
```html
<meta name="env-API_BASE_URL" content="http://localhost:8000">
<meta name="env-API_PREFIX" content="/api">
<meta name="env-ENVIRONMENT" content="development">
```

### 2. Production Environment

**Setup production environment:**
```html
<meta name="env-API_BASE_URL" content="https://api.your-domain.com">
<meta name="env-API_PREFIX" content="/api">
<meta name="env-ENVIRONMENT" content="production">
<meta name="env-DEBUG" content="false">
```

### 3. URL Parameters

**Set environment variables melalui URL:**
```
http://localhost:80/?env_API_BASE_URL=http://localhost:8000&env_ENVIRONMENT=development
```

### 4. LocalStorage (Development)

**Set environment variables di browser console:**
```javascript
localStorage.setItem('__ENV__', JSON.stringify({
    API_BASE_URL: 'http://localhost:8000',
    ENVIRONMENT: 'development',
    DEBUG: 'true'
}));
```

## JavaScript Usage

### 1. Menggunakan CONFIG Object

```javascript
// Access configuration
const apiUrl = CONFIG.API_BASE_URL;
const isDebug = CONFIG.isDebug();
const isDevelopment = CONFIG.isDevelopment();

// Get API URL
const mahasiswaUrl = CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA);

// Get API URL with version
const apiUrlWithVersion = CONFIG.getApiUrlWithVersion('/mahasiswa');
```

### 2. Menggunakan EnvLoader

```javascript
// Get environment variable
const apiUrl = window.envLoader.get('API_BASE_URL', 'http://localhost:8000');

// Get boolean
const isDebug = window.envLoader.getBoolean('DEBUG', true);

// Get number
const maxFileSize = window.envLoader.getNumber('MAX_FILE_SIZE', 10485760);

// Get array
const allowedExtensions = window.envLoader.getArray('ALLOWED_EXTENSIONS', ['csv', 'xlsx']);

// Check environment
const isDev = window.envLoader.isDevelopment();
const isProd = window.envLoader.isProduction();
```

### 3. Menggunakan EnvUpdater

```javascript
// Update environment variable
window.envUpdater.updateEnv('API_BASE_URL', 'https://new-api.com');

// Get all environment variables
const allEnv = window.envUpdater.getAll();

// Save to localStorage
window.envUpdater.saveToLocalStorage();
```

## Integration dengan Backend

### 1. Docker Environment

**Docker Compose environment variables:**
```yaml
frontend:
  environment:
    - API_BASE_URL=http://backend:8000
    - ENVIRONMENT=production
    - DEBUG=false
```

### 2. Nginx Configuration

**Inject environment variables ke HTML:**
```nginx
location / {
    sub_filter 'env-API_BASE_URL' '$API_BASE_URL';
    sub_filter 'env-ENVIRONMENT' '$ENVIRONMENT';
    sub_filter_once off;
}
```

### 3. Server-side Injection

**Inject environment variables dari server:**
```javascript
// Di server (Node.js/Express)
app.get('/', (req, res) => {
    const envVars = {
        API_BASE_URL: process.env.API_BASE_URL,
        ENVIRONMENT: process.env.ENVIRONMENT,
        DEBUG: process.env.DEBUG
    };
    
    res.render('index', {
        envVars: JSON.stringify(envVars)
    });
});
```

```html
<!-- Di HTML template -->
<script>
window.__ENV__ = <%- envVars %>;
</script>
```

## Best Practices

### 1. Security

**Development:**
```javascript
DEBUG: 'true',
SHOW_ERROR_DETAILS: 'true'
```

**Production:**
```javascript
DEBUG: 'false',
SHOW_ERROR_DETAILS: 'false'
```

### 2. API Configuration

**Development:**
```javascript
API_BASE_URL: 'http://localhost:8000'
```

**Production:**
```javascript
API_BASE_URL: 'https://api.your-domain.com'
```

### 3. Feature Flags

**Enable/disable features:**
```javascript
ENABLE_SAW: 'true',
ENABLE_FUZZY: 'true',
ENABLE_COMPARISON: 'true'
```

## Troubleshooting

### 1. Environment Variables Tidak Terload

**Solusi:**
```javascript
// Cek apakah env-loader.js dimuat
console.log('envLoader:', window.envLoader);

// Cek environment variables
console.log('Environment:', window.envLoader.getAll());

// Cek meta tags
const metaTags = document.querySelectorAll('meta[name^="env-"]');
metaTags.forEach(meta => {
    console.log(meta.getAttribute('name'), meta.getAttribute('content'));
});
```

### 2. API Calls Gagal

**Solusi:**
```javascript
// Cek API configuration
console.log('API_BASE_URL:', CONFIG.API_BASE_URL);
console.log('API_PREFIX:', CONFIG.API_PREFIX);

// Test API connection
fetch(CONFIG.getApiUrl('/health'))
    .then(response => response.json())
    .then(data => console.log('API Health:', data))
    .catch(error => console.error('API Error:', error));
```

### 3. CORS Error

**Solusi:**
```javascript
// Cek CORS configuration
console.log('CORS_ENABLED:', window.envLoader.getBoolean('CORS_ENABLED'));

// Update API base URL jika diperlukan
window.envUpdater.updateEnv('API_BASE_URL', 'http://localhost:8000');
```

## Validation

### 1. Validate Environment Variables

**Script validation:**
```javascript
// validate_env.js
function validateEnvironment() {
    const required = ['API_BASE_URL', 'API_PREFIX', 'ENVIRONMENT'];
    const missing = [];
    
    required.forEach(key => {
        if (!window.envLoader.get(key)) {
            missing.push(key);
        }
    });
    
    if (missing.length > 0) {
        console.error('❌ Missing environment variables:', missing);
        return false;
    }
    
    console.log('✅ Environment variables valid');
    return true;
}

validateEnvironment();
```

### 2. Test Configuration

**Test script:**
```javascript
// test_config.js
function testConfiguration() {
    console.log('🔍 Testing Configuration...');
    
    // Test API configuration
    console.log('API_BASE_URL:', CONFIG.API_BASE_URL);
    console.log('API_PREFIX:', CONFIG.API_PREFIX);
    console.log('ENDPOINTS:', CONFIG.ENDPOINTS);
    
    // Test utility methods
    console.log('Is Development:', CONFIG.isDevelopment());
    console.log('Is Debug:', CONFIG.isDebug());
    
    // Test API URL generation
    const testUrl = CONFIG.getApiUrl('/test');
    console.log('Test API URL:', testUrl);
    
    console.log('✅ Configuration test completed');
}

testConfiguration();
```

## Changelog

### v1.0.0 (2024-12-17)
- ✅ Initial release frontend environment variables
- ✅ Environment variables loader
- ✅ Environment variables updater
- ✅ Configuration integration
- ✅ Meta tags support
- ✅ URL parameters support
- ✅ LocalStorage support
- ✅ Feature flags
- ✅ Documentation dan examples
- ✅ Validation scripts
- ✅ Troubleshooting guide 