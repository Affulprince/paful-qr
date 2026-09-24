<?php
/**
 * Database + app configuration. On shared hosting, override these via real
 * environment variables where possible; the defaults below match a local
 * XAMPP setup (root user, no password) so the admin panel runs out of the
 * box for local development and testing.
 */

return [
    'db' => [
        'host' => getenv('PAFUL_DB_HOST') ?: '127.0.0.1',
        'port' => getenv('PAFUL_DB_PORT') ?: '3306',
        'name' => getenv('PAFUL_DB_NAME') ?: 'paful_qr_admin',
        'user' => getenv('PAFUL_DB_USER') ?: 'root',
        'pass' => getenv('PAFUL_DB_PASS') ?: '',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        // Used for cookie scoping and absolute-URL generation if ever needed.
        'session_name' => 'paful_qr_admin_session',
        'session_lifetime_seconds' => 60 * 60 * 4, // 4 hours
        'login_max_attempts' => 5,
        'login_lockout_seconds' => 15 * 60,
    ],
];
