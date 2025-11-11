# Fix: Program Studi Showing N/A in FIS Grid

## 🐛 Problem

Data **Program Studi** pada grid "Hasil Klasifikasi" FIS menampilkan "N/A" meskipun data ada di database.

## 🔍 Root Cause Analysis

### Investigation Steps:

1. **Database Check:** ✅ Data program_studi ada di tabel `mahasiswa`
   ```sql
   SELECT nim, nama, program_studi FROM mahasiswa LIMIT 3;
   -- Result: Data lengkap dengan program_studi
   ```

2. **Backend Query Check:** ✅ Query JOIN berfungsi dengan baik
   ```sql
   SELECT k.nim, m.nama, m.program_studi, k.kategori 
   FROM klasifikasi_kelulusan k 
   LEFT JOIN mahasiswa m ON k.nim = m.nim 
   LIMIT 3;
   -- Result: Data ter-join dengan benar
   ```

3. **Backend Code Check:** ✅ Code sudah include `program_studi`
   ```python
   formatted_results.append({
       "nim": klasifikasi.nim,
       "nama": mahasiswa.nama,
       "program_studi": mahasiswa.program_studi,  # ✅ Already included
       ...
   })
   ```

4. **API Response Check:** ❌ API response mengirim `program_studi: null`
   ```json
   {
     "nim": "17108244003",
     "nama": "Pranidhana Sevia Ksanti",
     "program_studi": null,  // ❌ NULL!
     "kategori": "Peluang Lulus Tinggi"
   }
   ```

5. **Schema Check:** ❌ **ROOT CAUSE FOUND!**
   - Schema `KlasifikasiGridItem` di `schemas.py` **tidak memiliki field** `program_studi`
   - Pydantic memfilter field yang tidak ada di schema
   - Data dari query ter-buang saat serialization

## 🔧 Solution

### File: `src/backend/schemas.py`

**Before:**
```python
class KlasifikasiGridItem(BaseModel):
    nim: str
    nama: str
    # ❌ program_studi MISSING!
    kategori: str
    nilai_fuzzy: float
    ipk_membership: float
    sks_membership: float
    nilai_dk_membership: float
    updated_at: datetime

    class Config:
        orm_mode = True
```

**After:**
```python
class KlasifikasiGridItem(BaseModel):
    nim: str
    nama: str
    program_studi: Optional[str] = None  # ✅ ADDED!
    kategori: str
    nilai_fuzzy: float
    ipk_membership: float
    sks_membership: float
    nilai_dk_membership: float
    updated_at: datetime

    class Config:
        orm_mode = True
```

**Why `Optional[str] = None`?**
- Untuk backward compatibility jika ada data lama tanpa program_studi
- Pydantic tidak akan error jika field tidak ada
- Frontend sudah handle `null` value dengan fallback "N/A"

## ✅ Verification

### Backend API Response:
```bash
curl "http://localhost:8000/api/fuzzy/results?limit=3" | jq '.data[] | {nim, nama, program_studi, kategori}'
```

**Result:**
```json
{
  "nim": "17108244003",
  "nama": "Pranidhana Sevia Ksanti",
  "program_studi": "PENDIDIKAN GURU SEKOLAH DASAR - S1",  // ✅ SUCCESS!
  "kategori": "Peluang Lulus Tinggi"
}
```

### Frontend Display:
- Open FIS page
- Check "Hasil Klasifikasi" grid
- Program Studi column should show colored badges with actual prodi names

## 📋 Files Modified

1. **`src/backend/schemas.py`**
   - Added `program_studi: Optional[str] = None` to `KlasifikasiGridItem`

## 🎯 Impact

### Before:
- ❌ Program Studi shows "N/A"
- ❌ Custom search by prodi tidak berfungsi
- ❌ Filter by prodi tidak ada data

### After:
- ✅ Program Studi shows actual prodi with colored badge
- ✅ Custom search by prodi works (e.g., "Informatika")
- ✅ Data lengkap untuk filtering dan reporting

## 🔍 Lessons Learned

1. **Always Check Pydantic Schemas:**
   - Pydantic strictly enforces schema fields
   - Missing fields in schema = data filtered out
   - Even if backend query returns the data

2. **Use Optional for Nullable Fields:**
   - Database columns can be NULL
   - Schema should reflect this with `Optional[Type]`
   - Provides better error handling

3. **Test Full Stack:**
   - Database → Backend Query → Schema → API Response → Frontend
   - Each layer can filter/transform data
   - End-to-end testing is crucial

## 🚀 Deployment

```bash
# Restart backend to apply schema changes
docker-compose restart backend

# Test API
curl "http://localhost:8000/api/fuzzy/results?limit=1" | jq '.data[0].program_studi'

# Expected: String value (not null)
# Example: "PENDIDIKAN GURU SEKOLAH DASAR - S1"
```

## ✅ Status

**RESOLVED** - Program Studi now displays correctly in FIS grid with colored badges.

---

**Date:** 2025-11-11  
**Issue:** Program Studi showing N/A  
**Root Cause:** Missing field in Pydantic schema  
**Solution:** Added `program_studi` to `KlasifikasiGridItem` schema  
**Status:** ✅ Fixed

