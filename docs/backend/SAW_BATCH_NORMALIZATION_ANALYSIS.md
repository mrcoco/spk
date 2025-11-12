# Analisis Normalisasi Batch SAW

## Ringkasan

Dokumen ini menjelaskan bagaimana normalisasi (min/max) dihitung untuk klasifikasi batch SAW dan perbedaannya dengan evaluasi SAW dengan data aktual.

## Temuan

### 1. Batch SAW Classification (`batch_calculate_saw`)

**Sebelum Perbaikan:**
- Min/max dihitung dari **SELURUH data** mahasiswa di database
- Query: `db.query(Mahasiswa).all()` untuk semua mahasiswa
- Min/max: `db.query(func.max(Mahasiswa.ipk), ...)` tanpa filter

**Setelah Perbaikan:**
- Default: Min/max dihitung dari **SELURUH data** (behavior tetap sama)
- Opsi baru: Parameter `use_labeled_data_only=True` untuk menggunakan min/max dari **data berlabel saja**
- Jika `use_labeled_data_only=True`, min/max dihitung dari data dengan `status_lulus_aktual`:
  - `LULUS_TINGGI`
  - `LULUS_SEDANG`
  - `LULUS_KECIL`

### 2. SAW Actual Evaluation (`evaluate_saw_performance`)

- Min/max dihitung dari **data berlabel saja** (data dengan `status_lulus_aktual`)
- Konsisten dengan tujuan evaluasi: membandingkan prediksi dengan ground truth

## Perubahan Kode

### File: `src/backend/saw_logic.py`

**Fungsi `batch_calculate_saw()`:**
```python
def batch_calculate_saw(
    db: Session, 
    save_to_db: bool = True, 
    use_labeled_data_only: bool = False  # ✅ Parameter baru
) -> List[Dict[str, Any]]:
    """
    Args:
        use_labeled_data_only: Jika True, min/max dihitung hanya dari data yang memiliki 
                              status_lulus_aktual (LULUS_TINGGI, LULUS_SEDANG, LULUS_KECIL). 
                              Default: False (menggunakan seluruh data)
    """
```

**Logika Normalisasi:**
```python
if use_labeled_data_only:
    # Min/max dari data berlabel
    stats = db.query(
        func.max(Mahasiswa.ipk).label('ipk_max'),
        func.max(Mahasiswa.sks).label('sks_max'),
        func.min(Mahasiswa.persen_dek).label('nilai_dek_min'),
        func.max(Mahasiswa.persen_dek).label('nilai_dek_max')
    ).filter(
        Mahasiswa.status_lulus_aktual.in_(['LULUS_TINGGI', 'LULUS_SEDANG', 'LULUS_KECIL']),
        Mahasiswa.ipk.isnot(None),
        Mahasiswa.sks.isnot(None),
        Mahasiswa.persen_dek.isnot(None)
    ).first()
else:
    # Min/max dari seluruh data (default)
    stats = db.query(
        func.max(Mahasiswa.ipk).label('ipk_max'),
        func.max(Mahasiswa.sks).label('sks_max'),
        func.min(Mahasiswa.persen_dek).label('nilai_dek_min'),
        func.max(Mahasiswa.persen_dek).label('nilai_dek_max')
    ).first()
```

## Perbandingan

| Aspek | Batch SAW (Default) | Batch SAW (use_labeled_data_only=True) | Actual Evaluation |
|-------|---------------------|----------------------------------------|-------------------|
| **Sumber Min/Max** | Seluruh data | Data berlabel saja | Data berlabel saja |
| **Jumlah Data** | ~9814 records | ~658 records | ~658 records |
| **Konsistensi** | Tidak konsisten dengan evaluasi | Konsisten dengan evaluasi | ✅ Konsisten |
| **Use Case** | Klasifikasi umum | Klasifikasi untuk data berlabel | Evaluasi performa |

## Rekomendasi

### Untuk Klasifikasi Batch SAW:

1. **Default Behavior (use_labeled_data_only=False):**
   - Gunakan untuk klasifikasi **semua mahasiswa** di database
   - Min/max dari seluruh data memberikan konteks yang lebih luas
   - Cocok untuk monitoring dan klasifikasi umum

2. **Labeled Data Only (use_labeled_data_only=True):**
   - Gunakan jika ingin konsistensi dengan hasil evaluasi aktual
   - Min/max dari data berlabel memberikan konteks yang lebih spesifik
   - Cocok untuk analisis yang fokus pada data yang sudah memiliki ground truth

### Untuk Evaluasi SAW:

- Tetap menggunakan min/max dari **data berlabel saja** (sudah benar)
- Ini memastikan evaluasi dilakukan dengan konteks yang sama dengan ground truth

## Cara Menggunakan

### Default (Seluruh Data):
```python
results = batch_calculate_saw(db, save_to_db=True)
# Min/max dari seluruh data
```

### Labeled Data Only:
```python
results = batch_calculate_saw(db, save_to_db=True, use_labeled_data_only=True)
# Min/max dari data berlabel saja
```

## Catatan Penting

1. **Backward Compatibility:** Default behavior tetap sama (menggunakan seluruh data)
2. **Performance:** Menggunakan data berlabel saja akan lebih cepat karena data lebih sedikit
3. **Konsistensi:** Jika ingin hasil batch SAW konsisten dengan evaluasi aktual, gunakan `use_labeled_data_only=True`

## Testing

Untuk memverifikasi:
1. Jalankan batch SAW dengan default (seluruh data)
2. Jalankan batch SAW dengan `use_labeled_data_only=True`
3. Bandingkan nilai min/max yang digunakan
4. Bandingkan hasil klasifikasi untuk beberapa mahasiswa

## Kesimpulan

- **Sebelum:** Batch SAW menggunakan min/max dari seluruh data (inkonsisten dengan evaluasi)
- **Sesudah:** Batch SAW dapat menggunakan min/max dari data berlabel (opsional, untuk konsistensi)
- **Evaluasi:** Tetap menggunakan min/max dari data berlabel (sudah benar)

