/**
 * Environment Variables Updater untuk Frontend
 * Mengupdate meta tags berdasarkan environment variables
 */

class EnvUpdater {
    constructor() {
        this.env = {};
        this.loadEnvironmentVariables();
        this.updateMetaTags();
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

        // 2. Coba load dari URL parameters
        this.loadFromUrlParams();

        // 3. Coba load dari localStorage
        this.loadFromLocalStorage();

        // 4. Set default values
        this.setDefaultValues();

        console.log('✅ Environment variables loaded for meta tags');
    }

    /**
     * Load environment variables dari URL parameters
     */
    loadFromUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const envParams = {};
        
        urlParams.forEach((value, key) => {
            if (key.startsWith('env_')) {
                const envKey = key.replace('env_', '');
                envParams[envKey] = value;
            }
        });

        if (Object.keys(envParams).length > 0) {
            this.env = { ...this.env, ...envParams };
            console.log('✅ Environment variables loaded from URL parameters');
        }
    }

    /**
     * Load environment variables dari localStorage
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
            APP_DESCRIPTION: 'Sistem Pendukung Keputusan Monitoring Masa Studi Mahasiswa',
            ENVIRONMENT: 'development',
            DEBUG: 'true',
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
     * Update meta tags berdasarkan environment variables
     */
    updateMetaTags() {
        const metaTags = [
            'API_BASE_URL',
            'API_PREFIX',
            'API_VERSION',
            'APP_NAME',
            'APP_VERSION',
            'APP_DESCRIPTION',
            'ENVIRONMENT',
            'DEBUG',
            'LOG_LEVEL',
            'CORS_ENABLED',
            'ENABLE_SAW',
            'ENABLE_FUZZY',
            'ENABLE_COMPARISON',
            'ENABLE_BATCH_PROCESSING',
            'THEME',
            'LANGUAGE',
            'TIMEZONE',
            'MAX_FILE_SIZE',
            'DEFAULT_PAGE_SIZE',
            'MAX_PAGE_SIZE',
            'CACHE_ENABLED',
            'CACHE_TTL',
            'SHOW_ERROR_DETAILS',
            'LOG_ERRORS'
        ];

        metaTags.forEach(key => {
            this.updateMetaTag(key, this.env[key]);
        });

        // Update title jika ada
        if (this.env.APP_NAME) {
            document.title = this.env.APP_NAME;
        }

        console.log('✅ Meta tags updated');
    }

    /**
     * Update meta tag individual
     * @param {string} key - Environment variable key
     * @param {string} value - Environment variable value
     */
    updateMetaTag(key, value) {
        const metaName = `env-${key}`;
        let meta = document.querySelector(`meta[name="${metaName}"]`);
        
        if (!meta) {
            // Buat meta tag baru jika tidak ada
            meta = document.createElement('meta');
            meta.setAttribute('name', metaName);
            document.head.appendChild(meta);
        }
        
        meta.setAttribute('content', value);
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
     * Get semua environment variables
     * @returns {Object} All environment variables
     */
    getAll() {
        return { ...this.env };
    }

    /**
     * Save environment variables ke localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('__ENV__', JSON.stringify(this.env));
            console.log('✅ Environment variables saved to localStorage');
        } catch (error) {
            console.warn('⚠️ Failed to save environment to localStorage:', error);
        }
    }

    /**
     * Update environment variable secara dinamis
     * @param {string} key - Environment variable key
     * @param {*} value - Environment variable value
     */
    updateEnv(key, value) {
        this.env[key] = value;
        this.updateMetaTag(key, value);
        this.saveToLocalStorage();
        console.log(`✅ Environment variable ${key} updated to ${value}`);
    }

    /**
     * Log environment variables (hanya di development)
     */
    logEnvironment() {
        if (this.env.ENVIRONMENT === 'development' && this.env.DEBUG === 'true') {
            console.log('🌍 Environment Variables (Meta Tags):', this.env);
        }
    }
}

// Create global instance
window.envUpdater = new EnvUpdater();

// Log environment di development
window.envUpdater.logEnvironment();

// Export untuk module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnvUpdater;
} 