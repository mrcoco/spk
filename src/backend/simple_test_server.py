from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Simple Test Server"}

@app.get("/api/program-studi/")
def get_program_studi():
    return [
        {"id": 1, "program_studi": "Teknik Informatika", "jenjang": "S1"},
        {"id": 2, "program_studi": "Sistem Informasi", "jenjang": "S1"},
        {"id": 3, "program_studi": "Manajemen Informatika", "jenjang": "D3"}
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 