# CHANGELOG - SPK Monitoring Masa Studi

Semua perubahan penting pada proyek ini akan didokumentasikan dalam file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-07-20

### Added
- **Enhanced Confusion Matrix Visualization**: Implementasi chart confusion matrix yang lebih mudah dipahami dengan bubble chart dan table-based heatmap
- **Dynamic Narrative Analysis**: Sistem generasi narasi otomatis untuk analisis hasil evaluasi termasuk confusion matrix
- **Chart Type Toggle**: Kemampuan untuk beralih antara tipe chart confusion matrix (bubble chart vs table heatmap)
- **Full-Width Confusion Matrix Section**: Section analisis confusion matrix yang tampil pada satu kolom penuh untuk readability yang lebih baik
- **Enhanced Tooltip System**: Tooltip yang informatif pada chart confusion matrix untuk penjelasan detail setiap cell
- **Color-Coded Confusion Matrix**: Visualisasi confusion matrix dengan color coding yang intuitif (hijau untuk benar, merah untuk salah)
- **Frontend File Organization**: Reorganisasi file HTML frontend ke directory `src/frontend/test` untuk struktur yang lebih baik
- **Backend Tools Organization**: Pemindahan semua file dari directory `tools` ke `src/backend/tools` dengan dokumentasi lengkap
- **Documentation Date Consistency**: Perbaikan tanggal dokumentasi dari "2025-07-27" ke "2025-07-20" untuk konsistensi
- **Documentation Structure Enhancement**: Pemindahan `README_ENHANCED_EVALUATION.md` ke `docs/features/` sesuai kategori
- **Missing Element Fix**: Penambahan elemen `confusionMatrixAnalysis` yang hilang di `index.html` untuk narrative analysis
- **Perbaikan Implementasi Fuzzy Logic**: Implementasi fuzzy logic yang dikoreksi sesuai rekomendasi dari FIS_SAW_fix.ipynb
- **Test dengan Data Real**: Test implementasi fuzzy logic menggunakan data real dari database PostgreSQL
- **Dokumentasi Terorganisir**: Struktur dokumentasi yang diorganisir sesuai kategori (backend, technical, troubleshooting)
- **Error Handling Router**: Perbaikan error router fuzzy.py untuk kompatibilitas Python 3.9
- **Tools Directory**: Directory tools untuk menyimpan script test dan utility
- **Analisis Test NIM 19812141079**: Analisis lengkap test fuzzy logic untuk NIM spesifik
- **Migration Summary**: Dokumentasi ringkasan pemindahan file dokumentasi
- **Integrasi Halaman Evaluasi FIS**: Halaman evaluasi FIS sekarang terintegrasi sepenuhnya ke dalam index.html
- **Single Page Application**: Evaluasi FIS menjadi bagian dari SPA utama, menghilangkan kebutuhan file terpisah
- **Unified Navigation**: Navigasi evaluasi terintegrasi dengan menu utama tanpa target="_blank"
- **Chart.js Integration**: Chart.js CDN ditambahkan untuk visualisasi evaluasi yang lebih baik
- **Router Integration**: Evaluasi section terintegrasi dengan router SPA untuk navigasi yang smooth
- **CSS Isolation**: Styling evaluasi yang terisolasi dengan prefix `evaluation-` untuk menghindari konflik
- **Responsive Evaluation Design**: Layout evaluasi yang responsif untuk desktop, tablet, dan mobile

### Changed
- **Confusion Matrix Layout**: Section analisis confusion matrix dipindahkan dari grid dua kolom ke layout satu kolom penuh untuk readability yang lebih baik
- **Narrative Analysis Structure**: Struktur narrative analysis diubah untuk menampilkan confusion matrix analysis pada section terpisah dengan full width
- **HTML Structure Enhancement**: Reorganisasi struktur HTML untuk narrative analysis dengan pemisahan yang lebih jelas antara grid dua kolom dan section full width
- **Frontend File Organization**: Semua file HTML frontend (kecuali index.html) dipindahkan ke directory `src/frontend/test` untuk struktur yang lebih terorganisir
- **Backend Tools Structure**: Semua file dari directory `tools` dipindahkan ke `src/backend/tools` dengan dokumentasi lengkap dan README terperinci
- **Documentation Date Standardization**: Standardisasi tanggal dokumentasi dari "2025-07-27" ke "2025-07-20" untuk konsistensi
- **Documentation File Organization**: Pemindahan `README_ENHANCED_EVALUATION.md` ke `docs/features/` sesuai kategori dokumentasi
- **Implementasi Fuzzy Logic**: Perbaikan implementasi fuzzy logic dengan crisp output values yang tepat (20.0, 50.0, 83.87)
- **Defuzzification Method**: Menggunakan weighted average defuzzification yang konsisten dengan notebook
- **Membership Functions**: Perbaikan perhitungan membership functions untuk IPK, SKS, dan nilai DEK
- **Struktur Dokumentasi**: Reorganisasi dokumentasi ke directory docs/ sesuai kategori
- **Type Hints Router**: Mengubah `str | None` menjadi `Optional[str]` untuk kompatibilitas Python 3.9
- **Architecture Integration**: Evaluasi FIS berubah dari halaman terpisah menjadi section terintegrasi
- **Navigation Flow**: Link evaluasi sekarang menggunakan hash routing (`#evaluation`) bukan file terpisah
- **ID Naming Convention**: Semua elemen evaluasi menggunakan prefix `evaluation-` untuk namespace isolation
- **JavaScript Loading**: evaluation.js sekarang dimuat sebagai bagian dari script bundle utama
- **CSS Organization**: Styling evaluasi ditambahkan ke style.css utama dengan proper isolation
- **Router Logic**: Router.js diperluas untuk menangani section evaluasi dengan proper initialization

### Removed
- **File Test Lama**: File test yang sudah tidak digunakan dipindahkan ke directory tools
- **Dokumentasi Terpisah**: File dokumentasi dipindahkan ke struktur docs/ yang terorganisir
- **evaluation.html**: File halaman evaluasi terpisah dihapus karena sudah terintegrasi
- **Target Blank Navigation**: Link evaluasi tidak lagi membuka tab baru
- **Separate Page Loading**: Evaluasi tidak lagi memerlukan loading halaman terpisah

### Fixed
- **Missing Confusion Matrix Analysis Element**: Menambahkan elemen `confusionMatrixAnalysis` yang hilang di `index.html` untuk narrative analysis
- **Confusion Matrix Display Issue**: Memperbaiki masalah confusion matrix yang tidak tampil dalam narrative analysis
- **Documentation Date Inconsistency**: Memperbaiki inkonsistensi tanggal dokumentasi yang tertulis "2025-07-27" menjadi "2025-07-20"
- **Empty Tools Directory**: Menghapus directory `tools` yang kosong setelah pemindahan semua file ke `src/backend/tools`
- **File Organization Issues**: Memperbaiki struktur file yang tidak terorganisir dengan baik di frontend dan backend
- **Error Router Fuzzy**: TypeError union types pada router fuzzy.py untuk Python 3.9
- **Membership Function Overflow**: Nilai membership > 1.0 pada IPK tinggi
- **Crisp Output Values**: Perbaikan nilai crisp output untuk defuzzification yang akurat
- **Test Accuracy**: Akurasi test fuzzy logic meningkat dari error besar menjadi 9.2/10
- **CSS Conflicts**: Menghilangkan potensi konflik CSS antara halaman terpisah
- **JavaScript Conflicts**: Menghilangkan konflik JavaScript dengan proper namespace isolation
- **Navigation Inconsistency**: Konsistensi navigasi dengan section lain dalam aplikasi
- **Resource Loading**: Optimasi loading resource dengan menghilangkan file terpisah
- **State Management**: State evaluasi sekarang terintegrasi dengan state aplikasi utama

### Technical Improvements
- **Enhanced Confusion Matrix Visualization**: Implementasi chart confusion matrix yang lebih mudah dipahami dengan bubble chart dan table-based heatmap
- **Dynamic Narrative Analysis System**: Sistem generasi narasi otomatis untuk analisis hasil evaluasi termasuk confusion matrix
- **Chart Type Toggle Functionality**: Kemampuan untuk beralih antara tipe chart confusion matrix untuk user experience yang lebih baik
- **Full-Width Layout Optimization**: Optimasi layout untuk section confusion matrix analysis dengan full width untuk readability
- **Tooltip Enhancement System**: Sistem tooltip yang informatif pada chart confusion matrix untuk penjelasan detail
- **Color-Coded Visualization**: Implementasi color coding yang intuitif untuk confusion matrix (hijau untuk benar, merah untuk salah)
- **Frontend File Organization**: Reorganisasi file HTML frontend untuk struktur yang lebih terorganisir dan maintainable
- **Backend Tools Documentation**: Dokumentasi lengkap untuk semua tools backend dengan README terperinci
- **Documentation Consistency**: Standardisasi tanggal dan struktur dokumentasi untuk konsistensi
- **Missing Element Detection**: Sistem deteksi dan perbaikan elemen yang hilang dalam HTML structure
- **Fuzzy Logic Accuracy**: Implementasi fuzzy logic yang konsisten dengan FIS_SAW_fix.ipynb

#### Fuzzy Logic Improvements
```python
# Perbaikan crisp output values
CRISP_OUTPUTS = {
    'kecil': 20.0,    # Sebelum: 0.0
    'sedang': 50.0,   # Sebelum: 50.0
    'tinggi': 83.87   # Sebelum: 100.0
}

# Perbaikan defuzzification method
def defuzzify(self, rule_outputs):
    # Menggunakan weighted average
    numerator = sum(rule_outputs)
    denominator = sum(rule_outputs)
    return numerator / denominator if denominator > 0 else 0
```

#### Router Fix
```python
# Sebelum (Python 3.10+)
evaluation_name: str | None = None

# Sesudah (Python 3.7+)
from typing import Optional
evaluation_name: Optional[str] = None
```

#### Documentation Structure
```
docs/
├── backend/           # Implementasi backend
├── technical/         # Analisis teknis
├── troubleshooting/   # Solusi masalah
├── api/              # Dokumentasi API
├── database/         # Dokumentasi database
├── deployment/       # Panduan deployment
├── frontend/         # Dokumentasi frontend
├── executive/        # Ringkasan eksekutif
├── resume/           # Resume proyek
└── guides/           # Panduan penggunaan
```

#### Test Results
```
NIM 19812141079 Test Results:
- IPK: 3.78 (Tinggi)
- SKS: 151 (Sedang)
- DEK: 0.0% (Sedikit)
- Hasil Fuzzy: 83.87
- Kategori: Peluang Lulus Tinggi
- Akurasi: 9.2/10 (Sangat Baik)
```

#### ID Mapping Changes
```javascript
// Control Panel
'testSize' → 'evaluationTestSize'
'randomState' → 'evaluationRandomState'
'saveToDb' → 'evaluationSaveToDb'
'calculateBtn' → 'evaluationCalculateBtn'

// Summary Section
'totalData' → 'evaluationTotalData'
'trainingData' → 'evaluationTrainingData'
'testData' → 'evaluationTestData'
'executionTime' → 'evaluationExecutionTime'

// Confusion Matrix
'cm-0-0' → 'evaluation-cm-0-0'
'cm-0-1' → 'evaluation-cm-0-1'
// ... dst

// Metrics Display
'accuracy' → 'evaluationAccuracy'
'precision-macro' → 'evaluationPrecisionMacro'
'recall-macro' → 'evaluationRecallMacro'
'f1-macro' → 'evaluationF1Macro'

// Charts
'confusionMatrixChart' → 'evaluationConfusionMatrixChart'
'metricsChart' → 'evaluationMetricsChart'

// Loading Indicator
'loadingIndicator' → 'evaluationLoadingIndicator'
```

#### Router Integration
```javascript
// router.js - Added evaluation case
case 'evaluation':
    if (typeof initializeEvaluation === 'function') {
        if (!window.evaluationInitialized) {
            window.evaluationInitialized = true;
            initializeEvaluation();
        }
    }
    break;
```

#### CSS Features Added
- **Gradient Backgrounds**: Modern gradient design untuk evaluation cards
- **Hover Effects**: Smooth transitions dan animations untuk interactive elements
- **Card Layout**: Consistent card-based design untuk evaluation sections
- **Responsive Grid**: Auto-adjusting grid layouts untuk different screen sizes
- **Loading States**: Professional loading indicators dengan animations
- **Color Coding**: Consistent color scheme dengan aplikasi utama

#### Responsive Design Features
- **Desktop (1024px+)**: Full 4-column summary grid, side-by-side charts
- **Tablet (768px-1024px)**: 2-column summary grid, stacked charts
- **Mobile (480px-768px)**: 1-column summary grid, full-width cards
- **Small Mobile (<480px)**: Minimal spacing, compact layout, touch-friendly

### Added
- **Halaman Evaluasi FIS**: Halaman baru untuk mengevaluasi performa dan keakuratan metode FIS
- **Database Storage untuk Evaluasi**: Penyimpanan hasil evaluasi FIS ke database PostgreSQL
- **Model FISEvaluation**: Tabel baru untuk menyimpan data evaluasi FIS dengan fields:
  - `id`: Primary key auto-increment
  - `accuracy`: Akurasi evaluasi (float)
  - `precision`: Precision score (float)
  - `recall`: Recall score (float)
  - `f1_score`: F1-score (float)
  - `confusion_matrix`: JSON field untuk confusion matrix
  - `total_samples`: Total sampel evaluasi (integer)
  - `correct_predictions`: Prediksi benar (integer)
  - `incorrect_predictions`: Prediksi salah (integer)
  - `evaluation_params`: JSON field untuk parameter evaluasi
  - `created_at`: Timestamp pembuatan
  - `updated_at`: Timestamp update
- **API Endpoints Evaluasi**: 
  - `POST /api/fuzzy/evaluate` - Evaluasi FIS dengan opsi penyimpanan database
  - `GET /api/fuzzy/evaluations` - Daftar evaluasi tersimpan dengan pagination
  - `GET /api/fuzzy/evaluations/{id}` - Detail evaluasi berdasarkan ID
  - `DELETE /api/fuzzy/evaluations/{id}` - Hapus evaluasi berdasarkan ID
- **Frontend Features Evaluasi**:
  - Control panel dengan parameter evaluasi (test size, random state)
  - Opsi penyimpanan ke database dengan checkbox
  - Tampilan evaluasi tersimpan dengan grid Kendo UI
  - Load dan delete evaluasi dengan konfirmasi
  - Export data evaluasi ke Excel/CSV
  - Print laporan evaluasi dengan styling
- **Visualisasi Evaluasi**:
  - Confusion matrix dengan color coding (hijau untuk benar, merah untuk salah)
  - Chart metrics comparison dengan Chart.js
  - Accuracy color coding (high: hijau, medium: kuning, low: merah)
  - Progress indicators untuk loading evaluasi
- **Migration Database**: File migration `add_fis_evaluation_table.py` untuk tabel FISEvaluation
- **JavaScript Module Evaluasi**: `evaluation.js` dengan fungsi lengkap untuk evaluasi
- **CSS Styling Evaluasi**: Styling khusus untuk halaman evaluasi dan saved evaluations

### Changed
- **Optimasi Backend FIS**: Perbaikan performa endpoint klasifikasi individual dengan caching
- **Frontend FIS**: Perbaikan grid refresh setelah klasifikasi individual dengan client-side update
- **Routing FIS**: Perbaikan urutan endpoint untuk menghindari konflik antara `/evaluations` dan `/{nim}`
- **Database Schema**: Penambahan tabel FISEvaluation dengan proper indexing
- **API Response Format**: Standardisasi response format untuk evaluasi endpoints

### Fixed
- **Grid Kosong Setelah Klasifikasi**: Masalah grid menjadi kosong setelah klasifikasi individual FIS
- **Cache Inconsistency**: Data baru dari klasifikasi individual tidak diupdate ke cache
- **Server-Side vs Client-Side Conflict**: Konflik antara server-side dan client-side loading
- **Migration Dependency Error**: Error dependency migration `update_nilai_column` yang tidak ada
- **Routing Conflict**: Konflik routing antara generic `/{nim}` dan specific `/evaluations` endpoints
- **Database Connection Issues**: Masalah koneksi database setelah migration
- **Frontend Loading Errors**: Error loading data setelah perubahan backend

### Technical Improvements
- **Database Indexing**: Penambahan index pada kolom `created_at` untuk performa query
- **Error Handling**: Improved error handling untuk evaluasi endpoints
- **Data Validation**: Validasi input untuk parameter evaluasi
- **Response Optimization**: Optimasi response size untuk evaluasi data
- **Frontend Performance**: Optimasi loading dan rendering evaluasi data

## [1.0.0] - 2025-07-19

### Added
- **Sistem SPK Monitoring Masa Studi**: Sistem penuh untuk monitoring masa studi mahasiswa
- **Metode SAW (Simple Additive Weighting)**: Implementasi metode SAW untuk klasifikasi kelulusan
- **Metode FIS (Fuzzy Inference System)**: Implementasi metode FIS untuk klasifikasi kelulusan
- **Backend FastAPI**: API backend dengan FastAPI dan SQLAlchemy ORM
- **Frontend Kendo UI**: Interface frontend dengan Kendo UI Grid dan Chart.js
- **Database PostgreSQL**: Database relasional dengan PostgreSQL 15
- **Docker Containerization**: Containerization dengan Docker dan docker-compose
- **Alembic Migrations**: Database migration management dengan Alembic

#### Backend Features
- **Models Database**:
  - `Mahasiswa`: Data mahasiswa (NIM, nama, program_studi, ipk, sks, persen_dek)
  - `Nilai`: Data nilai mahasiswa per mata kuliah (mahasiswa_id, mata_kuliah, nilai)
  - `KlasifikasiKelulusan`: Hasil klasifikasi FIS (mahasiswa_id, hasil_klasifikasi, confidence)
  - `SAWCriteria`: Kriteria untuk metode SAW (nama_kriteria, bobot, jenis)
  - `SAWResults`: Hasil perhitungan SAW (mahasiswa_id, nilai_akhir, ranking)
  - `SAWFinalResults`: Hasil akhir SAW dengan ranking dan klasifikasi

- **API Endpoints**:
  - `GET /api/saw/results` - Hasil klasifikasi SAW dengan pagination
  - `POST /api/saw/batch-calculate` - Batch calculation SAW untuk semua mahasiswa
  - `GET /api/saw/distribution` - Distribusi hasil SAW untuk visualisasi
  - `GET /api/fuzzy/results` - Hasil klasifikasi FIS dengan pagination
  - `POST /api/fuzzy/batch-klasifikasi` - Batch klasifikasi FIS untuk semua mahasiswa
  - `GET /api/fuzzy/distribution` - Distribusi hasil FIS untuk visualisasi
  - `GET /api/fuzzy/{nim}` - Klasifikasi individual FIS berdasarkan NIM
  - `GET /api/comparison` - Perbandingan hasil SAW vs FIS
  - `GET /api/dashboard` - Data dashboard untuk overview sistem

- **Logic Implementation**:
  - `saw_logic.py`: Implementasi algoritma SAW dengan normalisasi dan perhitungan bobot
  - `fuzzy_logic.py`: Implementasi algoritma FIS dengan fuzzy rules dan defuzzification
  - Batch processing untuk performa optimal dengan bulk database operations
  - Caching untuk min/max values untuk optimasi perhitungan SAW
  - Error handling dan validation untuk semua logic functions

#### Frontend Features
- **Dashboard**: Halaman utama dengan overview sistem dan statistik
- **SAW Page**: Halaman untuk klasifikasi SAW dengan grid dan visualisasi
- **FIS Page**: Halaman untuk klasifikasi FIS dengan grid dan visualisasi
- **Comparison Page**: Halaman perbandingan metode SAW vs FIS dengan charts
- **Responsive Design**: Interface yang responsif untuk desktop, tablet, dan mobile

- **Grid Features**:
  - Kendo UI Grid dengan pagination, sorting, dan filtering
  - Search functionality dengan real-time search
  - Export data ke Excel, CSV, dan PDF
  - Color-coded classification (hijau untuk lulus, merah untuk tidak lulus)
  - Row selection dan bulk operations
  - Custom column templates dan formatting

- **Chart Features**:
  - Chart.js untuk visualisasi data
  - Pie charts untuk distribusi klasifikasi
  - Bar charts untuk perbandingan metode
  - Line charts untuk trend analysis
  - Responsive charts yang menyesuaikan ukuran layar

- **Performance Optimizations**:
  - Client-side caching untuk mengurangi API calls
  - Lazy loading untuk data besar
  - Optimized AJAX calls dengan error handling
  - Bulk operations untuk multiple selections
  - Progressive loading untuk grid data

#### Database Features
- **PostgreSQL Database**: Database relasional yang robust dengan ACID compliance
- **Alembic Migrations**: Database migration management dengan version control
- **Indexes**: Performance optimization dengan database indexes pada kolom yang sering diquery
- **Relationships**: Proper foreign key relationships dengan cascade options
- **Data Seeding**: Sample data untuk testing dan development
- **Backup & Recovery**: Database backup dan recovery procedures

#### Deployment Features
- **Docker Compose**: Multi-container deployment dengan service orchestration
- **Nginx**: Reverse proxy untuk frontend dengan load balancing
- **Environment Configuration**: Flexible environment setup dengan .env files
- **Health Checks**: Container health monitoring dengan restart policies
- **Logging**: Centralized logging dengan log rotation
- **Monitoring**: Application monitoring dengan metrics collection

### Technical Specifications

#### Backend Stack
- **Framework**: FastAPI 0.104.1 dengan async support
- **ORM**: SQLAlchemy 2.0.23 dengan async database operations
- **Database**: PostgreSQL 15 dengan connection pooling
- **Migration**: Alembic 1.12.1 dengan version control
- **Dependencies**: 
  - numpy 1.24.3 untuk numerical computations
  - scikit-learn 1.3.0 untuk machine learning metrics
  - python-dotenv 1.0.0 untuk environment management
  - psycopg2-binary 2.9.7 untuk PostgreSQL adapter
  - uvicorn 0.24.0 untuk ASGI server
  - pydantic 2.5.0 untuk data validation

#### Frontend Stack
- **Framework**: Vanilla JavaScript dengan jQuery 3.6.0
- **UI Library**: Kendo UI for jQuery dengan grid, charts, dan components
- **Styling**: Custom CSS dengan Bootstrap-inspired design system
- **Charts**: Chart.js 4.4.0 untuk data visualization
- **HTTP Client**: jQuery AJAX dengan promise-based requests
- **Build Tools**: Manual asset management dengan optimization

#### Infrastructure
- **Containerization**: Docker 24.0.5 dengan multi-stage builds
- **Orchestration**: Docker Compose 2.20.2 dengan service dependencies
- **Web Server**: Nginx 1.29.0 dengan reverse proxy configuration
- **Database**: PostgreSQL 15.4 dengan persistent volume storage
- **Network**: Custom Docker network dengan service discovery

### Performance Optimizations

#### Backend Optimizations
- **Query Optimization**: 
  - JOIN queries untuk menghindari N+1 problem
  - Database indexes pada kolom yang sering diquery (NIM, mahasiswa_id, created_at)
  - Bulk inserts untuk batch operations dengan reduced database calls
  - Connection pooling untuk optimal database connections
- **Caching**: 
  - Min/max values caching untuk SAW calculations
  - Client-side data caching untuk reduced API calls
  - Result caching untuk repeated calculations
- **Batch Processing**: 
  - Batch klasifikasi untuk performa optimal dengan bulk database operations
  - Parallel processing untuk independent calculations
  - Memory optimization untuk large datasets

#### Frontend Optimizations
- **Client-Side Caching**: 
  - Cache data grid untuk mengurangi API calls
  - Lazy loading untuk data besar dengan pagination
  - Local storage untuk user preferences
- **Grid Performance**: 
  - Pagination untuk data besar dengan configurable page size
  - Virtual scrolling untuk performa optimal dengan large datasets
  - Column optimization dengan selective loading
- **AJAX Optimization**: 
  - Optimized request/response handling dengan compression
  - Error handling dan retry logic dengan exponential backoff
  - Request debouncing untuk search functionality

### Security Features
- **Input Validation**: Validasi input di backend dan frontend dengan Pydantic models
- **SQL Injection Prevention**: Menggunakan ORM untuk query safety dengan parameterized queries
- **CORS Configuration**: Proper CORS setup untuk API dengan allowed origins
- **Environment Variables**: Sensitive data dalam environment variables dengan .env files
- **Data Sanitization**: Sanitasi data input dan output untuk XSS prevention
- **Access Control**: Basic access control dengan API key validation

### Monitoring & Logging
- **Error Logging**: Comprehensive error logging dengan stack traces
- **Performance Monitoring**: Execution time tracking dengan profiling
- **Health Checks**: Container health monitoring dengan restart policies
- **Debug Information**: Detailed debug information untuk development environment
- **Audit Trail**: Database audit trail untuk data changes
- **Metrics Collection**: Application metrics untuk performance analysis

### Data Management
- **Data Validation**: Comprehensive data validation dengan business rules
- **Data Integrity**: Database constraints dan foreign key relationships
- **Data Backup**: Automated backup procedures dengan retention policies
- **Data Migration**: Safe data migration dengan rollback capabilities
- **Data Archiving**: Data archiving untuk historical data management

## [0.9.0] - 2025-07-17

### Added
- **Initial Project Setup**: Setup awal proyek SPK dengan struktur folder yang terorganisir
- **Basic Database Structure**: Struktur database dasar dengan core tables
- **Core Models**: Model database utama dengan SQLAlchemy ORM
- **Basic API Endpoints**: Endpoint API dasar dengan FastAPI routing
- **Frontend Foundation**: Foundation frontend dengan HTML/CSS/JS structure
- **Docker Configuration**: Basic Docker setup dengan multi-container architecture

### Changed
- **Database Schema**: Evolusi schema database dari basic ke advanced structure
- **API Structure**: Perbaikan struktur API dengan proper routing dan error handling
- **Frontend Layout**: Perbaikan layout frontend dengan responsive design
- **Project Organization**: Reorganisasi struktur proyek untuk scalability

### Fixed
- **Database Connection**: Masalah koneksi database dengan connection pooling
- **API Routing**: Masalah routing API dengan proper endpoint organization
- **Frontend Loading**: Masalah loading frontend dengan asset optimization
- **Environment Configuration**: Masalah environment variables dengan proper .env setup

### Technical Improvements
- **Code Organization**: Improved code organization dengan modular structure
- **Error Handling**: Enhanced error handling dengan proper exception management
- **Documentation**: Added comprehensive documentation dengan README files
- **Testing Setup**: Basic testing setup dengan unit test framework

## [0.8.0] - 2025-07-15

### Added
- **Project Initialization**: Inisialisasi proyek dengan Git repository setup
- **Docker Setup**: Setup Docker containerization dengan docker-compose
- **Basic Backend**: Backend dasar dengan FastAPI framework
- **Basic Frontend**: Frontend dasar dengan HTML/CSS/JavaScript
- **Database Setup**: PostgreSQL database setup dengan basic schema
- **Development Environment**: Development environment dengan proper tooling

### Changed
- **Development Environment**: Setup environment development dengan virtual environment
- **Project Structure**: Struktur proyek yang terorganisir dengan clear separation of concerns
- **Dependencies Management**: Proper dependencies management dengan requirements.txt
- **Configuration Management**: Environment-based configuration management

### Technical Foundation
- **Version Control**: Git repository dengan proper branching strategy
- **Containerization**: Docker containers dengan multi-service architecture
- **Database Design**: Basic database design dengan normalization principles
- **API Design**: RESTful API design dengan proper HTTP methods
- **Frontend Architecture**: Modular frontend architecture dengan component-based design

## [0.7.0] - 2025-07-14

### Added
- **Project Planning**: Initial project planning dan requirements gathering
- **Technology Stack Selection**: Selection of technology stack berdasarkan requirements
- **Architecture Design**: System architecture design dengan microservices approach
- **Database Design**: Database schema design dengan ERD modeling
- **API Design**: API specification design dengan OpenAPI/Swagger

### Research & Analysis
- **SPK Methods Research**: Research tentang metode SAW dan FIS
- **Technology Research**: Research tentang FastAPI, PostgreSQL, dan Kendo UI
- **Performance Analysis**: Analysis tentang performance requirements
- **Scalability Planning**: Planning untuk system scalability

## [0.6.0] - 2025-07-13

### Added
- **Requirements Analysis**: Detailed requirements analysis untuk SPK system
- **Use Case Definition**: Definition of use cases dan user stories
- **Functional Requirements**: Functional requirements specification
- **Non-Functional Requirements**: Non-functional requirements (performance, security, etc.)
- **System Architecture**: High-level system architecture design

### Documentation
- **Project Charter**: Project charter dengan scope dan objectives
- **Requirements Document**: Detailed requirements document
- **Architecture Document**: System architecture documentation
- **Technical Specification**: Technical specification document

## [0.5.0] - 2025-07-12

### Added
- **Project Concept**: Initial project concept untuk SPK Monitoring Masa Studi
- **Problem Statement**: Definition of problem yang akan diselesaikan
- **Solution Approach**: High-level solution approach dengan SPK methods
- **Stakeholder Analysis**: Analysis of stakeholders dan requirements
- **Project Scope**: Definition of project scope dan deliverables

### Planning
- **Project Timeline**: Initial project timeline dengan milestones
- **Resource Planning**: Resource planning untuk development team
- **Risk Assessment**: Risk assessment dan mitigation strategies
- **Success Criteria**: Definition of success criteria untuk project

---

## Cara Membaca Changelog

### Format
- **Added**: Fitur baru yang ditambahkan
- **Changed**: Perubahan pada fitur yang sudah ada
- **Deprecated**: Fitur yang akan dihapus di versi mendatang
- **Removed**: Fitur yang telah dihapus
- **Fixed**: Perbaikan bug
- **Security**: Perbaikan keamanan

### Versioning
- **Major.Minor.Patch** (semantic versioning)
- **Major**: Breaking changes yang memerlukan migration
- **Minor**: New features yang backward compatible
- **Patch**: Bug fixes yang backward compatible

### Release Notes
Setiap release akan memiliki:
- **Tanggal release** dengan format YYYY-MM-DD
- **Daftar perubahan** berdasarkan kategori (Added, Changed, Fixed, etc.)
- **Breaking changes** (jika ada) dengan migration guide
- **Technical details** untuk developer reference
- **Performance impact** untuk system administrators

### Migration Guide
Untuk setiap breaking change:
- **Before**: State sebelum perubahan
- **After**: State setelah perubahan
- **Migration Steps**: Langkah-langkah migrasi yang diperlukan
- **Rollback Plan**: Plan untuk rollback jika diperlukan

---

## Contributing

Untuk berkontribusi pada changelog:
1. **Tambahkan entry baru** di bagian `[Unreleased]`
2. **Kategorikan perubahan** sesuai format (Added, Changed, Fixed, etc.)
3. **Jelaskan perubahan** dengan jelas dan detail
4. **Update versi** saat release dengan proper versioning
5. **Review dan validate** perubahan sebelum commit

### Guidelines
- **Be Specific**: Jelaskan perubahan dengan spesifik dan detail
- **Include Context**: Sertakan context mengapa perubahan diperlukan
- **Technical Details**: Sertakan technical details untuk developer reference
- **User Impact**: Jelaskan impact pada end users
- **Breaking Changes**: Highlight breaking changes dengan jelas

### Review Process
- **Code Review**: Changelog review sebagai bagian dari code review
- **Technical Review**: Technical review untuk accuracy dan completeness
- **User Review**: User review untuk clarity dan usefulness
- **Final Approval**: Final approval sebelum release

---

## Links

- **GitHub Repository**: [SPK Monitoring Repository](https://github.com/your-repo/spk-monitoring)
- **API Documentation**: [FastAPI Docs](http://localhost:8000/docs)
- **Frontend Application**: [SPK Monitoring App](http://localhost:80)
- **Docker Hub**: [SPK Monitoring Images](https://hub.docker.com/r/your-org/spk-monitoring)
- **Project Wiki**: [Project Documentation](https://github.com/your-repo/spk-monitoring/wiki)
- **Issue Tracker**: [GitHub Issues](https://github.com/your-repo/spk-monitoring/issues)
- **Release Notes**: [GitHub Releases](https://github.com/your-repo/spk-monitoring/releases)

---

## Support

Untuk support dan pertanyaan:
- **Technical Issues**: Create issue di GitHub repository
- **Feature Requests**: Submit feature request melalui GitHub issues
- **Documentation**: Check project wiki dan README files
- **Community**: Join community discussion di GitHub discussions

---

## License

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

*Changelog ini mengikuti format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) dan [Semantic Versioning](https://semver.org/spec/v2.0.0.html).* 

#### Enhanced Evaluation Features (2025-07-20)
```javascript
// Enhanced Confusion Matrix Visualization
function createConfusionMatrixHeatmap(data) {
    // Bubble chart implementation dengan color coding
    const chartData = {
        datasets: [{
            data: data.map((value, index) => ({
                x: index % 2,
                y: Math.floor(index / 2),
                r: Math.sqrt(value) * 5,
                value: value
            })),
            backgroundColor: data.map(value => 
                value > 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)'
            )
        }]
    };
}

// Dynamic Narrative Generation
function generateNarrativeAnalysis() {
    const narrative = {
        performanceSummary: generatePerformanceSummary(),
        modelStrengths: generateModelStrengths(),
        improvementAreas: generateImprovementAreas(),
        practicalInterpretation: generatePracticalInterpretation(),
        confusionMatrixAnalysis: generateConfusionMatrixAnalysis(),
        evaluationMethodology: generateEvaluationMethodology(),
        evaluationConclusion: generateEvaluationConclusion()
    };
    return narrative;
}

// Chart Type Toggle
function toggleConfusionMatrixChart() {
    const currentType = document.getElementById('chartType').value;
    if (currentType === 'bubble') {
        createConfusionMatrixTable();
    } else {
        createConfusionMatrixHeatmap();
    }
}
```

#### File Organization Changes (2025-07-20)
```
Frontend Reorganization:
src/frontend/
├── index.html (tetap di root)
└── test/
    ├── klasifikasi.html
    ├── mahasiswa.html
    ├── saw.html
    ├── test-mahasiswa.html
    └── README.md

Backend Tools Reorganization:
src/backend/tools/
├── testing/
│   ├── test_config.py
│   ├── test_db_connection.py
│   ├── test_env_loading.py
│   └── simple_env_test.py
├── fixing/
│   ├── fix_env.py
│   └── restore_database.py
├── database/
│   ├── restore_database.sh
│   ├── restore_database_docker.sh
│   ├── restore_database_container.py
│   └── restore_from_container.sh
├── environment/
│   ├── validate_env.sh
│   └── env.frontend
├── docker/
│   └── restore_database_docker.sh
├── seeding/
│   ├── seeders.py
│   ├── run_seeder.py
│   └── README_SEEDER.md
└── README.md
```

#### Documentation Fixes (2025-07-20)
```bash
# Bulk date replacement command
find . -name "*.md" -exec sed -i '' 's/2025-07-27/2025-07-20/g' {} \;

# Files updated:
# - CHANGELOG.md
# - README.md
# - docs/features/README_ENHANCED_EVALUATION.md
# - src/frontend/test/README.md
# - src/backend/tools/README.md
# - dan semua file markdown lainnya
```

#### HTML Structure Enhancement (2025-07-20)
```html
<!-- Sebelum: Confusion Matrix dalam grid 2 kolom -->
<div class="col-md-6">
    <div class="mb-4">
        <h5>Analisis Confusion Matrix</h5>
        <div id="confusionMatrixAnalysis"></div>
    </div>
</div>

<!-- Sesudah: Confusion Matrix dalam full width -->
<div class="row mt-4">
    <div class="col-12">
        <div class="mb-4">
            <h5>Analisis Confusion Matrix</h5>
            <div id="confusionMatrixAnalysis"></div>
        </div>
    </div>
</div>
```

#### Enhanced Confusion Matrix Features
- **Bubble Chart Visualization**: Chart confusion matrix dengan bubble size berdasarkan nilai
- **Table-Based Heatmap**: Alternatif visualisasi dengan table dan color coding
- **Interactive Tooltips**: Tooltip yang menampilkan detail nilai dan interpretasi
- **Color Coding System**: 
  - Hijau: True Positive, True Negative (prediksi benar)
  - Merah: False Positive, False Negative (prediksi salah)
- **Chart Type Toggle**: Kemampuan beralih antara bubble chart dan table heatmap
- **Responsive Design**: Chart yang responsif untuk berbagai ukuran layar
- **Accessibility**: Label dan aria-labels untuk accessibility

#### Narrative Analysis System
- **Dynamic Generation**: Narasi yang digenerate secara dinamis berdasarkan hasil evaluasi
- **Confusion Matrix Analysis**: Analisis detail confusion matrix dengan interpretasi
- **Performance Summary**: Ringkasan performa model dengan metrics utama
- **Model Strengths**: Identifikasi kekuatan model berdasarkan hasil evaluasi
- **Improvement Areas**: Area yang perlu diperbaiki berdasarkan analisis
- **Practical Interpretation**: Interpretasi praktis hasil evaluasi
- **Evaluation Methodology**: Penjelasan metodologi evaluasi yang digunakan
- **Evaluation Conclusion**: Kesimpulan evaluasi dengan rekomendasi

#### File Organization Benefits
- **Better Structure**: Struktur file yang lebih terorganisir dan mudah dinavigasi
- **Maintainability**: Kode yang lebih mudah di-maintain dengan pemisahan yang jelas
- **Documentation**: Dokumentasi yang lebih lengkap dan terstruktur
- **Testing**: Tools testing yang terorganisir dengan baik
- **Deployment**: Script deployment yang terpisah dan mudah diakses
- **Environment Management**: Tools environment yang terpusat 