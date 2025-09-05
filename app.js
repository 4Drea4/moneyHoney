// Money Honey — Sultry (vanilla JS, localStorage)

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Tabs
const tabs = $$(".tab");
const panels = $$("[data-panel]");
tabs.forEach(t => t.addEventListener("click", () => {
  tabs.forEach(x => x.classList.toggle("active", x === t));
  const name = t.dataset.tab;
  panels.forEach(p => {
    // Show all panels whose data-panel matches the chosen tab
    p.style.display = (p.dataset.panel === name) ? "" :
      // For the "categories" tab, show both category sections
      (name === "categories" && p.dataset.panel === "categories") ? "" :
      (name === "overview" && p.dataset.panel === "overview") ? "" : "none";
  });
}));

// Quotes
const QUOTES = [
  "Invest in yourself.",
  "Soft life, smart money.",
  "Discipline is glamorous.",
  "Luxury loves a plan.",
  "Little deposits, big life.",
  "Wealth is a quiet flex",
  "Elegance is living within your means",
  "Honor God with your finances boo, build your riches in heaven",
  "Budgeting is self-care",
  "The soft life is a secured one",
  "Intentional money, intentional living",
  "Tomorrows freedom is funded today",
  "Saying no now means yes later",
  "Affluence is built, not bought."



  
];
const quoteEl = $("#quote");
if (quoteEl){
  const i = new Date().getDate() % QUOTES.length;
  quoteEl.textContent = QUOTES[i];
}

// Elements
const monthSelect = $("#monthSelect");
const catList = $("#catList");
const catName = $("#catName");
const catCap = $("#catCap");
const addCatBtn = $("#addCatBtn");

const txAmount = $("#txAmount");
const txCategory = $("#txCategory");
const txNote = $("#txNote");
const txDate = $("#txDate");
const addTxBtn = $("#addTxBtn");
const txList = $("#txList");

const overviewEl = $("#overview");
const exportBtn = $("#exportBtn");
const importBtn = $("#importBtn");
const importFile = $("#importFile");
const installBtn = $("#installBtn");

// Recurring UI
const recList = $("#recList");
const recName = $("#recName");
const recAmount = $("#recAmount");
const recFreq = $("#recFreq");
const recDay = $("#recDay");
const recCategory = $("#recCategory");
const addRecBtn = $("#addRecBtn");

// Goals UI
const goalList = $("#goalList");
const goalName = $("#goalName");
const goalType = $("#goalType");
const goalTarget = $("#goalTarget");
const addGoalBtn = $("#addGoalBtn");
const logAmount = $("#logAmount");
const logGoal = $("#logGoal");
const addLogBtn = $("#addLogBtn");

// PWA install prompt
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; installBtn.hidden = false; });
installBtn?.addEventListener('click', async () => { if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; installBtn.hidden=true; });

// ---- Recurring storage ----
const RECUR_KEY = 'penny:recurring';
function getRecurring(){ const raw = localStorage.getItem(RECUR_KEY); if(!raw) return []; try { return JSON.parse(raw);} catch { return []; } }
function saveRecurring(list){ localStorage.setItem(RECUR_KEY, JSON.stringify(list)); }

// ---- Data Layer ----
function monthKey(date = new Date()){ const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,'0'); return `${y}-${m}`; }
function storageKey(mKey){ return `penny:${mKey}`; }
function getData(mKey){
  const raw = localStorage.getItem(storageKey(mKey));
  if(!raw) return { categories: [], tx: [], goals: [], _seededRecurring:false };
  try { const parsed = JSON.parse(raw); if(!parsed.goals) parsed.goals=[]; if(parsed._seededRecurring==null) parsed._seededRecurring=false; return parsed; } catch { return { categories: [], tx: [], goals: [], _seededRecurring:false }; }
}
function saveData(mKey, data){ localStorage.setItem(storageKey(mKey), JSON.stringify(data)); }

function ensureMonthOptions(){
  const now = new Date(); const months=[];
  for(let off=-3; off<=1; off++){ const d=new Date(now.getFullYear(), now.getMonth()+off, 1); months.push(monthKey(d)); }
  monthSelect.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join("");
  monthSelect.value = monthKey(now);
}

function daysInMonth(year, month){ return new Date(year, month, 0).getDate(); }
function seedRecurringForMonth(mKey){
  const data = getData(mKey); if(data._seededRecurring) return;
  const [y,m] = mKey.split('-').map(Number);
  const maxDay = daysInMonth(y,m);
  const rec = getRecurring().filter(r => r.active !== false);
  rec.forEach(r => {
    if(r.frequency === 'weekly'){
      const first = new Date(y, m-1, 1);
      for(let i=0;i<5;i++){
        const d = new Date(first); d.setDate(1 + i*7 + ((r.day||1)%7));
        if(d.getMonth() !== (m-1)) break;
        data.tx.push({ id:'rt_' + Math.random().toString(36).slice(2,9), amount:Number(r.amount||0), catId:r.categoryId||'', note:r.name+' (recurring)', date:d.toISOString().slice(0,10) });
      }
    } else if(r.frequency === 'yearly'){
      const targetMonth = r.month || m;
      if(targetMonth === m){
        const day = Math.min(Number(r.day||1), maxDay);
        const d = new Date(y, m-1, day);
        data.tx.push({ id:'rt_' + Math.random().toString(36).slice(2,9), amount:Number(r.amount||0), catId:r.categoryId||'', note:r.name+' (recurring)', date:d.toISOString().slice(0,10) });
      }
    } else {
      const day = Math.min(Number(r.day||1), maxDay);
      const d = new Date(y, m-1, day);
      data.tx.push({ id:'rt_' + Math.random().toString(36).slice(2,9), amount:Number(r.amount||0), catId:r.categoryId||'', note:r.name+' (recurring)', date:d.toISOString().slice(0,10) });
    }
  });
  data._seededRecurring = true;
  saveData(mKey, data);
}

function sumRecurringForMonth(mKey){
  const data = getData(mKey);
  return data.tx.filter(t => (t.note||'').includes('(recurring)')).reduce((a,b)=>a+Number(b.amount),0);
}

function render(){
  const m = monthSelect.value; const data = getData(m);

  // Dropdowns
  txCategory.innerHTML = `<option value="">Category</option>` + data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  recCategory.innerHTML = `<option value="">(No category)</option>` + data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  logGoal.innerHTML = `<option value="">Choose goal</option>` + data.goals.map(g => `<option value="${g.id}">${g.name}</option>`).join("");

  // Category list
  catList.innerHTML = "";
  data.categories.forEach(c => {
    const spent = data.tx.filter(t => t.catId === c.id).reduce((a,b)=>a+Number(b.amount),0);
    const pct = c.cap > 0 ? Math.min(100, Math.round((spent / c.cap) * 100)) : 0;
    const left = (c.cap - spent);
    const row = document.createElement('div'); row.className='row';
    row.innerHTML = `
      <div style="flex:1">
        <div class="controls" style="justify-content:space-between">
          <strong>${c.name}</strong>
          <span class="pill">${spent.toFixed(2)} / ${c.cap.toFixed(2)}</span>
        </div>
        <div class="progress"><div class="bar" style="width:${pct}%"></div></div>
        <div class="muted" style="font-size:12px;">${left < 0 ? 'Over by $'+Math.abs(left).toFixed(2) : '$'+left.toFixed(2)+' left'}</div>
      </div>
      <button class="ghost" data-del="${c.id}">Delete</button>
    `;
    row.querySelector('[data-del]').addEventListener('click', () => {
      const next = { ...data, categories: data.categories.filter(x => x.id !== c.id), tx: data.tx.filter(t => t.catId !== c.id) };
      saveData(m, next); render();
    });
    catList.appendChild(row);
  });

  // Transactions list
  txList.innerHTML = "";
  data.tx.slice().sort((a,b)=> new Date(b.date) - new Date(a.date)).forEach(t => {
    const cat = data.categories.find(c => c.id === t.catId);
    const row = document.createElement('div'); row.className='row';
    row.innerHTML = `
      <div style="flex:1">
        <div class="controls" style="justify-content:space-between">
          <strong>$${Number(t.amount).toFixed(2)}</strong>
          <span class="pill">${cat ? cat.name : (t.note||'')}</span>
        </div>
        <div class="muted" style="font-size:12px;">${t.note || ''} — ${t.date}</div>
      </div>
      <button class="ghost" data-del="${t.id}">Delete</button>
    `;
    row.querySelector('[data-del]').addEventListener('click', () => {
      const next = { ...data, tx: data.tx.filter(x => x.id !== t.id) };
      saveData(m, next); render();
    });
    txList.appendChild(row);
  });

  // Recurring list
  recList.innerHTML = "";
  const rec = getRecurring();
  rec.forEach(r => {
    const cat = data.categories.find(c => c.id === r.categoryId);
    const row = document.createElement('div'); row.className='row';
    row.innerHTML = `
      <div style="flex:1">
        <div class="controls" style="justify-content:space-between">
          <strong>${r.name}</strong>
          <span class="pill">$${Number(r.amount).toFixed(2)} · ${r.frequency}</span>
        </div>
        <div class="muted" style="font-size:12px;">${cat ? cat.name : 'Uncategorized'} · day ${r.day || 1}</div>
      </div>
      <button class="ghost" data-del-rec="${r.id}">Delete</button>
    `;
    row.querySelector('[data-del-rec]').addEventListener('click', () => {
      const next = rec.filter(x => x.id !== r.id); saveRecurring(next); render();
    });
    recList.appendChild(row);
  });

  // Goals list
  goalList.innerHTML = "";
  data.goals.forEach(g => {
    const pct = g.target>0 ? Math.min(100, Math.round((g.progress/g.target)*100)) : 0;
    const row = document.createElement('div'); row.className='row';
    row.innerHTML = `
      <div style="flex:1">
        <div class="controls" style="justify-content:space-between">
          <strong>${g.name} <span class="muted" style="font-size:12px">(${g.type})</span></strong>
          <span class="pill">$${Number(g.progress).toFixed(2)} / $${Number(g.target).toFixed(2)}</span>
        </div>
        <div class="progress"><div class="bar" style="width:${pct}%"></div></div>
      </div>
      <button class="ghost" data-del-goal="${g.id}">Delete</button>
    `;
    row.querySelector('[data-del-goal]').addEventListener('click', () => {
      const next = { ...data, goals: data.goals.filter(x => x.id !== g.id) };
      saveData(m, next); render();
    });
    goalList.appendChild(row);
  });

  // Overview
  const totalCap = data.categories.reduce((a,b)=>a+Number(b.cap),0);
  const totalSpent = data.tx.reduce((a,b)=>a+Number(b.amount),0);
  const fixedSpent = sumRecurringForMonth(m);
  const variableSpent = totalSpent - fixedSpent;
  const pct = totalCap>0 ? Math.round((totalSpent/totalCap)*100) : 0;
  const goalsProgress = data.goals.reduce((a,b)=>a+Number(b.progress||0),0);
  overviewEl.innerHTML = `
    <div class="row"><div style="flex:1">
      <div class="controls" style="justify-content:space-between">
        <strong>Total vs Caps</strong>
        <span class="pill">$${totalSpent.toFixed(2)} / $${totalCap.toFixed(2)}</span>
      </div>
      <div class="progress"><div class="bar" style="width:${Math.min(100,pct)}%"></div></div>
    </div></div>
    <div style="height:10px"></div>
    <div class="row"><div style="flex:1">
      <div class="controls" style="justify-content:space-between"><strong>Fixed (Recurring)</strong><span class="pill">$${fixedSpent.toFixed(2)}</span></div>
    </div></div>
    <div style="height:10px"></div>
    <div class="row"><div style="flex:1">
      <div class="controls" style="justify-content:space-between"><strong>Variable (Categories)</strong><span class="pill">$${variableSpent.toFixed(2)}</span></div>
    </div></div>
    <div style="height:10px"></div>
    <div class="row"><div style="flex:1">
      <div class="controls" style="justify-content:space-between"><strong>Savings & Debt (This Month)</strong><span class="pill">$${goalsProgress.toFixed(2)}</span></div>
    </div></div>
  `;
}

// Add Category
addCatBtn?.addEventListener('click', () => {
  const name = catName.value.trim(); const cap = Number(catCap.value);
  if(!name || isNaN(cap) || cap<0) return;
  const m = monthSelect.value; const data = getData(m);
  const id = 'c_' + Math.random().toString(36).slice(2,9);
  data.categories.push({ id, name, cap }); saveData(m, data);
  catName.value=''; catCap.value=''; render();
});

// Add Transaction
addTxBtn?.addEventListener('click', () => {
  const amt = Number(txAmount.value); const catId = txCategory.value;
  const note = txNote.value.trim(); const date = txDate.value || new Date().toISOString().slice(0,10);
  if(isNaN(amt) || amt<=0 || !catId) return;
  const m = monthSelect.value; const data = getData(m);
  const id = 't_' + Math.random().toString(36).slice(2,9);
  data.tx.push({ id, amount: amt, catId, note, date }); saveData(m, data);
  txAmount.value=''; txNote.value=''; render();
});

// Add Recurring
addRecBtn?.addEventListener('click', () => {
  const name = (recName.value||'').trim();
  const amt = Number(recAmount.value);
  const freq = recFreq.value||'monthly';
  const day = Number(recDay.value||1);
  const categoryId = recCategory.value||'';
  if(!name || isNaN(amt) || amt<=0) return;
  const list = getRecurring();
  const id = 'r_' + Math.random().toString(36).slice(2,9);
  list.push({ id, name, amount: amt, frequency: freq, day, categoryId, active:true, month: null });
  saveRecurring(list);
  recName.value=''; recAmount.value=''; recDay.value='';
  render();
});

// Goals
addGoalBtn?.addEventListener('click', () => {
  const name=(goalName.value||'').trim(); const type=goalType.value||'savings'; const target=Number(goalTarget.value);
  if(!name || isNaN(target) || target<=0) return;
  const m=monthSelect.value; const data=getData(m);
  const id='g_' + Math.random().toString(36).slice(2,9);
  data.goals.push({ id, name, type, target, progress:0 });
  saveData(m, data); goalName.value=''; goalTarget.value=''; render();
});

addLogBtn?.addEventListener('click', () => {
  const amt=Number(logAmount.value); const gid=logGoal.value;
  if(isNaN(amt) || amt<=0 || !gid) return;
  const m=monthSelect.value; const data=getData(m);
  const g=data.goals.find(x=>x.id===gid); if(!g) return;
  g.progress = Number(g.progress||0)+amt; saveData(m, data);
  logAmount.value=''; render();
});

// Export / Import
exportBtn?.addEventListener('click', () => {
  const dump = {};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k && (k.startsWith('penny:') || k===RECUR_KEY)){
      dump[k] = localStorage.getItem(k);
    }
  }
  const blob = new Blob([JSON.stringify(dump, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`money-honey-export-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
});
importBtn?.addEventListener('click', ()=> importFile.click());
importFile?.addEventListener('change', async (e) => {
  const file=e.target.files[0]; if(!file) return;
  try{ const text=await file.text(); const data=JSON.parse(text); Object.entries(data).forEach(([k,v])=> localStorage.setItem(k,v)); ensureMonthOptions(); render(); alert('Import complete!'); }
  catch(e){ alert('Import failed.'); } finally { importFile.value=''; }
});

// Month switching
monthSelect?.addEventListener('change', () => { seedRecurringForMonth(monthSelect.value); render(); });

// Init
function init(){
  ensureMonthOptions();
  const m = monthSelect.value;
  // seed example if empty
  const data = getData(m);
  if(data.categories.length === 0 && data.tx.length === 0 && data.goals.length===0){
    const demo = {
      categories: [
        {id:'c_food', name:'Groceries', cap:400},
        {id:'c_shop', name:'Shopping', cap:300},
        {id:'c_ent', name:'Entertainment', cap:150}
      ],
      tx: [],
      goals: [
        {id:'g_save', name:'Emergency Fund', type:'savings', target:1000, progress:200},
        {id:'g_debt', name:'Visa Card', type:'debt', target:500, progress:120}
      ],
      _seededRecurring: false
    };
    saveData(m, demo);
  }
  txDate.value = new Date().toISOString().slice(0,10);
  seedRecurringForMonth(m);
  render();
}
init();
