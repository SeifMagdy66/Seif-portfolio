import {dateKey,shiftDate} from './model.js?v=20261104-11';

const monthLabel=key=>new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',month:'long',year:'numeric'}).format(new Date(`${key}-01T12:00:00Z`));
const fullLabel=key=>new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}).format(new Date(`${key}T12:00:00Z`));
const nextMonth=(key,amount)=>{const d=new Date(`${key}-15T12:00:00Z`);d.setUTCMonth(d.getUTCMonth()+amount);return d.toISOString().slice(0,7)};
const later=(a,b)=>a>b?a:b;

export function enhanceDatePickers(dialog){
  const fields=[...dialog.querySelectorAll('input[type="date"]')];
  if(fields.length!==2)return;
  const [start,end]=fields;
  const popover=document.createElement('div');
  popover.className='date-popover';popover.id='leave-date-popover';popover.setAttribute('role','dialog');popover.setAttribute('aria-label','Choose a date');popover.hidden=true;
  dialog.append(popover);
  let active=null,visibleMonth='';
  const controller=new AbortController();
  const controls=fields.map(input=>{
    input.required=false;input.type='hidden';
    const label=dialog.querySelector(`label[for="${input.id}"]`);
    const button=document.createElement('button');button.type='button';button.id=`${input.id}-trigger`;button.className='date-trigger';
    button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',popover.id);button.setAttribute('aria-expanded','false');
    if(label)label.htmlFor=button.id;
    input.after(button);
    return button;
  });
  function sync(){fields.forEach((input,i)=>{controls[i].innerHTML=`<span>${fullLabel(input.value)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v16H4zM4 10h16M8 2v6m8-6v6"/></svg>`;controls[i].setAttribute('aria-label',`${i?'Last day':'First day'}: ${fullLabel(input.value)}`)})}
  function close(restore=false){if(!active)return;const button=active===start?controls[0]:controls[1];popover.hidden=true;button.setAttribute('aria-expanded','false');active=null;if(restore)button.focus({preventScroll:true})}
  function position(){if(!active||popover.hidden)return;const button=active===start?controls[0]:controls[1],rect=button.getBoundingClientRect(),box=popover.getBoundingClientRect();let top=rect.bottom+8;if(top+box.height>innerHeight-12&&rect.top-box.height-8>=12)top=rect.top-box.height-8;popover.style.top=`${Math.max(12,top)}px`;popover.style.left=`${Math.max(12,Math.min(rect.left,innerWidth-box.width-12))}px`}
  function draw(){if(!active)return;const minimum=active===end?later(dateKey(),start.value):dateKey(),first=`${visibleMonth}-01`,offset=(new Date(`${first}T12:00:00Z`).getUTCDay()+6)%7,gridStart=shiftDate(first,-offset),nextFirst=new Date(`${nextMonth(visibleMonth,1)}-01T12:00:00Z`),days=new Date(Date.UTC(nextFirst.getUTCFullYear(),nextFirst.getUTCMonth(),0)).getUTCDate(),cells=Math.ceil((offset+days)/7)*7;
    popover.setAttribute('aria-label',active===start?'Choose first day':'Choose last day');
    popover.innerHTML=`<div class="date-picker-kicker">${active===start?'FIRST DAY':'LAST DAY'}</div><div class="date-picker-head"><strong>${monthLabel(visibleMonth)}</strong><div><button type="button" data-month="-1" aria-label="Previous month">‹</button><button type="button" data-month="1" aria-label="Next month">›</button></div></div><div class="date-picker-grid">${['M','T','W','T','F','S','S'].map((d,i)=>`<span class="date-weekday" aria-label="${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i]}">${d}</span>`).join('')}${Array.from({length:cells},(_,i)=>{const day=shiftDate(gridStart,i),outside=day.slice(0,7)!==visibleMonth,selected=day===active.value,between=start.value<=day&&day<=end.value;return `<button type="button" data-day="${day}" class="date-choice${outside?' is-outside':''}${selected?' is-selected':''}${between?' is-range':''}${day===dateKey()?' is-today':''}" aria-label="${fullLabel(day)}" aria-pressed="${selected}" ${day<minimum?'disabled':''}>${Number(day.slice(8))}</button>`}).join('')}</div><div class="date-picker-foot"><span>Dates use Cairo time</span><button type="button" data-today>Today</button></div>`;
    position();
  }
  function open(input){if(active===input){close();return}close();active=input;visibleMonth=input.value.slice(0,7);popover.hidden=false;controls[fields.indexOf(input)].setAttribute('aria-expanded','true');draw();position()}
  function choose(day){if(!active)return;const minimum=active===end?later(dateKey(),start.value):dateKey();if(day<minimum)return;active.value=day;if(start.value>end.value)end.value=start.value;sync();close(true)}
  controls.forEach((button,i)=>button.addEventListener('click',()=>open(fields[i]),{signal:controller.signal}));
  popover.addEventListener('click',e=>{const month=e.target.closest('[data-month]');if(month){visibleMonth=nextMonth(visibleMonth,Number(month.dataset.month));draw();return}const day=e.target.closest('[data-day]');if(day){choose(day.dataset.day);return}if(e.target.closest('[data-today]')){const target=later(dateKey(),active===end?start.value:dateKey());visibleMonth=target.slice(0,7);draw();choose(target)}},{signal:controller.signal});
  dialog.addEventListener('click',e=>{if(active&&!popover.contains(e.target)&&!controls.some(b=>b.contains(e.target)))close()},{signal:controller.signal});
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();e.stopPropagation();close(true)}},{signal:controller.signal});
  window.addEventListener('resize',position,{signal:controller.signal});
  dialog.addEventListener('scroll',position,{signal:controller.signal});
  dialog.addEventListener('close',()=>controller.abort(),{once:true});
  sync();
}
