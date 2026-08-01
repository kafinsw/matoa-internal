-- Migration 004: daily_jadwal
-- Jadwal daily check per user per hari kerja (1=Senin ... 5=Jumat)

CREATE TABLE IF NOT EXISTS `daily_jadwal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `day_of_week` tinyint(1) NOT NULL COMMENT '1=Senin,2=Selasa,3=Rabu,4=Kamis,5=Jumat',
  `outlet_kode` varchar(20) NOT NULL,
  `tasks` json DEFAULT NULL COMMENT 'array kode_task GA; NULL = semua task user tsb (ME)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_day` (`user_id`,`day_of_week`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed GA (user_id=4)
INSERT INTO `daily_jadwal` (`user_id`,`day_of_week`,`outlet_kode`,`tasks`) VALUES
(4,1,'BRACI',   '["c1-1","c2-1","c2-2","c2-3","c3-1","c3-2","c3-3","c4-1","c4-2"]'),
(4,2,'OPIUCI',  '["c1-1","c3-1","c3-2","c3-3","c4-3"]'),
(4,3,'TANATAP', '["c2-4","c3-4","c3-5","c4-1"]'),
(4,4,'BRACI',   '["c1-1","c2-1","c2-2","c2-3","c3-1","c3-2","c3-3","c4-1","c4-2"]'),
(4,5,'OPIUCI',  '["c1-1","c3-6","c3-7","c3-8","c4-3"]')
ON DUPLICATE KEY UPDATE outlet_kode=VALUES(outlet_kode), tasks=VALUES(tasks);

-- Seed ME (user_id=3) — tasks NULL = tampil semua item E milik ME
INSERT INTO `daily_jadwal` (`user_id`,`day_of_week`,`outlet_kode`,`tasks`) VALUES
(3,1,'BRACI',   NULL),
(3,2,'OPIUCI',  NULL),
(3,3,'TANATAP', NULL),
(3,4,'BRACI',   NULL),
(3,5,'OPIUCI',  NULL)
ON DUPLICATE KEY UPDATE outlet_kode=VALUES(outlet_kode), tasks=VALUES(tasks);
