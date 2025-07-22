/**
 * FIS Comparison JavaScript
 * Menangani perbandingan evaluasi FIS yang sebelumnya dengan evaluasi menggunakan data aktual
 */

// Global variables
let comparisonResults = null;

/**
 * Initialize FIS Comparison Section
 */
function initializeFISComparison() {
    console.log('🔍 Initializing FIS Comparison Section...');
    
    // Initialize event handlers
    initializeFISComparisonHandlers();
    
    // Initialize form validation
    initializeFISComparisonValidation();
    
    console.log('✅ FIS Comparison Section initialized');
}

/**
 * Initialize event handlers for FIS Comparison
 */
function initializeFISComparisonHandlers() {
    // Run comparison button
    $('#runComparisonBtn').on('click', function() {
        runFISComparison();
    });
    
    // Export comparison button
    $('#exportComparisonBtn').on('click', function() {
        exportComparisonResults();
    });
    
    // Print comparison button
    $('#printComparisonBtn').on('click', function() {
        printComparisonResults();
    });
    
    // Form input validation
    $('#comparisonTestSize').on('input', validateComparisonForm);
    $('#comparisonRandomState').on('input', validateComparisonForm);
}

/**
 * Initialize form validation
 */
function initializeFISComparisonValidation() {
    validateComparisonForm();
}

/**
 * Validate comparison form inputs
 */
function validateComparisonForm() {
    const testSize = parseFloat($('#comparisonTestSize').val());
    const randomState = parseInt($('#comparisonRandomState').val());
    
    let isValid = true;
    
    // Validate test size
    if (isNaN(testSize) || testSize < 10 || testSize > 50) {
        $('#comparisonTestSize').addClass('is-invalid');
        isValid = false;
    } else {
        $('#comparisonTestSize').removeClass('is-invalid');
    }
    
    // Validate random state
    if (isNaN(randomState) || randomState < 0) {
        $('#comparisonRandomState').addClass('is-invalid');
        isValid = false;
    } else {
        $('#comparisonRandomState').removeClass('is-invalid');
    }
    
    // Enable/disable run button
    $('#runComparisonBtn').prop('disabled', !isValid);
    
    return isValid;
}

/**
 * Run FIS Comparison
 */
function runFISComparison() {
    console.log('🔍 Running FIS Comparison...');
    
    if (!validateComparisonForm()) {
        showNotification("Error", "Mohon periksa input form", "error");
        return;
    }
    
    // Get parameters
    const testSize = parseFloat($('#comparisonTestSize').val()) / 100; // Convert percentage to decimal
    const randomState = parseInt($('#comparisonRandomState').val());
    
    // Show loading
    showComparisonLoading(true);
    
    // Disable button
    $('#runComparisonBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Menjalankan...');
    
    // Make API call to comparison endpoint
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + '/compare-evaluations',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            test_size: testSize,
            random_state: randomState
        }),
        success: function(response) {
            console.log('✅ FIS Comparison successful:', response);
            
            if (response.success) {
                comparisonResults = response.result;
                displayComparisonResults(comparisonResults);
                showNotification(
                    "Sukses", 
                    `Perbandingan FIS berhasil dengan ${comparisonResults.total_data} data`, 
                    "success"
                );
            } else {
                showNotification("Error", "Perbandingan FIS gagal", "error");
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Error FIS Comparison:', {xhr, status, error});
            
            let errorMessage = "Gagal melakukan perbandingan FIS";
            if (xhr.responseJSON && xhr.responseJSON.detail) {
                errorMessage += ": " + xhr.responseJSON.detail;
            }
            
            showNotification("Error", errorMessage, "error");
        },
        complete: function() {
            // Hide loading
            showComparisonLoading(false);
            
            // Enable button
            $('#runComparisonBtn').prop('disabled', false).html('<i class="fas fa-play"></i> Jalankan Perbandingan');
        }
    });
}

/**
 * Show/hide loading indicator
 */
function showComparisonLoading(show) {
    if (show) {
        $('#comparisonLoadingIndicator').show();
        $('#comparisonResultsSection').hide();
    } else {
        $('#comparisonLoadingIndicator').hide();
        $('#comparisonResultsSection').show();
    }
}

/**
 * Display comparison results
 */
function displayComparisonResults(results) {
    console.log('📊 Displaying comparison results:', results);
    
    // Update header metrics
    $('#comparisonTotalData').text(results.total_data);
    $('#comparisonAccuracy').text(formatPercentage(results.overall_accuracy));
    
    // Update metrics comparison
    updateMetricsComparison(results);
    
    // Update data comparison
    updateDataComparison(results);
    
    // Update summary
    updateComparisonSummary(results);
    
    // Update detailed analysis
    updateDetailedAnalysis(results);
    
    // Show export and print buttons
    $('#exportComparisonBtn, #printComparisonBtn').show();
}

/**
 * Update metrics comparison section
 */
function updateMetricsComparison(results) {
    const metrics = results.metrics_comparison;
    
    // Accuracy
    $('#comparisonAccuracyPrevious').text(formatPercentage(metrics.accuracy.previous));
    $('#comparisonAccuracyActual').text(formatPercentage(metrics.accuracy.actual));
    $('#comparisonAccuracyDiff').html(formatDifference(metrics.accuracy.difference));
    
    // Precision
    $('#comparisonPrecisionPrevious').text(formatPercentage(metrics.precision.previous));
    $('#comparisonPrecisionActual').text(formatPercentage(metrics.precision.actual));
    $('#comparisonPrecisionDiff').html(formatDifference(metrics.precision.difference));
    
    // Recall
    $('#comparisonRecallPrevious').text(formatPercentage(metrics.recall.previous));
    $('#comparisonRecallActual').text(formatPercentage(metrics.recall.actual));
    $('#comparisonRecallDiff').html(formatDifference(metrics.recall.difference));
    
    // F1-Score
    $('#comparisonF1Previous').text(formatPercentage(metrics.f1_score.previous));
    $('#comparisonF1Actual').text(formatPercentage(metrics.f1_score.actual));
    $('#comparisonF1Diff').html(formatDifference(metrics.f1_score.difference));
}

/**
 * Update data comparison section
 */
function updateDataComparison(results) {
    const data = results.data_comparison;
    
    // Total data
    $('#comparisonTotalDataPrevious').text(data.total_data.previous);
    $('#comparisonTotalDataActual').text(data.total_data.actual);
    
    // Test data
    $('#comparisonTestDataPrevious').text(data.test_data.previous);
    $('#comparisonTestDataActual').text(data.test_data.actual);
    
    // Execution time
    $('#comparisonExecTimePrevious').text(formatExecutionTime(data.execution_time.previous));
    $('#comparisonExecTimeActual').text(formatExecutionTime(data.execution_time.actual));
}

/**
 * Update comparison summary section
 */
function updateComparisonSummary(results) {
    const summary = results.summary;
    
    // Better metrics with actual data
    const betterMetrics = $('#comparisonBetterMetrics');
    betterMetrics.empty();
    summary.better_with_actual.forEach(metric => {
        betterMetrics.append(`<li>${metric}</li>`);
    });
    
    // Better metrics with previous data
    const worseMetrics = $('#comparisonWorseMetrics');
    worseMetrics.empty();
    summary.better_with_previous.forEach(metric => {
        worseMetrics.append(`<li>${metric}</li>`);
    });
    
    // Overall assessment
    $('#comparisonOverallAssessment').text(summary.overall_assessment);
}

/**
 * Update detailed analysis section
 */
function updateDetailedAnalysis(results) {
    const analysis = results.detailed_analysis;
    
    // Advantages of actual evaluation
    const actualAdvantages = $('#comparisonActualAdvantages');
    actualAdvantages.empty();
    analysis.actual_advantages.forEach(advantage => {
        actualAdvantages.append(`<li>${advantage}</li>`);
    });
    
    // Advantages of previous evaluation
    const previousAdvantages = $('#comparisonPreviousAdvantages');
    previousAdvantages.empty();
    analysis.previous_advantages.forEach(advantage => {
        previousAdvantages.append(`<li>${advantage}</li>`);
    });
    
    // Recommendations
    const recommendations = $('#comparisonRecommendations');
    recommendations.empty();
    analysis.recommendations.forEach(recommendation => {
        recommendations.append(`<p>${recommendation}</p>`);
    });
}

/**
 * Export comparison results
 */
function exportComparisonResults() {
    if (!comparisonResults) {
        showNotification("Error", "Tidak ada hasil perbandingan untuk diexport", "error");
        return;
    }
    
    console.log('📤 Exporting comparison results...');
    
    // Create export data
    const exportData = {
        timestamp: new Date().toISOString(),
        parameters: {
            test_size: parseFloat($('#comparisonTestSize').val()),
            random_state: parseInt($('#comparisonRandomState').val())
        },
        results: comparisonResults
    };
    
    // Create and download file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fis_comparison_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification("Sukses", "Hasil perbandingan berhasil diexport", "success");
}

/**
 * Print comparison results
 */
function printComparisonResults() {
    if (!comparisonResults) {
        showNotification("Error", "Tidak ada hasil perbandingan untuk dicetak", "error");
        return;
    }
    
    console.log('🖨️ Printing comparison results...');
    
    // Create print window
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent();
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>FIS Comparison Results</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 25px; }
                .section h3 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
                .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
                .metric-item { border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
                .metric-label { font-weight: bold; color: #667eea; }
                .metric-value { font-size: 1.1em; margin-top: 5px; }
                .difference { background: #f8f9fa; padding: 8px; border-radius: 4px; margin-top: 8px; }
                .summary { background: #e9ecef; padding: 15px; border-radius: 8px; }
                .recommendations { background: #d4edda; padding: 15px; border-radius: 8px; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${printContent}
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()">Print</button>
                <button onclick="window.close()">Close</button>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

/**
 * Generate print content
 */
function generatePrintContent() {
    const results = comparisonResults;
    const timestamp = new Date().toLocaleString('id-ID');
    
    return `
        <div class="header">
            <h1>FIS Comparison Results</h1>
            <p>Generated on: ${timestamp}</p>
            <p>Test Size: ${parseFloat($('#comparisonTestSize').val())}% | Random State: ${$('#comparisonRandomState').val()}</p>
        </div>
        
        <div class="section">
            <h3>Metrics Comparison</h3>
            <div class="metric-grid">
                <div class="metric-item">
                    <div class="metric-label">Accuracy</div>
                    <div class="metric-value">Previous: ${formatPercentage(results.metrics_comparison.accuracy.previous)}</div>
                    <div class="metric-value">Actual: ${formatPercentage(results.metrics_comparison.accuracy.actual)}</div>
                    <div class="difference">Difference: ${formatDifference(results.metrics_comparison.accuracy.difference)}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Precision</div>
                    <div class="metric-value">Previous: ${formatPercentage(results.metrics_comparison.precision.previous)}</div>
                    <div class="metric-value">Actual: ${formatPercentage(results.metrics_comparison.precision.actual)}</div>
                    <div class="difference">Difference: ${formatDifference(results.metrics_comparison.precision.difference)}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Recall</div>
                    <div class="metric-value">Previous: ${formatPercentage(results.metrics_comparison.recall.previous)}</div>
                    <div class="metric-value">Actual: ${formatPercentage(results.metrics_comparison.recall.actual)}</div>
                    <div class="difference">Difference: ${formatDifference(results.metrics_comparison.recall.difference)}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">F1-Score</div>
                    <div class="metric-value">Previous: ${formatPercentage(results.metrics_comparison.f1_score.previous)}</div>
                    <div class="metric-value">Actual: ${formatPercentage(results.metrics_comparison.f1_score.actual)}</div>
                    <div class="difference">Difference: ${formatDifference(results.metrics_comparison.f1_score.difference)}</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>Data Comparison</h3>
            <div class="metric-grid">
                <div class="metric-item">
                    <div class="metric-label">Total Data</div>
                    <div class="metric-value">Previous: ${results.data_comparison.total_data.previous}</div>
                    <div class="metric-value">Actual: ${results.data_comparison.total_data.actual}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Test Data</div>
                    <div class="metric-value">Previous: ${results.data_comparison.test_data.previous}</div>
                    <div class="metric-value">Actual: ${results.data_comparison.test_data.actual}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Execution Time</div>
                    <div class="metric-value">Previous: ${formatExecutionTime(results.data_comparison.execution_time.previous)}</div>
                    <div class="metric-value">Actual: ${formatExecutionTime(results.data_comparison.execution_time.actual)}</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>Summary</h3>
            <div class="summary">
                <h4>Better with Actual Data:</h4>
                <ul>${results.summary.better_with_actual.map(metric => `<li>${metric}</li>`).join('')}</ul>
                
                <h4>Better with Previous Data:</h4>
                <ul>${results.summary.better_with_previous.map(metric => `<li>${metric}</li>`).join('')}</ul>
                
                <h4>Overall Assessment:</h4>
                <p>${results.summary.overall_assessment}</p>
            </div>
        </div>
        
        <div class="section">
            <h3>Recommendations</h3>
            <div class="recommendations">
                ${results.detailed_analysis.recommendations.map(rec => `<p>${rec}</p>`).join('')}
            </div>
        </div>
    `;
}

/**
 * Format percentage
 */
function formatPercentage(value) {
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    return (value * 100).toFixed(2) + '%';
}

/**
 * Format difference
 */
function formatDifference(value) {
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    const percentage = (value * 100).toFixed(2);
    
    // Determine the CSS class based on the value
    let cssClass = 'neutral';
    if (value > 0) {
        cssClass = 'positive';
    } else if (value < 0) {
        cssClass = 'negative';
    }
    
    return `<span class="metric-value ${cssClass}">${sign}${percentage}%</span>`;
}

/**
 * Format execution time
 */
function formatExecutionTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds)) return 'N/A';
    if (seconds < 1) {
        return (seconds * 1000).toFixed(2) + ' ms';
    }
    return seconds.toFixed(2) + ' s';
}

// Export functions for global access
window.initializeFISComparison = initializeFISComparison;
window.runFISComparison = runFISComparison;
window.exportComparisonResults = exportComparisonResults;
window.printComparisonResults = printComparisonResults; 