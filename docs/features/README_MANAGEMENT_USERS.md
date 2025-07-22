# 👤 Dokumentasi Fitur Manajemen Users (Pengguna)

## Ringkasan
Fitur manajemen users memungkinkan admin/operator mengelola data pengguna aplikasi SPK secara lengkap melalui antarmuka SPA modern. Fitur ini meliputi CRUD user, search/filter, role, status aktif, dan integrasi penuh frontend-backend-database.

---

## 1. Arsitektur & Flow Data

```mermaid
graph TD
    A[User/Admin di Frontend SPA] -- Search/CRUD --> B[Kendo UI Grid Users]
    B -- AJAX --> C[API /users (FastAPI)]
    C -- ORM --> D[Database PostgreSQL: tabel users]
    C -- Response JSON --> B
    B -- Update UI --> A
```

---

## 2. Fitur Frontend (SPA)
- **Menu Users** di sidebar, section Users di index.html
- **Kendo UI Grid**:
  - Tampil data user (username, email, nama, role, status, tanggal)
  - Fitur search/filter (username, email, nama)
  - Paging, sorting, filter
  - CRUD: tambah, edit, hapus user (popup form)
- **Form User**: username, email, nama lengkap, role, password, status aktif
- **SPA**: Semua operasi tanpa reload, update data real-time

---

## 3. Backend (FastAPI, SQLAlchemy, Pydantic)
- **Model User** (`models.py`):
  - id, username, email, full_name, role, hashed_password, is_active, created_at
- **Schema User** (`schemas.py`):
  - UserBase, UserCreate, UserRead, UserUpdate (Pydantic)
- **Router Users** (`routers/users.py`):
  - Endpoint CRUD: GET /users/, POST /users/, PUT /users/{id}, DELETE /users/{id}
  - Fitur search (query param q)
- **Database**: Tabel `users` otomatis dibuat, integrasi session utama

---

## 4. Tabel Struktur Data User

### Query SQL CREATE TABLE
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'user',
    hashed_password VARCHAR(256) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

| Field           | Tipe         | Keterangan                |
|-----------------|--------------|---------------------------|
| id              | Integer      | Primary key, auto         |
| username        | String       | Unique, required          |
| email           | String       | Unique, required          |
| full_name       | String       | Required                  |
| role            | String       | admin/operator/user       |
| hashed_password | String       | Password hash             |
| is_active       | Boolean      | Status aktif/tidak        |
| created_at      | DateTime     | Tanggal pembuatan         |

---

## 5. Flow Pengelolaan User
1. Admin/operator buka menu Users di frontend
2. Data user ditampilkan di grid (AJAX ke API /users)
3. Search/filter user dengan input pencarian
4. Tambah/edit user melalui popup form (validasi otomatis)
5. Data dikirim ke backend, disimpan di database
6. Hapus user langsung dari grid (konfirmasi)
7. Semua perubahan langsung terupdate di grid

---

## 6. Best Practice & Keamanan
- Password user harus di-hash sebelum disimpan (implementasi hash di backend)
- Role user digunakan untuk kontrol akses fitur
- Validasi input dan error handling di backend & frontend
- Hanya admin/operator yang bisa CRUD user
- Data sensitif (password) tidak pernah dikirim ke frontend

---

## 7. Referensi
- Dokumentasi kode: `src/backend/models.py`, `src/backend/routers/users.py`, `src/backend/schemas.py`, `src/frontend/js/users.js`
- Kendo UI Grid: https://docs.telerik.com/kendo-ui/api/javascript/ui/grid
- FastAPI: https://fastapi.tiangolo.com/

---

## 📅 Tanggal Update: 2025-07-21
## 📝 Kontributor: Tim Backend & Frontend 