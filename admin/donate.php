<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/csrf.php';
require_once __DIR__ . '/includes/activity_log.php';
require_once __DIR__ . '/includes/layout.php';

$admin = require_permission('donate.view');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_permission('donate.edit');
    csrf_require();
    $action = $_POST['action'] ?? '';

    if ($action === 'save_settings') {
        db()->prepare(
            'UPDATE donate_settings SET heading=:h, description=:d, payment_section_title=:t, instructions=:i, thank_you_message=:ty, ussd_code=:ussd WHERE id = 1'
        )->execute([
            'h' => trim((string) ($_POST['heading'] ?? '')),
            'd' => trim((string) ($_POST['description'] ?? '')),
            't' => trim((string) ($_POST['payment_section_title'] ?? 'we accept')),
            'i' => trim((string) ($_POST['instructions'] ?? '')),
            'ty' => trim((string) ($_POST['thank_you_message'] ?? '')),
            'ussd' => trim((string) ($_POST['ussd_code'] ?? '')),
        ]);
        log_activity('update', 'donate', '1', 'Updated donate page heading/description');
        flash_set('success', 'Donate page content updated.');
    } elseif ($action === 'save_method') {
        $id = (int) ($_POST['id'] ?? 0);
        db()->prepare(
            'UPDATE donate_payment_methods SET display_name=:dn, account_name=:an, account_number=:num, description=:desc, is_active=:act WHERE id=:id'
        )->execute([
            'dn' => trim((string) ($_POST['display_name'] ?? '')),
            'an' => trim((string) ($_POST['account_name'] ?? '')),
            'num' => trim((string) ($_POST['account_number'] ?? '')),
            'desc' => trim((string) ($_POST['description'] ?? '')),
            'act' => isset($_POST['is_active']) ? 1 : 0,
            'id' => $id,
        ]);
        log_activity('update', 'donate_payment_method', (string) $id, "Updated payment method #{$id}");
        flash_set('success', 'Payment method updated.');
    }

    header('Location: donate.php');
    exit;
}

$settings = db()->query('SELECT * FROM donate_settings WHERE id = 1')->fetch();
$methods = db()->query('SELECT * FROM donate_payment_methods ORDER BY sort_order ASC, id ASC')->fetchAll();

admin_header('Donate Page', 'donate.php');
?>
<h1 class="h4 mb-4">Donate Page</h1>

<div class="card border-0 shadow-sm mb-4">
  <div class="card-header bg-transparent"><strong>Page Content</strong></div>
  <form method="post">
    <div class="card-body">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="save_settings">
      <div class="mb-3"><label class="form-label">Heading</label><input type="text" name="heading" class="form-control" value="<?= e($settings['heading']) ?>"></div>
      <div class="mb-3"><label class="form-label">Description</label><textarea name="description" class="form-control" rows="3"><?= e($settings['description']) ?></textarea></div>
      <div class="mb-3"><label class="form-label">Payment section title</label><input type="text" name="payment_section_title" class="form-control" value="<?= e($settings['payment_section_title']) ?>"></div>
      <div class="mb-3"><label class="form-label">USSD dial code</label><input type="text" name="ussd_code" class="form-control" style="max-width:220px;" value="<?= e($settings['ussd_code']) ?>"></div>
      <div class="mb-3"><label class="form-label">Instructions (optional)</label><textarea name="instructions" class="form-control" rows="2"><?= e($settings['instructions']) ?></textarea></div>
      <div class="mb-0"><label class="form-label">Thank-you message</label><input type="text" name="thank_you_message" class="form-control" value="<?= e($settings['thank_you_message']) ?>"></div>
    </div>
    <div class="card-footer bg-transparent text-end">
      <?php if (has_permission('donate.edit')): ?><button class="btn btn-primary">Save Content</button><?php endif; ?>
    </div>
  </form>
</div>

<h2 class="h5 mb-3">Payment Methods</h2>
<div class="row g-3">
  <?php foreach ($methods as $method): ?>
    <div class="col-md-6 col-lg-4">
      <div class="card border-0 shadow-sm h-100">
        <form method="post">
          <div class="card-body">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="save_method">
            <input type="hidden" name="id" value="<?= (int) $method['id'] ?>">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <strong><?= e($method['method_key']) ?></strong>
              <span class="badge text-bg-<?= $method['is_active'] ? 'success' : 'secondary' ?>"><?= $method['is_active'] ? 'Active' : 'Inactive' ?></span>
            </div>
            <div class="mb-2"><label class="form-label small">Display name</label><input type="text" name="display_name" class="form-control form-control-sm" value="<?= e($method['display_name']) ?>"></div>
            <div class="mb-2"><label class="form-label small">Account name</label><input type="text" name="account_name" class="form-control form-control-sm" value="<?= e($method['account_name']) ?>"></div>
            <div class="mb-2"><label class="form-label small">Number</label><input type="text" name="account_number" class="form-control form-control-sm" value="<?= e($method['account_number']) ?>"></div>
            <div class="form-check mb-0">
              <input type="checkbox" class="form-check-input" name="is_active" id="active-<?= (int) $method['id'] ?>" <?= $method['is_active'] ? 'checked' : '' ?>>
              <label class="form-check-label small" for="active-<?= (int) $method['id'] ?>">Active</label>
            </div>
          </div>
          <?php if (has_permission('donate.edit')): ?>
          <div class="card-footer bg-transparent text-end">
            <button class="btn btn-sm btn-primary">Save</button>
          </div>
          <?php endif; ?>
        </form>
      </div>
    </div>
  <?php endforeach; ?>
</div>
<?php admin_footer(); ?>
