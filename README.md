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
│   └── troubleshooting/      # Dokumentasi troubleshooting
├── postgres_data/            # Data PostgreSQL
└── src/
    ├── backend/              # Backend FastAPI
    └── frontend/             # Frontend HTML/CSS/JS
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

## 📊 Fitur Utama

- **Manajemen Data Mahasiswa** - CRUD data mahasiswa
- **Klasifikasi Fuzzy Logic** - Klasifikasi kelulusan berdasarkan IPK, SKS, dan persentase DEK
- **Perankingan SAW** - Perankingan mahasiswa berdasarkan kriteria
- **Visualisasi Data** - Grafik dan chart untuk analisis
- **Export Data** - Export hasil ke Excel/PDF
- **Monitoring Real-time** - Dashboard monitoring masa studi

## 🤝 Kontribusi

Untuk berkontribusi pada project ini, silakan baca dokumentasi di folder `docs/` dan ikuti panduan yang ada.

## 📄 License

Project ini dikembangkan untuk keperluan akademis dan monitoring masa studi mahasiswa.