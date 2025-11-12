// Comparison Section dengan Kendo Grid

// Inisialisasi Comparison Section
function initializeComparison() {
    console.log("Initializing Comparison section...");
    
    // Prevent multiple initializations
    if (window._comparisonInitialized) {
        console.log("Comparison section already initialized, skipping...");
        return;
    }
    
    console.log("jQuery available:", typeof $ !== 'undefined');
    console.log("Kendo UI available:", typeof kendo !== 'undefined');
    console.log("CONFIG available:", typeof CONFIG !== 'undefined');
    console.log("CONFIG.ENDPOINTS:", CONFIG?.ENDPOINTS);
    console.log("CONFIG.ENDPOINTS.FUZZY:", CONFIG?.ENDPOINTS?.FUZZY);
    console.log("CONFIG.ENDPOINTS.SAW:", CONFIG?.ENDPOINTS?.SAW);
    
    // Check if section is visible before loading data
    const section = $('#comparisonSection');
    console.log("Comparison section exists:", section.length > 0);
    console.log("Comparison section visible:", section.is(':visible'));
    
    // Mark as initialized
    window._comparisonInitialized = true;
    
    // Setup event listeners first
    setupComparisonEventListeners();
    
    // Load data with a small delay to ensure everything is ready
    setTimeout(() => {
        loadComparisonData();
    }, 500);
}

// Ambil data perbandingan dari API - menggunakan evaluasi actual
function loadComparisonData() {
    console.log('=== LOADING COMPARISON DATA FROM ACTUAL EVALUATION ===');
    
    showComparisonLoading();
    
    // Load data dari evaluasi FIS dan SAW actual secara paralel
    Promise.all([
        loadFISActualEvaluation(),
        loadSAWActualEvaluation()
    ]).then(([fisData, sawData]) => {
        console.log('FIS Actual Data:', fisData);
        console.log('SAW Actual Data:', sawData);
        
        // Gabungkan data FIS dan SAW untuk perbandingan
        const comparisonData = combineEvaluationData(fisData, sawData);
        
        // Simpan response lengkap untuk akses data
        window._fisActualData = fisData;
        window._sawActualData = sawData;
        window._comparisonData = comparisonData;
        
        // Update UI
        updateComparisonStatsFromActual(fisData, sawData, comparisonData);
        updateComparisonChartFromActual(fisData, sawData);
        updateComparisonConfusionMatrix(fisData, sawData);
        initializeComparisonGrid(comparisonData);
            
            hideComparisonLoading();
    }).catch(error => {
        console.error('=== COMPARISON DATA ERROR ===', error);
        hideComparisonLoading();
        showComparisonError("Error loading comparison data: " + error.message);
    });
}

// Load FIS Actual Evaluation data
function loadFISActualEvaluation() {
    return new Promise((resolve, reject) => {
        const url = CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY + '/evaluate-with-actual-status');
        console.log('Loading FIS Actual Evaluation from:', url);
        console.log('Using FULL DATA evaluation (no split)');
        
        $.ajax({
            url: url,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                // Tidak ada test_size dan random_state
                // Backend akan menggunakan semua data berlabel
            }),
            timeout: 60000,
            beforeSend: function() {
                console.log('Sending FIS evaluation request...');
            },
            success: function(response) {
                console.log('FIS Evaluation response received:', response);
                // Backend returns response.result, not response.evaluation
                if (response && response.result) {
                    console.log('FIS Evaluation data valid, resolving...');
                    resolve(response.result);
                } else if (response && response.evaluation) {
                    // Fallback for other endpoint formats
                    console.log('FIS Evaluation data valid (evaluation format), resolving...');
                    resolve(response.evaluation);
            } else {
                    console.error('Invalid FIS evaluation response format:', response);
                    reject(new Error('Invalid FIS evaluation response'));
                }
            },
            error: function(xhr, status, error) {
                console.error('FIS Evaluation API error:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    error: error,
                    responseText: xhr.responseText
                });
                reject(new Error('FIS Evaluation API error: ' + error + ' (Status: ' + xhr.status + ')'));
            }
        });
    });
}

// Load SAW Actual Evaluation data
function loadSAWActualEvaluation() {
    return new Promise((resolve, reject) => {
        const url = CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW + '/evaluate-actual');
        console.log('Loading SAW Actual Evaluation from:', url);
        
        $.ajax({
            url: url,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                weights: { ipk: 0.35, sks: 0.325, dek: 0.325 },
                test_size: 1.0,
                random_state: 42,
                save_to_db: false
            }),
            timeout: 60000,
            beforeSend: function() {
                console.log('Sending SAW evaluation request...');
            },
            success: function(response) {
                console.log('SAW Evaluation response received:', response);
                if (response && response.evaluation) {
                    console.log('SAW Evaluation data valid, resolving...');
                    resolve(response.evaluation);
                } else {
                    console.error('Invalid SAW evaluation response format');
                    reject(new Error('Invalid SAW evaluation response'));
            }
        },
        error: function(xhr, status, error) {
                console.error('SAW Evaluation API error:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    error: error,
                    responseText: xhr.responseText
                });
                reject(new Error('SAW Evaluation API error: ' + error + ' (Status: ' + xhr.status + ')'));
            }
        });
    });
}

// Combine FIS and SAW evaluation data for comparison
function combineEvaluationData(fisData, sawData) {
    console.log('Combining FIS and SAW evaluation data...');
    console.log('FIS Data structure:', Object.keys(fisData));
    console.log('SAW Data structure:', Object.keys(sawData));
    
    const comparisonData = [];
    
    // Ambil results dari FIS dan SAW - support multiple formats
    // Prioritas: full_data > results > sample_data
    let fisResults = fisData.full_data || fisData.results || fisData.sample_data || [];
    let sawResults = sawData.full_data || sawData.results || sawData.sample_data || [];
    
    console.log('FIS Results:', fisResults.length, 'items');
    console.log('SAW Results:', sawResults.length, 'items');
    console.log('Using FIS data from:', fisData.full_data ? 'full_data' : (fisData.results ? 'results' : 'sample_data'));
    console.log('Using SAW data from:', sawData.full_data ? 'full_data' : (sawData.results ? 'results' : 'sample_data'));
    
    if (fisResults.length === 0 || sawResults.length === 0) {
        console.warn('No data available for comparison');
        console.log('FIS Results sample:', fisResults[0]);
        console.log('SAW Results sample:', sawResults[0]);
        return comparisonData;
    }
    
    // Buat map SAW results berdasarkan NIM untuk lookup cepat
    const sawMap = {};
    sawResults.forEach(item => {
        sawMap[item.nim] = item;
    });
    
    // Gabungkan data berdasarkan NIM
    fisResults.forEach(fisItem => {
        const sawItem = sawMap[fisItem.nim];
        
        if (sawItem) {
            const fis_category = fisItem.predicted_class || fisItem.predicted_category || fisItem.fis_kategori;
            const saw_category = sawItem.predicted_class || sawItem.predicted_category || sawItem.saw_kategori;
            const is_consistent = fis_category === saw_category;
            
            // Ambil nilai asli
            let fis_value = fisItem.final_value || fisItem.fuzzy_score || fisItem.fis_nilai || 0;
            let saw_value = sawItem.final_value || sawItem.saw_score || sawItem.saw_nilai || 0;
            
            // Normalisasi ke skala yang sama (0-100)
            // FIS sudah dalam skala 0-100
            // SAW dalam skala 0-1, perlu dikali 100
            const fis_normalized = fis_value; // FIS sudah 0-100
            const saw_normalized = saw_value <= 1 ? saw_value * 100 : saw_value; // Convert SAW ke 0-100 jika masih 0-1
            
            // Hitung selisih setelah normalisasi
            const nilai_selisih = Math.abs(fis_normalized - saw_normalized);
            
            comparisonData.push({
                nim: fisItem.nim,
                nama: fisItem.nama,
                program_studi: fisItem.program_studi || sawItem.program_studi || null,
                ipk: fisItem.ipk,
                sks: fisItem.sks,
                persen_dek: fisItem.persen_dek,
                fis_kategori: fis_category,
                fis_nilai: fis_value, // Tetap simpan nilai asli untuk display
                fis_nilai_normalized: fis_normalized, // Simpan nilai normalized
                saw_kategori: saw_category,
                saw_nilai: saw_value, // Tetap simpan nilai asli untuk display
                saw_nilai_normalized: saw_normalized, // Simpan nilai normalized
                actual_status: fisItem.actual_status || sawItem.actual_status,
                actual_class: fisItem.actual_class || sawItem.actual_class,
                is_consistent: is_consistent,
                nilai_selisih: nilai_selisih, // Selisih dari nilai normalized
                selisih_category: getSelisihCategory(nilai_selisih),
                fis_correct: fisItem.is_correct,
                saw_correct: sawItem.is_correct
            });
        }
    });
    
    console.log('Combined comparison data:', comparisonData.length, 'items');
    if (comparisonData.length > 0) {
        console.log('Sample comparison item:', comparisonData[0]);
        console.log('Scale normalization: FIS(0-100), SAW(0-1 → 0-100)');
        console.log('Sample selisih calculation:', {
            fis_value: comparisonData[0].fis_nilai,
            fis_normalized: comparisonData[0].fis_nilai_normalized,
            saw_value: comparisonData[0].saw_nilai,
            saw_normalized: comparisonData[0].saw_nilai_normalized,
            selisih: comparisonData[0].nilai_selisih,
            category: comparisonData[0].selisih_category
        });
    }
    return comparisonData;
}

// Get selisih category
function getSelisihCategory(selisih) {
    // Threshold untuk skala 0-100 (setelah normalisasi)
    // Sebelumnya menggunakan skala 0-1, sekarang 0-100
    if (selisih <= 10) return "Sangat Mirip";      // <= 10%
    if (selisih <= 25) return "Mirip";             // <= 25%
    if (selisih <= 50) return "Cukup Berbeda";     // <= 50%
    return "Sangat Berbeda";                       // > 50%
}

// Loading state
function showComparisonLoading() {
    console.log('Showing comparison loading...');
    $(".comparison-container").find(".comparison-card, .comparison-chart-container, .table-responsive").css('opacity', 0.5);
    // Remove existing loading indicator if any
    $(".comparison-loading").remove();
    $(".comparison-container").append('<div class="comparison-loading" style="text-align:center;padding:30px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;margin:20px 0;"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i><br><br><strong>Memuat Data Evaluasi Actual...</strong><br><small class="text-muted">Sedang mengambil data evaluasi FIS dan SAW dari server.<br>Proses ini mungkin membutuhkan waktu 30-60 detik.<br>Mohon tunggu sebentar...</small></div>');
}

function hideComparisonLoading() {
    console.log('Hiding comparison loading...');
    $(".comparison-loading").remove();
    $(".comparison-container").find(".comparison-card, .comparison-chart-container, .table-responsive").css('opacity', 1);
}

function showComparisonError(message) {
    console.error('Showing comparison error:', message);
    $(".comparison-container").find(".comparison-card, .comparison-chart-container, .table-responsive").css('opacity', 0.5);
    $(".comparison-container").append('<div class="comparison-error" style="color:#c00;text-align:center;padding:30px;background:#ffe6e6;border:1px solid #ff9999;border-radius:8px;margin:20px 0;"><i class="fas fa-exclamation-triangle"></i> <strong>Error:</strong>' + message + '</div>');
}

// Update statistik dari data actual evaluation
function updateComparisonStatsFromActual(fisData, sawData, comparisonData) {
    console.log('Updating comparison stats from actual evaluation...');
    console.log('FIS Data keys:', Object.keys(fisData));
    console.log('SAW Data keys:', Object.keys(sawData));
    
    // Hitung statistik
    const totalData = comparisonData.length;
    const totalConsistent = comparisonData.filter(item => item.is_consistent).length;
    const totalDifferent = totalData - totalConsistent;
    
    // Hitung akurasi masing-masing metode - support multiple formats
    const fisAccuracy = ((fisData.accuracy || fisData.metrics?.accuracy || 0) * 100).toFixed(2);
    const sawAccuracy = ((sawData.accuracy || sawData.metrics?.accuracy || 0) * 100).toFixed(2);
    
    // Total data dari evaluation_info atau test_data
    const fisTotal = fisData.test_data || fisData.evaluation_info?.total_data || totalData;
    const sawTotal = sawData.test_data || sawData.evaluation_info?.total_data || totalData;
    
    // Hitung korelasi ranking
    const rankingCorrelation = calculateRankingCorrelation(comparisonData);
    
    console.log('Calculated stats:', {
        totalData,
        totalConsistent,
        totalDifferent,
        fisAccuracy,
        sawAccuracy,
        fisTotal,
        sawTotal,
        rankingCorrelation
    });
    
    // Update UI elements
    $('#fisTotal').text(fisTotal);
    $('#fisAkurasi').text(fisAccuracy + '%');
    $('#sawTotal').text(sawTotal);
    $('#sawAkurasi').text(sawAccuracy + '%');
    $('#statConsistent').text(totalConsistent);
    $('#statDifferent').text(totalDifferent);
    $('#statCorrelation').text(rankingCorrelation.toFixed(3));
    
    console.log('Stats updated successfully');
}

// Calculate ranking correlation
function calculateRankingCorrelation(comparisonData) {
    const n = comparisonData.length;
    if (n === 0) return 0;
    
    // Sort by FIS nilai
    const fisSorted = [...comparisonData].sort((a, b) => b.fis_nilai - a.fis_nilai);
    const fisRankMap = {};
    fisSorted.forEach((item, index) => {
        fisRankMap[item.nim] = index + 1;
    });
    
    // Sort by SAW nilai
    const sawSorted = [...comparisonData].sort((a, b) => b.saw_nilai - a.saw_nilai);
    const sawRankMap = {};
    sawSorted.forEach((item, index) => {
        sawRankMap[item.nim] = index + 1;
    });
    
    // Calculate Spearman's rank correlation
    let sumDSquared = 0;
    comparisonData.forEach(item => {
        const d = fisRankMap[item.nim] - sawRankMap[item.nim];
        sumDSquared += d * d;
    });
    
    const correlation = 1 - (6 * sumDSquared) / (n * (n * n - 1));
    return correlation;
}

// Update chart from actual evaluation data
function updateComparisonChartFromActual(fisData, sawData) {
    console.log('Updating comparison chart from actual evaluation data...');
    
    // Hitung distribusi dari category_analysis atau classification_distribution
    const fisDistribution = fisData.classification_distribution || fisData.category_analysis || { tinggi: 0, sedang: 0, kecil: 0 };
    const sawDistribution = sawData.classification_distribution || sawData.category_analysis || { tinggi: 0, sedang: 0, kecil: 0 };
    
    // Convert category_analysis format to distribution format if needed
    let fisValues = [0, 0, 0];
    let sawValues = [0, 0, 0];
    
    // Check if data is in category_analysis format
    if (fisData.category_analysis) {
        fisValues = [
            fisData.category_analysis['Peluang Lulus Tinggi']?.total_predictions || 0,
            fisData.category_analysis['Peluang Lulus Sedang']?.total_predictions || 0,
            fisData.category_analysis['Peluang Lulus Kecil']?.total_predictions || 0
        ];
    } else {
        fisValues = [fisDistribution.tinggi || 0, fisDistribution.sedang || 0, fisDistribution.kecil || 0];
    }
    
    if (sawData.category_analysis) {
        sawValues = [
            sawData.category_analysis['Peluang Lulus Tinggi']?.total_predictions || 0,
            sawData.category_analysis['Peluang Lulus Sedang']?.total_predictions || 0,
            sawData.category_analysis['Peluang Lulus Kecil']?.total_predictions || 0
        ];
    } else {
        sawValues = [sawDistribution.tinggi || 0, sawDistribution.sedang || 0, sawDistribution.kecil || 0];
    }
    
    console.log('FIS Distribution:', fisDistribution);
    console.log('SAW Distribution:', sawDistribution);
    console.log('FIS Values:', fisValues);
    console.log('SAW Values:', sawValues);
    
    const categories = ["Tinggi", "Sedang", "Kecil"];
    
    console.log('Chart data:', { categories, fisValues, sawValues });
    
    const chartElement = $('#comparisonChart');
    console.log('Chart element:', chartElement.length);
    
    chartElement.empty();
    
    try {
        chartElement.kendoChart({
            title: { text: "Perbandingan Distribusi Klasifikasi FIS vs SAW (Data Aktual)" },
            legend: { position: "bottom" },
            chartArea: { background: "" },
            series: [
                { 
                    type: "column", 
                    name: "FIS", 
                    data: fisValues, 
                    color: "#3498db",
                    labels: {
                        visible: true,
                        template: "#= value #"
                    }
                },
                { 
                    type: "column", 
                    name: "SAW", 
                    data: sawValues, 
                    color: "#e74c3c",
                    labels: {
                        visible: true,
                        template: "#= value #"
                    }
                }
            ],
            valueAxis: {
                labels: { format: "{0}" },
                line: { visible: false },
                axisCrossingValue: 0,
                title: { text: "Jumlah Mahasiswa" }
            },
            categoryAxis: {
                categories: categories,
                line: { visible: false },
                labels: { padding: { top: 10 } },
                title: { text: "Klasifikasi Peluang Lulus" }
            },
            tooltip: {
                visible: true,
                template: "Peluang Lulus #= category #: #= value # mahasiswa (#= series.name #)"
            },
            height: 450,
            autoFit: true
        });
        console.log('Comparison chart initialized successfully from actual data');
    } catch (error) {
        console.error('Error initializing comparison chart:', error);
        chartElement.html('<p class="error">Error initializing chart: ' + error.message + '</p>');
    }
}

// Update Confusion Matrix Comparison
function updateComparisonConfusionMatrix(fisData, sawData) {
    console.log('Updating comparison confusion matrix...');
    
    // Render FIS Confusion Matrix
    const fisCM = fisData.confusion_matrix || [];
    if (fisCM && Array.isArray(fisCM) && fisCM.length === 3) {
        renderConfusionMatrix(fisCM, '#comparisonFISConfusionMatrix', 'FIS');
    } else {
        $('#comparisonFISConfusionMatrix').html('<p class="text-muted">Confusion matrix tidak tersedia</p>');
    }
    
    // Render SAW Confusion Matrix
    const sawCM = sawData.confusion_matrix || [];
    if (sawCM && Array.isArray(sawCM) && sawCM.length === 3) {
        renderConfusionMatrix(sawCM, '#comparisonSAWConfusionMatrix', 'SAW');
    } else {
        $('#comparisonSAWConfusionMatrix').html('<p class="text-muted">Confusion matrix tidak tersedia</p>');
    }
}

// Render Confusion Matrix Helper Function
function renderConfusionMatrix(confusionMatrix, containerId, methodName) {
    const container = $(containerId);
    container.empty();
    
    const predictedConfigs = [
        { value: 'Peluang Lulus Tinggi', label: 'Pred. Tinggi', headerStyle: 'background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border: 1px solid #81c784; padding: 10px; font-weight: 600; color: #2e7d32; font-size: 12px;' },
        { value: 'Peluang Lulus Sedang', label: 'Pred. Sedang', headerStyle: 'background: linear-gradient(135deg, #fff3cd 0%, #ffe082 100%); border: 1px solid #ffd54f; padding: 10px; font-weight: 600; color: #f57f17; font-size: 12px;' },
        { value: 'Peluang Lulus Kecil', label: 'Pred. Kecil', headerStyle: 'background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border: 1px solid #ef9a9a; padding: 10px; font-weight: 600; color: #c62828; font-size: 12px;' }
    ];

    const actualConfigs = [
        {
            value: 'LULUS_TINGGI',
            label: 'Actual Tinggi',
            headerStyle: 'background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border: 1px solid #81c784; padding: 10px; font-weight: 600; color: #2e7d32; font-size: 12px;',
            diagonalStyle: 'background: #c8e6c9; font-weight: bold; border: 2px solid #66bb6a; padding: 10px; text-align: center; font-size: 13px; color: #1b5e20;',
            offDiagonalStyle: 'background: #f1f8e9; border: 1px solid #dcedc8; padding: 10px; text-align: center; font-size: 13px; color: #424242;'
        },
        {
            value: 'LULUS_SEDANG',
            label: 'Actual Sedang',
            headerStyle: 'background: linear-gradient(135deg, #fff3cd 0%, #ffe082 100%); border: 1px solid #ffd54f; padding: 10px; font-weight: 600; color: #f57f17; font-size: 12px;',
            diagonalStyle: 'background: #ffe082; font-weight: bold; border: 2px solid #ffca28; padding: 10px; text-align: center; font-size: 13px; color: #f57f17;',
            offDiagonalStyle: 'background: #fffde7; border: 1px solid #fff9c4; padding: 10px; text-align: center; font-size: 13px; color: #424242;'
        },
        {
            value: 'LULUS_KECIL',
            label: 'Actual Kecil',
            headerStyle: 'background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border: 1px solid #ef9a9a; padding: 10px; font-weight: 600; color: #c62828; font-size: 12px;',
            diagonalStyle: 'background: #ffcdd2; font-weight: bold; border: 2px solid #e57373; padding: 10px; text-align: center; font-size: 13px; color: #b71c1c;',
            offDiagonalStyle: 'background: #ffebee; border: 1px solid #ffcdd2; padding: 10px; text-align: center; font-size: 13px; color: #424242;'
        }
    ];

    // Calculate total for percentage
    const total = confusionMatrix.reduce((sum, row) => sum + row.reduce((rowSum, cell) => rowSum + (cell || 0), 0), 0);

    let html = '<table class="confusion-table-simple" style="border-collapse: separate; border-spacing: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-radius: 8px; overflow: hidden; width: 100%;">';
    html += '<thead><tr>';
    html += '<th style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border: 1px solid #90caf9; padding: 10px; font-weight: 600; color: #1565C0; font-size: 12px;"></th>';
    predictedConfigs.forEach(col => {
        html += `<th style="${col.headerStyle}">${col.label}</th>`;
    });
    html += '</tr></thead><tbody>';

    confusionMatrix.forEach((row, i) => {
        const actualConfig = actualConfigs[i];
        html += '<tr>';
        html += `<td style="${actualConfig.headerStyle}"><strong style="font-weight: 600;">${actualConfig.label}</strong></td>`;

        row.forEach((cell, j) => {
            const value = cell || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            const style = (i === j ? actualConfig.diagonalStyle : actualConfig.offDiagonalStyle);

            const displayPercentage = percentage !== '0.0' ? `${percentage}%` : '0.0%';
            const cellContent = `
                <div style="font-weight: 700; font-size: 14px; color: inherit;">${value}</div>
                <div style="font-size: 10px; color: rgba(0,0,0,0.65); margin-top: 2px;">${displayPercentage}</div>
            `;

            html += `
                <td style="${style}">
                    ${cellContent}
                </td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.html(html);
    
    console.log(`${methodName} confusion matrix rendered successfully`);
}

// Helper function untuk mendapatkan warna Program Studi (untuk comparison page)
function getProdiColorComparison(prodi) {
    if (!prodi) return { bg: '#e0e0e0', text: '#666' };
    
    const prodiColors = {
        'Teknik Informatika': { bg: '#e3f2fd', text: '#1565C0' },
        'Sistem Informasi': { bg: '#e8f5e9', text: '#2e7d32' },
        'Teknik Komputer': { bg: '#fff3e0', text: '#e65100' },
        'Manajemen Informatika': { bg: '#f3e5f5', text: '#6a1b9a' },
        'Komputerisasi Akuntansi': { bg: '#fff9c4', text: '#f57f17' },
        'Teknik Elektro': { bg: '#ffebee', text: '#c62828' },
        'Pendidikan Jasmani': { bg: '#e1f5fe', text: '#0277bd' },
        'Pendidikan Ekonomi': { bg: '#f1f8e9', text: '#33691e' },
        'Manajemen': { bg: '#ede7f6', text: '#4527a0' },
        'Akuntansi': { bg: '#fff8e1', text: '#ef6c00' },
        'default': { bg: '#e0e0e0', text: '#424242' }
    };
    
    // Check if prodi contains any of the keywords
    for (const [key, color] of Object.entries(prodiColors)) {
        if (key !== 'default' && prodi.toUpperCase().includes(key.toUpperCase())) {
            return color;
        }
    }
    
    return prodiColors['default'];
}

// Helper function untuk mendapatkan badge class berdasarkan status aktual
function getComparisonBadgeClass(status) {
    if (!status) return 'bg-secondary';
    const normalized = status.toString().toUpperCase();
    if (normalized.includes('TINGGI')) return 'bg-success';
    if (normalized.includes('SEDANG')) return 'bg-warning';
    if (normalized.includes('KECIL')) return 'bg-danger';
    return 'bg-secondary';
}

// Helper function untuk mendapatkan badge class FIS (konsisten dengan FIS actual evaluation)
function getFISComparisonBadgeClass(category) {
    if (!category) return 'bg-secondary';
    const normalized = category.toString().toUpperCase();
    if (normalized.includes('TINGGI')) return 'bg-success';
    if (normalized.includes('SEDANG')) return 'bg-warning';
    if (normalized.includes('KECIL')) return 'bg-danger';
    return 'bg-secondary';
}

// Helper function untuk mendapatkan badge class SAW (konsisten dengan SAW actual evaluation)
function getSAWComparisonBadgeClass(category) {
    if (!category) return 'bg-secondary';
    const normalized = category.toString().toUpperCase();
    if (normalized.includes('TINGGI')) return 'bg-success';
    if (normalized.includes('SEDANG')) return 'bg-warning';
    if (normalized.includes('KECIL')) return 'bg-danger';
    return 'bg-secondary';
}

// Helper function untuk format status aktual
function formatComparisonActualStatus(status) {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ');
}

// Inisialisasi Kendo Grid untuk tabel comparison
function initializeComparisonGrid(data) {
    console.log('Initializing Kendo Grid with data:', data);
    
    // Hapus grid Kendo yang sudah ada jika ada
    if (window._comparisonGrid) {
        window._comparisonGrid.destroy();
        window._comparisonGrid = null;
    }
    
    // Hapus tabel HTML lama dan pagination
    $('.comparison-table').remove();
    $('.comparison-pagination').remove();
    
    // Hancurkan Kendo Grid yang sudah ada sebelum membuat yang baru
    const existingGrid = $('#comparisonGrid').data('kendoGrid');
    if (existingGrid) {
        console.log('Destroying existing comparison grid');
        try {
            existingGrid.destroy();
        } catch (error) {
            console.warn('Error destroying grid:', error);
        }
    }
    $('#comparisonGrid').remove();
    
    // Buat container untuk Kendo Grid - hanya di container yang spesifik
    const gridContainer = $('<div id="comparisonGrid"></div>');
    const tableContainer = $('#comparisonSection .table-responsive').first();
    
    if (tableContainer.length === 0) {
        console.error('Table container not found in comparison section');
        return;
    }
    
    // Hapus semua grid yang ada di container ini
    tableContainer.find('[data-role="grid"]').each(function() {
        const grid = $(this).data('kendoGrid');
        if (grid) {
            try {
                grid.destroy();
            } catch (e) {
                console.warn('Error destroying grid:', e);
            }
        }
    });
    tableContainer.empty();
    
    tableContainer.append(gridContainer);
    
    try {
        gridContainer.kendoGrid({
            dataSource: {
                data: data,
                schema: {
                    model: {
                        fields: {
                            nim: { type: "string" },
                            nama: { type: "string" },
                            program_studi: { type: "string" },
                            fis_kategori: { type: "string" },
                            fis_nilai: { type: "number" },
                            saw_kategori: { type: "string" },
                            saw_nilai: { type: "number" },
                            actual_status: { type: "string" },
                            actual_class: { type: "string" },
                            is_consistent: { type: "boolean" }
                        }
                    }
                },
                pageSize: 25
            },
            height: 500,
            scrollable: true,
            sortable: true,
            filterable: false, // Disable default Kendo filters, use custom search instead
            toolbar: [
                {
                    template: function() {
                        const total = comparisonDataCache ? comparisonDataCache.length : (data ? data.length : 0);
                        return `<div style="margin-left: 10px; padding: 8px 15px; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 6px; display: inline-block;">
                            <i class="fas fa-info-circle" style="color: #1976D2;"></i> 
                            <span style="color: #1565C0; font-weight: 500;">Total: <strong id="comparisonGridTotal">${total}</strong> data</span>
                        </div>
                        <button class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary" onclick="exportComparisonResults(); return false;" style="margin-left: 10px;">
                            <i class="fas fa-file-excel"></i> Export Excel
                        </button>`;
                    }
                }
            ],
            pageable: {
                buttonCount: 5,
                pageSizes: [10, 25, 50, 100],
                refresh: true,
                info: true,
                messages: {
                    display: "Menampilkan {0} - {1} dari {2} data",
                    empty: "Tidak ada data",
                    page: "Halaman",
                    of: "dari {0}",
                    itemsPerPage: "baris per halaman",
                    first: "Halaman pertama",
                    previous: "Halaman sebelumnya",
                    next: "Halaman berikutnya",
                    last: "Halaman terakhir",
                    refresh: "Refresh"
                }
            },
            columns: [
                { field: "nim", title: "NIM", width: 120 },
                { field: "nama", title: "Nama", width: 200 },
                { field: "program_studi", title: "Program Studi", width: 200, template: function(dataItem) {
                        if (!dataItem.program_studi) {
                            return '<span style="color: #999;">N/A</span>';
                        }
                        const colors = getProdiColorComparison(dataItem.program_studi);
                        return `<span style="display: inline-block; padding: 4px 10px; background: ${colors.bg}; color: ${colors.text}; border-radius: 12px; font-size: 11px; font-weight: 500;">${dataItem.program_studi}</span>`;
                    }
                },
                { field: "fis_kategori", title: "Hasil FIS", width: 200, template: function(dataItem) {
                        const badgeClass = getFISComparisonBadgeClass(dataItem.fis_kategori);
                        // Tampilkan nilai FIS (sudah dalam skala 0-100)
                        const fisNilai = dataItem.fis_nilai || 0;
                        const fisNilaiFormatted = parseFloat(fisNilai).toFixed(2);
                        
                        return `
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                <div>
                                    <span class="badge ${badgeClass}" style="font-size: 11px; padding: 6px 12px; font-weight: 600; white-space: nowrap;">
                                        ${dataItem.fis_kategori || 'N/A'}
                                    </span>
                                </div>
                                <div style="font-size: 11px; color: #666;">
                                    <span title="Nilai FIS (skala 0-100)">Nilai: ${fisNilaiFormatted}</span>
                                </div>
                            </div>
                        `;
                    },
                    attributes: {
                        style: "text-align: center;"
                    },
                    headerAttributes: {
                        style: "text-align: center;"
                    }
                },
                { field: "saw_kategori", title: "Hasil SAW", width: 240, template: function(dataItem) {
                        const badgeClass = getSAWComparisonBadgeClass(dataItem.saw_kategori);
                        // Tampilkan nilai real dan normalized
                        const sawNilaiReal = dataItem.saw_nilai || 0;
                        const sawNilaiNormalized = dataItem.saw_nilai_normalized || 0;
                        
                        // Format nilai
                        const sawRealFormatted = sawNilaiReal <= 1 ? 
                            parseFloat(sawNilaiReal).toFixed(4) : parseFloat(sawNilaiReal).toFixed(2);
                        const sawNormFormatted = parseFloat(sawNilaiNormalized).toFixed(2);
                        
                        return `
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                <div>
                                    <span class="badge ${badgeClass}" style="font-size: 11px; padding: 6px 12px; font-weight: 600; white-space: nowrap;">
                                        ${dataItem.saw_kategori || 'N/A'}
                                    </span>
                                </div>
                                <div style="font-size: 11px; color: #666;">
                                    <span title="Nilai SAW Real (skala 0-1)">Real: ${sawRealFormatted}</span>
                                    <span style="margin: 0 5px;">|</span>
                                    <span title="Nilai SAW Normalized (skala 0-100)">Norm: ${sawNormFormatted}</span>
                                </div>
                            </div>
                        `;
                    },
                    attributes: {
                        style: "text-align: center;"
                    },
                    headerAttributes: {
                        style: "text-align: center;"
                    }
                },
                { field: "is_consistent", title: "Konsistensi", width: 120, template: function(dataItem) {
                        const icon = dataItem.is_consistent ? 
                           '<i class="fas fa-check text-success"></i>' : 
                           '<i class="fas fa-times text-danger"></i>';
                        const text = dataItem.is_consistent ? 'Konsisten' : 'Berbeda';
                        return `${icon} ${text}`;
                    }
                },
                { field: "actual_status", title: "Status Lulus Aktual", width: 180, template: function(dataItem) {
                        const actualStatus = dataItem.actual_status || dataItem.actual_class || '';
                        if (!actualStatus) {
                            return '<span style="color: #999;">N/A</span>';
                        }
                        const badgeClass = getComparisonBadgeClass(actualStatus);
                        const statusText = formatComparisonActualStatus(actualStatus);
                        return `<span class="badge ${badgeClass}" style="font-size: 12px; padding: 6px 12px; font-weight: 600;">${statusText}</span>`;
                    }
                }
            ],
            dataBound: function(e) {
                console.log('Comparison grid data bound successfully');
                // Simpan data lengkap ke cache (hanya saat pertama kali atau saat reload)
                // Jangan update cache jika sedang dalam proses filtering
                if (!comparisonDataCache || comparisonDataCache.length === 0) {
                    const allData = e.sender.dataSource.data();
                    comparisonDataCache = JSON.parse(JSON.stringify(allData)); // Deep copy
                    console.log('🔧 Comparison data cached:', comparisonDataCache.length, 'items');
                }
                // Update statistik berdasarkan data yang difilter
                const currentData = e.sender.dataSource.data();
                updateFilteredStats(currentData);
                
                // Update total data di toolbar
                const total = comparisonDataCache ? comparisonDataCache.length : currentData.length;
                const totalElement = $('#comparisonGridTotal');
                if (totalElement.length) {
                    totalElement.text(total);
                }
            }
        });
        
        console.log('Kendo Grid initialized successfully');
        
        // Simpan referensi grid untuk akses nanti
        window._comparisonGrid = gridContainer.data('kendoGrid');
        
        // Simpan data lengkap ke cache saat pertama kali initialize
        if (data && data.length > 0) {
            comparisonDataCache = JSON.parse(JSON.stringify(data)); // Deep copy
            console.log('🔧 Comparison data cached on initialize:', comparisonDataCache.length, 'items');
        }      
    } catch (error) {
        console.error('Error initializing Kendo Grid:', error);
        gridContainer.html('<p class="error">Error initializing grid: ' + error.message + '</p>');
    }
}

// Update statistik berdasarkan data yang difilter
function updateFilteredStats(filteredData) {
    const total = filteredData.length;
    const consistent = filteredData.filter(item => item.is_consistent).length;
    const different = total - consistent;
    
    // Update statistik real-time
    $('#statConsistent').text(consistent);
    $('#statDifferent').text(different);
    
    console.log('Updated filtered stats:', { total, consistent, different });
}

// Cache untuk data comparison
let comparisonDataCache = null;

// Setup event listeners untuk comparison
function setupComparisonEventListeners() {
    // Initialize search handlers
    initializeComparisonSearchHandlers();
    
    // Filter dropdown
    $('#comparisonFilter').off('change').on('change', function() {
        const filter = $(this).val();
        const grid = window._comparisonGrid;
        
        if (grid) {
            const dataSource = grid.dataSource;
            
            // Restore data lengkap terlebih dahulu jika ada search filter aktif
            const searchInput = $("#searchInputComparison").val().trim();
            if (searchInput) {
                // Jika ada search input, restore data dari cache dulu
                if (comparisonDataCache && comparisonDataCache.length > 0) {
                    dataSource.data(JSON.parse(JSON.stringify(comparisonDataCache)));
                } else if (window._comparisonData && window._comparisonData.length > 0) {
                    dataSource.data(JSON.parse(JSON.stringify(window._comparisonData)));
                }
            }
            
            // Clear existing filters
            dataSource.filter([]);
            
            // Apply new filter
            if (filter === 'consistent') {
                dataSource.filter({ field: "is_consistent", operator: "eq", value: true });
            } else if (filter === 'different') {
                dataSource.filter({ field: "is_consistent", operator: "eq", value: false });
            }
            // 'all' atau lainnya, tidak perlu filter tambahan (sudah di-clear di atas)
            
            // Update statistik
            const currentData = dataSource.data();
            updateFilteredStats(currentData);
        }
    });
    
    // Refresh button
    $('.refresh-comparison').off('click').on('click', function() {
        // Reset filter dropdown ke 'all'
        $('#comparisonFilter').val('all');
        loadComparisonData();
    });
}

// Function to ensure comparison section elements are properly set
function ensureComparisonSectionVisible() {
    console.log('Ensuring Comparison section elements are properly set...');
    
    // Only ensure chart container is visible, don't interfere with router
    const chartElement = $('#comparisonChart');
    if (chartElement.length > 0) {
        chartElement.show();
        chartElement.css('display', 'block');
        chartElement.css('visibility', 'visible');
        chartElement.css('min-height', '400px');
        chartElement.css('width', '100%');
        
        console.log('Comparison chart element visibility ensured');
        console.log('Comparison Chart display:', chartElement.css('display'));
        console.log('Comparison Chart visibility:', chartElement.css('visibility')); 
    } else {
        console.error('Comparison chart element not found');
    }
}

// Inisialisasi event handler untuk pencarian comparison
function initializeComparisonSearchHandlers() {
    console.log('Initializing comparison search handlers...');
    
    // Event handler untuk tombol pencarian comparison
    $("#btnSearchComparison").off('click').on('click', function() {
        console.log('🔍 Tombol pencarian comparison diklik');
        performComparisonSearch();
    });
    
    // Event handler untuk tombol clear pencarian comparison
    $("#btnClearSearchComparison").off('click').on('click', function() {
        console.log('🔍 Tombol clear pencarian comparison diklik');
        clearComparisonSearch();
    });
    
    // Event handler untuk input pencarian comparison
    $("#searchInputComparison").off('input').on('input', function() {
        const searchTerm = $(this).val().trim();
        if (searchTerm.length >= 3) {
            // Auto search setelah 3 karakter
            clearTimeout(window.comparisonSearchTimeout);
            window.comparisonSearchTimeout = setTimeout(function() {
                performComparisonSearch();
            }, 500);
        } else if (searchTerm.length === 0) {
            // Clear search jika input kosong
            clearComparisonSearch();
        }
    });
    
    // Event handler untuk enter key pada input pencarian comparison
    $("#searchInputComparison").off('keypress').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            console.log('🔍 Enter key ditekan pada input pencarian comparison');
            performComparisonSearch();
        }
    });
    
    // Focus pada input pencarian saat halaman dimuat
    $("#searchInputComparison").focus();
}

// Fungsi untuk melakukan pencarian detail perbandingan
// Mendukung pencarian berdasarkan: NIM, Nama, Program Studi, Klasifikasi FIS, Klasifikasi SAW, Status Lulus Aktual
// Mendukung multiple keywords dengan koma sebagai separator
function performComparisonSearch() {
    console.log('🔧 performComparisonSearch dipanggil');
    
    const searchInput = $("#searchInputComparison").val().trim();
    
    if (!searchInput) {
        console.log('🔧 Input pencarian kosong, tampilkan semua data');
        const grid = window._comparisonGrid;
        if (grid && comparisonDataCache) {
            grid.dataSource.data(comparisonDataCache);
            updateFilteredStats(comparisonDataCache);
        }
        updateComparisonSearchInfo("Menampilkan semua data perbandingan", "info");
        return;
    }
    
    console.log('🔧 Memulai pencarian perbandingan untuk:', searchInput);
    
    try {
        // Tampilkan loading pada grid
        const grid = window._comparisonGrid;
        if (!grid) {
            console.error('🔧 Grid comparison tidak ditemukan');
            updateComparisonSearchInfo("Grid comparison tidak tersedia", "error");
            return;
        }
        
        // Gunakan data dari cache jika tersedia
        const allData = comparisonDataCache || grid.dataSource.data();
        console.log('🔧 Total data di grid:', allData.length);
        
        // Parse multiple keywords
        // Support comma separator (e.g., "informatika, tinggi" atau "tinggi,tinggi" atau "tinggi,tinggi,kecil")
        const keywords = searchInput.toLowerCase()
            .split(/[,]+/) // Split by comma
            .map(k => k.trim()) // Trim whitespace
            .filter(k => k.length > 0); // Remove empty strings
        
        console.log('🔧 Keywords untuk filter:', keywords);
        
        // Filter data berdasarkan kombinasi filter spesifik
        // Kombinasi filter:
        // - 2 keywords: 
        //   a) Jika keyword[0] match dengan program_studi → keyword[0] = Program Studi, keyword[1] = Klasifikasi (FIS/SAW/Status)
        //   b) Jika keyword[0] tidak match dengan program_studi → keyword[0] = FIS kategori, keyword[1] = SAW kategori
        // - 3 keywords: 
        //   a) Jika keyword[0] match dengan program_studi → keyword[0] = Program Studi, keyword[1] = FIS kategori, keyword[2] = SAW kategori
        //   b) Jika keyword[0] tidak match dengan program_studi → keyword[0] = FIS kategori, keyword[1] = SAW kategori, keyword[2] = Status Aktual
        // - 4 keywords: keyword[0] = Program Studi, keyword[1] = FIS kategori, keyword[2] = SAW kategori, keyword[3] = Status Aktual
        // - 1 keyword atau >4 keywords: gunakan logika lama (search di semua field)
        
        // Cek apakah keyword[0] cocok dengan program studi (untuk kombinasi 2, 3, dan 4 keywords)
        let isProdiCombination2 = false;
        let isProdiFisSawCombination = false;
        let isProdiFisSawStatusCombination = false;
        
        if (keywords.length === 2 && allData.length > 0) {
            // Cek apakah keyword[0] match dengan program_studi di data
            const keyword0Lower = keywords[0].toLowerCase();
            const hasProdiMatch = allData.some(item => {
                const prodi = (item.program_studi || '').toLowerCase();
                return prodi && prodi.includes(keyword0Lower);
            });
            isProdiCombination2 = hasProdiMatch;
            console.log('🔧 Keyword[0] match dengan program studi (2 keywords):', isProdiCombination2, 'keyword:', keywords[0]);
        }
        
        if (keywords.length === 3 && allData.length > 0) {
            // Cek apakah keyword[0] match dengan program_studi di data
            const keyword0Lower = keywords[0].toLowerCase();
            const hasProdiMatch = allData.some(item => {
                const prodi = (item.program_studi || '').toLowerCase();
                return prodi && prodi.includes(keyword0Lower);
            });
            isProdiFisSawCombination = hasProdiMatch;
            console.log('🔧 Keyword[0] match dengan program studi (3 keywords):', isProdiFisSawCombination, 'keyword:', keywords[0]);
        }
        
        if (keywords.length === 4 && allData.length > 0) {
            // Cek apakah keyword[0] match dengan program_studi di data
            const keyword0Lower = keywords[0].toLowerCase();
            const hasProdiMatch = allData.some(item => {
                const prodi = (item.program_studi || '').toLowerCase();
                return prodi && prodi.includes(keyword0Lower);
            });
            isProdiFisSawStatusCombination = hasProdiMatch;
            console.log('🔧 Keyword[0] match dengan program studi (4 keywords):', isProdiFisSawStatusCombination, 'keyword:', keywords[0]);
        }
        
        const filteredData = allData.filter(item => {
            if (keywords.length === 2) {
                if (isProdiCombination2) {
                    // Kombinasi baru: Program Studi + Klasifikasi (FIS/SAW/Status)
                    const prodi = (item.program_studi || '').toLowerCase();
                    const prodiMatch = prodi && prodi.includes(keywords[0]);
                    
                    // Cek keyword[1] di FIS, SAW, atau Status Aktual
                    const keyword1Lower = keywords[1].toLowerCase();
                    const fisMatch = item.fis_kategori && 
                        item.fis_kategori.toLowerCase().includes(keyword1Lower);
                    const sawMatch = item.saw_kategori && 
                        item.saw_kategori.toLowerCase().includes(keyword1Lower);
                    const actualStatus = (item.actual_status || item.actual_class || '').toLowerCase();
                    const statusMatch = actualStatus && actualStatus.includes(keyword1Lower);
                    
                    return prodiMatch && (fisMatch || sawMatch || statusMatch);
                } else {
                    // Kombinasi lama: FIS kategori + SAW kategori
                    const fisMatch = item.fis_kategori && 
                        item.fis_kategori.toLowerCase().includes(keywords[0]);
                    const sawMatch = item.saw_kategori && 
                        item.saw_kategori.toLowerCase().includes(keywords[1]);
                    return fisMatch && sawMatch;
                }
            } else if (keywords.length === 3) {
                if (isProdiFisSawCombination) {
                    // Kombinasi baru: Program Studi + FIS kategori + SAW kategori
                    const prodi = (item.program_studi || '').toLowerCase();
                    const prodiMatch = prodi && prodi.includes(keywords[0]);
                    const fisMatch = item.fis_kategori && 
                        item.fis_kategori.toLowerCase().includes(keywords[1]);
                    const sawMatch = item.saw_kategori && 
                        item.saw_kategori.toLowerCase().includes(keywords[2]);
                    return prodiMatch && fisMatch && sawMatch;
                } else {
                    // Kombinasi lama: FIS kategori + SAW kategori + Status Aktual
                    const fisMatch = item.fis_kategori && 
                        item.fis_kategori.toLowerCase().includes(keywords[0]);
                    const sawMatch = item.saw_kategori && 
                        item.saw_kategori.toLowerCase().includes(keywords[1]);
                    const actualStatus = (item.actual_status || item.actual_class || '').toLowerCase();
                    const statusMatch = actualStatus && actualStatus.includes(keywords[2]);
                    return fisMatch && sawMatch && statusMatch;
                }
            } else if (keywords.length === 4) {
                if (isProdiFisSawStatusCombination) {
                    // Kombinasi: Program Studi + FIS kategori + SAW kategori + Status Aktual
                    const prodi = (item.program_studi || '').toLowerCase();
                    const prodiMatch = prodi && prodi.includes(keywords[0]);
                    const fisMatch = item.fis_kategori && 
                        item.fis_kategori.toLowerCase().includes(keywords[1]);
                    const sawMatch = item.saw_kategori && 
                        item.saw_kategori.toLowerCase().includes(keywords[2]);
                    const actualStatus = (item.actual_status || item.actual_class || '').toLowerCase();
                    const statusMatch = actualStatus && actualStatus.includes(keywords[3]);
                    return prodiMatch && fisMatch && sawMatch && statusMatch;
                } else {
                    // Jika keyword[0] tidak match program_studi, gunakan logika lama (search di semua field)
                    return keywords.every(keyword => {
                        // Cek NIM
                        if (item.nim && item.nim.toLowerCase().includes(keyword)) {
                            return true;
                        }
                        
                        // Cek Nama
                        if (item.nama && item.nama.toLowerCase().includes(keyword)) {
                            return true;
                        }
                        
                        // Cek Program Studi
                        if (item.program_studi && item.program_studi.toLowerCase().includes(keyword)) {
                            return true;
                        }
                        
                        // Cek Klasifikasi FIS
                        if (item.fis_kategori && item.fis_kategori.toLowerCase().includes(keyword)) {
                            return true;
                        }
                        
                        // Cek Klasifikasi SAW
                        if (item.saw_kategori && item.saw_kategori.toLowerCase().includes(keyword)) {
                            return true;
                        }
                        
                        // Cek Status Lulus Aktual
                        const actualStatus = (item.actual_status || item.actual_class || '').toLowerCase();
                        if (actualStatus && actualStatus.includes(keyword)) {
                            return true;
                        }
                        
                        return false;
                    });
                }
            } else {
                // Logika lama: search di semua field (1 keyword atau >3 keywords)
                return keywords.every(keyword => {
                    // Cek NIM
                    if (item.nim && item.nim.toLowerCase().includes(keyword)) {
                        return true;
                    }
                    
                    // Cek Nama
                    if (item.nama && item.nama.toLowerCase().includes(keyword)) {
                        return true;
                    }
                    
                    // Cek Program Studi
                    if (item.program_studi && item.program_studi.toLowerCase().includes(keyword)) {
                        return true;
                    }
                    
                    // Cek Klasifikasi FIS
                    if (item.fis_kategori && item.fis_kategori.toLowerCase().includes(keyword)) {
                        return true;
                    }
                    
                    // Cek Klasifikasi SAW
                    if (item.saw_kategori && item.saw_kategori.toLowerCase().includes(keyword)) {
                        return true;
                    }
                    
                    // Cek Status Lulus Aktual
                    const actualStatus = (item.actual_status || item.actual_class || '').toLowerCase();
                    if (actualStatus && actualStatus.includes(keyword)) {
                        return true;
                    }
                    
                    return false;
                });
            }
        });
        
        console.log('🔧 Data yang difilter:', filteredData.length);
        
        if (filteredData.length === 0) {
            grid.dataSource.data([]);
            updateFilteredStats([]);
            updateComparisonSearchInfo(`Tidak ada data ditemukan untuk "${searchInput}"`, "warning");
            return;
        }
        
        // Update grid dengan data hasil pencarian
        grid.dataSource.data(filteredData);
        
        // Update statistik
        updateFilteredStats(filteredData);
        
        // Build info message berdasarkan jenis kombinasi filter
        let infoMessage = '';
        if (keywords.length === 2) {
            // Cek apakah kombinasi Prodi+Klasifikasi atau FIS+SAW
            let isProdiCombination2 = false;
            if (allData.length > 0) {
                const keyword0Lower = keywords[0].toLowerCase();
                const hasProdiMatch = allData.some(item => {
                    const prodi = (item.program_studi || '').toLowerCase();
                    return prodi && prodi.includes(keyword0Lower);
                });
                isProdiCombination2 = hasProdiMatch;
            }
            
            if (isProdiCombination2) {
                infoMessage = `Ditemukan ${filteredData.length} data dengan Prodi "${keywords[0]}" dan Klasifikasi "${keywords[1]}"`;
            } else {
                infoMessage = `Ditemukan ${filteredData.length} data dengan FIS "${keywords[0]}" dan SAW "${keywords[1]}"`;
            }
        } else if (keywords.length === 3) {
            // Cek apakah kombinasi Prodi+FIS+SAW atau FIS+SAW+Status
            let isProdiFisSawCombination = false;
            if (allData.length > 0) {
                const keyword0Lower = keywords[0].toLowerCase();
                const hasProdiMatch = allData.some(item => {
                    const prodi = (item.program_studi || '').toLowerCase();
                    return prodi && prodi.includes(keyword0Lower);
                });
                isProdiFisSawCombination = hasProdiMatch;
            }
            
            if (isProdiFisSawCombination) {
                infoMessage = `Ditemukan ${filteredData.length} data dengan Prodi "${keywords[0]}", FIS "${keywords[1]}", dan SAW "${keywords[2]}"`;
            } else {
                infoMessage = `Ditemukan ${filteredData.length} data dengan FIS "${keywords[0]}", SAW "${keywords[1]}", dan Status "${keywords[2]}"`;
            }
        } else if (keywords.length === 4) {
            // Kombinasi: Program Studi + FIS kategori + SAW kategori + Status Aktual
            if (isProdiFisSawStatusCombination) {
                infoMessage = `Ditemukan ${filteredData.length} data dengan Prodi "${keywords[0]}", FIS "${keywords[1]}", SAW "${keywords[2]}", dan Status "${keywords[3]}"`;
            } else {
                const keywordText = `keywords: "${keywords.join('", "')}"`;
                infoMessage = `Ditemukan ${filteredData.length} data dengan ${keywordText}`;
            }
        } else {
            const keywordText = keywords.length > 1 ? 
                `keywords: "${keywords.join('", "')}"` : 
                `"${searchInput}"`;
            infoMessage = `Ditemukan ${filteredData.length} data dengan ${keywordText}`;
        }
        updateComparisonSearchInfo(infoMessage, "success");
        
    } catch (error) {
        console.error('🔧 Error dalam pencarian comparison:', error);
        updateComparisonSearchInfo("Terjadi kesalahan saat mencari data: " + error.message, "error");
    }
}

// Fungsi untuk clear pencarian comparison
function clearComparisonSearch() {
    console.log('🔧 clearComparisonSearch called');
    
    // Clear search input
    $("#searchInputComparison").val("");
    
    // Reset filter dropdown ke 'all'
    $('#comparisonFilter').val('all');
    
    // Restore data lengkap dari cache atau window._comparisonData
    const grid = window._comparisonGrid;
    if (!grid) {
        console.error('🔧 Grid comparison tidak ditemukan');
        updateComparisonSearchInfo("Grid comparison tidak tersedia", "error");
        return;
    }
    
    // Prioritas: comparisonDataCache > window._comparisonData > reload dari server
    let fullData = null;
    
    if (comparisonDataCache && comparisonDataCache.length > 0) {
        console.log('🔧 Restoring full data from comparisonDataCache:', comparisonDataCache.length, 'items');
        fullData = JSON.parse(JSON.stringify(comparisonDataCache)); // Deep copy
    } else if (window._comparisonData && window._comparisonData.length > 0) {
        console.log('🔧 Restoring full data from window._comparisonData:', window._comparisonData.length, 'items');
        fullData = JSON.parse(JSON.stringify(window._comparisonData)); // Deep copy
    } else {
        console.log('🔧 No cache available, reloading data from server');
        loadComparisonData();
        updateComparisonSearchInfo("Data sedang dimuat ulang...", "info");
        return;
    }
    
    // Clear semua filter di dataSource
    grid.dataSource.filter([]);
    
    // Set data lengkap ke grid
    grid.dataSource.data(fullData);
    
    // Update statistik
    updateFilteredStats(fullData);
    
    // Refresh grid untuk memastikan tampilan ter-update
    grid.refresh();
    
    updateComparisonSearchInfo("Pencarian telah dibersihkan, menampilkan semua data", "info");
    console.log('🔧 Clear search completed, grid now has', fullData.length, 'items');
}

// Fungsi untuk update search info comparison
function updateComparisonSearchInfo(message, type) {
    const searchInfo = $("#searchInfoComparison");
    const searchResultText = $("#searchResultTextComparison");
    
    searchResultText.text(message);
    
    // Update icon berdasarkan type
    const icon = searchInfo.find("i");
    icon.removeClass("fa-info-circle fa-exclamation-triangle fa-check-circle fa-times-circle");
    
    switch(type) {
        case "success":
            icon.addClass("fa-check-circle");
            searchInfo.css("color", "#28a745");
            break;
        case "warning":
            icon.addClass("fa-exclamation-triangle");
            searchInfo.css("color", "#ffc107");
            break;
        case "error":
            icon.addClass("fa-times-circle");
            searchInfo.css("color", "#dc3545");
            break;
        default:
            icon.addClass("fa-info-circle");
            searchInfo.css("color", "#17a2b8");
    }
}

// Function untuk export Comparison Results ke Excel
function exportComparisonResults() {
    console.log('🔧 exportComparisonResults called');
    
    try {
        const grid = window._comparisonGrid;
        console.log('🔧 Grid instance:', grid ? 'Found' : 'Not found');
        
        if (!grid) {
            console.error('❌ Grid not found');
            showNotification('error', 'Error', 'Grid tidak ditemukan. Pastikan data sudah dimuat.');
            return;
        }
        
        // Get data from grid (data yang sedang ditampilkan, termasuk yang sudah difilter)
        const dataSource = grid.dataSource;
        console.log('🔧 DataSource:', dataSource);
        
        const data = dataSource.data();
        console.log('🔧 Data length:', data ? data.length : 0);
        console.log('🔧 Data sample:', data && data.length > 0 ? data[0] : 'No data');
        
        if (!data || data.length === 0) {
            console.error('❌ No data to export');
            showNotification('warning', 'Peringatan', 'Tidak ada data untuk diekspor');
            return;
        }
        
        console.log('✅ Exporting ' + data.length + ' records...');
        
        // Convert to plain array
        const plainData = [];
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            plainData.push({
                nim: item.nim,
                nama: item.nama,
                program_studi: item.program_studi,
                fis_kategori: item.fis_kategori,
                fis_nilai: item.fis_nilai,
                saw_kategori: item.saw_kategori,
                saw_nilai: item.saw_nilai,
                saw_nilai_normalized: item.saw_nilai_normalized,
                is_consistent: item.is_consistent,
                actual_status: item.actual_status || item.actual_class
            });
        }
        
        console.log('✅ Plain data prepared:', plainData.length, 'records');
        
        // Use custom export function
        exportComparisonResultsCustom(plainData);
        
    } catch (error) {
        console.error('❌ Error exporting to Excel:', error);
        console.error('❌ Error stack:', error.stack);
        showNotification('error', 'Error', 'Gagal mengekspor ke Excel: ' + error.message);
    }
}

// Alternative: Export with custom data processing
function exportComparisonResultsCustom(fullData) {
    console.log('🔧 exportComparisonResultsCustom called');
    console.log('🔧 Data received:', fullData ? fullData.length : 0, 'records');
    
    if (!fullData || !Array.isArray(fullData) || fullData.length === 0) {
        console.error('❌ No data to export');
        showNotification('error', 'Error', 'Tidak ada data untuk diekspor');
        return;
    }
    
    try {
        // Check if JSZip is available (required for Excel export)
        console.log('🔧 Checking JSZip availability...');
        console.log('🔧 typeof JSZip:', typeof JSZip);
        
        if (typeof JSZip === 'undefined') {
            console.warn('⚠️ JSZip not available, using CSV export instead');
            console.warn('⚠️ Excel export requires JSZip library');
            exportComparisonToCSV(fullData);
            return;
        }
        
        // Check if Kendo OOXML is available
        console.log('🔧 Checking Kendo availability...');
        console.log('🔧 typeof kendo:', typeof kendo);
        console.log('🔧 typeof kendo.ooxml:', typeof kendo !== 'undefined' ? typeof kendo.ooxml : 'N/A');
        
        if (typeof kendo === 'undefined' || typeof kendo.ooxml === 'undefined') {
            console.warn('⚠️ Kendo OOXML not available, using CSV export instead');
            exportComparisonToCSV(fullData);
            return;
        }
        
        console.log('✅ JSZip and Kendo OOXML are available');
        
        // Prepare data for export
        const exportData = fullData.map(item => ({
            'NIM': item.nim || '',
            'Nama Mahasiswa': item.nama || '',
            'Program Studi': item.program_studi || '',
            'Hasil FIS': item.fis_kategori || '',
            'Nilai FIS': item.fis_nilai ? parseFloat(item.fis_nilai).toFixed(2) : '',
            'Hasil SAW': item.saw_kategori || '',
            'Nilai SAW Real': item.saw_nilai ? (item.saw_nilai <= 1 ? parseFloat(item.saw_nilai).toFixed(4) : parseFloat(item.saw_nilai).toFixed(2)) : '',
            'Nilai SAW Normalized': item.saw_nilai_normalized ? parseFloat(item.saw_nilai_normalized).toFixed(2) : '',
            'Konsistensi': item.is_consistent ? 'Konsisten' : 'Berbeda',
            'Status Lulus Aktual': item.actual_status ? item.actual_status.replace(/_/g, ' ') : ''
        }));
        
        console.log('Creating workbook with ' + exportData.length + ' rows...');
        
        // Create workbook
        const workbook = new kendo.ooxml.Workbook({
            sheets: [
                {
                    name: "Detail Perbandingan FIS vs SAW",
                    columns: [
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true }
                    ],
                    rows: [
                        // Title row
                        {
                            cells: [
                                {
                                    value: "Detail Perbandingan FIS vs SAW - Data Lengkap",
                                    bold: true,
                                    fontSize: 16,
                                    color: "#1976D2",
                                    colSpan: 11,
                                    textAlign: "center"
                                }
                            ]
                        },
                        // Metadata row
                        {
                            cells: [
                                {
                                    value: "Exported: " + new Date().toLocaleString('id-ID') + " | Total Data: " + fullData.length,
                                    colSpan: 11,
                                    textAlign: "center",
                                    color: "#666"
                                }
                            ]
                        },
                        // Empty row
                        { cells: [] },
                        // Header row
                        {
                            cells: [
                                { value: "NIM", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Nama Mahasiswa", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Program Studi", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Hasil FIS", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Nilai FIS", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Hasil SAW", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Nilai SAW Real", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Nilai SAW Normalized", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Konsistensi", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Status Lulus Aktual", bold: true, background: "#667eea", color: "#ffffff" }
                            ]
                        }
                    ].concat(
                        // Data rows
                        exportData.map((item, index) => ({
                            cells: [
                                { value: item['NIM'], background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Nama Mahasiswa'], background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Program Studi'], background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Hasil FIS'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Nilai FIS'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Hasil SAW'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Nilai SAW Real'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Nilai SAW Normalized'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Konsistensi'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Status Lulus Aktual'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" }
                            ]
                        }))
                    )
                }
            ]
        });
        
        // Save the workbook
        const fileName = "Perbandingan_FIS_SAW_" + new Date().toISOString().split('T')[0] + ".xlsx";
        
        console.log('🔧 Saving workbook to file:', fileName);
        console.log('🔧 Converting workbook to data URL...');
        
        // Convert to data URL and download
        const dataURL = workbook.toDataURL();
        console.log('🔧 Data URL generated, length:', dataURL ? dataURL.length : 0);
        
        if (!dataURL || dataURL.length === 0) {
            console.error('❌ Empty data URL generated');
            throw new Error('Failed to generate Excel data URL');
        }
        
        // Create download link - Use multiple methods for better compatibility
        console.log('🔧 Creating download link...');
        
        // Method 1: Try using Kendo's saveAs if available
        if (typeof kendo.saveAs === 'function') {
            console.log('🔧 Using kendo.saveAs method...');
            try {
                kendo.saveAs({
                    dataURI: dataURL,
                    fileName: fileName
                });
                showNotification('success', 'Berhasil', 'File Excel berhasil diunduh: ' + fileName);
                console.log('✅ Excel export completed successfully (kendo.saveAs)');
                return;
            } catch (saveAsError) {
                console.warn('⚠️ kendo.saveAs failed, trying manual method:', saveAsError);
            }
        }
        
        // Method 2: Manual link creation and click
        console.log('🔧 Using manual download method...');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = fileName;
        link.target = '_blank';
        link.style.display = 'none';
        
        // Add to document
        console.log('🔧 Appending link to body...');
        document.body.appendChild(link);
        
        // Force a visible click event
        console.log('🔧 Triggering download click...');
        
        // Try multiple click methods
        if (typeof link.click === 'function') {
            link.click();
        } else if (document.createEvent) {
            const event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            link.dispatchEvent(event);
        }
        
        // Clean up after a delay
        console.log('🔧 Scheduling link removal...');
        setTimeout(function() {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
            console.log('🔧 Link removed from body');
        }, 100);
        
        showNotification('success', 'Berhasil', 'File Excel berhasil diunduh: ' + fileName);
        console.log('✅ Excel export completed successfully (manual download)');
        
    } catch (error) {
        console.error('Error in custom Excel export:', error);
        console.error('Error details:', error);
        // Fallback to CSV
        console.log('Falling back to CSV export...');
        exportComparisonToCSV(fullData);
    }
}

// Fallback CSV export function
function exportComparisonToCSV(fullData) {
    console.log('Exporting to CSV format...');
    
    try {
        // Prepare CSV header
        const headers = ['NIM', 'Nama Mahasiswa', 'Program Studi', 'Hasil FIS', 'Nilai FIS', 'Hasil SAW', 'Nilai SAW Real', 'Nilai SAW Normalized', 'Konsistensi', 'Status Lulus Aktual'];
        
        // Prepare CSV rows
        const rows = fullData.map(item => [
            item.nim || '',
            item.nama || '',
            item.program_studi || '',
            item.fis_kategori || '',
            item.fis_nilai ? parseFloat(item.fis_nilai).toFixed(2) : '',
            item.saw_kategori || '',
            item.saw_nilai ? (item.saw_nilai <= 1 ? parseFloat(item.saw_nilai).toFixed(4) : parseFloat(item.saw_nilai).toFixed(2)) : '',
            item.saw_nilai_normalized ? parseFloat(item.saw_nilai_normalized).toFixed(2) : '',
            item.is_consistent ? 'Konsisten' : 'Berbeda',
            item.actual_status ? item.actual_status.replace(/_/g, ' ') : ''
        ]);
        
        // Combine header and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                // Escape commas and quotes in CSV
                const cellStr = String(cell || '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return '"' + cellStr.replace(/"/g, '""') + '"';
                }
                return cellStr;
            }).join(','))
        ].join('\n');
        
        // Add UTF-8 BOM for Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Create download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = 'Perbandingan_FIS_SAW_' + new Date().toISOString().split('T')[0] + '.csv';
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(function() {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('success', 'Berhasil', 'File CSV berhasil diunduh');
        console.log('✅ CSV export completed successfully');
        
    } catch (error) {
        console.error('❌ Error exporting to CSV:', error);
        showNotification('error', 'Error', 'Gagal mengekspor ke CSV: ' + error.message);
    }
}

// Inisialisasi saat section comparison ditampilkan
$(document).ready(function() {
    initializeComparison();
    // const observer = new MutationObserver(function(mutations) {
    //     mutations.forEach(function(mutation) {
    //         if (mutation.target.id === 'comparisonSection' && mutation.target.style.display !== 'none') {
    //             initializeComparison();
    //         }
    //     });
    // });
    // const comparisonSection = document.getElementById('comparisonSection');
    // if (comparisonSection) {
    //     observer.observe(comparisonSection, { attributes: true, attributeFilter: ['style'] });
    //     if (comparisonSection.style.display !== 'none') {
    //         initializeComparison();
    //     }
    // }
}); 