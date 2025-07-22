from fastapi import APIRouter
from typing import List

router = APIRouter(prefix="/api/program-studi", tags=["Program Studi"])

# Mock data untuk testing
mock_program_studi = [
    {"id": 1, "program_studi": "Teknik Informatika", "jenjang": "S1"},
    {"id": 2, "program_studi": "Sistem Informasi", "jenjang": "S1"},
    {"id": 3, "program_studi": "Manajemen Informatika", "jenjang": "D3"}
]

@router.get("/", response_model=List[dict])
def get_program_studi_list():
    """Mendapatkan daftar program studi untuk testing"""
    return mock_program_studi

@router.get("/{program_studi_id}", response_model=dict)
def get_program_studi(program_studi_id: int):
    """Mendapatkan detail program studi berdasarkan ID untuk testing"""
    for program in mock_program_studi:
        if program["id"] == program_studi_id:
            return program
    return {"error": "Program studi tidak ditemukan"}

@router.post("/", response_model=dict)
def create_program_studi(program_studi: dict):
    """Membuat program studi baru untuk testing"""
    new_id = max([p["id"] for p in mock_program_studi]) + 1
    new_program = {
        "id": new_id,
        "program_studi": program_studi.get("program_studi", ""),
        "jenjang": program_studi.get("jenjang", "")
    }
    mock_program_studi.append(new_program)
    return new_program 