// Portfolio demonstration. Identity, review status and submissions use local fictional records.
const disputeCategories = {
  client_communication: 'Client communication',
  resource_communication: 'Resource communication',
  deadline: 'Deadline',
  quality: 'Quality',
  plunet: 'Plunet',
  total: 'Total score or multiple areas',
};
async function disputeRequest(path) { return window.pulseDemoDebateRequest(path); }
async function disputePost(path,payload) { await new Promise(resolve=>setTimeout(resolve,550)); return window.pulseDemoDebatePost(path,payload); }
function disputeStatus(status, scoreChanged=false, assessed=false) {
  if (status === 'accepted' && scoreChanged) return 'Score changed';
  if (status === 'pending') return assessed ? 'Assessment saved' : 'Waiting for admin';
  return {under_review:'Under review',accepted:'Correction approved',rejected:'Score unchanged'}[status] || status;
}
function disputeCategoryPicker() {
  const options = Object.entries(disputeCategories).map(([value,label]) => `<button type="button" role="option" aria-selected="false" data-debate-category="${h(value)}">${h(label)}</button>`).join('');
  return `<details class="debate-category-picker"><summary aria-label="Scoring area, choose an area"><span><small>Scoring area</small><strong data-category-label>Choose an area</strong></span>${icon('chevron-down')}</summary><div class="debate-category-options" role="listbox" aria-label="Scoring area">${options}</div><input type="hidden" name="category" value=""></details><small class="debate-category-error" hidden>Choose a scoring area before sending.</small>`;
}
function disputeEvidenceFields() {
  return `<details class="debate-evidence"><summary>${icon('paperclip')} Add links or screenshots <span>Optional</span></summary><div class="dispute-evidence-fields"><label>Evidence links, one HTTPS link per line<textarea name="links" rows="2" placeholder="https://drive.google.com/..."></textarea></label><label>Screenshots<input name="images" type="file" accept="image/png,image/jpeg,image/webp" multiple><small>Up to 3 PNG, JPEG, or WebP images, 2 MB each.</small></label></div></details>`;
}
function disputeMessageEvidence(message) {
  const items = (message.evidence || []).map(item => item.kind === 'image'
    ? `<a class="dispute-evidence-image" href="${h(item.url)}" target="_blank" rel="noopener noreferrer"><img src="${h(item.url)}" alt="Screenshot evidence: ${h(item.name)}" loading="lazy"><span>${h(item.name)} ${icon('arrow-up-right')}</span></a>`
    : `<a class="dispute-evidence-link" href="${h(item.url)}" target="_blank" rel="noopener noreferrer">${icon('arrow-up-right')} ${h(item.name)}<small>${h(item.url)}</small></a>`).join('');
  return items ? `<div class="dispute-message-evidence">${items}</div>` : '';
}
async function disputeFormEvidence(form) {
  const links = form.elements.links.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  const files = [...form.elements.images.files];
  if (links.length > 3) throw new Error('Add up to three evidence links.');
  if (files.length > 3) throw new Error('Add up to three screenshots.');
  const images = await Promise.all(files.map(file => new Promise((resolve,reject) => {
    if (file.size > 2 * 1024 * 1024) { reject(new Error('Each screenshot must be 2 MB or smaller.')); return; }
    const reader = new FileReader();
    reader.onload = () => resolve({name:file.name,data:String(reader.result).split(',')[1]});
    reader.onerror = () => reject(new Error('Could not read the screenshot.'));
    reader.readAsDataURL(file);
  })));
  return {links,images};
}
function debateSourceChecks(assessment) {
  const checks = assessment.source_checks || [];
  if (!checks.length) return '';
  const opened = checks.filter(item => item.status === 'opened').length;
  const rows = checks.slice(0, 12).map((item, index) => {
    const label = item.status === 'opened' ? 'Document opened' : item.status === 'unavailable' ? 'Could not open' : 'Not opened';
    const source = item.url || `Source ${index + 1}`;
    return `<li><strong>${h(label)}</strong><span>${h(source)}</span></li>`;
  }).join('');
  return `<details class="dispute-source-checks"><summary>Source checks: ${opened} document${opened === 1 ? '' : 's'} opened, ${checks.length - opened} not verified</summary><ul>${rows}</ul>${checks.length > 12 ? `<small>Showing 12 of ${checks.length} links.</small>` : ''}<small>Opening a document confirms access only. Pulse has not analyzed its text or checked Gmail, Plunet, or client portals live.</small></details>`;
}
function disputePulseReply(assessment) {
  if (!assessment) return '<div class="ask-message ask-message-pulse"><strong>Pulse</strong><p>I could not complete the first review. Your debate is saved for an admin to check.</p></div>';
  const labels = {supports_correction:'A correction may be justified',supports_existing_score:'The published score appears supported',needs_review:'More source review is needed'};
  const proposed = assessment.proposed_scores ? `<p><b>Proposed points, not published:</b> ${h(Object.entries(assessment.proposed_scores).map(([area,points]) => `${area} ${points}`).join(' · '))}</p>` : '';
  return `<div class="ask-message ask-message-pulse dispute-agent-bubble"><strong>Pulse</strong><div class="ask-message-body"><p><b>${h(labels[assessment.outcome] || 'Review needed')}.</b> ${h(assessment.explanation)}</p>${assessment.missing_evidence ? `<p><b>What still needs verification:</b> ${h(assessment.missing_evidence)}</p>` : ''}${proposed}${debateSourceChecks(assessment)}<p class="dispute-agent-boundary">This scripted demonstration uses the fictional audit and a summary of the V.02.00 test workflow. No sources are opened or analyzed live. Source-check results are shown separately. An admin can review this case and any new evidence.</p></div></div>`;
}
function disputeHtml(record) {
  const isAdmin = window.pulsesAuth.role === 'admin';
  const owner = record.pmName || record.owner;
  const closed = record.status === 'accepted' || record.status === 'rejected';
  const assessment = record.assessment;
  const messages = record.messages.map((message,index) => {
    const role = message.role === 'admin' ? 'pulse' : 'user';
    const label = message.role === 'admin' ? `Admin · ${h(message.author)}` : h(message.author);
    return `<div class="ask-message ask-message-${role} dispute-chat-message"><strong>${label} · ${new Date(message.created_at*1000).toLocaleString('en-GB')}</strong><div class="ask-message-body"><p>${h(message.body)}</p>${disputeMessageEvidence(message)}</div></div>${index === 0 ? disputePulseReply(assessment) : ''}`;
  }).join('');
  const actions = isAdmin ? `<div class="dispute-decision-actions"><button type="submit" name="decision" value="under_review">Keep under review</button><button type="submit" name="decision" value="accepted" class="decision-accept">Accept</button><button type="submit" name="decision" value="rejected" class="decision-reject">Score does not change</button></div>` : '<button type="submit">Add evidence</button>';
  const resultClass = record.status === 'accepted' ? 'dispute-result-approved' : record.status === 'rejected' ? 'dispute-result-unchanged' : 'dispute-result-open';
  const reply = closed ? `<div class="dispute-closed ${resultClass}"><strong>${h(disputeStatus(record.status,record.scoreChanged,!!assessment))}</strong><p>This debate is closed after the admin decision. No more messages can be added to this case.${record.status === 'accepted' ? (record.scoreChanged ? ' The updated score is now reflected in the demo data.' : ' The sample score remains unchanged until the Sheet and Doc correction is published and verified.') : ' The sample score remains unchanged.'}</p></div>` : `<form class="dispute-reply dispute-chat-composer" data-dispute-id="${record.id}"><label>${isAdmin ? 'Decision reason and evidence' : 'Add a message or evidence for the admin'}<textarea name="message" rows="3" required minlength="2" maxlength="8000"></textarea></label>${disputeEvidenceFields()}${actions}</form>`;
  return `<article class="dispute-chat ask-workspace"><div class="ask-chat-top"><span class="ask-chat-avatar">${icon('activity')}</span><div><strong>Score debate</strong><small>${h(disputeCategories[record.category] || 'Score debate')} · ${h(owner)}</small></div><strong class="status-chip ${closed ? resultClass : 'pending'}">${h(disputeStatus(record.status,record.scoreChanged,!!assessment))}</strong></div><div class="dispute-chat-log ask-conversation" aria-live="polite">${messages}</div>${reply}<p class="dispute-note">One Pulse assessment per debate. Later evidence goes to the admin. Scores change only after a verified source correction.</p></article>`;
}

window.pulsesRenderDispute = async orderId => {
  const root = document.querySelector('#dispute-content');
  root.innerHTML = '<div class="audit-card">Loading score conversation…</div>';
  try {
    const data = await disputeRequest('/api/disputes?order=' + encodeURIComponent(orderId));
    const records = data.disputes;
    if (records.some(record => record.status === 'accepted')) {
      const changed = await disputeRequest('/api/dispute-changes');
      for (const record of records) record.scoreChanged = changed.orders.includes(record.orderId);
    }
    const identity = window.pulsesAuth.pmName || window.pulsesAuth.email;
    root.innerHTML = `<div class="debate-toolbar"><a href="#disputes" class="debate-back">${icon('arrow-left')} All debates</a><span class="debate-toolbar-divider"></span><span class="debate-toolbar-order">${h(orderId)}</span><span class="debate-toolbar-owner">${h(identity)}</span><a class="debate-open-audit" href="#case/${encodeURIComponent(orderId)}">Open audit ${icon('arrow-up-right')}</a></div>${records.length ? records.map(disputeHtml).join('') : `<article class="dispute-chat ask-workspace"><div class="ask-chat-top"><span class="ask-chat-avatar">${icon('activity')}</span><div><strong>Start a score debate</strong><small>Demo reviewer and fictional order</small></div><span class="ask-chat-private">Demo review</span></div><div class="dispute-chat-log ask-conversation" aria-live="polite"><div class="ask-welcome"><span class="ask-welcome-icon">${icon('activity')}</span><h2>What score would you like reviewed?</h2><p>Choose the area, explain the finding, and add evidence. Pulse will give one initial assessment. An admin handles any source check or correction.</p></div></div><form id="dispute-new" class="dispute-chat-composer">${disputeCategoryPicker()}<label>Your message<textarea name="message" rows="4" required minlength="20" maxlength="8000" placeholder="Explain what happened and where the evidence can be checked."></textarea></label>${disputeEvidenceFields()}<button type="submit">Send to Pulse</button></form><p class="dispute-note">Demo only: no production score or record changes.</p></article>`}`;
  } catch(error) { root.innerHTML = `<div class="audit-card">${h(error.message)}</div>`; }
};
const disputeFilters = {pm:'', category:'', status:'', assessment:'', from:'', to:'', page:1};
const disputeCalendarMonth = {from:'',to:''};
function disputeCurrentCairoDate() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(part => [part.type,part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function disputeCalendarGrid(field) {
  const value = disputeFilters[field];
  const month = disputeCalendarMonth[field] || (value || disputeCurrentCairoDate()).slice(0,7);
  disputeCalendarMonth[field] = month;
  const [year,number] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year,number-1,1));
  const days = new Date(Date.UTC(year,number,0)).getUTCDate();
  const offset = (first.getUTCDay()+6)%7;
  const today = disputeCurrentCairoDate();
  const blanks = Array(offset).fill('<span aria-hidden="true"></span>').join('');
  const cells = Array.from({length:days},(_,index) => {const day=index+1,iso=`${month}-${String(day).padStart(2,'0')}`;return `<button type="button" data-dispute-date="${iso}" data-date-field="${field}" aria-label="${h(new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${iso}T12:00:00Z`)))}" class="${iso===value?'selected':''} ${iso===today?'today':''}">${day}</button>`;}).join('');
  return `<div class="dispute-calendar-head"><button type="button" data-calendar-step="-1" data-date-field="${field}" aria-label="Previous month">‹</button><strong>${h(new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(first))}</strong><button type="button" data-calendar-step="1" data-date-field="${field}" aria-label="Next month">›</button></div><div class="dispute-calendar-grid">${['Mo','Tu','We','Th','Fr','Sa','Su'].map(day => `<span class="weekday">${day}</span>`).join('')}${blanks}${cells}</div><button type="button" class="dispute-calendar-clear" data-calendar-clear="${field}">Clear date</button>`;
}
function disputeDatePicker(field,label) {
  const value=disputeFilters[field];
  const shown=value ? new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`)) : 'Any date';
  return `<details class="dispute-date-picker" data-date-field="${field}"><summary><span><small>${label}</small><strong>${h(shown)}</strong></span>${icon('calendar')}</summary><div class="dispute-calendar">${disputeCalendarGrid(field)}</div></details>`;
}

window.pulsesRenderDisputeList = async () => {
  const root = document.querySelector('#disputes-content');
  root.innerHTML = '<div class="audit-card">Loading score conversations…</div>';
  try {
    const params = new URLSearchParams();
    for (const [key,value] of Object.entries(disputeFilters)) if (value) params.set(key,String(value));
    const data = await disputeRequest('/api/disputes?' + params);
    const isAdmin = window.pulsesAuth.role === 'admin';
    const menu = (field,label,items,allLabel) => {
      const current = disputeFilters[field];
      const shown = items.find(([value]) => value === current)?.[1] || allLabel;
      return `<details class="dispute-filter-dropdown"><summary><span><small>${label}</small><strong>${h(shown)}</strong></span>${icon('chevron-down')}</summary><div class="dispute-filter-options">${[['',allLabel],...items].map(([value,text]) => `<button type="button" data-dispute-filter-field="${field}" data-dispute-filter-value="${h(value)}" aria-current="${String(current === value)}">${h(text)}${current === value ? icon('check') : ''}</button>`).join('')}</div></details>`;
    };
    const pmMenu = menu('pm','PM',data.owners.map(name => [name,name]),'All PMs');
    const categoryMenu = menu('category','Scoring area',Object.entries(disputeCategories),'All scoring areas');
    const statusMenu = menu('status','Decision',[['pending','Waiting for admin'],['under_review','Under review'],['accepted','Correction approved'],['rejected','Score unchanged']],'All decisions');
    const assessmentMenu = menu('assessment','Pulse assessment',[['needs_review','Needs source review'],['supports_correction','Correction may be justified'],['supports_existing_score','Score appears supported'],['unavailable','Assessment unavailable']],'All assessments');
    const filters = isAdmin ? `<div id="dispute-filters" class="dispute-filter-panel">${pmMenu}${categoryMenu}${statusMenu}${assessmentMenu}${disputeDatePicker('from','From date')}${disputeDatePicker('to','To date')}<button type="button" id="dispute-filter-clear">Clear filters</button><small>Dates use Cairo time. Filters apply to debates submitted in this period.</small></div>` : '';
    const rows = data.disputes.map(d => `<a class="client-evidence-row dispute-list-row" href="#dispute/${encodeURIComponent(d.orderId)}"><span><b>${h(d.orderId)} · ${h(d.pmName || d.owner)}</b><small>${h(disputeCategories[d.category] || 'Score debate')} · ${new Date(d.createdAt*1000).toLocaleDateString('en-GB')}</small><small class="dispute-list-status ${d.status === 'accepted' ? 'dispute-result-approved' : d.status === 'rejected' ? 'dispute-result-unchanged' : ''}">${h(disputeStatus(d.status,false,!!d.assessment))}</small></span>${icon('arrow-right')}</a>`).join('');
    const pages = Math.ceil(data.total/data.pageSize);
    const pagination = pages > 1 ? `<nav class="dispute-pagination" aria-label="Debate pages"><button type="button" data-dispute-page="${data.page-1}" ${data.page <= 1 ? 'disabled' : ''}>Previous</button><span>Page ${data.page} of ${pages}</span><button type="button" data-dispute-page="${data.page+1}" ${data.page >= pages ? 'disabled' : ''}>Next</button></nav>` : '';
    root.innerHTML = `<div class="page-heading"><div><span class="eyebrow">SCORE REVIEW</span><h1>Score debates</h1><p>${data.total} conversation${data.total === 1 ? '' : 's'} ${isAdmin ? 'match the selected filters' : 'in your private review queue'}.</p></div></div>${filters}${rows || '<div class="audit-card">No score debates match these filters.</div>'}${pagination}`;
  } catch(error) { root.innerHTML = `<div class="audit-card">${h(error.message)}</div>`; }
};
document.addEventListener('click', event => {
  const step = event.target.closest('[data-calendar-step]');
  if (step) {
    const field=step.dataset.dateField;
    const [year,month]=disputeCalendarMonth[field].split('-').map(Number);
    disputeCalendarMonth[field]=new Date(Date.UTC(year,month-1+Number(step.dataset.calendarStep),1)).toISOString().slice(0,7);
    step.closest('.dispute-calendar').innerHTML=disputeCalendarGrid(field);
    return;
  }
  const categoryOption = event.target.closest('[data-debate-category]');
  if (categoryOption) {
    const picker = categoryOption.closest('.debate-category-picker');
    picker.querySelector('input[name="category"]').value = categoryOption.dataset.debateCategory;
    picker.querySelector('[data-category-label]').textContent = categoryOption.textContent;
    picker.querySelector('summary').setAttribute('aria-label', 'Scoring area, ' + categoryOption.textContent);
    picker.querySelectorAll('[data-debate-category]').forEach(item => item.setAttribute('aria-selected', String(item === categoryOption)));
    picker.classList.remove('invalid');
    picker.nextElementSibling.hidden = true;
    picker.open = false;
    picker.querySelector('summary').focus();
    return;
  }
  if (!event.target.closest('.debate-category-picker')) document.querySelectorAll('.debate-category-picker[open]').forEach(picker => { picker.open = false; });
  const date = event.target.closest('[data-dispute-date]');
  const clear = event.target.closest('[data-calendar-clear]');
  if (date || clear) {
    const field=date?.dataset.dateField || clear.dataset.calendarClear;
    disputeFilters[field]=date?.dataset.disputeDate || '';
    disputeFilters.page=1;
    window.pulsesRenderDisputeList();
    return;
  }
  const option = event.target.closest('[data-dispute-filter-field]');
  if (option) {
    disputeFilters[option.dataset.disputeFilterField] = option.dataset.disputeFilterValue;
    disputeFilters.page = 1;
    window.pulsesRenderDisputeList();
    return;
  }
  if (!event.target.closest('.dispute-filter-dropdown, .dispute-date-picker')) document.querySelectorAll('.dispute-filter-dropdown[open], .dispute-date-picker[open]').forEach(menu => { menu.open = false; });
  if (event.target.closest('#dispute-filter-clear')) {
    for (const key of ['pm','category','status','assessment','from','to']) disputeFilters[key] = '';
    disputeCalendarMonth.from = disputeCalendarMonth.to = '';
    disputeFilters.page = 1;
    window.pulsesRenderDisputeList();
  }
  const pageButton = event.target.closest('[data-dispute-page]');
  if (pageButton && !pageButton.disabled) {
    disputeFilters.page = Number(pageButton.dataset.disputePage);
    window.pulsesRenderDisputeList();
  }
});
document.addEventListener('submit', async event => {
  const newForm = event.target.closest('#dispute-new');
  const replyForm = event.target.closest('.dispute-reply');
  if (!newForm && !replyForm) return;
  event.preventDefault();
  const form = newForm || replyForm;
  if (newForm && !form.elements.category.value) {
    const picker = form.querySelector('.debate-category-picker');
    picker.classList.add('invalid');
    picker.nextElementSibling.hidden = false;
    picker.open = true;
    picker.querySelector('summary').focus();
    return;
  }
  const button = event.submitter || form.querySelector('button[type="submit"]');
  button.disabled = true;
  const originalLabel = button.textContent;
  button.textContent = newForm ? 'Reviewing…' : 'Saving…';
  const log = form.closest('.dispute-chat')?.querySelector('.dispute-chat-log');
  const optimistic = document.createElement('div');
  optimistic.className = 'ask-message ask-message-user dispute-chat-message';
  const optimisticLabel = document.createElement('strong');
  optimisticLabel.textContent = 'You';
  const optimisticBody = document.createElement('p');
  optimisticBody.textContent = form.elements.message.value;
  optimistic.append(optimisticLabel, optimisticBody);
  if (newForm && log) log.querySelector('.ask-welcome')?.remove();
  log?.append(optimistic);
  const thinking = newForm ? document.createElement('div') : null;
  if (thinking) {
    thinking.className = 'ask-message ask-message-pulse ask-answering';
    thinking.innerHTML = `<strong>Pulse</strong><div class="ask-answering-row"><span class="ask-answering-mark">${icon('activity')}</span><span>Reviewing evidence</span><span class="ask-answering-dots"><i></i><i></i><i></i></span></div>`;
    log?.append(thinking);
  }
  if (log) log.scrollTop = log.scrollHeight;
  try {
    const orderId = decodeURIComponent(location.hash.slice('#dispute/'.length));
    const evidence = await disputeFormEvidence(form);
    if (newForm) {
      await disputePost('/api/disputes',{orderId,category:form.elements.category.value,message:form.elements.message.value,...evidence});
    } else {
      const status = button.name === 'decision' ? button.value : null;
      await disputePost('/api/disputes/'+form.dataset.disputeId,{message:form.elements.message.value,status,...evidence});
    }
    await window.pulsesRenderDispute(orderId);
  } catch(error) {
    optimistic.remove(); thinking?.remove();
    if (newForm && log && !log.children.length) log.innerHTML = '<div class="ask-welcome"><h2>What score would you like reviewed?</h2></div>';
    alert(error.message); button.disabled = false; button.textContent = originalLabel;
  }
});
