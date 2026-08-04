-- ============================================================
-- TUGAS RUTIN (GA) seed — jalankan sekali di server
-- ============================================================
USE db_internal;

-- katalog (kategori frekuensi)
CREATE TABLE IF NOT EXISTS tugasrutin_katalog (
  id int AUTO_INCREMENT PRIMARY KEY,
  kode varchar(20) NOT NULL UNIQUE,
  user_id int unsigned NOT NULL DEFAULT 4,
  nama varchar(255) NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP
);

-- task item
CREATE TABLE IF NOT EXISTS tugasrutin_task (
  id int AUTO_INCREMENT PRIMARY KEY,
  kode_task varchar(20) NOT NULL UNIQUE,
  katalog_kode varchar(20) NOT NULL DEFAULT '',
  outlet_id json,
  user_id int unsigned NOT NULL DEFAULT 4,
  hari varchar(20),
  frekuensi varchar(30),
  nama varchar(255) NOT NULL,
  min_foto tinyint unsigned NOT NULL DEFAULT 1,
  keterangan json,
  sort_order int DEFAULT 0,
  created_at datetime DEFAULT CURRENT_TIMESTAMP
);

-- jadwal per hari
CREATE TABLE IF NOT EXISTS tugasrutin_jadwal (
  id int AUTO_INCREMENT PRIMARY KEY,
  user_id int NOT NULL DEFAULT 4,
  day_of_week tinyint NOT NULL,
  outlet_id int NOT NULL,
  tasks json,
  created_at datetime DEFAULT CURRENT_TIMESTAMP
);

-- laporan submit
CREATE TABLE IF NOT EXISTS tugasrutin_laporan (
  id int AUTO_INCREMENT PRIMARY KEY,
  outlet_id int unsigned NOT NULL,
  user_id int unsigned NOT NULL,
  tasks json NOT NULL,
  lat decimal(10,8),
  lon decimal(11,8),
  address text,
  device varchar(255),
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- wipe data lama
DELETE FROM tugasrutin_task;
DELETE FROM tugasrutin_jadwal;

-- katalog
INSERT INTO tugasrutin_katalog (kode, user_id, nama) VALUES
('tr1', 4, 'Tugas Harian'),
('tr2', 4, 'Tugas Mingguan'),
('tr3', 4, 'Tugas 2 Mingguan')
ON DUPLICATE KEY UPDATE nama=VALUES(nama);

-- tasks
INSERT INTO tugasrutin_task (kode_task, katalog_kode, outlet_id, user_id, hari, frekuensi, nama, min_foto, keterangan, sort_order) VALUES
-- HARIAN (OPIUCI=2)
('tr1-1','tr1','[2]',4,'','Harian','Siram Tanaman',2,'["Siram seluruh tanaman (pagi)","Pastikan media lembab, tidak tergenang"]',1),
('tr1-2','tr1','[2]',4,'','Harian','Set Up Photobooth',1,'["Nyalakan & set up photobooth","Pastikan kamera & printer siap pakai","Rapikan area & properti"]',2),
-- MINGGUAN
('tr2-1','tr2','[1]',4,'Senin','Mingguan','Brushing Lantai Kayu Entrance & Teras',3,'["Brushing lantai kayu entrance & teras","Bersihkan lumut & kotoran di sela kayu","Keringkan hingga bersih"]',1),
('tr2-2','tr2','[1]',4,'Senin','Mingguan','Cleaning Upper Window',3,'["Pasang scaffolding dengan aman (cek kuncian)","Bersihkan seluruh kaca bagian atas","Keringkan hingga bening, tidak berbekas","Bongkar scaffolding & rapikan area"]',2),
('tr2-3','tr2','[1]',4,'Selasa','Mingguan','Brushing Deck Kayu Lantai 2',3,'["Brushing seluruh deck kayu lantai 2","Bersihkan lumut & kotoran di sela kayu","Keringkan hingga bersih"]',1),
('tr2-4','tr2','[1]',4,'Selasa & Jumat','Mingguan','Brushing Lantai Bawah Tangga',3,'["Brushing seluruh lantai area bawah tangga","Pastikan seluruh area lantai dalam keadaan basah","Bilas & keringkan hingga bersih"]',2),
('tr2-5','tr2','[2]',4,'Rabu','Mingguan','Brushing Lantai Dance Floor',3,'["Brushing seluruh lantai dance floor","Pastikan seluruh area lantai dalam keadaan basah","Bilas & keringkan hingga bersih"]',1),
('tr2-6','tr2','[2]',4,'Rabu','Mingguan','Cleaning Rigid',3,'["Bersihkan rigid dari endapan & kotoran","Pastikan aliran air lancar"]',2),
('tr2-7','tr2','[1]',4,'Kamis','Mingguan','Brushing Lantai Teras Kolam',3,'["Brushing seluruh lantai teras kolam","Pastikan seluruh area lantai dalam keadaan basah","Bilas & keringkan hingga bersih"]',1),
('tr2-8','tr2','[2]',4,'Kamis','Mingguan','Pasang LED Screen',2,'["Pasang LED screen dengan aman","Pastikan koneksi & tampilan normal"]',2),
('tr2-9','tr2','[2]',4,'Jumat','Mingguan','Copot LED Screen',2,'["Lepas LED screen dengan hati-hati","Rapikan & simpan di tempat aman"]',1),
('tr2-10','tr2','[1]',4,'Sabtu','Mingguan','Setup Live Music',1,'["Set up panggung & alat musik","Cek sound system & sambungan listrik","Pastikan area siap dipakai"]',1),
('tr2-11','tr2','[2]',4,'Sabtu','Mingguan','Brushing Lantai Outdoor',3,'["Brushing seluruh lantai outdoor","Pastikan seluruh area lantai dalam keadaan basah","Bilas & keringkan hingga bersih"]',2),
-- 2 MINGGUAN
('tr3-1','tr3','[2]',4,'Sabtu','2 Mingguan','Cleaning Kipas & Repaint Kolom',3,'["Bersihkan bilah kipas","Pastikan putaran normal, tidak berdebu","Amplas & cat ulang kolom","Rapikan finishing"]',1);

-- jadwal per hari (day_of_week 1=Senin..7=Minggu)
DELETE FROM tugasrutin_jadwal;
INSERT INTO tugasrutin_jadwal (user_id, day_of_week, outlet_id, tasks) VALUES
(4,1,1,'["tr2-1","tr2-2"]'),
(4,1,2,'["tr1-1","tr1-2"]'),
(4,2,2,'["tr1-1","tr1-2"]'),
(4,2,1,'["tr2-3","tr2-4"]'),
(4,3,2,'["tr1-1","tr2-5","tr2-6"]'),
(4,4,1,'["tr2-7"]'),
(4,4,2,'["tr1-1","tr1-2","tr2-8"]'),
(4,5,1,'["tr2-4"]'),
(4,5,2,'["tr1-1","tr2-9"]'),
(4,6,1,'["tr2-10"]'),
(4,6,2,'["tr1-1","tr1-2","tr2-11","tr3-1"]'),
(4,7,2,'["tr1-1","tr1-2"]');

SELECT 'DONE' AS status;