// Router class untuk SPA
class Router {
    constructor(routes) {
        this.routes = routes;
        this.currentHash = '';
        
        // Bind methods
        this.hashCheck = this.hashCheck.bind(this);
        
        // Event listeners
        window.addEventListener('hashchange', this.hashCheck);
        window.addEventListener('load', this.hashCheck);
    }

    hashCheck() {
        // Get current hash without # symbol
        const hash = window.location.hash.slice(1) || 'dashboard';
        
        if (this.currentHash === hash) return;
        this.currentHash = hash;

        console.log('Router: Navigating to hash:', hash);

        // Hide all sections first with multiple approaches
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
            section.style.visibility = 'hidden';
            section.classList.remove('active');
        });

        // Remove active class from all links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Show the appropriate section
        const sectionId = this.routes[`#${hash}`];
        if (sectionId) {
            const section = document.getElementById(sectionId);
            if (section) {
                console.log('Router: Showing section:', sectionId);
                section.style.display = 'block';
                section.style.visibility = 'visible';
                section.classList.add('active');
                
                // Activate corresponding nav link
                const navLink = document.querySelector(`a[href="#${hash}"]`);
                if (navLink) {
                    navLink.classList.add('active');
                }
                
                // Initialize grid if needed
                this.initializeGrid(hash);
            }
        }
        
        // Double-check that only the correct section is visible
        document.querySelectorAll('.section').forEach(section => {
            if (section.id !== sectionId) {
                section.style.display = 'none';
                section.style.visibility = 'hidden';
                section.classList.remove('active');
            }
        });
        
        // Final verification
        const visibleSections = document.querySelectorAll('.section[style*="display: block"]');
        console.log('Router: Visible sections after navigation:', Array.from(visibleSections).map(s => s.id));
    }

    initializeGrid(hash) {
        switch(hash) {
            case 'mahasiswa':
                if (typeof initializeMahasiswaGrid === 'function') {
                    initializeMahasiswaGrid();
                }
                break;
            case 'nilai':
                if (typeof initializeNilaiGrid === 'function') {
                    initializeNilaiGrid();
                }
                break;
            case 'saw':
                if (typeof initializeSAWSection === 'function') {
                    // Only initialize if not already initialized
                    if (!window.sawInitialized) {
                        window.sawInitialized = true;
                        initializeSAWSection();
                    }
                }
                break;
            case 'evaluation':
                if (typeof initializeEvaluation === 'function') {
                    // Only initialize if not already initialized
                    if (!window.evaluationInitialized) {
                        window.evaluationInitialized = true;
                        initializeEvaluation();
                    }
                }
                break;
            case 'saw-evaluation':
                if (typeof window.sawEvaluation !== 'undefined') {
                    // Initialize SAW evaluation if not already done
                    if (!window.sawEvaluationInitialized) {
                        window.sawEvaluationInitialized = true;
                        console.log('Router: Initializing SAW Evaluation');
                        // SAW Evaluation sudah diinisialisasi otomatis saat class dibuat
                    }
                } else {
                    console.log('Router: SAW Evaluation module not found');
                }
                break;
            case 'saw-evaluation-actual':
                if (typeof window.sawEvaluationActual !== 'undefined') {
                    // Initialize SAW evaluation with actual data if not already done
                    if (!window.sawEvaluationActualInitialized) {
                        window.sawEvaluationActualInitialized = true;
                        console.log('Router: Initializing SAW Evaluation with Actual Data');
                        // SAW Evaluation Actual sudah diinisialisasi otomatis saat class dibuat
                    }
                } else {
                    console.log('Router: SAW Evaluation with Actual Data module not found');
                }
                break;
            case 'saw-comparison':
                if (typeof window.sawComparison !== 'undefined') {
                    // Initialize SAW comparison if not already done
                    if (!window.sawComparisonInitialized) {
                        window.sawComparisonInitialized = true;
                        console.log('Router: Initializing SAW Comparison');
                        // SAW Comparison sudah diinisialisasi otomatis saat class dibuat
                    }
                } else {
                    console.log('Router: SAW Comparison module not found');
                }
                break;
            case 'enhanced-evaluation':
                if (typeof window.EnhancedEvaluation !== 'undefined') {
                    // Only initialize if not already initialized
                    if (!window.enhancedEvaluationInitialized) {
                        window.enhancedEvaluationInitialized = true;
                        window.EnhancedEvaluation.init();
                    }
                }
                break;
            case 'fis-actual-evaluation':
                if (typeof initializeFISActualEvaluation === 'function') {
                    // Only initialize if not already initialized
                    if (!window.fisActualEvaluationInitialized) {
                        window.fisActualEvaluationInitialized = true;
                        initializeFISActualEvaluation();
                    }
                }
                break;
            case 'fis-comparison':
                if (typeof initializeFISComparison === 'function') {
                    // Only initialize if not already initialized
                    if (!window.fisComparisonInitialized) {
                        window.fisComparisonInitialized = true;
                        initializeFISComparison();
                    }
                }
                break;
            case 'comparison':
                if (typeof initializeComparison === 'function') {
                    // Only initialize if not already initialized
                    if (!window.comparisonInitialized) {
                        window.comparisonInitialized = true;
                        initializeComparison();
                    }
                }
                break;
            case 'program-studi':
                if (typeof initializeProgramStudi === 'function') {
                    // Only initialize if not already initialized
                    if (!window.programStudiInitialized) {
                        window.programStudiInitialized = true;
                        initializeProgramStudi();
                    }
                }
                break;
            // Add other cases as needed
        }
    }

    navigateTo(hash) {
        window.location.hash = hash;
    }
}

// Export Router untuk digunakan di file lain
window.Router = Router; 

// Cek JWT token sebelum load halaman utama
if (!localStorage.getItem('spk_token')) {
    if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
    }
} else {
    // Set token ke header Authorization untuk semua AJAX request
    $.ajaxSetup({
        beforeSend: function(xhr) {
            const token = localStorage.getItem('spk_token');
            if (token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
        }
    });
} 