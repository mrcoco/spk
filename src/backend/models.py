from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Index, JSON, Text
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

    # Indexes for performance optimization
    __table_args__ = (
        Index('idx_mahasiswa_ipk', 'ipk'),
        Index('idx_mahasiswa_sks', 'sks'),
        Index('idx_mahasiswa_persen_dek', 'persen_dek'),
        Index('idx_mahasiswa_nama', 'nama'),
    )

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

    # Indexes for performance optimization
    __table_args__ = (
        Index('idx_saw_results_nim', 'nim'),
        Index('idx_saw_results_ranking', 'ranking'),
        Index('idx_saw_results_nilai_akhir', 'nilai_akhir'),
    )

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

    # Indexes for performance optimization
    __table_args__ = (
        Index('idx_saw_final_results_nim', 'nim'),
        Index('idx_saw_final_results_rank', 'rank'),
        Index('idx_saw_final_results_final_score', 'final_score'),
    )

class FISEvaluation(Base):
    __tablename__ = "fis_evaluation"

    id = Column(Integer, primary_key=True, autoincrement=True)
    evaluation_name = Column(String(100), nullable=False)
    test_size = Column(Float, nullable=False)
    random_state = Column(Integer, nullable=False)
    
    # Metrics
    accuracy = Column(Float, nullable=False)
    precision_macro = Column(Float, nullable=False)
    recall_macro = Column(Float, nullable=False)
    f1_macro = Column(Float, nullable=False)
    
    # Per-class metrics (stored as JSON)
    precision_per_class = Column(JSON, nullable=False)
    recall_per_class = Column(JSON, nullable=False)
    f1_per_class = Column(JSON, nullable=False)
    
    # Confusion matrix (stored as JSON)
    confusion_matrix = Column(JSON, nullable=False)
    
    # Summary
    total_data = Column(Integer, nullable=False)
    training_data = Column(Integer, nullable=False)
    test_data = Column(Integer, nullable=False)
    execution_time = Column(Float, nullable=False)
    
    # Additional metadata
    kategori_mapping = Column(JSON, nullable=False)
    evaluation_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Indexes for performance optimization
    __table_args__ = (
        Index('idx_fis_evaluation_created_at', 'created_at'),
        Index('idx_fis_evaluation_accuracy', 'accuracy'),
        Index('idx_fis_evaluation_test_size', 'test_size'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "evaluation_name": self.evaluation_name,
            "test_size": float(self.test_size),
            "random_state": self.random_state,
            "metrics": {
                "accuracy": float(self.accuracy),
                "precision_macro": float(self.precision_macro),
                "recall_macro": float(self.recall_macro),
                "f1_macro": float(self.f1_macro),
                "precision": self.precision_per_class,
                "recall": self.recall_per_class,
                "f1": self.f1_per_class
            },
            "confusion_matrix": self.confusion_matrix,
            "summary": {
                "total_data": self.total_data,
                "training_data": self.training_data,
                "test_data": self.test_data,
                "execution_time": float(self.execution_time)
            },
            "kategori_mapping": self.kategori_mapping,
            "evaluation_notes": self.evaluation_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        } 

class ProgramStudi(Base):
    __tablename__ = "program_studi"
    
    id = Column(Integer, primary_key=True, index=True)
    program_studi = Column(String, nullable=False)
    jenjang = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 