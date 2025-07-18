// Debug: Memastikan script evaluation.js dimuat
console.log('🚀 evaluation.js mulai dimuat...');

// Fallback untuk showNotification jika tidak tersedia
if (typeof showNotification === 'undefined') {
    console.warn('⚠️ showNotification tidak tersedia, menggunakan fallback');
    window.showNotification = function(title, message, type) {
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        if (type === 'error') {
            alert(`${title}: ${message}`);
        }
    };
}

// Fungsi untuk menunggu CONFIG tersedia
function waitForConfig() {
    console.log('⏳ waitForConfig dipanggil...');
    return new Promise((resolve, reject) => {
        if (typeof CONFIG !== 'undefined') {
            console.log('✅ CONFIG sudah tersedia di evaluation.js');
            resolve();
            return;
        }

        console.log('⚠️ CONFIG belum tersedia, menunggu...');
        let attempts = 0;
        const maxAttempts = 100;

        const checkConfig = setInterval(() => {
            attempts++;
            console.log(`🔄 Mencoba ke-${attempts}: CONFIG status = ${typeof CONFIG !== 'undefined'}`);
            
            if (typeof CONFIG !== 'undefined') {
                clearInterval(checkConfig);
                console.log('✅ CONFIG berhasil dimuat di evaluation.js');
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkConfig);
                console.error('❌ CONFIG tidak dapat dimuat dalam waktu yang ditentukan');
                reject(new Error('CONFIG timeout'));
            }
        }, 100);
    });
}

// Inisialisasi halaman evaluasi
function initializeEvaluation() {
    console.log('🔧 initializeEvaluation dipanggil...');
    
    // Tunggu sampai CONFIG tersedia
    waitForConfig().then(() => {
        console.log('🎯 Mulai inisialisasi komponen evaluasi...');
        setupEventHandlers();
        console.log('✅ Inisialisasi komponen evaluasi selesai');
    }).catch(error => {
        console.error('❌ Failed to initialize evaluation components:', error);
    });
}

// Setup event handlers
function setupEventHandlers() {
    console.log('🔧 setupEventHandlers dipanggil...');
    
    // Event handler untuk tombol hitung evaluasi
    $("#calculateBtn").click(function() {
        console.log('🔧 Tombol hitung evaluasi diklik');
        calculateEvaluation();
    });
}

// Fungsi untuk menghitung evaluasi
async function calculateEvaluation() {
    console.log('🔧 calculateEvaluation dipanggil...');
    
    // Tampilkan loading
    showLoading(true);
    
    try {
        // Ambil parameter dari form
        const testSize = parseInt($("#testSize").val()) || 30;
        const randomState = parseInt($("#randomState").val()) || 42;
        
        console.log('🔧 Parameter evaluasi:', { testSize, randomState });
        
        // Panggil API untuk menghitung evaluasi
        const response = await $.ajax({
            url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FIS) + "/evaluate",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                test_size: testSize / 100,
                random_state: randomState
            })
        });
        
        console.log('🔧 Response evaluasi:', response);
        
        // Tampilkan hasil evaluasi
        displayEvaluationResults(response);
        
        showNotification(
            "Sukses",
            "Evaluasi berhasil dihitung",
            "success"
        );
        
    } catch (error) {
        console.error('🔧 Error dalam evaluasi:', error);
        
        let errorMessage = "Terjadi kesalahan saat menghitung evaluasi";
        if (error.responseJSON && error.responseJSON.detail) {
            errorMessage = error.responseJSON.detail;
        }
        
        showNotification(
            "Error",
            errorMessage,
            "error"
        );
    } finally {
        showLoading(false);
    }
}

// Fungsi untuk menampilkan hasil evaluasi
function displayEvaluationResults(results) {
    console.log('🔧 displayEvaluationResults dipanggil...');
    
    // Update confusion matrix
    updateConfusionMatrix(results.confusion_matrix);
    
    // Update metrics
    updateMetrics(results.metrics);
    
    // Update summary
    updateSummary(results.summary);
    
    // Update visualizations
    updateVisualizations(results);
}

// Fungsi untuk update confusion matrix
function updateConfusionMatrix(confusionMatrix) {
    console.log('🔧 updateConfusionMatrix dipanggil...');
    
    const labels = ['Sangat Baik', 'Baik', 'Cukup', 'Kurang'];
    
    // Update tabel confusion matrix
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const cellId = `cm-${i}-${j}`;
            const value = confusionMatrix[i][j];
            $(`#${cellId}`).text(value);
            
            // Tambahkan warna berdasarkan nilai
            const cell = $(`#${cellId}`);
            cell.removeClass('cm-high cm-medium cm-low');
            
            if (i === j) {
                // Diagonal (true positive)
                if (value > 0) {
                    cell.addClass('cm-high');
                }
            } else {
                // Off-diagonal (false positive/negative)
                if (value > 0) {
                    cell.addClass('cm-low');
                }
            }
        }
    }
}

// Fungsi untuk update metrics
function updateMetrics(metrics) {
    console.log('🔧 updateMetrics dipanggil...');
    
    // Update overall metrics
    $("#accuracy").text((metrics.accuracy * 100).toFixed(2) + '%');
    $("#precision-macro").text((metrics.precision_macro * 100).toFixed(2) + '%');
    $("#recall-macro").text((metrics.recall_macro * 100).toFixed(2) + '%');
    $("#f1-macro").text((metrics.f1_macro * 100).toFixed(2) + '%');
    
    // Update per-class metrics
    for (let i = 0; i < 4; i++) {
        $(`#precision-${i}`).text((metrics.precision[i] * 100).toFixed(2) + '%');
        $(`#recall-${i}`).text((metrics.recall[i] * 100).toFixed(2) + '%');
        $(`#f1-${i}`).text((metrics.f1[i] * 100).toFixed(2) + '%');
    }
}

// Fungsi untuk update summary
function updateSummary(summary) {
    console.log('🔧 updateSummary dipanggil...');
    
    $("#totalData").text(summary.total_data);
    $("#trainingData").text(summary.training_data);
    $("#testData").text(summary.test_data);
    $("#executionTime").text(summary.execution_time + ' detik');
}

// Fungsi untuk update visualizations
function updateVisualizations(results) {
    console.log('🔧 updateVisualizations dipanggil...');
    
    // Update confusion matrix heatmap
    updateConfusionMatrixChart(results.confusion_matrix);
    
    // Update metrics comparison chart
    updateMetricsChart(results.metrics);
}

// Fungsi untuk update confusion matrix chart
function updateConfusionMatrixChart(confusionMatrix) {
    console.log('🔧 updateConfusionMatrixChart dipanggil...');
    
    const ctx = document.getElementById('confusionMatrixChart').getContext('2d');
    
    // Destroy existing chart if exists
    if (window.confusionMatrixChart) {
        window.confusionMatrixChart.destroy();
    }
    
    const labels = ['Sangat Baik', 'Baik', 'Cukup', 'Kurang'];
    
    // Prepare data for heatmap
    const data = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            data.push({
                x: labels[j],
                y: labels[i],
                v: confusionMatrix[i][j]
            });
        }
    }
    
    window.confusionMatrixChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Confusion Matrix',
                data: data,
                backgroundColor: function(context) {
                    const value = context.raw.v;
                    const maxValue = Math.max(...confusionMatrix.flat());
                    const normalizedValue = value / maxValue;
                    
                    if (context.parsed.x === context.parsed.y) {
                        // Diagonal - true positives
                        return `rgba(76, 175, 80, ${0.3 + normalizedValue * 0.7})`;
                    } else {
                        // Off-diagonal - false positives/negatives
                        return `rgba(244, 67, 54, ${0.3 + normalizedValue * 0.7})`;
                    }
                },
                pointRadius: function(context) {
                    const value = context.raw.v;
                    const maxValue = Math.max(...confusionMatrix.flat());
                    const normalizedValue = value / maxValue;
                    return 10 + normalizedValue * 20;
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Predicted'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Actual'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Value: ${context.raw.v}`;
                        }
                    }
                }
            }
        }
    });
}

// Fungsi untuk update metrics chart
function updateMetricsChart(metrics) {
    console.log('🔧 updateMetricsChart dipanggil...');
    
    const ctx = document.getElementById('metricsChart').getContext('2d');
    
    // Destroy existing chart if exists
    if (window.metricsChart) {
        window.metricsChart.destroy();
    }
    
    const labels = ['Sangat Baik', 'Baik', 'Cukup', 'Kurang'];
    
    window.metricsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Precision',
                    data: metrics.precision.map(p => p * 100),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Recall',
                    data: metrics.recall.map(r => r * 100),
                    backgroundColor: 'rgba(255, 206, 86, 0.8)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                },
                {
                    label: 'F1-Score',
                    data: metrics.f1.map(f => f * 100),
                    backgroundColor: 'rgba(75, 192, 192, 0.8)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Fungsi untuk menampilkan/menyembunyikan loading
function showLoading(show) {
    if (show) {
        $("#loadingIndicator").show();
        $("#calculateBtn").prop('disabled', true);
    } else {
        $("#loadingIndicator").hide();
        $("#calculateBtn").prop('disabled', false);
    }
}

// Export fungsi untuk digunakan di halaman lain
window.initializeEvaluation = initializeEvaluation;
window.calculateEvaluation = calculateEvaluation; 