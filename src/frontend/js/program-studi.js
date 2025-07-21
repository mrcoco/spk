// Program Studi Management
let programStudiGrid;
let currentEditId = null;

// Initialize Program Studi
function initializeProgramStudi() {
    console.log('🚀 Initializing Program Studi...');
    initializeProgramStudiGrid();
    loadProgramStudiStatistics();
    setupProgramStudiEventListeners();
    console.log('✅ Program Studi initialized');
}

function initializeProgramStudiGrid() {
    programStudiGrid = $("#programStudiGrid").kendoGrid({
        dataSource: {
            transport: {
                read: {
                    url: `${CONFIG.API_BASE_URL}/api/program-studi/`,
                    dataType: "json"
                },
                create: {
                    url: `${CONFIG.API_BASE_URL}/api/program-studi/`,
                    type: "POST",
                    contentType: "application/json"
                },
                update: {
                    url: function(data) {
                        return `${CONFIG.API_BASE_URL}/api/program-studi/${data.id}`;
                    },
                    type: "PUT",
                    contentType: "application/json"
                },
                destroy: {
                    url: function(data) {
                        return `${CONFIG.API_BASE_URL}/api/program-studi/${data.id}`;
                    },
                    type: "DELETE"
                },
                parameterMap: function(data, type) {
                    if (type === "create" || type === "update") {
                        return JSON.stringify({
                            program_studi: data.program_studi,
                            jenjang: data.jenjang
                        });
                    }
                    return data;
                }
            },
            schema: {
                data: function(response) {
                    return response;
                },
                total: function(response) {
                    return response.length;
                },
                model: {
                    id: "id",
                    fields: {
                        id: { type: "number", editable: false },
                        program_studi: { type: "string", validation: { required: true } },
                        jenjang: { type: "string", validation: { required: true } },
                        created_at: { type: "date", editable: false },
                        updated_at: { type: "date", editable: false }
                    }
                }
            },
            pageSize: 20
        },
        height: 500,
        scrollable: true,
        sortable: true,
        filterable: true,
        pageable: {
            input: true,
            numeric: false,
            pageSizes: [10, 20, 50, 100]
        },
        columns: [
            {
                field: "id",
                title: "ID",
                width: 80,
                filterable: false
            },
            {
                field: "program_studi",
                title: "Program Studi",
                width: 300
            },
            {
                field: "jenjang",
                title: "Jenjang",
                width: 120,
                template: function(dataItem) {
                    const jenjangColors = {
                        'S1': 'badge bg-primary',
                        'S2': 'badge bg-success',
                        'S3': 'badge bg-warning',
                        'D3': 'badge bg-info',
                        'D4': 'badge bg-secondary'
                    };
                    const colorClass = jenjangColors[dataItem.jenjang] || 'badge bg-secondary';
                    return `<span class="${colorClass}">${dataItem.jenjang}</span>`;
                }
            },
            {
                field: "created_at",
                title: "Dibuat",
                width: 150,
                template: function(dataItem) {
                    return kendo.toString(new Date(dataItem.created_at), "dd/MM/yyyy HH:mm");
                },
                filterable: false
            },
            {
                field: "updated_at",
                title: "Diupdate",
                width: 150,
                template: function(dataItem) {
                    return kendo.toString(new Date(dataItem.updated_at), "dd/MM/yyyy HH:mm");
                },
                filterable: false
            },
            {
                title: "Aksi",
                width: 150,
                template: function(dataItem) {
                    return `
                        <button class="k-button k-button-solid k-button-solid-warning btn-sm" onclick="editProgramStudi(${dataItem.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="k-button k-button-solid k-button-solid-error btn-sm" onclick="deleteProgramStudi(${dataItem.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                },
                filterable: false,
                sortable: false
            }
        ]
    }).data("kendoGrid");
}

function setupProgramStudiEventListeners() {
    // Search functionality
    $("#searchProgramStudiInput").on("keyup", function() {
        const searchValue = $(this).val();
        const filter = {
            logic: "or",
            filters: [
                { field: "program_studi", operator: "contains", value: searchValue },
                { field: "jenjang", operator: "contains", value: searchValue }
            ]
        };
        programStudiGrid.dataSource.filter(filter);
    });
    
    // Jenjang filter
    $("#jenjangFilter").on("change", function() {
        const jenjangValue = $(this).val();
        if (jenjangValue) {
            programStudiGrid.dataSource.filter({ field: "jenjang", operator: "eq", value: jenjangValue });
        } else {
            programStudiGrid.dataSource.filter({});
        }
    });
    
    // Add button
    $("#addProgramStudiBtn").on("click", function() {
        showProgramStudiModal();
    });
}

function showProgramStudiModal(data = null) {
    currentEditId = data ? data.id : null;
    
    const modal = $(`
        <div class="modal fade" id="programStudiModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${data ? 'Edit Program Studi' : 'Tambah Program Studi'}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="programStudiForm">
                            <input type="hidden" id="programStudiId" value="${data ? data.id : ''}">
                            <div class="mb-3">
                                <label for="programStudi" class="form-label">Program Studi</label>
                                <input type="text" class="form-control" id="programStudi" value="${data ? data.program_studi : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label for="jenjang" class="form-label">Jenjang</label>
                                <select class="form-control" id="jenjang" required>
                                    <option value="">Pilih Jenjang</option>
                                    <option value="S1" ${data && data.jenjang === 'S1' ? 'selected' : ''}>S1</option>
                                    <option value="S2" ${data && data.jenjang === 'S2' ? 'selected' : ''}>S2</option>
                                    <option value="S3" ${data && data.jenjang === 'S3' ? 'selected' : ''}>S3</option>
                                    <option value="D3" ${data && data.jenjang === 'D3' ? 'selected' : ''}>D3</option>
                                    <option value="D4" ${data && data.jenjang === 'D4' ? 'selected' : ''}>D4</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-primary" onclick="saveProgramStudi()">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    // Remove existing modal if any
    $("#programStudiModal").remove();
    
    // Add new modal to body
    $("body").append(modal);
    
    // Show modal
    const bootstrapModal = new bootstrap.Modal(document.getElementById('programStudiModal'));
    bootstrapModal.show();
    
    // Clean up on hide
    $("#programStudiModal").on('hidden.bs.modal', function() {
        $(this).remove();
    });
}

function editProgramStudi(id) {
    $.get(`${CONFIG.API_BASE_URL}/api/program-studi/${id}`)
        .done(function(data) {
            showProgramStudiModal(data);
        })
        .fail(function() {
            showNotification('error', 'Error', 'Gagal memuat data program studi');
        });
}

function saveProgramStudi() {
    const formData = {
        program_studi: $("#programStudi").val(),
        jenjang: $("#jenjang").val()
    };
    
    if (!formData.program_studi || !formData.jenjang) {
        showNotification('warning', 'Peringatan', 'Semua field harus diisi');
        return;
    }
    
    const url = currentEditId 
        ? `${CONFIG.API_BASE_URL}/api/program-studi/${currentEditId}`
        : `${CONFIG.API_BASE_URL}/api/program-studi/`;
    const method = currentEditId ? "PUT" : "POST";
    
    $.ajax({
        url: url,
        method: method,
        contentType: "application/json",
        data: JSON.stringify(formData)
    })
    .done(function() {
        $("#programStudiModal").modal("hide");
        programStudiGrid.dataSource.read();
        loadProgramStudiStatistics();
        showNotification('success', 'Sukses', 
            currentEditId ? 'Program studi berhasil diupdate' : 'Program studi berhasil ditambahkan');
    })
    .fail(function() {
        showNotification('error', 'Error', 'Gagal menyimpan program studi');
    });
}

function deleteProgramStudi(id) {
    if (confirm("Apakah Anda yakin ingin menghapus program studi ini?")) {
        $.ajax({
            url: `${CONFIG.API_BASE_URL}/api/program-studi/${id}`,
            method: "DELETE"
        })
        .done(function() {
            programStudiGrid.dataSource.read();
            loadProgramStudiStatistics();
            showNotification('success', 'Sukses', 'Program studi berhasil dihapus');
        })
        .fail(function() {
            showNotification('error', 'Error', 'Gagal menghapus program studi');
        });
    }
}

function loadProgramStudiStatistics() {
    $.get(`${CONFIG.API_BASE_URL}/api/program-studi/`)
        .done(function(data) {
            const totalProgramStudi = data.length;
            const jenjangCounts = {};
            
            data.forEach(function(item) {
                jenjangCounts[item.jenjang] = (jenjangCounts[item.jenjang] || 0) + 1;
            });
            
            $("#totalProgramStudi").text(totalProgramStudi);
            $("#totalJenjang").text(Object.keys(jenjangCounts).length);
            $("#programStudiS1").text(jenjangCounts['S1'] || 0);
            $("#programStudiS2").text(jenjangCounts['S2'] || 0);
        })
        .fail(function() {
            console.error("Gagal memuat statistik program studi");
        });
}

// Export functions for global access
window.initializeProgramStudi = initializeProgramStudi;
window.editProgramStudi = editProgramStudi;
window.saveProgramStudi = saveProgramStudi;
window.deleteProgramStudi = deleteProgramStudi; 