# Enhancement: Filter Program Studi dan Klasifikasi pada Grid FIS

## 📝 Ringkasan

Menambahkan fitur filter untuk **Program Studi** dan **Klasifikasi Peluang Lulus** pada grid "Hasil Klasifikasi" di halaman FIS, serta menambahkan kolom Program Studi pada grid.

## 🎯 Tujuan

1. Memudahkan pengguna untuk memfilter hasil klasifikasi berdasarkan **Program Studi** tertentu
2. Memudahkan pengguna untuk memfilter hasil klasifikasi berdasarkan **Klasifikasi Peluang Lulus** (Tinggi/Sedang/Kecil)
3. Menampilkan informasi **Program Studi** pada setiap baris data mahasiswa

## 📋 Perubahan yang Dilakukan

### 1. Backend (`src/backend/routers/fuzzy.py`)

**File:** `fuzzy.py` - Endpoint `/results`

**Perubahan:**
- Menambahkan field `program_studi` pada response data klasifikasi

```python
formatted_results.append({
    "nim": klasifikasi.nim,
    "nama": mahasiswa.nama,
    "program_studi": mahasiswa.program_studi,  # ✅ ADDED
    "kategori": klasifikasi.kategori,
    "nilai_fuzzy": klasifikasi.nilai_fuzzy,
    "ipk_membership": klasifikasi.ipk_membership,
    "sks_membership": klasifikasi.sks_membership,
    "nilai_dk_membership": klasifikasi.nilai_dk_membership,
    "updated_at": klasifikasi.updated_at
})
```

### 2. Frontend (`src/frontend/js/fis.js`)

#### a. **Grid Configuration Update**

**Perubahan pada `initializeFISGrid()`:**

1. **Enabled Row Filtering:**
   ```javascript
   filterable: {
       mode: "row",
       extra: false
   }
   ```

2. **Added Program Studi Column dengan Multi-Select Filter:**
   ```javascript
   {
       field: "program_studi",
       title: "Program Studi",
       width: 180,
       template: function(dataItem) {
           if (!dataItem.program_studi) return '<span style="color: #999;">N/A</span>';
           const colors = getProdiColor(dataItem.program_studi);
           return `<span class="badge" style="background: ${colors.bg}; color: ${colors.text}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">${dataItem.program_studi}</span>`;
       },
       filterable: {
           multi: true,
           search: true,
           checkAll: true,
           itemTemplate: function(e) {
               if (!e.program_studi) return '';
               const colors = getProdiColor(e.program_studi);
               return `<span class="badge" style="background: ${colors.bg}; color: ${colors.text}; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 5px;">${e.program_studi}</span>`;
           }
       }
   }
   ```

3. **Updated Klasifikasi Column dengan Multi-Select Filter:**
   ```javascript
   {
       field: "kategori",
       title: "Klasifikasi",
       width: 180,
       filterable: {
           multi: true,
           search: true,
           checkAll: true,
           dataSource: [
               { kategori: "Peluang Lulus Tinggi" },
               { kategori: "Peluang Lulus Sedang" },
               { kategori: "Peluang Lulus Kecil" }
           ],
           itemTemplate: function(e) {
               const color = getFISClassificationColor(e.kategori);
               return `<span style="color: ${color}; font-weight: bold; font-size: 11px;">${e.kategori}</span>`;
           }
       }
   }
   ```

4. **Added Text Filters for NIM and Nama:**
   ```javascript
   filterable: {
       cell: {
           operator: "contains",
           showOperators: false,
           suggestionOperator: "contains"
       }
   }
   ```

5. **Disabled Filters for Numeric/Membership Columns:**
   - `nilai_fuzzy`: `filterable: false`
   - `ipk_membership`: `filterable: false`
   - `sks_membership`: `filterable: false`
   - `nilai_dk_membership`: `filterable: false`

#### b. **Data Loading Enhancement**

**Perubahan pada `loadFISGridData()`:**

```javascript
// Update grid dan filter datasource
const grid = $("#fisGrid").data("kendoGrid");
if (grid) {
    grid.dataSource.data(fisDataCache.results);
    
    // Update filter dataSource untuk program_studi dengan unique values
    const uniqueProdi = getUniqueValues(fisDataCache.results, 'program_studi');
    const prodiColumn = grid.columns.find(col => col.field === 'program_studi');
    if (prodiColumn && prodiColumn.filterable) {
        prodiColumn.filterable.dataSource = uniqueProdi.map(p => ({ program_studi: p }));
    }
}
```

#### c. **Added Helper Function**

**Function `getUniqueValues()`:**

```javascript
// Fungsi helper untuk mendapatkan unique values dari array
function getUniqueValues(data, field) {
    if (!data || !Array.isArray(data) || !field) return [];
    
    const unique = [...new Set(data.map(item => item[field]).filter(val => val))];
    return unique.sort();
}
```

## 🎨 UI/UX Features

### 1. **Program Studi Column**
- **Tampilan:** Badge dengan warna khas program studi
- **Filter:** Multi-select dropdown dengan search
- **Fitur:** 
  - Checkbox untuk setiap program studi
  - "Check All" untuk select semua
  - Search box untuk mencari prodi
  - Badge preview di dropdown

### 2. **Klasifikasi Column**
- **Tampilan:** Text berwarna (hijau/kuning/merah)
- **Filter:** Multi-select dropdown
- **Opsi:**
  - Peluang Lulus Tinggi
  - Peluang Lulus Sedang
  - Peluang Lulus Kecil

### 3. **NIM & Nama Columns**
- **Filter:** Text input dengan "contains" operator
- **Auto-filter:** Typing langsung filter data

### 4. **Numeric Columns**
- **Filter:** Disabled (tidak perlu filter untuk membership values)

## 📊 Color Scheme

### Program Studi Colors (dari `getProdiColor()`)
```javascript
const prodiColors = {
    'Teknik Informatika': { bg: '#e3f2fd', text: '#1565C0' },
    'Sistem Informasi': { bg: '#e8f5e9', text: '#2e7d32' },
    'Teknik Komputer': { bg: '#fff3e0', text: '#e65100' },
    'Manajemen Informatika': { bg: '#f3e5f5', text: '#6a1b9a' },
    'Komputerisasi Akuntansi': { bg: '#fff9c4', text: '#f57f17' },
    'Teknik Elektro': { bg: '#ffebee', text: '#c62828' },
    'default': { bg: '#e0e0e0', text: '#424242' }
};
```

### Klasifikasi Colors (dari `getFISClassificationColor()`)
- **Tinggi:** `#28a745` (hijau)
- **Sedang:** `#ffc107` (kuning)
- **Kecil:** `#dc3545` (merah)

## 🔧 Testing

### Test Scenarios

1. **Filter Program Studi:**
   ```
   1. Buka halaman FIS
   2. Klik filter icon di column "Program Studi"
   3. Pilih satu atau lebih program studi
   4. Klik "Filter"
   5. Verify: Grid hanya menampilkan data prodi yang dipilih
   ```

2. **Filter Klasifikasi:**
   ```
   1. Klik filter icon di column "Klasifikasi"
   2. Pilih satu atau lebih klasifikasi
   3. Klik "Filter"
   4. Verify: Grid hanya menampilkan data klasifikasi yang dipilih
   ```

3. **Filter NIM/Nama:**
   ```
   1. Ketik NIM atau nama di filter box
   2. Verify: Grid auto-filter berdasarkan text input
   ```

4. **Combined Filters:**
   ```
   1. Apply multiple filters sekaligus
   2. Verify: Grid menampilkan data yang memenuhi semua kriteria
   ```

5. **Clear Filters:**
   ```
   1. Klik "Clear" di filter
   2. Verify: Grid kembali menampilkan semua data
   ```

## 📈 Benefits

1. **✅ Improved Data Discovery:** User dapat dengan cepat menemukan data spesifik
2. **✅ Better UX:** Multi-select dengan search membuat filtering lebih mudah
3. **✅ Visual Clarity:** Color-coded badges memudahkan identifikasi program studi
4. **✅ Efficiency:** Filter di row-level lebih compact dan intuitif
5. **✅ Consistency:** Menggunakan pattern yang sama seperti grid evaluasi lainnya

## 🚀 Deployment Notes

1. **Backend:** Restart backend container untuk apply perubahan endpoint
   ```bash
   docker-compose restart backend
   ```

2. **Frontend:** Clear browser cache atau hard refresh (Ctrl+F5)

3. **Verify:** 
   - Data program_studi muncul di grid
   - Filter berfungsi dengan baik
   - Badge warna tampil dengan benar

## 📝 Future Enhancements

1. **Export Filtered Data:** Export hanya data yang ter-filter
2. **Save Filter Presets:** Simpan kombinasi filter untuk digunakan kembali
3. **Advanced Filters:** Range filters untuk nilai fuzzy
4. **Filter Analytics:** Tampilkan jumlah data per filter option

---

**Date:** 2025-11-11  
**Author:** AI Assistant  
**Version:** 1.0  
**Status:** ✅ Completed

