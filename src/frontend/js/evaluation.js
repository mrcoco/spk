// Evaluation.js - Script untuk halaman evaluasi FIS
$(document).ready(function() {
    console.log('🚀 Evaluation FIS page loaded');
    
    // Initialize evaluation components
    initializeEvaluationComponents();
    
    // Initialize event handlers
    initializeEvaluationHandlers();
    
    // Load initial state
    loadInitialState();
    
    // Load saved evaluations
    loadSavedEvaluations();
});

// Global variables
let confusionMatrixChart = null;
let metricsChart = null;
let evaluationData = null;

// Initialize evaluation components
function initializeEvaluationComponents() {
    console.log('Initializing evaluation components...');
    
    // Initialize charts
    initializeCharts();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize saved evaluations section
    initializeSavedEvaluationsSection();
}

// Initialize event handlers
function initializeEvaluationHandlers() {
    console.log('Initializing evaluation handlers...');
    
    // Calculate button handler
    $('#calculateBtn').click(function() {
        console.log('Calculate button clicked');
        performEvaluation();
    });
    
    // Form input handlers
    $('#testSize, #randomState').on('change', function() {
        console.log('Form input changed:', {
            testSize: $('#testSize').val(),
            randomState: $('#randomState').val()
        });
    });
    
    // Save to database checkbox handler
    $('#saveToDb').on('change', function() {
        const isChecked = $(this).is(':checked');
        $('#evaluationName, #evaluationNotes').prop('disabled', !isChecked);
        
        if (isChecked) {
            $('#evaluationName').val(`FIS_Evaluation_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`);
        } else {
            $('#evaluationName').val('');
            $('#evaluationNotes').val('');
        }
    });
}

// Load initial state
function loadInitialState() {
    console.log('Loading initial state...');
    
    // Show info message
    showInfoMessage('Silakan atur parameter evaluasi dan klik "Hitung Evaluasi FIS" untuk memulai evaluasi.');
}

// Load saved evaluations
function loadSavedEvaluations() {
    console.log('Loading saved evaluations...');
    
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + '/evaluations',
        type: 'GET',
        timeout: 10000,
        success: function(response) {
            console.log('Saved evaluations loaded:', response);
            displaySavedEvaluations(response);
        },
        error: function(xhr, status, error) {
            console.error('Error loading saved evaluations:', error);
            showErrorMessage('Gagal memuat daftar evaluasi yang tersimpan');
        }
    });
}

// Initialize saved evaluations section
function initializeSavedEvaluationsSection() {
    // Add saved evaluations section to the page
    const savedEvaluationsSection = `
        <div class="evaluation-section">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-database"></i> Evaluasi yang Tersimpan</h3>
                </div>
                <div class="card-body">
                    <div id="savedEvaluationsContainer">
                        <div class="loading-placeholder">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Memuat evaluasi yang tersimpan...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insert before interpretation section
    $('.evaluation-section:last').before(savedEvaluationsSection);
}

// Display saved evaluations
function displaySavedEvaluations(response) {
    const container = $('#savedEvaluationsContainer');
    
    if (response.total === 0) {
        container.html(`
            <div class="empty-state">
                <i class="fas fa-database"></i>
                <h4>Tidak ada evaluasi yang tersimpan</h4>
                <p>Evaluasi yang Anda lakukan akan disimpan di sini jika opsi "Simpan ke Database" diaktifkan.</p>
            </div>
        `);
        return;
    }
    
    let html = `
        <div class="saved-evaluations-grid">
            <div class="evaluations-summary">
                <span class="summary-text">Total: ${response.total} evaluasi</span>
            </div>
    `;
    
    response.data.forEach(evaluation => {
        const accuracyPercent = (evaluation.metrics.accuracy * 100).toFixed(2);
        const f1Percent = (evaluation.metrics.f1_macro * 100).toFixed(2);
        const createdAt = new Date(evaluation.created_at).toLocaleString('id-ID');
        
        html += `
            <div class="evaluation-card" data-evaluation-id="${evaluation.id}">
                <div class="evaluation-header">
                    <h4>${evaluation.evaluation_name}</h4>
                    <div class="evaluation-actions">
                        <button class="btn btn-sm btn-primary load-evaluation" title="Muat Evaluasi">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-evaluation" title="Hapus Evaluasi">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="evaluation-details">
                    <div class="detail-row">
                        <span class="detail-label">Accuracy:</span>
                        <span class="detail-value ${getAccuracyClass(evaluation.metrics.accuracy)}">${accuracyPercent}%</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">F1-Score:</span>
                        <span class="detail-value">${f1Percent}%</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Test Size:</span>
                        <span class="detail-value">${(evaluation.test_size * 100).toFixed(0)}%</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Data:</span>
                        <span class="detail-value">${evaluation.summary.total_data} total, ${evaluation.summary.test_data} test</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Waktu:</span>
                        <span class="detail-value">${evaluation.summary.execution_time} detik</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Tanggal:</span>
                        <span class="detail-value">${createdAt}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.html(html);
    
    // Add event handlers for evaluation cards
    $('.load-evaluation').click(function() {
        const evaluationId = $(this).closest('.evaluation-card').data('evaluation-id');
        loadEvaluationById(evaluationId);
    });
    
    $('.delete-evaluation').click(function() {
        const evaluationId = $(this).closest('.evaluation-card').data('evaluation-id');
        deleteEvaluationById(evaluationId);
    });
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
    $('#totalData, #trainingData, #testData, #executionTime').text('-');
    
    // Clear confusion matrix
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            $(`#cm-${i}-${j}`).text('-').removeClass('correct-prediction incorrect-prediction');
        }
    }
    
    // Clear metrics
    $('#accuracy, #precision-macro, #recall-macro, #f1-macro').text('-');
    for (let i = 0; i < 3; i++) {
        $(`#precision-${i}, #recall-${i}, #f1-${i}`).text('-');
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
    
    // Hide results
    $('.evaluation-section').not(':first').hide();
}

// Perform evaluation
function performEvaluation() {
    console.log('Starting FIS evaluation...');
    
    // Get parameters
    const testSize = parseFloat($('#testSize').val()) / 100;
    const randomState = parseInt($('#randomState').val());
    const saveToDb = $('#saveToDb').is(':checked');
    const evaluationName = $('#evaluationName').val();
    const evaluationNotes = $('#evaluationNotes').val();
    
    // Validate parameters
    if (testSize < 0.1 || testSize > 0.5) {
        showErrorMessage('Ukuran data test harus antara 10% - 50%');
        return;
    }
    
    if (randomState < 0) {
        showErrorMessage('Random state harus positif');
        return;
    }
    
    if (saveToDb && !evaluationName.trim()) {
        showErrorMessage('Nama evaluasi harus diisi jika menyimpan ke database');
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
    
    if (saveToDb) {
        requestData.evaluation_name = evaluationName;
        if (evaluationNotes.trim()) {
            requestData.evaluation_notes = evaluationNotes;
        }
    }
    
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
                showSuccessMessage(`Evaluasi FIS berhasil diselesaikan dan disimpan dengan nama "${response.evaluation_name}"!`);
                // Reload saved evaluations
                loadSavedEvaluations();
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
    
    // Show results
    $('.evaluation-section').show();
}

// Update summary section
function updateSummary(summary) {
    console.log('Updating summary:', summary);
    
    $('#totalData').text(summary.total_data);
    $('#trainingData').text(summary.training_data);
    $('#testData').text(summary.test_data);
    $('#executionTime').text(summary.execution_time + ' detik');
}

// Update confusion matrix
function updateConfusionMatrix(confusionMatrix, kategoriMapping) {
    console.log('Updating confusion matrix:', confusionMatrix);
    
    // Update table cells
    for (let i = 0; i < confusionMatrix.length; i++) {
        for (let j = 0; j < confusionMatrix[i].length; j++) {
            const cellId = `cm-${i}-${j}`;
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
    $('#accuracy').text((metrics.accuracy * 100).toFixed(2) + '%');
    $('#precision-macro').text((metrics.precision_macro * 100).toFixed(2) + '%');
    $('#recall-macro').text((metrics.recall_macro * 100).toFixed(2) + '%');
    $('#f1-macro').text((metrics.f1_macro * 100).toFixed(2) + '%');
    
    // Per-class metrics
    for (let i = 0; i < 3; i++) {
        $(`#precision-${i}`).text((metrics.precision[i] * 100).toFixed(2) + '%');
        $(`#recall-${i}`).text((metrics.recall[i] * 100).toFixed(2) + '%');
        $(`#f1-${i}`).text((metrics.f1[i] * 100).toFixed(2) + '%');
    }
}

// Initialize charts
function initializeCharts() {
    console.log('Initializing charts...');
    
    // Confusion Matrix Chart
    const confusionCtx = document.getElementById('confusionMatrixChart');
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
    const metricsCtx = document.getElementById('metricsChart');
    if (metricsCtx) {
        metricsChart = new Chart(metricsCtx, {
            type: 'radar',
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
                        text: 'Metrics Comparison'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 1,
                        ticks: {
                            stepSize: 0.2
                        }
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
        const labels = ['Peluang Lulus Tinggi', 'Peluang Lulus Sedang', 'Peluang Lulus Kecil'];
        
        metricsChart.data.datasets = [
            {
                label: 'Precision',
                data: metrics.precision,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 2
            },
            {
                label: 'Recall',
                data: metrics.recall,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2
            },
            {
                label: 'F1-Score',
                data: metrics.f1,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2
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
        $('#loadingIndicator').show();
        $('#calculateBtn').prop('disabled', true).text('Menghitung...');
    } else {
        $('#loadingIndicator').hide();
        $('#calculateBtn').prop('disabled', false).text('Hitung Evaluasi FIS');
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

// Add export and print buttons to the page
$(document).ready(function() {
    // Add save to database options
    const saveOptions = `
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" id="saveToDb" checked>
                <span class="checkmark"></span>
                Simpan ke Database
            </label>
        </div>
        <div class="form-group">
            <label for="evaluationName">Nama Evaluasi:</label>
            <input type="text" id="evaluationName" class="form-control" placeholder="Masukkan nama evaluasi">
            <small class="form-text">Nama untuk mengidentifikasi evaluasi ini</small>
        </div>
        <div class="form-group">
            <label for="evaluationNotes">Catatan Evaluasi:</label>
            <textarea id="evaluationNotes" class="form-control" rows="3" placeholder="Tambahkan catatan tentang evaluasi ini (opsional)"></textarea>
        </div>
    `;
    
    // Insert save options after random state
    $('#randomState').closest('.form-group').after(saveOptions);
    
    // Add export button
    const exportBtn = $(`
        <button id="exportBtn" class="btn btn-secondary" style="margin-left: 10px;">
            <i class="fas fa-download"></i>
            Ekspor Data
        </button>
    `);
    
    // Add print button
    const printBtn = $(`
        <button id="printBtn" class="btn btn-secondary" style="margin-left: 10px;">
            <i class="fas fa-print"></i>
            Cetak Laporan
        </button>
    `);
    
    // Insert buttons after calculate button
    $('#calculateBtn').after(exportBtn).after(printBtn);
    
    // Add event handlers
    $('#exportBtn').click(exportEvaluationData);
    $('#printBtn').click(printEvaluationReport);
}); 