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

        // Hide all sections first
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
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
                section.style.display = 'block';
                // Activate corresponding nav link
                const navLink = document.querySelector(`a[href="#${hash}"]`);
                if (navLink) {
                    navLink.classList.add('active');
                }
                
                // Initialize grid if needed
                this.initializeGrid(hash);
            }
        }
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
                    initializeSAWSection();
                }
                break;
            case 'comparison':
                if (typeof initializeComparison === 'function') {
                    initializeComparison();
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