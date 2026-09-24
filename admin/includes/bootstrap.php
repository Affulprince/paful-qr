<?php
/**
 * Included at the top of every admin/*.php page. Starts a hardened session,
 * loads the DB connection, and exposes small helpers used everywhere else.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

$__config = require __DIR__ . '/../../config/config.php';

if (session_status() === PHP_SESSION_NONE) {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    session_set_cookie_params([
        'lifetime' => $__config['app']['session_lifetime_seconds'],
        'path' => '/',
        'domain' => '',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.use_strict_mode', '1');
    session_name($__config['app']['session_name']);
    session_start();
}

// Idle timeout, independent of the cookie lifetime above. "Remember me"
// (set at login) replaces the idle check with a fixed 30-day expiry instead
// of relying on PHP's probabilistic session garbage collection, which isn't
// guaranteed to honor a long cookie lifetime on its own.
$maxIdle = $__config['app']['session_lifetime_seconds'];
if (!empty($_SESSION['admin_id'])) {
    $expired = !empty($_SESSION['remember_until'])
        ? time() > $_SESSION['remember_until']
        : (!empty($_SESSION['last_activity']) && time() - $_SESSION['last_activity'] > $maxIdle);
    if ($expired) {
        $_SESSION = [];
        session_destroy();
    }
}
$_SESSION['last_activity'] = time();

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function is_installed(): bool
{
    try {
        $stmt = db()->query('SELECT COUNT(*) AS c FROM admins');
        return (int) $stmt->fetch()['c'] > 0;
    } catch (Throwable $e) {
        return false;
    }
}

function current_admin(): ?array
{
    static $cached = null;
    static $loaded = false;
    if ($loaded) {
        return $cached;
    }
    $loaded = true;

    if (empty($_SESSION['admin_id'])) {
        return null;
    }

    $stmt = db()->prepare(
        'SELECT admins.id, admins.name, admins.email, admins.status, roles.id AS role_id, roles.slug AS role_slug, roles.name AS role_name
         FROM admins JOIN roles ON roles.id = admins.role_id
         WHERE admins.id = :id'
    );
    $stmt->execute(['id' => $_SESSION['admin_id']]);
    $admin = $stmt->fetch();

    if (!$admin || $admin['status'] !== 'active') {
        $cached = null;
        return null;
    }
    $cached = $admin;
    return $cached;
}

function admin_permissions(int $roleId): array
{
    static $cache = [];
    if (isset($cache[$roleId])) {
        return $cache[$roleId];
    }
    $stmt = db()->prepare(
        'SELECT permissions.slug FROM role_permissions
         JOIN permissions ON permissions.id = role_permissions.permission_id
         WHERE role_permissions.role_id = :role_id'
    );
    $stmt->execute(['role_id' => $roleId]);
    $slugs = array_column($stmt->fetchAll(), 'slug');
    $cache[$roleId] = $slugs;
    return $slugs;
}

function has_permission(string $slug): bool
{
    $admin = current_admin();
    if (!$admin) {
        return false;
    }
    return in_array($slug, admin_permissions((int) $admin['role_id']), true);
}

function e(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

function flash_set(string $type, string $message): void
{
    $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

function flash_take(): array
{
    $flashes = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $flashes;
}
