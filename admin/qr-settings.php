<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/csrf.php';
require_once __DIR__ . '/includes/activity_log.php';
require_once __DIR__ . '/includes/layout.php';

$admin = require_permission('qr.settings.view');

$allFormats = ['png', 'jpeg', 'webp', 'svg'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_require();
    require_permission('qr.settings.edit');

    $fgColor = (string) ($_POST['default_fg_color'] ?? '#0b3c5d');
    $bgColor = (string) ($_POST['default_bg_color'] ?? '#ffffff');
    $errorCorrection = in_array($_POST['default_error_correction'] ?? 'M', ['L', 'M', 'Q', 'H'], true) ? $_POST['default_error_correction'] : 'M';
    $margin = max(0, min(60, (int) ($_POST['default_margin'] ?? 12)));
    $size = max(128, min(4096, (int) ($_POST['default_size'] ?? 1024)));
    $selectedFormats = array_values(array_intersect($allFormats, (array) ($_POST['allowed_formats'] ?? [])));

    if (!$selectedFormats) {
        flash_set('error', 'At least one download format must be allowed.');
    } else {
        db()->prepare(
            'UPDATE qr_settings SET default_fg_color=:fg, default_bg_color=:bg, default_error_correction=:ec,
             default_margin=:m, default_size=:s, allowed_formats=:af WHERE id=1'
        )->execute([
            'fg' => $fgColor, 'bg' => $bgColor, 'ec' => $errorCorrection,
            'm' => $margin, 's' => $size, 'af' => implode(',', $selectedFormats),
        ]);
        log_activity('update', 'qr_settings', '1', 'Updated global QR generation defaults');
        flash_set('success', 'QR generation defaults updated.');
    }

    header('Location: qr-settings.php');
    exit;
}

$settings = db()->query('SELECT * FROM qr_settings WHERE id = 1')->fetch();
$activeFormats = $settings ? array_map('trim', explode(',', $settings['allowed_formats'])) : $allFormats;

admin_header('QR Settings', 'qr-settings.php');
?>
<h1 class="h4 mb-1">QR Settings</h1>
<p class="text-body-secondary small mb-4">Global defaults applied to the public generator on first load. Visitors can still change these per-QR before downloading.</p>

<div class="card border-0 shadow-sm" style="max-width: 720px;">
  <div class="card-body">
    <form method="post">
      <?= csrf_field() ?>
      <div class="row g-3">
        <div class="col-6 col-md-4">
          <label class="form-label">Default QR color</label>
          <input type="color" name="default_fg_color" class="form-control form-control-color" value="<?= e($settings['default_fg_color'] ?? '#0b3c5d') ?>">
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label">Default background</label>
          <input type="color" name="default_bg_color" class="form-control form-control-color" value="<?= e($settings['default_bg_color'] ?? '#ffffff') ?>">
        </div>
        <div class="col-md-4">
          <label class="form-label">Error correction</label>
          <select name="default_error_correction" class="form-select">
            <?php foreach (['L' => 'Low', 'M' => 'Medium', 'Q' => 'Quartile', 'H' => 'High'] as $val => $label): ?>
              <option value="<?= $val ?>" <?= ($settings['default_error_correction'] ?? 'M') === $val ? 'selected' : '' ?>><?= $label ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label">Quiet zone margin (px)</label>
          <input type="number" name="default_margin" min="0" max="60" class="form-control" value="<?= (int) ($settings['default_margin'] ?? 12) ?>">
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label">Default export size (px)</label>
          <input type="number" name="default_size" min="128" max="4096" step="1" class="form-control" value="<?= (int) ($settings['default_size'] ?? 1024) ?>">
        </div>
        <div class="col-12">
          <label class="form-label d-block">Allowed download formats</label>
          <?php foreach ($allFormats as $fmt): ?>
            <div class="form-check form-check-inline">
              <input type="checkbox" name="allowed_formats[]" value="<?= $fmt ?>" class="form-check-input" id="fmt-<?= $fmt ?>" <?= in_array($fmt, $activeFormats, true) ? 'checked' : '' ?>>
              <label class="form-check-label" for="fmt-<?= $fmt ?>"><?= strtoupper($fmt) ?></label>
            </div>
          <?php endforeach; ?>
          <div class="form-text">Unchecked formats are hidden from the download options on the public generator.</div>
        </div>
      </div>
      <?php if (has_permission('qr.settings.edit')): ?>
        <button class="btn btn-primary mt-4"><i class="bi bi-check-lg"></i> Save Defaults</button>
      <?php endif; ?>
    </form>
  </div>
</div>
<?php admin_footer(); ?>
