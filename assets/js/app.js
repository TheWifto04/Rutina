/**
 * APP.JS – Rutina App
 * Punto de entrada principal. Inicializa todos los sistemas.
 */

(function() {
  'use strict';

  // ================================================================
  // TOAST SYSTEM
  // ================================================================
  function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `${icons[type] || icons.info}<span>${Utils.escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  window.showToast = showToast;

  // ================================================================
  // MODAL SYSTEM
  // ================================================================
  function openModal(contentHTML, title = '') {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!overlay || !content) return;
    content.innerHTML = title ? `<h2 style="margin-bottom:16px;padding-right:32px">${Utils.escapeHtml(title)}</h2>${contentHTML}` : contentHTML;
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    const firstInput = content.querySelector('input, button, select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  window.openModal = openModal;
  window.closeModal = closeModal;

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // ================================================================
  // THEME SYSTEM
  // ================================================================
  function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'auto') {
      // Automático por hora del día
      const hour = new Date().getHours();
      html.setAttribute('data-theme', (hour >= 7 && hour < 20) ? 'light' : 'dark');
    } else {
      html.setAttribute('data-theme', theme);
    }
    Storage.set(Storage.KEYS.theme, theme);
    updateThemeIcon(theme);
  }

  function updateThemeIcon(theme) {
    const sun  = document.getElementById('icon-sun');
    const moon = document.getElementById('icon-moon');
    if (!sun || !moon) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    sun.classList.toggle('hidden', isDark);
    moon.classList.toggle('hidden', !isDark);
  }

  document.getElementById('btn-theme')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    Utils.haptic([15]);
  });

  // Actualizar tema automático cada hora
  setInterval(() => {
    const saved = Storage.get(Storage.KEYS.theme, 'auto');
    if (saved === 'auto') applyTheme('auto');
  }, 60 * 60 * 1000);

  // ================================================================
  // SIDE DRAWER
  // ================================================================
  function openDrawer() {
    const drawer = document.getElementById('side-drawer');
    drawer?.classList.add('open');
    drawer?.setAttribute('aria-hidden', 'false');
    document.getElementById('btn-menu')?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    const drawer = document.getElementById('side-drawer');
    drawer?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    document.getElementById('btn-menu')?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  document.getElementById('btn-menu')?.addEventListener('click', openDrawer);
  document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);

  // Drawer items
  document.querySelectorAll('.drawer-item[data-route]').forEach(item => {
    item.addEventListener('click', () => {
      closeDrawer();
      Router.navigate(item.dataset.route);
    });
  });

  // ================================================================
  // LOCK SCREEN
  // ================================================================
  let pinBuffer = '';

  function showLockScreen() {
    const ls = document.getElementById('lock-screen');
    const shell = document.getElementById('app-shell');
    Utils.show(ls);
    Utils.hide(shell);
    pinBuffer = '';
    updatePinDots();
  }

  function hideLockScreen() {
    const ls = document.getElementById('lock-screen');
    const shell = document.getElementById('app-shell');
    Utils.hide(ls);
    Utils.show(shell);
    Storage.setLastActive();
  }

  function updatePinDots() {
    document.querySelectorAll('.pin-dot').forEach((dot, i) => {
      dot.classList.toggle('filled', i < pinBuffer.length);
      dot.classList.remove('error');
    });
  }

  function shakePin() {
    document.querySelectorAll('.pin-dot').forEach(dot => dot.classList.add('error'));
    setTimeout(() => {
      document.querySelectorAll('.pin-dot').forEach(dot => dot.classList.remove('error'));
    }, 500);
    Utils.haptic([50, 50, 50]);
  }

  document.querySelectorAll('.pin-btn[data-digit]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (pinBuffer.length >= 4) return;
      pinBuffer += btn.dataset.digit;
      updatePinDots();
      Utils.haptic([10]);
      if (pinBuffer.length === 4) {
        setTimeout(() => {
          if (Storage.verifyPIN(pinBuffer)) {
            hideLockScreen();
          } else {
            shakePin();
            pinBuffer = '';
            updatePinDots();
          }
        }, 200);
      }
    });
  });

  document.querySelector('.pin-btn[data-action="clear"]')?.addEventListener('click', () => {
    pinBuffer = pinBuffer.slice(0, -1);
    updatePinDots();
  });

  document.querySelector('.pin-btn[data-action="ok"]')?.addEventListener('click', () => {
    if (Storage.verifyPIN(pinBuffer)) hideLockScreen();
    else { shakePin(); pinBuffer = ''; updatePinDots(); }
  });

  // Auto-lock
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      Storage.setLastActive();
    } else {
      if (Storage.isLocked()) showLockScreen();
    }
  });

  // ================================================================
  // PIN SETUP
  // ================================================================
  document.getElementById('btn-pin-setup')?.addEventListener('click', () => {
    closeDrawer();
    openModal(`
      <h3>Configurar PIN</h3>
      <p style="color:var(--text-muted);margin:8px 0 20px">El PIN protege el acceso a la app.</p>
      <div class="input-group" style="margin-bottom:12px">
        <label class="input-label">Nuevo PIN (4 dígitos)</label>
        <input type="password" id="pin-new" class="input" maxlength="4" pattern="[0-9]{4}" inputmode="numeric" placeholder="••••" />
      </div>
      <div class="input-group" style="margin-bottom:20px">
        <label class="input-label">Confirmar PIN</label>
        <input type="password" id="pin-confirm" class="input" maxlength="4" pattern="[0-9]{4}" inputmode="numeric" placeholder="••••" />
      </div>
      <button class="btn btn-primary btn-full" onclick="App.savePINSetup()">Guardar PIN</button>
      ${Storage.isPINEnabled() ? '<button class="btn btn-danger btn-full" style="margin-top:8px" onclick="App.removePIN()">Eliminar PIN</button>' : ''}
    `);
  });

  function savePINSetup() {
    const p1 = document.getElementById('pin-new')?.value.trim();
    const p2 = document.getElementById('pin-confirm')?.value.trim();
    if (!p1 || p1.length !== 4 || !/^\d{4}$/.test(p1)) {
      showToast('El PIN debe ser 4 dígitos numéricos', 'error'); return;
    }
    if (p1 !== p2) { showToast('Los PINes no coinciden', 'error'); return; }
    Storage.savePIN(p1);
    closeModal();
    showToast('PIN configurado correctamente', 'success');
  }

  function removePIN() {
    Storage.disablePIN();
    closeModal();
    showToast('PIN eliminado', 'info');
  }

  // ================================================================
  // EXPORT / IMPORT
  // ================================================================
  document.getElementById('btn-export')?.addEventListener('click', () => {
    closeDrawer();
    const data = Storage.exportAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `rutina-app-backup-${Utils.today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Datos exportados correctamente', 'success');
  });

  document.getElementById('btn-import')?.addEventListener('click', () => {
    closeDrawer();
    document.getElementById('file-import')?.click();
  });

  document.getElementById('file-import')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result);
        Storage.importAll(data);
        showToast('Datos importados. Recargando...', 'success');
        setTimeout(() => location.reload(), 1500);
      } catch (err) {
        showToast('Error al importar: archivo inválido', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // ================================================================
  // NOTIFICATIONS BADGE
  // ================================================================
  function updateNotifBadge() {
    const queue = Storage.getNotifQueue().filter(n => !n.read);
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (queue.length > 0) {
      badge.textContent = queue.length;
      Utils.show(badge);
    } else {
      Utils.hide(badge);
    }
  }

  document.getElementById('btn-notif')?.addEventListener('click', () => {
    const queue = Storage.getNotifQueue();
    queue.forEach(n => n.read = true);
    Storage.saveNotifQueue(queue);
    updateNotifBadge();
    openModal(`
      <h3 style="margin-bottom:16px">Notificaciones</h3>
      ${queue.length === 0
        ? '<p style="color:var(--text-muted);text-align:center;padding:20px">Sin notificaciones</p>'
        : queue.slice(-10).reverse().map(n => `
          <div class="list-item" style="margin-bottom:8px">
            <div class="list-item-body">
              <div class="list-item-title">${Utils.escapeHtml(n.title)}</div>
              <div class="list-item-sub">${Utils.escapeHtml(n.body || '')} · ${n.time || ''}</div>
            </div>
          </div>`).join('')
      }
      <button class="btn btn-ghost btn-full" style="margin-top:12px" onclick="App.clearNotifs()">Borrar todas</button>
    `);
  });

  function clearNotifs() {
    Storage.saveNotifQueue([]);
    updateNotifBadge();
    closeModal();
    showToast('Notificaciones borradas', 'info');
  }

  document.getElementById('btn-notif-setup')?.addEventListener('click', () => {
    closeDrawer();
    Notifications.showSettings();
  });

  // ================================================================
  // DRAWER USER INFO
  // ================================================================
  function updateDrawerUser() {
    const settings = Storage.getSettings();
    const xp = Storage.getXP();
    const level = Math.floor(xp / 100) + 1;
    const u = document.getElementById('drawer-username');
    const l = document.getElementById('drawer-level');
    if (u) u.textContent = settings.userName || 'Usuario';
    if (l) l.textContent = `Nivel ${level} · ${xp} XP`;
  }

  // ================================================================
  // WATER TRACKER (home widget)
  // ================================================================
  function addWaterHome(ml) {
    const today = Utils.today();
    Storage.addWater(today, ml);
    Utils.haptic([10]);
    // Re-render just the water widget
    const waterEl = document.getElementById('water-widget');
    if (waterEl) {
      const waterSettings = Storage.getWaterSettings();
      const goal = waterSettings.goalMl || 2000;
      const current = Storage.getWaterLog(today);
      const pct = Utils.pct(current, goal);
      waterEl.innerHTML = _buildWaterWidget(current, goal, pct);
    }
  }

  function _buildWaterWidget(current, goal, pct) {
    const glasses = Math.round(current / 250);
    return `
      <div style="display:flex;align-items:center;gap:12px">
        <div class="water-icon">💧</div>
        <div class="water-info">
          <div class="water-amount">${current} ml</div>
          <div class="water-goal">objetivo: ${goal} ml · ~${glasses} vasos</div>
          <div class="progress-bar-wrap" style="margin-top:6px">
            <div class="progress-bar-fill ${current >= goal ? 'success' : ''}" style="width:${pct}%;background:var(--info)"></div>
          </div>
        </div>
      </div>
      <div class="water-btns" style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-ghost" style="font-size:0.78rem;padding:6px 10px;flex:1" onclick="App.addWaterHome(150)">+150ml</button>
        <button class="btn btn-ghost" style="font-size:0.78rem;padding:6px 10px;flex:1" onclick="App.addWaterHome(250)">+250ml</button>
        <button class="btn btn-ghost" style="font-size:0.78rem;padding:6px 10px;flex:1" onclick="App.addWaterHome(330)">+330ml</button>
        <button class="btn btn-ghost" style="font-size:0.78rem;padding:6px 10px;flex:1" onclick="App.addWaterHome(500)">+500ml</button>
        ${current > 0 ? `<button class="btn btn-ghost" style="font-size:0.78rem;padding:6px 10px;flex:1;color:var(--danger)" onclick="App.addWaterHome(-250)">−250ml</button>` : ''}
      </div>
    `;
  }

  // ================================================================
  // WEIGHT LOG MODAL (home)
  // ================================================================
  function openWeightModal() {
    const weightLogs = Storage.getWeightLogs();
    const today = Utils.today();
    const todayEntry = weightLogs.find(l => l.date === today);
    const lastEntry = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;
    const prevEntry = weightLogs.length > 1 ? weightLogs[weightLogs.length - 2] : null;
    const diff = lastEntry && prevEntry ? (lastEntry.kg - prevEntry.kg) : null;

    openModal(`
      <h3 style="margin-bottom:16px">⚖️ Peso corporal</h3>
      <div class="input-group" style="margin-bottom:16px">
        <label class="input-label">Peso de hoy (kg)</label>
        <input type="number" id="weight-input" class="input" min="30" max="300" step="0.1"
          value="${todayEntry ? todayEntry.kg : (lastEntry ? lastEntry.kg : '')}"
          placeholder="ej. 75.5" inputmode="decimal" />
      </div>
      ${lastEntry ? `
      <div style="display:flex;gap:12px;margin-bottom:16px">
        <div class="card" style="flex:1;text-align:center;padding:12px">
          <div style="font-size:1.4rem;font-weight:800;color:var(--accent)">${lastEntry.kg} kg</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">último registro</div>
        </div>
        ${diff !== null ? `<div class="card" style="flex:1;text-align:center;padding:12px">
          <div style="font-size:1.4rem;font-weight:800;color:${diff > 0 ? 'var(--danger)' : diff < 0 ? 'var(--success)' : 'var(--text-muted)'}">${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">variación</div>
        </div>` : ''}
      </div>` : ''}
      <button class="btn btn-primary btn-full" onclick="App.saveWeight()">Guardar peso</button>
      ${weightLogs.length >= 2 ? `
      <p class="section-title" style="margin-top:16px">Últimas 10 entradas</p>
      <div style="max-height:160px;overflow-y:auto">
        ${weightLogs.slice(-10).reverse().map(l => `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.85rem">
            <span style="color:var(--text-muted)">${Utils.formatShortDate(l.date)}</span>
            <span style="font-weight:700">${l.kg} kg</span>
          </div>`).join('')}
      </div>` : ''}
    `);
  }

  function saveWeight() {
    const val = parseFloat(document.getElementById('weight-input')?.value);
    if (!val || val < 20 || val > 400) { showToast('Introduce un peso válido', 'error'); return; }
    Storage.addWeightEntry(val, Utils.today());
    closeModal();
    showToast(`Peso registrado: ${val} kg`, 'success');
    Utils.haptic([10, 50, 10]);
    // Refresh home weight card
    const wCard = document.getElementById('weight-widget');
    if (wCard) wCard.outerHTML = _buildWeightWidget();
    GoalsModule?.checkAchievements?.();
  }

  function _buildWeightWidget() {
    const weightLogs = Storage.getWeightLogs();
    const lastEntry = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;
    const prevEntry = weightLogs.length > 1 ? weightLogs[weightLogs.length - 2] : null;
    const diff = lastEntry && prevEntry ? (lastEntry.kg - prevEntry.kg).toFixed(1) : null;
    return `
      <div id="weight-widget" class="card card-clickable" onclick="App.openWeightModal()" style="margin-bottom:10px">
        <div class="card-header">
          <span class="card-title">⚖️ Peso corporal</span>
          ${lastEntry?.date === Utils.today() ? '<span class="badge badge-success">Hoy ✓</span>' : '<span class="badge">Registrar</span>'}
        </div>
        ${lastEntry ? `
          <div style="display:flex;align-items:baseline;gap:8px">
            <span class="weight-current">${lastEntry.kg} kg</span>
            ${diff !== null ? `<span class="${parseFloat(diff) > 0 ? 'weight-change-pos' : parseFloat(diff) < 0 ? 'weight-change-neg' : ''}">${parseFloat(diff) > 0 ? '↑' : parseFloat(diff) < 0 ? '↓' : '→'} ${Math.abs(diff)} kg</span>` : ''}
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">
            ${lastEntry.date === Utils.today() ? 'Registrado hoy' : `Último: ${Utils.formatShortDate(lastEntry.date)}`}
          </div>` : `
          <div style="color:var(--text-muted);font-size:0.9rem">Sin datos — toca para registrar</div>`}
      </div>`;
  }

  // ================================================================
  // HOME VIEW
  // ================================================================
  function renderHome() {
    const settings  = Storage.getSettings();
    const today     = Utils.today();
    const streaks   = Storage.getStreaks();
    const mealDay   = Storage.getMealDay(today);
    const sleepLogs = Storage.getSleepLogs();
    const todaySleep = sleepLogs.find(l => l.date === today);
    const gym       = Storage.getGymRoutines();
    const dayName   = Utils.getDayName(new Date().getDay());
    const todayExercises = gym[dayName] || [];
    const mealSettings  = Storage.getMealSettings();
    const calGoal   = mealSettings.calGoal || 2200;
    const totalKcal = Object.values(mealDay).flat().reduce((s, f) => s + (f.kcal || 0), 0);
    const sleepGoal = Storage.getSleepSettings().goalHours || 8;
    const sleepHours = todaySleep?.hours || 0;
    const xp = Storage.getXP();
    const level = Math.floor(xp / 100) + 1;
    const xpForLevel = (level - 1) * 100;
    const xpNext = level * 100;
    const waterSettings = Storage.getWaterSettings();
    const waterGoal = waterSettings.goalMl || 2000;
    const waterCurrent = Storage.getWaterLog(today);
    const waterPct = Utils.pct(waterCurrent, waterGoal);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

    return `
    <div class="anim-fade-in stagger">

      <div class="greeting">
        <p class="greeting-sub">${greeting},</p>
        <h2 class="greeting-name">${Utils.escapeHtml(settings.userName || 'Usuario')} 👋</h2>
        <p class="greeting-sub" style="margin-top:4px">${Utils.formatDate(today)}</p>
      </div>

      ${streaks.gym > 0 ? `
      <div class="streak-banner anim-fade-in">
        <div class="streak-fire">🔥</div>
        <div>
          <div class="streak-count">${streaks.gym} días</div>
          <div class="streak-label">racha de entrenamiento</div>
        </div>
      </div>` : ''}

      <!-- XP Bar -->
      <div class="xp-bar-container" style="margin-bottom:16px">
        <div class="xp-level">
          <span class="xp-level-num">Nv. ${level}</span>
          <span class="xp-label">${xp} / ${xpNext} XP</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${Utils.pct(xp - xpForLevel, 100)}%;background:var(--goals-color)"></div>
        </div>
      </div>

      <!-- Quick actions -->
      <p class="section-title">Acceso rápido</p>
      <div class="quick-actions">
        <button class="quick-action" onclick="Router.navigate('gym')" style="color:var(--gym-color)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.5 6.5h11M6.5 17.5h11M3 12h18M7 3l-2 4h14l-2-4M7 21l-2-4h14l-2 4"/></svg>
          Gym
        </button>
        <button class="quick-action" onclick="Router.navigate('meals')" style="color:var(--meals-color)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
          Comidas
        </button>
        <button class="quick-action" onclick="Router.navigate('sleep')" style="color:var(--sleep-color)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          Sueño
        </button>
        <button class="quick-action" onclick="Router.navigate('calendar')" style="color:var(--cal-color)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Agenda
        </button>
        <button class="quick-action" onclick="Router.navigate('stats')" style="color:var(--stats-color)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Stats
        </button>
        <button class="quick-action" onclick="Router.navigate('goals')" style="color:var(--goals-color)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          Logros
        </button>
      </div>

      <!-- Summary cards -->
      <p class="section-title">Resumen de hoy</p>
      <div class="dashboard-grid">
        <div class="card card-clickable" onclick="Router.navigate('meals')">
          <div class="card-header"><span class="card-title">🍽️ Calorías</span></div>
          <div class="card-value">${Utils.formatKcal(totalKcal)}</div>
          <div class="card-sub">objetivo: ${Utils.formatKcal(calGoal)} kcal</div>
          <div class="progress-bar-wrap" style="margin-top:10px">
            <div class="progress-bar-fill ${totalKcal > calGoal ? 'warning' : ''}" style="width:${Utils.pct(totalKcal, calGoal)}%"></div>
          </div>
        </div>
        <div class="card card-clickable" onclick="Router.navigate('sleep')">
          <div class="card-header"><span class="card-title">😴 Sueño</span></div>
          <div class="card-value">${sleepHours ? sleepHours + 'h' : '--'}</div>
          <div class="card-sub">objetivo: ${sleepGoal}h</div>
          <div class="progress-bar-wrap" style="margin-top:10px">
            <div class="progress-bar-fill ${sleepHours >= sleepGoal ? 'success' : ''}" style="width:${Utils.pct(sleepHours, sleepGoal)}%"></div>
          </div>
        </div>
        <div class="card card-clickable card-wide" onclick="Router.navigate('gym')">
          <div class="card-header">
            <span class="card-title">💪 Rutina de hoy (${dayName})</span>
            <span class="badge badge-accent">${todayExercises.length} ejercicios</span>
          </div>
          ${todayExercises.length === 0
            ? '<p style="color:var(--text-muted);font-size:0.85rem">Sin rutina asignada para hoy</p>'
            : todayExercises.slice(0, 3).map(ex =>
                `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:0.85rem">
                  <span>${Utils.escapeHtml(ex.name)}</span>
                  <span style="color:var(--text-muted)">${ex.sets}×${ex.reps}</span>
                </div>`
              ).join('') + (todayExercises.length > 3 ? `<p style="color:var(--text-muted);font-size:0.78rem;margin-top:8px">+${todayExercises.length-3} más...</p>` : '')
          }
        </div>
      </div>

      <!-- Water & Weight row -->
      <p class="section-title">Hidratación &amp; peso</p>

      <!-- Water tracker -->
      <div class="card water-card" style="margin-bottom:10px">
        <div class="card-header" style="margin-bottom:8px">
          <span class="card-title">💧 Agua</span>
          <span class="badge" style="${waterCurrent >= waterGoal ? 'background:var(--success-alpha);color:var(--success)' : ''}">
            ${waterCurrent >= waterGoal ? '¡Meta! 🎉' : Math.round((waterGoal - waterCurrent)/1000*10)/10 + 'L restante'}
          </span>
        </div>
        <div id="water-widget">
          ${_buildWaterWidget(waterCurrent, waterGoal, waterPct)}
        </div>
      </div>

      <!-- Weight card -->
      ${_buildWeightWidget()}

    </div>`;
  }

  // ================================================================
  // SETTINGS VIEW
  // ================================================================
  function renderSettings() {
    const settings  = Storage.getSettings();
    const mealSet   = Storage.getMealSettings();
    const sleepSet  = Storage.getSleepSettings();
    const waterSet  = Storage.getWaterSettings();
    const syncConf  = Storage.getSyncConfig();
    const theme     = Storage.get(Storage.KEYS.theme, 'auto');
    const pinOn     = Storage.isPINEnabled();
    const version   = '1.0.0';

    return `
    <div class="anim-fade-in stagger">
      <p class="section-title">PERFIL</p>
      <div class="settings-section">
        <div class="settings-row" onclick="App.editProfileModal()">
          <div class="settings-row-left">
            <div class="settings-row-icon" style="background:var(--accent-alpha)">👤</div>
            <div class="settings-row-info">
              <h4>${Utils.escapeHtml(settings.userName || 'Usuario')}</h4>
              <p>Nombre de usuario</p>
            </div>
          </div>
          <div class="settings-row-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <p class="section-title">OBJETIVOS</p>
      <div class="settings-section">
        <div class="settings-row" onclick="App.editGoalsSettingsModal()">
          <div class="settings-row-left">
            <div class="settings-row-icon" style="background:rgba(255,180,0,0.15)">🎯</div>
            <div class="settings-row-info">
              <h4>Calorías diarias</h4>
              <p>${mealSet.calGoal || 2200} kcal · Proteína: ${mealSet.proteinGoal || 150}g</p>
            </div>
          </div>
          <div class="settings-row-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
        <div class="settings-row" onclick="App.editSleepGoalModal()">
          <div class="settings-row-left">
            <div class="settings-row-icon" style="background:rgba(99,179,237,0.15)">😴</div>
            <div class="settings-row-info">
              <h4>Horas de sueño</h4>
              <p>Objetivo: ${sleepSet.goalHours || 8}h · Dormir: ${sleepSet.targetBedtime || '23:00'}</p>
            </div>
          </div>
          <div class="settings-row-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
        <div class="settings-row" onclick="App.editWaterGoalModal()">
          <div class="settings-row-left">
            <div class="settings-row-icon" style="background:rgba(49,130,206,0.15)">💧</div>
            <div class="settings-row-info">
              <h4>Agua diaria</h4>
              <p>Objetivo: ${(waterSet.goalMl || 2000) / 1000} litros</p>
            </div>
          </div>
          <div class="settings-row-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <p class="section-title">APARIENCIA</p>
      <div class="settings-section">
        <div class="settings-row">
          <div class="settings-row-left">
            <div class="settings-row-icon" style="background:rgba(108,99,255,0.15)">🎨</div>
            <div class="settings-row-info">
              <h4>Tema</h4>
              <p>Actual: ${theme === 'auto' ? 'Automático' : theme === 'dark' ? 'Oscuro' : 'Claro'}</p>
            </div>
          </div>
          <div class="settings-row-right">
            <div style="display:flex;gap:6px">
              ${['dark','light','auto'].map(t => `
                <button class="btn ${theme===t ? 'btn-primary' : 'btn-ghost'}" style="font-size:0.75rem;padding:5px 10px"
                  onclick="App.applyTheme('${t}');Router.navigate('settings')">${t==='dark'?'🌙 Oscuro':t==='light'?'☀️ Claro':'🔄 Auto'}</button>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <p class="section-title">SEGURIDAD</p>
      <div class="settings-section">
        <div class="settings-row" onclick="App.openPINSetup()">
          <div class="settings-row-left">
            <div class="settings-row-icon" style="background:rgba(245,101,101,0.15)">🔒</div>
            <div class="settings-row-info">
              <h4>PIN de bloqueo</h4>
              <p>${pinOn ? '✅ Activado' : 'Sin configurar'}</p>
            </div>
          </div>
          <div class="settings-row-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
        ${pinOn ? `
        <div class="settings-row" onclick="App.editLockTimeModal()">
          <div class="settings-row-left">
            <div class="settings-row-icon" style="background:rgba(245,101,101,0.1)">⏱️</div>
            <div class="settings-row-info">
              <h4>Bloquear después de</h4>
              <p>${settings.lockAfterMins || 5} minutos de inactividad</p>
            </div>
          </div>
          <div class="settings-row-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>` : ''}
      </div>

      <p class="section-title">NOTIFICACIONES</p>
      <div class="settings-section">
        <div class="settings-row" onclick="Notifications.showSettings()">
          <div class="settings-row-left">
            <div class="settings-row-icon" style="background:rgba(56,189,248,0.15)">🔔</div>
            <div class="settings-row-info">
              <h4>Recordatorios</h4>
              <p>Gym, comidas, sueño y más</p>
            </div>
          </div>
          <div class="settings-row-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <p class="section-title">DATOS</p>
      <div class="settings-section">
        <div class="settings-row" onclick="SyncModule.showSyncPanel()">
          <div class="settings-row-left">
            <div class="settings-row-icon" style="background:rgba(72,187,120,0.15)">☁️</div>
            <div class="settings-row-info">
              <h4>Sincronización</h4>
              <p>Exportar, importar, backup</p>
            </div>
          </div>
          <div class="settings-row-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
        <div class="settings-row" onclick="App.exportDataQuick()">
          <div class="settings-row-left">
            <div class="settings-row-icon" style="background:rgba(72,187,120,0.1)">📄</div>
            <div class="settings-row-info">
              <h4>Exportar JSON</h4>
              <p>Copia de seguridad completa</p>
            </div>
          </div>
          <div class="settings-row-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
        <div class="settings-row" onclick="document.getElementById('file-import').click()">
          <div class="settings-row-left">
            <div class="settings-row-icon" style="background:rgba(72,187,120,0.1)">📂</div>
            <div class="settings-row-info">
              <h4>Importar datos</h4>
              <p>Restaurar desde backup JSON</p>
            </div>
          </div>
          <div class="settings-row-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
        <div class="settings-row" onclick="App.confirmClearData()" style="color:var(--danger)">
          <div class="settings-row-left">
            <div class="settings-row-icon" style="background:rgba(245,101,101,0.15)">🗑️</div>
            <div class="settings-row-info">
              <h4 style="color:var(--danger)">Borrar todos los datos</h4>
              <p>Esta acción es irreversible</p>
            </div>
          </div>
          <div class="settings-row-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <p class="section-title">ACERCA DE</p>
      <div class="settings-section">
        <div class="settings-row" style="cursor:default">
          <div class="settings-row-left">
            <div class="settings-row-icon" style="background:var(--accent-alpha)">✨</div>
            <div class="settings-row-info">
              <h4>Rutina App</h4>
              <p>Versión ${version} · PWA</p>
            </div>
          </div>
        </div>
      </div>

      <div style="height:24px"></div>
    </div>`;
  }

  // Settings helpers
  function editProfileModal() {
    const settings = Storage.getSettings();
    openModal(`
      <h3 style="margin-bottom:16px">Editar perfil</h3>
      <div class="input-group" style="margin-bottom:20px">
        <label class="input-label">Tu nombre</label>
        <input type="text" id="set-username" class="input" value="${Utils.escapeHtml(settings.userName || '')}" placeholder="¿Cómo te llamas?" maxlength="30" />
      </div>
      <button class="btn btn-primary btn-full" onclick="App.saveProfileModal()">Guardar</button>
    `);
  }

  function saveProfileModal() {
    const name = document.getElementById('set-username')?.value.trim();
    if (!name) { showToast('Introduce tu nombre', 'error'); return; }
    const settings = Storage.getSettings();
    settings.userName = name;
    Storage.saveSettings(settings);
    closeModal();
    updateDrawerUser();
    showToast('Perfil actualizado', 'success');
    Router.navigate('settings');
  }

  function editGoalsSettingsModal() {
    const mealSet = Storage.getMealSettings();
    openModal(`
      <h3 style="margin-bottom:16px">Objetivos nutricionales</h3>
      <div class="input-group" style="margin-bottom:12px">
        <label class="input-label">Calorías diarias (kcal)</label>
        <input type="number" id="set-cal" class="input" value="${mealSet.calGoal || 2200}" min="1000" max="6000" inputmode="numeric" />
      </div>
      <div class="input-group" style="margin-bottom:12px">
        <label class="input-label">Proteína (g)</label>
        <input type="number" id="set-prot" class="input" value="${mealSet.proteinGoal || 150}" min="30" max="400" inputmode="numeric" />
      </div>
      <div class="input-group" style="margin-bottom:12px">
        <label class="input-label">Carbohidratos (g)</label>
        <input type="number" id="set-carbs" class="input" value="${mealSet.carbsGoal || 250}" min="30" max="600" inputmode="numeric" />
      </div>
      <div class="input-group" style="margin-bottom:20px">
        <label class="input-label">Grasas (g)</label>
        <input type="number" id="set-fat" class="input" value="${mealSet.fatGoal || 70}" min="10" max="300" inputmode="numeric" />
      </div>
      <button class="btn btn-primary btn-full" onclick="App.saveGoalsSettings()">Guardar</button>
    `);
  }

  function saveGoalsSettings() {
    const mealSet = Storage.getMealSettings();
    mealSet.calGoal     = parseInt(document.getElementById('set-cal')?.value) || 2200;
    mealSet.proteinGoal = parseInt(document.getElementById('set-prot')?.value) || 150;
    mealSet.carbsGoal   = parseInt(document.getElementById('set-carbs')?.value) || 250;
    mealSet.fatGoal     = parseInt(document.getElementById('set-fat')?.value) || 70;
    Storage.saveMealSettings(mealSet);
    closeModal();
    showToast('Objetivos guardados', 'success');
    Router.navigate('settings');
  }

  function editSleepGoalModal() {
    const sleepSet = Storage.getSleepSettings();
    openModal(`
      <h3 style="margin-bottom:16px">Objetivos de sueño</h3>
      <div class="input-group" style="margin-bottom:12px">
        <label class="input-label">Horas de sueño objetivo</label>
        <input type="number" id="set-sleep-h" class="input" value="${sleepSet.goalHours || 8}" min="4" max="12" step="0.5" inputmode="decimal" />
      </div>
      <div class="input-group" style="margin-bottom:12px">
        <label class="input-label">Hora de dormir</label>
        <input type="time" id="set-bedtime" class="input" value="${sleepSet.targetBedtime || '23:00'}" />
      </div>
      <div class="input-group" style="margin-bottom:20px">
        <label class="input-label">Hora de despertar</label>
        <input type="time" id="set-wakeup" class="input" value="${sleepSet.targetWakeup || '07:00'}" />
      </div>
      <button class="btn btn-primary btn-full" onclick="App.saveSleepGoalModal()">Guardar</button>
    `);
  }

  function saveSleepGoalModal() {
    const sleepSet = Storage.getSleepSettings();
    sleepSet.goalHours    = parseFloat(document.getElementById('set-sleep-h')?.value) || 8;
    sleepSet.targetBedtime = document.getElementById('set-bedtime')?.value || '23:00';
    sleepSet.targetWakeup  = document.getElementById('set-wakeup')?.value || '07:00';
    Storage.saveSleepSettings(sleepSet);
    closeModal();
    showToast('Objetivos de sueño guardados', 'success');
    Router.navigate('settings');
  }

  function editWaterGoalModal() {
    const waterSet = Storage.getWaterSettings();
    openModal(`
      <h3 style="margin-bottom:16px">Objetivo de agua</h3>
      <div class="input-group" style="margin-bottom:8px">
        <label class="input-label">Litros diarios</label>
        <input type="number" id="set-water" class="input" value="${(waterSet.goalMl || 2000) / 1000}" min="0.5" max="6" step="0.1" inputmode="decimal" />
      </div>
      <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:20px">Recomendación: 2–3 litros/día. Puedes aumentar si haces deporte.</p>
      <button class="btn btn-primary btn-full" onclick="App.saveWaterGoalModal()">Guardar</button>
    `);
  }

  function saveWaterGoalModal() {
    const liters = parseFloat(document.getElementById('set-water')?.value) || 2;
    const waterSet = Storage.getWaterSettings();
    waterSet.goalMl = Math.round(liters * 1000);
    Storage.saveWaterSettings(waterSet);
    closeModal();
    showToast('Objetivo de agua guardado', 'success');
    Router.navigate('settings');
  }

  function editLockTimeModal() {
    const settings = Storage.getSettings();
    openModal(`
      <h3 style="margin-bottom:16px">Tiempo de bloqueo</h3>
      <p style="color:var(--text-muted);margin-bottom:16px;font-size:0.9rem">La app se bloqueará con PIN después de este tiempo de inactividad.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px">
        ${[1, 2, 5, 10, 15, 30].map(mins => `
          <button class="btn ${(settings.lockAfterMins || 5) === mins ? 'btn-primary' : 'btn-secondary'}"
            onclick="App.saveLockTime(${mins})">${mins} min</button>`).join('')}
      </div>
    `);
  }

  function saveLockTime(mins) {
    const settings = Storage.getSettings();
    settings.lockAfterMins = mins;
    Storage.saveSettings(settings);
    closeModal();
    showToast(`Bloqueo tras ${mins} minutos`, 'success');
    Router.navigate('settings');
  }

  function openPINSetup() {
    openModal(`
      <h3>Configurar PIN</h3>
      <p style="color:var(--text-muted);margin:8px 0 20px">El PIN protege el acceso a la app.</p>
      <div class="input-group" style="margin-bottom:12px">
        <label class="input-label">Nuevo PIN (4 dígitos)</label>
        <input type="password" id="pin-new" class="input" maxlength="4" pattern="[0-9]{4}" inputmode="numeric" placeholder="••••" />
      </div>
      <div class="input-group" style="margin-bottom:20px">
        <label class="input-label">Confirmar PIN</label>
        <input type="password" id="pin-confirm" class="input" maxlength="4" pattern="[0-9]{4}" inputmode="numeric" placeholder="••••" />
      </div>
      <button class="btn btn-primary btn-full" onclick="App.savePINSetup()">Guardar PIN</button>
      ${Storage.isPINEnabled() ? '<button class="btn btn-danger btn-full" style="margin-top:8px" onclick="App.removePIN()">Eliminar PIN</button>' : ''}
    `);
  }

  function exportDataQuick() {
    const data = Storage.exportAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `rutina-app-backup-${Utils.today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Datos exportados', 'success');
  }

  function confirmClearData() {
    openModal(`
      <h3 style="color:var(--danger);margin-bottom:12px">⚠️ Borrar todos los datos</h3>
      <p style="color:var(--text-muted);margin-bottom:20px">Esta acción borrará todo: rutinas, comidas, sueño, logros y configuración. Es irreversible.</p>
      <button class="btn btn-danger btn-full" onclick="App.clearAllData()">Sí, borrar todo</button>
      <button class="btn btn-ghost btn-full" style="margin-top:8px" onclick="closeModal()">Cancelar</button>
    `);
  }

  function clearAllData() {
    Storage.clear();
    closeModal();
    showToast('Todos los datos eliminados', 'info');
    setTimeout(() => location.reload(), 1000);
  }

  // ================================================================
  // REGISTER ROUTES
  // ================================================================
  function registerRoutes() {
    Router.register('home',     renderHome);
    Router.register('gym',      GymModule.render,      GymModule.onEnter);
    Router.register('meals',    MealsModule.render,    MealsModule.onEnter);
    Router.register('sleep',    SleepModule.render,    SleepModule.onEnter);
    Router.register('calendar', CalendarModule.render, CalendarModule.onEnter);
    Router.register('stats',    StatsModule.render,    StatsModule.onEnter);
    Router.register('goals',    GoalsModule.render,    GoalsModule.onEnter);
    Router.register('settings', renderSettings);
  }

  // ================================================================
  // INIT
  // ================================================================
  function init() {
    // 1. Aplicar tema guardado
    const savedTheme = Storage.get(Storage.KEYS.theme, 'auto');
    applyTheme(savedTheme);

    // 2. Actualizar info de drawer
    updateDrawerUser();
    updateNotifBadge();

    // 3. Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then(reg => console.log('[App] SW registrado:', reg.scope))
        .catch(err => console.warn('[App] SW error:', err));
    }

    // 4. Mostrar onboarding si es la primera vez
    if (!Storage.get(Storage.KEYS.onboardingDone)) {
      Onboarding.show(() => {
        Storage.set(Storage.KEYS.onboardingDone, true);
        startApp();
      });
    } else {
      startApp();
    }
  }

  function startApp() {
    const shell = document.getElementById('app-shell');
    Utils.show(shell);

    // Verificar bloqueo PIN
    if (Storage.isLocked()) {
      showLockScreen();
    } else {
      Storage.setLastActive();
    }

    // Inicializar módulos
    Notifications.init();
    // Comprobar logros al arrancar (sin notificaciones intrusivas)
    requestAnimationFrame(() => {
      try { GoalsModule.checkAchievements(); } catch(e) {}
    });

    // Registrar rutas y lanzar router
    registerRoutes();
    Router.init();
  }

  // Refrescar home cuando se regrese a ella
  Router.onChange((route) => {
    updateDrawerUser();
    updateNotifBadge();
  });

  // Exponer funciones necesarias
  window.App = {
    savePINSetup, removePIN, clearNotifs, updateDrawerUser, updateNotifBadge, applyTheme,
    // Water / Weight
    addWaterHome, openWeightModal, saveWeight,
    // Settings helpers
    editProfileModal, saveProfileModal,
    editGoalsSettingsModal, saveGoalsSettings,
    editSleepGoalModal, saveSleepGoalModal,
    editWaterGoalModal, saveWaterGoalModal,
    editLockTimeModal, saveLockTime,
    openPINSetup,
    exportDataQuick, confirmClearData, clearAllData,
  };

  // Arrancar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(); clearAllData,
  };

  // Arrancar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
    clearAllData,
  };

  // Arrancar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
