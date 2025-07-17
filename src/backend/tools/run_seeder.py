#!/usr/bin/env python3
"""
Script untuk menjalankan seeder data secara terpisah
Digunakan jika ingin menambahkan data sample tanpa menjalankan migration ulang
"""

import sys
import os

# Tambahkan path backend ke sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from seeders import run_all_seeders

if __name__ == "__main__":
    print("🚀 Menjalankan Seeder Data...")
    try:
        run_all_seeders()
        print("\n✅ Seeder berhasil dijalankan!")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1) 