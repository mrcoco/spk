import os
import json
from typing import List, Optional

# Try to load dotenv if available
try:
    from dotenv import load_dotenv  # type: ignore
    # Load .env file if exists, otherwise load env.local
    if os.path.exists('.env'):
        load_dotenv('.env')
    elif os.path.exists('env.local'):
        load_dotenv('env.local')
    elif os.path.exists('env.backend'):
        load_dotenv('env.backend')
    else:
        # Try to load from parent directory
        parent_env = os.path.join(os.path.dirname(__file__), '..', '.env')
        if os.path.exists(parent_env):
            load_dotenv(parent_env)
        else:
            print("Warning: No .env file found. Using default configuration.")
except ImportError:
    # If python-dotenv is not installed, continue without it
    print("Warning: python-dotenv not installed. Install with: pip install python-dotenv")
    pass

class Config:
    """Konfigurasi aplikasi SPK Monitoring Masa Studi"""
    
    # ========================================
    # Database Configuration
    # ========================================
    POSTGRES_USER = os.getenv('POSTGRES_USER', 'spk_user')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'spk_password')
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'db')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
    POSTGRES_DB = os.getenv('POSTGRES_DB', 'spk_db')
    
    # Database URL
    DATABASE_URL = os.getenv('DATABASE_URL', 
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")
    
    # SQLAlchemy Configuration
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': int(os.getenv('DB_POOL_SIZE', '10')),
        'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', '20')),
        'pool_timeout': int(os.getenv('DB_POOL_TIMEOUT', '30')),
        'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', '3600'))
    }
    
    # ========================================
    # Application Configuration
    # ========================================
    SECRET_KEY = os.getenv('SECRET_KEY', 'spk-backend-secret-key-2024')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
    
    # Server Configuration
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', '8000'))
    WORKERS = int(os.getenv('WORKERS', '1'))
    
    # ========================================
    # CORS Configuration
    # ========================================
    CORS_HEADERS = 'Content-Type'
    
    @staticmethod
    def get_cors_origins() -> List[str]:
        """Get CORS origins from environment variable"""
        cors_origins = os.getenv('CORS_ORIGINS', '["http://localhost:80", "http://localhost:3000", "http://frontend:80"]')
        try:
            return json.loads(cors_origins)
        except json.JSONDecodeError:
            return ["http://localhost:80", "http://localhost:3000", "http://frontend:80"]
    
    @staticmethod
    def get_cors_headers() -> List[str]:
        """Get CORS headers from environment variable"""
        cors_headers = os.getenv('CORS_HEADERS', '["Content-Type", "Authorization"]')
        try:
            return json.loads(cors_headers)
        except json.JSONDecodeError:
            return ["Content-Type", "Authorization"]
    
    @staticmethod
    def get_cors_methods() -> List[str]:
        """Get CORS methods from environment variable"""
        cors_methods = os.getenv('CORS_METHODS', '["GET", "POST", "PUT", "DELETE", "OPTIONS"]')
        try:
            return json.loads(cors_methods)
        except json.JSONDecodeError:
            return ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    
    # ========================================
    # API Configuration
    # ========================================
    API_PREFIX = os.getenv('API_PREFIX', '/api')
    API_VERSION = os.getenv('API_VERSION', 'v1')
    API_TITLE = os.getenv('API_TITLE', 'SPK Monitoring Masa Studi API')
    API_DESCRIPTION = os.getenv('API_DESCRIPTION', 
        'API untuk sistem pendukung keputusan monitoring masa studi mahasiswa')
    API_VERSION_STR = os.getenv('API_VERSION_STR', '1.0.0')
    
    # ========================================
    # Security Configuration
    # ========================================
    @staticmethod
    def get_allowed_hosts() -> List[str]:
        """Get allowed hosts from environment variable"""
        allowed_hosts = os.getenv('ALLOWED_HOSTS', '["localhost", "127.0.0.1", "0.0.0.0"]')
        try:
            return json.loads(allowed_hosts)
        except json.JSONDecodeError:
            return ["localhost", "127.0.0.1", "0.0.0.0"]
    
    RATE_LIMIT_ENABLED = os.getenv('RATE_LIMIT_ENABLED', 'False').lower() == 'true'
    RATE_LIMIT_REQUESTS = int(os.getenv('RATE_LIMIT_REQUESTS', '100'))
    RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', '60'))
    
    # ========================================
    # File Upload Configuration
    # ========================================
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', '10485760'))  # 10MB default
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    
    @staticmethod
    def get_allowed_extensions() -> List[str]:
        """Get allowed file extensions from environment variable"""
        allowed_extensions = os.getenv('ALLOWED_EXTENSIONS', '["csv", "xlsx", "xls"]')
        try:
            return json.loads(allowed_extensions)
        except json.JSONDecodeError:
            return ["csv", "xlsx", "xls"]
    
    # ========================================
    # Logging Configuration
    # ========================================
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = os.getenv('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # ========================================
    # Timezone Configuration
    # ========================================
    TIMEZONE = os.getenv('TIMEZONE', 'Asia/Jakarta')
    
    # ========================================
    # Development Configuration
    # ========================================
    RELOAD_ON_CHANGE = os.getenv('RELOAD_ON_CHANGE', 'True').lower() == 'true'
    AUTO_MIGRATE = os.getenv('AUTO_MIGRATE', 'True').lower() == 'true'
    SEED_DATA = os.getenv('SEED_DATA', 'True').lower() == 'true'
    
    # ========================================
    # Monitoring Configuration
    # ========================================
    HEALTH_CHECK_ENABLED = os.getenv('HEALTH_CHECK_ENABLED', 'True').lower() == 'true'
    METRICS_ENABLED = os.getenv('METRICS_ENABLED', 'False').lower() == 'true'
    
    # ========================================
    # Email Configuration (for future use)
    # ========================================
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USER = os.getenv('SMTP_USER', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    EMAIL_FROM = os.getenv('EMAIL_FROM', '')
    
    # ========================================
    # Redis Configuration (for future use)
    # ========================================
    REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
    REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
    REDIS_DB = int(os.getenv('REDIS_DB', '0'))
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', '')
    
    # ========================================
    # SPK Specific Configuration
    # ========================================
    # SAW Algorithm Configuration
    SAW_CRITERIA_WEIGHTS = {
        'ipk': 0.3,
        'sks': 0.25,
        'semester': 0.2,
        'usia': 0.15,
        'status': 0.1
    }
    
    # Fuzzy Logic Configuration
    FUZZY_SETS = {
        'ipk': {
            'sangat_baik': (3.5, 4.0),
            'baik': (3.0, 3.5),
            'cukup': (2.5, 3.0),
            'kurang': (0.0, 2.5)
        },
        'sks': {
            'tinggi': (144, 160),
            'sedang': (120, 144),
            'rendah': (0, 120)
        },
        'semester': {
            'tinggi': (8, 14),
            'sedang': (6, 8),
            'rendah': (1, 6)
        },
        'usia': {
            'muda': (17, 22),
            'sedang': (22, 25),
            'tua': (25, 30)
        }
    }
    
    # Classification thresholds
    CLASSIFICATION_THRESHOLDS = {
        'sangat_baik': 0.8,
        'baik': 0.6,
        'cukup': 0.4,
        'kurang': 0.0
    }
    
    # ========================================
    # Utility Methods
    # ========================================
    @classmethod
    def is_production(cls) -> bool:
        """Check if running in production environment"""
        return cls.ENVIRONMENT.lower() == 'production'
    
    @classmethod
    def is_development(cls) -> bool:
        """Check if running in development environment"""
        return cls.ENVIRONMENT.lower() == 'development'
    
    @classmethod
    def get_database_config(cls) -> dict:
        """Get database configuration as dictionary"""
        return {
            'user': cls.POSTGRES_USER,
            'password': cls.POSTGRES_PASSWORD,
            'host': cls.POSTGRES_HOST,
            'port': cls.POSTGRES_PORT,
            'database': cls.POSTGRES_DB,
            'url': cls.DATABASE_URL
        }
    
    @classmethod
    def get_server_config(cls) -> dict:
        """Get server configuration as dictionary"""
        return {
            'host': cls.HOST,
            'port': cls.PORT,
            'workers': cls.WORKERS,
            'debug': cls.DEBUG
        }
    
    @classmethod
    def get_api_config(cls) -> dict:
        """Get API configuration as dictionary"""
        return {
            'prefix': cls.API_PREFIX,
            'version': cls.API_VERSION,
            'title': cls.API_TITLE,
            'description': cls.API_DESCRIPTION,
            'version_str': cls.API_VERSION_STR
        }
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate configuration"""
        required_vars = [
            'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_HOST', 
            'POSTGRES_PORT', 'POSTGRES_DB', 'SECRET_KEY'
        ]
        
        for var in required_vars:
            if not getattr(cls, var, None):
                print(f"❌ Missing required configuration: {var}")
                return False
        
        print("✅ Configuration validation passed")
        return True


# Create config instance
config = Config()

# Validate configuration on import
if __name__ == "__main__":
    config.validate_config() 