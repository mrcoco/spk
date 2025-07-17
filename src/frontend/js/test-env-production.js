/**
 * Test Environment Variables untuk Production
 * Script ini akan test apakah environment variables berfungsi dengan benar di production
 */

class EnvProductionTester {
    constructor() {
        this.testResults = [];
        this.runTests();
    }

    /**
     * Jalankan semua test
     */
    runTests() {
        console.log('🧪 Starting Environment Variables Production Test...');
        console.log('=' .repeat(60));

        this.testEnvironmentDetection();
        this.testApiBaseUrl();
        this.testMetaTags();
        this.testConfigLoading();
        this.testApiEndpoints();
        this.testProductionSettings();

        this.printResults();
    }

    /**
     * Test deteksi environment
     */
    testEnvironmentDetection() {
        console.log('\n🔍 Testing Environment Detection...');
        
        const hostname = window.location.hostname;
        const port = window.location.port;
        const expectedEnv = this.getExpectedEnvironment(hostname, port);
        
        const actualEnv = window.envUpdater ? window.envUpdater.getCurrentEnvironment() : 'unknown';
        
        const passed = actualEnv === expectedEnv;
        this.testResults.push({
            test: 'Environment Detection',
            passed,
            expected: expectedEnv,
            actual: actualEnv,
            details: `Hostname: ${hostname}, Port: ${port}`
        });

        console.log(`  Expected: ${expectedEnv}`);
        console.log(`  Actual: ${actualEnv}`);
        console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    }

    /**
     * Test API Base URL
     */
    testApiBaseUrl() {
        console.log('\n🔗 Testing API Base URL...');
        
        const expectedUrl = this.getExpectedApiUrl();
        const actualUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'unknown';
        
        const passed = actualUrl === expectedUrl;
        this.testResults.push({
            test: 'API Base URL',
            passed,
            expected: expectedUrl,
            actual: actualUrl,
            details: `Should point to correct backend server`
        });

        console.log(`  Expected: ${expectedUrl}`);
        console.log(`  Actual: ${actualUrl}`);
        console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    }

    /**
     * Test meta tags
     */
    testMetaTags() {
        console.log('\n🏷️ Testing Meta Tags...');
        
        const requiredTags = [
            'env-API_BASE_URL',
            'env-API_PREFIX',
            'env-API_VERSION',
            'env-ENVIRONMENT',
            'env-DEBUG'
        ];

        let allPassed = true;
        const details = [];

        requiredTags.forEach(tagName => {
            const meta = document.querySelector(`meta[name="${tagName}"]`);
            const exists = meta !== null;
            const content = exists ? meta.getAttribute('content') : 'missing';
            
            if (!exists) {
                allPassed = false;
                details.push(`${tagName}: missing`);
            } else {
                details.push(`${tagName}: ${content}`);
            }
        });

        this.testResults.push({
            test: 'Meta Tags',
            passed: allPassed,
            expected: 'All required meta tags present',
            actual: allPassed ? 'All tags found' : 'Some tags missing',
            details: details.join(', ')
        });

        console.log(`  Result: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
        details.forEach(detail => console.log(`    ${detail}`));
    }

    /**
     * Test config loading
     */
    testConfigLoading() {
        console.log('\n⚙️ Testing Config Loading...');
        
        const configExists = window.CONFIG !== undefined;
        const envLoaderExists = window.envLoader !== undefined;
        const envUpdaterExists = window.envUpdater !== undefined;
        
        const passed = configExists && envLoaderExists && envUpdaterExists;
        
        this.testResults.push({
            test: 'Config Loading',
            passed,
            expected: 'All config objects loaded',
            actual: passed ? 'All loaded' : 'Some missing',
            details: `CONFIG: ${configExists}, envLoader: ${envLoaderExists}, envUpdater: ${envUpdaterExists}`
        });

        console.log(`  CONFIG: ${configExists ? '✅' : '❌'}`);
        console.log(`  envLoader: ${envLoaderExists ? '✅' : '❌'}`);
        console.log(`  envUpdater: ${envUpdaterExists ? '✅' : '❌'}`);
        console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    }

    /**
     * Test API endpoints
     */
    testApiEndpoints() {
        console.log('\n🌐 Testing API Endpoints...');
        
        if (!window.CONFIG) {
            this.testResults.push({
                test: 'API Endpoints',
                passed: false,
                expected: 'CONFIG object available',
                actual: 'CONFIG not found',
                details: 'Cannot test endpoints without CONFIG'
            });
            console.log('  ❌ CONFIG not available');
            return;
        }

        const endpoints = window.CONFIG.ENDPOINTS;
        const baseUrl = window.CONFIG.API_BASE_URL;
        
        const testEndpoints = [
            'DASHBOARD',
            'MAHASISWA',
            'NILAI',
            'FUZZY',
            'SAW',
            'COMPARISON'
        ];

        let allValid = true;
        const details = [];

        testEndpoints.forEach(endpoint => {
            const url = endpoints[endpoint];
            const fullUrl = baseUrl + url;
            const isValid = url && url.startsWith('/api');
            
            if (!isValid) {
                allValid = false;
                details.push(`${endpoint}: invalid (${url})`);
            } else {
                details.push(`${endpoint}: ${fullUrl}`);
            }
        });

        this.testResults.push({
            test: 'API Endpoints',
            passed: allValid,
            expected: 'All endpoints valid',
            actual: allValid ? 'All valid' : 'Some invalid',
            details: details.join(', ')
        });

        console.log(`  Result: ${allValid ? '✅ PASS' : '❌ FAIL'}`);
        details.forEach(detail => console.log(`    ${detail}`));
    }

    /**
     * Test production settings
     */
    testProductionSettings() {
        console.log('\n🏭 Testing Production Settings...');
        
        if (!window.CONFIG) {
            this.testResults.push({
                test: 'Production Settings',
                passed: false,
                expected: 'CONFIG object available',
                actual: 'CONFIG not found',
                details: 'Cannot test settings without CONFIG'
            });
            console.log('  ❌ CONFIG not available');
            return;
        }

        const isProduction = window.CONFIG.isProduction();
        const debugMode = window.CONFIG.isDebug();
        const showErrors = window.CONFIG.SHOW_ERROR_DETAILS;
        
        const expectedDebug = !isProduction; // Debug should be false in production
        const expectedShowErrors = !isProduction; // Error details should be false in production
        
        const debugPassed = debugMode === expectedDebug;
        const errorsPassed = showErrors === expectedShowErrors;
        const passed = debugPassed && errorsPassed;

        this.testResults.push({
            test: 'Production Settings',
            passed,
            expected: 'Production-appropriate settings',
            actual: passed ? 'Settings correct' : 'Settings incorrect',
            details: `Debug: ${debugMode} (expected: ${expectedDebug}), ShowErrors: ${showErrors} (expected: ${expectedShowErrors})`
        });

        console.log(`  Environment: ${isProduction ? 'Production' : 'Development'}`);
        console.log(`  Debug Mode: ${debugMode} (expected: ${expectedDebug})`);
        console.log(`  Show Errors: ${showErrors} (expected: ${expectedShowErrors})`);
        console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    }

    /**
     * Get expected environment berdasarkan hostname dan port
     */
    getExpectedEnvironment(hostname, port) {
        if (hostname === '139.59.236.100' || 
            hostname.includes('139.59.236.100') ||
            hostname !== 'localhost') {
            return 'production';
        }
        return 'development';
    }

    /**
     * Get expected API URL berdasarkan environment
     */
    getExpectedApiUrl() {
        const hostname = window.location.hostname;
        
        if (hostname === '139.59.236.100' || hostname.includes('139.59.236.100')) {
            return 'http://139.59.236.100:8000';
        }
        
        return 'http://localhost:8000';
    }

    /**
     * Print hasil test
     */
    printResults() {
        console.log('\n' + '=' .repeat(60));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('=' .repeat(60));

        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const percentage = Math.round((passed / total) * 100);

        console.log(`\n✅ Passed: ${passed}/${total} (${percentage}%)`);

        this.testResults.forEach((result, index) => {
            const status = result.passed ? '✅' : '❌';
            console.log(`\n${index + 1}. ${status} ${result.test}`);
            console.log(`   Expected: ${result.expected}`);
            console.log(`   Actual: ${result.actual}`);
            if (result.details) {
                console.log(`   Details: ${result.details}`);
            }
        });

        console.log('\n' + '=' .repeat(60));
        
        if (percentage === 100) {
            console.log('🎉 ALL TESTS PASSED! Environment variables working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Please check the configuration.');
        }
        
        console.log('=' .repeat(60));
    }
}

// Jalankan test setelah DOM loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => new EnvProductionTester(), 1000);
    });
} else {
    setTimeout(() => new EnvProductionTester(), 1000);
} 