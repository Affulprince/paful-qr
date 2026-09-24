<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/includes/db.php';

header('Content-Type: application/json; charset=utf-8');

// Increment-only, anonymous counter. No IP, no user agent, no QR content,
// no identifiers of any kind are stored — just "one more generate event for
// this type today". Never blocks the public generator: any failure here
// (DB down, bad input) is swallowed and reported ok:false, and the calling
// JS never lets this affect the actual QR generation flow.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false]);
    exit;
}

$body = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
$event = (string) ($body['event'] ?? $_POST['event'] ?? '');
$typeKey = (string) ($body['type'] ?? $_POST['type'] ?? '');

$validEvents = ['generate', 'download'];
$validType = preg_match('/^[a-z_]{1,30}$/', $typeKey) === 1;

if (!in_array($event, $validEvents, true) || !$validType) {
    http_response_code(422);
    echo json_encode(['ok' => false]);
    exit;
}

try {
    db()->prepare(
        'INSERT INTO qr_generation_stats (stat_date, type_key, event, count)
         VALUES (CURDATE(), :type, :event, 1)
         ON DUPLICATE KEY UPDATE count = count + 1'
    )->execute(['type' => $typeKey, 'event' => $event]);
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    echo json_encode(['ok' => false]);
}
