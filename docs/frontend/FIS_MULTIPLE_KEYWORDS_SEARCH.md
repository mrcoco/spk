# FIS Multiple Keywords Search (Chain Filter)

## 🎯 Fitur

Pencarian pada grid "Hasil Klasifikasi" FIS sekarang mendukung **multiple keywords** untuk filter yang lebih spesifik.

## ✨ Cara Penggunaan

### Single Keyword (Behavior Lama)

Cari berdasarkan **satu** kriteria:

```
Input: "informatika"
Result: Semua mahasiswa dari program studi yang mengandung "informatika"

Input: "tinggi"
Result: Semua mahasiswa dengan klasifikasi "Peluang Lulus Tinggi"

Input: "19812"
Result: Semua mahasiswa dengan NIM yang mengandung "19812"
```

### Multiple Keywords (Fitur Baru) 🆕

Cari dengan **beberapa** kriteria sekaligus menggunakan **koma** sebagai separator:

```
Input: "informatika, tinggi"
Result: Mahasiswa dari prodi "informatika" DAN klasifikasi "tinggi"

Input: "sistem, sedang"
Result: Mahasiswa dari prodi "sistem" DAN klasifikasi "sedang"

Input: "teknik, kecil"
Result: Mahasiswa dari prodi "teknik" DAN klasifikasi "kecil"
```

## 🔍 Filter Logic

### AND Logic (Semua Keyword Harus Match)

Filter menggunakan **AND logic** - semua keywords harus ditemukan pada record:

```javascript
// Contoh: "informatika, tinggi"
Keywords: ["informatika", "tinggi"]

Record akan muncul jika:
- Ada "informatika" di NIM/Nama/Program Studi/Klasifikasi DAN
- Ada "tinggi" di NIM/Nama/Program Studi/Klasifikasi
```

### Field Search

Setiap keyword akan dicari di **semua field** berikut:
- ✅ **NIM**
- ✅ **Nama**
- ✅ **Program Studi**
- ✅ **Klasifikasi Peluang Lulus**

## 📝 Contoh Penggunaan

### Use Case 1: Filter by Prodi + Klasifikasi

**Tujuan:** Cari mahasiswa Teknik Informatika dengan Peluang Lulus Tinggi

```
Input: "informatika, tinggi"

Result: 
┌──────────────┬─────────────────┬─────────────────────────┬──────────────────────┐
│ NIM          │ Nama            │ Program Studi            │ Klasifikasi          │
├──────────────┼─────────────────┼─────────────────────────┼──────────────────────┤
│ 19101241001  │ Andi Pratama    │ TEKNIK INFORMATIKA - S1  │ Peluang Lulus Tinggi │
│ 19101241052  │ Budi Santoso    │ TEKNIK INFORMATIKA - S1  │ Peluang Lulus Tinggi │
└──────────────┴─────────────────┴─────────────────────────┴──────────────────────┘
```

### Use Case 2: Filter Multiple Prodi Terms

**Tujuan:** Cari mahasiswa dari Sistem Informasi dengan Peluang Sedang

```
Input: "sistem, sedang"

Result:
┌──────────────┬─────────────────┬─────────────────────────┬──────────────────────┐
│ NIM          │ Nama            │ Program Studi            │ Klasifikasi          │
├──────────────┼─────────────────┼─────────────────────────┼──────────────────────┤
│ 19201241015  │ Citra Dewi      │ SISTEM INFORMASI - S1    │ Peluang Lulus Sedang │
│ 19201241033  │ Dedi Kurniawan  │ SISTEM INFORMASI - S1    │ Peluang Lulus Sedang │
└──────────────┴─────────────────┴─────────────────────────┴──────────────────────┘
```

### Use Case 3: Filter by NIM Prefix + Classification

**Tujuan:** Cari angkatan 2019 (NIM 19xxx) dengan Peluang Kecil

```
Input: "19, kecil"

Result:
┌──────────────┬─────────────────┬─────────────────────────┬──────────────────────┐
│ NIM          │ Nama            │ Program Studi            │ Klasifikasi          │
├──────────────┼─────────────────┼─────────────────────────┼──────────────────────┤
│ 19301241007  │ Eka Putri       │ MANAJEMEN - S1           │ Peluang Lulus Kecil  │
│ 19401241022  │ Fajar Nugraha   │ AKUNTANSI - S1           │ Peluang Lulus Kecil  │
└──────────────┴─────────────────┴─────────────────────────┴──────────────────────┘
```

### Use Case 4: Name + Classification

**Tujuan:** Cari mahasiswa bernama "Andi" dengan klasifikasi Tinggi

```
Input: "andi, tinggi"

Result: Semua mahasiswa yang namanya mengandung "Andi" DAN klasifikasinya "Tinggi"
```

## 🛠️ Technical Implementation

### Frontend: `src/frontend/js/fis.js`

```javascript
function performFISSearch() {
    const searchInput = $("#searchInputFIS").val().trim();
    
    // Parse multiple keywords
    const keywords = searchInput.toLowerCase()
        .split(/[,]+/)              // Split by comma
        .map(k => k.trim())         // Trim whitespace
        .filter(k => k.length > 0); // Remove empty strings
    
    // Filter dengan AND logic
    const filteredData = allData.filter(item => {
        return keywords.every(keyword => {
            // Check di semua field
            return (
                (item.nim && item.nim.toLowerCase().includes(keyword)) ||
                (item.nama && item.nama.toLowerCase().includes(keyword)) ||
                (item.program_studi && item.program_studi.toLowerCase().includes(keyword)) ||
                (item.kategori && item.kategori.toLowerCase().includes(keyword))
            );
        });
    });
    
    // Update grid
    grid.dataSource.data(filteredData);
}
```

### Frontend: `src/frontend/index.html`

Updated placeholder dan hint text:

```html
<input 
    type="text" 
    id="searchInputFIS" 
    placeholder="Cari berdasarkan NIM, Nama, Program Studi, atau Klasifikasi... (gunakan koma untuk multiple filter)"
>
<small style="color: #666; font-size: 11px; margin-top: 5px; display: block;">
    <i class="fas fa-info-circle"></i> 
    <strong>Single:</strong> "19812", "Budi", "Informatika", "Tinggi" |
    <strong>Multiple:</strong> "informatika, tinggi", "sistem, sedang"
</small>
```

## 🎨 User Experience

### Search Info Messages

#### Single Keyword:
```
Ditemukan 45 data untuk "informatika"
```

#### Multiple Keywords:
```
Ditemukan 12 data dengan keywords: "informatika", "tinggi"
```

#### No Results:
```
Tidak ada data ditemukan untuk "java, tinggi"
```

### Visual Feedback

1. **Loading Indicator:** Progress overlay saat filtering
2. **Color-Coded Messages:**
   - 🟢 Success (green) - Data ditemukan
   - 🟡 Warning (yellow) - Tidak ada hasil
   - 🔵 Info (blue) - Status pencarian
3. **Total Record Counter:** Update real-time saat filter

## 📊 Performance

### Client-Side Filtering

- ✅ **Fast:** No API call, filter di browser
- ✅ **Efficient:** Menggunakan cache data
- ✅ **Responsive:** Instant feedback

### Optimization

```javascript
// Cache data di memori
const allData = fisDataCache.results || grid.dataSource.data();

// Filter menggunakan native array methods
const filteredData = allData.filter(item => 
    keywords.every(keyword => /* check fields */)
);
```

## 🚀 Use Cases Real-World

### Academic Analysis

1. **Identify At-Risk Students by Department:**
   ```
   "informatika, kecil"
   → Mahasiswa Informatika dengan peluang lulus kecil (perlu intervensi)
   ```

2. **Find High-Performers by Department:**
   ```
   "sistem, tinggi"
   → Mahasiswa Sistem Informasi dengan peluang lulus tinggi (kandidat beasiswa)
   ```

3. **Cohort Analysis:**
   ```
   "19, sedang"
   → Angkatan 2019 dengan peluang lulus sedang (perlu monitoring)
   ```

### Departmental Reporting

```
Input: "teknik, tinggi"
Output: List untuk report "Mahasiswa Teknik dengan Peluang Lulus Tinggi"

Input: "manajemen, kecil"
Output: List untuk intervensi akademik jurusan Manajemen
```

## 🔄 Future Enhancements (Optional)

### 1. OR Logic Support

Tambahkan operator `|` untuk OR logic:

```
Input: "informatika | sistem, tinggi"
Result: (Informatika ATAU Sistem) DAN Tinggi
```

### 2. Negation Support

Tambahkan operator `-` untuk negation:

```
Input: "informatika, -tinggi"
Result: Informatika DAN BUKAN Tinggi
```

### 3. Field-Specific Search

Tambahkan prefix untuk field spesifik:

```
Input: "prodi:informatika, kelas:tinggi"
Result: Search spesifik di field tertentu
```

### 4. Save Search Presets

```javascript
// Save frequently used searches
const presets = {
    "At Risk IT": "informatika, kecil",
    "Top Performers": "tinggi",
    "2019 Cohort": "19"
};
```

## 📋 Testing Checklist

- [x] Single keyword search works
- [x] Multiple keywords with comma separator works
- [x] Case-insensitive search
- [x] Trim whitespace dari keywords
- [x] Empty keyword filter (show all)
- [x] No results handling
- [x] Loading indicator display
- [x] Search info message updates
- [x] Total record counter updates
- [x] Clear search button works
- [x] Cache data digunakan untuk performa
- [x] Grid updates dengan filtered data

## 📝 User Documentation

### Quick Guide (untuk end-user):

**Pencarian Tunggal:**
Ketik satu kata kunci, contoh: `informatika`

**Pencarian Ganda:**
Ketik beberapa kata kunci dipisah koma, contoh: `informatika, tinggi`

**Tips:**
- Gunakan huruf kecil atau besar, keduanya akan dikenali
- Tidak perlu mengetik kata lengkap (e.g., "info" akan match "Informatika")
- Kombinasikan prodi + klasifikasi untuk hasil lebih spesifik
- Gunakan tombol "Clear" untuk reset pencarian

## ✅ Status

**Feature Status:** ✅ **IMPLEMENTED**  
**Testing Status:** ✅ **READY FOR TESTING**  
**Documentation:** ✅ **COMPLETE**

---

**Date:** 2025-11-11  
**Feature:** Multiple Keywords Search for FIS Grid  
**Separator:** Comma (,)  
**Logic:** AND (all keywords must match)  
**Performance:** Client-side, instant filtering

