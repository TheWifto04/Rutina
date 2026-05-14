/**
 * GOALS.JS – Módulo de Objetivos y Gamificación
 */

const GoalsModule = (() => {

  const ACHIEVEMENTS = [
    { id:'first_workout',  name:'Primer entreno',   icon:'🏋️', desc:'Registra tu primer entrenamiento',  xp:50,  check: () => Storage.getGymWorkouts().length >= 1 },
    { id:'streak_3',       name:'En racha',          icon:'🔥', desc:'3 días de gym seguidos',            xp:75,  check: () => Storage.getStreaks().gym >= 3 },
    { id:'streak_7',       name:'Semana de fuego',   icon:'🌟', desc:'7 días de gym seguidos',            xp:150, check: () => Storage.getStreaks().gym >= 7 },
    { id:'streak_30',      name:'Atleta del mes',    icon:'🏆', desc:'30 días de gym seguidos',           xp:500, check: () => Storage.getStreaks().gym >= 30 },
    { id:'first_sleep',    name:'Primera noche',     icon:'🌙', desc:'Registra tu primer sueño',          xp:20,  check: () => Storage.getSleepLogs().length >= 1 },
    { id:'sleep_streak_7', name:'Semana de descanso',icon:'💤', desc:'7 noches seguidas bien dormido',    xp:100, check: () => Storage.getStreaks().sleep >= 7 },
    { id:'first_meal',     name:'Primera comida',    icon:'🍽️', desc:'Registra tu primera comida',        xp:20,  check: () => {
      const today = Utils.today();
      return Object.values(Storage.getMealDay(today)).flat().length > 0;
    }},
    { id:'perfect_week',   name:'Semana perfecta',   icon:'✨', desc:'Gym, sueño y comidas en 7 días',   xp:300, check: () => {
      const days = Utils.lastNDays(7);
      const workouts = Storage.getGymWorkouts();
      const logs = Storage.getSleepLogs();
      return days.every(d =>
        workouts.some(w => w.date === d) &&
        logs.find(l => l.date === d)?.hours >= (Storage.getSleepSettings().goalHours || 8)
      );
    }},
    { id:'level_5',        name:'Nivel 5',           icon:'⭐', desc:'Alcanza el nivel 5',                xp:200, check: () => Math.floor(Storage.getXP()/100)+1 >= 5 },
    { id:'level_10',       name:'Nivel 10',          icon:'💎', desc:'Alcanza el nivel 10',               xp:500, check: () => Math.floor(Storage.getXP()/100)+1 >= 10 },
    { id:'workouts_10',    name:'10 entrenamientos', icon:'💪', desc:'Registra 10 entrenamientos',        xp:100, check: () => Storage.getGymWorkouts().length >= 10 },
    { id:'workouts_50',    name:'50 entrenamientos', icon:'🥇', desc:'Registra 50 entrenamientos',        xp:300, check: () => Storage.getGymWorkouts().length >= 50 },
  ];

  let currentTab = 'goals';

  // ================================================================
  // RENDER
  // ================================================================
  function render() {
    return `
    <div id="goals-view" class="anim-fade-in">
      <div class="tabs">
        <button class="tab-btn ${currentTab==='goals'?'active':''}" onclick="GoalsModule.switchTab('goals')">Objetivos</button>
        <button class="tab-btn ${currentTab==='achievements'?'active':''}" onclick="GoalsModule.switchTab('achievements')">Logros</button>
        <button class="tab-btn ${currentTab==='xp'?'active':''}" onclick="GoalsModule.switchTab('xp')">Progreso</button>
      </div>
      <div id="goals-tab-content"></div>
    </div>`;
  }

  function onEnter() { renderTab(); }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('#goals-view .tab-btn').forEach((b,i) => {
      b.classList.toggle('active', ['goals','achievements','xp'][i] === tab);
    });
    renderTab();
  }

  function renderTab() {
    const container = document.getElementById('goals-tab-content');
    if (!container) return;
    if (currentTab === 'goals')        container.innerHTML = renderGoals();
    else if (currentTab === 'achievements') container.innerHTML = renderAchievements();
    else if (currentTab === 'xp')      container.innerHTML = renderXP();
  }

  // ================================================================
  // OBJETIVOS
  // ================================================================
  function renderGoals() {
    const goals    = Storage.getGoals();
    const workouts = Storage.getGymWorkouts();
    const logs     = Storage.getSleepLogs();
    const last7    = Utils.lastNDays(7);

    const gymDone  = last7.filter(d => workouts.some(w => w.date === d)).length;
    const sleepDone = last7.filter(d => {
      const h = logs.find(l => l.date === d)?.hours || 0;
      return h >= goals.sleepHours;
    }).length;
    const calDone  = last7.filter(d => {
      const kcal = Object.values(Storage.getMealDay(d)).flat().reduce((s,f)=>s+(f.kcal||0),0);
      return kcal > 0 && Math.abs(kcal - goals.calGoal) < 300;
    }).length;
    const events   = Storage.getCalEvents();
    const weekStart= Utils.weekStart(Utils.today());
    const eventsThisWeek = events.filter(e => e.date >= weekStart).length;

    return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3>Mis objetivos semanales</h3>
      <button class="btn btn-secondary btn-sm" onclick="GoalsModule.editGoalsModal()">✏️ Editar</button>
    </div>

    <div class="goal-card">
      <div class="goal-header">
        <span class="goal-icon">💪</span>
        <div><div class="goal-title">Días de gym</div><div class="goal-sub">Esta semana</div></div>
      </div>
      <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${Utils.pct(gymDone,goals.gymDays||4)}%"></div></div>
      <div class="goal-footer">
        <span class="goal-pct">${gymDone} / ${goals.gymDays || 4} días</span>
        <span class="badge ${gymDone >= (goals.gymDays||4) ? 'badge-success' : 'badge-accent'}">${Utils.pct(gymDone,goals.gymDays||4)}%</span>
      </div>
    </div>

    <div class="goal-card">
      <div class="goal-header">
        <span class="goal-icon">😴</span>
        <div><div class="goal-title">Sueño objetivo</div><div class="goal-sub">${goals.sleepHours}h/noche</div></div>
      </div>
      <div class="progress-bar-wrap"><div class="progress-bar-fill success" style="width:${Utils.pct(sleepDone,7)}%"></div></div>
      <div class="goal-footer">
        <span class="goal-pct">${sleepDone} / 7 noches cumplidas</span>
        <span class="badge ${sleepDone >= 5 ? 'badge-success' : 'badge-warning'}">${Utils.pct(sleepDone,7)}%</span>
      </div>
    </div>

    <div class="goal-card">
      <div class="goal-header">
        <span class="goal-icon">🍽️</span>
        <div><div class="goal-title">Calorías objetivo</div><div class="goal-sub">${goals.calGoal} kcal/día ±300</div></div>
      </div>
      <div class="progress-bar-wrap"><div class="progress-bar-fill warning" style="width:${Utils.pct(calDone,7)}%"></div></div>
      <div class="goal-footer">
        <span class="goal-pct">${calDone} / 7 días en objetivo</span>
        <span class="badge ${calDone >= 5 ? 'badge-success' : 'badge-warning'}">${Utils.pct(calDone,7)}%</span>
      </div>
    </div>

    <div class="goal-card">
      <div class="goal-header">
        <span class="goal-icon">📅</span>
        <div><div class="goal-title">Eventos por semana</div><div class="goal-sub">Esta semana</div></div>
      </div>
      <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${Utils.pct(eventsThisWeek, goals.eventsPerWeek||5)}%;background:var(--cal-color)"></div></div>
      <div class="goal-footer">
        <span class="goal-pct">${eventsThisWeek} / ${goals.eventsPerWeek || 5} eventos</span>
        <span class="badge badge-info">${Utils.pct(eventsThisWeek, goals.eventsPerWeek||5)}%</span>
      </div>
    </div>`;
  }

  function editGoalsModal() {
    const g = Storage.getGoals();
    openModal(`
      <h3>Editar objetivos</h3>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
        <div class="input-group">
          <label class="input-label">Días de gym por semana</label>
          <input id="g-gym" class="input" type="number" min="1" max="7" value="${g.gymDays||4}" />
        </div>
        <div class="input-group">
          <label class="input-label">Calorías objetivo (kcal/día)</label>
          <input id="g-cal" class="input" type="number" min="800" max="6000" value="${g.calGoal||2200}" />
        </div>
        <div class="input-group">
          <label class="input-label">Horas de sueño (por noche)</label>
          <input id="g-sleep" class="input" type="number" min="4" max="12" step="0.5" value="${g.sleepHours||8}" />
        </div>
        <div class="input-group">
          <label class="input-label">Eventos por semana</label>
          <input id="g-events" class="input" type="number" min="0" max="30" value="${g.eventsPerWeek||5}" />
        </div>
        <button class="btn btn-primary btn-full" onclick="GoalsModule.saveGoals()">Guardar</button>
      </div>
    `);
  }

  function saveGoals() {
    const g = {
      gymDays:       parseInt(document.getElementById('g-gym')?.value) || 4,
      calGoal:       parseInt(document.getElementById('g-cal')?.value) || 2200,
      sleepHours:    parseFloat(document.getElementById('g-sleep')?.value) || 8,
      eventsPerWeek: parseInt(document.getElementById('g-events')?.value) || 5,
    };
    Storage.saveGoals(g);
    closeModal();
    renderTab();
    showToast('Objetivos actualizados', 'success');
  }

  // ================================================================
  // LOGROS
  // ================================================================
  function renderAchievements() {
    const unlocked = Storage.getAchievements();
    const sorted = [...ACHIEVEMENTS].sort((a,b) => (unlocked[b.id]?1:0) - (unlocked[a.id]?1:0));

    return `
    <div style="margin-bottom:16px">
      <p style="color:var(--text-muted);font-size:0.85rem">${Object.keys(unlocked).length} / ${ACHIEVEMENTS.length} logros desbloqueados</p>
      <div class="progress-bar-wrap" style="margin-top:8px">
        <div class="progress-bar-fill" style="width:${Utils.pct(Object.keys(unlocked).length, ACHIEVEMENTS.length)}%"></div>
      </div>
    </div>
    <div class="achievement-grid">
      ${sorted.map(a => {
        const done = !!unlocked[a.id];
        return `
        <div class="achievement-card ${done?'':'locked'}" onclick="GoalsModule.showAchievement('${a.id}')">
          <div class="achievement-icon">${a.icon}</div>
          <div class="achievement-name">${a.name}</div>
          ${done ? `<span class="badge badge-success" style="font-size:0.65rem">+${a.xp} XP</span>` : ''}
        </div>`;
      }).join('')}
    </div>`;
  }

  function showAchievement(id) {
    const a = ACHIEVEMENTS.find(a => a.id === id);
    if (!a) return;
    const unlocked = Storage.getAchievements();
    const done = !!unlocked[id];
    openModal(`
      <div style="text-align:center;padding:8px 0">
        <div style="font-size:3rem;margin-bottom:12px">${a.icon}</div>
        <h2 style="margin-bottom:8px">${a.name}</h2>
        <p style="color:var(--text-muted);margin-bottom:16px">${a.desc}</p>
        ${done
          ? `<span class="badge badge-success">✓ Desbloqueado · +${a.xp} XP</span>`
          : `<span class="badge badge-warning">🔒 Bloqueado · Recompensa: ${a.xp} XP</span>`
        }
      </div>
    `);
  }

  // ================================================================
  // PROGRESO / XP
  // ================================================================
  function renderXP() {
    const xp    = Storage.getXP();
    const level = Math.floor(xp / 100) + 1;
    const xpThisLevel = xp - (level - 1) * 100;
    const xpNext = 100;

    const history = [
      { action:'Entrenamiento registrado', xp:20 },
      { action:'Comida añadida', xp:3 },
      { action:'Sueño registrado', xp:10 },
      { action:'Evento creado', xp:5 },
      { action:'Ejercicio añadido', xp:5 },
      { action:'Logro desbloqueado', xp:'variable' },
    ];

    return `
    <div class="xp-bar-container">
      <div class="xp-level">
        <span class="xp-level-num">Nivel ${level}</span>
        <span class="xp-label">${xp} XP totales</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${Utils.pct(xpThisLevel, xpNext)}%;background:var(--goals-color)"></div>
      </div>
      <div class="xp-info">
        <span>${xpThisLevel} XP en este nivel</span>
        <span>${xpNext - xpThisLevel} XP para Nivel ${level+1}</span>
      </div>
    </div>

    <p class="section-title">Cómo ganar XP</p>
    <div class="card">
      ${history.map(h => `
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:0.88rem">${h.action}</span>
          <span class="badge badge-accent">+${h.xp} XP</span>
        </div>`).join('')}
    </div>`;
  }

  // ================================================================
  // CHECK ACHIEVEMENTS
  // ================================================================
  function checkAchievements() {
    const unlocked = Storage.getAchievements();
    let newUnlocks = false;

    ACHIEVEMENTS.forEach(a => {
      if (unlocked[a.id]) return; // Ya desbloqueado
      try {
        if (a.check()) {
          unlocked[a.id] = { date: Utils.today() };
          Storage.addXP(a.xp);
          newUnlocks = true;
          // Mostrar toast de logro
          setTimeout(() => {
            showToast(`🏆 Logro desbloqueado: "${a.name}" +${a.xp} XP`, 'success', 5000);
            Utils.haptic([50, 30, 50, 30, 100]);
          }, 500);
        }
      } catch (e) {}
    });

    if (newUnlocks) {
      Storage.saveAchievements(unlocked);
      App.updateDrawerUser();
    }
  }

  // ================================================================
  // API PÚBLICA
  // ================================================================
  return {
    render, onEnter,
    switchTab,
    editGoalsModal, saveGoals,
    showAchievement,
    checkAchievements
  };
})();

window.GoalsModule = GoalsModule;
