<?php
declare(strict_types=1);

function log_activity(string $action, string $module, ?string $recordId = null, ?string $description = null, ?int $adminIdOverride = null, ?string $nameOverride = null): void
{
    $admin = current_admin();
    $adminId = $adminIdOverride ?? ($admin['id'] ?? null);
    $adminName = $nameOverride ?? ($admin['name'] ?? null);

    try {
        $stmt = db()->prepare(
            'INSERT INTO admin_activity_logs (admin_id, admin_name_snapshot, action, module, record_id, description, ip_address, user_agent)
             VALUES (:admin_id, :admin_name, :action, :module, :record_id, :description, :ip, :ua)'
        );
        $stmt->execute([
            'admin_id' => $adminId,
            'admin_name' => $adminName,
            'action' => $action,
            'module' => $module,
            'record_id' => $recordId,
            'description' => $description,
            'ip' => client_ip(),
            'ua' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
        ]);
    } catch (Throwable $e) {
        error_log('[paful-qr-admin] Failed to write activity log: ' . $e->getMessage());
    }
}
