const iconPaths = {
  pulse: '<path d="M2 12h4l2.3-5 3.1 10 3.1-7 1.5 2H22"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  overview: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  projects: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M7 5V3h6l2 2M7 10h10M7 14h7"/>',
  sparkle: '<path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2ZM19 17l.6 1.4L21 19l-1.4.6L19 21l-.6-1.4L17 19l1.4-.6L19 17Z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  'arrow-left': '<path d="M20 12H4m6-6-6 6 6 6"/>',
  'arrow-up-right': '<path d="M5 19 19 5M8 5h11v11"/>',
  chart: '<path d="M4 20V10m5 10V4m5 16v-7m5 7V8"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2H3.5Zm13-14a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  file: '<path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5M8 13h8M8 17h6"/>',
  'book-open': '<path d="M12 6c-2-1.5-5-2-9-1.5v14c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5v-14c-4-.5-7 0-9 1.5Zm0 0v14"/>',
  messages: '<path d="M4 4h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-5 4v-4a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z"/><path d="M7 9h7M7 13h5"/>',
  'ask-pulse': '<path d="M4 4h15a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H9l-5 3v-3a3 3 0 0 1-2-3V7a3 3 0 0 1 2-3Z"/><path d="M5 12h3l2-4 3 8 2-4h4"/>',
  review: '<path d="M12 3v16M6 6h12M5 9l-3 6h6L5 9Zm14 0-3 6h6l-3-6ZM8 21h8M9 19h6"/>',
  activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>'
};
function icon(name) {
  return '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + iconPaths[name] + '</svg>';
}
function hydrateIcons() {
  document.querySelectorAll('[data-icon]').forEach(element => {
    element.innerHTML = icon(element.dataset.icon);
  });
}


const $ = (selector) => document.querySelector(selector);
const h = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const allCases = [...cases, ...nonFinalCases];
let projectRowsShown = 100;
const state = { month: 'All months', client: 'all', pm: 'all', section: 'all', deduction: 'all', query: '' };
const dateLabel = (value) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
const scoreClass = (score) => score < 80 ? 'low' : score < 90 ? 'mid' : '';
const unique = (field) => [...new Set(cases.map(item => item[field]))].sort();
const filterUnique = field => [...new Set(allCases.map(item => item[field]))].sort();
const formatScore = (value) => `${Number(value.toFixed(2))}%`;
const formatPoints = (value) => Number(value.toFixed(2));
function pmSummaries() {
  return unique('pm').map(name => {
    const projects = cases.filter(item => item.pm === name).sort((a, b) => b.date.localeCompare(a.date));
    const total = projects.reduce((sum, item) => sum + item.score, 0);
    const components = Object.fromEntries([['communication', 28], ['deadline', 28], ['quality', 39], ['plunet', 5]].map(([key, max]) => [key, projects.reduce((sum, item) => sum + Number(item.scores?.[key] || 0), 0) / projects.length / max * 100]));
    const tally = field => [...new Set(projects.map(item => item[field]))].map(value => ({ name: value, count: projects.filter(item => item[field] === value).length })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return { name, projects, count: projects.length, total, average: total / projects.length, best: Math.max(...projects.map(item => item.score)), components, clients: tally('client'), services: tally('section') };
  });
}


function renderOverview() {
  const average = cases.reduce((sum, item) => sum + item.score, 0) / cases.length;
  const months = [...new Set(allCases.map(item => item.month))].sort((a, b) => Date.parse('1 ' + b) - Date.parse('1 ' + a));
  const stats = [
    ['All demo projects', allCases.length, `${cases.length} final · ${nonFinalCases.length} not final`, 'projects'],
    ['Average score', formatScore(average), `${cases.length} final demo records`, 'activity'],
    ['Clients', unique('client').length, 'In this selection', 'users'],
    ['PMs represented', unique('pm').length, 'In this selection', 'briefcase']
  ];
  document.querySelector('.nav-count').textContent = allCases.length;
  $('#hero-count-note').textContent = `${cases.length} final evaluations · ${nonFinalCases.length} not final · ${cases.filter(item => item.hasAudit).length} full audits · ${window.pulsesDemo ? "fictional dataset" : "snapshot"} ${snapshotDate}`;
  $('#overview-selection-note').textContent = `Final evaluations · ${cases.length} orders`;
  $('#footer-snapshot').textContent = `${cases.length} final demo records, ${window.pulsesDemo ? "generated for this demo" : "generated"} ${snapshotDate}`;
  $('#stat-grid').innerHTML = stats.map(([title, value, foot, iconName]) => `<div class="stat-card"><div class="stat-top"><span>${title}</span><span class="stat-icon">${icon(iconName)}</span></div><span class="stat-value">${value}</span><span class="stat-foot">${foot}</span></div>`).join('');
  const maxMonthCount = Math.max(...months.map(month => cases.filter(item => item.month === month).length));
  $('#month-chart').innerHTML = months.map((month, index) => { const count = cases.filter(item => item.month === month).length; return `<div class="month-column ${index === 0 ? 'current' : ''}"><span class="count">${count}</span><span class="bar" style="height:${Math.round(count / maxMonthCount * 92)}px"></span><span class="label">${month.split(' ')[0]}</span></div>`; }).join('');
  const clientCounts = unique('client').map(client => [client, cases.filter(item => item.client === client).length]).sort((a, b) => b[1] - a[1]);
  const maxClientCount = Math.max(...clientCounts.map(([, count]) => count));
  $('#client-chart').innerHTML = clientCounts.slice(0, 10).map(([client, count]) => `<div class="client-item"><span title="${h(client)}">${h(client)}</span><span class="track"><span class="fill" style="display:block;width:${count / maxClientCount * 100}%"></span></span><span>${count}</span></div>`).join('');
  const pmData = pmSummaries();
  const maxCount = Math.max(...pmData.map(item => item.count));
  const busiest = pmData.filter(item => item.count === maxCount);
  const bestPM = pmData.slice().sort((a, b) => b.average - a.average)[0];
  $('#pm-overview').innerHTML = `<a class="pm-spotlight" href="#pms"><span class="pm-spotlight-icon">${icon('projects')}</span><span class="pm-spotlight-label">MOST PROJECTS</span><strong>${maxCount} projects</strong><span class="pm-spotlight-name">${busiest.map(item => h(item.name)).join(' &amp; ')}</span><span class="pm-spotlight-foot">${busiest.length > 1 ? 'Shared lead in project volume' : 'Highest project volume'} ${icon('arrow-right')}</span></a><a class="pm-spotlight pm-spotlight-score" href="#pms"><span class="pm-spotlight-icon">${icon('activity')}</span><span class="pm-spotlight-label">BEST AVERAGE SCORE</span><strong>${formatScore(bestPM.average)}</strong><span class="pm-spotlight-name">${h(bestPM.name)} · ${bestPM.count} projects</span><span class="pm-spotlight-foot">Across selected orders ${icon('arrow-right')}</span></a>`;
  $('#recent-projects').innerHTML = allCases.slice().sort((a, b) => b.sheetRow - a.sheetRow).slice(0, 5).map(item => `<button class="recent-item" data-open="${item.id}"><span class="case-icon">${icon('file')}</span><span><strong class="order-id">${h(item.id)}</strong>${item.scoreChanged ? `<span class="score-changed-badge">Changed</span>` : ''}<small class="project-name">${h(item.name)}</small></span><span class="recent-meta">${h(item.client)}</span><span class="recent-meta">${dateLabel(item.date)}</span>${item.status ? `<span class="status-chip ${item.status === 'Canceled' ? 'canceled' : 'pending'}">${h(item.status)}</span>` : `<span class="score-chip ${scoreClass(item.score)}">${formatScore(item.score)}</span>`}<span class="recent-arrow">${icon('arrow-right')}</span></button>`).join('');
}

const filterNames = { client: 'Client', pm: 'PM', section: 'Service' };
const allLabels = { client: 'All clients', pm: 'All PMs', section: 'All services' };

function renderFilterMenus() {
  for (const field of Object.keys(filterNames)) {
    const root = document.querySelector('[data-filter="' + field + '"]');
    const value = state[field];
    const label = value === 'all' ? allLabels[field] : value;
    root.querySelector('.filter-current').textContent = label;
    root.querySelector('.filter-trigger').setAttribute('aria-label', 'Filter by ' + filterNames[field] + ': ' + label);
    root.classList.toggle('selected', value !== 'all');
    const menu = root.querySelector('.filter-menu');
    menu.replaceChildren();
    for (const optionValue of ['all', ...filterUnique(field)]) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'filter-option';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(optionValue === value));
      option.dataset.filterField = field;
      option.dataset.filterValue = optionValue;
      const name = document.createElement('span');
      name.textContent = optionValue === 'all' ? allLabels[field] : optionValue;
      const check = document.createElement('span');
      check.className = 'filter-option-check';
      check.innerHTML = icon('check');
      option.append(name, check);
      menu.append(option);
    }
  }
}

function closeFilters() {
  document.querySelectorAll('.filter-dropdown.open').forEach(root => {
    root.classList.remove('open');
    root.querySelector('.filter-trigger').setAttribute('aria-expanded', 'false');
  });
}

function openFilter(root) {
  closeFilters();
  root.classList.add('open');
  root.querySelector('.filter-trigger').setAttribute('aria-expanded', 'true');
  const chosen = root.querySelector('.filter-option[aria-selected="true"]') || root.querySelector('.filter-option');
  if (chosen) chosen.focus();
}

function renderMonths() {
  const options = ['All months', ...[...new Set(allCases.map(item => item.month))].sort((a, b) => Date.parse('1 ' + b) - Date.parse('1 ' + a))];
  $('#month-tabs').innerHTML = options.map(month => `<button class="month-tab ${state.month === month ? 'active' : ''}" data-month="${month}">${h(month)}</button>`).join('');
}

function filteredCases() {
  return allCases.filter(item => (state.month === 'All months' || item.month === state.month) && (state.client === 'all' || item.client === state.client) && (state.pm === 'all' || item.pm === state.pm) && (state.section === 'all' || item.section === state.section) && (state.deduction === 'all' || (!item.status && deductionLoss(item,state.deduction) > .005)) && (!state.query || `${item.id} ${item.name} ${item.client} ${item.pm}`.toLowerCase().includes(state.query)));
}

function renderProjects() {
  renderMonths();
  const rows = filteredCases().sort((a, b) => b.date.localeCompare(a.date));
  $('#library-count').textContent = `${rows.length} ${rows.length === 1 ? 'project' : 'projects'}`;
  const deductionNote = $('#deduction-filter-note');
  if (deductionNote) {
    deductionNote.classList.toggle('hidden', state.deduction === 'all');
    if (state.deduction !== 'all') deductionNote.innerHTML = `<span>${icon('activity')} <b>${h(deductionLabels[state.deduction])} deductions</b> · ${rows.length} affected ${rows.length === 1 ? 'project' : 'projects'}${state.client !== 'all' ? ` · ${h(state.client)}` : ''}${state.pm !== 'all' ? ` · ${h(state.pm)}` : ''}</span><button type="button" data-clear-deduction>Show all projects</button>`;
  }
  $('#project-rows').innerHTML = rows.slice(0, projectRowsShown).map(item => `<tr tabindex="0" role="link" aria-label="Open ${item.id}" data-open="${item.id}"><td><strong class="order-id">${h(item.id)}</strong>${item.scoreChanged ? `<span class="score-changed-badge">Changed</span>` : ''}<small class="project-name">${h(item.name)}</small><small class="source-availability ${item.hasAudit ? 'has-audit' : 'sheet-only'}">${item.status ? 'Demo status' : item.hasAudit ? 'Sample audit' : 'Demo data'}</small></td><td>${h(item.client)}</td><td><span class="section-badge">${h(item.section)}</span></td><td>${h(item.pm)}</td><td>${dateLabel(item.date)}</td><td>${item.status ? `<span class="status-chip ${item.status === 'Canceled' ? 'canceled' : 'pending'}">${h(item.status)}</span>` : `<span class="score-chip ${scoreClass(item.score)}">${formatScore(item.score)}</span>`}</td><td>${icon('arrow-right')}</td></tr>`).join('');
  $('#empty-state').classList.toggle('hidden', rows.length > 0);
  const more = $('#projects-more');
  if (more) { more.hidden = rows.length <= projectRowsShown; more.textContent = 'Show more projects (' + Math.min(100, rows.length - projectRowsShown) + ' of ' + (rows.length - projectRowsShown) + ')'; }
}

function renderPMs() {
  const data = pmSummaries();
  const byScore = data.slice().sort((a, b) => b.average - a.average);
  const maxCount = Math.max(...data.map(item => item.count));
  const topCount = data.filter(item => item.count === maxCount);
  const topAverage = byScore[0];
  $('#pm-stats').innerHTML = `<div class="pm-stat"><span>PMs reviewed</span><strong>${data.length}</strong><small>In selected orders</small></div><div class="pm-stat"><span>Projects analyzed</span><strong>${cases.length}</strong><small>In selected orders</small></div><div class="pm-stat"><span>Most projects</span><strong>${maxCount}</strong><small>${topCount.map(item => h(item.name)).join(' &amp; ')}</small></div><div class="pm-stat pm-stat-highlight"><span>Highest PM average</span><strong>${formatScore(topAverage.average)}</strong><small>${h(topAverage.name)} · ${topAverage.count} projects</small></div>`;
  $('#pm-volume-chart').innerHTML = data.slice().sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).map(item => `<div class="pm-bar-row"><span class="pm-bar-name">${h(item.name)}</span><span class="pm-bar-track"><span class="pm-bar-fill" style="width:${item.count / maxCount * 100}%"></span></span><b>${item.count}</b></div>`).join('');
  $('#pm-score-chart').innerHTML = byScore.map(item => `<div class="pm-bar-row"><span class="pm-bar-name">${h(item.name)}</span><span class="pm-bar-track"><span class="pm-bar-fill pm-score-fill" style="width:${item.average}%"></span></span><b>${formatScore(item.average)}</b></div>`).join('');
  $('#pm-cards').innerHTML = byScore.map((item, index) => `<article class="pm-card"><a class="pm-card-summary" href="#pm/${encodeURIComponent(item.name)}" aria-label="Open profile for ${h(item.name)}"><div class="pm-card-head"><span class="pm-avatar">${h(item.name.split(' ').map(part => part[0]).slice(0, 2).join(''))}</span><div><span class="pm-rank">${index === 0 ? 'TOP AVERAGE SCORE' : `RANK ${index + 1} BY AVERAGE`}</span><h3>${h(item.name)}</h3></div><span class="pm-card-count">${item.count} ${item.count === 1 ? 'project' : 'projects'}</span></div><div class="pm-card-main"><div><span>Average score</span><strong>${formatScore(item.average)}</strong></div><div><span>Total project points</span><strong>${formatPoints(item.total)}</strong></div><div><span>Best project</span><strong>${formatScore(item.best)}</strong></div></div><span class="pm-card-open">View PM profile ${icon('arrow-right')}</span></a><div class="pm-card-projects"><div class="pm-card-projects-title">LATEST PROJECTS</div>${item.projects.slice(0, 5).map(project => `<button class="pm-project" data-open="${project.id}"><span><b>${h(project.id)}</b><small>${h(project.name)}</small></span><span class="score-chip ${scoreClass(project.score)}">${formatScore(project.score)}</span>${icon('arrow-right')}</button>`).join('')}<a class="pm-see-more" href="#projects?pm=${encodeURIComponent(item.name)}" aria-label="See all projects for ${h(item.name)}">See more ${icon('arrow-right')}</a></div></article>`).join('');
}

const insightComponents = {communication:{label:'Communication',max:28},deadline:{label:'Deadline',max:28},quality:{label:'Quality',max:39},plunet:{label:'Plunet',max:5}};
const deductionLabels = {communication:'Communication',client_communication:'Client communication',deadline:'Deadline',quality:'Quality',plunet:'Plunet'};
function clientCommunicationLoss(item) {
  const finding = item.findings?.find(row => row[0] === 'Client communication');
  const match = String(finding?.[1] || '').match(/([\d.]+)%?\s*\/\s*([\d.]+)%?/);
  return match ? Math.max(0,Number(match[2])-Number(match[1])) : null;
}
function deductionLoss(item,key) {
  if (key === 'client_communication') return clientCommunicationLoss(item);
  const component = insightComponents[key];
  return component ? Math.max(0,component.max-Number(item.scores?.[key] ?? component.max)) : null;
}
function signalRow(signal,scope,name,total) {
  const clickable = signal.affected > 0;
  const tag = clickable ? 'a' : 'div';
  const url = clickable ? ` href="#projects?${new URLSearchParams({[scope]:name,deduction:signal.key}).toString().replace(/&/g,'&amp;')}" aria-label="See ${signal.affected} ${h(signal.label)} deduction projects for ${h(name)}"` : '';
  return `<${tag} class="${clickable ? 'insight-signal-link' : 'insight-signal-empty'}"${url}><span>${h(signal.label)}</span><b>${signal.affected}/${total} orders${clickable ? icon('arrow-right') : ''}</b><small>${formatPoints(signal.averageLoss)} pts lost per order</small></${tag}>`;
}
function componentSignals(projects) {
  return Object.entries(insightComponents).map(([key,{label,max}]) => {
    const affected = projects.filter(item => max - Number(item.scores?.[key] ?? max) > .005);
    const lost = projects.reduce((sum,item) => sum + Math.max(0,max-Number(item.scores?.[key] ?? max)),0);
    return {key,label,max,observed:projects.length,affected:affected.length,lost,averageLoss:lost/projects.length,lossFor:item => Math.max(0,max-Number(item.scores?.[key] ?? max)),orders:affected.sort((a,b) => (max-Number(b.scores?.[key] ?? max))-(max-Number(a.scores?.[key] ?? max)))};
  }).sort((a,b) => b.averageLoss-a.averageLoss || b.affected-a.affected);
}
function clientDeliverySignals(projects) {
  return [
    {key:'client_communication',label:'Client communication',lossFor:clientCommunicationLoss},
    {key:'deadline',label:'Deadline',lossFor:item => Math.max(0,28-Number(item.scores?.deadline ?? 28))},
    {key:'quality',label:'Quality',lossFor:item => Math.max(0,39-Number(item.scores?.quality ?? 39))},
  ].map(signal => {
    const observed=projects.filter(item => signal.lossFor(item) !== null);
    const affected=observed.filter(item => signal.lossFor(item) > .005).sort((a,b) => signal.lossFor(b)-signal.lossFor(a));
    return {...signal,observed:observed.length,affected:affected.length,averageLoss:observed.length ? observed.reduce((sum,item) => sum+signal.lossFor(item),0)/observed.length : 0,orders:affected};
  }).sort((a,b) => b.averageLoss-a.averageLoss || b.affected-a.affected);
}
function scoreTrend(projects) {
  if (projects.length < 6) return {text:'More orders are needed for a reliable recent comparison.',enough:false};
  const recent = projects.slice(0,5), previous = projects.slice(5,10);
  if (previous.length < 3) return {text:'More orders are needed for a reliable recent comparison.',enough:false};
  const avg = rows => rows.reduce((sum,item) => sum+item.score,0)/rows.length;
  const delta = avg(recent)-avg(previous);
  return {text:`Last 5 orders average ${formatScore(avg(recent))}, compared with ${formatScore(avg(previous))} for the preceding ${previous.length}. ${Math.abs(delta)<.5?'Scores are broadly stable.':`That is ${Math.abs(delta).toFixed(1)} points ${delta>0?'higher':'lower'}.`}`,enough:true};
}
function signalEvidence(signal,limit=3) {
  return signal.orders.slice(0,limit).map(item => `<a class="insight-order" href="#case/${encodeURIComponent(item.id)}"><span><b>${h(item.id)}</b><small>${h(item.name)}</small></span><strong>-${formatPoints(signal.lossFor(item))} pts</strong>${icon('arrow-right')}</a>`).join('');
}
function clientVolumeTrend(projects) {
  const latest=projects[0].date.slice(0,7);
  const priorDate=new Date(`${latest}-01T12:00:00Z`);
  priorDate.setUTCMonth(priorDate.getUTCMonth()-1);
  const prior=priorDate.toISOString().slice(0,7);
  const count=month => projects.filter(item => item.date.startsWith(month)).length;
  return `${latest}: ${count(latest)} final orders. ${prior}: ${count(prior)} final orders. The latest month may still be incomplete; order count alone does not measure client satisfaction.`;
}
function renderPMDetail(name) {
  const pm = pmSummaries().find(item => item.name === name);
  if (!pm) return false;
  const componentLabels = { communication: 'Communication', deadline: 'Deadline', quality: 'Quality', plunet: 'Plunet' };
  const componentMax = { communication: 28, deadline: 28, quality: 39, plunet: 5 };
  const signals = componentSignals(pm.projects);
  const weakness = signals[0], strength = signals.slice().sort((a,b) => a.averageLoss-b.averageLoss)[0];
  const weakOrders = weakness.orders;
  const deducted = pm.projects.filter(item => item.score < 99.995);
  const hasWeakness = weakness.affected > 0;
  const recurrence = weakness.affected >= 2 && weakness.affected / pm.count >= .3 ? 'Recurring in this sample' : weakness.affected ? 'Seen in selected orders' : 'No deduction recorded';
  const trend = scoreTrend(pm.projects);
  $('#pm-detail-content').innerHTML = `
    <div class="detail-hero"><span class="eyebrow">PM / PERFORMANCE SNAPSHOT</span><h1>${h(pm.name)}</h1><p>${pm.count} final projects · ${pm.clients.length} clients · ${pm.services.length} service types</p></div>
    <div class="client-profile-grid pm-profile-grid">
      <div class="client-profile-stat"><span>Average total</span><strong>${formatScore(pm.average)}</strong><small>Equal-weight final orders</small></div>
      <div class="client-profile-stat"><span>Final projects</span><strong>${pm.count}</strong><small>In the current Sheet</small></div>
      <div class="client-profile-stat"><span>Clients served</span><strong>${pm.clients.length}</strong><small>Across these final projects</small></div>
      <div class="client-profile-stat"><span>Best project score</span><strong>${formatScore(pm.best)}</strong><small>Highest individual order</small></div>
    </div>
    <div class="pm-note"><span>${icon('activity')}</span><span>This profile uses simple averages of Final demo orders. The official PM-period result requires the eligible order set and Plunet USD price weighting.</span></div>
    <div class="client-detail-columns">
      <div class="panel client-detail-panel"><span class="eyebrow">SCORE BREAKDOWN</span><h2>Average component result</h2>
        ${Object.entries(pm.components).map(([key, value]) => `<div class="client-component"><span>${componentLabels[key]}</span><div class="pm-bar-track"><span class="pm-bar-fill ${value < 99.995 ? 'client-deducted' : ''}" style="width:${Math.max(0, Math.min(100, value))}%"></span></div><b>${formatScore(value)}</b></div>`).join('')}
        <p class="client-method">Each average is shown against the current Sheet weight: 28 / 28 / 39 / 5 points.</p>
      </div>
      <div class="panel client-detail-panel"><span class="eyebrow">PERFORMANCE SIGNALS</span><h2>Where the scores move</h2>
        <div class="insight-summary"><strong>${h(recurrence)}</strong><span>${hasWeakness ? `${h(weakness.label)} has the largest average loss: ${formatPoints(weakness.averageLoss)} points per project, across ${weakness.affected} of ${pm.count} orders.` : `No category deduction appears in these ${pm.count} final orders.`}</span></div>
        <p><b>Consistent area:</b> ${h(strength.label)} has the smallest average loss at ${formatPoints(strength.averageLoss)} points per project.</p>
        <p><b>Recent direction:</b> ${h(trend.text)}</p>
        <div class="insight-bars">${signals.map(signal => signalRow(signal,'pm',pm.name,pm.count)).join('')}</div>
        <h3>Orders behind the leading signal</h3>${hasWeakness ? signalEvidence(weakness) : '<p>No deducted orders in this sample.</p>'}
        <p class="client-limitation">This describes inspected orders, not a personal judgment. Open each audit before assigning a cause or coaching action.</p>
      </div>
    </div>
    <div class="client-detail-columns">
      <div class="panel client-detail-panel"><span class="eyebrow">CLIENT MIX</span><h2>Projects by client</h2>${pm.clients.map(item => `<div class="client-list-row"><span>${h(item.name)}</span><b>${item.count}</b></div>`).join('')}</div>
      <div class="panel client-detail-panel"><span class="eyebrow">SERVICE MIX</span><h2>Projects by service</h2>${pm.services.map(item => `<div class="client-list-row"><span>${h(item.name)}</span><b>${item.count}</b></div>`).join('')}</div>
    </div>
    <div class="panel client-detail-panel client-evidence"><span class="eyebrow">SOURCE FINDINGS</span><h2>Orders with score deductions</h2>
      ${deducted.sort((a, b) => a.score - b.score).slice(0, 5).map(item => `<a class="client-finding" href="#case/${encodeURIComponent(item.id)}"><b>${h(item.id)} · ${formatScore(item.score)}</b><span>${h(item.conclusion || 'Open the order audit for the recorded findings.')}</span>${icon('arrow-right')}</a>`).join('') || '<p>No score deductions are recorded for these final orders.</p>'}
    </div>
    <div class="panel client-detail-panel client-evidence"><span class="eyebrow">REVIEW THE SOURCE</span><h2>${hasWeakness ? `Orders with ${h(weakness.label.toLowerCase())} deductions` : 'Recent final projects'}</h2>
      ${(hasWeakness ? weakOrders : pm.projects).slice(0, 5).map(item => `<a class="client-evidence-row" href="#case/${encodeURIComponent(item.id)}"><span><b>${h(item.id)}</b><small>${h(item.name)} · ${dateLabel(item.date)}</small></span><span class="score-chip ${scoreClass(item.score)}">${formatScore(item.score)}</span>${icon('arrow-right')}</a>`).join('')}
      <a class="pm-see-more" href="#projects?pm=${encodeURIComponent(pm.name)}">See all PM projects ${icon('arrow-right')}</a>
    </div>`;
  return true;
}

function clientSummaries() {
  return unique('client').map(name => {
    const projects = cases.filter(item => item.client === name).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const average = projects.reduce((sum, item) => sum + item.score, 0) / projects.length;
    const components = Object.fromEntries([['communication', 28], ['deadline', 28], ['quality', 39], ['plunet', 5]].map(([key, max]) => [key, projects.reduce((sum, item) => sum + Number(item.scores?.[key] || 0), 0) / projects.length / max * 100]));
    const tally = field => [...new Set(projects.map(item => item[field]))].map(value => ({ name: value, count: projects.filter(item => item[field] === value).length })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const spend = {};
    for (const project of projects) {
      const price = String(project.price || '').trim().match(/^([\d,]+(?:\.\d+)?)\s+([A-Z]{3})$/);
      if (price) spend[price[2]] = (spend[price[2]] || 0) + Number(price[1].replaceAll(',', ''));
    }
    return { name, projects, count: projects.length, average, components, services: tally('section'), pms: tally('pm'), spend };
  });
}
function clientSpendText(spend) {
  const entries = Object.entries(spend).sort(([a], [b]) => a.localeCompare(b));
  return entries.length ? entries.map(([currency, amount]) => `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(amount)} ${currency}`).join(' · ') : 'No parseable price in source rows';
}
function renderClients() {
  const data = clientSummaries().sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  if (!data.length) return;
  const top = data[0], maxCount = top.count;
  const average = cases.reduce((sum, item) => sum + item.score, 0) / cases.length;
  $('#client-stats').innerHTML = `<div class="pm-stat"><span>Clients reviewed</span><strong>${data.length}</strong><small>With final orders</small></div><div class="pm-stat"><span>Final projects</span><strong>${cases.length}</strong><small>Across client accounts</small></div><div class="pm-stat"><span>Most projects</span><strong>${top.count}</strong><small>${h(top.name)}</small></div><div class="pm-stat pm-stat-highlight"><span>Average inspected score</span><strong>${formatScore(average)}</strong><small>Equal-weight order average</small></div>`;
  $('#client-volume-chart').innerHTML = data.slice(0, 12).map(item => `<a class="pm-bar-row client-bar-link" href="#client/${encodeURIComponent(item.name)}"><span class="pm-bar-name">${h(item.name)}</span><span class="pm-bar-track"><span class="pm-bar-fill" style="width:${item.count / maxCount * 100}%"></span></span><b>${item.count}</b></a>`).join('');
  $('#client-cards').innerHTML = data.map(item => `<a class="client-card" href="#client/${encodeURIComponent(item.name)}"><div><span class="eyebrow">CLIENT ACCOUNT</span><h3><span>${h(item.name)}</span></h3><p>${h(item.services.slice(0, 2).map(x => x.name).join(' · '))}</p></div><div class="client-card-metrics"><span><b>${item.count}</b> projects</span><span><b>${formatScore(item.average)}</b> average</span></div><span class="client-card-foot"><span>Lead PM: <strong>${h(item.pms[0].name)}</strong> (${item.pms[0].count})</span> ${icon('arrow-right')}</span></a>`).join('');
}
function renderClientDetail(name) {
  const client = clientSummaries().find(item => item.name === name);
  if (!client) return false;
  const componentLabels = { communication: 'Communication', deadline: 'Deadline', quality: 'Quality', plunet: 'Plunet' };
  const lowest = Object.entries(client.components).sort((a, b) => a[1] - b[1])[0];
  const deducted = client.projects.filter(item => item.score < 99.995);
  const evidence = client.projects.filter(item => item.scores?.[lowest[0]] < ({communication:28,deadline:28,quality:39,plunet:5})[lowest[0]] - .005).slice(0, 5);
  const clientFacing = clientDeliverySignals(client.projects);
  const leading = clientFacing[0];
  const recent = client.projects.slice(0,5);
  const recentSignals = clientDeliverySignals(recent);
  const recentCount = key => recentSignals.find(signal => signal.key === key)?.affected || 0;
  const recentQuality = recentCount('quality'), recentDeadline = recentCount('deadline'), recentCommunication = recentCount('client_communication');
  const concernCount = recentQuality + recentDeadline + recentCommunication;
  const incomplete = recentSignals.some(signal => signal.observed < recent.length);
  const health = incomplete ? 'Audit signal incomplete' : recent.length < 3 ? 'Limited recent sample' : concernCount === 0 ? 'Clean recent inspections' : recentQuality >= 2 || concernCount >= 4 ? 'Delivery needs attention' : 'Some delivery friction';
  const healthClass = incomplete || recent.length < 3 ? 'watch' : concernCount === 0 ? 'positive' : recentQuality >= 2 || concernCount >= 4 ? 'attention' : 'watch';
  const trend = scoreTrend(client.projects);
  const volume = clientVolumeTrend(client.projects);
  $('#client-detail-content').innerHTML = `<div class="detail-hero"><span class="eyebrow">CLIENT / ACCOUNT SNAPSHOT</span><h1>${h(client.name)}</h1><p>${client.count} final projects · ${client.services.length} service types · lead PM ${h(client.pms[0].name)}</p></div><div class="client-profile-grid"><div class="client-profile-stat"><span>Average total</span><strong>${formatScore(client.average)}</strong><small>Equal-weight final orders</small></div><div class="client-profile-stat"><span>Projects</span><strong>${client.count}</strong><small>From final demo records</small></div><div class="client-profile-stat"><span>Order value by currency</span><strong class="client-money">${h(clientSpendText(client.spend))}</strong><small>Original row prices, no currency conversion</small></div><div class="client-profile-stat"><span>Lead PM</span><strong class="client-money">${h(client.pms[0].name)}</strong><small>${client.pms[0].count} of ${client.count} projects</small></div></div><div class="client-detail-columns"><div class="panel client-detail-panel"><span class="eyebrow">SCORE BREAKDOWN</span><h2>Average component result</h2>${Object.entries(client.components).map(([key, value]) => `<div class="client-component"><span>${componentLabels[key]}</span><div class="pm-bar-track"><span class="pm-bar-fill ${value < 99.995 ? 'client-deducted' : ''}" style="width:${Math.max(0,Math.min(100,value))}%"></span></div><b>${formatScore(value)}</b></div>`).join('')}<p class="client-method">Each component is shown as a percentage of its current Sheet weight: 28 / 28 / 39 / 5 points.</p></div><div class="panel client-detail-panel"><span class="eyebrow">CLIENT EXPERIENCE SIGNALS</span><h2>What the audits can tell us</h2><div class="insight-summary ${healthClass}"><strong>${h(health)}</strong><span>In the latest ${recent.length} final orders: ${recentQuality} quality, ${recentDeadline} deadline, and ${recentCommunication} communication deductions. These are inspected delivery signals, not a client happiness score.</span></div><div class="insight-bars">${clientFacing.map(signal => signalRow(signal,'client',client.name,signal.observed)).join('')}</div><p><b>Recent score direction:</b> ${h(trend.text)}</p><p><b>Project volume:</b> ${h(volume)}</p><h3>Where to focus</h3><p>${leading.affected ? `${h(leading.label)} has the largest average loss across client communication, deadline, and quality. Review the linked orders and check the underlying client correspondence before contacting the client.` : 'The audits show no client-facing deductions in these final orders. Ask the account owner for direct client feedback before declaring satisfaction.'}</p>${leading.affected ? signalEvidence(leading,2) : ''}<span class="client-limitation">Client satisfaction and churn risk remain unverified until direct feedback and account context are reviewed.</span></div></div><div class="client-detail-columns"><div class="panel client-detail-panel"><span class="eyebrow">SERVICE MIX</span><h2>Services requested</h2>${client.services.map(x => `<div class="client-list-row"><span>${h(x.name)}</span><b>${x.count}</b></div>`).join('')}</div><div class="panel client-detail-panel"><span class="eyebrow">PROJECT OWNERS</span><h2>PM contribution</h2>${client.pms.map(x => `<div class="client-list-row"><span>${h(x.name)}</span><b>${x.count}</b></div>`).join('')}</div></div><div class="panel client-detail-panel client-evidence"><span class="eyebrow">SOURCE FINDINGS</span><h2>What needs a closer look</h2>${client.projects.filter(item => item.score < 99.995).sort((a, b) => a.score - b.score).slice(0, 3).map(item => `<a class="client-finding" href="#case/${encodeURIComponent(item.id)}"><b>${h(item.id)} · ${formatScore(item.score)}</b><span>${h(item.conclusion || 'Open the original audit for its findings.')}</span>${icon('arrow-right')}</a>`).join('') || '<p>No score deductions are recorded for these final orders. Confirm satisfaction directly with the client.</p>'}</div><div class="panel client-detail-panel client-evidence"><span class="eyebrow">REVIEW THE SOURCE</span><h2>Orders with ${h(componentLabels[lowest[0]].toLowerCase())} deductions</h2>${evidence.length ? evidence.map(item => `<a class="client-evidence-row" href="#case/${encodeURIComponent(item.id)}"><span><b>${h(item.id)}</b><small>${h(item.name)} · ${dateLabel(item.date)}</small></span><span class="score-chip ${scoreClass(item.score)}">${formatScore(item.score)}</span>${icon('arrow-right')}</a>`).join('') : '<p>No deductions in this component.</p>'}<a class="pm-see-more" href="#projects?client=${encodeURIComponent(client.name)}">See all client projects ${icon('arrow-right')}</a></div>`;
  return true;
}

function scoreTile(label, earned, max, total = false) {
  const percent = Math.max(0, Math.min(100, earned / max * 100));
  const ring = percent < 80 ? '#be6b58' : percent < 90 ? '#b89647' : '#2e806a';
  return `<div class="score-tile ${total ? 'total' : ''}"><div class="score-ring" style="--pct:${percent}%;--ring:${ring}"><span>${formatScore(percent)}</span></div><strong>${label}</strong><small>${formatPoints(earned)} / ${max} points</small></div>`;
}

const reportHeadings = new Set([
  'Client communication', 'Resource communication', 'Deadline compliance',
  'Quality assessment', 'Plunet review', 'Plunet Checks & Project Ownership',
  'Evidence', 'Assessment', 'Conclusion'
]);
function renderFullReport(item) {
  const root = $('#full-report');
  const record = reportData[item.id];
  root.replaceChildren();
  if (!record) {
    const notice = document.createElement('p');
    notice.textContent = window.pulsesDemo ? 'The report text is temporarily unavailable. Open the source document.' : 'The report text is unavailable in this snapshot. Open the source document.';
    root.append(notice);
    return;
  }
  const paragraphs = record.paragraphs;
  const categories = ['Client communication', 'Resource communication', 'Deadline compliance', 'Quality assessment', 'Plunet review'];
  const categoryKey = text => ({ 'client communication': categories[0], 'resource communication': categories[1], 'vendor communication': categories[1], 'deadline': categories[2], 'deadline compliance': categories[2], 'quality': categories[3], 'quality assessment': categories[3], 'plunet review': categories[4], 'plunet record review': categories[4], 'plunet record checks': categories[4], 'plunet documentation': categories[4] })[text?.trim().toLowerCase()] || null;
  const supportingHeading = text => /^Plunet checks (?:&|and) project ownership$|^Operational Notes & Plunet Checks$|^Unscored Operational Notes & Plunet Flags$|^Project ownership \(unscored\):/i.test(text);
  const scorePattern = /^\s*[\d.]+%?\s*\/\s*[\d.]+%?\s*$/;
  const tableStart = paragraphs.findIndex(p => p.text === 'Evaluation Category');
  const supportingStart = paragraphs.findIndex((p, i) => i > tableStart && supportingHeading(p.text));
  const tableEnd = supportingStart < 0 ? paragraphs.length : supportingStart;

  function appendRichText(element, paragraph, index) {
    const runs = reportRich[item.id]?.[index];
    if (!runs || runs.map(run => run.t).join('') !== paragraph.text) {
      element.textContent = paragraph.text;
      return;
    }
    for (const run of runs) {
      const safeUrl = run.u && /^https?:\/\//i.test(run.u) ? run.u : null;
      const piece = document.createElement(safeUrl ? 'a' : 'span');
      piece.textContent = run.t;
      if (safeUrl) {
        piece.href = safeUrl;
        piece.target = '_blank';
        piece.rel = 'noopener noreferrer';
        piece.classList.add('report-evidence-link');
      }
      if (run.c) piece.classList.add('report-source-' + run.c);
      if (run.b) piece.classList.add('report-source-bold');
      element.append(piece);
    }
  }

  function appendContent(container, entries, startIndex) {
    let list = null;
    entries.forEach((paragraph, offset) => {
      if (paragraph.list) {
        if (!list) {
          list = document.createElement('ul');
          list.className = 'report-list';
          container.append(list);
        }
        const li = document.createElement('li');
        appendRichText(li, paragraph, startIndex + offset);
        list.append(li);
        return;
      }
      list = null;
      let tag = 'p';
      if (paragraph.style === 'TITLE') tag = 'h2';
      else if (paragraph.style.startsWith('HEADING_') || reportHeadings.has(paragraph.text)) tag = 'h3';
      const element = document.createElement(tag);
      if (paragraph.text.startsWith('Pulse Score:')) element.className = 'report-total-line';
      appendRichText(element, paragraph, startIndex + offset);
      container.append(element);
    });
  }

  if (tableStart < 0 || tableEnd <= tableStart) {
    appendContent(root, paragraphs, 0);
    return;
  }
  const cover = document.createElement('div');
  cover.className = 'report-cover';
  appendContent(cover, paragraphs.slice(0, tableStart), 0);
  root.append(cover);

  const table = document.createElement('table');
  table.className = 'report-audit-table';
  const header = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const paragraph of paragraphs.slice(tableStart, tableStart + 3)) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = paragraph.text;
    headerRow.append(cell);
  }
  header.append(headerRow);
  table.append(header);
  const body = document.createElement('tbody');
  let cursor = tableStart + 3;
  for (const category of categories) {
    if (cursor >= tableEnd || categoryKey(paragraphs[cursor].text) !== category) break;
    const next = paragraphs.findIndex((p, i) => i > cursor + 1 && ((!p.list && categoryKey(p.text) && scorePattern.test(paragraphs[i + 1]?.text || '')) || supportingHeading(p.text)));
    const end = next < 0 ? tableEnd : Math.min(next, tableEnd);
    const row = document.createElement('tr');
    const scoreParts = paragraphs[cursor + 1].text.match(/([\d.]+)%?\s*\/\s*([\d.]+)%?/);
    if (scoreParts && Number(scoreParts[1]) + 0.005 < Number(scoreParts[2])) row.className = 'report-row-deducted';
    const categoryCell = document.createElement('th');
    categoryCell.scope = 'row';
    categoryCell.textContent = paragraphs[cursor].text;
    const scoreCell = document.createElement('td');
    scoreCell.className = 'report-audit-score';
    const scoreValue = document.createElement('span');
    scoreValue.className = 'report-score-value';
    scoreValue.textContent = paragraphs[cursor + 1].text;
    scoreCell.append(scoreValue);
    const detailCell = document.createElement('td');
    detailCell.className = 'report-audit-findings';
    appendContent(detailCell, paragraphs.slice(cursor + 2, end), cursor + 2);
    row.id = 'audit-' + auditSlug(category);
    row.append(categoryCell, scoreCell, detailCell);
    body.append(row);
    cursor = end;
  }
  table.append(body);
  root.append(table);

  const supporting = document.createElement('div');
  supporting.className = 'report-supporting';
  appendContent(supporting, paragraphs.slice(cursor), cursor);
  root.append(supporting);
}

function auditSlug(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function renderCaseMap(item) {
  const rows = item.findings.map(([label, score, explanation]) => {
    const values = score.match(/([\d.]+)\s*\/\s*([\d.]+)/);
    const deducted = values && Number(values[1]) + 0.005 < Number(values[2]);
    return `<button type="button" class="case-map-row ${deducted ? 'needs-attention' : ''}" data-audit-target="audit-${auditSlug(label)}"><span class="case-map-mark">${deducted ? '!' : '✓'}</span><span class="case-map-name">${h(label)}</span><strong>${h(score)}</strong>${icon('arrow-right')}</button>`;
  }).join('');
  const first = item.findings[0];
  return `<div class="case-map-card"><div class="case-map-heading"><div><span class="eyebrow">REPORT GUIDE</span><h2>Explore the audit</h2><p>Jump to any score and read the supporting findings.</p></div><span class="case-map-count">5 sections</span></div><div class="case-map-list">${rows}</div><div class="case-map-first"><span class="case-map-first-label">START WITH ${h(first[0].toUpperCase())}</span><p>${h(first[2])}</p></div></div>`;
}

function renderDetail(item) {
  const s = item.scores;
  const rowUrl = '#evidence/' + encodeURIComponent(item.id);
  const hasAudit = item.hasAudit && !!reportData[item.id];
  const sourceNote = hasAudit
    ? window.pulsesDemo ? 'Fictional audit written for this demonstration. Every source below is a local sample, not a real message or record.' : `Complete wording from this order’s Doc tab, generated ${snapshotDate}. Evidence links and source color cues are included below.`
    : 'No matching audit tab is available in the linked report Doc. The score and order details shown here come from the fictional demo record.';
  const scoreGuide = hasAudit ? renderCaseMap(item) : `<div class="case-map-card"><div class="case-map-heading"><div><span class="eyebrow">SHEET BREAKDOWN</span><h2>Weighted score</h2><p>Component scores from the fictional demo record. Detailed audit findings are unavailable for this order.</p></div></div><div class="case-map-list">${item.findings.map(([label, score]) => `<div class="case-map-row"><span class="case-map-name">${h(label)}</span><strong>${h(score)}</strong></div>`).join('')}</div></div>`;
  const reportPanel = hasAudit
    ? `<div class="audit-card full-report-card"><div class="report-intro"><div><span class="eyebrow">SOURCE REPORT</span><h2>Full audit report</h2><p>${h(sourceNote)} Use the linked sample evidence to explore the timeline.</p></div><a href="${h(item.reportUrl)}" target="_blank" rel="noopener noreferrer">Open sample evidence ${icon('arrow-up-right')}</a></div><div id="full-report" class="report-doc"></div></div>`
    : `<div class="audit-card full-report-card"><div class="report-intro"><div><span class="eyebrow">SOURCE STATUS</span><h2>Sheet evaluation only</h2><p>${h(sourceNote)}</p></div><a href="${h(rowUrl)}" target="_blank" rel="noopener noreferrer">View sample evidence ${icon('arrow-up-right')}</a></div></div>`;
  const disputeAction = window.pulsesDemo ? `<a href="#dispute/${encodeURIComponent(item.id)}">Debate score ${icon('arrow-right')}</a>` : '';
  const askAction = window.pulsesDemo ? `<a href="#ask?order=${encodeURIComponent(item.id)}">Ask Pulse about this project ${icon('arrow-right')}</a>` : '';
  const actions = hasAudit
    ? `<a href="${h(item.reportUrl)}" target="_blank" rel="noopener noreferrer">Open sample evidence ${icon('arrow-up-right')}</a><a href="${h(rowUrl)}" target="_blank" rel="noopener noreferrer">View sample evidence ${icon('arrow-up-right')}</a>${askAction}${disputeAction}`
    : `<a href="${h(rowUrl)}" target="_blank" rel="noopener noreferrer">View sample evidence ${icon('arrow-up-right')}</a>${askAction}${disputeAction}`;
  $('#detail-content').innerHTML = `<div class="detail-hero"><span class="eyebrow">FINAL PROJECT EVALUATION</span><h1>${h(item.id)}</h1><h2>${h(item.name)}</h2><p>${h(item.client)} · ${h(item.section)} · ${dateLabel(item.date)}</p></div><div class="detail-layout"><div class="detail-primary"><div class="score-strip">${scoreTile('Total score', item.score, 100, true)}${scoreTile('Communication', s.communication, 28)}${scoreTile('Deadline', s.deadline, 28)}${scoreTile('Quality', s.quality, 39)}${scoreTile('Plunet', s.plunet, 5)}</div><div class="conclusion-card"><h2>Inspection conclusion</h2><p>${h(item.conclusion)}</p></div>${scoreGuide}</div><aside class="side-detail"><div class="detail-card"><h2>Case navigator</h2><p>Source context at a glance</p><dl><div><dt>Order number</dt><dd>${h(item.id)}</dd></div><div><dt>Responsible PM</dt><dd>${h(item.pm)}</dd></div><div><dt>Client</dt><dd>${h(item.client)}</dd></div><div><dt>Service${hasAudit ? ' from report' : ''}</dt><dd>${h(item.section)}</dd></div></dl><details class="case-nav-more"><summary>More case details ${icon('chevron-down')}</summary><dl><div><dt>Scope</dt><dd>${h(item.scope)}</dd></div><div><dt>Order price</dt><dd>${h(item.price)}</dd></div><div><dt>Project ownership</dt><dd>${h(item.ownership)}</dd></div><div><dt>Evaluation</dt><dd>Final · version ${h(item.version)}</dd></div><div><dt>Last evaluated</dt><dd>${h(item.evaluated)}</dd></div></dl></details><div class="info-note">${window.pulsesDemo ? `Fictional demo records.` : `Read-only snapshot generated ${snapshotDate}. The app does not sync automatically with Sheets or Docs.`} ${hasAudit ? 'Open the sample evidence' : 'Open the Sheet row'} to explore the fictional source timeline.</div></div></aside>${reportPanel}<div class="source-actions">${actions}</div></div>`;
  if (hasAudit) renderFullReport(item);
}

function renderNonFinalDetail(item) {
  const rowUrl = '#evidence/' + encodeURIComponent(item.id);
  $('#detail-content').innerHTML = `<div class="detail-hero"><span class="eyebrow">PROJECT STATUS</span><h1>${h(item.id)}</h1><h2>${h(item.name)}</h2><p>${h(item.client)} · ${dateLabel(item.date)}</p></div><div class="audit-card full-report-card"><div class="report-intro"><div><span class="eyebrow">SHEET STATUS</span><h2>${h(item.status)}</h2><p>This Sheet row is not Final. It is excluded from score dashboards and PDFs. Open the Sheet row for the current evaluation status.</p></div><a href="${h(rowUrl)}" target="_blank" rel="noopener noreferrer">View sample evidence ${icon('arrow-up-right')}</a></div></div>`;
}

async function navigate() {
  const [routePath, routeQuery = ''] = location.hash.slice(1).split('?');
  const route = decodeURIComponent(routePath) || 'overview';
  let view = route === 'projects' ? 'projects' : route === 'pms' ? 'pms' : route === 'export' ? 'export' : route === 'clients' ? 'clients' : (route === 'instructions' || route === 'ask') ? 'instructions' : route === 'disputes' ? 'disputes' : 'overview';
  if (route === 'how') { view = 'how'; $('#breadcrumbs').innerHTML = 'Workspace <span>/</span> How the agent works'; }
  if (route.startsWith('evidence/')) { view = 'evidence'; renderDemoEvidence(route.slice(9)); $('#breadcrumbs').innerHTML = 'Workspace <span>/</span> Sample evidence'; }
  if (route.startsWith('dispute/') && window.pulsesRenderDispute) {
    const id = route.slice(8);
    if (allCases.some(item => item.id === id && !item.status)) { view = 'dispute'; $('#breadcrumbs').innerHTML = 'Workspace <span>/</span> Score debates <span>/</span> ' + h(id); await window.pulsesRenderDispute(id); }
  }
  if (route.startsWith('pm/')) {
    const name = route.slice(3);
    if (renderPMDetail(name)) { view = 'pm-detail'; $('#breadcrumbs').innerHTML = 'Workspace <span>/</span> PM Dashboard <span>/</span> ' + h(name); }
  }
  if (route.startsWith('client/')) {
    const name = route.slice(7);
    if (renderClientDetail(name)) { view = 'client-detail'; $('#breadcrumbs').innerHTML = 'Workspace <span>/</span> Clients <span>/</span> ' + h(name); }
  }
  if (route.startsWith('case/')) {
    const item = allCases.find(entry => entry.id === route.slice(5));
    if (item) {
      view = 'detail';
      if (!item.status && window.pulsesLoadReport && !reportData[item.id]) {
        $('#detail-content').innerHTML = '<div class="audit-card">Loading validated audit report…</div>';
        try { await window.pulsesLoadReport(item.id); }
        catch (error) { $('#detail-content').innerHTML = '<div class="audit-card">The audit could not be loaded. Please try again later.</div>'; return; }
        if (location.hash.slice(1).split('?')[0] !== routePath) return;
      }
      item.status ? renderNonFinalDetail(item) : renderDetail(item); $('#breadcrumbs').innerHTML = `Workspace <span>/</span> Projects <span>/</span> ${item.id}`; }
  }
  if (view === 'overview') $('#breadcrumbs').innerHTML = 'Workspace <span>/</span> Overview';
  if (view === 'projects') {
    const params = new URLSearchParams(routeQuery);
    const requestedClient = params.get('client');
    const requestedPM = params.get('pm');
    if (routeQuery) {
      state.month = 'All months';
      state.client = requestedClient && allCases.some(item => item.client === requestedClient) ? requestedClient : 'all';
      state.pm = requestedPM && allCases.some(item => item.pm === requestedPM) ? requestedPM : 'all';
      state.section = 'all';
      state.query = '';
      $('#search-input').value = '';
      renderFilterMenus();
    }
    const requestedDeduction = params.get('deduction');
    state.deduction = Object.hasOwn(deductionLabels,requestedDeduction) ? requestedDeduction : 'all';
    $('#breadcrumbs').innerHTML = 'Workspace <span>/</span> Projects';
    renderProjects();
  }
  if (view === 'pms') { $('#breadcrumbs').innerHTML = 'Workspace <span>/</span> PM Dashboard'; renderPMs(); }
  if (view === 'export' && window.pulsesAuth?.role === 'pm') { location.hash = 'overview'; return; }
  if (view === 'export') { $('#breadcrumbs').innerHTML = 'Workspace <span>/</span> Export'; renderExport(); }
  if (view === 'clients') { $('#breadcrumbs').innerHTML = 'Workspace <span>/</span> Client Dashboard'; renderClients(); }
  if (view === 'instructions') $('#breadcrumbs').innerHTML = 'Workspace <span>/</span> Ask Pulse';
  if (view === 'disputes' && window.pulsesRenderDisputeList) { $('#breadcrumbs').innerHTML = 'Workspace <span>/</span> Score debates'; await window.pulsesRenderDisputeList(); }
  ['overview', 'projects', 'pms', 'pm-detail', 'clients', 'client-detail', 'instructions', 'disputes', 'dispute', 'export', 'detail', 'how', 'evidence'].forEach(name => $(`#${name}-view`).classList.toggle('hidden', name !== view));
  document.body.classList.toggle('ask-fullscreen', view === 'instructions');
  document.querySelectorAll('[data-nav]').forEach(link => link.classList.toggle('active', link.dataset.nav === (view === 'detail' ? 'projects' : view === 'client-detail' ? 'clients' : view === 'pm-detail' ? 'pms' : view === 'dispute' ? 'disputes' : view)));
  closeFilters();
  document.body.classList.remove('menu-open');
  $('#menu-button').setAttribute('aria-expanded', 'false');
  document.querySelector('.view:not(.hidden)')?.animate?.(matchMedia('(prefers-reduced-motion: reduce)').matches?[]:[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});
  window.scrollTo({ top: 0, behavior: 'instant' });
}

async function startPulses() {
  try {
    if (window.pulsesReady) await window.pulsesReady;
    allCases.splice(0, allCases.length, ...cases, ...nonFinalCases);
    hydrateIcons();
    renderOverview();
    renderPMs();
    renderClients();
    renderExportSubject();
    renderFilterMenus();
    renderProjects();
    navigate();
  } catch (error) {
    document.querySelector('.main-area').innerHTML = '<main class="audit-card"><h1>Pulses is temporarily unavailable</h1><p>' + h(error.message) + '</p></main>';
  }
}
startPulses();
window.addEventListener('hashchange', navigate);
document.addEventListener('click', event => {
  const clearDeduction = event.target.closest('[data-clear-deduction]');
  if (clearDeduction) {
    const params = new URLSearchParams();
    if (state.client !== 'all') params.set('client',state.client);
    if (state.pm !== 'all') params.set('pm',state.pm);
    location.hash = `projects${params.size ? `?${params}` : ''}`;
    return;
  }
  const filterOption = event.target.closest('.filter-option');
  if (filterOption) {
    const field = filterOption.dataset.filterField;
    state[field] = filterOption.dataset.filterValue;
    closeFilters();
    renderFilterMenus();
    renderProjects();
    document.querySelector('[data-filter="' + field + '"] .filter-trigger').focus();
    return;
  }
  const filterTrigger = event.target.closest('.filter-trigger');
  if (filterTrigger) {
    const root = filterTrigger.closest('.filter-dropdown');
    if (root.classList.contains('open')) {
      closeFilters();
    } else {
      openFilter(root);
    }
    return;
  }
  if (!event.target.closest('.filter-dropdown')) closeFilters();
  const auditTarget = event.target.closest('[data-audit-target]');
  if (auditTarget) { document.getElementById(auditTarget.dataset.auditTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  const open = event.target.closest('[data-open]');
  if (open) location.hash = `case/${open.dataset.open}`;
  const month = event.target.closest('[data-month]');
  if (month) { state.month = month.dataset.month; renderProjects(); }
});
document.addEventListener('focusin', event => {
  if (!event.target.closest('.filter-dropdown')) closeFilters();
});
document.addEventListener('keydown', event => {
  const option = event.target.closest('.filter-option');
  const trigger = event.target.closest('.filter-trigger');
  if (trigger && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault();
    openFilter(trigger.closest('.filter-dropdown'));
    return;
  }
  if (!option) return;
  const root = option.closest('.filter-dropdown');
  const options = Array.from(root.querySelectorAll('.filter-option'));
  const index = options.indexOf(option);
  if (event.key === 'Escape') {
    event.preventDefault();
    closeFilters();
    root.querySelector('.filter-trigger').focus();
  } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[next].focus();
  }
});
document.addEventListener('keydown', event => { const row = event.target.closest('tr[data-open]'); if (row && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); location.hash = `case/${row.dataset.open}`; } });
['#view-projects', '#hero-browse', '#all-projects', '#back-to-projects'].forEach(selector => $(selector).addEventListener('click', () => { location.hash = 'projects'; }));
$('#search-input').addEventListener('input', event => { state.query = event.target.value.trim().toLowerCase(); renderProjects(); });
$('#reset-filters').addEventListener('click', () => {
  state.month = 'All months';
  state.client = 'all';
  state.pm = 'all';
  state.section = 'all';
  state.deduction = 'all';
  state.query = '';
  $('#search-input').value = '';
  history.replaceState(null,'',`${location.pathname}${location.search}#projects`);
  closeFilters();
  renderFilterMenus();
  renderProjects();
});
$('#menu-button').addEventListener('click', () => { const isOpen = document.body.classList.toggle('menu-open'); $('#menu-button').setAttribute('aria-expanded', String(isOpen)); });

const moreProjects = document.querySelector('#projects-more');
if (moreProjects) moreProjects.addEventListener('click', () => { projectRowsShown += 100; renderProjects(); });

window.addEventListener('pulses:data-updated', async () => {
  allCases.splice(0, allCases.length, ...cases, ...nonFinalCases);
  renderOverview();
  renderPMs();
  renderClients();
  renderFilterMenus();
  renderProjects();
  const route = location.hash.slice(1).split('?')[0];
  if (route.startsWith('client/')) {
    const position = window.scrollY;
    renderClientDetail(decodeURIComponent(route.slice(7)));
    window.scrollTo(0, position);
  }
  if (route.startsWith('pm/')) {
    const position = window.scrollY;
    renderPMDetail(decodeURIComponent(route.slice(3)));
    window.scrollTo(0, position);
  }
  if (route.startsWith('case/')) {
    const item = allCases.find(entry => entry.id === route.slice(5));
    if (item) {
      try {
        if (!item.status && window.pulsesLoadReport) await window.pulsesLoadReport(item.id);
        const position = window.scrollY;
        item.status ? renderNonFinalDetail(item) : renderDetail(item);
        window.scrollTo(0, position);
      } catch (error) { console.warn('Updated audit could not be displayed:', error); }
    }
  }
});
