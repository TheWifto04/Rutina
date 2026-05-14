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
    </div>`;
  }

  // ================================================================
  // REGISTER ROUTES
  // ================================================================
  function registerRoutes() {
    Router.register('home', renderHome);
    Router.register('gym',      GymModule.render,      GymModule.onEnter);
    Router.register('meals',    MealsModule.render,    MealsModule.onEnter);
    Router.register('sleep',    SleepModule.render,    SleepModule.onEnter);
    Router.register('calendar', CalendarModule.render, CalendarModule.onEnter);
    Router.register('stats',    StatsModule.render,    StatsModule.onEnter);
    Router.register('goals',    GoalsModule.render,    GoalsModule.onEnter);
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
  window.App = { savePINSetup, removePIN, clearNotifs, updateDrawerUser, updateNotifBadge, applyTheme };

  // Arrancar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
