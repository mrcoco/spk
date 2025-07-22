# SPK Monitoring Mahasiswa Akhir Masa Studi

Sistem Pendukung Keputusan (SPK) untuk monitoring mahasiswa akhir masa studi menggunakan metode Fuzzy Logic dan SAW (Simple Additive Weighting).

## 📋 Deskripsi
Aplikasi ini membantu pengambilan keputusan monitoring mahasiswa akhir masa studi dengan dua metode utama:
- **Fuzzy Logic**: Klasifikasi kelulusan mahasiswa
- **SAW (Simple Additive Weighting)**: Perankingan dan evaluasi mahasiswa

## 🏗️ Struktur Project
```
spk/
├── backup/                     # Backup dan dump database
├── docker_results/             # Hasil evaluasi dari container
├── CHANGELOG.md                # Riwayat perubahan aplikasi
├── docker-compose.yml          # Konfigurasi Docker
├── env.example                 # Contoh environment variable
├── docs/                       # Dokumentasi lengkap
│   ├── api/                    # Dokumentasi API
│   ├── backend/                # Dokumentasi backend
│   ├── database/               # Dokumentasi database
│   ├── deployment/             # Dokumentasi deployment
│   ├── features/               # Dokumentasi fitur utama (SAW, FIS, Comparison, dsb)
│   ├── frontend/               # Dokumentasi frontend
│   └── troubleshooting/        # Solusi masalah
├── src/
│   ├── backend/                # Backend FastAPI
│   │   ├── routers/            # API routers (saw, fuzzy, users, dsb)
│   │   └── tools/              # Development tools & scripts
│   └── frontend/               # Frontend HTML/CSS/JS
│       ├── js/                 # JavaScript utama (SAW, FIS, Comparison, dsb)
│       └── test/               # File HTML test
└── postgres_data/              # Data PostgreSQL
```

## 🚀 Quick Start

### Prasyarat
- Docker & Docker Compose

### Instalasi & Menjalankan
```bash
# Clone repository
$ git clone <repository-url>
$ cd spk

# Jalankan aplikasi
$ docker-compose up -d

# Akses aplikasi
# Frontend: http://localhost:8080
# Backend API: http://localhost:8000
```

### (Opsional) Restore Database
Lihat `docs/database/README_DATABASE_RESTORE.md` untuk instruksi restore data real.

## 📚 Dokumentasi Penting
- **[CHANGELOG.md](CHANGELOG.md)** - Riwayat perubahan aplikasi
- **[docs/README.md](docs/README.md)** - Dokumentasi lengkap
- **[docs/features/README_EVALUASI_SAW.md](docs/features/README_EVALUASI_SAW.md)** - Dokumentasi evaluasi SAW
- **[docs/features/README_ENHANCED_EVALUATION.md](docs/features/README_ENHANCED_EVALUATION.md)** - Enhanced Evaluation System
- **[docs/frontend/SAW_COMPARISON_IMPLEMENTATION.md](docs/frontend/SAW_COMPARISON_IMPLEMENTATION.md)** - Implementasi perbandingan SAW
- **[docs/frontend/SAW_EVALUATION_ACTUAL_IMPLEMENTATION.md](docs/frontend/SAW_EVALUATION_ACTUAL_IMPLEMENTATION.md)** - Evaluasi SAW dengan data aktual
- **[docs/features/README_EVALUASI_FIS.md](docs/features/README_EVALUASI_FIS.md)** - Dokumentasi perbandingan evaluasi FIS dengan data aktual kelulusan
- **[docs/evaluation/DOKUMENTASI_LENGKAP_EVALUASI_FIS.md](docs/evaluation/DOKUMENTASI_LENGKAP_EVALUASI_FIS.md)** - Dokumentasi lengkap evaluasi FIS: penjelasan metode, alur evaluasi, contoh hasil, dan analisis performa model FIS secara detail.
- **[docs/evaluation/DOKUMENTASI_PERBANDINGAN_EVALUASI_SAW.md](docs/evaluation/DOKUMENTASI_PERBANDINGAN_EVALUASI_SAW.md)** - Dokumentasi lengkap perbandingan evaluasi SAW synthetic vs data aktual: teori, rumus, contoh, script Python, visualisasi, dan analisis gap.

## 🔧 Teknologi yang Digunakan

### Backend
- **Python 3.9+**
- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **Alembic** - Database migration
- **Fuzzy Logic** - Algoritma klasifikasi
- **SAW** - Algoritma perankingan

### Frontend
- **HTML5/CSS3/JavaScript**
- **Bootstrap** - UI framework
- **jQuery**
- **Chart.js 4.x** - Visualisasi data
- **Kendo UI** - Advanced UI components
- **Font Awesome**
- **Custom CSS** - Gradient, animasi, responsive

### Deployment
- **Docker** & **Docker Compose**
- **Nginx** (reverse proxy)

## 📊 Fitur Utama
- **Manajemen Data Mahasiswa** (CRUD)
- **Klasifikasi Fuzzy Logic** (berdasarkan IPK, SKS, DEK)
- **Perankingan & Evaluasi SAW** (synthetic & actual)
- **Perbandingan Evaluasi SAW**: Synthetic vs Actual, summary-card, metrics, confusion matrix, chart, narrative analysis
- **Dokumentasi Lengkap Perbandingan Evaluasi SAW**: Penjelasan teori, rumus, contoh manual, script Python, visualisasi, dan analisis gap antara hasil prediksi dan data aktual. Lihat [DOKUMENTASI_PERBANDINGAN_EVALUASI_SAW.md](docs/evaluation/DOKUMENTASI_PERBANDINGAN_EVALUASI_SAW.md)
- **Perbandingan Evaluasi FIS dengan Data Aktual**: Bandingkan hasil evaluasi FIS (Fuzzy Inference System) dengan data kelulusan aktual mahasiswa. Fitur ini menampilkan summary-card, confusion matrix, metrik evaluasi (akurasi, presisi, recall, F1-score), serta analisis narasi otomatis untuk membandingkan performa model dengan realita.
- **Enhanced Confusion Matrix**: Bubble chart, heatmap, color coding, tooltip
- **Dynamic Narrative Analysis**: Analisis narasi otomatis berdasarkan hasil evaluasi
- **Export & Print**: Export hasil evaluasi/perbandingan ke CSV/Excel/Print
- **Responsive Summary Card**: Summary-card proporsional di semua device
- **Modular JavaScript**: SAWComparison, FISEvaluation, dsb
- **User Management**: Manajemen user (lihat docs/features/README_MANAGEMENT_USERS.md)

## 🎨 UI/UX Features
- **Modern Card Layout**: Semua hasil evaluasi & perbandingan menggunakan card design
- **Gradient Buttons & Animations**: Button dengan gradient, shimmer, pulse, hover
- **Consistent & Responsive Design**: Layout konsisten, proporsional, dan responsif di desktop/tablet/mobile
- **Color Coding & Icon**: Warna dan icon berbeda untuk setiap status/kategori
- **Interactive Feedback**: Feedback visual yang jelas saat interaksi

## 🤝 Kontribusi
Silakan baca dokumentasi di folder `docs/` dan ikuti panduan kontribusi. Semua perubahan harap didokumentasikan di CHANGELOG.md.

## 📄 License
Project ini dikembangkan untuk keperluan akademis dan monitoring masa studi mahasiswa.