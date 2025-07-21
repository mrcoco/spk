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

// Fungsi untuk memformat angka dalam grid
function formatGridNumbers(grid) {
    console.log('🔧 Memformat angka dalam grid mahasiswa...');
    
    if (!grid || !grid.dataSource || !grid.dataSource.data()) {
        console.warn('Grid atau data source tidak tersedia untuk formatting');
        return;
    }
    
    const data = grid.dataSource.data();
    data.forEach(function(item) {
        // Format IPK dengan 2 desimal
        if (item.ipk !== null && item.ipk !== undefined) {
            item.ipk = parseFloat(item.ipk).toFixed(2);
        }
        
        // Format SKS sebagai integer
        if (item.sks !== null && item.sks !== undefined) {
            item.sks = parseInt(item.sks);
        }
        
        // Format persentase DEK dengan 2 desimal
        if (item.persen_dek !== null && item.persen_dek !== undefined) {
            item.persen_dek = parseFloat(item.persen_dek).toFixed(2);
        }
    });
    
    console.log('✅ Format angka selesai diterapkan');
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

                // Handle search parameter
                if (data.search) {
                    params.search = data.search;
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
    requestStart: function(e) {
        console.log('🔄 Mahasiswa Grid: Request started');
        // Tampilkan loading indicator
        kendo.ui.progress($("#mahasiswaGrid"), true);
        // Update search info jika ada
        const searchInfo = document.getElementById('searchResultText');
        if (searchInfo) {
            searchInfo.textContent = "Sedang memuat data mahasiswa...";
        }
    },
    requestEnd: function(e) {
        console.log('✅ Mahasiswa Grid: Request ended');
        // Sembunyikan loading indicator
        kendo.ui.progress($("#mahasiswaGrid"), false);
        // Update search info berdasarkan hasil
        const searchInfo = document.getElementById('searchResultText');
        if (searchInfo && e.type === "read") {
            if (e.response && e.response.data) {
                searchInfo.textContent = `Berhasil memuat ${e.response.data.length} data mahasiswa`;
            } else {
                searchInfo.textContent = "Tidak ada data mahasiswa yang ditemukan";
            }
        }
    },
    error: function(e) {
        console.error('❌ Mahasiswa Grid: Request error', e);
        // Sembunyikan loading indicator
        kendo.ui.progress($("#mahasiswaGrid"), false);
        // Update search info dengan pesan error
        const searchInfo = document.getElementById('searchResultText');
        if (searchInfo) {
            searchInfo.textContent = "Terjadi kesalahan saat memuat data mahasiswa";
        }
        
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
    },
    save: function(e) {
        if (e.model.isNew()) {
            showNotification(
                "Sukses",
                "Data mahasiswa berhasil ditambahkan",
                "success"
            );
        } else {
            showNotification(
                "Sukses",
                "Data mahasiswa berhasil diperbarui",
                "success"
            );
        }
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
        
        // Tampilkan loading indicator pada grid
        kendo.ui.progress($("#mahasiswaGrid"), true);
        
        if (!searchTerm) {
            // Jika kosong, reset search parameter dan reload data
            mahasiswaDataSource.transport.options.read.data = function() {
                return {
                    skip: 0,
                    limit: mahasiswaDataSource.pageSize()
                };
            };
            mahasiswaDataSource.page(1);
            mahasiswaDataSource.read();
            searchInfo.style.display = 'none';
            // Reset button state
            searchBtn.innerHTML = '<i class="fas fa-search"></i> Cari';
            searchBtn.disabled = false;
            return;
        }
        
        // Set search parameter untuk server-side filtering
        mahasiswaDataSource.transport.options.read.data = function() {
            return {
                skip: 0, // Reset ke halaman pertama saat search
                limit: mahasiswaDataSource.pageSize(),
                search: searchTerm
            };
        };
        
        // Reset ke halaman pertama dan reload data
        mahasiswaDataSource.page(1);
        mahasiswaDataSource.read();
        
        // Tampilkan info pencarian
        searchInfo.style.display = 'block';
        searchResultText.textContent = `Mencari: "${searchTerm}"...`;
        
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
        
        // Tampilkan loading indicator pada grid
        kendo.ui.progress($("#mahasiswaGrid"), true);
        
        searchInput.value = '';
        
        // Reset search parameter dan reload data
        mahasiswaDataSource.transport.options.read.data = function() {
            return {
                skip: 0,
                limit: mahasiswaDataSource.pageSize()
            };
        };
        mahasiswaDataSource.page(1);
        mahasiswaDataSource.read();
        
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
            const currentPage = mahasiswaDataSource.page();
            const pageSize = mahasiswaDataSource.pageSize();
            
            if (totalItems === 0) {
                searchResultText.textContent = `Tidak ada hasil untuk: "${searchTerm}"`;
                searchInfo.style.background = 'rgba(220,53,69,0.1)';
                searchInfo.style.borderColor = 'rgba(220,53,69,0.2)';
                searchInfo.style.color = '#dc3545';
            } else {
                const startIndex = (currentPage - 1) * pageSize + 1;
                const endIndex = startIndex + totalItems - 1;
                searchResultText.textContent = `Menampilkan ${startIndex}-${endIndex} dari ${totalInDataSource} hasil untuk: "${searchTerm}"`;
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
                { 
                    name: "create", 
                    text: "Tambah Mahasiswa",
                    template: '<button class="k-button k-button-md k-rounded-md k-button-solid custom-button-sync" onclick="showAddMahasiswaForm()"><i class="fas fa-plus"></i> <span class="k-button-text">Tambah Mahasiswa</span></button>'
                },
                { 
                    name: "syncAll", 
                    text: "Sync Semua Nilai",
                    template: '<button id="syncAllNilai" class="k-button k-button-md k-rounded-md k-button-solid custom-button-sync" onclick="syncAllNilai()"><i class="fas fa-sync-alt"></i> <span class="k-button-text">Sync Nilai D/E/K</span></button>'
                },
                {
                    name: "batchKlasifikasi",
                    text: "Klasifikasi Batch Metode Fuzzy",
                    template: '<button id="batchKlasifikasi" class="k-button k-button-md k-rounded-md k-button-solid custom-button-fis" onclick="showBatchKlasifikasi()"><i class="fas fa-sync-alt"></i> <span class="k-button-text">FIS Batch</span></button>'
                },
                {
                    name: "batchKlasifikasiSAW",
                    text: "Klasifikasi Batch Metode SAW",
                    template: '<button id="batchKlasifikasiSAW" class="k-button k-button-md k-rounded-md k-button-solid custom-button-saw" onclick="showBatchKlasifikasiSAW()"><i class="fas fa-sync-alt"></i> <span class="k-button-text">SAW Batch</span></button>'
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
                },
                template: function(dataItem) {
                    if (dataItem.ipk !== null && dataItem.ipk !== undefined) {
                        return kendo.toString(dataItem.ipk, "n2");
                    }
                    return "-";
                }
            },
            {
                field: "sks",
                title: "SKS",
                width: 80,
                format: "{0:n0}",
                headerAttributes: {
                    style: "text-align: center; vertical-align: middle; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                },
                template: function(dataItem) {
                    if (dataItem.sks !== null && dataItem.sks !== undefined) {
                        return kendo.toString(dataItem.sks, "n0");
                    }
                    return "-";
                }
            },
            {
                field: "persen_dek",
                title: "Persentase Nilai D/E/K (%):",
                width: 120,
                format: "{0:n2}%",
                headerAttributes: {
                    style: "text-align: center; vertical-align: middle; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                },
                template: function(dataItem) {
                    if (dataItem.persen_dek !== null && dataItem.persen_dek !== undefined) {
                        return kendo.toString(dataItem.persen_dek, "n2") + "%";
                    }
                    return "-";
                }
            },
            {
                command: [
                    { 
                        name: "edit", 
                        text: "Edit",
                        template: '<button class="k-button k-button-md k-rounded-md k-button-solid custom-button-edit" type="button"><i class="fas fa-edit"></i> <span class="k-button-text">Edit</span></button>'
                    },
                    { 
                        name: "destroy", 
                        text: "Hapus",
                        template: '<button class="k-button k-button-md k-rounded-md k-button-solid custom-button-delete" type="button"><i class="fas fa-trash"></i> <span class="k-button-text">Hapus</span></button>'
                    },
                    { 
                        name: "syncNilai",
                        text: "Sync",
                        click: syncNilai,
                        template: '<a class="k-button k-button-md k-rounded-md k-button-solid custom-button-sync" href="\\#" onclick="syncNilai(event, this);"><i class="fas fa-sync-alt"></i> <span class="k-button-text">D/E/K</span></a>'
                    },
                    { 
                        name: "klasifikasi",
                        text: "Klasifikasi",
                        click: showKlasifikasi,
                        template: '<a class="k-button k-button-md k-rounded-md k-button-solid custom-button-fis" href="\\#" onclick="showKlasifikasi(event, this);"><i class="fas fa-chart-line"></i> <span class="k-button-text">FIS</span></a>'
                    }
                    ,
                    { 
                        name: "klasifikasiSAW",
                        text: "Klasifikasi SAW",
                        click: showKlasifikasiSAW,
                        template: '<a class="k-button k-button-md k-rounded-md k-button-solid custom-button-saw" href="\\#" onclick="showKlasifikasiSAW(event, this);"><i class="fas fa-chart-line"></i> <span class="k-button-text">SAW</span></a>'
                    }
                    
                ],
                title: "Aksi",
                width: 520,
                headerAttributes: {
                    style: "text-align: center; vertical-align: middle; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                }
            }
        ],
        columnMenu: false,
        editable: false,
        edit: function(e) {
            console.log('🔧 Event edit di dalam grid mahasiswa dipanggil...');
            console.log("Edit button clicked", e);
            
            // Prevent default edit behavior
            e.preventDefault();
            e.stopPropagation();
            
            // Get the data item
            var dataItem = e.model;
            console.log("Data item for edit:", dataItem);
            
            // Validasi data item
            if (!dataItem || !dataItem.nim) {
                console.error("Data item tidak valid untuk edit:", dataItem);
                showNotification(
                    "Error",
                    "Data mahasiswa tidak valid untuk diedit",
                    "error"
                );
                return false;
            }
            
            // Call our custom edit function
            showEditMahasiswaForm(dataItem);
            
            return false;
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
            
            // Format numbers in the grid
            formatGridNumbers(grid);
            
            // Update total record info
            updateTotalRecordInfo(dataSource.total(), "totalRecordText");
            
            // Tambahkan event handler untuk tombol edit dan delete
            setTimeout(() => {
                // Event handler untuk tombol edit
                $(document).off('click', '.custom-button-edit').on('click', '.custom-button-edit', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('🔧 Tombol edit diklik secara manual');
                    
                    var row = $(this).closest('tr');
                    var grid = $("#mahasiswaGrid").data("kendoGrid");
                    var dataItem = grid.dataItem(row);
                    
                    console.log("Data item dari tombol edit:", dataItem);
                    
                    if (dataItem && dataItem.nim) {
                        showEditMahasiswaForm(dataItem);
                    } else {
                        console.error("Data item tidak valid untuk edit");
                        showNotification(
                            "Error",
                            "Data mahasiswa tidak valid untuk diedit",
                            "error"
                        );
                    }
                });
                
                // Event handler untuk tombol delete - menggunakan KendoDialog yang menarik
                $(document).off('click', '#mahasiswaGrid .custom-button-delete').on('click', '#mahasiswaGrid .custom-button-delete', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('🔧 Tombol delete diklik secara manual');
                    
                    var row = $(this).closest('tr');
                    var grid = $("#mahasiswaGrid").data("kendoGrid");
                    var dataItem = grid.dataItem(row);
                    
                    console.log("Data item dari tombol delete:", dataItem);
                    
                    if (dataItem && dataItem.nim) {
                        console.log('🔧 Menampilkan dialog konfirmasi hapus untuk mahasiswa:', dataItem);
                        
                        // Buat dialog konfirmasi yang menarik
                        const confirmDialog = $("<div>")
                            .append(`
                                <div style="padding: 20px; text-align: center;">
                                    <div style="margin-bottom: 20px;">
                                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff9800;"></i>
                                    </div>
                                    <h3 style="color: #333; margin-bottom: 15px;">Konfirmasi Hapus Data Mahasiswa</h3>
                                    <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: left;">
                                        <p style="margin: 5px 0; color: #666;">
                                            <strong>NIM:</strong> ${dataItem.nim}
                                        </p>
                                        <p style="margin: 5px 0; color: #666;">
                                            <strong>Nama:</strong> ${dataItem.nama}
                                        </p>
                                        <p style="margin: 5px 0; color: #666;">
                                            <strong>Email:</strong> ${dataItem.email || '-'}
                                        </p>
                                        <p style="margin: 5px 0; color: #666;">
                                            <strong>Program Studi:</strong> ${dataItem.program_studi || '-'}
                                        </p>
                                        <p style="margin: 5px 0; color: #666;">
                                            <strong>Angkatan:</strong> ${dataItem.angkatan || '-'}
                                        </p>
                                    </div>
                                    <p style="color: #dc3545; font-weight: bold; margin-bottom: 0;">
                                        <i class="fas fa-info-circle"></i> 
                                        Data yang dihapus tidak dapat dikembalikan!
                                    </p>
                                </div>
                            `)
                            .kendoDialog({
                                width: "450px",
                                title: "Hapus Data Mahasiswa",
                                closable: true,
                                modal: true,
                                actions: [
                                    {
                                        text: "Batal",
                                        primary: false,
                                        cssClass: "k-button-solid-base",
                                        action: function() {
                                            console.log('🔧 Dialog dibatalkan');
                                            // Dialog akan tertutup otomatis
                                        }
                                    },
                                    {
                                        text: "Ya, Hapus Data",
                                        primary: true,
                                        cssClass: "k-button-solid-error",
                                        action: function() {
                                            console.log('🔧 Konfirmasi hapus diterima, memproses...');
                                            
                                            // Tampilkan loading dialog
                                            const loadingDialog = $("<div>")
                                                .append(`
                                                    <div style="padding: 20px; text-align: center;">
                                                        <div style="margin-bottom: 15px;">
                                                            <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #007bff;"></i>
                                                        </div>
                                                        <p style="color: #333; margin: 0;">Sedang menghapus data mahasiswa...</p>
                                                    </div>
                                                `)
                                                .kendoDialog({
                                                    width: "300px",
                                                    title: "Menghapus Data",
                                                    closable: false,
                                                    modal: true
                                                });
                                            
                                            loadingDialog.data("kendoDialog").open();
                                            
                                            // Lakukan penghapusan dengan AJAX
                                            $.ajax({
                                                url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA) + "/" + dataItem.nim,
                                                type: "DELETE",
                                                dataType: "json",
                                                success: function(response) {
                                                    console.log("Delete berhasil:", response);
                                                    
                                                    // Tutup loading dialog
                                                    loadingDialog.data("kendoDialog").close();
                                                    
                                                    // Refresh grid
                                                    grid.dataSource.read();
                                                    
                                                    showNotification(
                                                        "Sukses",
                                                        `Data mahasiswa ${dataItem.nama} (${dataItem.nim}) berhasil dihapus`,
                                                        "success"
                                                    );
                                                },
                                                error: function(xhr, status, error) {
                                                    console.error("Delete gagal:", xhr, status, error);
                                                    
                                                    // Tutup loading dialog
                                                    loadingDialog.data("kendoDialog").close();
                                                    
                                                    let errorMessage = "Gagal menghapus data mahasiswa";
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
                                                }
                                            });
                                        }
                                    }
                                ]
                            });
                        
                        // Buka dialog konfirmasi
                        confirmDialog.data("kendoDialog").open();
                    } else {
                        console.error("Data item tidak valid untuk delete");
                        showNotification(
                            "Error",
                            "Data mahasiswa tidak valid untuk dihapus",
                            "error"
                        );
                    }
                });
                
                console.log('✅ Event handler untuk tombol edit dan delete berhasil ditambahkan');
            }, 100);
        },
        remove: function(e) {
            console.log('🔧 Event remove di dalam grid mahasiswa dipanggil...');
            console.log("Remove button clicked", e);
            
            // Prevent default remove behavior
            e.preventDefault();
            e.stopPropagation();
            
            // Get the data item
            var dataItem = e.model;
            console.log("Data item for remove:", dataItem);
            
            // Validasi data item
            if (!dataItem || !dataItem.nim) {
                console.error("Data item tidak valid untuk remove:", dataItem);
                showNotification(
                    "Error",
                    "Data mahasiswa tidak valid untuk dihapus",
                    "error"
                );
                return false;
            }
            
            console.log('🔧 Menampilkan dialog konfirmasi hapus untuk mahasiswa:', dataItem);
            
            // Buat dialog konfirmasi yang menarik
            const confirmDialog = $("<div>")
                .append(`
                    <div style="padding: 20px; text-align: center;">
                        <div style="margin-bottom: 20px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff9800;"></i>
                        </div>
                        <h3 style="color: #333; margin-bottom: 15px;">Konfirmasi Hapus Data Mahasiswa</h3>
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: left;">
                            <p style="margin: 5px 0; color: #666;">
                                <strong>NIM:</strong> ${dataItem.nim}
                            </p>
                            <p style="margin: 5px 0; color: #666;">
                                <strong>Nama:</strong> ${dataItem.nama}
                            </p>
                            <p style="margin: 5px 0; color: #666;">
                                <strong>Email:</strong> ${dataItem.email || '-'}
                            </p>
                            <p style="margin: 5px 0; color: #666;">
                                <strong>Program Studi:</strong> ${dataItem.program_studi || '-'}
                            </p>
                            <p style="margin: 5px 0; color: #666;">
                                <strong>Angkatan:</strong> ${dataItem.angkatan || '-'}
                            </p>
                        </div>
                        <p style="color: #dc3545; font-weight: bold; margin-bottom: 0;">
                            <i class="fas fa-info-circle"></i> 
                            Data yang dihapus tidak dapat dikembalikan!
                        </p>
                    </div>
                `)
                .kendoDialog({
                    width: "450px",
                    title: "Hapus Data Mahasiswa",
                    closable: true,
                    modal: true,
                    actions: [
                        {
                            text: "Batal",
                            primary: false,
                            cssClass: "k-button-solid-base",
                            action: function() {
                                console.log('🔧 Dialog dibatalkan');
                                // Dialog akan tertutup otomatis
                            }
                        },
                        {
                            text: "Ya, Hapus Data",
                            primary: true,
                            cssClass: "k-button-solid-error",
                            action: function() {
                                console.log('🔧 Konfirmasi hapus diterima, memproses...');
                                
                                // Tampilkan loading dialog
                                const loadingDialog = $("<div>")
                                    .append(`
                                        <div style="padding: 20px; text-align: center;">
                                            <div style="margin-bottom: 15px;">
                                                <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #007bff;"></i>
                                            </div>
                                            <p style="color: #333; margin: 0;">Sedang menghapus data mahasiswa...</p>
                                        </div>
                                    `)
                                    .kendoDialog({
                                        width: "300px",
                                        title: "Menghapus Data",
                                        closable: false,
                                        modal: true
                                    });
                                
                                loadingDialog.data("kendoDialog").open();
                                
                                // Lakukan penghapusan dengan AJAX
                                $.ajax({
                                    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA) + "/" + dataItem.nim,
                                    type: "DELETE",
                                    dataType: "json",
                                    success: function(response) {
                                        console.log("Delete berhasil:", response);
                                        
                                        // Tutup loading dialog
                                        loadingDialog.data("kendoDialog").close();
                                        
                                        // Refresh grid
                                        var grid = $("#mahasiswaGrid").data("kendoGrid");
                                        grid.dataSource.read();
                                        
                                        showNotification(
                                            "Sukses",
                                            `Data mahasiswa ${dataItem.nama} (${dataItem.nim}) berhasil dihapus`,
                                            "success"
                                        );
                                    },
                                    error: function(xhr, status, error) {
                                        console.error("Delete gagal:", xhr, status, error);
                                        
                                        // Tutup loading dialog
                                        loadingDialog.data("kendoDialog").close();
                                        
                                        let errorMessage = "Gagal menghapus data mahasiswa";
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
                                    }
                                });
                            }
                        }
                    ]
                });
            
            // Buka dialog konfirmasi
            confirmDialog.data("kendoDialog").open();
            
            return false;
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
    console.log('🔧 initializeMahasiswaForm dipanggil...');
    
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di initializeMahasiswaForm');
        showNotification(
            "Error",
            "Konfigurasi aplikasi belum siap",
            "error"
        );
        return;
    }

    try {
        // Hapus form yang sudah ada jika ada
        const existingForm = $("#mahasiswaFormContent").data("kendoForm");
        if (existingForm) {
            console.log("Form sudah ada, menghapus yang lama...");
            existingForm.destroy();
        }

        $("#mahasiswaFormContent").kendoForm({
            orientation: "vertical",
            buttons: {
                submit: false,
                clear: false
            },
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
                    validation: { required: true },
                    editor: "TextBox",
                    editorOptions: {
                        placeholder: "Masukkan NIM (8-20 karakter)"
                    }
                },
                {
                    field: "nama",
                    label: "Nama Mahasiswa:",
                    validation: { required: true },
                    editor: "TextBox",
                    editorOptions: {
                        placeholder: "Masukkan nama mahasiswa (3-100 karakter)"
                    }
                },
                {
                    field: "program_studi",
                    label: "Program Studi:",
                    editor: "DropDownList",
                    editorOptions: {
                        dataSource: [],
                        dataTextField: "text",
                        dataValueField: "value",
                        placeholder: "Pilih program studi",
                        filter: "contains"
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
                        step: 0.01,
                        placeholder: "Masukkan IPK (0-4)"
                    },
                    validation: { required: true, min: 0, max: 4 }
                },
                {
                    field: "sks",
                    label: "SKS:",
                    editor: "NumericTextBox",
                    editorOptions: {
                        min: 0,
                        step: 1,
                        placeholder: "Masukkan SKS"
                    },
                    validation: { required: true, min: 0 }
                },
                {
                    field: "persen_dek",
                    label: "Persentase Nilai D/E/K (%):",
                    editor: "NumericTextBox",
                    editorOptions: {
                        format: "n2",
                        min: 0,
                        max: 100,
                        step: 0.01,
                        placeholder: "Masukkan persentase nilai D/E/K (0-100%)"
                    },
                    validation: { required: true, min: 0, max: 100 }
                }
            ]
        });
        
        console.log('✅ Form mahasiswa berhasil diinisialisasi');
        
        // Load program studi data untuk dropdown
        loadProgramStudiDataForForm();
        
        // Tambahkan event listener untuk form validation
        const form = $("#mahasiswaFormContent").data("kendoForm");
        if (form) {
            form.bind("validate", function(e) {
                console.log("Form validation event:", e);
            });
        }
        
    } catch (error) {
        console.error('❌ Error saat inisialisasi form mahasiswa:', error);
        showNotification(
            "Error",
            "Gagal menginisialisasi form mahasiswa: " + error.message,
            "error"
        );
    }
}

// Event handler untuk tombol Simpan manual
$("#submitMahasiswaBtn").click(function(e) {
    e.preventDefault();
    console.log("🔧 Tombol Simpan Mahasiswa diklik");
    
    // Ambil data dari form
    var form = $("#mahasiswaFormContent").data("kendoForm");
    if (form) {
        console.log("Form ditemukan, mengambil data...");
        
        // Gunakan method yang benar untuk mengambil data form
        var formData = {};
        
        try {
            // Method 1: Coba menggunakan form.data()
            if (typeof form.data === 'function') {
                formData = form.data();
                console.log("🔧 Menggunakan form.data():", formData);
            }
            // Method 2: Coba menggunakan form.getValues()
            else if (typeof form.getValues === 'function') {
                formData = form.getValues();
                console.log("🔧 Menggunakan form.getValues():", formData);
            }
            // Method 3: Ambil dari DOM elements
            else {
                var formElement = form.element;
                console.log("🔧 Form element:", formElement);
                
                // Ambil nilai dari setiap field
                formData.nim = formElement.find('[name="nim"]').val();
                formData.nama = formElement.find('[name="nama"]').val();
                formData.program_studi = formElement.find('[name="program_studi"]').val();
                formData.ipk = parseFloat(formElement.find('[name="ipk"]').val());
                formData.sks = parseInt(formElement.find('[name="sks"]').val());
                formData.persen_dek = parseFloat(formElement.find('[name="persen_dek"]').val());
                
                console.log("🔧 Menggunakan DOM elements:", formData);
            }
        } catch (error) {
            console.error("🔧 Error mengambil data form:", error);
            // Fallback: ambil dari DOM langsung
            formData.nim = $("#mahasiswaFormContent [name='nim']").val();
            formData.nama = $("#mahasiswaFormContent [name='nama']").val();
            formData.program_studi = $("#mahasiswaFormContent [name='program_studi']").val();
            formData.ipk = parseFloat($("#mahasiswaFormContent [name='ipk']").val());
            formData.sks = parseInt($("#mahasiswaFormContent [name='sks']").val());
            formData.persen_dek = parseFloat($("#mahasiswaFormContent [name='persen_dek']").val());
            
            console.log("🔧 Fallback DOM:", formData);
        }
        
        console.log("🔧 Form data:", formData);
        
        // Debug: cek apakah data valid
        console.log("🔧 Validasi data:");
        console.log("🔧 - NIM:", formData.nim, "Length:", formData.nim ? formData.nim.length : 0);
        console.log("🔧 - Nama:", formData.nama, "Length:", formData.nama ? formData.nama.length : 0);
        console.log("🔧 - Program Studi:", formData.program_studi);
        console.log("🔧 - IPK:", formData.ipk, "Type:", typeof formData.ipk);
        console.log("🔧 - SKS:", formData.sks, "Type:", typeof formData.sks);
        console.log("🔧 - Persen DEK:", formData.persen_dek, "Type:", typeof formData.persen_dek);
        
        // Validasi form data
        if (!formData.nim || !formData.nama || !formData.program_studi || 
            formData.ipk === undefined || formData.sks === undefined || formData.persen_dek === undefined) {
            console.log("🔧 ❌ Validasi gagal - ada field yang kosong");
            showNotification(
                "Error",
                "Semua field harus diisi",
                "error"
            );
            return;
        }
        
        console.log("🔧 ✅ Validasi dasar berhasil");
        
        // Validasi panjang field sesuai schema backend
        if (formData.nim.length < 8 || formData.nim.length > 20) {
            console.log("🔧 ❌ Validasi NIM gagal - panjang:", formData.nim.length);
            showNotification(
                "Error",
                "NIM harus 8-20 karakter",
                "error"
            );
            return;
        }
        
        if (formData.nama.length < 3 || formData.nama.length > 100) {
            console.log("🔧 ❌ Validasi Nama gagal - panjang:", formData.nama.length);
            showNotification(
                "Error",
                "Nama harus 3-100 karakter",
                "error"
            );
            return;
        }
        
        if (formData.ipk < 0 || formData.ipk > 4) {
            console.log("🔧 ❌ Validasi IPK gagal - nilai:", formData.ipk);
            showNotification(
                "Error",
                "IPK harus antara 0-4",
                "error"
            );
            return;
        }
        
        if (formData.sks < 0) {
            console.log("🔧 ❌ Validasi SKS gagal - nilai:", formData.sks);
            showNotification(
                "Error",
                "SKS harus lebih dari 0",
                "error"
            );
            return;
        }
        
        if (formData.persen_dek < 0 || formData.persen_dek > 100) {
            console.log("🔧 ❌ Validasi Persen DEK gagal - nilai:", formData.persen_dek);
            showNotification(
                "Error",
                "Persentase nilai D/E/K harus antara 0-100",
                "error"
            );
            return;
        }
        
        console.log("🔧 ✅ Semua validasi berhasil");
        
        // Cek apakah ini edit atau add baru
        const editId = form.element.data("editId");
        
        if (editId) {
            // Update existing data
            console.log("🔧 🔄 Update data mahasiswa dengan ID:", editId);
            
            // Tampilkan loading
            kendo.ui.progress($("#mahasiswaGrid"), true);
            
            $.ajax({
                url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA) + "/" + editId,
                type: "PUT",
                contentType: "application/json",
                data: JSON.stringify(formData),
                success: function(response) {
                    console.log("🔧 ✅ Update berhasil:", response);
                    kendo.ui.progress($("#mahasiswaGrid"), false);
                    hideMahasiswaForm();
                    showNotification(
                        "Sukses",
                        `Data mahasiswa ${formData.nama} (${formData.nim}) berhasil diupdate`,
                        "success"
                    );
                    // Refresh grid
                    $("#mahasiswaGrid").data("kendoGrid").dataSource.read();
                },
                error: function(xhr) {
                    console.error("🔧 ❌ Update gagal:", xhr);
                    kendo.ui.progress($("#mahasiswaGrid"), false);
                    let errorMessage = "Gagal mengupdate data mahasiswa";
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
                }
            });
        } else {
            // Add new data
            console.log("🔧 ➕ Tambah data mahasiswa baru");
            
            // Tampilkan loading
            kendo.ui.progress($("#mahasiswaGrid"), true);
            
            $.ajax({
                url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA),
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(formData),
                success: function(response) {
                    console.log("🔧 ✅ Tambah berhasil:", response);
                    kendo.ui.progress($("#mahasiswaGrid"), false);
                    hideMahasiswaForm();
                    showNotification(
                        "Sukses",
                        `Data mahasiswa ${formData.nama} (${formData.nim}) berhasil ditambahkan`,
                        "success"
                    );
                    // Refresh grid
                    $("#mahasiswaGrid").data("kendoGrid").dataSource.read();
                },
                error: function(xhr) {
                    console.error("🔧 ❌ Tambah gagal:", xhr);
                    kendo.ui.progress($("#mahasiswaGrid"), false);
                    let errorMessage = "Gagal menambahkan data mahasiswa";
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
                }
            });
        }
    } else {
        console.error("🔧 ❌ Form tidak ditemukan");
        showNotification(
            "Error",
            "Form tidak dapat dimuat",
            "error"
        );
    }
});

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
            // Tampilkan loading indicator
            kendo.ui.progress(grid.element, true);
            
            // Refresh data
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

// Fungsi untuk mengupdate total record info
function updateTotalRecordInfo(total, elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = `Total: ${total || 0} record`;
    }
}

// Fungsi untuk menampilkan form tambah mahasiswa
function showAddMahasiswaForm() {
    console.log('🔧 showAddMahasiswaForm dipanggil...');
    
    // Pastikan form sudah diinisialisasi
    let form = $("#mahasiswaFormContent").data("kendoForm");
    
    // Jika form belum diinisialisasi, coba inisialisasi ulang
    if (!form) {
        console.log("Form belum diinisialisasi, mencoba inisialisasi ulang...");
        try {
            initializeMahasiswaForm();
            form = $("#mahasiswaFormContent").data("kendoForm");
        } catch (error) {
            console.error("Gagal menginisialisasi form:", error);
            showNotification(
                "Error",
                "Gagal memuat form mahasiswa",
                "error"
            );
            return;
        }
    }
    
    if (form) {
        console.log('🔧 Form ditemukan, resetting data...');
        // Reset form data
        form.setOptions({
            formData: {
                nim: "",
                nama: "",
                program_studi: "",
                ipk: 0.00,
                sks: 0,
                persen_dek: 0
            }
        });
        
        // Hapus edit ID jika ada
        form.element.removeData("editId");
    } else {
        console.error('❌ Form tidak ditemukan setelah inisialisasi');
    }
    
    // Update judul form
    $("#mahasiswaFormTitle").html('<i class="fas fa-plus"></i> Tambah Data Mahasiswa');
    
    // Tampilkan form dengan animasi
    $("#mahasiswaForm").slideDown(300);
    console.log('🔧 Form ditampilkan dengan animasi');
    
    // Load data program studi setelah form ditampilkan
    setTimeout(() => {
        loadProgramStudiDataForForm();
    }, 400);
    
    // Fallback: pastikan form benar-benar ditampilkan
    setTimeout(() => {
        const formElement = document.getElementById('mahasiswaForm');
        if (formElement) {
            const computedStyle = window.getComputedStyle(formElement);
            console.log('🔧 Form display style:', computedStyle.display);
            console.log('🔧 Form visibility style:', computedStyle.visibility);
            console.log('🔧 Form opacity style:', computedStyle.opacity);
            
            if (computedStyle.display === 'none') {
                console.log('🔧 Form masih tersembunyi, menampilkan secara manual...');
                formElement.style.display = 'block';
            }
        } else {
            console.error('❌ Form element tidak ditemukan');
        }
    }, 350);
}

// Fungsi untuk menampilkan form edit mahasiswa
function showEditMahasiswaForm(dataItem) {
    console.log('🔧 showEditMahasiswaForm dipanggil...');
    console.log("showEditMahasiswaForm called with dataItem:", dataItem);
    
    // Validasi data item
    if (!dataItem) {
        console.error("Data item tidak valid:", dataItem);
        showNotification(
            "Error",
            "Data mahasiswa tidak valid untuk diedit",
            "error"
        );
        return;
    }
    
    // Validasi field yang diperlukan
    if (!dataItem.nim || !dataItem.nama || !dataItem.program_studi) {
        console.error("Data item tidak lengkap:", dataItem);
        showNotification(
            "Error",
            "Data mahasiswa tidak lengkap untuk diedit",
            "error"
        );
        return;
    }
    
    console.log("Data item valid untuk edit:", {
        nim: dataItem.nim,
        nama: dataItem.nama,
        program_studi: dataItem.program_studi,
        ipk: dataItem.ipk,
        sks: dataItem.sks,
        persen_dek: dataItem.persen_dek
    });
    
    // Pastikan form sudah diinisialisasi
    let form = $("#mahasiswaFormContent").data("kendoForm");
    
    // Jika form belum diinisialisasi, coba inisialisasi ulang
    if (!form) {
        console.log("Form belum diinisialisasi, mencoba inisialisasi ulang...");
        try {
            initializeMahasiswaForm();
            form = $("#mahasiswaFormContent").data("kendoForm");
        } catch (error) {
            console.error("Gagal menginisialisasi form:", error);
            showNotification(
                "Error",
                "Gagal memuat form mahasiswa",
                "error"
            );
            return;
        }
    }
    
    if (form) {
        console.log("Form ditemukan, mengisi data...");
        
        // Persiapkan data untuk form dengan validasi
        const formData = {
            nim: dataItem.nim || "",
            nama: dataItem.nama || "",
            program_studi: dataItem.program_studi || "",
            ipk: parseFloat(dataItem.ipk) || 0.00,
            sks: parseInt(dataItem.sks) || 0,
            persen_dek: parseFloat(dataItem.persen_dek) || 0
        };
        
        console.log("Form data yang akan diset:", formData);
        
        // Set form data dengan data yang akan diedit
        try {
            form.setOptions({
                formData: formData
            });
            
            // Simpan NIM data untuk update
            form.element.data("editId", dataItem.nim);
            
            console.log("Form data berhasil diset");
        } catch (error) {
            console.error("Error setting form data:", error);
            showNotification(
                "Error",
                "Gagal mengisi data form",
                "error"
            );
            return;
        }
    } else {
        console.error('❌ Form tidak ditemukan setelah inisialisasi');
        showNotification(
            "Error",
            "Form tidak dapat dimuat",
            "error"
        );
        return;
    }
    
    // Update judul form
    $("#mahasiswaFormTitle").html(`<i class="fas fa-edit"></i> Edit Data Mahasiswa - ${dataItem.nama} (${dataItem.nim})`);
    
    // Tampilkan form dengan animasi
    $("#mahasiswaForm").slideDown(300);
    
    console.log('🔧 Form edit ditampilkan dengan animasi');
    
    // Load data program studi setelah form ditampilkan
    setTimeout(() => {
        loadProgramStudiDataForForm(dataItem);
    }, 400);
    
    // Fallback: pastikan form benar-benar ditampilkan
    setTimeout(() => {
        const formElement = document.getElementById('mahasiswaForm');
        if (formElement) {
            const computedStyle = window.getComputedStyle(formElement);
            console.log('🔧 Form display style:', computedStyle.display);
            
            if (computedStyle.display === 'none') {
                console.log('🔧 Form masih tersembunyi, menampilkan secara manual...');
                formElement.style.display = 'block';
            }
        } else {
            console.error('❌ Form element tidak ditemukan');
        }
    }, 350);
}

// Fungsi untuk menyembunyikan form mahasiswa
function hideMahasiswaForm() {
    console.log('🔧 hideMahasiswaForm dipanggil...');
    $("#mahasiswaForm").slideUp(300);
} 

// Fungsi untuk memuat data program studi dari API
function loadProgramStudiData() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `${CONFIG.API_BASE_URL}/api/program-studi/`,
            method: 'GET',
            success: function(data) {
                console.log('✅ Data program studi berhasil dimuat:', data.length, 'items');
                resolve(data);
            },
            error: function(xhr, status, error) {
                console.error('❌ Error memuat data program studi:', error);
                reject(error);
            }
        });
    });
}

// Fungsi untuk mengupdate dropdown program studi
function updateProgramStudiDropdown(programStudiData) {
    try {
        // Konversi data untuk dropdown
        const dropdownData = programStudiData.map(item => ({
            text: `${item.program_studi} (${item.jenjang})`,
            value: item.program_studi
        }));
        
        console.log('✅ Dropdown program studi diupdate dengan', dropdownData.length, 'items');
        return dropdownData;
    } catch (error) {
        console.error('❌ Error mengupdate dropdown program studi:', error);
        return [];
    }
}

// Fungsi untuk memuat data program studi ke dropdown form
function loadProgramStudiDataForForm(editData = null) {
    console.log('🔧 Memuat data program studi untuk dropdown form...');
    if (editData) {
        console.log('🔧 Mode edit dengan data:', editData.program_studi);
    }
    
    // Cek apakah CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia');
        return;
    }
    
    console.log('🔧 API URL:', `${CONFIG.API_BASE_URL}/api/program-studi/`);
    
    $.ajax({
        url: `${CONFIG.API_BASE_URL}/api/program-studi/`,
        method: 'GET',
        success: function(data) {
            console.log('✅ Data program studi berhasil dimuat:', data.length, 'items');
            console.log('🔧 Sample data:', data.slice(0, 3));
            
            // Transform data untuk dropdown
            const dropdownData = data.map(item => ({
                text: `${item.program_studi} (${item.jenjang})`,
                value: item.program_studi
            }));
            
            console.log('🔧 Dropdown data sample:', dropdownData.slice(0, 3));
            
            // Update dropdown di form dengan retry mechanism
            updateDropdownWithRetry(dropdownData, 0, editData);
        },
        error: function(xhr, status, error) {
            console.error('❌ Error memuat data program studi:', error);
            console.error('❌ Status:', status);
            console.error('❌ Response:', xhr.responseText);
            showNotification(
                "Error",
                "Gagal memuat data program studi: " + error,
                "error"
            );
        }
    });
}

// Fungsi untuk update dropdown dengan retry mechanism
function updateDropdownWithRetry(dropdownData, attempt, editData = null) {
    const maxAttempts = 5;
    const delay = 200; // 200ms delay between attempts
    
    console.log(`🔧 Attempt ${attempt + 1} to update dropdown...`);
    
    // Update dropdown di form
    const form = $("#mahasiswaFormContent").data("kendoForm");
    if (form) {
        console.log('✅ Form ditemukan');
        
        // Coba beberapa cara untuk menemukan dropdown
        let programStudiField = null;
        
        // Method 1: Cari dengan name attribute
        programStudiField = form.element.find('[name="program_studi"]').data("kendoDropDownList");
        
        // Method 2: Cari dengan class k-dropdown
        if (!programStudiField) {
            programStudiField = form.element.find('.k-dropdown').data("kendoDropDownList");
        }
        
        // Method 3: Cari semua dropdown dan ambil yang pertama
        if (!programStudiField) {
            const dropdowns = form.element.find('[data-role="dropdownlist"]');
            if (dropdowns.length > 0) {
                programStudiField = dropdowns.first().data("kendoDropDownList");
            }
        }
        
        if (programStudiField) {
            console.log('✅ Dropdown program studi ditemukan');
            programStudiField.setDataSource(dropdownData);
            console.log('✅ Dropdown program studi berhasil diupdate dengan', dropdownData.length, 'items');
            
            // Jika ada data edit, set nilai yang sesuai
            if (editData && editData.program_studi) {
                console.log('🔧 Setting dropdown value untuk edit:', editData.program_studi);
                
                // Tunggu sebentar agar dropdown sudah terupdate
                setTimeout(() => {
                    try {
                        programStudiField.value(editData.program_studi);
                        console.log('✅ Dropdown value berhasil diset ke:', editData.program_studi);
                    } catch (error) {
                        console.warn('⚠️ Gagal set dropdown value:', error);
                    }
                }, 100);
            }
        } else {
            console.warn(`⚠️ Dropdown program studi tidak ditemukan (attempt ${attempt + 1})`);
            
            // Retry jika belum mencapai max attempts
            if (attempt < maxAttempts - 1) {
                setTimeout(() => {
                    updateDropdownWithRetry(dropdownData, attempt + 1, editData);
                }, delay);
            } else {
                console.error('❌ Gagal menemukan dropdown setelah', maxAttempts, 'attempts');
                showNotification(
                    "Warning",
                    "Dropdown program studi tidak dapat diupdate",
                    "warning"
                );
            }
        }
    } else {
        console.warn(`⚠️ Form tidak ditemukan (attempt ${attempt + 1})`);
        
        // Retry jika belum mencapai max attempts
        if (attempt < maxAttempts - 1) {
            setTimeout(() => {
                updateDropdownWithRetry(dropdownData, attempt + 1, editData);
            }, delay);
        } else {
            console.error('❌ Form tidak ditemukan setelah', maxAttempts, 'attempts');
        }
    }
}