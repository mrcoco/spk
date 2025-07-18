# Perbaikan Dropdown Mahasiswa dengan Pencarian Minimal 3 Karakter

## Overview

Perbaikan ini mengubah implementasi dropdown mahasiswa dari memuat seluruh data mahasiswa menjadi menggunakan pencarian dengan minimal 3 karakter. Hal ini meningkatkan performa aplikasi dan user experience.

## Perubahan yang Dilakukan

### 1. Backend - Endpoint Pencarian Baru

**File:** `src/backend/routers/mahasiswa.py`

Menambahkan endpoint baru untuk pencarian mahasiswa:

```python
@router.get("/search", response_model=List[MahasiswaResponse])
def search_mahasiswa_for_dropdown(
    q: str = Query(..., min_length=3, description="Query pencarian minimal 3 karakter"),
    limit: int = Query(20, ge=1, le=100, description="Limit hasil pencarian"),
    db: Session = Depends(get_db)
):
    """
    Endpoint untuk pencarian mahasiswa yang digunakan oleh dropdown.
    Memerlukan minimal 3 karakter untuk melakukan pencarian.
    """
    if len(q) < 3:
        raise HTTPException(
            status_code=400, 
            detail="Query pencarian minimal 3 karakter"
        )
    
    # Pencarian berdasarkan NIM atau nama
    query = db.query(Mahasiswa).filter(
        (Mahasiswa.nim.ilike(f"%{q}%")) |
        (Mahasiswa.nama.ilike(f"%{q}%"))
    ).order_by(Mahasiswa.nama.asc()).limit(limit)
    
    mahasiswa_list = query.all()
    return mahasiswa_list
```

**Fitur:**
- Validasi minimal 3 karakter
- Pencarian berdasarkan NIM atau nama
- Limit hasil pencarian (default 20)
- Sorting berdasarkan nama

### 2. Frontend - Implementasi Dropdown Baru

#### File: `src/frontend/js/fis.js`

```javascript
function initializeMahasiswaDropdown() {
    $("#mahasiswaDropdown").kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    url: function() {
                        return CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA + "/search");
                    },
                    dataType: "json",
                    data: function() {
                        return {
                            q: $("#mahasiswaDropdown").data("kendoDropDownList").filterInput.val() || "",
                            limit: 20
                        };
                    }
                }
            },
            schema: {
                data: function(response) {
                    return response || [];
                }
            },
            serverFiltering: true,
            filter: {
                field: "nama",
                operator: "contains",
                value: ""
            }
        },
        dataTextField: "nama",
        dataValueField: "nim",
        optionLabel: "Ketik minimal 3 karakter untuk mencari mahasiswa...",
        filter: "contains",
        minLength: 3,
        delay: 300,
        template: "#: nim # - #: nama #",
        filterInput: {
            placeholder: "Ketik minimal 3 karakter..."
        },
        filter: function(e) {
            var filterValue = e.filter.value;
            if (filterValue.length < 3) {
                e.preventDefault();
                this.dataSource.data([]);
                return;
            }
        }
    });
}
```

#### File: `src/frontend/js/dashboard.js`

Implementasi serupa untuk dropdown di dashboard.

#### File: `src/frontend/js/saw.js`

Implementasi serupa untuk dropdown di halaman SAW.

### 3. CSS Styling

**File:** `src/frontend/style.css`

Menambahkan styling untuk dropdown dengan pencarian:

```css
/* Styling untuk dropdown dengan pencarian */
.k-dropdown .k-input {
    padding: 8px 12px;
    font-size: 14px;
}

.k-dropdown .k-input::placeholder {
    color: #999;
    font-style: italic;
}

.k-dropdown .k-filter-input {
    padding: 8px 12px;
    font-size: 14px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

/* Loading indicator */
.dropdown-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    color: #666;
}
```

## Fitur yang Ditambahkan

### 1. Pencarian Minimal 3 Karakter
- User harus mengetik minimal 3 karakter untuk memulai pencarian
- Mencegah request yang tidak perlu ke server

### 2. Server-Side Filtering
- Pencarian dilakukan di server, bukan di client
- Mengurangi beban browser dan meningkatkan performa

### 3. Delay Pencarian
- Delay 300ms sebelum melakukan request
- Mencegah request berlebihan saat user mengetik

### 4. Limit Hasil
- Maksimal 20 hasil pencarian
- Meningkatkan performa dan user experience

### 5. Placeholder yang Informatif
- Memberikan petunjuk jelas kepada user
- Menunjukkan persyaratan minimal karakter

## Keuntungan

### 1. Performa
- Tidak memuat seluruh data mahasiswa sekaligus
- Mengurangi ukuran response dari server
- Meningkatkan kecepatan loading

### 2. User Experience
- Interface yang lebih responsif
- Pencarian yang lebih cepat
- Feedback yang jelas kepada user

### 3. Scalability
- Dapat menangani data mahasiswa yang besar
- Tidak terpengaruh jumlah data mahasiswa

## Testing

### 1. Test Pencarian
- Ketik kurang dari 3 karakter → tidak ada request
- Ketik 3 karakter atau lebih → request ke server
- Pencarian berdasarkan NIM dan nama

### 2. Test Performa
- Bandingkan waktu loading sebelum dan sesudah
- Monitor jumlah request ke server
- Test dengan data mahasiswa yang besar

### 3. Test UI/UX
- Placeholder text yang jelas
- Loading indicator yang smooth
- Error handling yang baik

## Troubleshooting

### 1. Dropdown Tidak Muncul
- Cek koneksi ke backend
- Cek endpoint `/api/mahasiswa/search`
- Cek console browser untuk error

### 2. Pencarian Tidak Berfungsi
- Pastikan minimal 3 karakter
- Cek network tab untuk request
- Cek response dari server

### 3. Styling Tidak Sesuai
- Cek CSS untuk dropdown
- Pastikan Kendo UI CSS ter-load
- Cek browser compatibility

## Future Improvements

1. **Debouncing**: Implementasi debouncing yang lebih advanced
2. **Caching**: Cache hasil pencarian untuk performa lebih baik
3. **Highlight**: Highlight kata yang dicari di hasil
4. **Keyboard Navigation**: Navigasi dengan keyboard yang lebih baik
5. **Recent Searches**: Menyimpan pencarian terakhir 