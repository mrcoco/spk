// Inisialisasi komponen FIS saat dokumen siap
$(document).ready(function() {
    initializeFISComponents();
});

function initializeFISComponents() {
    console.log('Initializing FIS components...');
    initializeFISGrid();
    initializeMahasiswaDropdown();
    initializeButtons();
    loadInitialFISBatchResults();
    console.log('FIS components initialized successfully');
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
            serverSorting: true
        },
        height: 550,
        sortable: true,
        filterable: true,
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
                field: "updated_at",
                title: "Terakhir Update",
                width: 150,
                format: "{0:dd/MM/yyyy HH:mm}",
                headerAttributes: {
                    style: "text-align: center; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                }
            }
        ]
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
            
            // Tampilkan hasil analisis batch
            displayFISBatchResults(response);

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
    
    // Panggil API untuk mendapatkan data klasifikasi FIS
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY_RESULT),
        type: "GET",
        timeout: 10000, // 10 detik timeout
        success: function(response) {
            console.log('FIS API response received:', response);
            
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
            console.error('Error loading FIS batch results:', {
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
        }
    });
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