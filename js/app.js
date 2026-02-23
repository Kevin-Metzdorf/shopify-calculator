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

document.getElementById('risk-buffer').addEventListener('input', e => {
  document.getElementById('risk-buffer-value').textContent = `${e.target.value}%`;
});

// ── Main listeners ─────────────────────────────────────────────────────────
form.addEventListener('input',  run);
form.addEventListener('change', run);

// ── Boot — module scripts run after DOM is ready, call run() directly ──────
run();
