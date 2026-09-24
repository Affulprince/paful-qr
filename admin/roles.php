<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/csrf.php';
require_once __DIR__ . '/includes/activity_log.php';
require_once __DIR__ . '/includes/layout.php';

$admin = require_permission('roles.view');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_permission('roles.edit');
    csrf_require();

    $roleId = (int) ($_POST['role_id'] ?? 0);
    $role = db()->prepare('SELECT * FROM roles WHERE id = :id');
    $role->execute(['id' => $roleId]);
    $role = $role->fetch();

    if (!$role) {
        flash_set('error', 'Role not found.');
    } elseif ($role['is_system']) {
        flash_set('error', 'The Owner role always has full access and can\'t be changed — this keeps the system from being locked out.');
    } else {
        $selected = array_map('intval', $_POST['permissions'] ?? []);
        db()->beginTransaction();
        db()->prepare('DELETE FROM role_permissions WHERE role_id = :id')->execute(['id' => $roleId]);
        $ins = db()->prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (:r, :p)');
        foreach ($selected as $permId) {
            $ins->execute(['r' => $roleId, 'p' => $permId]);
        }
        db()->commit();
        log_activity('permission_change', 'roles', (string) $roleId, "Updated permissions for role \"{$role['name']}\"");
        flash_set('success', "Permissions updated for {$role['name']}.");
    }

    header('Location: roles.php');
    exit;
}

$roles = db()->query('SELECT * FROM roles ORDER BY id ASC')->fetchAll();
$permissions = db()->query('SELECT * FROM permissions ORDER BY slug ASC')->fetchAll();
$assignments = db()->query('SELECT role_id, permission_id FROM role_permissions')->fetchAll();

$grants = [];
foreach ($assignments as $a) {
    $grants[(int) $a['role_id']][(int) $a['permission_id']] = true;
}

admin_header('Roles & Permissions', 'roles.php');
$canEdit = has_permission('roles.edit');
?>
<h1 class="h4 mb-1">Roles &amp; Permissions</h1>
<p class="text-body-secondary small mb-4">The Owner role always has every permission and can't be edited here — that's what guarantees the system can never lock everyone out.</p>

<ul class="nav nav-tabs mb-3">
  <?php foreach ($roles as $i => $role): ?>
    <li class="nav-item"><button class="nav-link <?= $i === 0 ? 'active' : '' ?>" data-bs-toggle="tab" data-bs-target="#role-<?= (int) $role['id'] ?>" type="button"><?= e($role['name']) ?></button></li>
  <?php endforeach; ?>
</ul>

<div class="tab-content">
  <?php foreach ($roles as $i => $role): ?>
    <div class="tab-pane fade <?= $i === 0 ? 'show active' : '' ?>" id="role-<?= (int) $role['id'] ?>">
      <form method="post">
        <?= csrf_field() ?>
        <input type="hidden" name="role_id" value="<?= (int) $role['id'] ?>">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <?php if ($role['is_system']): ?>
              <div class="alert alert-light border small mb-3">System role — always has full access.</div>
            <?php endif; ?>
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-2">
              <?php foreach ($permissions as $perm): ?>
                <div class="col">
                  <div class="form-check">
                    <input type="checkbox" class="form-check-input" name="permissions[]" value="<?= (int) $perm['id'] ?>"
                      id="perm-<?= (int) $role['id'] ?>-<?= (int) $perm['id'] ?>"
                      <?= (!empty($grants[$role['id']][$perm['id']]) || $role['is_system']) ? 'checked' : '' ?>
                      <?= ($role['is_system'] || !$canEdit) ? 'disabled' : '' ?>>
                    <label class="form-check-label small" for="perm-<?= (int) $role['id'] ?>-<?= (int) $perm['id'] ?>">
                      <?= e($perm['slug']) ?>
                      <span class="d-block text-body-secondary" style="font-size:.75rem;"><?= e($perm['description']) ?></span>
                    </label>
                  </div>
                </div>
              <?php endforeach; ?>
            </div>
          </div>
          <?php if (!$role['is_system'] && $canEdit): ?>
            <div class="card-footer bg-transparent text-end"><button class="btn btn-primary btn-sm">Save Permissions</button></div>
          <?php endif; ?>
        </div>
      </form>
    </div>
  <?php endforeach; ?>
</div>
<?php admin_footer(); ?>
