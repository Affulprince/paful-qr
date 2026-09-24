<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/includes/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

try {
    $stmt = db()->query('SELECT type_key, is_active FROM qr_types ORDER BY sort_order ASC, id ASC');
    echo json_encode(['ok' => true, 'types' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'unavailable']);
}
