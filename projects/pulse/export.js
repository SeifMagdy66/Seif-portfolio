function exportLoad() {
  try {
    const stored = JSON.parse(localStorage.getItem(exportStorageKey) || '[]');
    exportState.reports = Array.isArray(stored) ? stored.filter(item => item && exportTypes[item.type] && typeof item.id === 'string').slice(0, 30) : [];
  } catch { exportState.reports = []; }
}
function exportSave() {
  try { localStorage.setItem(exportStorageKey, JSON.stringify(exportState.reports)); } catch {}
}
function renderExportSubject() {
  const type = document.querySelector('#export-type').value;
  const root = document.querySelector('#export-subject');
  if (type === 'pm') {
    const names = [...new Set(cases.map(item => item.pm))].sort();
    root.innerHTML = '<div class="export-field"><span>PM selection</span><label class="export-check"><input type="checkbox" id="export-all-pms" checked> All PMs</label><div id="export-pm-list" class="export-pm-list">' + names.map(name => '<label class="export-check"><input type="checkbox" name="export-pm" value="' + exportEscape(name) + '" disabled> ' + exportEscape(name) + '</label>').join('') + '</div></div>';
  } else if (type === 'client' || type === 'service') {
    const field = type === 'client' ? 'client' : 'section';
    const values = [...new Set(cases.map(item => item[field]))].filter(value => type !== 'service' || value !== 'Not specified').sort();
    root.innerHTML = '<div class="export-field"><span>' + (type === 'client' ? 'Client' : 'Service') + '</span><select id="export-subject-select">' + values.map(value => '<option value="' + exportEscape(value) + '">' + exportEscape(value) + '</option>').join('') + '</select></div>';
    enhanceExportSelect(root.querySelector('select'));
  } else root.replaceChildren();
}
function enhanceExportSelect(select) {
  if (!select || select.closest('.export-select')) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'export-select';
  select.before(wrapper);
  wrapper.append(select);
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'export-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', select.parentElement.parentElement.querySelector(':scope > span')?.textContent || 'Select option');
  const current = document.createElement('span');
  current.className = 'export-select-current';
  const chevron = document.createElement('span');
  chevron.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  trigger.append(current, chevron);
  const menu = document.createElement('div');
  menu.className = 'export-select-menu';
  menu.id = select.id + '-menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', trigger.getAttribute('aria-label'));
  trigger.setAttribute('aria-controls', menu.id);
  for (const option of select.options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'export-select-option';
    button.setAttribute('role', 'option');
    button.dataset.value = option.value;
    const label = document.createElement('span');
    label.textContent = option.textContent;
    const check = document.createElement('span');
    check.className = 'export-select-check';
    check.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
    button.append(label, check);
    menu.append(button);
  }
  wrapper.append(trigger, menu);
  const sync = () => {
    current.textContent = select.selectedOptions[0]?.textContent || 'Choose an option';
    menu.querySelectorAll('.export-select-option').forEach(option => option.setAttribute('aria-selected', String(option.dataset.value === select.value)));
  };
  select.addEventListener('change', sync);
  sync();
}
function closeExportSelect() {
  document.querySelectorAll('.export-select.open').forEach(wrapper => {
    wrapper.classList.remove('open');
    wrapper.querySelector('.export-select-trigger').setAttribute('aria-expanded', 'false');
  });
}
function openExportSelect(wrapper) {
  closeExportSelect();
  wrapper.classList.add('open');
  wrapper.querySelector('.export-select-trigger').setAttribute('aria-expanded', 'true');
  wrapper.querySelector('.export-select-option[aria-selected="true"]')?.focus();
}
function renderExportLibrary() {
  const root = document.querySelector('#export-library');
  document.querySelector('#export-library-count').textContent = exportState.reports.length + (exportState.reports.length === 1 ? ' report' : ' reports');
  if (!exportState.reports.length) {
    root.innerHTML = '<div class="export-empty"><span class="export-empty-icon">PDF</span><h3>Your generated reports will appear here</h3><p>Choose a report type and create the first PDF.</p></div>';
    return;
  }
  root.innerHTML = exportState.reports.map(report => {
    const count = exportBlobs.has(report.id) && Number.isFinite(report.orderCount) ? report.orderCount : exportCases(report).length;
    const created = new Date(report.createdAt);
    const date = Number.isNaN(created.getTime()) ? '' : created.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    return '<article class="export-report-card"><span class="export-report-mark">PDF</span><div class="export-report-info"><span class="eyebrow">' + exportEscape(exportTypes[report.type]) + '</span><h3>' + exportEscape(exportSubjectLabel(report)) + '</h3><p>' + exportEscape(exportReportDates(report)) + ' · ' + count + ' selected ' + (count === 1 ? 'order' : 'orders') + ' · Created ' + exportEscape(date) + '</p></div><span class="export-ready">' + (exportBlobs.has(report.id) ? 'Ready' : 'Saved setup') + '</span><div class="export-actions"><button type="button" data-export-download="' + exportEscape(report.id) + '"' + (exportBusy ? ' disabled' : '') + '>Download PDF</button><button type="button" disabled title="Recipient addresses and a secure sending service are needed before email delivery can be enabled.">Send by email</button></div></article>';
  }).join('');
}
function renderExport() {
  if (!exportState.ready) return;
  document.querySelector('#export-snapshot-note').innerHTML = '<strong>' + (window.pulsesLive ? 'Fictional demo dataset:' : 'Fictional demo dataset:') + '</strong> ' + cases.length + ' fictional Final orders ' + (window.pulsesLive ? 'as of ' : 'captured ') + exportEscape(snapshotDate) + '. Available fictional audits are included. Sheet-only orders have scores but no verified audit explanation here. Reports describe only the selected rows; client sentiment and capacity need their own evidence.';
  renderExportLibrary();
}
function exportFormSpec() {
  const type = document.querySelector('#export-type').value;
  const preset = document.querySelector('#export-period').value;
  const range = exportPresets(preset);
  if (!range.start || !range.end || range.start > range.end) throw new Error('Choose a valid start and end date.');
  let subject = 'all';
  if (type === 'pm' && !document.querySelector('#export-all-pms').checked) {
    subject = [...document.querySelectorAll('input[name="export-pm"]:checked')].map(input => input.value);
    if (!subject.length) throw new Error('Choose at least one PM or select All PMs.');
  }
  if (type === 'client' || type === 'service') subject = document.querySelector('#export-subject-select').value;
  return { id: 'r' + Date.now() + Math.random().toString(36).slice(2, 7), type, preset, subject, start: range.start, end: range.end, createdAt: new Date().toISOString() };
}
function exportError(message) {
  const root = document.querySelector('#export-form-error');
  root.textContent = message || '';
  root.classList.toggle('hidden', !message);
}
const exportBlobs = new Map();
let exportBusy = false;

function setExportBusy(busy) {
  exportBusy = busy;
  const generate = document.querySelector('.export-generate');
  generate.disabled = busy;
  generate.setAttribute('aria-busy', String(busy));
  document.querySelectorAll('[data-export-download]').forEach(button => { button.disabled = busy; });
}
function showExportProgress(stage, detail, percent = null, state = 'running') {
  const panel = document.querySelector('#export-progress');
  const bar = document.querySelector('#export-progress-bar');
  panel.hidden = false;
  panel.dataset.state = state;
  document.querySelector('#export-progress-stage').textContent = stage;
  document.querySelector('#export-progress-detail').textContent = detail;
  if (percent == null) bar.removeAttribute('value');
  else bar.value = percent;
}
function allowExportPaint() {
  return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
}
async function ensureExportReports(rows) {
  if (rows.length > 500) throw new Error('This selection has more than 500 audits. Choose a shorter range while large PDF jobs are being prepared.');
  const linked = rows.filter(item => item.hasAudit);
  const pending = linked.filter(item => !reportData[item.id]);
  const alreadyLoaded = linked.length - pending.length;
  if (!window.pulsesLoadReport || !pending.length) {
    showExportProgress('Preparing source data', linked.length ? linked.length + ' linked audits ready' : 'No fictional audits in this selection', 75);
    return;
  }
  showExportProgress('Loading source audits', alreadyLoaded + ' of ' + linked.length + ' linked audits loaded', 10 + Math.round(alreadyLoaded / linked.length * 65));
  for (let start = 0; start < pending.length; start += 8) {
    await Promise.all(pending.slice(start, start + 8).map(item => window.pulsesLoadReport(item.id)));
    const count = Math.min(linked.length, alreadyLoaded + start + 8);
    showExportProgress('Loading source audits', count + ' of ' + linked.length + ' linked audits loaded', 10 + Math.round(count / linked.length * 65));
  }
}
function createExportPdf(spec, rows) {
  return new Promise((resolve, reject) => {
    let worker;
    try { worker = new Worker('export-worker.js'); }
    catch { reject(new Error('This browser cannot start the PDF builder. Please try another browser.')); return; }
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('The PDF took too long to build. Choose a shorter range and try again.'));
    }, 300000);
    worker.onmessage = event => {
      clearTimeout(timeout);
      worker.terminate();
      if (event.data.ok) resolve(new Blob([event.data.bytes], { type: 'application/pdf' }));
      else reject(new Error(event.data.error || 'Could not build this PDF.'));
    };
    worker.onerror = () => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error('The PDF builder stopped unexpectedly. Please try again.'));
    };
    const reports = {}, rich = {};
    for (const item of rows) {
      if (reportData[item.id]) reports[item.id] = reportData[item.id];
      if (reportRich[item.id]) rich[item.id] = reportRich[item.id];
    }
    try { worker.postMessage({ spec, rows, allCases: cases, reports, rich, capturedAt: snapshotDate }); }
    catch (error) {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error('Could not send this report to the PDF builder. Please try again.'));
    }
  });
}
function saveExportBlob(blob, report) {
  const filename = ('Pulses_' + report.type + '_' + exportSubjectLabel(report) + '_' + report.start + '_' + report.end).replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 120) + '.pdf';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function runExportJob(spec, download = false) {
  if (exportBusy) return;
  exportError('');
  try {
    const rows = exportCases(spec);
    if (!rows.length) throw new Error(download ? 'The selected orders are no longer available.' : 'No selected final order matches this report. Choose another time range or subject.');
    setExportBusy(true);
    showExportProgress(download ? 'Preparing download' : 'Preparing report', rows.length + ' final orders selected. Please keep this page open.', 10);
    document.querySelector('#export-progress').scrollIntoView({ behavior: 'smooth', block: 'center' });
    await allowExportPaint();
    let blob = exportBlobs.get(spec.id);
    if (!blob) {
      await ensureExportReports(rows);
      showExportProgress('Building PDF', 'Formatting ' + rows.length + ' orders and their available evidence. The page remains usable.', null);
      await allowExportPaint();
      blob = await createExportPdf(spec, rows);
      exportBlobs.set(spec.id, blob);
    }
    if (download) {
      showExportProgress('Starting download', 'Your PDF is ready and the browser is saving it.', 95);
      saveExportBlob(blob, spec);
      showExportProgress('Download started', 'Check your browser Downloads folder for the PDF.', 100, 'complete');
    } else {
      spec.orderCount = rows.length;
      spec.capturedAt = snapshotDate;
      exportState.reports.unshift(spec);
      exportState.reports = exportState.reports.slice(0, 30);
      for (const id of exportBlobs.keys()) if (!exportState.reports.some(report => report.id === id)) exportBlobs.delete(id);
      exportSave();
      showExportProgress('Report ready', 'The PDF is ready. Use Download PDF in the report library.', 100, 'complete');
    }
  } catch (error) {
    const message = error.message || 'Could not complete this report.';
    showExportProgress('Report could not be completed', message, 0, 'error');
    exportError(message);
  } finally {
    setExportBusy(false);
    renderExportLibrary();
  }
}
document.querySelectorAll('#export-type, #export-period').forEach(enhanceExportSelect);
document.addEventListener('click', event => {
  const option = event.target.closest('.export-select-option');
  if (option) {
    const wrapper = option.closest('.export-select');
    const select = wrapper.querySelector('select');
    select.value = option.dataset.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    closeExportSelect();
    wrapper.querySelector('.export-select-trigger').focus();
    return;
  }
  const trigger = event.target.closest('.export-select-trigger');
  if (trigger) {
    const wrapper = trigger.closest('.export-select');
    if (wrapper.classList.contains('open')) closeExportSelect();
    else openExportSelect(wrapper);
    return;
  }
  if (!event.target.closest('.export-select')) closeExportSelect();
});
document.addEventListener('keydown', event => {
  const trigger = event.target.closest('.export-select-trigger');
  const option = event.target.closest('.export-select-option');
  if (trigger && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); openExportSelect(trigger.closest('.export-select')); return; }
  if (!option) return;
  const wrapper = option.closest('.export-select');
  const choices = [...wrapper.querySelectorAll('.export-select-option')];
  const index = choices.indexOf(option);
  if (event.key === 'Escape') { event.preventDefault(); closeExportSelect(); wrapper.querySelector('.export-select-trigger').focus(); }
  else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length;
    choices[next].focus();
  }
});
document.querySelector('#export-type').addEventListener('change', () => { renderExportSubject(); exportError(''); });
document.querySelector('#export-period').addEventListener('change', event => {
  document.querySelector('#export-custom-dates').classList.toggle('hidden', event.target.value !== 'custom');
  exportError('');
});
document.querySelector('#export-subject').addEventListener('change', event => {
  if (event.target.id === 'export-all-pms') {
    document.querySelectorAll('input[name="export-pm"]').forEach(input => { input.disabled = event.target.checked; input.checked = false; });
  }
});
document.querySelector('#export-form').addEventListener('submit', async event => {
  event.preventDefault();
  exportError('');
  try {
    const spec = exportFormSpec();
    const rows = exportCases(spec);
    if (!rows.length) throw new Error('No selected final order matches this report. Choose another time range or subject.');
    await runExportJob(spec);
  } catch (error) {
    const message = error.message || 'Could not create this report.';
    showExportProgress('Report could not be started', message, 0, 'error');
    exportError(message);
  }
});
document.querySelector('#export-library').addEventListener('click', event => {
  const button = event.target.closest('[data-export-download]');
  if (!button) return;
  const report = exportState.reports.find(item => item.id === button.dataset.exportDownload);
  if (report) runExportJob(report, true);
});
exportLoad();
renderExportSubject();
exportState.ready = true;
renderExportLibrary();
