/**
 * SLEEP.JS – Módulo de Sueño
 * Registro, estadísticas y objetivos de sueño.
 */

const SleepModule = (() => {

  let currentTab = 'today';

  // ================================================================
  // RENDER
  // ================================================================
  function render() {
    return `
    <div id="sleep-view" class="anim-fade-in">
      <div class="tabs">
        <button class="tab-btn ${currentTab==='today'?'active':''}" onclick="SleepModule.switchTab('today')">Hoy</button>
        <button class="tab-btn ${currentTab==='history'?'active':''}" onclick="SleepModule.switchTab('history')">Historial</button>
        <button class="tab-btn ${currentTab==='stats'?'active':''}" onclick="SleepModule.switchTab('stats')">Stats</button>
        <button class="tab-btn ${currentTab==='settings'?'active':''}" onclick="SleepModule.switchTab('settings')">Config</button>
      </div>
      <div id="sleep-tab-content"></div>
    </div>`;
  }

  function onEnter() { renderTab(); }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('#sleep-view .tab-btn').forEach((b,i) => {
      b.classList.toggle('active', ['today','history','stats','settings'][i] === tab);
    });
    renderTab();
  }

  function renderTab() {
    const container = document.getElementById('sleep-tab-content');
    if (!container) return;
    if (currentTab === 'today')    container.innerHTML = renderToday();
    else if (currentTab === 'history') container.innerHTML = renderHistory();
    else if (currentTab === 'stats')   { container.innerHTML = renderStats(); renderCharts(); }
    else if (currentTab === 'settings') container.innerHTML = renderSettings();
  }

  // ================================================================
  // HOY
  // ================================================================
  function renderToday() {
    const today    = Utils.today();
    const logs     = Storage.getSleepLogs();
    const settings = Storage.getSleepSettings();
    const todayLog = logs.find(l => l.date === today) || null;
    const goalHours = settings.goalHours || 8;

    const hours  = todayLog?.hours || 0;
    const pct    = Utils.pct(hours, goalHours);
    const color  = hours >= goalHours ? '#6bcb77' : hours >= goalHours * 0.8 ? '#ffd93d' : '#ff6b6b';

    // Ring SVG
    const R = 70, C = 2 * Math.PI * R;
    const dash = (pct / 100) * C;
    const ringHTML = `
      <div class="sleep-ring-container">
        <div class="sleep-ring">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="${R}" fill="none" stroke="var(--border)" stroke-width="12"/>
            <circle cx="90" cy="90" r="${R}" fill="none" stroke="${color}"
              stroke-width="12" stroke-linecap="round"
              stroke-dasharray="${dash} ${C}"
              style="transition:stroke-dasharray 0.8s ease"/>
          </svg>
          <div class="sleep-ring-text">
            <div class="sleep-hours">${hours > 0 ? hours : '--'}<span style="font-size:1rem">h</span></div>
            <div class="sleep-label">de ${goalHours}h objetivo</div>
          </div>
        </div>
      </div>`;

    const streaks = Storage.getStreaks();
    const streakBadge = streaks.sleep > 0
      ? `<div style="text-align:center;margin-bottom:12px"><span class="badge badge-success">🌙 ${streaks.sleep} días de racha</span></div>`
      : '';

    const formHTML = `
      <div class="card" style="margin-top:4px">
        <h3 style="margin-bottom:16px">${todayLog ? 'Registro de hoy' : 'Registrar sueño'}</h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="input-group">
            <label class="input-label">Me dormí a las</label>
            <input id="sleep-start" type="time" class="input" value="${todayLog?.bedtime || settings.targetBedtime || '23:00'}" />
          </div>
          <div class="input-group">
            <label class="input-label">Me desperté a las</label>
            <input id="sleep-end" type="time" class="input" value="${todayLog?.wakeup || settings.targetWakeup || '07:00'}" />
          </div>
          <div class="input-group">
            <label class="input-label">Calidad del sueño</label>
            <select id="sleep-quality" class="input select">
              <option value="5" ${todayLog?.quality===5?'selected':''}>⭐⭐⭐⭐⭐ Excelente</option>
              <option value="4" ${todayLog?.quality===4?'selected':''}>⭐⭐⭐⭐ Bueno</option>
              <option value="3" ${todayLog?.quality===3?'selected':''}>⭐⭐⭐ Regular</option>
              <option value="2" ${todayLog?.quality===2?'selected':''}>⭐⭐ Malo</option>
              <option value="1" ${todayLog?.quality===1?'selected':''}>⭐ Muy malo</option>
            </select>
          </div>
          <button class="btn btn-primary btn-full" onclick="SleepModule.saveTodaySleep()">
            ${todayLog ? '📝 Actualizar' : '💾 Guardar'}
          </button>
          ${todayLog ? `<button class="btn btn-danger btn-sm btn-full" onclick="SleepModule.deleteTodaySleep()">Eliminar registro</button>` : ''}
        </div>
      </div>

      <!-- Objetivos del día -->
      <div class="card" style="margin-top:10px">
        <h4 style="margin-bottom:10px">Horario objetivo</h4>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div class="time-picker-row">
            <div>
              <div class="time-picker-label">Hora de dormir</div>
              <div class="time-picker-val">${settings.targetBedtime || '23:00'}</div>
            </div>
            <span class="badge ${_isOnTime(settings.targetBedtime, todayLog?.bedtime) ? 'badge-success' : 'badge-warning'}">
              ${todayLog ? (_isOnTime(settings.targetBedtime, todayLog.bedtime) ? '✓ A tiempo' : 'Tarde') : 'Objetivo'}
            </span>
          </div>
          <div class="time-picker-row">
            <div>
              <div class="time-picker-label">Hora de levantarse</div>
              <div class="time-picker-val">${settings.targetWakeup || '07:00'}</div>
            </div>
            <span class="badge ${_isOnTime(todayLog?.wakeup, settings.targetWakeup, true) ? 'badge-success' : 'badge-warning'}">
              ${todayLog ? (_isOnTime(todayLog.wakeup, settings.targetWakeup, true) ? '✓ A tiempo' : 'Tarde') : 'Objetivo'}
            </span>
          </div>
        </div>
      </div>`;

    return ringHTML + streakBadge + formHTML;
  }

  function _isOnTime(actual, target, wakeup = false) {
    if (!actual || !target) return false;
    const a = Utils.hhmmToMins(actual);
    const t = Utils.hhmmToMins(target);
    return wakeup ? (a <= t + 30) : (a <= t + 15);
  }

  // ================================================================
  // HISTORIAL
  // ================================================================
  function renderHistory() {
    const logs = Storage.getSleepLogs().slice().reverse();
    if (logs.length === 0) return `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        <h3>Sin registros</h3><p>Registra tu primer noche de sueño</p>
      </div>`;

    const qualityEmoji = q => ['','⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'][q] || '';

    return `<div class="item-list stagger">` +
      logs.slice(0, 30).map(log => {
        const settings = Storage.getSleepSettings();
        const goal = settings.goalHours || 8;
        const ok   = log.hours >= goal;
        return `
        <div class="list-item">
          <div class="list-item-icon" style="background:var(--sleep-color);background:rgba(107,203,119,0.15);color:var(--sleep-color)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </div>
          <div class="list-item-body">
            <div class="list-item-title">${Utils.formatShortDate(log.date)}</div>
            <div class="list-item-sub">${log.bedtime || '--'} → ${log.wakeup || '--'} · ${qualityEmoji(log.quality)}</div>
          </div>
          <span class="badge ${ok ? 'badge-success' : 'badge-warning'}">${log.hours}h</span>
        </div>`;
      }).join('') + '</div>';
  }

  // ================================================================
  // ESTADÍSTICAS
  // ================================================================
  function renderStats() {
    const logs    = Storage.getSleepLogs();
    const last7   = Utils.lastNDays(7);
    const week    = last7.map(d => logs.find(l => l.date === d)?.hours || 0);
    const avgWeek = Utils.avg(week.filter(h => h > 0));
    const settings= Storage.getSleepSettings();
    const goal    = settings.goalHours || 8;
    const metGoal = logs.filter(l => l.hours >= goal).length;
    const consist = logs.length > 0 ? Utils.pct(metGoal, logs.length) : 0;

    return `
    <div class="dashboard-grid" style="margin-bottom:16px">
      <div class="card"><div class="card-header"><span class="card-title">Promedio semana</span></div>
        <div class="card-value">${avgWeek || '--'}h</div><div class="card-sub">de ${goal}h objetivo</div></div>
      <div class="card"><div class="card-header"><span class="card-title">Consistencia</span></div>
        <div class="card-value">${consist}%</div><div class="card-sub">noches con objetivo cumplido</div></div>
      <div class="card card-wide"><div class="card-header"><span class="card-title">Total registros</span></div>
        <div class="card-value">${logs.length}</div><div class="card-sub">noches registradas</div></div>
    </div>
    <div class="chart-container">
      <p class="chart-title">Horas de sueño – últimas 2 semanas</p>
      <canvas id="sleep-chart" style="width:100%;height:140px"></canvas>
    </div>`;
  }

  function renderCharts() {
    const canvas = document.getElementById('sleep-chart');
    if (!canvas) return;
    const logs = Storage.getSleepLogs();
    const days = Utils.lastNDays(14);
    const data = days.map(d => {
      const log = logs.find(l => l.date === d);
      return log?.hours || 0;
    });
    const labels = days.map(d => Utils.getDayShort(new Date(d+'T00:00:00').getDay()));
    Utils.drawLineChart(canvas, data, labels, { color:'#6bcb77', fillColor:'rgba(107,203,119,0.15)' });
  }

  // ================================================================
  // CONFIGURACIÓN
  // ================================================================
  function renderSettings() {
    const s = Storage.getSleepSettings();
    return `
    <div class="card">
      <h3 style="margin-bottom:16px">Configuración de sueño</h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="input-group">
          <label class="input-label">Horas de sueño objetivo</label>
          <input id="ss-goal" class="input" type="number" min="4" max="12" step="0.5" value="${s.goalHours}" />
        </div>
        <div class="input-group">
          <label class="input-label">Hora de dormir objetivo</label>
          <input id="ss-bed" class="input" type="time" value="${s.targetBedtime}" />
        </div>
        <div class="input-group">
          <label class="input-label">Hora de levantarse objetivo</label>
          <input id="ss-wake" class="input" type="time" value="${s.targetWakeup}" />
        </div>
        <button class="btn btn-primary btn-full" onclick="SleepModule.saveSleepConfig()">Guardar</button>
      </div>
    </div>`;
  }

  // ================================================================
  // ACCIONES
  // ================================================================
  function saveTodaySleep() {
    const today   = Utils.today();
    const bedtime = document.getElementById('sleep-start')?.value;
    const wakeup  = document.getElementById('sleep-end')?.value;
    const quality = parseInt(document.getElementById('sleep-quality')?.value) || 3;

    if (!bedtime || !wakeup) { showToast('Completa las horas', 'error'); return; }
    const hours = Utils.round(Utils.hoursBetween(bedtime, wakeup));

    const logs = Storage.getSleepLogs();
    const idx  = logs.findIndex(l => l.date === today);
    const log  = { id: Utils.uid(), date: today, bedtime, wakeup, hours, quality };
    if (idx >= 0) logs[idx] = { ...logs[idx], ...log };
    else logs.push(log);

    Storage.saveSleepLogs(logs);
    _updateSleepStreak(today, hours);
    Storage.addXP(10);
    renderTab();
    showToast(`Sueño registrado: ${hours}h`, 'success');
    Utils.haptic([20]);
    App.updateDrawerUser();
  }

  function deleteTodaySleep() {
    const today = Utils.today();
    const logs  = Storage.getSleepLogs().filter(l => l.date !== today);
    Storage.saveSleepLogs(logs);
    renderTab();
    showToast('Registro eliminado', 'info');
  }

  function _updateSleepStreak(today, hours) {
    const settings = Storage.getSleepSettings();
    const streaks  = Storage.getStreaks();
    const yesterday = new Date(today + 'T00:00:00');
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);

    if (hours >= settings.goalHours) {
      if (streaks.lastSleepDate === yStr || streaks.lastSleepDate === today) {
        if (streaks.lastSleepDate !== today) streaks.sleep++;
      } else {
        streaks.sleep = 1;
      }
    }
    streaks.lastSleepDate = today;
    Storage.saveStreaks(streaks);
    GoalsModule.checkAchievements();
  }

  function saveSleepConfig() {
    const s = {
      goalHours:    parseFloat(document.getElementById('ss-goal')?.value)  || 8,
      targetBedtime:document.getElementById('ss-bed')?.value  || '23:00',
      targetWakeup: document.getElementById('ss-wake')?.value || '07:00',
    };
    Storage.saveSleepSettings(s);
    showToast('Configuración guardada', 'success');
    renderTab();
  }

  // ================================================================
  // API PÚBLICA
  // ================================================================
  return {
    render, onEnter,
    switchTab,
    saveTodaySleep, deleteTodaySleep,
    saveSleepConfig
  };
})();

window.SleepModule = SleepModule;
