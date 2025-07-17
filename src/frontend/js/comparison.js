// Comparison Section dengan Kendo Grid

// Inisialisasi Comparison Section
function initializeComparison() {
    console.log("Initializing Comparison section...");
    console.log("jQuery available:", typeof $ !== undefined);
    console.log("Kendo UI available:", typeof kendo !== 'undefined');
    
    // Prevent multiple initializations
    // if (window.comparisonInitialized) {
    //     console.log("Comparison section already initialized, skipping...");
    //     return;
    // }
    window.comparisonInitialized = true;

    loadComparisonData();
    setupComparisonEventListeners();
}

// Ambil data perbandingan dari API
function loadComparisonData() {
    console.log('=== LOADING COMPARISON DATA ===');
    console.log('CONFIG available:', typeof CONFIG !== undefined);
    console.log('CONFIG.ENDPOINTS:', CONFIG?.ENDPOINTS);
    console.log('CONFIG.ENDPOINTS.COMPARISON:', CONFIG?.ENDPOINTS?.COMPARISON);
    
    const apiUrl = CONFIG.getApiUrl(CONFIG.ENDPOINTS.COMPARISON + '/methods');
    console.log('Full URL:', apiUrl);
    
    showComparisonLoading();
    
    $.ajax({
        url: apiUrl,
        method: 'GET',
        dataType: 'json',
        timeout: 30000,
        success: function(response) {
            console.log('=== COMPARISON API SUCCESS ===');
            console.log('Response type:', typeof response);
            console.log('Response keys:', Object.keys(response || {}));
            console.log('Response status:', response?.status);
            console.log('Response comparison_data length:', response?.comparison_data?.length);
            
            hideComparisonLoading();
            
            if (response && response.status === 'success' && response.comparison_data) {
                console.log('Data validation passed, updating UI...');
                // Simpan response lengkap untuk akses data
                window._comparisonResponse = response;
                window._comparisonData = response.comparison_data;
                
                updateComparisonStats(response.statistics || {});
                updateComparisonChart(response.fis_distribution || {}, response.saw_distribution || {});
                initializeComparisonGrid(response.comparison_data);
            } else {
                console.error('Data validation failed:', {
                    hasResponse: !!response,
                    status: response?.status,
                    hasComparisonData: !!response?.comparison_data
                });
                showComparisonError("Format data tidak valid atau status tidak success");        
            }
        },
        error: function(xhr, status, error) {
            console.error('=== COMPARISON API ERROR ===');
            console.error('XHR status:', xhr.status);
            console.error('XHR statusText:', xhr.statusText);
            console.error('Status:', status);
            console.error('Error:', error);
            console.error('Response text:', xhr.responseText);
            
            hideComparisonLoading();
            showComparisonError("Error loading data: " + error + " (Status: " + xhr.status + ")");
        }
    });
}

// Loading state
function showComparisonLoading() {
    console.log('Showing comparison loading...');
    $(".comparison-container").find(".comparison-card, .comparison-chart-container, .table-responsive").css('opacity', 0.5);
    $(".comparison-container").append('<div class="comparison-loading" style="text-align:center;padding:30px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;margin:20px 0;"><i class="fas fa-spinner fa-spin fa-2x"></i><br><strong>Memuat data perbandingan...</strong><br><small>Mohon tunggu sebentar</small></div>');
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

// Update statistik
function updateComparisonStats(stats) {
    // Gunakan total_mahasiswa dari response utama jika total_fis/total_saw tidak ada
    const totalMahasiswa = window._comparisonResponse?.total_mahasiswa || 0;
    
    console.log('Comparison stats update:', {
        stats: stats,
        totalMahasiswa: totalMahasiswa,
        response: window._comparisonResponse
    });
    
    // Update statistik FIS
    $('#fisTotal').text(stats.total_fis || totalMahasiswa || 0);
    $('#fisAkurasi').text((stats.accuracy_percentage || 0) + '%');
    // Update statistik SAW
    $('#sawTotal').text(stats.total_saw || totalMahasiswa || 0);
    $('#sawAkurasi').text((stats.accuracy_percentage || 0) + '%');
    // Update statistik tambahan
    $('#statConsistent').text(stats.total_consistent || 0);
    $('#statDifferent').text(stats.total_different || 0);
    $('#statCorrelation').text((stats.ranking_correlation || 0).toFixed(3));
    
    console.log('Updated elements:', {
        fisTotal: $('#fisTotal').text(),
        sawTotal: $('#sawTotal').text(),        consistent: $('#statConsistent').text(),
        different: $('#statDifferent').text(),       correlation: $('#statCorrelation').text()
    });
    
    // Debug: cek apakah elemen ada
    console.log('Element existence check:', {
        fisTotal: $('#fisTotal').length,
        sawTotal: $('#sawTotal').length,
        statConsistent: $('#statConsistent').length,
        statDifferent: $('#statDifferent').length,
        statCorrelation: $('#statCorrelation').length
    });
}

// Update chart
function updateComparisonChart(fisDist, sawDist) {
    console.log('Updating comparison chart with data:', { fisDist, sawDist });
    
    const categories = Object.keys(fisDist);
    const fisValues = Object.values(fisDist);
    const sawValues = Object.values(sawDist);
    
    console.log('Chart data:', { categories, fisValues, sawValues });
    
    const chartElement = $('#comparisonChart');
    console.log('Chart element:', chartElement.length);
    
    chartElement.empty();
    
    try {
        chartElement.kendoChart({
            title: { text: "Perbandingan Distribusi Klasifikasi FIS vs SAW" },
            legend: { position: "bottom" },
            chartArea: { background: "" },
            series: [
                { type: "column", name: "FIS", data: fisValues, color: "#3498db" },
                { type: "column", name: "SAW", data: sawValues, color: "#e74c3c" }
            ],
            valueAxis: {
                labels: { format: "{0}" },
                line: { visible: false },
                axisCrossingValue: 0
            },
            categoryAxis: {
                categories: categories.map(cat => cat.replace("Peluang Lulus ", "")),
                line: { visible: false },
                labels: { padding: { top: 10 } }
            },
            tooltip: {
                visible: true,
                template: "#= category #: #= value # mahasiswa (#= series.name #)"
            },
            height: 450,
            autoFit: true
        });
        console.log('Comparison chart initialized successfully');
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
    $('#comparisonGrid').remove();
    
    // Buat container untuk Kendo Grid
    const gridContainer = $('<div id="comparisonGrid"></div>');
    $('.table-responsive').append(gridContainer);
    
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
                { field: "fis_kategori", title: "Hasil FIS", width: 150, template: function(dataItem) {
                        const categoryClass = dataItem.fis_kategori ? 
                            dataItem.fis_kategori.toLowerCase().replace(/\s+/g, '-') : '';
                        return `<span class="result-category fis-category ${categoryClass}">${dataItem.fis_kategori || 'N/A'}</span> <span class="result-value">${dataItem.fis_nilai || 'N/A'}</span>`;
                    }, filterable: {
                        cell: {
                            operator: "contains"
                        }
                    }
                },
                { field: "saw_kategori", title: "Hasil SAW", width: 150, template: function(dataItem) {
                        const categoryClass = dataItem.saw_kategori ? 
                            dataItem.saw_kategori.toLowerCase().replace(/\s+/g, '-') : '';
                        return `<span class="result-category saw-category ${categoryClass}">${dataItem.saw_kategori || 'N/A'}</span> <span class="result-value">${dataItem.saw_nilai || 'N/A'}</span>`;
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
                { field: "nilai_selisih", title: "Selisih Nilai", width: 120, template: function(dataItem) {
                        const selisihClass = dataItem.selisih_category ? 
                            dataItem.selisih_category.toLowerCase().replace(/\s+/g, '-') : '';
                        return `<span class="selisih-value">${dataItem.nilai_selisih || 'N/A'}</span> <span class="selisih-category ${selisihClass}">${dataItem.selisih_category || 'N/A'}</span>`;
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