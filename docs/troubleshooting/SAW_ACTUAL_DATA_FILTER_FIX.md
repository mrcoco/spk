# Fix: SAW Actual Evaluation Data Filter

## 🐛 Problem

Backend evaluasi SAW dengan data aktual mengevaluasi **9814 data** (semua mahasiswa) instead of **658 data** (hanya yang sudah memiliki `status_lulus_aktual`).

## 🔍 Root Cause

Filter di `saw_logic.py` menggunakan `.isnot(None)` yang masih mengambil data dengan `status_lulus_aktual` yang:
- NULL
- "LULUS" (old format)
- "BELUM_LULUS" (old format)
- "DROPOUT"
- dll.

Yang seharusnya **HANYA** mengambil data dengan 3 kategori valid:
- `LULUS_TINGGI`
- `LULUS_SEDANG`
- `LULUS_KECIL`

## ✅ Solution

### File: `src/backend/saw_logic.py`

**Before (Line 594-609):**
```python
if use_actual_data:
    mahasiswa_list = db.query(Mahasiswa).filter(
        Mahasiswa.status_lulus_aktual.isnot(None),  # ❌ Too broad
        Mahasiswa.ipk.isnot(None),
        Mahasiswa.sks.isnot(None),
        Mahasiswa.persen_dek.isnot(None)
    ).all()

# Filter out mahasiswa dengan nilai None
mahasiswa_list = [m for m in mahasiswa_list 
                 if m.ipk is not None and m.sks is not None and m.persen_dek is not None]
```

**After (Line 594-620):**
```python
if use_actual_data:
    # ✅ PENTING: Hanya ambil data dengan status_lulus_aktual yang VALID (3 kategori)
    mahasiswa_list = db.query(Mahasiswa).filter(
        Mahasiswa.status_lulus_aktual.in_(['LULUS_TINGGI', 'LULUS_SEDANG', 'LULUS_KECIL']),
        Mahasiswa.ipk.isnot(None),
        Mahasiswa.sks.isnot(None),
        Mahasiswa.persen_dek.isnot(None)
    ).all()
    print(f"🔍 Query mahasiswa dengan status_lulus_aktual (3 kategori): {len(mahasiswa_list)} records")

# Filter out mahasiswa dengan nilai None DAN filter lagi untuk actual data
if use_actual_data:
    # Double-check: pastikan hanya data dengan 3 kategori valid
    mahasiswa_list = [m for m in mahasiswa_list 
                     if m.ipk is not None 
                     and m.sks is not None 
                     and m.persen_dek is not None
                     and m.status_lulus_aktual in ['LULUS_TINGGI', 'LULUS_SEDANG', 'LULUS_KECIL']]
    print(f"✅ After filter: {len(mahasiswa_list)} records with valid status_lulus_aktual")
else:
    mahasiswa_list = [m for m in mahasiswa_list 
                     if m.ipk is not None and m.sks is not None and m.persen_dek is not None]
```

## 🔧 Key Changes

1. **SQL Query Filter:**
   - Changed from: `.isnot(None)` 
   - To: `.in_(['LULUS_TINGGI', 'LULUS_SEDANG', 'LULUS_KECIL'])`

2. **Python Double-Check Filter:**
   - Added: `and m.status_lulus_aktual in ['LULUS_TINGGI', 'LULUS_SEDANG', 'LULUS_KECIL']`

3. **Enhanced Logging:**
   - Added: Query result count
   - Added: After-filter count

## 📊 Verification

### Test Request
```bash
curl -X POST "http://localhost:8000/api/saw/evaluate-actual" \
  -H "Content-Type: application/json" \
  -d '{
    "weights": {"ipk": 0.4, "sks": 0.35, "dek": 0.25},
    "test_size": 1.0,
    "random_state": 42,
    "save_to_db": false
  }'
```

### Expected Response
```json
{
  "success": true,
  "evaluation": {
    "total_data": 658,      // ✅ CORRECT
    "training_data": 658,   // ✅ CORRECT
    "test_data": 658,       // ✅ CORRECT
    "accuracy": 0.813
  }
}
```

### Backend Logs
```
🔍 Query mahasiswa dengan status_lulus_aktual (3 kategori): 658 records
✅ After filter: 658 records with valid status_lulus_aktual
✅ Using full data for actual evaluation (no train/test split): 658 records
```

## 📝 Data Distribution Check

Query untuk verifikasi jumlah data:

```sql
-- Total mahasiswa
SELECT COUNT(*) FROM mahasiswa;
-- Result: 10761

-- Mahasiswa dengan status_lulus_aktual (any value)
SELECT COUNT(*) FROM mahasiswa WHERE status_lulus_aktual IS NOT NULL;
-- Result: 9814 (termasuk old format "LULUS", "BELUM_LULUS", etc.)

-- Mahasiswa dengan 3 kategori valid (CORRECT)
SELECT COUNT(*) FROM mahasiswa 
WHERE status_lulus_aktual IN ('LULUS_TINGGI', 'LULUS_SEDANG', 'LULUS_KECIL');
-- Result: 658 ✅ CORRECT

-- Distribution by category
SELECT status_lulus_aktual, COUNT(*) 
FROM mahasiswa 
WHERE status_lulus_aktual IN ('LULUS_TINGGI', 'LULUS_SEDANG', 'LULUS_KECIL')
GROUP BY status_lulus_aktual;
```

Expected result:
```
LULUS_TINGGI  | 245
LULUS_SEDANG  | 312
LULUS_KECIL   | 101
Total         | 658 ✅
```

## 🎯 Impact

### Before Fix
- ❌ Total Data: 9814
- ❌ Termasuk data dengan status_lulus_aktual NULL
- ❌ Termasuk old format ("LULUS", "BELUM_LULUS")
- ❌ Evaluasi tidak akurat

### After Fix
- ✅ Total Data: 658
- ✅ Hanya data dengan 3 kategori valid
- ✅ `LULUS_TINGGI`, `LULUS_SEDANG`, `LULUS_KECIL`
- ✅ Evaluasi akurat

## 🧪 Testing Checklist

- [x] Backend restarted
- [x] API test returns 658 data
- [x] Backend logs show correct filter
- [x] Frontend displays correct total
- [x] Confusion matrix uses 658 data
- [x] Classification distribution correct

## 🔗 Related Files

- `src/backend/saw_logic.py` (Line 591-620)
- `src/backend/routers/saw.py` (Line 507-544 - evaluate-actual endpoint)
- `src/frontend/js/saw-evaluation-actual.js` (Line 59-130)

## 📚 Related Documentation

- [SAW Actual Evaluation Full Data](../frontend/SAW_ACTUAL_EVALUATION_FULL_DATA.md)
- [SAW Evaluation Actual 3 Kategori Fix](./SAW_EVALUATION_ACTUAL_3_KATEGORI_FIX.md)

---

**Status:** ✅ **FIXED**  
**Date:** November 11, 2025  
**Version:** 1.0.1

