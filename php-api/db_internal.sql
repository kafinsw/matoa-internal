-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 28, 2026 at 11:11 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_internal`
--

-- --------------------------------------------------------

--
-- Table structure for table `app_settings`
--

CREATE TABLE `app_settings` (
  `id` int(10) UNSIGNED NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `app_settings`
--

INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `created_at`, `updated_at`) VALUES
(1, 'app_name', 'Matoa Internal', '2026-07-17 00:30:57', '2026-07-17 00:30:57');

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_kendala`
--

CREATE TABLE `jadwal_kendala` (
  `id` int(11) NOT NULL,
  `tiket_id` varchar(100) NOT NULL,
  `schedule_date` datetime NOT NULL,
  `deadline_date` datetime DEFAULT NULL,
  `held_at` datetime DEFAULT NULL,
  `held_hours_elapsed` decimal(10,4) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `jadwal_kendala`
--

INSERT INTO `jadwal_kendala` (`id`, `tiket_id`, `schedule_date`, `deadline_date`, `held_at`, `held_hours_elapsed`, `created_at`, `updated_at`) VALUES
(8, 'TKT-220726-001', '2026-07-22 06:31:59', '2026-07-29 02:57:06', NULL, NULL, '2026-07-22 06:31:59', '2026-07-28 02:57:06'),
(9, 'TKT-220726-002', '2026-07-18 06:32:26', '2026-07-21 06:32:26', '2026-07-28 03:56:27', 141.4003, '2026-07-22 06:32:26', '2026-07-28 03:56:27'),
(10, 'TKT-220726-003', '2026-07-22 06:33:07', '2026-07-27 06:33:07', '2026-07-28 04:31:20', 141.9703, '2026-07-22 06:33:07', '2026-07-28 04:31:20'),
(11, 'TKT-220726-004', '2026-07-21 06:33:56', '2026-07-22 06:33:56', '2026-07-22 14:53:45', 8.3303, '2026-07-22 06:33:56', '2026-07-22 14:53:45'),
(12, 'TKT-220726-005', '2026-07-22 06:34:27', '2026-07-27 06:34:27', '2026-07-28 05:48:15', 143.2300, '2026-07-22 06:34:27', '2026-07-28 05:48:15'),
(13, 'TKT-220726-006', '2026-07-22 06:57:44', '2026-07-29 17:00:00', NULL, NULL, '2026-07-22 06:57:44', '2026-07-28 10:13:03'),
(14, 'TKT-220726-007', '2026-07-22 07:02:04', '2026-07-23 07:02:04', NULL, NULL, '2026-07-22 07:02:04', '2026-07-22 07:02:04'),
(15, 'TKT-220726-008', '2026-07-22 07:03:37', '2026-07-25 07:03:37', '2026-07-23 15:56:20', 32.8786, '2026-07-22 07:03:37', '2026-07-23 15:56:20'),
(16, 'TKT-220726-009', '2026-07-22 07:04:48', '2026-07-25 07:04:48', NULL, NULL, '2026-07-22 07:04:48', '2026-07-22 07:04:48'),
(17, 'TKT-220726-010', '2026-07-22 08:41:14', '2026-07-25 08:41:14', NULL, NULL, '2026-07-22 08:41:14', '2026-07-22 08:41:14'),
(18, 'TKT-220726-011', '2026-07-22 08:42:25', '2026-07-25 08:45:58', NULL, NULL, '2026-07-22 08:42:25', '2026-07-24 02:19:00'),
(19, 'TKT-280726-001', '2026-07-28 02:36:40', '2026-08-03 02:36:40', NULL, NULL, '2026-07-28 02:36:40', '2026-07-28 02:36:40'),
(20, 'TKT-280726-002', '2026-07-28 02:53:40', '2026-07-29 17:00:00', NULL, NULL, '2026-07-28 02:53:40', '2026-07-28 03:28:07'),
(21, 'TKT-280726-003', '2026-07-28 08:52:15', '2026-07-29 17:00:00', NULL, NULL, '2026-07-28 08:52:15', '2026-07-28 09:26:35'),
(22, 'TKT-280726-004', '2026-07-28 08:52:43', '2026-07-31 08:52:43', '2026-07-28 09:06:54', 0.2364, '2026-07-28 08:52:43', '2026-07-28 09:06:54'),
(23, 'TKT-280726-005', '2026-07-28 08:53:02', '2026-07-31 08:53:02', '2026-07-28 09:07:10', 0.2356, '2026-07-28 08:53:02', '2026-07-28 09:07:10'),
(24, 'TKT-280726-006', '2026-07-28 08:53:20', '2026-07-31 08:53:20', '2026-07-28 09:11:38', 0.3050, '2026-07-28 08:53:20', '2026-07-28 09:11:38'),
(25, 'TKT-280726-007', '2026-07-28 09:22:21', '2026-08-03 10:17:36', NULL, NULL, '2026-07-28 09:22:21', '2026-07-28 10:18:31'),
(26, 'TKT-280726-008', '2026-07-28 09:24:23', '2026-07-29 09:24:23', NULL, NULL, '2026-07-28 09:24:23', '2026-07-28 09:24:23'),
(27, 'TKT-280726-009', '2026-07-28 10:15:11', '2026-07-31 10:15:29', NULL, NULL, '2026-07-28 10:15:11', '2026-07-28 10:16:12'),
(28, 'TKT-280726-010', '2026-07-28 10:19:29', '2026-08-03 10:19:29', NULL, NULL, '2026-07-28 10:19:29', '2026-07-28 10:19:29'),
(29, 'TKT-280726-011', '2026-07-28 10:20:09', '2026-07-29 10:20:09', NULL, NULL, '2026-07-28 10:20:09', '2026-07-28 10:20:09'),
(30, 'TKT-280726-012', '2026-07-28 10:20:49', '2026-07-31 10:20:49', NULL, NULL, '2026-07-28 10:20:49', '2026-07-28 10:20:49');

-- --------------------------------------------------------

--
-- Table structure for table `katalog_gejala`
--

CREATE TABLE `katalog_gejala` (
  `id` int(10) UNSIGNED NOT NULL,
  `kategori` varchar(100) NOT NULL,
  `kategori_id` int(10) UNSIGNED DEFAULT NULL,
  `user_id` int(11) NOT NULL DEFAULT 3,
  `gejala_id` varchar(10) NOT NULL,
  `gejala` varchar(255) NOT NULL,
  `level` tinyint(4) NOT NULL,
  `butuh_barang` tinyint(1) NOT NULL DEFAULT 0,
  `contoh` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `katalog_gejala`
--

INSERT INTO `katalog_gejala` (`id`, `kategori`, `kategori_id`, `user_id`, `gejala_id`, `gejala`, `level`, `butuh_barang`, `contoh`, `created_at`) VALUES
(1, 'Kelistrikan', 1, 3, 'LIS-01', 'Bau terbakar / percikan / konsleting', 1, 1, 'adanya konsleting pada AC area loker; microwave keluar suara percikan', '2026-07-19 05:37:24'),
(2, 'Kelistrikan', 1, 3, 'LIS-02', 'Panel/MCB turun, sebagian area mati listrik', 1, 0, 'MCB AC Hideout turun2 lagi', '2026-07-19 05:37:24'),
(3, 'Kelistrikan', 1, 3, 'LIS-03', 'Stop kontak mati total (tidak ada listrik)', 1, 1, 'stopkontak meja beton outdor semua tidak ada listriknya', '2026-07-19 05:37:24'),
(4, 'Kelistrikan', 1, 3, 'LIS-04', 'Stop kontak rusak/patah, area lain normal', 2, 1, 'stopkontak tanam area entrance rumah baud patah', '2026-07-19 05:37:24'),
(5, 'Kelistrikan', 1, 3, 'LIS-05', 'Kabel terkelupas/berantakan berisiko', 2, 1, 'kabel dak jalur sound area both hancur', '2026-07-19 05:37:24'),
(6, 'Kelistrikan', 1, 3, 'LIS-06', 'Perlu penambahan titik listrik/lampu', 3, 1, 'penambahan stop kontak area pavilion', '2026-07-19 05:37:24'),
(7, 'AC Ruangan', 2, 3, 'ACR-01', 'AC mati total / tidak mau nyala', 1, 1, 'Ac pantry & pastry rusak tidak mau nyala', '2026-07-19 05:37:24'),
(8, 'AC Ruangan', 2, 3, 'ACR-02', 'AC kompresor mati / muncul kode error', 1, 1, 'AC r.office kompresor mati; AC Lobby kode E1', '2026-07-19 05:37:24'),
(9, 'AC Ruangan', 2, 3, 'ACR-03', 'AC kurang dingin', 2, 1, 'AC R HRD tidak dingin', '2026-07-19 05:37:24'),
(10, 'AC Ruangan', 2, 3, 'ACR-04', 'AC bocor / kondensasi menetes', 2, 0, 'AC atas photoboth bocor; AC area tengah kondensasi', '2026-07-19 05:37:24'),
(11, 'AC Ruangan', 2, 3, 'ACR-05', 'Sensor / remote AC rusak', 2, 1, 'AC R.purchasing sensor rusak harus ganti', '2026-07-19 05:37:24'),
(12, 'AC Ruangan', 2, 3, 'ACR-06', 'Filter AC kotor, perlu cleaning', 3, 0, 'filter AC lt2 dan hideout kotor', '2026-07-19 05:37:24'),
(13, 'Pendingin Komersial', 3, 3, 'REF-01', 'Showcase/chiller/freezer mati atau tidak dingin', 1, 1, 'freezer gudang tidak dingin; showcase suhu tidak dingin', '2026-07-19 05:37:24'),
(14, 'Pendingin Komersial', 3, 3, 'REF-02', 'Suhu showcase/chiller naik-turun / kurang dingin', 2, 1, 'showcase bar suhu masih naik turun tidak stabil', '2026-07-19 05:37:24'),
(15, 'Pendingin Komersial', 3, 3, 'REF-03', 'Chiller/showcase bocor / menetes / banjir', 2, 0, 'Chiller sec Salad banjir; showcase netes bagian atas', '2026-07-19 05:37:24'),
(16, 'Pendingin Komersial', 3, 3, 'REF-04', 'Ice maker banjir / bermasalah', 1, 1, 'Mesin ice maker banjir', '2026-07-19 05:37:24'),
(17, 'Pendingin Komersial', 3, 3, 'REF-05', 'Freezer/undercounter tidak bisa diisi / rusak', 1, 1, 'Under counter freezer kitchen rusak tidak bisa isi', '2026-07-19 05:37:24'),
(18, 'Air / Plumbing', 4, 3, 'AIR-01', 'Saluran/drain mampet, tidak bisa dipakai', 1, 0, 'Saluran pembuangan kitchen mampet', '2026-07-19 05:37:24'),
(19, 'Air / Plumbing', 4, 3, 'AIR-02', 'Kebocoran pipa deras / air menggenang / banjir', 1, 1, 'area bawah ice bin & sink bar banjir', '2026-07-19 05:37:24'),
(20, 'Air / Plumbing', 4, 3, 'AIR-03', 'Kran bocor / netes / patah', 2, 1, 'kran wastafel bar leheran fleksibel bocor harus ganti', '2026-07-19 05:37:24'),
(21, 'Air / Plumbing', 4, 3, 'AIR-04', 'Jet shower rusak / selang sobek', 2, 1, 'Selang jet shower toilet atas sobek', '2026-07-19 05:37:24'),
(22, 'Air / Plumbing', 4, 3, 'AIR-05', 'Closet / pelampung / tutup tangki rusak', 2, 1, 'closet toilet cewe tutup tangki pecah', '2026-07-19 05:37:24'),
(23, 'Air / Plumbing', 4, 3, 'AIR-06', 'Floor drain berbau, perlu sealent', 3, 0, 'Floor Drain Toilet Pria & Wanita berbau', '2026-07-19 05:37:24'),
(24, 'Air / Plumbing', 4, 3, 'AIR-07', 'Rembesan air ringan di sink/dinding', 3, 0, 'rembesan shink', '2026-07-19 05:37:24'),
(25, 'Atap / Plafon', 5, 4, 'ATP-01', 'Plafon ambruk / jebol', 1, 1, 'plapon toilet cowo ambruk', '2026-07-19 05:37:24'),
(26, 'Atap / Plafon', 5, 4, 'ATP-02', 'Atap / plafon bocor menetes', 2, 1, 'beberapa titik atap bocor; plapon jurnal netes', '2026-07-19 05:37:24'),
(27, 'Atap / Plafon', 5, 4, 'ATP-03', 'Plafon terbuka / ada celah', 3, 0, 'Plafon Entrance Braci terbuka sedikit', '2026-07-19 05:37:24'),
(28, 'Atap / Plafon', 5, 4, 'ATP-04', 'Talang air bocor / tersumbat', 2, 0, 'talang atap plafon lobby ada kebocoran', '2026-07-19 05:37:24'),
(29, 'Pintu / Kunci', 6, 4, 'PTU-01', 'Pintu utama tidak bisa dikunci / rumah kunci rusak', 1, 1, 'kusen rumah kunci pintu utama retak; ganti rumah kunci toilet', '2026-07-19 05:37:24'),
(30, 'Pintu / Kunci', 6, 4, 'PTU-02', 'Kaca pintu/jendela pecah / retak besar', 1, 1, 'Kaca Pintu Jurnal pecah', '2026-07-19 05:37:24'),
(31, 'Pintu / Kunci', 6, 4, 'PTU-03', 'Pintu lepas dari engsel', 1, 1, 'Pintu kitchen lepas', '2026-07-19 05:37:24'),
(32, 'Pintu / Kunci', 6, 4, 'PTU-04', 'Engsel rusak / lepas', 2, 1, 'Pintu toilet wanita bagian engsel rusak', '2026-07-19 05:37:24'),
(33, 'Pintu / Kunci', 6, 4, 'PTU-05', 'Pintu seret / susah dibuka-tutup', 3, 0, 'Perbaiki pintu entrance seret', '2026-07-19 05:37:24'),
(34, 'Pintu / Kunci', 6, 4, 'PTU-06', 'Handle pintu lepas / patah', 3, 1, 'handle pintu slide paviliun patah harus dilas', '2026-07-19 05:37:24'),
(35, 'Furnitur', 7, 4, 'FRN-01', 'Kursi/meja patah/roboh, berisiko melukai', 1, 1, 'kursi vip 3 ambruk; Meja A7 patah', '2026-07-19 05:37:24'),
(36, 'Furnitur', 7, 4, 'FRN-02', 'Sofa amblas / sobek / jebol', 2, 1, 'sofa sec B amblas; sofa A1 sobek', '2026-07-19 05:37:24'),
(37, 'Furnitur', 7, 4, 'FRN-03', 'Meja goyang / tidak rata', 3, 0, 'meja lt1 goyang lagi harus dikencangkan', '2026-07-19 05:37:24'),
(38, 'Furnitur', 7, 4, 'FRN-04', 'Queue line / railing / fixture lepas', 3, 1, 'Qline bagian kaki rusak; railing sofa linggar', '2026-07-19 05:37:24'),
(39, 'Furnitur', 7, 4, 'FRN-05', 'Laci / rak / lemari macet atau lepas', 3, 1, 'Engsel lemari service station paviliun terlepas', '2026-07-19 05:37:24'),
(40, 'Pencahayaan', 8, 4, 'LMP-01', 'Seluruh pencahayaan area mati', 1, 1, 'Lampu gang entrance mati', '2026-07-19 05:37:24'),
(41, 'Pencahayaan', 8, 4, 'LMP-02', 'Lampu sebagian mati (beberapa titik)', 2, 1, 'lampu downlight toilet cewe mati 2 pcs', '2026-07-19 05:37:24'),
(42, 'Pencahayaan', 8, 4, 'LMP-03', 'Lampu satu titik mati', 3, 1, 'Lampu Downlight depan toilet mati 1', '2026-07-19 05:37:24'),
(43, 'Pencahayaan', 8, 4, 'LMP-04', 'Lampu redup / berkedip', 2, 1, 'lampu downlight area pastri kitchen redup', '2026-07-19 05:37:24'),
(44, 'Pencahayaan', 8, 4, 'LMP-05', 'LED strip / neon flex fasad mati / konslet', 2, 1, 'lampu LED strip balkon jurnal sebagian konslet', '2026-07-19 05:37:24'),
(45, 'Dinding / Lantai', 9, 4, 'DKL-01', 'Cat terkelupas / dinding kusam-kotor', 3, 1, 'frame pintu cat terkelupas; dinding kitchen kusam', '2026-07-19 05:37:24'),
(46, 'Dinding / Lantai', 9, 4, 'DKL-02', 'Dinding retak', 3, 0, 'dinding area pavillion ada retakan', '2026-07-19 05:37:24'),
(47, 'Dinding / Lantai', 9, 4, 'DKL-03', 'Lantai/keramik retak / terkelupas / lepas', 2, 1, 'lantai depan pintu kitchen terkelupas; keramik lepas hideout', '2026-07-19 05:37:24'),
(48, 'Dinding / Lantai', 9, 4, 'DKL-04', 'Lantai / permukaan kotor / bernoda', 3, 0, 'lantai mainhall beberapa titik bernoda', '2026-07-19 05:37:24'),
(49, 'Peralatan Dapur', 10, 3, 'DPR-01', 'Kompor pilot mati / tidak nyala', 1, 1, 'Perbaikan pilot kompor kitchen; kompor Wok pilot mati', '2026-07-19 05:37:24'),
(50, 'Peralatan Dapur', 10, 3, 'DPR-02', 'Deep fryer meletup / tidak normal', 1, 1, 'deep fryer saat dinyalakan sering meletup', '2026-07-19 05:37:24'),
(51, 'Peralatan Dapur', 10, 3, 'DPR-03', 'Oven suhu tidak maksimal', 2, 1, 'Oven pizza tungku atas suhu tidak maksimal', '2026-07-19 05:37:24'),
(52, 'Peralatan Dapur', 10, 3, 'DPR-04', 'Mesin kopi / grinder mati', 2, 1, 'Mesin grinder kopi mati', '2026-07-19 05:37:24'),
(53, 'Peralatan Dapur', 10, 3, 'DPR-05', 'Mesin es / gelato / seal bermasalah', 2, 1, 'mesin gelato kurang dingin; mesin slusher suara tidak biasa', '2026-07-19 05:37:24'),
(54, 'Ventilasi / Exhaust', 11, 3, 'VEN-01', 'Exhaust / HEPA / blower berbunyi', 2, 0, 'HEPA Sec Main Hall Smoking Area berbunyi', '2026-07-19 05:37:24'),
(55, 'Ventilasi / Exhaust', 11, 3, 'VEN-02', 'Exhaust / HEPA / kipas kotor perlu cleaning', 3, 0, 'HEPA Filter area Dance Floor kotor', '2026-07-19 05:37:24'),
(56, 'Ventilasi / Exhaust', 11, 3, 'VEN-03', 'Kipas / fan mati atau bermasalah', 2, 1, 'AC Pantry fan-nya bermasalah', '2026-07-19 05:37:24'),
(57, 'IT & AV', 12, 3, 'ITA-01', 'POS / kasir mati total / no power', 1, 1, 'POS gak ada power; perbaikan pos down', '2026-07-19 05:37:24'),
(58, 'IT & AV', 12, 3, 'ITA-02', 'POS / kasir error / sering disconnect', 2, 1, 'printer kasir indor sering tidak connect', '2026-07-19 05:37:24'),
(59, 'IT & AV', 12, 3, 'ITA-03', 'Printer kasir error / hasil tidak rapi', 2, 1, 'mesin printer kasir outdor sering eror tidak cutting', '2026-07-19 05:37:24'),
(60, 'IT & AV', 12, 3, 'ITA-04', 'CCTV mati / burem / jalur putus', 2, 1, 'CCTV depan Braci burem; CCTV ch12 jalur putus', '2026-07-19 05:37:24'),
(61, 'IT & AV', 12, 3, 'ITA-05', 'WIFI / jaringan mati-nyala', 2, 0, 'WIFI area Hideout perlu dicek (mati2)', '2026-07-19 05:37:24'),
(62, 'IT & AV', 12, 3, 'ITA-06', 'Speaker / sound mati / noise', 2, 1, '3 titik speaker mati; speaker jbl ada noise', '2026-07-19 05:37:24'),
(63, 'Signage / Display', 13, 4, 'SGN-01', 'Neon flex / lampu fasad (papan nama) mati atau redup', 2, 1, 'Neonflex fasad area atas mati; lampu neon flex fasad redup/mati', '2026-07-19 05:37:24'),
(64, 'Signage / Display', 13, 4, 'SGN-02', 'LED panel / videotron mata mati atau copot', 2, 1, 'mata LED panel copot tidak lengkap', '2026-07-19 05:37:24'),
(65, 'Signage / Display', 13, 4, 'SGN-03', 'TV / layar display mati / error / posisi salah', 2, 1, 'Display TV terbalik', '2026-07-19 05:37:24'),
(66, 'Gas / CO2', 14, 3, 'GAS-01', 'Bau gas / terindikasi kebocoran gas atau CO2', 1, 0, 'Pengecekan saluran CO2 yang terindikasi bocor', '2026-07-19 05:37:24'),
(67, 'Gas / CO2', 14, 3, 'GAS-02', 'Tekanan gas naik-turun / tidak stabil', 2, 1, 'Indikator pressure gas naik turun', '2026-07-19 05:37:24'),
(68, 'Gas / CO2', 14, 3, 'GAS-03', 'Tabung CO2 habis, perlu isi ulang', 2, 1, 'Isi ulang CO2', '2026-07-19 05:37:24'),
(69, 'Eksterior / Sipil', 15, 4, 'EKS-01', 'Jalan / lantai luar amblas atau berlubang', 2, 1, 'perbaikan jalan amblas area entrance', '2026-07-19 05:37:24'),
(70, 'Eksterior / Sipil', 15, 4, 'EKS-02', 'Lantai kolam terlepas', 2, 1, 'Lantai kolam renang terlepas', '2026-07-19 05:37:24'),
(71, 'Eksterior / Sipil', 15, 4, 'EKS-03', 'Batu kolam / tutup bak kontrol pecah', 3, 1, 'Batu di tutup bak kontrol pecah', '2026-07-19 05:37:24'),
(72, 'Eksterior / Sipil', 15, 4, 'EKS-04', 'Aspal / paving area depan rusak', 3, 1, 'tambal aspal depan Braci', '2026-07-19 05:37:24');

-- --------------------------------------------------------

--
-- Table structure for table `kategori_kendala`
--

CREATE TABLE `kategori_kendala` (
  `id` int(10) UNSIGNED NOT NULL,
  `nama` varchar(100) NOT NULL,
  `user_id` tinyint(3) UNSIGNED NOT NULL DEFAULT 3
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kategori_kendala`
--

INSERT INTO `kategori_kendala` (`id`, `nama`, `user_id`) VALUES
(1, 'Kelistrikan', 3),
(2, 'AC Ruangan', 3),
(3, 'Pendingin Komersial', 3),
(4, 'Air / Plumbing', 3),
(5, 'Atap / Plafon', 4),
(6, 'Pintu / Kunci', 4),
(7, 'Furnitur', 4),
(8, 'Pencahayaan', 4),
(9, 'Dinding / Lantai', 4),
(10, 'Peralatan Dapur', 3),
(11, 'Ventilasi / Exhaust', 3),
(12, 'IT & AV', 3),
(13, 'Signage / Display', 4),
(14, 'Gas / CO2', 3),
(15, 'Eksterior / Sipil', 4);

-- --------------------------------------------------------

--
-- Table structure for table `kendala_items`
--

CREATE TABLE `kendala_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `tiket_id` varchar(100) DEFAULT NULL,
  `foto_url` text DEFAULT NULL,
  `keterangan` text NOT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lon` decimal(10,7) DEFAULT NULL,
  `photo_taken_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kendala_items`
--

INSERT INTO `kendala_items` (`id`, `tiket_id`, `foto_url`, `keterangan`, `lat`, `lon`, `photo_taken_at`, `created_at`) VALUES
(8, 'TKT-220726-001', 'uploads/laporan/kendala_1784676729_6a600179f22ec.jpeg', 'Ac pantry & pastry rusak tidak mau nyala', -6.9242655, 107.7383298, NULL, '2026-07-21 23:32:09'),
(9, 'TKT-220726-002', 'uploads/laporan/kendala_1784676759_6a600197b752d.jpeg', 'AC R HRD tidak dingin', -6.9242655, 107.7383298, NULL, '2026-07-21 23:32:39'),
(10, 'TKT-220726-003', 'uploads/laporan/kendala_1784676832_6a6001e038bcd.jpeg', 'dinding area pavillion ada retakan', -6.9242655, 107.7383298, NULL, '2026-07-21 23:33:52'),
(11, 'TKT-220726-003', 'uploads/laporan/kendala_1784676832_6a6001e039372.jpeg', 'sebelah nya juga retak', -6.9242655, 107.7383298, NULL, '2026-07-21 23:33:52'),
(12, 'TKT-220726-004', 'uploads/laporan/kendala_1784676862_6a6001fedd5c3.jpeg', '\nSaluran pembuangan kitchen mampet', -6.9242655, 107.7383298, NULL, '2026-07-21 23:34:22'),
(13, 'TKT-220726-005', 'uploads/laporan/kendala_1784676922_6a60023a22159.jpeg', 'Plafon Entrance Braci terbuka sedikit', -6.9242655, 107.7383298, NULL, '2026-07-21 23:35:22'),
(14, 'TKT-220726-006', 'uploads/laporan/kendala_1784678496_6a600860bfd3f.jpeg', 'tambal aspal depan', -6.9242655, 107.7383298, NULL, '2026-07-22 00:01:36'),
(15, 'TKT-220726-007', 'uploads/laporan/kendala_1784678557_6a60089d36593.jpeg', 'POS gak ada power', -6.9242655, 107.7383298, NULL, '2026-07-22 00:02:37'),
(16, 'TKT-220726-007', 'uploads/laporan/kendala_1784678557_6a60089d36ff6.jpeg', 'perbaikan pos down', -6.9242655, 107.7383298, NULL, '2026-07-22 00:02:37'),
(17, 'TKT-220726-008', 'uploads/laporan/kendala_1784678640_6a6008f077c1d.jpeg', 'lantai depan pintu kitchen terkelupas; keramik lepas hideout', -6.9242655, 107.7383298, NULL, '2026-07-22 00:04:00'),
(18, 'TKT-220726-009', 'uploads/laporan/kendala_1784678714_6a60093acad4b.jpeg', 'AC R.purchasing sensor rusak harus ganti', -6.9242655, 107.7383298, NULL, '2026-07-22 00:05:14'),
(19, 'TKT-220726-010', 'uploads/laporan/kendala_1784684486_6a601fc65b335.jpeg', 'Lantai kolam renang terlepas', -6.9242655, 107.7383298, NULL, '2026-07-22 01:41:26'),
(20, 'TKT-220726-011', 'uploads/laporan/kendala_1784684558_6a60200eb20b6.jpeg', 'CCTV depan Braci burem; CCTV ch12 jalur putu', -6.9242655, 107.7383298, NULL, '2026-07-22 01:42:38'),
(21, 'TKT-280726-001', 'uploads/laporan/kendala_1785181000_6a67b3481b37b.jpeg', 'filter AC lt2 kotor', -6.7411490, 108.5645830, NULL, '2026-07-27 19:36:40'),
(22, 'TKT-280726-001', 'uploads/laporan/kendala_1785181000_6a67b3481cc34.jpeg', 'hideout kotor', -6.7411490, 108.5645830, NULL, '2026-07-27 19:36:40'),
(23, 'TKT-280726-002', 'uploads/laporan/kendala_1785182020_6a67b744281c7.jpeg', 'area bawah ice bin & sink bar banjir', -6.7411490, 108.5645830, NULL, '2026-07-27 19:53:40'),
(24, 'TKT-280726-003', 'uploads/laporan/kendala_1785203535_6a680b4f358ac.jpeg', 'Test error 1', -6.7413146, 108.5646754, NULL, '2026-07-28 01:52:15'),
(25, 'TKT-280726-003', 'uploads/laporan/kendala_1785203535_6a680b4f36029.jpeg', 'Test error 2', -6.7413146, 108.5646754, NULL, '2026-07-28 01:52:15'),
(26, 'TKT-280726-004', 'uploads/laporan/kendala_1785203563_6a680b6bccf56.jpeg', 'Test error 3', -6.7413146, 108.5646754, NULL, '2026-07-28 01:52:43'),
(27, 'TKT-280726-005', 'uploads/laporan/kendala_1785203582_6a680b7eade91.jpeg', 'Test error 4', -6.7413146, 108.5646754, NULL, '2026-07-28 01:53:02'),
(28, 'TKT-280726-006', 'uploads/laporan/kendala_1785203600_6a680b90a7330.jpeg', 'Test error 5', -6.7413146, 108.5646754, NULL, '2026-07-28 01:53:20'),
(29, 'TKT-280726-007', 'uploads/TKT-280726-007/laporan/kendala_1785205341_6a68125d6e4c8.jpeg', 'Perlu cleaning', -6.7413146, 108.5646754, NULL, '2026-07-28 02:22:21'),
(30, 'TKT-280726-008', 'uploads/TKT-280726-008/laporan/kendala_1785205463_6a6812d78b783.jpeg', 'Coba coba', -6.7413146, 108.5646754, NULL, '2026-07-28 02:24:23'),
(31, 'TKT-280726-009', 'uploads/TKT-280726-009/laporan/kendala_1785208511_6a681ebf4bf91.jpeg', 'Ac ga dingin', -6.7413146, 108.5646754, NULL, '2026-07-28 03:15:11'),
(32, 'TKT-280726-010', 'uploads/TKT-280726-010/laporan/kendala_1785208769_6a681fc11a7fa.jpeg', 'Rusak', -6.7413146, 108.5646754, NULL, '2026-07-28 03:19:29'),
(33, 'TKT-280726-011', 'uploads/TKT-280726-011/laporan/kendala_1785208809_6a681fe9b5635.jpeg', 'Ac mati', -6.7413146, 108.5646754, NULL, '2026-07-28 03:20:09'),
(34, 'TKT-280726-012', 'uploads/TKT-280726-012/laporan/kendala_1785208849_6a682011ccf70.jpeg', 'Ga dingin', -6.7413146, 108.5646754, NULL, '2026-07-28 03:20:49');

-- --------------------------------------------------------

--
-- Table structure for table `laporan_kendala`
--

CREATE TABLE `laporan_kendala` (
  `id` int(10) UNSIGNED NOT NULL,
  `tiket_id` varchar(100) NOT NULL,
  `outlet_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` enum('dijadwalkan','sedang_dikerjakan','selesai_dikerjakan','terverifikasi','tunggu_barang','barang_diproses','barang_ready','over_sla') NOT NULL DEFAULT 'dijadwalkan',
  `prev_status` enum('dijadwalkan','sedang_dikerjakan','selesai_dikerjakan','terverifikasi','tunggu_barang','barang_diproses','barang_ready','over_sla') DEFAULT NULL,
  `level` enum('L1','L2','L3') DEFAULT NULL,
  `gejala_id` varchar(10) DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lon` decimal(10,7) DEFAULT NULL,
  `accuracy` int(10) UNSIGNED DEFAULT NULL,
  `address` text DEFAULT NULL,
  `total_kendala` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `device` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
  `updated_at` datetime NOT NULL DEFAULT '2000-01-01 00:00:00' ON UPDATE current_timestamp(),
  `nama_petugas` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `laporan_kendala`
--

INSERT INTO `laporan_kendala` (`id`, `tiket_id`, `outlet_id`, `user_id`, `status`, `prev_status`, `level`, `gejala_id`, `lat`, `lon`, `accuracy`, `address`, `total_kendala`, `device`, `created_at`, `updated_at`, `nama_petugas`) VALUES
(8, 'TKT-220726-001', 1, 3, 'selesai_dikerjakan', 'selesai_dikerjakan', 'L1', 'ACR-01', -6.9242655, 107.7383298, 107, 'Cimekar, Cileunyi, Kabupaten Bandung, West Java, 40624, Indonesia', 1, 'Windows 10 / Chrome 150', '2026-07-22 06:31:59', '2026-07-28 04:40:03', 'Hadi'),
(9, 'TKT-220726-002', 2, 3, 'tunggu_barang', NULL, 'L2', 'ACR-03', -6.9242655, 107.7383298, 107, 'Cimekar, Cileunyi, Kabupaten Bandung, West Java, 40624, Indonesia', 1, 'Windows 10 / Chrome 150', '2026-07-18 06:32:26', '2026-07-28 03:56:27', NULL),
(10, 'TKT-220726-003', 2, 4, 'tunggu_barang', NULL, 'L3', 'DKL-02', -6.9242655, 107.7383298, 107, 'Cimekar, Cileunyi, Kabupaten Bandung, West Java, 40624, Indonesia', 2, 'Windows 10 / Chrome 150', '2026-07-22 06:33:07', '2026-07-28 04:31:20', 'Joe'),
(11, 'TKT-220726-004', 3, 3, 'selesai_dikerjakan', 'selesai_dikerjakan', 'L1', 'AIR-01', -6.9242655, 107.7383298, 107, 'Cimekar, Cileunyi, Kabupaten Bandung, West Java, 40624, Indonesia', 1, 'Windows 10 / Chrome 150', '2026-07-21 06:33:56', '2026-07-28 04:36:06', 'Hadi'),
(12, 'TKT-220726-005', 1, 4, 'tunggu_barang', NULL, 'L3', 'ATP-03', -6.9242655, 107.7383298, 107, 'Cimekar, Cileunyi, Kabupaten Bandung, West Java, 40624, Indonesia', 1, 'Windows 10 / Chrome 150', '2026-07-22 06:34:27', '2026-07-28 05:48:15', NULL),
(13, 'TKT-220726-006', 3, 4, 'barang_ready', NULL, 'L3', 'EKS-04', -6.9242655, 107.7383298, 107, 'Cimekar, Cileunyi, Kabupaten Bandung, West Java, 40624, Indonesia', 1, 'Windows 10 / Chrome 150', '2026-07-22 06:57:44', '2026-07-28 10:13:03', NULL),
(14, 'TKT-220726-007', 2, 3, 'terverifikasi', NULL, 'L1', 'ITA-01', -6.9242655, 107.7383298, 107, 'Cimekar, Cileunyi, Kabupaten Bandung, West Java, 40624, Indonesia', 2, 'Windows 10 / Chrome 150', '2026-07-22 07:02:04', '2026-07-28 00:31:14', 'Asd'),
(15, 'TKT-220726-008', 1, 4, 'selesai_dikerjakan', 'selesai_dikerjakan', 'L2', 'DKL-03', -6.9242655, 107.7383298, 107, 'Cimekar, Cileunyi, Kabupaten Bandung, West Java, 40624, Indonesia', 1, 'Windows 10 / Chrome 150', '2026-07-22 07:03:37', '2026-07-28 09:27:33', 'Joe'),
(16, 'TKT-220726-009', 3, 3, 'over_sla', NULL, 'L2', 'ACR-05', -6.9242655, 107.7383298, 107, 'Cimekar, Cileunyi, Kabupaten Bandung, West Java, 40624, Indonesia', 1, 'Windows 10 / Chrome 150', '2026-07-22 07:04:48', '2026-07-28 04:36:16', NULL),
(17, 'TKT-220726-010', 2, 4, 'selesai_dikerjakan', 'over_sla', 'L2', 'EKS-02', -6.9242655, 107.7383298, 107, 'Cimekar, Cileunyi, Kabupaten Bandung, West Java, 40624, Indonesia', 1, NULL, '2026-07-22 08:41:14', '2026-07-28 04:30:33', 'Hadi'),
(18, 'TKT-220726-011', 3, 3, 'barang_ready', NULL, 'L2', 'ITA-04', -6.9242655, 107.7383298, 107, 'Cimekar, Cileunyi, Kabupaten Bandung, West Java, 40624, Indonesia', 1, NULL, '2026-07-22 08:42:25', '2026-07-28 04:36:02', NULL),
(19, 'TKT-280726-001', 1, 3, 'selesai_dikerjakan', 'selesai_dikerjakan', 'L3', 'ACR-06', -6.7411490, 108.5645830, 31, 'Larangan, Harjamukti, Cirebon, West Java, 45142, Indonesia', 2, NULL, '2026-07-28 02:36:40', '2026-07-28 04:38:29', 'Hadi'),
(20, 'TKT-280726-002', 2, 3, 'selesai_dikerjakan', 'selesai_dikerjakan', 'L1', 'AIR-02', -6.7411490, 108.5645830, 31, 'Larangan, Harjamukti, Cirebon, West Java, 45142, Indonesia', 1, NULL, '2026-07-28 02:53:40', '2026-07-28 04:25:26', 'Asd'),
(21, 'TKT-280726-003', 1, 3, 'selesai_dikerjakan', 'barang_ready', 'L1', 'ACR-02', -6.7413146, 108.5646754, 20, 'Larangan, Harjamukti, Cirebon, Jawa Barat, 45113, Indonesia', 2, NULL, '2026-07-28 08:52:15', '2026-07-28 09:28:40', 'Joe'),
(22, 'TKT-280726-004', 1, 3, 'barang_diproses', NULL, 'L2', 'ACR-03', -6.7413146, 108.5646754, 20, 'Larangan, Harjamukti, Cirebon, Jawa Barat, 45113, Indonesia', 1, NULL, '2026-07-28 08:52:43', '2026-07-28 09:25:58', NULL),
(23, 'TKT-280726-005', 1, 3, 'barang_diproses', NULL, 'L2', 'ACR-03', -6.7413146, 108.5646754, 20, 'Larangan, Harjamukti, Cirebon, Jawa Barat, 45113, Indonesia', 1, NULL, '2026-07-28 08:53:02', '2026-07-28 09:25:56', NULL),
(24, 'TKT-280726-006', 1, 3, 'barang_diproses', NULL, 'L2', 'ACR-04', -6.7413146, 108.5646754, 20, 'Larangan, Harjamukti, Cirebon, Jawa Barat, 45113, Indonesia', 1, NULL, '2026-07-28 08:53:20', '2026-07-28 09:25:54', NULL),
(25, 'TKT-280726-007', 1, 3, 'barang_ready', NULL, 'L3', 'ACR-06', -6.7413146, 108.5646754, 20, 'Larangan, Harjamukti, Cirebon, Jawa Barat, 45113, Indonesia', 1, NULL, '2026-07-28 09:22:21', '2026-07-28 10:18:31', NULL),
(26, 'TKT-280726-008', 1, 3, 'selesai_dikerjakan', 'selesai_dikerjakan', 'L1', 'ACR-02', -6.7413146, 108.5646754, 20, 'Larangan, Harjamukti, Cirebon, Jawa Barat, 45113, Indonesia', 1, NULL, '2026-07-28 09:24:23', '2026-07-28 09:26:17', 'Joe'),
(27, 'TKT-280726-009', 3, 3, 'selesai_dikerjakan', 'selesai_dikerjakan', 'L2', 'ACR-03', -6.7413146, 108.5646754, 20, 'Larangan, Harjamukti, Cirebon, Jawa Barat, 45113, Indonesia', 1, NULL, '2026-07-28 10:15:11', '2026-07-28 10:16:56', 'Joe'),
(28, 'TKT-280726-010', 2, 3, 'dijadwalkan', NULL, 'L3', 'ACR-06', -6.7413146, 108.5646754, 20, 'Larangan, Harjamukti, Cirebon, Jawa Barat, 45113, Indonesia', 1, NULL, '2026-07-28 10:19:29', '2000-01-01 00:00:00', NULL),
(29, 'TKT-280726-011', 2, 3, 'dijadwalkan', NULL, 'L1', 'ACR-01', -6.7413146, 108.5646754, 20, 'Larangan, Harjamukti, Cirebon, Jawa Barat, 45113, Indonesia', 1, NULL, '2026-07-28 10:20:09', '2000-01-01 00:00:00', NULL),
(30, 'TKT-280726-012', 2, 3, 'dijadwalkan', NULL, 'L2', 'ACR-03', -6.7413146, 108.5646754, 20, 'Larangan, Harjamukti, Cirebon, Jawa Barat, 45113, Indonesia', 1, NULL, '2026-07-28 10:20:49', '2000-01-01 00:00:00', NULL);

--
-- Triggers `laporan_kendala`
--
DELIMITER $$
CREATE TRIGGER `sync_jadwal_on_created_at` AFTER UPDATE ON `laporan_kendala` FOR EACH ROW BEGIN
  IF NEW.created_at <> OLD.created_at THEN
    SET @sla_hours = CASE NEW.level
      WHEN 'L1' THEN 24
      WHEN 'L2' THEN 72
      WHEN 'L3' THEN 120
      ELSE NULL
    END;
    SET @deadline = IF(@sla_hours IS NOT NULL,
      DATE_ADD(NEW.created_at, INTERVAL @sla_hours HOUR),
      NULL
    );
    
    SET @deadline = IF(@deadline IS NOT NULL AND DAYOFWEEK(@deadline) = 1,
      DATE_ADD(@deadline, INTERVAL 24 HOUR),
      @deadline
    );
    UPDATE jadwal_kendala
    SET schedule_date = NEW.created_at,
        deadline_date = @deadline,
        updated_at    = NOW()
    WHERE tiket_id = NEW.tiket_id;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `laporan_pengadaan`
--

CREATE TABLE `laporan_pengadaan` (
  `id` int(10) UNSIGNED NOT NULL,
  `tiket_id` varchar(32) NOT NULL,
  `outlet_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `nama_petugas` varchar(255) DEFAULT NULL,
  `alasan` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `laporan_pengadaan`
--

INSERT INTO `laporan_pengadaan` (`id`, `tiket_id`, `outlet_id`, `user_id`, `nama_petugas`, `alasan`, `created_at`) VALUES
(2, 'TKT-220726-008', 1, 4, 'Samsul', '[\"Butuh Anggaran\",\"Perlu Waktu\",\"Menunggu Sparepart\\/Vendor\"]', '2026-07-23 15:56:20'),
(3, 'TKT-220726-011', 3, 3, 'Asd', '[\"Menunggu Sparepart\\/Vendor\"]', '2026-07-24 02:15:27'),
(4, 'TKT-220726-001', 1, 3, 'Asd', '[\"Menunggu Sparepart\\/Vendor\"]', '2026-07-28 02:56:19'),
(5, 'TKT-280726-002', 2, 3, 'Asd', '[\"Menunggu Sparepart\\/Vendor\"]', '2026-07-28 03:23:23'),
(6, 'TKT-220726-002', 2, 3, 'Asd', '[\"Butuh Anggaran\",\"Menunggu Sparepart\\/Vendor\"]', '2026-07-28 03:56:27'),
(7, 'TKT-220726-003', 2, 4, 'Asd', '[\"Butuh Anggaran\"]', '2026-07-28 04:31:20'),
(8, 'TKT-220726-005', 1, 4, 'Joe', '[\"Butuh Anggaran\"]', '2026-07-28 05:48:15'),
(9, 'TKT-280726-003', 1, 3, 'Joe', '[\"Butuh Anggaran\"]', '2026-07-28 09:06:13'),
(10, 'TKT-280726-004', 1, 3, 'Joe', '[\"Perlu Waktu\"]', '2026-07-28 09:06:54'),
(11, 'TKT-280726-005', 1, 3, 'Joe', '[\"Menunggu Sparepart\\/Vendor\"]', '2026-07-28 09:07:10'),
(12, 'TKT-280726-006', 1, 3, 'Joe', '[\"Butuh Anggaran\",\"Perlu Waktu\",\"Menunggu Sparepart\\/Vendor\"]', '2026-07-28 09:11:38'),
(13, 'TKT-280726-007', 1, 3, 'Joe', '[\"Butuh Anggaran\",\"Perlu Waktu\",\"Menunggu Sparepart\\/Vendor\"]', '2026-07-28 09:23:16'),
(14, 'TKT-220726-006', 3, 4, 'asd', '[\"Perlu Waktu\",\"Menunggu Sparepart\\/Vendor\",\"Butuh Anggaran\"]', '2026-07-28 10:12:45'),
(15, 'TKT-280726-009', 3, 3, 'Joe', '[\"Butuh Anggaran\",\"Perlu Waktu\",\"Menunggu Sparepart\\/Vendor\"]', '2026-07-28 10:15:54');

-- --------------------------------------------------------

--
-- Table structure for table `laporan_perbaikan`
--

CREATE TABLE `laporan_perbaikan` (
  `id` int(10) UNSIGNED NOT NULL,
  `tiket_id` varchar(100) DEFAULT NULL,
  `nama_petugas` varchar(255) DEFAULT NULL,
  `outlet_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `keterangan_perbaikan` text DEFAULT NULL,
  `butuh_barang` tinyint(1) NOT NULL DEFAULT 0,
  `status_barang` enum('belum tersedia','sudah tersedia') DEFAULT NULL,
  `detail_barang` text DEFAULT NULL,
  `foto_barang_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`foto_barang_url`)),
  `foto_before_id` varchar(255) DEFAULT NULL,
  `foto_after_id` text DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lon` decimal(10,7) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `laporan_perbaikan`
--

INSERT INTO `laporan_perbaikan` (`id`, `tiket_id`, `nama_petugas`, `outlet_id`, `user_id`, `keterangan_perbaikan`, `butuh_barang`, `status_barang`, `detail_barang`, `foto_barang_url`, `foto_before_id`, `foto_after_id`, `lat`, `lon`, `created_at`, `updated_at`) VALUES
(1, 'TKT-220726-008', 'Samsul', 1, 4, '[\"Mantap\"]', 1, 'belum tersedia', '[\"set kursi\",\"set meja\"]', '[\"uploads\\/pengadaan\\/barang_1784796980_6a61d73427b36.jpeg\",\"uploads\\/pengadaan\\/barang_1784796980_6a61d734289b8.jpeg\"]', 'uploads/TKT-220726-008/perbaikan/before_1785205641_6a681389dc358.webp', '[\"uploads\\/TKT-220726-008\\/perbaikan\\/after_1785205641_6a681389dc8c3.webp\",\"uploads\\/TKT-220726-008\\/perbaikan\\/after_1785205641_6a681389dcc29.webp\",\"uploads\\/TKT-220726-008\\/perbaikan\\/after_1785205641_6a681389dd142.webp\"]', -6.9242655, 107.7383298, '2026-07-23 15:56:20', '2026-07-28 09:27:21'),
(2, 'TKT-220726-007', 'Asd', 2, 3, '[\"Revisi Oke\"]', 0, 'sudah tersedia', NULL, NULL, 'uploads/perbaikan/before_1784827563_6a624eab74279.jpeg', '[\"uploads\\/perbaikan\\/after_1784827563_6a624eab74560.jpeg\",\"uploads\\/perbaikan\\/after_1784827563_6a624eab74919.jpeg\",\"uploads\\/perbaikan\\/after_1784827563_6a624eab74fd5.jpeg\"]', -6.9242567, 107.7383216, '2026-07-23 23:26:12', '2026-07-24 00:26:03'),
(3, 'TKT-220726-004', 'Asd', 3, 3, '[\"Saluran Pembuangan sudah lancar\"]', 0, 'sudah tersedia', NULL, NULL, 'uploads/perbaikan/before_1784829702_6a625706b1002.jpeg', '[\"uploads\\/perbaikan\\/after_1784829702_6a625706b1580.jpeg\",\"uploads\\/perbaikan\\/after_1784829702_6a625706b1a02.jpeg\",\"uploads\\/perbaikan\\/after_1784829702_6a625706b1ec3.jpeg\"]', -6.9242655, 107.7383275, '2026-07-24 01:01:42', '2026-07-24 01:01:42'),
(4, 'TKT-220726-011', 'Asd', 3, 3, '[]', 1, 'sudah tersedia', '[\"Butuh ganti lensa dan kabel\"]', '[\"uploads\\/pengadaan\\/barang_1784834127_6a62684f3b526.jpeg\"]', NULL, NULL, -6.9242655, 107.7383275, '2026-07-24 02:15:27', '2026-07-24 02:15:27'),
(5, 'TKT-280726-001', 'Asd', 1, 3, '[\"Semua sudah done\"]', 0, 'sudah tersedia', NULL, NULL, 'uploads/perbaikan/before_1785181952_6a67b700347ac.jpeg', '[\"uploads\\/perbaikan\\/after_1785181952_6a67b700352bc.jpeg\",\"uploads\\/perbaikan\\/after_1785181952_6a67b700356e6.jpeg\",\"uploads\\/perbaikan\\/after_1785181952_6a67b70035a3c.jpeg\"]', -6.7411490, 108.5645830, '2026-07-28 02:52:32', '2026-07-28 02:52:32'),
(6, 'TKT-220726-001', 'Asd', 1, 3, '[\"dasdasdada\"]', 1, 'sudah tersedia', '[\"butuh barang kunci L\",\"butuh barang kunci 12\"]', '[\"uploads\\/pengadaan\\/barang_1785182179_6a67b7e3dbf3c.jpeg\",\"uploads\\/pengadaan\\/barang_1785182179_6a67b7e3dc750.jpeg\"]', 'uploads/perbaikan/before_1785183739_6a67bdfb701ab.jpeg', '[\"uploads\\/perbaikan\\/after_1785183739_6a67bdfb70558.jpeg\",\"uploads\\/perbaikan\\/after_1785183739_6a67bdfb708c3.jpeg\",\"uploads\\/perbaikan\\/after_1785183739_6a67bdfb70c01.jpeg\"]', -6.7411490, 108.5645830, '2026-07-28 02:56:19', '2026-07-28 03:22:19'),
(7, 'TKT-280726-002', 'Asd', 2, 3, '[\"bgbgbg\"]', 1, 'sudah tersedia', '[\"gagagaga\"]', '[\"uploads\\/pengadaan\\/barang_1785183803_6a67be3bef8f4.jpeg\"]', 'uploads/perbaikan/before_1785185847_6a67c63782976.jpeg', '[\"uploads\\/perbaikan\\/after_1785185847_6a67c63782c61.jpeg\",\"uploads\\/perbaikan\\/after_1785185847_6a67c63782f6f.jpeg\",\"uploads\\/perbaikan\\/after_1785185847_6a67c63783293.jpeg\"]', -6.7411490, 108.5645830, '2026-07-28 03:23:24', '2026-07-28 03:57:27'),
(8, 'TKT-220726-002', 'Asd', 2, 3, '[]', 1, 'belum tersedia', '[\"baasdasa\"]', '[\"uploads\\/pengadaan\\/barang_1785185787_6a67c5fbe3194.jpeg\"]', NULL, NULL, -6.7411490, 108.5645830, '2026-07-28 03:56:27', '2026-07-28 03:56:27'),
(9, 'TKT-220726-010', 'Hadi', 2, 4, '[\"Hjkjbvh\"]', 0, 'sudah tersedia', NULL, NULL, 'uploads/perbaikan/before_1785187833_6a67cdf9e8042.jpeg', '[\"uploads\\/perbaikan\\/after_1785187833_6a67cdf9e8315.jpeg\",\"uploads\\/perbaikan\\/after_1785187833_6a67cdf9e861a.jpeg\",\"uploads\\/perbaikan\\/after_1785187833_6a67cdf9e89f4.jpeg\"]', -6.7411107, 108.5645303, '2026-07-28 04:30:33', '2026-07-28 04:30:33'),
(10, 'TKT-220726-003', 'Asd', 2, 4, '[]', 1, 'belum tersedia', '[\"asdas\"]', '[\"uploads\\/pengadaan\\/barang_1785187880_6a67ce287bb15.jpeg\"]', NULL, NULL, -6.7411490, 108.5645830, '2026-07-28 04:31:20', '2026-07-28 04:31:20'),
(11, 'TKT-220726-005', 'Joe', 1, 4, '[]', 1, 'belum tersedia', '[\"Gorden\"]', '[\"uploads\\/pengadaan\\/barang_1785192495_6a67e02f22d00.jpeg\"]', NULL, NULL, -6.7410820, 108.5645178, '2026-07-28 05:48:15', '2026-07-28 05:48:15'),
(12, 'TKT-280726-003', 'Joe', 1, 3, '[\"Sipsip\"]', 1, 'sudah tersedia', '[\"Butuh gunting\",\"Butuh obeng\"]', '[\"uploads\\/pengadaan\\/barang_1785204373_6a680e95918f7.jpeg\",\"uploads\\/pengadaan\\/barang_1785204373_6a680e959226a.jpeg\"]', 'uploads/TKT-280726-003/perbaikan/before_1785205720_6a6813d8e456e.webp', '[\"uploads\\/TKT-280726-003\\/perbaikan\\/after_1785205720_6a6813d8e5065.webp\",\"uploads\\/TKT-280726-003\\/perbaikan\\/after_1785205720_6a6813d8e5ae1.webp\",\"uploads\\/TKT-280726-003\\/perbaikan\\/after_1785205720_6a6813d8e64eb.webp\"]', -6.7413160, 108.5646750, '2026-07-28 09:06:13', '2026-07-28 09:28:40'),
(13, 'TKT-280726-004', 'Joe', 1, 3, '[]', 1, 'belum tersedia', '[\"Butuh tang\"]', '[\"uploads\\/pengadaan\\/barang_1785204414_6a680ebeb3b2e.jpeg\"]', NULL, NULL, -6.7413151, 108.5646848, '2026-07-28 09:06:54', '2026-07-28 09:06:54'),
(14, 'TKT-280726-005', 'Joe', 1, 3, '[]', 1, 'belum tersedia', '[\"Tunggu sparepart\"]', '[\"uploads\\/pengadaan\\/barang_1785204430_6a680eced979c.jpeg\"]', NULL, NULL, -6.7413139, 108.5646775, '2026-07-28 09:07:10', '2026-07-28 09:07:10'),
(15, 'TKT-280726-006', 'Joe', 1, 3, '[]', 1, 'belum tersedia', '[\"Perkakas\"]', '[\"uploads\\/pengadaan\\/barang_1785204698_6a680fda7e63c.webp\"]', NULL, NULL, -6.7413152, 108.5646754, '2026-07-28 09:11:38', '2026-07-28 09:11:38'),
(16, 'TKT-280726-007', 'Joe', 1, 3, '[]', 1, 'sudah tersedia', '[\"Peralatan\"]', '[\"uploads\\/TKT-280726-007\\/pengadaan\\/barang_1785205396_6a68129465e51.webp\"]', NULL, NULL, -6.7410969, 108.5645577, '2026-07-28 09:23:16', '2026-07-28 10:18:31'),
(17, 'TKT-280726-008', 'Joe', 1, 3, '[\"Sudah aman\"]', 0, 'sudah tersedia', NULL, NULL, 'uploads/TKT-280726-008/perbaikan/before_1785205491_6a6812f3aed55.webp', '[\"uploads\\/TKT-280726-008\\/perbaikan\\/after_1785205491_6a6812f3af181.webp\",\"uploads\\/TKT-280726-008\\/perbaikan\\/after_1785205491_6a6812f3af500.webp\",\"uploads\\/TKT-280726-008\\/perbaikan\\/after_1785205491_6a6812f3af9e6.webp\"]', -6.7413113, 108.5646746, '2026-07-28 09:24:51', '2026-07-28 09:24:51'),
(18, 'TKT-220726-006', 'asd', 3, 4, '[]', 1, 'sudah tersedia', '[\"COba Lagi\"]', '[\"uploads\\/TKT-220726-006\\/pengadaan\\/barang_1785208365_6a681e2d97d53.webp\"]', NULL, NULL, -6.7411490, 108.5645830, '2026-07-28 10:12:45', '2026-07-28 10:13:03'),
(19, 'TKT-280726-009', 'Joe', 3, 3, '[\"Sudah dingin kaya salju\"]', 1, 'sudah tersedia', '[\"Test dong\"]', '[\"uploads\\/TKT-280726-009\\/pengadaan\\/barang_1785208554_6a681eeae4d23.webp\"]', 'uploads/TKT-280726-009/perbaikan/before_1785208602_6a681f1acfd23.webp', '[\"uploads\\/TKT-280726-009\\/perbaikan\\/after_1785208602_6a681f1ad0161.webp\",\"uploads\\/TKT-280726-009\\/perbaikan\\/after_1785208602_6a681f1ad04c0.webp\",\"uploads\\/TKT-280726-009\\/perbaikan\\/after_1785208602_6a681f1ad0907.webp\"]', -6.7413167, 108.5646851, '2026-07-28 10:15:54', '2026-07-28 10:16:42');

-- --------------------------------------------------------

--
-- Table structure for table `outlets`
--

CREATE TABLE `outlets` (
  `id` int(10) UNSIGNED NOT NULL,
  `kode` varchar(50) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `alamat` text DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lon` decimal(10,7) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `outlets`
--

INSERT INTO `outlets` (`id`, `kode`, `nama`, `alamat`, `lat`, `lon`, `status`, `created_at`, `updated_at`) VALUES
(1, 'BRACI', 'BRACI', NULL, NULL, NULL, 'active', '2026-07-17 09:02:28', '2026-07-17 09:02:28'),
(2, 'OPIUCI', 'OPIUCI', NULL, NULL, NULL, 'active', '2026-07-17 09:02:28', '2026-07-17 09:02:28'),
(3, 'TANATAP', 'TANATAP', NULL, NULL, NULL, 'active', '2026-07-17 09:02:28', '2026-07-21 22:36:23');

-- --------------------------------------------------------

--
-- Table structure for table `pengadaan_items`
--

CREATE TABLE `pengadaan_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `tiket_id` varchar(32) NOT NULL,
  `foto_barang_url` longtext DEFAULT NULL,
  `detail_barang` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pengadaan_items`
--

INSERT INTO `pengadaan_items` (`id`, `tiket_id`, `foto_barang_url`, `detail_barang`, `created_at`) VALUES
(3, 'TKT-220726-008', 'uploads/pengadaan/barang_1784796980_6a61d73427b36.jpeg', 'set kursi', '2026-07-23 15:56:20'),
(4, 'TKT-220726-008', 'uploads/pengadaan/barang_1784796980_6a61d734289b8.jpeg', 'set meja', '2026-07-23 15:56:20'),
(5, 'TKT-220726-011', 'uploads/pengadaan/barang_1784834127_6a62684f3b526.jpeg', 'Butuh ganti lensa dan kabel', '2026-07-24 02:15:27'),
(6, 'TKT-220726-001', 'uploads/pengadaan/barang_1785182179_6a67b7e3dbf3c.jpeg', 'butuh barang kunci L', '2026-07-28 02:56:19'),
(7, 'TKT-220726-001', 'uploads/pengadaan/barang_1785182179_6a67b7e3dc750.jpeg', 'butuh barang kunci 12', '2026-07-28 02:56:19'),
(8, 'TKT-280726-002', 'uploads/pengadaan/barang_1785183803_6a67be3bef8f4.jpeg', 'gagagaga', '2026-07-28 03:23:23'),
(9, 'TKT-220726-002', 'uploads/pengadaan/barang_1785185787_6a67c5fbe3194.jpeg', 'baasdasa', '2026-07-28 03:56:27'),
(10, 'TKT-220726-003', 'uploads/pengadaan/barang_1785187880_6a67ce287bb15.jpeg', 'asdas', '2026-07-28 04:31:20'),
(11, 'TKT-220726-005', 'uploads/pengadaan/barang_1785192495_6a67e02f22d00.jpeg', 'Gorden', '2026-07-28 05:48:15'),
(12, 'TKT-280726-003', 'uploads/pengadaan/barang_1785204373_6a680e95918f7.jpeg', 'Butuh gunting', '2026-07-28 09:06:13'),
(13, 'TKT-280726-003', 'uploads/pengadaan/barang_1785204373_6a680e959226a.jpeg', 'Butuh obeng', '2026-07-28 09:06:13'),
(14, 'TKT-280726-004', 'uploads/pengadaan/barang_1785204414_6a680ebeb3b2e.jpeg', 'Butuh tang', '2026-07-28 09:06:54'),
(15, 'TKT-280726-005', 'uploads/pengadaan/barang_1785204430_6a680eced979c.jpeg', 'Tunggu sparepart', '2026-07-28 09:07:10'),
(16, 'TKT-280726-006', 'uploads/pengadaan/barang_1785204698_6a680fda7e63c.webp', 'Perkakas', '2026-07-28 09:11:38'),
(17, 'TKT-280726-007', 'uploads/TKT-280726-007/pengadaan/barang_1785205396_6a68129465e51.webp', 'Peralatan', '2026-07-28 09:23:16'),
(18, 'TKT-220726-006', 'uploads/TKT-220726-006/pengadaan/barang_1785208365_6a681e2d97d53.webp', 'COba Lagi', '2026-07-28 10:12:45'),
(19, 'TKT-280726-009', 'uploads/TKT-280726-009/pengadaan/barang_1785208554_6a681eeae4d23.webp', 'Test dong', '2026-07-28 10:15:54');

-- --------------------------------------------------------

--
-- Table structure for table `perbaikan_items`
--

CREATE TABLE `perbaikan_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `tiket_id` varchar(50) NOT NULL,
  `outlet_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `nama_petugas` varchar(100) DEFAULT NULL,
  `foto_before_url` varchar(255) DEFAULT NULL,
  `foto_after_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`foto_after_url`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `perbaikan_items`
--

INSERT INTO `perbaikan_items` (`id`, `tiket_id`, `outlet_id`, `user_id`, `nama_petugas`, `foto_before_url`, `foto_after_url`, `created_at`) VALUES
(1, 'TKT-220726-007', 2, 3, 'Asd', 'uploads/perbaikan/before_1784823972_6a6240a4193d4.jpeg', '[\"uploads\\/perbaikan\\/after_1784823972_6a6240a4198a3.jpeg\",\"uploads\\/perbaikan\\/after_1784823972_6a6240a419c64.jpeg\",\"uploads\\/perbaikan\\/after_1784823972_6a6240a41a04d.jpeg\"]', '2026-07-23 23:26:12'),
(2, 'TKT-220726-007', 2, 3, 'Asd', 'uploads/perbaikan/before_1784826964_6a624c540b194.jpeg', '[\"uploads\\/perbaikan\\/after_1784826964_6a624c540b4f8.jpeg\",\"uploads\\/perbaikan\\/after_1784826964_6a624c540b8bb.jpeg\",\"uploads\\/perbaikan\\/after_1784826964_6a624c540bcda.jpeg\"]', '2026-07-24 00:16:04'),
(3, 'TKT-220726-007', 2, 3, 'Asd', 'uploads/perbaikan/before_1784827563_6a624eab74279.jpeg', '[\"uploads\\/perbaikan\\/after_1784827563_6a624eab74560.jpeg\",\"uploads\\/perbaikan\\/after_1784827563_6a624eab74919.jpeg\",\"uploads\\/perbaikan\\/after_1784827563_6a624eab74fd5.jpeg\"]', '2026-07-24 00:26:03'),
(4, 'TKT-220726-004', 3, 3, 'Asd', 'uploads/perbaikan/before_1784829702_6a625706b1002.jpeg', '[\"uploads\\/perbaikan\\/after_1784829702_6a625706b1580.jpeg\",\"uploads\\/perbaikan\\/after_1784829702_6a625706b1a02.jpeg\",\"uploads\\/perbaikan\\/after_1784829702_6a625706b1ec3.jpeg\"]', '2026-07-24 01:01:42'),
(5, 'TKT-220726-011', 3, 3, 'Asd', NULL, NULL, '2026-07-24 02:15:27'),
(6, 'TKT-280726-001', 1, 3, 'Asd', 'uploads/perbaikan/before_1785181952_6a67b700347ac.jpeg', '[\"uploads\\/perbaikan\\/after_1785181952_6a67b700352bc.jpeg\",\"uploads\\/perbaikan\\/after_1785181952_6a67b700356e6.jpeg\",\"uploads\\/perbaikan\\/after_1785181952_6a67b70035a3c.jpeg\"]', '2026-07-28 02:52:32'),
(7, 'TKT-220726-001', 1, 3, 'Asd', NULL, NULL, '2026-07-28 02:56:19'),
(8, 'TKT-220726-001', 1, 3, 'Asd', 'uploads/perbaikan/before_1785183712_6a67bde018567.jpeg', '[\"uploads\\/perbaikan\\/after_1785183712_6a67bde01883b.jpeg\",\"uploads\\/perbaikan\\/after_1785183712_6a67bde018b48.jpeg\",\"uploads\\/perbaikan\\/after_1785183712_6a67bde018fc4.jpeg\"]', '2026-07-28 03:21:52'),
(9, 'TKT-220726-001', 1, 3, 'Asd', 'uploads/perbaikan/before_1785183739_6a67bdfb701ab.jpeg', '[\"uploads\\/perbaikan\\/after_1785183739_6a67bdfb70558.jpeg\",\"uploads\\/perbaikan\\/after_1785183739_6a67bdfb708c3.jpeg\",\"uploads\\/perbaikan\\/after_1785183739_6a67bdfb70c01.jpeg\"]', '2026-07-28 03:22:19'),
(10, 'TKT-280726-002', 2, 3, 'Asd', NULL, NULL, '2026-07-28 03:23:24'),
(11, 'TKT-220726-002', 2, 3, 'Asd', NULL, NULL, '2026-07-28 03:56:27'),
(12, 'TKT-280726-002', 2, 3, 'Asd', 'uploads/perbaikan/before_1785185847_6a67c63782976.jpeg', '[\"uploads\\/perbaikan\\/after_1785185847_6a67c63782c61.jpeg\",\"uploads\\/perbaikan\\/after_1785185847_6a67c63782f6f.jpeg\",\"uploads\\/perbaikan\\/after_1785185847_6a67c63783293.jpeg\"]', '2026-07-28 03:57:27'),
(13, 'TKT-220726-010', 2, 4, 'Hadi', 'uploads/perbaikan/before_1785187833_6a67cdf9e8042.jpeg', '[\"uploads\\/perbaikan\\/after_1785187833_6a67cdf9e8315.jpeg\",\"uploads\\/perbaikan\\/after_1785187833_6a67cdf9e861a.jpeg\",\"uploads\\/perbaikan\\/after_1785187833_6a67cdf9e89f4.jpeg\"]', '2026-07-28 04:30:33'),
(14, 'TKT-220726-003', 2, 4, 'Asd', NULL, NULL, '2026-07-28 04:31:20'),
(15, 'TKT-220726-005', 1, 4, 'Joe', NULL, NULL, '2026-07-28 05:48:15'),
(16, 'TKT-280726-003', 1, 3, 'Joe', NULL, NULL, '2026-07-28 09:06:13'),
(17, 'TKT-280726-004', 1, 3, 'Joe', NULL, NULL, '2026-07-28 09:06:54'),
(18, 'TKT-280726-005', 1, 3, 'Joe', NULL, NULL, '2026-07-28 09:07:10'),
(19, 'TKT-280726-006', 1, 3, 'Joe', NULL, NULL, '2026-07-28 09:11:38'),
(20, 'TKT-280726-007', 1, 3, 'Joe', NULL, NULL, '2026-07-28 09:23:16'),
(21, 'TKT-280726-008', 1, 3, 'Joe', 'uploads/TKT-280726-008/perbaikan/before_1785205491_6a6812f3aed55.webp', '[\"uploads\\/TKT-280726-008\\/perbaikan\\/after_1785205491_6a6812f3af181.webp\",\"uploads\\/TKT-280726-008\\/perbaikan\\/after_1785205491_6a6812f3af500.webp\",\"uploads\\/TKT-280726-008\\/perbaikan\\/after_1785205491_6a6812f3af9e6.webp\"]', '2026-07-28 09:24:51'),
(22, 'TKT-220726-008', 1, 4, 'Joe', 'uploads/TKT-220726-008/perbaikan/before_1785205641_6a681389dc358.webp', '[\"uploads\\/TKT-220726-008\\/perbaikan\\/after_1785205641_6a681389dc8c3.webp\",\"uploads\\/TKT-220726-008\\/perbaikan\\/after_1785205641_6a681389dcc29.webp\",\"uploads\\/TKT-220726-008\\/perbaikan\\/after_1785205641_6a681389dd142.webp\"]', '2026-07-28 09:27:21'),
(23, 'TKT-280726-003', 1, 3, 'Joe', 'uploads/TKT-280726-003/perbaikan/before_1785205720_6a6813d8e456e.webp', '[\"uploads\\/TKT-280726-003\\/perbaikan\\/after_1785205720_6a6813d8e5065.webp\",\"uploads\\/TKT-280726-003\\/perbaikan\\/after_1785205720_6a6813d8e5ae1.webp\",\"uploads\\/TKT-280726-003\\/perbaikan\\/after_1785205720_6a6813d8e64eb.webp\"]', '2026-07-28 09:28:40'),
(24, 'TKT-220726-006', 3, 4, 'asd', NULL, NULL, '2026-07-28 10:12:45'),
(25, 'TKT-280726-009', 3, 3, 'Joe', NULL, NULL, '2026-07-28 10:15:54'),
(26, 'TKT-280726-009', 3, 3, 'Joe', 'uploads/TKT-280726-009/perbaikan/before_1785208602_6a681f1acfd23.webp', '[\"uploads\\/TKT-280726-009\\/perbaikan\\/after_1785208602_6a681f1ad0161.webp\",\"uploads\\/TKT-280726-009\\/perbaikan\\/after_1785208602_6a681f1ad04c0.webp\",\"uploads\\/TKT-280726-009\\/perbaikan\\/after_1785208602_6a681f1ad0907.webp\"]', '2026-07-28 10:16:42');

-- --------------------------------------------------------

--
-- Table structure for table `petugas`
--

CREATE TABLE `petugas` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `nama_lower` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `last_seen` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `petugas`
--

INSERT INTO `petugas` (`id`, `nama`, `nama_lower`, `is_active`, `last_seen`, `created_at`) VALUES
(1, 'Hadi', 'hadi', 0, '2026-07-28 05:17:56', '2026-07-28 05:16:49'),
(2, 'Joe', 'joe', 1, '2026-07-28 10:16:56', '2026-07-28 05:16:49'),
(3, 'asd', 'asd', 0, '2026-07-28 10:12:45', '2026-07-28 05:16:49'),
(4, 'Samsul', 'samsul', 0, NULL, '2026-07-28 05:16:49');

-- --------------------------------------------------------

--
-- Table structure for table `sla_levels`
--

CREATE TABLE `sla_levels` (
  `id` int(10) UNSIGNED NOT NULL,
  `level` enum('L1','L2','L3') NOT NULL,
  `description` varchar(100) NOT NULL,
  `max_hours` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sla_levels`
--

INSERT INTO `sla_levels` (`id`, `level`, `description`, `max_hours`, `created_at`, `updated_at`) VALUES
(1, 'L1', 'Hari ini', 24, '2026-07-17 14:40:50', '2026-07-17 14:48:29'),
(2, 'L2', 'H+3 (Max 3 hari)', 72, '2026-07-17 14:40:50', '2026-07-17 14:48:48'),
(3, 'L3', 'H+5 (Max 5 hari)', 120, '2026-07-17 14:40:50', '2026-07-17 14:48:55');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `job` varchar(50) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `type`, `job`) VALUES
(1, 'SUPER ADMIN', 'ADMIN', 'ADMIN'),
(2, 'PIC', 'PIC OUTLET', 'Pelapor'),
(3, 'ME', 'Mekanikal Elektrikal', 'Teknisi Elektrikal'),
(4, 'GA', 'General Affairs', 'Teknisi Operasional'),
(5, 'Manager Eng.', 'Manager Eng.', 'Manager Teknisi'),
(6, 'Procurement', 'Pengadaan', 'Pengadaan');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `jadwal_kendala`
--
ALTER TABLE `jadwal_kendala`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `katalog_gejala`
--
ALTER TABLE `katalog_gejala`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_katalog_kategori` (`kategori_id`);

--
-- Indexes for table `kategori_kendala`
--
ALTER TABLE `kategori_kendala`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kendala_items`
--
ALTER TABLE `kendala_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `laporan_kendala`
--
ALTER TABLE `laporan_kendala`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `laporan_pengadaan`
--
ALTER TABLE `laporan_pengadaan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tiket_id` (`tiket_id`);

--
-- Indexes for table `laporan_perbaikan`
--
ALTER TABLE `laporan_perbaikan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tiket_id` (`tiket_id`);

--
-- Indexes for table `outlets`
--
ALTER TABLE `outlets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pengadaan_items`
--
ALTER TABLE `pengadaan_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tiket_id` (`tiket_id`);

--
-- Indexes for table `perbaikan_items`
--
ALTER TABLE `perbaikan_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tiket_id` (`tiket_id`),
  ADD KEY `idx_outlet_id` (`outlet_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `petugas`
--
ALTER TABLE `petugas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama_lower` (`nama_lower`);

--
-- Indexes for table `sla_levels`
--
ALTER TABLE `sla_levels`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `app_settings`
--
ALTER TABLE `app_settings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `jadwal_kendala`
--
ALTER TABLE `jadwal_kendala`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `katalog_gejala`
--
ALTER TABLE `katalog_gejala`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT for table `kategori_kendala`
--
ALTER TABLE `kategori_kendala`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `kendala_items`
--
ALTER TABLE `kendala_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `laporan_kendala`
--
ALTER TABLE `laporan_kendala`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `laporan_pengadaan`
--
ALTER TABLE `laporan_pengadaan`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `laporan_perbaikan`
--
ALTER TABLE `laporan_perbaikan`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `outlets`
--
ALTER TABLE `outlets`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `pengadaan_items`
--
ALTER TABLE `pengadaan_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `perbaikan_items`
--
ALTER TABLE `perbaikan_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `petugas`
--
ALTER TABLE `petugas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `sla_levels`
--
ALTER TABLE `sla_levels`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `katalog_gejala`
--
ALTER TABLE `katalog_gejala`
  ADD CONSTRAINT `fk_katalog_kategori` FOREIGN KEY (`kategori_id`) REFERENCES `kategori_kendala` (`id`);

DELIMITER $$
--
-- Events
--
CREATE DEFINER=`root`@`localhost` EVENT `auto_over_sla` ON SCHEDULE EVERY 1 MINUTE STARTS '2026-07-22 07:23:50' ON COMPLETION NOT PRESERVE ENABLE DO UPDATE laporan_kendala lk
  JOIN jadwal_kendala jk ON jk.tiket_id = lk.tiket_id
  SET lk.status = 'over_sla'
  WHERE lk.status NOT IN ('selesai_dikerjakan','terverifikasi','over_sla')
    AND jk.deadline_date IS NOT NULL
    AND jk.deadline_date < DATE_SUB(NOW(), INTERVAL 1 DAY)$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
