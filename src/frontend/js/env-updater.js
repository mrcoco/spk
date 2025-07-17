/**
 * Environment Variables Updater untuk Frontend
 * Mengupdate meta tags dan environment variables berdasarkan environment
 */

class EnvUpdater {
    constructor() {
        this.currentEnvironment = this.detectEnvironment();
        this.updateEnvironmentVariables();
    }

    /**
     * Deteksi environment berdasarkan URL atau hostname
     * @returns {string} Environment (development/production)
     */
    detectEnvironment() {
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // Deteksi production environment
        if (hostname === '139.59.236.100' || 
            hostname.includes('139.59.236.100') ||
            hostname === 'localhost' && port === '80' ||
            hostname !== 'localhost') {
            return 'production';
        }
        
        return 'development';
    }

    /**
     * Update environment variables berdasarkan environment yang terdeteksi
     */
    updateEnvironmentVariables() {
        const isProduction = this.currentEnvironment === 'production';
        
        // Konfigurasi berdasarkan environment
        const config = isProduction ? this.getProductionConfig() : this.getDevelopmentConfig();
        
        // Update meta tags
        this.updateMetaTags(config);
        
        // Update window.__ENV__ jika belum ada
        if (!window.__ENV__) {
            window.__ENV__ = config;
        }
        
        // Log environment yang terdeteksi
        console.log(`🌍 Environment detected: ${this.currentEnvironment}`);
        console.log(`🔗 API Base URL: ${config.API_BASE_URL}`);
        
        // Reload env-loader jika sudah ada
        if (window.envLoader) {
            window.envLoader.loadEnvironmentVariables();
        }
    }

    /**
     * Konfigurasi untuk production environment
     * @returns {Object} Production configuration
     */
    getProductionConfig() {
        return {
            API_BASE_URL: 'http://139.59.236.100:8000',
            API_PREFIX: '/api',
            API_VERSION: 'v1',
            APP_NAME: 'SPK Monitoring Masa Studi',
            APP_VERSION: '1.0.0',
            ENVIRONMENT: 'production',
            DEBUG: 'false',
            LOG_LEVEL: 'warn',
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
            SHOW_ERROR_DETAILS: 'false',
            LOG_ERRORS: 'true'
        };
    }

    /**
     * Konfigurasi untuk development environment
     * @returns {Object} Development configuration
     */
    getDevelopmentConfig() {
        return {
            API_BASE_URL: 'http://localhost:8000',
            API_PREFIX: '/api',
            API_VERSION: 'v1',
            APP_NAME: 'SPK Monitoring Masa Studi',
            APP_VERSION: '1.0.0',
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
    }

    /**
     * Update meta tags dengan konfigurasi yang sesuai
     * @param {Object} config - Konfigurasi environment
     */
    updateMetaTags(config) {
        const metaTags = [
            { name: 'env-API_BASE_URL', content: config.API_BASE_URL },
            { name: 'env-API_PREFIX', content: config.API_PREFIX },
            { name: 'env-API_VERSION', content: config.API_VERSION },
            { name: 'env-APP_NAME', content: config.APP_NAME },
            { name: 'env-APP_VERSION', content: config.APP_VERSION },
            { name: 'env-ENVIRONMENT', content: config.ENVIRONMENT },
            { name: 'env-DEBUG', content: config.DEBUG },
            { name: 'env-ENABLE_SAW', content: config.ENABLE_SAW },
            { name: 'env-ENABLE_FUZZY', content: config.ENABLE_FUZZY },
            { name: 'env-ENABLE_COMPARISON', content: config.ENABLE_COMPARISON },
            { name: 'env-ENABLE_BATCH_PROCESSING', content: config.ENABLE_BATCH_PROCESSING }
        ];

        metaTags.forEach(meta => {
            let metaElement = document.querySelector(`meta[name="${meta.name}"]`);
            
            if (metaElement) {
                // Update existing meta tag
                metaElement.setAttribute('content', meta.content);
            } else {
                // Create new meta tag
                metaElement = document.createElement('meta');
                metaElement.setAttribute('name', meta.name);
                metaElement.setAttribute('content', meta.content);
                document.head.appendChild(metaElement);
            }
        });

        console.log('✅ Meta tags updated for environment:', this.currentEnvironment);
    }

    /**
     * Get current environment
     * @returns {string} Current environment
     */
    getCurrentEnvironment() {
        return this.currentEnvironment;
    }

    /**
     * Check apakah environment adalah production
     * @returns {boolean} True jika production
     */
    isProduction() {
        return this.currentEnvironment === 'production';
    }

    /**
     * Check apakah environment adalah development
     * @returns {boolean} True jika development
     */
    isDevelopment() {
        return this.currentEnvironment === 'development';
    }

    /**
     * Reload environment variables
     */
    reload() {
        this.updateEnvironmentVariables();
    }
}

// Initialize EnvUpdater
window.envUpdater = new EnvUpdater();

// Export untuk module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnvUpdater;
} 