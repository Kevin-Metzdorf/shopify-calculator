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
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const fmtEur = n => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

  const clientName  = document.getElementById('client-name').value.trim()  || 'Client';
  const projectName = document.getElementById('project-name').value.trim() || 'Project';

  const now = new Date();
  const dateStr = [
    String(now.getDate()).padStart(2, '0'),
    String(now.getMonth() + 1).padStart(2, '0'),
    now.getFullYear(),
  ].join('.');

  const state  = buildState();
  const result = calculateEstimate(state);
  const vatPct = Math.round(state.taxRate * 100);

  // Palette
  const dark   = [32, 34, 35];
  const gray   = [109, 113, 117];
  const green  = [0, 128, 96];
  const border = [225, 227, 229];
  const bgGray = [246, 246, 247];

  const pageW   = doc.internal.pageSize.getWidth();
  const pageH   = doc.internal.pageSize.getHeight();
  const margin  = 20;
  const contentW = pageW - margin * 2;

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('Project Estimate', margin, 26);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...green);
  doc.text('Kevin Metzdorf Ltd. – Shopify Agency', margin, 33);

  doc.setDrawColor(...border);
  doc.setLineWidth(0.4);
  doc.line(margin, 38, pageW - margin, 38);

  // ── Meta Info ─────────────────────────────────────────────────────────────
  const colW   = contentW / 3;
  const metaY  = 48;
  const metaItems = [['DATE', dateStr], ['CLIENT / COMPANY', clientName], ['PROJECT NAME', projectName]];

  metaItems.forEach(([label, value], i) => {
    const x = margin + i * colW;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gray);
    doc.text(label, x, metaY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...dark);
    doc.text(value, x, metaY + 6);
  });

  // ── Scope of Work ─────────────────────────────────────────────────────────
  const scopeY = metaY + 18;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...gray);
  doc.text('SCOPE OF WORK', margin, scopeY);
  doc.setDrawColor(...border);
  doc.line(margin, scopeY + 2, pageW - margin, scopeY + 2);

  const scopeBody = [];
  scopeBody.push([`Base Hours – ${state.projectType}`, '', `${result.baseHours} hrs`]);

  document.querySelectorAll('.feature-check').forEach(cb => {
    if (!cb.checked) return;
    const label = document.querySelector(`label[for="${cb.id}"]`);
    const qtyEl = document.querySelector(`.feature-qty[data-for="${cb.id}"]`);
    const name  = label ? label.textContent.trim() : cb.dataset.feature;
    const qty   = qtyEl && !qtyEl.disabled ? Number(qtyEl.value) : 1;
    scopeBody.push([name, qty > 1 ? `× ${qty}` : '', '']);
  });

  if (result.bufferHours > 0) {
    scopeBody.push([`Risk Buffer (${state.riskBuffer}%)`, '', `+ ${result.bufferHours} hrs`]);
  }

  scopeBody.push([{ content: `Total Hours`, styles: { fontStyle: 'bold', textColor: dark } }, '', { content: `${result.totalHours} hrs`, styles: { fontStyle: 'bold', textColor: dark } }]);

  doc.autoTable({
    startY: scopeY + 5,
    head: [['Feature', 'Qty', 'Hours']],
    body: scopeBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, textColor: dark, cellPadding: { top: 3, bottom: 3, left: 2, right: 2 } },
    headStyles: { fillColor: bgGray, textColor: gray, fontStyle: 'bold', fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
    },
    theme: 'plain',
    tableLineColor: border,
    tableLineWidth: 0.1,
  });

  // ── Pricing Summary ───────────────────────────────────────────────────────
  const pricingY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...gray);
  doc.text('PRICING SUMMARY', margin, pricingY);
  doc.setDrawColor(...border);
  doc.line(margin, pricingY + 2, pageW - margin, pricingY + 2);

  doc.autoTable({
    startY: pricingY + 5,
    body: [
      ['Net Price (Netto)',    fmtEur(result.netPriceEUR)],
      [`VAT (${vatPct}%)`,    fmtEur(result.taxAmountEUR)],
      ['Gross Price (Brutto)', fmtEur(result.grossPriceEUR)],
    ],
    margin: { left: margin + contentW - 95, right: margin },
    styles: { fontSize: 10, textColor: dark, cellPadding: { top: 3, bottom: 3, left: 2, right: 2 } },
    columnStyles: {
      0: { cellWidth: 65, textColor: gray },
      1: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell(data) {
      if (data.row.index === 2) {
        data.cell.styles.fontSize    = 12;
        data.cell.styles.fontStyle   = 'bold';
        if (data.column.index === 1) data.cell.styles.textColor = green;
      }
    },
    theme: 'plain',
    tableLineColor: border,
    tableLineWidth: 0.1,
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setDrawColor(...border);
  doc.setLineWidth(0.4);
  doc.line(margin, pageH - 15, pageW - margin, pageH - 15);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(
    'This non-binding estimate is valid for 14 days from the date of issue. Kevin Metzdorf Ltd. · Confidential',
    pageW / 2,
    pageH - 10,
    { align: 'center' }
  );

  doc.save(`Estimate_${clientName.replace(/\s+/g, '_')}.pdf`);
});


document.getElementById('risk-buffer').addEventListener('input', e => {
  document.getElementById('risk-buffer-value').textContent = `${e.target.value}%`;
});

// ── Main listeners ─────────────────────────────────────────────────────────
form.addEventListener('input',  run);
form.addEventListener('change', run);

// ── Boot — module scripts run after DOM is ready, call run() directly ──────
run();
