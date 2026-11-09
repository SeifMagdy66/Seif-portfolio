const exportTypes = { pm: 'PM performance', client: 'Client account', period: 'Time period', service: 'Service quality' };
const exportStorageKey = 'ziad-pulse-fictional-demo-reports-v1';
const exportState = { reports: [], ready: false };

function exportEscape(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
function exportDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}
function exportPresets(preset) {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  if (preset === 'last-month') {
    return { start: exportDate(new Date(Date.UTC(year, month - 1, 1))), end: exportDate(new Date(Date.UTC(year, month, 0))) };
  }
  if (preset === 'last-quarter') {
    const currentQuarterStart = Math.floor(month / 3) * 3;
    return { start: exportDate(new Date(Date.UTC(year, currentQuarterStart - 3, 1))), end: exportDate(new Date(Date.UTC(year, currentQuarterStart, 0))) };
  }
  if (preset === 'sample') {
    const dates = cases.map(item => item.date).sort();
    return { start: dates[0], end: dates[dates.length - 1] };
  }
  return { start: document.querySelector('#export-start').value, end: document.querySelector('#export-end').value };
}
function exportPriorRange(spec) {
  const day = 86400000;
  const start = Date.parse(spec.start + 'T00:00:00Z'), end = Date.parse(spec.end + 'T00:00:00Z');
  const span = Math.round((end - start) / day) + 1;
  return { start: exportDate(start - span * day), end: exportDate(start - day) };
}
function exportMatches(item, spec, range = spec) {
  if (item.date < range.start || item.date > range.end) return false;
  if (spec.type === 'pm' && spec.subject !== 'all' && !spec.subject.includes(item.pm)) return false;
  if (spec.type === 'client' && item.client !== spec.subject) return false;
  if (spec.type === 'service' && item.section !== spec.subject) return false;
  return true;
}
function exportCases(spec, range = spec) {
  return cases.filter(item => exportMatches(item, spec, range)).sort((a, b) => b.date.localeCompare(a.date));
}
function exportAverage(rows, getter = item => item.score) {
  return rows.length ? rows.reduce((sum, item) => sum + getter(item), 0) / rows.length : null;
}
function exportScore(value) {
  return value == null ? 'Not available' : Number(value.toFixed(2)) + '%';
}
function exportSubjectLabel(spec) {
  if (spec.type === 'pm') return spec.subject === 'all' ? 'All PMs' : spec.subject.join(', ');
  if (spec.type === 'client' || spec.type === 'service') return spec.subject;
  return 'All selected projects';
}
function exportReportTitle(spec) {
  return exportTypes[spec.type] + ' | ' + exportSubjectLabel(spec);
}
function exportReportDates(spec) {
  return spec.start + ' to ' + spec.end;
}
function pdfPlain(value) {
  return String(value ?? '').replace(/[—–−]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/→/g, 'to').replace(/·/g, '|').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e\n]/g, '');
}
function pmAuditCategory(item, index) {
  if (!item.hasAudit || !reportData[item.id]) return { notes: [], links: [] };
  const headings = ['Client communication', 'Resource communication', 'Deadline compliance', 'Quality assessment', 'Plunet review'];
  const aliases = { 'client communication': 0, 'resource communication': 1, 'vendor communication': 1, 'deadline': 2, 'deadline compliance': 2, 'quality': 3, 'quality assessment': 3, 'plunet review': 4, 'plunet record review': 4, 'plunet record checks': 4, 'plunet documentation': 4 };
  const paragraphs = reportData[item.id].paragraphs || [];
  const categoryIndex = text => aliases[text?.trim().toLowerCase()];
  const start = paragraphs.findIndex(row => categoryIndex(row.text) === index);
  if (start < 0) return { notes: [], links: [] };
  const following = paragraphs.findIndex((row, position) => position > start + 1 && ((categoryIndex(row.text) !== undefined && /^[\d.]+%?\s*\/\s*[\d.]+%?$/.test(paragraphs[position + 1]?.text || '')) || /^Plunet checks (?:&|and) project ownership$|^Operational Notes & Plunet Checks$|^Unscored Operational Notes & Plunet Flags$|^Project ownership \(unscored\):/i.test(row.text)));
  const end = following < 0 ? paragraphs.length : following;
  const block = paragraphs.slice(start + 1, end);
  const score = item.findings[index][1].match(/([\d.]+)\s*\/\s*([\d.]+)/);
  const deducted = score && Number(score[1]) + 0.005 < Number(score[2]);
  const notes = block.filter(row => row.text && !/^\s*[\d.]+%?\s*\/\s*[\d.]+%?\s*$/.test(row.text) && !/^Evidence\b/i.test(row.text))
    .map(row => row.text.trim()).filter(Boolean).slice(0, deducted ? 8 : 2);
  const links = [];
  const seen = new Set();
  for (const runs of (reportRich[item.id] || []).slice(start + 1, end)) {
    for (const run of runs) {
      if (!run.u || seen.has(run.u)) continue;
      seen.add(run.u);
      links.push({ label: run.t.trim() || 'Source evidence', url: run.u });
    }
  }
  return { notes, links: links.slice(0, deducted ? 8 : 3) };
}

function buildExportPdf(spec, rows) {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) throw new Error('The PDF generator is unavailable.');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const W = 595.28, H = 841.89, M = 43, right = W - M, width = W - M * 2;
  const color = { pine: [19, 63, 50], ink: [27, 49, 43], green: [38, 122, 84], pale: [236, 246, 232], lime: [216, 246, 126], red: [173, 53, 46], rose: [254, 238, 234], muted: [101, 121, 110], line: [222, 233, 221] };
  let y = 0, chapter = '', pageCount = 0;
  function fill(c) { pdf.setFillColor(...c); }
  function stroke(c) { pdf.setDrawColor(...c); }
  function ink(c) { pdf.setTextColor(...c); }
  function text(value, x, yy, size = 10, bold = false, c = color.ink, options = {}) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size); ink(c); pdf.text(pdfPlain(value), x, yy, options);
  }
  function line(x1, yy1, x2, yy2, c = color.line) { stroke(c); pdf.setLineWidth(0.7); pdf.line(x1, yy1, x2, yy2); }
  function page(title, subtitle = '') {
    if (pageCount) pdf.addPage();
    pageCount++;
    chapter = title;
    fill(color.pine); pdf.rect(0, 0, W, 132, 'F');
    fill(color.lime); pdf.roundedRect(M, 24, 31, 31, 7, 7, 'F');
    stroke(color.pine); pdf.setLineWidth(2.1); pdf.lines([[5, 0], [3, -5], [4, 11], [4, -8], [3, 2], [5, 0]], M + 4, 40);
    text('pollion.', M + 42, 43, 17, true, [255, 255, 255]);
    text('PULSES', right, 42, 9, true, color.lime, { align: 'right' });
    text(title, M, 86, 21, true, [255, 255, 255]);
    if (subtitle) text(subtitle, M, 107, 9, false, [200, 226, 211]);
    y = 161;
  }
  function continuation() { page(chapter + ' (continued)', 'Pulses report | ' + exportReportDates(spec)); }
  function need(height) { if (y + height > H - 56) continuation(); }
  function para(value, options = {}) {
    const size = options.size || 10, x = options.x || M, maxWidth = options.width || width;
    const lines = pdf.splitTextToSize(pdfPlain(value), maxWidth);
    const h = Math.max(1, lines.length) * (size * 1.43);
    need(h + (options.after ?? 12));
    pdf.setFont('helvetica', options.bold ? 'bold' : 'normal'); pdf.setFontSize(size); ink(options.color || color.ink);
    pdf.text(lines, x, y);
    y += h + (options.after ?? 12);
    return h;
  }
  function section(title, subtitle = '') {
    need(55);
    text(title, M, y, 13, true, color.pine); y += 15;
    if (subtitle) para(subtitle, { size: 9, color: color.muted, after: 8 });
    line(M, y, right, y); y += 16;
  }
  function reportSection(title, subtitle = '', minimum = 100) {
    need(minimum);
    section(title, subtitle);
  }
  function metricRow(metrics) {
    const gap = 9, boxW = (width - gap * (metrics.length - 1)) / metrics.length;
    need(73);
    metrics.forEach(([label, value], i) => {
      const x = M + i * (boxW + gap);
      fill(color.pale); pdf.roundedRect(x, y, boxW, 65, 8, 8, 'F');
      text(label.toUpperCase(), x + 11, y + 19, 7.5, true, color.muted);
      text(value, x + 11, y + 46, 17, true, color.pine);
    });
    y += 82;
  }
  function bar(label, value, max = 100, c = color.green) {
    need(31);
    text(label, M, y, 9, true); text(exportScore(value), right, y, 9, true, c, { align: 'right' });
    y += 7;
    fill([233, 240, 233]); pdf.roundedRect(M, y, width, 8, 4, 4, 'F');
    fill(c); pdf.roundedRect(M, y, Math.max(2, Math.min(width, width * value / max)), 8, 4, 4, 'F');
    y += 24;
  }
  function callout(title, body, tone = 'green') {
    const lines = pdf.splitTextToSize(pdfPlain(body), width - 32);
    const h = 42 + lines.length * 12;
    need(h + 11);
    fill(tone === 'red' ? color.rose : color.pale); pdf.roundedRect(M, y, width, h, 8, 8, 'F');
    text(title, M + 15, y + 20, 10, true, tone === 'red' ? color.red : color.green);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); ink(color.ink); pdf.text(lines, M + 15, y + 36);
    y += h + 11;
  }
  function auditLink(label, url) {
    need(20);
    const value = pdfPlain(label);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); ink(color.green);
    pdf.textWithLink(value, M, y, { url });
    y += 19;
  }
  function tableHeader(cols) {
    need(32);
    fill(color.pale); pdf.roundedRect(M, y - 13, width, 29, 5, 5, 'F');
    cols.forEach(([label, x]) => text(label.toUpperCase(), x, y + 5, 8, true, color.green));
    y += 27;
  }
  function tableLine(values, xPositions, rowHeight = 27, highlights = [], linkUrl = null) {
    need(rowHeight);
    values.forEach((value, i) => {
      if (i === 0 && linkUrl) {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); ink(color.green);
        pdf.textWithLink(pdfPlain(value), xPositions[i], y + 10, { url: linkUrl });
      } else text(value, xPositions[i], y + 10, 8.5, i === 0, highlights[i] || color.ink);
    });
    line(M, y + rowHeight - 4, right, y + rowHeight - 4);
    y += rowHeight;
  }
  function drawTrophy(x, yy) {
    stroke([207, 139, 33]); pdf.setLineWidth(2); pdf.ellipse(x + 7, yy + 8, 7, 7, 'S'); pdf.ellipse(x + 30, yy + 8, 7, 7, 'S');
    fill([239, 184, 63]); pdf.roundedRect(x + 8, yy, 21, 19, 3, 3, 'F');
    fill([210, 147, 41]); pdf.rect(x + 17, yy + 18, 3, 9, 'F'); pdf.roundedRect(x + 11, yy + 27, 16, 4, 2, 2, 'F');
  }
  function drawHammer(x, yy) {
    stroke([111, 81, 52]); pdf.setLineWidth(4); pdf.line(x + 11, yy + 27, x + 27, yy + 8);
    fill([111, 130, 134]); pdf.roundedRect(x + 19, yy + 1, 18, 9, 2, 2, 'F');
  }
  function drawNeutral(x, yy) {
    stroke(color.muted); pdf.setLineWidth(1.7); pdf.circle(x + 13, yy + 13, 13, 'S');
    fill(color.muted); pdf.circle(x + 8, yy + 11, 1.1, 'F'); pdf.circle(x + 18, yy + 11, 1.1, 'F');
    pdf.line(x + 8, yy + 19, x + 18, yy + 19);
  }
  function chapterIntro() {
    page(exportTypes[spec.type] + ' report', exportSubjectLabel(spec) + ' | ' + exportReportDates(spec));
    para('Fictional portfolio demonstration. This report uses the selected final evaluations captured ' + snapshotDate + '.', { size: 9, color: color.muted, after: 17 });
    metricRow([['Orders', String(rows.length)], ['Average score', exportScore(exportAverage(rows))], ['Clients', String(new Set(rows.map(item => item.client)).size)]]);
  }
  function priorComparison() {
    const priorRange = exportPriorRange(spec);
    const prior = exportCases(spec, priorRange);
    need(prior.length ? 155 : 85);
    section('Comparison with the preceding equal period');
    para('Previous window: ' + priorRange.start + ' to ' + priorRange.end + '.', { size: 9, color: color.muted, after: 9 });
    if (!prior.length) {
      para('No eligible prior order appears in this snapshot, so a change in volume, score or spend cannot be calculated.', { size: 9, color: color.red, after: 8 });
    } else {
      metricRow([['Current orders', String(rows.length)], ['Prior orders', String(prior.length)], ['Score change', exportScore(exportAverage(rows) - exportAverage(prior))]]);
      para('Current average ' + exportScore(exportAverage(rows)) + '; prior average ' + exportScore(exportAverage(prior)) + '. Both are equal-weight sample averages. Interpret a change only within the selected orders.', { size: 9 });
    }
  }
  function projectLines(items) {
    need(32 + Math.min(items.length, 2) * 27);
    tableHeader([['Order', M + 11], ['Client / service', M + 118], ['PM', M + 330], ['Score', M + 457]]);
    items.forEach(item => {
      if (y + 27 > H - 56) tableHeader([['Order', M + 11], ['Client / service', M + 118], ['PM', M + 330], ['Score', M + 457]]);
      const shortClient = item.client.length > 23 ? item.client.slice(0, 22) + '.' : item.client;
      tableLine([item.id, shortClient, item.pm.split(' ')[0], exportScore(item.score)], [M + 11, M + 118, M + 330, M + 457], 27, [null, null, null, item.score < 90 ? color.red : color.green], item.reportUrl);
    });
  }
  function pmCategorySummary(pmRows, index) {
    const parts = pmRows.map(item => {
      const match = item.findings[index][1].match(/([\d.]+)\s*\/\s*([\d.]+)/);
      return { item, earned: Number(match[1]), max: Number(match[2]), finding: item.findings[index][2] };
    });
    const earned = parts.reduce((sum, p) => sum + p.earned, 0) / parts.length;
    const max = parts.reduce((sum, p) => sum + p.max, 0) / parts.length;
    const worst = parts.slice().sort((a, b) => (b.max - b.earned) - (a.max - a.earned))[0];
    return { label: pmRows[0].findings[index][0], earned, max, gap: Math.max(0, max - earned), worst };
  }

  chapterIntro();
  if (spec.type === 'pm') {
    const names = [...new Set(rows.map(item => item.pm))].sort();
    const leaders = [...new Set(cases.filter(item => item.date >= spec.start && item.date <= spec.end).map(item => item.pm))].map(name => {
      const list = cases.filter(item => item.pm === name && item.date >= spec.start && item.date <= spec.end);
      return { name, count: list.length, average: exportAverage(list) };
    });
    const best = Math.max(...leaders.map(item => item.average)), most = Math.max(...leaders.map(item => item.count));
    if (names.length > 1) para('PMs in this report: ' + names.join(', '), { size: 9, bold: true, after: 8 });
    para('The PM average here is a simple average of selected orders. It is not the official PM-period score, which requires the complete eligible cohort and approved USD price weighting.', { size: 9, color: color.muted });
    for (const name of names) {
      const pmRows = rows.filter(item => item.pm === name);
      const leader = leaders.find(item => item.name === name);
      reportSection(name, 'PM performance | ' + pmRows.length + ' selected ' + (pmRows.length === 1 ? 'order' : 'orders'), 240);
      metricRow([['Average score', exportScore(exportAverage(pmRows))], ['Projects', String(pmRows.length)], ['Best order', exportScore(Math.max(...pmRows.map(item => item.score)))]]);
      if (Math.abs(leader.average - best) < 0.0001) { drawTrophy(M, y - 2); text('Top average in this sample', M + 48, y + 17, 10, true, color.green); y += 43; }
      if (leader.count === most) { drawHammer(M, y - 2); text('Hard worker: most projects in this sample', M + 48, y + 17, 10, true, color.green); y += 43; }
      section('Score by category');
      for (let i = 0; i < 5; i++) {
        const part = pmCategorySummary(pmRows, i);
        bar(part.label, part.earned / part.max * 100, 100, part.gap > 0.005 ? color.red : color.green);
      }
      reportSection('Included projects', '', 95);
      projectLines(pmRows);
    }
    priorComparison();
    reportSection('Project score and evidence', 'Order-level reasons and source links | ' + exportReportDates(spec), 125);
    para('Each Final order below shows the weighted points recorded in the Sheet. Audit excerpts come from the matching demo audit. Open the linked audit for its complete wording and chronology.', { size: 9, color: color.muted });
    para(rows.filter(item => item.hasAudit).length + ' of ' + rows.length + ' selected orders have a matching detailed Doc audit. Sheet-only orders show their recorded score but cannot provide a verified reason or direct evidence for a deduction.', { size: 9, color: color.muted });
    for (const name of names) {
      reportSection(name + ' | order details', '', 85);
      for (const item of rows.filter(row => row.pm === name)) {
        need(110);
        section(item.id + ' | ' + item.client);
        para(item.name + ' | ' + item.date + ' | ' + item.section + ' | Total ' + exportScore(item.score), { size: 9, bold: true, after: 7 });
        if (item.hasAudit) {
          para('Inspection conclusion: ' + item.conclusion, { size: 9, after: 8 });
          for (let i = 0; i < item.findings.length; i++) {
            const [label, score] = item.findings[i];
            const match = score.match(/([\d.]+)\s*\/\s*([\d.]+)/);
            const deducted = match && Number(match[1]) + 0.005 < Number(match[2]);
            need(32);
            text(label, M, y, 9, true, deducted ? color.red : color.green);
            const scoreDetail = deducted ? score + ' points | ' + Number((Number(match[2]) - Number(match[1])).toFixed(2)) + ' lost' : score + ' points | full credit';
            text(scoreDetail, right, y, 9, true, deducted ? color.red : color.green, { align: 'right' });
            y += 14;
            const detail = pmAuditCategory(item, i);
            const notes = detail.notes.length ? detail.notes : [item.findings[i][2]];
            notes.forEach(note => para(note, { size: 8.5, after: 5 }));
            detail.links.forEach((link, number) => auditLink('Evidence ' + (number + 1) + ': ' + link.label.slice(0, 58), link.url));
            if (!detail.links.length) para('No direct evidence link appears in this category excerpt. Check the full source audit.', { size: 8, color: color.muted, after: 5 });
            y += 6;
          }
          auditLink('Open complete audit for ' + item.id, item.reportUrl);
        } else {
          para('This order has no matching Doc audit in the snapshot. The Sheet supplies the scores but no detailed rationale or direct evidence links. The reason for any deduction cannot be verified from this report.', { size: 8.5, color: color.red, after: 8 });
          item.findings.forEach(([label, score]) => para(label + ': ' + score + ' points', { size: 8.5, after: 3 }));
          auditLink('Open demo evidence for ' + item.id, item.reportUrl);
        }
        line(M, y + 2, right, y + 2);
        y += 17;
      }
    }
    reportSection('Strengths and next steps', 'Source-linked coaching | ' + exportReportDates(spec), 165);
    para('A full-credit scenario changes only the selected-order average. It is not a rescored result or the official PM-period score.', { size: 9, color: color.muted });
    if (names.length > 1) {
      section('Team coaching table');
      tableHeader([['PM', M + 10], ['Positive', M + 125], ['Top improvement', M + 280]]);
      for (const name of names) {
        const pmRows = rows.filter(item => item.pm === name), average = exportAverage(pmRows);
        const parts = [0, 1, 2, 3, 4].map(i => pmCategorySummary(pmRows, i));
        const strengths = parts.filter(part => part.gap <= 0.005).map(part => part.label);
        const priority = parts.filter(part => part.gap > 0.005).sort((a, b) => b.gap - a.gap)[0];
        const h = 112;
        need(h);
        fill([249, 251, 248]); pdf.roundedRect(M, y - 8, width, h - 9, 5, 5, 'F');
        fill(color.pale); pdf.roundedRect(M + 118, y - 3, 147, h - 19, 5, 5, 'F');
        fill(priority ? color.rose : color.pale); pdf.roundedRect(M + 273, y - 3, width - 280, h - 19, 5, 5, 'F');
        text(name, M + 10, y + 9, 9, true, color.pine);
        const positive = pdf.splitTextToSize(pdfPlain(strengths.length ? strengths.join(', ') : 'No full-credit category'), 135).slice(0, 3);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); ink(color.green); pdf.text(positive, M + 125, y + 9);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); ink(color.green);
        pdf.textWithLink(pmRows[0].hasAudit ? 'Source audit' : 'Sheet row', M + 125, y + 84, { url: pmRows[0].reportUrl });
        if (priority) {
          text(priority.label, M + 280, y + 9, 8.5, true, color.red);
          const scenario = 'If full: ' + exportScore(Math.min(100, average + priority.gap)) + ' vs ' + exportScore(average);
          text(scenario, M + 280, y + 25, 8, true);
          const finding = pdf.splitTextToSize(pdfPlain(priority.worst.finding), 207).slice(0, 2);
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); ink(color.muted); pdf.text(finding, M + 280, y + 42);
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); ink(color.red);
          pdf.textWithLink(priority.worst.item.hasAudit ? 'Open evidence' : 'Sheet row', M + 280, y + 84, { url: priority.worst.item.reportUrl });
          const other = parts.filter(part => part.gap > 0.005).length - 1;
          if (other > 0) text('+' + other + ' more areas in score chart', M + 280, y + 71, 7.5, false, color.muted);
        } else text('No deducted area in this sample', M + 280, y + 9, 8, false, color.green);
        y += h;
      }
    } else {
      for (const name of names) {
        const pmRows = rows.filter(item => item.pm === name), average = exportAverage(pmRows);
        section(name);
        const categories = [0, 1, 2, 3, 4].map(i => pmCategorySummary(pmRows, i));
        const strengths = categories.filter(c => c.gap <= 0.005).map(c => c.label);
        need(60);
        fill(color.pale); pdf.roundedRect(M, y - 8, width, 52, 5, 5, 'F');
        text('Positive findings', M + 10, y + 7, 9, true, color.green);
        const positiveText = strengths.length ? strengths.join(', ') + ' | full credit' : 'No full-credit category in this selection';
        const positiveLines = pdf.splitTextToSize(pdfPlain(positiveText), width - 130).slice(0, 2);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); ink(color.ink); pdf.text(positiveLines, M + 10, y + 24);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); ink(color.green);
        pdf.textWithLink(pmRows[0].hasAudit ? 'Source audit' : 'Sheet row', right - 88, y + 40, { url: pmRows[0].reportUrl });
        y += 60;
        for (const part of categories.filter(c => c.gap > 0.005)) {
          need(68);
          fill(color.rose); pdf.roundedRect(M, y - 8, width, 60, 5, 5, 'F');
          text(part.label + ' | ' + part.earned.toFixed(2) + ' / ' + part.max.toFixed(2), M + 10, y + 7, 9, true, color.red);
          text('If full: ' + exportScore(Math.min(100, average + part.gap)) + ' instead of ' + exportScore(average), M + 10, y + 23, 8.5, true, color.ink);
          const summary = pdf.splitTextToSize(pdfPlain(part.worst.finding), width - 108)[0];
          text(summary, M + 10, y + 39, 7.5, false, color.muted);
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); ink(color.red);
          pdf.textWithLink(part.worst.item.hasAudit ? 'Audit' : 'Sheet', right - 38, y + 39, { url: part.worst.item.reportUrl });
          y += 68;
        }
      }
    }
  } else if (spec.type === 'client') {
    const client = spec.subject;
    section('Account view');
    para(client, { size: 14, bold: true });
    para('Services in the selection: ' + [...new Set(rows.map(item => item.section))].join(', ') + '.', { size: 10 });
    section('Current score profile');
    bar('Average PM-attributed score', exportAverage(rows));
    bar('PM quality component', exportAverage(rows, item => item.scores.quality / 39 * 100));
    projectLines(rows);
    reportSection('Client status and priorities', client + ' | ' + exportReportDates(spec), 160);
    priorComparison();
    section('Capacity and money');
    para('Capacity and spend trends need complete comparable order history. This snapshot may not include every order in the prior period. Mixed currencies are not summed or converted here.', { size: 10 });
    section('Service reliance');
    const counts = [...new Set(rows.map(item => item.section))].map(service => ({ service, count: rows.filter(item => item.section === service).length })).sort((a, b) => b.count - a.count);
    counts.forEach(item => para(item.service + ': ' + item.count + ' selected ' + (item.count === 1 ? 'order' : 'orders'), { size: 9, after: 5 }));
    section('Operational improvements with evidence');
    let improvementCount = 0;
    rows.forEach(item => item.findings.forEach(([label, score, finding]) => {
      const m = score.match(/([\d.]+)\s*\/\s*([\d.]+)/);
      if (m && Number(m[1]) + 0.005 < Number(m[2])) {
        improvementCount++;
        para(item.id + ' | ' + label + ': ' + finding, { size: 9, after: 4 });
        auditLink((item.hasAudit ? 'Open source audit for ' : 'Open Sheet row for ') + item.id, item.reportUrl);
      }
    }));
    if (!improvementCount) para('No PM-attributed score deduction appears in the selected order. Continue reviewing direct client feedback and service outcomes.', { size: 9 });
    section('Client status');
    need(90);
    drawNeutral(M, y); text('Not determined from this sample', M + 39, y + 17, 12, true, color.pine); y += 42;
    para('The selected reports do not establish whether the client is happy, moderate or at risk. A reliable status needs direct feedback, repeat capacity and comparable billing. The operational findings above identify areas to review, not a retention prediction.', { size: 9 });
  } else if (spec.type === 'period') {
    priorComparison();
    section('Score distribution');
    rows.forEach(item => bar(item.id + ' | ' + item.pm, item.score, 100, item.score < 90 ? color.red : color.green));
    reportSection('Included projects', '', 95);
    projectLines(rows);
    reportSection('Period findings', exportReportDates(spec), 150);
    const pmCounts = [...new Set(rows.map(item => item.pm))].map(name => ({ name, list: rows.filter(item => item.pm === name) }));
    section('PM activity');
    pmCounts.forEach(item => para(item.name + ': ' + item.list.length + ' projects, ' + exportScore(exportAverage(item.list)) + ' average.', { size: 10, after: 8 }));
    section('Services represented');
    [...new Set(rows.map(item => item.section))].forEach(service => {
      const list = rows.filter(item => item.section === service);
      para(service + ': ' + list.length + ' projects, ' + exportScore(exportAverage(list)) + ' average.', { size: 10, after: 8 });
    });
    section('Evidence and limits');
    rows.forEach(item => auditLink(item.id + (item.hasAudit ? ' source audit' : ' Sheet row'), item.reportUrl));
    para('This comparison covers only the selected snapshot orders. It does not establish complete-period business volume or an official PM ranking.', { size: 9, color: color.muted });
  } else if (spec.type === 'service') {
    section('Service view');
    para(spec.subject + ' | ' + rows.length + ' selected ' + (rows.length === 1 ? 'order' : 'orders'), { size: 13, bold: true });
    para('Service grouping follows the available report scope or project-name wording. Verify the service in the source record before making an operational decision.', { size: 9, color: color.muted });
    bar('Average PM-attributed score', exportAverage(rows));
    bar('PM quality component', exportAverage(rows, item => item.scores.quality / 39 * 100));
    callout('Quality interpretation', 'A full PM quality component is not proof that this service has no defects. The sample does not contain a complete service-level quality audit.');
    reportSection('Included projects', '', 95);
    projectLines(rows);
    reportSection('Service improvements', spec.subject + ' | ' + exportReportDates(spec), 150);
    priorComparison();
    section('Recurring opportunities');
    const categories = [0, 1, 2, 3, 4].map(i => pmCategorySummary(rows, i)).filter(part => part.gap > 0.005);
    if (!categories.length) para('No PM-attributed category deduction appears in the selected service orders. Continue to review project-level client outcomes separately.', { size: 10 });
    categories.forEach(part => {
      callout(part.label + ' | ' + part.earned.toFixed(2) + ' / ' + part.max.toFixed(2), part.worst.finding, 'red');
      auditLink((part.worst.item.hasAudit ? 'Open supporting audit for ' : 'Open Sheet row for ') + part.worst.item.id, part.worst.item.reportUrl);
    });
    section('What to monitor next');
    para('Track direct client quality feedback, revision requests, delivery rework and the same service across a larger eligible period. Use that evidence before labeling service quality good or at risk.', { size: 10 });
  }
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    line(M, H - 43, right, H - 43);
    text('PULSES | Fictional demo | ' + snapshotDate, M, H - 28, 8, false, color.muted);
    text(String(i) + ' / ' + String(pages), right, H - 28, 8, true, color.muted, { align: 'right' });
  }
  return pdf;
}

