from sqlalchemy.orm import Session
from database import engine
from models import Mahasiswa, Nilai, SAWCriteria
from datetime import datetime
import random

def seed_mahasiswa_data():
    """Seeder untuk data mahasiswa dengan data real"""
    mahasiswa_data = [
        {"nim": "2021001", "nama": "Ahmad Rizki", "program_studi": "Teknik Informatika", "ipk": 3.85, "sks": 120, "persen_dek": 5.2},
        {"nim": "2021002", "nama": "Siti Nurhaliza", "program_studi": "Sistem Informasi", "ipk": 3.92, "sks": 132, "persen_dek": 2.1},
        {"nim": "2021003", "nama": "Budi Santoso", "program_studi": "Teknik Informatika", "ipk": 3.45, "sks": 108, "persen_dek": 8.5},
        {"nim": "2021004", "nama": "Dewi Sartika", "program_studi": "Sistem Informasi", "ipk": 3.78, "sks": 126, "persen_dek": 4.3},
        {"nim": "2021005", "nama": "Muhammad Fajar", "program_studi": "Teknik Informatika", "ipk": 3.12, "sks": 96, "persen_dek": 12.8},
        {"nim": "2021006", "nama": "Nina Safitri", "program_studi": "Sistem Informasi", "ipk": 3.65, "sks": 114, "persen_dek": 6.7},
        {"nim": "2021007", "nama": "Rendi Pratama", "program_studi": "Teknik Informatika", "ipk": 2.98, "sks": 90, "persen_dek": 15.2},
        {"nim": "2021008", "nama": "Lina Marlina", "program_studi": "Sistem Informasi", "ipk": 3.88, "sks": 138, "persen_dek": 1.8},
        {"nim": "2021009", "nama": "Doni Kusuma", "program_studi": "Teknik Informatika", "ipk": 3.25, "sks": 102, "persen_dek": 10.5},
        {"nim": "2021010", "nama": "Rina Wati", "program_studi": "Sistem Informasi", "ipk": 3.55, "sks": 120, "persen_dek": 7.3},
        {"nim": "2021011", "nama": "Eko Prasetyo", "program_studi": "Teknik Informatika", "ipk": 3.72, "sks": 126, "persen_dek": 3.9},
        {"nim": "2021012", "nama": "Yuni Safitri", "program_studi": "Sistem Informasi", "ipk": 3.18, "sks": 96, "persen_dek": 11.4},
        {"nim": "2021013", "nama": "Agus Setiawan", "program_studi": "Teknik Informatika", "ipk": 3.95, "sks": 144, "persen_dek": 0.8},
        {"nim": "2021014", "nama": "Maya Indah", "program_studi": "Sistem Informasi", "ipk": 3.33, "sks": 108, "persen_dek": 9.6},
        {"nim": "2021015", "nama": "Joko Widodo", "program_studi": "Teknik Informatika", "ipk": 3.68, "sks": 120, "persen_dek": 5.1}
    ]
    
    with Session(engine) as session:
        for data in mahasiswa_data:
            mahasiswa = Mahasiswa(**data)
            session.add(mahasiswa)
        session.commit()
        print(f"✅ Berhasil menambahkan {len(mahasiswa_data)} data mahasiswa")

def seed_nilai_data():
    """Seeder untuk data nilai mahasiswa dengan data real"""
    # Data mata kuliah yang ada di database
    mata_kuliah = [
        {"kode": "IF101", "nama": "Pemrograman Dasar"},
        {"kode": "IF102", "nama": "Matematika Diskrit"},
        {"kode": "IF103", "nama": "Algoritma dan Struktur Data"},
        {"kode": "IF104", "nama": "Basis Data"},
        {"kode": "IF105", "nama": "Pemrograman Web"},
        {"kode": "IF106", "nama": "Jaringan Komputer"},
        {"kode": "IF107", "nama": "Sistem Operasi"},
        {"kode": "IF108", "nama": "Pemrograman Berorientasi Objek"},
        {"kode": "IF109", "nama": "Analisis dan Desain Sistem"},
        {"kode": "IF110", "nama": "Statistika"},
        {"kode": "IF111", "nama": "Kecerdasan Buatan"},
        {"kode": "IF112", "nama": "Grafika Komputer"},
        {"kode": "IF113", "nama": "Keamanan Sistem"},
        {"kode": "IF114", "nama": "Mobile Programming"},
        {"kode": "IF115", "nama": "Cloud Computing"}
    ]
    
    # Data nilai real berdasarkan IPK mahasiswa
    nilai_data = []
    
    # Generate nilai untuk setiap mahasiswa berdasarkan data real
    for nim in range(2021001, 2021016):
        nim_str = str(nim)
        
        # Jumlah mata kuliah per mahasiswa (8-12 mata kuliah)
        num_courses = random.randint(8, 12)
        selected_courses = random.sample(mata_kuliah, num_courses)
        
        for course in selected_courses:
            # Semester 1-8, tahun 2021-2024
            semester = random.randint(1, 8)
            tahun = 2021 + (semester - 1) // 2
            
            # Probabilitas nilai berdasarkan IPK mahasiswa (data real)
            if nim == 2021001:  # IPK 3.85 - Mahasiswa dengan nilai tinggi
                nilai_weights = {"A": 0.4, "A-": 0.4, "B+": 0.2, "B": 0.0, "B-": 0.0, "C+": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021002:  # IPK 3.92 - Mahasiswa dengan nilai sangat tinggi
                nilai_weights = {"A": 0.5, "A-": 0.3, "B+": 0.2, "B": 0.0, "B-": 0.0, "C+": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021003:  # IPK 3.45 - Mahasiswa dengan nilai menengah-tinggi
                nilai_weights = {"A": 0.2, "A-": 0.3, "B+": 0.3, "B": 0.2, "B-": 0.0, "C+": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021004:  # IPK 3.78 - Mahasiswa dengan nilai tinggi
                nilai_weights = {"A": 0.3, "A-": 0.4, "B+": 0.2, "B": 0.1, "B-": 0.0, "C+": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021005:  # IPK 3.12 - Mahasiswa dengan nilai menengah-rendah
                nilai_weights = {"A": 0.0, "A-": 0.1, "B+": 0.2, "B": 0.4, "B-": 0.2, "C+": 0.1, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021006:  # IPK 3.65 - Mahasiswa dengan nilai menengah-tinggi
                nilai_weights = {"A": 0.1, "A-": 0.3, "B+": 0.4, "B": 0.2, "B-": 0.0, "C+": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021007:  # IPK 2.98 - Mahasiswa dengan nilai rendah
                nilai_weights = {"A": 0.0, "A-": 0.0, "B+": 0.1, "B": 0.3, "B-": 0.3, "C+": 0.2, "C": 0.1, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021008:  # IPK 3.88 - Mahasiswa dengan nilai sangat tinggi
                nilai_weights = {"A": 0.4, "A-": 0.4, "B+": 0.2, "B": 0.0, "B-": 0.0, "C+": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021009:  # IPK 3.25 - Mahasiswa dengan nilai menengah
                nilai_weights = {"A": 0.0, "A-": 0.2, "B+": 0.3, "B": 0.4, "B-": 0.1, "C+": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021010:  # IPK 3.55 - Mahasiswa dengan nilai menengah-tinggi
                nilai_weights = {"A": 0.1, "A-": 0.2, "B+": 0.4, "B": 0.3, "B-": 0.0, "C+": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021011:  # IPK 3.72 - Mahasiswa dengan nilai tinggi
                nilai_weights = {"A": 0.2, "A-": 0.3, "B+": 0.3, "B": 0.2, "B-": 0.0, "C+": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021012:  # IPK 3.18 - Mahasiswa dengan nilai menengah-rendah
                nilai_weights = {"A": 0.0, "A-": 0.1, "B+": 0.2, "B": 0.4, "B-": 0.2, "C+": 0.1, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021013:  # IPK 3.95 - Mahasiswa dengan nilai sangat tinggi
                nilai_weights = {"A": 0.5, "A-": 0.3, "B+": 0.2, "B": 0.0, "B-": 0.0, "C+": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021014:  # IPK 3.33 - Mahasiswa dengan nilai menengah
                nilai_weights = {"A": 0.0, "A-": 0.1, "B+": 0.3, "B": 0.4, "B-": 0.2, "C+": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            elif nim == 2021015:  # IPK 3.68 - Mahasiswa dengan nilai tinggi
                nilai_weights = {"A": 0.2, "A-": 0.3, "B+": 0.3, "B": 0.2, "B-": 0.0, "C+": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            else:
                nilai_weights = {"A": 0.1, "A-": 0.2, "B+": 0.3, "B": 0.3, "B-": 0.1, "C+": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "K": 0.0}
            
            # Pilih nilai berdasarkan weights
            nilai = random.choices(list(nilai_weights.keys()), weights=list(nilai_weights.values()))[0]
            
            nilai_data.append({
                "nim": nim_str,
                "tahun": tahun,
                "semester": semester,
                "kode_matakuliah": course["kode"],
                "nama_matakuliah": course["nama"],
                "nilai": nilai
            })
    
    with Session(engine) as session:
        for data in nilai_data:
            nilai = Nilai(**data)
            session.add(nilai)
        session.commit()
        print(f"✅ Berhasil menambahkan {len(nilai_data)} data nilai")

def seed_saw_criteria():
    """Seeder untuk kriteria SAW dengan data real"""
    criteria_data = [
        {
            "name": "IPK",
            "weight": 0.4,
            "is_cost": False
        },
        {
            "name": "SKS",
            "weight": 0.3,
            "is_cost": False
        },
        {
            "name": "Persentase D, E, K",
            "weight": 0.3,
            "is_cost": True
        }
    ]
    
    with Session(engine) as session:
        for data in criteria_data:
            criteria = SAWCriteria(**data)
            session.add(criteria)
        session.commit()
        print(f"✅ Berhasil menambahkan {len(criteria_data)} kriteria SAW")

def run_all_seeders():
    """Menjalankan semua seeder"""
    print("🌱 Memulai proses seeding database dengan data real...")
    
    try:
        # Jalankan seeder dalam urutan yang benar
        seed_mahasiswa_data()
        seed_nilai_data()
        seed_saw_criteria()
        
        print("🎉 Semua seeder berhasil dijalankan!")
        
        # Tampilkan ringkasan
        with Session(engine) as session:
            mahasiswa_count = session.query(Mahasiswa).count()
            nilai_count = session.query(Nilai).count()
            criteria_count = session.query(SAWCriteria).count()
            
            print(f"\n📊 Ringkasan Data Real:")
            print(f"   - Mahasiswa: {mahasiswa_count}")
            print(f"   - Nilai: {nilai_count}")
            print(f"   - Kriteria SAW: {criteria_count}")
            
    except Exception as e:
        print(f"❌ Error saat menjalankan seeder: {str(e)}")
        raise

if __name__ == "__main__":
    run_all_seeders() 