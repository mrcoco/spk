# Endpoint Batch SAW dengan Data Berlabel

## Ringkasan

Endpoint baru `/api/saw/batch-labeled` untuk menghitung klasifikasi SAW batch menggunakan normalisasi min/max dari data berlabel saja, membuat hasil konsisten dengan evaluasi SAW dengan data aktual.

## Endpoint

### GET `/api/saw/batch-labeled`

Menghitung SAW untuk semua mahasiswa menggunakan normalisasi dari data berlabel.

#### Deskripsi

- **Method**: `GET`
- **Path**: `/api/saw/batch-labeled`
- **Authentication**: Tidak diperlukan (sesuai konfigurasi router)

#### Perbedaan dengan `/api/saw/batch`

| Aspek | `/api/saw/batch` | `/api/saw/batch-labeled` |
|-------|------------------|--------------------------|
| **Sumber Min/Max** | Seluruh data (~9814 records) | Data berlabel saja (~658 records) |
| **Konsistensi** | Tidak konsisten dengan evaluasi | Konsisten dengan evaluasi aktual |
| **Use Case** | Klasifikasi umum | Klasifikasi dengan konteks evaluasi |

#### Response

**Success (200 OK):**
```json
{
    "total_mahasiswa": 9814,
    "labeled_data_count": 658,
    "message": "Hasil SAW telah disimpan ke database (normalisasi dari data berlabel)",
    "normalization_source": "labeled_data_only",
    "description": "Min/max dihitung dari data dengan status_lulus_aktual (LULUS_TINGGI, LULUS_SEDANG, LULUS_KECIL)",
    "data": [
        {
            "nim": "19812141001",
            "nama": "Mahasiswa 1",
            "program_studi": "Teknik Informatika",
            "ipk": 3.5,
            "sks": 120,
            "persen_dek": 15.5,
            "ipk_norm": 0.875,
            "sks_norm": 0.857,
            "nilai_dek_norm": 0.823,
            "skor_saw": 0.852,
            "klasifikasi_saw": "Peluang Lulus Tinggi"
        },
        ...
    ]
}
```

**Error (500 Internal Server Error):**
```json
{
    "detail": "Terjadi kesalahan saat menghitung SAW batch dengan data berlabel: <error message>"
}
```

#### Field Response

- `total_mahasiswa`: Jumlah total mahasiswa yang diklasifikasi (semua mahasiswa)
- `labeled_data_count`: Jumlah data yang digunakan untuk normalisasi (hanya data berlabel)
- `message`: Pesan sukses
- `normalization_source`: Sumber normalisasi (`"labeled_data_only"`)
- `description`: Penjelasan tentang sumber normalisasi
- `data`: Array hasil klasifikasi untuk semua mahasiswa

## Implementasi

### Backend

**File**: `src/backend/routers/saw.py`

```python
@router.get("/batch-labeled")
def calculate_saw_batch_labeled(db: Session = Depends(get_db)):
    """
    Menghitung SAW untuk semua mahasiswa (batch processing) menggunakan data berlabel untuk normalisasi
    
    Normalisasi min/max dihitung HANYA dari data mahasiswa yang memiliki status_lulus_aktual:
    - LULUS_TINGGI
    - LULUS_SEDANG
    - LULUS_KECIL
    
    Ini membuat hasil klasifikasi batch SAW konsisten dengan hasil evaluasi SAW dengan data aktual.
    """
    try:
        # Hitung jumlah data berlabel untuk informasi
        labeled_count = db.query(Mahasiswa).filter(
            Mahasiswa.status_lulus_aktual.in_(['LULUS_TINGGI', 'LULUS_SEDANG', 'LULUS_KECIL']),
            Mahasiswa.ipk.isnot(None),
            Mahasiswa.sks.isnot(None),
            Mahasiswa.persen_dek.isnot(None)
        ).count()
        
        # Hitung SAW dengan normalisasi dari data berlabel
        results = batch_calculate_saw(db, save_to_db=True, use_labeled_data_only=True)
        
        return {
            "total_mahasiswa": len(results),
            "labeled_data_count": labeled_count,
            "message": "Hasil SAW telah disimpan ke database (normalisasi dari data berlabel)",
            "normalization_source": "labeled_data_only",
            "description": "Min/max dihitung dari data dengan status_lulus_aktual (LULUS_TINGGI, LULUS_SEDANG, LULUS_KECIL)",
            "data": results
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat menghitung SAW batch dengan data berlabel: {str(e)}"
        )
```

**File**: `src/backend/saw_logic.py`

Fungsi `batch_calculate_saw()` telah dimodifikasi untuk menerima parameter `use_labeled_data_only`:

```python
def batch_calculate_saw(
    db: Session, 
    save_to_db: bool = True, 
    use_labeled_data_only: bool = False
) -> List[Dict[str, Any]]:
    """
    Args:
        use_labeled_data_only: Jika True, min/max dihitung hanya dari data yang memiliki 
                              status_lulus_aktual (LULUS_TINGGI, LULUS_SEDANG, LULUS_KECIL). 
                              Default: False (menggunakan seluruh data)
    """
```

## Penggunaan

### cURL

```bash
# Hitung SAW batch dengan normalisasi dari data berlabel
curl -X GET "http://localhost:8000/api/saw/batch-labeled"
```

### JavaScript (jQuery)

```javascript
$.ajax({
    url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.SAW + '/batch-labeled'),
    type: 'GET',
    success: function(response) {
        console.log('Total mahasiswa:', response.total_mahasiswa);
        console.log('Data berlabel:', response.labeled_data_count);
        console.log('Sumber normalisasi:', response.normalization_source);
        console.log('Hasil klasifikasi:', response.data);
    },
    error: function(xhr, status, error) {
        console.error('Error:', error);
    }
});
```

### Python (requests)

```python
import requests

response = requests.get('http://localhost:8000/api/saw/batch-labeled')
data = response.json()

print(f"Total mahasiswa: {data['total_mahasiswa']}")
print(f"Data berlabel: {data['labeled_data_count']}")
print(f"Sumber normalisasi: {data['normalization_source']}")
```

## Kapan Menggunakan

### Gunakan `/api/saw/batch-labeled` jika:

1. ✅ Ingin hasil klasifikasi batch konsisten dengan evaluasi SAW aktual
2. ✅ Ingin menggunakan konteks normalisasi yang sama dengan data evaluasi
3. ✅ Fokus pada analisis data yang sudah memiliki ground truth
4. ✅ Ingin membandingkan hasil batch dengan hasil evaluasi

### Gunakan `/api/saw/batch` jika:

1. ✅ Ingin klasifikasi untuk semua mahasiswa dengan konteks yang lebih luas
2. ✅ Ingin monitoring dan klasifikasi umum
3. ✅ Tidak perlu konsistensi dengan evaluasi aktual

## Perbandingan Hasil

### Contoh Perbedaan Normalisasi

**Dengan `/api/saw/batch` (seluruh data):**
- IPK max: 4.0 (dari seluruh 9814 records)
- SKS max: 200 (dari seluruh 9814 records)
- D/E/K min: 0.0, max: 100.0 (dari seluruh 9814 records)

**Dengan `/api/saw/batch-labeled` (data berlabel):**
- IPK max: 3.95 (dari 658 records berlabel)
- SKS max: 180 (dari 658 records berlabel)
- D/E/K min: 5.0, max: 85.0 (dari 658 records berlabel)

Perbedaan ini akan mempengaruhi nilai normalisasi dan skor SAW akhir, sehingga klasifikasi bisa berbeda.

## Testing

### Manual Test

1. **Test endpoint baru:**
   ```bash
   curl -X GET "http://localhost:8000/api/saw/batch-labeled"
   ```

2. **Verifikasi response:**
   - Pastikan `normalization_source` = `"labeled_data_only"`
   - Pastikan `labeled_data_count` = 658 (atau sesuai jumlah data berlabel)
   - Pastikan `total_mahasiswa` = jumlah total mahasiswa

3. **Bandingkan dengan endpoint lama:**
   ```bash
   curl -X GET "http://localhost:8000/api/saw/batch"
   ```
   - Bandingkan nilai min/max yang digunakan
   - Bandingkan hasil klasifikasi untuk beberapa mahasiswa

### Automated Test

```python
def test_batch_labeled_endpoint():
    response = client.get("/api/saw/batch-labeled")
    assert response.status_code == 200
    data = response.json()
    assert data["normalization_source"] == "labeled_data_only"
    assert "labeled_data_count" in data
    assert data["labeled_data_count"] > 0
    assert len(data["data"]) > 0
```

## Catatan Penting

1. **Backward Compatibility**: Endpoint `/api/saw/batch` tetap berfungsi seperti sebelumnya
2. **Database Update**: Kedua endpoint akan menyimpan hasil ke database (jika `save_to_db=True`)
3. **Performance**: `/api/saw/batch-labeled` mungkin sedikit lebih cepat karena query min/max lebih kecil
4. **Konsistensi**: Hasil dari `/api/saw/batch-labeled` akan konsisten dengan hasil evaluasi SAW aktual

## Troubleshooting

### Error: "Tidak ada data berlabel"

**Penyebab**: Tidak ada data dengan `status_lulus_aktual` yang valid.

**Solusi**: Pastikan ada data dengan status:
- `LULUS_TINGGI`
- `LULUS_SEDANG`
- `LULUS_KECIL`

### Error: "Minimal diperlukan 10 data mahasiswa"

**Penyebab**: Data berlabel kurang dari 10 records.

**Solusi**: Tambahkan lebih banyak data dengan status lulus aktual.

## Kesimpulan

Endpoint `/api/saw/batch-labeled` memberikan opsi untuk menggunakan normalisasi dari data berlabel, membuat hasil klasifikasi batch SAW konsisten dengan evaluasi SAW dengan data aktual. Ini berguna untuk analisis yang memerlukan konsistensi antara klasifikasi batch dan evaluasi aktual.

