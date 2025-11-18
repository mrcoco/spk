from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import os

from database import engine, get_db
from models import Base, Mahasiswa, KlasifikasiKelulusan
from routers.mahasiswa import router as mahasiswa_router
from routers.fuzzy import router as fuzzy_router
from routers.nilai import router as nilai_router
from routers.dashboard import router as dashboard_router
from routers.saw import router as saw_router
from routers.comparison import router as comparison_router
from routers.program_studi import router as program_studi_router
from routers.users import router as users_router
from fuzzy_logic import FuzzyKelulusan

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize Fuzzy Logic
fuzzy_system = FuzzyKelulusan()

app = FastAPI(
    title="SPK Monitoring Masa Studi API",
    description="API untuk Sistem Pendukung Keputusan Monitoring Masa Studi",
    version="1.0.0"
)

# Configure CORS
# For development: Use permissive CORS settings
# For production: Restrict to specific origins

# Check if we're in development mode
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
IS_DEVELOPMENT = ENVIRONMENT in ["development", "dev", "local"]

if IS_DEVELOPMENT:
    # Development: Allow all origins (more permissive)
    # Note: When using "*", we cannot use allow_credentials=True
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins in development
        allow_credentials=False,  # Must be False when using "*"
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
        expose_headers=["*"],
        max_age=3600,
    )
else:
    # Production: Use specific origins
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS",
        "http://localhost,http://localhost:80,http://localhost:3000,http://localhost:8080,http://127.0.0.1,http://127.0.0.1:80,http://127.0.0.1:3000,http://127.0.0.1:8080"
    ).split(",")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
        allow_headers=[
            "Content-Type",
            "Authorization",
            "Accept",
            "Origin",
            "X-Requested-With",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
        ],
        expose_headers=["*"],
        max_age=3600,
    )

# Add explicit OPTIONS handler for all routes to ensure CORS works
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle OPTIONS requests for CORS preflight"""
    return {"message": "OK"}

@app.get("/")
def read_root():
    return {"message": "Welcome to SPK Monitoring Masa Studi API"}

@app.get("/api/check-db")
def check_database(db: Session = Depends(get_db)):
    try:
        # Cek koneksi database
        mahasiswa_count = db.query(Mahasiswa).count()
        klasifikasi_count = db.query(KlasifikasiKelulusan).count()
        
        # Ambil sample data
        sample_mahasiswa = db.query(Mahasiswa).first()
        
        return {
            "status": "success",
            "database_connected": True,
            "mahasiswa_count": mahasiswa_count,
            "klasifikasi_count": klasifikasi_count,
            "sample_mahasiswa": sample_mahasiswa.to_dict() if sample_mahasiswa else None
        }
    except Exception as e:
        return {
            "status": "error",
            "database_connected": False,
            "error": str(e)
        }

@app.post("/api/batch/klasifikasi", tags=["batch"], description="Melakukan klasifikasi untuk semua mahasiswa")
def batch_klasifikasi_mahasiswa(db: Session = Depends(get_db)):
    try:
        # Ambil semua mahasiswa
        mahasiswa_list = db.query(Mahasiswa).all()
        
        for mahasiswa in mahasiswa_list:
            # Hitung klasifikasi untuk setiap mahasiswa
            kategori, nilai_fuzzy, ipk_membership, sks_membership, nilai_dk_membership = fuzzy_system.calculate_graduation_chance(
                mahasiswa.ipk,
                mahasiswa.sks,
                mahasiswa.persen_dek
            )
            
            # Cek apakah sudah ada klasifikasi sebelumnya
            existing_klasifikasi = db.query(KlasifikasiKelulusan).filter(
                KlasifikasiKelulusan.nim == mahasiswa.nim
            ).first()
            
            if existing_klasifikasi:
                # Update klasifikasi yang ada
                existing_klasifikasi.nilai_fuzzy = nilai_fuzzy
                existing_klasifikasi.kategori = kategori
                existing_klasifikasi.ipk_membership = ipk_membership
                existing_klasifikasi.sks_membership = sks_membership
                existing_klasifikasi.nilai_dk_membership = nilai_dk_membership
                existing_klasifikasi.updated_at = datetime.utcnow()
            else:
                # Buat klasifikasi baru
                new_klasifikasi = KlasifikasiKelulusan(
                    nim=mahasiswa.nim,
                    nilai_fuzzy=nilai_fuzzy,
                    kategori=kategori,
                    ipk_membership=ipk_membership,
                    sks_membership=sks_membership,
                    nilai_dk_membership=nilai_dk_membership
                )
                db.add(new_klasifikasi)
        
        # Commit semua perubahan
        db.commit()
        
        return {
            "message": f"Berhasil melakukan klasifikasi untuk {len(mahasiswa_list)} mahasiswa",
            "total_processed": len(mahasiswa_list)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat melakukan batch klasifikasi: {str(e)}"
        )

# Debug log
print("Registering routers...")
print("Fuzzy router routes:", [route.path for route in fuzzy_router.routes])
print("Mahasiswa router routes:", [route.path for route in mahasiswa_router.routes])
print("Nilai router routes:", [route.path for route in nilai_router.routes])
print("Dashboard router routes:", [route.path for route in dashboard_router.routes])
print("SAW router routes:", [route.path for route in saw_router.routes])
print("Comparison router routes:", [route.path for route in comparison_router.routes])
print("Program Studi router routes:", [route.path for route in program_studi_router.routes])
print("Users router routes:", [route.path for route in users_router.routes])

# Include routers
app.include_router(fuzzy_router)
app.include_router(mahasiswa_router)
app.include_router(nilai_router)
app.include_router(dashboard_router)
app.include_router(saw_router)
app.include_router(comparison_router)
app.include_router(program_studi_router)
app.include_router(users_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)