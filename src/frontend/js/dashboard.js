// Fungsi untuk menampilkan notifikasi (fallback jika app.js belum load)
function showNotification(title, message, type) {
    const notification = $("#notification").data("kendoNotification");
    if (notification) {
        notification.show({
            title: title,
            message: message
        }, type);
    } else {
        // Fallback jika Kendo Notification belum siap
        console.warn("Kendo Notification belum diinisialisasi, menggunakan alert sebagai fallback");
        console.log("{$title}, {$message}, menggunakan alert sebagai fallback");
        // alert(`${title}: ${message}`);
    }
}

// Inisialisasi Dashboard saat dokumen siap
$(document).ready(function() {
    // Tunggu sampai CONFIG tersedia
    waitForConfig().then(() => {
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
    }).catch(error => {
        console.error('Failed to initialize dashboard:', error);
    });
});

// Fungsi untuk menunggu CONFIG tersedia
function waitForConfig() {
    return new Promise((resolve, reject) => {
        if (typeof CONFIG !== 'undefined') {
            console.log('✅ CONFIG sudah tersedia di dashboard.js');
            resolve();
            return;
        }

        console.log('⚠️ CONFIG belum tersedia, menunggu...');
        let attempts = 0;
        const maxAttempts = 100; // 10 detik dengan interval 100ms

        const checkConfig = setInterval(() => {
            attempts++;
            
            if (typeof CONFIG !== 'undefined') {
                clearInterval(checkConfig);
                console.log('✅ CONFIG berhasil dimuat di dashboard.js');
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkConfig);
                console.error('❌ CONFIG tidak dapat dimuat dalam waktu yang ditentukan');
                reject(new Error('CONFIG timeout'));
            }
        }, 100);
    });
}

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
    // Inisialisasi evaluation summary
    initializeEvaluationSummary();
    // Inisialisasi comparison summary
    initializeComparisonSummary();
    // Inisialisasi actual status stats
    initializeActualStatusStats();
}

function initializeDashboardStats() {
    try {
        // Pastikan CONFIG tersedia
        if (typeof CONFIG === 'undefined') {
            console.error('❌ CONFIG tidak tersedia di initializeDashboardStats');
            showNotification(
                "Error",
                "Konfigurasi aplikasi belum siap",
                "error"
            );
            return;
        }

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
        // Pastikan CONFIG tersedia
        if (typeof CONFIG === 'undefined') {
            console.error('❌ CONFIG tidak tersedia di initializeFuzzyDistribution');
            updateFuzzyDistributionChart(null);
            return;
        }

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
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di loadFuzzyStats');
        updateFuzzyStats(null);
        return;
    }

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
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di loadSAWDistributionWithRetry');
        updateSAWDistributionChart(null);
        return;
    }

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
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di refreshSAWDistribution');
        updateSAWDistributionChart(null);
        return;
    }

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
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di loadSAWStats');
        updateSAWStats(null);
        return;
    }

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
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di initializeFISForm');
        showNotification(
            "Error",
            "Konfigurasi aplikasi belum siap",
            "error"
        );
        return;
    }

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
                
                // Trigger event untuk sinkronisasi dengan halaman FIS
                $(document).trigger('dashboardMahasiswaSelected', [dataItem]);
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
                // Tampilkan hasil klasifikasi dengan profile mahasiswa dan data raw
                const classificationColor = getFISClassificationColor(response.kategori);
                
                var hasilContent = `
                    <div class="fis-result">
                        <div class="result-header">
                            <h4>Hasil untuk ${response.nama || 'N/A'} (${response.nim || 'N/A'})</h4>
                        </div>
                        
                        <div class="result-section">
                            <h5>Informasi Mahasiswa</h5>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="label">NIM:</span>
                                    <span class="value">${response.nim || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Nama:</span>
                                    <span class="value">${response.nama || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Program Studi:</span>
                                    <span class="value">${response.program_studi || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="result-section">
                            <h5>Data Raw</h5>
                            <div class="criteria-grid">
                                <div class="criteria-item">
                                    <div class="criteria-header">
                                        <strong>IPK</strong>
                                    </div>
                                    <div class="criteria-values">
                                        <div>Nilai: <strong>${response.ipk?.toFixed(2) || 'N/A'}</strong></div>
                                        <div>Keanggotaan: <strong>${response.ipk_membership?.toFixed(2) || 'N/A'}</strong></div>
                                    </div>
                                </div>
                                
                                <div class="criteria-item">
                                    <div class="criteria-header">
                                        <strong>SKS</strong>
                                    </div>
                                    <div class="criteria-values">
                                        <div>Nilai: <strong>${response.sks || 'N/A'}</strong></div>
                                        <div>Keanggotaan: <strong>${response.sks_membership?.toFixed(2) || 'N/A'}</strong></div>
                                    </div>
                                </div>
                                
                                <div class="criteria-item">
                                    <div class="criteria-header">
                                        <strong>Nilai D/E/K</strong>
                                    </div>
                                    <div class="criteria-values">
                                        <div>Nilai: <strong>${response.persen_dek?.toFixed(2) || 'N/A'}%</strong></div>
                                        <div>Keanggotaan: <strong>${response.nilai_dk_membership?.toFixed(2) || 'N/A'}</strong></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="result-final" style="background: ${classificationColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
                            <h4>Nilai Fuzzy Final: ${response.nilai_fuzzy?.toFixed(2) || 'N/A'}</h4>
                            <h3>Klasifikasi: ${response.kategori || 'N/A'}</h3>
                            <p style="margin: 0; opacity: 0.9;">
                                ${getFISClassificationThreshold(response.kategori)}
                            </p>
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

// Fungsi helper untuk FIS classification
function getFISClassificationColor(classification) {
    if (!classification || typeof classification !== 'string') {
        return '#6c757d'; // Default gray color
    }
    
    if (classification.includes('Tinggi')) return '#28a745';
    if (classification.includes('Sedang')) return '#ffc107';
    if (classification.includes('Kecil')) return '#dc3545';
    
    return '#6c757d'; // Default gray color
}

function getFISClassificationThreshold(classification) {
    if (!classification || typeof classification !== 'string') {
        return 'Klasifikasi tidak tersedia';
    }
    
    if (classification.includes('Tinggi')) {
        return 'Nilai Fuzzy ≥ 70 - Kelulusan Tinggi';
    } else if (classification.includes('Sedang')) {
        return 'Nilai Fuzzy 40-69 - Kelulusan Sedang';
    } else if (classification.includes('Kecil')) {
        return 'Nilai Fuzzy < 40 - Kelulusan Kecil';
    }
    
    return 'Klasifikasi tidak tersedia';
}

// Inisialisasi Evaluation Summary
function initializeEvaluationSummary() {
    try {
        // Pastikan CONFIG tersedia
        if (typeof CONFIG === 'undefined') {
            console.error('❌ CONFIG tidak tersedia di initializeEvaluationSummary');
            return;
        }

        // Tampilkan loading state
        showEvaluationSummaryLoading();
        
        // Mengambil data evaluation summary dari server
        $.ajax({
            url: CONFIG.getApiUrl('/api/dashboard/evaluation-summary'),
            method: 'GET',
            timeout: 60000, // 60 detik timeout karena evaluasi memerlukan waktu
            success: function(response) {
                hideEvaluationSummaryLoading();
                if (response && typeof response === 'object') {
                    updateEvaluationSummary(response);
                } else {
                    console.warn("Invalid evaluation summary response format:", response);
                    updateEvaluationSummary(null);
                }
            },
            error: function(xhr, status, error) {
                hideEvaluationSummaryLoading();
                console.error("Error loading evaluation summary:", {xhr, status, error});
                
                let errorMessage = "Gagal memuat statistik evaluasi";
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    errorMessage += ": " + xhr.responseJSON.detail;
                } else if (status === 'timeout') {
                    errorMessage += ": Server tidak merespons dalam waktu yang ditentukan (timeout)";
                } else if (error) {
                    errorMessage += ": " + error;
                }
                
                showNotification(
                    "Warning",
                    errorMessage,
                    "warning"
                );
                
                // Update dengan data default
                updateEvaluationSummary(null);
            }
        });
    } catch (error) {
        console.error("Error in initializeEvaluationSummary:", error);
        hideEvaluationSummaryLoading();
        updateEvaluationSummary(null);
    }
}

function showEvaluationSummaryLoading() {
    const loadingHtml = `
        <div class="dashboard-evaluation-summary">
            <div class="evaluation-summary-header">
                <h3><i class="fas fa-chart-line"></i> Statistik Evaluasi Aktual</h3>
            </div>
            <div class="evaluation-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Memuat statistik evaluasi... (Ini mungkin memerlukan beberapa saat)</span>
            </div>
        </div>
    `;
    
    // Cek apakah section sudah ada, jika tidak tambahkan
    if ($('.dashboard-evaluation-summary').length === 0) {
        $('.dashboard-stats').after(loadingHtml);
    } else {
        $('.dashboard-evaluation-summary').html(loadingHtml);
    }
}

function hideEvaluationSummaryLoading() {
    $('.evaluation-loading').remove();
}

function updateEvaluationSummary(data) {
    // Default data jika API belum tersedia atau error
    const defaultData = {
        fis: {
            total_data: 0,
            accuracy: 0.0,
            precision: 0.0,
            recall: 0.0,
            f1_score: 0.0,
            available: false
        },
        saw: {
            total_data: 0,
            accuracy: 0.0,
            precision: 0.0,
            recall: 0.0,
            f1_score: 0.0,
            available: false
        }
    };

    const evalData = data || defaultData;
    const fisData = evalData.fis || defaultData.fis;
    const sawData = evalData.saw || defaultData.saw;

    // Render evaluation summary
    const summaryHtml = `
        <div class="evaluation-summary-header">
            <h3><i class="fas fa-chart-line"></i> Statistik Evaluasi Aktual</h3>
        </div>
        <div class="evaluation-summary-container">
            <!-- FIS Evaluation Card -->
            <div class="evaluation-card fis-card ${!fisData.available ? 'unavailable' : ''}">
                <div class="evaluation-card-header">
                    <div class="evaluation-card-title fis-title">
                        <i class="fas fa-brain"></i>
                        <span>Evaluasi FIS</span>
                    </div>
                    ${fisData.available ? `
                        <a href="#fis-actual-evaluation" class="evaluation-card-link">
                            <span>Lihat Detail</span>
                            <i class="fas fa-arrow-right" style="margin-left: 5px;"></i>
                        </a>
                    ` : ''}
                </div>
                ${fisData.available ? `
                    <div class="evaluation-metrics">
                        <div class="evaluation-metric accuracy">
                            <div class="evaluation-metric-label">Akurasi</div>
                            <div class="evaluation-metric-value">
                                ${fisData.accuracy.toFixed(2)}<span class="unit">%</span>
                            </div>
                        </div>
                        <div class="evaluation-metric precision">
                            <div class="evaluation-metric-label">Precision</div>
                            <div class="evaluation-metric-value">
                                ${fisData.precision.toFixed(2)}<span class="unit">%</span>
                            </div>
                        </div>
                        <div class="evaluation-metric recall">
                            <div class="evaluation-metric-label">Recall</div>
                            <div class="evaluation-metric-value">
                                ${fisData.recall.toFixed(2)}<span class="unit">%</span>
                            </div>
                        </div>
                        <div class="evaluation-metric f1-score">
                            <div class="evaluation-metric-label">F1-Score</div>
                            <div class="evaluation-metric-value">
                                ${fisData.f1_score.toFixed(2)}<span class="unit">%</span>
                            </div>
                        </div>
                    </div>
                    <div class="evaluation-total-data">
                        <div class="evaluation-total-data-label">Total Data Evaluasi</div>
                        <div class="evaluation-total-data-value">${fisData.total_data} mahasiswa</div>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 20px; color: #999;">
                        <i class="fas fa-exclamation-circle" style="font-size: 32px; margin-bottom: 10px;"></i>
                        <p>Data evaluasi FIS belum tersedia</p>
                        <a href="#fis-actual-evaluation" class="evaluation-card-link" style="justify-content: center; margin-top: 10px;">
                            <span>Jalankan Evaluasi</span>
                            <i class="fas fa-arrow-right" style="margin-left: 5px;"></i>
                        </a>
                    </div>
                `}
            </div>
            
            <!-- SAW Evaluation Card -->
            <div class="evaluation-card saw-card ${!sawData.available ? 'unavailable' : ''}">
                <div class="evaluation-card-header">
                    <div class="evaluation-card-title saw-title">
                        <i class="fas fa-calculator"></i>
                        <span>Evaluasi SAW</span>
                    </div>
                    ${sawData.available ? `
                        <a href="#saw-evaluation-actual" class="evaluation-card-link">
                            <span>Lihat Detail</span>
                            <i class="fas fa-arrow-right" style="margin-left: 5px;"></i>
                        </a>
                    ` : ''}
                </div>
                ${sawData.available ? `
                    <div class="evaluation-metrics">
                        <div class="evaluation-metric accuracy">
                            <div class="evaluation-metric-label">Akurasi</div>
                            <div class="evaluation-metric-value">
                                ${sawData.accuracy.toFixed(2)}<span class="unit">%</span>
                            </div>
                        </div>
                        <div class="evaluation-metric precision">
                            <div class="evaluation-metric-label">Precision</div>
                            <div class="evaluation-metric-value">
                                ${sawData.precision.toFixed(2)}<span class="unit">%</span>
                            </div>
                        </div>
                        <div class="evaluation-metric recall">
                            <div class="evaluation-metric-label">Recall</div>
                            <div class="evaluation-metric-value">
                                ${sawData.recall.toFixed(2)}<span class="unit">%</span>
                            </div>
                        </div>
                        <div class="evaluation-metric f1-score">
                            <div class="evaluation-metric-label">F1-Score</div>
                            <div class="evaluation-metric-value">
                                ${sawData.f1_score.toFixed(2)}<span class="unit">%</span>
                            </div>
                        </div>
                    </div>
                    <div class="evaluation-total-data">
                        <div class="evaluation-total-data-label">Total Data Evaluasi</div>
                        <div class="evaluation-total-data-value">${sawData.total_data} mahasiswa</div>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 20px; color: #999;">
                        <i class="fas fa-exclamation-circle" style="font-size: 32px; margin-bottom: 10px;"></i>
                        <p>Data evaluasi SAW belum tersedia</p>
                        <a href="#saw-evaluation-actual" class="evaluation-card-link" style="justify-content: center; margin-top: 10px;">
                            <span>Jalankan Evaluasi</span>
                            <i class="fas fa-arrow-right" style="margin-left: 5px;"></i>
                        </a>
                    </div>
                `}
            </div>
        </div>
    `;

    // Update atau create evaluation summary section
    if ($('.dashboard-evaluation-summary').length === 0) {
        $('.dashboard-stats').after(`<div class="dashboard-evaluation-summary">${summaryHtml}</div>`);
    } else {
        $('.dashboard-evaluation-summary').html(summaryHtml);
    }
}

// Inisialisasi Comparison Summary
function initializeComparisonSummary() {
    try {
        // Pastikan CONFIG tersedia
        if (typeof CONFIG === 'undefined') {
            console.error('❌ CONFIG tidak tersedia di initializeComparisonSummary');
            return;
        }

        // Tampilkan loading state
        showComparisonSummaryLoading();
        
        // Mengambil data comparison summary dari server
        $.ajax({
            url: CONFIG.getApiUrl('/api/dashboard/comparison-summary'),
            method: 'GET',
            timeout: 120000, // 2 menit timeout karena evaluasi memerlukan waktu
            success: function(response) {
                hideComparisonSummaryLoading();
                if (response && typeof response === 'object') {
                    updateDashboardComparisonSummary(response);
                } else {
                    console.warn("Invalid comparison summary response format:", response);
                    updateDashboardComparisonSummary(null);
                }
            },
            error: function(xhr, status, error) {
                hideComparisonSummaryLoading();
                console.error("Error loading comparison summary:", {xhr, status, error});
                
                let errorMessage = "Gagal memuat perbandingan FIS vs SAW";
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    errorMessage += ": " + xhr.responseJSON.detail;
                } else if (status === 'timeout') {
                    errorMessage += ": Server tidak merespons dalam waktu yang ditentukan (timeout)";
                } else if (error) {
                    errorMessage += ": " + error;
                }
                
                showNotification(
                    "Warning",
                    errorMessage,
                    "warning"
                );
                
                // Update dengan data default
                updateDashboardComparisonSummary(null);
            }
        });
    } catch (error) {
        console.error("Error in initializeComparisonSummary:", error);
        hideComparisonSummaryLoading();
        updateDashboardComparisonSummary(null);
    }
}

function showComparisonSummaryLoading() {
    const loadingHtml = `
        <div class="dashboard-comparison-summary">
            <div class="comparison-summary-header">
                <h3><i class="fas fa-balance-scale"></i> Perbandingan FIS vs SAW</h3>
            </div>
            <div class="comparison-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Memuat perbandingan... (Ini mungkin memerlukan beberapa saat)</span>
            </div>
        </div>
    `;
    
    // Cek apakah section sudah ada, jika tidak tambahkan
    if ($('.dashboard-comparison-summary').length === 0) {
        $('.dashboard-evaluation-summary').after(loadingHtml);
    } else {
        $('.dashboard-comparison-summary').html(loadingHtml);
    }
}

function hideComparisonSummaryLoading() {
    $('.comparison-loading').remove();
}

function updateDashboardComparisonSummary(data) {
    // Default data jika API belum tersedia atau error
    const defaultData = {
        consistency: 0.0,
        correlation: 0.0,
        accuracy_diff: 0.0,
        fis_metrics: {
            accuracy: 0.0,
            precision: 0.0,
            recall: 0.0,
            f1_score: 0.0
        },
        saw_metrics: {
            accuracy: 0.0,
            precision: 0.0,
            recall: 0.0,
            f1_score: 0.0
        },
        fis_distribution: {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        },
        saw_distribution: {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 0,
            "Peluang Lulus Kecil": 0
        },
        available: false
    };

    const compData = data || defaultData;

    // Render comparison summary
    const summaryHtml = `
        <div class="comparison-summary-header">
            <h3><i class="fas fa-balance-scale"></i> Perbandingan FIS vs SAW</h3>
            ${compData.available ? `
                <a href="#comparison" class="comparison-summary-link">
                    <span>Lihat Detail Perbandingan</span>
                    <i class="fas fa-arrow-right" style="margin-left: 5px;"></i>
                </a>
            ` : ''}
        </div>
        ${compData.available ? `
            <div class="comparison-summary-content">
                <!-- Charts Row -->
                <div class="comparison-charts-row">
                    <div class="comparison-chart-container">
                        <h4><i class="fas fa-brain"></i> Distribusi FIS</h4>
                        <div id="dashboardComparisonFISChart" style="height: 250px;"></div>
                    </div>
                    <div class="comparison-chart-container">
                        <h4><i class="fas fa-calculator"></i> Distribusi SAW</h4>
                        <div id="dashboardComparisonSAWChart" style="height: 250px;"></div>
                    </div>
                </div>
                
                <!-- Metrics Comparison -->
                <div class="comparison-metrics-section">
                    <h4><i class="fas fa-chart-bar"></i> Perbandingan Metrik</h4>
                    <div id="dashboardComparisonMetricsChart" style="height: 300px;"></div>
                </div>
                
                <!-- Summary Stats -->
                <div class="comparison-summary-stats">
                    <div class="comparison-stat-item">
                        <div class="comparison-stat-label">Konsistensi Hasil</div>
                        <div class="comparison-stat-value">${compData.consistency.toFixed(1)}%</div>
                        <div class="comparison-stat-desc">Hasil yang sama antara FIS dan SAW</div>
                    </div>
                    <div class="comparison-stat-item correlation-item" style="cursor: pointer;" title="Klik untuk penjelasan">
                        <div class="comparison-stat-label">Korelasi Ranking</div>
                        <div class="comparison-stat-value">${compData.correlation.toFixed(3)}</div>
                        <div class="comparison-stat-desc">Spearman's Rank Correlation</div>
                    </div>
                    <div class="comparison-stat-item">
                        <div class="comparison-stat-label">Perbedaan Akurasi</div>
                        <div class="comparison-stat-value ${compData.accuracy_diff >= 0 ? 'positive' : 'negative'}">
                            ${compData.accuracy_diff >= 0 ? '+' : ''}${compData.accuracy_diff.toFixed(2)}%
                        </div>
                        <div class="comparison-stat-desc">FIS ${compData.accuracy_diff >= 0 ? 'lebih tinggi' : 'lebih rendah'} dari SAW</div>
                    </div>
                </div>
            </div>
        ` : `
            <div style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
                <p style="font-size: 16px; margin-bottom: 20px;">Data perbandingan belum tersedia</p>
                <a href="#comparison" class="comparison-summary-link" style="justify-content: center; display: inline-flex; align-items: center;">
                    <span>Jalankan Perbandingan</span>
                    <i class="fas fa-arrow-right" style="margin-left: 5px;"></i>
                </a>
            </div>
        `}
    `;

    // Update atau create comparison summary section
    if ($('.dashboard-comparison-summary').length === 0) {
        $('.dashboard-evaluation-summary').after(`<div class="dashboard-comparison-summary">${summaryHtml}</div>`);
    } else {
        $('.dashboard-comparison-summary').html(summaryHtml);
    }
    
    // Render charts jika data tersedia
    if (compData.available) {
        renderComparisonCharts(compData);
        
        // Attach click handler untuk correlation
        $('.correlation-item').off('click').on('click', function() {
            showCorrelationModal(compData.correlation);
        });
    }
}

function renderComparisonCharts(data) {
    // Render FIS Distribution Pie Chart
    if (typeof kendo !== 'undefined' && $('#dashboardComparisonFISChart').length > 0) {
        const fisChartData = [
            { category: "Peluang Lulus Tinggi", value: data.fis_distribution["Peluang Lulus Tinggi"], color: "#28a745" },
            { category: "Peluang Lulus Sedang", value: data.fis_distribution["Peluang Lulus Sedang"], color: "#ffc107" },
            { category: "Peluang Lulus Kecil", value: data.fis_distribution["Peluang Lulus Kecil"], color: "#dc3545" }
        ].filter(item => item.value > 0);
        
        $("#dashboardComparisonFISChart").kendoChart({
            seriesDefaults: {
                type: "pie",
                labels: {
                    visible: true,
                    template: "#= category #\n#= value # (#= kendo.format('{0:P}', percentage) #)"
                }
            },
            series: [{
                data: fisChartData,
                field: "value",
                categoryField: "category",
                colorField: "color"
            }],
            tooltip: {
                visible: true,
                template: "#= category #: #= value # mahasiswa"
            }
        });
    }
    
    // Render SAW Distribution Pie Chart
    if (typeof kendo !== 'undefined' && $('#dashboardComparisonSAWChart').length > 0) {
        const sawChartData = [
            { category: "Peluang Lulus Tinggi", value: data.saw_distribution["Peluang Lulus Tinggi"], color: "#28a745" },
            { category: "Peluang Lulus Sedang", value: data.saw_distribution["Peluang Lulus Sedang"], color: "#ffc107" },
            { category: "Peluang Lulus Kecil", value: data.saw_distribution["Peluang Lulus Kecil"], color: "#dc3545" }
        ].filter(item => item.value > 0);
        
        $("#dashboardComparisonSAWChart").kendoChart({
            seriesDefaults: {
                type: "pie",
                labels: {
                    visible: true,
                    template: "#= category #\n#= value # (#= kendo.format('{0:P}', percentage) #)"
                }
            },
            series: [{
                data: sawChartData,
                field: "value",
                categoryField: "category",
                colorField: "color"
            }],
            tooltip: {
                visible: true,
                template: "#= category #: #= value # mahasiswa"
            }
        });
    }
    
    // Render Metrics Comparison Bar Chart
    if (typeof kendo !== 'undefined' && $('#dashboardComparisonMetricsChart').length > 0) {
        const metricsData = [
            { metric: "Accuracy", fis: data.fis_metrics.accuracy, saw: data.saw_metrics.accuracy },
            { metric: "Precision", fis: data.fis_metrics.precision, saw: data.saw_metrics.precision },
            { metric: "Recall", fis: data.fis_metrics.recall, saw: data.saw_metrics.recall },
            { metric: "F1-Score", fis: data.fis_metrics.f1_score, saw: data.saw_metrics.f1_score }
        ];
        
        $("#dashboardComparisonMetricsChart").kendoChart({
            dataSource: {
                data: metricsData
            },
            series: [
                {
                    name: "FIS",
                    field: "fis",
                    color: "#1a237e"
                },
                {
                    name: "SAW",
                    field: "saw",
                    color: "#27ae60"
                }
            ],
            categoryAxis: {
                field: "metric"
            },
            valueAxis: {
                min: 0,
                max: 100,
                labels: {
                    template: "#= value #%"
                }
            },
            tooltip: {
                visible: true,
                template: "#= series.name #: #= value #%"
            },
            legend: {
                position: "bottom"
            }
        });
    }
}

function showCorrelationModal(correlationValue) {
    // Reuse modal dari comparison.js jika tersedia
    if (typeof showCorrelationRankingModal === 'function') {
        // Set nilai korelasi terlebih dahulu
        $('#statCorrelation').text(correlationValue.toFixed(3));
        showCorrelationRankingModal();
    } else {
        // Fallback simple modal
        alert(`Korelasi Ranking: ${correlationValue.toFixed(3)}\n\nNilai ini mengukur konsistensi urutan ranking antara FIS dan SAW.`);
    }
}

// Inisialisasi Actual Status Stats
function initializeActualStatusStats() {
    try {
        // Pastikan CONFIG tersedia
        if (typeof CONFIG === 'undefined') {
            console.error('❌ CONFIG tidak tersedia di initializeActualStatusStats');
            return;
        }

        // Tampilkan loading state
        showActualStatusStatsLoading();
        
        // Mengambil data actual status stats dari server
        $.ajax({
            url: CONFIG.getApiUrl('/api/dashboard/actual-status-stats'),
            method: 'GET',
            timeout: 120000, // 2 menit timeout karena mungkin perlu evaluasi
            success: function(response) {
                hideActualStatusStatsLoading();
                if (response && typeof response === 'object') {
                    updateActualStatusStats(response);
                } else {
                    console.warn("Invalid actual status stats response format:", response);
                    updateActualStatusStats(null);
                }
            },
            error: function(xhr, status, error) {
                hideActualStatusStatsLoading();
                console.error("Error loading actual status stats:", {xhr, status, error});
                
                let errorMessage = "Gagal memuat statistik status lulus aktual";
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    errorMessage += ": " + xhr.responseJSON.detail;
                } else if (status === 'timeout') {
                    errorMessage += ": Server tidak merespons dalam waktu yang ditentukan (timeout)";
                } else if (error) {
                    errorMessage += ": " + error;
                }
                
                showNotification(
                    "Warning",
                    errorMessage,
                    "warning"
                );
                
                // Update dengan data default
                updateActualStatusStats(null);
            }
        });
    } catch (error) {
        console.error("Error in initializeActualStatusStats:", error);
        hideActualStatusStatsLoading();
        updateActualStatusStats(null);
    }
}

function showActualStatusStatsLoading() {
    const loadingHtml = `
        <div class="dashboard-actual-status-stats">
            <div class="actual-status-header">
                <h3><i class="fas fa-check-circle"></i> Status Lulus Aktual</h3>
            </div>
            <div class="actual-status-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Memuat statistik status lulus aktual... (Ini mungkin memerlukan beberapa saat)</span>
            </div>
        </div>
    `;
    
    // Cek apakah section sudah ada, jika tidak tambahkan
    if ($('.dashboard-actual-status-stats').length === 0) {
        $('.dashboard-comparison-summary').after(loadingHtml);
    } else {
        $('.dashboard-actual-status-stats').html(loadingHtml);
    }
}

function hideActualStatusStatsLoading() {
    $('.actual-status-loading').remove();
}

function updateActualStatusStats(data) {
    // Default data jika API belum tersedia atau error
    const defaultData = {
        total: 0,
        distribution: {
            "LULUS_TINGGI": 0,
            "LULUS_SEDANG": 0,
            "LULUS_KECIL": 0
        },
        percentages: {
            "LULUS_TINGGI": 0.0,
            "LULUS_SEDANG": 0.0,
            "LULUS_KECIL": 0.0
        },
        comparison: {
            available: false,
            fis_distribution: {
                "Peluang Lulus Tinggi": 0,
                "Peluang Lulus Sedang": 0,
                "Peluang Lulus Kecil": 0
            },
            saw_distribution: {
                "Peluang Lulus Tinggi": 0,
                "Peluang Lulus Sedang": 0,
                "Peluang Lulus Kecil": 0
            }
        },
        available: false
    };

    const statusData = data || defaultData;

    // Helper function untuk format status
    const formatStatus = (status) => {
        return status ? status.replace(/_/g, ' ') : 'N/A';
    };

    // Helper function untuk get status color
    const getStatusColor = (status) => {
        switch(status) {
            case 'LULUS_TINGGI':
                return { bg: '#28a745', text: '#fff', name: 'Tinggi' };
            case 'LULUS_SEDANG':
                return { bg: '#ffc107', text: '#000', name: 'Sedang' };
            case 'LULUS_KECIL':
                return { bg: '#dc3545', text: '#fff', name: 'Kecil' };
            default:
                return { bg: '#6c757d', text: '#fff', name: 'N/A' };
        }
    };

    // Render actual status stats
    const statsHtml = `
        <div class="actual-status-header">
            <h3><i class="fas fa-check-circle"></i> Status Lulus Aktual</h3>
        </div>
        ${statusData.available ? `
            <div class="actual-status-content">
                <!-- Summary Stats -->
                <div class="actual-status-summary">
                    <div class="actual-status-total">
                        <div class="actual-status-total-label">Total Data Berlabel</div>
                        <div class="actual-status-total-value">${statusData.total} mahasiswa</div>
                    </div>
                    <div class="actual-status-breakdown">
                        ${Object.entries(statusData.distribution).map(([status, count]) => {
                            const color = getStatusColor(status);
                            const percentage = statusData.percentages[status] || 0;
                            return `
                                <div class="actual-status-item" style="border-left: 4px solid ${color.bg};">
                                    <div class="actual-status-item-label">${formatStatus(status)}</div>
                                    <div class="actual-status-item-value" style="color: ${color.bg};">
                                        ${count} mahasiswa
                                    </div>
                                    <div class="actual-status-item-percentage">${percentage.toFixed(1)}%</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <!-- Charts Row -->
                <div class="actual-status-charts-row">
                    <div class="actual-status-chart-container">
                        <h4><i class="fas fa-chart-pie"></i> Distribusi Status Aktual</h4>
                        <div id="dashboardActualStatusPieChart" style="height: 300px;"></div>
                    </div>
                    ${statusData.comparison.available ? `
                        <div class="actual-status-chart-container">
                            <h4><i class="fas fa-chart-bar"></i> Perbandingan dengan Prediksi</h4>
                            <div id="dashboardActualStatusComparisonChart" style="height: 300px;"></div>
                        </div>
                    ` : ''}
                </div>
            </div>
        ` : `
            <div style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
                <p style="font-size: 16px; margin-bottom: 20px;">Data status lulus aktual belum tersedia</p>
                <p style="font-size: 14px; color: #666;">Pastikan data mahasiswa memiliki status_lulus_aktual (LULUS_TINGGI, LULUS_SEDANG, LULUS_KECIL)</p>
            </div>
        `}
    `;

    // Update atau create actual status stats section
    if ($('.dashboard-actual-status-stats').length === 0) {
        $('.dashboard-comparison-summary').after(`<div class="dashboard-actual-status-stats">${statsHtml}</div>`);
    } else {
        $('.dashboard-actual-status-stats').html(statsHtml);
    }
    
    // Render charts jika data tersedia
    if (statusData.available) {
        renderActualStatusCharts(statusData);
    }
}

function renderActualStatusCharts(data) {
    // Render Pie Chart untuk distribusi status aktual
    if (typeof kendo !== 'undefined' && $('#dashboardActualStatusPieChart').length > 0) {
        const pieChartData = [
            { 
                category: "LULUS TINGGI", 
                value: data.distribution["LULUS_TINGGI"], 
                color: "#28a745" 
            },
            { 
                category: "LULUS SEDANG", 
                value: data.distribution["LULUS_SEDANG"], 
                color: "#ffc107" 
            },
            { 
                category: "LULUS KECIL", 
                value: data.distribution["LULUS_KECIL"], 
                color: "#dc3545" 
            }
        ].filter(item => item.value > 0);
        
        $("#dashboardActualStatusPieChart").kendoChart({
            seriesDefaults: {
                type: "pie",
                labels: {
                    visible: true,
                    template: "#= category #\n#= value # (#= kendo.format('{0:P}', percentage) #)"
                }
            },
            series: [{
                data: pieChartData,
                field: "value",
                categoryField: "category",
                colorField: "color"
            }],
            tooltip: {
                visible: true,
                template: "#= category #: #= value # mahasiswa (#= kendo.format('{0:P}', percentage) #)"
            }
        });
    }
    
    // Render Bar Chart untuk perbandingan dengan prediksi
    if (data.comparison.available && typeof kendo !== 'undefined' && $('#dashboardActualStatusComparisonChart').length > 0) {
        const comparisonData = [
            { 
                category: "Tinggi", 
                actual: data.distribution["LULUS_TINGGI"],
                fis: data.comparison.fis_distribution["Peluang Lulus Tinggi"],
                saw: data.comparison.saw_distribution["Peluang Lulus Tinggi"]
            },
            { 
                category: "Sedang", 
                actual: data.distribution["LULUS_SEDANG"],
                fis: data.comparison.fis_distribution["Peluang Lulus Sedang"],
                saw: data.comparison.saw_distribution["Peluang Lulus Sedang"]
            },
            { 
                category: "Kecil", 
                actual: data.distribution["LULUS_KECIL"],
                fis: data.comparison.fis_distribution["Peluang Lulus Kecil"],
                saw: data.comparison.saw_distribution["Peluang Lulus Kecil"]
            }
        ];
        
        $("#dashboardActualStatusComparisonChart").kendoChart({
            dataSource: {
                data: comparisonData
            },
            series: [
                {
                    name: "Status Aktual",
                    field: "actual",
                    color: "#6c757d"
                },
                {
                    name: "Prediksi FIS",
                    field: "fis",
                    color: "#1a237e"
                },
                {
                    name: "Prediksi SAW",
                    field: "saw",
                    color: "#27ae60"
                }
            ],
            categoryAxis: {
                field: "category"
            },
            valueAxis: {
                min: 0,
                labels: {
                    template: "#= value #"
                }
            },
            tooltip: {
                visible: true,
                template: "#= series.name #: #= value # mahasiswa"
            },
            legend: {
                position: "bottom"
            }
        });
    }
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

/* Styling untuk hasil klasifikasi FIS */
.fis-result {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-top: 20px;
}

.result-header {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e9ecef;
}

.result-header h4 {
    margin: 0;
    color: #1a237e;
    font-size: 1.3rem;
    display: flex;
    align-items: center;
}

.result-section {
    margin-bottom: 25px;
}

.result-section h5 {
    color: #1a237e;
    margin-bottom: 15px;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.info-item {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 6px;
    border-left: 4px solid #1a237e;
}

.info-item .label {
    font-weight: 600;
    color: #495057;
    display: block;
    margin-bottom: 5px;
}

.info-item .value {
    color: #1a237e;
    font-weight: 500;
}

.criteria-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
}

.criteria-item {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
}

.criteria-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.criteria-header {
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #dee2e6;
}

.criteria-header strong {
    color: #1a237e;
    font-size: 1rem;
}

.criteria-values {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.criteria-values div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
}

.criteria-values div:first-child {
    font-weight: 500;
    color: #495057;
}

.result-final {
    margin-top: 20px;
    border-radius: 8px;
    text-align: center;
    padding: 20px;
}

.result-final h4 {
    margin: 0 0 10px 0;
    font-size: 1.2rem;
}

.result-final h3 {
    margin: 0 0 10px 0;
    font-size: 1.5rem;
    font-weight: bold;
}

.result-final p {
    margin: 0;
    opacity: 0.9;
    font-size: 0.9rem;
}

/* Responsive design untuk hasil klasifikasi */
@media (max-width: 768px) {
    .info-grid {
        grid-template-columns: 1fr;
    }
    
    .criteria-grid {
        grid-template-columns: 1fr;
    }
    
    .fis-result {
        padding: 15px;
    }
    
    .result-header h4 {
        font-size: 1.1rem;
    }
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

/* Evaluation Summary Styles */
.dashboard-evaluation-summary {
    margin-top: 30px;
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.evaluation-summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e9ecef;
}

.evaluation-summary-header h3 {
    margin: 0;
    color: #1a237e;
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
}

.evaluation-summary-header i {
    margin-right: 10px;
    color: #1a237e;
}

.evaluation-summary-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
}

.evaluation-card {
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 10px;
    padding: 20px;
    border: 2px solid #e9ecef;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.evaluation-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 100%;
    background: linear-gradient(180deg, #1a237e 0%, #3f51b5 100%);
}

.evaluation-card.fis-card::before {
    background: linear-gradient(180deg, #1a237e 0%, #3f51b5 100%);
}

.evaluation-card.saw-card::before {
    background: linear-gradient(180deg, #27ae60 0%, #2ecc71 100%);
}

.evaluation-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    border-color: #1a237e;
}

.evaluation-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
}

.evaluation-card-title {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: #1a237e;
}

.evaluation-card-title i {
    margin-right: 10px;
    font-size: 24px;
}

.evaluation-card-title.fis-title i {
    color: #1a237e;
}

.evaluation-card-title.saw-title i {
    color: #27ae60;
}

.evaluation-card-link {
    color: #1a237e;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
}

.evaluation-card-link:hover {
    color: #3f51b5;
    transform: translateX(5px);
}

.evaluation-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 15px;
}

.evaluation-metric {
    background: white;
    border-radius: 8px;
    padding: 12px;
    border-left: 4px solid #1a237e;
    transition: all 0.3s ease;
}

.evaluation-metric:hover {
    background: #f8f9fa;
    transform: translateX(5px);
}

.evaluation-metric-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.evaluation-metric-value {
    font-size: 24px;
    font-weight: 700;
    color: #1a237e;
    display: flex;
    align-items: baseline;
}

.evaluation-metric-value .unit {
    font-size: 14px;
    font-weight: 500;
    margin-left: 4px;
    color: #666;
}

.evaluation-metric.accuracy .evaluation-metric-value {
    color: #27ae60;
}

.evaluation-metric.precision .evaluation-metric-value {
    color: #3498db;
}

.evaluation-metric.recall .evaluation-metric-value {
    color: #f39c12;
}

.evaluation-metric.f1-score .evaluation-metric-value {
    color: #e74c3c;
}

.evaluation-total-data {
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    margin-top: 10px;
}

.evaluation-total-data-label {
    font-size: 12px;
    color: #1565C0;
    margin-bottom: 5px;
    font-weight: 500;
}

.evaluation-total-data-value {
    font-size: 20px;
    font-weight: 700;
    color: #0d47a1;
}

.evaluation-card.unavailable {
    opacity: 0.6;
    background: #f5f5f5;
}

.evaluation-card.unavailable::before {
    background: #bdbdbd;
}

.evaluation-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #666;
}

.evaluation-loading i {
    margin-right: 10px;
    color: #1a237e;
    font-size: 24px;
}

@media (max-width: 768px) {
    .evaluation-summary-container {
        grid-template-columns: 1fr;
    }
    
    .evaluation-metrics {
        grid-template-columns: 1fr;
    }
}

/* Comparison Summary Styles */
.dashboard-comparison-summary {
    margin-top: 30px;
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.comparison-summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e9ecef;
}

.comparison-summary-header h3 {
    margin: 0;
    color: #1a237e;
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
}

.comparison-summary-header i {
    margin-right: 10px;
    color: #1a237e;
}

.comparison-summary-link {
    color: #1a237e;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
}

.comparison-summary-link:hover {
    color: #3f51b5;
    transform: translateX(5px);
}

.comparison-summary-content {
    margin-top: 20px;
}

.comparison-charts-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.comparison-chart-container {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 20px;
    border: 2px solid #e9ecef;
    transition: all 0.3s ease;
}

.comparison-chart-container:hover {
    border-color: #1a237e;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.comparison-chart-container h4 {
    margin: 0 0 15px 0;
    color: #1a237e;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
}

.comparison-chart-container h4 i {
    margin-right: 8px;
}

.comparison-metrics-section {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 30px;
    border: 2px solid #e9ecef;
}

.comparison-metrics-section h4 {
    margin: 0 0 20px 0;
    color: #1a237e;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
}

.comparison-metrics-section h4 i {
    margin-right: 8px;
}

.comparison-summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.comparison-stat-item {
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 10px;
    padding: 20px;
    border: 2px solid #e9ecef;
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.comparison-stat-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 100%;
    background: linear-gradient(180deg, #1a237e 0%, #3f51b5 100%);
}

.comparison-stat-item.correlation-item::before {
    background: linear-gradient(180deg, #673AB7 0%, #9C27B0 100%);
}

.comparison-stat-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    border-color: #1a237e;
}

.comparison-stat-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.comparison-stat-value {
    font-size: 32px;
    font-weight: 700;
    color: #1a237e;
    margin-bottom: 8px;
}

.comparison-stat-value.positive {
    color: #27ae60;
}

.comparison-stat-value.negative {
    color: #e74c3c;
}

.comparison-stat-desc {
    font-size: 12px;
    color: #999;
    line-height: 1.4;
}

.comparison-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #666;
}

.comparison-loading i {
    margin-right: 10px;
    color: #1a237e;
    font-size: 24px;
}

@media (max-width: 768px) {
    .comparison-charts-row {
        grid-template-columns: 1fr;
    }
    
    .comparison-summary-stats {
        grid-template-columns: 1fr;
    }
}

/* Actual Status Stats Styles */
.dashboard-actual-status-stats {
    margin-top: 30px;
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.actual-status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e9ecef;
}

.actual-status-header h3 {
    margin: 0;
    color: #1a237e;
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
}

.actual-status-header i {
    margin-right: 10px;
    color: #1a237e;
}

.actual-status-content {
    margin-top: 20px;
}

.actual-status-summary {
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 30px;
    border: 2px solid #e9ecef;
}

.actual-status-total {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e9ecef;
}

.actual-status-total-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.actual-status-total-value {
    font-size: 32px;
    font-weight: 700;
    color: #1a237e;
}

.actual-status-breakdown {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.actual-status-item {
    background: white;
    border-radius: 8px;
    padding: 15px;
    transition: all 0.3s ease;
}

.actual-status-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.actual-status-item-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.actual-status-item-value {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 5px;
}

.actual-status-item-percentage {
    font-size: 14px;
    color: #999;
    font-weight: 500;
}

.actual-status-charts-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
}

.actual-status-chart-container {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 20px;
    border: 2px solid #e9ecef;
    transition: all 0.3s ease;
}

.actual-status-chart-container:hover {
    border-color: #1a237e;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.actual-status-chart-container h4 {
    margin: 0 0 15px 0;
    color: #1a237e;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
}

.actual-status-chart-container h4 i {
    margin-right: 8px;
}

.actual-status-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #666;
}

.actual-status-loading i {
    margin-right: 10px;
    color: #1a237e;
    font-size: 24px;
}

@media (max-width: 768px) {
    .actual-status-breakdown {
        grid-template-columns: 1fr;
    }
    
    .actual-status-charts-row {
        grid-template-columns: 1fr;
    }
}
</style>
`; 