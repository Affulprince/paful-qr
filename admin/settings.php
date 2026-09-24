<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/csrf.php';
require_once __DIR__ . '/includes/activity_log.php';
require_once __DIR__ . '/includes/layout.php';

$admin = require_permission('settings.view');

$fields = [
    'site_name', 'tagline', 'contact_email', 'contact_phone', 'contact_address',
    'primary_color', 'meta_title', 'meta_description',
    'social_facebook', 'social_instagram', 'social_tiktok', 'social_youtube', 'social_linkedin', 'social_x',
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_permission('settings.edit');
    csrf_require();

    $stmt = db()->prepare('UPDATE site_settings SET `value` = :value WHERE `key` = :key');
    foreach ($fields as $field) {
        $stmt->execute(['value' => trim((string) ($_POST[$field] ?? '')), 'key' => $field]);
    }
    log_activity('update', 'settings', null, 'Updated site settings');
    flash_set('success', 'Settings updated.');
    header('Location: settings.php');
    exit;
}

$rows = db()->query('SELECT `key`, `value` FROM site_settings')->fetchAll();
$settings = array_column($rows, 'value', 'key');

admin_header('Settings', 'settings.php');
$readOnly = !has_permission('settings.edit');
?>
<h1 class="h4 mb-4">Settings</h1>

<form method="post">
  <?= csrf_field() ?>
  <ul class="nav nav-tabs mb-3">
    <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-general" type="button">General</button></li>
    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-branding" type="button">Branding</button></li>
    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-seo" type="button">SEO</button></li>
    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-social" type="button">Social Media</button></li>
  </ul>

  <div class="tab-content">
    <div class="tab-pane fade show active" id="tab-general">
      <div class="card border-0 shadow-sm"><div class="card-body">
        <div class="mb-3"><label class="form-label">Website name</label><input type="text" name="site_name" class="form-control" value="<?= e($settings['site_name'] ?? '') ?>" <?= $readOnly ? 'readonly' : '' ?>></div>
        <div class="mb-3"><label class="form-label">Tagline</label><input type="text" name="tagline" class="form-control" value="<?= e($settings['tagline'] ?? '') ?>" <?= $readOnly ? 'readonly' : '' ?>></div>
        <div class="row g-3">
          <div class="col-md-4"><label class="form-label">Contact email</label><input type="email" name="contact_email" class="form-control" value="<?= e($settings['contact_email'] ?? '') ?>" <?= $readOnly ? 'readonly' : '' ?>></div>
          <div class="col-md-4"><label class="form-label">Contact phone</label><input type="text" name="contact_phone" class="form-control" value="<?= e($settings['contact_phone'] ?? '') ?>" <?= $readOnly ? 'readonly' : '' ?>></div>
          <div class="col-md-4"><label class="form-label">Address</label><input type="text" name="contact_address" class="form-control" value="<?= e($settings['contact_address'] ?? '') ?>" <?= $readOnly ? 'readonly' : '' ?>></div>
        </div>
      </div></div>
    </div>

    <div class="tab-pane fade" id="tab-branding">
      <div class="card border-0 shadow-sm"><div class="card-body">
        <label class="form-label">Primary color</label>
        <input type="color" name="primary_color" class="form-control form-control-color" value="<?= e($settings['primary_color'] ?? '#0b3c5d') ?>" <?= $readOnly ? 'disabled' : '' ?>>
        <div class="form-text">Logo/favicon uploads are part of the Media Library (Phase 2).</div>
      </div></div>
    </div>

    <div class="tab-pane fade" id="tab-seo">
      <div class="card border-0 shadow-sm"><div class="card-body">
        <div class="mb-3"><label class="form-label">Meta title</label><input type="text" name="meta_title" class="form-control" value="<?= e($settings['meta_title'] ?? '') ?>" <?= $readOnly ? 'readonly' : '' ?>></div>
        <div class="mb-0"><label class="form-label">Meta description</label><textarea name="meta_description" class="form-control" rows="3" <?= $readOnly ? 'readonly' : '' ?>><?= e($settings['meta_description'] ?? '') ?></textarea></div>
      </div></div>
    </div>

    <div class="tab-pane fade" id="tab-social">
      <div class="card border-0 shadow-sm"><div class="card-body">
        <p class="text-body-secondary small">Leave blank to hide a network's link on the public site.</p>
        <div class="row g-3">
          <?php foreach (['facebook','instagram','tiktok','youtube','linkedin','x'] as $net): ?>
            <div class="col-md-6">
              <label class="form-label text-capitalize"><?= e($net) ?></label>
              <input type="text" name="social_<?= e($net) ?>" class="form-control" placeholder="https://…" value="<?= e($settings['social_' . $net] ?? '') ?>" <?= $readOnly ? 'readonly' : '' ?>>
            </div>
          <?php endforeach; ?>
        </div>
      </div></div>
    </div>
  </div>

  <?php if (!$readOnly): ?>
    <div class="mt-3 text-end"><button class="btn btn-primary">Save Settings</button></div>
  <?php endif; ?>
</form>
<?php admin_footer(); ?>
