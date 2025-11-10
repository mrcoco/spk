# Perbaikan Tampilan Perbandingan FIS dan SAW dengan Data Actual

## Masalah
Halaman perbandingan FIS dan SAW (section `comparisonSection`) menampilkan data dari evaluasi synthetic, bukan dari evaluasi dengan data aktual kelulusan mahasiswa.

## Penyebab
Fungsi `loadComparisonData()` di `comparison.js` menggunakan endpoint `/api/comparison/methods` yang menghitung perbandingan secara real-time dari seluruh data mahasiswa tanpa menggunakan data actual evaluation yang sudah tersedia di endpoint `/api/fuzzy/evaluate-actual` dan `/api/saw/evaluate-actual`.

## Solusi
Mengubah fungsi `loadComparisonData()` untuk mengambil data dari endpoint evaluasi actual FIS dan SAW, kemudian menggabungkan dan menampilkan data tersebut.

## Perubahan Kode

### 1. Load Data dari Evaluasi Actual (Paralel)

```javascript
function loadComparisonData() {
    console.log('=== LOADING COMPARISON DATA FROM ACTUAL EVALUATION ===');
    
    showComparisonLoading();
    
    // Load data dari evaluasi FIS dan SAW actual secara paralel
    Promise.all([
        loadFISActualEvaluation(),
        loadSAWActualEvaluation()
    ]).then(([fisData, sawData]) => {
        // Gabungkan data FIS dan SAW untuk perbandingan
        const comparisonData = combineEvaluationData(fisData, sawData);
        
        // Simpan response lengkap untuk akses data
        window._fisActualData = fisData;
        window._sawActualData = sawData;
        window._comparisonData = comparisonData;
        
        // Update UI
        updateComparisonStatsFromActual(fisData, sawData, comparisonData);
        updateComparisonChartFromActual(fisData, sawData);
        initializeComparisonGrid(comparisonData);
        
        hideComparisonLoading();
    }).catch(error => {
        hideComparisonLoading();
        showComparisonError("Error loading comparison data: " + error.message);
    });
}
```

### 2. Load FIS Actual Evaluation

```javascript
function loadFISActualEvaluation() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.FUZZY + '/evaluate-actual'),
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                test_size: 0.3,
                random_state: 42,
                save_to_db: false
            }),
            timeout: 60000,
            success: function(response) {
                if (response && response.evaluation) {
                    resolve(response.evaluation);
                } else {
                    reject(new Error('Invalid FIS evaluation response'));
                }
            },
            error: function(xhr, status, error) {
                reject(new Error('FIS Evaluation API error: ' + error));
            }
        });
    });
}
```

### 3. Load SAW Actual Evaluation

```javascript
function loadSAWActualEvaluation() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW + '/evaluate-actual'),
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                weights: { ipk: 0.4, sks: 0.35, dek: 0.25 },
                test_size: 0.3,
                random_state: 42,
                save_to_db: false
            }),
            timeout: 60000,
            success: function(response) {
                if (response && response.evaluation) {
                    resolve(response.evaluation);
                } else {
                    reject(new Error('Invalid SAW evaluation response'));
                }
            },
            error: function(xhr, status, error) {
                reject(new Error('SAW Evaluation API error: ' + error));
            }
        });
    });
}
```

### 4. Combine Evaluation Data

```javascript
function combineEvaluationData(fisData, sawData) {
    const comparisonData = [];
    
    // Ambil results dari FIS dan SAW
    const fisResults = fisData.results || [];
    const sawResults = sawData.results || [];
    
    // Buat map SAW results berdasarkan NIM untuk lookup cepat
    const sawMap = {};
    sawResults.forEach(item => {
        sawMap[item.nim] = item;
    });
    
    // Gabungkan data berdasarkan NIM
    fisResults.forEach(fisItem => {
        const sawItem = sawMap[fisItem.nim];
        
        if (sawItem) {
            const is_consistent = fisItem.predicted_class === sawItem.predicted_class;
            const nilai_selisih = Math.abs(fisItem.final_value - sawItem.final_value);
            
            comparisonData.push({
                nim: fisItem.nim,
                nama: fisItem.nama,
                ipk: fisItem.ipk,
                sks: fisItem.sks,
                persen_dek: fisItem.persen_dek,
                fis_kategori: fisItem.predicted_class,
                fis_nilai: fisItem.final_value,
                saw_kategori: sawItem.predicted_class,
                saw_nilai: sawItem.final_value,
                actual_status: fisItem.actual_status || sawItem.actual_status,
                actual_class: fisItem.actual_class,
                is_consistent: is_consistent,
                nilai_selisih: nilai_selisih,
                selisih_category: getSelisihCategory(nilai_selisih),
                fis_correct: fisItem.is_correct,
                saw_correct: sawItem.is_correct
            });
        }
    });
    
    return comparisonData;
}
```

### 5. Update Stats dari Data Actual

```javascript
function updateComparisonStatsFromActual(fisData, sawData, comparisonData) {
    // Hitung statistik
    const totalData = comparisonData.length;
    const totalConsistent = comparisonData.filter(item => item.is_consistent).length;
    const totalDifferent = totalData - totalConsistent;
    
    // Hitung akurasi masing-masing metode
    const fisAccuracy = (fisData.accuracy * 100).toFixed(2);
    const sawAccuracy = (sawData.accuracy * 100).toFixed(2);
    
    // Hitung korelasi ranking
    const rankingCorrelation = calculateRankingCorrelation(comparisonData);
    
    // Update UI elements
    $('#fisTotal').text(fisData.test_data || 0);
    $('#fisAkurasi').text(fisAccuracy + '%');
    $('#sawTotal').text(sawData.test_data || 0);
    $('#sawAkurasi').text(sawAccuracy + '%');
    $('#statConsistent').text(totalConsistent);
    $('#statDifferent').text(totalDifferent);
    $('#statCorrelation').text(rankingCorrelation.toFixed(3));
}
```

### 6. Calculate Ranking Correlation

```javascript
function calculateRankingCorrelation(comparisonData) {
    const n = comparisonData.length;
    if (n === 0) return 0;
    
    // Sort by FIS nilai
    const fisSorted = [...comparisonData].sort((a, b) => b.fis_nilai - a.fis_nilai);
    const fisRankMap = {};
    fisSorted.forEach((item, index) => {
        fisRankMap[item.nim] = index + 1;
    });
    
    // Sort by SAW nilai
    const sawSorted = [...comparisonData].sort((a, b) => b.saw_nilai - a.saw_nilai);
    const sawRankMap = {};
    sawSorted.forEach((item, index) => {
        sawRankMap[item.nim] = index + 1;
    });
    
    // Calculate Spearman's rank correlation
    let sumDSquared = 0;
    comparisonData.forEach(item => {
        const d = fisRankMap[item.nim] - sawRankMap[item.nim];
        sumDSquared += d * d;
    });
    
    const correlation = 1 - (6 * sumDSquared) / (n * (n * n - 1));
    return correlation;
}
```

### 7. Update Chart dari Data Actual

```javascript
function updateComparisonChartFromActual(fisData, sawData) {
    // Hitung distribusi dari classification_distribution
    const fisDistribution = fisData.classification_distribution || { tinggi: 0, sedang: 0, kecil: 0 };
    const sawDistribution = sawData.classification_distribution || { tinggi: 0, sedang: 0, kecil: 0 };
    
    const categories = ["Tinggi", "Sedang", "Kecil"];
    const fisValues = [fisDistribution.tinggi || 0, fisDistribution.sedang || 0, fisDistribution.kecil || 0];
    const sawValues = [sawDistribution.tinggi || 0, sawDistribution.sedang || 0, sawDistribution.kecil || 0];
    
    const chartElement = $('#comparisonChart');
    chartElement.empty();
    
    chartElement.kendoChart({
        title: { text: "Perbandingan Distribusi Klasifikasi FIS vs SAW (Data Aktual)" },
        legend: { position: "bottom" },
        chartArea: { background: "" },
        series: [
            { 
                type: "column", 
                name: "FIS", 
                data: fisValues, 
                color: "#3498db",
                labels: {
                    visible: true,
                    template: "#= value #"
                }
            },
            { 
                type: "column", 
                name: "SAW", 
                data: sawValues, 
                color: "#e74c3c",
                labels: {
                    visible: true,
                    template: "#= value #"
                }
            }
        ],
        valueAxis: {
            labels: { format: "{0}" },
            line: { visible: false },
            axisCrossingValue: 0,
            title: { text: "Jumlah Mahasiswa" }
        },
        categoryAxis: {
            categories: categories,
            line: { visible: false },
            labels: { padding: { top: 10 } },
            title: { text: "Klasifikasi Peluang Lulus" }
        },
        tooltip: {
            visible: true,
            template: "Peluang Lulus #= category #: #= value # mahasiswa (#= series.name #)"
        },
        height: 450,
        autoFit: true
    });
}
```

## Struktur Data yang Digunakan

### FIS Evaluation Response
```json
{
  "evaluation": {
    "total_data": 1604,
    "training_data": 1122,
    "test_data": 482,
    "accuracy": 0.8381,
    "precision": 0.8234,
    "recall": 0.8156,
    "f1_score": 0.8195,
    "classification_distribution": {
      "tinggi": 450,
      "sedang": 20,
      "kecil": 12
    },
    "results": [
      {
        "nim": "19812141001",
        "nama": "John Doe",
        "ipk": 3.5,
        "sks": 120,
        "persen_dek": 5.0,
        "actual_status": "LULUS",
        "actual_class": "Peluang Lulus Tinggi",
        "predicted_class": "Peluang Lulus Tinggi",
        "final_value": 0.85,
        "is_correct": true
      }
    ]
  }
}
```

### SAW Evaluation Response
```json
{
  "evaluation": {
    "total_data": 1604,
    "training_data": 1122,
    "test_data": 482,
    "accuracy": 0.8298,
    "precision": 0.8150,
    "recall": 0.8089,
    "f1_score": 0.8119,
    "classification_distribution": {
      "tinggi": 460,
      "sedang": 15,
      "kecil": 7
    },
    "results": [
      {
        "nim": "19812141001",
        "nama": "John Doe",
        "ipk": 3.5,
        "sks": 120,
        "persen_dek": 5.0,
        "actual_status": "LULUS",
        "actual_class": "Peluang Lulus Tinggi",
        "predicted_class": "Peluang Lulus Tinggi",
        "final_value": 0.82,
        "is_correct": true
      }
    ]
  }
}
```

### Combined Comparison Data
```javascript
[
  {
    nim: "19812141001",
    nama: "John Doe",
    ipk: 3.5,
    sks: 120,
    persen_dek: 5.0,
    fis_kategori: "Peluang Lulus Tinggi",
    fis_nilai: 0.85,
    saw_kategori: "Peluang Lulus Tinggi",
    saw_nilai: 0.82,
    actual_status: "LULUS",
    actual_class: "Peluang Lulus Tinggi",
    is_consistent: true,
    nilai_selisih: 0.03,
    selisih_category: "Sangat Mirip",
    fis_correct: true,
    saw_correct: true
  }
]
```

## Alur Eksekusi

1. **Load Data Paralel**: Panggil endpoint FIS dan SAW evaluation actual secara bersamaan menggunakan `Promise.all`
2. **Combine Data**: Gabungkan hasil evaluasi berdasarkan NIM mahasiswa
3. **Calculate Stats**: Hitung statistik perbandingan (konsisten, berbeda, korelasi ranking)
4. **Update UI**: 
   - Update statistik FIS (total, akurasi)
   - Update statistik SAW (total, akurasi)
   - Update statistik lain (konsisten, berbeda, korelasi)
   - Update chart distribusi klasifikasi
   - Initialize grid dengan data perbandingan

## Metrik yang Ditampilkan

### Statistik FIS
- Total data test: Jumlah mahasiswa dalam data test
- Akurasi: Persentase prediksi yang benar

### Statistik SAW
- Total data test: Jumlah mahasiswa dalam data test
- Akurasi: Persentase prediksi yang benar

### Statistik Perbandingan
- Konsisten: Jumlah mahasiswa dengan hasil klasifikasi yang sama antara FIS dan SAW
- Berbeda: Jumlah mahasiswa dengan hasil klasifikasi yang berbeda
- Korelasi Ranking: Korelasi Spearman antara ranking FIS dan SAW

## Verifikasi

Setelah perbaikan, halaman comparison akan:
- ✅ Menampilkan data dari evaluasi actual (bukan synthetic)
- ✅ Menampilkan akurasi FIS dan SAW berdasarkan data aktual kelulusan
- ✅ Menampilkan distribusi klasifikasi yang akurat
- ✅ Menampilkan statistik perbandingan yang konsisten
- ✅ Menampilkan chart distribusi dengan data yang benar
- ✅ Menampilkan grid perbandingan detail per mahasiswa
- ✅ Menampilkan korelasi ranking yang akurat

## File yang Diubah
- `src/frontend/js/comparison.js` - Load data dari evaluasi actual, combine data, update stats dan chart

## Testing

1. Buka halaman "Perbandingan Metode" di aplikasi
2. Tunggu hingga data selesai dimuat (loading indicator hilang)
3. Verifikasi bahwa:
   - Statistik FIS menampilkan total data test dan akurasi dari evaluasi actual
   - Statistik SAW menampilkan total data test dan akurasi dari evaluasi actual
   - Statistik lain menampilkan jumlah konsisten, berbeda, dan korelasi ranking
   - Chart menampilkan distribusi klasifikasi FIS vs SAW dari data actual
   - Grid menampilkan detail perbandingan per mahasiswa dengan kolom:
     - NIM
     - Nama
     - Hasil FIS (kategori + nilai)
     - Hasil SAW (kategori + nilai)
     - Konsistensi (✓ atau ✗)
     - Selisih Nilai (dengan kategori)
4. Test filter konsistensi pada grid
5. Verify refresh button untuk reload data

## Catatan Penting

### Performance
- Data dimuat secara paralel untuk meningkatkan kecepatan
- Timeout diset 60 detik untuk menunggu evaluasi selesai
- Gunakan caching jika diperlukan untuk menghindari load berulang

### Error Handling
- Tampilkan error message jika salah satu evaluasi gagal
- Log error detail di console untuk debugging
- Fallback ke data kosong jika response tidak valid

### Data Consistency
- Gunakan random_state yang sama (42) untuk konsistensi hasil
- Gunakan test_size yang sama (0.3) untuk kedua evaluasi
- Pastikan data mahasiswa yang digunakan sama

