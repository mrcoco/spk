# 🧑‍💻 USER GUIDE - SPK Monitoring Masa Studi

Panduan lengkap penggunaan aplikasi SPK Monitoring Masa Studi untuk semua pengguna (mahasiswa, dosen, admin, operator).

---

## 1. 📖 Pendahuluan
Aplikasi ini membantu memonitor masa studi mahasiswa, melakukan evaluasi kelulusan, dan memberikan rekomendasi berbasis metode SAW & FIS.

**Fitur Utama:**
- Input & manajemen data mahasiswa
- Evaluasi kelulusan otomatis (SAW & FIS)
- Visualisasi hasil & confusion matrix
- Rekomendasi & ringkasan performa
- Navigasi mudah, responsif, dan modern

---

## 2. 🚪 Cara Akses & Login
1. Buka aplikasi melalui browser: `http://localhost` atau domain yang diberikan admin.
2. Login menggunakan akun yang sudah didaftarkan (jika ada fitur login).
3. Jika belum punya akun, hubungi admin/operator untuk pendaftaran.

---

## 3. 🗺️ Navigasi Menu Utama
- **Dashboard**: Ringkasan statistik & status aplikasi.
- **Data Mahasiswa**: Lihat, tambah, edit, hapus data mahasiswa.
- **Data Nilai**: Kelola nilai mahasiswa.
- **Program Studi**: Manajemen program studi.
- **Evaluasi SAW/FIS**: Lakukan evaluasi kelulusan otomatis.
- **Perbandingan**: Bandingkan hasil evaluasi antar metode.

> Navigasi menggunakan sidebar kiri. Klik menu untuk berpindah halaman.

---

## 4. 📝 Input Data Mahasiswa & Nilai
### A. Tambah Mahasiswa
1. Masuk ke menu **Data Mahasiswa**.
2. Klik tombol **Tambah** (`+` atau "Tambah Mahasiswa").
3. Isi form: NIM, Nama, Prodi, Angkatan, dst.
4. Klik **Simpan**.

### B. Edit/Hapus Mahasiswa
- Klik ikon **Edit** (pensil) untuk mengubah data.
- Klik ikon **Hapus** (tempat sampah) untuk menghapus data.

### C. Input/Edit Nilai
1. Masuk ke menu **Data Nilai**.
2. Pilih mahasiswa, klik **Input/Edit Nilai**.
3. Isi nilai IPK, SKS, dan parameter lain sesuai kebutuhan.
4. Klik **Simpan**.

---

## 5. 📊 Panduan Evaluasi SAW & FIS
### A. Evaluasi SAW
1. Masuk ke menu **Evaluasi SAW**.
2. Klik tombol **Mulai Evaluasi**.
3. Sistem akan memproses data dan menampilkan hasil evaluasi, confusion matrix, dan ringkasan performa.

### B. Evaluasi FIS
1. Masuk ke menu **Evaluasi FIS**.
2. Klik **Mulai Evaluasi**.
3. Hasil evaluasi, confusion matrix, dan narasi analisis akan muncul.

> **Tips:**
> - Pastikan data mahasiswa & nilai sudah lengkap sebelum evaluasi.
> - Gunakan fitur refresh jika hasil tidak muncul.

---

## 6. 🧩 Interpretasi Hasil Evaluasi
- **Confusion Matrix**: Tabel perbandingan prediksi vs realita.
- **Akurasi, Precision, Recall, F1-Score**: Metrik performa model.
- **Ringkasan Performa**: Narasi otomatis tentang kekuatan & kelemahan model.
- **Rekomendasi**: Saran perbaikan berdasarkan hasil evaluasi.

### Contoh Tampilan:
```markdown
|            | Prediksi Lulus | Prediksi Tidak Lulus |
|------------|----------------|---------------------|
| Lulus      |      120       |         10          |
| Tidak Lulus|      15        |         55          |
```

> **Interpretasi:**
> - Angka diagonal = prediksi benar.
> - Angka non-diagonal = prediksi salah.

---

## 7. 💡 Rekomendasi & Ringkasan
- Baca bagian **Rekomendasi** untuk saran perbaikan.
- Ringkasan performa membantu memahami hasil secara cepat.
- Ikuti rekomendasi untuk meningkatkan akurasi model.

---

## 8. 🛠️ Troubleshooting Umum
- **Data tidak muncul?**: Cek koneksi, refresh halaman, pastikan data sudah diinput.
- **Evaluasi gagal?**: Pastikan semua data wajib sudah terisi.
- **Tampilan tidak sesuai?**: Lakukan hard refresh (`Ctrl+Shift+R`/`Cmd+Shift+R`).
- **Error lain?**: Hubungi admin/operator.

---

## 9. ❓ FAQ & Kontak Bantuan
- **Bagaimana cara reset password?**: Hubungi admin/operator.
- **Bagaimana menambah prodi baru?**: Gunakan menu Program Studi.
- **Siapa yang bisa akses evaluasi?**: Semua user yang punya hak akses.
- **Kontak bantuan**: [email admin] / [nomor WA admin]

---

**Panduan ini terakhir diperbarui: 2025-07-21** 