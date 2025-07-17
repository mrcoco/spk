/**
 * Environment Variables Loader untuk Frontend
 * Membaca environment variables dari file .env atau dari window.__ENV__
 */

class EnvLoader {
    constructor() {
        this.env = {};
        this.loadEnvironmentVariables();
    }

    /**
     * Load environment variables dari berbagai sumber
     */
    loadEnvironmentVariables() {
        // 1. Coba load dari window.__ENV__ (injected oleh server)
        if (window.__ENV__) {
            this.env = { ...window.__ENV__ };
            console.log('✅ Environment variables loaded from window.__ENV__');
            return;
        }

        // 2. Coba load dari meta tags
        this.loadFromMetaTags();

        // 3. Coba load dari localStorage (untuk development)
        this.loadFromLocalStorage();

        // 4. Set default values
        this.setDefaultValues();

        console.log('✅ Environment variables loaded');
    }

    /**
     * Load environment variables dari meta tags
     */
    loadFromMetaTags() {
        const metaTags = document.querySelectorAll('meta[name^="env-"]');
        metaTags.forEach(meta => {
            const key = meta.getAttribute('name').replace('env-', '');
            const value = meta.getAttribute('content');
            if (key && value) {
                this.env[key] = value;
            }
        });
    }

    /**
     * Load environment variables dari localStorage (development)
     */
    loadFromLocalStorage() {
        try {
            const storedEnv = localStorage.getItem('__ENV__');
            if (storedEnv) {
                const parsedEnv = JSON.parse(storedEnv);
                this.env = { ...this.env, ...parsedEnv };
                console.log('✅ Environment variables loaded from localStorage');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load environment from localStorage:', error);
        }
    }

    /**
     * Set default values untuk environment variables
     */
    setDefaultValues() {
        const defaults = {
            API_BASE_URL: 'http://localhost:8000',
            API_PREFIX: '/api',
            API_VERSION: 'v1',
            APP_NAME: 'SPK Monitoring Masa Studi',
            APP_VERSION: '1.0.0',
            DEBUG: 'true',
            ENVIRONMENT: 'development',
            LOG_LEVEL: 'info',
            CORS_ENABLED: 'true',
            ENABLE_SAW: 'true',
            ENABLE_FUZZY: 'true',
            ENABLE_COMPARISON: 'true',
            ENABLE_BATCH_PROCESSING: 'true',
            THEME: 'default',
            LANGUAGE: 'id',
            TIMEZONE: 'Asia/Jakarta',
            MAX_FILE_SIZE: '10485760',
            DEFAULT_PAGE_SIZE: '10',
            MAX_PAGE_SIZE: '100',
            CACHE_ENABLED: 'true',
            CACHE_TTL: '300000',
            SHOW_ERROR_DETAILS: 'true',
            LOG_ERRORS: 'true'
        };

        // Set default values jika tidak ada
        Object.keys(defaults).forEach(key => {
            if (!this.env.hasOwnProperty(key)) {
                this.env[key] = defaults[key];
            }
        });
    }

    /**
     * Get environment variable
     * @param {string} key - Environment variable key
     * @param {*} defaultValue - Default value jika tidak ditemukan
     * @returns {*} Environment variable value
     */
    get(key, defaultValue = null) {
        return this.env[key] !== undefined ? this.env[key] : defaultValue;
    }

    /**
     * Get environment variable sebagai boolean
     * @param {string} key - Environment variable key
     * @param {boolean} defaultValue - Default value jika tidak ditemukan
     * @returns {boolean} Environment variable value as boolean
     */
    getBoolean(key, defaultValue = false) {
        const value = this.get(key, defaultValue);
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1';
        }
        return Boolean(value);
    }

    /**
     * Get environment variable sebagai number
     * @param {string} key - Environment variable key
     * @param {number} defaultValue - Default value jika tidak ditemukan
     * @returns {number} Environment variable value as number
     */
    getNumber(key, defaultValue = 0) {
        const value = this.get(key, defaultValue);
        if (typeof value === 'number') return value;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * Get environment variable sebagai array
     * @param {string} key - Environment variable key
     * @param {Array} defaultValue - Default value jika tidak ditemukan
     * @returns {Array} Environment variable value as array
     */
    getArray(key, defaultValue = []) {
        const value = this.get(key, defaultValue);
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch (error) {
                // Jika bukan JSON, split by comma
                return value.split(',').map(item => item.trim());
            }
        }
        return defaultValue;
    }

    /**
     * Get semua environment variables
     * @returns {Object} All environment variables
     */
    getAll() {
        return { ...this.env };
    }

    /**
     * Check apakah environment adalah development
     * @returns {boolean} True jika development
     */
    isDevelopment() {
        return this.get('ENVIRONMENT', 'development').toLowerCase() === 'development';
    }

    /**
     * Check apakah environment adalah production
     * @returns {boolean} True jika production
     */
    isProduction() {
        return this.get('ENVIRONMENT', 'development').toLowerCase() === 'production';
    }

    /**
     * Check apakah debug mode aktif
     * @returns {boolean} True jika debug mode aktif
     */
    isDebug() {
        return this.getBoolean('DEBUG', true);
    }

    /**
     * Log environment variables (hanya di development)
     */
    logEnvironment() {
        if (this.isDevelopment() && this.isDebug()) {
            console.log('🌍 Environment Variables:', this.env);
        }
    }

    /**
     * Save environment variables ke localStorage (development)
     */
    saveToLocalStorage() {
        if (this.isDevelopment()) {
            try {
                localStorage.setItem('__ENV__', JSON.stringify(this.env));
                console.log('✅ Environment variables saved to localStorage');
            } catch (error) {
                console.warn('⚠️ Failed to save environment to localStorage:', error);
            }
        }
    }
}

// Create global instance
window.envLoader = new EnvLoader();

// Log environment di development
window.envLoader.logEnvironment();

// Export untuk module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnvLoader;
} 