// Fungsi untuk menunggu CONFIG tersedia
function waitForConfig() {
    return new Promise((resolve, reject) => {
        if (typeof CONFIG !== 'undefined') {
            console.log('✅ CONFIG sudah tersedia di nilai.js');
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
                console.log('✅ CONFIG berhasil dimuat di nilai.js');
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkConfig);
                console.error('❌ CONFIG tidak dapat dimuat dalam waktu yang ditentukan');
                reject(new Error('CONFIG timeout'));
            }
        }, 100);
    });
}

// Inisialisasi Grid Nilai
$(document).ready(function() {
    // Tunggu sampai CONFIG tersedia
    waitForConfig().then(() => {
        initializeNilaiGrid();
        initializeNilaiForm();
    }).catch(error => {
        console.error('Failed to initialize nilai components:', error);
    });
});

function initializeNilaiGrid() {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di initializeNilaiGrid');
        showNotification(
            "Error",
            "Konfigurasi aplikasi belum siap",
            "error"
        );
        return;
    }

    $("#nilaiGrid").kendoGrid({
        dataSource: {
            transport: {
                read: {
                    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.NILAI),
                    dataType: "json",
                    contentType: "application/json"
                },
                create: {
                    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.NILAI),
                    method: "POST",
                    dataType: "json",
                    contentType: "application/json"
                },
                update: {
                    url: function(data) {
                        return CONFIG.getApiUrl(CONFIG.ENDPOINTS.NILAI) + "/" + data.id;
                    },
                    method: "PUT",
                    dataType: "json",
                    contentType: "application/json"
                },
                destroy: {
                    url: function(data) {
                        return CONFIG.getApiUrl(CONFIG.ENDPOINTS.NILAI) + "/" + data.id;
                    },
                    method: "DELETE",
                    dataType: "json",
                    contentType: "application/json"
                },
                parameterMap: function(data, type) {
                    if (type === "read") {
                        console.log("Read Parameters:", data);
                        return {
                            skip: data.skip || 0,
                            take: data.take || 10,
                            sort: data.sort ? data.sort[0].field + "-" + data.sort[0].dir : undefined
                        };
                    }
                    return JSON.stringify(data);
                }
            },
            schema: {
                model: {
                    id: "id",
                    fields: {
                        id: { type: "number", editable: false },
                        nim: { type: "string", validation: { required: true } },
                        tahun: { type: "number", validation: { required: true, min: 2000, max: 2100 } },
                        semester: { type: "number", validation: { required: true, min: 1, max: 8 } },
                        kode_matakuliah: { type: "string", validation: { required: true } },
                        nama_matakuliah: { type: "string", validation: { required: true } },
                        nilai: { type: "string", validation: { required: true } }
                    }
                },
                data: "data",
                total: "total"
            },
            serverPaging: true,
            serverSorting: true,
            pageSize: 10,
            error: function(e) {
                console.error("Grid Error:", e);
                let errorMessage = "Terjadi kesalahan";
                if (e.xhr) {
                    console.error("XHR Status:", e.xhr.status);
                    console.error("XHR Response:", e.xhr.responseText);
                    if (e.xhr.responseJSON && e.xhr.responseJSON.detail) {
                        errorMessage = e.xhr.responseJSON.detail;
                    } else if (e.xhr.statusText) {
                        errorMessage = e.xhr.statusText;
                    }
                }
                showNotification(
                    "Error",
                    errorMessage,
                    "error"
                );
            }
        },
        height: 550,
        pageable: {
            refresh: true,
            pageSizes: [10, 25, 50, 100],
            buttonCount: 5
        },
        sortable: true,
        filterable: true,
        toolbar: [
            { 
                name: "create", 
                text: "Tambah Nilai",
                template: '<button class="k-button k-button-md k-rounded-md k-button-solid custom-button-sync"><i class="fas fa-plus"></i> <span class="k-button-text">Tambah Nilai</span></button>'
            },
            { 
                name: "excel", 
                text: "Export Excel",
                template: '<button class="k-button k-button-md k-rounded-md k-button-solid custom-button-fis"><i class="fas fa-file-excel"></i> <span class="k-button-text">Excel</span></button>'
            },
            { 
                name: "pdf", 
                text: "Export PDF",
                template: '<button class="k-button k-button-md k-rounded-md k-button-solid custom-button-saw"><i class="fas fa-file-pdf"></i> <span class="k-button-text">PDF</span></button>'
            }
        ],
        columns: [
            { field: "nim", title: "NIM", width: "120px" },
            { field: "tahun", title: "Tahun", width: "100px" },
            { field: "semester", title: "Semester", width: "100px" },
            { field: "kode_matakuliah", title: "Kode MK", width: "120px" },
            { field: "nama_matakuliah", title: "Nama Matakuliah", width: "250px" },
            { 
                field: "nilai", 
                title: "Nilai", 
                width: "100px",
                editor: function(container, options) {
                    $('<input required name="' + options.field + '"/>')
                        .appendTo(container)
                        .kendoDropDownList({
                            dataSource: ["A", "B", "C", "D"],
                            optionLabel: "Pilih Nilai"
                        });
                }
            },
            { 
                command: [
                    { 
                        name: "edit", 
                        text: "Edit",
                        template: '<a class="k-button k-button-md k-rounded-md k-button-solid custom-button-edit" href="\\#"><i class="fas fa-edit"></i> <span class="k-button-text">Edit</span></a>'
                    },
                    { 
                        name: "destroy", 
                        text: "Hapus",
                        template: '<a class="k-button k-button-md k-rounded-md k-button-solid custom-button-delete" href="\\#"><i class="fas fa-trash"></i> <span class="k-button-text">Hapus</span></a>'
                    }
                ], 
                title: "Aksi", 
                width: "280px",
                headerAttributes: {
                    style: "text-align: center; vertical-align: middle; font-weight: bold;"
                },
                attributes: {
                    style: "text-align: center;"
                }
            }
        ],
        editable: "popup",
        edit: function(e) {
            if (!e.model.isNew()) {
                e.container.find("input[name='nim']").attr("readonly", true);
            }
        },
        dataBound: function(e) {
            console.log("Grid Data Bound:", e);
            const grid = e.sender;
            const data = grid.dataSource.data();
            console.log("Total Records:", data.length);
            console.log("First Record:", data[0]);
            console.log("DataSource Total:", grid.dataSource.total());
            
            // Update total record info
            updateTotalRecordInfo(grid.dataSource.total(), "totalRecordTextNilai");
            
            showNotification(
                "Sukses",
                "Data nilai berhasil dimuat",
                "success"
            );
        },
        remove: function(e) {
            showNotification(
                "Sukses",
                "Data nilai berhasil dihapus",
                "success"
            );
        },
        save: function(e) {
            if (e.model.isNew()) {
                showNotification(
                    "Sukses",
                    "Data nilai berhasil ditambahkan",
                    "success"
                );
            } else {
                showNotification(
                    "Sukses",
                    "Data nilai berhasil diperbarui",
                    "success"
                );
            }
        }
    });
}

function initializeNilaiForm() {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di initializeNilaiForm');
        showNotification(
            "Error",
            "Konfigurasi aplikasi belum siap",
            "error"
        );
        return;
    }

    $("#nilaiForm").kendoForm({
        orientation: "vertical",
        formData: {
            nim: "",
            tahun: new Date().getFullYear(),
            semester: 1,
            kode_matakuliah: "",
            nama_matakuliah: "",
            nilai: ""
        },
        items: [
            {
                field: "nim",
                label: "NIM:",
                validation: { required: true }
            },
            {
                field: "tahun",
                label: "Tahun:",
                editor: "NumericTextBox",
                validation: { required: true, min: 2000, max: 2100 }
            },
            {
                field: "semester",
                label: "Semester:",
                editor: "NumericTextBox",
                validation: { required: true, min: 1, max: 8 }
            },
            {
                field: "kode_matakuliah",
                label: "Kode Matakuliah:",
                validation: { required: true }
            },
            {
                field: "nama_matakuliah",
                label: "Nama Matakuliah:",
                validation: { required: true }
            },
            {
                field: "nilai",
                label: "Nilai:",
                editor: "DropDownList",
                editorOptions: {
                    dataSource: ["A", "B", "C", "D"],
                    optionLabel: "Pilih Nilai"
                },
                validation: { required: true }
            }
        ],
        submit: function(e) {
            e.preventDefault();
            var formData = e.model;
            $.ajax({
                url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.NILAI),
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(formData),
                success: function(response) {
                    $("#nilaiGrid").data("kendoGrid").dataSource.read();
                    $("#nilaiForm").hide();
                    showNotification(
                        "Sukses",
                        "Data nilai berhasil disimpan",
                        "success"
                    );
                },
                error: function(xhr, status, error) {
                    let errorMessage = "Gagal menyimpan data nilai";
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
    });
}

// Event handler untuk tombol Tambah Nilai
$("#addNilaiBtn").click(function() {
    $("#nilaiForm").show();
}); 

// Fungsi untuk mengupdate total record info
function updateTotalRecordInfo(total, elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = `Total: ${total || 0} record`;
    }
} 