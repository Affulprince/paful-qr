<?php
declare(strict_types=1);

/**
 * Sidebar structure. Each item is filtered by permission at render time —
 * a Content Manager never even sees "Administrators" in the markup, but
 * every admin/*.php page also enforces its own require_permission() call,
 * so this is convenience, not the security boundary.
 */
function admin_menu(): array
{
    return [
        'MAIN' => [
            ['dashboard.php', 'bi-speedometer2', 'Dashboard', 'dashboard.view'],
        ],
        'WEBSITE' => [
            ['faq.php', 'bi-question-circle', 'FAQ', 'faq.view'],
        ],
        'QR MANAGEMENT' => [
            ['qr-types.php', 'bi-qr-code', 'QR Types', 'qr.types.view'],
            ['qr-templates.php', 'bi-collection', 'QR Templates', 'qr.templates.view'],
            ['qr-settings.php', 'bi-sliders', 'QR Settings', 'qr.settings.view'],
        ],
        'DONATE PAGE' => [
            ['donate.php', 'bi-heart', 'Payment Information', 'donate.view'],
        ],
        'ADMINISTRATION' => [
            ['administrators.php', 'bi-people', 'Administrators', 'admins.view'],
            ['roles.php', 'bi-key', 'Roles & Permissions', 'roles.view'],
            ['activity-logs.php', 'bi-clock-history', 'Activity Logs', 'activity_logs.view'],
        ],
        'SYSTEM' => [
            ['settings.php', 'bi-gear', 'Settings', 'settings.view'],
        ],
    ];
}

function admin_header(string $title, string $active = ''): void
{
    $admin = current_admin();
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= e($title) ?> | PAFUL QR Admin</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="../css/paful-qr.css">
<style>
  .admin-sidebar { width: 240px; }
  .admin-sidebar .nav-link { color: var(--bs-body-color); border-radius: .5rem; }
  .admin-sidebar .nav-link.active { background: var(--paful-primary); color: #fff; }
  .admin-sidebar .nav-link:hover:not(.active) { background: var(--bs-tertiary-bg); }
  .admin-section-label { font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; color: var(--bs-secondary-color); padding: .5rem .75rem .25rem; }
  .admin-main { min-height: 100vh; min-width: 0; }
</style>
</head>
<body>
<div class="d-flex">
  <div class="offcanvas-lg offcanvas-start admin-sidebar border-end bg-body" tabindex="-1" id="adminSidebar">
    <div class="offcanvas-header border-bottom">
      <a href="dashboard.php" class="navbar-brand d-flex align-items-center mb-0">
        <span class="brand-mark"><i class="bi bi-qr-code"></i></span>
        <span class="ms-2">PAFUL QR <small class="text-body-secondary d-block" style="font-size:.65rem;">ADMIN PANEL</small></span>
      </a>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#adminSidebar" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body d-flex flex-column p-2">
      <nav class="nav flex-column gap-1 flex-grow-1">
        <?php foreach (admin_menu() as $section => $items):
          $visible = array_filter($items, fn ($item) => has_permission($item[3]));
          if (!$visible) continue; ?>
          <div class="admin-section-label"><?= e($section) ?></div>
          <?php foreach ($visible as [$href, $icon, $label, $perm]): ?>
            <a href="<?= e($href) ?>" class="nav-link d-flex align-items-center gap-2 px-3 py-2 <?= $active === $href ? 'active' : '' ?>">
              <i class="bi <?= e($icon) ?>"></i> <?= e($label) ?>
            </a>
          <?php endforeach; ?>
        <?php endforeach; ?>
      </nav>
      <div class="btn-group w-100 mb-2" role="group" aria-label="Theme">
        <button type="button" class="btn btn-outline-secondary btn-sm" data-theme-option="light"><i class="bi bi-sun"></i></button>
        <button type="button" class="btn btn-outline-secondary btn-sm" data-theme-option="dark"><i class="bi bi-moon-stars"></i></button>
        <button type="button" class="btn btn-outline-secondary btn-sm" data-theme-option="system"><i class="bi bi-circle-half"></i></button>
      </div>
    </div>
  </div>

  <div class="admin-main flex-grow-1">
    <nav class="navbar border-bottom bg-body px-3">
      <button class="btn btn-outline-secondary d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#adminSidebar">
        <i class="bi bi-list"></i>
      </button>
      <span class="navbar-text fw-semibold d-none d-sm-inline"><?= e($title) ?></span>
      <div class="dropdown ms-auto">
        <button class="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown" style="max-width: 220px;">
          <i class="bi bi-person-circle flex-shrink-0"></i> <span class="text-truncate"><?= e($admin['name'] ?? '') ?></span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><span class="dropdown-item-text small text-body-secondary"><?= e($admin['role_name'] ?? '') ?></span></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="../index.html" target="_blank">View Public Site</a></li>
          <li><a class="dropdown-item text-danger" href="logout.php">Log Out</a></li>
        </ul>
      </div>
    </nav>
    <main class="container-fluid p-3 p-lg-4">
      <?php foreach (flash_take() as $flash): ?>
        <div class="alert alert-<?= $flash['type'] === 'error' ? 'danger' : e($flash['type']) ?> alert-dismissible fade show">
          <?= e($flash['message']) ?>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      <?php endforeach; ?>
<?php
}

function admin_footer(): void
{
    ?>
    </main>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="../js/utils.js"></script>
<script src="../js/theme.js"></script>
<script>document.addEventListener('DOMContentLoaded', () => Theme.init());</script>
</body>
</html>
<?php
}
