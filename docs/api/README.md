# API Documentation

## 🚀 Overview

API untuk aplikasi SPK Monitoring Masa Studi menggunakan FastAPI. API ini menyediakan endpoint untuk manajemen data mahasiswa, perhitungan SAW, dan klasifikasi fuzzy logic.

## 📋 Base URL

```
http://localhost:8000
```

## 🔐 Authentication

Saat ini API tidak memerlukan authentication. Semua endpoint bersifat public.

## 📊 Endpoints

### 🎓 Student Management

#### Get All Students
```http
GET /students
```

**Response:**
```json
{
  "students": [
    {
      "id": 1,
      "nim": "2021001",
      "nama": "John Doe",
      "jurusan": "Informatika",
      "semester": 6,
      "ipk": 3.5,
      "sks": 120,
      "status": "Aktif"
    }
  ],
  "total": 1604
}
```

#### Get Student by ID
```http
GET /students/{student_id}
```

**Parameters:**
- `student_id` (integer): ID mahasiswa

**Response:**
```json
{
  "id": 1,
  "nim": "2021001",
  "nama": "John Doe",
  "jurusan": "Informatika",
  "semester": 6,
  "ipk": 3.5,
  "sks": 120,
  "status": "Aktif"
}
```

#### Create Student
```http
POST /students
```

**Request Body:**
```json
{
  "nim": "2021001",
  "nama": "John Doe",
  "jurusan": "Informatika",
  "semester": 6,
  "ipk": 3.5,
  "sks": 120,
  "status": "Aktif"
}
```

#### Update Student
```http
PUT /students/{student_id}
```

#### Delete Student
```http
DELETE /students/{student_id}
```

### 📈 SAW Method

#### Calculate SAW
```http
POST /saw/calculate
```

**Request Body:**
```json
{
  "criteria": [
    {
      "name": "IPK",
      "weight": 0.4,
      "type": "benefit"
    },
    {
      "name": "SKS",
      "weight": 0.3,
      "type": "benefit"
    },
    {
      "name": "Semester",
      "weight": 0.3,
      "type": "cost"
    }
  ],
  "students": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "results": [
    {
      "student_id": 1,
      "nim": "2021001",
      "nama": "John Doe",
      "normalized_scores": {
        "IPK": 0.875,
        "SKS": 0.8,
        "Semester": 0.833
      },
      "weighted_scores": {
        "IPK": 0.35,
        "SKS": 0.24,
        "Semester": 0.25
      },
      "total_score": 0.84,
      "rank": 1
    }
  ],
  "criteria_used": [
    {
      "name": "IPK",
      "weight": 0.4,
      "type": "benefit"
    }
  ]
}
```

#### Get SAW Results
```http
GET /saw/results
```

#### Get SAW Results by ID
```http
GET /saw/results/{result_id}
```

### 🧠 Fuzzy Logic

#### Calculate Fuzzy Classification
```http
POST /fuzzy/classify
```

**Request Body:**
```json
{
  "student_id": 1,
  "ipk": 3.5,
  "sks": 120,
  "semester": 6
}
```

**Response:**
```json
{
  "student_id": 1,
  "nim": "2021001",
  "nama": "John Doe",
  "input_values": {
    "ipk": 3.5,
    "sks": 120,
    "semester": 6
  },
  "fuzzy_sets": {
    "ipk": {
      "rendah": 0.0,
      "sedang": 0.5,
      "tinggi": 0.5
    },
    "sks": {
      "rendah": 0.0,
      "sedang": 0.2,
      "tinggi": 0.8
    },
    "semester": {
      "rendah": 0.0,
      "sedang": 0.0,
      "tinggi": 1.0
    }
  },
  "classification": "Tepat Waktu",
  "confidence": 0.75
}
```

#### Get Fuzzy Results
```http
GET /fuzzy/results
```

### 🔄 Batch Operations

#### Process Batch SAW
```http
POST /batch/saw
```

**Request Body:**
```json
{
  "criteria": [
    {
      "name": "IPK",
      "weight": 0.4,
      "type": "benefit"
    },
    {
      "name": "SKS",
      "weight": 0.3,
      "type": "benefit"
    },
    {
      "name": "Semester",
      "weight": 0.3,
      "type": "cost"
    }
  ],
  "student_ids": [1, 2, 3, 4, 5]
}
```

#### Process Batch Fuzzy
```http
POST /batch/fuzzy
```

**Request Body:**
```json
{
  "students": [
    {
      "id": 1,
      "ipk": 3.5,
      "sks": 120,
      "semester": 6
    },
    {
      "id": 2,
      "ipk": 2.8,
      "sks": 90,
      "semester": 8
    }
  ]
}
```

### 📊 Analytics

#### Get Statistics
```http
GET /analytics/stats
```

**Response:**
```json
{
  "total_students": 1604,
  "average_ipk": 3.2,
  "average_sks": 110,
  "average_semester": 6.5,
  "classification_distribution": {
    "Tepat Waktu": 1200,
    "Terlambat": 350,
    "Sangat Terlambat": 54
  }
}
```

#### Get Comparison Results
```http
GET /comparison/results
```

**Response:**
```json
{
  "saw_results": {
    "total_processed": 1604,
    "top_ranked": [
      {
        "student_id": 1,
        "nama": "John Doe",
        "score": 0.84,
        "rank": 1
      }
    ]
  },
  "fuzzy_results": {
    "total_processed": 1604,
    "classifications": {
      "Tepat Waktu": 1200,
      "Terlambat": 350,
      "Sangat Terlambat": 54
    }
  }
}
```

## 🔧 Error Handling

### Error Response Format
```json
{
  "error": "Error message",
  "detail": "Detailed error information",
  "status_code": 400
}
```

### Common Error Codes
- `400` - Bad Request
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## 📝 Data Models

### Student Model
```python
class Student(BaseModel):
    id: Optional[int]
    nim: str
    nama: str
    jurusan: str
    semester: int
    ipk: float
    sks: int
    status: str
```

### SAW Criteria Model
```python
class SAWCriteria(BaseModel):
    name: str
    weight: float
    type: str  # "benefit" or "cost"
```

### Fuzzy Input Model
```python
class FuzzyInput(BaseModel):
    student_id: int
    ipk: float
    sks: int
    semester: int
```

## 🧪 Testing

### Test Endpoints
```bash
# Test health check
curl http://localhost:8000/health

# Test get students
curl http://localhost:8000/students

# Test SAW calculation
curl -X POST http://localhost:8000/saw/calculate \
  -H "Content-Type: application/json" \
  -d '{"criteria": [...], "students": [1,2,3]}'
```

### Swagger Documentation
```
http://localhost:8000/docs
```

### ReDoc Documentation
```
http://localhost:8000/redoc
```

## 🔄 Rate Limiting

Saat ini tidak ada rate limiting yang diterapkan. Semua endpoint dapat diakses tanpa batasan.

## 📈 Performance

### Response Times
- **GET requests**: < 100ms
- **POST requests**: < 500ms
- **Batch operations**: < 5s untuk 1000 records

### Database Queries
- Menggunakan SQLAlchemy ORM
- Optimized queries dengan indexing
- Connection pooling

## 🔒 Security

### Current Security Measures
- Input validation dengan Pydantic
- SQL injection protection dengan SQLAlchemy
- CORS enabled untuk frontend

### Future Security Enhancements
- JWT authentication
- Rate limiting
- API key management
- Request logging

## 📞 Support

### API Status
```bash
# Check API health
curl http://localhost:8000/health
```

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
```

### Logs
```bash
# View API logs
docker logs spk-backend-1
```

---

**API Documentation** - SPK Monitoring Masa Studi 🔌 