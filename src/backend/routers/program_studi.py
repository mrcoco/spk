from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import ProgramStudi
from schemas import ProgramStudiCreate, ProgramStudiUpdate, ProgramStudi as ProgramStudiSchema

router = APIRouter(prefix="/api/program-studi", tags=["Program Studi"])

@router.post("/", response_model=ProgramStudiSchema)
def create_program_studi(program_studi: ProgramStudiCreate, db: Session = Depends(get_db)):
    """Membuat program studi baru"""
    db_program_studi = ProgramStudi(
        program_studi=program_studi.program_studi,
        jenjang=program_studi.jenjang
    )
    db.add(db_program_studi)
    db.commit()
    db.refresh(db_program_studi)
    return db_program_studi

@router.get("/", response_model=List[dict])
def get_program_studi_list(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Mendapatkan daftar program studi dengan pagination dan search"""
    query = db.query(ProgramStudi)
    
    if search:
        query = query.filter(
            ProgramStudi.program_studi.ilike(f"%{search}%") |
            ProgramStudi.jenjang.ilike(f"%{search}%")
        )
    
    program_studi_list = query.offset(skip).limit(limit).all()
    return [program.to_dict() for program in program_studi_list]

@router.get("/{program_studi_id}", response_model=ProgramStudiSchema)
def get_program_studi(program_studi_id: int, db: Session = Depends(get_db)):
    """Mendapatkan detail program studi berdasarkan ID"""
    program_studi = db.query(ProgramStudi).filter(ProgramStudi.id == program_studi_id).first()
    if not program_studi:
        raise HTTPException(status_code=404, detail="Program studi tidak ditemukan")
    return program_studi

@router.put("/{program_studi_id}", response_model=ProgramStudiSchema)
def update_program_studi(
    program_studi_id: int, 
    program_studi_update: ProgramStudiUpdate, 
    db: Session = Depends(get_db)
):
    """Mengupdate program studi"""
    db_program_studi = db.query(ProgramStudi).filter(ProgramStudi.id == program_studi_id).first()
    if not db_program_studi:
        raise HTTPException(status_code=404, detail="Program studi tidak ditemukan")
    
    update_data = program_studi_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_program_studi, field, value)
    
    db.commit()
    db.refresh(db_program_studi)
    return db_program_studi

@router.delete("/{program_studi_id}")
def delete_program_studi(program_studi_id: int, db: Session = Depends(get_db)):
    """Menghapus program studi"""
    db_program_studi = db.query(ProgramStudi).filter(ProgramStudi.id == program_studi_id).first()
    if not db_program_studi:
        raise HTTPException(status_code=404, detail="Program studi tidak ditemukan")
    
    db.delete(db_program_studi)
    db.commit()
    return {"message": "Program studi berhasil dihapus"}

@router.get("/jenjang/{jenjang}", response_model=List[ProgramStudiSchema])
def get_program_studi_by_jenjang(jenjang: str, db: Session = Depends(get_db)):
    """Mendapatkan daftar program studi berdasarkan jenjang"""
    program_studi_list = db.query(ProgramStudi).filter(ProgramStudi.jenjang == jenjang).all()
    return program_studi_list 