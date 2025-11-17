// Inisialisasi komponen FIS saat dokumen siap
$(document).ready(function() {
    initializeFISComponents();
    initializeFISSearchHandlers();
});

function initializeFISComponents() {
    console.log('Initializing FIS components...');
    initializeFISGrid();
    initializeMahasiswaDropdown();
    initializeButtons();
    loadInitialFISBatchResults();
    console.log('FIS components initialized successfully');
}

// Inisialisasi event handler untuk pencarian FIS
function initializeFISSearchHandlers() {
    console.log('Initializing FIS search handlers...');
    
    // Event handler untuk tombol pencarian FIS
    $("#btnSearchFIS").click(function() {
        console.log('🔍 Tombol pencarian FIS diklik');
        performFISSearch();
    });
    
    // Event handler untuk tombol clear pencarian FIS
    $("#btnClearSearchFIS").click(function() {
        console.log('🔍 Tombol clear pencarian FIS diklik');
        clearFISSearch();
    });
    
    // Event handler untuk input pencarian FIS
    $("#searchInputFIS").on('input', function() {
        const searchTerm = $(this).val().trim();
        if (searchTerm.length >= 3) {
            // Auto search setelah 3 karakter
            clearTimeout(window.fisSearchTimeout);
            window.fisSearchTimeout = setTimeout(function() {
                performFISSearch();
            }, 500);
        } else if (searchTerm.length === 0) {
            // Clear search jika input kosong
            clearFISSearch();
        }
    });
    
    // Event handler untuk enter key pada input pencarian FIS
    $("#searchInputFIS").keypress(function(e) {
        if (e.which === 13) { // Enter key
            console.log('🔍 Enter key ditekan pada input pencarian FIS');
            performFISSearch();
        }
    });
    
    // Focus pada input pencarian saat halaman dimuat
    $("#searchInputFIS").focus();
}

// Fungsi untuk mencari mahasiswa berdasarkan nama (sama seperti di nilai.js)
function searchMahasiswaByName(nama) {
    return new Promise((resolve, reject) => {
        console.log('🔧 searchMahasiswaByName dipanggil dengan nama:', nama);
        console.log('🔧 CONFIG.ENDPOINTS.MAHASISWA:', CONFIG?.ENDPOINTS?.MAHASISWA);
        console.log('🔧 CONFIG.getApiUrl:', typeof CONFIG?.getApiUrl);
        
        const url = CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA) + "/search?q=" + encodeURIComponent(nama);
        console.log('🔧 URL request:', url);
        
        $.ajax({
            url: url,
            method: "GET",
            success: function(response) {
                console.log('🔧 Hasil pencarian mahasiswa:', response);
                
                // Handle response format yang berbeda
                let mahasiswaData = [];
                if (Array.isArray(response)) {
                    // Response langsung array
                    mahasiswaData = response;
                } else if (response.data && Array.isArray(response.data)) {
                    // Response dengan wrapper data
                    mahasiswaData = response.data;
                } else {
                    console.log('🔧 Format response tidak dikenali:', response);
                    resolve([]);
                    return;
                }
                
                if (mahasiswaData.length > 0) {
                    // Return array of NIMs
                    const nims = mahasiswaData.map(mahasiswa => mahasiswa.nim);
                    console.log('🔧 NIMs yang ditemukan:', nims);
                    resolve(nims);
                } else {
                    console.log('🔧 Tidak ada mahasiswa ditemukan');
                    resolve([]);
                }
            },
            error: function(xhr, status, error) {
                console.error('🔧 Error mencari mahasiswa:', error);
                console.error('🔧 XHR status:', xhr.status);
                console.error('🔧 XHR response:', xhr.responseText);
                reject(error);
            }
        });
    });
}

// Fungsi untuk melakukan pencarian hasil klasifikasi FIS
// Mendukung pencarian berdasarkan: NIM, Nama, Program Studi, Klasifikasi
// Mendukung multiple keywords dengan koma atau spasi sebagai separator
// Contoh: "informatika, tinggi" atau "sistem sedang"
function performFISSearch() {
    console.log('🔧 performFISSearch dipanggil');
    
    const searchInput = $("#searchInputFIS").val().trim();
    
    if (!searchInput) {
        console.log('🔧 Input pencarian kosong, tampilkan semua data');
        const grid = $("#fisGrid").data("kendoGrid");
        if (grid && fisDataCache.results) {
            grid.dataSource.data(fisDataCache.results);
            updateTotalRecordInfo(fisDataCache.results.length, "totalRecordTextFIS");
        }
        updateFISSearchInfo("Menampilkan semua data klasifikasi FIS", "info");
        return;
    }
    
    console.log('🔧 Memulai pencarian klasifikasi FIS untuk:', searchInput);
    
    try {
        // Tampilkan loading pada grid
        kendo.ui.progress($("#fisGrid"), true);
        updateFISSearchInfo("Sedang mencari data klasifikasi FIS...", "info");
        
        // Filter grid berdasarkan NIM yang ditemukan
        const grid = $("#fisGrid").data("kendoGrid");
        if (!grid) {
            console.error('🔧 Grid FIS tidak ditemukan');
            kendo.ui.progress($("#fisGrid"), false);
            updateFISSearchInfo("Grid FIS tidak tersedia", "error");
            return;
        }
        
        // Gunakan data dari cache jika tersedia
        const allData = fisDataCache.results || grid.dataSource.data();
        console.log('🔧 Total data di grid:', allData.length);
        
        // Parse multiple keywords
        // Support comma separator (e.g., "informatika, tinggi") atau spasi untuk keywords terpisah
        const keywords = searchInput.toLowerCase()
            .split(/[,]+/) // Split by comma
            .map(k => k.trim()) // Trim whitespace
            .filter(k => k.length > 0); // Remove empty strings
        
        console.log('🔧 Keywords untuk filter:', keywords);
        
        // Filter data berdasarkan multiple keywords (AND logic)
        // Semua keywords harus match di salah satu field
        const filteredData = allData.filter(item => {
            // Check if ALL keywords match at least one field
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
                
                // Cek Klasifikasi
                if (item.kategori && item.kategori.toLowerCase().includes(keyword)) {
                    return true;
                }
                
                return false;
            });
        });
        
        console.log('🔧 Data yang difilter:', filteredData.length);
        
        if (filteredData.length === 0) {
            kendo.ui.progress($("#fisGrid"), false);
            grid.dataSource.data([]);
            updateTotalRecordInfo(0, "totalRecordTextFIS");
            updateFISSearchInfo(`Tidak ada data ditemukan untuk "${searchInput}"`, "warning");
            return;
        }
        
        // Update grid dengan data hasil pencarian
        grid.dataSource.data(filteredData);
        
        // Update total record info
        updateTotalRecordInfo(filteredData.length, "totalRecordTextFIS");
        
        // Sembunyikan loading
        kendo.ui.progress($("#fisGrid"), false);
        
        // Build info message
        const keywordText = keywords.length > 1 ? 
            `keywords: "${keywords.join('", "')}"` : 
            `"${searchInput}"`;
        updateFISSearchInfo(`Ditemukan ${filteredData.length} data dengan ${keywordText}`, "success");
        
    } catch (error) {
        console.error('🔧 Error dalam pencarian FIS:', error);
        kendo.ui.progress($("#fisGrid"), false);
        updateFISSearchInfo("Terjadi kesalahan saat mencari data: " + error.message, "error");
    }
}

// Fungsi untuk clear pencarian FIS
function clearFISSearch() {
    $("#searchInputFIS").val("");
    
    // Tampilkan loading saat memuat ulang data
    kendo.ui.progress($("#fisGrid"), true);
    updateFISSearchInfo("Sedang memuat ulang data klasifikasi FIS...", "info");
    
    // Reload data dari cache atau server
    if (fisDataCache.results && isFISCacheValid()) {
        console.log('Reloading FIS data from cache');
        const grid = $("#fisGrid").data("kendoGrid");
        if (grid) {
            grid.dataSource.data(fisDataCache.results);
        }
        kendo.ui.progress($("#fisGrid"), false);
        updateFISSearchInfo(`Berhasil memuat ${fisDataCache.results.length} data klasifikasi FIS`, "success");
    } else {
        console.log('Reloading FIS data from server');
        loadFISGridData();
    }
}

// Fungsi untuk update search info FIS
function updateFISSearchInfo(message, type) {
    const searchInfo = $("#searchInfoFIS");
    const searchResultText = $("#searchResultTextFIS");
    
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

function initializeFISGrid() {
    // Load data dengan caching
    loadFISGridData();
    
    $("#fisGrid").kendoGrid({
        dataSource: {
            data: [], // Akan diisi oleh loadFISGridData
            pageSize: 20
        },
        height: 550,
        sortable: true,
        filterable: false, // Disable filter bawaan Kendo, gunakan custom search
        pageable: {
            refresh: true,
            pageSizes: true,
            buttonCount: 5
        },
        columns: [
            {
                field: "nim",
                title: "NIM",
                width: 120,
                headerAttributes: {
                    style: "text-align: center; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                }
            },
            {
                field: "nama",
                title: "Nama Mahasiswa",
                width: 200,
                headerAttributes: {
                    style: "text-align: center; font-weight: bold;"
                }
            },
            {
                field: "program_studi",
                title: "Program Studi",
                width: 180,
                headerAttributes: {
                    style: "text-align: center; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                },
                template: function(dataItem) {
                    if (!dataItem.program_studi) return '<span style="color: #999;">N/A</span>';
                    const colors = getProdiColor(dataItem.program_studi);
                    return `<span class="badge" style="background: ${colors.bg}; color: ${colors.text}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">${dataItem.program_studi}</span>`;
                }
            },
            {
                field: "kategori",
                title: "Klasifikasi",
                width: 180,
                headerAttributes: {
                    style: "text-align: center; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                },
                template: function(dataItem) {
                    const color = getFISClassificationColor(dataItem.kategori);
                    return `<span style="color: ${color}; font-weight: bold;">${dataItem.kategori || 'N/A'}</span>`;
                }
            },
            {
                field: "nilai_fuzzy",
                title: "Nilai Fuzzy",
                width: 120,
                format: "{0:n2}",
                headerAttributes: {
                    style: "text-align: center; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                },
                template: function(dataItem) {
                    return dataItem.nilai_fuzzy ? dataItem.nilai_fuzzy.toFixed(2) : 'N/A';
                }
            },
            {
                field: "ipk_membership",
                title: "Keanggotaan IPK",
                width: 150,
                headerAttributes: {
                    style: "text-align: center; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                },
                template: function(dataItem) {
                    return dataItem.ipk_membership ? dataItem.ipk_membership.toFixed(4) : 'N/A';
                }
            },
            {
                field: "sks_membership",
                title: "Keanggotaan SKS",
                width: 150,
                headerAttributes: {
                    style: "text-align: center; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                },
                template: function(dataItem) {
                    return dataItem.sks_membership ? dataItem.sks_membership.toFixed(4) : 'N/A';
                }
            },
            {
                field: "nilai_dk_membership",
                title: "Keanggotaan Nilai D/E/K",
                width: 180,
                headerAttributes: {
                    style: "text-align: center; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                },
                template: function(dataItem) {
                    return dataItem.nilai_dk_membership ? dataItem.nilai_dk_membership.toFixed(4) : 'N/A';
                }
            },
            {
                command: [
                    {
                        name: "detail",
                        text: "Detail",
                        click: showFISDetail,
                        template: '<button class="k-button k-button-md k-rounded-md k-button-solid detail-button" onclick="showFISDetail(event, this);"><i class="fas fa-eye"></i></button>'
                    }
                ],
                title: "Detail",
                width: 120,
                headerAttributes: {
                    style: "text-align: center; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                }
            }
        ],
        dataBound: function(e) {
            console.log("FIS Grid Data Bound:", e);
            const grid = e.sender;
            
            // Update total record info
            updateTotalRecordInfo(grid.dataSource.total(), "totalRecordTextFIS");
        }
    });
}

// Fungsi untuk load data FIS dengan caching
function loadFISGridData() {
    // Cek cache terlebih dahulu
    if (fisDataCache.results && isFISCacheValid()) {
        console.log('Loading FIS grid data from cache');
        const grid = $("#fisGrid").data("kendoGrid");
        if (grid) {
            grid.dataSource.data(fisDataCache.results);
        }
        return;
    }
    
    console.log('Fetching FIS grid data from server');
    
    // Tampilkan loading
    kendo.ui.progress($("#fisGrid"), true);
    updateFISSearchInfo("Sedang memuat data klasifikasi FIS...", "info");
    
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY_RESULT),
        method: 'GET',
        data: {
            skip: 0,
            limit: 1000 // Ambil semua data sekaligus untuk performa
        },
        success: function(response) {
            console.log('FIS grid data loaded successfully:', response);
            
            // Simpan ke cache
            fisDataCache.results = response.data || response;
            updateFISCacheTimestamp();
            showFISCacheStatus();
            
            // Update grid datasource
            const grid = $("#fisGrid").data("kendoGrid");
            if (grid) {
                grid.dataSource.data(fisDataCache.results);
            }
            
            // Sembunyikan loading
            kendo.ui.progress($("#fisGrid"), false);
            updateFISSearchInfo(`Berhasil memuat ${fisDataCache.results.length} data klasifikasi FIS`, "success");
        },
        error: function(xhr, status, error) {
            console.error('Error loading FIS grid data:', error);
            kendo.ui.progress($("#fisGrid"), false);
            updateFISSearchInfo("Terjadi kesalahan saat memuat data klasifikasi FIS", "error");
        }
    });
}

function initializeMahasiswaDropdown() {
    $("#mahasiswaDropdown").kendoComboBox({
        dataSource: {
            transport: {
                read: {
                    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA + "/search"),
                    dataType: "json",
                    data: function() {
                        var comboBox = $("#mahasiswaDropdown").data("kendoComboBox");
                        var query = comboBox ? comboBox.text() : "";
                        
                        // Jangan kirim request jika query kosong atau kurang dari 3 karakter
                        if (!query || query.trim().length < 3) {
                            console.log('Query too short, not sending request:', query);
                            return {
                                q: "___INVALID___", // Placeholder yang akan di-filter di backend
                                limit: 20
                            };
                        }
                        
                        return {
                            q: query.trim(),
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
        // Hapus event change karena menyebabkan NIM hilang saat interaksi lain
        // change: function(e) { ... },
        filtering: function(e) {
            console.log('Dropdown filtering event - filter:', e.filter);
        },
        select: function(e) {
            var dataItem = e.dataItem;
            if (dataItem) {
                window.selectedMahasiswaData = dataItem;
                window.selectedNimFIS = dataItem.nim;
                $("#btnKlasifikasi").attr('data-nim', dataItem.nim);
                console.log('Selected NIM from select event stored in button dataset:', dataItem.nim);
            }
        },
        dataBound: function(e) {
            console.log('Dropdown dataBound event - data items:', e.sender.dataSource.data());
        },
        open: function(e) {
            console.log('Dropdown open event');
        },
        close: function(e) {
            console.log('Dropdown close event');
        }
    });
    window.selectedMahasiswaData = null;
    
    // Hapus additional select handler karena sudah ada event select di kendoComboBox
    // $("#mahasiswaDropdown").on("select", function(e) { ... });
    
    // Sinkronisasi dengan dashboard
    $(document).on('dashboardMahasiswaSelected', function(e, data) {
        console.log('Dashboard mahasiswa selected event received:', data);
        if (data && data.nim) {
            window.selectedMahasiswaData = data;
            window.selectedNimFIS = data.nim;
            $("#btnKlasifikasi").attr('data-nim', data.nim);
            console.log('FIS dropdown synced with dashboard selection, NIM stored in button dataset:', data.nim);
        }
    });
}

function initializeButtons() {
    console.log('Initializing FIS buttons...');
    
    // Event handler untuk tombol klasifikasi single
    $("#btnKlasifikasi").click(function() {
        console.log('Button klasifikasi clicked!');
        var finalNim = $(this).attr('data-nim');
        console.log('NIM from button dataset:', finalNim);
        if (!finalNim || finalNim.trim() === '') {
            showNotification(
                "warning",
                "Peringatan",
                "Silakan pilih mahasiswa dari daftar terlebih dahulu"
            );
            $("#mahasiswaDropdown").data("kendoComboBox").focus();
            return;
        }

        // Tampilkan loading
        kendo.ui.progress($("#fisSection"), true);

        // Panggil API untuk klasifikasi
        $.ajax({
            url: `${CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY)}/${finalNim}`,
            type: "GET",
            success: function(response) {
                // Tampilkan hasil
                $("#hasilKlasifikasiFIS").show();
                
                const classificationColor = getFISClassificationColor(response.kategori);
                
                let html = `
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
                            <h5>Nilai Kriteria</h5>
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
                
                $("#hasilDetailFIS").html(html);

                // Update cache dan grid dengan data baru (tidak refresh dari server)
                updateFISGridWithNewData(response);

                showNotification(
                    "success",
                    "Klasifikasi Berhasil",
                    "Data klasifikasi berhasil diambil"
                );
            },
            error: function(xhr) {
                let errorMessage = "Gagal mengambil data klasifikasi";
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    errorMessage = xhr.responseJSON.detail;
                }
                showNotification(
                    "error",
                    "Error",
                    errorMessage
                );
            },
            complete: function() {
                kendo.ui.progress($("#fisSection"), false);
            }
        });
    });

    // Event handler untuk tombol batch klasifikasi
    $("#btnBatchKlasifikasi").click(function() {
        // Tampilkan konfirmasi dialog
        var confirmDialog = $("<div>")
            .kendoDialog({
                width: "400px",
                title: "Konfirmasi Klasifikasi Batch",
                closable: true,
                modal: true,
                content: "<p>Apakah Anda yakin ingin melakukan klasifikasi untuk semua mahasiswa?<br>Proses ini mungkin membutuhkan waktu beberapa saat.</p>",
                actions: [
                    {
                        text: "Batal",
                        primary: false,
                        action: function() {
                            return true;
                        }
                    },
                    {
                        text: "Ya, Lanjutkan",
                        primary: true,
                        action: function() {
                            executeBatchKlasifikasi();
                            return true;
                        }
                    }
                ]
            }).data("kendoDialog");
        
        confirmDialog.open();
    });
}

function executeBatchKlasifikasi() {
    // Tampilkan loading indicator
    kendo.ui.progress($("#fisSection"), true);
    updateFISSearchInfo("Sedang melakukan klasifikasi batch...", "info");
    
    // Panggil API untuk batch klasifikasi
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + "/batch-klasifikasi",
        type: "POST",
        timeout: 60000, // 60 detik timeout untuk batch processing
        success: function(response) {
            console.log('Batch klasifikasi FIS berhasil:', response);
            
            // Clear cache karena data sudah berubah
            clearFISCache();
            
            // Reload data dari server untuk mendapatkan data terbaru
            loadFISGridData();
            
            // Load distribusi terbaru
            loadFISDistributionAfterBatch(response);
            
            showNotification(
                "success",
                "Batch Klasifikasi Berhasil",
                `Berhasil melakukan klasifikasi untuk ${response.total_processed} mahasiswa`
            );
        },
        error: function(xhr, status, error) {
            console.error('Error batch klasifikasi FIS:', {
                status: status,
                error: error,
                xhr: xhr
            });
            
            let errorMessage = "Gagal melakukan batch klasifikasi";
            if (xhr.responseJSON && xhr.responseJSON.detail) {
                errorMessage = xhr.responseJSON.detail;
            }
            showNotification(
                "error",
                "Error",
                errorMessage
            );
        },
        complete: function() {
            // Sembunyikan loading indicator
            kendo.ui.progress($("#fisSection"), false);
        }
    });
}

// Fungsi untuk memuat distribusi FIS setelah batch klasifikasi
function loadFISDistributionAfterBatch(batchResponse) {
    console.log('Loading FIS distribution after batch:', batchResponse);
    
    // Panggil API untuk mendapatkan distribusi terbaru
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + "/distribution",
        type: "GET",
        timeout: 10000,
        success: function(response) {
            console.log('FIS distribution after batch:', response);
            
            if (response && response.distribusi) {
                // Update statistik di halaman
                displayFISDistributionResults(response);
                // Tampilkan dialog result
                displayFISBatchResultDialog(response);
            } else {
                // Fallback ke fungsi lama jika distribution tidak tersedia
                displayFISBatchResults(batchResponse);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading FIS distribution after batch:', {
                status: status,
                error: error,
                xhr: xhr
            });
            
            // Fallback ke fungsi lama jika distribution error
            displayFISBatchResults(batchResponse);
        }
    });
}

// Fungsi untuk menampilkan hasil analisis batch FIS
function displayFISBatchResults(data) {
    // Add safety checks for data
    if (!data) {
        console.error('Invalid FIS batch results data:', data);
        return;
    }
    
    // Jika ini adalah response dari batch klasifikasi, kita perlu memuat data terbaru
    if (data.total_processed && !data.data) {
        console.log('Batch klasifikasi selesai, memuat data terbaru...');
        // Refresh data dari endpoint fuzzy untuk mendapatkan data terbaru
        loadInitialFISBatchResults();
        return;
    }
    
    // Jika ini adalah data dari endpoint fuzzy (GET)
    if (data && data.data && Array.isArray(data.data)) {
        const results = data.data;
        
        console.log('Processing FIS data with', results.length, 'records');
        
        // Count classifications
        const counts = {
            'Peluang Lulus Tinggi': 0,
            'Peluang Lulus Sedang': 0,
            'Peluang Lulus Kecil': 0
        };
        
        results.forEach(result => {
            if (result && result.kategori) {
                counts[result.kategori]++;
            }
        });
        
        // Update display
        $("#batchTinggiFIS").text(counts['Peluang Lulus Tinggi']);
        $("#batchSedangFIS").text(counts['Peluang Lulus Sedang']);
        $("#batchKecilFIS").text(counts['Peluang Lulus Kecil']);
        $("#batchTotalFIS").text(results.length);
        
        // Show results
        $("#batchResultsFIS").show();
        
        console.log('FIS batch results updated:', counts);
        
        // Tampilkan notifikasi sukses jika ada data
        if (results.length > 0) {
            showNotification(
                "success",
                "Data Loaded",
                `Berhasil memuat data klasifikasi untuk ${results.length} mahasiswa`
            );
        }
    } else {
        console.error('Invalid FIS data structure:', data);
        
        // Tampilkan statistik kosong jika data tidak valid
        $("#batchTinggiFIS").text('0');
        $("#batchSedangFIS").text('0');
        $("#batchKecilFIS").text('0');
        $("#batchTotalFIS").text('0');
        $("#batchResultsFIS").show();
        
        showNotification(
            "warning",
            "No Data",
            "Tidak ada data klasifikasi FIS yang tersedia"
        );
    }
}

// Fungsi untuk memuat hasil batch FIS saat halaman dimuat
function loadInitialFISBatchResults() {
    console.log('Loading initial FIS batch results...');
    
    // Tampilkan loading indicator
    kendo.ui.progress($("#fisSection"), true);
    updateFISSearchInfo("Sedang memuat data distribusi klasifikasi FIS...", "info");
    
    // Panggil API untuk mendapatkan distribusi klasifikasi FIS
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + "/distribution",
        type: "GET",
        timeout: 10000, // 10 detik timeout
        success: function(response) {
            console.log('FIS distribution API response received:', response);
            
            if (response && response.distribusi) {
                console.log('Valid FIS distribution data found, displaying results...');
                displayFISDistributionResults(response);
            } else {
                console.warn('Invalid FIS distribution response structure:', response);
                // Fallback ke endpoint results jika distribution tidak tersedia
                loadFISResultsAsFallback();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading FIS distribution:', {
                status: status,
                error: error,
                xhr: xhr
            });
            
            // Fallback ke endpoint results jika distribution error
            console.log('Falling back to results endpoint...');
            loadFISResultsAsFallback();
        },
        complete: function() {
            // Sembunyikan loading indicator
            kendo.ui.progress($("#fisSection"), false);
        }
    });
}

// Fungsi fallback untuk memuat data dari endpoint results
function loadFISResultsAsFallback() {
    console.log('Loading FIS results as fallback...');
    
    // Tampilkan loading indicator
    kendo.ui.progress($("#fisSection"), true);
    updateFISSearchInfo("Sedang memuat data klasifikasi FIS...", "info");
    
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY_RESULT),
        type: "GET",
        timeout: 10000,
        success: function(response) {
            console.log('FIS results API response received:', response);
            
            if (response && response.data && Array.isArray(response.data)) {
                console.log('Valid FIS data found, displaying results...');
                displayFISBatchResults(response);
            } else {
                console.warn('Invalid FIS response structure:', response);
                // Tampilkan statistik kosong jika tidak ada data
                $("#batchTinggiFIS").text('0');
                $("#batchSedangFIS").text('0');
                $("#batchKecilFIS").text('0');
                $("#batchTotalFIS").text('0');
                $("#batchResultsFIS").show();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading FIS results:', {
                status: status,
                error: error,
                xhr: xhr
            });
            
            // Tampilkan pesan error yang lebih informatif
            let errorMessage = "Gagal memuat data klasifikasi FIS";
            if (xhr.responseJSON && xhr.responseJSON.detail) {
                errorMessage += ": " + xhr.responseJSON.detail;
            } else if (status === "timeout") {
                errorMessage += ": Timeout - server tidak merespons";
            } else if (status === "error") {
                errorMessage += ": " + error;
            }
            
            console.error(errorMessage);
            
            // Tampilkan statistik kosong jika error
            $("#batchTinggiFIS").text('0');
            $("#batchSedangFIS").text('0');
            $("#batchKecilFIS").text('0');
            $("#batchTotalFIS").text('0');
            $("#batchResultsFIS").show();
            
            // Tampilkan notifikasi error
            showNotification(
                "error",
                "Error Loading Data",
                errorMessage
            );
        },
        complete: function() {
            // Sembunyikan loading indicator
            kendo.ui.progress($("#fisSection"), false);
        }
    });
}

// Fungsi untuk menampilkan hasil distribusi FIS dari endpoint distribution
function displayFISDistributionResults(data) {
    console.log('Displaying FIS distribution results:', data);
    
    if (!data || !data.distribusi) {
        console.error('Invalid FIS distribution data:', data);
        return;
    }
    
    const distribusi = data.distribusi;
    const total = data.total_mahasiswa || 0;
    const persentase = data.persentase || {};
    
    // Update display dengan data dari distribution endpoint
    $("#batchTinggiFIS").text(distribusi['Peluang Lulus Tinggi'] || 0);
    $("#batchSedangFIS").text(distribusi['Peluang Lulus Sedang'] || 0);
    $("#batchKecilFIS").text(distribusi['Peluang Lulus Kecil'] || 0);
    $("#batchTotalFIS").text(total);
    
    // Update persentase
    $("#batchTinggiFISPercent").text((persentase['Peluang Lulus Tinggi'] || 0).toFixed(1) + '%');
    $("#batchSedangFISPercent").text((persentase['Peluang Lulus Sedang'] || 0).toFixed(1) + '%');
    $("#batchKecilFISPercent").text((persentase['Peluang Lulus Kecil'] || 0).toFixed(1) + '%');
    
    // Show results
    $("#batchResultsFIS").show();
    
    console.log('FIS distribution results updated:', {
        distribusi: distribusi,
        total: total,
        persentase: persentase
    });
    
    // Tampilkan notifikasi sukses jika ada data
    if (total > 0) {
        showNotification(
            "success",
            "Data Loaded",
            `Berhasil memuat distribusi klasifikasi untuk ${total} mahasiswa`
        );
    }
}

// Fungsi untuk menampilkan dialog result batch FIS
function displayFISBatchResultDialog(data) {
    console.log('Displaying FIS batch result dialog:', data);
    
    if (!data || !data.distribusi) {
        console.error('Invalid FIS batch result data:', data);
        return;
    }
    
    const distribusi = data.distribusi;
    const total = data.total_mahasiswa || 0;
    const persentase = data.persentase || {};
    
    // Buat dialog untuk menampilkan hasil
    const resultDialog = $("<div>")
        .append(`
            <div style="padding: 20px;">
                <h3 style="color: #FF5722; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-chart-pie"></i> Hasil Klasifikasi FIS Batch
                </h3>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 15px;">Ringkasan Hasil:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                        <div style="text-align: center; padding: 15px; background: #e8f5e9; border-radius: 6px; border: 2px solid #28a745;">
                            <div style="font-size: 24px; font-weight: bold; color: #28a745;">${distribusi['Peluang Lulus Tinggi'] || 0}</div>
                            <div style="font-size: 14px; color: #333;">Peluang Tinggi</div>
                            <div style="font-size: 12px; color: #666;">${persentase['Peluang Lulus Tinggi'] || 0}%</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #fff3cd; border-radius: 6px; border: 2px solid #ffc107;">
                            <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${distribusi['Peluang Lulus Sedang'] || 0}</div>
                            <div style="font-size: 14px; color: #333;">Peluang Sedang</div>
                            <div style="font-size: 12px; color: #666;">${persentase['Peluang Lulus Sedang'] || 0}%</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #ffebee; border-radius: 6px; border: 2px solid #dc3545;">
                            <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${distribusi['Peluang Lulus Kecil'] || 0}</div>
                            <div style="font-size: 14px; color: #333;">Peluang Kecil</div>
                            <div style="font-size: 12px; color: #666;">${persentase['Peluang Lulus Kecil'] || 0}%</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #e3f2fd; border-radius: 6px; border: 2px solid #2196F3;">
                            <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${total}</div>
                            <div style="font-size: 14px; color: #333;">Total Mahasiswa</div>
                            <div style="font-size: 12px; color: #666;">100%</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #fff; border-radius: 8px; padding: 15px; border: 1px solid #e0e0e0;">
                    <h4 style="color: #333; margin-bottom: 10px;">Detail Hasil:</h4>
                    <p style="color: #666; margin: 0;">
                        <i class="fas fa-info-circle"></i> 
                        Klasifikasi FIS telah berhasil dilakukan untuk ${total} mahasiswa. 
                        Hasil telah disimpan ke database dan dapat dilihat di grid FIS.
                    </p>
                </div>
            </div>
        `)
        .kendoDialog({
            width: "600px",
            title: "Hasil Klasifikasi FIS Batch",
            closable: true,
            modal: true,
            actions: [
                {
                    text: "Tutup",
                    primary: true,
                    action: function() {
                        return true;
                    }
                }
            ]
        });
    
    // Buka dialog
    resultDialog.data("kendoDialog").open();
}

// Fungsi helper untuk warna klasifikasi FIS
function getFISClassificationColor(classification) {
    // Add null/undefined check
    if (!classification || typeof classification !== 'string') {
        return '#6c757d'; // Default gray color
    }
    
    if (classification.includes('Tinggi')) return '#28a745';
    if (classification.includes('Sedang')) return '#ffc107';
    if (classification.includes('Kecil')) return '#dc3545';
    return '#6c757d';
}

// Fungsi helper untuk threshold klasifikasi FIS
function getFISClassificationThreshold(classification) {
    // Add null/undefined check
    if (!classification || typeof classification !== 'string') {
        return ''; // Default empty string
    }
    
    if (classification.includes('Tinggi')) return 'Nilai Fuzzy ≥ 70';
    if (classification.includes('Sedang')) return '40 ≤ Nilai Fuzzy < 70';
    if (classification.includes('Kecil')) return 'Nilai Fuzzy < 40';
    return '';
}

// Fungsi helper untuk mendapatkan unique values dari array
function getUniqueValues(data, field) {
    if (!data || !Array.isArray(data) || !field) return [];
    
    const unique = [...new Set(data.map(item => item[field]).filter(val => val))];
    return unique.sort();
}

// Fungsi untuk menampilkan notifikasi
function showNotification(type, title, message) {
    try {
        const notification = $("#notification").data("kendoNotification");
        if (notification) {
            notification.show({
                title: title,
                message: message
            }, type);
        } else {
            // Fallback jika Kendo Notification belum siap
            console.warn("Kendo Notification belum diinisialisasi, menggunakan console sebagai fallback");
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] ${title}: ${message}`);
            
            // Coba gunakan toast notification jika tersedia
            if (typeof window.showToastNotification === 'function') {
                window.showToastNotification(title, message, type);
            }
        }
    } catch (error) {
        console.error('Error in showNotification:', error);
        // Fallback terakhir
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${title}: ${message}`);
    }
} 

// Fungsi untuk menampilkan detail mahasiswa dan hasil klasifikasi FIS
function showFISDetail(e, element) {
    e.preventDefault();
    
    // Dapatkan grid dan data item
    const grid = $("#fisGrid").data("kendoGrid");
    const row = $(element).closest("tr");
    const dataItem = grid.dataItem(row);
    
    if (!dataItem || !dataItem.nim) {
        showNotification("error", "Error", "Data mahasiswa tidak ditemukan");
        return;
    }
    
    console.log('Showing FIS detail for:', dataItem);
    
    // Tampilkan loading
    kendo.ui.progress($("#fisSection"), true);
    
    // Ambil data detail dari API
    $.ajax({
        url: `${CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY)}/${dataItem.nim}`,
        type: "GET",
        success: function(response) {
            kendo.ui.progress($("#fisSection"), false);
            displayFISDetailDialog(response);
        },
        error: function(xhr, status, error) {
            kendo.ui.progress($("#fisSection"), false);
            let errorMessage = "Gagal memuat detail mahasiswa";
            if (xhr.responseJSON && xhr.responseJSON.detail) {
                errorMessage += ": " + xhr.responseJSON.detail;
            }
            showNotification("error", "Error", errorMessage);
        }
    });
}

// Fungsi untuk menampilkan dialog detail FIS
function displayFISDetailDialog(data) {
    console.log('Displaying FIS detail dialog:', data);
    
    if (!data) {
        console.error('Invalid FIS detail data:', data);
        showNotification("error", "Error", "Data detail tidak valid");
        return;
    }
    
    const classificationColor = getFISClassificationColor(data.kategori);
    const classificationThreshold = getFISClassificationThreshold(data.kategori);
    
    // Buat dialog untuk menampilkan detail
    const detailDialog = $("<div>")
        .append(`
            <div style="padding: 20px;">
                <div class="fis-result">
                    <div class="result-header" style="background: ${classificationColor}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0; text-align: center;">
                            <i class="fas fa-user-graduate"></i> Detail Mahasiswa & Hasil Klasifikasi FIS
                        </h4>
                        <p style="margin: 10px 0 0 0; text-align: center; font-size: 14px;">
                            ${data.nama || 'N/A'} (${data.nim || 'N/A'})
                        </p>
                    </div>
                    
                    <div class="result-section" style="margin-bottom: 20px;">
                        <h5 style="color: #333; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px;">
                            <i class="fas fa-info-circle"></i> Informasi Mahasiswa
                        </h5>
                        <div class="info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div class="info-item" style="background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 4px solid #007bff;">
                                <span class="label" style="font-weight: bold; color: #333;">NIM:</span>
                                <span class="value" style="color: #007bff; margin-left: 8px;">${data.nim || 'N/A'}</span>
                            </div>
                            <div class="info-item" style="background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 4px solid #28a745;">
                                <span class="label" style="font-weight: bold; color: #333;">Nama:</span>
                                <span class="value" style="color: #28a745; margin-left: 8px;">${data.nama || 'N/A'}</span>
                            </div>
                            <div class="info-item" style="background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">
                                <span class="label" style="font-weight: bold; color: #333;">Program Studi:</span>
                                <span class="value" style="color: #ffc107; margin-left: 8px;">${data.program_studi || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="result-section" style="margin-bottom: 20px;">
                        <h5 style="color: #333; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px;">
                            <i class="fas fa-chart-line"></i> Hasil Klasifikasi FIS
                        </h5>
                        <div style="background: ${classificationColor}; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0 0 5px 0; font-size: 24px;">
                                <i class="fas fa-trophy"></i> ${data.kategori || 'N/A'}
                            </h3>
                            <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                                Nilai Fuzzy: <strong>${data.nilai_fuzzy?.toFixed(2) || 'N/A'}</strong>
                            </p>
                            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">
                                ${classificationThreshold}
                            </p>
                        </div>
                    </div>
                    
                    <div class="result-section" style="margin-bottom: 20px;">
                        <h5 style="color: #333; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px;">
                            <i class="fas fa-calculator"></i> Detail Nilai Kriteria
                        </h5>
                        <div class="criteria-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                            <div class="criteria-item" style="background: #e8f5e9; padding: 15px; border-radius: 8px; border: 2px solid #28a745;">
                                <div class="criteria-header" style="margin-bottom: 10px;">
                                    <strong style="color: #28a745; font-size: 16px;">
                                        <i class="fas fa-star"></i> IPK
                                    </strong>
                                </div>
                                <div class="criteria-values" style="color: #333;">
                                    <div style="margin-bottom: 5px;">Nilai: <strong>${data.ipk?.toFixed(2) || 'N/A'}</strong></div>
                                    <div>Keanggotaan: <strong>${data.ipk_membership?.toFixed(2) || 'N/A'}</strong></div>
                                </div>
                            </div>
                            
                            <div class="criteria-item" style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 2px solid #ffc107;">
                                <div class="criteria-header" style="margin-bottom: 10px;">
                                    <strong style="color: #ffc107; font-size: 16px;">
                                        <i class="fas fa-book"></i> SKS
                                    </strong>
                                </div>
                                <div class="criteria-values" style="color: #333;">
                                    <div style="margin-bottom: 5px;">Nilai: <strong>${data.sks || 'N/A'}</strong></div>
                                    <div>Keanggotaan: <strong>${data.sks_membership?.toFixed(2) || 'N/A'}</strong></div>
                                </div>
                            </div>
                            
                            <div class="criteria-item" style="background: #ffebee; padding: 15px; border-radius: 8px; border: 2px solid #dc3545;">
                                <div class="criteria-header" style="margin-bottom: 10px;">
                                    <strong style="color: #dc3545; font-size: 16px;">
                                        <i class="fas fa-percentage"></i> Nilai D/E/K
                                    </strong>
                                </div>
                                <div class="criteria-values" style="color: #333;">
                                    <div style="margin-bottom: 5px;">Persentase: <strong>${data.persen_dek?.toFixed(2) || 'N/A'}%</strong></div>
                                    <div>Keanggotaan: <strong>${data.nilai_dk_membership?.toFixed(2) || 'N/A'}</strong></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="result-section">
                        <h5 style="color: #333; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px;">
                            <i class="fas fa-clock"></i> Informasi Waktu
                        </h5>
                        <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; border-left: 4px solid #2196F3;">
                            <p style="margin: 0; color: #333;">
                                <i class="fas fa-calendar-alt"></i> 
                                <strong>Terakhir Update:</strong> 
                                <span style="color: #2196F3;">${data.updated_at ? new Date(data.updated_at).toLocaleString('id-ID') : 'N/A'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `)
        .kendoDialog({
            width: "800px",
            height: "600px",
            title: "Detail Klasifikasi FIS",
            closable: true,
            modal: true,
            actions: [
                {
                    text: "Tutup",
                    primary: true,
                    action: function() {
                        return true;
                    }
                }
            ]
        });
    
    // Buka dialog
    detailDialog.data("kendoDialog").open();
} 

// Fungsi untuk mengupdate total record info
function updateTotalRecordInfo(total, elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = `Total: ${total || 0} record`;
    }
} 

// Cache untuk data FIS
let fisDataCache = {
    results: null,
    distribution: null,
    lastFetch: null,
    cacheDuration: 5 * 60 * 1000 // 5 menit dalam milidetik
};

// Fungsi untuk mengecek apakah cache masih valid
function isFISCacheValid() {
    return fisDataCache.lastFetch && 
           (Date.now() - fisDataCache.lastFetch) < fisDataCache.cacheDuration;
}

// Fungsi untuk clear cache
function clearFISCache() {
    fisDataCache = {
        results: null,
        distribution: null,
        lastFetch: null,
        cacheDuration: 5 * 60 * 1000
    };
}

// Fungsi untuk update cache timestamp
function updateFISCacheTimestamp() {
    fisDataCache.lastFetch = Date.now();
}

// Fungsi untuk menampilkan status cache
function showFISCacheStatus() {
    const status = isFISCacheValid() ? 'valid' : 'invalid';
    const message = isFISCacheValid() ? 'Cache Aktif' : 'Cache Expired';
    
    // Remove existing status
    $('.fis-cache-status').remove();
    
    // Add new status
    $('body').append(`
        <div class="fis-cache-status ${status}">
            <i class="fas fa-${isFISCacheValid() ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        </div>
    `);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        $('.fis-cache-status').fadeOut();
    }, 3000);
} 

// Fungsi untuk update grid dengan data klasifikasi baru
function updateFISGridWithNewData(newData) {
    console.log('Updating FIS grid with new data:', newData);
    
    const grid = $("#fisGrid").data("kendoGrid");
    if (!grid) {
        console.error('Grid FIS tidak ditemukan');
        return;
    }
    
    // Update cache dengan data baru
    if (fisDataCache.results) {
        // Cari data yang sudah ada berdasarkan NIM
        const existingIndex = fisDataCache.results.findIndex(item => item.nim === newData.nim);
        
        if (existingIndex !== -1) {
            // Update data yang sudah ada
            fisDataCache.results[existingIndex] = {
                nim: newData.nim,
                nama: newData.nama,
                kategori: newData.kategori,
                nilai_fuzzy: newData.nilai_fuzzy,
                ipk_membership: newData.ipk_membership,
                sks_membership: newData.sks_membership,
                nilai_dk_membership: newData.nilai_dk_membership,
                updated_at: newData.updated_at
            };
            console.log('Updated existing data in cache for NIM:', newData.nim);
        } else {
            // Tambah data baru
            fisDataCache.results.push({
                nim: newData.nim,
                nama: newData.nama,
                kategori: newData.kategori,
                nilai_fuzzy: newData.nilai_fuzzy,
                ipk_membership: newData.ipk_membership,
                sks_membership: newData.sks_membership,
                nilai_dk_membership: newData.nilai_dk_membership,
                updated_at: newData.updated_at
            });
            console.log('Added new data to cache for NIM:', newData.nim);
        }
        
        // Update cache timestamp
        updateFISCacheTimestamp();
        
        // Update grid dengan data cache yang sudah diupdate
        grid.dataSource.data(fisDataCache.results);
        
        console.log('Grid updated with new data, total records:', fisDataCache.results.length);
    } else {
        console.log('Cache tidak tersedia, reloading data dari server');
        // Jika cache tidak tersedia, reload data dari server
        loadFISGridData();
    }
} 

// Fungsi untuk evaluasi FIS dengan status lulus aktual
function evaluateFISWithActualStatus() {
    console.log('🔍 Memulai evaluasi FIS dengan status lulus aktual...');
    
    // Tampilkan loading
    showNotification("Info", "Memulai evaluasi FIS dengan data aktual...", "info");
    
    // Disable button
    $('#btnEvaluateFISActual').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Evaluasi...');
    
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + '/evaluate-with-actual-status',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            test_size: 0.3,
            random_state: 42
        }),
        success: function(response) {
            console.log('✅ Evaluasi FIS berhasil:', response);
            
            if (response.success) {
                displayFISEvaluationResults(response.result);
                showNotification(
                    "Sukses", 
                    `Evaluasi FIS berhasil dengan ${response.result.evaluation_info.total_data} data`, 
                    "success"
                );
            } else {
                showNotification("Error", "Evaluasi FIS gagal", "error");
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Error evaluasi FIS:', {xhr, status, error});
            
            let errorMessage = "Gagal melakukan evaluasi FIS";
            if (xhr.responseJSON && xhr.responseJSON.detail) {
                errorMessage += ": " + xhr.responseJSON.detail;
            }
            
            showNotification("Error", errorMessage, "error");
        },
        complete: function() {
            // Enable button
            $('#btnEvaluateFISActual').prop('disabled', false).html('<i class="fas fa-chart-line"></i> Evaluasi FIS dengan Data Aktual');
        }
    });
}

// Fungsi untuk menampilkan hasil evaluasi FIS
function displayFISEvaluationResults(result) {
    console.log('📊 Menampilkan hasil evaluasi FIS:', result);
    
    const container = $('#fisEvaluationResults');
    if (container.length === 0) {
        // Buat container jika belum ada
        $('#fisSection .section-content').append(`
            <div id="fisEvaluationResults" class="evaluation-results-container">
                <div class="evaluation-header">
                    <h3><i class="fas fa-chart-line"></i> Hasil Evaluasi FIS dengan Data Aktual</h3>
                </div>
                <div class="evaluation-content"></div>
            </div>
        `);
    }
    
    const content = $('#fisEvaluationResults .evaluation-content');
    
    // Buat HTML untuk hasil evaluasi
    const html = `
        <div class="evaluation-summary">
            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-value">${result.metrics.accuracy * 100}%</div>
                    <div class="stat-label">Akurasi</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${result.metrics.precision * 100}%</div>
                    <div class="stat-label">Precision</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${result.metrics.recall * 100}%</div>
                    <div class="stat-label">Recall</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${result.metrics.f1_score * 100}%</div>
                    <div class="stat-label">F1-Score</div>
                </div>
            </div>
        </div>
        
        <div class="evaluation-details">
            <div class="confusion-matrix-section">
                <h4><i class="fas fa-table"></i> Confusion Matrix</h4>
                <div class="confusion-matrix">
                    <table class="confusion-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Prediksi: Belum Lulus</th>
                                <th>Prediksi: Lulus</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Aktual: Belum Lulus</strong></td>
                                <td class="correct">${result.confusion_matrix.matrix[0][0]}</td>
                                <td class="incorrect">${result.confusion_matrix.matrix[0][1]}</td>
                            </tr>
                            <tr>
                                <td><strong>Aktual: Lulus</strong></td>
                                <td class="incorrect">${result.confusion_matrix.matrix[1][0]}</td>
                                <td class="correct">${result.confusion_matrix.matrix[1][1]}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="category-analysis-section">
                <h4><i class="fas fa-chart-pie"></i> Analisis per Kategori</h4>
                <div class="category-grid">
                    ${Object.entries(result.category_analysis).map(([category, data]) => `
                        <div class="category-card">
                            <h5>${category}</h5>
                            <div class="category-stats">
                                <div class="stat">
                                    <span class="label">Total Prediksi:</span>
                                    <span class="value">${data.total_predictions}</span>
                                </div>
                                <div class="stat">
                                    <span class="label">Akurasi:</span>
                                    <span class="value">${(data.accuracy * 100).toFixed(1)}%</span>
                                </div>
                                <div class="stat">
                                    <span class="label">Lulus Aktual:</span>
                                    <span class="value">${data.actual_lulus}</span>
                                </div>
                                <div class="stat">
                                    <span class="label">Belum Lulus Aktual:</span>
                                    <span class="value">${data.actual_belum_lulus}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="data-statistics-section">
                <h4><i class="fas fa-info-circle"></i> Statistik Data</h4>
                <div class="statistics-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${result.statistics.total_actual_lulus}</div>
                            <div class="stat-label">Total Lulus Aktual</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-user-clock"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${result.statistics.total_actual_belum_lulus}</div>
                            <div class="stat-label">Total Belum Lulus Aktual</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${result.statistics.percentage_actual_lulus}%</div>
                            <div class="stat-label">Persentase Lulus</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="sample-data-section">
                <h4><i class="fas fa-list"></i> Sample Data Evaluasi</h4>
                <div class="sample-table">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>NIM</th>
                                <th>Nama</th>
                                <th>Prediksi FIS</th>
                                <th>Status Aktual</th>
                                <th>Fuzzy Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.sample_data.map(item => `
                                <tr>
                                    <td>${item.nim}</td>
                                    <td>${item.nama}</td>
                                    <td>
                                        <span class="badge ${item.predicted_category === 'Peluang Lulus Tinggi' ? 'bg-success' : item.predicted_category === 'Peluang Lulus Sedang' ? 'bg-warning' : 'bg-danger'}">
                                            ${item.predicted_category}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge ${item.actual_status === 'LULUS' ? 'bg-success' : 'bg-secondary'}">
                                            ${item.actual_status}
                                        </span>
                                    </td>
                                    <td>${item.fuzzy_score.toFixed(3)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    content.html(html);
    
    // Tampilkan container
    $('#fisEvaluationResults').show();
}

// Tambahkan button evaluasi ke form FIS
function addFISEvaluationButton() {
    const formContainer = $('#fisForm');
    if (formContainer.length > 0) {
        // Tambahkan button evaluasi setelah form
        formContainer.after(`
            <div class="evaluation-actions" style="margin-top: 20px; text-align: center;">
                <button id="btnEvaluateFISActual" class="k-button k-button-md k-rounded-md k-button-solid custom-button-sync" 
                        onclick="evaluateFISWithActualStatus()">
                    <i class="fas fa-chart-line"></i> Evaluasi FIS dengan Data Aktual
                </button>
                <p class="text-muted mt-2">
                    <i class="fas fa-info-circle"></i> 
                    Evaluasi ini membandingkan hasil klasifikasi FIS dengan status lulus yang sebenarnya
                </p>
            </div>
        `);
    }
}

// Panggil fungsi saat halaman FIS dimuat
$(document).ready(function() {
    // Tunggu sampai form FIS siap
    setTimeout(function() {
        addFISEvaluationButton();
    }, 1000);
});

// Initialize FIS Actual Evaluation Section
function initializeFISActualEvaluation() {
    console.log('🔧 Initializing FIS Actual Evaluation Section...');
    
    // Initialize event handlers
    initializeFISActualEvaluationHandlers();
    
    console.log('✅ FIS Actual Evaluation Section initialized successfully');
}

// Initialize event handlers for FIS Actual Evaluation
function initializeFISActualEvaluationHandlers() {
    console.log('🔧 Initializing FIS Actual Evaluation handlers...');
    
    // Event handler untuk tombol evaluasi FIS dengan data aktual
    $("#fisActualEvaluationBtn").click(function() {
        console.log('🔍 Tombol evaluasi FIS dengan data aktual diklik');
        evaluateFISWithActualStatusFromSection();
    });
    
    // Event handler untuk tombol export
    $("#fisActualExportBtn").click(function() {
        console.log('📤 Tombol export hasil evaluasi FIS diklik');
        exportFISActualEvaluationResults();
    });
    
    // Event handler untuk tombol print
    $("#fisActualPrintBtn").click(function() {
        console.log('🖨️ Tombol print hasil evaluasi FIS diklik');
        printFISActualEvaluationResults();
    });
}

// Fungsi untuk evaluasi FIS dengan status aktual dari section baru
function evaluateFISWithActualStatusFromSection() {
    console.log('🔍 Memulai evaluasi FIS dengan FULL DATA berlabel...');
    
    // TIDAK ADA parameter test_size dan random_state lagi
    // Evaluasi menggunakan SELURUH data yang berlabel
    console.log('📊 Mode: Full Data Evaluation (No Split)');
    
    // Tampilkan loading
    $('#fisActualEvaluationLoadingIndicator').show();
    $('#fisActualSummarySection, #fisActualMetricsSection, #fisActualCategorySection, #fisActualSampleSection, #fisActualInterpretationSection').hide();
    
    // Disable button
    $('#fisActualEvaluationBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Mengevaluasi...');
    
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + '/evaluate-with-actual-status',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            // Backend tidak memerlukan test_size dan random_state lagi
            // Backend akan otomatis menggunakan semua data berlabel
        }),
        timeout: 60000, // 60 second timeout
        success: function(response) {
            console.log('✅ Evaluasi FIS berhasil:', response);
            
            if (response.success) {
                displayFISActualEvaluationResults(response.result);
                
                const totalData = response.result.evaluation_info.total_data;
                const evaluationType = response.result.evaluation_info.evaluation_type || 'full_data';
                
                showNotification(
                    "Sukses", 
                    `Evaluasi FIS berhasil dengan ${totalData} data berlabel (${evaluationType})`, 
                    "success"
                );
                
                console.log('📊 Evaluation Type:', evaluationType);
                console.log('📊 Total Data Evaluated:', totalData);
            } else {
                showNotification("Error", "Evaluasi FIS gagal", "error");
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Error evaluasi FIS:', {xhr, status, error});
            
            let errorMessage = "Gagal melakukan evaluasi FIS";
            if (xhr.responseJSON && xhr.responseJSON.detail) {
                errorMessage += ": " + xhr.responseJSON.detail;
            } else if (status === 'timeout') {
                errorMessage += ": Request timeout (server membutuhkan waktu terlalu lama)";
            } else if (xhr.status === 0) {
                errorMessage += ": Tidak dapat terhubung ke server";
            }
            
            showNotification("Error", errorMessage, "error");
            
            // Hide loading on error
            $('#fisActualEvaluationLoadingIndicator').hide();
        },
        complete: function() {
            // Hide loading
            $('#fisActualEvaluationLoadingIndicator').hide();
            
            // Enable button with updated text
            $('#fisActualEvaluationBtn').prop('disabled', false).html('<i class="fas fa-chart-line"></i> Mulai Evaluasi FIS');
        }
    });
}

// Fungsi untuk menampilkan hasil evaluasi FIS dengan data aktual
function displayFISActualEvaluationResults(result) {
    console.log('📊 Menampilkan hasil evaluasi FIS dengan data aktual:', result);
    
    // Update summary section
    updateFISActualSummarySection(result);
    
    // Update metrics section
    updateFISActualMetricsSection(result);
    
    // Update category analysis section
    updateFISActualCategorySection(result);
    
    // Update sample data section
    updateFISActualSampleSection(result);
    
    // Reset cache saat data baru dimuat
    window.fisActualEvaluationDataCache = null;
    
    // Update full data untuk modal confusion matrix
    if (result.full_data) {
        window.fisActualEvaluationFullData = result.full_data;
    } else if (result.results) {
        window.fisActualEvaluationFullData = result.results;
    }
    
    // Show all sections
    $('#fisActualSummarySection, #fisActualMetricsSection, #fisActualCategorySection, #fisActualSampleSection, #fisActualInterpretationSection').show();
}

// Update summary section
function updateFISActualSummarySection(result) {
    const stats = result.statistics;
    
    // Hitung total dari 3 kategori
    const actualDist = stats.actual_status_distribution || {};
    const totalTinggi = actualDist.LULUS_TINGGI || 0;
    const totalSedang = actualDist.LULUS_SEDANG || 0;
    const totalKecil = actualDist.LULUS_KECIL || 0;
    const totalData = totalTinggi + totalSedang + totalKecil;
    
    // Update tampilan dengan 3 kategori
    $('#fisActualTotalData').text(totalData);
    $('#fisActualTinggiData').text(totalTinggi);
    $('#fisActualSedangData').text(totalSedang);
    $('#fisActualKecilData').text(totalKecil);
    
    // Update persentase
    const percentTinggi = stats.percentage_tinggi || 0;
    const percentSedang = stats.percentage_sedang || 0;
    const percentKecil = stats.percentage_kecil || 0;
    
    $('#fisActualPersentaseTinggi').text(percentTinggi.toFixed(2) + '%');
    $('#fisActualPersentaseSedang').text(percentSedang.toFixed(2) + '%');
    $('#fisActualPersentaseKecil').text(percentKecil.toFixed(2) + '%');
}

// Global variable untuk menyimpan full data evaluasi (untuk confusion matrix modal)
let fisActualEvaluationFullData = null;

// Update metrics section
function updateFISActualMetricsSection(result) {
    const metrics = result.metrics;
    const cm = result.confusion_matrix;
    
    // Simpan FULL DATA untuk modal
    // Confusion matrix sekarang dibuat dari FULL DATA (semua data berlabel)
    // Jadi modal juga filter dari full_data
    fisActualEvaluationFullData = result.full_data || result.results || [];
    
    // Update overall metrics
    $('#fisActualAccuracy').text((metrics.accuracy * 100).toFixed(2) + '%');
    $('#fisActualPrecision').text((metrics.precision * 100).toFixed(2) + '%');
    $('#fisActualRecall').text((metrics.recall * 100).toFixed(2) + '%');
    $('#fisActualF1Score').text((metrics.f1_score * 100).toFixed(2) + '%');
    
    // Update confusion matrix 3x3
    // Matrix format: [Tinggi, Sedang, Kecil] x [Tinggi, Sedang, Kecil]
    // Backend mengirim confusion_matrix sebagai array langsung, bukan {matrix: [...]}
    console.log('Confusion Matrix data:', cm);
    
    if (cm && Array.isArray(cm) && cm.length === 3) {
        // Row 0: Actual Tinggi (predicted as Tinggi, Sedang, Kecil)
        $('#fisActual-tt').text(cm[0][0] || 0); // Tinggi -> Tinggi
        $('#fisActual-ts').text(cm[0][1] || 0); // Tinggi -> Sedang
        $('#fisActual-tk').text(cm[0][2] || 0); // Tinggi -> Kecil
        
        // Row 1: Actual Sedang (predicted as Tinggi, Sedang, Kecil)
        $('#fisActual-st').text(cm[1][0] || 0); // Sedang -> Tinggi
        $('#fisActual-ss').text(cm[1][1] || 0); // Sedang -> Sedang
        $('#fisActual-sk').text(cm[1][2] || 0); // Sedang -> Kecil
        
        // Row 2: Actual Kecil (predicted as Tinggi, Sedang, Kecil)
        $('#fisActual-kt').text(cm[2][0] || 0); // Kecil -> Tinggi
        $('#fisActual-ks').text(cm[2][1] || 0); // Kecil -> Sedang
        $('#fisActual-kk').text(cm[2][2] || 0); // Kecil -> Kecil
        
        console.log('Confusion Matrix updated successfully');
        
        // Setup click handlers untuk confusion matrix cells
        setupConfusionMatrixClickHandlers();
    } else {
        console.warn('Invalid confusion matrix format:', cm);
        // Set default values jika format tidak sesuai
        $('#fisActual-tt, #fisActual-ts, #fisActual-tk, #fisActual-st, #fisActual-ss, #fisActual-sk, #fisActual-kt, #fisActual-ks, #fisActual-kk').text('0');
    }
}

// Update category analysis section
function updateFISActualCategorySection(result) {
    const categoryAnalysis = result.category_analysis;
    
    if (categoryAnalysis['Peluang Lulus Tinggi']) {
        const tinggi = categoryAnalysis['Peluang Lulus Tinggi'];
        const statusBreakdown = tinggi.status_breakdown || {};
        
        $('#fisActualTinggiTotal').text(tinggi.total_predictions);
        $('#fisActualTinggiCorrect').text(tinggi.correct_predictions);
        $('#fisActualTinggiAkurasi').text((tinggi.accuracy * 100).toFixed(2) + '%');
        
        // Tampilkan breakdown per status aktual
        $('#fisActualTinggiStatusTinggi').text(statusBreakdown.LULUS_TINGGI || 0);
        $('#fisActualTinggiStatusSedang').text(statusBreakdown.LULUS_SEDANG || 0);
        $('#fisActualTinggiStatusKecil').text(statusBreakdown.LULUS_KECIL || 0);
    }
    
    if (categoryAnalysis['Peluang Lulus Sedang']) {
        const sedang = categoryAnalysis['Peluang Lulus Sedang'];
        const statusBreakdown = sedang.status_breakdown || {};
        
        $('#fisActualSedangTotal').text(sedang.total_predictions);
        $('#fisActualSedangCorrect').text(sedang.correct_predictions);
        $('#fisActualSedangAkurasi').text((sedang.accuracy * 100).toFixed(2) + '%');
        
        // Tampilkan breakdown per status aktual
        $('#fisActualSedangStatusTinggi').text(statusBreakdown.LULUS_TINGGI || 0);
        $('#fisActualSedangStatusSedang').text(statusBreakdown.LULUS_SEDANG || 0);
        $('#fisActualSedangStatusKecil').text(statusBreakdown.LULUS_KECIL || 0);
    }
    
    if (categoryAnalysis['Peluang Lulus Kecil']) {
        const kecil = categoryAnalysis['Peluang Lulus Kecil'];
        const statusBreakdown = kecil.status_breakdown || {};
        
        $('#fisActualKecilTotal').text(kecil.total_predictions);
        $('#fisActualKecilCorrect').text(kecil.correct_predictions);
        $('#fisActualKecilAkurasi').text((kecil.accuracy * 100).toFixed(2) + '%');
        
        // Tampilkan breakdown per status aktual
        $('#fisActualKecilStatusTinggi').text(statusBreakdown.LULUS_TINGGI || 0);
        $('#fisActualKecilStatusSedang').text(statusBreakdown.LULUS_SEDANG || 0);
        $('#fisActualKecilStatusKecil').text(statusBreakdown.LULUS_KECIL || 0);
    }
}

// Update sample data section - Tampilkan SEMUA data (bukan hanya sample)
function updateFISActualSampleSection(result) {
    // Gunakan full_data jika tersedia, fallback ke sample_data
    const fullData = result.full_data || result.sample_data || [];
    
    console.log('Full data length:', fullData.length);
    
    if (fullData && fullData.length > 0) {
        // Destroy existing grid jika ada
        const existingGrid = $('#fisActualSampleDataGrid').data('kendoGrid');
        if (existingGrid) {
            existingGrid.destroy();
        }
        
        // Clear container dan buat grid baru
        $('#fisActualSampleDataContainer').html('<div id="fisActualSampleDataGrid"></div>');
        
        // Initialize Kendo Grid untuk menampilkan semua data dengan pagination
        $('#fisActualSampleDataGrid').kendoGrid({
            dataSource: {
                data: fullData,
                pageSize: 20,
                schema: {
                    model: {
                        fields: {
                            nim: { type: "string" },
                            nama: { type: "string" },
                            program_studi: { type: "string" },
                            ipk: { type: "number" },
                            sks: { type: "number" },
                            persen_dek: { type: "number" },
                            predicted_category: { type: "string" },
                            actual_status: { type: "string" },
                            fuzzy_score: { type: "number" },
                            is_correct: { type: "boolean" }
                        }
                    }
                }
            },
            height: 600,
            scrollable: true,
            sortable: {
                mode: "multiple",
                allowUnsort: true
            },
            filterable: false, // Disable default Kendo filters, use custom search instead
            pageable: {
                refresh: true,
                pageSizes: [10, 20, 50, 100, "all"],
                buttonCount: 5,
                messages: {
                    display: "{0} - {1} dari {2} data",
                    empty: "Tidak ada data untuk ditampilkan",
                    page: "Halaman",
                    of: "dari {0}",
                    itemsPerPage: "data per halaman",
                    first: "Halaman pertama",
                    previous: "Halaman sebelumnya",
                    next: "Halaman selanjutnya",
                    last: "Halaman terakhir",
                    refresh: "Refresh"
                }
            },
            toolbar: [
                {
                    template: '<button class="k-button k-button-icontext" onclick="exportFISActualEvaluationResults()"><span class="k-icon k-i-file-excel"></span>Export Excel</button>'
                },
                {
                    template: '<div style="margin-left: 10px; padding: 8px 15px; background: linear-gradient(135deg, \\#e3f2fd 0%, \\#bbdefb 100%); border-radius: 6px; display: inline-block;"><i class="fas fa-info-circle" style="color: \\#1976D2;"></i> <span style="color: \\#1565C0; font-weight: 500;">Total: <strong id="fisActualGridTotal">' + fullData.length + '</strong> data</span></div>'
                }
            ],
            columns: [
                { 
                    field: "nim", 
                    title: "NIM", 
                    width: 130,
                    template: function(dataItem) {
                        return `<span style="font-family: monospace; font-weight: 500; color: #1976D2;">${dataItem.nim || 'N/A'}</span>`;
                    }
                },
                { 
                    field: "nama", 
                    title: "Nama Mahasiswa", 
                    width: 220,
                    template: function(dataItem) {
                        return `<span style="font-weight: 500; color: #333;">${dataItem.nama || 'N/A'}</span>`;
                    }
                },
                { 
                    field: "program_studi", 
                    title: "Program Studi", 
                    width: 180,
                    template: function(dataItem) {
                        const prodiColor = getProdiColor(dataItem.program_studi);
                        return `<span style="padding: 4px 10px; background: ${prodiColor.bg}; color: ${prodiColor.text}; border-radius: 4px; font-size: 12px; font-weight: 500; display: inline-block;">${dataItem.program_studi || 'N/A'}</span>`;
                    }
                },
                { 
                    field: "ipk", 
                    title: "IPK", 
                    width: 90,
                    format: "{0:n2}",
                    filterable: false,
                    template: function(dataItem) {
                        if (!dataItem.ipk) return 'N/A';
                        const ipk = dataItem.ipk;
                        let color = '#dc3545'; // merah
                        if (ipk >= 3.5) color = '#28a745'; // hijau
                        else if (ipk >= 3.0) color = '#ffc107'; // kuning
                        return `<span style="font-weight: bold; color: ${color};">${ipk.toFixed(2)}</span>`;
                    },
                    attributes: {
                        style: "text-align: center;"
                    }
                },
                { 
                    field: "sks", 
                    title: "SKS", 
                    width: 90,
                    filterable: false,
                    template: function(dataItem) {
                        if (!dataItem.sks) return 'N/A';
                        const sks = dataItem.sks;
                        let color = '#dc3545'; // merah
                        if (sks >= 130) color = '#28a745'; // hijau
                        else if (sks >= 100) color = '#ffc107'; // kuning
                        return `<span style="font-weight: bold; color: ${color};">${sks}</span>`;
                    },
                    attributes: {
                        style: "text-align: center;"
                    }
                },
                { 
                    field: "persen_dek", 
                    title: "% D/E/K", 
                    width: 100,
                    filterable: false,
                    template: function(dataItem) {
                        if (dataItem.persen_dek === null || dataItem.persen_dek === undefined) return 'N/A';
                        const dek = dataItem.persen_dek;
                        let color = '#28a745'; // hijau (good - rendah)
                        if (dek > 20) color = '#dc3545'; // merah (bad - tinggi)
                        else if (dek > 10) color = '#ffc107'; // kuning (warning)
                        return `<span style="font-weight: bold; color: ${color};">${dek.toFixed(2)}%</span>`;
                    },
                    attributes: {
                        style: "text-align: center;"
                    }
                },
                { 
                    field: "fuzzy_score", 
                    title: "Fuzzy Score", 
                    width: 120,
                    filterable: false,
                    template: function(dataItem) {
                        if (!dataItem.fuzzy_score) return 'N/A';
                        const score = dataItem.fuzzy_score;
                        let color = '#dc3545';
                        let bgColor = '#ffebee';
                        if (score >= 70) {
                            color = '#28a745';
                            bgColor = '#e8f5e9';
                        } else if (score >= 45) {
                            color = '#ffc107';
                            bgColor = '#fff3cd';
                        }
                        return `<span style="padding: 5px 10px; background: ${bgColor}; color: ${color}; border-radius: 4px; font-weight: bold; display: inline-block;">${score.toFixed(2)}</span>`;
                    },
                    attributes: {
                        style: "text-align: center;"
                    }
                },
                { 
                    field: "predicted_category", 
                    title: "Prediksi FIS", 
                    width: 180,
                    template: function(dataItem) {
                        const badgeClass = getFISClassificationBadgeClass(dataItem.predicted_category);
                        return `<span class="badge ${badgeClass}" style="font-size: 11px; padding: 6px 12px; font-weight: 600; white-space: nowrap;">${dataItem.predicted_category || 'N/A'}</span>`;
                    }
                },
                { 
                    field: "actual_status", 
                    title: "Status Aktual", 
                    width: 150,
                    template: function(dataItem) {
                        const getActualStatusBadgeClass = (status) => {
                            switch(status) {
                                case 'LULUS_TINGGI':
                                    return 'bg-success';
                                case 'LULUS_SEDANG':
                                    return 'bg-warning';
                                case 'LULUS_KECIL':
                                    return 'bg-danger';
                                default:
                                    return 'bg-secondary';
                            }
                        };
                        
                        const formatActualStatus = (status) => {
                            return status ? status.replace(/_/g, ' ') : 'N/A';
                        };
                        
                        const badgeClass = getActualStatusBadgeClass(dataItem.actual_status);
                        const statusText = formatActualStatus(dataItem.actual_status);
                        return `<span class="badge ${badgeClass}" style="font-size: 11px; padding: 6px 12px; font-weight: 600; white-space: nowrap;">${statusText}</span>`;
                    }
                },
                { 
                    field: "is_correct", 
                    title: "Match", 
                    width: 120,
                    filterable: false,
                    template: function(dataItem) {
                        if (dataItem.is_correct) {
                            return '<div style="text-align: center;"><span style="padding: 5px 12px; background: #e8f5e9; color: #28a745; border-radius: 4px; font-weight: 600; display: inline-block;"><i class="fas fa-check-circle"></i> Benar</span></div>';
                        } else {
                            return '<div style="text-align: center;"><span style="padding: 5px 12px; background: #ffebee; color: #dc3545; border-radius: 4px; font-weight: 600; display: inline-block;"><i class="fas fa-times-circle"></i> Salah</span></div>';
                        }
                    },
                    attributes: {
                        style: "text-align: center;"
                    }
                }
            ],
            dataBound: function(e) {
                console.log('FIS Actual Sample Grid Data Bound');
                const grid = e.sender;
                const totalRecords = grid.dataSource.total();
                
                // Simpan data lengkap ke cache untuk custom search
                const allData = grid.dataSource.data();
                if (!window.fisActualEvaluationDataCache || window.fisActualEvaluationDataCache.length === 0) {
                    window.fisActualEvaluationDataCache = JSON.parse(JSON.stringify(allData)); // Deep copy
                    console.log('🔧 FIS Actual Evaluation data cached:', window.fisActualEvaluationDataCache.length, 'items');
                }
                
                // Update total data di toolbar
                const total = window.fisActualEvaluationDataCache ? window.fisActualEvaluationDataCache.length : allData.length;
                const totalElement = $('#fisActualGridTotal');
                if (totalElement.length) {
                    totalElement.text(total);
                }
                
                // Update info text
                const infoText = `Menampilkan ${totalRecords} data mahasiswa dengan status lulus aktual`;
                $('#fisActualSampleDataInfo').text(infoText);
            }
        });
        
        // Add info text di atas grid
        $('#fisActualSampleDataContainer').prepend(`
            <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                <i class="fas fa-info-circle"></i> 
                <span id="fisActualSampleDataInfo">Menampilkan ${fullData.length} data mahasiswa dengan status lulus aktual</span>
            </div>
        `);
        
    } else {
        $('#fisActualSampleDataContainer').html('<p class="text-muted">Tidak ada data tersedia</p>');
    }
}

// Helper function untuk badge class
function getFISClassificationBadgeClass(category) {
    switch(category) {
        case 'Peluang Lulus Tinggi':
            return 'bg-success';
        case 'Peluang Lulus Sedang':
            return 'bg-warning';
        case 'Peluang Lulus Kecil':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

// Helper function untuk mendapatkan warna Program Studi
function getProdiColor(prodi) {
    if (!prodi) return { bg: '#e0e0e0', text: '#666' };
    
    const prodiColors = {
        'Teknik Informatika': { bg: '#e3f2fd', text: '#1565C0' },
        'Sistem Informasi': { bg: '#e8f5e9', text: '#2e7d32' },
        'Teknik Komputer': { bg: '#fff3e0', text: '#e65100' },
        'Manajemen Informatika': { bg: '#f3e5f5', text: '#6a1b9a' },
        'Komputerisasi Akuntansi': { bg: '#fff9c4', text: '#f57f17' },
        'Teknik Elektro': { bg: '#ffebee', text: '#c62828' },
        'default': { bg: '#e0e0e0', text: '#424242' }
    };
    
    return prodiColors[prodi] || prodiColors['default'];
}

// Helper function untuk mendapatkan daftar unique Program Studi
function getUniqueProdiList(data) {
    if (!data || !Array.isArray(data)) return [];
    
    const uniqueProdi = [...new Set(data.map(item => item.program_studi).filter(p => p))];
    return uniqueProdi.map(prodi => ({ program_studi: prodi }));
}

// Function untuk export FIS Actual Evaluation Results ke Excel
function exportFISActualEvaluationResults() {
    console.log('🔧 exportFISActualEvaluationResults called');
    
    try {
        const grid = $('#fisActualSampleDataGrid').data('kendoGrid');
        console.log('🔧 Grid instance:', grid ? 'Found' : 'Not found');
        
        if (!grid) {
            console.error('❌ Grid not found');
            showNotification('error', 'Error', 'Grid tidak ditemukan. Pastikan data sudah dimuat.');
            return;
        }
        
        // Get data from grid
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
                ipk: item.ipk,
                sks: item.sks,
                persen_dek: item.persen_dek,
                fuzzy_score: item.fuzzy_score,
                predicted_category: item.predicted_category,
                actual_status: item.actual_status,
                is_correct: item.is_correct
            });
        }
        
        console.log('✅ Plain data prepared:', plainData.length, 'records');
        
        // Use custom export function
        exportFISActualEvaluationResultsCustom(plainData);
        
    } catch (error) {
        console.error('❌ Error exporting to Excel:', error);
        console.error('❌ Error stack:', error.stack);
        showNotification('error', 'Error', 'Gagal mengekspor ke Excel: ' + error.message);
    }
}

// Alternative: Export with custom data processing
function exportFISActualEvaluationResultsCustom(fullData) {
    console.log('🔧 exportFISActualEvaluationResultsCustom called');
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
            exportToCSV(fullData);
            return;
        }
        
        // Check if Kendo OOXML is available
        console.log('🔧 Checking Kendo availability...');
        console.log('🔧 typeof kendo:', typeof kendo);
        console.log('🔧 typeof kendo.ooxml:', typeof kendo !== 'undefined' ? typeof kendo.ooxml : 'N/A');
        
        if (typeof kendo === 'undefined' || typeof kendo.ooxml === 'undefined') {
            console.warn('⚠️ Kendo OOXML not available, using CSV export instead');
            exportToCSV(fullData);
            return;
        }
        
        console.log('✅ JSZip and Kendo OOXML are available');
        
        // Prepare data for export
        const exportData = fullData.map(item => ({
            'NIM': item.nim || '',
            'Nama Mahasiswa': item.nama || '',
            'Program Studi': item.program_studi || '',
            'IPK': item.ipk ? item.ipk.toFixed(2) : '',
            'SKS': item.sks || '',
            '% D/E/K': item.persen_dek ? item.persen_dek.toFixed(2) + '%' : '',
            'Fuzzy Score': item.fuzzy_score ? item.fuzzy_score.toFixed(2) : '',
            'Prediksi FIS': item.predicted_category || '',
            'Status Aktual': item.actual_status ? item.actual_status.replace(/_/g, ' ') : '',
            'Match': item.is_correct ? 'Benar' : 'Salah'
        }));
        
        console.log('Creating workbook with ' + exportData.length + ' rows...');
        
        // Create workbook
        const workbook = new kendo.ooxml.Workbook({
            sheets: [
                {
                    name: "Data Evaluasi FIS",
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
                        { autoWidth: true }
                    ],
                    rows: [
                        // Title row
                        {
                            cells: [
                                {
                                    value: "Evaluasi FIS dengan Data Aktual - Data Lengkap",
                                    bold: true,
                                    fontSize: 16,
                                    color: "#1976D2",
                                    colSpan: 10,
                                    textAlign: "center"
                                }
                            ]
                        },
                        // Metadata row
                        {
                            cells: [
                                {
                                    value: "Exported: " + new Date().toLocaleString('id-ID') + " | Total Data: " + fullData.length,
                                    colSpan: 10,
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
                                { value: "IPK", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "SKS", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "% D/E/K", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Fuzzy Score", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Prediksi FIS", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Status Aktual", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Match", bold: true, background: "#667eea", color: "#ffffff" }
                            ]
                        }
                    ].concat(
                        // Data rows
                        exportData.map((item, index) => ({
                            cells: [
                                { value: item['NIM'], background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Nama Mahasiswa'], background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Program Studi'], background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['IPK'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['SKS'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['% D/E/K'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Fuzzy Score'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Prediksi FIS'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Status Aktual'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Match'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" }
                            ]
                        }))
                    )
                }
            ]
        });
        
        // Save the workbook
        const fileName = "FIS_Evaluasi_Data_Lengkap_" + new Date().toISOString().split('T')[0] + ".xlsx";
        
        console.log('🔧 Saving workbook to file:', fileName);
        console.log('🔧 Converting workbook to data URL...');
        
        // Convert to data URL and download
        const dataURL = workbook.toDataURL();
        console.log('🔧 Data URL generated, length:', dataURL ? dataURL.length : 0);
        console.log('🔧 Data URL prefix:', dataURL ? dataURL.substring(0, 50) : 'N/A');
        
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
            document.body.removeChild(link);
            console.log('🔧 Link removed from body');
        }, 100);
        
        showNotification('success', 'Berhasil', 'File Excel berhasil diunduh: ' + fileName);
        console.log('✅ Excel export completed successfully (manual download)');
        
    } catch (error) {
        console.error('Error in custom Excel export:', error);
        console.error('Error details:', error);
        // Fallback to CSV
        console.log('Falling back to CSV export...');
        exportToCSV(fullData);
    }
}

// Fallback CSV export function
function exportToCSV(fullData) {
    console.log('Exporting to CSV format...');
    
    try {
        // Prepare CSV header
        const headers = ['NIM', 'Nama Mahasiswa', 'Program Studi', 'IPK', 'SKS', '% D/E/K', 'Fuzzy Score', 'Prediksi FIS', 'Status Aktual', 'Match'];
        
        // Prepare CSV rows
        const rows = fullData.map(item => [
            item.nim || '',
            item.nama || '',
            item.program_studi || '',
            item.ipk ? item.ipk.toFixed(2) : '',
            item.sks || '',
            item.persen_dek ? item.persen_dek.toFixed(2) : '',
            item.fuzzy_score ? item.fuzzy_score.toFixed(2) : '',
            item.predicted_category || '',
            item.actual_status ? item.actual_status.replace(/_/g, ' ') : '',
            item.is_correct ? 'Benar' : 'Salah'
        ]);
        
        // Combine header and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Add BOM for Excel UTF-8 support
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Create download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = 'FIS_Evaluasi_Data_Lengkap_' + new Date().toISOString().split('T')[0] + '.csv';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('success', 'Berhasil', 'File CSV berhasil diunduh (format Excel kompatibel)');
        console.log('CSV export completed successfully');
        
    } catch (error) {
        console.error('Error in CSV export:', error);
        showNotification('error', 'Error', 'Gagal mengekspor data: ' + error.message);
    }
}

// Setup click handlers untuk confusion matrix cells
function setupConfusionMatrixClickHandlers() {
    console.log('Setting up confusion matrix click handlers');
    
    // Remove existing handlers untuk prevent duplication
    $('.cm-cell.clickable').off('click');
    
    // Add click handler
    $('.cm-cell.clickable').on('click', function() {
        const actualStatus = $(this).data('actual');
        const predictedCategory = $(this).data('predicted');
        const count = parseInt($(this).text()) || 0;
        
        console.log('CM Cell clicked:', { actualStatus, predictedCategory, count });
        
        if (count > 0) {
            showConfusionMatrixDetailModal(actualStatus, predictedCategory, count);
        } else {
            showNotification('Info', 'Tidak ada data untuk kombinasi ini', 'info');
        }
    });
    
    // Add hover effect
    $('.cm-cell.clickable').hover(
        function() {
            $(this).css('opacity', '0.7');
        },
        function() {
            $(this).css('opacity', '1');
        }
    );
}

// Show detail modal untuk confusion matrix cell
function showConfusionMatrixDetailModal(actualStatus, predictedCategory, count) {
    if (!fisActualEvaluationFullData || fisActualEvaluationFullData.length === 0) {
        showNotification('Error', 'Data evaluasi tidak tersedia', 'error');
        return;
    }
    
    // Hitung total evaluasi dari full data
    const totalEvaluated = fisActualEvaluationFullData.length;
    
    console.log('=== Confusion Matrix Modal Debug ===');
    console.log('Total full data available:', totalEvaluated);
    console.log('Looking for:', { actualStatus, predictedCategory, count });
    
    // Filter data berdasarkan actual status dan predicted category DARI FULL DATA
    // Confusion matrix sekarang menggunakan ALL data yang berlabel
    const filteredData = fisActualEvaluationFullData.filter(item => {
        return item.actual_status === actualStatus && item.predicted_category === predictedCategory;
    });
    
    console.log('Filtered data count:', filteredData.length);
    console.log('Expected count from confusion matrix:', count);
    
    if (filteredData.length !== count) {
        console.warn('⚠️ Mismatch: Filtered data (' + filteredData.length + ') != CM count (' + count + ')');
        console.warn('This might indicate an issue with data filtering logic');
    } else {
        console.log('✅ Match: Filtered data matches confusion matrix count');
    }
    
    if (filteredData.length === 0) {
        showNotification('Info', 'Tidak ada data detail untuk kombinasi ini', 'info');
        return;
    }
    
    // Format label untuk display
    const actualLabel = actualStatus.replace(/_/g, ' ');
    const isCorrect = actualStatus.replace('LULUS_', '') === predictedCategory.replace('Peluang Lulus ', '').toUpperCase();
    
    // Generate unique ID untuk grid container
    const uniqueGridId = 'cmDetailGrid_' + Date.now();
    
    // Create modal content with unique ID
    const modalContent = $('<div>').html(`
        <div style="padding: 20px;">
            <div style="background: ${isCorrect ? '#e8f5e9' : '#ffebee'}; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0;">
                    <i class="fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${isCorrect ? 'Prediksi Benar' : 'Prediksi Salah'}
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <strong>Status Aktual:</strong><br>
                        <span class="badge bg-${getStatusBadgeColor(actualStatus)}" style="font-size: 14px; padding: 8px 12px;">
                            ${actualLabel}
                        </span>
                    </div>
                    <div>
                        <strong>Prediksi FIS:</strong><br>
                        <span class="badge ${getFISClassificationBadgeClass(predictedCategory)}" style="font-size: 14px; padding: 8px 12px;">
                            ${predictedCategory}
                        </span>
                    </div>
                </div>
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.1);">
                    <strong><i class="fas fa-users"></i> Jumlah Mahasiswa:</strong> ${filteredData.length} dari ${totalEvaluated} (${((filteredData.length/totalEvaluated)*100).toFixed(1)}%)
                </div>
                <div style="margin-top: 6px; color: #546E7A; font-size: 12px;">
                    <i class="fas fa-info-circle"></i> Total data yang dievaluasi: ${totalEvaluated} mahasiswa
                </div>
            </div>
            
            <h5 style="margin-bottom: 15px; color: #333;">
                <i class="fas fa-table"></i> Detail Data Mahasiswa dan Prediksi
            </h5>
            <div id="${uniqueGridId}"></div>
        </div>
    `);
    
    // Create Kendo Dialog
    const dialog = modalContent.kendoDialog({
        width: "1100px",
        height: "750px",
        title: `Detail Confusion Matrix - ${actualLabel} → ${predictedCategory}`,
        closable: true,
        modal: true,
        actions: [
            {
                text: "Tutup",
                action: function() {
                    return true;
                }
            }
        ],
        open: function() {
            console.log('Modal opened, initializing grid with ID:', uniqueGridId);
            console.log('Filtered data count:', filteredData.length);
            
            // Small delay to ensure DOM is ready
            setTimeout(function() {
                // Check if element exists
                if ($('#' + uniqueGridId).length === 0) {
                    console.error('Grid container not found:', uniqueGridId);
                    return;
                }
                
                // Initialize Kendo Grid inside modal with unique ID
                $('#' + uniqueGridId).kendoGrid({
                    dataSource: {
                        data: filteredData,
                        pageSize: 10
                    },
                    height: 450,
                    scrollable: true,
                    sortable: true,
                    pageable: {
                        refresh: true,
                        pageSizes: [10, 20, 50],
                        buttonCount: 5
                    },
                    columns: [
                        { 
                            field: "nim", 
                            title: "NIM", 
                            width: 120,
                            headerAttributes: {
                                style: "font-weight: bold; background-color: #f8f9fa;"
                            }
                        },
                        { 
                            field: "nama", 
                            title: "Nama", 
                            width: 180,
                            headerAttributes: {
                                style: "font-weight: bold; background-color: #f8f9fa;"
                            }
                        },
                        { 
                            field: "ipk", 
                            title: "IPK", 
                            width: 80,
                            headerAttributes: {
                                style: "font-weight: bold; background-color: #f8f9fa;"
                            },
                            template: function(dataItem) {
                                const ipk = dataItem.ipk || 0;
                                const color = ipk >= 3.5 ? '#28a745' : ipk >= 3.0 ? '#ffc107' : '#dc3545';
                                return `<span style="color: ${color}; font-weight: bold;">${ipk.toFixed(2)}</span>`;
                            }
                        },
                        { 
                            field: "sks", 
                            title: "SKS", 
                            width: 80,
                            headerAttributes: {
                                style: "font-weight: bold; background-color: #f8f9fa;"
                            },
                            template: function(dataItem) {
                                const sks = dataItem.sks || 0;
                                const color = sks >= 130 ? '#28a745' : sks >= 110 ? '#ffc107' : '#dc3545';
                                return `<span style="color: ${color}; font-weight: bold;">${sks}</span>`;
                            }
                        },
                        { 
                            field: "persen_dek", 
                            title: "% D/E/K", 
                            width: 100,
                            headerAttributes: {
                                style: "font-weight: bold; background-color: #f8f9fa;"
                            },
                            template: function(dataItem) {
                                const dek = dataItem.persen_dek || 0;
                                const color = dek <= 10 ? '#28a745' : dek <= 20 ? '#ffc107' : '#dc3545';
                                return `<span style="color: ${color}; font-weight: bold;">${dek.toFixed(2)}%</span>`;
                            }
                        },
                        { 
                            field: "fuzzy_score", 
                            title: "Fuzzy Score", 
                            width: 120,
                            headerAttributes: {
                                style: "font-weight: bold; background-color: #f8f9fa;"
                            },
                            template: function(dataItem) {
                                const score = dataItem.fuzzy_score || 0;
                                return `<strong>${score.toFixed(2)}</strong>`;
                            }
                        },
                        { 
                            field: "predicted_category", 
                            title: "Prediksi FIS", 
                            width: 180,
                            headerAttributes: {
                                style: "font-weight: bold; background-color: #f8f9fa;"
                            },
                            template: function(dataItem) {
                                const category = dataItem.predicted_category || 'N/A';
                                const badgeClass = getFISClassificationBadgeClass(category);
                                return `<span class="badge ${badgeClass}" style="font-size: 11px; padding: 5px 10px; white-space: nowrap;">${category}</span>`;
                            }
                        },
                        { 
                            field: "actual_status", 
                            title: "Status Aktual", 
                            width: 140,
                            headerAttributes: {
                                style: "font-weight: bold; background-color: #f8f9fa;"
                            },
                            template: function(dataItem) {
                                const status = dataItem.actual_status || 'N/A';
                                const statusLabel = status.replace(/_/g, ' ');
                                const badgeColor = getStatusBadgeColor(status);
                                return `<span class="badge bg-${badgeColor}" style="font-size: 11px; padding: 5px 10px;">${statusLabel}</span>`;
                            }
                        },
                        { 
                            field: "is_correct", 
                            title: "Match", 
                            width: 80,
                            headerAttributes: {
                                style: "font-weight: bold; background-color: #f8f9fa; text-align: center;"
                            },
                            attributes: {
                                style: "text-align: center;"
                            },
                            template: function(dataItem) {
                                const isMatch = dataItem.is_correct || false;
                                if (isMatch) {
                                    return `<span style="color: #28a745; font-size: 18px;" title="Prediksi Benar"><i class="fas fa-check-circle"></i></span>`;
                                } else {
                                    return `<span style="color: #dc3545; font-size: 18px;" title="Prediksi Salah"><i class="fas fa-times-circle"></i></span>`;
                                }
                            }
                        }
                    ]
                });
                
                console.log('Grid initialized successfully');
            }, 100);
        },
        close: function() {
            console.log('Modal closing, cleaning up grid:', uniqueGridId);
            
            // Cleanup grid with unique ID
            const grid = $('#' + uniqueGridId).data('kendoGrid');
            if (grid) {
                console.log('Destroying grid');
                grid.destroy();
            }
            
            // Remove element from DOM
            $('#' + uniqueGridId).remove();
        }
    });
    
    // Open dialog
    dialog.data("kendoDialog").open();
}

// Helper function untuk mendapatkan badge color berdasarkan status
function getStatusBadgeColor(status) {
    switch(status) {
        case 'LULUS_TINGGI':
            return 'success';
        case 'LULUS_SEDANG':
            return 'warning';
        case 'LULUS_KECIL':
            return 'danger';
        default:
            return 'secondary';
    }
}

// Print hasil evaluasi FIS
function printFISActualEvaluationResults() {
    console.log('🖨️ Print hasil evaluasi FIS...');
    window.print();
}

// Cache untuk data FIS Actual Evaluation
window.fisActualEvaluationDataCache = null;

// Fungsi untuk melakukan pencarian FIS Actual Evaluation
// Mendukung pencarian berdasarkan: NIM, Nama, Program Studi, Klasifikasi FIS, Status Lulus Aktual
// Mendukung multiple keywords dengan kombinasi filter seperti comparison
function performFISActualSearch() {
    console.log('🔧 performFISActualSearch dipanggil');
    
    const searchInput = $("#searchInputFISActual").val().trim();
    
    if (!searchInput) {
        console.log('🔧 Input pencarian kosong, tampilkan semua data');
        const grid = $('#fisActualSampleDataGrid').data('kendoGrid');
        if (grid && window.fisActualEvaluationDataCache) {
            grid.dataSource.data(JSON.parse(JSON.stringify(window.fisActualEvaluationDataCache))); // Deep copy
            grid.refresh();
            updateFISActualSearchInfo("Menampilkan semua data evaluasi FIS", "info");
        }
        return;
    }
    
    console.log('🔧 Memulai pencarian evaluasi FIS untuk:', searchInput);
    
    try {
        const grid = $('#fisActualSampleDataGrid').data('kendoGrid');
        if (!grid) {
            console.error('🔧 Grid FIS Actual tidak ditemukan');
            updateFISActualSearchInfo("Grid tidak tersedia", "error");
            return;
        }
        
        // Gunakan data dari cache jika tersedia
        const allData = window.fisActualEvaluationDataCache || grid.dataSource.data();
        console.log('🔧 Total data di grid:', allData.length);
        
        // Parse multiple keywords
        const keywords = searchInput.toLowerCase()
            .split(/[,]+/) // Split by comma
            .map(k => k.trim()) // Trim whitespace
            .filter(k => k.length > 0); // Remove empty strings
        
        console.log('🔧 Keywords untuk filter:', keywords);
        
        // Filter data berdasarkan kombinasi filter spesifik (sama seperti comparison)
        // Cek apakah keyword[0] cocok dengan program studi
        let isProdiCombination2 = false;
        let isProdiFisStatusCombination = false;
        let isProdiFisStatusFieldCombination = false;
        
        if (keywords.length === 2 && allData.length > 0) {
            const keyword0Lower = keywords[0].toLowerCase();
            const hasProdiMatch = allData.some(item => {
                const prodi = (item.program_studi || '').toLowerCase();
                return prodi && prodi.includes(keyword0Lower);
            });
            isProdiCombination2 = hasProdiMatch;
        }
        
        if (keywords.length === 3 && allData.length > 0) {
            const keyword0Lower = keywords[0].toLowerCase();
            const hasProdiMatch = allData.some(item => {
                const prodi = (item.program_studi || '').toLowerCase();
                return prodi && prodi.includes(keyword0Lower);
            });
            isProdiFisStatusCombination = hasProdiMatch;
        }
        
        if (keywords.length === 4 && allData.length > 0) {
            const keyword0Lower = keywords[0].toLowerCase();
            const hasProdiMatch = allData.some(item => {
                const prodi = (item.program_studi || '').toLowerCase();
                return prodi && prodi.includes(keyword0Lower);
            });
            isProdiFisStatusFieldCombination = hasProdiMatch;
        }
        
        const filteredData = allData.filter(item => {
            if (keywords.length === 2) {
                if (isProdiCombination2) {
                    // Kombinasi: Program Studi + Klasifikasi (FIS/Status)
                    const prodi = (item.program_studi || '').toLowerCase();
                    const prodiMatch = prodi && prodi.includes(keywords[0]);
                    
                    const keyword1Lower = keywords[1].toLowerCase();
                    const fisMatch = item.predicted_category && 
                        item.predicted_category.toLowerCase().includes(keyword1Lower);
                    const actualStatus = (item.actual_status || '').toLowerCase();
                    const statusMatch = actualStatus && actualStatus.includes(keyword1Lower);
                    
                    return prodiMatch && (fisMatch || statusMatch);
                } else {
                    // Kombinasi: FIS kategori + Status Aktual
                    const fisMatch = item.predicted_category && 
                        item.predicted_category.toLowerCase().includes(keywords[0]);
                    const actualStatus = (item.actual_status || '').toLowerCase();
                    const statusMatch = actualStatus && actualStatus.includes(keywords[1]);
                    return fisMatch && statusMatch;
                }
            } else if (keywords.length === 3) {
                if (isProdiFisStatusCombination) {
                    // Kombinasi: Program Studi + FIS kategori + Status Aktual
                    const prodi = (item.program_studi || '').toLowerCase();
                    const prodiMatch = prodi && prodi.includes(keywords[0]);
                    const fisMatch = item.predicted_category && 
                        item.predicted_category.toLowerCase().includes(keywords[1]);
                    const actualStatus = (item.actual_status || '').toLowerCase();
                    const statusMatch = actualStatus && actualStatus.includes(keywords[2]);
                    return prodiMatch && fisMatch && statusMatch;
                } else {
                    // Kombinasi: FIS kategori + Status Aktual + (field lain)
                    const fisMatch = item.predicted_category && 
                        item.predicted_category.toLowerCase().includes(keywords[0]);
                    const actualStatus = (item.actual_status || '').toLowerCase();
                    const statusMatch = actualStatus && actualStatus.includes(keywords[1]);
                    // Keyword[2] bisa match di field manapun
                    const keyword2Match = 
                        (item.nim && item.nim.toLowerCase().includes(keywords[2])) ||
                        (item.nama && item.nama.toLowerCase().includes(keywords[2])) ||
                        (item.program_studi && item.program_studi.toLowerCase().includes(keywords[2]));
                    return fisMatch && statusMatch && keyword2Match;
                }
            } else if (keywords.length === 4) {
                if (isProdiFisStatusFieldCombination) {
                    // Kombinasi: Program Studi + FIS kategori + Status Aktual + (field lain)
                    const prodi = (item.program_studi || '').toLowerCase();
                    const prodiMatch = prodi && prodi.includes(keywords[0]);
                    const fisMatch = item.predicted_category && 
                        item.predicted_category.toLowerCase().includes(keywords[1]);
                    const actualStatus = (item.actual_status || '').toLowerCase();
                    const statusMatch = actualStatus && actualStatus.includes(keywords[2]);
                    // Keyword[3] bisa match di field manapun
                    const keyword3Match = 
                        (item.nim && item.nim.toLowerCase().includes(keywords[3])) ||
                        (item.nama && item.nama.toLowerCase().includes(keywords[3]));
                    return prodiMatch && fisMatch && statusMatch && keyword3Match;
                } else {
                    // Logika lama: search di semua field
                    return keywords.every(keyword => {
                        if (item.nim && item.nim.toLowerCase().includes(keyword)) return true;
                        if (item.nama && item.nama.toLowerCase().includes(keyword)) return true;
                        if (item.program_studi && item.program_studi.toLowerCase().includes(keyword)) return true;
                        if (item.predicted_category && item.predicted_category.toLowerCase().includes(keyword)) return true;
                        const actualStatus = (item.actual_status || '').toLowerCase();
                        if (actualStatus && actualStatus.includes(keyword)) return true;
                        return false;
                    });
                }
            } else {
                // Logika lama: search di semua field (1 keyword atau >4 keywords)
                return keywords.every(keyword => {
                    if (item.nim && item.nim.toLowerCase().includes(keyword)) return true;
                    if (item.nama && item.nama.toLowerCase().includes(keyword)) return true;
                    if (item.program_studi && item.program_studi.toLowerCase().includes(keyword)) return true;
                    if (item.predicted_category && item.predicted_category.toLowerCase().includes(keyword)) return true;
                    const actualStatus = (item.actual_status || '').toLowerCase();
                    if (actualStatus && actualStatus.includes(keyword)) return true;
                    return false;
                });
            }
        });
        
        console.log('🔧 Data yang difilter:', filteredData.length);
        
        if (filteredData.length === 0) {
            grid.dataSource.data([]);
            grid.refresh();
            updateFISActualSearchInfo(`Tidak ada data ditemukan untuk "${searchInput}"`, "warning");
            return;
        }
        
        // Update grid dengan data hasil pencarian
        grid.dataSource.data(filteredData);
        grid.refresh();
        
        // Build info message
        let infoMessage = '';
        if (keywords.length === 2) {
            if (isProdiCombination2) {
                infoMessage = `Ditemukan ${filteredData.length} data dengan Prodi "${keywords[0]}" dan Klasifikasi "${keywords[1]}"`;
            } else {
                infoMessage = `Ditemukan ${filteredData.length} data dengan FIS "${keywords[0]}" dan Status "${keywords[1]}"`;
            }
        } else if (keywords.length === 3) {
            if (isProdiFisStatusCombination) {
                infoMessage = `Ditemukan ${filteredData.length} data dengan Prodi "${keywords[0]}", FIS "${keywords[1]}", dan Status "${keywords[2]}"`;
            } else {
                const keywordText = `keywords: "${keywords.join('", "')}"`;
                infoMessage = `Ditemukan ${filteredData.length} data dengan ${keywordText}`;
            }
        } else if (keywords.length === 4) {
            if (isProdiFisStatusFieldCombination) {
                infoMessage = `Ditemukan ${filteredData.length} data dengan Prodi "${keywords[0]}", FIS "${keywords[1]}", Status "${keywords[2]}", dan "${keywords[3]}"`;
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
        updateFISActualSearchInfo(infoMessage, "success");
        
    } catch (error) {
        console.error('🔧 Error dalam pencarian FIS Actual:', error);
        updateFISActualSearchInfo("Terjadi kesalahan saat mencari data: " + error.message, "error");
    }
}

// Fungsi untuk clear pencarian FIS Actual Evaluation
function clearFISActualSearch() {
    console.log('🔧 clearFISActualSearch called');
    
    // Clear search input
    $("#searchInputFISActual").val("");
    
    // Restore data lengkap dari cache
    const grid = $('#fisActualSampleDataGrid').data('kendoGrid');
    if (!grid) {
        console.error('🔧 Grid FIS Actual tidak ditemukan');
        updateFISActualSearchInfo("Grid tidak tersedia", "error");
        return;
    }
    
    if (window.fisActualEvaluationDataCache && window.fisActualEvaluationDataCache.length > 0) {
        console.log('🔧 Restoring full data from cache:', window.fisActualEvaluationDataCache.length, 'items');
        grid.dataSource.data(JSON.parse(JSON.stringify(window.fisActualEvaluationDataCache))); // Deep copy
        grid.refresh();
    } else {
        console.log('🔧 No cache available, reloading data');
        // Reload data jika cache tidak tersedia
        if (window.fisActualEvaluationFullData && window.fisActualEvaluationFullData.length > 0) {
            grid.dataSource.data(JSON.parse(JSON.stringify(window.fisActualEvaluationFullData)));
            grid.refresh();
        }
    }
    
    updateFISActualSearchInfo("Pencarian telah dibersihkan, menampilkan semua data", "info");
}

// Fungsi untuk update search info FIS Actual Evaluation
function updateFISActualSearchInfo(message, type) {
    const searchInfo = $("#searchInfoFISActual");
    const searchResultText = $("#searchResultTextFISActual");
    
    if (searchResultText.length) {
        searchResultText.text(message);
    }
    
    // Update icon berdasarkan type
    const icon = searchInfo.find("i");
    if (icon.length) {
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
}

// Initialize search handlers untuk FIS Actual Evaluation
function initializeFISActualSearchHandlers() {
    console.log('Initializing FIS Actual Evaluation search handlers...');
    
    // Event handler untuk tombol pencarian
    $("#btnSearchFISActual").off('click').on('click', () => {
        console.log('🔍 Tombol pencarian FIS Actual diklik');
        performFISActualSearch();
    });
    
    // Event handler untuk tombol clear pencarian
    $("#btnClearSearchFISActual").off('click').on('click', () => {
        console.log('🔍 Tombol clear pencarian FIS Actual diklik');
        clearFISActualSearch();
    });
    
    // Event handler untuk input pencarian
    $("#searchInputFISActual").off('input').on('input', () => {
        const searchTerm = $("#searchInputFISActual").val().trim();
        if (searchTerm.length >= 3) {
            // Auto search setelah 3 karakter
            clearTimeout(window.fisActualSearchTimeout);
            window.fisActualSearchTimeout = setTimeout(() => {
                performFISActualSearch();
            }, 500);
        } else if (searchTerm.length === 0) {
            // Clear search jika input kosong
            clearFISActualSearch();
        }
    });
    
    // Event handler untuk enter key pada input pencarian
    $("#searchInputFISActual").off('keypress').on('keypress', (e) => {
        if (e.which === 13) { // Enter key
            console.log('🔍 Enter key ditekan pada input pencarian FIS Actual');
            performFISActualSearch();
        }
    });
}

// Initialize search handlers saat document ready
$(document).ready(function() {
    // Initialize search handlers untuk FIS Actual Evaluation
    // Delay sedikit untuk memastikan DOM sudah ready
    setTimeout(() => {
        initializeFISActualSearchHandlers();
    }, 500);
});

// Function to toggle formula section for FIS Actual Evaluation
function toggleFISActualFormulaSection() {
    const content = $('#fisActualFormulaContent');
    const chevron = $('#fisActualFormulaChevron');
    
    if (content.is(':visible')) {
        content.slideUp(300);
        chevron.css('transform', 'rotate(0deg)');
    } else {
        content.slideDown(300);
        chevron.css('transform', 'rotate(180deg)');
    }
} 