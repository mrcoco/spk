# Troubleshooting Error Destroy pada Grid Mahasiswa

Dokumentasi ini menjelaskan cara mengatasi error `jQuery.Deferred exception: Cannot read properties of undefined (reading 'uid')` saat menghapus data pada grid mahasiswa.

## Masalah Umum

### 1. Error "Cannot read properties of undefined (reading 'uid')"

**Gejala:**
- Error saat klik tombol "Hapus" pada grid mahasiswa
- Console menampilkan error jQuery.Deferred exception
- Operasi hapus tidak berhasil

**Penyebab:**
- Data item tidak memiliki properti `uid`
- Model data tidak valid
- DataSource tidak terinisialisasi dengan benar
- Error handling tidak memadai

**Solusi:**

#### A. Periksa Data Item
```javascript
// Di browser console
const grid = $("#mahasiswaGrid").data("kendoGrid");
const data = grid.dataSource.data();
console.log("Data items:", data);

// Periksa uid pada setiap item
data.forEach((item, index) => {
    console.log(`Item ${index}:`, {
        nim: item.nim,
        uid: item.uid,
        hasUid: !!item.uid
    });
});
```

#### B. Periksa Model Schema
```javascript
// Di browser console
const dataSource = $("#mahasiswaGrid").data("kendoGrid").dataSource;
console.log("Schema:", dataSource.options.schema);
console.log("Model:", dataSource.options.schema.model);
```

#### C. Test Destroy Configuration
```javascript
// Di browser console
const transport = $("#mahasiswaGrid").data("kendoGrid").dataSource.options.transport;
console.log("Destroy config:", transport.destroy);
```

### 2. Data Item Tidak Memiliki UID

**Gejala:**
- Beberapa item data tidak memiliki properti `uid`
- Error saat operasi destroy

**Solusi:**

#### A. Generate UID Otomatis
Script sudah diperbaiki untuk generate uid otomatis:
```javascript
// Di schema.parse function
parse: function(response) {
    if (response.data && Array.isArray(response.data)) {
        response.data.forEach(function(item) {
            if (!item.uid) {
                item.uid = kendo.guid();
            }
        });
    }
    return response;
}
```

#### B. Manual Fix
```javascript
// Di browser console untuk fix manual
const grid = $("#mahasiswaGrid").data("kendoGrid");
const data = grid.dataSource.data();
data.forEach(item => {
    if (!item.uid) {
        item.uid = kendo.guid();
    }
});
grid.dataSource.read(); // Refresh grid
```

### 3. Model Validation Error

**Gejala:**
- Data item tidak memiliki field yang diperlukan
- Error saat operasi CRUD

**Solusi:**

#### A. Periksa Required Fields
```javascript
// Di browser console
const grid = $("#mahasiswaGrid").data("kendoGrid");
const data = grid.dataSource.data();
const firstItem = data[0];

const requiredFields = ['nim', 'nama', 'program_studi', 'ipk', 'sks', 'persen_dek'];
requiredFields.forEach(field => {
    console.log(`${field}:`, firstItem[field], firstItem.hasOwnProperty(field));
});
```

#### B. Validate Model
```javascript
// Di browser console
const dataSource = $("#mahasiswaGrid").data("kendoGrid").dataSource;
const model = dataSource.options.schema.model;
console.log("Model fields:", model.fields);
```

## Script Testing

### 1. `test-destroy.js`
Script untuk test operasi destroy secara otomatis.

**Cara menggunakan:**
1. Buka halaman Data Mahasiswa
2. Buka Developer Tools (F12)
3. Lihat Console untuk hasil test

**Output yang diharapkan:**
```
🧪 Starting Destroy Operation Test...
============================================================

🔍 Testing Grid Initialization...
  Grid exists: ✅
  DataSource exists: ✅
  Result: ✅ PASS

📊 Testing DataSource Validation...
  Has data: ✅
  All items have uid: ✅
  Result: ✅ PASS

🗑️ Testing Destroy Operation...
  Has destroy config: ✅
  Has destroy URL function: ✅
  Result: ✅ PASS

📊 DESTROY OPERATION TEST RESULTS
============================================================
✅ Passed: 5/5 (100%)
🎉 ALL TESTS PASSED! Destroy operation should work correctly.
```

### 2. Manual Testing
```javascript
// Test grid initialization
const grid = $("#mahasiswaGrid").data("kendoGrid");
console.log("Grid exists:", !!grid);

// Test data source
const dataSource = grid.dataSource;
console.log("DataSource exists:", !!dataSource);

// Test data items
const data = dataSource.data();
console.log("Data items count:", data.length);

// Test uid on items
const itemsWithUid = data.filter(item => item.uid);
console.log("Items with uid:", itemsWithUid.length);

// Test destroy function
console.log("deleteMahasiswa function:", typeof window.deleteMahasiswa);
```

## Perbaikan yang Telah Diterapkan

### 1. Enhanced Error Handling
```javascript
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
        console.log("Destroy request for:", options.data);
    }
}
```

### 2. UID Generation
```javascript
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
```

### 3. Model Validation
```javascript
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
}
```

### 4. Safe Delete Function
```javascript
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
                }
                showNotification("Error", errorMessage, "error");
                reject(new Error(errorMessage));
            }
        });
    });
}
```

## Debugging Steps

### Step 1: Periksa Console Errors
```javascript
// Di browser console
console.log("Grid:", $("#mahasiswaGrid").data("kendoGrid"));
console.log("DataSource:", $("#mahasiswaGrid").data("kendoGrid").dataSource);
```

### Step 2: Periksa Data Items
```javascript
// Di browser console
const data = $("#mahasiswaGrid").data("kendoGrid").dataSource.data();
console.log("Data items:", data);
```

### Step 3: Test Destroy Operation
```javascript
// Di browser console
const grid = $("#mahasiswaGrid").data("kendoGrid");
const firstItem = grid.dataSource.data()[0];
console.log("First item:", firstItem);
console.log("Has uid:", !!firstItem.uid);
```

### Step 4: Test Delete Function
```javascript
// Di browser console (hanya untuk testing)
if (typeof window.deleteMahasiswa === 'function') {
    const testNim = "12345678"; // Ganti dengan NIM yang valid
    window.deleteMahasiswa(testNim)
        .then(response => console.log("Delete success:", response))
        .catch(error => console.error("Delete error:", error));
}
```

## Troubleshooting Checklist

- [ ] Grid terinisialisasi dengan benar
- [ ] DataSource terhubung dengan backend
- [ ] Data items memiliki properti `uid`
- [ ] Model schema sesuai dengan data
- [ ] Destroy configuration valid
- [ ] Error handling berfungsi
- [ ] Konfirmasi hapus muncul
- [ ] Notifikasi sukses/error muncul

## Kontak Support

Jika masalah masih berlanjut:

1. **Jalankan Test Script** `test-destroy.js`
2. **Periksa Console Errors** di browser
3. **Verifikasi Backend API** berfungsi
4. **Periksa Network Tab** untuk API calls
5. **Test dengan data sample** yang valid

## Contoh Debug Output

### Sukses
```
✅ Grid Initialization: PASS
✅ DataSource Validation: PASS
✅ Model Validation: PASS
✅ Destroy Operation: PASS
✅ Error Handling: PASS
🎉 ALL TESTS PASSED!
```

### Error
```
❌ Grid Initialization: FAIL
  Expected: Grid and DataSource properly initialized
  Actual: Grid or DataSource missing
  Details: Grid: false, DataSource: false

❌ DataSource Validation: FAIL
  Expected: All data items have uid property
  Actual: Some items missing uid
  Details: Item 0 (NIM: 12345678) missing uid
``` 