<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/csrf.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/activity_log.php';

if (!is_installed()) {
    header('Location: install.php');
    exit;
}

if (current_admin()) {
    header('Location: dashboard.php');
    exit;
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_require();
    $email = trim((string) ($_POST['email'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    if ($email === '' || $password === '') {
        $error = 'Please enter your email and password.';
    } else {
        $admin = attempt_login($email, $password, !empty($_POST['remember']));
        if ($admin) {
            $return = $_GET['return'] ?? 'dashboard.php';
            // Only allow relative redirects within /admin to avoid open-redirect abuse.
            if (!is_string($return) || str_starts_with($return, '/admin/') === false) {
                $return = 'dashboard.php';
            } else {
                $return = substr($return, strlen('/admin/'));
            }
            header('Location: ' . ($return !== '' ? $return : 'dashboard.php'));
            exit;
        }
        $error = 'Incorrect email/password, or too many attempts — please wait a few minutes and try again.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Login | PAFUL QR</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="../css/paful-qr.css">
</head>
<body class="bg-body-tertiary d-flex align-items-center" style="min-height:100vh;">
<div class="container" style="max-width: 400px;">
  <div class="text-center mb-4">
    <span class="brand-mark" style="width:44px;height:44px;font-size:1.2rem;"><i class="bi bi-qr-code"></i></span>
    <h1 class="h4 mt-3 mb-0">PAFUL QR</h1>
    <p class="text-body-secondary">Admin Panel</p>
  </div>

  <?php if ($error): ?>
    <div class="alert alert-danger py-2"><?= e($error) ?></div>
  <?php endif; ?>

  <form method="post" class="card border-0 shadow-sm">
    <div class="card-body">
      <?= csrf_field() ?>
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-control" required autofocus value="<?= e($_POST['email'] ?? '') ?>">
      </div>
      <div class="mb-3">
        <label class="form-label">Password</label>
        <input type="password" name="password" class="form-control" required>
      </div>
      <div class="form-check mb-3">
        <input type="checkbox" class="form-check-input" id="remember" name="remember">
        <label class="form-check-label" for="remember">Remember me</label>
      </div>
      <button type="submit" class="btn btn-primary w-100">Sign In</button>
      <div class="text-center mt-3">
        <a href="forgot-password.php" class="small">Forgot Password?</a>
      </div>
    </div>
  </form>
</div>
</body>
</html>
