<?php
/**
 * PDO singleton. Every query anywhere in the admin panel goes through this
 * connection using prepared statements — no raw user input is ever
 * concatenated into SQL.
 */

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $pdo = db_connect(true);
    return $pdo;
}

/**
 * Used only by admin/install.php, before the target database necessarily
 * exists yet — connects to the server without selecting a database, so
 * `CREATE DATABASE IF NOT EXISTS` can run.
 */
function db_root(): PDO
{
    return db_connect(false);
}

function db_connect(bool $withDatabase): PDO
{
    $config = require __DIR__ . '/../../config/config.php';
    $db = $config['db'];

    $dsn = $withDatabase
        ? sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $db['host'], $db['port'], $db['name'], $db['charset'])
        : sprintf('mysql:host=%s;port=%s;charset=%s', $db['host'], $db['port'], $db['charset']);

    try {
        return new PDO($dsn, $db['user'], $db['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        error_log('[paful-qr-admin] DB connection failed: ' . $e->getMessage());
        throw new RuntimeException('database_unavailable: ' . $e->getMessage());
    }
}
