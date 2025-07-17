#!/usr/bin/env python3
"""
Script untuk restore database dari file backup SQL
Menggunakan file backup-public.sql untuk mengembalikan data ke database
"""

import os
import sys
import subprocess
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import argparse
from datetime import datetime

# Import konfigurasi database
try:
    from config import DATABASE_URL
except ImportError:
    print("❌ Error: Tidak dapat mengimpor DATABASE_URL dari config.py")
    print("💡 Pastikan file config.py ada dan berisi DATABASE_URL")
    sys.exit(1)

def get_db_config():
    """Mengekstrak konfigurasi database dari DATABASE_URL"""
    if not DATABASE_URL:
        print("❌ Error: DATABASE_URL tidak terdefinisi")
        sys.exit(1)
    
    try:
        # Format: postgresql://username:password@host:port/database
        url = DATABASE_URL.replace('postgresql://', '')
        auth, rest = url.split('@')
        username, password = auth.split(':')
        host_port, database = rest.split('/')
        host, port = host_port.split(':')
        
        return {
            'host': host,
            'port': port,
            'database': database,
            'user': username,
            'password': password
        }
    except Exception as e:
        print(f"❌ Error saat parsing DATABASE_URL: {e}")
        print("💡 Format yang diharapkan: postgresql://username:password@host:port/database")
        sys.exit(1)

def check_database_exists(db_config):
    """Memeriksa apakah database sudah ada"""
    try:
        # Koneksi ke database postgres default
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            database='postgres',
            user=db_config['user'],
            password=db_config['password']
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Cek apakah database target ada
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_config['database'],))
        exists = cursor.fetchone() is not None
        
        cursor.close()
        conn.close()
        
        return exists
    except Exception as e:
        print(f"❌ Error saat memeriksa database: {e}")
        return False

def create_database(db_config):
    """Membuat database jika belum ada"""
    try:
        # Koneksi ke database postgres default
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            database='postgres',
            user=db_config['user'],
            password=db_config['password']
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Buat database
        cursor.execute(f"CREATE DATABASE {db_config['database']}")
        print(f"✅ Database {db_config['database']} berhasil dibuat")
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error saat membuat database: {e}")
        return False

def drop_database(db_config):
    """Menghapus database yang ada"""
    try:
        # Koneksi ke database postgres default
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            database='postgres',
            user=db_config['user'],
            password=db_config['password']
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Drop database
        cursor.execute(f"DROP DATABASE IF EXISTS {db_config['database']}")
        print(f"🗑️  Database {db_config['database']} berhasil dihapus")
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error saat menghapus database: {e}")
        return False

def restore_database(db_config, backup_file, force=False):
    """Restore database dari file backup"""
    try:
        # Periksa apakah file backup ada
        if not os.path.exists(backup_file):
            print(f"❌ File backup tidak ditemukan: {backup_file}")
            return False
        
        print(f"📁 File backup: {backup_file}")
        print(f"🗄️  Database target: {db_config['database']}")
        print(f"👤 User: {db_config['user']}")
        print(f"🌐 Host: {db_config['host']}:{db_config['port']}")
        
        # Konfirmasi restore
        if not force:
            response = input("\n⚠️  Apakah Anda yakin ingin melakukan restore? (y/N): ")
            if response.lower() != 'y':
                print("❌ Restore dibatalkan")
                return False
        
        print("\n🔄 Memulai proses restore...")
        start_time = datetime.now()
        
        # Command untuk restore menggunakan psql
        cmd = [
            'psql',
            '-h', db_config['host'],
            '-p', db_config['port'],
            '-U', db_config['user'],
            '-d', db_config['database'],
            '-f', backup_file
        ]
        
        # Set environment variable untuk password
        env = os.environ.copy()
        env['PGPASSWORD'] = db_config['password']
        
        # Jalankan command restore
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True
        )
        
        end_time = datetime.now()
        duration = end_time - start_time
        
        if result.returncode == 0:
            print(f"✅ Restore berhasil selesai dalam {duration.total_seconds():.2f} detik")
            print("📊 Data telah berhasil dipulihkan dari backup")
            return True
        else:
            print(f"❌ Restore gagal dengan error:")
            print(f"STDOUT: {result.stdout}")
            print(f"STDERR: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error saat restore: {e}")
        return False

def verify_restore(db_config):
    """Memverifikasi hasil restore"""
    try:
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            database=db_config['database'],
            user=db_config['user'],
            password=db_config['password']
        )
        cursor = conn.cursor()
        
        # Cek tabel-tabel utama
        tables_to_check = ['mahasiswa', 'nilai', 'saw_criteria', 'saw_results', 'saw_final_results']
        
        print("\n🔍 Verifikasi hasil restore:")
        print("-" * 50)
        
        for table in tables_to_check:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            result = cursor.fetchone()
            count = result[0] if result else 0
            print(f"📋 {table}: {count} records")
        
        # Cek data mahasiswa
        cursor.execute("SELECT COUNT(*) FROM mahasiswa")
        mahasiswa_result = cursor.fetchone()
        mahasiswa_count = mahasiswa_result[0] if mahasiswa_result else 0
        
        cursor.execute("SELECT COUNT(*) FROM nilai")
        nilai_result = cursor.fetchone()
        nilai_count = nilai_result[0] if nilai_result else 0
        
        cursor.close()
        conn.close()
        
        print("-" * 50)
        print(f"✅ Verifikasi selesai: {mahasiswa_count} mahasiswa, {nilai_count} nilai")
        
        return True
        
    except Exception as e:
        print(f"❌ Error saat verifikasi: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Restore database dari file backup SQL')
    parser.add_argument('--backup-file', '-f', 
                       default='backup-public.sql',
                       help='Path ke file backup SQL (default: backup-public.sql)')
    parser.add_argument('--force', '-y', 
                       action='store_true',
                       help='Langsung restore tanpa konfirmasi')
    parser.add_argument('--drop-first', '-d',
                       action='store_true',
                       help='Hapus database terlebih dahulu sebelum restore')
    parser.add_argument('--verify', '-v',
                       action='store_true',
                       help='Verifikasi hasil restore')
    
    args = parser.parse_args()
    
    print("🔄 Database Restore Tool")
    print("=" * 50)
    
    # Dapatkan konfigurasi database
    try:
        db_config = get_db_config()
    except Exception as e:
        print(f"❌ Error saat membaca konfigurasi database: {e}")
        sys.exit(1)
    
    # Cek apakah database ada
    db_exists = check_database_exists(db_config)
    
    if db_exists:
        print(f"📊 Database {db_config['database']} sudah ada")
        
        if args.drop_first:
            if not args.force:
                response = input(f"⚠️  Hapus database {db_config['database']} terlebih dahulu? (y/N): ")
                if response.lower() != 'y':
                    print("❌ Operasi dibatalkan")
                    sys.exit(0)
            
            if not drop_database(db_config):
                print("❌ Gagal menghapus database")
                sys.exit(1)
            
            if not create_database(db_config):
                print("❌ Gagal membuat database baru")
                sys.exit(1)
        else:
            print("💡 Gunakan --drop-first untuk menghapus database terlebih dahulu")
    else:
        print(f"📊 Database {db_config['database']} belum ada, akan dibuat")
        if not create_database(db_config):
            print("❌ Gagal membuat database")
            sys.exit(1)
    
    # Lakukan restore
    if not restore_database(db_config, args.backup_file, args.force):
        print("❌ Restore gagal")
        sys.exit(1)
    
    # Verifikasi jika diminta
    if args.verify:
        if not verify_restore(db_config):
            print("❌ Verifikasi gagal")
            sys.exit(1)
    
    print("\n🎉 Restore database selesai!")
    print("💡 Tips: Gunakan 'python run_seeder.py' untuk menjalankan seeder jika diperlukan")

if __name__ == "__main__":
    main() 