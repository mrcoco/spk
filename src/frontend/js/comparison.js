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
        
        $.ajax({
            url: url,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                test_size: 0.3,
                random_state: 42,
                save_to_db: false
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
                weights: { ipk: 0.4, sks: 0.35, dek: 0.25 },
                test_size: 0.3,
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
                            fis_kategori: { type: "string" },
                            fis_nilai: { type: "number" },
                            saw_kategori: { type: "string" },
                            saw_nilai: { type: "number" },
                            nilai_selisih: { type: "number" },
                            selisih_category: { type: "string" },
                            is_consistent: { type: "boolean" }
                        }
                    }
                },
                pageSize: 25
            },
            height: 500,
            scrollable: true,
            sortable: true,
            filterable: {
                mode: "row"
            },
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
                { field: "nim", title: "NIM", width: 120, filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                },
                { field: "nama", title: "Nama", width: 200, filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                },
                { field: "fis_kategori", title: "Hasil FIS", width: 200, template: function(dataItem) {
                        const categoryClass = dataItem.fis_kategori ? 
                            dataItem.fis_kategori.toLowerCase().replace(/\s+/g, '-') : '';
                        // Tampilkan nilai FIS (sudah dalam skala 0-100)
                        const fisNilai = dataItem.fis_nilai || 0;
                        const fisNilaiFormatted = parseFloat(fisNilai).toFixed(2);
                        
                        return `
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                <div>
                                    <span class="result-category fis-category ${categoryClass}" style="font-weight: bold;">
                                        ${dataItem.fis_kategori || 'N/A'}
                                    </span>
                                </div>
                                <div style="font-size: 11px; color: #666;">
                                    <span title="Nilai FIS (skala 0-100)">Nilai: ${fisNilaiFormatted}</span>
                                </div>
                            </div>
                        `;
                    }, filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                },
                { field: "saw_kategori", title: "Hasil SAW", width: 240, template: function(dataItem) {
                        const categoryClass = dataItem.saw_kategori ? 
                            dataItem.saw_kategori.toLowerCase().replace(/\s+/g, '-') : '';
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
                                    <span class="result-category saw-category ${categoryClass}" style="font-weight: bold;">
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
                    }, filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                },
                { field: "is_consistent", title: "Konsistensi", width: 120, template: function(dataItem) {
                        const icon = dataItem.is_consistent ? 
                           '<i class="fas fa-check text-success"></i>' : 
                           '<i class="fas fa-times text-danger"></i>';
                        const text = dataItem.is_consistent ? 'Konsisten' : 'Berbeda';
                        return `${icon} ${text}`;
                    }, filterable: {
                        cell: {
                            template: function(args) {
                                args.element.kendoDropDownList({
                                    dataSource: [
                                        { text: "Semua", value: "" },
                                        { text: "Konsisten", value: "true" },
                                        { text: "Berbeda", value: "false" }
                                    ],
                                    dataTextField: "text",
                                    dataValueField: "value",
                                    value: args.filter ? args.filter.value : ""
                                });
                            }
                        }
                    }
                },
                { field: "nilai_selisih", title: "Selisih Nilai", width: 140, template: function(dataItem) {
                        const selisihClass = dataItem.selisih_category ? 
                            dataItem.selisih_category.toLowerCase().replace(/\s+/g, '-') : '';
                        // Format selisih dengan 2 desimal dan tunjukkan dalam skala 0-100
                        const selisihFormatted = dataItem.nilai_selisih ? parseFloat(dataItem.nilai_selisih).toFixed(2) : 'N/A';
                        return `<span class="selisih-value" title="Selisih dalam skala 0-100">${selisihFormatted}</span> <span class="selisih-category ${selisihClass}">${dataItem.selisih_category || 'N/A'}</span>`;
                    }, filterable: {
                        cell: {
                            operator: "gte"
                        }
                    }
                }
            ],
            dataBound: function(e) {
                console.log('Comparison grid data bound successfully');
                // Update statistik berdasarkan data yang difilter
                const filteredData = e.sender.dataSource.data();
                updateFilteredStats(filteredData);
            }
        });
        
        console.log('Kendo Grid initialized successfully');
        
        // Simpan referensi grid untuk akses nanti
        window._comparisonGrid = gridContainer.data('kendoGrid');      
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

// Setup event listeners untuk comparison
function setupComparisonEventListeners() {
    // Filter dropdown
    $('#comparisonFilter').off('change').on('change', function() {
        const filter = $(this).val();
        const grid = window._comparisonGrid;
        
        if (grid) {
            const dataSource = grid.dataSource;
            
            // Clear existing filters
            dataSource.filter([]);
            
            // Apply new filter
            if (filter === 'consistent') {
                dataSource.filter({ field: "is_consistent", operator: "eq", value: true });
            } else if (filter === 'different') {
                dataSource.filter({ field: "is_consistent", operator: "eq", value: false });
            }
            // 'all' atau lainnya, tidak perlu filter tambahan (sudah di-clear di atas)
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