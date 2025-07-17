#!/bin/bash

# Script installasi Docker untuk Debian 12 (Bookworm)

echo "🚀 Memulai instalasi Docker..."

# Cek apakah dijalankan sebagai root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Harap jalankan script ini sebagai root"
  exit 1
fi

# Update sistem
echo "🔁 Memperbarui daftar paket..."
apt update -y && apt upgrade -y

# Instal dependensi
echo "📦 Menginstal dependensi..."
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Tambahkan kunci GPG Docker
echo "🔑 Menambahkan kunci GPG Docker..."
curl -fsSL https://download.docker.com/linux/debian/gpg  | gpg --dearmor | tee /usr/share/keyrings/docker-archive-keyring.gpg >/dev/null

# Tambahkan repositori Docker (untuk Debian Bookworm)
echo "📡 Menambahkan repositori Docker untuk Bookworm..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian  \
  bookworm stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update lagi setelah tambah repo
echo "🔁 Update ulang..."
apt update -y

# Instal Docker
echo "🐋 Menginstal Docker..."
apt install -y docker-ce docker-ce-cli containerd.io

# Jalankan Docker dan aktifkan saat boot
echo "⚙️ Mengatur layanan Docker..."
systemctl start docker
systemctl enable docker

# Instal Docker Compose via APT
echo "🧩 Menginstal Docker Compose via APT..."
apt install -y docker-compose

# Verifikasi instalasi
echo "🔍 Memverifikasi instalasi..."
docker --version
docker-compose --version

# Tambahkan user saat ini ke grup docker
read -p "Masukkan username Anda: " username
usermod -aG docker $username

echo ""
echo "✅ Instalasi Docker selesai!"
echo "📌 Silakan logout dan login kembali agar grup 'docker' aktif."
echo "🧪 Uji dengan perintah: docker run hello-world"