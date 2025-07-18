# Grid Pagination - Dokumentasi

## Overview

Fitur pagination telah ditambahkan pada grid data mahasiswa untuk meningkatkan performa dan user experience ketika menangani data dalam jumlah besar.

## Fitur Pagination

### 1. Page Size Options
- **10 items per page** (default)
- **20 items per page**
- **50 items per page**
- **100 items per page**

### 2. Navigation Controls
- **First Page**: Tombol untuk ke halaman pertama
- **Previous Page**: Tombol untuk ke halaman sebelumnya
- **Page Numbers**: Tombol nomor halaman (maksimal 5 tombol)
- **Next Page**: Tombol untuk ke halaman berikutnya
- **Last Page**: Tombol untuk ke halaman terakhir

### 3. Page Information
- **Display Info**: "Menampilkan {0} - {1} dari {2} data"
- **Empty State**: "Tidak ada data untuk ditampilkan"
- **Page Counter**: "Halaman X dari Y"

### 4. Refresh Functionality
- **Refresh Button**: Tombol untuk memperbarui data dari server
- **Auto Refresh**: Otomatis refresh saat melakukan operasi CRUD

## Implementasi Teknis

### JavaScript Configuration

```javascript
// Konfigurasi pagination di mahasiswa.js
pageable: {
    refresh: true,
    pageSizes: [10, 20, 50, 100],
    buttonCount: 5,
    info: true,
    messages: {
        display: "Menampilkan {0} - {1} dari {2} data",
        empty: "Tidak ada data untuk ditampilkan",
        page: "Halaman",
        of: "dari {0}",
        itemsPerPage: "item per halaman",
        first: "Ke halaman pertama",
        previous: "Ke halaman sebelumnya",
        next: "Ke halaman berikutnya",
        last: "Ke halaman terakhir",
        refresh: "Refresh"
    }
}
```

### DataSource Configuration

```javascript
// Konfigurasi DataSource untuk server-side pagination
mahasiswaDataSource = new kendo.data.DataSource({
    transport: {
        read: {
            url: CONFIG.getApiUrl(CONFIG.ENDPOINTS.MAHASISWA),
            dataType: "json",
            type: "GET"
        }
    },
    parameterMap: function(data, type) {
        if (type === "read") {
            return {
                skip: data.skip || 0,
                limit: data.take || 10
            };
        }
        return data;
    },
    schema: {
        data: "data",
        total: "total"
    },
    pageSize: 10,
    serverPaging: true,
    serverSorting: true
});
```

## Styling CSS

### Pagination Container
```css
.k-grid .k-pager-wrap {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-top: 1px solid #dee2e6;
    padding: 12px 16px;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 -2px 4px rgba(0,0,0,0.05);
}
```

### Navigation Buttons
```css
.k-grid .k-pager-wrap .k-pager-nav .k-button {
    border: 2px solid #ced4da;
    background: white;
    color: #495057;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    min-width: 40px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}
```

### Hover Effects
```css
.k-grid .k-pager-wrap .k-pager-nav .k-button:hover {
    border-color: #007bff;
    background: #007bff;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,123,255,0.3);
}
```

## Responsive Design

### Desktop (768px+)
- Pagination horizontal dengan semua elemen dalam satu baris
- Tombol navigasi dengan ukuran normal (40px x 36px)
- Dropdown page size di sebelah kiri

### Tablet (480px - 768px)
- Pagination vertikal dengan elemen tersusun
- Tombol navigasi dengan ukuran medium (36px x 32px)
- Dropdown page size di atas tombol navigasi

### Mobile (< 480px)
- Pagination compact dengan elemen tersusun
- Tombol navigasi dengan ukuran kecil (32px x 28px)
- Font size yang disesuaikan untuk mobile

## Dark Mode Support

```css
@media (prefers-color-scheme: dark) {
    .k-grid .k-pager-wrap {
        background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
        border-top-color: #4a5568;
    }
    
    .k-grid .k-pager-wrap .k-pager-nav .k-button {
        border-color: #4a5568;
        background: #2d3748;
        color: #e2e8f0;
    }
}
```

## API Integration

### Backend Requirements
- Endpoint harus mendukung parameter `skip` dan `limit`
- Response harus memiliki format:
  ```json
  {
    "data": [...],
    "total": 100
  }
  ```

### Parameter Mapping
- `skip`: Offset untuk pagination
- `limit`: Jumlah item per halaman
- `sort`: Sorting field dan direction
- `filter`: Filter criteria

## Performance Benefits

### Server-side Pagination
- **Reduced Memory Usage**: Hanya load data yang diperlukan
- **Faster Initial Load**: Tidak perlu load semua data sekaligus
- **Better Scalability**: Mendukung dataset yang sangat besar
- **Network Efficiency**: Transfer data yang minimal

### Client-side Optimization
- **Caching**: Data halaman di-cache untuk navigasi cepat
- **Lazy Loading**: Load data saat diperlukan
- **Smooth Navigation**: Transisi halaman yang smooth

## Troubleshooting

### Common Issues

1. **Pagination tidak muncul**
   - Pastikan `serverPaging: true` di DataSource
   - Pastikan `pageable: true` di Grid configuration

2. **Data tidak ter-update**
   - Pastikan backend mengembalikan format response yang benar
   - Check parameter `skip` dan `limit` di request

3. **Styling tidak konsisten**
   - Pastikan CSS pagination sudah dimuat
   - Check konflik dengan styling Kendo UI

### Debug Tips

```javascript
// Debug pagination state
const grid = $("#mahasiswaGrid").data("kendoGrid");
console.log("Current page:", grid.dataSource.page());
console.log("Page size:", grid.dataSource.pageSize());
console.log("Total records:", grid.dataSource.total());
```

## Best Practices

1. **Page Size Selection**: Gunakan page size yang sesuai dengan jumlah data
2. **Navigation**: Sediakan multiple cara navigasi (page numbers, first/last)
3. **Loading States**: Tampilkan loading indicator saat pindah halaman
4. **Error Handling**: Handle error saat request pagination gagal
5. **Accessibility**: Pastikan pagination accessible dengan keyboard

## Future Enhancements

1. **Infinite Scroll**: Alternatif untuk pagination tradisional
2. **Virtual Scrolling**: Untuk dataset yang sangat besar
3. **Custom Page Sizes**: User dapat input custom page size
4. **Page Jump**: Input field untuk langsung ke halaman tertentu
5. **Export Pagination**: Export data dengan pagination 