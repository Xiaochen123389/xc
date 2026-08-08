/* ============================================
   供应链管理系统 - 完整交互组件库 v2
   包含：Modal/Toast/Dropdown/DatePicker/Select/Table
   ============================================ */

/* ---------- Modal 弹窗 ---------- */
function openModal(id) {
  var m = document.getElementById(id);
  if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  var m = document.getElementById(id);
  if (m) { m.style.display = 'none'; document.body.style.overflow = ''; }
}
function closeAllModals() {
  document.querySelectorAll('.tms-modal').forEach(function(m){ m.style.display='none'; });
  document.body.style.overflow = '';
}
function bindModalTriggers() {
  document.querySelectorAll('[data-modal-open]').forEach(function(b){
    b.addEventListener('click', function(){ openModal(b.getAttribute('data-modal-open')); });
  });
  document.querySelectorAll('[data-modal-close]').forEach(function(b){
    b.addEventListener('click', function(){ closeModal(b.getAttribute('data-modal-close')); });
  });
}

/* ---------- Toast 轻提示 ---------- */
function toast(msg, type) {
  type = type || 'info';
  var t = document.createElement('div');
  var icon = type==='success'?'✓':(type==='error'?'✕':(type==='warning'?'!':'i'));
  t.className = 'fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded shadow-lg flex items-center gap-2 text-sm animate-slideDown pointer-events-none';
  var bg = type==='success'?'bg-green-500':(type==='error'?'bg-red-500':(type==='warning'?'bg-amber-500':'bg-slate-700'));
  t.classList.add(bg, 'text-white');
  t.innerHTML = '<span class="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-xs font-bold">'+icon+'</span>'+msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(function(){t.remove();},300); }, 2200);
}

/* ---------- 确认对话框 ---------- */
function confirmDialog(title, message, onOk, okText) {
  okText = okText || '确定';
  var id = 'confirmModal_' + Date.now();
  var html = '<div id="'+id+'" class="tms-modal fixed inset-0 bg-black/40 z-[9000] flex items-center justify-center" style="display:flex;">'
    +'<div class="bg-white rounded w-[400px] shadow-xl animate-scaleIn overflow-hidden">'
    +'<div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">'
    +'<span class="font-medium text-slate-800">'+title+'</span>'
    +'<button onclick="document.getElementById(\''+id+'\').remove()" class="text-slate-400 hover:text-slate-600 text-lg">×</button></div>'
    +'<div class="px-5 py-5 text-sm text-slate-600"><div class="flex gap-3"><span class="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">!</span><div>'+message+'</div></div></div>'
    +'<div class="px-5 py-3 bg-slate-50 flex justify-end gap-2">'
    +'<button class="btn-confirm-cancel px-4 py-1.5 rounded border border-slate-300 text-sm text-slate-700 hover:bg-slate-100">取消</button>'
    +'<button class="btn-confirm-ok px-4 py-1.5 rounded bg-[var(--scm-primary)] text-white text-sm hover:bg-[var(--scm-primary-dark)]">'+okText+'</button>'
    +'</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  var m = document.getElementById(id);
  m.querySelector('.btn-confirm-cancel').onclick = function(){ m.remove(); };
  m.querySelector('.btn-confirm-ok').onclick = function(){ m.remove(); if(onOk) onOk(); };
  m.addEventListener('click', function(e){ if(e.target===m) m.remove(); });
}

/* ---------- 加载按钮 ---------- */
function setBtnLoading(btn, text) {
  if(!btn) return;
  btn.dataset.originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2 align-middle"></span>'+(text||'处理中...');
}
function resetBtn(btn) {
  if(!btn) return;
  btn.disabled = false;
  btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
}

/* ---------- Select 自定义下拉 ---------- */
function initCustomSelects() {
  document.querySelectorAll('.custom-select').forEach(function(sel){
    if(sel.dataset.bound) return;
    sel.dataset.bound = '1';
    var trigger = sel.querySelector('.cs-trigger');
    var options = sel.querySelectorAll('.cs-option');
    var hiddenInput = sel.querySelector('input[type="hidden"]');
    trigger.addEventListener('click', function(e){
      e.stopPropagation();
      document.querySelectorAll('.custom-select.open').forEach(function(s){ if(s!==sel) s.classList.remove('open'); });
      sel.classList.toggle('open');
    });
    options.forEach(function(opt){
      opt.addEventListener('click', function(){
        var val = opt.dataset.value||opt.textContent.trim();
        var label = opt.textContent.trim();
        trigger.querySelector('.cs-value').textContent = label;
        if(hiddenInput) hiddenInput.value = val;
        sel.classList.remove('open');
        sel.dispatchEvent(new CustomEvent('change', {detail:{value:val, label:label}}));
      });
    });
  });
  document.addEventListener('click', function(){
    document.querySelectorAll('.custom-select.open').forEach(function(s){ s.classList.remove('open'); });
  });
}

/* ---------- 日期选择器（轻量版） ---------- */
function initDatePickers() {
  document.querySelectorAll('.date-picker').forEach(function(dp){
    if(dp.dataset.bound) return;
    dp.dataset.bound = '1';
    var input = dp.querySelector('input');
    var panel = dp.querySelector('.dp-panel');
    if(!input || !panel) return;
    dp.addEventListener('click', function(e){ e.stopPropagation(); });
    input.addEventListener('focus', function(){ openDatePanel(dp); });
    input.addEventListener('click', function(){ openDatePanel(dp); });
  });
  document.addEventListener('click', function(){ document.querySelectorAll('.date-picker.open').forEach(function(d){d.classList.remove('open');}); });
}
function openDatePanel(dp) {
  document.querySelectorAll('.date-picker.open').forEach(function(d){ if(d!==dp) d.classList.remove('open'); });
  dp.classList.add('open');
  var input = dp.querySelector('input');
  var panel = dp.querySelector('.dp-panel');
  renderCalendar(dp, input.value);
}
function renderCalendar(dp, value) {
  var panel = dp.querySelector('.dp-panel');
  var input = dp.querySelector('input');
  var now = value ? new Date(value.replace(/-/g,'/')) : new Date();
  var year = now.getFullYear(), month = now.getMonth();
  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month+1, 0).getDate();
  var today = new Date(); today.setHours(0,0,0,0);
  var html = '<div class="dp-header flex items-center justify-between px-2 py-2 border-b border-slate-100">'
    +'<button type="button" class="dp-prev w-6 h-6 hover:bg-slate-100 rounded text-slate-500">‹</button>'
    +'<span class="text-sm font-medium">'+year+'年'+(month+1)+'月</span>'
    +'<button type="button" class="dp-next w-6 h-6 hover:bg-slate-100 rounded text-slate-500">›</button></div>'
    +'<div class="dp-grid grid grid-cols-7 text-center text-xs text-slate-400 py-1"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>'
    +'<div class="dp-days grid grid-cols-7 text-center text-xs px-1 pb-2">';
  for(var i=0;i<firstDay;i++) html += '<span></span>';
  for(var d=1; d<=daysInMonth; d++){
    var date = new Date(year,month,d); date.setHours(0,0,0,0);
    var isToday = date.getTime()===today.getTime();
    var isSelected = input.value === (year+'-'+pad(month+1)+'-'+pad(d));
    var cls = 'w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-slate-100';
    if(isToday) cls += ' text-[var(--scm-primary)] font-medium';
    if(isSelected) cls = 'w-7 h-7 flex items-center justify-center rounded bg-[var(--scm-primary)] text-white cursor-pointer';
    html += '<span class="'+cls+'" data-date="'+year+'-'+pad(month+1)+'-'+pad(d)+'">'+d+'</span>';
  }
  html += '</div>';
  panel.innerHTML = html;
  panel.querySelector('.dp-prev').onclick = function(e){ e.stopPropagation(); renderCalendar(dp, year+'-'+pad(month)+'-01'); };
  panel.querySelector('.dp-next').onclick = function(e){ e.stopPropagation(); renderCalendar(dp, year+'-'+pad(month+2)+'-01'); };
  panel.querySelectorAll('.dp-days span[data-date]').forEach(function(span){
    span.onclick = function(e){
      e.stopPropagation();
      input.value = span.dataset.date;
      dp.classList.remove('open');
      input.dispatchEvent(new Event('change', {bubbles:true}));
    };
  });
}
function pad(n){ return n<10?'0'+n:n; }

/* ---------- 表格全选 / 单选 ---------- */
function initTableCheckboxes() {
  document.querySelectorAll('table[data-table]').forEach(function(table){
    if(table.dataset.checkBound) return;
    table.dataset.checkBound = '1';
    var headCheck = table.querySelector('thead th:first-child input[type="checkbox"]') || table.querySelector('thead .check-all');
    var rowChecks = table.querySelectorAll('tbody tr input[type="checkbox"]');
    if(headCheck){
      headCheck.addEventListener('change', function(){
        table.querySelectorAll('tbody tr input[type="checkbox"]').forEach(function(c){ c.checked = headCheck.checked; updateRowHighlight(c); });
        updateBatchBar(table);
      });
    }
    rowChecks.forEach(function(c){
      c.addEventListener('change', function(){
        updateRowHighlight(c);
        var all = table.querySelectorAll('tbody tr input[type="checkbox"]');
        var checked = table.querySelectorAll('tbody tr input[type="checkbox"]:checked');
        if(headCheck) headCheck.checked = all.length===checked.length;
        if(headCheck) headCheck.indeterminate = checked.length>0 && checked.length<all.length;
        updateBatchBar(table);
      });
    });
  });
}
function updateRowHighlight(c) {
  var tr = c.closest('tr');
  if(tr) tr.classList.toggle('row-selected', c.checked);
}
function updateBatchBar(table) {
  var bar = document.querySelector('[data-batch-bar="'+table.dataset.table+'"]');
  if(!bar) return;
  var checked = table.querySelectorAll('tbody tr input[type="checkbox"]:checked').length;
  var countSpan = bar.querySelector('.batch-count');
  if(countSpan) countSpan.textContent = '已选择 '+checked+' 项';
  bar.style.display = checked>0 ? 'flex' : 'none';
}

/* ---------- 表格排序 ---------- */
function initTableSort() {
  document.querySelectorAll('th[data-sort]').forEach(function(th){
    if(th.dataset.sortBound) return;
    th.dataset.sortBound = '1';
    th.style.cursor = 'pointer';
    th.addEventListener('click', function(){
      var table = th.closest('table');
      table.querySelectorAll('th[data-sort]').forEach(function(h){ if(h!==th){ h.classList.remove('sort-asc','sort-desc'); }});
      if(th.classList.contains('sort-asc')){ th.classList.remove('sort-asc'); th.classList.add('sort-desc'); }
      else { th.classList.remove('sort-desc'); th.classList.add('sort-asc'); }
      sortTable(table, th.dataset.sort, th.classList.contains('sort-desc')?'desc':'asc');
    });
  });
}
function sortTable(table, key, dir) {
  var tbody = table.querySelector('tbody');
  var rows = Array.from(tbody.querySelectorAll('tr'));
  var idx = Array.from(table.querySelectorAll('th')).findIndex(function(h){return h.dataset.sort===key;});
  rows.sort(function(a,b){
    var va = a.children[idx].textContent.trim();
    var vb = b.children[idx].textContent.trim();
    var na = parseFloat(va.replace(/[,¥%件kgm³]/g,'')), nb = parseFloat(vb.replace(/[,¥%件kgm³]/g,''));
    if(!isNaN(na)&&!isNaN(nb)) return dir==='asc'?na-nb:nb-na;
    return dir==='asc'?va.localeCompare(vb,'zh'):vb.localeCompare(va,'zh');
  });
  rows.forEach(function(r){ tbody.appendChild(r); });
}

/* ---------- 实时搜索过滤 ---------- */
function initLiveSearch() {
  document.querySelectorAll('[data-search-target]').forEach(function(input){
    if(input.dataset.bound) return;
    input.dataset.bound = '1';
    input.addEventListener('input', function(){
      var kw = input.value.trim().toLowerCase();
      var target = document.querySelector(input.dataset.searchTarget);
      if(!target) return;
      target.querySelectorAll('tbody tr').forEach(function(tr){
        tr.style.display = tr.textContent.toLowerCase().includes(kw) ? '' : 'none';
      });
    });
  });
}

/* ---------- Tab 切换 ---------- */
function initTabs() {
  document.querySelectorAll('[data-tab-group]').forEach(function(group){
    if(group.dataset.bound) return;
    group.dataset.bound = '1';
    var tabs = group.querySelectorAll('[data-tab]');
    tabs.forEach(function(t){
      t.addEventListener('click', function(){
        tabs.forEach(function(x){ x.classList.remove('tab-active','border-[var(--scm-primary)]','text-[var(--scm-primary)]'); x.classList.add('border-transparent','text-slate-500'); });
        t.classList.add('tab-active','border-[var(--scm-primary)]','text-[var(--scm-primary)]');
        t.classList.remove('border-transparent','text-slate-500');
        var name = group.dataset.tabGroup;
        document.querySelectorAll('[data-tab-panel="'+name+'"]').forEach(function(p){ p.classList.add('hidden'); });
        var panel = document.querySelector('[data-tab-panel="'+name+'"][data-tab-key="'+t.dataset.tab+'"]');
        if(panel) panel.classList.remove('hidden');
        group.dispatchEvent(new CustomEvent('tabchange',{detail:{key:t.dataset.tab}}));
      });
    });
  });
}

/* ---------- 用户菜单/通知菜单下拉 ---------- */
function initDropdowns() {
  document.querySelectorAll('[data-dropdown]').forEach(function(trigger){
    if(trigger.dataset.bound) return;
    trigger.dataset.bound = '1';
    trigger.addEventListener('click', function(e){
      e.stopPropagation();
      var menuId = trigger.dataset.dropdown;
      var menu = document.getElementById(menuId);
      if(!menu) return;
      document.querySelectorAll('.dropdown-menu.open').forEach(function(m){ if(m!==menu) m.classList.remove('open'); });
      menu.classList.toggle('open');
    });
  });
  document.addEventListener('click', function(){
    document.querySelectorAll('.dropdown-menu.open').forEach(function(m){ m.classList.remove('open'); });
  });
}

/* ---------- 侧边栏/导航菜单激活 ---------- */
function initSidebar() {
  document.querySelectorAll('.tms-sidebar .nav-item, .submenu-item').forEach(function(item){
    if(item.dataset.bound) return;
    item.dataset.bound = '1';
    if(item.classList.contains('has-submenu')){
      item.addEventListener('click', function(e){
        if(e.target.closest('.submenu')) return;
        item.classList.toggle('expanded');
        var sub = item.querySelector('.submenu');
        if(sub) sub.style.display = item.classList.contains('expanded')?'block':'none';
      });
    }
  });
}

/* ---------- 面包屑跳转 ---------- */
function initBreadcrumb() {
  document.querySelectorAll('.breadcrumb a[data-page]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var href = a.getAttribute('data-page') || a.getAttribute('href');
      if(href && href!=='#') window.location.href = href;
    });
  });
}

/* ---------- 退出登录 ---------- */
function logout() {
  confirmDialog('退出登录', '确定要退出当前账号吗？', function(){
    toast('已退出登录，正在跳转...','success');
    setTimeout(function(){ window.location.href='login.html'; }, 800);
  }, '退出');
}

/* ---------- 数字滚动动画 ---------- */
function animateNumber(el, target, duration) {
  duration = duration||1200;
  var start = 0, startTime = null;
  function step(ts){
    if(!startTime) startTime=ts;
    var p = Math.min((ts-startTime)/duration, 1);
    var eased = 1 - Math.pow(1-p, 3);
    el.textContent = Math.floor(start + (target-start)*eased).toLocaleString();
    if(p<1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString();
  }
  requestAnimationFrame(step);
}

/* ---------- 初始化所有交互 ---------- */
document.addEventListener('DOMContentLoaded', function(){
  bindModalTriggers();
  initCustomSelects();
  initDatePickers();
  initTableCheckboxes();
  initTableSort();
  initLiveSearch();
  initTabs();
  initDropdowns();
  initSidebar();
  initBreadcrumb();
});
