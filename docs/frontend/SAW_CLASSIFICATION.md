# SAW Classification - Dokumentasi

## Overview

Fitur klasifikasi SAW (Simple Additive Weighting) pada halaman mahasiswa memungkinkan pengguna untuk melakukan klasifikasi individual mahasiswa menggunakan algoritma SAW yang telah diimplementasi di backend.

## Fitur Klasifikasi SAW

### 1. Individual Classification
- **Per Mahasiswa**: Klasifikasi dapat dilakukan untuk setiap mahasiswa individual
- **Real-time Calculation**: Perhitungan dilakukan secara real-time dari backend
- **Instant Results**: Hasil klasifikasi ditampilkan dalam dialog window

### 2. Detailed Results Display
- **Klasifikasi**: Hasil klasifikasi (Tinggi/Sedang/Kecil)
- **Nilai Akhir**: Final score SAW dengan 4 digit desimal
- **Data Kriteria**: Nilai IPK, SKS, dan Persentase D/E/K
- **Nilai Normalisasi**: Nilai yang sudah dinormalisasi
- **Nilai Tertimbang**: Nilai setelah pembobotan

### 3. User Interface
- **Dialog Window**: Window 600px dengan layout yang rapi
- **Loading Animation**: Icon spinning saat proses klasifikasi
- **Error Handling**: Penanganan error yang komprehensif
- **Success Notification**: Notifikasi sukses setelah klasifikasi

## Implementasi Teknis

### JavaScript Function

```javascript
function showKlasifikasiSAW(e, element) {
    // Pastikan CONFIG tersedia
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG tidak tersedia di showKlasifikasiSAW');
        showNotification("Error", "Konfigurasi aplikasi belum siap", "error");
        return;
    }

    e.preventDefault();
    var grid = $("#mahasiswaGrid").data("kendoGrid");
    var dataItem = grid.dataItem($(element).closest("tr"));
    
    // Tampilkan loading
    $(element).find('.fa-chart-line').addClass('fa-spin');
    
    // Ambil data klasifikasi SAW dari server
    $.ajax({
        url: `${CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW)}/calculate/${dataItem.nim}`,
        type: "GET",
        success: function(response) {
            // Tampilkan hasil dalam dialog window
            // ...
        },
        error: function(xhr) {
            // Handle error
        },
        complete: function() {
            // Hentikan animasi icon
            $(element).find('.fa-chart-line').removeClass('fa-spin');
        }
    });
}
```

### API Endpoint

```http
GET /api/saw/calculate/{nim}
```

### Response Structure

```json
{
    "nim": "12345678",
    "nama": "John Doe",
    "ipk": 3.5,
    "sks": 120,
    "persen_dek": 15.5,
    "criteria_values": {
        "ipk": 3.5,
        "sks": 120,
        "persen_dek": 15.5
    },
    "normalized_values": {
        "ipk": 0.8750,
        "sks": 1.0000,
        "persen_dek": 0.7750
    },
    "weighted_values": {
        "ipk": 0.2625,
        "sks": 0.4000,
        "persen_dek": 0.2325
    },
    "final_value": 0.8950,
    "klasifikasi": "Tinggi"
}
```

## UI Components

### Dialog Window Content

```html
<div class="k-content k-window-content k-dialog-content">
    <div style="margin-bottom: 20px;">
        <h3>Hasil Klasifikasi SAW</h3>
        <p><strong>NIM:</strong> ${response.nim}</p>
        <p><strong>Nama:</strong> ${response.nama}</p>
        <p><strong>Program Studi:</strong> ${dataItem.program_studi}</p>
    </div>
    <div class="k-form">
        <div class="k-form-field">
            <label><strong>Klasifikasi:</strong></label>
            <span class="k-form-field-text">${response.klasifikasi}</span>
        </div>
        <div class="k-form-field">
            <label><strong>Nilai Akhir:</strong></label>
            <span class="k-form-field-text">${response.final_value.toFixed(4)}</span>
        </div>
        <!-- Additional fields... -->
    </div>
</div>
```

### Kendo Dialog Configuration

```javascript
dialogDiv.kendoDialog({
    width: "600px",
    title: "Klasifikasi SAW - Peluang Kelulusan",
    content: windowContent,
    actions: [
        { text: "Tutup" }
    ],
    close: function() {
        dialogDiv.data("kendoDialog").destroy();
        dialogDiv.remove();
    }
}).data("kendoDialog").open();
```

## Data Flow

### 1. User Interaction
1. User mengklik tombol "SAW" pada baris mahasiswa
2. Event handler `showKlasifikasiSAW` dipanggil
3. Loading animation dimulai

### 2. API Request
1. AJAX request dikirim ke `/api/saw/calculate/{nim}`
2. Backend melakukan perhitungan SAW
3. Response dikembalikan dengan data lengkap

### 3. Result Display
1. Dialog window dibuat dengan data response
2. Hasil klasifikasi ditampilkan
3. Success notification ditampilkan
4. Loading animation dihentikan

## Error Handling

### Network Errors
```javascript
error: function(xhr) {
    let errorMessage = "Gagal mengambil data klasifikasi SAW";
    if (xhr.responseJSON && xhr.responseJSON.detail) {
        errorMessage += ": " + xhr.responseJSON.detail;
    }
    showNotification("error", "Error", errorMessage);
}
```

### Configuration Errors
```javascript
if (typeof CONFIG === 'undefined') {
    console.error('❌ CONFIG tidak tersedia di showKlasifikasiSAW');
    showNotification("Error", "Konfigurasi aplikasi belum siap", "error");
    return;
}
```

## SAW Algorithm Details

### Criteria Values
- **IPK**: Indeks Prestasi Kumulatif (0-4)
- **SKS**: Total SKS yang telah ditempuh
- **Persentase D/E/K**: Persentase nilai D, E, dan K

### Normalization
- **Benefit Criteria**: IPK dan SKS (semakin tinggi semakin baik)
- **Cost Criteria**: Persentase D/E/K (semakin rendah semakin baik)

### Weighting
- **IPK**: 30% (0.3)
- **SKS**: 40% (0.4)
- **Persentase D/E/K**: 30% (0.3)

### Classification
- **Tinggi**: Final value >= 0.8
- **Sedang**: 0.6 <= Final value < 0.8
- **Kecil**: Final value < 0.6

## Integration Points

### Grid Integration
```javascript
{
    name: "klasifikasiSAW",
    text: "Klasifikasi SAW",
    click: showKlasifikasiSAW,
    template: '<a class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-success" href="\\#" onclick="showKlasifikasiSAW(event, this);"><i class="fas fa-chart-line"></i> <span class="k-button-text">SAW</span></a>'
}
```

### Configuration Integration
```javascript
ENDPOINTS: {
    SAW: `${this.API_PREFIX}/saw`,
    // ...
}
```

## Performance Considerations

### Caching
- **No Caching**: Setiap request melakukan perhitungan ulang
- **Real-time**: Data selalu fresh dan akurat
- **Database Storage**: Hasil disimpan ke database untuk tracking

### Loading States
- **Visual Feedback**: Icon spinning saat proses
- **User Experience**: User tahu bahwa proses sedang berjalan
- **Timeout Handling**: Proper timeout untuk request yang lama

## Testing Scenarios

### Success Cases
1. **Valid NIM**: Mahasiswa dengan data lengkap
2. **Normal Values**: IPK, SKS, dan persentase normal
3. **Edge Cases**: Nilai maksimum dan minimum

### Error Cases
1. **Invalid NIM**: NIM yang tidak ada di database
2. **Network Error**: Koneksi terputus
3. **Server Error**: Backend error
4. **Missing Data**: Data mahasiswa tidak lengkap

## Future Enhancements

### 1. Batch Classification
- **Multiple Selection**: Pilih beberapa mahasiswa sekaligus
- **Batch Processing**: Klasifikasi batch untuk efisiensi
- **Progress Indicator**: Progress bar untuk batch processing

### 2. Comparison Features
- **FIS vs SAW**: Perbandingan hasil FIS dan SAW
- **Side-by-side**: Tampilan perbandingan side-by-side
- **Consistency Check**: Pengecekan konsistensi hasil

### 3. Export Features
- **PDF Export**: Export hasil ke PDF
- **Excel Export**: Export hasil ke Excel
- **Report Generation**: Generate laporan klasifikasi

### 4. Advanced UI
- **Charts**: Visualisasi hasil dengan charts
- **Trends**: Analisis trend klasifikasi
- **Filters**: Filter berdasarkan hasil klasifikasi

## Troubleshooting

### Common Issues

1. **Button tidak berfungsi**
   - Pastikan event handler terpasang dengan benar
   - Check console untuk error JavaScript
   - Pastikan CONFIG tersedia

2. **API request gagal**
   - Check network connectivity
   - Verify endpoint URL
   - Check backend logs

3. **Dialog tidak muncul**
   - Pastikan Kendo UI dimuat dengan benar
   - Check CSS untuk styling dialog
   - Verify DOM manipulation

### Debug Tips

```javascript
// Debug function call
console.log("showKlasifikasiSAW called with:", dataItem);

// Debug API response
console.log("SAW API response:", response);

// Debug dialog creation
console.log("Dialog created:", dialogDiv);
```

## Best Practices

1. **Error Handling**: Selalu handle error dengan proper
2. **Loading States**: Berikan feedback visual saat loading
3. **Data Validation**: Validasi data sebelum display
4. **User Feedback**: Berikan notifikasi yang jelas
5. **Performance**: Optimalkan request dan response 