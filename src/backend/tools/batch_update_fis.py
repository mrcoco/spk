#!/usr/bin/env python3
"""
Script untuk batch update semua mahasiswa dengan implementasi FIS yang sudah diperbaiki
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import Mahasiswa, KlasifikasiKelulusan
from fuzzy_logic import FuzzyKelulusan
from datetime import datetime

def batch_update_fis():
    """Update semua mahasiswa dengan implementasi FIS yang diperbaiki"""
    print("🔄 Batch Update FIS Implementation")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Ambil semua mahasiswa
        mahasiswa_list = db.query(Mahasiswa).all()
        print(f"📊 Total mahasiswa: {len(mahasiswa_list)}")
        
        # Initialize fuzzy system
        fuzzy_system = FuzzyKelulusan()
        
        # Counter untuk tracking
        updated_count = 0
        created_count = 0
        error_count = 0
        
        for i, mahasiswa in enumerate(mahasiswa_list, 1):
            try:
                # Hitung klasifikasi dengan implementasi yang diperbaiki
                kategori, nilai_fuzzy, ipk_membership, sks_membership, nilai_dk_membership = fuzzy_system.calculate_graduation_chance(
                    mahasiswa.ipk, mahasiswa.sks, mahasiswa.persen_dek
                )
                
                # Cek apakah sudah ada klasifikasi
                existing_klasifikasi = db.query(KlasifikasiKelulusan).filter(
                    KlasifikasiKelulusan.nim == mahasiswa.nim
                ).first()
                
                if existing_klasifikasi:
                    # Update existing
                    existing_klasifikasi.nilai_fuzzy = nilai_fuzzy
                    existing_klasifikasi.kategori = kategori
                    existing_klasifikasi.ipk_membership = ipk_membership
                    existing_klasifikasi.sks_membership = sks_membership
                    existing_klasifikasi.nilai_dk_membership = nilai_dk_membership
                    existing_klasifikasi.updated_at = datetime.utcnow()
                    updated_count += 1
                else:
                    # Create new
                    new_klasifikasi = KlasifikasiKelulusan(
                        nim=mahasiswa.nim,
                        nilai_fuzzy=nilai_fuzzy,
                        kategori=kategori,
                        ipk_membership=ipk_membership,
                        sks_membership=sks_membership,
                        nilai_dk_membership=nilai_dk_membership
                    )
                    db.add(new_klasifikasi)
                    created_count += 1
                
                # Progress indicator
                if i % 100 == 0:
                    print(f"⏳ Progress: {i}/{len(mahasiswa_list)} ({i/len(mahasiswa_list)*100:.1f}%)")
                
            except Exception as e:
                print(f"❌ Error processing NIM {mahasiswa.nim}: {e}")
                error_count += 1
                continue
        
        # Commit semua perubahan
        db.commit()
        
        print(f"\n✅ Batch Update Selesai!")
        print(f"📊 Summary:")
        print(f"  - Total mahasiswa: {len(mahasiswa_list)}")
        print(f"  - Updated: {updated_count}")
        print(f"  - Created: {created_count}")
        print(f"  - Errors: {error_count}")
        print(f"  - Success rate: {((updated_count + created_count) / len(mahasiswa_list)) * 100:.1f}%")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error during batch update: {e}")
        return False
    finally:
        db.close()

def verify_update():
    """Verifikasi hasil update"""
    print("\n🔍 Verifikasi Hasil Update")
    print("=" * 40)
    
    db = SessionLocal()
    try:
        # Cek total klasifikasi
        total_klasifikasi = db.query(KlasifikasiKelulusan).count()
        print(f"Total klasifikasi: {total_klasifikasi}")
        
        # Cek distribusi kategori
        kategori_stats = db.query(KlasifikasiKelulusan.kategori).all()
        kategori_count = {}
        for kategori in kategori_stats:
            kategori_count[kategori[0]] = kategori_count.get(kategori[0], 0) + 1
        
        print(f"\n📊 Distribusi Kategori:")
        for kategori, count in kategori_count.items():
            percentage = (count / total_klasifikasi) * 100
            print(f"  - {kategori}: {count} ({percentage:.1f}%)")
        
        # Cek range nilai fuzzy
        min_fuzzy = db.query(KlasifikasiKelulusan.nilai_fuzzy).order_by(KlasifikasiKelulusan.nilai_fuzzy.asc()).first()
        max_fuzzy = db.query(KlasifikasiKelulusan.nilai_fuzzy).order_by(KlasifikasiKelulusan.nilai_fuzzy.desc()).first()
        
        print(f"\n📈 Range Nilai Fuzzy:")
        print(f"  - Min: {min_fuzzy[0]:.2f}")
        print(f"  - Max: {max_fuzzy[0]:.2f}")
        
        # Test beberapa sample
        print(f"\n🧪 Sample Results:")
        samples = db.query(KlasifikasiKelulusan).limit(5).all()
        for sample in samples:
            mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == sample.nim).first()
            print(f"  - NIM {sample.nim}: IPK={mahasiswa.ipk}, SKS={mahasiswa.sks}, %D/E/K={mahasiswa.persen_dek}")
            print(f"    → Fuzzy: {sample.nilai_fuzzy:.2f}, Kategori: {sample.kategori}")
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")
    finally:
        db.close()

def test_specific_nim(nim):
    """Test implementasi untuk NIM tertentu"""
    print(f"\n🧪 Test Implementasi untuk NIM {nim}")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.nim == nim).first()
        if mahasiswa:
            fuzzy_system = FuzzyKelulusan()
            kategori, nilai_fuzzy, ipk_membership, sks_membership, nilai_dk_membership = fuzzy_system.calculate_graduation_chance(
                mahasiswa.ipk, mahasiswa.sks, mahasiswa.persen_dek
            )
            
            print(f"Data Mahasiswa:")
            print(f"  - NIM: {mahasiswa.nim}")
            print(f"  - Nama: {mahasiswa.nama}")
            print(f"  - IPK: {mahasiswa.ipk}")
            print(f"  - SKS: {mahasiswa.sks}")
            print(f"  - % D/E/K: {mahasiswa.persen_dek}")
            print(f"\nHasil FIS:")
            print(f"  - Nilai Fuzzy: {nilai_fuzzy:.2f}")
            print(f"  - Kategori: {kategori}")
            print(f"  - IPK Membership: {ipk_membership:.2f}")
            print(f"  - SKS Membership: {sks_membership:.2f}")
            print(f"  - Nilai D/E/K Membership: {nilai_dk_membership:.2f}")
        else:
            print(f"❌ Mahasiswa dengan NIM {nim} tidak ditemukan")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 FIS Batch Update Tool")
    print("=" * 80)
    
    # Batch update
    success = batch_update_fis()
    
    if success:
        # Verifikasi hasil
        verify_update()
        
        # Test NIM spesifik
        test_specific_nim('18209241051')
    else:
        print("❌ Batch update gagal, tidak melanjutkan verifikasi") 