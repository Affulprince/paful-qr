<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/includes/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

try {
    $stmt = db()->query(
        "SELECT name, category, description, icon, type_key, default_fields, fg_color, bg_color,
                dot_style, corner_square_style, corner_dot_style, error_correction
         FROM qr_templates WHERE is_active = 1 ORDER BY category ASC, sort_order ASC, id ASC"
    );
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) {
        $decoded = json_decode((string) $row['default_fields'], true);
        $row['default_fields'] = is_array($decoded) ? $decoded : [];
    }
    unset($row);
    echo json_encode(['ok' => true, 'templates' => $rows]);
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'unavailable']);
}
