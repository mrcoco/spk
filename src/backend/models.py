from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from enum import Enum

class KategoriPeluang(str, Enum):
    TINGGI = "Peluang Lulus Tinggi"
    SEDANG = "Peluang Lulus Sedang"
    KECIL = "Peluang Lulus Kecil"

class Mahasiswa(Base):
    __tablename__ = "mahasiswa"

    nim = Column(String(20), primary_key=True)
    nama = Column(String(100), nullable=False)
    program_studi = Column(String(50), nullable=False)
    ipk = Column(Float, nullable=False, default=0.0)
    sks = Column(Integer, nullable=False, default=0)
    persen_dek = Column(Float, nullable=False, default=0.0)  # Prosentase total nilai D, E, K
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    nilai_list = relationship("Nilai", back_populates="mahasiswa")
    klasifikasi = relationship("KlasifikasiKelulusan", back_populates="mahasiswa", uselist=False)
    saw_results = relationship("SAWResults", back_populates="mahasiswa")
    saw_final_results = relationship("SAWFinalResults", back_populates="mahasiswa")

    def to_dict(self):
        return {
            "nim": self.nim,
            "nama": self.nama,
            "program_studi": self.program_studi,
            "ipk": float(self.ipk),
            "sks": self.sks,
            "persen_dek": float(self.persen_dek),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class Nilai(Base):
    __tablename__ = "nilai"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nim = Column(String(20), ForeignKey('mahasiswa.nim', ondelete='CASCADE'), nullable=False)
    tahun = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    kode_matakuliah = Column(String(20), nullable=False)
    nama_matakuliah = Column(String(100), nullable=False)
    nilai = Column(String(2), nullable=False)  # Changed from String(1) to String(2)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    mahasiswa = relationship("Mahasiswa", back_populates="nilai_list")

    def to_dict(self):
        return {
            "id": self.id,
            "nim": self.nim,
            "tahun": self.tahun,
            "semester": self.semester,
            "kode_matakuliah": self.kode_matakuliah,
            "nama_matakuliah": self.nama_matakuliah,
            "nilai": self.nilai,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class KlasifikasiKelulusan(Base):
    __tablename__ = "klasifikasi_kelulusan"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nim = Column(String(20), ForeignKey('mahasiswa.nim', ondelete='CASCADE'), unique=True, nullable=False)
    kategori = Column(String(50), nullable=False)  # Changed from Enum to String
    nilai_fuzzy = Column(Float, nullable=False)  # Menyimpan nilai fuzzy akhir
    ipk_membership = Column(Float, nullable=False)  # Nilai keanggotaan IPK
    sks_membership = Column(Float, nullable=False)  # Nilai keanggotaan SKS
    nilai_dk_membership = Column(Float, nullable=False)  # Nilai keanggotaan D dan K
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    mahasiswa = relationship("Mahasiswa", back_populates="klasifikasi")

    def to_dict(self):
        return {
            "id": self.id,
            "nim": self.nim,
            "kategori": self.kategori,
            "nilai_fuzzy": float(self.nilai_fuzzy),
            "ipk_membership": float(self.ipk_membership),
            "sks_membership": float(self.sks_membership),
            "nilai_dk_membership": float(self.nilai_dk_membership),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class SAWCriteria(Base):
    __tablename__ = "saw_criteria"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    weight = Column(Float, nullable=False)
    is_cost = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

class SAWResults(Base):
    __tablename__ = "saw_results"

    id = Column(Integer, primary_key=True, index=True)
    nim = Column(String, ForeignKey("mahasiswa.nim", ondelete="CASCADE"), nullable=False)
    nilai_akhir = Column(Float, nullable=False)
    ranking = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    mahasiswa = relationship("Mahasiswa", back_populates="saw_results")

class SAWFinalResults(Base):
    __tablename__ = "saw_final_results"

    id = Column(Integer, primary_key=True, index=True)
    nim = Column(String, ForeignKey("mahasiswa.nim", ondelete="CASCADE"), nullable=False)
    final_score = Column(Float, nullable=False)
    rank = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    mahasiswa = relationship("Mahasiswa", back_populates="saw_final_results") 