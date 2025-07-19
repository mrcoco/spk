// Evaluation.js - Script untuk halaman evaluasi FIS

// Global variables
let confusionMatrixChart = null;
let metricsChart = null;
let evaluationData = null;

// Initialize evaluation for router
function initializeEvaluation() {
    console.log('🚀 Evaluation FIS section initialized');
    
    // Debug: Check if we can access the section
    const section = $('#evaluationSection');
    console.log('Evaluation section found:', section.length > 0);
    console.log('Section display:', section.css('display'));
    console.log('Section visibility:', section.css('visibility'));
    console.log('Current hash:', window.location.hash);
    
    // Debug: Check submenu
    const submenu = $('.submenu');
    const hasSubmenu = $('.has-submenu');
    console.log('Submenu found:', submenu.length);
    console.log('Has submenu items:', hasSubmenu.length);
    console.log('Submenu display:', submenu.css('display'));
    
    // Try to expand submenu if needed
    if (hasSubmenu.length > 0 && submenu.css('display') === 'none') {
        console.log('Attempting to expand submenu...');
        hasSubmenu.addClass('expanded');
        submenu.show();
    }
    
    // Initialize evaluation components
    initializeEvaluationComponents();
    
    // Initialize event handlers
    initializeEvaluationHandlers();
    
    // Load initial state
    loadInitialState();
    
    // Load saved evaluations
    loadSavedEvaluations();
}

// Initialize evaluation components
function initializeEvaluationComponents() {
    console.log('Initializing evaluation components...');
    
    // Initialize charts
    initializeCharts();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize saved evaluations grid
    initializeSavedEvaluationsGrid();
}

// Initialize event handlers
function initializeEvaluationHandlers() {
    console.log('Initializing evaluation handlers...');
    
    // Calculate button handler
    $('#evaluationCalculateBtn').click(function() {
        console.log('Calculate button clicked');
        performEvaluation();
    });
    
    // Form input handlers
    $('#evaluationTestSize, #evaluationRandomState').on('change', function() {
        console.log('Form input changed:', {
            testSize: $('#evaluationTestSize').val(),
            randomState: $('#evaluationRandomState').val()
        });
    });
    
    // Save to database checkbox handler
    $('#evaluationSaveToDb').on('change', function() {
        const isChecked = $(this).is(':checked');
        console.log('Save to database:', isChecked);
    });
    
    // Export button handler
    $('#evaluationExportBtn').click(function() {
        exportEvaluationData();
    });
    
    // Print button handler
    $('#evaluationPrintBtn').click(function() {
        printEvaluationReport();
    });
}

// Load initial state
function loadInitialState() {
    console.log('Loading initial state...');
    
    // Show info message
    showInfoMessage('Silakan atur parameter evaluasi dan klik "Hitung Evaluasi FIS" untuk memulai evaluasi.');
}

// Load evaluation by ID
function loadEvaluationById(evaluationId) {
    console.log('Loading evaluation by ID:', evaluationId);
    
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + `/evaluations/${evaluationId}`,
        type: 'GET',
        timeout: 10000,
        success: function(response) {
            console.log('Evaluation loaded:', response);
            evaluationData = response;
            displayEvaluationResults(response);
            showSuccessMessage(`Evaluasi "${response.evaluation_name}" berhasil dimuat`);
            
            // Scroll to results
            $('html, body').animate({
                scrollTop: $('.evaluation-section:first').offset().top - 100
            }, 500);
        },
        error: function(xhr, status, error) {
            console.error('Error loading evaluation:', error);
            showErrorMessage('Gagal memuat evaluasi');
        }
    });
}

// Delete evaluation by ID
function deleteEvaluationById(evaluationId) {
    console.log('Deleting evaluation by ID:', evaluationId);
    
    // Show confirmation dialog
    if (!confirm('Apakah Anda yakin ingin menghapus evaluasi ini? Tindakan ini tidak dapat dibatalkan.')) {
        return;
    }
    
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + `/evaluations/${evaluationId}`,
        type: 'DELETE',
        timeout: 10000,
        success: function(response) {
            console.log('Evaluation deleted:', response);
            showSuccessMessage('Evaluasi berhasil dihapus');
            
            // Reload saved evaluations
            loadSavedEvaluations();
            
            // Clear current evaluation if it was the deleted one
            if (evaluationData && evaluationData.id === evaluationId) {
                clearEvaluationResults();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error deleting evaluation:', error);
            showErrorMessage('Gagal menghapus evaluasi');
        }
    });
}

// Get accuracy class for styling
function getAccuracyClass(accuracy) {
    if (accuracy >= 0.8) return 'accuracy-high';
    if (accuracy >= 0.6) return 'accuracy-medium';
    return 'accuracy-low';
}

// Clear evaluation results
function clearEvaluationResults() {
    evaluationData = null;
    
    // Clear summary
    $('#evaluationTotalData, #evaluationTrainingData, #evaluationTestData, #evaluationExecutionTime').text('-');
    
    // Clear confusion matrix
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            $(`#evaluation-cm-${i}-${j}`).text('-').removeClass('correct-prediction incorrect-prediction');
        }
    }
    
    // Clear metrics
    $('#evaluationAccuracy, #evaluationPrecisionMacro, #evaluationRecallMacro, #evaluationF1Macro').text('-');
    for (let i = 0; i < 3; i++) {
        $(`#evaluationPrecision${i}, #evaluationRecall${i}, #evaluationF1${i}`).text('-');
    }
    
    // Clear charts
    if (confusionMatrixChart) {
        confusionMatrixChart.data.datasets = [];
        confusionMatrixChart.update();
    }
    
    if (metricsChart) {
        metricsChart.data.datasets = [];
        metricsChart.update();
    }
    
    // Hide narration section
    $('#evaluationNarrationSection').hide();
    
    // Hide results
    $('.evaluation-section').not(':first').hide();
}

// Perform evaluation
function performEvaluation() {
    console.log('Starting FIS evaluation...');
    
    // Get parameters
    const testSize = parseFloat($('#evaluationTestSize').val()) / 100;
    const randomState = parseInt($('#evaluationRandomState').val());
    const saveToDb = $('#evaluationSaveToDb').is(':checked');
    
    // Validate parameters
    if (testSize < 0.1 || testSize > 0.5) {
        showErrorMessage('Ukuran data test harus antara 10% - 50%');
        return;
    }
    
    if (randomState < 0) {
        showErrorMessage('Random state harus positif');
        return;
    }
    
    // Show loading
    showLoading(true);
    
    // Prepare request data
    const requestData = {
        test_size: testSize,
        random_state: randomState,
        save_to_db: saveToDb
    };
    
    console.log('Evaluation parameters:', requestData);
    
    // Call evaluation API
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + '/evaluate',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        timeout: 60000, // 60 seconds timeout
        success: function(response) {
            console.log('Evaluation successful:', response);
            evaluationData = response;
            displayEvaluationResults(response);
            
            if (response.saved_to_db) {
                showSuccessMessage(`Evaluasi FIS berhasil diselesaikan dan disimpan!`);
                // Refresh saved evaluations grid
                const grid = $("#evaluationSavedGrid").data("kendoGrid");
                if (grid) {
                    grid.dataSource.read();
                }
            } else {
                showSuccessMessage('Evaluasi FIS berhasil diselesaikan!');
            }
        },
        error: function(xhr, status, error) {
            console.error('Evaluation failed:', { xhr, status, error });
            
            let errorMessage = 'Gagal melakukan evaluasi FIS';
            if (xhr.responseJSON && xhr.responseJSON.detail) {
                errorMessage = xhr.responseJSON.detail;
            }
            
            showErrorMessage(errorMessage);
        },
        complete: function() {
            showLoading(false);
        }
    });
}

// Display evaluation results
function displayEvaluationResults(data) {
    console.log('Displaying evaluation results:', data);
    
    // Update summary
    updateSummary(data.summary);
    
    // Update confusion matrix
    updateConfusionMatrix(data.confusion_matrix, data.kategori_mapping);
    
    // Update metrics
    updateMetrics(data.metrics);
    
    // Update charts
    updateCharts(data);
    
    // Generate and display narration
    generateEvaluationNarration(data);
    
    // Show results
    $('.evaluation-section').show();
}

// Generate evaluation narration
function generateEvaluationNarration(data) {
    console.log('Generating evaluation narration...');
    
    const accuracy = data.metrics.accuracy;
    const precision = data.metrics.precision_macro;
    const recall = data.metrics.recall_macro;
    const f1 = data.metrics.f1_macro;
    const confusionMatrix = data.confusion_matrix;
    
    // Determine performance level
    const getPerformanceLevel = (value) => {
        if (value >= 0.8) return 'high';
        if (value >= 0.6) return 'medium';
        return 'low';
    };
    
    const getPerformanceClass = (value) => {
        if (value >= 0.8) return 'metric-highlight';
        if (value >= 0.6) return 'metric-medium';
        return 'metric-low';
    };
    
    const getPerformanceText = (value) => {
        if (value >= 0.8) return 'Sangat Baik';
        if (value >= 0.6) return 'Cukup Baik';
        return 'Perlu Perbaikan';
    };
    
    // Calculate confusion matrix insights
    const totalPredictions = confusionMatrix.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0);
    const correctPredictions = confusionMatrix.reduce((sum, row, i) => sum + row[i], 0);
    const incorrectPredictions = totalPredictions - correctPredictions;
    
    // Find most confused categories
    let maxConfusion = 0;
    let mostConfused = [];
    for (let i = 0; i < confusionMatrix.length; i++) {
        for (let j = 0; j < confusionMatrix[i].length; j++) {
            if (i !== j && confusionMatrix[i][j] > maxConfusion) {
                maxConfusion = confusionMatrix[i][j];
                mostConfused = [i, j];
            }
        }
    }
    
    const narrationHtml = `
        <div class="evaluation-narration">
            <h4><i class="fas fa-chart-line"></i> Analisis Performa Model FIS</h4>
            
            <div class="narration-item ${getPerformanceLevel(accuracy) === 'low' ? 'danger' : getPerformanceLevel(accuracy) === 'medium' ? 'warning' : ''}">
                <h5><i class="fas fa-bullseye"></i> Akurasi Model</h5>
                <p>Model FIS mencapai akurasi sebesar <span class="${getPerformanceClass(accuracy)}">${(accuracy * 100).toFixed(2)}%</span>, yang menunjukkan tingkat <strong>${getPerformanceText(accuracy)}</strong> dalam mengklasifikasikan peluang kelulusan mahasiswa.</p>
                <p>Dari total ${data.summary.test_data} data test, model berhasil memprediksi dengan benar ${Math.round(accuracy * data.summary.test_data)} kasus.</p>
            </div>
            
            <div class="narration-item ${getPerformanceLevel(precision) === 'low' ? 'danger' : getPerformanceLevel(precision) === 'medium' ? 'warning' : ''}">
                <h5><i class="fas fa-crosshairs"></i> Presisi Model</h5>
                <p>Presisi model sebesar <span class="${getPerformanceClass(precision)}">${(precision * 100).toFixed(2)}%</span> menunjukkan bahwa dari semua prediksi positif yang dibuat model, ${(precision * 100).toFixed(1)}% adalah benar.</p>
                <p>Nilai presisi yang ${precision >= 0.8 ? 'tinggi' : precision >= 0.6 ? 'cukup' : 'rendah'} ini mengindikasikan ${precision >= 0.8 ? 'model jarang memberikan false positive' : precision >= 0.6 ? 'model cukup baik dalam menghindari false positive' : 'model masih sering memberikan false positive'}.</p>
            </div>
            
            <div class="narration-item ${getPerformanceLevel(recall) === 'low' ? 'danger' : getPerformanceLevel(recall) === 'medium' ? 'warning' : ''}">
                <h5><i class="fas fa-search"></i> Recall Model</h5>
                <p>Recall model sebesar <span class="${getPerformanceClass(recall)}">${(recall * 100).toFixed(2)}%</span> menunjukkan bahwa dari semua kasus positif yang sebenarnya, model berhasil mengidentifikasi ${(recall * 100).toFixed(1)}%.</p>
                <p>Nilai recall yang ${recall >= 0.8 ? 'tinggi' : recall >= 0.6 ? 'cukup' : 'rendah'} ini mengindikasikan ${recall >= 0.8 ? 'model sangat baik dalam menemukan kasus positif' : recall >= 0.6 ? 'model cukup baik dalam menemukan kasus positif' : 'model masih sering melewatkan kasus positif'}.</p>
            </div>
            
            <div class="narration-item ${getPerformanceLevel(f1) === 'low' ? 'danger' : getPerformanceLevel(f1) === 'medium' ? 'warning' : ''}">
                <h5><i class="fas fa-balance-scale"></i> F1-Score Model</h5>
                <p>F1-Score sebesar <span class="${getPerformanceClass(f1)}">${(f1 * 100).toFixed(2)}%</span> merupakan rata-rata harmonik dari presisi dan recall, memberikan gambaran seimbang tentang performa model.</p>
                <p>Nilai F1-Score yang ${f1 >= 0.8 ? 'tinggi' : f1 >= 0.6 ? 'cukup' : 'rendah'} menunjukkan bahwa model memiliki ${f1 >= 0.8 ? 'keseimbangan yang sangat baik' : f1 >= 0.6 ? 'keseimbangan yang cukup baik' : 'ketidakseimbangan'} antara presisi dan recall.</p>
            </div>
            
            <div class="performance-summary">
                <h5><i class="fas fa-star"></i> Ringkasan Performa</h5>
                <p>Berdasarkan hasil evaluasi, model FIS menunjukkan performa <strong>${getPerformanceText(accuracy)}</strong> dalam mengklasifikasikan peluang kelulusan mahasiswa dengan akurasi ${(accuracy * 100).toFixed(2)}%.</p>
            </div>
            
            <div class="confusion-analysis">
                <h5><i class="fas fa-table"></i> Analisis Confusion Matrix</h5>
                <p>Dari confusion matrix dapat dilihat bahwa:</p>
                <ul>
                    <li>Total prediksi yang benar: <strong>${correctPredictions}</strong> dari ${totalPredictions} prediksi</li>
                    <li>Total prediksi yang salah: <strong>${incorrectPredictions}</strong> dari ${totalPredictions} prediksi</li>
                    <li>Tingkat kesalahan: <strong>${((incorrectPredictions / totalPredictions) * 100).toFixed(2)}%</strong></li>
                </ul>
                
                ${mostConfused.length > 0 ? `
                <p><strong>Kesalahan Klasifikasi Terbesar:</strong> Model paling sering salah mengklasifikasikan "${Object.values(data.kategori_mapping)[mostConfused[0]]}" sebagai "${Object.values(data.kategori_mapping)[mostConfused[1]]}" sebanyak ${maxConfusion} kali.</p>
                ` : ''}
            </div>
            
            <div class="recommendation">
                <h5><i class="fas fa-lightbulb"></i> Rekomendasi</h5>
                ${accuracy >= 0.8 ? `
                <ul>
                    <li>Model menunjukkan performa yang sangat baik dan dapat digunakan untuk klasifikasi peluang kelulusan</li>
                    <li>Pertimbangkan untuk menggunakan model ini dalam sistem pendukung keputusan</li>
                    <li>Lakukan monitoring berkala untuk memastikan performa tetap konsisten</li>
                </ul>
                ` : accuracy >= 0.6 ? `
                <ul>
                    <li>Model menunjukkan performa yang cukup baik namun masih dapat ditingkatkan</li>
                    <li>Pertimbangkan untuk menyesuaikan parameter fuzzy atau menambah data training</li>
                    <li>Lakukan validasi dengan data historis yang lebih lengkap</li>
                </ul>
                ` : `
                <ul>
                    <li>Model menunjukkan performa yang perlu ditingkatkan secara signifikan</li>
                    <li>Pertimbangkan untuk merevisi aturan fuzzy atau menambah data training</li>
                    <li>Lakukan analisis mendalam terhadap kesalahan klasifikasi yang terjadi</li>
                    <li>Pertimbangkan untuk menggunakan metode alternatif atau kombinasi metode</li>
                </ul>
                `}
            </div>
            
            <div class="narration-item info">
                <h5><i class="fas fa-info-circle"></i> Catatan Penting</h5>
                <p>Hasil evaluasi ini menggunakan ground truth yang dibuat berdasarkan kriteria sederhana (IPK ≥ 3.5, SKS ≥ 120, Persen DEK ≥ 80 untuk "Peluang Lulus Tinggi"). Untuk evaluasi yang lebih akurat, diperlukan data historis kelulusan mahasiswa yang sebenarnya.</p>
                <p>Model FIS ini dirancang untuk menangani ketidakpastian dalam data mahasiswa dan memberikan klasifikasi yang lebih fleksibel dibandingkan metode deterministik.</p>
            </div>
        </div>
    `;
    
    $('#evaluationNarrationContent').html(narrationHtml);
    $('#evaluationNarrationSection').show();
}

// Update summary section
function updateSummary(summary) {
    console.log('Updating summary:', summary);
    
    $('#evaluationTotalData').text(summary.total_data);
    $('#evaluationTrainingData').text(summary.training_data);
    $('#evaluationTestData').text(summary.test_data);
    $('#evaluationExecutionTime').text(summary.execution_time + ' detik');
}

// Update confusion matrix
function updateConfusionMatrix(confusionMatrix, kategoriMapping) {
    console.log('Updating confusion matrix:', confusionMatrix);
    
    // Update table cells
    for (let i = 0; i < confusionMatrix.length; i++) {
        for (let j = 0; j < confusionMatrix[i].length; j++) {
            const cellId = `evaluation-cm-${i}-${j}`;
            const value = confusionMatrix[i][j];
            
            // Add color coding based on value
            let cellClass = '';
            if (i === j) {
                // Diagonal elements (correct predictions)
                cellClass = 'correct-prediction';
            } else {
                // Off-diagonal elements (incorrect predictions)
                cellClass = 'incorrect-prediction';
            }
            
            $(`#${cellId}`)
                .text(value)
                .removeClass('correct-prediction incorrect-prediction')
                .addClass(cellClass);
        }
    }
}

// Update metrics
function updateMetrics(metrics) {
    console.log('Updating metrics:', metrics);
    
    // Overall metrics
    $('#evaluationAccuracy').text((metrics.accuracy * 100).toFixed(2) + '%');
    $('#evaluationPrecisionMacro').text((metrics.precision_macro * 100).toFixed(2) + '%');
    $('#evaluationRecallMacro').text((metrics.recall_macro * 100).toFixed(2) + '%');
    $('#evaluationF1Macro').text((metrics.f1_macro * 100).toFixed(2) + '%');
    
    // Per-class metrics
    for (let i = 0; i < 3; i++) {
        $(`#evaluationPrecision${i}`).text((metrics.precision[i] * 100).toFixed(2) + '%');
        $(`#evaluationRecall${i}`).text((metrics.recall[i] * 100).toFixed(2) + '%');
        $(`#evaluationF1${i}`).text((metrics.f1[i] * 100).toFixed(2) + '%');
    }
}

// Initialize charts
function initializeCharts() {
    console.log('Initializing charts...');
    
    // Confusion Matrix Chart
    const confusionCtx = document.getElementById('evaluationConfusionMatrixChart');
    if (confusionCtx) {
        confusionMatrixChart = new Chart(confusionCtx, {
            type: 'bar',
            data: {
                labels: ['Peluang Lulus Tinggi', 'Peluang Lulus Sedang', 'Peluang Lulus Kecil'],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Confusion Matrix Heatmap'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Actual'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Predicted'
                        }
                    }
                }
            }
        });
    }
    
    // Metrics Chart
    const metricsCtx = document.getElementById('evaluationMetricsChart');
    if (metricsCtx) {
        metricsChart = new Chart(metricsCtx, {
            type: 'bar',
            data: {
                labels: ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
                datasets: [{
                    label: 'Overall Metrics',
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(255, 99, 132, 0.8)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        ticks: {
                            callback: function(value) {
                                return (value * 100).toFixed(0) + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

// Update charts
function updateCharts(data) {
    console.log('Updating charts with data:', data);
    
    // Update confusion matrix chart
    if (confusionMatrixChart) {
        const confusionData = data.confusion_matrix;
        const labels = ['Peluang Lulus Tinggi', 'Peluang Lulus Sedang', 'Peluang Lulus Kecil'];
        
        confusionMatrixChart.data.datasets = labels.map((label, index) => ({
            label: label,
            data: confusionData[index],
            backgroundColor: getConfusionMatrixColor(index),
            borderColor: getConfusionMatrixColor(index),
            borderWidth: 1
        }));
        
        confusionMatrixChart.update();
    }
    
    // Update metrics chart
    if (metricsChart) {
        const metrics = data.metrics;
        const labels = ['Accuracy', 'Precision', 'Recall', 'F1-Score'];
        
        metricsChart.data.datasets = [
            {
                label: 'Overall Metrics',
                data: [
                    metrics.accuracy,
                    metrics.precision_macro,
                    metrics.recall_macro,
                    metrics.f1_macro
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(255, 99, 132, 0.8)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }
        ];
        
        metricsChart.update();
    }
}

// Get confusion matrix color
function getConfusionMatrixColor(index) {
    const colors = [
        'rgba(40, 167, 69, 0.8)',   // Green for Peluang Lulus Tinggi
        'rgba(255, 193, 7, 0.8)',   // Yellow for Peluang Lulus Sedang
        'rgba(220, 53, 69, 0.8)'    // Red for Peluang Lulus Kecil
    ];
    return colors[index] || 'rgba(108, 117, 125, 0.8)';
}

// Initialize tooltips
function initializeTooltips() {
    // Add tooltips to metric items
    $('.metric-item').each(function() {
        const label = $(this).find('.metric-label').text();
        const tooltipText = getMetricTooltip(label);
        
        $(this).attr('title', tooltipText);
    });
}

// Get metric tooltip text
function getMetricTooltip(metricName) {
    const tooltips = {
        'Accuracy:': 'Proporsi prediksi yang benar dari total prediksi',
        'Precision (Macro):': 'Rata-rata precision untuk semua kelas',
        'Recall (Macro):': 'Rata-rata recall untuk semua kelas',
        'F1-Score (Macro):': 'Rata-rata F1-score untuk semua kelas',
        'Precision:': 'Proporsi prediksi positif yang benar',
        'Recall:': 'Proporsi kasus positif yang berhasil diprediksi',
        'F1-Score:': 'Rata-rata harmonik dari precision dan recall'
    };
    
    return tooltips[metricName] || 'Tidak ada deskripsi tersedia';
}

// Show loading indicator
function showLoading(show) {
    if (show) {
        $('#evaluationLoadingIndicator').show();
    } else {
        $('#evaluationLoadingIndicator').hide();
    }
}

// Show info message
function showInfoMessage(message) {
    showNotification('info', 'Informasi', message);
}

// Show success message
function showSuccessMessage(message) {
    showNotification('success', 'Berhasil', message);
}

// Show error message
function showErrorMessage(message) {
    showNotification('error', 'Error', message);
}

// Show notification
function showNotification(type, title, message) {
    // Create notification element
    const notification = $(`
        <div class="notification notification-${type}">
            <div class="notification-header">
                <i class="fas fa-${getNotificationIcon(type)}"></i>
                <span>${title}</span>
                <button class="notification-close">&times;</button>
            </div>
            <div class="notification-body">
                ${message}
            </div>
        </div>
    `);
    
    // Add to page
    $('body').append(notification);
    
    // Show notification
    setTimeout(() => {
        notification.addClass('show');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.removeClass('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    // Close button handler
    notification.find('.notification-close').click(function() {
        notification.removeClass('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

// Get notification icon
function getNotificationIcon(type) {
    const icons = {
        'info': 'info-circle',
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'times-circle'
    };
    return icons[type] || 'info-circle';
}

// Export evaluation data
function exportEvaluationData() {
    if (!evaluationData) {
        showErrorMessage('Tidak ada data evaluasi untuk diekspor');
        return;
    }
    
    const dataStr = JSON.stringify(evaluationData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `fis_evaluation_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Print evaluation report
function printEvaluationReport() {
    if (!evaluationData) {
        showErrorMessage('Tidak ada data evaluasi untuk dicetak');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    const reportContent = generateEvaluationReport(evaluationData);
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Laporan Evaluasi FIS</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .metric { margin: 10px 0; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            ${reportContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// Generate evaluation report
function generateEvaluationReport(data) {
    return `
        <div class="header">
            <h1>Laporan Evaluasi Metode FIS</h1>
            <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
        </div>
        
        <div class="section">
            <h2>Ringkasan Evaluasi</h2>
            <div class="metric">Total Data: ${data.summary.total_data}</div>
            <div class="metric">Training Data: ${data.summary.training_data}</div>
            <div class="metric">Test Data: ${data.summary.test_data}</div>
            <div class="metric">Waktu Eksekusi: ${data.summary.execution_time} detik</div>
        </div>
        
        <div class="section">
            <h2>Metrik Evaluasi</h2>
            <div class="metric">Accuracy: ${(data.metrics.accuracy * 100).toFixed(2)}%</div>
            <div class="metric">Precision (Macro): ${(data.metrics.precision_macro * 100).toFixed(2)}%</div>
            <div class="metric">Recall (Macro): ${(data.metrics.recall_macro * 100).toFixed(2)}%</div>
            <div class="metric">F1-Score (Macro): ${(data.metrics.f1_macro * 100).toFixed(2)}%</div>
        </div>
        
        <div class="section">
            <h2>Confusion Matrix</h2>
            <table>
                <tr>
                    <th></th>
                    <th>Peluang Lulus Tinggi</th>
                    <th>Peluang Lulus Sedang</th>
                    <th>Peluang Lulus Kecil</th>
                </tr>
                ${data.confusion_matrix.map((row, i) => `
                    <tr>
                        <td><strong>${Object.values(data.kategori_mapping)[i]}</strong></td>
                        ${row.map(cell => `<td>${cell}</td>`).join('')}
                    </tr>
                `).join('')}
            </table>
        </div>
    `;
}

// Initialize saved evaluations grid
function initializeSavedEvaluationsGrid() {
    console.log('Initializing saved evaluations grid...');
    
    // Initialize Kendo UI Grid for saved evaluations
    $("#evaluationSavedGrid").kendoGrid({
        dataSource: {
            transport: {
                read: {
                    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + '/evaluations',
                    dataType: "json",
                    success: function(response) {
                        console.log('Grid data loaded:', response);
                    },
                    error: function(xhr, status, error) {
                        console.error('Grid data error:', error);
                    }
                },
                destroy: {
                    url: function(data) {
                        return CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + `/evaluations/${data.id}`;
                    },
                    type: "DELETE"
                }
            },
            schema: {
                data: "data",
                total: "total",
                model: {
                    id: "id",
                    fields: {
                        id: { type: "number" },
                        evaluation_name: { type: "string" },
                        test_size: { type: "number" },
                        random_state: { type: "number" },
                        accuracy: { type: "number" },
                        precision_macro: { type: "number" },
                        recall_macro: { type: "number" },
                        f1_macro: { type: "number" },
                        total_data: { type: "number" },
                        test_data: { type: "number" },
                        execution_time: { type: "number" },
                        created_at: { type: "date" }
                    }
                }
            },
            pageSize: 10
        },
        height: 400,
        scrollable: true,
        sortable: true,
        filterable: true,
        pageable: {
            input: true,
            numeric: false
        },
        columns: [
            { field: "id", title: "ID", width: 60 },
            { field: "evaluation_name", title: "Nama Evaluasi", width: 200 },
            { 
                field: "accuracy", 
                title: "Accuracy", 
                width: 100,
                template: "#= (metrics.accuracy * 100).toFixed(2) + '%' #"
            },
            { 
                field: "precision_macro", 
                title: "Precision", 
                width: 100,
                template: "#= (metrics.precision_macro * 100).toFixed(2) + '%' #"
            },
            { 
                field: "recall_macro", 
                title: "Recall", 
                width: 100,
                template: "#= (metrics.recall_macro * 100).toFixed(2) + '%' #"
            },
            { 
                field: "f1_macro", 
                title: "F1-Score", 
                width: 100,
                template: "#= (metrics.f1_macro * 100).toFixed(2) + '%' #"
            },
            { 
                field: "test_size", 
                title: "Test Size", 
                width: 100,
                template: "#= (test_size * 100).toFixed(0) + '%' #"
            },
            { 
                field: "total_data", 
                title: "Total Data", 
                width: 100,
                template: "#= summary.total_data #"
            },
            { 
                field: "execution_time", 
                title: "Waktu (s)", 
                width: 100,
                template: "#= summary.execution_time #"
            },
            { 
                field: "created_at", 
                title: "Tanggal Dibuat", 
                width: 150,
                template: "#= kendo.toString(new Date(created_at), 'yyyy-MM-dd HH:mm') #"
            },
            {
                command: [
                    { name: "view", text: "View", click: viewEvaluation },
                    { name: "destroy", text: "Delete" }
                ],
                width: 150
            }
        ]
    });
}

// View evaluation function for grid
function viewEvaluation(e) {
    e.preventDefault();
    const dataItem = this.dataItem($(e.currentTarget).closest("tr"));
    loadEvaluationById(dataItem.id);
} 