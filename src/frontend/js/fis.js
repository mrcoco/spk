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
        
        const url = CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA) + "?search=" + encodeURIComponent(nama) + "&limit=1000";
        console.log('🔧 URL request:', url);
        
        $.ajax({
            url: url,
            method: "GET",
            success: function(response) {
                console.log('🔧 Hasil pencarian mahasiswa:', response);
                if (response.data && response.data.length > 0) {
                    // Return array of NIMs
                    const nims = response.data.map(mahasiswa => mahasiswa.nim);
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
async function performFISSearch() {
    console.log('🔧 performFISSearch dipanggil');
    
    const searchInput = $("#searchInputFIS").val().trim();
    
    if (!searchInput) {
        console.log('🔧 Input pencarian kosong, tampilkan semua data');
        $("#fisGrid").data("kendoGrid").dataSource.read();
        updateFISSearchInfo("Menampilkan semua data klasifikasi FIS", "info");
        return;
    }
    
    console.log('🔧 Memulai pencarian klasifikasi FIS untuk:', searchInput);
    
    try {
        // Tampilkan loading pada grid
        kendo.ui.progress($("#fisGrid"), true);
        updateFISSearchInfo("Sedang mencari data klasifikasi FIS...", "info");
        
        // Cari mahasiswa berdasarkan nama atau NIM
        const nims = await searchMahasiswaByName(searchInput);
        
        if (nims.length === 0) {
            kendo.ui.progress($("#fisGrid"), false);
            updateFISSearchInfo("Tidak ada mahasiswa ditemukan dengan kriteria tersebut", "warning");
            return;
        }
        
        // Filter grid berdasarkan NIM yang ditemukan
        const grid = $("#fisGrid").data("kendoGrid");
        const allData = grid.dataSource.data();
        
        // Filter data berdasarkan NIM
        const filteredData = allData.filter(item => nims.includes(item.nim));
        
        if (filteredData.length === 0) {
            kendo.ui.progress($("#fisGrid"), false);
            updateFISSearchInfo("Tidak ada hasil klasifikasi FIS ditemukan untuk mahasiswa tersebut", "warning");
            return;
        }
        
        // Update grid dengan data hasil pencarian
        grid.dataSource.data(filteredData);
        
        // Update total record info
        updateTotalRecordInfo(filteredData.length, "totalRecordTextFIS");
        
        // Sembunyikan loading
        kendo.ui.progress($("#fisGrid"), false);
        updateFISSearchInfo(`Ditemukan ${filteredData.length} data klasifikasi FIS untuk "${searchInput}"`, "success");
        
    } catch (error) {
        console.error('🔧 Error dalam pencarian FIS:', error);
        kendo.ui.progress($("#fisGrid"), false);
        updateFISSearchInfo("Terjadi kesalahan saat mencari data", "error");
    }
}

// Fungsi untuk clear pencarian FIS
function clearFISSearch() {
    $("#searchInputFIS").val("");
    
    // Tampilkan loading saat memuat ulang data
    kendo.ui.progress($("#fisGrid"), true);
    updateFISSearchInfo("Sedang memuat ulang data klasifikasi FIS...", "info");
    
    // Reload data dari server
    $("#fisGrid").data("kendoGrid").dataSource.read();
    
    // Pesan akan diupdate oleh requestEnd event handler
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
    $("#fisGrid").kendoGrid({
        dataSource: {
            transport: {
                read: {
                    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY_RESULT),
                    dataType: "json"
                }
            },
            schema: {
                data: "data",
                total: "total"
            },
            pageSize: 10,
            serverPaging: true,
            serverSorting: true,
            requestStart: function(e) {
                console.log('🔄 FIS Grid: Request started');
                // Tampilkan loading indicator
                kendo.ui.progress($("#fisGrid"), true);
                // Tampilkan pesan loading
                updateFISSearchInfo("Sedang memuat data klasifikasi FIS...", "info");
            },
            requestEnd: function(e) {
                console.log('✅ FIS Grid: Request ended');
                // Sembunyikan loading indicator
                kendo.ui.progress($("#fisGrid"), false);
                // Update pesan berdasarkan hasil
                if (e.type === "read") {
                    if (e.response && e.response.data) {
                        updateFISSearchInfo(`Berhasil memuat ${e.response.data.length} data klasifikasi FIS`, "success");
                    } else {
                        updateFISSearchInfo("Tidak ada data klasifikasi FIS yang ditemukan", "warning");
                    }
                }
            },
            error: function(e) {
                console.error('❌ FIS Grid: Request error', e);
                // Sembunyikan loading indicator
                kendo.ui.progress($("#fisGrid"), false);
                // Tampilkan pesan error
                updateFISSearchInfo("Terjadi kesalahan saat memuat data klasifikasi FIS", "error");
            }
        },
        height: 550,
        // sortable: true,
        // filterable: true,
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
                field: "kategori",
                title: "Kategori",
                width: 150,
                headerAttributes: {
                    style: "text-align: center; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
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

                // Refresh grid untuk menampilkan hasil terbaru
                $("#fisGrid").data("kendoGrid").dataSource.read();

                // Reset dropdown dan dataset button
                // var dropdown = $("#mahasiswaDropdown").data("kendoComboBox");
                // if (dropdown) {
                //     dropdown.value('');
                //     window.selectedMahasiswaData = null;
                //     window.selectedNimFIS = null;
                //     window.selectedMahasiswaDataDashboard = null;
                //     $("#btnKlasifikasi").removeAttr('data-nim');
                //     dropdown.enable();
                //     dropdown.focus();
                //     console.log('Dropdown reset for next search, button dataset cleared');
                // }

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
    
    // Panggil API untuk batch klasifikasi
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY_BATCH),
        type: "POST",
        contentType: "application/json",
        success: function(response) {
            // Refresh grid untuk menampilkan hasil terbaru
            $("#fisGrid").data("kendoGrid").dataSource.read();
            
            // Tampilkan hasil analisis batch menggunakan endpoint distribution
            loadFISDistributionAfterBatch(response);

            showNotification(
                "success",
                "Klasifikasi Batch Berhasil",
                `${response.total_processed} mahasiswa telah diklasifikasi`
            );
        },
        error: function(xhr) {
            let errorMessage = "Terjadi kesalahan saat melakukan klasifikasi batch";
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