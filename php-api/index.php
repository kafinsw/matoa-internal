<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/db.php';

apply_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    json_response(['ok' => true]);
}

// Sync nama_petugas ke tabel petugas (logical FK via nama_lower)
function upsert_petugas($nama) {
    if (!$nama) return;
    $pdo = db();
    $lower = strtolower(trim($nama));
    $pdo->prepare("INSERT INTO petugas (nama, nama_lower, is_active, last_seen)
        VALUES (?, ?, 0, NOW())
        ON DUPLICATE KEY UPDATE nama=VALUES(nama), last_seen=NOW()")
        ->execute([$nama, $lower]);
}

// Strip any known base prefix (XAMPP: /matoa_internal/api, Docker: /php-api)
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
foreach (['/matoa_internal/api', '/php-api'] as $basePath) {
    if (str_starts_with($uri, $basePath)) {
        $uri = substr($uri, strlen($basePath));
        break;
    }
}
$route = '/' . trim($uri, '/');
$route = preg_replace('#^/index\\.php#', '', $route) ?: '/';
// Support ?route= param (used by React frontend direct fetch)
if ($route === '/' && !empty($_GET['route'])) {
    $route = '/' . ltrim($_GET['route'], '/');
}

// Helper: decode base64 foto, simpan ke folder
function saveFotoBase64($base64Data, $folder = 'laporan', $prefix = 'foto', $tiketId = null) {
    if (!$base64Data) return null;
    // Sudah berupa URL/path (mode revisi, tidak diganti) — kembalikan apa adanya
    if (!str_starts_with($base64Data, 'data:')) return $base64Data;
    if (!preg_match('/^data:image\/(\w+);base64,/', $base64Data, $m)) return null;
    $ext = strtolower($m[1]);
    if (!in_array($ext, ['jpg','jpeg','png','webp'])) $ext = 'jpg';
    $raw = base64_decode(substr($base64Data, strpos($base64Data, ',') + 1));
    if ($raw === false || strlen($raw) < 100) return null;

    $subdir = $tiketId ? "{$tiketId}/{$folder}" : $folder;
    $dir = __DIR__ . "/../uploads/{$subdir}";
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    // Convert to webp if GD available
    if (function_exists('imagewebp') && in_array($ext, ['jpg','jpeg','png'])) {
        $img = imagecreatefromstring($raw);
        if ($img !== false) {
            ob_start();
            imagewebp($img, null, 82);
            $webpRaw = ob_get_clean();
            imagedestroy($img);
            if ($webpRaw) { $raw = $webpRaw; $ext = 'webp'; }
        }
    }
    $filename = "{$prefix}_" . time() . '_' . uniqid() . '.' . $ext;
    file_put_contents($dir . '/' . $filename, $raw);
    return "uploads/{$subdir}/{$filename}";
}

try {
    $pdo = db();

    switch ($route) {

        // ---- Health & DB Test ----
        case '/health':
            json_response([
                'ok' => true,
                'app' => 'matoa_internal_api',
                'env' => APP_ENV,
                'time' => date('c'),
            ]);
            break;

        case '/debug/db':
            if (APP_ENV !== 'local') {
                json_response(['ok' => false, 'message' => 'Forbidden'], 403);
            }
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $result = [];
            foreach ($tables as $table) {
                $cols = $pdo->query("DESCRIBE `$table`")->fetchAll(PDO::FETCH_ASSOC);
                $result[$table] = $cols;
            }
            json_response(['ok' => true, 'tables' => $result]);
            break;

        case '/migrations/fix':
            $messages = [];

            // Drop foreign key first, then column
            try {
                $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
                $pdo->exec("ALTER TABLE kendala_items DROP FOREIGN KEY IF EXISTS fk_kendala_laporan");
                $pdo->exec("ALTER TABLE kendala_items DROP COLUMN IF EXISTS laporan_id");
                $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
                $messages[] = "Dropped kendala_items.laporan_id + foreign key";
            } catch (Exception $e) {
                $messages[] = "kendala_items: " . $e->getMessage();
            }

            json_response(['ok' => true, 'messages' => $messages]);
            break;

        case '/db-test':
            $row = $pdo->query('SELECT DATABASE() AS database_name, NOW() AS server_time')->fetch();
            json_response([
                'ok' => true,
                'database' => $row['database_name'] ?? DB_NAME,
                'server_time' => $row['server_time'] ?? null,
            ]);
            break;

        // ---- Outlets ----
        case '/outlets':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $b = json_decode(file_get_contents('php://input'), true);
                $kode = strtoupper(trim($b['nama']));
                $st = $pdo->prepare("INSERT INTO outlets (kode, nama, status) VALUES (?, ?, ?)");
                $st->execute([$kode, $b['nama'], $b['status'] ?? 'active']);
                json_response(['id' => $pdo->lastInsertId()], 201);
                break;
            }
            if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                $b = json_decode(file_get_contents('php://input'), true);
                $id = intval($b['id'] ?? 0);
                if (!$id) { json_response(['error' => 'id required'], 400); break; }
                $st = $pdo->prepare("UPDATE outlets SET nama=?, status=? WHERE id=?");
                $st->execute([$b['nama'], $b['status'], $id]);
                json_response(['ok' => true]);
                break;
            }
            if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                $id = intval($_GET['id'] ?? 0);
                if (!$id) { json_response(['error' => 'id required'], 400); break; }
                $pdo->prepare("DELETE FROM outlets WHERE id=?")->execute([$id]);
                json_response(['ok' => true]);
                break;
            }
            $rows = $pdo->query("SELECT id, kode, nama, status FROM outlets ORDER BY kode")->fetchAll(PDO::FETCH_ASSOC);
            json_response($rows);
            break;

        case '/users':
            $rows = $pdo->query("SELECT id, name, type FROM user ORDER BY name")->fetchAll();
            json_response($rows);
            break;

        // ---- Daily Laporan list ----
        case '/daily-laporan':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // outlet list from daily_laporan only
                if (isset($_GET['outlets_only'])) {
                    $rows = $pdo->query("SELECT DISTINCT o.id, o.nama FROM daily_laporan dl LEFT JOIN outlets o ON o.id=dl.outlet_id WHERE o.id IS NOT NULL ORDER BY o.nama")->fetchAll(PDO::FETCH_ASSOC);
                    json_response($rows);
                }
                $page  = max(1, intval($_GET['page']  ?? 1));
                $limit = max(1, min(100, intval($_GET['limit'] ?? 10)));
                $offset = ($page - 1) * $limit;
                $where = ['1=1'];
                $params = [];
                if (!empty($_GET['outlet_id'])) { $where[] = 'dl.outlet_id = ?'; $params[] = intval($_GET['outlet_id']); }
                if (!empty($_GET['user_name'])) { $where[] = 'u.name = ?';       $params[] = trim($_GET['user_name']); }
                if (!empty($_GET['search']))    {
                    $where[] = '(p.nama LIKE ? OR o.nama LIKE ? OR u.name LIKE ?)';
                    $s = '%'.trim($_GET['search']).'%';
                    $params[] = $s; $params[] = $s; $params[] = $s;
                }
                $w = implode(' AND ', $where);
                $joins = "FROM daily_laporan dl
                    LEFT JOIN outlets o ON o.id = dl.outlet_id
                    LEFT JOIN petugas p ON p.id = dl.petugas_id
                    LEFT JOIN user u ON u.id = dl.user_id";
                $cntStmt = $pdo->prepare("SELECT COUNT(*) $joins WHERE $w");
                $cntStmt->execute($params);
                $total = (int)$cntStmt->fetchColumn();
                $stmt = $pdo->prepare("SELECT dl.id, dl.created_at, dl.updated_at,
                    o.nama AS outlet_nama, p.nama AS petugas_nama,
                    u.name AS user_name, u.type AS user_type,
                    dl.tasks
                    $joins WHERE $w ORDER BY dl.created_at DESC LIMIT $limit OFFSET $offset");
                $stmt->execute($params);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($rows as &$r) {
                    $tasks = json_decode($r['tasks'], true) ?? [];
                    $r['total_items']   = count($tasks);
                    $r['normal_count']  = count(array_filter($tasks, fn($t) => ($t['status']??'') === 'Normal'));
                    $r['masalah_count'] = count(array_filter($tasks, fn($t) => ($t['status']??'') === 'Bermasalah'));
                    $r['proses_count']  = count(array_filter($tasks, fn($t) => ($t['status']??'') === 'Dalam Proses'));
                    unset($r['tasks']);
                }
                json_response(['data' => $rows, 'pagination' => ['total' => $total, 'page' => $page, 'pages' => max(1, ceil($total/$limit))]]);
            }
            break;

        // ---- Tugasrutin Jadwal ----
        case '/tugasrutin-jadwal':
            $rotasi  = $pdo->query("SELECT id, outlet, hari_text AS nama FROM tugasrutin_rotasi ORDER BY sort_order")->fetchAll(PDO::FETCH_ASSOC);
            $harian  = $pdo->query("SELECT id, nama, outlet FROM tugasrutin_harian ORDER BY sort_order")->fetchAll(PDO::FETCH_ASSOC);
            $jadwal  = $pdo->query("SELECT type, nama, outlet, hari, frekuensi FROM tugasrutin_jadwal ORDER BY hari, sort_order")->fetchAll(PDO::FETCH_ASSOC);
            $per_hari = array_values(array_filter($jadwal, fn($r) => $r['type']==='per_hari'));
            $vendor   = array_values(array_filter($jadwal, fn($r) => $r['type']==='vendor'));
            json_response(compact('rotasi','harian','per_hari','vendor'));
            break;

        // ---- Petugas session ----
        case '/petugas-list':
            $pdo->exec("CREATE TABLE IF NOT EXISTS petugas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama VARCHAR(100) NOT NULL,
                nama_lower VARCHAR(100) NOT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 0,
                last_seen DATETIME NULL,
                created_at DATETIME DEFAULT NOW(),
                UNIQUE KEY uq_nama_lower (nama_lower)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $rows = $pdo->query("SELECT id, nama, is_active, last_seen FROM petugas ORDER BY nama")->fetchAll(PDO::FETCH_ASSOC);
                json_response($rows);
                break;
            }
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $b = json_decode(file_get_contents('php://input'), true);
                $nama = trim($b['nama'] ?? '');
                if (strlen($nama) < 2) { json_response(['error' => 'nama min 2'], 400); break; }
                $lower = strtolower($nama);
                $st = $pdo->prepare("INSERT INTO petugas (nama, nama_lower, is_active) VALUES (?,?,?) ON DUPLICATE KEY UPDATE nama=VALUES(nama), is_active=VALUES(is_active)");
                $st->execute([$nama, $lower, intval($b['is_active'] ?? 1)]);
                json_response(['id' => $pdo->lastInsertId()], 201);
                break;
            }
            if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                $b = json_decode(file_get_contents('php://input'), true);
                $id = intval($b['id'] ?? 0);
                if (!$id) { json_response(['error' => 'id required'], 400); break; }
                $nama = trim($b['nama'] ?? '');
                $lower = strtolower($nama);
                $st = $pdo->prepare("UPDATE petugas SET nama=?, nama_lower=?, is_active=? WHERE id=?");
                $st->execute([$nama, $lower, intval($b['is_active'] ?? 1), $id]);
                json_response(['ok' => true]);
                break;
            }
            if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                $id = intval($_GET['id'] ?? 0);
                if (!$id) { json_response(['error' => 'id required'], 400); break; }
                $pdo->prepare("DELETE FROM petugas WHERE id=?")->execute([$id]);
                json_response(['ok' => true]);
                break;
            }
            break;

        case '/petugas':
            // CREATE TABLE IF NOT EXISTS (auto-migrate)
            $pdo->exec("CREATE TABLE IF NOT EXISTS petugas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama VARCHAR(100) NOT NULL,
                nama_lower VARCHAR(100) NOT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 0,
                last_seen DATETIME NULL,
                created_at DATETIME DEFAULT NOW(),
                UNIQUE KEY uq_nama_lower (nama_lower)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // cek apakah nama aktif — ?nama=xxx
                $nama = strtolower(trim($_GET['nama'] ?? ''));
                if ($nama === '') { json_response(['error' => 'nama required'], 400); }
                $stmt = $pdo->prepare("SELECT is_active, last_seen FROM petugas WHERE nama_lower = ? LIMIT 1");
                $stmt->execute([$nama]);
                $row = $stmt->fetch();
                if (!$row || !$row['is_active']) {
                    json_response(['is_active' => false]);
                }
                // Cek expire: jam 07-17 WIB → tidak expire; luar jam itu → expire 3 jam
                $nowWib = new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta'));
                $hour = (int)$nowWib->format('G');
                $isJamKerja = ($hour >= 7 && $hour < 17);
                if (!$isJamKerja && $row['last_seen']) {
                    $lastSeen = new DateTimeImmutable($row['last_seen'], new DateTimeZone('UTC'));
                    $diffSec = time() - $lastSeen->getTimestamp();
                    if ($diffSec > 3 * 3600) {
                        // auto-expire
                        $pdo->prepare("UPDATE petugas SET is_active=0 WHERE nama_lower=?")->execute([$nama]);
                        json_response(['is_active' => false, 'expired' => true]);
                    }
                }
                json_response(['is_active' => true]);
            }

            if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
                // heartbeat — update last_seen saja
                $body = json_decode(file_get_contents('php://input'), true) ?? [];
                $nama = strtolower(trim($body['nama'] ?? ''));
                if ($nama === '') { json_response(['error' => 'nama required'], 400); }
                $pdo->prepare("UPDATE petugas SET last_seen=NOW() WHERE nama_lower=? AND is_active=1")->execute([$nama]);
                json_response(['ok' => true]);
            }

            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // login: tandai aktif
                $body = json_decode(file_get_contents('php://input'), true) ?? [];
                $nama = trim($body['nama'] ?? '');
                if (strlen($nama) < 3) { json_response(['error' => 'nama min 3'], 400); }
                $lower = strtolower($nama);
                $stmt = $pdo->prepare("INSERT INTO petugas (nama, nama_lower, is_active, last_seen)
                    VALUES (?, ?, 1, NOW())
                    ON DUPLICATE KEY UPDATE nama=VALUES(nama), is_active=1, last_seen=NOW()");
                $stmt->execute([$nama, $lower]);
                json_response(['ok' => true]);
            }

            if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                // logout: tandai tidak aktif
                $body = json_decode(file_get_contents('php://input'), true) ?? [];
                $nama = strtolower(trim($body['nama'] ?? ''));
                if ($nama === '') { json_response(['error' => 'nama required'], 400); }
                $stmt = $pdo->prepare("UPDATE petugas SET is_active=0, last_seen=NOW() WHERE nama_lower=?");
                $stmt->execute([$nama]);
                json_response(['ok' => true]);
            }
            break;

        case '/petugas/list':
            // Return semua petugas + is_active (untuk dropdown)
            $pdo->exec("CREATE TABLE IF NOT EXISTS petugas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama VARCHAR(100) NOT NULL,
                nama_lower VARCHAR(100) NOT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 0,
                last_seen DATETIME NULL,
                created_at DATETIME DEFAULT NOW(),
                UNIQUE KEY uq_nama_lower (nama_lower)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            $rows = $pdo->query("SELECT nama, is_active FROM petugas ORDER BY nama ASC")->fetchAll(PDO::FETCH_ASSOC);
            json_response(array_map(fn($r) => ['nama' => $r['nama'], 'is_active' => (bool)$r['is_active']], $rows));
            break;

        // ---- Kategori Kendala ----
        case '/kategori-kendala':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $b = json_decode(file_get_contents('php://input'), true);
                $st = $pdo->prepare("INSERT INTO kategori_kendala (nama, user_id) VALUES (?, ?)");
                $st->execute([$b['nama'], $b['user_id']]);
                json_response(['id' => $pdo->lastInsertId()], 201);
                break;
            }
            if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                $b = json_decode(file_get_contents('php://input'), true);
                $id = intval($b['id'] ?? 0);
                if (!$id) { json_response(['error' => 'id required'], 400); break; }
                $st = $pdo->prepare("UPDATE kategori_kendala SET nama=?, user_id=? WHERE id=?");
                $st->execute([$b['nama'], $b['user_id'], $id]);
                json_response(['ok' => true]);
                break;
            }
            if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                $id = intval($_GET['id'] ?? 0);
                if (!$id) { json_response(['error' => 'id required'], 400); break; }
                $pdo->prepare("DELETE FROM kategori_kendala WHERE id=?")->execute([$id]);
                json_response(['ok' => true]);
                break;
            }
            $rows = $pdo->query("SELECT kk.id, kk.nama, kk.user_id, u.name AS user_name FROM kategori_kendala kk LEFT JOIN user u ON u.id = kk.user_id ORDER BY kk.nama")->fetchAll(PDO::FETCH_ASSOC);
            json_response($rows);
            break;

        // ---- Katalog Gejala next ID ----
        case '/katalog-gejala/next-id':
            $kat_id = intval($_GET['kategori_id'] ?? 0);
            $rows = $pdo->query("SELECT gejala_id FROM katalog_gejala WHERE kategori_id=$kat_id ORDER BY gejala_id ASC")->fetchAll(PDO::FETCH_COLUMN);
            if ($rows) {
                $dash   = strrpos($rows[0], '-');
                $prefix = substr($rows[0], 0, $dash);
                // collect existing numbers
                $nums = array_map(fn($id) => intval(substr($id, strrpos($id,'-')+1)), $rows);
                // find smallest gap starting from 1
                $n = 1;
                while (in_array($n, $nums)) $n++;
            } else {
                $nama = $pdo->query("SELECT nama FROM kategori_kendala WHERE id=$kat_id")->fetchColumn();
                if (!$nama) { json_response(['error'=>'kategori not found'], 404); break; }
                $prefix = implode('', array_map(fn($w) => strtoupper($w[0]), explode(' ', trim($nama))));
                $n = 1;
            }
            json_response(['next_id' => $prefix . '-' . str_pad($n, 2, '0', STR_PAD_LEFT)]);
            break;

        // ---- Katalog Gejala ----
        case '/katalog-gejala':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $b = json_decode(file_get_contents('php://input'), true);
                $chk = $pdo->prepare("SELECT COUNT(*) FROM katalog_gejala WHERE gejala_id=?");
                $chk->execute([$b['gejala_id']]);
                if ($chk->fetchColumn() > 0) { json_response(['error' => 'gejala_id sudah ada'], 409); break; }
                $st = $pdo->prepare("INSERT INTO katalog_gejala (gejala_id, kategori, kategori_id, user_id, gejala, level, butuh_barang, contoh) VALUES (?, ?, ?, ?, ?, ?, 0, NULL)");
                $st->execute([$b['gejala_id'], $b['kategori_id'], $b['kategori_id'], $b['user_id'], $b['gejala'], $b['level']]);
                json_response(['id' => $pdo->lastInsertId()], 201);
                break;
            }
            if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                $b = json_decode(file_get_contents('php://input'), true);
                $id = intval($b['id'] ?? 0);
                if (!$id) { json_response(['error' => 'id required'], 400); break; }
                $st = $pdo->prepare("UPDATE katalog_gejala SET kategori_id=?, user_id=?, gejala=?, level=?, contoh=?, updated_at=NOW() WHERE id=?");
                $st->execute([$b['kategori_id'], $b['user_id'], $b['gejala'], $b['level'], $b['contoh'] ?: null, $id]);
                json_response(['ok' => true]);
                break;
            }
            if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                $id = intval($_GET['id'] ?? 0);
                if (!$id) { json_response(['error' => 'id required'], 400); break; }
                $pdo->prepare("DELETE FROM katalog_gejala WHERE id=?")->execute([$id]);
                json_response(['ok' => true]);
                break;
            }
            $rows = $pdo->query("
                SELECT
                    kg.id,
                    kg.gejala_id,
                    kg.kategori_id,
                    kg.user_id,
                    kk.nama  AS kategori_nama,
                    u.name   AS user_name,
                    kg.level,
                    sl.description AS sla_nama,
                    sl.max_hours   AS sla_hours,
                    kg.gejala,
                    kg.contoh,
                    kg.updated_at
                FROM katalog_gejala kg
                LEFT JOIN kategori_kendala kk ON kk.id  = kg.kategori_id
                LEFT JOIN `user`          u  ON u.id   = kg.user_id
                LEFT JOIN sla_levels      sl ON sl.level = kg.level
                ORDER BY kg.gejala_id ASC
            ")->fetchAll(PDO::FETCH_ASSOC);
            json_response($rows);
            break;

        // ---- SLA Levels ----
        case '/sla-levels':
            $rows = $pdo->query("SELECT level AS kode, description AS nama, max_hours FROM sla_levels ORDER BY FIELD(level, 'L1','L2','L3')")->fetchAll();
            json_response($rows);
            break;

        // ---- Laporan Kendala ----
        case '/laporan/kelompok-sistem':
            $rows = $pdo->query("SELECT DISTINCT kelompok_sistem FROM laporan_kendala_outlet ORDER BY kelompok_sistem")->fetchAll(PDO::FETCH_COLUMN);
            json_response($rows);
            break;

        case '/laporan/keluhan':
            $rows = $pdo->query("SELECT DISTINCT keluhan FROM laporan_kendala_outlet ORDER BY keluhan")->fetchAll(PDO::FETCH_COLUMN);
            json_response($rows);
            break;

        case '/laporan/outlet-list':
            $rows = $pdo->query("SELECT DISTINCT outlet FROM laporan_kendala_outlet ORDER BY outlet")->fetchAll(PDO::FETCH_COLUMN);
            json_response($rows);
            break;

        case '/laporan/list':
            $page   = max(1, intval($_GET['page']   ?? 1));
            $limit  = min(50, max(1, intval($_GET['limit']  ?? 20)));
            $offset = ($page - 1) * $limit;

            $where  = [];
            $params = [];

            if (!empty($_GET['outlet_id'])) {
                $where[]  = 'lk.outlet_id = ?';
                $params[] = intval($_GET['outlet_id']);
            }
            if (!empty($_GET['user_id'])) {
                $where[]  = 'lk.user_id = ?';
                $params[] = intval($_GET['user_id']);
            }

            $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

            // hanya status yang perlu ditampilkan
            $allowedStatuses = "'over_sla','dijadwalkan','sedang_dikerjakan','barang_ready','barang_diproses','tunggu_barang','selesai_dikerjakan'";
            $statusFilter = "lk.status IN ($allowedStatuses)";
            $whereSQL = $where
                ? 'WHERE ' . implode(' AND ', $where) . " AND $statusFilter"
                : "WHERE $statusFilter";

            $total = $pdo->prepare("SELECT COUNT(*) FROM laporan_kendala lk $whereSQL");
            $total->execute($params);
            $total = $total->fetchColumn();

            $stmt = $pdo->prepare("SELECT lk.*, o.kode AS outlet_kode, o.nama AS outlet_nama,
                t.name AS tim_name, t.type AS tim_type,
                kg.kategori,
                (SELECT jk.deadline_date FROM jadwal_kendala jk WHERE jk.tiket_id = lk.tiket_id ORDER BY jk.id DESC LIMIT 1) AS deadline_date,
                (SELECT GROUP_CONCAT(ki.keterangan ORDER BY ki.id SEPARATOR ' | ') FROM kendala_items ki WHERE ki.tiket_id = lk.tiket_id) AS keterangan
                FROM laporan_kendala lk
                LEFT JOIN outlets o ON o.id = lk.outlet_id
                LEFT JOIN `user` t ON t.id = lk.user_id
                LEFT JOIN katalog_gejala kg ON kg.gejala_id = lk.gejala_id
                $whereSQL
                ORDER BY
                    CASE lk.status
                        WHEN 'over_sla'          THEN 1
                        WHEN 'dijadwalkan'        THEN 2
                        WHEN 'sedang_dikerjakan'  THEN 2
                        WHEN 'terverifikasi'      THEN 2
                        WHEN 'barang_ready'       THEN 3
                        WHEN 'barang_diproses'    THEN 4
                        WHEN 'tunggu_barang'      THEN 5
                        WHEN 'selesai_dikerjakan' THEN 6
                        ELSE 2
                    END ASC,
                    CASE WHEN lk.status IN ('barang_ready','dijadwalkan','sedang_dikerjakan','terverifikasi','over_sla')
                        THEN CASE lk.level
                            WHEN 'L1' THEN DATE_ADD(lk.created_at, INTERVAL 24 HOUR)
                            WHEN 'L2' THEN DATE_ADD(lk.created_at, INTERVAL 72 HOUR)
                            WHEN 'L3' THEN DATE_ADD(lk.created_at, INTERVAL 120 HOUR)
                            ELSE lk.created_at
                        END
                        ELSE NULL
                    END ASC,
                    CASE lk.level WHEN 'L1' THEN 1 WHEN 'L2' THEN 2 WHEN 'L3' THEN 3 ELSE 4 END ASC
                LIMIT ? OFFSET ?");
            $stmt->execute([...$params, $limit, $offset]);
            $rows = $stmt->fetchAll();
            $rows = array_map(function($r) {
                foreach (['created_at', 'updated_at', 'deadline_date'] as $f) {
                    if (!empty($r[$f]) && !str_contains($r[$f], '+')) {
                        $r[$f] = utc_to_wib($r[$f]);
                    }
                }
                return $r;
            }, $rows);

            json_response([
                'ok' => true,
                'data' => $rows,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($total / $limit),
                ],
            ]);
            break;

        // ---- Next Ticket ID ----
        case '/laporan/next-ticket-id':
            $d = (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format('dmy');
            $prefix = 'TKT-' . $d . '-';
            $stmt = $pdo->prepare(
                "SELECT tiket_id FROM laporan_kendala WHERE tiket_id LIKE ? ORDER BY tiket_id DESC LIMIT 1"
            );
            $stmt->execute([$prefix . '%']);
            $last = $stmt->fetchColumn();
            $seq = $last ? (intval(substr($last, -3)) + 1) : 1;
            json_response(['ok' => true, 'tiket_id' => $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT)]);
            break;

        // ---- Dashboard Stats ----
        case '/laporan/stats':
            $days = intval($_GET['days'] ?? 0); // 0 = semua
            $dateFilter = $days > 0 ? "AND lk.created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)" : '';

            // ME stats — all laporan_kendala entries ARE "ME" reports
            $meTotal = (int)$pdo->query("SELECT COUNT(*) FROM laporan_kendala lk WHERE 1=1 $dateFilter")->fetchColumn();
            $mePending = (int)$pdo->query("SELECT COUNT(*) FROM laporan_kendala lk WHERE lk.status NOT IN ('selesai_dikerjakan','terverifikasi') $dateFilter")->fetchColumn();
            $meCompleted = (int)$pdo->query("SELECT COUNT(*) FROM laporan_kendala lk WHERE lk.status IN ('selesai_dikerjakan','terverifikasi') $dateFilter")->fetchColumn();
            $meRate = $meTotal > 0 ? round($meCompleted / $meTotal * 100) : 0;

            // Oldest open ticket age in days
            $oldestRow = $pdo->query("SELECT MIN(created_at) FROM laporan_kendala lk WHERE lk.status NOT IN ('selesai_dikerjakan','terverifikasi') $dateFilter")->fetchColumn();
            $oldestDays = $oldestRow ? (int)floor((time() - strtotime($oldestRow)) / 86400) : 0;

            // GA = completed/verified tickets (treated as GA pekerjaan)
            $gaTotal = $meCompleted;
            $gaPendingVerify = (int)$pdo->query("SELECT COUNT(*) FROM laporan_kendala lk WHERE lk.status = 'selesai_dikerjakan' $dateFilter")->fetchColumn();
            $gaVerified = (int)$pdo->query("SELECT COUNT(*) FROM laporan_kendala lk WHERE lk.status IN ('selesai_dikerjakan','terverifikasi') $dateFilter")->fetchColumn();

            // Unique technicians (by user_id)
            $techCount = (int)$pdo->query("SELECT COUNT(DISTINCT user_id) FROM laporan_kendala WHERE user_id IS NOT NULL")->fetchColumn();

            // Global
            $globalTotal = $meTotal; // same records
            $attentionNeeded = $mePending + $gaPendingVerify; // open kendala + unverified GA
            $outletCount = (int)$pdo->query("SELECT COUNT(DISTINCT outlet_id) FROM laporan_kendala lk WHERE 1=1 $dateFilter")->fetchColumn();
            $totalOutlets = (int)$pdo->query("SELECT COUNT(*) FROM outlets WHERE status='active'")->fetchColumn();

            // Avg per day: total / days span
            $firstDate = $pdo->query("SELECT MIN(DATE(created_at)) FROM laporan_kendala")->fetchColumn();
            $daySpan = $firstDate ? max(1, (int)floor((time() - strtotime($firstDate)) / 86400)) : 1;
            $avgPerDay = round($globalTotal / $daySpan, 1);

            // Per-outlet breakdown
            $outletStmt = $pdo->query("
                SELECT o.kode, o.nama,
                    SUM(CASE WHEN lk.status NOT IN ('selesai_dikerjakan','terverifikasi') THEN 1 ELSE 0 END) AS kendala_terbuka,
                    COUNT(lk.id) AS total_kendala,
                    SUM(CASE WHEN lk.status IN ('selesai_dikerjakan','terverifikasi') AND u.type='ga' THEN 1 ELSE 0 END) AS pekerjaan_ga,
                    SUM(CASE WHEN u.type='me' THEN 1 ELSE 0 END) AS pekerjaan_me
                FROM outlets o
                LEFT JOIN laporan_kendala lk ON lk.outlet_id = o.id " . ($dateFilter ? preg_replace('/^AND\s+/', '', $dateFilter) : '') . "
                LEFT JOIN user u ON u.id = lk.user_id
                WHERE o.status = 'active'
                GROUP BY o.id, o.kode, o.nama
                ORDER BY o.kode
            ");
            $byOutlet = [];
            foreach ($outletStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $terbuka = (int)$row['kendala_terbuka'];
                $row['kendala_terbuka'] = $terbuka;
                $row['total_kendala'] = (int)$row['total_kendala'];
                $row['pekerjaan_ga'] = (int)$row['pekerjaan_ga'];
                $row['pekerjaan_me'] = (int)$row['pekerjaan_me'];
                $row['status'] = $terbuka === 0 ? 'aman' : "{$terbuka} terbuka";
                $byOutlet[] = $row;
            }

            // Per-day chart data (last 14 days)
            $perDayStmt = $pdo->query("
                SELECT DATE(created_at) AS date,
                    COUNT(*) AS kendala_me,
                    SUM(CASE WHEN status IN ('selesai_dikerjakan','terverifikasi') THEN 1 ELSE 0 END) AS pekerjaan_ga
                FROM laporan_kendala
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            ");
            $perDay = $perDayStmt->fetchAll(PDO::FETCH_ASSOC);

            // Tech productivity: group by user, count completed
            $techStmt = $pdo->query("
                SELECT COALESCE(t.name, 'Unknown') AS team,
                    COUNT(*) AS count
                FROM laporan_kendala lk
                LEFT JOIN `user` t ON t.id = lk.user_id
                WHERE lk.status = 'selesai_dikerjakan'
                GROUP BY lk.user_id
                ORDER BY count DESC
                LIMIT 10
            ");
            $techProductivity = $techStmt->fetchAll(PDO::FETCH_ASSOC);

            json_response([
                'ok' => true,
                'me' => [
                    'total' => $meTotal,
                    'pending' => $mePending,
                    'completed' => $meCompleted,
                    'resolution_rate' => $meRate,
                    'oldest_age_days' => $oldestDays,
                ],
                'ga' => [
                    'total' => $gaTotal,
                    'pending_verify' => $gaPendingVerify,
                    'verified' => $gaVerified,
                    'tech_count' => $techCount,
                ],
                'global' => [
                    'total' => $globalTotal,
                    'attention_needed' => $attentionNeeded,
                    'outlet_count' => $outletCount,
                    'total_outlets' => $totalOutlets,
                    'avg_per_day' => $avgPerDay,
                ],
                'by_outlet' => $byOutlet,
                'per_day' => $perDay,
                'tech_productivity' => $techProductivity,
            ]);
            break;

        // ---- Laporan Feed ----
        case '/laporan/feed':
            $filter = $_GET['filter'] ?? 'all';
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(50, max(1, intval($_GET['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;

            $whereExtra = '';
            if ($filter === 'me') {
                $whereExtra = "AND lk.status NOT IN ('selesai_dikerjakan','terverifikasi')";
            } elseif ($filter === 'ga') {
                $whereExtra = "AND lk.status IN ('selesai_dikerjakan','terverifikasi')";
            } elseif ($filter === 'attention') {
                $whereExtra = "AND lk.status NOT IN ('selesai_dikerjakan','terverifikasi')";
            }

            // type filter: me / ga (by user.name)
            $typeFilter = $_GET['type'] ?? '';
            if ($typeFilter === 'me') {
                $whereExtra .= " AND t.name = 'ME'";
            } elseif ($typeFilter === 'ga') {
                $whereExtra .= " AND t.name = 'GA'";
            }

            // outlet_id filter
            if (!empty($_GET['outlet_id'])) {
                $whereExtra .= " AND lk.outlet_id = " . intval($_GET['outlet_id']);
            }

            // user_id filter — filter by exact user
            if (!empty($_GET['user_id'])) {
                $whereExtra .= " AND lk.user_id = " . intval($_GET['user_id']);
            }

            // status filter
            $statusFilter = $_GET['status'] ?? '';
            $statusParams = [];
            if ($statusFilter !== '') {
                $whereExtra .= " AND lk.status = ?";
                $statusParams[] = $statusFilter;
            }

            $searchExtra = '';
            $searchParams = [];
            if (!empty($_GET['search'])) {
                $searchExtra = "AND lk.tiket_id LIKE ?";
                $searchParams[] = '%' . $_GET['search'] . '%';
            }

            $countStmt = $pdo->prepare("SELECT COUNT(*) FROM laporan_kendala lk LEFT JOIN `user` t ON t.id = lk.user_id WHERE 1=1 $whereExtra $searchExtra");
            $countStmt->execute(array_merge($statusParams, $searchParams));
            $total = $countStmt->fetchColumn();

            $stmt = $pdo->prepare("
                SELECT lk.id, lk.tiket_id, lk.status, lk.level, lk.created_at, lk.updated_at, lk.device, lk.total_kendala,
                    lk.user_id,
                    o.kode AS outlet_kode, o.nama AS outlet_nama,
                    t.name AS tim_name, t.type AS tim_type,
                    (SELECT jk2.schedule_date FROM jadwal_kendala jk2 WHERE jk2.tiket_id = lk.tiket_id ORDER BY jk2.id DESC LIMIT 1) AS schedule_date,
                    (SELECT jk2.deadline_date FROM jadwal_kendala jk2 WHERE jk2.tiket_id = lk.tiket_id ORDER BY jk2.id DESC LIMIT 1) AS deadline_date,
                    (SELECT GROUP_CONCAT(ki.keterangan ORDER BY ki.id SEPARATOR ' | ') FROM kendala_items ki WHERE ki.tiket_id = lk.tiket_id) AS keterangan,
                    kg.kategori
                FROM laporan_kendala lk
                LEFT JOIN outlets o ON o.id = lk.outlet_id
                LEFT JOIN `user` t ON t.id = lk.user_id
                LEFT JOIN katalog_gejala kg ON kg.gejala_id = lk.gejala_id
                WHERE 1=1 $whereExtra $searchExtra
                ORDER BY lk.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute(array_merge($statusParams, $searchParams, [$limit, $offset]));
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $nowWIB = new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta'));
            $now = $nowWIB->getTimestamp();
            $feed = [];
            foreach ($rows as $row) {
                // created_at dari MySQL sudah WIB — parse eksplisit agar tidak salah tz
                $createdTs = (new DateTimeImmutable($row['created_at'], new DateTimeZone('Asia/Jakarta')))->getTimestamp();
                $diffDays = (int)floor(($now - $createdTs) / 86400);

                if ($diffDays === 0) $relTime = 'Hari ini';
                elseif ($diffDays === 1) $relTime = 'Kemarin';
                else $relTime = $diffDays . ' hari lalu';

                $absDate = (new DateTimeImmutable('@' . $createdTs))->setTimezone(new DateTimeZone('Asia/Jakarta'))->format('d M, H.i');

                // Determine tipe
                $isGA = in_array($row['status'], ['selesai_dikerjakan', 'terverifikasi']);
                $tipe = $isGA ? 'GA' : 'ME';

                // Priority: over 7 days open = TELAT, else ON TIME
                $priority = (!$isGA && $diffDays > 7) ? 'TELAT' : 'ON TIME';

                $feed[] = [
                    'id' => $row['id'],
                    'tiket_id' => $row['tiket_id'],
                    'tipe' => $tipe,
                    'user_id' => $row['user_id'] ?? null,
                    'outlet_kode' => $row['outlet_kode'] ?? '-',
                    'outlet_nama' => $row['outlet_nama'] ?? '-',
                    'keterangan' => $row['keterangan'] ?? 'Tidak ada keterangan',
                    'waktu' => $relTime,
                    'date' => $absDate,
                    'status' => $row['status'],
                    'priority' => $priority,
                    'level' => $row['level'],
                    'total_kendala' => (int)$row['total_kendala'],
                    'created_at' => utc_to_wib($row['created_at']),
                    'raw_created_at' => utc_to_wib($row['created_at']),
                    'tim_name' => $row['tim_name'] ?? null,
                    'tim_type' => $row['tim_type'] ?? null,
                    'kategori' => $row['kategori'] ?? null,
                    'device' => $row['device'] ?? null,
                    'sla_hours' => match($row['level']) { 'L1' => 24, 'L2' => 72, 'L3' => 120, default => null },
                    'sla_deadline' => $row['level'] ? (function($ca,$lvl){ $ts=(new DateTimeImmutable($ca, new DateTimeZone('Asia/Jakarta')))->getTimestamp()+match($lvl){'L1'=>86400,'L2'=>259200,'L3'=>432000,default=>0}; return (new DateTime('@'.$ts))->setTimezone(new DateTimeZone('Asia/Jakarta'))->format('Y-m-d\TH:i:sP'); })($row['created_at'],$row['level']) : null,
                    'schedule_date' => utc_to_wib($row['schedule_date']),
                    'deadline_date' => utc_to_wib($row['deadline_date']),
                    'updated_at' => utc_to_wib($row['updated_at']),
                ];
            }

            json_response([
                'ok' => true,
                'data' => $feed,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => (int)ceil($total / $limit),
                ],
            ]);
            break;

        // ---- Simpan Laporan Kendala (POST) ----
        case '/laporan/store':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                json_response(['ok' => false, 'message' => 'Method not allowed'], 405);
            }

            $body = read_json_body();

            // Support frontend format: { outlet, gps, sla_type, issues[] }
            // and legacy format: { tiket_id, outlet, lat, lon, kendala[] }
            $outlet     = $body['outlet'] ?? ($body['kode'] ?? '');
            $lat        = $body['lat'] ?? ($body['gps']['lat'] ?? null);
            $lon        = $body['lon'] ?? ($body['gps']['lon'] ?? null);
            $accuracy   = $body['accuracy'] ?? ($body['gps']['acc'] ?? null);
            $address    = $body['address'] ?? ($body['gps']['addr'] ?? null);
            $slaType    = $body['sla_type'] ?? $body['level'] ?? 'L1';
            $gejalaId   = $body['gejala_id'] ?? null;
            $device     = $body['device'] ?? null;
            $userId     = $body['user_id'] ?? $body['tim_id'] ?? 1; // default ME
            // Ignore client created_at — always use server time in WIB
            $createdAt  = (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format('Y-m-d H:i:s');

            // Lookup level dari katalog_gejala jika gejala_id ada
            if ($gejalaId) {
                $katStmt = $pdo->prepare("SELECT level FROM katalog_gejala WHERE gejala_id = ?");
                $katStmt->execute([$gejalaId]);
                $katRow = $katStmt->fetch(PDO::FETCH_ASSOC);
                if ($katRow) {
                    $lvlMap = ['1'=>'L1','2'=>'L2','3'=>'L3'];
                    $slaType = $lvlMap[(string)$katRow['level']] ?? $slaType;
                }
            }

            // Build kendala list
            if (isset($body['kendala']) && is_array($body['kendala'])) {
                $kendalaList = $body['kendala'];
            } elseif (isset($body['issues']) && is_array($body['issues'])) {
                $kendalaList = [];
                foreach ($body['issues'] as $issue) {
                    $fotoBase64 = null;
                    if (!empty($issue['photo']['url'])) {
                        $fotoBase64 = $issue['photo']['url'];
                    } elseif (!empty($issue['photos'][0]['url'])) {
                        $fotoBase64 = $issue['photos'][0]['url'];
                    }
                    $kendalaList[] = [
                        'keterangan'  => $issue['keterangan'] ?? '',
                        'foto_base64' => $fotoBase64,
                        'lat'         => $issue['lat'] ?? $lat,
                        'lon'         => $issue['lon'] ?? $lon,
                        'photo_taken_at' => $issue['photo_taken_at'] ?? null,
                    ];
                }
            } else {
                json_response(['ok' => false, 'message' => 'Field kendala[] atau issues[] wajib diisi'], 422);
            }

            // Generate tiket_id
            if (empty($body['tiket_id'])) {
                $d = (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format('dmy');
                $prefix = 'TKT-' . $d . '-';
                $stmt2 = $pdo->prepare("SELECT tiket_id FROM laporan_kendala WHERE tiket_id LIKE ? ORDER BY tiket_id DESC LIMIT 1");
                $stmt2->execute([$prefix . '%']);
                $last2 = $stmt2->fetchColumn();
                $seq = $last2 ? (intval(substr($last2, -3)) + 1) : 1;
                $tiketId = $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT);
            } else {
                $tiketId = $body['tiket_id'];
            }

            // Validation
            if (empty($outlet)) {
                json_response(['ok' => false, 'message' => "Field 'outlet' wajib diisi"], 422);
            }
            if ($lat === null || $lon === null) {
                json_response(['ok' => false, 'message' => "GPS (lat/lon) wajib diisi"], 422);
            }
            if (count($kendalaList) === 0) {
                json_response(['ok' => false, 'message' => 'Minimal 1 kendala harus diisi'], 422);
            }
            foreach ($kendalaList as $i => $k) {
                if (empty($k['keterangan'])) {
                    json_response(['ok' => false, 'message' => "Kendala " . ($i + 1) . ": keterangan wajib diisi"], 422);
                }
                if (empty($k['foto_base64'])) {
                    json_response(['ok' => false, 'message' => "Kendala " . ($i + 1) . ": foto wajib diambil"], 422);
                }
            }

            // Lookup outlet_id
            $stmt = $pdo->prepare("SELECT id FROM outlets WHERE kode = ?");
            $stmt->execute([$outlet]);
            $outletRow = $stmt->fetch();
            if (!$outletRow) {
                json_response(['ok' => false, 'message' => "Outlet '$outlet' tidak ditemukan"], 422);
            }
            $outletId = $outletRow['id'];

            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare("INSERT INTO laporan_kendala
                    (tiket_id, outlet_id, user_id, status, lat, lon, accuracy, address, level, gejala_id, total_kendala, device, created_at)
                    VALUES (?, ?, ?, 'dijadwalkan', ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$tiketId, $outletId, $userId, $lat, $lon, $accuracy, $address, $slaType, $gejalaId, count($kendalaList), $device, $createdAt ?? date('Y-m-d H:i:s')]);

                // INSERT jadwal_kendala
                $scheduleHours = match($slaType) { 'L1' => 24, 'L2' => 72, 'L3' => 120, default => null };
                $baseDate = $createdAt ?? (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format('Y-m-d H:i:s');
                $baseDt   = new DateTimeImmutable($baseDate, new DateTimeZone('Asia/Jakarta'));
                $deadlineTs = $scheduleHours ? $baseDt->getTimestamp() + $scheduleHours * 3600 : null;
                // Lewati hari Minggu: jika deadline jatuh di Minggu, geser +24jam
                if ($deadlineTs && (new DateTimeImmutable('@' . $deadlineTs))->setTimezone(new DateTimeZone('Asia/Jakarta'))->format('N') == 7) {
                    $deadlineTs += 86400;
                }
                $deadlineDate = $deadlineTs ? (new DateTimeImmutable('@' . $deadlineTs))->setTimezone(new DateTimeZone('Asia/Jakarta'))->format('Y-m-d H:i:s') : null;
                $jadwalStmt = $pdo->prepare("INSERT INTO jadwal_kendala (tiket_id, schedule_date, deadline_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE schedule_date=VALUES(schedule_date), deadline_date=VALUES(deadline_date), updated_at=VALUES(updated_at)");
                $jadwalStmt->execute([$tiketId, $baseDate, $deadlineDate, $baseDate, $baseDate]);

                $kendalaStmt = $pdo->prepare("INSERT INTO kendala_items
                    (tiket_id, foto_url, keterangan, lat, lon)
                    VALUES (?, ?, ?, ?, ?)");

                $savedKendala = 0;
                foreach ($kendalaList as $k) {
                    $fotoData = $k['foto_base64'] ?? ($k['photos'][0]['url'] ?? null);
                    $fotoPath = saveFotoBase64($fotoData, 'laporan', 'kendala', $tiketId);

                    $kendalaStmt->execute([
                        $tiketId,
                        $fotoPath,
                        $k['keterangan'],
                        $k['lat'] ?? $lat,
                        $k['lon'] ?? $lon,
                    ]);
                    $savedKendala++;
                }

                $pdo->commit();
                json_response([
                    'ok' => true,
                    'tiket_id' => $tiketId,
                    'total_kendala' => $savedKendala,
                    'message' => 'Laporan kendala berhasil disimpan',
                ], 201);

            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;

        // ---- Update Status Laporan (POST) ----
        case '/laporan/status':
            if (!in_array($_SERVER['REQUEST_METHOD'], ['POST','PATCH'])) {
                json_response(['ok' => false, 'message' => 'Method not allowed'], 405);
            }
            $raw = file_get_contents('php://input');
            $body = json_decode($raw, true) ?: [];
            $id     = $body['id'] ?? null;
            $status = $body['status'] ?? null;
            $allowed = ['dijadwalkan','sedang_dikerjakan','selesai_dikerjakan','terverifikasi','tunggu_barang','barang_diproses','barang_ready','over_sla'];
            if (!$id || !$status || !in_array($status, $allowed)) {
                json_response(['ok' => false, 'message' => 'id dan status wajib diisi'], 400);
            }
            $pdo = db();
            // Ambil status lama sebelum update
            $prevRow = $pdo->prepare('SELECT status FROM laporan_kendala WHERE id = ? LIMIT 1');
            $prevRow->execute([$id]);
            $prevStatus = $prevRow->fetchColumn();
            if ($prevStatus === false) {
                json_response(['ok' => false, 'message' => 'Laporan tidak ditemukan'], 404);
            }

            if ($status === 'sedang_dikerjakan') {
                $namaPetugas = $body['nama_petugas'] ?? null;
            } elseif ($status === 'dijadwalkan') {
                $namaPetugas = null;
            } else {
                $npStmt = $pdo->prepare('SELECT nama_petugas FROM laporan_kendala WHERE id = ? LIMIT 1');
                $npStmt->execute([$id]);
                $namaPetugas = $npStmt->fetchColumn() ?: null;
            }

            // Jika mulai kerjakan → simpan prev_status; jika batalkan → baca prev_status dari DB
            if ($status === 'sedang_dikerjakan') {
                $stmt = $pdo->prepare('UPDATE laporan_kendala SET status=?, prev_status=?, updated_at=NOW(), nama_petugas=? WHERE id=?');
                $stmt->execute([$status, $prevStatus, $namaPetugas, $id]);
                upsert_petugas($namaPetugas);
            } elseif ($prevStatus === 'sedang_dikerjakan' && !in_array($status, ['selesai_dikerjakan','terverifikasi'])) {
                // Batalkan pekerjaan → revert ke prev_status tersimpan di DB
                $ps = $pdo->prepare('SELECT prev_status FROM laporan_kendala WHERE id = ? LIMIT 1');
                $ps->execute([$id]);
                $savedPrev = $ps->fetchColumn();
                if ($savedPrev) {
                    $status = $savedPrev;
                } else {
                    // Tiket lama tanpa prev_status — cek apakah over SLA
                    $slaRow = $pdo->prepare("SELECT lk.level, jk.deadline_date FROM laporan_kendala lk LEFT JOIN jadwal_kendala jk ON jk.tiket_id=lk.tiket_id WHERE lk.id=? LIMIT 1");
                    $slaRow->execute([$id]);
                    $slaData = $slaRow->fetch(PDO::FETCH_ASSOC);
                    if ($slaData && !empty($slaData['deadline_date']) && strtotime($slaData['deadline_date'] . ' UTC') < time()) {
                        $status = 'over_sla';
                    } else {
                        $status = 'dijadwalkan';
                    }
                }
                $stmt = $pdo->prepare('UPDATE laporan_kendala SET status=?, prev_status=NULL, updated_at=NOW(), nama_petugas=? WHERE id=?');
                $stmt->execute([$status, null, $id]);
            } else {
                $stmt = $pdo->prepare('UPDATE laporan_kendala SET status=?, updated_at=NOW(), nama_petugas=? WHERE id=?');
                $stmt->execute([$status, $namaPetugas, $id]);
                upsert_petugas($namaPetugas);
            }

            // Hold deadline saat → tunggu_barang atau barang_diproses
            if ($status === 'tunggu_barang' || $status === 'barang_diproses') {
                $tkHold = $pdo->prepare("SELECT tiket_id FROM laporan_kendala WHERE id = ? LIMIT 1");
                $tkHold->execute([$id]);
                $tkHoldRow = $tkHold->fetch(PDO::FETCH_ASSOC);
                if ($tkHoldRow) {
                    $pdo->prepare("UPDATE jadwal_kendala SET held_at=NOW(), held_hours_elapsed=TIMESTAMPDIFF(SECOND,created_at,NOW())/3600.0, updated_at=NOW() WHERE tiket_id=? AND held_at IS NULL")
                        ->execute([$tkHoldRow['tiket_id']]);
                }
            }

            // Resume deadline hanya saat → barang_ready (barang_diproses + tunggu_barang tetap hold)
            if ($status === 'barang_ready') {
                $tkRow = $pdo->prepare("SELECT tiket_id, level FROM laporan_kendala WHERE id = ? LIMIT 1");
                $tkRow->execute([$id]);
                $tk = $tkRow->fetch(PDO::FETCH_ASSOC);

                if ($tk) {
                    $slaMap = ['L1' => 24, 'L2' => 72, 'L3' => 120];
                    $totalHours = $slaMap[$tk['level']] ?? 24;

                    // Ambil held_hours_elapsed dari jadwal_kendala
                    $heldRow = $pdo->prepare("SELECT held_hours_elapsed FROM jadwal_kendala WHERE tiket_id = ? AND held_at IS NOT NULL LIMIT 1");
                    $heldRow->execute([$tk['tiket_id']]);
                    $held = $heldRow->fetch(PDO::FETCH_ASSOC);
                    $sisaJam = $totalHours - (float)($held['held_hours_elapsed'] ?? 0);

                    // Jika sebelumnya over_sla atau sisa < 24j → deadline H+1 17:00 WIB fix
                    if ($prevStatus === 'over_sla' || $sisaJam < 24) {
                        $nowWib = new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta'));
                        $deadlineDate = $nowWib->modify('+1 day')->format('Y-m-d') . ' 17:00:00';
                    } else {
                        // Sisa cukup → resume dari sekarang + sisa jam, skip Minggu
                        $nowWib      = new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta'));
                        $deadlineTs  = $nowWib->getTimestamp() + (int)round($sisaJam * 3600);
                        if ((new DateTimeImmutable('@'.$deadlineTs))->setTimezone(new DateTimeZone('Asia/Jakarta'))->format('N') == 7) $deadlineTs += 86400;
                        $deadlineDate = (new DateTimeImmutable('@'.$deadlineTs))->setTimezone(new DateTimeZone('Asia/Jakarta'))->format('Y-m-d H:i:s');
                    }

                    $resumeStmt = $pdo->prepare("
                        UPDATE jadwal_kendala
                        SET deadline_date = ?,
                            held_at = NULL,
                            held_hours_elapsed = NULL,
                            updated_at = NOW()
                        WHERE tiket_id = ? AND held_at IS NOT NULL
                    ");
                    $resumeStmt->execute([$deadlineDate, $tk['tiket_id']]);

                    // status_barang: sudah tersedia hanya saat barang_ready
                    if ($status === 'barang_ready') {
                        $pdo->prepare("UPDATE laporan_perbaikan SET status_barang='sudah tersedia' WHERE tiket_id=?")
                            ->execute([$tk['tiket_id']]);
                    }
                }
            }

            json_response(['ok' => true, 'id' => $id, 'status' => $status]);
            break;

        // ---- SLA auto-tick: set over_sla jika deadline lewat & belum ada di laporan_perbaikan ----
        case '/sla/tick':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                json_response(['ok' => false, 'message' => 'Method not allowed'], 405);
            }
            $pdo = db();
            // Tiket yang masih aktif (bukan selesai/terverifikasi/over_sla)
            $activeStmt = $pdo->query("
                SELECT lk.id, lk.tiket_id, lk.level,
                    (SELECT jk.deadline_date FROM jadwal_kendala jk
                     WHERE jk.tiket_id = lk.tiket_id AND jk.held_at IS NULL
                     ORDER BY jk.id DESC LIMIT 1) AS deadline_date
                FROM laporan_kendala lk
                WHERE lk.status NOT IN ('selesai_dikerjakan','terverifikasi','over_sla','sedang_dikerjakan')
            ");
            $actives = $activeStmt->fetchAll(PDO::FETCH_ASSOC);
            $updated = 0;
            foreach ($actives as $row) {
                if (!$row['deadline_date']) continue;
                $deadlineTs = (new DateTimeImmutable($row['deadline_date'], new DateTimeZone('Asia/Jakarta')))->getTimestamp();
                $nowTs = (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->getTimestamp();
                if ($deadlineTs === false || $nowTs <= $deadlineTs) continue;
                // Cek apakah sudah ada tindakan di laporan_perbaikan
                $lpCheck = $pdo->prepare("SELECT COUNT(*) FROM laporan_perbaikan WHERE tiket_id = ?");
                $lpCheck->execute([$row['tiket_id']]);
                if ($lpCheck->fetchColumn() > 0) continue; // sudah ada tindakan → skip
                // Lewat deadline & belum ada tindakan → over_sla
                $pdo->prepare("UPDATE laporan_kendala SET status='over_sla', updated_at=NOW() WHERE id=?")
                    ->execute([$row['id']]);
                $updated++;
            }
            json_response(['ok' => true, 'updated' => $updated]);
            break;
        case '/laporan/detail':
            if (!isset($_GET['id'])) {
                json_response(['ok' => false, 'message' => 'id required'], 400);
            }
            $id = (int)$_GET['id'];
            $stmt = $pdo->prepare("SELECT lk.*, o.kode AS outlet_kode, o.nama AS outlet_nama,
                t.name AS tim_name, t.type AS tim_type,
                (SELECT jk.deadline_date FROM jadwal_kendala jk WHERE jk.tiket_id = lk.tiket_id ORDER BY jk.id DESC LIMIT 1) AS deadline_date,
                kg.kategori
                FROM laporan_kendala lk
                LEFT JOIN outlets o ON o.id = lk.outlet_id
                LEFT JOIN `user` t ON t.id = lk.user_id
                LEFT JOIN katalog_gejala kg ON kg.gejala_id = lk.gejala_id
                WHERE lk.id = ?");
            $stmt->execute([$id]);
            $laporan = $stmt->fetch();
            if (!$laporan) {
                json_response(['ok' => false, 'message' => 'Laporan tidak ditemukan'], 404);
            }
            $stmt2 = $pdo->prepare("SELECT * FROM kendala_items WHERE tiket_id = ? ORDER BY id");
            $stmt2->execute([$laporan['tiket_id']]);
            $kendalaItems = $stmt2->fetchAll();

            $stmt3 = $pdo->prepare("SELECT * FROM laporan_perbaikan WHERE tiket_id = ? ORDER BY id DESC LIMIT 1");
            $stmt3->execute([$laporan['tiket_id']]);
            $perbaikan = $stmt3->fetch() ?: null;

            $perbaikanItems = [];
            if ($perbaikan) {
                $stmt4 = $pdo->prepare("SELECT * FROM perbaikan_items WHERE tiket_id = ? ORDER BY id");
                $stmt4->execute([$laporan['tiket_id']]);
                $perbaikanItems = $stmt4->fetchAll();
            }

            $stmt5 = $pdo->prepare("SELECT * FROM laporan_pengadaan WHERE tiket_id = ? ORDER BY id DESC LIMIT 1");
            $stmt5->execute([$laporan['tiket_id']]);
            $pengadaan = $stmt5->fetch() ?: null;

            $pengadaanItems = [];
            if ($pengadaan) {
                $stmt6 = $pdo->prepare("SELECT * FROM pengadaan_items WHERE tiket_id = ? ORDER BY id ASC");
                $stmt6->execute([$laporan['tiket_id']]);
                $pengadaanItems = $stmt6->fetchAll();
            }

            $dtFields = ['created_at','updated_at'];
            $normDt = function(?array $row) use ($dtFields): ?array {
                if (!$row) return null;
                foreach ($dtFields as $f) {
                    if (!empty($row[$f])) $row[$f] = utc_to_wib($row[$f]);
                }
                return $row;
            };
            json_response(['ok' => true, 'laporan' => array_merge($laporan, [
                'created_at'    => utc_to_wib($laporan['created_at']),
                'updated_at'    => utc_to_wib($laporan['updated_at']),
                'deadline_date' => utc_to_wib($laporan['deadline_date']),
            ]), 'kendala' => $kendalaItems,
               'perbaikan' => $normDt($perbaikan),
               'perbaikan_items' => array_map($normDt, $perbaikanItems),
               'pengadaan' => $normDt($pengadaan),
               'pengadaan_items' => array_map($normDt, $pengadaanItems)]);
            break;

        // ---- Detail Laporan (GET) ----
        case '/laporan/detail':
            if (preg_match('#^/laporan/detail/(\\d+)$#', $route, $m) || (str_starts_with($route, '/laporan/detail') && isset($_GET['id']))) {
                $id = isset($m[1]) ? (int)$m[1] : (int)$_GET['id'];
                $stmt = $pdo->prepare("SELECT lk.*, o.kode AS outlet_kode, o.nama AS outlet_nama,
                    (SELECT jk.deadline_date FROM jadwal_kendala jk WHERE jk.tiket_id = lk.tiket_id ORDER BY jk.id DESC LIMIT 1) AS deadline_date,
                    kg.kategori AS gejala_kategori
                    FROM laporan_kendala lk
                    LEFT JOIN outlets o ON o.id = lk.outlet_id
                    LEFT JOIN katalog_gejala kg ON kg.gejala_id = lk.gejala_id
                    WHERE lk.id = ?");
                $stmt->execute([$id]);
                $laporan = $stmt->fetch();
                if (!$laporan) {
                    json_response(['ok' => false, 'message' => 'Laporan tidak ditemukan'], 404);
                }

                $stmt2 = $pdo->prepare("SELECT * FROM kendala_items WHERE tiket_id = ? ORDER BY id");
                $stmt2->execute([$laporan['tiket_id']]);
                $kendalaItems = $stmt2->fetchAll();

                $dl = $laporan['deadline_date'];
                json_response([
                    'ok' => true,
                    'laporan' => array_merge($laporan, [
                        'created_at'    => utc_to_wib($laporan['created_at']),
                        'updated_at'    => utc_to_wib($laporan['updated_at']),
                        'deadline_date' => utc_to_wib($dl),
                    ]),
                    'kendala' => $kendalaItems,
                ]);
            } else {
                json_response(['ok' => false, 'message' => 'Route not found'], 404);
            }
            break;

        case '/perbaikan/get':
            $tiketId = $_GET['tiket_id'] ?? null;
            if (!$tiketId) json_response(['ok' => false, 'message' => 'tiket_id required'], 400);
            $pdo = db();
            $row = $pdo->prepare("SELECT foto_before_id, foto_after_id, keterangan_perbaikan FROM laporan_perbaikan WHERE tiket_id = ? LIMIT 1");
            $row->execute([$tiketId]);
            $lp = $row->fetch(PDO::FETCH_ASSOC);
            if (!$lp) json_response(['ok' => false, 'message' => 'not found'], 404);
            json_response(['ok' => true, 'data' => $lp]);
            break;

        case '/perbaikan/store':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                json_response(['ok' => false, 'message' => 'Method not allowed'], 405);
            }
            $body    = read_json_body();
            $tiketId = $body['tiket_id'] ?? null;
            if (!$tiketId) json_response(['ok' => false, 'message' => 'tiket_id required'], 400);

            // Lookup outlet_id + user_id dari laporan_kendala
            $tkStmt = $pdo->prepare("SELECT outlet_id, user_id FROM laporan_kendala WHERE tiket_id = ? LIMIT 1");
            $tkStmt->execute([$tiketId]);
            $tk = $tkStmt->fetch(PDO::FETCH_ASSOC);
            if (!$tk) json_response(['ok' => false, 'message' => 'tiket tidak ditemukan'], 404);

            $namaPetugas = $body['nama_petugas'] ?? null;
            $butuhBarang = !empty($body['butuh_barang']) ? 1 : 0;

            // lat/lon: pakai dari body, fallback dari laporan_kendala
            $lkRow = $pdo->prepare("SELECT lat, lon FROM laporan_kendala WHERE tiket_id = ? LIMIT 1");
            $lkRow->execute([$tiketId]);
            $lkCoord = $lkRow->fetch(PDO::FETCH_ASSOC);
            $lat = $body['lat'] ?? $lkCoord['lat'] ?? null;
            $lon = $body['lon'] ?? $lkCoord['lon'] ?? null;

            // ── 1. Simpan foto ke uploads/perbaikan + insert perbaikan_items ──
            $fotoBefore = saveFotoBase64($body['foto_before_id'] ?? null, 'perbaikan', 'before', $tiketId);

            // foto_after_id bisa array (multi) atau string tunggal
            $fotoAfterRaw  = $body['foto_after_id'] ?? null;
            $fotoAfterArr  = [];
            if (is_array($fotoAfterRaw)) {
                foreach ($fotoAfterRaw as $idx => $b64) {
                    $saved = saveFotoBase64($b64, 'perbaikan', 'after', $tiketId);
                    if ($saved) $fotoAfterArr[] = $saved;
                }
            } elseif ($fotoAfterRaw) {
                $saved = saveFotoBase64($fotoAfterRaw, 'perbaikan', 'after', $tiketId);
                if ($saved) $fotoAfterArr[] = $saved;
            }
            $fotoAfterJson = !empty($fotoAfterArr) ? json_encode($fotoAfterArr, JSON_UNESCAPED_UNICODE) : null;

            $pdo->beginTransaction();
            try {

            $piStmt = $pdo->prepare("INSERT INTO perbaikan_items
                (tiket_id, outlet_id, user_id, nama_petugas, foto_before_url, foto_after_url, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())");
            $piStmt->execute([
                $tiketId,
                $tk['outlet_id'],
                $tk['user_id'],
                $namaPetugas,
                $fotoBefore,
                $fotoAfterJson,
            ]);
            upsert_petugas($namaPetugas);

            // ── 2. Upsert laporan_perbaikan ──
            $ketPerbaikanRaw = isset($body['keterangan_perbaikan'])
                ? json_encode($body['keterangan_perbaikan'], JSON_UNESCAPED_UNICODE)
                : null;
            $ketPerbaikan = ($ketPerbaikanRaw === false) ? null : $ketPerbaikanRaw;

            $existStmt = $pdo->prepare("SELECT id FROM laporan_perbaikan WHERE tiket_id = ? LIMIT 1");
            $existStmt->execute([$tiketId]);
            $existing = $existStmt->fetchColumn();

            if ($existing) {
                // tiket sudah ada — hanya update field yang diisi saat kirim laporan
                $updStmt = $pdo->prepare("UPDATE laporan_perbaikan
                    SET keterangan_perbaikan = ?,
                        foto_before_id       = ?,
                        foto_after_id        = ?,
                        updated_at           = NOW()
                    WHERE tiket_id = ?");
                $updStmt->execute([$ketPerbaikan, $fotoBefore, $fotoAfterJson, $tiketId]);
                $lpId = $existing;
            } else {
                // tiket baru — ambil data barang dari pengadaan_items jika ada
                $pgStmt = $pdo->prepare("SELECT detail_barang, foto_barang_url FROM pengadaan_items WHERE tiket_id = ? ORDER BY id ASC");
                $pgStmt->execute([$tiketId]);
                $pgRows = $pgStmt->fetchAll(PDO::FETCH_ASSOC);
                $detailBarang            = !empty($pgRows) ? json_encode(array_column($pgRows, 'detail_barang'), JSON_UNESCAPED_UNICODE)   : null;
                $fotoBarangFromPengadaan = !empty($pgRows) ? json_encode(array_column($pgRows, 'foto_barang_url'), JSON_UNESCAPED_UNICODE) : null;

                // status_barang: jika butuh_barang → belum tersedia, selain itu sudah tersedia
                $statusBarang = $butuhBarang ? 'belum tersedia' : 'sudah tersedia';

                // Jika butuh_barang → hold deadline jadwal_kendala
                if ($butuhBarang) {
                    $holdStmt = $pdo->prepare("
                        UPDATE jadwal_kendala
                        SET held_at              = NOW(),
                            held_hours_elapsed   = TIMESTAMPDIFF(SECOND, created_at, NOW()) / 3600.0,
                            updated_at           = NOW()
                        WHERE tiket_id = ? AND held_at IS NULL
                    ");
                    $holdStmt->execute([$tiketId]);
                }

                $insStmt = $pdo->prepare("INSERT INTO laporan_perbaikan
                    (tiket_id, nama_petugas, outlet_id, user_id,
                     keterangan_perbaikan, butuh_barang, status_barang,
                     detail_barang, foto_barang_url,
                     foto_before_id, foto_after_id,
                     lat, lon, created_at, updated_at)
                    VALUES (?,?,?,?, ?,?,?, ?,?, ?,?, ?,?, NOW(), NOW())");
                $insStmt->execute([
                    $tiketId, $namaPetugas, $tk['outlet_id'], $tk['user_id'],
                    $ketPerbaikan, $butuhBarang, $statusBarang,
                    $detailBarang, $fotoBarangFromPengadaan,
                    $fotoBefore, $fotoAfterJson,
                    $lat, $lon,
                ]);
                upsert_petugas($namaPetugas);
                $lpId = $pdo->lastInsertId();
            }

            // ── 3. Update status laporan_kendala → selesai_dikerjakan ──
            // Hanya update dari status aktif (bukan terverifikasi/over_sla/tunggu_barang/barang_diproses/barang_ready)
            $statusStmt = $pdo->prepare("UPDATE laporan_kendala SET status = 'selesai_dikerjakan', updated_at = NOW() WHERE tiket_id = ? AND status NOT IN ('terverifikasi','over_sla','tunggu_barang','barang_diproses','barang_ready')");
            $statusStmt->execute([$tiketId]);

            $pdo->commit();
            json_response(['ok' => true, 'id' => $lpId]);
            } catch (\Throwable $e) {
                $pdo->rollBack();
                json_response(['ok' => false, 'message' => $e->getMessage()], 500);
            }
            break;

        // ---- Simpan pengadaan_items ----
        case '/pengadaan/store':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                json_response(['ok' => false, 'message' => 'Method not allowed'], 405);
            }
            $body = read_json_body();
            $tiketId = $body['tiket_id'] ?? null;
            if (!$tiketId) json_response(['ok' => false, 'message' => 'tiket_id required'], 400);

            $alasanRaw   = isset($body['alasan']) ? json_encode($body['alasan'], JSON_UNESCAPED_UNICODE) : '[]';
            $alasan      = ($alasanRaw === false) ? '[]' : $alasanRaw;
            $barang      = $body['barang'] ?? [];
            $namaPetugas = $body['nama_petugas'] ?? null;

            // Lookup outlet_id + user_id dari laporan_kendala
            $tkStmt2 = $pdo->prepare("SELECT outlet_id, user_id FROM laporan_kendala WHERE tiket_id = ? LIMIT 1");
            $tkStmt2->execute([$tiketId]);
            $tk2 = $tkStmt2->fetch(PDO::FETCH_ASSOC);
            if (!$tk2) json_response(['ok' => false, 'message' => 'tiket tidak ditemukan'], 404);

            try {
                $pdo->beginTransaction();

                // Insert header ke laporan_pengadaan
                $insHeader = $pdo->prepare("INSERT INTO laporan_pengadaan
                    (tiket_id, outlet_id, user_id, nama_petugas, alasan, created_at)
                    VALUES (?,?,?,?,?, NOW())");
                $insHeader->execute([
                    $tiketId,
                    $tk2['outlet_id'],
                    $tk2['user_id'],
                    $namaPetugas,
                    $alasan,
                ]);
                upsert_petugas($namaPetugas);

                // Insert tiap item ke pengadaan_items
                $insItem = $pdo->prepare("INSERT INTO pengadaan_items
                    (tiket_id, foto_barang_url, detail_barang, created_at)
                    VALUES (?,?,?, NOW())");

                $lastId = null;
                foreach ($barang as $item) {
                    $insItem->execute([
                        $tiketId,
                        saveFotoBase64($item['foto_url'] ?? null, 'pengadaan', 'barang', $tiketId),
                        $item['detail'] ?? null,
                    ]);
                    $lastId = $pdo->lastInsertId();
                }

                // Sync laporan_perbaikan: update detail_barang + foto_barang_url sebagai JSON array + status_barang
                $syncItems = $pdo->prepare("SELECT detail_barang, foto_barang_url FROM pengadaan_items WHERE tiket_id = ? ORDER BY id ASC");
                $syncItems->execute([$tiketId]);
                $allItems = $syncItems->fetchAll(PDO::FETCH_ASSOC);
                $syncUpd = $pdo->prepare("UPDATE laporan_perbaikan SET
                    butuh_barang    = 1,
                    detail_barang   = ?,
                    foto_barang_url = ?,
                    status_barang   = 'belum tersedia'
                    WHERE tiket_id  = ?");
                $syncUpd->execute([
                    json_encode(array_column($allItems, 'detail_barang'), JSON_UNESCAPED_UNICODE),
                    json_encode(array_column($allItems, 'foto_barang_url'), JSON_UNESCAPED_UNICODE),
                    $tiketId,
                ]);

                $pdo->commit();
                json_response(['ok' => true, 'id' => $lastId]);
            } catch (\Throwable $e) {
                $pdo->rollBack();
                json_response(['ok' => false, 'message' => $e->getMessage()], 500);
            }
            break;

        // ---- Detail pengadaan per tiket ----
        case '/pengadaan/detail':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                json_response(['ok' => false, 'message' => 'Method not allowed'], 405);
            }
            $tiketId = $_GET['tiket_id'] ?? null;
            if (!$tiketId) json_response(['ok' => false, 'message' => 'tiket_id required'], 400);

            // header: alasan + nama petugas
            $hdr = $pdo->prepare("SELECT alasan, nama_petugas FROM laporan_pengadaan WHERE tiket_id = ? ORDER BY id DESC LIMIT 1");
            $hdr->execute([$tiketId]);
            $header = $hdr->fetch(PDO::FETCH_ASSOC);

            // items: foto + detail
            $itm = $pdo->prepare("SELECT foto_barang_url, detail_barang FROM pengadaan_items WHERE tiket_id = ? ORDER BY id ASC");
            $itm->execute([$tiketId]);
            $items = $itm->fetchAll(PDO::FETCH_ASSOC);

            // status terkini dari laporan_kendala
            $stRow = $pdo->prepare("SELECT status FROM laporan_kendala WHERE tiket_id = ? LIMIT 1");
            $stRow->execute([$tiketId]);
            $statusRow = $stRow->fetch(PDO::FETCH_ASSOC);

            json_response([
                'ok'          => true,
                'tiket_id'    => $tiketId,
                'nama_petugas'=> $header['nama_petugas'] ?? null,
                'alasan'      => $header ? json_decode($header['alasan'], true) : [],
                'status'      => $statusRow['status'] ?? null,
                'items'       => $items,
            ]);
            break;

        case '/jadwal-rutin':
            $rows = $pdo->query("
                SELECT jr.id, jr.task, jr.tipe, jr.hari, jr.outlet_id, jr.aktif,
                       GROUP_CONCAT(o.kode ORDER BY o.kode SEPARATOR ', ') AS outlet_kode
                FROM jadwal_rutin jr
                LEFT JOIN outlets o ON FIND_IN_SET(o.id, jr.outlet_id)
                WHERE jr.aktif = 1
                GROUP BY jr.id
                ORDER BY FIELD(jr.tipe,'harian','mingguan','2 minggu sekali','bulanan','2 bulan sekali'),
                         FIELD(jr.hari,'Senin,Selasa,Rabu,Kamis,Jumat,Sabtu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')
            ")->fetchAll(PDO::FETCH_ASSOC);
            json_response(['ok' => true, 'data' => $rows]);
            break;

        case '/daily/config':
            $rows = $pdo->query("
                SELECT dk.kode, dk.user_id, dk.nama AS kategori_nama,
                       dt.kode_task, dt.nama AS task_nama,
                       dt.outlet_id, dt.min_foto, dt.keterangan
                FROM daily_katalog dk
                LEFT JOIN daily_task dt ON dt.kode_task LIKE CONCAT(dk.kode, '-%')
                ORDER BY dk.kode, dt.kode_task
            ")->fetchAll(PDO::FETCH_ASSOC);

            $katalog = [];
            foreach ($rows as $row) {
                $kode = $row['kode'];
                if (!isset($katalog[$kode])) {
                    $katalog[$kode] = [
                        'kode'    => $kode,
                        'nama'    => $row['kategori_nama'],
                        'user_id' => (int)$row['user_id'],
                        'items'   => [],
                    ];
                }
                if ($row['kode_task']) {
                    $katalog[$kode]['items'][] = [
                        'kode_task'  => $row['kode_task'],
                        'nama'       => $row['task_nama'],
                        'min_foto'   => (int)$row['min_foto'],
                        'outlet_id'  => json_decode($row['outlet_id'] ?? '[]'),
                        'keterangan' => json_decode($row['keterangan'] ?? '[]'),
                    ];
                }
            }

            $outlets = [];
            foreach ($pdo->query("SELECT id, nama, kode FROM outlets ORDER BY id")->fetchAll(PDO::FETCH_ASSOC) as $o) {
                $outlets[(int)$o['id']] = ['nama' => $o['nama'], 'kode' => $o['kode']];
            }

            // jadwal dari daily_jadwal (CREATE IF NOT EXISTS agar tidak error sebelum migration)
            $pdo->exec("CREATE TABLE IF NOT EXISTS `daily_jadwal` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `user_id` int(11) NOT NULL,
                `day_of_week` tinyint(1) NOT NULL,
                `outlet_kode` varchar(20) NOT NULL,
                `tasks` json DEFAULT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uq_user_day` (`user_id`,`day_of_week`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            $jadwal = [];
            foreach ($pdo->query("SELECT user_id, day_of_week, outlet_kode, tasks FROM daily_jadwal ORDER BY user_id, day_of_week")->fetchAll(PDO::FETCH_ASSOC) as $j) {
                $jadwal[(int)$j['user_id']][(int)$j['day_of_week']] = [
                    'outlet' => $j['outlet_kode'],
                    'tasks'  => $j['tasks'] !== null ? json_decode($j['tasks']) : null,
                ];
            }

            json_response(['ok' => true, 'katalog' => array_values($katalog), 'outlets' => $outlets, 'jadwal' => $jadwal]);
            break;

        // ---- Daily Laporan ----
        case '/daily/store':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                json_response(['ok' => false, 'message' => 'Method not allowed'], 405);
                break;
            }
            $body = json_decode(file_get_contents('php://input'), true) ?? [];
            $outlet_id     = (int)($body['outlet_id']     ?? 0);
            $user_id       = (int)($body['user_id']       ?? 0);
            $petugas_nama  = trim($body['petugas_nama']   ?? '');
            $tasks         = $body['tasks']      ?? null;
            $date_store    = $body['date'] ?? null; // dev mode: tanggal custom, null=NOW()
            $lat           = isset($body['lat'])  ? (float)$body['lat']  : null;
            $lon           = isset($body['lon'])  ? (float)$body['lon']  : null;
            $address       = $body['address']    ?? null;
            $device        = $body['device']     ?? null;

            if (!$outlet_id || !$user_id || !$petugas_nama || !$tasks) {
                json_response(['ok' => false, 'message' => 'outlet_id, user_id, petugas_nama, tasks wajib diisi'], 422);
                break;
            }

            // lookup petugas.id dari nama
            $ps = $pdo->prepare('SELECT id FROM petugas WHERE nama = ? LIMIT 1');
            $ps->execute([$petugas_nama]);
            $petugas_id = (int)($ps->fetchColumn() ?: 0);
            if (!$petugas_id) {
                json_response(['ok' => false, 'message' => "Petugas '$petugas_nama' tidak ditemukan"], 422);
                break;
            }

            $created_at = $date_store ? ($date_store . ' 12:00:00') : date('Y-m-d H:i:s');
            // folder: daily_check_DDMMYY based on WIB date
            $wib_date  = $date_store ?: date('d-m-y', strtotime($created_at) + 7*3600);
            $dc_folder = 'daily_check_' . str_replace('-', '', date('dmy', strtotime(str_replace('-','/',$wib_date ?: date('Y-m-d')))));

            // save photos inside tasks
            if (is_array($tasks)) {
                foreach ($tasks as $kode => &$task) {
                    if (!empty($task['photos']) && is_array($task['photos'])) {
                        foreach ($task['photos'] as &$photo) {
                            if ($photo && str_starts_with($photo, 'data:')) {
                                $photo = saveFotoBase64($photo, $dc_folder, 'dc_' . $kode);
                            }
                        }
                        unset($photo);
                    }
                }
                unset($task);
            }

            $stmt = $pdo->prepare(
                'INSERT INTO daily_laporan (outlet_id, user_id, petugas_id, tasks, lat, lon, address, device, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $outlet_id, $user_id, $petugas_id,
                is_string($tasks) ? $tasks : json_encode($tasks),
                $lat, $lon, $address, $device, $created_at,
            ]);
            $newId = $pdo->lastInsertId();
            $row = $pdo->query("SELECT * FROM daily_laporan WHERE id = $newId")->fetch();
            foreach (['created_at', 'updated_at'] as $f) {
                if (!empty($row[$f])) $row[$f] = utc_to_wib($row[$f]);
            }
            json_response(['ok' => true, 'data' => $row]);
            break;

        case '/daily/lock':
            // POST=acquire/heartbeat, DELETE=release (or POST with _method=DELETE)
            $body      = json_decode(file_get_contents('php://input'), true) ?? [];
            $method    = $_SERVER['REQUEST_METHOD'];
            if ($method === 'POST' && (($_GET['_method'] ?? '') === 'DELETE' || ($body['_method'] ?? '') === 'DELETE')) {
                $method = 'DELETE';
            }
            $outlet_id = (int)($body['outlet_id'] ?? $_GET['outlet_id'] ?? 0);
            $user_id   = (int)($body['user_id']   ?? $_GET['user_id']   ?? 0);
            $petugas_nm = trim($body['petugas_nama'] ?? $_GET['petugas_nama'] ?? '');
            if (!$outlet_id || !$user_id || !$petugas_nm) {
                json_response(['ok' => false, 'message' => 'outlet_id, user_id, petugas_nama wajib'], 422);
                break;
            }
            // lookup petugas.id
            $ps2 = $pdo->prepare('SELECT id FROM petugas WHERE nama = ? LIMIT 1');
            $ps2->execute([$petugas_nm]);
            $pid = (int)($ps2->fetchColumn() ?: 0);
            if (!$pid) { json_response(['ok' => false, 'message' => "Petugas '$petugas_nm' tidak ditemukan"], 422); break; }

            if ($method === 'DELETE') {
                $pdo->prepare('DELETE FROM daily_lock WHERE outlet_id=? AND user_id=? AND petugas_id=?')
                    ->execute([$outlet_id, $user_id, $pid]);
                json_response(['ok' => true]);
                break;
            }
            // POST — acquire or heartbeat (UPSERT)
            // Check if someone else holds lock and it's fresh (<15s)
            $lk = $pdo->prepare('SELECT petugas_id, locked_at FROM daily_lock WHERE outlet_id=? AND user_id=? LIMIT 1');
            $lk->execute([$outlet_id, $user_id]);
            $existing = $lk->fetch();
            if ($existing && $existing['petugas_id'] != $pid) {
                $age = time() - strtotime($existing['locked_at']);
                if ($age < 15) {
                    // locked by someone else and fresh
                    $nm2 = $pdo->prepare('SELECT nama FROM petugas WHERE id=? LIMIT 1');
                    $nm2->execute([$existing['petugas_id']]);
                    json_response(['ok' => false, 'locked_by' => $nm2->fetchColumn() ?: 'Petugas Lain']);
                    break;
                }
            }
            $pdo->prepare(
                'INSERT INTO daily_lock (outlet_id, user_id, petugas_id, locked_at)
                 VALUES (?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE petugas_id=VALUES(petugas_id), locked_at=NOW()'
            )->execute([$outlet_id, $user_id, $pid]);
            json_response(['ok' => true]);
            break;

        case '/daily/check':
            // Cek apakah outlet+user sudah ada laporan hari ini
            $outlet_id    = isset($_GET['outlet_id'])    ? (int)$_GET['outlet_id']    : 0;
            $user_id      = isset($_GET['user_id'])      ? (int)$_GET['user_id']      : 0;
            $date_check   = $_GET['date'] ?? date('Y-m-d');
            if (!$outlet_id || !$user_id) { json_response(['ok' => false, 'message' => 'outlet_id dan user_id wajib'], 422); break; }
            $row = $pdo->prepare(
                "SELECT dl.id, p.nama AS petugas_nama
                 FROM daily_laporan dl
                 LEFT JOIN petugas p ON p.id = dl.petugas_id
                 WHERE dl.outlet_id = ? AND dl.user_id = ? AND DATE(CONVERT_TZ(dl.created_at,'+00:00','+07:00')) = ?
                 LIMIT 1"
            );
            $row->execute([$outlet_id, $user_id, $date_check]);
            $found = $row->fetch();
            json_response(['ok' => true, 'exists' => (bool)$found, 'petugas_nama' => $found['petugas_nama'] ?? null]);
            break;

        case '/daily/list':
            $outlet_id  = isset($_GET['outlet_id'])  ? (int)$_GET['outlet_id']  : null;
            $user_id    = isset($_GET['user_id'])     ? (int)$_GET['user_id']    : null;
            $date       = $_GET['date'] ?? date('Y-m-d'); // YYYY-MM-DD, default hari ini
            $limit      = min((int)($_GET['limit'] ?? 50), 200);
            $offset     = (int)($_GET['offset'] ?? 0);

            $where  = ["DATE(CONVERT_TZ(dl.created_at,'+00:00','+07:00')) = ?"];
            $params = [$date];
            if ($outlet_id) { $where[] = 'dl.outlet_id = ?';  $params[] = $outlet_id; }
            if ($user_id)   { $where[] = 'dl.user_id = ?';    $params[] = $user_id; }

            $whereStr = implode(' AND ', $where);
            $stmt = $pdo->prepare(
                "SELECT dl.*, o.nama AS outlet_nama, u.name AS user_nama, p.name AS petugas_nama
                 FROM daily_laporan dl
                 LEFT JOIN outlets o ON o.id = dl.outlet_id
                 LEFT JOIN user u ON u.id = dl.user_id
                 LEFT JOIN user p ON p.id = dl.petugas_id
                 WHERE $whereStr
                 ORDER BY dl.created_at DESC
                 LIMIT ? OFFSET ?"
            );
            $stmt->execute([...$params, $limit, $offset]);
            $rows = $stmt->fetchAll();
            foreach ($rows as &$r) {
                foreach (['created_at', 'updated_at'] as $f) {
                    if (!empty($r[$f])) $r[$f] = utc_to_wib($r[$f]);
                }
                if (is_string($r['tasks'])) $r['tasks'] = json_decode($r['tasks'], true);
            }
            unset($r);
            json_response(['ok' => true, 'data' => $rows, 'date' => $date]);
            break;

        default:
            json_response([
                'ok' => false,
                'message' => 'Route tidak ditemukan',
                'route' => $route,
            ], 404);
    }
} catch (Throwable $e) {
    json_response([
        'ok' => false,
        'message' => 'API error',
        'error' => APP_ENV === 'local' ? $e->getMessage() : 'Internal server error',
    ], 500);
}
