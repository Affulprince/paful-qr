<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/csrf.php';
require_once __DIR__ . '/includes/activity_log.php';
require_once __DIR__ . '/includes/layout.php';

$admin = require_permission('admins.view');

function owner_role_id(): int
{
    static $id = null;
    if ($id === null) {
        $id = (int) db()->query("SELECT id FROM roles WHERE slug = 'owner'")->fetch()['id'];
    }
    return $id;
}

function active_owner_count(): int
{
    $stmt = db()->prepare("SELECT COUNT(*) AS c FROM admins WHERE role_id = :rid AND status = 'active'");
    $stmt->execute(['rid' => owner_role_id()]);
    return (int) $stmt->fetch()['c'];
}

$resetLink = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_require();
    $action = $_POST['action'] ?? '';

    if ($action === 'create') {
        require_permission('admins.create');
        $name = trim((string) ($_POST['name'] ?? ''));
        $email = trim(mb_strtolower((string) ($_POST['email'] ?? '')));
        $password = (string) ($_POST['password'] ?? '');
        $roleId = (int) ($_POST['role_id'] ?? 0);

        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 10 || $roleId <= 0) {
            flash_set('error', 'Please fill all fields correctly (password at least 10 characters).');
        } else {
            try {
                db()->prepare('INSERT INTO admins (name, email, password_hash, role_id, status) VALUES (:n, :e, :h, :r, "active")')
                    ->execute(['n' => $name, 'e' => $email, 'h' => password_hash($password, PASSWORD_DEFAULT), 'r' => $roleId]);
                log_activity('create', 'admins', (string) db()->lastInsertId(), "Created administrator {$name} ({$email})");
                flash_set('success', 'Administrator created.');
            } catch (PDOException $e) {
                flash_set('error', str_contains($e->getMessage(), 'Duplicate') ? 'That email is already in use.' : 'Could not create administrator.');
            }
        }
    } elseif ($action === 'update') {
        require_permission('admins.edit');
        $id = (int) ($_POST['id'] ?? 0);
        $name = trim((string) ($_POST['name'] ?? ''));
        $email = trim(mb_strtolower((string) ($_POST['email'] ?? '')));
        $roleId = (int) ($_POST['role_id'] ?? 0);
        $status = ($_POST['status'] ?? 'active') === 'disabled' ? 'disabled' : 'active';

        $target = db()->prepare('SELECT * FROM admins WHERE id = :id');
        $target->execute(['id' => $id]);
        $target = $target->fetch();

        if (!$target) {
            flash_set('error', 'Administrator not found.');
        } elseif ($id === $admin['id'] && ($roleId !== (int) $admin['role_id'] || $status !== $target['status'])) {
            flash_set('error', "You can't change your own role or status — ask another Owner to do it.");
        } elseif ((int) $target['role_id'] === owner_role_id() && ($roleId !== owner_role_id() || $status === 'disabled') && active_owner_count() <= 1) {
            flash_set('error', 'At least one active Owner must remain. Promote another admin to Owner first.');
        } else {
            db()->prepare('UPDATE admins SET name=:n, email=:e, role_id=:r, status=:s WHERE id=:id')
                ->execute(['n' => $name, 'e' => $email, 'r' => $roleId, 's' => $status, 'id' => $id]);
            log_activity('update', 'admins', (string) $id, "Updated administrator {$name}");
            flash_set('success', 'Administrator updated.');
        }
    } elseif ($action === 'delete') {
        require_permission('admins.delete');
        $id = (int) ($_POST['id'] ?? 0);
        $target = db()->prepare('SELECT * FROM admins WHERE id = :id');
        $target->execute(['id' => $id]);
        $target = $target->fetch();

        if (!$target) {
            flash_set('error', 'Administrator not found.');
        } elseif ($id === $admin['id']) {
            flash_set('error', "You can't delete your own account.");
        } elseif ((int) $target['role_id'] === owner_role_id() && active_owner_count() <= 1) {
            flash_set('error', 'At least one active Owner must remain.');
        } else {
            db()->prepare('DELETE FROM admins WHERE id = :id')->execute(['id' => $id]);
            log_activity('delete', 'admins', (string) $id, "Deleted administrator {$target['name']}");
            flash_set('success', 'Administrator deleted.');
        }
    } elseif ($action === 'reset_password') {
        require_permission('admins.edit');
        $id = (int) ($_POST['id'] ?? 0);
        $target = db()->prepare('SELECT * FROM admins WHERE id = :id');
        $target->execute(['id' => $id]);
        $target = $target->fetch();

        if ($target) {
            $token = bin2hex(random_bytes(32));
            db()->prepare('INSERT INTO password_resets (admin_id, token_hash, expires_at) VALUES (:id, :hash, DATE_ADD(NOW(), INTERVAL 1 HOUR))')
                ->execute(['id' => $id, 'hash' => hash('sha256', $token)]);
            log_activity('password_reset_issued', 'admins', (string) $id, "Issued reset link for {$target['name']}");
            $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $resetLink = $scheme . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/reset-password.php?token=' . $token;
            flash_set('info', 'Reset link generated below — share it with ' . $target['name'] . ' directly. It expires in 1 hour.');
        }
    }

    if (!$resetLink) {
        header('Location: administrators.php');
        exit;
    }
}

$admins = db()->query(
    'SELECT admins.*, roles.name AS role_name FROM admins JOIN roles ON roles.id = admins.role_id ORDER BY admins.created_at ASC'
)->fetchAll();
$roles = db()->query('SELECT id, name FROM roles ORDER BY id ASC')->fetchAll();

admin_header('Administrators', 'administrators.php');
?>
<div class="d-flex justify-content-between align-items-center mb-3">
  <h1 class="h4 mb-0">Administrators</h1>
  <?php if (has_permission('admins.create')): ?>
    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createModal"><i class="bi bi-plus-lg"></i> Add Administrator</button>
  <?php endif; ?>
</div>

<?php if ($resetLink): ?>
  <div class="alert alert-info">
    <strong>Password reset link (expires in 1 hour):</strong>
    <div class="input-group mt-2">
      <input type="text" class="form-control form-control-sm" readonly value="<?= e($resetLink) ?>" id="resetLinkInput">
      <button class="btn btn-outline-secondary btn-sm" type="button" onclick="navigator.clipboard.writeText(document.getElementById('resetLinkInput').value)">Copy</button>
    </div>
  </div>
<?php endif; ?>

<div class="card border-0 shadow-sm">
  <div class="table-responsive">
    <table class="table align-middle mb-0">
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Created</th><th class="text-end">Actions</th></tr></thead>
      <tbody>
      <?php foreach ($admins as $row): ?>
        <tr>
          <td><?= e($row['name']) ?> <?php if ((int) $row['id'] === (int) $admin['id']): ?><span class="badge text-bg-light border">You</span><?php endif; ?></td>
          <td><?= e($row['email']) ?></td>
          <td><?= e($row['role_name']) ?></td>
          <td><span class="badge text-bg-<?= $row['status'] === 'active' ? 'success' : 'secondary' ?>"><?= e(ucfirst($row['status'])) ?></span></td>
          <td class="small text-body-secondary"><?= $row['last_login_at'] ? e(date('M j, Y g:ia', strtotime($row['last_login_at']))) : 'Never' ?></td>
          <td class="small text-body-secondary"><?= e(date('M j, Y', strtotime($row['created_at']))) ?></td>
          <td class="text-end text-nowrap">
            <?php if (has_permission('admins.edit')): ?>
              <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#editModal"
                onclick='openEditModal(<?= json_encode($row, JSON_HEX_APOS | JSON_HEX_QUOT) ?>)'><i class="bi bi-pencil"></i></button>
              <form method="post" class="d-inline" onsubmit="return confirm('Generate a password reset link for <?= e($row['name']) ?>?');">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="reset_password">
                <input type="hidden" name="id" value="<?= (int) $row['id'] ?>">
                <button class="btn btn-sm btn-outline-secondary" title="Reset password"><i class="bi bi-key"></i></button>
              </form>
            <?php endif; ?>
            <?php if (has_permission('admins.delete') && (int) $row['id'] !== (int) $admin['id']): ?>
              <button class="btn btn-sm btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deleteModal"
                onclick="openDeleteModal(<?= (int) $row['id'] ?>, <?= json_encode($row['name']) ?>)"><i class="bi bi-trash3"></i></button>
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Create modal -->
<div class="modal fade" id="createModal" tabindex="-1">
  <div class="modal-dialog">
    <form method="post" class="modal-content">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="create">
      <div class="modal-header"><h2 class="modal-title h5">Add Administrator</h2><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <div class="mb-3"><label class="form-label">Name</label><input type="text" name="name" class="form-control" required></div>
        <div class="mb-3"><label class="form-label">Email</label><input type="email" name="email" class="form-control" required></div>
        <div class="mb-3"><label class="form-label">Temporary password</label><input type="password" name="password" class="form-control" required minlength="10"></div>
        <div class="mb-0"><label class="form-label">Role</label>
          <select name="role_id" class="form-select">
            <?php foreach ($roles as $r): ?><option value="<?= (int) $r['id'] ?>"><?= e($r['name']) ?></option><?php endforeach; ?>
          </select>
        </div>
      </div>
      <div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary">Create</button></div>
    </form>
  </div>
</div>

<!-- Edit modal -->
<div class="modal fade" id="editModal" tabindex="-1">
  <div class="modal-dialog">
    <form method="post" class="modal-content">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="update">
      <input type="hidden" name="id" id="editId">
      <div class="modal-header"><h2 class="modal-title h5">Edit Administrator</h2><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <div class="mb-3"><label class="form-label">Name</label><input type="text" name="name" id="editName" class="form-control" required></div>
        <div class="mb-3"><label class="form-label">Email</label><input type="email" name="email" id="editEmail" class="form-control" required></div>
        <div class="mb-3"><label class="form-label">Role</label>
          <select name="role_id" id="editRole" class="form-select">
            <?php foreach ($roles as $r): ?><option value="<?= (int) $r['id'] ?>"><?= e($r['name']) ?></option><?php endforeach; ?>
          </select>
        </div>
        <div class="mb-0"><label class="form-label">Status</label>
          <select name="status" id="editStatus" class="form-select">
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>
      <div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary">Save</button></div>
    </form>
  </div>
</div>

<!-- Delete modal -->
<div class="modal fade" id="deleteModal" tabindex="-1">
  <div class="modal-dialog">
    <form method="post" class="modal-content">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="delete">
      <input type="hidden" name="id" id="deleteId">
      <div class="modal-header"><h2 class="modal-title h5">Delete Administrator?</h2><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">Delete "<strong id="deleteLabel"></strong>"? This cannot be undone.</div>
      <div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button><button class="btn btn-danger">Delete</button></div>
    </form>
  </div>
</div>

<script>
function openEditModal(a) {
  document.getElementById('editId').value = a.id;
  document.getElementById('editName').value = a.name;
  document.getElementById('editEmail').value = a.email;
  document.getElementById('editRole').value = a.role_id;
  document.getElementById('editStatus').value = a.status;
}
function openDeleteModal(id, name) {
  document.getElementById('deleteId').value = id;
  document.getElementById('deleteLabel').textContent = name;
}
</script>
<?php admin_footer(); ?>
