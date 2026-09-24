<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/csrf.php';
require_once __DIR__ . '/includes/activity_log.php';

if (!is_installed()) {
    header('Location: install.php');
    exit;
}

function find_reset(string $token): ?array
{
    $stmt = db()->prepare(
        'SELECT password_resets.*, admins.name, admins.email FROM password_resets
         JOIN admins ON admins.id = password_resets.admin_id
         WHERE token_hash = :hash AND used_at IS NULL AND expires_at > NOW()'
    );
    $stmt->execute(['hash' => hash('sha256', $token)]);
    $row = $stmt->fetch();
    return $row ?: null;
}

$token = (string) ($_GET['token'] ?? $_POST['token'] ?? '');
$reset = $token !== '' ? find_reset($token) : null;
$error = null;
$success = false;

if ($reset && $_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_require();
    $password = (string) ($_POST['password'] ?? '');
    $confirm = (string) ($_POST['password_confirm'] ?? '');

    if (strlen($password) < 10) {
        $error = 'Password must be at least 10 characters.';
    } elseif ($password !== $confirm) {
        $error = 'Passwords do not match.';
    } else {
        db()->prepare('UPDATE admins SET password_hash = :hash WHERE id = :id')
            ->execute(['hash' => password_hash($password, PASSWORD_DEFAULT), 'id' => $reset['admin_id']]);
        db()->prepare('UPDATE password_resets SET used_at = NOW() WHERE id = :id')
            ->execute(['id' => $reset['id']]);
        log_activity('password_reset_completed', 'auth', (string) $reset['admin_id'], "{$reset['name']} reset their password", (int) $reset['admin_id'], $reset['name']);
        $success = true;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset Password | PAFUL QR Admin</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="../css/paful-qr.css">
</head>
<body class="bg-body-tertiary d-flex align-items-center" style="min-height:100vh;">
<div class="container" style="max-width: 400px;">
  <div class="text-center mb-4"><h1 class="h4">Reset Password</h1></div>

  <?php if (!$reset && !$success): ?>
    <div class="alert alert-danger">This reset link is invalid or has expired.</div>
    <p class="text-center"><a href="forgot-password.php">Request a new one</a></p>
  <?php elseif ($success): ?>
    <div class="alert alert-success">Password updated. You can now log in.</div>
    <p class="text-center"><a href="login.php">Go to login</a></p>
  <?php else: ?>
    <?php if ($error): ?><div class="alert alert-danger py-2"><?= e($error) ?></div><?php endif; ?>
    <form method="post" class="card border-0 shadow-sm">
      <div class="card-body">
        <?= csrf_field() ?>
        <input type="hidden" name="token" value="<?= e($token) ?>">
        <p class="text-body-secondary small">Resetting password for <strong><?= e($reset['email']) ?></strong></p>
        <div class="mb-3">
          <label class="form-label">New password</label>
          <input type="password" name="password" class="form-control" required minlength="10">
        </div>
        <div class="mb-3">
          <label class="form-label">Confirm new password</label>
          <input type="password" name="password_confirm" class="form-control" required minlength="10">
        </div>
        <button type="submit" class="btn btn-primary w-100">Update Password</button>
      </div>
    </form>
  <?php endif; ?>
</div>
</body>
</html>
