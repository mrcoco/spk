/*
 Navicat Premium Data Transfer

 Source Server         : spk
 Source Server Type    : PostgreSQL
 Source Server Version : 130021 (130021)
 Source Host           : localhost:5432
 Source Catalog        : spk_db
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 130021 (130021)
 File Encoding         : 65001

 Date: 17/07/2025 13:07:09
*/


-- ----------------------------
-- Sequence structure for klasifikasi_kelulusan_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."klasifikasi_kelulusan_id_seq";
CREATE SEQUENCE "public"."klasifikasi_kelulusan_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;
ALTER SEQUENCE "public"."klasifikasi_kelulusan_id_seq" OWNER TO "spk_user";

-- ----------------------------
-- Sequence structure for nilai_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."nilai_id_seq";
CREATE SEQUENCE "public"."nilai_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;
ALTER SEQUENCE "public"."nilai_id_seq" OWNER TO "spk_user";

-- ----------------------------
-- Sequence structure for saw_criteria_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."saw_criteria_id_seq";
CREATE SEQUENCE "public"."saw_criteria_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;
ALTER SEQUENCE "public"."saw_criteria_id_seq" OWNER TO "spk_user";

-- ----------------------------
-- Sequence structure for saw_final_results_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."saw_final_results_id_seq";
CREATE SEQUENCE "public"."saw_final_results_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;
ALTER SEQUENCE "public"."saw_final_results_id_seq" OWNER TO "spk_user";

-- ----------------------------
-- Sequence structure for saw_results_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."saw_results_id_seq";
CREATE SEQUENCE "public"."saw_results_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;
ALTER SEQUENCE "public"."saw_results_id_seq" OWNER TO "spk_user";

-- ----------------------------
-- Table structure for alembic_version
-- ----------------------------
DROP TABLE IF EXISTS "public"."alembic_version";
CREATE TABLE "public"."alembic_version" (
  "version_num" varchar(32) COLLATE "pg_catalog"."default" NOT NULL
)
;
ALTER TABLE "public"."alembic_version" OWNER TO "spk_user";

-- ----------------------------
-- Records of alembic_version
-- ----------------------------
BEGIN;
INSERT INTO "public"."alembic_version" ("version_num") VALUES ('d6825691d7a1');
COMMIT;

-- ----------------------------
-- Table structure for klasifikasi_kelulusan
-- ----------------------------
DROP TABLE IF EXISTS "public"."klasifikasi_kelulusan";
CREATE TABLE "public"."klasifikasi_kelulusan" (
  "id" int4 NOT NULL DEFAULT nextval('klasifikasi_kelulusan_id_seq'::regclass),
  "nim" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "kategori" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "nilai_fuzzy" float8 NOT NULL,
  "ipk_membership" float8 NOT NULL,
  "sks_membership" float8 NOT NULL,
  "nilai_dk_membership" float8 NOT NULL,
  "created_at" timestamp(6),
  "updated_at" timestamp(6)
)
;
ALTER TABLE "public"."klasifikasi_kelulusan" OWNER TO "spk_user";

-- ----------------------------
-- Records of klasifikasi_kelulusan
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for mahasiswa
-- ----------------------------
DROP TABLE IF EXISTS "public"."mahasiswa";
CREATE TABLE "public"."mahasiswa" (
  "nim" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "nama" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "program_studi" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "ipk" float8 NOT NULL,
  "sks" int4 NOT NULL,
  "persen_dek" float8 NOT NULL,
  "created_at" timestamp(6),
  "updated_at" timestamp(6)
)
;
ALTER TABLE "public"."mahasiswa" OWNER TO "spk_user";

-- ----------------------------
-- Records of mahasiswa
-- ----------------------------
BEGIN;
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021001', 'Ahmad Rizki', 'Teknik Informatika', 3.85, 120, 5.2, '2025-07-17 05:52:04.262975', '2025-07-17 05:52:04.262977');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021002', 'Siti Nurhaliza', 'Sistem Informasi', 3.92, 132, 2.1, '2025-07-17 05:52:04.263428', '2025-07-17 05:52:04.263428');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021003', 'Budi Santoso', 'Teknik Informatika', 3.45, 108, 8.5, '2025-07-17 05:52:04.263598', '2025-07-17 05:52:04.263598');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021004', 'Dewi Sartika', 'Sistem Informasi', 3.78, 126, 4.3, '2025-07-17 05:52:04.263674', '2025-07-17 05:52:04.263674');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021005', 'Muhammad Fajar', 'Teknik Informatika', 3.12, 96, 12.8, '2025-07-17 05:52:04.263749', '2025-07-17 05:52:04.26375');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021006', 'Nina Safitri', 'Sistem Informasi', 3.65, 114, 6.7, '2025-07-17 05:52:04.263827', '2025-07-17 05:52:04.263828');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021007', 'Rendi Pratama', 'Teknik Informatika', 2.98, 90, 15.2, '2025-07-17 05:52:04.263906', '2025-07-17 05:52:04.263906');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021008', 'Lina Marlina', 'Sistem Informasi', 3.88, 138, 1.8, '2025-07-17 05:52:04.263968', '2025-07-17 05:52:04.263968');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021009', 'Doni Kusuma', 'Teknik Informatika', 3.25, 102, 10.5, '2025-07-17 05:52:04.26403', '2025-07-17 05:52:04.26403');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021010', 'Rina Wati', 'Sistem Informasi', 3.55, 120, 7.3, '2025-07-17 05:52:04.26409', '2025-07-17 05:52:04.26409');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021011', 'Eko Prasetyo', 'Teknik Informatika', 3.72, 126, 3.9, '2025-07-17 05:52:04.264153', '2025-07-17 05:52:04.264153');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021012', 'Yuni Safitri', 'Sistem Informasi', 3.18, 96, 11.4, '2025-07-17 05:52:04.264213', '2025-07-17 05:52:04.264213');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021013', 'Agus Setiawan', 'Teknik Informatika', 3.95, 144, 0.8, '2025-07-17 05:52:04.26428', '2025-07-17 05:52:04.26428');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021014', 'Maya Indah', 'Sistem Informasi', 3.33, 108, 9.6, '2025-07-17 05:52:04.26434', '2025-07-17 05:52:04.26434');
INSERT INTO "public"."mahasiswa" ("nim", "nama", "program_studi", "ipk", "sks", "persen_dek", "created_at", "updated_at") VALUES ('2021015', 'Joko Widodo', 'Teknik Informatika', 3.68, 120, 5.1, '2025-07-17 05:52:04.264402', '2025-07-17 05:52:04.264402');
COMMIT;

-- ----------------------------
-- Table structure for nilai
-- ----------------------------
DROP TABLE IF EXISTS "public"."nilai";
CREATE TABLE "public"."nilai" (
  "id" int4 NOT NULL DEFAULT nextval('nilai_id_seq'::regclass),
  "nim" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "tahun" int4 NOT NULL,
  "semester" int4 NOT NULL,
  "kode_matakuliah" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "nama_matakuliah" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "nilai" varchar(2) COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(6),
  "updated_at" timestamp(6)
)
;
ALTER TABLE "public"."nilai" OWNER TO "spk_user";

-- ----------------------------
-- Records of nilai
-- ----------------------------
BEGIN;
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (1, '2021001', 2024, 7, 'IF106', 'Jaringan Komputer', 'A-', '2025-07-17 05:52:04.2649', '2025-07-17 05:52:04.2649');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (2, '2021001', 2024, 7, 'IF113', 'Keamanan Sistem', 'B+', '2025-07-17 05:52:04.265625', '2025-07-17 05:52:04.265625');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (3, '2021001', 2023, 6, 'IF108', 'Pemrograman Berorientasi Objek', 'B+', '2025-07-17 05:52:04.265735', '2025-07-17 05:52:04.265736');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (4, '2021001', 2023, 5, 'IF103', 'Algoritma dan Struktur Data', 'A-', '2025-07-17 05:52:04.265829', '2025-07-17 05:52:04.265829');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (5, '2021001', 2024, 7, 'IF109', 'Analisis dan Desain Sistem', 'A-', '2025-07-17 05:52:04.26592', '2025-07-17 05:52:04.26592');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (6, '2021001', 2022, 4, 'IF114', 'Mobile Programming', 'A', '2025-07-17 05:52:04.266008', '2025-07-17 05:52:04.266009');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (7, '2021001', 2024, 8, 'IF105', 'Pemrograman Web', 'A', '2025-07-17 05:52:04.266103', '2025-07-17 05:52:04.266103');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (8, '2021001', 2023, 6, 'IF115', 'Cloud Computing', 'B', '2025-07-17 05:52:04.266184', '2025-07-17 05:52:04.266185');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (9, '2021001', 2021, 2, 'IF104', 'Basis Data', 'A-', '2025-07-17 05:52:04.266262', '2025-07-17 05:52:04.266262');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (10, '2021001', 2021, 2, 'IF110', 'Statistika', 'A-', '2025-07-17 05:52:04.266333', '2025-07-17 05:52:04.266333');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (11, '2021002', 2022, 4, 'IF113', 'Keamanan Sistem', 'B+', '2025-07-17 05:52:04.266408', '2025-07-17 05:52:04.266408');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (12, '2021002', 2021, 2, 'IF112', 'Grafika Komputer', 'A', '2025-07-17 05:52:04.266477', '2025-07-17 05:52:04.266477');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (13, '2021002', 2023, 5, 'IF107', 'Sistem Operasi', 'A-', '2025-07-17 05:52:04.266547', '2025-07-17 05:52:04.266547');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (14, '2021002', 2022, 3, 'IF105', 'Pemrograman Web', 'B+', '2025-07-17 05:52:04.266617', '2025-07-17 05:52:04.266618');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (15, '2021002', 2023, 6, 'IF111', 'Kecerdasan Buatan', 'B+', '2025-07-17 05:52:04.266687', '2025-07-17 05:52:04.266687');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (16, '2021002', 2024, 7, 'IF108', 'Pemrograman Berorientasi Objek', 'B+', '2025-07-17 05:52:04.266757', '2025-07-17 05:52:04.266757');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (17, '2021002', 2024, 8, 'IF114', 'Mobile Programming', 'A', '2025-07-17 05:52:04.266833', '2025-07-17 05:52:04.266833');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (18, '2021002', 2024, 8, 'IF104', 'Basis Data', 'A', '2025-07-17 05:52:04.26691', '2025-07-17 05:52:04.26691');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (19, '2021002', 2024, 8, 'IF110', 'Statistika', 'A-', '2025-07-17 05:52:04.266984', '2025-07-17 05:52:04.266984');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (20, '2021002', 2022, 4, 'IF106', 'Jaringan Komputer', 'A', '2025-07-17 05:52:04.267061', '2025-07-17 05:52:04.267061');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (21, '2021002', 2024, 7, 'IF115', 'Cloud Computing', 'A', '2025-07-17 05:52:04.267136', '2025-07-17 05:52:04.267136');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (22, '2021002', 2021, 2, 'IF101', 'Pemrograman Dasar', 'B+', '2025-07-17 05:52:04.267213', '2025-07-17 05:52:04.267213');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (23, '2021003', 2023, 6, 'IF107', 'Sistem Operasi', 'A-', '2025-07-17 05:52:04.267294', '2025-07-17 05:52:04.267294');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (24, '2021003', 2022, 3, 'IF102', 'Matematika Diskrit', 'B', '2025-07-17 05:52:04.267366', '2025-07-17 05:52:04.267366');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (25, '2021003', 2024, 7, 'IF113', 'Keamanan Sistem', 'B+', '2025-07-17 05:52:04.267436', '2025-07-17 05:52:04.267436');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (26, '2021003', 2023, 5, 'IF106', 'Jaringan Komputer', 'B', '2025-07-17 05:52:04.267506', '2025-07-17 05:52:04.267506');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (27, '2021003', 2023, 5, 'IF108', 'Pemrograman Berorientasi Objek', 'A-', '2025-07-17 05:52:04.267581', '2025-07-17 05:52:04.267581');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (28, '2021003', 2022, 3, 'IF105', 'Pemrograman Web', 'B', '2025-07-17 05:52:04.267647', '2025-07-17 05:52:04.267648');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (29, '2021003', 2023, 5, 'IF112', 'Grafika Komputer', 'B', '2025-07-17 05:52:04.267717', '2025-07-17 05:52:04.267717');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (30, '2021003', 2024, 7, 'IF104', 'Basis Data', 'B', '2025-07-17 05:52:04.267794', '2025-07-17 05:52:04.267794');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (31, '2021004', 2023, 5, 'IF108', 'Pemrograman Berorientasi Objek', 'A-', '2025-07-17 05:52:04.267876', '2025-07-17 05:52:04.267876');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (32, '2021004', 2022, 3, 'IF101', 'Pemrograman Dasar', 'A', '2025-07-17 05:52:04.267956', '2025-07-17 05:52:04.267956');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (33, '2021004', 2022, 4, 'IF109', 'Analisis dan Desain Sistem', 'A-', '2025-07-17 05:52:04.268032', '2025-07-17 05:52:04.268033');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (34, '2021004', 2021, 1, 'IF114', 'Mobile Programming', 'A-', '2025-07-17 05:52:04.268118', '2025-07-17 05:52:04.268119');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (35, '2021004', 2021, 2, 'IF111', 'Kecerdasan Buatan', 'B+', '2025-07-17 05:52:04.268195', '2025-07-17 05:52:04.268195');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (36, '2021004', 2024, 8, 'IF110', 'Statistika', 'B', '2025-07-17 05:52:04.268275', '2025-07-17 05:52:04.268276');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (37, '2021004', 2021, 2, 'IF104', 'Basis Data', 'B', '2025-07-17 05:52:04.268353', '2025-07-17 05:52:04.268353');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (38, '2021004', 2024, 8, 'IF113', 'Keamanan Sistem', 'B', '2025-07-17 05:52:04.268427', '2025-07-17 05:52:04.268428');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (39, '2021004', 2021, 1, 'IF105', 'Pemrograman Web', 'B-', '2025-07-17 05:52:04.268506', '2025-07-17 05:52:04.268506');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (40, '2021004', 2021, 1, 'IF107', 'Sistem Operasi', 'B', '2025-07-17 05:52:04.268571', '2025-07-17 05:52:04.268571');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (41, '2021004', 2021, 2, 'IF103', 'Algoritma dan Struktur Data', 'B-', '2025-07-17 05:52:04.268643', '2025-07-17 05:52:04.268643');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (42, '2021005', 2021, 1, 'IF110', 'Statistika', 'B', '2025-07-17 05:52:04.268713', '2025-07-17 05:52:04.268714');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (43, '2021005', 2024, 7, 'IF108', 'Pemrograman Berorientasi Objek', 'B', '2025-07-17 05:52:04.268783', '2025-07-17 05:52:04.268783');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (44, '2021005', 2022, 3, 'IF112', 'Grafika Komputer', 'C', '2025-07-17 05:52:04.268855', '2025-07-17 05:52:04.268855');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (45, '2021005', 2021, 2, 'IF102', 'Matematika Diskrit', 'B-', '2025-07-17 05:52:04.268936', '2025-07-17 05:52:04.268936');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (46, '2021005', 2021, 1, 'IF101', 'Pemrograman Dasar', 'B', '2025-07-17 05:52:04.269013', '2025-07-17 05:52:04.269013');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (47, '2021005', 2024, 7, 'IF106', 'Jaringan Komputer', 'B-', '2025-07-17 05:52:04.269088', '2025-07-17 05:52:04.269088');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (48, '2021005', 2023, 6, 'IF115', 'Cloud Computing', 'B', '2025-07-17 05:52:04.269166', '2025-07-17 05:52:04.269166');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (49, '2021005', 2023, 5, 'IF114', 'Mobile Programming', 'C+', '2025-07-17 05:52:04.269246', '2025-07-17 05:52:04.269247');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (50, '2021006', 2024, 8, 'IF105', 'Pemrograman Web', 'B', '2025-07-17 05:52:04.269333', '2025-07-17 05:52:04.269334');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (51, '2021006', 2023, 5, 'IF109', 'Analisis dan Desain Sistem', 'B+', '2025-07-17 05:52:04.269412', '2025-07-17 05:52:04.269412');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (52, '2021006', 2023, 5, 'IF103', 'Algoritma dan Struktur Data', 'A', '2025-07-17 05:52:04.269488', '2025-07-17 05:52:04.269488');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (53, '2021006', 2022, 4, 'IF106', 'Jaringan Komputer', 'A', '2025-07-17 05:52:04.269565', '2025-07-17 05:52:04.269565');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (54, '2021006', 2022, 4, 'IF107', 'Sistem Operasi', 'A-', '2025-07-17 05:52:04.269634', '2025-07-17 05:52:04.269634');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (55, '2021006', 2023, 6, 'IF114', 'Mobile Programming', 'B', '2025-07-17 05:52:04.269706', '2025-07-17 05:52:04.269706');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (56, '2021006', 2022, 3, 'IF108', 'Pemrograman Berorientasi Objek', 'B-', '2025-07-17 05:52:04.269773', '2025-07-17 05:52:04.269773');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (57, '2021006', 2024, 7, 'IF102', 'Matematika Diskrit', 'B', '2025-07-17 05:52:04.269845', '2025-07-17 05:52:04.269845');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (58, '2021006', 2023, 5, 'IF110', 'Statistika', 'B', '2025-07-17 05:52:04.269911', '2025-07-17 05:52:04.269911');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (59, '2021006', 2024, 7, 'IF112', 'Grafika Komputer', 'B+', '2025-07-17 05:52:04.269979', '2025-07-17 05:52:04.269979');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (60, '2021006', 2022, 3, 'IF113', 'Keamanan Sistem', 'A', '2025-07-17 05:52:04.270046', '2025-07-17 05:52:04.270046');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (61, '2021006', 2024, 8, 'IF111', 'Kecerdasan Buatan', 'B', '2025-07-17 05:52:04.27011', '2025-07-17 05:52:04.27011');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (62, '2021007', 2021, 2, 'IF104', 'Basis Data', 'B+', '2025-07-17 05:52:04.270182', '2025-07-17 05:52:04.270182');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (63, '2021007', 2023, 6, 'IF111', 'Kecerdasan Buatan', 'B+', '2025-07-17 05:52:04.270254', '2025-07-17 05:52:04.270254');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (64, '2021007', 2021, 1, 'IF106', 'Jaringan Komputer', 'B', '2025-07-17 05:52:04.270322', '2025-07-17 05:52:04.270322');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (65, '2021007', 2021, 1, 'IF108', 'Pemrograman Berorientasi Objek', 'B-', '2025-07-17 05:52:04.27039', '2025-07-17 05:52:04.27039');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (66, '2021007', 2021, 2, 'IF101', 'Pemrograman Dasar', 'B+', '2025-07-17 05:52:04.270456', '2025-07-17 05:52:04.270456');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (67, '2021007', 2024, 8, 'IF113', 'Keamanan Sistem', 'B-', '2025-07-17 05:52:04.270521', '2025-07-17 05:52:04.270521');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (68, '2021007', 2024, 8, 'IF112', 'Grafika Komputer', 'B', '2025-07-17 05:52:04.270587', '2025-07-17 05:52:04.270587');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (69, '2021007', 2024, 7, 'IF109', 'Analisis dan Desain Sistem', 'B', '2025-07-17 05:52:04.270652', '2025-07-17 05:52:04.270652');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (70, '2021007', 2024, 8, 'IF107', 'Sistem Operasi', 'B', '2025-07-17 05:52:04.270717', '2025-07-17 05:52:04.270717');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (71, '2021007', 2022, 4, 'IF102', 'Matematika Diskrit', 'B', '2025-07-17 05:52:04.270782', '2025-07-17 05:52:04.270782');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (72, '2021007', 2023, 5, 'IF105', 'Pemrograman Web', 'B', '2025-07-17 05:52:04.270846', '2025-07-17 05:52:04.270846');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (73, '2021008', 2024, 7, 'IF107', 'Sistem Operasi', 'A', '2025-07-17 05:52:04.270921', '2025-07-17 05:52:04.270922');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (74, '2021008', 2022, 4, 'IF106', 'Jaringan Komputer', 'A', '2025-07-17 05:52:04.270987', '2025-07-17 05:52:04.270987');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (75, '2021008', 2023, 6, 'IF114', 'Mobile Programming', 'A-', '2025-07-17 05:52:04.271053', '2025-07-17 05:52:04.271053');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (76, '2021008', 2022, 3, 'IF112', 'Grafika Komputer', 'B', '2025-07-17 05:52:04.271118', '2025-07-17 05:52:04.271118');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (77, '2021008', 2024, 7, 'IF110', 'Statistika', 'B+', '2025-07-17 05:52:04.271183', '2025-07-17 05:52:04.271183');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (78, '2021008', 2024, 8, 'IF113', 'Keamanan Sistem', 'A', '2025-07-17 05:52:04.271255', '2025-07-17 05:52:04.271255');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (79, '2021008', 2022, 3, 'IF101', 'Pemrograman Dasar', 'A-', '2025-07-17 05:52:04.271326', '2025-07-17 05:52:04.271326');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (80, '2021008', 2023, 5, 'IF105', 'Pemrograman Web', 'A', '2025-07-17 05:52:04.271391', '2025-07-17 05:52:04.271391');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (81, '2021008', 2021, 1, 'IF104', 'Basis Data', 'B', '2025-07-17 05:52:04.271454', '2025-07-17 05:52:04.271455');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (82, '2021008', 2022, 3, 'IF103', 'Algoritma dan Struktur Data', 'B+', '2025-07-17 05:52:04.271521', '2025-07-17 05:52:04.271521');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (83, '2021009', 2023, 6, 'IF113', 'Keamanan Sistem', 'B+', '2025-07-17 05:52:04.27159', '2025-07-17 05:52:04.27159');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (84, '2021009', 2024, 8, 'IF104', 'Basis Data', 'B', '2025-07-17 05:52:04.271657', '2025-07-17 05:52:04.271657');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (85, '2021009', 2021, 1, 'IF111', 'Kecerdasan Buatan', 'B', '2025-07-17 05:52:04.271721', '2025-07-17 05:52:04.271721');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (86, '2021009', 2022, 3, 'IF103', 'Algoritma dan Struktur Data', 'B', '2025-07-17 05:52:04.271784', '2025-07-17 05:52:04.271785');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (87, '2021009', 2024, 7, 'IF110', 'Statistika', 'B', '2025-07-17 05:52:04.271849', '2025-07-17 05:52:04.271849');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (88, '2021009', 2021, 1, 'IF105', 'Pemrograman Web', 'B+', '2025-07-17 05:52:04.271911', '2025-07-17 05:52:04.271911');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (89, '2021009', 2021, 2, 'IF102', 'Matematika Diskrit', 'A-', '2025-07-17 05:52:04.272146', '2025-07-17 05:52:04.272146');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (90, '2021009', 2022, 4, 'IF108', 'Pemrograman Berorientasi Objek', 'B', '2025-07-17 05:52:04.27222', '2025-07-17 05:52:04.27222');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (91, '2021009', 2022, 3, 'IF106', 'Jaringan Komputer', 'B', '2025-07-17 05:52:04.272289', '2025-07-17 05:52:04.272289');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (92, '2021009', 2021, 1, 'IF107', 'Sistem Operasi', 'B+', '2025-07-17 05:52:04.272354', '2025-07-17 05:52:04.272354');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (93, '2021010', 2021, 2, 'IF106', 'Jaringan Komputer', 'B', '2025-07-17 05:52:04.272424', '2025-07-17 05:52:04.272424');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (94, '2021010', 2021, 1, 'IF109', 'Analisis dan Desain Sistem', 'A-', '2025-07-17 05:52:04.272494', '2025-07-17 05:52:04.272494');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (95, '2021010', 2021, 1, 'IF111', 'Kecerdasan Buatan', 'B', '2025-07-17 05:52:04.272562', '2025-07-17 05:52:04.272562');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (96, '2021010', 2021, 1, 'IF101', 'Pemrograman Dasar', 'B+', '2025-07-17 05:52:04.272626', '2025-07-17 05:52:04.272626');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (97, '2021010', 2023, 6, 'IF110', 'Statistika', 'B', '2025-07-17 05:52:04.272724', '2025-07-17 05:52:04.272725');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (98, '2021010', 2022, 4, 'IF108', 'Pemrograman Berorientasi Objek', 'B+', '2025-07-17 05:52:04.272893', '2025-07-17 05:52:04.272893');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (99, '2021010', 2022, 4, 'IF114', 'Mobile Programming', 'A', '2025-07-17 05:52:04.273002', '2025-07-17 05:52:04.273002');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (100, '2021010', 2024, 7, 'IF105', 'Pemrograman Web', 'B-', '2025-07-17 05:52:04.273095', '2025-07-17 05:52:04.273095');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (101, '2021010', 2024, 8, 'IF104', 'Basis Data', 'A-', '2025-07-17 05:52:04.273181', '2025-07-17 05:52:04.273181');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (102, '2021010', 2024, 8, 'IF112', 'Grafika Komputer', 'A', '2025-07-17 05:52:04.273269', '2025-07-17 05:52:04.273269');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (103, '2021010', 2021, 2, 'IF107', 'Sistem Operasi', 'B', '2025-07-17 05:52:04.273354', '2025-07-17 05:52:04.273354');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (104, '2021011', 2022, 4, 'IF109', 'Analisis dan Desain Sistem', 'B+', '2025-07-17 05:52:04.273442', '2025-07-17 05:52:04.273442');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (105, '2021011', 2021, 1, 'IF112', 'Grafika Komputer', 'A-', '2025-07-17 05:52:04.273523', '2025-07-17 05:52:04.273524');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (106, '2021011', 2021, 2, 'IF114', 'Mobile Programming', 'B', '2025-07-17 05:52:04.273615', '2025-07-17 05:52:04.273616');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (107, '2021011', 2021, 1, 'IF101', 'Pemrograman Dasar', 'A', '2025-07-17 05:52:04.273696', '2025-07-17 05:52:04.273696');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (108, '2021011', 2021, 1, 'IF103', 'Algoritma dan Struktur Data', 'B+', '2025-07-17 05:52:04.27377', '2025-07-17 05:52:04.27377');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (109, '2021011', 2021, 1, 'IF111', 'Kecerdasan Buatan', 'A', '2025-07-17 05:52:04.273842', '2025-07-17 05:52:04.273843');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (110, '2021011', 2022, 3, 'IF106', 'Jaringan Komputer', 'B+', '2025-07-17 05:52:04.273938', '2025-07-17 05:52:04.273939');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (111, '2021011', 2021, 2, 'IF104', 'Basis Data', 'B+', '2025-07-17 05:52:04.274022', '2025-07-17 05:52:04.274022');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (112, '2021011', 2021, 2, 'IF108', 'Pemrograman Berorientasi Objek', 'B', '2025-07-17 05:52:04.274098', '2025-07-17 05:52:04.274098');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (113, '2021011', 2024, 7, 'IF105', 'Pemrograman Web', 'A-', '2025-07-17 05:52:04.274171', '2025-07-17 05:52:04.274171');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (114, '2021011', 2023, 5, 'IF107', 'Sistem Operasi', 'B+', '2025-07-17 05:52:04.274246', '2025-07-17 05:52:04.274246');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (115, '2021012', 2023, 5, 'IF114', 'Mobile Programming', 'C+', '2025-07-17 05:52:04.274333', '2025-07-17 05:52:04.274333');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (116, '2021012', 2021, 2, 'IF105', 'Pemrograman Web', 'A-', '2025-07-17 05:52:04.27441', '2025-07-17 05:52:04.27441');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (117, '2021012', 2023, 5, 'IF101', 'Pemrograman Dasar', 'B+', '2025-07-17 05:52:04.274483', '2025-07-17 05:52:04.274483');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (118, '2021012', 2024, 8, 'IF115', 'Cloud Computing', 'A-', '2025-07-17 05:52:04.274563', '2025-07-17 05:52:04.274563');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (119, '2021012', 2022, 3, 'IF110', 'Statistika', 'A-', '2025-07-17 05:52:04.274637', '2025-07-17 05:52:04.274638');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (120, '2021012', 2023, 6, 'IF104', 'Basis Data', 'C', '2025-07-17 05:52:04.274742', '2025-07-17 05:52:04.274742');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (121, '2021012', 2023, 6, 'IF111', 'Kecerdasan Buatan', 'B-', '2025-07-17 05:52:04.274816', '2025-07-17 05:52:04.274817');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (122, '2021012', 2022, 3, 'IF103', 'Algoritma dan Struktur Data', 'B-', '2025-07-17 05:52:04.27489', '2025-07-17 05:52:04.27489');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (123, '2021012', 2022, 4, 'IF106', 'Jaringan Komputer', 'B', '2025-07-17 05:52:04.274962', '2025-07-17 05:52:04.274962');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (124, '2021012', 2023, 6, 'IF102', 'Matematika Diskrit', 'B', '2025-07-17 05:52:04.275035', '2025-07-17 05:52:04.275035');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (125, '2021013', 2021, 2, 'IF105', 'Pemrograman Web', 'A-', '2025-07-17 05:52:04.275114', '2025-07-17 05:52:04.275114');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (126, '2021013', 2021, 2, 'IF110', 'Statistika', 'B+', '2025-07-17 05:52:04.275192', '2025-07-17 05:52:04.275192');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (127, '2021013', 2021, 1, 'IF112', 'Grafika Komputer', 'A-', '2025-07-17 05:52:04.27527', '2025-07-17 05:52:04.27527');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (128, '2021013', 2021, 1, 'IF107', 'Sistem Operasi', 'A-', '2025-07-17 05:52:04.275346', '2025-07-17 05:52:04.275346');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (129, '2021013', 2023, 6, 'IF104', 'Basis Data', 'A', '2025-07-17 05:52:04.275412', '2025-07-17 05:52:04.275412');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (130, '2021013', 2024, 7, 'IF103', 'Algoritma dan Struktur Data', 'A', '2025-07-17 05:52:04.275476', '2025-07-17 05:52:04.275476');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (131, '2021013', 2024, 7, 'IF113', 'Keamanan Sistem', 'B+', '2025-07-17 05:52:04.275539', '2025-07-17 05:52:04.275539');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (132, '2021013', 2024, 8, 'IF111', 'Kecerdasan Buatan', 'A', '2025-07-17 05:52:04.275602', '2025-07-17 05:52:04.275602');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (133, '2021013', 2024, 8, 'IF108', 'Pemrograman Berorientasi Objek', 'A-', '2025-07-17 05:52:04.275664', '2025-07-17 05:52:04.275664');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (134, '2021013', 2021, 1, 'IF109', 'Analisis dan Desain Sistem', 'B', '2025-07-17 05:52:04.275729', '2025-07-17 05:52:04.27573');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (135, '2021014', 2023, 6, 'IF104', 'Basis Data', 'B+', '2025-07-17 05:52:04.275809', '2025-07-17 05:52:04.275809');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (136, '2021014', 2024, 8, 'IF114', 'Mobile Programming', 'A-', '2025-07-17 05:52:04.275878', '2025-07-17 05:52:04.275878');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (137, '2021014', 2023, 5, 'IF111', 'Kecerdasan Buatan', 'B', '2025-07-17 05:52:04.275941', '2025-07-17 05:52:04.275941');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (138, '2021014', 2023, 6, 'IF101', 'Pemrograman Dasar', 'B', '2025-07-17 05:52:04.276005', '2025-07-17 05:52:04.276005');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (139, '2021014', 2023, 6, 'IF112', 'Grafika Komputer', 'A-', '2025-07-17 05:52:04.276067', '2025-07-17 05:52:04.276068');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (140, '2021014', 2024, 7, 'IF109', 'Analisis dan Desain Sistem', 'B-', '2025-07-17 05:52:04.27613', '2025-07-17 05:52:04.27613');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (141, '2021014', 2021, 1, 'IF107', 'Sistem Operasi', 'A-', '2025-07-17 05:52:04.276192', '2025-07-17 05:52:04.276192');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (142, '2021014', 2023, 5, 'IF110', 'Statistika', 'B+', '2025-07-17 05:52:04.276259', '2025-07-17 05:52:04.276259');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (143, '2021014', 2022, 3, 'IF113', 'Keamanan Sistem', 'B', '2025-07-17 05:52:04.276322', '2025-07-17 05:52:04.276322');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (144, '2021014', 2021, 1, 'IF102', 'Matematika Diskrit', 'B', '2025-07-17 05:52:04.276385', '2025-07-17 05:52:04.276385');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (145, '2021015', 2024, 8, 'IF114', 'Mobile Programming', 'A-', '2025-07-17 05:52:04.276452', '2025-07-17 05:52:04.276452');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (146, '2021015', 2024, 7, 'IF112', 'Grafika Komputer', 'B+', '2025-07-17 05:52:04.276518', '2025-07-17 05:52:04.276518');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (147, '2021015', 2022, 4, 'IF104', 'Basis Data', 'B+', '2025-07-17 05:52:04.276581', '2025-07-17 05:52:04.276581');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (148, '2021015', 2023, 6, 'IF102', 'Matematika Diskrit', 'B', '2025-07-17 05:52:04.276646', '2025-07-17 05:52:04.276647');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (149, '2021015', 2024, 7, 'IF107', 'Sistem Operasi', 'B', '2025-07-17 05:52:04.276712', '2025-07-17 05:52:04.276712');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (150, '2021015', 2021, 1, 'IF113', 'Keamanan Sistem', 'B+', '2025-07-17 05:52:04.276781', '2025-07-17 05:52:04.276781');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (151, '2021015', 2022, 3, 'IF101', 'Pemrograman Dasar', 'B+', '2025-07-17 05:52:04.276856', '2025-07-17 05:52:04.276856');
INSERT INTO "public"."nilai" ("id", "nim", "tahun", "semester", "kode_matakuliah", "nama_matakuliah", "nilai", "created_at", "updated_at") VALUES (152, '2021015', 2022, 3, 'IF115', 'Cloud Computing', 'B+', '2025-07-17 05:52:04.276929', '2025-07-17 05:52:04.276929');
COMMIT;

-- ----------------------------
-- Table structure for saw_criteria
-- ----------------------------
DROP TABLE IF EXISTS "public"."saw_criteria";
CREATE TABLE "public"."saw_criteria" (
  "id" int4 NOT NULL DEFAULT nextval('saw_criteria_id_seq'::regclass),
  "name" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "weight" float8 NOT NULL,
  "is_cost" bool,
  "created_at" timestamp(6),
  "updated_at" timestamp(6)
)
;
ALTER TABLE "public"."saw_criteria" OWNER TO "spk_user";

-- ----------------------------
-- Records of saw_criteria
-- ----------------------------
BEGIN;
INSERT INTO "public"."saw_criteria" ("id", "name", "weight", "is_cost", "created_at", "updated_at") VALUES (1, 'IPK', 0.4, 'f', '2025-07-17 05:52:04.264457', '2025-07-17 05:52:04.264457');
INSERT INTO "public"."saw_criteria" ("id", "name", "weight", "is_cost", "created_at", "updated_at") VALUES (2, 'SKS', 0.3, 'f', '2025-07-17 05:52:04.26473', '2025-07-17 05:52:04.26473');
INSERT INTO "public"."saw_criteria" ("id", "name", "weight", "is_cost", "created_at", "updated_at") VALUES (3, 'Persentase D, E, K', 0.3, 't', '2025-07-17 05:52:04.264796', '2025-07-17 05:52:04.264797');
COMMIT;

-- ----------------------------
-- Table structure for saw_final_results
-- ----------------------------
DROP TABLE IF EXISTS "public"."saw_final_results";
CREATE TABLE "public"."saw_final_results" (
  "id" int4 NOT NULL DEFAULT nextval('saw_final_results_id_seq'::regclass),
  "nim" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "final_score" float8 NOT NULL,
  "rank" int4 NOT NULL,
  "created_at" timestamp(6) NOT NULL,
  "updated_at" timestamp(6) NOT NULL
)
;
ALTER TABLE "public"."saw_final_results" OWNER TO "spk_user";

-- ----------------------------
-- Records of saw_final_results
-- ----------------------------
BEGIN;
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (1, '2021013', 1.1, 1, '2025-07-17 06:01:52.878368', '2025-07-17 06:01:53.156634');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (2, '2021008', 1.0521308016877637, 2, '2025-07-17 06:01:52.889605', '2025-07-17 06:01:53.159805');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (3, '2021002', 1.032237605485232, 3, '2025-07-17 06:01:52.895143', '2025-07-17 06:01:53.16253');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (4, '2021011', 0.9520160864978902, 4, '2025-07-17 06:01:52.899579', '2025-07-17 06:01:53.165118');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (5, '2021004', 0.9469158755274261, 5, '2025-07-17 06:01:52.903545', '2025-07-17 06:01:53.168167');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (6, '2021001', 0.9140559071729959, 6, '2025-07-17 06:01:52.907059', '2025-07-17 06:01:53.171423');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (7, '2021015', 0.901596782700422, 7, '2025-07-17 06:01:52.91008', '2025-07-17 06:01:53.17423');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (8, '2021006', 0.841646888185654, 8, '2025-07-17 06:01:52.919105', '2025-07-17 06:01:53.177352');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (9, '2021010', 0.8327861286919831, 9, '2025-07-17 06:01:52.929006', '2025-07-17 06:01:53.180044');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (10, '2021003', 0.7614253691983122, 10, '2025-07-17 06:01:52.939581', '2025-07-17 06:01:53.182562');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (11, '2021014', 0.7221466244725738, 11, '2025-07-17 06:01:52.954483', '2025-07-17 06:01:53.185173');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (12, '2021009', 0.6759955168776371, 12, '2025-07-17 06:01:52.96431', '2025-07-17 06:01:53.188014');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (13, '2021012', 0.6307304852320674, 13, '2025-07-17 06:01:52.970636', '2025-07-17 06:01:53.190264');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (14, '2021005', 0.5889556962025316, 14, '2025-07-17 06:01:52.975766', '2025-07-17 06:01:53.192689');
INSERT INTO "public"."saw_final_results" ("id", "nim", "final_score", "rank", "created_at", "updated_at") VALUES (15, '2021007', 0.49842563291139236, 15, '2025-07-17 06:01:52.981013', '2025-07-17 06:01:53.194996');
COMMIT;

-- ----------------------------
-- Table structure for saw_results
-- ----------------------------
DROP TABLE IF EXISTS "public"."saw_results";
CREATE TABLE "public"."saw_results" (
  "id" int4 NOT NULL DEFAULT nextval('saw_results_id_seq'::regclass),
  "nim" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "nilai_akhir" float8 NOT NULL,
  "ranking" int4 NOT NULL,
  "created_at" timestamp(6),
  "updated_at" timestamp(6)
)
;
ALTER TABLE "public"."saw_results" OWNER TO "spk_user";

-- ----------------------------
-- Records of saw_results
-- ----------------------------
BEGIN;
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (1, '2021013', 1.1, 1, '2025-07-17 06:01:52.867329', '2025-07-17 06:01:53.155005');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (2, '2021008', 1.0521308016877637, 2, '2025-07-17 06:01:52.884514', '2025-07-17 06:01:53.158291');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (3, '2021002', 1.032237605485232, 3, '2025-07-17 06:01:52.892859', '2025-07-17 06:01:53.161201');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (4, '2021011', 0.9520160864978902, 4, '2025-07-17 06:01:52.897538', '2025-07-17 06:01:53.163834');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (5, '2021004', 0.9469158755274261, 5, '2025-07-17 06:01:52.901385', '2025-07-17 06:01:53.16656');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (6, '2021001', 0.9140559071729959, 6, '2025-07-17 06:01:52.905383', '2025-07-17 06:01:53.170016');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (7, '2021015', 0.901596782700422, 7, '2025-07-17 06:01:52.908731', '2025-07-17 06:01:53.172847');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (8, '2021006', 0.841646888185654, 8, '2025-07-17 06:01:52.912163', '2025-07-17 06:01:53.175722');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (9, '2021010', 0.8327861286919831, 9, '2025-07-17 06:01:52.924906', '2025-07-17 06:01:53.178872');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (10, '2021003', 0.7614253691983122, 10, '2025-07-17 06:01:52.934908', '2025-07-17 06:01:53.181317');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (11, '2021014', 0.7221466244725738, 11, '2025-07-17 06:01:52.946938', '2025-07-17 06:01:53.183903');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (12, '2021009', 0.6759955168776371, 12, '2025-07-17 06:01:52.960756', '2025-07-17 06:01:53.186759');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (13, '2021012', 0.6307304852320674, 13, '2025-07-17 06:01:52.967469', '2025-07-17 06:01:53.189098');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (14, '2021005', 0.5889556962025316, 14, '2025-07-17 06:01:52.973828', '2025-07-17 06:01:53.19151');
INSERT INTO "public"."saw_results" ("id", "nim", "nilai_akhir", "ranking", "created_at", "updated_at") VALUES (15, '2021007', 0.49842563291139236, 15, '2025-07-17 06:01:52.978176', '2025-07-17 06:01:53.19391');
COMMIT;

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."klasifikasi_kelulusan_id_seq"
OWNED BY "public"."klasifikasi_kelulusan"."id";
SELECT setval('"public"."klasifikasi_kelulusan_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."nilai_id_seq"
OWNED BY "public"."nilai"."id";
SELECT setval('"public"."nilai_id_seq"', 152, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."saw_criteria_id_seq"
OWNED BY "public"."saw_criteria"."id";
SELECT setval('"public"."saw_criteria_id_seq"', 3, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."saw_final_results_id_seq"
OWNED BY "public"."saw_final_results"."id";
SELECT setval('"public"."saw_final_results_id_seq"', 15, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."saw_results_id_seq"
OWNED BY "public"."saw_results"."id";
SELECT setval('"public"."saw_results_id_seq"', 15, true);

-- ----------------------------
-- Primary Key structure for table alembic_version
-- ----------------------------
ALTER TABLE "public"."alembic_version" ADD CONSTRAINT "alembic_version_pkc" PRIMARY KEY ("version_num");

-- ----------------------------
-- Uniques structure for table klasifikasi_kelulusan
-- ----------------------------
ALTER TABLE "public"."klasifikasi_kelulusan" ADD CONSTRAINT "klasifikasi_kelulusan_nim_key" UNIQUE ("nim");

-- ----------------------------
-- Primary Key structure for table klasifikasi_kelulusan
-- ----------------------------
ALTER TABLE "public"."klasifikasi_kelulusan" ADD CONSTRAINT "klasifikasi_kelulusan_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table mahasiswa
-- ----------------------------
ALTER TABLE "public"."mahasiswa" ADD CONSTRAINT "mahasiswa_pkey" PRIMARY KEY ("nim");

-- ----------------------------
-- Primary Key structure for table nilai
-- ----------------------------
ALTER TABLE "public"."nilai" ADD CONSTRAINT "nilai_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table saw_criteria
-- ----------------------------
CREATE INDEX "ix_saw_criteria_id" ON "public"."saw_criteria" USING btree (
  "id" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table saw_criteria
-- ----------------------------
ALTER TABLE "public"."saw_criteria" ADD CONSTRAINT "saw_criteria_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table saw_final_results
-- ----------------------------
CREATE INDEX "ix_saw_final_results_id" ON "public"."saw_final_results" USING btree (
  "id" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table saw_final_results
-- ----------------------------
ALTER TABLE "public"."saw_final_results" ADD CONSTRAINT "saw_final_results_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table saw_results
-- ----------------------------
CREATE INDEX "ix_saw_results_id" ON "public"."saw_results" USING btree (
  "id" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table saw_results
-- ----------------------------
ALTER TABLE "public"."saw_results" ADD CONSTRAINT "saw_results_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table klasifikasi_kelulusan
-- ----------------------------
ALTER TABLE "public"."klasifikasi_kelulusan" ADD CONSTRAINT "klasifikasi_kelulusan_nim_fkey" FOREIGN KEY ("nim") REFERENCES "public"."mahasiswa" ("nim") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table nilai
-- ----------------------------
ALTER TABLE "public"."nilai" ADD CONSTRAINT "nilai_nim_fkey" FOREIGN KEY ("nim") REFERENCES "public"."mahasiswa" ("nim") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table saw_final_results
-- ----------------------------
ALTER TABLE "public"."saw_final_results" ADD CONSTRAINT "saw_final_results_nim_fkey" FOREIGN KEY ("nim") REFERENCES "public"."mahasiswa" ("nim") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table saw_results
-- ----------------------------
ALTER TABLE "public"."saw_results" ADD CONSTRAINT "saw_results_nim_fkey" FOREIGN KEY ("nim") REFERENCES "public"."mahasiswa" ("nim") ON DELETE CASCADE ON UPDATE NO ACTION;
