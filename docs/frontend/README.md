# Frontend Documentation

## 🌐 Overview

Dokumentasi lengkap untuk frontend aplikasi SPK Monitoring Masa Studi yang menggunakan HTML, CSS, JavaScript, dan Bootstrap.

## 📋 Documentation Files

### 🔧 Environment & Configuration
- **[Frontend Environment](README_FRONTEND_ENV.md)** - Setup environment frontend
- **[Production Environment](README_PRODUCTION_ENV.md)** - Konfigurasi production

### 📝 Development
- **[Changelog](CHANGELOG.md)** - Riwayat perubahan frontend
- **[Dropdown Search Improvement](DROPDOWN_SEARCH_IMPROVEMENT.md)** - Perbaikan dropdown mahasiswa dengan pencarian minimal 3 karakter
- **[FIS Display Improvement](FIS_DISPLAY_IMPROVEMENT.md)** - Perbaikan tampilan hasil klasifikasi FIS dengan data lengkap mahasiswa
- **[Cache Busting Implementation](CACHE_BUSTING_IMPLEMENTATION.md)** - Implementasi cache busting untuk file JS dan CSS
- **[Notification Error Fix](NOTIFICATION_ERROR_FIX.md)** - Perbaikan error notification dengan fallback mechanism
- **[Dashboard Classification Improvement](DASHBOARD_CLASSIFICATION_IMPROVEMENT.md)** - Perbaikan tampilan hasil klasifikasi dashboard dengan profile mahasiswa dan data raw
- **[FIS Batch Analysis Improvement](FIS_BATCH_ANALYSIS_IMPROVEMENT.md)** - Perbaikan hasil analisis batch FIS agar konsisten dengan SAW
- **[FIS Batch Response Fix](FIS_BATCH_RESPONSE_FIX.md)** - Perbaikan response batch FIS untuk menangani struktur data yang berbeda
- **[FIS Error Handling Improvement](FIS_ERROR_HANDLING_IMPROVEMENT.md)** - Perbaikan error handling FIS dengan logging detail dan fallback mechanism
- **[Toast Notification Improvement](TOAST_NOTIFICATION_IMPROVEMENT.md)** - Perbaikan toast notification dengan design modern seperti Toast.js
- **[FIS Endpoint Fix](FIS_ENDPOINT_FIX.md)** - Perbaikan endpoint FIS untuk mengatasi error 404
- **[FIS Endpoint Duplicate Fix](FIS_ENDPOINT_DUPLICATE_FIX.md)** - Perbaikan endpoint FIS yang duplikat
- **[FIS Notification Fallback Fix](FIS_NOTIFICATION_FALLBACK_FIX.md)** - Perbaikan notification fallback di FIS
- **[Script Loading Fix](SCRIPT_LOADING_FIX.md)** - Perbaikan loading script untuk mengatasi dependency error
- **[Dashboard Config Dependency Fix](DASHBOARD_CONFIG_DEPENDENCY_FIX.md)** - Perbaikan dependency CONFIG di dashboard.js
- **[Mahasiswa Config Dependency Fix](MAHASISWA_CONFIG_DEPENDENCY_FIX.md)** - Perbaikan dependency CONFIG di mahasiswa.js
- **[Nilai Config Dependency Fix](NILAI_CONFIG_DEPENDENCY_FIX.md)** - Perbaikan dependency CONFIG di nilai.js
- **[Config Global Scope Fix](CONFIG_GLOBAL_SCOPE_FIX.md)** - Perbaikan ekspos CONFIG ke global scope
- **[Dropdown Styling Fix](DROPDOWN_STYLING_FIX.md)** - Perbaikan ukuran dropdown pencarian nama yang terlalu tinggi

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Copy environment template
cp env.frontend.example env.frontend

# Edit environment variables
nano env.frontend
```

### 2. Start Frontend
```bash
# Start with Docker
docker-compose up -d frontend

# Or serve locally
python -m http.server 3000
```

### 3. Access Application
```
Frontend: http://localhost:3000
Backend API: http://localhost:8000
```

## 🔧 Technology Stack

### Core Technologies
- **HTML5** - Structure dan semantics
- **CSS3** - Styling dan layout
- **JavaScript (ES6+)** - Interaktivitas dan logic
- **Bootstrap 4** - UI framework

### Libraries & Frameworks
- **jQuery 3.6.0** - DOM manipulation
- **Chart.js** - Data visualization
- **Font Awesome** - Icons
- **Kendo UI** - Advanced UI components

### Development Tools
- **Nginx** - Web server dan reverse proxy
- **Docker** - Containerization

## 📁 Project Structure

```
src/frontend/
├── index.html              # Main application page
├── app.js                  # Main JavaScript application
├── style.css              # Main stylesheet
├── js/                    # JavaScript files
│   ├── config.js          # Configuration
│   ├── dashboard.js       # Dashboard functionality
│   ├── students.js        # Student management
│   ├── saw.js            # SAW calculation
│   ├── fuzzy.js          # Fuzzy logic
│   ├── comparison.js     # Method comparison
│   └── jquery/           # jQuery library
├── styles/               # Additional stylesheets
│   ├── Bootstrap/        # Bootstrap components
│   ├── font-awesome/     # Font Awesome icons
│   └── kendo/           # Kendo UI styles
├── Dockerfile           # Docker configuration
└── nginx.conf          # Nginx configuration
```

## 🎨 UI Components

### Navigation
- **Navbar** - Main navigation dengan dropdown menus
- **Sidebar** - Side navigation untuk mobile
- **Breadcrumbs** - Page navigation

### Data Display
- **Tables** - Data tables dengan sorting dan pagination
- **Cards** - Information cards
- **Charts** - Data visualization dengan Chart.js
- **Modals** - Popup dialogs

### Forms
- **Input Fields** - Text, number, select inputs
- **Validation** - Client-side form validation
- **File Upload** - File upload components

### Interactive Elements
- **Buttons** - Action buttons dengan states
- **Dropdowns** - Selection dropdowns
- **Tabs** - Tabbed content
- **Accordions** - Collapsible content

## 📊 Pages & Features

### Dashboard
- **Overview** - Summary statistics
- **Charts** - Data visualization
- **Quick Actions** - Common tasks

### Student Management
- **Student List** - View all students
- **Student Details** - Individual student information
- **Add/Edit Student** - Student form
- **Student Search** - Search functionality

### SAW Method
- **Criteria Setup** - Define SAW criteria
- **Calculation** - SAW calculation interface
- **Results** - SAW results display
- **Ranking** - Student ranking

### Fuzzy Logic
- **Classification** - Fuzzy classification interface
- **Results** - Classification results dengan data lengkap mahasiswa
- **Student Information** - Informasi mahasiswa (NIM, nama, program studi)
- **Raw Data Display** - Tampilan data raw (IPK, SKS, persen D/E/K)
- **Membership Values** - Nilai keanggotaan fuzzy untuk setiap kriteria
- **Visual Results** - Tampilan hasil dengan warna dan threshold info

### Comparison
- **Method Comparison** - Compare SAW vs Fuzzy
- **Results Analysis** - Analysis of both methods
- **Visualization** - Comparative charts

## 🔌 API Integration

### Backend Communication
```javascript
// Example API call
async function getStudents() {
    try {
        const response = await fetch('/api/students');
        const data = await response.json();
        return data.students;
    } catch (error) {
        console.error('Error fetching students:', error);
        throw error;
    }
}
```

### Error Handling
```javascript
// Global error handler
function handleApiError(error) {
    console.error('API Error:', error);
    showNotification('Error', 'Terjadi kesalahan pada server', 'error');
}
```

### Data Validation
```javascript
// Form validation
function validateStudentForm(formData) {
    const errors = [];
    
    if (!formData.nim) errors.push('NIM is required');
    if (!formData.nama) errors.push('Nama is required');
    if (formData.ipk < 0 || formData.ipk > 4) errors.push('IPK must be between 0-4');
    
    return errors;
}
```

## 🎯 User Experience

### Responsive Design
- **Mobile First** - Optimized for mobile devices
- **Tablet Support** - Responsive for tablets
- **Desktop** - Full desktop experience

### Accessibility
- **Keyboard Navigation** - Full keyboard support
- **Screen Reader** - ARIA labels and semantic HTML
- **Color Contrast** - WCAG compliant colors

### Performance
- **Lazy Loading** - Load content on demand
- **Caching** - Browser caching for static assets
- **Minification** - Compressed CSS and JS

## 🔧 Configuration

### Environment Variables
```bash
# Frontend Configuration
FRONTEND_PORT=3000
BACKEND_API_URL=http://localhost:8000
DEBUG=false
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🧪 Testing

### Manual Testing
- **Cross-browser Testing** - Chrome, Firefox, Safari, Edge
- **Device Testing** - Mobile, tablet, desktop
- **Functionality Testing** - All features and workflows

### Automated Testing
```bash
# Run tests (if configured)
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

## 📈 Performance Optimization

### Loading Optimization
- **Minify CSS/JS** - Reduce file sizes
- **Image Optimization** - Compress images
- **CDN Usage** - Use CDN for libraries

### Runtime Optimization
- **Debounce Search** - Optimize search input
- **Virtual Scrolling** - Handle large datasets
- **Memory Management** - Clean up event listeners

## 🔒 Security

### Client-side Security
- **Input Sanitization** - Sanitize user inputs
- **XSS Prevention** - Prevent cross-site scripting
- **CSRF Protection** - Cross-site request forgery protection

### Best Practices
- **HTTPS** - Use secure connections
- **Content Security Policy** - CSP headers
- **Regular Updates** - Keep dependencies updated

## 🐛 Troubleshooting

### Common Issues
1. **CORS Errors** - Check backend CORS configuration
2. **API Connection** - Verify backend is running
3. **Styling Issues** - Check CSS loading
4. **JavaScript Errors** - Check browser console

### Error Handling
- [FIS Notification Fallback Fix](FIS_NOTIFICATION_FALLBACK_FIX.md) - Perbaikan error notifikasi di FIS
- [Dashboard Notification Fix](DASHBOARD_NOTIFICATION_FIX.md) - Perbaikan error showNotification di dashboard
- [Kendo Notification Timing Fix](KENDO_NOTIFICATION_TIMING_FIX.md) - Perbaikan timing inisialisasi Kendo Notification
- [Fuzzy Endpoint Fix](FUZZY_ENDPOINT_FIX.md) - Perbaikan endpoint fuzzy yang salah
- [FIS Dropdown Validation Fix](FIS_DROPDOWN_VALIDATION_FIX.md) - Perbaikan validasi dropdown mahasiswa di FIS
- [FIS Dropdown Reset Fix](FIS_DROPDOWN_RESET_FIX.md) - Perbaikan reset dropdown setelah klasifikasi FIS
- [FIS Dropdown Search Fix](FIS_DROPDOWN_SEARCH_FIX.md) - Perbaikan error 422 pada dropdown search FIS
- [FIS Button Troubleshooting](FIS_BUTTON_TROUBLESHOOTING.md) - Troubleshooting tombol klasifikasi FIS
- [FIS Button Repeat Fix](FIS_BUTTON_REPEAT_FIX.md) - Perbaikan tombol klasifikasi FIS untuk klasifikasi berulang
- [FIS Dropdown Select Fix](FIS_DROPDOWN_SELECT_FIX.md) - Perbaikan event handler select dropdown FIS
- [FIS NIM Extraction Fix](FIS_NIM_EXTRACTION_FIX.md) - Perbaikan ekstraksi NIM dari dropdown FIS
- [FIS Dashboard Sync Fix](FIS_DASHBOARD_SYNC_FIX.md) - Perbaikan sinkronisasi dashboard dengan halaman FIS

### Debug Mode
```javascript
// Enable debug logging
window.DEBUG = true;

// Debug API calls
function debugApiCall(url, data) {
    if (window.DEBUG) {
        console.log('API Call:', url, data);
    }
}
```

## 📱 Mobile Support

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Touch Support
- **Touch Events** - Touch-friendly interactions
- **Swipe Gestures** - Swipe navigation
- **Touch Targets** - Adequate button sizes

## 🎨 Customization

### Theming
- **CSS Variables** - Customizable colors and fonts
- **Bootstrap Override** - Custom Bootstrap theme
- **Component Styling** - Custom component styles

### Branding
- **Logo** - Custom logo integration
- **Colors** - Brand color scheme
- **Typography** - Custom fonts

---

**Frontend Documentation** - SPK Monitoring Masa Studi 🌐 