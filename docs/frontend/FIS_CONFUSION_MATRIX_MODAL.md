# FIS Confusion Matrix Interactive Modal

## 📋 Overview

Fitur interactive modal pada Confusion Matrix yang memungkinkan user untuk mengklik setiap cell dan melihat detail mahasiswa yang termasuk dalam kombinasi actual status vs predicted category tersebut.

## 🎯 Tujuan Fitur

1. **Drill-Down Analysis**: User dapat melihat detail data di balik setiap angka confusion matrix
2. **Transparency**: Menampilkan mahasiswa spesifik yang diprediksi benar/salah
3. **Verification**: Memudahkan verifikasi hasil prediksi
4. **Educational**: Membantu memahami karakteristik error model
5. **Interactive UX**: Membuat confusion matrix lebih dari sekedar tabel angka

## 🎨 User Experience Flow

### 1. Visual Cue
- **Cursor pointer** pada hover di setiap cell
- **Opacity effect** (0.7) saat hover
- **Hint text** di bawah matrix: "Klik pada cell untuk melihat detail mahasiswa"

### 2. Click Action
- User klik pada cell confusion matrix (misal: Actual Tinggi → Pred. Sedang = 8)
- Modal popup muncul secara centered
- Grid otomatis ter-populate dengan data yang terfilter

### 3. Modal Display
- **Header**: Menunjukkan kombinasi actual vs predicted
- **Summary Card**: Info status, prediksi, jumlah mahasiswa
- **Grid**: Kendo Grid dengan data mahasiswa yang terfilter
- **Pagination**: 10/20/50 per halaman

## 💻 Implementation Details

### HTML Changes

**File**: `src/frontend/index.html`  
**Lines**: 2354-2373

#### Before
```html
<td id="fisActual-tt">-</td>
```

#### After
```html
<td id="fisActual-tt" 
    class="cm-cell clickable" 
    data-actual="LULUS_TINGGI" 
    data-predicted="Peluang Lulus Tinggi" 
    style="cursor: pointer;">
    -
</td>
```

**Changes**:
- Added class `cm-cell clickable` untuk targeting
- Added `data-actual` attribute (LULUS_TINGGI, LULUS_SEDANG, LULUS_KECIL)
- Added `data-predicted` attribute (Peluang Lulus Tinggi/Sedang/Kecil)
- Added `cursor: pointer` inline style
- Added hint text di bawah matrix

### JavaScript Implementation

**File**: `src/frontend/js/fis.js`  
**Lines**: 1816-2301

#### 1. Global Variable untuk Data Storage

```javascript
// Line 1817
let fisActualEvaluationFullData = null;
```

**Purpose**: Menyimpan full data evaluasi untuk difilter saat modal dibuka

#### 2. Update Metrics Section dengan Handler Setup

```javascript
// Lines 1819-1863
function updateFISActualMetricsSection(result) {
    // Simpan full data
    fisActualEvaluationFullData = result.full_data || [];
    
    // Update confusion matrix values
    // ...
    
    // Setup click handlers
    setupConfusionMatrixClickHandlers();
}
```

**Changes**:
- Store `full_data` from backend response
- Call `setupConfusionMatrixClickHandlers()` after matrix update

#### 3. Setup Click Handlers Function

```javascript
// Lines 2116-2147
function setupConfusionMatrixClickHandlers() {
    // Remove existing handlers
    $('.cm-cell.clickable').off('click');
    
    // Add click handler
    $('.cm-cell.clickable').on('click', function() {
        const actualStatus = $(this).data('actual');
        const predictedCategory = $(this).data('predicted');
        const count = parseInt($(this).text()) || 0;
        
        if (count > 0) {
            showConfusionMatrixDetailModal(actualStatus, predictedCategory, count);
        } else {
            showNotification('Info', 'Tidak ada data untuk kombinasi ini', 'info');
        }
    });
    
    // Add hover effect
    $('.cm-cell.clickable').hover(
        function() { $(this).css('opacity', '0.7'); },
        function() { $(this).css('opacity', '1'); }
    );
}
```

**Features**:
- Prevent duplicate handlers dengan `.off('click')`
- Get data attributes from clicked cell
- Show modal if count > 0
- Hover effect untuk visual feedback

#### 4. Show Modal Function

```javascript
// Lines 2149-2287
function showConfusionMatrixDetailModal(actualStatus, predictedCategory, count) {
    // 1. Validate data exists
    if (!fisActualEvaluationFullData || fisActualEvaluationFullData.length === 0) {
        showNotification('Error', 'Data evaluasi tidak tersedia', 'error');
        return;
    }
    
    // 2. Filter data
    const filteredData = fisActualEvaluationFullData.filter(item => {
        return item.actual_status === actualStatus && 
               item.predicted_category === predictedCategory;
    });
    
    // 3. Check if filtered data exists
    if (filteredData.length === 0) {
        showNotification('Info', 'Tidak ada data detail untuk kombinasi ini', 'info');
        return;
    }
    
    // 4. Determine if prediction is correct
    const isCorrect = actualStatus.replace('LULUS_', '') === 
                      predictedCategory.replace('Peluang Lulus ', '').toUpperCase();
    
    // 5. Create modal with Kendo Dialog
    // 6. Initialize Kendo Grid inside modal
    // 7. Open modal
}
```

## 📊 Modal Components

### 1. Summary Card

```html
<div style="background: ${isCorrect ? '#e8f5e9' : '#ffebee'}; ...">
    <h4>
        <i class="fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
        ${isCorrect ? 'Prediksi Benar' : 'Prediksi Salah'}
    </h4>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
            <strong>Status Aktual:</strong>
            <span class="badge bg-${getStatusBadgeColor(actualStatus)}">
                ${actualLabel}
            </span>
        </div>
        <div>
            <strong>Prediksi FIS:</strong>
            <span class="badge ${getFISClassificationBadgeClass(predictedCategory)}">
                ${predictedCategory}
            </span>
        </div>
    </div>
    <div>
        <strong>Jumlah Mahasiswa:</strong> 
        ${filteredData.length} dari ${count} (${percentage}%)
    </div>
</div>
```

**Features**:
- Background color: Green (correct) / Red (incorrect)
- Icon: Check (correct) / Times (incorrect)
- Grid layout 2 columns untuk status dan prediksi
- Badge color-coded untuk categories
- Jumlah mahasiswa dengan persentase

### 2. Data Grid

```javascript
$('#cmDetailGridContainer').kendoGrid({
    dataSource: {
        data: filteredData,
        pageSize: 10
    },
    height: 400,
    scrollable: true,
    sortable: true,
    pageable: {
        refresh: true,
        pageSizes: [10, 20, 50],
        buttonCount: 5
    },
    columns: [
        { field: "nim", title: "NIM", width: 120 },
        { field: "nama", title: "Nama", width: 180 },
        { field: "ipk", title: "IPK", width: 80 },
        { field: "sks", title: "SKS", width: 80 },
        { field: "persen_dek", title: "% D/E/K", width: 100 },
        { field: "fuzzy_score", title: "Fuzzy Score", width: 120 }
    ]
});
```

**Features**:
- **Height**: 400px (scrollable)
- **Sortable**: All columns
- **Pageable**: 10, 20, 50 per page
- **Columns**: NIM, Nama, IPK, SKS, % D/E/K, Fuzzy Score

### 3. Dialog Properties

```javascript
const dialog = modalContent.kendoDialog({
    width: "900px",
    height: "700px",
    title: `Detail Confusion Matrix - ${actualLabel} → ${predictedCategory}`,
    closable: true,
    modal: true,
    actions: [{
        text: "Tutup",
        action: function() { return true; }
    }]
});
```

## 🎨 Visual Examples

### Example 1: Correct Prediction (Diagonal Cell)

**User clicks**: Actual Tinggi → Pred. Tinggi = 110

**Modal Display**:
```
┌────────────────────────────────────────────────────────────┐
│ Detail Confusion Matrix - LULUS TINGGI → Peluang Lulus   │
│                                             Tinggi     [×] │
├────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ✅ Prediksi Benar                           (green bg) │ │
│ │                                                        │ │
│ │ Status Aktual:          │  Prediksi FIS:             │ │
│ │ 🟢 LULUS TINGGI         │  🟢 Peluang Lulus Tinggi   │ │
│ │                                                        │ │
│ │ Jumlah Mahasiswa: 110 dari 110 (100.0%)               │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ NIM    │ Nama       │ IPK │ SKS │ D/E/K │ Fuzzy Score││ │
│ │────────┼────────────┼─────┼─────┼───────┼────────────││ │
│ │ 198121 │ Ahmad F.   │ 3.75│ 142 │ 5.20% │    87.50   ││ │
│ │ 198122 │ Budi S.    │ 3.85│ 148 │ 3.10% │    92.30   ││ │
│ │ ...    │ ...        │ ... │ ... │ ...   │    ...     ││ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Showing 1-10 of 110 items    [10][20][50]     << < > >>  │
│                                                            │
│                                      [Tutup]               │
└────────────────────────────────────────────────────────────┘
```

### Example 2: Incorrect Prediction (Off-Diagonal Cell)

**User clicks**: Actual Tinggi → Pred. Sedang = 8

**Modal Display**:
```
┌────────────────────────────────────────────────────────────┐
│ Detail Confusion Matrix - LULUS TINGGI → Peluang Lulus   │
│                                            Sedang      [×] │
├────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ❌ Prediksi Salah                            (red bg) │ │
│ │                                                        │ │
│ │ Status Aktual:          │  Prediksi FIS:             │ │
│ │ 🟢 LULUS TINGGI         │  🟡 Peluang Lulus Sedang   │ │
│ │                                                        │ │
│ │ Jumlah Mahasiswa: 8 dari 8 (100.0%)                   │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ NIM    │ Nama       │ IPK │ SKS │ D/E/K │ Fuzzy Score││ │
│ │────────┼────────────┼─────┼─────┼───────┼────────────││ │
│ │ 198145 │ Citra D.   │ 3.45│ 125 │ 8.70% │    72.30   ││ │
│ │ 198167 │ Deni A.    │ 3.52│ 128 │ 9.20% │    69.80   ││ │
│ │ ...    │ ...        │ ... │ ... │ ...   │    ...     ││ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Showing 1-8 of 8 items                         < >        │
│                                                            │
│                                      [Tutup]               │
└────────────────────────────────────────────────────────────┘
```

## 🔑 Key Features

### 1. Dynamic Filtering
```javascript
const filteredData = fisActualEvaluationFullData.filter(item => {
    return item.actual_status === actualStatus && 
           item.predicted_category === predictedCategory;
});
```

### 2. Prediction Correctness Check
```javascript
const isCorrect = actualStatus.replace('LULUS_', '') === 
                  predictedCategory.replace('Peluang Lulus ', '').toUpperCase();
```

**Logic**:
- `LULUS_TINGGI` vs `Peluang Lulus Tinggi` → `TINGGI` === `TINGGI` ✅
- `LULUS_TINGGI` vs `Peluang Lulus Sedang` → `TINGGI` === `SEDANG` ❌

### 3. Badge Color Mapping
```javascript
function getStatusBadgeColor(status) {
    switch(status) {
        case 'LULUS_TINGGI': return 'success';  // Green
        case 'LULUS_SEDANG': return 'warning';  // Yellow
        case 'LULUS_KECIL': return 'danger';    // Red
    }
}
```

### 4. Grid Cleanup on Close
```javascript
close: function() {
    const grid = $('#cmDetailGridContainer').data('kendoGrid');
    if (grid) {
        grid.destroy();
    }
}
```

**Purpose**: Prevent memory leaks dan duplicate grid instances

## 📊 Data Attributes Mapping

| Cell ID | data-actual | data-predicted |
|---------|-------------|----------------|
| fisActual-tt | LULUS_TINGGI | Peluang Lulus Tinggi |
| fisActual-ts | LULUS_TINGGI | Peluang Lulus Sedang |
| fisActual-tk | LULUS_TINGGI | Peluang Lulus Kecil |
| fisActual-st | LULUS_SEDANG | Peluang Lulus Tinggi |
| fisActual-ss | LULUS_SEDANG | Peluang Lulus Sedang |
| fisActual-sk | LULUS_SEDANG | Peluang Lulus Kecil |
| fisActual-kt | LULUS_KECIL | Peluang Lulus Tinggi |
| fisActual-ks | LULUS_KECIL | Peluang Lulus Sedang |
| fisActual-kk | LULUS_KECIL | Peluang Lulus Kecil |

## 🧪 Testing

### Test Scenarios

#### 1. Click Diagonal Cell (Correct Predictions)
- **Action**: Click "Actual Tinggi → Pred. Tinggi (110)"
- **Expected**: 
  - Modal opens
  - Summary shows "✅ Prediksi Benar" (green)
  - Grid shows 110 mahasiswa
  - All mahasiswa have status LULUS_TINGGI and prediction Peluang Lulus Tinggi

#### 2. Click Off-Diagonal Cell (Incorrect Predictions)
- **Action**: Click "Actual Tinggi → Pred. Sedang (8)"
- **Expected**:
  - Modal opens
  - Summary shows "❌ Prediksi Salah" (red)
  - Grid shows 8 mahasiswa
  - All mahasiswa have status LULUS_TINGGI but prediction Peluang Lulus Sedang

#### 3. Click Empty Cell (count = 0)
- **Action**: Click cell with value "0"
- **Expected**:
  - No modal opens
  - Notification: "Tidak ada data untuk kombinasi ini"

#### 4. Modal Interaction
- **Action**: Sort by IPK in modal grid
- **Expected**: Grid sorts correctly

- **Action**: Change page size to 20
- **Expected**: Grid updates to show 20 records per page

- **Action**: Click "Tutup"
- **Expected**: Modal closes, grid destroyed

#### 5. Hover Effect
- **Action**: Hover over any confusion matrix cell
- **Expected**: Cell opacity changes to 0.7, cursor shows pointer

## 📝 Files Modified

### 1. `src/frontend/index.html`
**Lines**: 2354-2378

**Changes**:
- Added `class="cm-cell clickable"` to all confusion matrix cells
- Added `data-actual` and `data-predicted` attributes
- Added `cursor: pointer` style
- Added hint text with mouse pointer icon

### 2. `src/frontend/js/fis.js`
**Lines**: 1816-2301

**Additions**:
- `fisActualEvaluationFullData` global variable (line 1817)
- Store full data in `updateFISActualMetricsSection()` (line 1825)
- `setupConfusionMatrixClickHandlers()` function (lines 2116-2147)
- `showConfusionMatrixDetailModal()` function (lines 2149-2287)
- `getStatusBadgeColor()` helper function (lines 2289-2301)

### 3. `CHANGELOG.md`
**Entry**: "NEW: Confusion Matrix Interactive Modal"

**Documentation**:
- Features list
- User interaction flow

## ✅ Benefits

### Before (Static Matrix)
- ❌ Hanya melihat angka
- ❌ Tidak tahu mahasiswa mana yang salah prediksi
- ❌ Sulit verify hasil
- ❌ Tidak interactive

### After (Interactive Modal)
- ✅ Drill-down ke detail mahasiswa
- ✅ Lihat karakteristik error
- ✅ Verify hasil dengan mudah
- ✅ Interactive & informative
- ✅ Educational untuk understanding model behavior

## 🎓 Use Cases

### 1. Error Analysis
**Scenario**: Model memprediksi 8 mahasiswa LULUS_TINGGI sebagai SEDANG

**Action**: Click cell "Actual Tinggi → Pred. Sedang (8)"

**Insight**: User dapat melihat:
- IPK range: 3.45-3.60 (borderline)
- D/E/K range: 8-12% (slightly high)
- Understanding: Model conservative untuk borderline cases

### 2. Model Verification
**Scenario**: Verify bahwa diagonal cells benar-benar correct predictions

**Action**: Click diagonal cell "Actual Tinggi → Pred. Tinggi (110)"

**Verification**: All 110 records match actual = predicted

### 3. Student Follow-up
**Scenario**: Admin ingin follow-up mahasiswa yang diprediksi salah

**Action**: Click off-diagonal cells, export NIM list

**Result**: Dapat list NIM untuk outreach

## 🔗 Related Documentation

- Backend: `docs/backend/STATUS_LULUS_3_KATEGORI.md`
- Frontend UI: `docs/frontend/FIS_ACTUAL_3_KATEGORI_UI.md`
- Full Data Grid: `docs/frontend/FIS_ACTUAL_FULL_DATA_GRID.md`
- Confusion Matrix Fix: `docs/troubleshooting/FIS_CONFUSION_MATRIX_DISPLAY_FIX.md`

## 📚 Technical Notes

### Performance Considerations
- **Client-side filtering**: Fast untuk dataset <1000 records
- **Grid destruction**: Prevents memory leaks
- **Event delegation**: Efficient event handling

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Kendo UI dependencies must be loaded

### Future Enhancements
- Export to Excel dari modal
- Print detail mahasiswa
- Highlight mahasiswa dengan score threshold
- Add more columns (Program Studi, Semester)

