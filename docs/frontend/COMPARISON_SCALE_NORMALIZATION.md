# Normalisasi Skala untuk Perhitungan Selisih Nilai

_Dokumen ini merupakan bagian dari SPK Monitoring Mahasiswa Akhir Masa Studi._

## 📋 Deskripsi

Dokumentasi ini menjelaskan perbaikan perhitungan selisih nilai pada halaman comparison yang memperhitungkan perbedaan skala antara metode FIS dan SAW.

## 🎯 Masalah

### Sebelum Perbaikan

**Skala Nilai Berbeda**:
- **FIS**: Menggunakan skala 0-100 (fuzzy score)
- **SAW**: Menggunakan skala 0-1 (normalized score)

**Contoh Data**:
```javascript
// Mahasiswa dengan hasil yang sebenarnya mirip
FIS: 75.5  (skala 0-100)
SAW: 0.73  (skala 0-1)

// Perhitungan selisih SALAH (tanpa normalisasi)
Selisih = |75.5 - 0.73| = 74.77 ❌
Kategori: "Sangat Berbeda" ❌
```

**Dampak**:
- Selisih nilai yang tidak akurat (terlalu besar)
- Kategori selisih yang salah (seharusnya "Sangat Mirip")
- Visualisasi yang menyesatkan
- Analisis perbandingan yang tidak valid

### Penyebab Root Cause

1. **Tidak ada normalisasi skala** sebelum perhitungan selisih
2. **Threshold kategori** masih menggunakan skala 0-1 (asli SAW)
3. **Display nilai** tidak konsisten di grid

## ✅ Solusi

### 1. Normalisasi Skala ke 0-100

**Implementasi**:
```javascript
// Ambil nilai asli
let fis_value = fisItem.final_value || fisItem.fuzzy_score || 0;
let saw_value = sawItem.final_value || sawItem.saw_score || 0;

// Normalisasi ke skala yang sama (0-100)
const fis_normalized = fis_value;  // FIS sudah 0-100
const saw_normalized = saw_value <= 1 ? saw_value * 100 : saw_value;  // SAW 0-1 → 0-100

// Hitung selisih dengan nilai yang sudah dinormalisasi
const nilai_selisih = Math.abs(fis_normalized - saw_normalized);
```

**Contoh Setelah Normalisasi**:
```javascript
// Mahasiswa yang sama
FIS: 75.5  (skala 0-100)
SAW: 0.73  (skala 0-1)

// Normalisasi
FIS normalized: 75.5
SAW normalized: 0.73 * 100 = 73.0

// Perhitungan selisih BENAR
Selisih = |75.5 - 73.0| = 2.5 ✅
Kategori: "Sangat Mirip" ✅
```

### 2. Update Threshold Kategori Selisih

**Sebelum** (skala 0-1):
```javascript
function getSelisihCategory(selisih) {
    if (selisih <= 0.1) return "Sangat Mirip";   // ≤ 0.1
    if (selisih <= 0.25) return "Mirip";         // ≤ 0.25
    if (selisih <= 0.5) return "Cukup Berbeda";  // ≤ 0.5
    return "Sangat Berbeda";                     // > 0.5
}
```

**Sesudah** (skala 0-100):
```javascript
function getSelisihCategory(selisih) {
    // Threshold untuk skala 0-100 (setelah normalisasi)
    if (selisih <= 10) return "Sangat Mirip";      // ≤ 10%
    if (selisih <= 25) return "Mirip";             // ≤ 25%
    if (selisih <= 50) return "Cukup Berbeda";     // ≤ 50%
    return "Sangat Berbeda";                       // > 50%
}
```

### 3. Display Nilai yang Konsisten

**Grid Template - FIS**:
```javascript
{ field: "fis_kategori", title: "Hasil FIS", width: 180, 
  template: function(dataItem) {
      const fisNilai = dataItem.fis_nilai ? 
          parseFloat(dataItem.fis_nilai).toFixed(2) : 'N/A';
      return `<span class="result-category fis-category">${dataItem.fis_kategori}</span> 
              <span class="result-value" title="Nilai FIS: ${fisNilai}">${fisNilai}</span>`;
  }
}
```

**Grid Template - SAW** (konversi ke 0-100 untuk display):
```javascript
{ field: "saw_kategori", title: "Hasil SAW", width: 180, 
  template: function(dataItem) {
      const sawNilaiOriginal = dataItem.saw_nilai || 0;
      const sawNilaiDisplay = sawNilaiOriginal <= 1 ? 
          (sawNilaiOriginal * 100).toFixed(2) : 
          parseFloat(sawNilaiOriginal).toFixed(2);
      return `<span class="result-category saw-category">${dataItem.saw_kategori}</span> 
              <span class="result-value" title="Nilai SAW (skala 0-100): ${sawNilaiDisplay}">
                  ${sawNilaiDisplay}
              </span>`;
  }
}
```

**Grid Template - Selisih**:
```javascript
{ field: "nilai_selisih", title: "Selisih Nilai", width: 140, 
  template: function(dataItem) {
      const selisihFormatted = dataItem.nilai_selisih ? 
          parseFloat(dataItem.nilai_selisih).toFixed(2) : 'N/A';
      return `<span class="selisih-value" title="Selisih dalam skala 0-100">
                  ${selisihFormatted}
              </span> 
              <span class="selisih-category">${dataItem.selisih_category}</span>`;
  }
}
```

### 4. Struktur Data yang Disimpan

```javascript
comparisonData.push({
    nim: fisItem.nim,
    nama: fisItem.nama,
    
    // Nilai asli (untuk referensi)
    fis_nilai: fis_value,           // 0-100 (asli)
    saw_nilai: saw_value,           // 0-1 (asli)
    
    // Nilai normalized (untuk perhitungan)
    fis_nilai_normalized: fis_normalized,  // 0-100
    saw_nilai_normalized: saw_normalized,  // 0-100 (converted)
    
    // Kategori
    fis_kategori: fis_category,
    saw_kategori: saw_category,
    
    // Selisih (dari nilai normalized)
    nilai_selisih: nilai_selisih,
    selisih_category: getSelisihCategory(nilai_selisih),
    
    // Status
    is_consistent: is_consistent,
    fis_correct: fisItem.is_correct,
    saw_correct: sawItem.is_correct
});
```

## 📊 Perbandingan Sebelum dan Sesudah

### Contoh Case 1: Hasil Mirip

| Metric | Sebelum | Sesudah |
|--------|---------|---------|
| FIS Value | 75.5 | 75.5 |
| SAW Value | 0.73 | 0.73 |
| SAW Normalized | - | 73.0 |
| Selisih | 74.77 ❌ | 2.5 ✅ |
| Kategori | "Sangat Berbeda" ❌ | "Sangat Mirip" ✅ |

### Contoh Case 2: Hasil Berbeda

| Metric | Sebelum | Sesudah |
|--------|---------|---------|
| FIS Value | 85.0 | 85.0 |
| SAW Value | 0.45 | 0.45 |
| SAW Normalized | - | 45.0 |
| Selisih | 84.55 ❌ | 40.0 ✅ |
| Kategori | "Sangat Berbeda" ❌ | "Cukup Berbeda" ✅ |

### Contoh Case 3: Hasil Sangat Mirip

| Metric | Sebelum | Sesudah |
|--------|---------|---------|
| FIS Value | 68.5 | 68.5 |
| SAW Value | 0.70 | 0.70 |
| SAW Normalized | - | 70.0 |
| Selisih | 67.80 ❌ | 1.5 ✅ |
| Kategori | "Sangat Berbeda" ❌ | "Sangat Mirip" ✅ |

## 🔍 Kategori Selisih - Detail

### Sangat Mirip (≤ 10)
- **Range**: 0 - 10
- **Persentase**: 0% - 10%
- **Interpretasi**: Kedua metode menghasilkan nilai yang sangat dekat
- **Contoh**: FIS=75, SAW=72 → Selisih=3

### Mirip (≤ 25)
- **Range**: 10.01 - 25
- **Persentase**: 10.01% - 25%
- **Interpretasi**: Kedua metode menghasilkan nilai yang cukup dekat
- **Contoh**: FIS=80, SAW=65 → Selisih=15

### Cukup Berbeda (≤ 50)
- **Range**: 25.01 - 50
- **Persentase**: 25.01% - 50%
- **Interpretasi**: Terdapat perbedaan signifikan antara kedua metode
- **Contoh**: FIS=85, SAW=50 → Selisih=35

### Sangat Berbeda (> 50)
- **Range**: > 50
- **Persentase**: > 50%
- **Interpretasi**: Kedua metode menghasilkan nilai yang sangat berbeda
- **Contoh**: FIS=90, SAW=25 → Selisih=65

## 🧪 Testing & Validation

### 1. Cek Console Log

Setelah load data comparison, periksa console:

```javascript
// Expected output
Combined comparison data: 1605 items
Sample comparison item: {nim: "...", nama: "...", ...}
Scale normalization: FIS(0-100), SAW(0-1 → 0-100)
Sample selisih calculation: {
    fis_value: 75.5,
    fis_normalized: 75.5,
    saw_value: 0.73,
    saw_normalized: 73.0,
    selisih: 2.5,
    category: "Sangat Mirip"
}
```

### 2. Validasi Grid Display

**Kolom Hasil FIS**:
- ✅ Nilai tampil dalam skala 0-100
- ✅ Format: 2 desimal (e.g., "75.50")
- ✅ Tooltip: "Nilai FIS: 75.50"

**Kolom Hasil SAW**:
- ✅ Nilai tampil dalam skala 0-100 (dikonversi)
- ✅ Format: 2 desimal (e.g., "73.00")
- ✅ Tooltip: "Nilai SAW (skala 0-100): 73.00"

**Kolom Selisih Nilai**:
- ✅ Nilai dalam range 0-100
- ✅ Format: 2 desimal (e.g., "2.50")
- ✅ Kategori: "Sangat Mirip" / "Mirip" / "Cukup Berbeda" / "Sangat Berbeda"
- ✅ Tooltip: "Selisih dalam skala 0-100"

### 3. Manual Calculation Test

Pilih 1 row dari grid dan hitung manual:

```javascript
// Ambil data
FIS = 75.5
SAW = 0.73

// Normalisasi
FIS_norm = 75.5  (sudah 0-100)
SAW_norm = 0.73 * 100 = 73.0

// Selisih
Selisih = |75.5 - 73.0| = 2.5

// Kategori
2.5 <= 10 → "Sangat Mirip" ✅
```

### 4. Edge Cases

**Case A: SAW sudah dalam skala 0-100**
```javascript
SAW = 73  (bukan 0.73)
saw_normalized = 73 <= 1 ? 73 * 100 : 73  // → 73 (tidak dikonversi)
```

**Case B: Nilai 0**
```javascript
FIS = 0
SAW = 0
Selisih = |0 - 0| = 0
Kategori = "Sangat Mirip" ✅
```

**Case C: Nilai maksimal**
```javascript
FIS = 100
SAW = 1.0
SAW_norm = 1.0 * 100 = 100
Selisih = |100 - 100| = 0
Kategori = "Sangat Mirip" ✅
```

## 📈 Manfaat

1. **Akurasi Perhitungan**: Selisih nilai dihitung dengan benar setelah normalisasi skala
2. **Kategori yang Valid**: Kategori selisih mencerminkan perbedaan yang sebenarnya
3. **Visualisasi Konsisten**: Nilai di grid ditampilkan dalam skala yang sama (0-100)
4. **Analisis yang Akurat**: Perbandingan metode FIS vs SAW menjadi lebih valid
5. **User Understanding**: User dapat memahami perbedaan dengan lebih mudah
6. **Data Integrity**: Nilai asli tetap disimpan untuk keperluan audit

## 🔄 Backward Compatibility

- ✅ Nilai asli tetap tersimpan (`fis_nilai`, `saw_nilai`)
- ✅ Support format response lama (fallback)
- ✅ Tidak mengubah struktur backend response
- ✅ Hanya menambahkan field `_normalized` di frontend

## 📝 File yang Dimodifikasi

1. **`src/frontend/js/comparison.js`**:
   - Fungsi `combineEvaluationData()`: Normalisasi skala
   - Fungsi `getSelisihCategory()`: Update threshold
   - Grid template: Update display format

2. **`CHANGELOG.md`**:
   - Dokumentasi perubahan

3. **`docs/frontend/COMPARISON_SCALE_NORMALIZATION.md`**:
   - Dokumentasi lengkap (file ini)

## 🎓 Kesimpulan

Perbaikan ini memastikan bahwa perhitungan selisih nilai antara FIS dan SAW dilakukan dengan benar dengan memperhitungkan perbedaan skala antara kedua metode. Normalisasi ke skala yang sama (0-100) menghasilkan analisis perbandingan yang akurat dan mudah dipahami.

---

**Status**: ✅ Implemented  
**Versi**: 1.0  
**Tanggal**: 2025-07-22

