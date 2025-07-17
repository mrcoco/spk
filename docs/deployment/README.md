# Deployment Guide

## 🚀 Overview

Panduan lengkap untuk deployment aplikasi SPK Monitoring Masa Studi menggunakan Docker dan Docker Compose.

## 📋 Prerequisites

### System Requirements
- **OS**: Linux, macOS, atau Windows dengan WSL2
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Memory**: Minimum 4GB RAM
- **Storage**: Minimum 10GB free space
- **Network**: Port 3000, 8000, dan 5432 harus tersedia

### Software Installation
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## 🔧 Environment Configuration

### Environment Variables
Untuk dokumentasi lengkap environment variables, lihat **[README_ENVIRONMENT.md](README_ENVIRONMENT.md)**.

Buat file `.env` di root directory:

```bash
# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_NAME=spk_db
DB_USER=spk_user
DB_PASSWORD=spk_password

# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=false

# Frontend Configuration
FRONTEND_PORT=3000

# Docker Configuration
COMPOSE_PROJECT_NAME=spk
```

### Production Environment
Untuk production, gunakan environment variables yang lebih aman:

```bash
# Database Configuration
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=spk_production
DB_USER=spk_prod_user
DB_PASSWORD=your-secure-password

# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=false
LOG_LEVEL=INFO

# Security
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=your-domain.com
```

## 🐳 Docker Setup

### Project Structure
```
spk/
├── docker-compose.yml          # Main compose file
├── .env                        # Environment variables
├── docs/                       # Documentation
├── src/
│   ├── backend/
│   │   ├── Dockerfile         # Backend container
│   │   └── ...
│   └── frontend/
│       ├── Dockerfile         # Frontend container
│       └── ...
└── postgres_data/             # Database persistence
```

### Docker Compose Configuration
```yaml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./src/backend
    environment:
      DB_HOST: db
      DB_PORT: ${DB_PORT}
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DEBUG: ${DEBUG}
    ports:
      - "${BACKEND_PORT}:8000"
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./src/backend:/app
      - ./backup-public.sql:/app/backup-public.sql
    restart: unless-stopped

  frontend:
    build: ./src/frontend
    ports:
      - "${FRONTEND_PORT}:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

## 🚀 Deployment Steps

### 1. Clone Repository
```bash
git clone https://github.com/your-username/spk-monitoring.git
cd spk-monitoring
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Build and Start Services
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### 4. Initialize Database
```bash
# Restore database
cd src/backend
./restore_by_table.sh

# Or use interactive menu
./restore_menu.sh
```

### 5. Verify Deployment
```bash
# Check all services are running
docker-compose ps

# Test backend API
curl http://localhost:8000/health

# Test frontend
curl http://localhost:3000

# Check logs
docker-compose logs -f
```

## 🔍 Monitoring & Maintenance

### Health Checks
```bash
# Check service health
docker-compose ps

# Check individual service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Check resource usage
docker stats
```

### Database Maintenance
```bash
# Backup database
docker exec spk-backend-1 pg_dump -h db -U spk_user -d spk_db > backup-$(date +%Y%m%d).sql

# Restore database
cd src/backend
./restore_by_table.sh

# Monitor database size
docker exec spk-db-1 psql -U spk_user -d spk_db -c "SELECT pg_size_pretty(pg_database_size('spk_db'));"
```

### Application Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check for updates
docker-compose pull
docker-compose up -d
```

## 🔒 Security Configuration

### Network Security
```bash
# Restrict database access
# Edit docker-compose.yml
services:
  db:
    ports:
      - "127.0.0.1:5432:5432"  # Only localhost access
```

### SSL/TLS Configuration
```bash
# For production, add SSL certificates
# Create ssl/ directory
mkdir ssl
cp your-cert.pem ssl/
cp your-key.pem ssl/

# Update nginx configuration
# Edit src/frontend/nginx.conf
```

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 📊 Performance Optimization

### Resource Limits
```yaml
# Add to docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

### Database Optimization
```sql
-- Optimize PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
```

### Nginx Optimization
```nginx
# Add to src/frontend/nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## 🔄 Backup & Recovery

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
CONTAINER_NAME="spk-backend-1"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec $CONTAINER_NAME pg_dump -h db -U spk_user -d spk_db > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### Recovery Procedure
```bash
# Stop services
docker-compose down

# Restore database
cd src/backend
./restore_by_table.sh backup_20240115_143022.sql

# Start services
docker-compose up -d

# Verify recovery
curl http://localhost:8000/health
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -h

# Restart Docker
sudo systemctl restart docker
```

#### 2. Database Connection Issues
```bash
# Check database container
docker-compose ps db

# Check database logs
docker-compose logs db

# Test connection
docker exec spk-backend-1 python test_db_connection.py
```

#### 3. Port Conflicts
```bash
# Check port usage
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :5432

# Change ports in .env if needed
FRONTEND_PORT=3001
BACKEND_PORT=8001
```

#### 4. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x src/backend/*.sh

# Fix Docker permissions
sudo usermod -aG docker $USER
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=true
export LOG_LEVEL=DEBUG

# Restart with debug
docker-compose down
docker-compose up -d

# View detailed logs
docker-compose logs -f backend
```

## 📈 Scaling

### Horizontal Scaling
```yaml
# Scale backend services
docker-compose up -d --scale backend=3

# Add load balancer
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
```

### Vertical Scaling
```yaml
# Increase resource limits
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.4
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd /opt/spk
            git pull origin main
            docker-compose down
            docker-compose build --no-cache
            docker-compose up -d
```

## 📞 Support

### Logs Location
- **Application logs**: `docker-compose logs -f`
- **System logs**: `/var/log/docker/`
- **Database logs**: `docker-compose logs db`

### Monitoring Tools
```bash
# Install monitoring tools
sudo apt-get install htop iotop

# Monitor system resources
htop
iotop
```

### Emergency Procedures
```bash
# Emergency stop
docker-compose down

# Emergency restart
docker-compose down && docker-compose up -d

# Complete reset
docker-compose down -v
docker system prune -a
```

---

**Deployment Guide** - SPK Monitoring Masa Studi 🚀 