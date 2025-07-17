// Inisialisasi DataSource untuk Grid Mahasiswa
var mahasiswaDataSource = new kendo.data.DataSource({
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

// Inisialisasi Grid Mahasiswa
$(document).ready(function() {
    var grid = $("#mahasiswaGrid").kendoGrid({
        dataSource: mahasiswaDataSource,
        height: 550,
        toolbar: [
            { name: "create", text: "Tambah Mahasiswa" },
            { 
                name: "syncAll", 
                text: "Sync Semua Nilai",
                template: '<button class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary" onclick="syncAllNilai()"><i class="fas fa-sync-alt"></i> <span class="k-button-text">Sync Semua Nilai</span></button>'
            },
            {
                name: "batchKlasifikasi",
                text: "Klasifikasi Batch",
                template: '<button class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-success" onclick="showBatchKlasifikasi()"><i class="fas fa-tasks"></i> <span class="k-button-text">Klasifikasi Batch</span></button>'
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
                    { name: "edit", text: "Edit" },
                    { name: "destroy", text: "Hapus" },
                    { 
                        name: "syncNilai",
                        text: "Sync",
                        click: syncNilai,
                        template: '<a class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary" href="\\#" onclick="syncNilai(event, this);"><i class="fas fa-sync-alt"></i> <span class="k-button-text">Sync</span></a>'
                    },
                    { 
                        name: "klasifikasi",
                        text: "Klasifikasi",
                        click: showKlasifikasi,
                        template: '<a class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-success" href="\\#" onclick="showKlasifikasi(event, this);"><i class="fas fa-chart-line"></i> <span class="k-button-text">Klasifikasi</span></a>'
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
    var grid = $("#mahasiswaGrid").data("kendoGrid");
    
    // Tambahkan class spin ke icon
    $('.k-toolbar').find('.fa-sync-alt').addClass('fa-spin');
    
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

// Fungsi untuk menampilkan window klasifikasi
function showKlasifikasi(e, element) {
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
            // Buat window untuk menampilkan hasil klasifikasi
            var windowContent = `
                <div class="k-content k-window-content k-dialog-content">
                    <div style="margin-bottom: 20px;">
                        <h3>Hasil Klasifikasi Kelulusan</h3>
                        <p><strong>NIM:</strong> ${dataItem.nim}</p>
                        <p><strong>Nama:</strong> ${dataItem.nama}</p>
                        <p><strong>Program Studi:</strong> ${dataItem.program_studi}</p>
                    </div>
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
                </div>
            `;
            
            // Buat dan tampilkan window
            var dialogDiv = $("<div>").appendTo("body");
            dialogDiv.kendoDialog({
                width: "500px",
                title: "Klasifikasi Peluang Kelulusan",
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
                "Klasifikasi Berhasil",
                "Data klasifikasi berhasil diambil"
            );
        },
        error: function(xhr) {
            showNotification(
                "error",
                "Error",
                "Gagal mengambil data klasifikasi"
            );
        },
        complete: function() {
            // Hentikan animasi icon
            $(element).find('.fa-chart-line').removeClass('fa-spin');
        }
    });
} 

function showBatchKlasifikasi() {
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
}

function executeBatchKlasifikasi() {
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

    // Panggil API batch klasifikasi
    $.ajax({
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.BATCH_KLASIFIKASI),
        method: "POST",
        success: function(response) {
            loadingDialog.data("kendoDialog").close();
            showNotification(
                "Sukses",
                response.message || "Klasifikasi batch berhasil dilakukan",
                "success"
            );
            // Refresh grid untuk menampilkan hasil terbaru
            $("#mahasiswaGrid").data("kendoGrid").dataSource.read();
        },
        error: function(xhr, status, error) {
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