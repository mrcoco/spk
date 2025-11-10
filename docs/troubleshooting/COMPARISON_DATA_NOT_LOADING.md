# Troubleshooting: Data Tidak Muncul pada Halaman Comparison

## Masalah
Data tidak muncul pada halaman comparison (Perbandingan Metode).

## Kemungkinan Penyebab dan Solusi

### 1. Backend Server Tidak Berjalan
**Penyebab**: Backend API server belum dijalankan atau sudah berhenti.

**Cara Cek**:
```bash
curl http://localhost:8000/api/
```

**Solusi**:
```bash
cd src/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Database Tidak Terhubung
**Penyebab**: Database PostgreSQL tidak running atau connection string salah.

**Cara Cek**:
```bash
psql -h localhost -U your_user -d your_database -c "SELECT COUNT(*) FROM mahasiswa WHERE status_lulus_aktual IS NOT NULL;"
```

**Solusi**:
- Pastikan PostgreSQL running: `sudo systemctl start postgresql` (Linux) atau `brew services start postgresql` (Mac)
- Periksa environment variables di `src/backend/.env`
- Pastikan ada data mahasiswa dengan `status_lulus_aktual` yang tidak null

### 3. Timeout Request
**Penyebab**: Evaluasi actual membutuhkan waktu lama untuk query dan kalkulasi.

**Gejala di Console**:
```
SAW Evaluation API error: timeout
```

**Solusi**:
- Timeout sudah diset 60 detik, tapi bisa ditingkatkan jika perlu
- Periksa performa database dengan:
  ```sql
  EXPLAIN ANALYZE SELECT * FROM mahasiswa WHERE status_lulus_aktual IS NOT NULL;
  ```
- Tambahkan index jika diperlukan:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_mahasiswa_status_lulus_aktual ON mahasiswa(status_lulus_aktual);
  ```

### 4. Data Actual Tidak Ada
**Penyebab**: Tidak ada mahasiswa dengan `status_lulus_aktual` yang terisi.

**Cara Cek**:
```bash
curl http://localhost:8000/api/mahasiswa/ | jq '[.[] | select(.status_lulus_aktual != null)] | length'
```

**Solusi**:
- Pastikan ada data mahasiswa dengan status kelulusan actual
- Minimal perlu 10 data untuk evaluasi
- Update data dengan query:
  ```sql
  UPDATE mahasiswa SET status_lulus_aktual = 'LULUS' WHERE ipk >= 3.0;
  UPDATE mahasiswa SET status_lulus_aktual = 'TIDAK LULUS' WHERE ipk < 2.0;
  ```

### 5. CORS Error
**Penyebab**: Browser memblokir request karena CORS policy.

**Gejala di Console**:
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solusi**:
- Tambahkan CORS middleware di backend `main.py`:
  ```python
  from fastapi.middleware.cors import CORSMiddleware
  
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],  # Atau specify domain frontend
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

### 6. Response Format Tidak Sesuai
**Penyebab**: Response dari API tidak sesuai dengan format yang diharapkan frontend.

**Cara Cek**:
Lihat console browser untuk error seperti:
```
Invalid FIS evaluation response format
Invalid SAW evaluation response format
```

**Solusi**:
- Pastikan endpoint mengembalikan response dengan format:
  ```json
  {
    "evaluation": {
      "total_data": 1604,
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
      "results": [...]
    }
  }
  ```

### 7. JavaScript Error
**Penyebab**: Error dalam kode JavaScript yang menghentikan eksekusi.

**Cara Cek**:
Buka Console Browser (F12) dan lihat error messages.

**Solusi**:
- Periksa apakah CONFIG tersedia: `console.log(CONFIG)`
- Periksa apakah jQuery tersedia: `console.log(typeof $)`
- Periksa apakah Kendo UI tersedia: `console.log(typeof kendo)`

### 8. Section Tidak Visible
**Penyebab**: Section comparison belum ditampilkan saat initialization dipanggil.

**Cara Cek Console**:
```
Comparison section visible: false
```

**Solusi**:
Kode sudah ditambahkan delay 500ms untuk memastikan section visible sebelum load data.

## Debug Checklist

Ikuti checklist ini untuk debug masalah:

1. **[ ] Backend Running**
   ```bash
   curl http://localhost:8000/api/
   ```
   Expected: HTTP 200 dengan response JSON

2. **[ ] Database Connected**
   ```bash
   curl http://localhost:8000/api/mahasiswa/ | jq 'length'
   ```
   Expected: Jumlah mahasiswa > 0

3. **[ ] Data Actual Exists**
   ```bash
   curl http://localhost:8000/api/mahasiswa/ | jq '[.[] | select(.status_lulus_aktual != null)] | length'
   ```
   Expected: Jumlah > 10

4. **[ ] FIS Evaluation Works**
   ```bash
   curl -X POST "http://localhost:8000/api/fuzzy/evaluate-actual" \
     -H "Content-Type: application/json" \
     -d '{"test_size": 0.3, "random_state": 42, "save_to_db": false}'
   ```
   Expected: HTTP 200 dengan evaluation data

5. **[ ] SAW Evaluation Works**
   ```bash
   curl -X POST "http://localhost:8000/api/saw/evaluate-actual" \
     -H "Content-Type: application/json" \
     -d '{"weights": {"ipk": 0.4, "sks": 0.35, "dek": 0.25}, "test_size": 0.3, "random_state": 42, "save_to_db": false}'
   ```
   Expected: HTTP 200 dengan evaluation data

6. **[ ] Frontend Console No Errors**
   - Buka Browser Console (F12)
   - Navigate ke halaman Comparison
   - Check for error messages
   - Check for debug logs

7. **[ ] Loading Indicator Appears**
   - Loading message muncul saat data dimuat
   - Loading message menghilang setelah data selesai/error

8. **[ ] Charts and Grid Visible**
   - Chart distribusi muncul setelah loading
   - Grid detail muncul dengan data
   - Statistics cards terisi

## Console Debug Output

Output console yang normal seharusnya seperti ini:

```
Initializing Comparison section...
jQuery available: true
Kendo UI available: true
CONFIG available: true
CONFIG.ENDPOINTS: {...}
CONFIG.ENDPOINTS.FUZZY: /api/fuzzy
CONFIG.ENDPOINTS.SAW: /api/saw
Comparison section exists: true
Comparison section visible: true
=== LOADING COMPARISON DATA FROM ACTUAL EVALUATION ===
Showing comparison loading...
Loading FIS Actual Evaluation from: http://localhost:8000/api/fuzzy/evaluate-actual
Loading SAW Actual Evaluation from: http://localhost:8000/api/saw/evaluate-actual
Sending FIS evaluation request...
Sending SAW evaluation request...
FIS Evaluation response received: {...}
FIS Evaluation data valid, resolving...
SAW Evaluation response received: {...}
SAW Evaluation data valid, resolving...
Combining FIS and SAW evaluation data...
Combined comparison data: 482 items
Updating comparison stats from actual evaluation...
Calculated stats: {...}
Stats updated successfully
Updating comparison chart from actual evaluation data...
Comparison chart initialized successfully from actual data
Initializing Kendo Grid with data: [...]
Kendo Grid initialized successfully
Hiding comparison loading...
```

## Contact Support

Jika masalah masih berlanjut setelah mengikuti troubleshooting guide ini:

1. Copy semua console output (F12 > Console)
2. Copy network requests (F12 > Network > XHR)
3. Check backend logs untuk error messages
4. Buat issue dengan informasi tersebut

## References
- [COMPARISON_ACTUAL_DATA_FIX.md](../frontend/COMPARISON_ACTUAL_DATA_FIX.md) - Dokumentasi implementasi
- [Backend API Documentation](../api/README.md) - Dokumentasi API endpoints

