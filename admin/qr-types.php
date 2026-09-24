<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/csrf.php';
require_once __DIR__ . '/includes/activity_log.php';
require_once __DIR__ . '/includes/layout.php';

$admin = require_permission('qr.types.view');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_permission('qr.types.edit');
    csrf_require();
    $action = $_POST['action'] ?? '';

    if ($action === 'save') {
        $id = (int) ($_POST['id'] ?? 0);
        $name = trim((string) ($_POST['name'] ?? ''));
        $description = trim((string) ($_POST['description'] ?? ''));
        $sortOrder = (int) ($_POST['sort_order'] ?? 0);
        $isActive = isset($_POST['is_active']) ? 1 : 0;

        if ($name === '' || $id <= 0) {
            flash_set('error', 'Name is required.');
        } else {
            $row = db()->prepare('SELECT type_key FROM qr_types WHERE id = :id');
            $row->execute(['id' => $id]);
            $typeKey = $row->fetch()['type_key'] ?? '';

            db()->prepare('UPDATE qr_types SET name=:n, description=:d, sort_order=:o, is_active=:a WHERE id=:id')
                ->execute(['n' => $name, 'd' => $description, 'o' => $sortOrder, 'a' => $isActive, 'id' => $id]);
            log_activity('update', 'qr_types', (string) $id, ($isActive ? 'Enabled' : 'Disabled') . " QR type \"{$typeKey}\" ({$name})");
            flash_set('success', 'QR type updated.');
        }
    }

    header('Location: qr-types.php');
    exit;
}

$types = db()->query('SELECT * FROM qr_types ORDER BY sort_order ASC, id ASC')->fetchAll();

admin_header('QR Types', 'qr-types.php');
?>
<h1 class="h4 mb-1">QR Types</h1>
<p class="text-body-secondary small mb-4">
  Disabling a type hides it from the QR type picker on the public generator.
  The type list itself matches what the generator's code actually supports —
  new types can't be added here without matching code, so there's no
  "create" button.
</p>

<div class="card border-0 shadow-sm">
  <div class="table-responsive">
    <table class="table align-middle mb-0">
      <thead><tr><th>Order</th><th>Icon</th><th>Type</th><th>Name</th><th>Description</th><th>Status</th><?php if (has_permission('qr.types.edit')): ?><th class="text-end">Actions</th><?php endif; ?></tr></thead>
      <tbody>
      <?php foreach ($types as $type): ?>
        <tr>
          <td class="text-body-secondary"><?= (int) $type['sort_order'] ?></td>
          <td><i class="bi <?= e($type['icon']) ?>"></i></td>
          <td><code><?= e($type['type_key']) ?></code></td>
          <td><?= e($type['name']) ?></td>
          <td class="text-body-secondary small"><?= e($type['description']) ?></td>
          <td><span class="badge text-bg-<?= $type['is_active'] ? 'success' : 'secondary' ?>"><?= $type['is_active'] ? 'Active' : 'Inactive' ?></span></td>
          <?php if (has_permission('qr.types.edit')): ?>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#typeModal"
              onclick='openTypeModal(<?= json_encode($type, JSON_HEX_APOS | JSON_HEX_QUOT) ?>)'>
              <i class="bi bi-pencil"></i> Edit
            </button>
          </td>
          <?php endif; ?>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<div class="modal fade" id="typeModal" tabindex="-1">
  <div class="modal-dialog">
    <form method="post" class="modal-content">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" id="typeId">
      <div class="modal-header">
        <h2 class="modal-title h5">Edit QR Type: <span id="typeModalKey"></span></h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3"><label class="form-label">Display name</label><input type="text" name="name" id="typeName" class="form-control" required></div>
        <div class="mb-3"><label class="form-label">Description</label><input type="text" name="description" id="typeDescription" class="form-control"></div>
        <div class="row g-3">
          <div class="col-6"><label class="form-label">Order</label><input type="number" name="sort_order" id="typeOrder" class="form-control"></div>
          <div class="col-6 d-flex align-items-end">
            <div class="form-check"><input type="checkbox" name="is_active" id="typeActive" class="form-check-input"><label class="form-check-label" for="typeActive">Active</label></div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>
  </div>
</div>

<script>
function openTypeModal(t) {
  document.getElementById('typeModalKey').textContent = t.type_key;
  document.getElementById('typeId').value = t.id;
  document.getElementById('typeName').value = t.name;
  document.getElementById('typeDescription').value = t.description || '';
  document.getElementById('typeOrder').value = t.sort_order;
  document.getElementById('typeActive').checked = Number(t.is_active) === 1;
}
</script>
<?php admin_footer(); ?>
