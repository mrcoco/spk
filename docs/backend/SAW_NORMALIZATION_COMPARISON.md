# Perbandingan Formula Normalisasi SAW

## Ringkasan

Ditemukan perbedaan formula normalisasi antara `fis_saw_fix.py` (referensi) dengan implementasi di `saw_logic.py`. Dokumen ini menjelaskan perbedaan dan rekomendasi perbaikan.

## Perbandingan Formula

### 1. File Referensi: `fis_saw_fix.py`

**Line 237-242:**
```python
# Normalisasi
df['ipk_norm'] = df['ipk'] / df['ipk'].max()  # Benefit
df['sks_norm'] = df['sks'] / df['sks'].max()  # Benefit
df['nilai_dek_fix'] = df['nilai_dek'].replace(0, 0.01)  # Hindari pembagian nol
df['nilai_dek_norm'] = df['nilai_dek_fix'].min() / df['nilai_dek_fix']  # Cost
```

**Formula:**
- **IPK (benefit)**: `nilai / max`
- **SKS (benefit)**: `nilai / max`
- **Nilai D/E/K (cost)**: `min / nilai` ⚠️

### 2. Implementasi Saat Ini: `batch_calculate_saw()`

**Line 329-332:**
```python
normalized_values = {
    "IPK": criteria_values["IPK"] / ipk_max,  # Benefit
    "SKS": criteria_values["SKS"] / sks_max,  # Benefit
    "Nilai D/E/K": nilai_dek_normalized  # Cost
}
```

**Line 321-326:**
```python
# Normalisasi cost criteria: (max - nilai) / (max - min)
if nilai_dek_max == nilai_dek_min:
    nilai_dek_normalized = 1.0
else:
    nilai_dek_normalized = (nilai_dek_max - criteria_values["Nilai D/E/K"]) / (nilai_dek_max - nilai_dek_min)
```

**Formula:**
- **IPK (benefit)**: `nilai / max` ✅ SAMA
- **SKS (benefit)**: `nilai / max` ✅ SAMA
- **Nilai D/E/K (cost)**: `(max - nilai) / (max - min)` ❌ BERBEDA

### 3. Implementasi: `evaluate_saw_performance()`

**Line 685-693:**
```python
normalized_ipk = (mahasiswa.ipk - min_values['ipk']) / ipk_range if ipk_range > 0 else 1.0
normalized_sks = (mahasiswa.sks - min_values['sks']) / sks_range if sks_range > 0 else 1.0
normalized_dek = (mahasiswa.persen_dek - min_values['dek']) / dek_range if dek_range > 0 else 1.0

saw_score = (
    weights['ipk'] * normalized_ipk +
    weights['sks'] * normalized_sks +
    weights['dek'] * (1 - normalized_dek)  # Cost
)
```

**Formula:**
- **IPK (benefit)**: `(nilai - min) / (max - min)` ❌ BERBEDA
- **SKS (benefit)**: `(nilai - min) / (max - min)` ❌ BERBEDA
- **Nilai D/E/K (cost)**: `1 - ((nilai - min) / (max - min))` = `(max - nilai) / (max - min)` ❌ BERBEDA

## Analisis Perbedaan

### Formula Cost Criteria

| Sumber | Formula | Keterangan |
|--------|---------|------------|
| `fis_saw_fix.py` | `min / nilai` | Formula referensi |
| `batch_calculate_saw` | `(max - nilai) / (max - min)` | Formula min-max normalization |
| `evaluate_saw_performance` | `(max - nilai) / (max - min)` | Formula min-max normalization |

### Formula Benefit Criteria

| Sumber | Formula | Keterangan |
|--------|---------|------------|
| `fis_saw_fix.py` | `nilai / max` | Formula referensi |
| `batch_calculate_saw` | `nilai / max` | ✅ SAMA |
| `evaluate_saw_performance` | `(nilai - min) / (max - min)` | ❌ BERBEDA |

## Dampak Perbedaan

### 1. Cost Criteria (Nilai D/E/K)

**Formula `fis_saw_fix.py`: `min / nilai`**
- Nilai kecil → normalisasi besar (benar untuk cost)
- Nilai besar → normalisasi kecil (benar untuk cost)
- Range: `[min/max, 1]` atau `[min/max, ∞]` jika min = 0

**Formula `saw_logic.py`: `(max - nilai) / (max - min)`**
- Nilai kecil → normalisasi besar (benar untuk cost)
- Nilai besar → normalisasi kecil (benar untuk cost)
- Range: `[0, 1]` (terbatas)

**Perbedaan:**
- Formula `min/nilai` tidak terbatas (bisa > 1 jika nilai < min)
- Formula `(max - nilai) / (max - min)` selalu dalam range [0, 1]

### 2. Benefit Criteria (IPK, SKS)

**Formula `fis_saw_fix.py`: `nilai / max`**
- Range: `[0, 1]`
- Tidak mempertimbangkan nilai minimum

**Formula `evaluate_saw_performance`: `(nilai - min) / (max - min)`**
- Range: `[0, 1]`
- Mempertimbangkan nilai minimum dan maximum

**Perbedaan:**
- Jika min > 0, hasil akan berbeda
- Contoh: IPK min = 2.0, max = 4.0, nilai = 3.0
  - `fis_saw_fix.py`: `3.0 / 4.0 = 0.75`
  - `evaluate_saw_performance`: `(3.0 - 2.0) / (4.0 - 2.0) = 0.5`

## Rekomendasi Perbaikan

### Opsi 1: Sesuaikan dengan `fis_saw_fix.py` (Referensi)

**Ubah `batch_calculate_saw()` untuk menggunakan formula `min / nilai`:**

```python
# Normalisasi cost criteria sesuai fis_saw_fix.py
if criteria_values["Nilai D/E/K"] == 0:
    nilai_dek_fix = 0.01  # Hindari pembagian nol
else:
    nilai_dek_fix = criteria_values["Nilai D/E/K"]

if nilai_dek_min == 0:
    nilai_dek_min = 0.01  # Hindari pembagian nol

nilai_dek_normalized = nilai_dek_min / nilai_dek_fix
```

**Ubah `evaluate_saw_performance()` untuk menggunakan formula `nilai / max`:**

```python
# Normalisasi benefit criteria sesuai fis_saw_fix.py
normalized_ipk = mahasiswa.ipk / max_values['ipk']
normalized_sks = mahasiswa.sks / max_values['sks']

# Normalisasi cost criteria sesuai fis_saw_fix.py
dek_fix = mahasiswa.persen_dek if mahasiswa.persen_dek > 0 else 0.01
dek_min_fix = min_values['dek'] if min_values['dek'] > 0 else 0.01
normalized_dek = dek_min_fix / dek_fix
```

### Opsi 2: Gunakan Formula Min-Max Normalization (Standar)

**Tetap gunakan formula `(max - nilai) / (max - min)` untuk cost**, tapi pastikan konsisten di semua fungsi.

## Kesimpulan

Perbedaan utama:
1. **Cost criteria**: `fis_saw_fix.py` menggunakan `min/nilai`, sedangkan `saw_logic.py` menggunakan `(max - nilai) / (max - min)`
2. **Benefit criteria di evaluasi**: `evaluate_saw_performance` menggunakan `(nilai - min) / range` yang berbeda dengan referensi `nilai / max`

**Rekomendasi**: Sesuaikan dengan `fis_saw_fix.py` untuk konsistensi dengan referensi penelitian.

