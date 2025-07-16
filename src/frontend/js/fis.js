// Inisialisasi komponen FIS saat dokumen siap
$(document).ready(function() {
    initializeFISComponents();
});

function initializeFISComponents() {
    initializeFISGrid();
    initializeMahasiswaDropdown();
    initializeButtons();
}

function initializeFISGrid() {
    $("#fisGrid").kendoGrid({
        dataSource: {
            transport: {
                read: {
                    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + "/results",
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
    $("#mahasiswaDropdown").kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA),
                    dataType: "json"
                }
            },
            schema: {
                data: "data"
            }
        },
        dataTextField: "nama",
        dataValueField: "nim",
        optionLabel: "Pilih Mahasiswa...",
        filter: "contains",
        virtual: {
            itemHeight: 26,
            valueMapper: function(options) {
                options.success([options.value]);
            }
        }
    });
}

function initializeButtons() {
    // Event handler untuk tombol klasifikasi single
    $("#btnKlasifikasi").click(function() {
        var dropdown = $("#mahasiswaDropdown").data("kendoDropDownList");
        var selectedNim = dropdown.value();
        
        if (!selectedNim) {
            showNotification(
                "warning",
                "Peringatan",
                "Silakan pilih mahasiswa terlebih dahulu"
            );
            return;
        }

        // Tampilkan loading
        kendo.ui.progress($("#fisSection"), true);

        // Panggil API untuk klasifikasi
        $.ajax({
            url: `${CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY)}/${selectedNim}`,
            type: "GET",
            success: function(response) {
                // Tampilkan hasil
                $("#hasilKlasifikasiFIS").show();
                $("#hasilDetailFIS").html(`
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
                `);

                // Refresh grid untuk menampilkan hasil terbaru
                $("#fisGrid").data("kendoGrid").dataSource.read();

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
        url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY) + "/batch-klasifikasi",
        type: "POST",
        contentType: "application/json",
        success: function(response) {
            // Refresh grid untuk menampilkan hasil terbaru
            $("#fisGrid").data("kendoGrid").dataSource.read();

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

// Fungsi untuk menampilkan notifikasi
function showNotification(type, title, message) {
    $("#notification").kendoNotification({
        position: {
            pinned: true,
            top: 30,
            right: 30
        },
        autoHideAfter: 5000,
        stacking: "down",
        templates: [{
            type: "success",
            template: $("#successTemplate").html()
        }, {
            type: "error",
            template: $("#errorTemplate").html()
        }, {
            type: "warning",
            template: $("#warningTemplate").html()
        }]
    }).data("kendoNotification");

    $("#notification").data("kendoNotification").show({
        title: title,
        message: message
    }, type);
} 