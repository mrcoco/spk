/**
 * Test Configuration untuk Frontend
 * Memvalidasi environment variables dan konfigurasi aplikasi
 */

function testEnvironmentLoader() {
    console.log('🔍 Testing Environment Loader...');
    console.log('-'.repeat(50));
    
    if (typeof window.envLoader === 'undefined') {
        console.error('❌ envLoader tidak ditemukan');
        return false;
    }
    
    console.log('✅ envLoader ditemukan');
    
    // Test basic functionality
    const apiUrl = window.envLoader.get('API_BASE_URL');
    const isDebug = window.envLoader.getBoolean('DEBUG');
    const maxFileSize = window.envLoader.getNumber('MAX_FILE_SIZE');
    const allowedExtensions = window.envLoader.getArray('ALLOWED_EXTENSIONS');
    
    console.log('✅ API_BASE_URL:', apiUrl);
    console.log('✅ DEBUG:', isDebug);
    console.log('✅ MAX_FILE_SIZE:', maxFileSize);
    console.log('✅ ALLOWED_EXTENSIONS:', allowedExtensions);
    
    return true;
}

function testEnvironmentUpdater() {
    console.log('\n🔍 Testing Environment Updater...');
    console.log('-'.repeat(50));
    
    if (typeof window.envUpdater === 'undefined') {
        console.error('❌ envUpdater tidak ditemukan');
        return false;
    }
    
    console.log('✅ envUpdater ditemukan');
    
    // Test meta tags
    const metaTags = document.querySelectorAll('meta[name^="env-"]');
    console.log('✅ Meta tags found:', metaTags.length);
    
    metaTags.forEach(meta => {
        const name = meta.getAttribute('name');
        const content = meta.getAttribute('content');
        console.log(`   ${name}: ${content}`);
    });
    
    return true;
}

function testConfiguration() {
    console.log('\n🔍 Testing Application Configuration...');
    console.log('-'.repeat(50));
    
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak ditemukan');
        return false;
    }
    
    console.log('✅ CONFIG ditemukan');
    
    // Test API configuration
    console.log('✅ API_BASE_URL:', CONFIG.API_BASE_URL);
    console.log('✅ API_PREFIX:', CONFIG.API_PREFIX);
    console.log('✅ API_VERSION:', CONFIG.API_VERSION);
    
    // Test application configuration
    console.log('✅ APP_NAME:', CONFIG.APP_NAME);
    console.log('✅ APP_VERSION:', CONFIG.APP_VERSION);
    console.log('✅ ENVIRONMENT:', CONFIG.ENVIRONMENT);
    console.log('✅ DEBUG:', CONFIG.DEBUG);
    
    // Test feature flags
    console.log('✅ ENABLE_SAW:', CONFIG.ENABLE_SAW);
    console.log('✅ ENABLE_FUZZY:', CONFIG.ENABLE_FUZZY);
    console.log('✅ ENABLE_COMPARISON:', CONFIG.ENABLE_COMPARISON);
    console.log('✅ ENABLE_BATCH_PROCESSING:', CONFIG.ENABLE_BATCH_PROCESSING);
    
    // Test endpoints
    console.log('✅ ENDPOINTS:', CONFIG.ENDPOINTS);
    
    return true;
}

function testUtilityMethods() {
    console.log('\n🔍 Testing Utility Methods...');
    console.log('-'.repeat(50));
    
    // Test environment detection
    console.log('✅ isDevelopment():', CONFIG.isDevelopment());
    console.log('✅ isProduction():', CONFIG.isProduction());
    console.log('✅ isDebug():', CONFIG.isDebug());
    
    // Test API URL generation
    const testEndpoint = '/test';
    const apiUrl = CONFIG.getApiUrl(testEndpoint);
    const apiUrlWithVersion = CONFIG.getApiUrlWithVersion(testEndpoint);
    
    console.log('✅ getApiUrl():', apiUrl);
    console.log('✅ getApiUrlWithVersion():', apiUrlWithVersion);
    
    // Test specific endpoints
    console.log('✅ MAHASISWA endpoint:', CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA));
    console.log('✅ NILAI endpoint:', CONFIG.getApiUrl(CONFIG.ENDPOINTS.NILAI));
    console.log('✅ FUZZY endpoint:', CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY));
    console.log('✅ SAW endpoint:', CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW));
    
    return true;
}

function testEnvironmentVariables() {
    console.log('\n🔍 Testing Environment Variables...');
    console.log('-'.repeat(50));
    
    const requiredVars = [
        'API_BASE_URL',
        'API_PREFIX',
        'API_VERSION',
        'APP_NAME',
        'ENVIRONMENT',
        'DEBUG'
    ];
    
    const missing = [];
    
    requiredVars.forEach(key => {
        const value = window.envLoader.get(key);
        if (!value) {
            missing.push(key);
            console.log(`❌ ${key}: missing`);
        } else {
            console.log(`✅ ${key}: ${value}`);
        }
    });
    
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing);
        return false;
    }
    
    console.log('✅ All required environment variables found');
    return true;
}

function testAPIConnection() {
    console.log('\n🔍 Testing API Connection...');
    console.log('-'.repeat(50));
    
    const healthUrl = CONFIG.getApiUrl('/health');
    console.log('✅ Health check URL:', healthUrl);
    
    // Test API connection (async)
    fetch(healthUrl)
        .then(response => {
            if (response.ok) {
                console.log('✅ API connection successful');
                return response.json();
            } else {
                console.warn('⚠️ API connection failed:', response.status);
                return null;
            }
        })
        .then(data => {
            if (data) {
                console.log('✅ API health data:', data);
            }
        })
        .catch(error => {
            console.warn('⚠️ API connection error:', error.message);
        });
    
    return true;
}

function testLocalStorage() {
    console.log('\n🔍 Testing LocalStorage...');
    console.log('-'.repeat(50));
    
    try {
        // Test localStorage access
        const testKey = '__ENV_TEST__';
        const testValue = 'test_value';
        
        localStorage.setItem(testKey, testValue);
        const retrievedValue = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (retrievedValue === testValue) {
            console.log('✅ LocalStorage access successful');
            return true;
        } else {
            console.warn('⚠️ LocalStorage access failed');
            return false;
        }
    } catch (error) {
        console.warn('⚠️ LocalStorage not available:', error.message);
        return false;
    }
}

function testConfigurationValidation() {
    console.log('\n🔍 Testing Configuration Validation...');
    console.log('-'.repeat(50));
    
    const config = CONFIG.getAll();
    console.log('✅ Configuration object:', config);
    
    // Validate required fields
    const requiredFields = [
        'API_BASE_URL',
        'API_PREFIX',
        'API_VERSION',
        'APP_NAME',
        'ENVIRONMENT',
        'DEBUG'
    ];
    
    const missing = [];
    
    requiredFields.forEach(field => {
        if (!config[field]) {
            missing.push(field);
        }
    });
    
    if (missing.length > 0) {
        console.error('❌ Missing required configuration fields:', missing);
        return false;
    }
    
    console.log('✅ All required configuration fields present');
    return true;
}

function main() {
    console.log('🚀 Frontend Configuration Test');
    console.log('='.repeat(60));
    
    const tests = [
        testEnvironmentLoader,
        testEnvironmentUpdater,
        testConfiguration,
        testUtilityMethods,
        testEnvironmentVariables,
        testLocalStorage,
        testConfigurationValidation
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        try {
            if (test()) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`❌ Test ${test.name} failed with error:`, error);
            failed++;
        }
    });
    
    // Run async test
    testAPIConnection();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${passed + failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! Frontend configuration is ready.');
        console.log('\n💡 Usage examples:');
        console.log('   CONFIG.API_BASE_URL');
        console.log('   CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA)');
        console.log('   CONFIG.isDevelopment()');
        console.log('   window.envLoader.get("DEBUG")');
        return 0;
    } else {
        console.log(f'\n⚠️  {failed} test(s) failed. Please check configuration.');
        return 1;
    }
}

// Run tests when script is loaded
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }
}

// Export untuk module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testEnvironmentLoader,
        testEnvironmentUpdater,
        testConfiguration,
        testUtilityMethods,
        testEnvironmentVariables,
        testAPIConnection,
        testLocalStorage,
        testConfigurationValidation,
        main
    };
} 