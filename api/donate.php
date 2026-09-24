<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/includes/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

try {
    $settings = db()->query('SELECT heading, description, payment_section_title, instructions, thank_you_message, ussd_code FROM donate_settings WHERE id = 1')->fetch();
    $methods = db()->query(
        'SELECT method_key, display_name, account_name, account_number, description
         FROM donate_payment_methods WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
    )->fetchAll();

    echo json_encode(['ok' => true, 'settings' => $settings ?: null, 'methods' => $methods]);
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'unavailable']);
}
