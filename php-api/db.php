<?php
require_once __DIR__ . '/config.php';

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        DB_HOST,
        DB_PORT,
        DB_NAME
    );

    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $pdo->exec("SET time_zone = '+07:00'");
    date_default_timezone_set('Asia/Jakarta');

    return $pdo;
}

/**
 * Format a WIB datetime string from DB to ISO8601 +07:00.
 * MySQL runs at system time (WIB/+07:00); stored values are WIB.
 */
function utc_to_wib(?string $dt): ?string {
    if (!$dt) return null;
    return (new DateTimeImmutable($dt, new DateTimeZone('Asia/Jakarta')))
        ->format('Y-m-d\TH:i:sP');
}

