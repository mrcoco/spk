// Fungsi untuk menunggu CONFIG tersedia
function waitForConfig() {
    return new Promise((resolve, reject) => {
        if (typeof CONFIG !== 'undefined') {
            console.log('✅ CONFIG sudah tersedia di mahasiswa.js');
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
                console.log('✅ CONFIG berhasil dimuat di mahasiswa.js');
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkConfig);
                console.error('❌ CONFIG tidak dapat dimuat dalam waktu yang ditentukan');
                reject(new Error('CONFIG timeout'));
            }
        }, 100);
    });
}

// Inisialisasi DataSource untuk Grid Mahasiswa
var mahasiswaDataSource;

function initializeMahasiswaDataSource() {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di initializeMahasiswaDataSource');
        return;
    }

    mahasiswaDataSource = new kendo.data.DataSource({
        transport: {
            read: {
                url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA),
            dataType: "json",
            type: "GET"
        },
        create: {
            url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA),
            dataType: "json",
            type: "POST",
            contentType: "application/json"
        },
        update: {
            url: function(data) {
                return CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA) + "/" + data.nim;
            },
            dataType: "json",
            type: "PUT",
            contentType: "application/json"
        },
        destroy: {
            url: function(data) {
                // Validasi data sebelum destroy
                if (!data || !data.nim) {
                    console.error("Invalid data for destroy operation:", data);
                    throw new Error("Data tidak valid untuk operasi hapus");
                }
                return CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA) + "/" + data.nim;
            },
            dataType: "json",
            type: "DELETE",
            beforeSend: function(xhr, options) {
                // Log untuk debugging
                console.log("Destroy request for:", options.data);
            }
        },
        parameterMap: function(data, type) {
            if (type === "read") {
                // Konversi parameter untuk GET request
                const params = {
                    skip: data.skip || 0,
                    limit: data.take || 10
                };

                // Handle sorting with proper null/undefined checks
                if (data.sort && Array.isArray(data.sort) && data.sort.length > 0) {
                    params.sort = data.sort[0].field + "-" + data.sort[0].dir;
                }

                // Handle filtering with proper null/undefined checks
                if (data.filter && data.filter.filters && Array.isArray(data.filter.filters) && data.filter.filters.length > 0) {
                    // Convert filters to server format if needed
                    params.filter = JSON.stringify(data.filter);
                }

                return params;
            }
            if (type === "create" || type === "update") {
                return JSON.stringify(data);
            }
            return data;
        }
    },
    schema: {
        model: {
            id: "nim",
            fields: {
                nim: { type: "string", validation: { required: true } },
                nama: { type: "string", validation: { required: true } },
                program_studi: { type: "string", validation: { required: true } },
                ipk: { type: "number", validation: { required: true, min: 0, max: 4 } },
                sks: { type: "number", validation: { required: true, min: 0 } },
                persen_dek: { type: "number", validation: { required: true, min: 0, max: 100 } }
            }
        },
        data: "data",
        total: "total",
        parse: function(response) {
            // Memastikan setiap item memiliki uid
            if (response.data && Array.isArray(response.data)) {
                response.data.forEach(function(item) {
                    if (!item.uid) {
                        item.uid = kendo.guid();
                    }
                });
            }
            return response;
        }
    },
    pageSize: 10,
    serverPaging: true,
    serverSorting: true,
    error: function(e) {
        let errorMessage = "Terjadi kesalahan";
        try {
            if (e && e.xhr && e.xhr.responseJSON && e.xhr.responseJSON.detail) {
                errorMessage = e.xhr.responseJSON.detail;
            } else if (e && e.xhr && e.xhr.statusText) {
                errorMessage = e.xhr.statusText;
            } else if (e && e.errorThrown) {
                errorMessage = e.errorThrown;
            }
        } catch (error) {
            console.error("Error in error handler:", error);
            errorMessage = "Terjadi kesalahan yang tidak dapat diidentifikasi";
        }
        
        console.error("DataSource error:", e);
        showNotification(
            "Error",
            errorMessage,
            "error"
        );
    }
    });
}

// Fungsi pencarian mahasiswa
function initializeSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchInfo = document.getElementById('searchInfo');
    const searchResultText = document.getElementById('searchResultText');
    
    // Validasi elemen
    if (!searchInput || !searchBtn || !clearSearchBtn || !searchInfo || !searchResultText) {
        console.error('❌ Elemen filter pencarian tidak ditemukan');
        return;
    }
    
    // Pastikan DataSource sudah diinisialisasi
    if (!mahasiswaDataSource) {
        console.error('❌ DataSource mahasiswa belum diinisialisasi');
        return;
    }
    
    let searchTimeout;
    
    // Fungsi untuk melakukan pencarian
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        
        // Tampilkan loading state
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mencari...';
        searchBtn.disabled = true;
        
        if (!searchTerm) {
            // Jika kosong, reset filter
            mahasiswaDataSource.filter({});
            searchInfo.style.display = 'none';
            // Reset button state
            searchBtn.innerHTML = '<i class="fas fa-search"></i> Cari';
            searchBtn.disabled = false;
            return;
        }
        
        // Buat filter untuk mencari di kolom NIM atau nama
        const filter = {
            logic: "or",
            filters: [
                {
                    field: "nim",
                    operator: "contains",
                    value: searchTerm
                },
                {
                    field: "nama",
                    operator: "contains",
                    value: searchTerm
                }
            ]
        };
        
        // Terapkan filter ke DataSource
        mahasiswaDataSource.filter(filter);
        
        // Tampilkan info pencarian
        searchInfo.style.display = 'block';
        searchResultText.textContent = `Menampilkan hasil pencarian untuk: "${searchTerm}"`;
        
        // Reset button state setelah delay
        setTimeout(() => {
            searchBtn.innerHTML = '<i class="fas fa-search"></i> Cari';
            searchBtn.disabled = false;
        }, 300);
    }
    
    // Event listener untuk tombol search
    searchBtn.addEventListener('click', performSearch);
    
    // Event listener untuk tombol clear
    clearSearchBtn.addEventListener('click', function() {
        // Tampilkan loading state
        clearSearchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Clearing...';
        clearSearchBtn.disabled = true;
        
        searchInput.value = '';
        mahasiswaDataSource.filter({});
        searchInfo.style.display = 'none';
        searchInput.focus();
        
        // Reset button state
        setTimeout(() => {
            clearSearchBtn.innerHTML = '<i class="fas fa-times"></i> Clear';
            clearSearchBtn.disabled = false;
        }, 200);
        
        // Reset search button juga
        searchBtn.innerHTML = '<i class="fas fa-search"></i> Cari';
        searchBtn.disabled = false;
    });
    
    // Event listener untuk input (search saat mengetik dengan delay)
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        
        // Tampilkan loading state pada button
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mencari...';
        searchBtn.disabled = true;
        
        searchTimeout = setTimeout(() => {
            performSearch();
        }, 500); // Delay 500ms
    });
    
    // Event listener untuk Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Event listener untuk DataSource change untuk update info
    mahasiswaDataSource.bind('change', function(e) {
        const searchTerm = searchInput.value.trim();
        if (searchTerm && e.items) {
            const totalItems = e.items.length;
            const totalInDataSource = mahasiswaDataSource.total();
            
            if (totalItems === 0) {
                searchResultText.textContent = `Tidak ada hasil untuk: "${searchTerm}"`;
                searchInfo.style.background = 'rgba(220,53,69,0.1)';
                searchInfo.style.borderColor = 'rgba(220,53,69,0.2)';
                searchInfo.style.color = '#dc3545';
            } else {
                searchResultText.textContent = `Menampilkan ${totalItems} dari ${totalInDataSource} hasil untuk: "${searchTerm}"`;
                searchInfo.style.background = 'rgba(0,123,255,0.1)';
                searchInfo.style.borderColor = 'rgba(0,123,255,0.2)';
                searchInfo.style.color = '#0056b3';
            }
        }
    });
    
    console.log('✅ Filter pencarian mahasiswa berhasil diinisialisasi');
}

// Inisialisasi Grid Mahasiswa
$(document).ready(function() {
    // Tunggu sampai CONFIG tersedia
    waitForConfig().then(() => {
        // Inisialisasi DataSource terlebih dahulu
        initializeMahasiswaDataSource();
        
        // Inisialisasi filter pencarian
        initializeSearchFilter();
        
        // Kemudian inisialisasi Grid
        var grid = $("#mahasiswaGrid").kendoGrid({
            dataSource: mahasiswaDataSource,
            height: 450,
            pageable: {
                refresh: true,
                pageSizes: [10, 20, 50, 100],
                buttonCount: 5,
                info: true,
                messages: {
                    display: "Menampilkan {0} - {1} dari {2} data",
                    empty: "Tidak ada data untuk ditampilkan",
                    page: "Halaman",
                    of: "dari {0}",
                    itemsPerPage: "item per halaman",
                    first: "Ke halaman pertama",
                    previous: "Ke halaman sebelumnya",
                    next: "Ke halaman berikutnya",
                    last: "Ke halaman terakhir",
                    refresh: "Refresh"
                }
            },
            toolbar: [
                { name: "create", text: "Tambah Mahasiswa" },
                { 
                    name: "syncAll", 
                    text: "Sync Semua Nilai",
                    template: '<button id="syncAllNilai" class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary" onclick="syncAllNilai()"><i class="fas fa-sync-alt"></i> <span class="k-button-text">Sync Nilai D/E/K</span></button>'
                },
                {
                    name: "batchKlasifikasi",
                    text: "Klasifikasi Batch Metode Fuzzy",
                    template: '<button id="batchKlasifikasi" class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-success" onclick="showBatchKlasifikasi()"><i class="fas fa-sync-alt"></i> <span class="k-button-text">FIS Batch</span></button>'
                },
                {
                    name: "batchKlasifikasiSAW",
                    text: "Klasifikasi Batch Metode SAW",
                    template: '<button id="batchKlasifikasiSAW" class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-success" onclick="showBatchKlasifikasiSAW()"><i class="fas fa-sync-alt"></i> <span class="k-button-text">SAW Batch</span></button>'
                }
            ],
        columns: [
            {
                field: "nim",
                title: "NIM",
                width: 100,
                headerAttributes: {
                    style: "text-align: center; vertical-align: middle; font-weight: bold;"
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
                    style: "text-align: center; vertical-align: middle; font-weight: bold;"
                }
            },
            {
                field: "program_studi",
                title: "Program Studi",
                width: 150,
                headerAttributes: {
                    style: "text-align: center; vertical-align: middle; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                }
            },
            {
                field: "ipk",
                title: "IPK",
                width: 80,
                format: "{0:n2}",
                headerAttributes: {
                    style: "text-align: center; vertical-align: middle; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                }
            },
            {
                field: "sks",
                title: "SKS",
                width: 80,
                headerAttributes: {
                    style: "text-align: center; vertical-align: middle; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                }
            },
            {
                field: "persen_dek",
                title: "Persentase nilai DEK",
                width: 120,
                format: "{0:n2}%",
                headerAttributes: {
                    style: "text-align: center; vertical-align: middle; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                }
            },
            {
                command: [
                    { name: "edit", text: "" },
                    { name: "destroy", text: "" },
                    { 
                        name: "syncNilai",
                        text: "Sync",
                        click: syncNilai,
                        template: '<a class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary" href="\\#" onclick="syncNilai(event, this);"><i class="fas fa-sync-alt"></i> <span class="k-button-text">D/E/K</span></a>'
                    },
                    { 
                        name: "klasifikasi",
                        text: "Klasifikasi",
                        click: showKlasifikasi,
                        template: '<a class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-success" href="\\#" onclick="showKlasifikasi(event, this);"><i class="fas fa-chart-line"></i> <span class="k-button-text">FIS</span></a>'
                    }
                    ,
                    { 
                        name: "klasifikasiSAW",
                        text: "Klasifikasi SAW",
                        click: showKlasifikasiSAW,
                        template: '<a class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-success" href="\\#" onclick="showKlasifikasiSAW(event, this);"><i class="fas fa-chart-line"></i> <span class="k-button-text">SAW</span></a>'
                    }
                    
                ],
                title: "Aksi",
                width: 350,
                headerAttributes: {
                    style: "text-align: center; vertical-align: middle; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                }
            }
        ],
        columnMenu: false,
        editable: {
            mode: "popup",
            window: {
                title: "Edit Data Mahasiswa"
            }
        },
        edit: function(e) {
            if (!e.model.isNew()) {
                e.container.find("input[name='nim']").attr("readonly", true);
            }
        },
        dataBound: function() {
            console.log("Grid data bound");
            
            // Ensure grid is properly initialized
            const grid = $("#mahasiswaGrid").data("kendoGrid");
            if (!grid) {
                console.error("Grid not properly initialized");
                return;
            }
            
            // Validate data source
            const dataSource = grid.dataSource;
            if (!dataSource || !dataSource.data()) {
                console.warn("Data source is empty or not properly initialized");
                return;
            }
            
            console.log("Grid initialized with", dataSource.data().length, "records");
        },
        remove: function(e) {
            // Validasi data sebelum remove
            if (!e.model || !e.model.nim) {
                console.error("Invalid model for remove operation:", e.model);
                e.preventDefault();
                showNotification("Error", "Data tidak valid untuk operasi hapus", "error");
                return;
            }
            
            // Konfirmasi hapus
            if (!confirm(`Apakah Anda yakin ingin menghapus mahasiswa dengan NIM ${e.model.nim}?`)) {
                e.preventDefault();
                return;
            }
            
            console.log("Removing mahasiswa:", e.model.nim);
        },
        dataBinding: function(e) {
            // Validasi data sebelum binding
            if (e.items && Array.isArray(e.items)) {
                e.items.forEach(function(item, index) {
                    if (!item.uid) {
                        console.warn("Item without uid found at index", index, item);
                        // Generate uid jika tidak ada
                        item.uid = kendo.guid();
                    }
                });
            }
        }
    }).data("kendoGrid");
    initializeMahasiswaForm();
    }).catch(error => {
        console.error('Failed to initialize mahasiswa grid:', error);
    });
});

function initializeMahasiswaGrid() {
    // This function is now redundant as the grid is initialized directly in $(document).ready
    // Keeping it for now, but it will be removed if not used elsewhere.
}

function initializeMahasiswaForm() {
    $("#mahasiswaForm").kendoForm({
        orientation: "vertical",
        formData: {
            nim: "",
            nama: "",
            program_studi: "",
            ipk: 0.00,
            sks: 0,
            persen_dek: 0
        },
        items: [
            {
                field: "nim",
                label: "NIM:",
                validation: { required: true }
            },
            {
                field: "nama",
                label: "Nama Mahasiswa:",
                validation: { required: true }
            },
            {
                field: "program_studi",
                label: "Program Studi:",
                editor: "DropDownList",
                editorOptions: {
                    dataSource: [
                        "Teknik Informatika",
                        "Sistem Informasi",
                        "Teknologi Informasi"
                    ]
                },
                validation: { required: true }
            },
            {
                field: "ipk",
                label: "IPK:",
                editor: "NumericTextBox",
                editorOptions: {
                    format: "n2",
                    min: 0,
                    max: 4,
                    step: 0.01
                },
                validation: { required: true, min: 0, max: 4 }
            },
            {
                field: "sks",
                label: "SKS:",
                editor: "NumericTextBox",
                editorOptions: {
                    min: 0,
                    step: 1
                },
                validation: { required: true, min: 0 }
            },
            {
                field: "persen_dek",
                label: "Persentase Kelulusan (%):",
                editor: "NumericTextBox",
                editorOptions: {
                    format: "n2",
                    min: 0,
                    max: 100,
                    step: 0.01
                },
                validation: { required: true, min: 0, max: 100 }
            }
        ],
        submit: function(e) {
            e.preventDefault();
            var formData = e.model;
            
            // Menggunakan mahasiswaDataSource untuk menyimpan data
            mahasiswaDataSource.add(formData);
            mahasiswaDataSource.sync().then(function() {
                $("#mahasiswaForm").hide();
                showNotification(
                    "Sukses",
                    "Data mahasiswa berhasil disimpan",
                    "success"
                );
            }).fail(function(xhr) {
                let errorMessage = "Gagal menyimpan data";
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    errorMessage += ": " + xhr.responseJSON.detail;
                } else if (xhr.statusText) {
                    errorMessage += ": " + xhr.statusText;
                }
                showNotification(
                    "Error",
                    errorMessage,
                    "error"
                );
            });
        }
    });
}

// Fungsi untuk menghapus mahasiswa dengan validasi
function deleteMahasiswa(nim) {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di deleteMahasiswa');
        showNotification("Error", "Konfigurasi aplikasi belum siap", "error");
        return Promise.reject(new Error("CONFIG tidak tersedia"));
    }

    if (!nim) {
        showNotification("Error", "NIM tidak valid", "error");
        return Promise.reject(new Error("NIM tidak valid"));
    }

    return new Promise((resolve, reject) => {
        $.ajax({
            url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA) + "/" + nim,
            type: "DELETE",
            dataType: "json",
            success: function(response) {
                showNotification("Sukses", "Data mahasiswa berhasil dihapus", "success");
                resolve(response);
            },
            error: function(xhr, status, error) {
                let errorMessage = "Gagal menghapus data mahasiswa";
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    errorMessage += ": " + xhr.responseJSON.detail;
                } else if (xhr.statusText) {
                    errorMessage += ": " + xhr.statusText;
                }
                showNotification("Error", errorMessage, "error");
                reject(new Error(errorMessage));
            }
        });
    });
}

// Fungsi untuk refresh grid dengan error handling
function refreshGrid() {
    try {
        const grid = $("#mahasiswaGrid").data("kendoGrid");
        if (grid && grid.dataSource) {
            grid.dataSource.read();
        } else {
            console.warn("Grid not available for refresh");
        }
    } catch (error) {
        console.error("Error refreshing grid:", error);
        showNotification("Error", "Gagal refresh data", "error");
    }
}

// Fungsi untuk mendapatkan DataSource
function getMahasiswaDataSource() {
    return mahasiswaDataSource;
} 

// Fungsi untuk sync nilai satu mahasiswa
function syncNilai(e, element) {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di syncNilai');
        showNotification("Error", "Konfigurasi aplikasi belum siap", "error");
        return;
    }

    e.preventDefault();
    var grid = $("#mahasiswaGrid").data("kendoGrid");
    var dataItem = grid.dataItem($(element).closest("tr"));
    
    // Tambahkan class spin ke icon
    $(element).find('.fa-sync-alt').addClass('fa-spin');
    
    // Tampilkan loading
    kendo.ui.progress(grid.element, true);
    
    $.ajax({
        url: `${CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA)}/${dataItem.nim}/sync-nilai`,
        type: "POST",
        success: function(response) {
            // Tampilkan notifikasi sukses
            showNotification("Sync Nilai Berhasil", 
                `Nilai berhasil disinkronkan. Total MK: ${response.total_mk}, Total D/E/K: ${response.total_dek}, Persentase: ${response.persen_dek}%`, "success");
            
            // Refresh grid
            grid.dataSource.read();
        },
        error: function(xhr) {
            showNotification("Error", "Gagal melakukan sync nilai", "error");
        },
        complete: function() {
            // Sembunyikan loading dan hentikan animasi
            kendo.ui.progress(grid.element, false);
            $(element).find('.fa-sync-alt').removeClass('fa-spin');
        }
    });
}

// Fungsi untuk sync semua nilai
function syncAllNilai() {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di syncAllNilai');
        showNotification("Error", "Konfigurasi aplikasi belum siap", "error");
        return;
    }

    var grid = $("#mahasiswaGrid").data("kendoGrid");
    
    // Tambahkan class spin ke icon
    $('#syncAllNilai').find('.fa-sync-alt').addClass('fa-spin');
    
    // Tampilkan loading
    kendo.ui.progress(grid.element, true);
    
    $.ajax({
        url: `${CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA)}/sync-all-nilai`,
        type: "POST",
        success: function(response) {
            // Tampilkan notifikasi sukses
            showNotification("Sync Semua Nilai Berhasil", 
                `${response.results.length} mahasiswa telah diupdate`, "success");
            
            // Refresh grid
            grid.dataSource.read();
        },
        error: function(xhr) {
            showNotification("Error", "Gagal melakukan sync nilai", "error");
        },
        complete: function() {
            // Sembunyikan loading dan hentikan animasi
            kendo.ui.progress(grid.element, false);
            $('.k-toolbar').find('.fa-sync-alt').removeClass('fa-spin');
        }
    });
}

// showNotification function is defined in app.js 

// Fungsi untuk menampilkan window klasifikasi SAW
function showKlasifikasiSAW(e, element) {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di showKlasifikasiSAW');
        showNotification("Error", "Konfigurasi aplikasi belum siap", "error");
        return;
    }

    e.preventDefault();
    var grid = $("#mahasiswaGrid").data("kendoGrid");
    var dataItem = grid.dataItem($(element).closest("tr"));
    
    // Tampilkan loading
    $(element).find('.fa-chart-line').addClass('fa-spin');
    
    // Ambil data klasifikasi SAW dari server
    $.ajax({
        url: `${CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW)}/calculate/${dataItem.nim}`,
        type: "GET",
        success: function(response) {
            // Debug: Log response untuk troubleshooting
            console.log('SAW API Response:', response);
            
            // Fungsi untuk mendapatkan warna klasifikasi
            function getClassificationColor(classification) {
                if (!classification || typeof classification !== 'string') {
                    return '#6c757d';
                }
                if (classification.includes('Tinggi')) return '#28a745';
                if (classification.includes('Sedang')) return '#ffc107';
                if (classification.includes('Kecil')) return '#dc3545';
                return '#6c757d';
            }
            
            // Fungsi untuk mendapatkan threshold klasifikasi
            function getClassificationThreshold(classification) {
                if (!classification || typeof classification !== 'string') {
                    return '';
                }
                if (classification.includes('Tinggi')) return 'Skor ≥ 0.7';
                if (classification.includes('Sedang')) return '0.45 ≤ Skor < 0.7';
                if (classification.includes('Kecil')) return 'Skor < 0.45';
                return '';
            }
            
            const classificationColor = getClassificationColor(response.klasifikasi);
            
            // Buat window untuk menampilkan hasil klasifikasi SAW identik dengan halaman SAW
            var windowContent = `
                <div class="k-content k-window-content k-dialog-content" style="padding: 20px;">
                    <div id="hasilKlasifikasiSAW" style="display: block; margin-top: 0;">
                        <h3>Hasil Klasifikasi</h3>
                        <div id="hasilDetailSAW">
                            <div class="saw-result">
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
                                            <span class="value">${dataItem.program_studi || 'N/A'}</span>
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
                                                <div>Nilai: <strong>${response.ipk?.toFixed(2) || 'N/A'}</strong></div>
                                                <div>Normalisasi: <strong>${response.normalized_values?.IPK?.toFixed(4) || 'N/A'}</strong></div>
                                                <div>Terbobot: <strong>${response.weighted_values?.IPK?.toFixed(4) || 'N/A'}</strong></div>
                                            </div>
                                        </div>
                                        
                                        <div class="criteria-item">
                                            <div class="criteria-header">
                                                <strong>SKS</strong>
                                                <span class="weight">(Bobot: 37.5%)</span>
                                            </div>
                                            <div class="criteria-values">
                                                <div>Nilai: <strong>${response.sks || 'N/A'}</strong></div>
                                                <div>Normalisasi: <strong>${response.normalized_values?.SKS?.toFixed(4) || 'N/A'}</strong></div>
                                                <div>Terbobot: <strong>${response.weighted_values?.SKS?.toFixed(4) || 'N/A'}</strong></div>
                                            </div>
                                        </div>
                                        
                                        <div class="criteria-item">
                                            <div class="criteria-header">
                                                <strong>Nilai D/E/K</strong>
                                                <span class="weight">(Bobot: 37.5%)</span>
                                            </div>
                                            <div class="criteria-values">
                                                <div>Nilai: <strong>${response.persen_dek?.toFixed(2) || 'N/A'}%</strong></div>
                                                <div>Normalisasi: <strong>${response.normalized_values?.["Nilai D/E/K"]?.toFixed(4) || 'N/A'}</strong></div>
                                                <div>Terbobot: <strong>${response.weighted_values?.["Nilai D/E/K"]?.toFixed(4) || 'N/A'}</strong></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="result-final" style="background: ${classificationColor};">
                                    <h4>Skor SAW Final: ${response.final_value?.toFixed(4) || 'N/A'}</h4>
                                    <h3>Klasifikasi: ${response.klasifikasi || 'N/A'}</h3>
                                    <p>${getClassificationThreshold(response.klasifikasi)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Buat dan tampilkan window
            var dialogDiv = $("<div>").appendTo("body");
            dialogDiv.kendoDialog({
                width: "800px",
                title: "Klasifikasi SAW - Peluang Kelulusan",
                content: windowContent,
                actions: [
                    { text: "Tutup" }
                ],
                close: function() {
                    dialogDiv.data("kendoDialog").destroy();
                    dialogDiv.remove();
                }
            }).data("kendoDialog").open();
            
            // Tampilkan notifikasi sukses
            showNotification(
                "success",
                "Klasifikasi SAW Berhasil",
                "Data klasifikasi SAW berhasil diambil"
            );
        },
        error: function(xhr) {
            let errorMessage = "Gagal mengambil data klasifikasi SAW";
            if (xhr.responseJSON && xhr.responseJSON.detail) {
                errorMessage += ": " + xhr.responseJSON.detail;
            }
            showNotification(
                "error",
                "Error",
                errorMessage
            );
        },
        complete: function() {
            // Hentikan animasi icon
            $(element).find('.fa-chart-line').removeClass('fa-spin');
        }
    });
}

// Fungsi untuk menampilkan window klasifikasi FIS
function showKlasifikasi(e, element) {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di showKlasifikasi');
        showNotification("Error", "Konfigurasi aplikasi belum siap", "error");
        return;
    }

    e.preventDefault();
    var grid = $("#mahasiswaGrid").data("kendoGrid");
    var dataItem = grid.dataItem($(element).closest("tr"));
    
    // Tampilkan loading
    $(element).find('.fa-chart-line').addClass('fa-spin');
    
    // Ambil data klasifikasi dari server
    $.ajax({
        url: `${CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY)}/${dataItem.nim}`,
        type: "GET",
        success: function(response) {
            // Debug: Log response untuk troubleshooting
            console.log('FIS API Response:', response);
            
            // Fungsi untuk mendapatkan warna klasifikasi
            function getFISClassificationColor(classification) {
                if (!classification || typeof classification !== 'string') {
                    return '#6c757d';
                }
                if (classification.includes('Tinggi')) return '#28a745';
                if (classification.includes('Sedang')) return '#ffc107';
                if (classification.includes('Kecil')) return '#dc3545';
                return '#6c757d';
            }
            
            // Fungsi untuk mendapatkan threshold klasifikasi
            function getFISClassificationThreshold(classification) {
                if (!classification || typeof classification !== 'string') {
                    return '';
                }
                if (classification.includes('Tinggi')) return 'Nilai Fuzzy ≥ 0.7';
                if (classification.includes('Sedang')) return '0.45 ≤ Nilai Fuzzy < 0.7';
                if (classification.includes('Kecil')) return 'Nilai Fuzzy < 0.45';
                return '';
            }
            
            const classificationColor = getFISClassificationColor(response.kategori);
            
            // Buat window untuk menampilkan hasil klasifikasi FIS identik dengan halaman FIS
            var windowContent = `
                <div class="k-content k-window-content k-dialog-content" style="padding: 20px;">
                    <div id="hasilKlasifikasiFIS" style="display: block; margin-top: 0;">
                        <h3>Hasil Klasifikasi</h3>
                        <div id="hasilDetailFIS">
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
                                            <span class="value">${dataItem.program_studi || 'N/A'}</span>
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
                                
                                <div class="result-final" style="background: ${classificationColor};">
                                    <h4>Nilai Fuzzy Final: ${response.nilai_fuzzy?.toFixed(2) || 'N/A'}</h4>
                                    <h3>Klasifikasi: ${response.kategori || 'N/A'}</h3>
                                    <p>${getFISClassificationThreshold(response.kategori)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Buat dan tampilkan window
            var dialogDiv = $("<div>").appendTo("body");
            dialogDiv.kendoDialog({
                width: "800px",
                title: "Klasifikasi FIS - Peluang Kelulusan",
                content: windowContent,
                actions: [
                    { text: "Tutup" }
                ],
                close: function() {
                    dialogDiv.data("kendoDialog").destroy();
                    dialogDiv.remove();
                }
            }).data("kendoDialog").open();
            
            // Tampilkan notifikasi sukses
            showNotification(
                "success",
                "Klasifikasi FIS Berhasil",
                "Data klasifikasi FIS berhasil diambil"
            );
        },
        error: function(xhr) {
            let errorMessage = "Gagal mengambil data klasifikasi FIS";
            if (xhr.responseJSON && xhr.responseJSON.detail) {
                errorMessage += ": " + xhr.responseJSON.detail;
            }
            showNotification(
                "error",
                "Error",
                errorMessage
            );
        },
        complete: function() {
            // Hentikan animasi icon
            $(element).find('.fa-chart-line').removeClass('fa-spin');
        }
    });
} 

function showBatchKlasifikasi(e) {
    // Prevent default jika event ada dan memiliki preventDefault
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    
    console.log('showBatchKlasifikasi called'); // Debug log
    console.log('Event parameter:', e); // Debug log untuk melihat parameter event
    
    // Tampilkan konfirmasi
    const confirmDialog = $("<div>")
        .append("<p>Apakah Anda yakin ingin melakukan klasifikasi untuk semua mahasiswa?</p>")
        .append("<p>Proses ini mungkin membutuhkan waktu beberapa saat.</p>")
        .kendoDialog({
            width: "400px",
            title: "Konfirmasi Klasifikasi Batch",
            closable: true,
            modal: true,
            actions: [
                {
                    text: "Batal",
                    primary: false,
                    action: function() {
                        // Dialog akan tertutup otomatis
                    }
                },
                {
                    text: "Ya, Lakukan Klasifikasi",
                    primary: true,
                    action: function() {
                        executeBatchKlasifikasi();
                    }
                }
            ]
        });
    
    // Buka dialog
    confirmDialog.data("kendoDialog").open();
}

function executeBatchKlasifikasi() {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di executeBatchKlasifikasi');
        showNotification("Error", "Konfigurasi aplikasi belum siap", "error");
        return;
    }

    console.log('executeBatchKlasifikasi called'); // Debug log

    // Tampilkan loading
    const loadingDialog = $("<div>")
        .append("<p style='text-align: center;'><i class='fas fa-spinner fa-spin'></i></p>")
        .append("<p style='text-align: center;'>Sedang melakukan klasifikasi...</p>")
        .kendoDialog({
            width: "300px",
            title: "Proses Klasifikasi",
            closable: false,
            modal: true
        });

    // Buka loading dialog
    loadingDialog.data("kendoDialog").open();

    // Panggil API batch klasifikasi
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.BATCH_KLASIFIKASI),
        method: "POST",
        success: function(response) {
            console.log('FIS batch API success:', response); // Debug log
            loadingDialog.data("kendoDialog").close();
            
            // Tampilkan hasil batch
            displayBatchFISResults(response);
            
            showNotification(
                "Sukses",
                response.message || "Klasifikasi batch berhasil dilakukan",
                "success"
            );
            
            // Refresh grid untuk menampilkan hasil terbaru
            $("#mahasiswaGrid").data("kendoGrid").dataSource.read();
        },
        error: function(xhr, status, error) {
            console.error('FIS batch API error:', error); // Debug log
            loadingDialog.data("kendoDialog").close();
            let errorMessage = "Gagal melakukan klasifikasi batch";
            if (xhr.responseJSON && xhr.responseJSON.detail) {
                errorMessage += ": " + xhr.responseJSON.detail;
            }
            showNotification(
                "Error",
                errorMessage,
                "error"
            );
        }
    });
}

function displayBatchFISResults(data) {
    console.log('displayBatchFISResults called with data:', data); // Debug log
    
    // Untuk FIS batch, data hanya berisi message dan total_processed
    // Kita perlu mengambil data klasifikasi dari database
    const totalMahasiswa = data.total_processed || 0;
    
    console.log('Total mahasiswa processed:', totalMahasiswa); // Debug log
    
    // Ambil data klasifikasi dari database untuk menghitung distribusi
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + "/distribution",
        method: "GET",
        success: function(distributionResponse) {
            console.log('FIS distribution API success:', distributionResponse); // Debug log
            
            // Hitung klasifikasi dari distribusi
            const counts = {
                'Peluang Lulus Tinggi': distributionResponse.distribusi['Peluang Lulus Tinggi'] || 0,
                'Peluang Lulus Sedang': distributionResponse.distribusi['Peluang Lulus Sedang'] || 0,
                'Peluang Lulus Kecil': distributionResponse.distribusi['Peluang Lulus Kecil'] || 0
            };
            
            console.log('Final counts from distribution:', counts); // Debug log
            
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
                                    <div style="font-size: 24px; font-weight: bold; color: #28a745;">${counts['Peluang Lulus Tinggi']}</div>
                                    <div style="font-size: 14px; color: #333;">Peluang Tinggi</div>
                                </div>
                                <div style="text-align: center; padding: 15px; background: #fff3cd; border-radius: 6px; border: 2px solid #ffc107;">
                                    <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${counts['Peluang Lulus Sedang']}</div>
                                    <div style="font-size: 14px; color: #333;">Peluang Sedang</div>
                                </div>
                                <div style="text-align: center; padding: 15px; background: #ffebee; border-radius: 6px; border: 2px solid #dc3545;">
                                    <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${counts['Peluang Lulus Kecil']}</div>
                                    <div style="font-size: 14px; color: #333;">Peluang Kecil</div>
                                </div>
                                <div style="text-align: center; padding: 15px; background: #e3f2fd; border-radius: 6px; border: 2px solid #2196F3;">
                                    <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${totalMahasiswa}</div>
                                    <div style="font-size: 14px; color: #333;">Total Mahasiswa</div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="background: #fff; border-radius: 8px; padding: 15px; border: 1px solid #e0e0e0;">
                            <h4 style="color: #333; margin-bottom: 10px;">Detail Hasil:</h4>
                            <p style="color: #666; margin: 0;">
                                <i class="fas fa-info-circle"></i> 
                                Klasifikasi FIS telah berhasil dilakukan untuk ${totalMahasiswa} mahasiswa. 
                                Hasil telah disimpan ke database dan dapat dilihat di halaman FIS.
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
            
            resultDialog.data("kendoDialog").open();
        },
        error: function(xhr, status, error) {
            console.error('FIS distribution API error:', error); // Debug log
            showNotification("Error", "Gagal mengambil data distribusi FIS", "error");
        }
    });
}

function showBatchKlasifikasiSAW(e) {
    // Prevent default jika event ada dan memiliki preventDefault
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    
    console.log('showBatchKlasifikasiSAW called'); // Debug log
    console.log('Event parameter:', e); // Debug log untuk melihat parameter event
    
    // Tampilkan konfirmasi
    const confirmDialog = $("<div>")
        .append("<p>Apakah Anda yakin ingin melakukan klasifikasi SAW untuk semua mahasiswa?</p>")
        .append("<p>Proses ini mungkin membutuhkan waktu beberapa saat.</p>")
        .kendoDialog({
            width: "400px",
            title: "Konfirmasi Klasifikasi SAW Batch",
            closable: true,
            modal: true,
            actions: [
                {
                    text: "Batal",
                    primary: false,
                    action: function() {
                        // Dialog akan tertutup otomatis
                    }
                },
                {
                    text: "Ya, Lakukan Klasifikasi",
                    primary: true,
                    action: function() {
                        executeBatchKlasifikasiSAW();
                    }
                }
            ]
        });
    
    // Buka dialog
    confirmDialog.data("kendoDialog").open();
}

function executeBatchKlasifikasiSAW() {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di executeBatchKlasifikasiSAW');
        showNotification("Error", "Konfigurasi aplikasi belum siap", "error");
        return;
    }

    console.log('executeBatchKlasifikasiSAW called'); // Debug log

    // Tampilkan loading
    const loadingDialog = $("<div>")
        .append("<p style='text-align: center;'><i class='fas fa-spinner fa-spin'></i></p>")
        .append("<p style='text-align: center;'>Sedang melakukan klasifikasi SAW...</p>")
        .kendoDialog({
            width: "300px",
            title: "Proses Klasifikasi SAW",
            closable: false,
            modal: true
        });

    // Buka loading dialog
    loadingDialog.data("kendoDialog").open();

    // Panggil API batch klasifikasi SAW
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW) + "/batch",
        method: "GET",
        success: function(response) {
            console.log('SAW batch API success:', response); // Debug log
            loadingDialog.data("kendoDialog").close();
            
            // Tampilkan hasil batch
            displayBatchSAWResults(response);
            
            showNotification(
                "Sukses",
                `Berhasil mengklasifikasi ${response.total_mahasiswa || 0} mahasiswa dengan metode SAW`,
                "success"
            );
            
            // Refresh grid untuk menampilkan hasil terbaru
            $("#mahasiswaGrid").data("kendoGrid").dataSource.read();
        },
        error: function(xhr, status, error) {
            console.error('SAW batch API error:', error); // Debug log
            loadingDialog.data("kendoDialog").close();
            let errorMessage = "Gagal melakukan klasifikasi SAW batch";
            if (xhr.responseJSON && xhr.responseJSON.detail) {
                errorMessage += ": " + xhr.responseJSON.detail;
            }
            showNotification(
                "Error",
                errorMessage,
                "error"
            );
        }
    });
}

function displayBatchSAWResults(data) {
    console.log('displayBatchSAWResults called with data:', data); // Debug log
    
    // Validasi data dan tentukan struktur yang benar
    let results = [];
    let totalMahasiswa = 0;
    
    if (data && Array.isArray(data)) {
        // Jika data langsung array
        results = data;
        totalMahasiswa = data.length;
    } else if (data && data.data && Array.isArray(data.data)) {
        // Jika data dalam format {data: [...]}
        results = data.data;
        totalMahasiswa = data.data.length;
    } else if (data && data.results && Array.isArray(data.results)) {
        // Jika data dalam format {results: [...]}
        results = data.results;
        totalMahasiswa = data.results.length;
    } else {
        console.error('Invalid SAW batch results data structure:', data);
        showNotification("Error", "Format data hasil batch SAW tidak valid", "error");
        return;
    }
    
    console.log('Processed results:', results); // Debug log
    console.log('Total mahasiswa:', totalMahasiswa); // Debug log
    
    // Hitung klasifikasi
    const counts = {
        'Peluang Lulus Tinggi': 0,
        'Peluang Lulus Sedang': 0,
        'Peluang Lulus Kecil': 0
    };
    
    results.forEach((result, index) => {
        console.log(`Result ${index}:`, result); // Debug log untuk setiap hasil
        if (result && result.klasifikasi_saw) {
            counts[result.klasifikasi_saw]++;
            console.log(`Counted ${result.klasifikasi_saw}:`, counts[result.klasifikasi_saw]); // Debug log
        } else {
            console.log(`No klasifikasi_saw found for result ${index}:`, result); // Debug log
        }
    });
    
    console.log('Final counts:', counts); // Debug log
    
    // Buat dialog untuk menampilkan hasil
    const resultDialog = $("<div>")
        .append(`
            <div style="padding: 20px;">
                <h3 style="color: #FF5722; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-chart-pie"></i> Hasil Klasifikasi SAW Batch
                </h3>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 15px;">Ringkasan Hasil:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                        <div style="text-align: center; padding: 15px; background: #e8f5e9; border-radius: 6px; border: 2px solid #28a745;">
                            <div style="font-size: 24px; font-weight: bold; color: #28a745;">${counts['Peluang Lulus Tinggi']}</div>
                            <div style="font-size: 14px; color: #333;">Peluang Tinggi</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #fff3cd; border-radius: 6px; border: 2px solid #ffc107;">
                            <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${counts['Peluang Lulus Sedang']}</div>
                            <div style="font-size: 14px; color: #333;">Peluang Sedang</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #ffebee; border-radius: 6px; border: 2px solid #dc3545;">
                            <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${counts['Peluang Lulus Kecil']}</div>
                            <div style="font-size: 14px; color: #333;">Peluang Kecil</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #e3f2fd; border-radius: 6px; border: 2px solid #2196F3;">
                            <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${totalMahasiswa}</div>
                            <div style="font-size: 14px; color: #333;">Total Mahasiswa</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #fff; border-radius: 8px; padding: 15px; border: 1px solid #e0e0e0;">
                    <h4 style="color: #333; margin-bottom: 10px;">Detail Hasil:</h4>
                    <p style="color: #666; margin: 0;">
                        <i class="fas fa-info-circle"></i> 
                        Klasifikasi SAW telah berhasil dilakukan untuk ${totalMahasiswa} mahasiswa. 
                        Hasil telah disimpan ke database dan dapat dilihat di halaman SAW.
                    </p>
                </div>
            </div>
        `)
        .kendoDialog({
            width: "600px",
            title: "Hasil Klasifikasi SAW Batch",
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
    
    resultDialog.data("kendoDialog").open();
} 