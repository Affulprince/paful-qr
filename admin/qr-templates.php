<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/csrf.php';
require_once __DIR__ . '/includes/activity_log.php';
require_once __DIR__ . '/includes/layout.php';

$admin = require_permission('qr.templates.view');

function normalize_fields_json(string $raw): ?string
{
    $raw = trim($raw) === '' ? '{}' : trim($raw);
    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        return null;
    }
    return json_encode($decoded);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_require();
    $action = $_POST['action'] ?? '';

    if ($action === 'save') {
        $requiredPerm = !empty($_POST['id']) ? 'qr.templates.edit' : 'qr.templates.create';
        require_permission($requiredPerm);

        $id = (int) ($_POST['id'] ?? 0);
        $name = trim((string) ($_POST['name'] ?? ''));
        $category = trim((string) ($_POST['category'] ?? ''));
        $description = trim((string) ($_POST['description'] ?? ''));
        $icon = trim((string) ($_POST['icon'] ?? ''));
        $typeKey = trim((string) ($_POST['type_key'] ?? ''));
        $fieldsJson = normalize_fields_json((string) ($_POST['default_fields'] ?? '{}'));
        $fgColor = (string) ($_POST['fg_color'] ?? '#0b3c5d');
        $bgColor = (string) ($_POST['bg_color'] ?? '#ffffff');
        $dotStyle = (string) ($_POST['dot_style'] ?? 'square');
        $cornerSquareStyle = (string) ($_POST['corner_square_style'] ?? 'square');
        $cornerDotStyle = (string) ($_POST['corner_dot_style'] ?? 'square');
        $errorCorrection = in_array($_POST['error_correction'] ?? 'M', ['L', 'M', 'Q', 'H'], true) ? $_POST['error_correction'] : 'M';
        $sortOrder = (int) ($_POST['sort_order'] ?? 0);
        $isActive = isset($_POST['is_active']) ? 1 : 0;

        $validType = db()->prepare('SELECT 1 FROM qr_types WHERE type_key = :k');
        $validType->execute(['k' => $typeKey]);

        if ($name === '' || $category === '' || $fieldsJson === null) {
            flash_set('error', 'Name, category, and valid JSON default fields (e.g. {} or {"url":""}) are required.');
        } elseif (!$validType->fetch()) {
            flash_set('error', 'That QR type doesn\'t exist.');
        } elseif ($id > 0) {
            db()->prepare(
                'UPDATE qr_templates SET name=:n, category=:c, description=:d, icon=:i, type_key=:tk, default_fields=:df,
                 fg_color=:fg, bg_color=:bg, dot_style=:ds, corner_square_style=:css, corner_dot_style=:cds,
                 error_correction=:ec, sort_order=:so, is_active=:act WHERE id=:id'
            )->execute([
                'n' => $name, 'c' => $category, 'd' => $description, 'i' => $icon, 'tk' => $typeKey, 'df' => $fieldsJson,
                'fg' => $fgColor, 'bg' => $bgColor, 'ds' => $dotStyle, 'css' => $cornerSquareStyle, 'cds' => $cornerDotStyle,
                'ec' => $errorCorrection, 'so' => $sortOrder, 'act' => $isActive, 'id' => $id,
            ]);
            log_activity('update', 'qr_templates', (string) $id, "Updated QR template \"{$name}\"");
            flash_set('success', 'Template updated.');
        } else {
            db()->prepare(
                'INSERT INTO qr_templates (name, category, description, icon, type_key, default_fields, fg_color, bg_color, dot_style, corner_square_style, corner_dot_style, error_correction, sort_order, is_active)
                 VALUES (:n, :c, :d, :i, :tk, :df, :fg, :bg, :ds, :css, :cds, :ec, :so, :act)'
            )->execute([
                'n' => $name, 'c' => $category, 'd' => $description, 'i' => $icon, 'tk' => $typeKey, 'df' => $fieldsJson,
                'fg' => $fgColor, 'bg' => $bgColor, 'ds' => $dotStyle, 'css' => $cornerSquareStyle, 'cds' => $cornerDotStyle,
                'ec' => $errorCorrection, 'so' => $sortOrder, 'act' => $isActive,
            ]);
            log_activity('create', 'qr_templates', (string) db()->lastInsertId(), "Created QR template \"{$name}\"");
            flash_set('success', 'Template created.');
        }
    } elseif ($action === 'duplicate') {
        require_permission('qr.templates.create');
        $id = (int) ($_POST['id'] ?? 0);
        $row = db()->prepare('SELECT * FROM qr_templates WHERE id = :id');
        $row->execute(['id' => $id]);
        $row = $row->fetch();
        if ($row) {
            db()->prepare(
                'INSERT INTO qr_templates (name, category, description, icon, type_key, default_fields, fg_color, bg_color, dot_style, corner_square_style, corner_dot_style, error_correction, sort_order, is_active)
                 VALUES (:n, :c, :d, :i, :tk, :df, :fg, :bg, :ds, :css, :cds, :ec, :so, 0)'
            )->execute([
                'n' => $row['name'] . ' (Copy)', 'c' => $row['category'], 'd' => $row['description'], 'i' => $row['icon'],
                'tk' => $row['type_key'], 'df' => $row['default_fields'], 'fg' => $row['fg_color'], 'bg' => $row['bg_color'],
                'ds' => $row['dot_style'], 'css' => $row['corner_square_style'], 'cds' => $row['corner_dot_style'],
                'ec' => $row['error_correction'], 'so' => $row['sort_order'],
            ]);
            log_activity('create', 'qr_templates', (string) db()->lastInsertId(), "Duplicated QR template \"{$row['name']}\"");
            flash_set('success', 'Template duplicated (created inactive — review then activate it).');
        }
    } elseif ($action === 'delete') {
        require_permission('qr.templates.delete');
        $id = (int) ($_POST['id'] ?? 0);
        $row = db()->prepare('SELECT name FROM qr_templates WHERE id = :id');
        $row->execute(['id' => $id]);
        $name = $row->fetch()['name'] ?? '';
        db()->prepare('DELETE FROM qr_templates WHERE id = :id')->execute(['id' => $id]);
        log_activity('delete', 'qr_templates', (string) $id, "Deleted QR template \"{$name}\"");
        flash_set('success', 'Template deleted.');
    }

    header('Location: qr-templates.php');
    exit;
}

$templates = db()->query('SELECT * FROM qr_templates ORDER BY category ASC, sort_order ASC, id ASC')->fetchAll();
$types = db()->query('SELECT type_key, name FROM qr_types ORDER BY name ASC')->fetchAll();

admin_header('QR Templates', 'qr-templates.php');
?>
<div class="d-flex justify-content-between align-items-center mb-3">
  <h1 class="h4 mb-0">QR Templates</h1>
  <?php if (has_permission('qr.templates.create')): ?>
    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#tplModal" onclick="openTplModal()"><i class="bi bi-plus-lg"></i> Add Template</button>
  <?php endif; ?>
</div>
<p class="text-body-secondary small mb-4">Only <strong>active</strong> templates appear on the public Templates page, grouped by category.</p>

<div class="card border-0 shadow-sm">
  <div class="table-responsive">
    <table class="table align-middle mb-0">
      <thead><tr><th></th><th>Name</th><th>Category</th><th>Type</th><th>Color</th><th>Status</th><th class="text-end">Actions</th></tr></thead>
      <tbody>
      <?php foreach ($templates as $tpl): ?>
        <tr>
          <td class="fs-5"><?= e($tpl['icon']) ?></td>
          <td><?= e($tpl['name']) ?><div class="text-body-secondary small"><?= e($tpl['description']) ?></div></td>
          <td><span class="badge text-bg-light border"><?= e($tpl['category']) ?></span></td>
          <td><code><?= e($tpl['type_key']) ?></code></td>
          <td><span class="d-inline-block rounded" style="width:20px;height:20px;background:<?= e($tpl['fg_color']) ?>;vertical-align:middle;"></span></td>
          <td><span class="badge text-bg-<?= $tpl['is_active'] ? 'success' : 'secondary' ?>"><?= $tpl['is_active'] ? 'Active' : 'Inactive' ?></span></td>
          <td class="text-end text-nowrap">
            <?php if (has_permission('qr.templates.edit')): ?>
              <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#tplModal"
                onclick='openTplModal(<?= json_encode($tpl, JSON_HEX_APOS | JSON_HEX_QUOT) ?>)'><i class="bi bi-pencil"></i></button>
            <?php endif; ?>
            <?php if (has_permission('qr.templates.create')): ?>
              <form method="post" class="d-inline">
                <?= csrf_field() ?><input type="hidden" name="action" value="duplicate"><input type="hidden" name="id" value="<?= (int) $tpl['id'] ?>">
                <button class="btn btn-sm btn-outline-secondary" title="Duplicate"><i class="bi bi-files"></i></button>
              </form>
            <?php endif; ?>
            <?php if (has_permission('qr.templates.delete')): ?>
              <button class="btn btn-sm btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deleteModal"
                onclick="openDeleteModal(<?= (int) $tpl['id'] ?>, <?= json_encode($tpl['name']) ?>)"><i class="bi bi-trash3"></i></button>
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$templates): ?><tr><td colspan="7" class="text-center text-body-secondary py-4">No templates yet.</td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<div class="modal fade" id="tplModal" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <form method="post" class="modal-content">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" id="tplId">
      <div class="modal-header"><h2 class="modal-title h5" id="tplModalTitle">Add Template</h2><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <div class="row g-3">
          <div class="col-md-6"><label class="form-label">Name</label><input type="text" name="name" id="tplName" class="form-control" required></div>
          <div class="col-md-6"><label class="form-label">Category</label><input type="text" name="category" id="tplCategory" class="form-control" required list="categoryList">
            <datalist id="categoryList"><option>Business</option><option>Restaurant</option><option>Church</option><option>Event</option><option>Personal</option></datalist>
          </div>
          <div class="col-md-8"><label class="form-label">Description (shown under the name)</label><input type="text" name="description" id="tplDescription" class="form-control"></div>
          <div class="col-md-4"><label class="form-label">Icon (emoji)</label><input type="text" name="icon" id="tplIcon" class="form-control" placeholder="🌐"></div>
          <div class="col-md-6">
            <label class="form-label">QR type</label>
            <select name="type_key" id="tplType" class="form-select">
              <?php foreach ($types as $t): ?><option value="<?= e($t['type_key']) ?>"><?= e($t['name']) ?> (<?= e($t['type_key']) ?>)</option><?php endforeach; ?>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Default fields (JSON)</label>
            <input type="text" name="default_fields" id="tplFields" class="form-control" placeholder='{"url":""}'>
            <div class="form-text">Field names must match the QR type's own fields, e.g. <code>{"platform":"instagram"}</code> for a Social template.</div>
          </div>
          <div class="col-6 col-md-3"><label class="form-label">QR color</label><input type="color" name="fg_color" id="tplFg" class="form-control form-control-color" value="#0b3c5d"></div>
          <div class="col-6 col-md-3"><label class="form-label">Background</label><input type="color" name="bg_color" id="tplBg" class="form-control form-control-color" value="#ffffff"></div>
          <div class="col-6 col-md-3">
            <label class="form-label">Pattern</label>
            <select name="dot_style" id="tplDotStyle" class="form-select">
              <option value="square">Square</option><option value="dots">Dots</option><option value="rounded">Rounded</option><option value="extra-rounded">Extra rounded</option>
            </select>
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label">Error correction</label>
            <select name="error_correction" id="tplErrorCorrection" class="form-select">
              <option value="L">Low</option><option value="M">Medium</option><option value="Q">Quartile</option><option value="H">High</option>
            </select>
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label">Eye frame style</label>
            <select name="corner_square_style" id="tplCornerSquare" class="form-select">
              <option value="square">Square</option><option value="extra-rounded">Rounded</option><option value="dot">Circle</option>
            </select>
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label">Eye center style</label>
            <select name="corner_dot_style" id="tplCornerDot" class="form-select">
              <option value="square">Square</option><option value="dot">Circle</option>
            </select>
          </div>
          <div class="col-6 col-md-3"><label class="form-label">Order</label><input type="number" name="sort_order" id="tplOrder" class="form-control" value="0"></div>
          <div class="col-6 col-md-3 d-flex align-items-end"><div class="form-check"><input type="checkbox" name="is_active" id="tplActive" class="form-check-input" checked><label class="form-check-label" for="tplActive">Active</label></div></div>
        </div>
      </div>
      <div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary">Save</button></div>
    </form>
  </div>
</div>

<div class="modal fade" id="deleteModal" tabindex="-1">
  <div class="modal-dialog">
    <form method="post" class="modal-content">
      <?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" id="deleteId">
      <div class="modal-header"><h2 class="modal-title h5">Delete Template?</h2><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">Delete "<strong id="deleteLabel"></strong>"? This cannot be undone.</div>
      <div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button><button class="btn btn-danger">Delete</button></div>
    </form>
  </div>
</div>

<script>
function openTplModal(t) {
  document.getElementById('tplModalTitle').textContent = t ? 'Edit Template' : 'Add Template';
  document.getElementById('tplId').value = t ? t.id : '';
  document.getElementById('tplName').value = t ? t.name : '';
  document.getElementById('tplCategory').value = t ? t.category : '';
  document.getElementById('tplDescription').value = t ? t.description || '' : '';
  document.getElementById('tplIcon').value = t ? t.icon || '' : '';
  document.getElementById('tplType').value = t ? t.type_key : 'url';
  document.getElementById('tplFields').value = t ? t.default_fields : '{}';
  document.getElementById('tplFg').value = t ? t.fg_color : '#0b3c5d';
  document.getElementById('tplBg').value = t ? t.bg_color : '#ffffff';
  document.getElementById('tplDotStyle').value = t ? t.dot_style : 'square';
  document.getElementById('tplErrorCorrection').value = t ? t.error_correction : 'M';
  document.getElementById('tplCornerSquare').value = t ? t.corner_square_style : 'square';
  document.getElementById('tplCornerDot').value = t ? t.corner_dot_style : 'square';
  document.getElementById('tplOrder').value = t ? t.sort_order : 0;
  document.getElementById('tplActive').checked = t ? Number(t.is_active) === 1 : true;
}
function openDeleteModal(id, name) {
  document.getElementById('deleteId').value = id;
  document.getElementById('deleteLabel').textContent = name;
}
</script>
<?php admin_footer(); ?>
