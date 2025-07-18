// Debug: Memastikan script nilai.js dimuat
console.log('🚀 nilai.js mulai dimuat...');

// Fallback untuk showNotification jika tidak tersedia
if (typeof showNotification === 'undefined') {
    console.warn('⚠️ showNotification tidak tersedia, menggunakan fallback');
    window.showNotification = function(title, message, type) {
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        // Fallback ke alert jika console tidak cukup
        if (type === 'error') {
            alert(`${title}: ${message}`);
        }
    };
}

// Fungsi untuk menunggu CONFIG tersedia
function waitForConfig() {
    console.log('⏳ waitForConfig dipanggil...');
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
            console.log(`🔄 Mencoba ke-${attempts}: CONFIG status = ${typeof CONFIG !== 'undefined'}`);
            
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
    console.log('📄 Document ready di nilai.js');
    console.log('🔍 jQuery status:', typeof $ !== 'undefined');
    console.log('🔍 Kendo status:', typeof kendo !== 'undefined');
    
    // Tunggu sampai CONFIG tersedia
    waitForConfig().then(() => {
        console.log('🎯 Mulai inisialisasi komponen nilai...');
        initializeNilaiGrid();
        initializeNilaiForm();
        console.log('✅ Inisialisasi komponen nilai selesai');
    }).catch(error => {
        console.error('❌ Failed to initialize nilai components:', error);
    });
});

function initializeNilaiGrid() {
    console.log('🔧 initializeNilaiGrid dipanggil...');
    
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

    console.log('🔧 CONFIG tersedia, membuat grid...');
    console.log('🔧 Endpoint NILAI:', CONFIG.getApiUrl(CONFIG.ENDPOINTS.NILAI));

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
                        nama_mahasiswa: { type: "string", editable: false },
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
        // sortable: true,
        // filterable: true,
        toolbar: [
            { 
                name: "create", 
                text: "Tambah Nilai",
                template: '<button class="k-button k-button-md k-rounded-md k-button-solid custom-button-sync" onclick="console.log(\'🔧 Button Tambah Nilai clicked via onclick\'); showAddNilaiForm();"><i class="fas fa-plus"></i> <span class="k-button-text">Tambah Nilai</span></button>'
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
            { field: "nama_mahasiswa", title: "Nama Mahasiswa", width: "200px" },
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
                            dataSource: ["A", "A-", "B+", "B", "B-", "C+", "C",  "D", "E", "K","TL"],
                            optionLabel: "Pilih Nilai"
                        });
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
        editable: false,
        edit: function(e) {
            console.log('🔧 Event edit di dalam grid dipanggil...');
            console.log("Edit button clicked", e);
            
            // Prevent default edit behavior
            e.preventDefault();
            e.stopPropagation();
            
            // Get the data item
            var dataItem = e.model;
            console.log("Data item for edit:", dataItem);
            
            // Call our custom edit function
            showEditNilaiForm(dataItem);
            
            return false;
        },
        dataBound: function(e) {
            console.log('🔧 Event dataBound di dalam grid dipanggil...');
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
            console.log('🔧 Event remove di dalam grid dipanggil...');
            // Prevent default remove behavior
            e.preventDefault();
            
            // Get the data item
            var dataItem = e.model;
            
            // Show confirmation dialog
            if (confirm("Apakah Anda yakin ingin menghapus data nilai ini?")) {
                // Call the destroy method manually
                var grid = $("#nilaiGrid").data("kendoGrid");
                grid.dataSource.remove(dataItem);
                grid.dataSource.sync();
                
                showNotification(
                    "Sukses",
                    "Data nilai berhasil dihapus",
                    "success"
                );
            }
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
    console.log('🔧 initializeNilaiForm dipanggil...');
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

    $("#nilaiFormContent").kendoForm({
        orientation: "vertical",
        buttons: {
            submit: false,
            clear: false
        },
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
                validation: { required: true, min: 1, max: 14 }
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
                    dataSource: ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E", "K", "TL"],
                    optionLabel: "Pilih Nilai"
                },
                validation: { required: true }
            }
        ]
    });
}

// Event handler untuk tombol Simpan manual
$("#submitNilaiBtn").click(function(e) {
    e.preventDefault();
    console.log("🔧 Tombol Simpan diklik");
    
    // Ambil data dari form
    var form = $("#nilaiFormContent").data("kendoForm");
    if (form) {
        // Gunakan method yang benar untuk mengambil data form
        var formData = {};
        
        // Coba beberapa method untuk mengambil data
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
                formData.tahun = parseInt(formElement.find('[name="tahun"]').val());
                formData.semester = parseInt(formElement.find('[name="semester"]').val());
                formData.kode_matakuliah = formElement.find('[name="kode_matakuliah"]').val();
                formData.nama_matakuliah = formElement.find('[name="nama_matakuliah"]').val();
                formData.nilai = formElement.find('[name="nilai"]').val();
                
                console.log("🔧 Menggunakan DOM elements:", formData);
            }
        } catch (error) {
            console.error("🔧 Error mengambil data form:", error);
            // Fallback: ambil dari DOM langsung
            formData.nim = $("#nilaiFormContent [name='nim']").val();
            formData.tahun = parseInt($("#nilaiFormContent [name='tahun']").val());
            formData.semester = parseInt($("#nilaiFormContent [name='semester']").val());
            formData.kode_matakuliah = $("#nilaiFormContent [name='kode_matakuliah']").val();
            formData.nama_matakuliah = $("#nilaiFormContent [name='nama_matakuliah']").val();
            formData.nilai = $("#nilaiFormContent [name='nilai']").val();
            
            console.log("🔧 Fallback DOM:", formData);
        }
        
        console.log("🔧 Form data:", formData);
        
        // Debug: cek apakah data valid
        console.log("🔧 Validasi data:");
        console.log("🔧 - NIM:", formData.nim, "Length:", formData.nim ? formData.nim.length : 0);
        console.log("🔧 - Tahun:", formData.tahun);
        console.log("🔧 - Semester:", formData.semester);
        console.log("🔧 - Kode Matakuliah:", formData.kode_matakuliah, "Length:", formData.kode_matakuliah ? formData.kode_matakuliah.length : 0);
        console.log("🔧 - Nama Matakuliah:", formData.nama_matakuliah, "Length:", formData.nama_matakuliah ? formData.nama_matakuliah.length : 0);
        console.log("🔧 - Nilai:", formData.nilai);
        
        // Validasi form data
        if (!formData.nim || !formData.tahun || !formData.semester || 
            !formData.kode_matakuliah || !formData.nama_matakuliah || !formData.nilai) {
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
        
        if (formData.kode_matakuliah.length < 3 || formData.kode_matakuliah.length > 20) {
            console.log("🔧 ❌ Validasi Kode Matakuliah gagal - panjang:", formData.kode_matakuliah.length);
            showNotification(
                "Error",
                "Kode Matakuliah harus 3-20 karakter",
                "error"
            );
            return;
        }
        
        if (formData.nama_matakuliah.length < 3 || formData.nama_matakuliah.length > 100) {
            console.log("🔧 ❌ Validasi Nama Matakuliah gagal - panjang:", formData.nama_matakuliah.length);
            showNotification(
                "Error",
                "Nama Matakuliah harus 3-100 karakter",
                "error"
            );
            return;
        }
        
        if (formData.tahun < 2000 || formData.tahun > 2100) {
            console.log("🔧 ❌ Validasi Tahun gagal - nilai:", formData.tahun);
            showNotification(
                "Error",
                "Tahun harus antara 2000-2100",
                "error"
            );
            return;
        }
        
        if (formData.semester < 1 || formData.semester > 14) {
            console.log("🔧 ❌ Validasi Semester gagal - nilai:", formData.semester);
            showNotification(
                "Error",
                "Semester harus antara 1-14",
                "error"
            );
            return;
        }
        
        console.log("🔧 ✅ Semua validasi berhasil");
        
        // Validasi NIM harus ada di database
        console.log("🔧 🔍 Memvalidasi NIM di database...");
        
        // Cek apakah NIM ada di database
        $.ajax({
            url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA) + "?nim=" + formData.nim,
            method: "GET",
            async: false, // Gunakan synchronous untuk validasi
            success: function(response) {
                if (response.data && response.data.length > 0) {
                    console.log("🔧 ✅ NIM ditemukan di database:", response.data[0]);
                } else {
                    console.log("🔧 ❌ NIM tidak ditemukan di database");
                    showNotification(
                        "Error",
                        "NIM tidak ditemukan di database. Pastikan mahasiswa sudah terdaftar.",
                        "error"
                    );
                    return false;
                }
            },
            error: function(xhr, status, error) {
                console.error("🔧 ❌ Error validasi NIM:", error);
                showNotification(
                    "Error",
                    "Gagal memvalidasi NIM. Silakan coba lagi.",
                    "error"
                );
                return false;
            }
        });
        
        var editId = $("#nilaiFormContent").data("editId");
        console.log("🔧 Edit ID:", editId);
        
        // Tentukan URL dan method berdasarkan mode (create atau edit)
        var url = CONFIG.getApiUrl(CONFIG.ENDPOINTS.NILAI);
        var method = "POST";
        
        if (editId) {
            url += "/" + editId;
            method = "PUT";
        }
        
        console.log("🔧 Request URL:", url);
        console.log("🔧 Request method:", method);
        console.log("🔧 Request data:", JSON.stringify(formData));
        
        console.log("🔧 🚀 Memulai AJAX request...");
        
        $.ajax({
            url: url,
            method: method,
            contentType: "application/json",
            data: JSON.stringify(formData),
            beforeSend: function() {
                console.log("🔧 📤 AJAX request sedang dikirim...");
            },
            success: function(response) {
                console.log("🔧 ✅ Success response:", response);
                $("#nilaiGrid").data("kendoGrid").dataSource.read();
                hideNilaiForm();
                
                // Clear edit ID
                $("#nilaiFormContent").removeData("editId");
                
                var message = editId ? "Data nilai berhasil diperbarui" : "Data nilai berhasil disimpan";
                showNotification(
                    "Sukses",
                    message,
                    "success"
                );
            },
            error: function(xhr, status, error) {
                console.error("🔧 ❌ Error response:", xhr);
                console.error("🔧 ❌ Error status:", status);
                console.error("🔧 ❌ Error:", error);
                console.error("🔧 ❌ Response text:", xhr.responseText);
                console.error("🔧 ❌ Response JSON:", xhr.responseJSON);
                
                let errorMessage = editId ? "Gagal memperbarui data nilai" : "Gagal menyimpan data nilai";
                
                // Coba ambil detail error dari berbagai kemungkinan format
                if (xhr.responseJSON) {
                    if (xhr.responseJSON.detail) {
                        errorMessage += ": " + xhr.responseJSON.detail;
                    } else if (xhr.responseJSON.message) {
                        errorMessage += ": " + xhr.responseJSON.message;
                    } else if (Array.isArray(xhr.responseJSON)) {
                        errorMessage += ": " + xhr.responseJSON.join(", ");
                    } else {
                        errorMessage += ": " + JSON.stringify(xhr.responseJSON);
                    }
                } else if (xhr.responseText) {
                    errorMessage += ": " + xhr.responseText;
                }
                
                showNotification(
                    "Error",
                    errorMessage,
                    "error"
                );
            }
        });
        
        console.log("🔧 ✅ AJAX request telah dikirim");
    } else {
        console.error("❌ Form tidak ditemukan");
        showNotification(
            "Error",
            "Form tidak ditemukan",
            "error"
        );
    }
});

// Event handler untuk tombol Tambah Nilai
$("#addNilaiBtn").click(function() {
    console.log('🔧 Button addNilaiBtn clicked via jQuery handler');
    $("#nilaiForm").show();
}); 

// Fungsi untuk menampilkan form tambah nilai
function showAddNilaiForm() {
    console.log('🔧 showAddNilaiForm dipanggil...');
    console.log('🔧 showAddNilaiForm dipanggil dari:', new Error().stack);
    
    // Pastikan form sudah diinisialisasi
    let form = $("#nilaiFormContent").data("kendoForm");
    
    // Jika form belum diinisialisasi, coba inisialisasi ulang
    if (!form) {
        console.log("Form belum diinisialisasi, mencoba inisialisasi ulang...");
        try {
            initializeNilaiForm();
            form = $("#nilaiFormContent").data("kendoForm");
        } catch (error) {
            console.error("Gagal menginisialisasi form:", error);
            showNotification(
                "Error",
                "Gagal memuat form nilai",
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
                tahun: new Date().getFullYear(),
                semester: 1,
                kode_matakuliah: "",
                nama_matakuliah: "",
                nilai: ""
            }
        });
    } else {
        console.error('❌ Form tidak ditemukan setelah inisialisasi');
    }
    
    // Update judul form
    $("#nilaiFormTitle").html('<i class="fas fa-plus"></i> Tambah Data Nilai');
    
    // Tampilkan form dengan animasi
    $("#nilaiForm").slideDown(300);
    console.log('🔧 Form ditampilkan dengan animasi');
    
    // Fallback: pastikan form benar-benar ditampilkan
    setTimeout(() => {
        const formElement = document.getElementById('nilaiForm');
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

// Fungsi untuk menampilkan form edit nilai
function showEditNilaiForm(dataItem) {
    console.log('🔧 showEditNilaiForm dipanggil...');
    console.log("showEditNilaiForm called with dataItem:", dataItem);
    
    // Pastikan form sudah diinisialisasi
    let form = $("#nilaiFormContent").data("kendoForm");
    
    // Jika form belum diinisialisasi, coba inisialisasi ulang
    if (!form) {
        console.log("Form belum diinisialisasi, mencoba inisialisasi ulang...");
        try {
            initializeNilaiForm();
            form = $("#nilaiFormContent").data("kendoForm");
        } catch (error) {
            console.error("Gagal menginisialisasi form:", error);
            showNotification(
                "Error",
                "Gagal memuat form nilai",
                "error"
            );
            return;
        }
    }
    
    if (form) {
        // Set form data dengan data yang akan diedit
        form.setOptions({
            formData: {
                nim: dataItem.nim,
                tahun: dataItem.tahun,
                semester: dataItem.semester,
                kode_matakuliah: dataItem.kode_matakuliah,
                nama_matakuliah: dataItem.nama_matakuliah,
                nilai: dataItem.nilai
            }
        });
        
        // Simpan ID data untuk update
        form.element.data("editId", dataItem.id);
    }
    
    // Update judul form
    $("#nilaiFormTitle").html('<i class="fas fa-edit"></i> Edit Data Nilai');
    
    // Tampilkan form dengan animasi
    $("#nilaiForm").slideDown(300);
}

// Fungsi untuk menyembunyikan form nilai
function hideNilaiForm() {
    console.log('🔧 hideNilaiForm dipanggil...');
    $("#nilaiForm").slideUp(300);
}

// Fungsi untuk mengupdate total record info
function updateTotalRecordInfo(total, elementId) {
    console.log('🔧 updateTotalRecordInfo dipanggil...');
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = `Total: ${total || 0} record`;
    }
}

// Fungsi untuk mencari mahasiswa berdasarkan nama
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

// Fungsi untuk mencari nilai berdasarkan NIM
function searchNilaiByNIM(nims) {
    return new Promise((resolve, reject) => {
        if (nims.length === 0) {
            resolve([]);
            return;
        }
        
        console.log('🔧 Mencari nilai untuk NIMs:', nims);
        
        // Buat filter untuk multiple NIMs
        const nimFilters = nims.map(nim => `nim=${encodeURIComponent(nim)}`).join('&');
        const url = CONFIG.getApiUrl(CONFIG.ENDPOINTS.NILAI) + "?" + nimFilters;
        
        $.ajax({
            url: url,
            method: "GET",
            success: function(response) {
                console.log('🔧 Hasil pencarian nilai:', response);
                resolve(response.data || []);
            },
            error: function(xhr, status, error) {
                console.error('🔧 Error mencari nilai:', error);
                reject(error);
            }
        });
    });
}

// Fungsi untuk melakukan pencarian nilai berdasarkan NIM tunggal
async function performNilaiSearchByNIM(nim) {
    console.log('🔧 performNilaiSearchByNIM dipanggil dengan NIM:', nim);
    
    if (!nim) {
        console.log('🔧 NIM kosong, tampilkan semua data');
        $("#nilaiGrid").data("kendoGrid").dataSource.read();
        return;
    }
    
    try {
        // Tampilkan loading
        showNotification(
            "Info",
            "Sedang mencari data nilai...",
            "info"
        );
        
        // Cari nilai berdasarkan NIM
        const nilaiData = await searchNilaiByNIM([nim]);
        
        if (nilaiData.length === 0) {
            showNotification(
                "Info",
                "Tidak ada nilai ditemukan untuk mahasiswa tersebut",
                "info"
            );
            return;
        }
        
        // Update grid dengan data hasil pencarian
        const grid = $("#nilaiGrid").data("kendoGrid");
        grid.dataSource.data(nilaiData);
        
        // Update total record info
        updateTotalRecordInfo(nilaiData.length, "totalRecordTextNilai");
        
        showNotification(
            "Sukses",
            `Ditemukan ${nilaiData.length} data nilai untuk NIM ${nim}`,
            "success"
        );
        
    } catch (error) {
        console.error('🔧 Error dalam pencarian:', error);
        showNotification(
            "Error",
            "Terjadi kesalahan saat mencari data",
            "error"
        );
    }
}

// Fungsi untuk melakukan pencarian nilai (untuk backward compatibility)
async function performNilaiSearch() {
    console.log('🔧 performNilaiSearch dipanggil');
    
    const searchInput = $("#searchInputNilai").val().trim();
    
    if (!searchInput) {
        console.log('🔧 Input pencarian kosong, tampilkan semua data');
        $("#nilaiGrid").data("kendoGrid").dataSource.read();
        updateSearchInfo("Menampilkan semua data nilai", "info");
        return;
    }
    
    console.log('🔧 Memulai pencarian nilai untuk:', searchInput);
    
    try {
        // Tampilkan loading
        updateSearchInfo("Sedang mencari data nilai...", "info");
        
        // Cari mahasiswa berdasarkan nama atau NIM
        const nims = await searchMahasiswaByName(searchInput);
        
        if (nims.length === 0) {
            updateSearchInfo("Tidak ada mahasiswa ditemukan dengan kriteria tersebut", "warning");
            return;
        }
        
        // Cari nilai berdasarkan NIM
        const nilaiData = await searchNilaiByNIM(nims);
        
        if (nilaiData.length === 0) {
            updateSearchInfo("Tidak ada nilai ditemukan untuk mahasiswa tersebut", "warning");
            return;
        }
        
        // Update grid dengan data hasil pencarian
        const grid = $("#nilaiGrid").data("kendoGrid");
        grid.dataSource.data(nilaiData);
        
        // Update total record info
        updateTotalRecordInfo(nilaiData.length, "totalRecordTextNilai");
        
        updateSearchInfo(`Ditemukan ${nilaiData.length} data nilai untuk "${searchInput}"`, "success");
        
    } catch (error) {
        console.error('🔧 Error dalam pencarian:', error);
        updateSearchInfo("Terjadi kesalahan saat mencari data", "error");
    }
}

// Fungsi untuk clear pencarian
function clearNilaiSearch() {
    $("#searchInputNilai").val("");
    $("#nilaiGrid").data("kendoGrid").dataSource.read();
    updateSearchInfo("Pencarian telah dibersihkan", "info");
}

// Fungsi untuk update search info
function updateSearchInfo(message, type) {
    const searchInfo = $("#searchInfoNilai");
    const searchResultText = $("#searchResultTextNilai");
    
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

// Event handler untuk button edit dan delete yang lebih robust
$(document).ready(function() {
    console.log('📄 Event handler button edit dan delete di nilai.js');
    
    // Event handler untuk button edit
    $(document).on('click', '#nilaiGrid .custom-button-edit', function(e) {
        console.log('🔍 Event handler button edit dijalankan...');
        e.preventDefault();
        e.stopPropagation();
        
        // Get the row data
        var grid = $("#nilaiGrid").data("kendoGrid");
        var row = $(this).closest("tr");
        var dataItem = grid.dataItem(row);
        
        console.log("Edit button clicked via direct handler", dataItem);
        
        if (dataItem) {
            showEditNilaiForm(dataItem);
        }
        
        return false;
    });
    
    // Event handler untuk button delete
    $(document).on('click', '#nilaiGrid .custom-button-delete', function(e) {
        console.log('🔍 Event handler button delete dijalankan...');
        e.preventDefault();
        e.stopPropagation();
        
        // Get the row data
        var grid = $("#nilaiGrid").data("kendoGrid");
        var row = $(this).closest("tr");
        var dataItem = grid.dataItem(row);
        
        console.log("Delete button clicked via direct handler", dataItem);
        
        if (dataItem) {
            if (confirm("Apakah Anda yakin ingin menghapus data nilai ini?")) {
                // Perform delete
                $.ajax({
                    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.NILAI) + "/" + dataItem.id,
                    method: "DELETE",
                    success: function(response) {
                        console.log("Delete successful:", response);
                        grid.dataSource.read();
                        showNotification(
                            "Sukses",
                            "Data nilai berhasil dihapus",
                            "success"
                        );
                    },
                    error: function(xhr, status, error) {
                        console.error("Delete failed:", error);
                        showNotification(
                            "Error",
                            "Gagal menghapus data nilai",
                            "error"
                        );
                    }
                });
            }
        }
        
        return false;
    });
    
    // Event handler untuk tombol pencarian nilai
    $("#btnSearchNilai").click(function() {
        console.log('🔍 Tombol pencarian nilai diklik');
        performNilaiSearch();
    });
    
    // Event handler untuk tombol clear pencarian nilai
    $("#btnClearSearchNilai").click(function() {
        console.log('🔍 Tombol clear pencarian nilai diklik');
        clearNilaiSearch();
    });
    
    // Event handler untuk input pencarian nilai
    $("#searchInputNilai").on('input', function() {
        const searchTerm = $(this).val().trim();
        if (searchTerm.length >= 3) {
            // Auto search setelah 3 karakter
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(function() {
                performNilaiSearch();
            }, 500);
        } else if (searchTerm.length === 0) {
            // Clear search jika input kosong
            clearNilaiSearch();
        }
    });
    
    // Event handler untuk enter key pada input pencarian nilai
    $("#searchInputNilai").keypress(function(e) {
        if (e.which === 13) { // Enter key
            console.log('🔍 Enter key ditekan pada input pencarian nilai');
            performNilaiSearch();
        }
    });
    
    // Focus pada input pencarian saat halaman dimuat
    $("#searchInputNilai").focus();
});

 