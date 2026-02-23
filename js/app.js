import { calculateEstimate } from './logic.js';

// ── Section visibility rules per project type ──────────────────────────────
// Lists which module card sections to HIDE for a given project type.
const hiddenSectionsFor = {
  Audit:     ['section-dev', 'section-apps', 'section-commerce', 'section-content'],
  Tweaks:    [],
  NewBuild:  [],
  Migration: ['section-apps'],
  CustomApp: ['section-design', 'section-data', 'section-commerce', 'section-content'],
};

const form        = document.getElementById('estimator-form');
const allSections = ['section-design', 'section-data', 'section-dev', 'section-apps', 'section-commerce', 'section-content'];

// ── Helpers ────────────────────────────────────────────────────────────────
function buildState() {
  const projectType = document.getElementById('project-type').value;
  const design      = document.getElementById('design-type').value;
  const riskBuffer  = Number(document.getElementById('risk-buffer').value);
  const hourlyRate  = Math.max(1, Math.min(10000, Number(document.getElementById('hourly-rate').value) || 75));
  const vatRate     = Math.max(0, Math.min(1, Number(document.getElementById('vat-rate').value) || 0));

  // Guard against prototype pollution via tampered data-module / data-feature attributes
  const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

  const features = {};

  document.querySelectorAll('.feature-check').forEach(cb => {
    if (!cb.checked) return;

    const mod     = cb.dataset.module;
    const feature = cb.dataset.feature;

    if (DANGEROUS_KEYS.has(mod) || DANGEROUS_KEYS.has(feature)) return;

    const qtyEl = document.querySelector(`.feature-qty[data-for="${cb.id}"]`);
    const qty   = qtyEl ? Math.max(1, Math.min(9999, Number(qtyEl.value) || 1)) : 1;

    if (!features[mod]) features[mod] = {};
    features[mod][feature] = qty;
  });

  return { projectType, design, riskBuffer, hourlyRate, taxRate: vatRate, features };
}

function updateSidebar(result, vatRate) {
  const fmt    = n => Number.isInteger(n) ? n : +n.toFixed(2);
  const fmtEur = n => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

  const vatPct = Math.round(vatRate * 100);

  document.getElementById('out-base-hours').textContent    = `${fmt(result.baseHours)} hrs`;
  document.getElementById('out-feature-hours').textContent = `${fmt(result.featureHours)} hrs`;
  document.getElementById('out-buffer-hours').textContent  = `${fmt(result.bufferHours)} hrs`;
  document.getElementById('out-total-hours').textContent   = `${fmt(result.totalHours)} hrs`;
  document.getElementById('out-flat-fees').textContent     = fmtEur(result.flatFees);
  document.getElementById('out-net-price').textContent     = fmtEur(result.netPriceEUR);
  document.getElementById('out-vat-label').textContent     = `+ VAT (${vatPct}%)`;
  document.getElementById('out-tax-amount').textContent    = fmtEur(result.taxAmountEUR);
  document.getElementById('out-gross-price').textContent   = fmtEur(result.grossPriceEUR);
  document.getElementById('out-final-price').textContent   = fmtEur(result.grossPriceEUR);
}

function applySectionVisibility(projectType) {
  const hidden = new Set(hiddenSectionsFor[projectType] ?? []);

  allSections.forEach(id => {
    const section = document.getElementById(id)?.closest('section');
    if (!section) return;
    const shouldHide = hidden.has(id);
    section.hidden = shouldHide;

    // Uncheck & disable all inputs inside hidden sections so they don't affect state
    if (shouldHide) {
      section.querySelectorAll('.feature-check').forEach(cb => { cb.checked = false; });
      section.querySelectorAll('.feature-qty').forEach(el => { el.disabled = true; el.value = 1; });
    }
  });
}

function syncQtyInputs() {
  document.querySelectorAll('.feature-check').forEach(cb => {
    const qtyEl = document.querySelector(`.feature-qty[data-for="${cb.id}"]`);
    if (qtyEl) qtyEl.disabled = !cb.checked;
  });
}

function run() {
  const state  = buildState();
  applySectionVisibility(state.projectType);
  syncQtyInputs();
  const result = calculateEstimate(state);
  updateSidebar(result, state.taxRate);
}

// ── PDF Generation ─────────────────────────────────────────────────────────
document.getElementById('btn-download-pdf').addEventListener('click', () => {
  const fmtEur = n => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

  // Client / project meta
  const clientName  = document.getElementById('client-name').value.trim()  || 'Client';
  const projectName = document.getElementById('project-name').value.trim() || 'Project';

  // Current date DD.MM.YYYY
  const now = new Date();
  const dateStr = [
    String(now.getDate()).padStart(2, '0'),
    String(now.getMonth() + 1).padStart(2, '0'),
    now.getFullYear(),
  ].join('.');

  // Inject meta
  document.getElementById('pdf-date').textContent         = dateStr;
  document.getElementById('pdf-client-name').textContent  = clientName;
  document.getElementById('pdf-project-name').textContent = projectName;

  // Inject pricing from current sidebar values
  const state  = buildState();
  const result = calculateEstimate(state);
  const vatPct = Math.round(state.taxRate * 100);

  document.getElementById('pdf-net').textContent       = fmtEur(result.netPriceEUR);
  document.getElementById('pdf-vat-label').textContent = `VAT (${vatPct}%)`;
  document.getElementById('pdf-vat').textContent       = fmtEur(result.taxAmountEUR);
  document.getElementById('pdf-gross').textContent     = fmtEur(result.grossPriceEUR);

  // Build features list
  const list = document.getElementById('pdf-features-list');
  list.innerHTML = '';

  document.querySelectorAll('.feature-check').forEach(cb => {
    if (!cb.checked) return;

    const label  = document.querySelector(`label[for="${cb.id}"]`);
    const qtyEl  = document.querySelector(`.feature-qty[data-for="${cb.id}"]`);
    const name   = label ? label.textContent.trim() : cb.dataset.feature;
    const qty    = qtyEl && !qtyEl.disabled ? Number(qtyEl.value) : 1;

    const li = document.createElement('li');
    li.style.color = '#202223';
    li.textContent = qty > 1 ? `${name} (× ${qty})` : name;
    list.appendChild(li);
  });

  // Generate PDF
  const opt = {
    margin:     0,
    filename:   `Estimate_${clientName.replace(/\s+/g, '_')}.pdf`,
    image:      { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, windowWidth: 794 },
    jsPDF:      { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  html2pdf().set(opt).from(document.getElementById('pdf-template')).save();
});


document.getElementById('risk-buffer').addEventListener('input', e => {
  document.getElementById('risk-buffer-value').textContent = `${e.target.value}%`;
});

// ── Main listeners ─────────────────────────────────────────────────────────
form.addEventListener('input',  run);
form.addEventListener('change', run);

// ── Boot — module scripts run after DOM is ready, call run() directly ──────
run();
