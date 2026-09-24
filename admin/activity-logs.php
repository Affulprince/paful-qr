<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/layout.php';

$admin = require_permission('activity_logs.view');

$where = [];
$params = [];

$moduleFilter = trim((string) ($_GET['module'] ?? ''));
$adminFilter = trim((string) ($_GET['admin'] ?? ''));
$fromDate = trim((string) ($_GET['from'] ?? ''));
$toDate = trim((string) ($_GET['to'] ?? ''));

if ($moduleFilter !== '') {
    $where[] = 'module = :module';
    $params['module'] = $moduleFilter;
}
if ($adminFilter !== '') {
    $where[] = 'admin_name_snapshot LIKE :admin';
    $params['admin'] = '%' . $adminFilter . '%';
}
if ($fromDate !== '') {
    $where[] = 'created_at >= :from';
    $params['from'] = $fromDate . ' 00:00:00';
}
if ($toDate !== '') {
    $where[] = 'created_at <= :to';
    $params['to'] = $toDate . ' 23:59:59';
}

$sql = 'SELECT * FROM admin_activity_logs';
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY created_at DESC LIMIT 200';

$stmt = db()->prepare($sql);
$stmt->execute($params);
$logs = $stmt->fetchAll();

$modules = db()->query('SELECT DISTINCT module FROM admin_activity_logs ORDER BY module ASC')->fetchAll(PDO::FETCH_COLUMN);

admin_header('Activity Logs', 'activity-logs.php');
?>
<h1 class="h4 mb-4">Activity Logs</h1>

<form method="get" class="row g-2 mb-3">
  <div class="col-6 col-md-3">
    <select name="module" class="form-select form-select-sm">
      <option value="">All modules</option>
      <?php foreach ($modules as $m): ?>
        <option value="<?= e($m) ?>" <?= $moduleFilter === $m ? 'selected' : '' ?>><?= e($m) ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="col-6 col-md-3"><input type="text" name="admin" class="form-control form-control-sm" placeholder="Administrator" value="<?= e($adminFilter) ?>"></div>
  <div class="col-6 col-md-2"><input type="date" name="from" class="form-control form-control-sm" value="<?= e($fromDate) ?>"></div>
  <div class="col-6 col-md-2"><input type="date" name="to" class="form-control form-control-sm" value="<?= e($toDate) ?>"></div>
  <div class="col-12 col-md-2 d-flex gap-2">
    <button class="btn btn-sm btn-primary flex-grow-1">Filter</button>
    <a href="activity-logs.php" class="btn btn-sm btn-outline-secondary">Reset</a>
  </div>
</form>

<div class="card border-0 shadow-sm">
  <div class="table-responsive">
    <table class="table table-sm align-middle mb-0">
      <thead><tr><th>Date/Time</th><th>Administrator</th><th>Action</th><th>Module</th><th>Description</th><th>IP Address</th></tr></thead>
      <tbody>
      <?php foreach ($logs as $row): ?>
        <tr>
          <td class="text-nowrap small"><?= e(date('M j, Y g:ia', strtotime($row['created_at']))) ?></td>
          <td><?= e($row['admin_name_snapshot'] ?? 'System') ?></td>
          <td><span class="badge text-bg-light border"><?= e($row['action']) ?></span></td>
          <td><?= e($row['module']) ?></td>
          <td class="small"><?= e($row['description'] ?? '') ?></td>
          <td class="small text-body-secondary"><?= e($row['ip_address'] ?? '') ?></td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$logs): ?>
        <tr><td colspan="6" class="text-center text-body-secondary py-4">No matching activity.</td></tr>
      <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>
<p class="text-body-secondary small mt-2">Showing up to 200 most recent matching entries.</p>
<?php admin_footer(); ?>
