<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/layout.php';

$admin = require_permission('dashboard.view');

$stats = [
    'admins' => (int) db()->query('SELECT COUNT(*) AS c FROM admins')->fetch()['c'],
    'qr_types_active' => (int) db()->query("SELECT COUNT(*) AS c FROM qr_types WHERE is_active = 1")->fetch()['c'],
    'faqs_active' => (int) db()->query('SELECT COUNT(*) AS c FROM faqs WHERE is_active = 1')->fetch()['c'],
    'activity_entries' => (int) db()->query('SELECT COUNT(*) AS c FROM admin_activity_logs')->fetch()['c'],
];

// Real, legitimately-tracked counter — incremented by the public generator's
// own beacon call (js/qr-tracking.js), nothing else. If it's ever zero, that
// honestly means no beacons have arrived yet, not a fake placeholder.
$qrGenerated = (int) db()->query('SELECT COALESCE(SUM(count), 0) AS c FROM qr_generation_stats WHERE event = "generate"')->fetch()['c'];
$qrGeneratedToday = (int) db()->query('SELECT COALESCE(SUM(count), 0) AS c FROM qr_generation_stats WHERE event = "generate" AND stat_date = CURDATE()')->fetch()['c'];

$recentActivity = db()->query(
    'SELECT admin_name_snapshot, action, module, description, created_at
     FROM admin_activity_logs ORDER BY created_at DESC LIMIT 10'
)->fetchAll();

admin_header('Dashboard', 'dashboard.php');
?>
<h1 class="h4 mb-4">Welcome back, <?= e($admin['name']) ?></h1>

<div class="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mb-4">
  <div class="col">
    <div class="card border-0 shadow-sm h-100"><div class="card-body">
      <div class="text-body-secondary small">QR Codes Generated</div>
      <div class="h3 mb-0"><?= number_format($qrGenerated) ?></div>
      <div class="small text-body-secondary"><?= number_format($qrGeneratedToday) ?> today</div>
    </div></div>
  </div>
  <div class="col">
    <div class="card border-0 shadow-sm h-100"><div class="card-body">
      <div class="text-body-secondary small">Active QR Types</div>
      <div class="h3 mb-0"><?= $stats['qr_types_active'] ?></div>
    </div></div>
  </div>
  <div class="col">
    <div class="card border-0 shadow-sm h-100"><div class="card-body">
      <div class="text-body-secondary small">Active FAQ Entries</div>
      <div class="h3 mb-0"><?= $stats['faqs_active'] ?></div>
    </div></div>
  </div>
  <div class="col">
    <div class="card border-0 shadow-sm h-100"><div class="card-body">
      <div class="text-body-secondary small">Administrators</div>
      <div class="h3 mb-0"><?= $stats['admins'] ?></div>
    </div></div>
  </div>
</div>

<div class="alert alert-light border small">
  <i class="bi bi-info-circle"></i> "QR Codes Generated" counts client-side
  generations reported by an anonymous, increment-only beacon (no content,
  no IP, no personal data is ever sent) — everything else on this dashboard
  is a real count from this database. Downloads, scans and detailed
  analytics aren't tracked yet; those are a documented Phase 2 item rather
  than a made-up number.
</div>

<div class="card border-0 shadow-sm">
  <div class="card-header bg-transparent d-flex justify-content-between align-items-center">
    <strong>Recent Activity</strong>
    <?php if (has_permission('activity_logs.view')): ?>
      <a href="activity-logs.php" class="small">View all</a>
    <?php endif; ?>
  </div>
  <div class="table-responsive">
    <table class="table table-sm mb-0 align-middle">
      <tbody>
      <?php if (!$recentActivity): ?>
        <tr><td class="text-body-secondary py-3">No activity recorded yet.</td></tr>
      <?php endif; ?>
      <?php foreach ($recentActivity as $row): ?>
        <tr>
          <td class="text-nowrap text-body-secondary small"><?= e(date('M j, g:ia', strtotime($row['created_at']))) ?></td>
          <td><strong><?= e($row['admin_name_snapshot'] ?? 'System') ?></strong></td>
          <td><span class="badge text-bg-secondary"><?= e($row['module']) ?></span></td>
          <td><?= e($row['description'] ?? $row['action']) ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
<?php admin_footer(); ?>
