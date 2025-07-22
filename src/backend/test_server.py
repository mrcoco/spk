from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from test_program_studi_router import router as program_studi_router

app = FastAPI(
    title="SPK Monitoring Masa Studi API - Test",
    description="API untuk Sistem Pendukung Keputusan Monitoring Masa Studi",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:80",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1",
        "http://127.0.0.1:80",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "*"  # Fallback untuk development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to SPK Monitoring Masa Studi API - Test Server"}

@app.get("/api/check-db")
def check_database():
    return {
        "status": "test_mode",
        "database_connected": False,
        "message": "Running in test mode without database"
    }

# Include routers
app.include_router(program_studi_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 