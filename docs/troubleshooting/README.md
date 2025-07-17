# Troubleshooting Guide

## 🔧 Overview

Panduan troubleshooting lengkap untuk mengatasi masalah yang sering terjadi pada aplikasi SPK Monitoring Masa Studi.

## 📋 Documentation Files

### 🐛 Error Handling
- **[Destroy Error](README_DESTROY_ERROR.md)** - Troubleshooting error saat destroy container

## 🚨 Common Issues

### 1. Database Connection Issues

#### Problem: "Database does not exist"
```bash
# Error message
psql: error: connection to server at "db" (172.20.0.2), port 5432 failed: FATAL: database "spk_db" does not exist
```

**Solution:**
```bash
# Check if database exists
docker exec -e PGPASSWORD=spk_password spk-backend-1 psql -h db -p 5432 -U spk_user -d postgres -c "\l"

# Create database if not exists
docker exec -e PGPASSWORD=spk_password spk-backend-1 psql -h db -p 5432 -U spk_user -d postgres -c "CREATE DATABASE spk_db;"

# Restore database
cd src/backend
./restore_by_table.sh
```

#### Problem: "Connection refused"
```bash
# Error message
psql: error: connection to server at "db" (172.20.0.2), port 5432 failed: Connection refused
```

**Solution:**
```bash
# Check database container status
docker-compose ps db

# Restart database container
docker-compose restart db

# Wait for database to be ready
sleep 10

# Test connection
docker exec spk-backend-1 python test_db_connection.py
```

### 2. Container Issues

#### Problem: Container won't start
```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

**Common Solutions:**
```bash
# Check disk space
df -h

# Check memory
free -h

# Restart Docker
sudo systemctl restart docker

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Problem: Port conflicts
```bash
# Check port usage
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :5432
```

**Solution:**
```bash
# Change ports in .env file
FRONTEND_PORT=3001
BACKEND_PORT=8001

# Restart containers
docker-compose down
docker-compose up -d
```

### 3. Restore Issues

#### Problem: Restore timeout
```bash
# Error message
TimeoutError: Command timed out after 1800 seconds
```

**Solution:**
```bash
# Use restore by table method
cd src/backend
./restore_by_table.sh

# Monitor progress
python3 monitor_restore.py monitor
```

#### Problem: "Permission denied" during restore
```bash
# Error message
Permission denied: './restore_by_table.sh'
```

**Solution:**
```bash
# Fix file permissions
chmod +x src/backend/*.sh

# Check ownership
ls -la src/backend/*.sh
```

### 4. API Issues

#### Problem: CORS errors
```bash
# Browser console error
Access to fetch at 'http://localhost:8000/students' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
```bash
# Check backend CORS configuration
# Edit src/backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Restart backend
docker-compose restart backend
```

#### Problem: API not responding
```bash
# Test API health
curl http://localhost:8000/health

# Check backend logs
docker logs spk-backend-1
```

**Solution:**
```bash
# Restart backend
docker-compose restart backend

# Check environment variables
docker exec spk-backend-1 env | grep DB
```

### 5. Frontend Issues

#### Problem: Frontend not loading
```bash
# Check frontend container
docker-compose ps frontend

# Check frontend logs
docker logs spk-frontend-1
```

**Solution:**
```bash
# Restart frontend
docker-compose restart frontend

# Check nginx configuration
docker exec spk-frontend-1 nginx -t
```

#### Problem: JavaScript errors
```bash
# Check browser console for errors
# Common issues:
# - API endpoint not found
# - JSON parsing errors
# - Undefined variables
```

**Solution:**
```bash
# Check API endpoints
curl http://localhost:8000/docs

# Verify backend is running
docker-compose ps backend

# Check network connectivity
docker exec spk-frontend-1 ping backend
```

## 🔍 Debug Procedures

### 1. Environment Check
```bash
# Check all containers
docker-compose ps

# Check environment variables
docker exec spk-backend-1 env | grep -E "(DB_|BACKEND_)"
docker exec spk-frontend-1 env | grep -E "(FRONTEND_|BACKEND_)"

# Check network
docker network ls
docker network inspect spk_default
```

### 2. Database Debug
```bash
# Connect to database
docker exec -it spk-db-1 psql -U spk_user -d spk_db

# Check tables
\dt

# Check data
SELECT COUNT(*) FROM mahasiswa;
SELECT COUNT(*) FROM nilai;

# Check connections
SELECT * FROM pg_stat_activity;
```

### 3. Application Debug
```bash
# Enable debug mode
export DEBUG=true
export LOG_LEVEL=DEBUG

# Restart with debug
docker-compose down
docker-compose up -d

# View detailed logs
docker-compose logs -f backend
```

### 4. Network Debug
```bash
# Check container connectivity
docker exec spk-backend-1 ping db
docker exec spk-frontend-1 ping backend

# Check port mappings
docker port spk-backend-1
docker port spk-frontend-1
docker port spk-db-1
```

## 🛠️ Recovery Procedures

### 1. Complete Reset
```bash
# Stop all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Remove images
docker rmi spk-backend spk-frontend

# Rebuild everything
docker-compose build --no-cache
docker-compose up -d

# Restore database
cd src/backend
./restore_by_table.sh
```

### 2. Database Recovery
```bash
# Backup current state
docker exec spk-backend-1 pg_dump -h db -U spk_user -d spk_db > backup_before_fix.sql

# Drop and recreate database
docker exec -e PGPASSWORD=spk_password spk-backend-1 psql -h db -p 5432 -U spk_user -d postgres -c "DROP DATABASE IF EXISTS spk_db;"
docker exec -e PGPASSWORD=spk_password spk-backend-1 psql -h db -p 5432 -U spk_user -d postgres -c "CREATE DATABASE spk_db;"

# Restore from backup
cd src/backend
./restore_by_table.sh
```

### 3. Configuration Recovery
```bash
# Reset environment variables
cp .env.example .env

# Edit configuration
nano .env

# Restart containers
docker-compose down
docker-compose up -d
```

## 📊 Monitoring & Alerts

### 1. Health Checks
```bash
# Create health check script
cat > health_check.sh << 'EOF'
#!/bin/bash

# Check containers
if ! docker-compose ps | grep -q "Up"; then
    echo "ERROR: Some containers are not running"
    exit 1
fi

# Check API
if ! curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "ERROR: Backend API is not responding"
    exit 1
fi

# Check frontend
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "ERROR: Frontend is not responding"
    exit 1
fi

echo "OK: All services are running"
EOF

chmod +x health_check.sh
```

### 2. Log Monitoring
```bash
# Monitor logs in real-time
docker-compose logs -f

# Monitor specific service
docker-compose logs -f backend

# Search for errors
docker-compose logs | grep -i error
```

### 3. Resource Monitoring
```bash
# Check resource usage
docker stats

# Check disk usage
df -h

# Check memory usage
free -h
```

## 📞 Support Information

### Log Locations
- **Application logs**: `docker-compose logs -f`
- **System logs**: `/var/log/docker/`
- **Database logs**: `docker-compose logs db`

### Useful Commands
```bash
# Quick status check
docker-compose ps

# View all logs
docker-compose logs

# Execute commands in container
docker exec -it spk-backend-1 bash
docker exec -it spk-frontend-1 bash
docker exec -it spk-db-1 bash

# Check container details
docker inspect spk-backend-1
```

### Emergency Contacts
- **System Administrator**: admin@example.com
- **Database Administrator**: dba@example.com
- **Development Team**: dev@example.com

## 🔄 Prevention

### 1. Regular Maintenance
```bash
# Daily health checks
./health_check.sh

# Weekly backups
docker exec spk-backend-1 pg_dump -h db -U spk_user -d spk_db > backup_$(date +%Y%m%d).sql

# Monthly cleanup
docker system prune -a
```

### 2. Monitoring Setup
```bash
# Set up monitoring alerts
# Configure log rotation
# Set up automated backups
# Monitor resource usage
```

### 3. Documentation Updates
```bash
# Keep troubleshooting guide updated
# Document new issues and solutions
# Update runbooks
# Maintain knowledge base
```

---

**Troubleshooting Guide** - SPK Monitoring Masa Studi 🔧 