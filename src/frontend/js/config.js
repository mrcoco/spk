// Konfigurasi aplikasi
const CONFIG = {
    // Base URL API
    API_BASE_URL: 'http://localhost:8000',

    // Endpoint API
    ENDPOINTS: {
        DASHBOARD: '/api/dashboard',
        MAHASISWA: '/api/mahasiswa',
        NILAI: '/api/nilai',
        FUZZY: '/api/fuzzy',
        SAW: '/api/saw',
        COMPARISON: '/api/comparison',
        BATCH_KLASIFIKASI: '/api/batch/klasifikasi'
    },

    // Fungsi untuk mendapatkan URL lengkap API
    getApiUrl: function(endpoint) {
        return this.API_BASE_URL + endpoint;
    }
};

// Mencegah modifikasi objek CONFIG
Object.freeze(CONFIG);
Object.freeze(CONFIG.ENDPOINTS); 