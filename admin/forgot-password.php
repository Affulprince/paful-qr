<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/csrf.php';
require_once __DIR__ . '/includes/activity_log.php';

if (!is_installed()) {
    header('Location: install.php');
    exit;
}

$submitted = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_require();
    $email = trim(mb_strtolower((string) ($_POST['email'] ?? '')));

    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $stmt = db()->prepare("SELECT id, name FROM admins WHERE email = :email AND status = 'active'");
        $stmt->execute(['email' => $email]);
        $admin = $stmt->fetch();

        if ($admin) {
            $token = bin2hex(random_bytes(32));
            $ins = db()->prepare(
                'INSERT INTO password_resets (admin_id, token_hash, expires_at) VALUES (:id, :hash, DATE_ADD(NOW(), INTERVAL 1 HOUR))'
            );
            $ins->execute(['id' => $admin['id'], 'hash' => hash('sha256', $token)]);
            log_activity('password_reset_requested', 'auth', (string) $admin['id'], "Reset requested for {$admin['name']}", $admin['id'], $admin['name']);
        }
    }
    // Always show the same message, whether or not the email matched —
    // this avoids leaking which addresses have an account.
    $submitted = true;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Forgot Password | PAFUL QR Admin</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="../css/paful-qr.css">
</head>
<body class="bg-body-tertiary d-flex align-items-center" style="min-height:100vh;">
<div class="container" style="max-width: 400px;">
  <div class="text-center mb-4">
    <h1 class="h4">Forgot Password</h1>
  </div>

  <?php if ($submitted): ?>
    <div class="alert alert-info">
      If that email belongs to an administrator account, a password reset has
      been requested. Since this system doesn't send email yet, please
      contact your Owner/system administrator — they can generate a reset
      link for you from the Administrators page.
    </div>
    <p class="text-center"><a href="login.php">Back to login</a></p>
  <?php else: ?>
    <form method="post" class="card border-0 shadow-sm">
      <div class="card-body">
        <?= csrf_field() ?>
        <p class="text-body-secondary small">Enter your admin email. Your Owner will be able to issue you a reset link.</p>
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input type="email" name="email" class="form-control" required autofocus>
        </div>
        <button type="submit" class="btn btn-primary w-100">Request Reset</button>
        <p class="text-center mt-3 mb-0"><a href="login.php" class="small">Back to login</a></p>
      </div>
    </form>
  <?php endif; ?>
</div>
</body>
</html>
