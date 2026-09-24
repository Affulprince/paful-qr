// Controller for templates.html — renders preset cards and hands the chosen
// one to the generator via the same pending-load mechanism as history.html.
'use strict';

function templateCard(category, tpl) {
  const col = document.createElement('div');
  col.className = 'col';
  col.innerHTML = `
    <div class="card h-100 shadow-sm border-0">
      <div class="card-body d-flex flex-column">
        <div class="template-swatch mb-3" style="background:${category.color}22;">${tpl.icon}</div>
        <h3 class="h6 card-title">${Utils.escapeHtml(tpl.name)}</h3>
        <p class="card-text small text-body-secondary flex-grow-1">${Utils.escapeHtml(tpl.title)}</p>
        <button type="button" class="btn btn-primary btn-sm mt-2">Use this template</button>
      </div>
    </div>
  `;
  col.querySelector('button').addEventListener('click', () => {
    QRHistory.setPendingLoad({
      type: tpl.type,
      fields: tpl.fields,
      style: tpl.style,
      title: tpl.title,
      collection: category.name,
    });
    window.location.href = 'index.html#generator';
  });
  return col;
}

async function renderTemplates() {
  const root = Utils.qs('#templateGroups');
  const categories = await loadTemplateCategories();
  root.innerHTML = '';
  categories.forEach((category) => {
    const heading = document.createElement('h2');
    heading.className = 'h6 text-uppercase text-body-secondary mt-5 mb-3';
    heading.textContent = category.name;
    root.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4';
    category.templates.forEach((tpl) => grid.appendChild(templateCard(category, tpl)));
    root.appendChild(grid);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  Utils.qs('#year').textContent = new Date().getFullYear();
  Theme.init();
  renderTemplates();
});
