<?php
declare(strict_types=1);

function require_login(): array
{
    $admin = current_admin();
    if (!$admin) {
        $return = urlencode($_SERVER['REQUEST_URI'] ?? 'dashboard.php');
        header('Location: login.php?return=' . $return);
        exit;
    }
    return $admin;
}

function require_permission(string $slug): array
{
    $admin = require_login();
    if (!has_permission($slug)) {
        http_response_code(403);
        require __DIR__ . '/../403.php';
        exit;
    }
    return $admin;
}

function login_rate_limited(string $email): bool
{
    global $__config;
    $max = $__config['app']['login_max_attempts'];
    $window = $__config['app']['login_lockout_seconds'];

    $stmt = db()->prepare(
        'SELECT COUNT(*) AS c FROM login_attempts
         WHERE email = :email AND ip_address = :ip AND success = 0
           AND attempted_at > (NOW() - INTERVAL :window SECOND)'
    );
    $stmt->execute(['email' => $email, 'ip' => client_ip(), 'window' => $window]);
    return (int) $stmt->fetch()['c'] >= $max;
}

function record_login_attempt(string $email, bool $success): void
{
    $stmt = db()->prepare('INSERT INTO login_attempts (email, ip_address, success) VALUES (:email, :ip, :success)');
    $stmt->execute(['email' => $email, 'ip' => client_ip(), 'success' => $success ? 1 : 0]);
}

/** Returns the admin row on success, or null. Handles rate limiting + logging. */
function attempt_login(string $email, string $password, bool $remember = false): ?array
{
    $email = trim(mb_strtolower($email));

    if (login_rate_limited($email)) {
        log_activity('login_blocked', 'auth', null, "Rate limited: {$email}", null, 'System');
        return null;
    }

    $stmt = db()->prepare(
        'SELECT admins.*, roles.slug AS role_slug, roles.name AS role_name
         FROM admins JOIN roles ON roles.id = admins.role_id
         WHERE admins.email = :email'
    );
    $stmt->execute(['email' => $email]);
    $admin = $stmt->fetch();

    if (!$admin || $admin['status'] !== 'active' || !password_verify($password, $admin['password_hash'])) {
        record_login_attempt($email, false);
        log_activity('login_failed', 'auth', null, "Failed login for {$email}", null, 'System');
        return null;
    }

    record_login_attempt($email, true);

    // Regenerate the session ID on privilege change to prevent session fixation.
    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int) $admin['id'];

    if ($remember) {
        $thirtyDays = 60 * 60 * 24 * 30;
        $_SESSION['remember_until'] = time() + $thirtyDays;
        $params = session_get_cookie_params();
        setcookie(session_name(), session_id(), [
            'expires' => time() + $thirtyDays,
            'path' => $params['path'],
            'domain' => $params['domain'],
            'secure' => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'],
        ]);
    }

    $upd = db()->prepare('UPDATE admins SET last_login_at = NOW() WHERE id = :id');
    $upd->execute(['id' => $admin['id']]);

    log_activity('login', 'auth', (string) $admin['id'], "{$admin['name']} logged in", (int) $admin['id'], $admin['name']);

    return $admin;
}

function logout_admin(): void
{
    $admin = current_admin();
    if ($admin) {
        log_activity('logout', 'auth', (string) $admin['id'], "{$admin['name']} logged out");
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}
