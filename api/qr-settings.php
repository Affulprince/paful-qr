<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/includes/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

try {
    $stmt = db()->query(
        'SELECT default_fg_color, default_bg_color, default_error_correction, default_margin, default_size, allowed_formats
         FROM qr_settings WHERE id = 1'
    );
    $row = $stmt->fetch();
    if (!$row) {
        throw new RuntimeException('no settings row');
    }
    $row['allowed_formats'] = array_values(array_filter(array_map('trim', explode(',', (string) $row['allowed_formats']))));
    echo json_encode(['ok' => true, 'settings' => $row]);
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'unavailable']);
}
