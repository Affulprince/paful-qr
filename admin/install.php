<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';

$errors = [];
$success = false;
$schemaError = null;

function schema_applied(): bool
{
    try {
        db()->query('SELECT 1 FROM roles LIMIT 1');
        return true;
    } catch (Throwable) {
        return false;
    }
}

function apply_schema(): void
{
    $sql = file_get_contents(__DIR__ . '/../database/schema.sql');
    if ($sql === false) {
        throw new RuntimeException('Could not read database/schema.sql');
    }
    // Strip full-line "-- ..." comments first so they can never be glued to
    // (and accidentally swallow) the real statement that follows them.
    $sql = preg_replace('/^--.*$/m', '', $sql);

    // Split on semicolons that end a statement line; good enough for this
    // hand-written schema file (no stored procedures/triggers with embedded ;).
    $statements = array_filter(array_map('trim', explode(";\n", str_replace("\r\n", "\n", $sql))));
    $pdo = db_root();
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if ($statement === '') {
            continue;
        }
        $pdo->exec($statement);
    }
}

try {
    if (!schema_applied()) {
        apply_schema();
    }
} catch (Throwable $e) {
    $schemaError = $e->getMessage();
}

$alreadyInstalled = false;
if (!$schemaError) {
    try {
        $stmt = db()->query('SELECT COUNT(*) AS c FROM admins');
        $alreadyInstalled = (int) $stmt->fetch()['c'] > 0;
    } catch (Throwable $e) {
        $schemaError = $e->getMessage();
    }
}

if (!$schemaError && !$alreadyInstalled && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $email = trim(mb_strtolower($_POST['email'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $passwordConfirm = (string) ($_POST['password_confirm'] ?? '');

    if ($name === '') {
        $errors[] = 'Please enter your name.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Please enter a valid email address.';
    }
    if (strlen($password) < 10) {
        $errors[] = 'Password must be at least 10 characters.';
    }
    if ($password !== $passwordConfirm) {
        $errors[] = 'Passwords do not match.';
    }

    if (!$errors) {
        $ownerRole = db()->query("SELECT id FROM roles WHERE slug = 'owner'")->fetch();
        $stmt = db()->prepare(
            'INSERT INTO admins (name, email, password_hash, role_id, status) VALUES (:name, :email, :hash, :role_id, "active")'
        );
        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'hash' => password_hash($password, PASSWORD_DEFAULT),
            'role_id' => $ownerRole['id'],
        ]);
        $success = true;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Set Up Admin Panel | PAFUL QR</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="../css/paful-qr.css">
</head>
<body class="bg-body-tertiary">
<div class="container py-5" style="max-width: 480px;">
  <div class="text-center mb-4">
    <h1 class="h4">PAFUL QR — Admin Setup</h1>
    <p class="text-body-secondary">One-time setup for the admin panel.</p>
  </div>

  <?php if ($schemaError): ?>
    <div class="alert alert-danger">
      <strong>Could not connect to the database.</strong>
      <p class="mb-0 small">Check <code>config/config.php</code> and make sure MySQL is running. Technical detail (visible here only during setup): <?= e($schemaError) ?></p>
    </div>
  <?php elseif ($alreadyInstalled): ?>
    <div class="alert alert-info">
      Setup has already been completed. <a href="login.php">Go to login</a>.
    </div>
  <?php elseif ($success): ?>
    <div class="alert alert-success">
      Owner account created. <a href="login.php">Log in now</a>.
    </div>
  <?php else: ?>
    <?php foreach ($errors as $err): ?>
      <div class="alert alert-danger py-2"><?= e($err) ?></div>
    <?php endforeach; ?>
    <form method="post" class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">Your name</label>
          <input type="text" name="name" class="form-control" required value="<?= e($_POST['name'] ?? '') ?>">
        </div>
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input type="email" name="email" class="form-control" required value="<?= e($_POST['email'] ?? '') ?>">
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input type="password" name="password" class="form-control" required minlength="10">
          <div class="form-text">At least 10 characters.</div>
        </div>
        <div class="mb-3">
          <label class="form-label">Confirm password</label>
          <input type="password" name="password_confirm" class="form-control" required minlength="10">
        </div>
        <button type="submit" class="btn btn-primary w-100">Create Owner Account</button>
      </div>
    </form>
  <?php endif; ?>
</div>
</body>
</html>
