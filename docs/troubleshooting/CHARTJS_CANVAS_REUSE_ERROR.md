# Troubleshooting: Chart.js Canvas Reuse Error

_Dokumen ini merupakan bagian dari SPK Monitoring Mahasiswa Akhir Masa Studi._

## Deskripsi Error

Error yang muncul di console browser:

```
Error: Canvas is already in use. Chart with ID 'X' must be destroyed before the canvas with ID 'canvasElementId' can be reused.
```

Error ini terjadi ketika mencoba membuat chart Chart.js baru pada canvas yang sudah memiliki chart aktif.

## Penyebab

### 1. **Multiple Initialization**
   - Modul JavaScript diinisialisasi lebih dari sekali
   - Script dimuat ulang tanpa menghancurkan chart yang sudah ada
   - Event listener yang memanggil inisialisasi chart dipicu berulang kali

### 2. **Canvas Tidak Dibersihkan**
   - Chart lama tidak dihancurkan sebelum membuat chart baru
   - Reference ke chart instance masih ada di memori
   - Canvas element di-reuse tanpa cleanup yang proper

### 3. **Module Reload**
   - SPA routing menyebabkan module di-reload
   - Browser navigation (back/forward) tanpa full page reload
   - Hot reload saat development

## Solusi

### Perbaikan di SAW Evaluation Module

**File**: `src/frontend/js/saw-evaluation.js`

**Sebelum Perbaikan**:
```javascript
initializeCharts() {
    // Initialize empty charts
    this.updateClassificationChart({ tinggi: 0, sedang: 0, kecil: 0 });
    this.updateMetricsChart({ 
        accuracy: 0, 
        precision: 0, 
        recall: 0, 
        f1_score: 0, 
        specificity: 0 
    });
}
```

**Setelah Perbaikan (Final Version)**:
```javascript
initializeCharts() {
    // Hancurkan chart yang sudah ada terlebih dahulu dengan type checking dan error handling
    if (this.classificationChart && typeof this.classificationChart.destroy === 'function') {
        try {
            this.classificationChart.destroy();
        } catch (error) {
            console.warn('Error destroying classification chart:', error);
        }
        this.classificationChart = null;
    }
    if (this.metricsChart && typeof this.metricsChart.destroy === 'function') {
        try {
            this.metricsChart.destroy();
        } catch (error) {
            console.warn('Error destroying metrics chart:', error);
        }
        this.metricsChart = null;
    }
    
    // Initialize empty charts
    this.updateClassificationChart({ tinggi: 0, sedang: 0, kecil: 0 });
    this.updateMetricsChart({ 
        accuracy: 0, 
        precision: 0, 
        recall: 0, 
        f1_score: 0, 
        specificity: 0 
    });
}
```

### Perbaikan di SAW Evaluation Actual Module

**File**: `src/frontend/js/saw-evaluation-actual.js`

**Sebelum Perbaikan**:
```javascript
initializeCharts() {
    console.log('Initializing charts for SAW Evaluation with Actual Data');
    
    const classificationCtx = document.getElementById('sawEvaluationActualClassificationChart');
    const metricsCtx = document.getElementById('sawEvaluationActualMetricsChart');
    
    if (classificationCtx) {
        window.sawEvaluationActualClassificationChart = new Chart(classificationCtx, {
            // ... chart config
        });
    }
    
    if (metricsCtx) {
        window.sawEvaluationActualMetricsChart = new Chart(metricsCtx, {
            // ... chart config
        });
    }
}
```

**Setelah Perbaikan (Final Version)**:
```javascript
initializeCharts() {
    console.log('Initializing charts for SAW Evaluation with Actual Data');
    
    // Hancurkan chart yang sudah ada terlebih dahulu dengan type checking dan error handling
    if (window.sawEvaluationActualClassificationChart && typeof window.sawEvaluationActualClassificationChart.destroy === 'function') {
        try {
            window.sawEvaluationActualClassificationChart.destroy();
        } catch (error) {
            console.warn('Error destroying classification chart:', error);
        }
        window.sawEvaluationActualClassificationChart = null;
    }
    if (window.sawEvaluationActualMetricsChart && typeof window.sawEvaluationActualMetricsChart.destroy === 'function') {
        try {
            window.sawEvaluationActualMetricsChart.destroy();
        } catch (error) {
            console.warn('Error destroying metrics chart:', error);
        }
        window.sawEvaluationActualMetricsChart = null;
    }
    
    const classificationCtx = document.getElementById('sawEvaluationActualClassificationChart');
    const metricsCtx = document.getElementById('sawEvaluationActualMetricsChart');
    
    if (classificationCtx) {
        window.sawEvaluationActualClassificationChart = new Chart(classificationCtx, {
            // ... chart config
        });
    }
    
    if (metricsCtx) {
        window.sawEvaluationActualMetricsChart = new Chart(metricsCtx, {
            // ... chart config
        });
    }
}
```

## Common Related Error: "destroy is not a function"

### Error Message
```
TypeError: window.sawEvaluationActualClassificationChart.destroy is not a function
```

### Penyebab
- Chart variable berisi bukan Chart.js instance yang valid
- Variable diset ke value lain (string, number, object biasa, dll)
- Chart belum diinisialisasi dengan benar

### Solusi
Selalu cek type sebelum memanggil destroy:

```javascript
// WRONG - tidak aman
if (window.myChart) {
    window.myChart.destroy();  // Error jika myChart bukan Chart instance
}

// CORRECT - dengan type checking
if (window.myChart && typeof window.myChart.destroy === 'function') {
    try {
        window.myChart.destroy();
    } catch (error) {
        console.warn('Error destroying chart:', error);
    }
}
```

## Best Practices untuk Chart.js

### 1. **Selalu Destroy Chart Sebelum Re-initialization (BEST PRACTICE)**
```javascript
const ctx = document.getElementById('myChart');
if (!ctx) return;

// Method 1: Destroy chart dari canvas (Chart.js API - RECOMMENDED)
const existingChart = Chart.getChart(ctx);
if (existingChart) {
    existingChart.destroy();
}

// Method 2: Destroy chart dari property/variable (fallback)
if (this.myChart && typeof this.myChart.destroy === 'function') {
    try {
        this.myChart.destroy();
    } catch (error) {
        console.warn('Error destroying chart:', error);
    }
    this.myChart = null;
}

// Sekarang aman untuk membuat chart baru
this.myChart = new Chart(ctx, config);
```

**Penjelasan**:
- `Chart.getChart(canvas)` adalah API resmi Chart.js v3+ untuk mendapatkan chart instance yang terikat pada canvas
- Ini adalah cara paling aman karena langsung mengakses Chart.js internal tracking
- Kombinasi kedua method memastikan cleanup sempurna

### 2. **Gunakan Reference yang Konsisten**
```javascript
// Good: Gunakan instance property
class MyModule {
    constructor() {
        this.chart = null;
    }
    
    initChart() {
        if (this.chart) {
            this.chart.destroy();
        }
        this.chart = new Chart(ctx, config);
    }
}

// Good: Gunakan window global untuk cross-module access
if (window.myChart) {
    window.myChart.destroy();
}
window.myChart = new Chart(ctx, config);
```

### 3. **Chart.getChart() API - The Official Way**
```javascript
const ctx = document.getElementById('myChart');
if (!ctx) {
    console.error('Canvas element not found');
    return;
}

// Chart.getChart() returns the chart instance registered to canvas
// Returns undefined if no chart is registered
const existingChart = Chart.getChart(ctx);
if (existingChart) {
    console.log('Found existing chart, destroying it');
    existingChart.destroy();
}

// Now safe to create new chart
const myChart = new Chart(ctx, config);
```

**Keuntungan menggunakan `Chart.getChart()`**:
- ✅ API resmi Chart.js v3+ 
- ✅ Akses langsung ke Chart.js internal registry
- ✅ Tidak bergantung pada variable/property eksternal
- ✅ Selalu akurat karena menggunakan canvas sebagai key
- ✅ Mencegah "Canvas is already in use" error

### 4. **Module Cleanup di SPA**
```javascript
class MyModule {
    constructor() {
        this.charts = [];
    }
    
    createChart(ctx, config) {
        const chart = new Chart(ctx, config);
        this.charts.push(chart);
        return chart;
    }
    
    cleanup() {
        // Destroy all charts when module is unloaded
        this.charts.forEach(chart => chart.destroy());
        this.charts = [];
    }
}
```

## Verifikasi Perbaikan

### 1. **Test Multiple Page Loads**
```javascript
// Refresh halaman beberapa kali
location.reload();
```

### 2. **Test SPA Navigation**
```javascript
// Navigate ke halaman lain dan kembali
window.location.hash = '#other-page';
window.location.hash = '#saw-evaluation';
```

### 3. **Check Console for Errors**
- Buka Developer Console (F12)
- Tidak ada error Chart.js saat inisialisasi
- Tidak ada warning tentang memory leak

### 4. **Memory Profiling**
- Gunakan Chrome DevTools Memory tab
- Take heap snapshot sebelum dan sesudah navigation
- Pastikan tidak ada memory leak dari chart instances

## Dampak Perbaikan

### ✅ Sebelum Perbaikan
- ❌ Error "Canvas is already in use" muncul di console
- ❌ Chart tidak dapat di-render ulang
- ❌ Module initialization gagal
- ❌ Potential memory leak dari chart instances yang tidak dihancurkan

### ✅ Setelah Perbaikan
- ✅ Tidak ada error saat module diinisialisasi ulang
- ✅ Chart dapat di-render ulang dengan data baru
- ✅ Module initialization selalu berhasil
- ✅ Cleanup yang proper mencegah memory leak
- ✅ Smooth navigation di SPA tanpa error

## Prevention Guidelines

### Untuk Developer:

1. **Selalu Cek Chart Instance Sebelum Create**
   ```javascript
   if (this.chart) {
       this.chart.destroy();
   }
   ```

2. **Gunakan Try-Catch untuk Robustness**
   ```javascript
   try {
       if (this.chart) {
           this.chart.destroy();
       }
       this.chart = new Chart(ctx, config);
   } catch (error) {
       console.error('Error initializing chart:', error);
   }
   ```

3. **Set Reference ke Null Setelah Destroy**
   ```javascript
   if (this.chart) {
       this.chart.destroy();
       this.chart = null;  // Important!
   }
   ```

4. **Document Chart Lifecycle**
   - Dokumentasikan kapan chart dibuat
   - Dokumentasikan kapan chart dihancurkan
   - Dokumentasikan scope dari chart reference

## Referensi

- **Chart.js Documentation**: [Destroying Charts](https://www.chartjs.org/docs/latest/developers/api.html#destroy)
- **MDN Web Docs**: [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- **Memory Management**: [JavaScript Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)

## Related Issues

- **Issue**: Duplicate ID warning untuk NIM input
- **Issue**: Canvas element visibility di SPA
- **Issue**: Module initialization order

## Changelog Reference

Lihat `CHANGELOG.md` section **"Chart.js Canvas Reuse Error"** untuk detail lengkap perubahan.

---

**Tanggal Dibuat**: 2025-07-22  
**Terakhir Diperbarui**: 2025-07-22  
**Status**: ✅ Resolved

