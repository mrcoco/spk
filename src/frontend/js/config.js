/**
 * Konfigurasi aplikasi SPK Monitoring Masa Studi
 * Menggunakan environment variables untuk fleksibilitas deployment
 */

// Pastikan env-loader.js sudah dimuat sebelum config.js
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
            window.envLoader = {
                get: (key, defaultValue) => defaultValue,
                getBoolean: (key, defaultValue) => defaultValue,
                getNumber: (key, defaultValue) => defaultValue,
                getArray: (key, defaultValue) => defaultValue,
                isDevelopment: () => true,
                isProduction: () => false,
                isDebug: () => true
            };
            initializeConfig();
        }
    }, 100);
} else {
    console.log('✅ env-loader.js sudah tersedia');
    initializeConfig();
}

// Fungsi untuk inisialisasi konfigurasi
function initializeConfig() {

const CONFIG = {
    // API Configuration
    API_BASE_URL: window.envLoader.get('API_BASE_URL', 'http://localhost:8000'),
    API_PREFIX: window.envLoader.get('API_PREFIX', '/api'),
    API_VERSION: window.envLoader.get('API_VERSION', 'v1'),

    // Application Configuration
    APP_NAME: window.envLoader.get('APP_NAME', 'SPK Monitoring Masa Studi'),
    APP_VERSION: window.envLoader.get('APP_VERSION', '1.0.0'),
    APP_DESCRIPTION: window.envLoader.get('APP_DESCRIPTION', 'Sistem Pendukung Keputusan Monitoring Masa Studi Mahasiswa'),

    // Environment Configuration
    ENVIRONMENT: window.envLoader.get('ENVIRONMENT', 'development'),
    DEBUG: window.envLoader.getBoolean('DEBUG', true),
    LOG_LEVEL: window.envLoader.get('LOG_LEVEL', 'info'),

    // Feature Flags
    ENABLE_SAW: window.envLoader.getBoolean('ENABLE_SAW', true),
    ENABLE_FUZZY: window.envLoader.getBoolean('ENABLE_FUZZY', true),
    ENABLE_COMPARISON: window.envLoader.getBoolean('ENABLE_COMPARISON', true),
    ENABLE_BATCH_PROCESSING: window.envLoader.getBoolean('ENABLE_BATCH_PROCESSING', true),

    // UI Configuration
    THEME: window.envLoader.get('THEME', 'default'),
    LANGUAGE: window.envLoader.get('LANGUAGE', 'id'),
    TIMEZONE: window.envLoader.get('TIMEZONE', 'Asia/Jakarta'),

    // File Upload Configuration
    MAX_FILE_SIZE: window.envLoader.getNumber('MAX_FILE_SIZE', 10485760), // 10MB
    ALLOWED_EXTENSIONS: window.envLoader.getArray('ALLOWED_EXTENSIONS', ['csv', 'xlsx', 'xls']),

    // Pagination Configuration
    DEFAULT_PAGE_SIZE: window.envLoader.getNumber('DEFAULT_PAGE_SIZE', 10),
    MAX_PAGE_SIZE: window.envLoader.getNumber('MAX_PAGE_SIZE', 100),

    // Cache Configuration
    CACHE_ENABLED: window.envLoader.getBoolean('CACHE_ENABLED', true),
    CACHE_TTL: window.envLoader.getNumber('CACHE_TTL', 300000), // 5 minutes

    // Error Handling
    SHOW_ERROR_DETAILS: window.envLoader.getBoolean('SHOW_ERROR_DETAILS', true),
    LOG_ERRORS: window.envLoader.getBoolean('LOG_ERRORS', true),

    // Endpoint API (dibuat dinamis berdasarkan API_PREFIX)
    get ENDPOINTS() {
        return {
            DASHBOARD: `${this.API_PREFIX}/dashboard`,
            MAHASISWA: `${this.API_PREFIX}/mahasiswa`,
            NILAI: `${this.API_PREFIX}/nilai`,
            FUZZY: `${this.API_PREFIX}/fuzzy`,
            FUZZY_RESULT: `${this.API_PREFIX}/fuzzy/results`,
            FUZZY_BATCH: `${this.API_PREFIX}/fuzzy/batch-klasifikasi`,
            SAW: `${this.API_PREFIX}/saw`,
            COMPARISON: `${this.API_PREFIX}/comparison`,
            BATCH_KLASIFIKASI: `${this.API_PREFIX}/batch/klasifikasi`,
            PROGRAM_STUDI: `${this.API_PREFIX}/program-studi`
        };
    },

    // Utility Methods
    /**
     * Mendapatkan URL lengkap API
     * @param {string} endpoint - Endpoint API
     * @returns {string} URL lengkap API
     */
    getApiUrl: function(endpoint) {
        return this.API_BASE_URL + endpoint;
    },

    /**
     * Mendapatkan URL lengkap API dengan version
     * @param {string} endpoint - Endpoint API
     * @returns {string} URL lengkap API dengan version
     */
    getApiUrlWithVersion: function(endpoint) {
        return `${this.API_BASE_URL}${this.API_PREFIX}/${this.API_VERSION}${endpoint}`;
    },

    /**
     * Check apakah environment adalah development
     * @returns {boolean} True jika development
     */
    isDevelopment: function() {
        return window.envLoader.isDevelopment();
    },

    /**
     * Check apakah environment adalah production
     * @returns {boolean} True jika production
     */
    isProduction: function() {
        return window.envLoader.isProduction();
    },

    /**
     * Check apakah debug mode aktif
     * @returns {boolean} True jika debug mode aktif
     */
    isDebug: function() {
        return window.envLoader.isDebug();
    },

    /**
     * Log konfigurasi (hanya di development)
     */
    logConfig: function() {
        if (this.isDevelopment() && this.isDebug()) {
            console.log('⚙️  Application Config:', {
                API_BASE_URL: this.API_BASE_URL,
                API_PREFIX: this.API_PREFIX,
                API_VERSION: this.API_VERSION,
                APP_NAME: this.APP_NAME,
                ENVIRONMENT: this.ENVIRONMENT,
                DEBUG: this.DEBUG,
                ENDPOINTS: this.ENDPOINTS
            });
        }
    },

    /**
     * Mendapatkan semua konfigurasi sebagai object
     * @returns {Object} Semua konfigurasi
     */
    getAll: function() {
        return {
            API_BASE_URL: this.API_BASE_URL,
            API_PREFIX: this.API_PREFIX,
            API_VERSION: this.API_VERSION,
            APP_NAME: this.APP_NAME,
            APP_VERSION: this.APP_VERSION,
            APP_DESCRIPTION: this.APP_DESCRIPTION,
            ENVIRONMENT: this.ENVIRONMENT,
            DEBUG: this.DEBUG,
            LOG_LEVEL: this.LOG_LEVEL,
            ENABLE_SAW: this.ENABLE_SAW,
            ENABLE_FUZZY: this.ENABLE_FUZZY,
            ENABLE_COMPARISON: this.ENABLE_COMPARISON,
            ENABLE_BATCH_PROCESSING: this.ENABLE_BATCH_PROCESSING,
            THEME: this.THEME,
            LANGUAGE: this.LANGUAGE,
            TIMEZONE: this.TIMEZONE,
            MAX_FILE_SIZE: this.MAX_FILE_SIZE,
            ALLOWED_EXTENSIONS: this.ALLOWED_EXTENSIONS,
            DEFAULT_PAGE_SIZE: this.DEFAULT_PAGE_SIZE,
            MAX_PAGE_SIZE: this.MAX_PAGE_SIZE,
            CACHE_ENABLED: this.CACHE_ENABLED,
            CACHE_TTL: this.CACHE_TTL,
            SHOW_ERROR_DETAILS: this.SHOW_ERROR_DETAILS,
            LOG_ERRORS: this.LOG_ERRORS,
            ENDPOINTS: this.ENDPOINTS
        };
    }
};

// Log konfigurasi di development
CONFIG.logConfig();

// Ekspos CONFIG ke global scope
window.CONFIG = CONFIG;

// Mencegah modifikasi objek CONFIG
Object.freeze(CONFIG);
Object.freeze(CONFIG.ENDPOINTS);

console.log('✅ CONFIG berhasil diinisialisasi dan diekspos ke global scope');

} // Tutup fungsi initializeConfig 