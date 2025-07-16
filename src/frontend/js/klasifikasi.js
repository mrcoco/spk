$(document).ready(function() {
    initializeKlasifikasiForm();
});

function initializeKlasifikasiForm() {
    $("#klasifikasiForm").kendoForm({
        orientation: "vertical",
        formData: {
            nim: "",
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
                label: "Total SKS:",
                editor: "NumericTextBox",
                editorOptions: {
                    min: 0,
                    step: 1
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
                    step: 0.01
                },
                validation: { required: true, min: 0, max: 100 }
            }
        ],
        submit: function(e) {
            e.preventDefault();
            var formData = e.model;
            
            // Tampilkan loading
            kendo.ui.progress($("#klasifikasiForm"), true);
            
            // Panggil API untuk klasifikasi
            $.ajax({
                url: `${CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY)}/${formData.nim}`,
                type: "GET",
                success: function(response) {
                    // Tampilkan hasil klasifikasi
                    var hasilContent = `
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
                    `;
                    
                    $("#hasilDetail").html(hasilContent);
                    $("#hasilKlasifikasi").show();
                    
                    // Tampilkan notifikasi sukses
                    showNotification(
                        "success",
                        "Klasifikasi Berhasil",
                        "Data klasifikasi berhasil diproses"
                    );
                },
                error: function(xhr) {
                    let errorMessage = "Gagal memproses klasifikasi";
                    if (xhr.responseJSON && xhr.responseJSON.detail) {
                        errorMessage = xhr.responseJSON.detail;
                    }
                    
                    showNotification(
                        "error",
                        "Error",
                        errorMessage
                    );
                    
                    // Sembunyikan hasil sebelumnya jika ada
                    $("#hasilKlasifikasi").hide();
                },
                complete: function() {
                    // Sembunyikan loading
                    kendo.ui.progress($("#klasifikasiForm"), false);
                }
            });
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
        }]
    }).data("kendoNotification");

    $("#notification").data("kendoNotification").show({
        title: title,
        message: message
    }, type);
} 