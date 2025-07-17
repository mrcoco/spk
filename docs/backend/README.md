# Backend Documentation

## 🐍 Overview

Dokumentasi lengkap untuk backend aplikasi SPK Monitoring Masa Studi yang menggunakan FastAPI, SQLAlchemy, dan PostgreSQL.

## 📋 Documentation Files

### 🔧 Configuration & Setup
- **[Environment Configuration](README_CONFIG.md)** - Konfigurasi environment variables
- **[Environment Troubleshooting](README_ENV_TROUBLESHOOTING.md)** - Troubleshooting environment issues

### 🗄️ Database Management
- **[Database Seeder](README_SEEDER.md)** - Panduan seeding database
- **[Database Restore](README_RESTORE.md)** - Panduan restore database
- **[PostgreSQL Container](README_PSQL_CONTAINER.md)** - Setup PostgreSQL di container
- **[PostgreSQL Summary](README_PSQL_SUMMARY.md)** - Ringkasan PostgreSQL setup
- **[PostgreSQL Final](README_PSQL_FINAL.md)** - Setup PostgreSQL final

### 🐳 Docker & Deployment
- **[Docker Restore](README_DOCKER_RESTORE.md)** - Restore database menggunakan Docker

### 🔧 Development Tools
- **[Backend Tools](../backend/tools/README.md)** - Utility tools dan scripts untuk development

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 2. Database Setup
```bash
# Restore database
./tools/restore_by_table.sh

# Or use interactive menu
./tools/restore_menu.sh
```

### 3. Start Backend
```bash
# Start with Docker
docker-compose up -d backend

# Or run locally
python main.py
```

## 🔧 Technology Stack

### Core Framework
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM untuk database
- **Alembic** - Database migration
- **Pydantic** - Data validation

### Database
- **PostgreSQL** - Primary database
- **psycopg2** - PostgreSQL adapter

### Development Tools
- **uvicorn** - ASGI server
- **pytest** - Testing framework
- **black** - Code formatter
- **flake8** - Linter

## 📁 Project Structure

```
src/backend/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration management
├── database.py            # Database connection
├── models.py              # SQLAlchemy models
├── schemas.py             # Pydantic schemas
├── routers/               # API routes
│   ├── students.py        # Student endpoints
│   ├── saw.py            # SAW calculation endpoints
│   ├── fuzzy.py          # Fuzzy logic endpoints
│   └── ...
├── saw_logic.py          # SAW algorithm implementation
├── fuzzy_logic.py        # Fuzzy logic implementation
├── alembic/              # Database migrations
└── tools/                # Utility tools dan scripts
    ├── README.md         # Dokumentasi tools
    ├── restore_*.py      # Database restore scripts
    ├── test_*.py         # Test scripts
    ├── monitor_*.py      # Monitoring scripts
    ├── seeders.py        # Data seeder
    └── docker.sh         # Docker management
```

## 🔌 API Endpoints

### Students
- `GET /students` - Get all students
- `GET /students/{id}` - Get student by ID
- `POST /students` - Create new student
- `PUT /students/{id}` - Update student
- `DELETE /students/{id}` - Delete student

### SAW Method
- `POST /saw/calculate` - Calculate SAW scores
- `GET /saw/results` - Get SAW results
- `GET /saw/results/{id}` - Get SAW result by ID

### Fuzzy Logic
- `POST /fuzzy/classify` - Classify student using fuzzy logic
- `GET /fuzzy/results` - Get fuzzy classification results

### Batch Operations
- `POST /batch/saw` - Process batch SAW calculation
- `POST /batch/fuzzy` - Process batch fuzzy classification

### Analytics
- `GET /analytics/stats` - Get statistics
- `GET /comparison/results` - Get comparison results

## 🗄️ Database Models

### Core Models
- **Student** - Mahasiswa data
- **Grade** - Nilai mahasiswa
- **Classification** - Fuzzy classification results
- **SAWCriteria** - SAW criteria
- **SAWResult** - SAW calculation results
- **SAWFinalResult** - Final SAW results

### Relationships
```
Student (1) ←→ (N) Grade
Student (1) ←→ (1) Classification
Student (1) ←→ (1) SAWFinalResult
Student (1) ←→ (N) SAWResult
SAWCriteria (1) ←→ (N) SAWResult
```

## 🔍 Development

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Testing
```bash
# Run all tests
pytest

# Run specific test
pytest tests/test_students.py

# Run with coverage
pytest --cov=app tests/
```

### Code Quality
```bash
# Format code
black .

# Check linting
flake8 .

# Type checking
mypy .
```

## 📊 Monitoring

### Health Checks
```bash
# Check API health
curl http://localhost:8000/health

# Check database connection
python tools/test_db_connection.py
```

### Logs
```bash
# View application logs
docker logs spk-backend-1

# View database logs
docker logs spk-db-1
```

## 🔒 Security

### Current Security Measures
- Input validation dengan Pydantic
- SQL injection protection dengan SQLAlchemy
- CORS enabled untuk frontend

### Environment Variables
```bash
# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=spk_db
DB_USER=spk_user
DB_PASSWORD=spk_password

# Application
DEBUG=false
LOG_LEVEL=INFO
```

## 🐛 Troubleshooting

### Common Issues
1. **Database Connection** - Check environment variables
2. **Migration Errors** - Run `alembic upgrade head`
3. **Import Errors** - Check Python path and dependencies
4. **Port Conflicts** - Change port in configuration

### Debug Mode
```bash
# Enable debug logging
export DEBUG=true
export LOG_LEVEL=DEBUG

# Start with debug
uvicorn main:app --reload --log-level debug
```

## 📈 Performance

### Optimization Tips
- Use database indexes for frequently queried columns
- Implement connection pooling
- Use async operations where possible
- Cache frequently accessed data

### Monitoring
- Monitor database query performance
- Track API response times
- Monitor memory usage
- Check error rates

---

**Backend Documentation** - SPK Monitoring Masa Studi 🐍 