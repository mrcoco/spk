# Perbaikan Error 422 pada Dropdown Search FIS

## Masalah
Error 422 (Unprocessable Entity) saat dropdown search mahasiswa di FIS:
```
GET http://localhost:8000/api/mahasiswa/search?q=&limit=20&filter%5Blogic%5D=and 422 (Unprocessable Entity)
```

Dan error "No matching data item found, clearing selection" yang muncul setelah reset dropdown.

## Penyebab
- **Query Kosong**: Backend endpoint `/api/mahasiswa/search` memerlukan minimal 3 karakter
- **Reset Dropdown**: Ketika dropdown di-reset, Kendo ComboBox mengirim request dengan query kosong (`q=`)
- **Validation Error**: Backend mengembalikan error 422 untuk query yang tidak valid
- **Data Source Issue**: Data source dropdown tidak menangani response error dengan baik

## Solusi

### 1. Frontend Validation
Menambahkan validasi di frontend untuk tidak mengirim request jika query kosong:

```javascript
data: function() {
    var comboBox = $("#mahasiswaDropdown").data("kendoComboBox");
    var query = comboBox ? comboBox.text() : "";
    
    // Jangan kirim request jika query kosong atau kurang dari 3 karakter
    if (!query || query.trim().length < 3) {
        console.log('Query too short, not sending request:', query);
        return {
            q: "___INVALID___", // Placeholder yang akan di-filter di backend
            limit: 20
        };
    }
    
    return {
        q: query.trim(),
        limit: 20
    };
}
```

### 2. Backend Handling
Memperbaiki backend untuk menangani query yang tidak valid:

```python
@router.get("/search", response_model=List[MahasiswaSearchResponse])
def search_mahasiswa_for_dropdown(
    q: str = Query(..., description="Query pencarian minimal 3 karakter"),
    limit: int = Query(20, ge=1, le=100, description="Limit hasil pencarian"),
    db: Session = Depends(get_db)
):
    # Handle placeholder untuk query yang tidak valid
    if q == "___INVALID___" or len(q) < 3:
        return []
    
    # Pencarian berdasarkan NIM atau nama
    query = db.query(Mahasiswa).filter(
        (Mahasiswa.nim.ilike(f"%{q}%")) |
        (Mahasiswa.nama.ilike(f"%{q}%"))
    ).order_by(Mahasiswa.nama.asc()).limit(limit)
    
    mahasiswa_list = query.all()
    return mahasiswa_list
```

## Implementasi

### File yang Diubah
- **`src/frontend/js/fis.js`** - Menambahkan validasi query di data function
- **`src/backend/routers/mahasiswa.py`** - Memperbaiki handling query yang tidak valid

### Behavior yang Diharapkan
1. **Query Valid**: Request dikirim hanya jika query ≥ 3 karakter
2. **Query Invalid**: Menggunakan placeholder `___INVALID___` untuk query kosong/pendek
3. **Backend Response**: Mengembalikan array kosong untuk query yang tidak valid
4. **No Error**: Tidak ada lagi error 422 pada dropdown search

## Testing

### Sebelum Perbaikan
- ❌ Error 422: `GET /api/mahasiswa/search?q=&limit=20 422 (Unprocessable Entity)`
- ❌ "No matching data item found, clearing selection"
- ❌ Dropdown tidak berfungsi setelah reset

### Setelah Perbaikan
- ✅ Query kosong: `[]` (array kosong)
- ✅ Query pendek: `[]` (array kosong)
- ✅ Query valid: Data mahasiswa yang sesuai
- ✅ Dropdown berfungsi normal setelah reset

## Monitoring

### Console Logs yang Diharapkan
```
✅ Query too short, not sending request: 
✅ Dropdown reset for next search
✅ Found matching data item: {nim: "19812141051", nama: "John Doe", ...}
```

### Console Logs yang Tidak Diharapkan
```
❌ GET /api/mahasiswa/search?q=&limit=20 422 (Unprocessable Entity)
❌ No matching data item found, clearing selection
```

## API Response Examples

### Query Kosong/Pendek
```bash
curl "http://localhost:8000/api/mahasiswa/search?q=&limit=20"
# Response: []
```

### Query Valid
```bash
curl "http://localhost:8000/api/mahasiswa/search?q=198&limit=5"
# Response: [{"nim":"19804241047","nama":"AYU MUTHMAINNAH",...}, ...]
```

## Troubleshooting

### Jika Masih Ada Error 422
1. **Cek Backend Logs**: Pastikan backend sudah restart dengan perubahan baru
2. **Cek Frontend**: Pastikan frontend sudah restart dengan perubahan baru
3. **Cek Network**: Pastikan request menggunakan placeholder `___INVALID___`
4. **Cek Console**: Pastikan log "Query too short, not sending request" muncul

### Debug Steps
1. Buka browser console
2. Reset dropdown (klik klasifikasi)
3. Perhatikan log "Query too short, not sending request"
4. Cek network tab untuk request dengan `q=___INVALID___`
5. Pastikan response adalah array kosong `[]`

## Referensi
- [FIS Dropdown Reset Fix](FIS_DROPDOWN_RESET_FIX.md)
- [FIS Dropdown Validation Fix](FIS_DROPDOWN_VALIDATION_FIX.md)
- [Frontend Documentation](README.md) 