/* TMS Redesign - 交互组件库 v3 */

/* ========== Toast ========== */
(function(){
  if(document.getElementById('tms-toast-container')) return;
  var c = document.createElement('div');
  c.id = 'tms-toast-container';
  c.className = 'toast-container';
  document.body.appendChild(c);
})();
function toast(msg, type){
  type = type||'info';
  var c = document.getElementById('tms-toast-container');
  var icons = {info:'i',success:'✓',error:'✕',warning:'!'};
  var t = document.createElement('div');
  t.className = 'toast '+type;
  t.innerHTML = '<span class="toast-icon '+type+'">'+icons[type]+'</span><span>'+msg+'</span>';
  c.appendChild(t);
  setTimeout(function(){ t.style.opacity='0'; t.style.transform='translateY(-10px)'; t.style.transition='all .3s'; setTimeout(function(){t.remove();},300); }, 2500);
}

/* ========== Modal ========== */
function openModal(id){ var m=document.getElementById(id); if(m){m.classList.add('show'); document.body.style.overflow='hidden';} }
function closeModal(id){ var m=document.getElementById(id); if(m){m.classList.remove('show'); document.body.style.overflow='';} }
document.addEventListener('click', function(e){
  var openTrig = e.target.closest('[data-modal]');
  if(openTrig){ openModal(openTrig.getAttribute('data-modal')); return; }
  var closeTrig = e.target.closest('[data-close]');
  if(closeTrig){ closeModal(closeTrig.getAttribute('data-close')); return; }
  if(e.target.classList.contains('modal-mask')){ e.target.classList.remove('show'); document.body.style.overflow=''; }
});
document.addEventListener('keydown', function(e){ if(e.key==='Escape') document.querySelectorAll('.modal-mask.show').forEach(function(m){m.classList.remove('show'); document.body.style.overflow='';}); });

/* ========== 确认对话框 ========== */
function confirmDialog(title, msg, onOk, okText, okType){
  okText = okText||'确定'; okType = okType||'primary';
  var id = 'cd_'+Date.now();
  var btnClass = okType==='danger' ? 'btn btn-danger' : 'btn btn-primary';
  var html = '<div id="'+id+'" class="modal-mask show" style="padding-top:20vh;"><div class="modal modal-sm"><div class="modal-header"><span class="modal-title">'+title+'</span><button class="modal-close" data-close="'+id+'">×</button></div><div class="modal-body"><div style="display:flex;gap:12px;"><div style="width:40px;height:40px;border-radius:50%;background:#fff7e6;color:#faad14;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">!</div><div style="padding-top:8px;font-size:14px;color:var(--tms-text-1);line-height:1.6;">'+msg+'</div></div></div><div class="modal-footer"><button class="btn cd-cancel">取消</button><button class="'+btnClass+' cd-ok">'+okText+'</button></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  var m = document.getElementById(id);
  var closeIt = function(){ m.remove(); };
  m.querySelector('.cd-cancel').onclick = closeIt;
  m.querySelector('.cd-ok').onclick = function(){ closeIt(); if(onOk) onOk(); };
  m.addEventListener('click', function(e){ if(e.target===m) closeIt(); });
}

/* ========== Loading 按钮 ========== */
function setBtnLoading(btn, text){
  if(!btn) return;
  btn._origHTML = btn.innerHTML; btn._origDisabled = btn.disabled;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spin" style="border-top-color:currentColor;margin-right:8px;vertical-align:middle;"></span>'+(text||'处理中...');
}
function resetBtn(btn){
  if(!btn) return;
  btn.disabled = btn._origDisabled||false;
  btn.innerHTML = btn._origHTML||btn.innerHTML;
}

/* ========== 数字滚动 ========== */
function animateNumber(el, to, dur){
  dur = dur||1200; to = Number(to); var start=0, t0=null;
  function step(ts){ if(!t0)t0=ts; var p=Math.min((ts-t0)/dur,1); var e=1-Math.pow(1-p,3); el.textContent = Math.floor(start+(to-start)*e).toLocaleString(); if(p<1) requestAnimationFrame(step); else el.textContent = to.toLocaleString(); }
  requestAnimationFrame(step);
}

/* ========== Tabs ========== */
document.addEventListener('click', function(e){
  var tab = e.target.closest('[data-tab]');
  if(!tab) return;
  var group = tab.closest('[data-tabs]');
  if(!group) return;
  var name = group.getAttribute('data-tabs');
  group.querySelectorAll('[data-tab]').forEach(function(t){t.classList.remove('active');});
  tab.classList.add('active');
  document.querySelectorAll('[data-tab-panel="'+name+'"]').forEach(function(p){p.classList.add('hidden');});
  var panel = document.querySelector('[data-tab-panel="'+name+'"][data-tab-key="'+tab.getAttribute('data-tab')+'"]');
  if(panel) panel.classList.remove('hidden');
  var ev = new CustomEvent('tabchange',{detail:{key:tab.getAttribute('data-tab')}});
  group.dispatchEvent(ev);
});

/* ========== 下拉菜单 ========== */
document.addEventListener('click', function(e){
  var trig = e.target.closest('[data-dropdown]');
  if(trig){
    e.stopPropagation();
    var id = trig.getAttribute('data-dropdown');
    var menu = document.getElementById(id);
    if(!menu) return;
    document.querySelectorAll('.dropdown-menu.show').forEach(function(m){ if(m!==menu) m.classList.remove('show'); });
    menu.classList.toggle('show');
    return;
  }
  document.querySelectorAll('.dropdown-menu.show').forEach(function(m){ m.classList.remove('show'); });
});

/* ========== 侧边栏展开/折叠 ========== */
document.addEventListener('click', function(e){
  var item = e.target.closest('.nav-item.has-sub');
  if(!item) return;
  if(e.target.closest('a') && item.getAttribute('href') && item.getAttribute('href')!=='#') return;
  item.classList.toggle('expanded');
});

/* ========== 表格全选 ========== */
document.addEventListener('change', function(e){
  var checkAll = e.target.matches('.check-all');
  if(checkAll){
    var table = e.target.closest('table, .table-wrapper');
    if(!table) table = document;
    var view = e.target.closest('.card, .table-wrapper')||document;
    view.querySelectorAll('tbody .row-check').forEach(function(c){ c.checked = e.target.checked; c.closest('tr').classList.toggle('selected', c.checked); });
    updateBatch(e.target);
  }
  var rowCheck = e.target.matches('.row-check');
  if(rowCheck){
    e.target.closest('tr').classList.toggle('selected', e.target.checked);
    updateBatch(e.target);
    var card = e.target.closest('.card');
    if(card){
      var all = card.querySelectorAll('tbody .row-check');
      var ch = card.querySelectorAll('tbody .row-check:checked');
      var head = card.querySelector('.check-all');
      if(head){ head.checked = all.length===ch.length; head.indeterminate = ch.length>0 && ch.length<all.length; }
    }
  }
});
function updateBatch(el){
  var card = el.closest('.card');
  if(!card) return;
  var bar = document.querySelector('[data-batch-bar]');
  if(!bar) return;
  var checked = card.querySelectorAll('tbody .row-check:checked').length;
  bar.querySelector('.batch-count') && (bar.querySelector('.batch-count').textContent = '已选择 '+checked+' 项');
  if(checked>0) bar.classList.add('show'); else bar.classList.remove('show');
}
document.addEventListener('click', function(e){
  if(e.target.closest('.batch-clear')){
    document.querySelectorAll('.row-check:checked, .check-all:checked').forEach(function(c){ c.checked=false; });
    document.querySelectorAll('tr.selected').forEach(function(r){ r.classList.remove('selected'); });
    document.querySelector('[data-batch-bar]').classList.remove('show');
  }
});

/* ========== 表格排序 ========== */
document.addEventListener('click', function(e){
  var th = e.target.closest('th.sortable');
  if(!th) return;
  var table = th.closest('table');
  var tbody = table.querySelector('tbody');
  table.querySelectorAll('th.sortable').forEach(function(h){ if(h!==th) h.classList.remove('sort-asc','sort-desc'); });
  if(th.classList.contains('sort-asc')){ th.classList.remove('sort-asc'); th.classList.add('sort-desc'); }
  else { th.classList.remove('sort-desc'); th.classList.add('sort-asc'); }
  var idx = Array.from(th.parentNode.children).indexOf(th);
  var rows = Array.from(tbody.querySelectorAll('tr'));
  var dir = th.classList.contains('sort-desc')?-1:1;
  rows.sort(function(a,b){
    var va = a.children[idx].textContent.trim();
    var vb = b.children[idx].textContent.trim();
    var na = parseFloat(va.replace(/[,¥%件kgm³%kGTUEU\$]/g,''));
    var nb = parseFloat(vb.replace(/[,¥%件kgm³%kGTUEU\$]/g,''));
    if(!isNaN(na)&&!isNaN(nb)) return (na-nb)*dir;
    return va.localeCompare(vb,'zh')*dir;
  });
  rows.forEach(function(r){ tbody.appendChild(r); });
});

/* ========== 实时搜索 ========== */
document.addEventListener('input', function(e){
  if(!e.target.matches('[data-search]')) return;
  var kw = e.target.value.trim().toLowerCase();
  var target = document.querySelector(e.target.getAttribute('data-search'));
  if(!target) return;
  target.querySelectorAll('tbody tr').forEach(function(tr){
    tr.style.display = tr.textContent.toLowerCase().indexOf(kw)>-1 ? '' : 'none';
  });
});

/* ========== 登录鉴权守卫 ========== */
(function(){
  var path = location.pathname;
  var isLoginPage = path.indexOf('login.html') > -1 || path === '/' || path.endsWith('/pages/');
  var token = localStorage.getItem('tms_auth_token');
  if (!isLoginPage && !token) {
    // 未登录访问业务页，跳转到登录页
    window.location.replace('login.html');
    return;
  }
  if (isLoginPage && token) {
    // 已登录访问登录页，跳转到工作台
    // 仅在直接访问 login.html 时跳转，不阻止其他行为
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        // 留在登录页，让用户可以手动退出
      });
    }
  }
})();

/* ========== 退出登录 ========== */
function logout(){
  confirmDialog('退出登录','确定要退出当前账号吗？',function(){
    localStorage.removeItem('tms_auth_token');
    localStorage.removeItem('tms_user_name');
    localStorage.removeItem('tms_user_role');
    toast('已退出登录，正在跳转...','success');
    setTimeout(function(){ window.location.replace('login.html'); }, 800);
  },'退出','danger');
}

/* ========== 密码显示切换 ========== */
document.addEventListener('click', function(e){
  var btn = e.target.closest('.toggle-pwd');
  if(!btn) return;
  var input = document.getElementById(btn.getAttribute('data-target'));
  if(!input) return;
  if(input.type==='password'){ input.type='text'; btn.textContent='🙈'; }
  else { input.type='password'; btn.textContent='👁'; }
});

/* ========== 验证码生成 ========== */
function genCaptcha() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var s = '';
  for (var i = 0; i < 4; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}
function renderCaptcha(el, code) {
  if (!el) return;
  el.textContent = code;
  var colors = ['#1677ff', '#0958d9', '#13c2c2', '#722ed1', '#cf1322', '#389e0d', '#d48806'];
  var chars = code.split('');
  el.innerHTML = chars.map(function(c, i) {
    return '<span style="color:' + colors[Math.floor(Math.random()*colors.length)] + ';transform:rotate(' + (Math.random()*20-10) + 'deg);display:inline-block;">' + c + '</span>';
  }).join('');
}

/* ========== 待办勾选划线 ========== */
document.addEventListener('change', function(e) {
  if (e.target.matches('.todo-check')) {
    var item = e.target.closest('.todo-item');
    if (item) item.classList.toggle('done', e.target.checked);
  }
});

/* ========== 初始化 ========== */
document.addEventListener('DOMContentLoaded', function() {
  // 数字动画
  setTimeout(function() {
    document.querySelectorAll('[data-count]').forEach(function(el) {
      var v = parseInt(el.getAttribute('data-count') || '0', 10);
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var isFloat = el.getAttribute('data-float') === 'true';
      animateNumber(el, v, 1200, prefix, suffix, isFloat);
    });
  }, 200);
  // 回车提交
  document.querySelectorAll('input').forEach(function(inp) {
    if (inp.form || inp.closest('.login-card')) {
      inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          var submit = inp.closest('form,.login-card,.modal').querySelector('button[type=submit],.btn-primary.login-btn');
          if (submit) submit.click();
        }
      });
    }
  });
});

/* ========== 增强数字动画（支持前后缀和小数） ========== */
function animateNumber(el, to, dur, prefix, suffix, isFloat) {
  dur = dur || 1200; to = Number(to); prefix = prefix || ''; suffix = suffix || '';
  var start = 0, t0 = null;
  var decimals = isFloat ? 1 : 0;
  function step(ts) {
    if (!t0) t0 = ts;
    var p = Math.min((ts - t0) / dur, 1);
    var e = 1 - Math.pow(1 - p, 3);
    var val = start + (to - start) * e;
    if (isFloat) val = val.toFixed(decimals);
    else val = Math.floor(val).toLocaleString();
    el.textContent = prefix + val + suffix;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = prefix + (isFloat ? to.toFixed(decimals) : to.toLocaleString()) + suffix;
  }
  requestAnimationFrame(step);
}
