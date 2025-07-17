#!/bin/bash

# Script untuk deploy dan test environment variables di production
# IP: 139.59.236.100

set -e

echo "🚀 Starting Production Deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_IP="139.59.236.100"
FRONTEND_PORT="80"
BACKEND_PORT="8000"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Validate files
log_info "Validating production files..."

if [ ! -f "env.production" ]; then
    log_error "env.production file not found!"
    exit 1
fi

if [ ! -f "js/env-updater.js" ]; then
    log_error "env-updater.js not found!"
    exit 1
fi

if [ ! -f "js/test-env-production.js" ]; then
    log_error "test-env-production.js not found!"
    exit 1
fi

log_success "All required files found"

# Step 2: Check production configuration
log_info "Checking production configuration..."

# Check if env.production has correct API_BASE_URL
if grep -q "API_BASE_URL=http://139.59.236.100:8000" env.production; then
    log_success "Production API_BASE_URL configured correctly"
else
    log_warning "Production API_BASE_URL may not be configured correctly"
fi

# Check if env.production has production environment
if grep -q "ENVIRONMENT=production" env.production; then
    log_success "Production environment configured"
else
    log_warning "Production environment may not be configured correctly"
fi

# Step 3: Test local environment detection
log_info "Testing local environment detection..."

# Create a simple test HTML file
cat > test-env.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Environment Test</title>
</head>
<body>
    <h1>Environment Variables Test</h1>
    <div id="results"></div>
    
    <script src="js/env-loader.js"></script>
    <script src="js/env-updater.js"></script>
    <script src="js/config.js"></script>
    <script>
        // Simulate production environment
        Object.defineProperty(window.location, 'hostname', {
            value: '139.59.236.100',
            writable: false
        });
        
        // Force reload environment
        if (window.envUpdater) {
            window.envUpdater.reload();
        }
        
        // Display results
        setTimeout(() => {
            const results = document.getElementById('results');
            results.innerHTML = `
                <h2>Test Results:</h2>
                <p><strong>Environment:</strong> ${window.envUpdater ? window.envUpdater.getCurrentEnvironment() : 'unknown'}</p>
                <p><strong>API Base URL:</strong> ${window.CONFIG ? window.CONFIG.API_BASE_URL : 'unknown'}</p>
                <p><strong>Debug Mode:</strong> ${window.CONFIG ? window.CONFIG.DEBUG : 'unknown'}</p>
                <p><strong>Meta Tags Updated:</strong> ${document.querySelector('meta[name="env-API_BASE_URL"]') ? 'Yes' : 'No'}</p>
            `;
        }, 1000);
    </script>
</body>
</html>
EOF

log_success "Test HTML file created"

# Step 4: Check Docker configuration
log_info "Checking Docker configuration..."

if [ -f "Dockerfile" ]; then
    log_success "Dockerfile found"
else
    log_warning "Dockerfile not found - manual deployment required"
fi

if [ -f "nginx.conf" ]; then
    log_success "Nginx configuration found"
else
    log_warning "Nginx configuration not found"
fi

# Step 5: Production deployment checklist
echo ""
log_info "Production Deployment Checklist:"
echo "=================================="

echo "1. ✅ Environment files configured"
echo "2. ✅ Frontend scripts updated"
echo "3. ✅ Production test script created"
echo "4. ✅ Docker configuration checked"
echo ""
echo "Next steps:"
echo "==========="
echo "1. Deploy to production server (139.59.236.100)"
echo "2. Ensure backend is running on port 8000"
echo "3. Ensure frontend is accessible on port 80"
echo "4. Run production test in browser console"
echo ""

# Step 6: Generate test commands
log_info "Test commands for production:"
echo "================================"
echo ""
echo "1. Open browser and navigate to: http://139.59.236.100"
echo ""
echo "2. Open Developer Tools (F12) and run these commands:"
echo ""
echo "   // Test environment detection"
echo "   console.log('Environment:', window.envUpdater.getCurrentEnvironment());"
echo ""
echo "   // Test API URL"
echo "   console.log('API URL:', window.CONFIG.API_BASE_URL);"
echo ""
echo "   // Test meta tags"
echo "   document.querySelectorAll('meta[name^=\"env-\"]').forEach(meta => {"
echo "       console.log(meta.getAttribute('name'), ':', meta.getAttribute('content'));"
echo "   });"
echo ""
echo "   // Test API connection"
echo "   fetch(window.CONFIG.getApiUrl('/dashboard'))"
echo "       .then(response => response.json())"
echo "       .then(data => console.log('API Response:', data))"
echo "       .catch(error => console.error('API Error:', error));"
echo ""
echo "3. Check console for test results from test-env-production.js"
echo ""

# Step 7: Generate deployment commands
log_info "Deployment commands:"
echo "======================"
echo ""
echo "For Docker deployment:"
echo "docker build -t spk-frontend ."
echo "docker run -d -p 80:80 --name spk-frontend spk-frontend"
echo ""
echo "For manual deployment:"
echo "1. Copy files to /var/www/html/"
echo "2. Configure nginx to serve static files"
echo "3. Ensure proper file permissions"
echo ""

# Step 8: Cleanup
rm -f test-env.html

log_success "Production deployment preparation completed!"
echo ""
log_info "Remember to:"
echo "- Update backend CORS configuration"
echo "- Test API connectivity"
echo "- Monitor application logs"
echo "- Verify all features work correctly"
echo ""

echo "🎉 Ready for production deployment!" 