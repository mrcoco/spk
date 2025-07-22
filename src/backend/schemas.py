from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List, Dict
from datetime import datetime
from models import KategoriPeluang

class MahasiswaBase(BaseModel):
    nim: str = Field(..., min_length=8, max_length=20)
    nama: str = Field(..., min_length=2, max_length=100)
    program_studi: str = Field(..., min_length=2, max_length=50)
    ipk: float = Field(..., ge=0.0, le=4.0)
    sks: int = Field(..., ge=0, le=200)
    persen_dek: float = Field(..., ge=0.0, le=100.0)

    @validator('nim')
    def validate_nim(cls, v):
        if not v.isalnum():
            raise ValueError('NIM harus berupa angka atau huruf')
        return v

    @validator('ipk')
    def validate_ipk(cls, v):
        return round(float(v), 2)

    @validator('persen_dek')
    def validate_percentage(cls, v):
        return round(float(v), 2)

class MahasiswaCreate(MahasiswaBase):
    pass

class MahasiswaUpdate(BaseModel):
    nama: Optional[str] = Field(None, min_length=2, max_length=100)
    program_studi: Optional[str] = Field(None, min_length=2, max_length=50)
    ipk: Optional[float] = Field(None, ge=0.0, le=4.0)
    sks: Optional[int] = Field(None, ge=0, le=200)
    persen_dek: Optional[float] = Field(None, ge=0.0, le=100.0)

    @validator('ipk')
    def validate_ipk(cls, v):
        if v is not None:
            return round(float(v), 2)
        return v

class KlasifikasiKelulusanBase(BaseModel):
    nim: str = Field(..., min_length=8, max_length=20)
    kategori: KategoriPeluang
    nilai_fuzzy: float = Field(..., ge=0.0, le=1.0)
    ipk_membership: float = Field(..., ge=0.0, le=1.0)
    sks_membership: float = Field(..., ge=0.0, le=1.0)
    nilai_dk_membership: float = Field(..., ge=0.0, le=1.0)

class KlasifikasiKelulusanCreate(KlasifikasiKelulusanBase):
    pass

class KlasifikasiKelulusanUpdate(BaseModel):
    kategori: Optional[KategoriPeluang] = None
    nilai_fuzzy: Optional[float] = Field(None, ge=0.0, le=1.0)
    ipk_membership: Optional[float] = Field(None, ge=0.0, le=1.0)
    sks_membership: Optional[float] = Field(None, ge=0.0, le=1.0)
    nilai_dk_membership: Optional[float] = Field(None, ge=0.0, le=1.0)

class KlasifikasiKelulusanResponse(KlasifikasiKelulusanBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class FuzzyResponse(BaseModel):
    """
    Schema khusus untuk response endpoint fuzzy yang mengizinkan nilai_fuzzy > 1.0
    """
    nim: str
    kategori: KategoriPeluang
    nilai_fuzzy: float = Field(..., ge=0.0, le=100.0)  # Skala 0-100
    ipk_membership: float = Field(..., ge=0.0, le=100.0)
    sks_membership: float = Field(..., ge=0.0, le=100.0)
    nilai_dk_membership: float = Field(..., ge=0.0, le=100.0)
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class NilaiBase(BaseModel):
    nim: str = Field(..., min_length=8, max_length=20)
    tahun: int = Field(..., ge=2000, le=2100)
    semester: int = Field(..., ge=1, le=14)
    kode_matakuliah: str = Field(..., min_length=3, max_length=20)
    nama_matakuliah: str = Field(..., min_length=3, max_length=100)
    nilai: str = Field(..., min_length=1, max_length=2)

    @validator('nilai')
    def validate_nilai(cls, v):
        valid_nilai = [
            'A', 'A-',
            'B+', 'B', 'B-',
            'C+', 'C', 'C-',
            'D+', 'D', 'D-',
            'E',
            'K',
            'TL'  # Tambahkan TL sebagai nilai yang valid
        ]
        if v.upper() not in valid_nilai:
            raise ValueError('Nilai harus berupa: A, A-, B+, B, B-, C+, C, C-, D+, D, D-, E, K, atau TL')
        return v.upper()

class NilaiCreate(NilaiBase):
    pass

class NilaiUpdate(BaseModel):
    tahun: Optional[int] = Field(None, ge=2000, le=2100)
    semester: Optional[int] = Field(None, ge=1, le=14)
    kode_matakuliah: Optional[str] = Field(None, min_length=3, max_length=20)
    nama_matakuliah: Optional[str] = Field(None, min_length=3, max_length=100)
    nilai: Optional[str] = Field(None, min_length=1, max_length=2)

    @validator('nilai')
    def validate_nilai(cls, v):
        if v is not None:
            valid_nilai = [
                'A', 'A-',
                'B+', 'B', 'B-',
                'C+', 'C', 'C-',
                'D+', 'D', 'D-',
                'E',
                'K',
                'TL'  # Tambahkan TL sebagai nilai yang valid
            ]
            if v.upper() not in valid_nilai:
                raise ValueError('Nilai harus berupa: A, A-, B+, B, B-, C+, C, C-, D+, D, D-, E, K, atau TL')
            return v.upper()
        return v

class NilaiResponse(NilaiBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class MahasiswaResponse(MahasiswaBase):
    created_at: datetime
    updated_at: datetime
    nilai_list: List[NilaiResponse] = []
    klasifikasi: Optional[KlasifikasiKelulusanResponse] = None

    class Config:
        orm_mode = True

class MahasiswaGridResponse(MahasiswaBase):
    """
    Schema untuk endpoint grid mahasiswa yang tidak include klasifikasi
    untuk menghindari konflik validasi nilai_fuzzy
    """
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class MahasiswaSearchResponse(MahasiswaBase):
    """
    Schema untuk endpoint search yang tidak include klasifikasi
    untuk menghindari konflik validasi nilai_fuzzy
    """
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class CriteriaResponse(BaseModel):
    id: int
    name: str
    weight: float
    is_cost: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

class SAWResultResponse(BaseModel):
    id: int
    nim: str
    nilai_akhir: float
    ranking: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

class CriteriaDetailsResponse(BaseModel):
    nim: str
    criteria_values: Dict[str, float]
    normalized_values: Dict[str, float]
    weighted_values: Dict[str, float]
    final_value: float

    class Config:
        orm_mode = True

class DashboardResponse(BaseModel):
    total_mahasiswa: int = Field(ge=0)
    rata_rata_ipk: float = Field(ge=0, le=4)
    rata_rata_sks: float = Field(ge=0)
    distribusi_ipk: Dict[str, int]

    class Config:
        schema_extra = {
            "example": {
                "total_mahasiswa": 100,
                "rata_rata_ipk": 3.25,
                "rata_rata_sks": 120,
                "distribusi_ipk": {
                    "<2.5": 10,
                    "2.5-2.99": 20,
                    "3.0-3.49": 40,
                    "3.5-4.0": 30
                }
            }
        }

class GridResponse(BaseModel):
    data: List[MahasiswaGridResponse]
    total: int

    class Config:
        schema_extra = {
            "example": {
                "data": [],
                "total": 0
            }
        }

class KlasifikasiGridItem(BaseModel):
    nim: str
    nama: str
    kategori: str
    nilai_fuzzy: float
    ipk_membership: float
    sks_membership: float
    nilai_dk_membership: float
    updated_at: datetime

    class Config:
        orm_mode = True

class KlasifikasiGridResponse(BaseModel):
    data: List[KlasifikasiGridItem]
    total: int

    class Config:
        schema_extra = {
            "example": {
                "data": [],
                "total": 0
            }
        }

class ProgramStudiBase(BaseModel):
    program_studi: str
    jenjang: str

class ProgramStudiCreate(ProgramStudiBase):
    pass

class ProgramStudiUpdate(ProgramStudiBase):
    program_studi: Optional[str] = None
    jenjang: Optional[str] = None

class ProgramStudi(ProgramStudiBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str = 'user'
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None 