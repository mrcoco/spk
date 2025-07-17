/**
 * Test Script untuk Operasi Destroy pada Grid Mahasiswa
 * Script ini akan test apakah operasi hapus data berfungsi dengan benar
 */

class DestroyTest {
    constructor() {
        this.testResults = [];
        this.runTests();
    }

    /**
     * Jalankan semua test
     */
    runTests() {
        console.log('🧪 Starting Destroy Operation Test...');
        console.log('=' .repeat(60));

        this.testGridInitialization();
        this.testDataSourceValidation();
        this.testModelValidation();
        this.testDestroyOperation();
        this.testErrorHandling();

        this.printResults();
    }

    /**
     * Test inisialisasi grid
     */
    testGridInitialization() {
        console.log('\n🔍 Testing Grid Initialization...');
        
        const grid = $("#mahasiswaGrid").data("kendoGrid");
        const dataSource = grid ? grid.dataSource : null;
        
        const gridExists = grid !== undefined && grid !== null;
        const dataSourceExists = dataSource !== undefined && dataSource !== null;
        
        const passed = gridExists && dataSourceExists;
        
        this.testResults.push({
            test: 'Grid Initialization',
            passed,
            expected: 'Grid and DataSource properly initialized',
            actual: passed ? 'Grid and DataSource found' : 'Grid or DataSource missing',
            details: `Grid: ${gridExists}, DataSource: ${dataSourceExists}`
        });

        console.log(`  Grid exists: ${gridExists ? '✅' : '❌'}`);
        console.log(`  DataSource exists: ${dataSourceExists ? '✅' : '❌'}`);
        console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    }

    /**
     * Test validasi DataSource
     */
    testDataSourceValidation() {
        console.log('\n📊 Testing DataSource Validation...');
        
        const grid = $("#mahasiswaGrid").data("kendoGrid");
        if (!grid || !grid.dataSource) {
            this.testResults.push({
                test: 'DataSource Validation',
                passed: false,
                expected: 'DataSource available for testing',
                actual: 'DataSource not available',
                details: 'Cannot test without DataSource'
            });
            console.log('  ❌ DataSource not available');
            return;
        }

        const dataSource = grid.dataSource;
        const data = dataSource.data();
        const hasData = data && Array.isArray(data) && data.length > 0;
        
        // Test uid pada setiap item
        let allItemsHaveUid = true;
        let uidDetails = [];
        
        if (hasData) {
            data.forEach((item, index) => {
                if (!item.uid) {
                    allItemsHaveUid = false;
                    uidDetails.push(`Item ${index} (NIM: ${item.nim}) missing uid`);
                }
            });
        }

        const passed = hasData && allItemsHaveUid;
        
        this.testResults.push({
            test: 'DataSource Validation',
            passed,
            expected: 'All data items have uid property',
            actual: passed ? 'All items have uid' : 'Some items missing uid',
            details: uidDetails.length > 0 ? uidDetails.join(', ') : 'All items valid'
        });

        console.log(`  Has data: ${hasData ? '✅' : '❌'}`);
        console.log(`  All items have uid: ${allItemsHaveUid ? '✅' : '❌'}`);
        if (uidDetails.length > 0) {
            uidDetails.forEach(detail => console.log(`    ${detail}`));
        }
        console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    }

    /**
     * Test validasi model
     */
    testModelValidation() {
        console.log('\n🔧 Testing Model Validation...');
        
        const grid = $("#mahasiswaGrid").data("kendoGrid");
        if (!grid || !grid.dataSource) {
            this.testResults.push({
                test: 'Model Validation',
                passed: false,
                expected: 'Grid available for testing',
                actual: 'Grid not available',
                details: 'Cannot test without Grid'
            });
            console.log('  ❌ Grid not available');
            return;
        }

        const dataSource = grid.dataSource;
        const data = dataSource.data();
        
        if (!data || data.length === 0) {
            this.testResults.push({
                test: 'Model Validation',
                passed: false,
                expected: 'Data available for testing',
                actual: 'No data available',
                details: 'Cannot test model validation without data'
            });
            console.log('  ❌ No data available');
            return;
        }

        // Test model properties
        const firstItem = data[0];
        const requiredFields = ['nim', 'nama', 'program_studi', 'ipk', 'sks', 'persen_dek'];
        const missingFields = [];
        
        requiredFields.forEach(field => {
            if (!firstItem.hasOwnProperty(field)) {
                missingFields.push(field);
            }
        });

        const passed = missingFields.length === 0;
        
        this.testResults.push({
            test: 'Model Validation',
            passed,
            expected: 'All required fields present',
            actual: passed ? 'All fields present' : 'Some fields missing',
            details: missingFields.length > 0 ? `Missing: ${missingFields.join(', ')}` : 'All fields valid'
        });

        console.log(`  Required fields: ${requiredFields.join(', ')}`);
        console.log(`  Missing fields: ${missingFields.length > 0 ? missingFields.join(', ') : 'None'}`);
        console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    }

    /**
     * Test operasi destroy
     */
    testDestroyOperation() {
        console.log('\n🗑️ Testing Destroy Operation...');
        
        const grid = $("#mahasiswaGrid").data("kendoGrid");
        if (!grid || !grid.dataSource) {
            this.testResults.push({
                test: 'Destroy Operation',
                passed: false,
                expected: 'Grid available for testing',
                actual: 'Grid not available',
                details: 'Cannot test without Grid'
            });
            console.log('  ❌ Grid not available');
            return;
        }

        const dataSource = grid.dataSource;
        const data = dataSource.data();
        
        if (!data || data.length === 0) {
            this.testResults.push({
                test: 'Destroy Operation',
                passed: false,
                expected: 'Data available for testing',
                actual: 'No data available',
                details: 'Cannot test destroy without data'
            });
            console.log('  ❌ No data available');
            return;
        }

        // Test destroy configuration
        const transport = dataSource.options.transport;
        const destroyConfig = transport.destroy;
        
        const hasDestroyConfig = destroyConfig !== undefined;
        const hasDestroyUrl = hasDestroyConfig && typeof destroyConfig.url === 'function';
        
        const passed = hasDestroyConfig && hasDestroyUrl;
        
        this.testResults.push({
            test: 'Destroy Operation',
            passed,
            expected: 'Destroy configuration properly set',
            actual: passed ? 'Destroy config valid' : 'Destroy config invalid',
            details: `Has config: ${hasDestroyConfig}, Has URL function: ${hasDestroyUrl}`
        });

        console.log(`  Has destroy config: ${hasDestroyConfig ? '✅' : '❌'}`);
        console.log(`  Has destroy URL function: ${hasDestroyUrl ? '✅' : '❌'}`);
        console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    }

    /**
     * Test error handling
     */
    testErrorHandling() {
        console.log('\n⚠️ Testing Error Handling...');
        
        // Test error handler function
        const grid = $("#mahasiswaGrid").data("kendoGrid");
        if (!grid || !grid.dataSource) {
            this.testResults.push({
                test: 'Error Handling',
                passed: false,
                expected: 'Grid available for testing',
                actual: 'Grid not available',
                details: 'Cannot test without Grid'
            });
            console.log('  ❌ Grid not available');
            return;
        }

        const dataSource = grid.dataSource;
        const hasErrorHandler = typeof dataSource.options.error === 'function';
        
        // Test deleteMahasiswa function
        const hasDeleteFunction = typeof window.deleteMahasiswa === 'function';
        
        const passed = hasErrorHandler && hasDeleteFunction;
        
        this.testResults.push({
            test: 'Error Handling',
            passed,
            expected: 'Error handlers properly configured',
            actual: passed ? 'Error handlers valid' : 'Error handlers missing',
            details: `DataSource error handler: ${hasErrorHandler}, deleteMahasiswa function: ${hasDeleteFunction}`
        });

        console.log(`  DataSource error handler: ${hasErrorHandler ? '✅' : '❌'}`);
        console.log(`  deleteMahasiswa function: ${hasDeleteFunction ? '✅' : '❌'}`);
        console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    }

    /**
     * Print hasil test
     */
    printResults() {
        console.log('\n' + '=' .repeat(60));
        console.log('📊 DESTROY OPERATION TEST RESULTS');
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
            console.log('🎉 ALL TESTS PASSED! Destroy operation should work correctly.');
        } else {
            console.log('⚠️ Some tests failed. Please check the configuration.');
        }
        
        console.log('=' .repeat(60));
    }
}

// Jalankan test setelah DOM loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => new DestroyTest(), 2000);
    });
} else {
    setTimeout(() => new DestroyTest(), 2000);
} 