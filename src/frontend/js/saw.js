// Initialize SAW section for SPA
function initializeSAWSection() {
    console.log("Initializing SAW section...");
    
    // Prevent multiple initializations
    if (window.sawSectionInitialized) {
        console.log("SAW section already initialized, skipping...");
        return;
    }
    window.sawSectionInitialized = true;
    
    // Check if elements exist
    console.log("SAW Chart element exists:", $('#sawChart').length);
    console.log("SAW Grid element exists:", $('#sawGrid').length);
    console.log("SAW Section visible:", $('#sawSection').is(':visible'));
    
    // Initialize SAW page
    initializeSAWPage();
    
    // Show initial loading state for stats
    showSAWStatsLoading();
    
    // Remove existing event listener to prevent duplication
    $(window).off('hashchange.saw');
    
    // Add event listener for hash change to ensure visibility
    $(window).on('hashchange.saw', function() {
        if (window.location.hash === '#saw') {
            console.log('Hash changed to SAW, ensuring visibility...');
            setTimeout(() => {
                ensureSAWSectionVisible();
                loadSAWDistribution();
            }, 100);
        }
    });
    
    // Add delay to ensure DOM is ready and section is visible
    setTimeout(() => {
        // Ensure SAW section is visible
        ensureSAWSectionVisible();
        
        // Check if SAW section is visible
        if ($('#sawSection').is(':visible')) {
            console.log('SAW Section is visible, loading data...');
            // Test chart first
            testSAWChart();
            // Load SAW distribution
            loadSAWDistribution();
            
            // Load SAW results table
            loadSAWResultsTable();
            
            // Load initial batch results
            loadInitialSAWBatchResults();
        } else {
            console.log('SAW Section is not visible, waiting...');
            // Wait longer if section is not visible
            setTimeout(() => {
                ensureSAWSectionVisible();
                if ($('#sawSection').is(':visible')) {
                    console.log('SAW Section is now visible, loading data...');
                    testSAWChart();
                    loadSAWDistribution();
                    loadSAWResultsTable();
                    loadInitialSAWBatchResults();
                }
            }, 500);
        }
    }, 200);
    
    // Create SAW form
    createSAWForm();
    
    // Initialize batch button
    initializeBatchButton();
}

function initializeSAWPage() {
    console.log("Initializing SAW page...");
    // SAW styling sudah ada di style.css
}

function initializeBatchButton() {
    $("#btnBatchKlasifikasiSAW").click(function(e) {
        e.preventDefault();
        
        // Show loading
        $(this).html('<i class="fas fa-spinner fa-spin"></i> Memproses...');
        $(this).prop('disabled', true);
        
        // Show loading for batch results and stats
        showSAWBatchResultsLoading();
        showSAWStatsLoading();
        
        // Get current data before classification
        const startTime = new Date();
        
        // First, get current data to show "before" state
        $.ajax({
            url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW + '/batch'),
            type: 'GET',
            success: function(beforeData) {
                // Display before state
                displayBeforeResults(beforeData);
                
                // Now perform batch classification
                $.ajax({
                    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW + '/batch'),
                    type: 'GET',
                    success: function(afterData) {
                        const endTime = new Date();
                        const processingTime = ((endTime - startTime) / 1000).toFixed(2);
                        
                        hideSAWBatchResultsLoading();
                        showNotification("Success", `Berhasil mengklasifikasi ${afterData.total_mahasiswa} mahasiswa`, "success");
                        
                        // Display after state and comparison
                        displayAfterResults(afterData);
                        displayComparisonSummary(beforeData, afterData, processingTime);
                        
                        // Show comparison results
                        $("#batchResultsComparisonSAW").show();
                        $("#batchResultsSAW").hide(); // Hide legacy results
                        
                        // Refresh grid and chart
                        loadSAWResultsTable();
                        loadSAWDistribution();
                        
                        // Reset button
                        $("#btnBatchKlasifikasiSAW").html('<i class="fas fa-tasks"></i> Klasifikasi Semua Mahasiswa');
                        $("#btnBatchKlasifikasiSAW").prop('disabled', false);
                    },
                    error: function(xhr, status, error) {
                        hideSAWBatchResultsLoading();
                        console.error('Error batch classification:', error);
                        showNotification("Error", "Gagal melakukan klasifikasi batch", "error");
                        
                        // Reset button
                        $("#btnBatchKlasifikasiSAW").html('<i class="fas fa-tasks"></i> Klasifikasi Semua Mahasiswa');
                        $("#btnBatchKlasifikasiSAW").prop('disabled', false);
                    }
                });
            },
            error: function(xhr, status, error) {
                hideSAWBatchResultsLoading();
                console.error('Error getting before data:', error);
                showNotification("Error", "Gagal mengambil data awal", "error");
                
                // Reset button
                $("#btnBatchKlasifikasiSAW").html('<i class="fas fa-tasks"></i> Klasifikasi Semua Mahasiswa');
                $("#btnBatchKlasifikasiSAW").prop('disabled', false);
            }
        });
    });
}

function createSAWForm() {
    // Initialize dropdown mahasiswa
    loadMahasiswaDropdown();
    
    // Initialize form button
    $("#btnKlasifikasiSAW").click(function(e) {
        e.preventDefault();
        const dropdown = $("#mahasiswaDropdownSAW").data("kendoComboBox");
        if (dropdown && dropdown.value()) {
            const nim = dropdown.value();
            calculateSAW(nim);
        } else {
            showNotification("Error", "Pilih mahasiswa terlebih dahulu", "error");
        }
    });
}

function loadMahasiswaDropdown() {
    // Show loading for dropdown
    showSAWDropdownLoading();
    
    $("#mahasiswaDropdownSAW").kendoComboBox({
        dataSource: {
            transport: {
                read: {
                    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA + "/search"),
                    dataType: "json",
                    data: function() {
                        var comboBox = $("#mahasiswaDropdownSAW").data("kendoComboBox");
                        return {
                            q: comboBox ? comboBox.text() : "",
                            limit: 20
                        };
                    }
                }
            },
            schema: {
                data: function(response) {
                    return response || [];
                }
            },
            serverFiltering: true
        },
        dataTextField: "nama",
        dataValueField: "nim",
        valuePrimitive: true,
        optionLabel: "Ketik minimal 3 karakter untuk mencari mahasiswa...",
        filter: "contains",
        minLength: 3,
        delay: 300,
        suggest: true,
        enforceMinLength: true,
        noDataTemplate: 'Ketik minimal 3 karakter...',
        clearButton: true,
        autoBind: false,
        template: "#: nim # - #: nama #",
        valueTemplate: "#: nim #",
        height: 300,
        placeholder: "Ketik minimal 3 karakter...",
        change: function(e) {
            var comboBox = this;
            var value = comboBox.value();
            var dataSource = comboBox.dataSource;
            var dataItem = dataSource.data().find(function(item) {
                return item.nim === value;
            });
            if (!dataItem) {
                comboBox.value('');
                window.selectedMahasiswaDataSAW = null;
                showNotification('warning', 'Pilih mahasiswa dari daftar!');
            } else {
                window.selectedMahasiswaDataSAW = dataItem;
                console.log('Selected NIM SAW:', dataItem.nim);
            }
        }
    });
    
    window.selectedMahasiswaDataSAW = null;
    hideSAWDropdownLoading();
}

function calculateSAW(nim) {
    // Show loading
    $("#hasilKlasifikasiSAW").show();
    $("#loadingIndicatorSAW").show();
    $("#hasilDetailSAW").html('');
    
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW + '/calculate/' + nim),
        type: 'GET',
        success: function(data) {
            $("#loadingIndicatorSAW").hide();
            displaySAWResult(data);
        },
        error: function(xhr, status, error) {
            console.error('Error calculating SAW:', error);
            $("#loadingIndicatorSAW").hide();
            $("#hasilDetailSAW").html('<p class="error">Error: ' + (xhr.responseJSON?.detail || 'Gagal menghitung SAW') + '</p>');
        }
    });
}

function displaySAWResult(data) {
    // Add safety checks for data
    if (!data) {
        $("#hasilDetailSAW").html('<p class="error">Data tidak tersedia</p>');
        return;
    }
    
    const classificationColor = getClassificationColor(data.klasifikasi);
    
    let html = `
        <div class="saw-result">
            <div class="result-header">
                <h4>Hasil untuk ${data.nama || 'N/A'} (${data.nim || 'N/A'})</h4>
            </div>
            
            <div class="result-section">
                <h5>Informasi Mahasiswa</h5>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">NIM:</span>
                        <span class="value">${data.nim || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Nama:</span>
                        <span class="value">${data.nama || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Program Studi:</span>
                        <span class="value">${data.program_studi || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="result-section">
                <h5>Nilai Kriteria</h5>
                <div class="criteria-grid">
                    <div class="criteria-item">
                        <div class="criteria-header">
                            <strong>IPK</strong>
                            <span class="weight">(Bobot: 35%)</span>
                        </div>
                        <div class="criteria-values">
                            <div>Nilai: <strong>${data.ipk?.toFixed(2) || 'N/A'}</strong></div>
                            <div>Normalisasi: <strong>${data.normalized_values?.IPK?.toFixed(4) || 'N/A'}</strong></div>
                            <div>Terbobot: <strong>${data.weighted_values?.IPK?.toFixed(4) || 'N/A'}</strong></div>
                        </div>
                    </div>
                    
                    <div class="criteria-item">
                        <div class="criteria-header">
                            <strong>SKS</strong>
                            <span class="weight">(Bobot: 37.5%)</span>
                        </div>
                        <div class="criteria-values">
                            <div>Nilai: <strong>${data.sks || 'N/A'}</strong></div>
                            <div>Normalisasi: <strong>${data.normalized_values?.SKS?.toFixed(4) || 'N/A'}</strong></div>
                            <div>Terbobot: <strong>${data.weighted_values?.SKS?.toFixed(4) || 'N/A'}</strong></div>
                        </div>
                    </div>
                    
                    <div class="criteria-item">
                        <div class="criteria-header">
                            <strong>Nilai D/E/K</strong>
                            <span class="weight">(Bobot: 37.5%)</span>
                        </div>
                        <div class="criteria-values">
                            <div>Nilai: <strong>${data.persen_dek?.toFixed(2) || 'N/A'}%</strong></div>
                            <div>Normalisasi: <strong>${data.normalized_values?.["Nilai D/E/K"]?.toFixed(4) || 'N/A'}</strong></div>
                            <div>Terbobot: <strong>${data.weighted_values?.["Nilai D/E/K"]?.toFixed(4) || 'N/A'}</strong></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="result-final" style="background: ${classificationColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
                <h4>Skor SAW Final: ${data.final_value?.toFixed(4) || 'N/A'}</h4>
                <h3>Klasifikasi: ${data.klasifikasi || 'N/A'}</h3>
                <p style="margin: 0; opacity: 0.9;">
                    ${getClassificationThreshold(data.klasifikasi)}
                </p>
            </div>
        </div>
    `;
    
    $("#hasilDetailSAW").html(html);
}

function getClassificationColor(classification) {
    // Add null/undefined check
    if (!classification || typeof classification !== 'string') {
        return '#6c757d'; // Default gray color
    }
    
    if (classification.includes('Tinggi')) return '#28a745';
    if (classification.includes('Sedang')) return '#ffc107';
    if (classification.includes('Kecil')) return '#dc3545';
    return '#6c757d';
}

function getClassificationThreshold(classification) {
    // Add null/undefined check
    if (!classification || typeof classification !== 'string') {
        return ''; // Default empty string
    }
    
    if (classification.includes('Tinggi')) return 'Skor ≥ 0.7';
    if (classification.includes('Sedang')) return '0.45 ≤ Skor < 0.7';
    if (classification.includes('Kecil')) return 'Skor < 0.45';
    return '';
}

function displayBatchResults(data) {
    // Add safety checks for data
    if (!data || !data.data || !Array.isArray(data.data)) {
        console.error('Invalid batch results data:', data);
        return;
    }
    
    const results = data.data;
    
    // Count classifications
    const counts = {
        'Peluang Lulus Tinggi': 0,
        'Peluang Lulus Sedang': 0,
        'Peluang Lulus Kecil': 0
    };
    
    results.forEach(result => {
        if (result && result.klasifikasi_saw) {
            counts[result.klasifikasi_saw]++;
        }
    });
    
    // Calculate percentages
    const total = results.length;
    const percentages = {
        'Peluang Lulus Tinggi': total > 0 ? (counts['Peluang Lulus Tinggi'] / total * 100) : 0,
        'Peluang Lulus Sedang': total > 0 ? (counts['Peluang Lulus Sedang'] / total * 100) : 0,
        'Peluang Lulus Kecil': total > 0 ? (counts['Peluang Lulus Kecil'] / total * 100) : 0
    };
    
    // Update display
    $("#batchTinggiSAW").text(counts['Peluang Lulus Tinggi']);
    $("#batchSedangSAW").text(counts['Peluang Lulus Sedang']);
    $("#batchKecilSAW").text(counts['Peluang Lulus Kecil']);
    $("#batchTotalSAW").text(total);
    
    // Update percentages
    $("#batchTinggiSAWPercent").text(percentages['Peluang Lulus Tinggi'].toFixed(1) + '%');
    $("#batchSedangSAWPercent").text(percentages['Peluang Lulus Sedang'].toFixed(1) + '%');
    $("#batchKecilSAWPercent").text(percentages['Peluang Lulus Kecil'].toFixed(1) + '%');
    
    // Show results
    $("#batchResultsSAW").show();
}

function displayBeforeResults(data) {
    // Add safety checks for data
    if (!data || !data.data || !Array.isArray(data.data)) {
        console.error('Invalid before results data:', data);
        return;
    }
    
    const results = data.data;
    
    // Count classifications
    const counts = {
        'Peluang Lulus Tinggi': 0,
        'Peluang Lulus Sedang': 0,
        'Peluang Lulus Kecil': 0
    };
    
    results.forEach(result => {
        if (result && result.klasifikasi_saw) {
            counts[result.klasifikasi_saw]++;
        }
    });
    
    // Calculate percentages
    const total = results.length;
    const percentages = {
        'Peluang Lulus Tinggi': total > 0 ? (counts['Peluang Lulus Tinggi'] / total * 100) : 0,
        'Peluang Lulus Sedang': total > 0 ? (counts['Peluang Lulus Sedang'] / total * 100) : 0,
        'Peluang Lulus Kecil': total > 0 ? (counts['Peluang Lulus Kecil'] / total * 100) : 0
    };
    
    // Update before display
    $("#beforeTinggiSAW").text(counts['Peluang Lulus Tinggi']);
    $("#beforeSedangSAW").text(counts['Peluang Lulus Sedang']);
    $("#beforeKecilSAW").text(counts['Peluang Lulus Kecil']);
    $("#beforeTotalSAW").text(total);
    
    // Update before percentages
    $("#beforeTinggiSAWPercent").text(percentages['Peluang Lulus Tinggi'].toFixed(1) + '%');
    $("#beforeSedangSAWPercent").text(percentages['Peluang Lulus Sedang'].toFixed(1) + '%');
    $("#beforeKecilSAWPercent").text(percentages['Peluang Lulus Kecil'].toFixed(1) + '%');
}

function displayAfterResults(data) {
    // Add safety checks for data
    if (!data || !data.data || !Array.isArray(data.data)) {
        console.error('Invalid after results data:', data);
        return;
    }
    
    const results = data.data;
    
    // Count classifications
    const counts = {
        'Peluang Lulus Tinggi': 0,
        'Peluang Lulus Sedang': 0,
        'Peluang Lulus Kecil': 0
    };
    
    results.forEach(result => {
        if (result && result.klasifikasi_saw) {
            counts[result.klasifikasi_saw]++;
        }
    });
    
    // Calculate percentages
    const total = results.length;
    const percentages = {
        'Peluang Lulus Tinggi': total > 0 ? (counts['Peluang Lulus Tinggi'] / total * 100) : 0,
        'Peluang Lulus Sedang': total > 0 ? (counts['Peluang Lulus Sedang'] / total * 100) : 0,
        'Peluang Lulus Kecil': total > 0 ? (counts['Peluang Lulus Kecil'] / total * 100) : 0
    };
    
    // Update after display
    $("#afterTinggiSAW").text(counts['Peluang Lulus Tinggi']);
    $("#afterSedangSAW").text(counts['Peluang Lulus Sedang']);
    $("#afterKecilSAW").text(counts['Peluang Lulus Kecil']);
    $("#afterTotalSAW").text(total);
    
    // Update after percentages
    $("#afterTinggiSAWPercent").text(percentages['Peluang Lulus Tinggi'].toFixed(1) + '%');
    $("#afterSedangSAWPercent").text(percentages['Peluang Lulus Sedang'].toFixed(1) + '%');
    $("#afterKecilSAWPercent").text(percentages['Peluang Lulus Kecil'].toFixed(1) + '%');
}

function displayComparisonSummary(beforeData, afterData, processingTime) {
    // Add safety checks for data
    if (!beforeData || !afterData || !beforeData.data || !afterData.data) {
        console.error('Invalid comparison data:', { beforeData, afterData });
        return;
    }
    
    const beforeResults = beforeData.data;
    const afterResults = afterData.data;
    
    // Count before classifications
    const beforeCounts = {
        'Peluang Lulus Tinggi': 0,
        'Peluang Lulus Sedang': 0,
        'Peluang Lulus Kecil': 0
    };
    
    beforeResults.forEach(result => {
        if (result && result.klasifikasi_saw) {
            beforeCounts[result.klasifikasi_saw]++;
        }
    });
    
    // Count after classifications
    const afterCounts = {
        'Peluang Lulus Tinggi': 0,
        'Peluang Lulus Sedang': 0,
        'Peluang Lulus Kecil': 0
    };
    
    afterResults.forEach(result => {
        if (result && result.klasifikasi_saw) {
            afterCounts[result.klasifikasi_saw]++;
        }
    });
    
    // Calculate changes
    const changes = {
        'Peluang Lulus Tinggi': afterCounts['Peluang Lulus Tinggi'] - beforeCounts['Peluang Lulus Tinggi'],
        'Peluang Lulus Sedang': afterCounts['Peluang Lulus Sedang'] - beforeCounts['Peluang Lulus Sedang'],
        'Peluang Lulus Kecil': afterCounts['Peluang Lulus Kecil'] - beforeCounts['Peluang Lulus Kecil']
    };
    
    // Find biggest change
    let biggestChange = { category: 'Tidak ada perubahan', value: 0 };
    Object.keys(changes).forEach(category => {
        if (Math.abs(changes[category]) > Math.abs(biggestChange.value)) {
            biggestChange = { 
                category: category.replace('Peluang Lulus ', ''), 
                value: changes[category] 
            };
        }
    });
    
    // Update summary
    $("#summaryTotalSAW").text(afterResults.length);
    $("#summaryTimeSAW").text(processingTime + ' detik');
    
    if (biggestChange.value !== 0) {
        const changeText = biggestChange.value > 0 ? 
            `+${biggestChange.value} ${biggestChange.category}` : 
            `${biggestChange.value} ${biggestChange.category}`;
        $("#summaryChangeSAW").text(changeText);
    } else {
        $("#summaryChangeSAW").text('Tidak ada perubahan');
    }
}

function loadSAWDistribution() {
    // Show loading state
    showSAWChartLoading();
    
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW + '/distribution'),
        type: 'GET',
        success: function(data) {
            hideSAWChartLoading();
            displaySAWDistributionFromAPI(data);
        },
        error: function(xhr, status, error) {
            console.error('Error loading SAW distribution:', error);
            hideSAWChartLoading();
            $('#sawChart').html('<p class="error">Error loading distribution</p>');
        }
    });
}

function showSAWChartLoading() {
    $('#sawChart').html(`
        <div class="saw-chart-loading">
            <div class="loading-content">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p>Memuat visualisasi distribusi...</p>
                <div class="loading-progress">
                    <div class="progress-bar"></div>
                </div>
            </div>
        </div>
    `);
}

function hideSAWChartLoading() {
    $('.saw-chart-loading').remove();
}

function displaySAWDistributionFromAPI(data) {
    // Add safety checks for data from distribution endpoint
    if (!data || !data.distribusi) {
        console.error('Invalid SAW distribution API data:', data);
        $('#sawChart').html('<p class="error">Data distribusi tidak tersedia</p>');
        return;
    }
    
    console.log('SAW Distribution API Data:', data);
    
    const distribusi = data.distribusi;
    const total = data.total || 0;
    
    console.log('Distribution counts:', distribusi);
    console.log('Total:', total);
    
    // Validate data values
    const tinggi = parseInt(distribusi["Peluang Lulus Tinggi"]) || 0;
    const sedang = parseInt(distribusi["Peluang Lulus Sedang"]) || 0;
    const kecil = parseInt(distribusi["Peluang Lulus Kecil"]) || 0;
    
    console.log('Validated values:', { tinggi, sedang, kecil });
    
    const chartData = [
        { category: "Peluang Lulus Tinggi", value: tinggi, color: "#28a745" },
        { category: "Peluang Lulus Sedang", value: sedang, color: "#ffc107" },
        { category: "Peluang Lulus Kecil", value: kecil, color: "#dc3545" }
    ];
    
    // Filter out zero values to avoid chart issues
    const filteredChartData = chartData.filter(item => item.value > 0);
    
    console.log('Original chart data:', chartData);
    console.log('Filtered chart data:', filteredChartData);
    console.log('Chart container exists:', $('#sawChart').length);
    console.log('Chart container visible:', $('#sawChart').is(':visible'));
    console.log('Chart container dimensions:', $('#sawChart').width(), 'x', $('#sawChart').height());
    console.log('Chart container parent visible:', $('#sawChart').parent().is(':visible'));
    console.log('SAW Section visible:', $('#sawSection').is(':visible'));
    console.log('SAW Chart Container visible:', $('.saw-chart-container').is(':visible'));
    console.log('Kendo UI available:', typeof kendo !== 'undefined');
    console.log('jQuery available:', typeof $ !== 'undefined');
    
    // Test if Kendo UI is available
    if (typeof kendo === 'undefined') {
        console.error('Kendo UI is not loaded');
        $('#sawChart').html('<p class="error">Kendo UI library tidak tersedia</p>');
        return;
    }
    
    // Test if jQuery is available
    if (typeof $ === 'undefined') {
        console.error('jQuery is not loaded');
        $('#sawChart').html('<p class="error">jQuery library tidak tersedia</p>');
        return;
    }
    
    // Check if we have valid data
    if (filteredChartData.length === 0) {
        console.error('No valid data for chart');
        $('#sawChart').html('<p class="error">Tidak ada data valid untuk ditampilkan</p>');
        return;
    }
    
    // Check if chart container is visible
    if (!$('#sawChart').is(':visible')) {
        console.log('Chart container is not visible, waiting for visibility...');
        // Wait for container to become visible
        waitForChartContainerVisibility(data, filteredChartData);
        return;
    }
    
    // Clear any existing content
    $('#sawChart').empty();
    
    try {
        $("#sawChart").kendoChart({
            title: {
                text: "Distribusi Klasifikasi SAW"
            },
            legend: {
                position: "bottom"
            },
            seriesDefaults: {
                type: "pie",
                labels: {
                    visible: true,
                    template: "#= category # (#= value # - #= kendo.format('{0:P}', percentage) #)"
                }
            },
            series: [{
                data: filteredChartData,
                field: "value",
                categoryField: "category",
                colorField: "color"
            }],
            tooltip: {
                visible: true,
                template: "#= category #: #= value # mahasiswa (#= kendo.format('{0:P}', percentage) #)"
            }
        });
        console.log('Kendo Chart initialized successfully');
        
        // Force chart to resize
        setTimeout(() => {
            const chart = $("#sawChart").data("kendoChart");
            if (chart) {
                chart.resize();
                console.log('Chart resized');
            }
        }, 100);
        
    } catch (error) {
        console.error('Error initializing Kendo Chart:', error);
        $('#sawChart').html('<p class="error">Error initializing chart: ' + error.message + '</p>');
    }
}

function displaySAWDistribution(data) {
    // Add safety checks for data
    if (!data || !data.data || !Array.isArray(data.data)) {
        console.error('Invalid SAW distribution data:', data);
        $('#sawChart').html('<p class="error">Data tidak tersedia</p>');
        return;
    }
    
    const results = data.data;
    console.log('SAW Distribution Data:', data);
    console.log('Results array length:', results.length);
    
    // Count classifications
    const counts = {
        'Peluang Lulus Tinggi': 0,
        'Peluang Lulus Sedang': 0,
        'Peluang Lulus Kecil': 0
    };
    
    results.forEach(result => {
        if (result && result.klasifikasi_saw) {
            counts[result.klasifikasi_saw]++;
        }
    });
    
    console.log('Classification counts:', counts);
    
    const chartData = [
        { category: "Peluang Lulus Tinggi", value: counts["Peluang Lulus Tinggi"], color: "#28a745" },
        { category: "Peluang Lulus Sedang", value: counts["Peluang Lulus Sedang"], color: "#ffc107" },
        { category: "Peluang Lulus Kecil", value: counts["Peluang Lulus Kecil"], color: "#dc3545" }
    ];
    
    console.log('Chart data:', chartData);
    console.log('Chart container exists:', $('#sawChart').length);
    
    try {
        $("#sawChart").kendoChart({
            title: {
                text: "Distribusi Klasifikasi SAW"
            },
            legend: {
                position: "bottom"
            },
            seriesDefaults: {
                type: "pie",
                labels: {
                    visible: true,
                    template: "#= category # (#= value # - #= kendo.format('{0:P}', percentage) #)"
                }
            },
            series: [{
                data: chartData,
                field: "value",
                categoryField: "category",
                colorField: "color"
            }],
            tooltip: {
                visible: true,
                template: "#= category #: #= value # mahasiswa (#= kendo.format('{0:P}', percentage) #)"
            }
        });
        console.log('Kendo Chart initialized successfully');
    } catch (error) {
        console.error('Error initializing Kendo Chart:', error);
        $('#sawChart').html('<p class="error">Error initializing chart: ' + error.message + '</p>');
    }
}

function loadSAWResultsTable() {
    // Show loading state
    showSAWGridLoading();
    
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW + '/batch'),
        type: 'GET',
        success: function(data) {
            hideSAWGridLoading();
            displaySAWResultsTable(data.data);
        },
        error: function(xhr, status, error) {
            console.error('Error loading SAW results:', error);
            hideSAWGridLoading();
            $('#sawGrid').html('<p class="error">Error loading results</p>');
        }
    });
}

function showSAWGridLoading() {
    $('#sawGrid').html(`
        <div class="saw-grid-loading">
            <div class="loading-content">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p>Memuat tabel hasil klasifikasi...</p>
                <div class="loading-progress">
                    <div class="progress-bar"></div>
                </div>
            </div>
        </div>
    `);
}

function hideSAWGridLoading() {
    $('.saw-grid-loading').remove();
}

function showSAWBatchResultsLoading() {
    $('#batchResultsSAW').html(`
        <div class="saw-batch-loading">
            <div class="loading-content">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p>Memproses hasil klasifikasi batch...</p>
                <div class="loading-progress">
                    <div class="progress-bar"></div>
                </div>
            </div>
        </div>
    `);
    $('#batchResultsSAW').show();
}

function showSAWStatsLoading() {
    // Show loading for individual stat values (legacy)
    $('#batchTinggiSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#batchSedangSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#batchKecilSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#batchTotalSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    // Show loading for percentages (legacy)
    $('#batchTinggiSAWPercent').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#batchSedangSAWPercent').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#batchKecilSAWPercent').html('<i class="fas fa-spinner fa-spin"></i>');
    
    // Show loading for comparison elements
    $('#beforeTinggiSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#beforeSedangSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#beforeKecilSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#beforeTotalSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#beforeTinggiSAWPercent').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#beforeSedangSAWPercent').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#beforeKecilSAWPercent').html('<i class="fas fa-spinner fa-spin"></i>');
    
    $('#afterTinggiSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#afterSedangSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#afterKecilSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#afterTotalSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#afterTinggiSAWPercent').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#afterSedangSAWPercent').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#afterKecilSAWPercent').html('<i class="fas fa-spinner fa-spin"></i>');
    
    // Show loading for summary
    $('#summaryTotalSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#summaryTimeSAW').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#summaryChangeSAW').html('<i class="fas fa-spinner fa-spin"></i>');
}

function loadInitialSAWBatchResults() {
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW + '/batch'),
        type: 'GET',
        success: function(data) {
            displayBatchResults(data);
        },
        error: function(xhr, status, error) {
            console.error('Error loading initial SAW batch results:', error);
            // Reset stats to 0 if error
            $('#batchTinggiSAW').text('0');
            $('#batchSedangSAW').text('0');
            $('#batchKecilSAW').text('0');
            $('#batchTotalSAW').text('0');
            // Reset percentages
            $('#batchTinggiSAWPercent').text('0%');
            $('#batchSedangSAWPercent').text('0%');
            $('#batchKecilSAWPercent').text('0%');
        }
    });
}

function hideSAWBatchResultsLoading() {
    $('.saw-batch-loading').remove();
}

function showSAWDropdownLoading() {
    $('#mahasiswaDropdownSAW').html(`
        <div class="saw-dropdown-loading">
            <div class="loading-content">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Memuat data mahasiswa...</span>
            </div>
        </div>
    `);
}

function hideSAWDropdownLoading() {
    $('.saw-dropdown-loading').remove();
}

function testSAWChart() {
    console.log('Testing SAW Chart initialization...');
    
    // Test data
    const testData = [
        { category: "Test Tinggi", value: 100, color: "#28a745" },
        { category: "Test Sedang", value: 50, color: "#ffc107" },
        { category: "Test Kecil", value: 25, color: "#dc3545" }
    ];
    
    console.log('Test data:', testData);
    console.log('Chart container:', $('#sawChart'));
    console.log('Kendo UI:', typeof kendo);
    
    try {
        $("#sawChart").kendoChart({
            title: {
                text: "Test Chart SAW"
            },
            series: [{
                data: testData,
                field: "value",
                categoryField: "category",
                colorField: "color"
            }]
        });
        console.log('Test chart created successfully');
    } catch (error) {
        console.error('Test chart error:', error);
    }
}

function ensureSAWSectionVisible() {
    console.log('Ensuring SAW section and chart container are visible...');
    
    // Let the router handle section visibility, just ensure SAW section is properly set
    $('#sawSection').show();
    $('#sawSection').css('display', 'block');
    $('#sawSection').css('visibility', 'visible');
    $('#sawSection').addClass('active');
    
    // Force chart container to be visible
    $('.saw-chart-container').show();
    $('.saw-chart-container').css('display', 'block');
    $('.saw-chart-container').css('visibility', 'visible');
    
    // Force chart element to be visible
    $('#sawChart').show();
    $('#sawChart').css('display', 'block');
    $('#sawChart').css('visibility', 'visible');
    $('#sawChart').css('min-height', '400px');
    $('#sawChart').css('width', '100%');
    
    // Ensure other sections remain hidden (but don't interfere with router)
    if (window.location.hash === '#saw') {
        $('.section').not('#sawSection').hide();
        $('.section').not('#sawSection').css('display', 'none');
        $('.section').not('#sawSection').css('visibility', 'hidden');
        $('.section').not('#sawSection').removeClass('active');
    }
    
    console.log('SAW section and chart container visibility ensured');
    console.log('SAW Section display:', $('#sawSection').css('display'));
    console.log('SAW Section visibility:', $('#sawSection').css('visibility'));
    console.log('Chart Container display:', $('.saw-chart-container').css('display'));
    console.log('Chart Element display:', $('#sawChart').css('display'));
}

function waitForChartContainerVisibility(data, filteredChartData) {
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds with 100ms intervals
    
    const checkVisibility = () => {
        attempts++;
        console.log(`Checking chart container visibility (attempt ${attempts}/${maxAttempts})`);
        
        // Force visibility on each attempt
        ensureSAWSectionVisible();
        
        // Check multiple visibility conditions
        const chartVisible = $('#sawChart').is(':visible');
        const sectionVisible = $('#sawSection').is(':visible');
        const containerVisible = $('.saw-chart-container').is(':visible');
        const chartDimensions = $('#sawChart').width() > 0 && $('#sawChart').height() > 0;
        
        console.log('Visibility status:', {
            chartVisible,
            sectionVisible,
            containerVisible,
            chartDimensions,
            chartWidth: $('#sawChart').width(),
            chartHeight: $('#sawChart').height()
        });
        
        if (chartVisible && sectionVisible && containerVisible && chartDimensions) {
            console.log('Chart container is now visible, initializing chart...');
            // Clear any existing content
            $('#sawChart').empty();
            
            try {
                $("#sawChart").kendoChart({
                    title: {
                        text: "Distribusi Klasifikasi SAW"
                    },
                    legend: {
                        position: "bottom"
                    },
                    seriesDefaults: {
                        type: "pie",
                        labels: {
                            visible: true,
                            template: "#= category # (#= value # - #= kendo.format('{0:P}', percentage) #)"
                        }
                    },
                    series: [{
                        data: filteredChartData,
                        field: "value",
                        categoryField: "category",
                        colorField: "color"
                    }],
                    tooltip: {
                        visible: true,
                        template: "#= category #: #= value # mahasiswa (#= kendo.format('{0:P}', percentage) #)"
                    }
                });
                console.log('Kendo Chart initialized successfully after waiting');
                
                // Force chart to resize
                setTimeout(() => {
                    const chart = $("#sawChart").data("kendoChart");
                    if (chart) {
                        chart.resize();
                        console.log('Chart resized after waiting');
                    }
                }, 100);
                
            } catch (error) {
                console.error('Error initializing Kendo Chart after waiting:', error);
                $('#sawChart').html('<p class="error">Error initializing chart: ' + error.message + '</p>');
            }
        } else if (attempts < maxAttempts) {
            setTimeout(checkVisibility, 100);
        } else {
            console.error('Chart container did not become visible after maximum attempts');
            console.error('Final visibility status:', {
                chartVisible: $('#sawChart').is(':visible'),
                sectionVisible: $('#sawSection').is(':visible'),
                containerVisible: $('.saw-chart-container').is(':visible'),
                chartDimensions: $('#sawChart').width() > 0 && $('#sawChart').height() > 0
            });
            
            // Try fallback approach - create chart in a different container
            console.log('Trying fallback approach...');
            createFallbackChart(data, filteredChartData);
        }
    };
    
    checkVisibility();
}

function createFallbackChart(data, filteredChartData) {
    console.log('Creating fallback chart...');
    
    // Create a temporary container for the chart
    const tempContainer = $('<div id="tempSawChart" style="width: 100%; height: 400px; border: 2px solid #ccc; margin: 20px 0; padding: 20px; background: #f9f9f9;"></div>');
    
    // Add it to the SAW section instead of body
    $('#sawSection').append(tempContainer);
    
    try {
        $("#tempSawChart").kendoChart({
            title: {
                text: "Distribusi Klasifikasi SAW (Fallback)"
            },
            legend: {
                position: "bottom"
            },
            seriesDefaults: {
                type: "pie",
                labels: {
                    visible: true,
                    template: "#= category # (#= value # - #= kendo.format('{0:P}', percentage) #)"
                }
            },
            series: [{
                data: filteredChartData,
                field: "value",
                categoryField: "category",
                colorField: "color"
            }],
            tooltip: {
                visible: true,
                template: "#= category #: #= value # mahasiswa (#= kendo.format('{0:P}', percentage) #)"
            }
        });
        console.log('Fallback chart created successfully');
        
        // Also show data as text in the original container
        $('#sawChart').html(`
            <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                <h4>Distribusi Klasifikasi SAW (Fallback)</h4>
                <p>Chart ditampilkan di bawah karena masalah container visibility.</p>
                <div style="margin: 15px 0;">
                    <strong>Data Distribusi:</strong><br>
                    ${filteredChartData.map(item => 
                        `${item.category}: ${item.value} mahasiswa`
                    ).join('<br>')}
                </div>
            </div>
        `);
        
    } catch (error) {
        console.error('Error creating fallback chart:', error);
        $('#sawChart').html(`
            <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                <h4>Distribusi Klasifikasi SAW (Error)</h4>
                <p>Chart tidak dapat ditampilkan. Berikut adalah data distribusi:</p>
                <div style="margin: 15px 0;">
                    <strong>Data Distribusi:</strong><br>
                    ${filteredChartData.map(item => 
                        `${item.category}: ${item.value} mahasiswa`
                    ).join('<br>')}
                </div>
                <p style="color: #dc3545; font-size: 12px;">Error: ${error.message}</p>
            </div>
        `);
    }
}

function displaySAWResultsTable(data) {
    // Add safety checks for data
    if (!data || !Array.isArray(data)) {
        console.error('Invalid SAW results table data:', data);
        $('#sawGrid').html('<p class="error">Data tidak tersedia</p>');
        return;
    }
    
    $("#sawGrid").kendoGrid({
        dataSource: {
            data: data,
            pageSize: 20
        },
        height: 550,
        scrollable: true,
        sortable: true,
        pageable: {
            refresh: true,
            pageSizes: true,
            buttonCount: 5
        },
        columns: [
            { field: "nim", title: "NIM", width: 120 },
            { field: "nama", title: "Nama", width: 200 },
            { field: "ipk", title: "IPK", width: 80, format: "{0:n2}" },
            { field: "sks", title: "SKS", width: 80 },
            { field: "persen_dek", title: "D/E/K (%)", width: 100, format: "{0:n1}" },
            { field: "skor_saw", title: "Skor SAW", width: 120, format: "{0:n4}" },
            { 
                field: "klasifikasi_saw", 
                title: "Klasifikasi", 
                width: 180,
                template: function(dataItem) {
                    const color = getClassificationColor(dataItem.klasifikasi_saw);
                    return `<span style="color: ${color}; font-weight: bold;">${dataItem.klasifikasi_saw}</span>`;
                }
            }
        ]
    });
} 