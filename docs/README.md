# SPK Monitoring Masa Studi - Documentation

## 📚 Overview

Dokumentasi lengkap untuk aplikasi SPK (Sistem Pendukung Keputusan) Monitoring Masa Studi. Aplikasi ini membantu dalam pengambilan keputusan terkait monitoring masa studi mahasiswa menggunakan metode SAW (Simple Additive Weighting) dan Fuzzy Logic.

## 📋 Struktur Dokumentasi

### 🗄️ Database
- **[Database Restore Guide](database/README_DATABASE_RESTORE.md)** - Panduan lengkap restore database
- **[Restore by Table](database/README_RESTORE_BY_TABLE.md)** - Metode restore per-tabel untuk database besar
- **[Database Schema](database/SCHEMA.md)** - Skema database dan relasi tabel

### 🔌 API
- **[API Documentation](api/README.md)** - Dokumentasi endpoint API
- **Database Schema** - Skema database dan relasi tabel (akan ditambahkan)

### 🚀 Deployment
- **[Docker Setup](deployment/README.md)** - Panduan deployment dengan Docker
- **[Environment Configuration](deployment/README_ENVIRONMENT.md)** - Konfigurasi environment variables

### 🐍 Backend
- **[Backend Documentation](backend/README.md)** - Dokumentasi lengkap backend
- **[API Documentation](api/README.md)** - Dokumentasi endpoint API

### 🌐 Frontend
- **[Frontend Documentation](frontend/README.md)** - Dokumentasi lengkap frontend

### 🔧 Troubleshooting
- **[Troubleshooting Guide](troubleshooting/README.md)** - Panduan troubleshooting lengkap

## 🎯 Quick Start

### 1. Setup Database
```bash
# Restore database menggunakan menu interaktif
cd src/backend
./restore_menu.sh

# Atau restore langsung per-tabel (recommended untuk database besar)
./restore_by_table.sh
```

### 2. Start Application
```bash
# Start semua container
docker-compose up -d

# Check status
docker-compose ps
```

### 3. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Database**: localhost:5432

## 🔧 Development

### Prerequisites
- Docker & Docker Compose
- Python 3.8+
- PostgreSQL 13+

### Project Structure
```
spk/
├── docs/                    # 📚 Dokumentasi
│   ├── database/           # 🗄️ Database documentation
│   ├── api/               # 🔌 API documentation
│   └── deployment/        # 🚀 Deployment guides
├── src/                    # 💻 Source code
│   ├── backend/           # 🐍 Backend (FastAPI)
│   └── frontend/          # 🌐 Frontend (HTML/CSS/JS)
├── postgres_data/         # 🗃️ Database data
└── docker-compose.yml     # 🐳 Docker configuration
```

## 📊 Features

### 🎓 Student Management
- Data mahasiswa dengan informasi lengkap
- Monitoring masa studi
- Klasifikasi kelulusan

### 📈 Decision Support
- **SAW Method** - Simple Additive Weighting
- **Fuzzy Logic** - Logika fuzzy untuk klasifikasi
- Perbandingan metode decision support

### 📊 Analytics
- Dashboard monitoring
- Laporan analisis
- Visualisasi data

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM untuk database
- **Alembic** - Database migration
- **PostgreSQL** - Database

### Frontend
- **HTML5/CSS3** - Structure dan styling
- **JavaScript** - Interaktivitas
- **Bootstrap** - UI framework
- **Chart.js** - Data visualization

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy

## 🔍 Monitoring & Maintenance

### Database Operations
```bash
# Test database connection
cd src/backend
python test_db_connection.py

# Monitor restore progress
python monitor_restore.py monitor

# Check database status
docker exec spk-backend-1 python test_db_connection.py
```

### Container Management
```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update containers
docker-compose pull && docker-compose up -d
```

## 📞 Support

### Troubleshooting
1. **Database Issues** - Lihat [Database Restore Guide](database/README_DATABASE_RESTORE.md)
2. **Container Issues** - Check logs dengan `docker-compose logs`
3. **Connection Issues** - Test koneksi dengan `./restore_by_table.sh -t`

### Logs Location
- **Backend**: `docker logs spk-backend-1`
- **Database**: `docker logs spk-db-1`
- **Frontend**: `docker logs spk-frontend-1`

## 📝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### Code Standards
- Python: PEP 8
- JavaScript: ESLint
- Documentation: Markdown

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎉 Acknowledgments

- Universitas untuk data mahasiswa
- Open source community untuk tools dan libraries
- Contributors dan maintainers

---

**SPK Monitoring Masa Studi** - Sistem Pendukung Keputusan untuk monitoring masa studi mahasiswa 🎓 