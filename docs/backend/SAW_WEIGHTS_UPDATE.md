# SAW Weights Update

## 🎯 Overview

Bobot kriteria SAW telah diperbarui lagi untuk menyelaraskan kontribusi setiap kriteria dengan hasil evaluasi terbaru.

---

## 📊 Weights Changes

### Before ❌
```python
weights = {
    "ipk": 0.4,   # 40%
    "sks": 0.35,  # 35%
    "dek": 0.25   # 25%
}
Total: 1.0 ✅
```

### After ✅
```python
weights = {
    "ipk": 0.35,   # 35%
    "sks": 0.325,  # 32.5%
    "dek": 0.325   # 32.5%
}
Total: 1.0 ✅
```

---

## 🔧 Changes Made

### 1. **Backend Schema** (`src/backend/routers/saw.py`)

```python
# Default request schema
weights: Dict[str, float] = {"ipk": 0.35, "sks": 0.325, "dek": 0.325}

# Export endpoint
weights={'ipk': 0.35, 'sks': 0.325, 'dek': 0.325}
```

### 2. **SAW Core Logic** (`src/backend/saw_logic.py`)

```python
# Docstring & defaults
weights: Dictionary dengan bobot kriteria {'ipk': 0.35, 'sks': 0.325, 'dek': 0.325}

# calculate_saw & batch_calculate_saw
weights = {
    "IPK": 0.35,
    "SKS": 0.325,
    "Nilai D/E/K": 0.325
}

# evaluate_saw_performance default argument
weights = {'ipk': 0.35, 'sks': 0.325, 'dek': 0.325}

# Validation (kembali ke toleransi 0.01)
if abs(total_weight - 1.0) > 0.01:
    raise ValueError(...)
```

### 3. **Frontend Defaults**

```html
<!-- index.html -->
value="32.5"  <!-- SKS -->
value="32.5"  <!-- D/E/K -->

<!-- saw.js & mahasiswa.js -->
(Bobot: 32.5%)
```

---

## 📈 Impact Analysis

### Weight Distribution

| Kriteria | Before | After | Change |
|----------|--------|-------|--------|
| IPK | 40% | 35% | -5% |
| SKS | 35% | 32.5% | -2.5% |
| D/E/K | 25% | 32.5% | +7.5% |

### Formula Baru
```
SAW Score = (IPK_norm × 0.35)
           + (SKS_norm × 0.325)
           + (DEK_norm × 0.325)
```

### Dampak Utama
- Penekanan IPK tetap 35% (turun 5% dari awal)
- SKS sedikit dikurangi (32.5%) untuk menjaga keseimbangan
- Nilai D/E/K mendapatkan porsi yang sama dengan SKS (32.5%)
- Total bobot kembali 1.0 sehingga tidak perlu toleransi tambahan

---

## ✅ Verification

### API Test
```bash
curl -X POST "http://localhost:8000/api/saw/evaluate-actual" \
  -H "Content-Type: application/json" \
  -d '{
    "weights": {"ipk": 0.35, "sks": 0.325, "dek": 0.325},
    "test_size": 1.0,
    "random_state": 42,
    "save_to_db": false
  }'
```

**Response:**
```json
{
  "success": true,
  "weights": {
    "ipk": 0.35,
    "sks": 0.325,
    "dek": 0.325
  },
  "total_data": 658,
  "accuracy": 0.8374
}
```

**Status:** ✅ **SUCCESS** - Bobot diterapkan tanpa error

---

## 📁 Files Modified

- `src/backend/routers/saw.py`
- `src/backend/saw_logic.py`
- `src/frontend/index.html`
- `src/frontend/js/saw.js`
- `src/frontend/js/mahasiswa.js`
- `docs/backend/SAW_WEIGHTS_UPDATE.md`

---

## 🎯 Rationale

1. **Konsistensi Total Bobot** – Kembali ke total 1.0 agar normalisasi dan penilaian lebih mudah dijelaskan.
2. **Keseimbangan Benefit vs Cost** – SKS dan Nilai D/E/K sekarang memiliki bobot yang sama (32.5%).
3. **Fleksibilitas** – IPK masih menjadi faktor terbesar (35%), namun tidak terlalu dominan.

---

## 🔍 Example Calculation

**Data mahasiswa:** IPK 3.5, SKS 120, D/E/K 15%

```
SAW Score = (0.875 × 0.35)
          + (0.857 × 0.325)
          + (0.85  × 0.325)
          = 0.30625 + 0.278525 + 0.27625
          = 0.86099
```

---

## 🧪 Testing Checklist

- [x] Backend restarted
- [x] API test with new weights
- [x] Frontend default form values
- [x] SAW detail dialog menampilkan bobot 32.5%
- [ ] UAT bersama pengguna (opsional)

---

**Status:** ✅ **COMPLETE**  
**Date:** November 11, 2025  
**Version:** 1.1.0

