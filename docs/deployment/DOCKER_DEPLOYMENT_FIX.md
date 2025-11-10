# Perbaikan Docker Deployment untuk Halaman Comparison

## Masalah
Data tidak muncul pada halaman comparison ketika aplikasi dijalankan menggunakan Docker.

## Penyebab Utama
1. **API Base URL Salah**: Frontend menggunakan `http://localhost:8000` yang tidak bisa diakses dari browser karena `localhost` dalam konteks Docker merujuk ke container itu sendiri
2. **Environment Configuration**: Tidak ada konfigurasi khusus untuk Docker environment
3. **Nginx Proxy**: Meskipun nginx sudah dikonfigurasi untuk proxy `/api/` ke backend, frontend masih menggunakan full URL

## Arsitektur Docker

```
┌─────────────────────────────────────────────────┐
│  Browser (Client)                               │
│  - Akses: http://localhost:80                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Frontend Container (nginx)                     │
│  - Port: 80                                     │
│  - Nginx proxy: /api/ → http://backend:8000    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼ (internal network: spk-network)
┌─────────────────────────────────────────────────┐
│  Backend Container (FastAPI)                    │
│  - Port: 8000                                   │
│  - Service name: backend                        │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Database Container (PostgreSQL)                │
│  - Port: 5432                                   │
│  - Service name: db                             │
└─────────────────────────────────────────────────┘
```

## Solusi

### 1. Environment Files

Kini tersedia 3 environment files:

#### `env` (Default - untuk Docker)
```bash
API_BASE_URL=
API_PREFIX=/api
API_VERSION=v1
```
- `API_BASE_URL` kosong sehingga request menggunakan relative path
- Nginx akan proxy `/api/` ke `http://backend:8000/api/`

#### `env.local` (untuk Local Development tanpa Docker)
```bash
API_BASE_URL=http://localhost:8000
API_PREFIX=/api
API_VERSION=v1
```
- Langsung akses ke backend di localhost

#### `env.docker` (sama dengan env default)
```bash
API_BASE_URL=
API_PREFIX=/api
API_VERSION=v1
```

#### `env.production` (untuk Production Server)
```bash
API_BASE_URL=http://139.59.236.100:8000
API_PREFIX=/api
API_VERSION=v1
```
- Gunakan IP/domain production server

### 2. Dockerfile Frontend Update

```dockerfile
FROM nginx:alpine

# Create directory structure
RUN mkdir -p /usr/share/nginx/html

# Copy nginx configuration first
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all frontend files
COPY . /usr/share/nginx/html/

# Use Docker-specific environment configuration
RUN cd /usr/share/nginx/html && \
    if [ -f env.docker ]; then \
        cp env.docker env; \
        echo "Using Docker environment configuration"; \
    fi

# Set correct permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Nginx Configuration

Nginx sudah dikonfigurasi dengan proxy pass:

```nginx
location /api/ {
    proxy_pass http://backend:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS headers untuk API
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE" always;
    add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
}
```

### 4. Docker Compose Configuration

```yaml
version: '3.8'

services:
  frontend:
    build: 
      context: ./src/frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    volumes:
      - ./src/frontend:/usr/share/nginx/html:ro
      - ./src/frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - backend
    networks:
      - spk-network

  backend:
    build: 
      context: ./src/backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - POSTGRES_USER=spk_user
      - POSTGRES_PASSWORD=spk_password
      - POSTGRES_HOST=db
      - POSTGRES_PORT=5432
      - POSTGRES_DB=spk_db
    depends_on:
      db:
        condition: service_healthy
    networks:
      - spk-network

  db:
    image: postgres:13-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=spk_user
      - POSTGRES_PASSWORD=spk_password
      - POSTGRES_DB=spk_db
    volumes:
      - ./postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U spk_user -d spk_db"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - spk-network

networks:
  spk-network:
    driver: bridge
```

## Deployment Steps

### 1. Build dan Start Services

```bash
# Stop existing containers
docker-compose down

# Remove old images (optional)
docker-compose rm -f

# Rebuild and start
docker-compose up --build -d

# Check logs
docker-compose logs -f frontend
docker-compose logs -f backend
```

### 2. Verify Services

```bash
# Check running containers
docker-compose ps

# Check frontend
curl http://localhost/

# Check backend
curl http://localhost/api/

# Check database
docker-compose exec db psql -U spk_user -d spk_db -c "SELECT COUNT(*) FROM mahasiswa;"
```

### 3. Test Comparison Page

```bash
# Test FIS evaluation endpoint
curl -X POST "http://localhost/api/fuzzy/evaluate-actual" \
  -H "Content-Type: application/json" \
  -d '{"test_size": 0.3, "random_state": 42, "save_to_db": false}'

# Test SAW evaluation endpoint  
curl -X POST "http://localhost/api/saw/evaluate-actual" \
  -H "Content-Type: application/json" \
  -d '{"weights": {"ipk": 0.4, "sks": 0.35, "dek": 0.25}, "test_size": 0.3, "random_state": 42, "save_to_db": false}'
```

### 4. Browser Testing

1. Buka http://localhost/
2. Navigate ke "Perbandingan Metode"
3. Buka Browser Console (F12)
4. Check console output:
   ```
   Loading FIS Actual Evaluation from: /api/fuzzy/evaluate-actual
   Loading SAW Actual Evaluation from: /api/saw/evaluate-actual
   ```
5. Data seharusnya muncul setelah 30-60 detik

## Troubleshooting

### Issue 1: CORS Error

**Symptom**:
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution**:
- CORS headers sudah dikonfigurasi di nginx
- Jika masih error, check backend CORS configuration di `main.py`

### Issue 2: 502 Bad Gateway

**Symptom**:
```
502 Bad Gateway
```

**Solution**:
```bash
# Check backend is running
docker-compose logs backend

# Check backend health
docker-compose exec backend curl http://localhost:8000/api/

# Restart backend
docker-compose restart backend
```

### Issue 3: Database Connection Error

**Symptom**:
```
could not connect to server: Connection refused
```

**Solution**:
```bash
# Check database is running
docker-compose ps db

# Check database health
docker-compose exec db pg_isready -U spk_user -d spk_db

# Restart database
docker-compose restart db
```

### Issue 4: Empty Data in Comparison

**Symptom**:
- Page loads but no data appears
- Console shows: "Tidak ada data mahasiswa dengan status_lulus_aktual"

**Solution**:
```bash
# Check if actual data exists
docker-compose exec db psql -U spk_user -d spk_db -c \
  "SELECT COUNT(*) FROM mahasiswa WHERE status_lulus_aktual IS NOT NULL;"

# If count is 0, insert some test data
docker-compose exec db psql -U spk_user -d spk_db -c \
  "UPDATE mahasiswa SET status_lulus_aktual = 'LULUS' WHERE ipk >= 3.0 LIMIT 500;"
```

## Development vs Production

### Local Development (tanpa Docker)
1. Use `env.local`
2. Run backend: `uvicorn main:app --reload`
3. Access frontend via file:// atau live server

### Docker Development
1. Use `env` (default) atau `env.docker`
2. Run: `docker-compose up --build`
3. Access: http://localhost/

### Production
1. Use `env.production`
2. Update `API_BASE_URL` dengan domain/IP production
3. Deploy dengan Docker Compose atau Kubernetes

## Network Flow

```
Browser Request: http://localhost/api/fuzzy/evaluate-actual
    ↓
Nginx (frontend container):
    - Receive request on port 80
    - Match location /api/
    - Proxy to http://backend:8000/api/fuzzy/evaluate-actual
    ↓
Backend (backend container):
    - Receive on port 8000
    - Process request
    - Query database (db container)
    - Return response
    ↓
Nginx:
    - Add CORS headers
    - Return to browser
    ↓
Browser:
    - Receive response
    - Update UI
```

## Files Changed

1. `src/frontend/env` - Updated untuk Docker (empty API_BASE_URL)
2. `src/frontend/env.local` - New file untuk local development
3. `src/frontend/env.docker` - New file untuk Docker explicit
4. `src/frontend/Dockerfile` - Updated untuk copy env.docker
5. `docs/deployment/DOCKER_DEPLOYMENT_FIX.md` - This documentation

## Summary

Perbaikan utama adalah memastikan frontend menggunakan relative path (`/api/`) dalam Docker environment sehingga nginx proxy bisa meneruskan request ke backend container. Dengan ini, halaman comparison sekarang bisa memuat data evaluasi actual dengan benar dalam Docker environment.

