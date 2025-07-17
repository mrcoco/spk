// Inisialisasi Dashboard saat dokumen siap
$(document).ready(function() {
    initializeDashboard();
    // Tambahkan style ke head
    $('head').append(dashboardStyle);

    // Inisialisasi Form FIS saat section FIS ditampilkan
    // Ubah event handler untuk mendeteksi perubahan display
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'fisSection' && 
                mutation.target.style.display !== 'none') {
                initializeFISForm();
            }
        });
    });

    observer.observe(document.getElementById('fisSection'), {
        attributes: true,
        attributeFilter: ['style']
    });
});

// Inisialisasi Dashboard
function initializeDashboard() {
    // Inisialisasi statistik dashboard
    initializeDashboardStats();
    // Inisialisasi chart
    initializeDashboardCharts();
    // Inisialisasi distribusi fuzzy logic
    initializeFuzzyDistribution();
    // Inisialisasi distribusi SAW
    initializeSAWDistribution();
}

function initializeDashboardStats() {
    try {
        // Tampilkan loading state
        showLoadingStats();
        
        // Mengambil data statistik dari server
        $.ajax({
            url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.DASHBOARD),
            method: 'GET',
            success: function(response) {
                hideLoadingStats();
                if (response && typeof response === 'object') {
                    updateDashboardStats(response);
                    showNotification(
                        "Sukses",
                        "Data dashboard berhasil dimuat",
                        "success"
                    );
                } else {
                    console.warn("Invalid response format:", response);
                    updateDashboardStats(null);
                    showNotification(
                        "Peringatan",
                        "Format data tidak valid, menggunakan data default",
                        "warning"
                    );
                }
            },
            error: function(xhr, status, error) {
                hideLoadingStats();
                console.error("Error loading stats:", {xhr, status, error});
                
                let errorMessage = "Gagal memuat data dashboard";
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    errorMessage += ": " + xhr.responseJSON.detail;
                } else if (error) {
                    errorMessage += ": " + error;
                }
                
                showNotification(
                    "Error",
                    errorMessage,
                    "error"
                );
                
                // Update dengan data default
                updateDashboardStats(null);
            },
            timeout: 10000 // 10 detik timeout
        });
    } catch (error) {
        console.error("Error in initializeDashboardStats:", error);
        hideLoadingStats();
        showNotification(
            "Error",
            "Terjadi kesalahan internal saat memuat dashboard",
            "error"
        );
        updateDashboardStats(null);
    }
}

function showLoadingStats() {
    $('.dashboard-stats').html(`
        <div class="loading-stats">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Memuat data...</span>
        </div>
    `);
}

function hideLoadingStats() {
    $('.loading-stats').remove();
}

function showErrorMessage(message) {
    const errorHtml = `
        <div class="dashboard-error">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
    `;
    $('.dashboard-stats').prepend(errorHtml);
    // Hapus pesan error setelah 5 detik
    setTimeout(() => {
        $('.dashboard-error').fadeOut('slow', function() {
            $(this).remove();
        });
    }, 5000);
}

function updateDashboardStats(data) {
    // Default data jika API belum tersedia atau error
    const defaultStats = {
        total_mahasiswa: 0,
        rata_rata_ipk: 0,
        rata_rata_sks: 0,
        distribusi_ipk: {
            "3.5-4.0": 0,
            "3.0-3.49": 0,
            "2.5-2.99": 0,
            "<2.5": 0
        }
    };

    // Gabungkan data dari API dengan default data
    const stats = data ? { ...defaultStats, ...data } : defaultStats;

    // Render statistik ke dalam dashboard
    const statsHtml = `
        <div class="dashboard-stats-container">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                    <h3>Total Mahasiswa</h3>
                    <p>${stats.total_mahasiswa || 0}</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="stat-info">
                    <h3>Rata-rata IPK</h3>
                    <p>${(stats.rata_rata_ipk || 0).toFixed(2)}</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-book"></i>
                </div>
                <div class="stat-info">
                    <h3>Rata-rata SKS</h3>
                    <p>${Math.round(stats.rata_rata_sks || 0)}</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-chart-pie"></i>
                </div>
                <div class="stat-info">
                    <h3>IPK ≥ 3.5</h3>
                    <p>${stats.distribusi_ipk["3.5-4.0"] || 0} Mahasiswa</p>
                </div>
            </div>
        </div>
        <div class="dashboard-fuzzy-stats">
            <div class="fuzzy-stats-header">
                <h3><i class="fas fa-brain"></i> Distribusi Klasifikasi Fuzzy Logic</h3>
            </div>
            <div class="fuzzy-stats-container" id="fuzzyStatsContainer">
                <div class="fuzzy-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Memuat data distribusi...</span>
                </div>
            </div>
        </div>
        <div class="dashboard-saw-stats">
            <div class="saw-stats-header">
                <h3><i class="fas fa-calculator"></i> Distribusi Klasifikasi SAW </h3>
                <div class="saw-stats-actions">
                    <button class="refresh-saw-btn" onclick="refreshSAWDistribution()">
                        <i class="fas fa-sync-alt"></i>
                        <span> Sync</span>
                    </button>
                </div>
            </div>
            <div class="saw-stats-container" id="sawStatsContainer">
                <div class="saw-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Memuat data distribusi...</span>
                </div>
            </div>
        </div>
    `;

    $('.dashboard-stats').html(statsHtml);

    // Update chart IPK dengan data distribusi
    updateIPKChart(stats.distribusi_ipk);
    
    // Load fuzzy distribution stats
    loadFuzzyStats();
    
    // Load SAW distribution stats
    loadSAWStats();
}

function updateIPKChart(distribusiIPK) {
    if (!distribusiIPK) return;

    $("#ipkChart").kendoChart({
        title: {
            text: "Distribusi IPK Mahasiswa"
        },
        legend: {
            position: "bottom"
        },
        seriesDefaults: {
            type: "column"
        },
        series: [{
            name: "Jumlah Mahasiswa",
            data: [
                distribusiIPK["<2.5"] || 0,
                distribusiIPK["2.5-2.99"] || 0,
                distribusiIPK["3.0-3.49"] || 0,
                distribusiIPK["3.5-4.0"] || 0
            ],
            color: "#3498db"
        }],
        categoryAxis: {
            categories: ["< 2.5", "2.5-2.99", "3.0-3.49", "3.5-4.0"],
            title: {
                text: "Rentang IPK"
            }
        },
        valueAxis: {
            title: {
                text: "Jumlah Mahasiswa"
            }
        },
        tooltip: {
            visible: true,
            template: "#= category #: #= value # mahasiswa"
        }
    });
}

function initializeDashboardCharts() {
    // Inisialisasi Chart IPK dengan data kosong
    $("#ipkChart").kendoChart({
        title: {
            text: "Distribusi IPK Mahasiswa"
        },
        legend: {
            position: "bottom"
        },
        seriesDefaults: {
            type: "column"
        },
        series: [{
            name: "Jumlah Mahasiswa",
            data: [0, 0, 0, 0],
            color: "#3498db"
        }],
        categoryAxis: {
            categories: ["< 2.5", "2.5-2.99", "3.0-3.49", "3.5-4.0"],
            title: {
                text: "Rentang IPK"
            }
        },
        valueAxis: {
            title: {
                text: "Jumlah Mahasiswa"
            }
        },
        tooltip: {
            visible: true,
            template: "#= category #: #= value # mahasiswa"
        }
    });

    // Inisialisasi Chart Klasifikasi Fuzzy Logic
    $("#klasifikasiChart").kendoChart({
        title: {
            text: "Distribusi Klasifikasi Fuzzy Logic"
        },
        legend: {
            position: "bottom"
        },
        seriesDefaults: {
            type: "pie"
        },
        series: [{
            data: [
                { category: "Peluang Tinggi", value: 0, color: "#27ae60" },
                { category: "Peluang Sedang", value: 0, color: "#f1c40f" },
                { category: "Peluang Kecil", value: 0, color: "#e74c3c" }
            ]
        }],
        tooltip: {
            visible: true,
            template: "#= category #: #= value # mahasiswa"
        }
    });
    
    // Inisialisasi Chart SAW
    $("#dashboardSawChart").kendoChart({
        title: {
            text: "Distribusi Klasifikasi SAW"
        },
        legend: {
            position: "bottom"
        },
        seriesDefaults: {
            type: "pie"
        },
        series: [{
            data: [
                { category: "Peluang Tinggi", value: 0, color: "#27ae60" },
                { category: "Peluang Sedang", value: 0, color: "#f1c40f" },
                { category: "Peluang Kecil", value: 0, color: "#e74c3c" }
            ]
        }],
        tooltip: {
            visible: true,
            template: "#= category #: #= value # mahasiswa"
        }
    });
}

function initializeFuzzyDistribution() {
    try {
        // Mengambil data distribusi klasifikasi fuzzy logic
        $.ajax({
            url: CONFIG.getApiUrl('/api/dashboard/fuzzy-distribution'),
            method: 'GET',
            success: function(response) {
                if (response && response.distribusi) {
                    updateFuzzyDistributionChart(response);
                    showNotification(
                        "Sukses",
                        "Data distribusi fuzzy logic berhasil dimuat",
                        "success"
                    );
                } else {
                    console.warn("Invalid fuzzy distribution response:", response);
                    updateFuzzyDistributionChart(null);
                }
            },
            error: function(xhr, status, error) {
                console.error("Error loading fuzzy distribution:", {xhr, status, error});
                
                let errorMessage = "Gagal memuat data distribusi fuzzy logic";
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    errorMessage += ": " + xhr.responseJSON.detail;
                }
                
                showNotification(
                    "Warning",
                    errorMessage,
                    "warning"
                );
                
                // Update dengan data default
                updateFuzzyDistributionChart(null);
            },
            timeout: 10000
        });
    } catch (error) {
        console.error("Error in initializeFuzzyDistribution:", error);
        updateFuzzyDistributionChart(null);
    }
}

function updateFuzzyDistributionChart(data) {
    // Default data jika API belum tersedia atau error
    const defaultData = {
        distribusi: {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        },
        persentase: {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        },
        total: 0
    };

    const fuzzyData = data || defaultData;
    
    // Update chart dengan data yang didapat
    $("#klasifikasiChart").kendoChart({
        title: {
            text: "Distribusi Klasifikasi Fuzzy Logic"
        },
        legend: {
            position: "bottom"
        },
        seriesDefaults: {
            type: "pie"
        },
        series: [{
            data: [
                { 
                    category: "Peluang Lulus Tinggi", 
                    value: fuzzyData.distribusi["Peluang Lulus Tinggi"] || 0, 
                    color: "#27ae60" 
                },
                { 
                    category: "Peluang Lulus Sedang", 
                    value: fuzzyData.distribusi["Peluang Lulus Sedang"] || 0, 
                    color: "#f1c40f" 
                },
                { 
                    category: "Peluang Lulus Kecil", 
                    value: fuzzyData.distribusi["Peluang Lulus Kecil"] || 0, 
                    color: "#e74c3c" 
                }
            ]
        }],
        tooltip: {
            visible: true,
            template: "#= category #: #= value # mahasiswa (#= percentage.toFixed(1) #%)"
        }
    });
}

function loadFuzzyStats() {
    $.ajax({
        url: CONFIG.getApiUrl('/api/dashboard/fuzzy-distribution'),
        method: 'GET',
        success: function(response) {
            if (response && response.distribusi) {
                updateFuzzyStats(response);
            } else {
                updateFuzzyStats(null);
            }
        },
        error: function(xhr, status, error) {
            console.error("Error loading fuzzy stats:", error);
            updateFuzzyStats(null);
        }
    });
}

function updateFuzzyStats(data) {
    const defaultData = {
        distribusi: {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        },
        persentase: {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        },
        total: 0
    };

    const fuzzyData = data || defaultData;
    
    const fuzzyStatsHtml = `
        <div class="fuzzy-stat-item">
            <div class="fuzzy-stat-icon tinggi">
                <i class="fas fa-arrow-up"></i>
            </div>
            <div class="fuzzy-stat-content">
                <h4>Peluang Lulus Tinggi</h4>
                <p>${fuzzyData.distribusi["Peluang Lulus Tinggi"]} mahasiswa (${fuzzyData.persentase["Peluang Lulus Tinggi"]}%)</p>
            </div>
        </div>
        <div class="fuzzy-stat-item">
            <div class="fuzzy-stat-icon sedang">
                <i class="fas fa-minus"></i>
            </div>
            <div class="fuzzy-stat-content">
                <h4>Peluang Lulus Sedang</h4>
                <p>${fuzzyData.distribusi["Peluang Lulus Sedang"]} mahasiswa (${fuzzyData.persentase["Peluang Lulus Sedang"]}%)</p>
            </div>
        </div>
        <div class="fuzzy-stat-item">
            <div class="fuzzy-stat-icon kecil">
                <i class="fas fa-arrow-down"></i>
            </div>
            <div class="fuzzy-stat-content">
                <h4>Peluang Lulus Kecil</h4>
                <p>${fuzzyData.distribusi["Peluang Lulus Kecil"]} mahasiswa (${fuzzyData.persentase["Peluang Lulus Kecil"]}%)</p>
            </div>
        </div>
    `;

    $('#fuzzyStatsContainer').html(fuzzyStatsHtml);
}

function initializeSAWDistribution() {
    try {
        // Tampilkan loading state
        showSAWDistributionLoading();
        
        // Mengambil data distribusi klasifikasi SAW dengan retry mechanism
        loadSAWDistributionWithRetry();
    } catch (error) {
        console.error("Error in initializeSAWDistribution:", error);
        updateSAWDistributionChart(null);
    }
}

function loadSAWDistributionWithRetry(retryCount = 0) {
    const maxRetries = 3;
    const timeoutDuration = 30000; // 30 detik
    
    $.ajax({
        url: CONFIG.getApiUrl('/api/saw/distribution'),
        method: 'GET',
        success: function(response) {
            hideSAWDistributionLoading();
            if (response && response.distribusi) {
                updateSAWDistributionChart(response);
                showNotification(
                    "Sukses",
                    "Data distribusi SAW berhasil dimuat",
                    "success"
                );
            } else {
                console.warn("Invalid SAW distribution response:", response);
                updateSAWDistributionChart(null);
            }
        },
        error: function(xhr, status, error) {
            console.error("Error loading SAW distribution:", {xhr, status, error, retryCount});
            
            if (status === 'timeout' && retryCount < maxRetries) {
                // Retry dengan delay yang semakin lama
                const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                
                showNotification(
                    "Info",
                    `Mencoba memuat data SAW lagi... (Percobaan ${retryCount + 1}/${maxRetries + 1})`,
                    "info"
                );
                
                setTimeout(() => {
                    loadSAWDistributionWithRetry(retryCount + 1);
                }, delay);
            } else {
                // Gagal setelah semua retry
                hideSAWDistributionLoading();
                
                let errorMessage = "Gagal memuat data distribusi SAW";
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    errorMessage += ": " + xhr.responseJSON.detail;
                } else if (status === 'timeout') {
                    errorMessage += ": Server tidak merespons dalam waktu yang ditentukan";
                }
                
                showNotification(
                    "Warning",
                    errorMessage,
                    "warning"
                );
                
                // Update dengan data default
                updateSAWDistributionChart(null);
            }
        },
        timeout: timeoutDuration
    });
}

function showSAWDistributionLoading() {
    const loadingHtml = `
        <div class="saw-distribution-loading">
            <div class="loading-content">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Memuat distribusi SAW...</span>
                <div class="loading-progress">
                    <div class="progress-bar"></div>
                </div>
                <small>Ini mungkin memerlukan beberapa saat...</small>
            </div>
        </div>
    `;
    $('#sawStatsContainer').html(loadingHtml);
}

function hideSAWDistributionLoading() {
    $('.saw-distribution-loading').remove();
}

function refreshSAWDistribution() {
    // Tampilkan loading state
    showSAWDistributionLoading();
    
    // Disable refresh button
    $('.refresh-saw-btn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i><span>Memuat...</span>');
    
    $.ajax({
        url: CONFIG.getApiUrl('/api/saw/distribution/refresh'),
        method: 'POST',
        success: function(response) {
            hideSAWDistributionLoading();
            
            if (response && response.status === 'success') {
                updateSAWDistributionChart(response);
                showNotification(
                    "Sukses",
                    response.message || "Data distribusi SAW berhasil diperbarui",
                    "success"
                );
            } else {
                updateSAWDistributionChart(null);
                showNotification(
                    "Warning",
                    "Gagal memperbarui data distribusi SAW",
                    "warning"
                );
            }
        },
        error: function(xhr, status, error) {
            hideSAWDistributionLoading();
            
            let errorMessage = "Gagal memperbarui data distribusi SAW";
            if (xhr.responseJSON && xhr.responseJSON.detail) {
                errorMessage += ": " + xhr.responseJSON.detail;
            }
            
            showNotification(
                "Error",
                errorMessage,
                "error"
            );
            
            // Update dengan data default
            updateSAWDistributionChart(null);
        },
        complete: function() {
                // Re-enable refresh button
    $('.refresh-saw-btn').prop('disabled', false).html('<i class="fas fa-sync-alt"></i><span>Refresh Data</span>');
        },
        timeout: 60000 // 1 menit untuk refresh
    });
}

function updateSAWDistributionChart(data) {
    // Default data jika API belum tersedia atau error
    const defaultData = {
        distribusi: {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        },
        persentase: {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        },
        total: 0
    };

    const sawData = data || defaultData;
    
    // Update chart dengan data yang didapat
    $("#dashboardSawChart").kendoChart({
        title: {
            text: "Distribusi Klasifikasi SAW"
        },
        legend: {
            position: "bottom"
        },
        seriesDefaults: {
            type: "pie"
        },
        series: [{
            data: [
                { 
                    category: "Peluang Lulus Tinggi", 
                    value: sawData.distribusi["Peluang Lulus Tinggi"] || 0, 
                    color: "#27ae60" 
                },
                { 
                    category: "Peluang Lulus Sedang", 
                    value: sawData.distribusi["Peluang Lulus Sedang"] || 0, 
                    color: "#f1c40f" 
                },
                { 
                    category: "Peluang Lulus Kecil", 
                    value: sawData.distribusi["Peluang Lulus Kecil"] || 0, 
                    color: "#e74c3c" 
                }
            ]
        }],
        tooltip: {
            visible: true,
            template: "#= category #: #= value # mahasiswa (#= percentage.toFixed(1) #%)"
        }
    });
}

function loadSAWStats() {
    $.ajax({
        url: CONFIG.getApiUrl('/api/saw/distribution'),
        method: 'GET',
        success: function(response) {
            if (response && response.distribusi) {
                updateSAWStats(response);
            } else {
                updateSAWStats(null);
            }
        },
        error: function(xhr, status, error) {
            console.error("Error loading SAW stats:", error);
            updateSAWStats(null);
        }
    });
}

function updateSAWStats(data) {
    const defaultData = {
        distribusi: {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        },
        persentase: {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        },
        total: 0
    };

    const sawData = data || defaultData;
    
    const sawStatsHtml = `
        <div class="saw-stat-item">
            <div class="saw-stat-icon tinggi">
                <i class="fas fa-arrow-up"></i>
            </div>
            <div class="saw-stat-content">
                <h4>Peluang Lulus Tinggi</h4>
                <p>${sawData.distribusi["Peluang Lulus Tinggi"]} mahasiswa (${sawData.persentase["Peluang Lulus Tinggi"]}%)</p>
            </div>
        </div>
        <div class="saw-stat-item">
            <div class="saw-stat-icon sedang">
                <i class="fas fa-minus"></i>
            </div>
            <div class="saw-stat-content">
                <h4>Peluang Lulus Sedang</h4>
                <p>${sawData.distribusi["Peluang Lulus Sedang"]} mahasiswa (${sawData.persentase["Peluang Lulus Sedang"]}%)</p>
            </div>
        </div>
        <div class="saw-stat-item">
            <div class="saw-stat-icon kecil">
                <i class="fas fa-arrow-down"></i>
            </div>
            <div class="saw-stat-content">
                <h4>Peluang Lulus Kecil</h4>
                <p>${sawData.distribusi["Peluang Lulus Kecil"]} mahasiswa (${sawData.persentase["Peluang Lulus Kecil"]}%)</p>
            </div>
        </div>
    `;

    $('#sawStatsContainer').html(sawStatsHtml);
}

// Inisialisasi Form FIS
function initializeFISForm() {
    // Inisialisasi Dropdown Mahasiswa
    $("#mahasiswaDropdown").kendoComboBox({
        dataSource: {
            transport: {
                read: {
                    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA + "/search"),
                    dataType: "json",
                    data: function() {
                        var comboBox = $("#mahasiswaDropdown").data("kendoComboBox");
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
                window.selectedMahasiswaDataDashboard = null;
                showNotification('warning', 'Pilih mahasiswa dari daftar!');
            } else {
                window.selectedMahasiswaDataDashboard = dataItem;
                console.log('Selected NIM Dashboard:', dataItem.nim);
            }
        }
    });

    window.selectedMahasiswaDataDashboard = null;

    // Event handler untuk tombol Klasifikasi
    $("#btnKlasifikasi").click(function() {
        var dropdown = $("#mahasiswaDropdown").data("kendoComboBox");
        var selectedNim = dropdown.value();
        
        if (!selectedNim) {
            showNotification("error", "Error", "Silakan pilih mahasiswa terlebih dahulu");
            return;
        }

        // Tampilkan loading
        kendo.ui.progress($("#fisSection"), true);
        $("#btnKlasifikasi").find("i").addClass("fa-spin");

        // Panggil API Fuzzy
        $.ajax({
            url: `${CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY)}/${selectedNim}`,
            type: "GET",
            success: function(response) {
                // Tampilkan hasil klasifikasi
                var hasilContent = `
                    <div class="k-form">
                        <div class="k-form-field">
                            <label><strong>Kategori Kelulusan:</strong></label>
                            <span class="k-form-field-text">${response.kategori}</span>
                        </div>
                        <div class="k-form-field">
                            <label><strong>Nilai Fuzzy:</strong></label>
                            <span class="k-form-field-text">${response.nilai_fuzzy.toFixed(2)}</span>
                        </div>
                        <div class="k-form-field">
                            <label><strong>Keanggotaan IPK:</strong></label>
                            <span class="k-form-field-text">${response.ipk_membership}</span>
                        </div>
                        <div class="k-form-field">
                            <label><strong>Keanggotaan SKS:</strong></label>
                            <span class="k-form-field-text">${response.sks_membership}</span>
                        </div>
                        <div class="k-form-field">
                            <label><strong>Keanggotaan Nilai D/E/K:</strong></label>
                            <span class="k-form-field-text">${response.nilai_dk_membership}</span>
                        </div>
                    </div>
                `;

                $("#hasilDetailFIS").html(hasilContent);
                $("#hasilKlasifikasiFIS").show();

                showNotification("success", "Klasifikasi Berhasil", "Data klasifikasi berhasil diproses");
            },
            error: function(xhr) {
                let errorMessage = "Gagal memproses klasifikasi";
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    errorMessage = xhr.responseJSON.detail;
                }
                showNotification("error", "Error", errorMessage);
                $("#hasilKlasifikasiFIS").hide();
            },
            complete: function() {
                // Sembunyikan loading
                kendo.ui.progress($("#fisSection"), false);
                $("#btnKlasifikasi").find("i").removeClass("fa-spin");
            }
        });
    });
}

// Tambahkan style untuk dashboard
const dashboardStyle = `
<style>
.dashboard-stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.stat-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
}

.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #3498db;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
}

.stat-icon i {
    font-size: 24px;
    color: white;
}

.stat-info h3 {
    margin: 0;
    font-size: 14px;
    color: #666;
}

.stat-info p {
    margin: 5px 0 0;
    font-size: 24px;
    font-weight: bold;
    color: #2c3e50;
}

.dashboard-charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.chart-container {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.loading-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-size: 16px;
    color: #666;
}

.loading-stats i {
    margin-right: 10px;
    color: #3498db;
}

.dashboard-error {
    background-color: #fff3cd;
    color: #856404;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
}

.dashboard-error i {
    margin-right: 10px;
    color: #856404;
}

.dashboard-fuzzy-stats {
    margin-top: 30px;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.fuzzy-stats-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
}

.fuzzy-stats-header h3 {
    margin: 0;
    color: #34495e;
    font-size: 18px;
    display: flex;
    align-items: center;
}

.fuzzy-stats-header i {
    margin-right: 10px;
    color: #27ae60;
}

.fuzzy-stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.fuzzy-stat-item {
    display: flex;
    align-items: center;
    background: #f9f9f9;
    border-radius: 6px;
    padding: 10px 15px;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
}

.fuzzy-stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    font-size: 20px;
}

.fuzzy-stat-icon.tinggi {
    background-color: #e8f5e9; /* Light green */
    color: #27ae60;
}

.fuzzy-stat-icon.sedang {
    background-color: #fff3cd; /* Light yellow */
    color: #f1c40f;
}

.fuzzy-stat-icon.kecil {
    background-color: #ffebee; /* Light red */
    color: #e74c3c;
}

.fuzzy-stat-content h4 {
    margin: 0 0 5px 0;
    font-size: 14px;
    color: #555;
}

.fuzzy-stat-content p {
    margin: 0;
    font-size: 16px;
    font-weight: bold;
    color: #333;
}

.fuzzy-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-size: 16px;
    color: #666;
}

.fuzzy-loading i {
    margin-right: 10px;
    color: #3498db;
}

.dashboard-saw-stats {
    margin-top: 30px;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.saw-stats-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
}

.saw-stats-header h3 {
    margin: 0;
    color: #34495e;
    font-size: 18px;
    display: flex;
    align-items: center;
}

.saw-stats-header i {
    margin-right: 10px;
    color: #27ae60;
}

.saw-stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.saw-stat-item {
    display: flex;
    align-items: center;
    background: #f9f9f9;
    border-radius: 6px;
    padding: 10px 15px;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
}

.saw-stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    font-size: 20px;
}

.saw-stat-icon.tinggi {
    background-color: #e8f5e9; /* Light green */
    color: #27ae60;
}

.saw-stat-icon.sedang {
    background-color: #fff3cd; /* Light yellow */
    color: #f1c40f;
}

.saw-stat-icon.kecil {
    background-color: #ffebee; /* Light red */
    color: #e74c3c;
}

.saw-stat-content h4 {
    margin: 0 0 5px 0;
    font-size: 14px;
    color: #555;
}

.saw-stat-content p {
    margin: 0;
    font-size: 16px;
    font-weight: bold;
    color: #333;
}

.saw-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-size: 16px;
    color: #666;
}

.saw-loading i {
    margin-right: 10px;
    color: #3498db;
}

@media (max-width: 768px) {
    .dashboard-stats-container {
        grid-template-columns: 1fr;
    }
    
    .dashboard-charts {
        grid-template-columns: 1fr;
    }
    
    .fuzzy-stats-container {
        grid-template-columns: 1fr;
    }
    
    .fuzzy-stat-item {
        flex-direction: column;
        text-align: center;
    }
    
    .fuzzy-stat-icon {
        margin: 0 0 10px 0;
    }
    
    .saw-stats-container {
        grid-template-columns: 1fr;
    }
    
    .saw-stats-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .saw-stats-actions {
    display: flex;
    gap: 10px;
}

/* Desktop styles for refresh button - Enhanced Design */
.refresh-saw-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    font-size: 0.95em;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff9ff3 100%);
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
    text-decoration: none;
    outline: none;
    position: relative;
    overflow: hidden;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.refresh-saw-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.refresh-saw-btn:hover::before {
    left: 100%;
}

.refresh-saw-btn:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 35px rgba(255, 107, 107, 0.6);
    background: linear-gradient(135deg, #ff5252 0%, #d63031 50%, #fd79a8 100%);
}

.refresh-saw-btn:active {
    transform: translateY(-1px) scale(1.02);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.refresh-saw-btn i {
    font-size: 1.1em;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.refresh-saw-btn:hover i {
    transform: rotate(360deg) scale(1.2);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.refresh-saw-btn span {
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.refresh-saw-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
    background: linear-gradient(135deg, #bdc3c7 0%, #95a5a6 50%, #ecf0f1 100%);
}

.refresh-saw-btn:disabled:hover {
    transform: none;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.refresh-saw-btn:disabled i {
    transform: none;
    filter: none;
}
    
    .refresh-saw-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        font-size: 0.9em;
        font-weight: 600;
        color: #fff;
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff9ff3 100%);
        border: none;
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
        text-decoration: none;
        outline: none;
        position: relative;
        overflow: hidden;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .refresh-saw-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s;
    }
    
    .refresh-saw-btn:hover::before {
        left: 100%;
    }
    
    .refresh-saw-btn:hover {
        transform: translateY(-2px) scale(1.03);
        box-shadow: 0 8px 25px rgba(255, 107, 107, 0.6);
        background: linear-gradient(135deg, #ff5252 0%, #d63031 50%, #fd79a8 100%);
    }
    
    .refresh-saw-btn:active {
        transform: translateY(-1px) scale(1.01);
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
    }
    
    .refresh-saw-btn i {
        font-size: 1em;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
    
    .refresh-saw-btn:hover i {
        transform: rotate(360deg) scale(1.1);
        filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
    }
    
    .refresh-saw-btn span {
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    
    .refresh-saw-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        background: linear-gradient(135deg, #bdc3c7 0%, #95a5a6 50%, #ecf0f1 100%);
    }
    
    .refresh-saw-btn:disabled:hover {
        transform: none;
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
    }
    
    .refresh-saw-btn:disabled i {
        transform: none;
        filter: none;
    }
    
    .saw-stat-item {
        flex-direction: column;
        text-align: center;
    }
    
    .saw-stat-icon {
        margin: 0 0 10px 0;
    }
}

/* SAW Distribution Loading Styles */
.saw-distribution-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 120px;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 10px 0;
}

.saw-distribution-loading .loading-content {
    text-align: center;
    color: #666;
    padding: 20px;
}

.saw-distribution-loading .loading-content i {
    font-size: 2.5em;
    color: #1a237e;
    margin-bottom: 15px;
    animation: spin 1s linear infinite;
}

.saw-distribution-loading .loading-content span {
    display: block;
    font-size: 1.1em;
    font-weight: 500;
    margin-bottom: 15px;
    color: #1a237e;
}

.saw-distribution-loading .loading-progress {
    width: 200px;
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    overflow: hidden;
    margin: 0 auto 10px auto;
}

.saw-distribution-loading .progress-bar {
    height: 100%;
    background: linear-gradient(45deg, #1a237e 25%, transparent 25%, transparent 50%, #1a237e 50%, #1a237e 75%, transparent 75%, transparent);
    background-size: 20px 20px;
    animation: progressMove 2s linear infinite;
}

.saw-distribution-loading small {
    display: block;
    font-size: 0.9em;
    color: #888;
    font-style: italic;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@keyframes progressMove {
    0% { background-position: 0 0; }
    100% { background-position: 20px 0; }
}
</style>
`; 