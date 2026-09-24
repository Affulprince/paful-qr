<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/csrf.php';
require_once __DIR__ . '/includes/activity_log.php';
require_once __DIR__ . '/includes/layout.php';

$admin = require_permission('faq.view');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_require();
    $action = $_POST['action'] ?? '';

    if ($action === 'save') {
        if (!has_permission($_POST['id'] ? 'faq.edit' : 'faq.create')) {
            http_response_code(403);
            exit('Forbidden');
        }
        $id = (int) ($_POST['id'] ?? 0);
        $question = trim((string) ($_POST['question'] ?? ''));
        $answer = trim((string) ($_POST['answer'] ?? ''));
        $sortOrder = (int) ($_POST['sort_order'] ?? 0);
        $isActive = isset($_POST['is_active']) ? 1 : 0;

        if ($question === '' || $answer === '') {
            flash_set('error', 'Question and answer are both required.');
        } elseif ($id > 0) {
            db()->prepare('UPDATE faqs SET question=:q, answer=:a, sort_order=:o, is_active=:act WHERE id=:id')
                ->execute(['q' => $question, 'a' => $answer, 'o' => $sortOrder, 'act' => $isActive, 'id' => $id]);
            log_activity('update', 'faq', (string) $id, "Updated FAQ \"{$question}\"");
            flash_set('success', 'FAQ updated.');
        } else {
            db()->prepare('INSERT INTO faqs (question, answer, sort_order, is_active) VALUES (:q, :a, :o, :act)')
                ->execute(['q' => $question, 'a' => $answer, 'o' => $sortOrder, 'act' => $isActive]);
            log_activity('create', 'faq', (string) db()->lastInsertId(), "Created FAQ \"{$question}\"");
            flash_set('success', 'FAQ created.');
        }
    } elseif ($action === 'delete') {
        require_permission('faq.delete');
        $id = (int) ($_POST['id'] ?? 0);
        $row = db()->prepare('SELECT question FROM faqs WHERE id = :id');
        $row->execute(['id' => $id]);
        $question = $row->fetch()['question'] ?? '';
        db()->prepare('DELETE FROM faqs WHERE id = :id')->execute(['id' => $id]);
        log_activity('delete', 'faq', (string) $id, "Deleted FAQ \"{$question}\"");
        flash_set('success', 'FAQ deleted.');
    }

    header('Location: faq.php');
    exit;
}

$faqs = db()->query('SELECT * FROM faqs ORDER BY sort_order ASC, id ASC')->fetchAll();

admin_header('FAQ', 'faq.php');
?>
<div class="d-flex justify-content-between align-items-center mb-3">
  <h1 class="h4 mb-0">FAQ</h1>
  <?php if (has_permission('faq.create')): ?>
    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#faqModal" onclick="openFaqModal()">
      <i class="bi bi-plus-lg"></i> Add FAQ
    </button>
  <?php endif; ?>
</div>

<p class="text-body-secondary small">Only <strong>active</strong> entries appear on the public FAQ section.</p>

<div class="card border-0 shadow-sm">
  <div class="table-responsive">
    <table class="table align-middle mb-0">
      <thead><tr><th>#</th><th>Question</th><th>Status</th><th class="text-end">Actions</th></tr></thead>
      <tbody>
      <?php foreach ($faqs as $faq): ?>
        <tr>
          <td class="text-body-secondary"><?= (int) $faq['sort_order'] ?></td>
          <td><?= e($faq['question']) ?></td>
          <td><span class="badge text-bg-<?= $faq['is_active'] ? 'success' : 'secondary' ?>"><?= $faq['is_active'] ? 'Active' : 'Inactive' ?></span></td>
          <td class="text-end">
            <?php if (has_permission('faq.edit')): ?>
              <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#faqModal"
                onclick='openFaqModal(<?= json_encode($faq, JSON_HEX_APOS | JSON_HEX_QUOT) ?>)'>
                <i class="bi bi-pencil"></i>
              </button>
            <?php endif; ?>
            <?php if (has_permission('faq.delete')): ?>
              <button class="btn btn-sm btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deleteModal"
                onclick="openDeleteModal(<?= (int) $faq['id'] ?>, <?= json_encode($faq['question']) ?>)">
                <i class="bi bi-trash3"></i>
              </button>
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$faqs): ?>
        <tr><td colspan="4" class="text-center text-body-secondary py-4">No FAQ entries yet.</td></tr>
      <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Create/Edit modal -->
<div class="modal fade" id="faqModal" tabindex="-1">
  <div class="modal-dialog">
    <form method="post" class="modal-content">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" id="faqId" value="">
      <div class="modal-header">
        <h2 class="modal-title h5" id="faqModalTitle">Add FAQ</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label class="form-label">Question</label>
          <input type="text" name="question" id="faqQuestion" class="form-control" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Answer</label>
          <textarea name="answer" id="faqAnswer" class="form-control" rows="4" required></textarea>
        </div>
        <div class="row g-3">
          <div class="col-6">
            <label class="form-label">Order</label>
            <input type="number" name="sort_order" id="faqOrder" class="form-control" value="0">
          </div>
          <div class="col-6 d-flex align-items-end">
            <div class="form-check">
              <input type="checkbox" name="is_active" id="faqActive" class="form-check-input" checked>
              <label class="form-check-label" for="faqActive">Active</label>
            </div>
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

<!-- Delete confirmation modal -->
<div class="modal fade" id="deleteModal" tabindex="-1">
  <div class="modal-dialog">
    <form method="post" class="modal-content">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="delete">
      <input type="hidden" name="id" id="deleteId" value="">
      <div class="modal-header">
        <h2 class="modal-title h5">Delete FAQ?</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        Are you sure you want to delete "<strong id="deleteLabel"></strong>"? This action cannot be undone.
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-danger">Delete</button>
      </div>
    </form>
  </div>
</div>

<script>
function openFaqModal(faq) {
  document.getElementById('faqModalTitle').textContent = faq ? 'Edit FAQ' : 'Add FAQ';
  document.getElementById('faqId').value = faq ? faq.id : '';
  document.getElementById('faqQuestion').value = faq ? faq.question : '';
  document.getElementById('faqAnswer').value = faq ? faq.answer : '';
  document.getElementById('faqOrder').value = faq ? faq.sort_order : 0;
  document.getElementById('faqActive').checked = faq ? Number(faq.is_active) === 1 : true;
}
function openDeleteModal(id, label) {
  document.getElementById('deleteId').value = id;
  document.getElementById('deleteLabel').textContent = label;
}
</script>
<?php admin_footer(); ?>
