$(document).ready(function() {
    // Inisialisasi grid users
    var usersGrid = $("#usersGrid").kendoGrid({
        dataSource: {
            transport: {
                read: {
                    url: "/api/users/",
                    dataType: "json"
                },
                create: {
                    url: "/api/users/",
                    type: "POST",
                    dataType: "json",
                    contentType: "application/json"
                },
                update: {
                    url: function(data) { return "/api/users/" + data.id; },
                    type: "PUT",
                    dataType: "json",
                    contentType: "application/json"
                },
                destroy: {
                    url: function(data) { return "/api/users/" + data.id; },
                    type: "DELETE",
                    dataType: "json"
                },
                parameterMap: function(data, type) {
                    if (type === "create" || type === "update") {
                        return kendo.stringify(data);
                    }
                    return data;
                }
            },
            schema: {
                model: {
                    id: "id",
                    fields: {
                        id: { editable: false, nullable: true },
                        username: { type: "string", validation: { required: true } },
                        email: { type: "string", validation: { required: true } },
                        full_name: { type: "string", validation: { required: true } },
                        role: { type: "string" },
                        is_active: { type: "boolean" },
                        created_at: { type: "date" }
                    }
                }
            },
            pageSize: 10
        },
        height: 500,
        sortable: false,
        pageable: true,
        filterable: false,
        toolbar: [{ name: "create", text: "Tambah User", template: '<button class="k-button k-button-md k-rounded-md k-button-solid custom-button-sync k-grid-add" type="button"><i class="fas fa-plus"></i> <span class="k-button-text">Tambah User</span></button>' }],
        columns: [
            { field: "username", title: "Username" },
            { field: "email", title: "Email" },
            { field: "full_name", title: "Nama Lengkap" },
            { field: "role", title: "Role" },
            { field: "is_active", title: "Aktif", template: "#= is_active ? 'Ya' : 'Tidak' #" },
            // { field: "created_at", title: "Dibuat", format: "{0:yyyy-MM-dd HH:mm}" }, // disembunyikan
            { command: [
                { name: "edit", text: "Edit", click: showEditUserForm, template: '<button class="k-button k-button-md k-rounded-md k-button-solid custom-button-edit" type="button"><i class="fas fa-edit"></i> <span class="k-button-text">Edit</span></button>' },
                { name: "destroy", text: "Hapus", template: '<button class="k-button k-button-md k-rounded-md k-button-solid custom-button-delete" type="button"><i class="fas fa-trash"></i> <span class="k-button-text">Hapus</span></button>' }
            ], title: "Aksi", width: "270px" }
        ],
        editable: false // Nonaktifkan popup default
    }).data("kendoGrid");

    // Handler tombol tambah user
    $(document).on("click", ".k-grid-add", function(e) {
        e.preventDefault();
        showUserForm();
    });

    // Handler tombol simpan di form custom
    $("#saveUserBtn").off("click").on("click", function() {
        var userData = {
            username: $("#userUsername").val(),
            email: $("#userEmail").val(),
            full_name: $("#userFullName").val(),
            role: $("#userRole").val(),
            password: $("#userPassword").val(),
            is_active: true
        };
        $.ajax({
            url: "/api/users/",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(userData),
            success: function() {
                hideUserForm();
                usersGrid.dataSource.read();
            },
            error: function(xhr) {
                alert("Gagal menyimpan user: " + xhr.responseText);
            }
        });
    });

    // Handler tombol batal/close
    window.hideUserForm = function() {
        $("#userForm").hide();
        $("#userForm input, #userForm select").val("");
    };

    // Show form tambah user
    function showUserForm() {
        $("#userFormTitle").html('<i class="fas fa-plus"></i> Tambah User');
        $("#userForm").show();
        $("#userForm input, #userForm select").val("");
        // Reset handler Simpan ke mode tambah
        $("#saveUserBtn").off("click").on("click", function() {
            var userData = {
                username: $("#userUsername").val(),
                email: $("#userEmail").val(),
                full_name: $("#userFullName").val(),
                role: $("#userRole").val(),
                password: $("#userPassword").val(),
                is_active: true
            };
            $.ajax({
                url: "/api/users/",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(userData),
                success: function() {
                    hideUserForm();
                    usersGrid.dataSource.read();
                },
                error: function(xhr) {
                    alert("Gagal menyimpan user: " + xhr.responseText);
                }
            });
        });
    }

    // Show form edit user
    function showEditUserForm(e) {
        e.preventDefault();
        var dataItem = usersGrid.dataItem($(e.currentTarget).closest("tr"));
        $("#userFormTitle").html('<i class="fas fa-edit"></i> Edit User');
        $("#userUsername").val(dataItem.username);
        $("#userEmail").val(dataItem.email);
        $("#userFullName").val(dataItem.full_name);
        $("#userRole").val(dataItem.role);
        $("#userPassword").val(""); // Kosongkan password
        $("#userForm").show();
        // Reset handler Simpan ke mode edit
        $("#saveUserBtn").off("click").on("click", function() {
            var updateData = {
                username: $("#userUsername").val(),
                email: $("#userEmail").val(),
                full_name: $("#userFullName").val(),
                role: $("#userRole").val(),
                is_active: true
            };
            var password = $("#userPassword").val();
            if (password) updateData.password = password;
            $.ajax({
                url: "/api/users/" + dataItem.id,
                type: "PUT",
                contentType: "application/json",
                data: JSON.stringify(updateData),
                success: function() {
                    hideUserForm();
                    usersGrid.dataSource.read();
                },
                error: function(xhr) {
                    alert("Gagal update user: " + xhr.responseText);
                }
            });
        });
    }

    // Search user
    $("#searchUserBtn").click(function() {
        var q = $("#searchUserInput").val().trim();
        var $btn = $(this);
        var $info = $("#searchUserInfo");
        var $resultText = $("#searchUserResultText");
        $btn.html('<i class="fas fa-spinner fa-spin"></i> Cari').prop('disabled', true);
        $info.show();
        $resultText.text(q ? `Mencari: "${q}"...` : 'Menampilkan semua user...');
        usersGrid.dataSource.read({ q: q });
        setTimeout(function() {
            $btn.html('<i class="fas fa-search"></i> Cari').prop('disabled', false);
        }, 400);
    });
    $("#clearSearchUserBtn").click(function() {
        $("#searchUserInput").val("");
        var $info = $("#searchUserInfo");
        var $resultText = $("#searchUserResultText");
        $info.hide();
        $resultText.text('');
        usersGrid.dataSource.read();
    });
    // Tampilkan info hasil pencarian setelah dataSource selesai load
    usersGrid.dataSource.bind('change', function(e) {
        var q = $("#searchUserInput").val().trim();
        var $info = $("#searchUserInfo");
        var $resultText = $("#searchUserResultText");
        if (q) {
            var total = usersGrid.dataSource.total();
            if (total === 0) {
                $resultText.text(`Tidak ada hasil untuk: "${q}"`);
                $info.show();
            } else {
                $resultText.text(`Menampilkan ${total} hasil untuk: "${q}"`);
                $info.show();
            }
        } else {
            $info.hide();
            $resultText.text('');
        }
    });
});

function roleDropDownEditor(container, options) {
    $('<input required name="' + options.field + '" />')
        .appendTo(container)
        .kendoDropDownList({
            dataSource: [
                { text: "Admin", value: "admin" },
                { text: "Staf", value: "staf" },
                { text: "User", value: "user" }
            ],
            dataTextField: "text",
            dataValueField: "value",
            optionLabel: "Pilih Role..."
        });
} 