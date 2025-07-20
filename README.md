# SPK Monitoring Masa Studi

Sistem Pendukung Keputusan (SPK) untuk monitoring masa studi mahasiswa menggunakan metode Fuzzy Logic dan SAW (Simple Additive Weighting).

## 📋 Deskripsi

Aplikasi ini membantu dalam pengambilan keputusan untuk monitoring masa studi mahasiswa dengan mengkombinasikan dua metode:
- **Fuzzy Logic**: Untuk klasifikasi kelulusan mahasiswa
- **SAW (Simple Additive Weighting)**: Untuk perankingan mahasiswa

## 🏗️ Struktur Project

```
spk/
├── CHANGELOG.md              # Riwayat perubahan aplikasi
├── docker-compose.yml        # Konfigurasi Docker
├── docs/                     # Dokumentasi lengkap
│   ├── api/                  # Dokumentasi API
│   ├── backend/              # Dokumentasi backend
│   ├── database/             # Dokumentasi database
│   ├── deployment/           # Dokumentasi deployment
│   ├── frontend/             # Dokumentasi frontend
│   ├── features/             # Dokumentasi fitur
│   └── troubleshooting/      # Dokumentasi troubleshooting
├── postgres_data/            # Data PostgreSQL
└── src/
    ├── backend/              # Backend FastAPI
    │   └── tools/            # Development tools dan testing scripts
    └── frontend/             # Frontend HTML/CSS/JS
        └── test/             # HTML test files
```

## 🚀 Quick Start

### Prerequisites
- Docker
- Docker Compose

### Installation
```bash
# Clone repository
git clone <repository-url>
cd spk

# Start aplikasi
docker-compose up -d

# Akses aplikasi
# Frontend: http://localhost:8080
# Backend API: http://localhost:8000
```

## 📚 Dokumentasi

- **[CHANGELOG.md](CHANGELOG.md)** - Riwayat perubahan dan update aplikasi
- **[docs/README.md](docs/README.md)** - Dokumentasi lengkap aplikasi
- **[docs/features/README_ENHANCED_EVALUATION.md](docs/features/README_ENHANCED_EVALUATION.md)** - Dokumentasi Enhanced Evaluation System

## 🔧 Teknologi yang Digunakan

### Backend
- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **Alembic** - Database migration
- **Fuzzy Logic** - Algoritma klasifikasi
- **SAW** - Algoritma perankingan

### Frontend
- **HTML5/CSS3/JavaScript** - Frontend framework
- **Bootstrap** - UI framework
- **jQuery** - JavaScript library
- **Chart.js** - Data visualization
- **Kendo UI** - Advanced UI components
- **Font Awesome** - Icon library
- **Custom CSS** - Gradient buttons dan animations

## 📊 Fitur Utama

- **Manajemen Data Mahasiswa** - CRUD data mahasiswa
- **Klasifikasi Fuzzy Logic** - Klasifikasi kelulusan berdasarkan IPK, SKS, dan persentase DEK
- **Perankingan SAW** - Perankingan mahasiswa berdasarkan kriteria
- **Visualisasi Data** - Grafik dan chart untuk analisis
- **Export Data** - Export hasil ke Excel/PDF
- **Monitoring Real-time** - Dashboard monitoring masa studi
- **Custom UI Elements** - Button dengan gradient dan animasi yang menarik

## 🎨 UI/UX Features

### Modern Design Elements
- **Gradient Buttons**: Button dengan gradient yang menarik untuk FIS, SAW, dan Sync Nilai
- **Consistent Button Styling**: Semua button menggunakan custom styling yang konsisten
- **Hover Effects**: Efek hover dengan transform dan shadow yang smooth
- **Shimmer Animation**: Efek shimmer saat hover pada button
- **Icon Animations**: Animasi pulse pada icon button
- **Responsive Design**: Design yang responsif untuk semua ukuran layar
- **Color Differentiation**: Warna yang berbeda untuk setiap fungsi button
- **Interactive Feedback**: Feedback visual yang jelas saat interaksi
- **Unified Design**: Harmoni visual di seluruh interface aplikasi
- **Complete Button Consistency**: Semua button di aplikasi menggunakan custom styling yang konsisten

### Batch Results Design
- **Card Layout**: Hasil analisis batch menggunakan card design yang menarik
- **Consistent Design**: Layout yang konsisten antara FIS dan SAW
- **Percentage Display**: Informasi persentase untuk setiap kategori klasifikasi
- **Icon Integration**: Icon yang sesuai untuk setiap kategori (arrow-up, minus, arrow-down, users)
- **Professional Look**: Tampilan yang lebih profesional dan modern
- **Real-time Updates**: Data diperbarui secara real-time setelah klasifikasi batch
- **Before/After Comparison**: Tampilan perbandingan data sebelum dan sesudah klasifikasi
- **Processing Time**: Informasi waktu pemrosesan batch
- **Change Summary**: Ringkasan perubahan terbesar yang terjadi
- **Visual Comparison**: Layout side-by-side dengan arrow indicator dan animasi
- **Server-Side Search**: Pencarian data keseluruhan dengan server-side filtering
- **Real-Time Search**: Pencarian real-time dengan debounce untuk performa optimal
- **Enhanced Search UX**: Feedback yang lebih baik untuk user experience pencarian

### Button Color Scheme
- **Sync Button**: Soft Purple gradient (#5a67d8 → #667eea)
- **FIS Button**: Soft Red gradient (#e53e3e → #f56565)
- **SAW Button**: Soft Blue gradient (#3182ce → #4299e1)

## 🤝 Kontribusi

Untuk berkontribusi pada project ini, silakan baca dokumentasi di folder `docs/` dan ikuti panduan yang ada.

## 📄 License

Project ini dikembangkan untuk keperluan akademis dan monitoring masa studi mahasiswa.