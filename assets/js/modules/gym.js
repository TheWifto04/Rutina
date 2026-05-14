/**
 * GYM.JS – Módulo de Gimnasio
 * Gestiona rutinas, ejercicios, temporizador, historial y estadísticas.
 */

const GymModule = (() => {

  const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  let selectedDay = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  let timerInterval = null;
  let timerSeconds  = 0;
  let timerRunning  = false;
  let currentTab    = 'routine'; // 'routine' | 'history' | 'stats'

  // ================================================================
  // RENDER
  // ================================================================
  function render() {
    return `
    <div id="gym-view" class="anim-fade-in">
      <div class="tabs">
        <button class="tab-btn ${currentTab==='routine'?'active':''}" onclick="GymModule.switchTab('routine')">Rutina</button>
        <button class="tab-btn ${currentTab==='history'?'active':''}" onclick="GymModule.switchTab('history')">Historial</button>
        <button class="tab-btn ${currentTab==='stats'?'active':''}" onclick="GymModule.switchTab('stats')">Stats</button>
      </div>
      <div id="gym-tab-content"></div>
    </div>`;
  }

  function onEnter() {
    renderTab();
  }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('#gym-view .tab-btn').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase().includes(tab)));
    renderTab();
  }

  function renderTab() {
    const container = document.getElementById('gym-tab-content');
    if (!container) return;
    if (currentTab === 'routine')  container.innerHTML = renderRoutine();
    else if (currentTab === 'history') container.innerHTML = renderHistory();
    else if (currentTab === 'stats')   { container.innerHTML = renderStats(); renderStatsCharts(); }
  }

  // ================================================================
  // RUTINA DEL DÍA
  // ================================================================
  function renderRoutine() {
    const routines   = Storage.getGymRoutines();
    const exercises  = routines[selectedDay] || [];
    const todayStr   = Utils.today();

    const daySelectorHTML = DAYS.map(day => {
      const hasWorkout = (routines[day] || []).length > 0;
      return `<button class="day-btn ${day === selectedDay ? 'active' : ''} ${hasWorkout ? 'has-workout' : ''}"
        onclick="GymModule.selectDay('${day}')">
        <span class="day-short">${day.slice(0,2)}</span>
      </button>`;
    }).join('');

    const exercisesHTML = exercises.length === 0
      ? `<div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.5 6.5h11M6.5 17.5h11M3 12h18M7 3l-2 4h14l-2-4M7 21l-2-4h14l-2 4"/></svg>
          <h3>Sin ejercicios</h3>
          <p>Añade ejercicios a tu rutina del ${selectedDay}</p>
        </div>`
      : exercises.map((ex, i) => renderExerciseCard(ex, i)).join('');

    return `
      <div class="day-selector">${daySelectorHTML}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3>${selectedDay}</h3>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="GymModule.showTemplates()">📋 Plantillas</button>
          <button class="btn btn-primary btn-sm" onclick="GymModule.addExerciseModal()">+ Añadir</button>
        </div>
      </div>
      <div id="exercises-list" class="stagger">${exercisesHTML}</div>

      ${exercises.length > 0 ? `
      <button class="btn btn-primary btn-full" style="margin-top:16px" onclick="GymModule.logWorkout()">
        ✅ Registrar entrenamiento de hoy
      </button>` : ''}

      <!-- Temporizador de descanso -->
      <p class="section-title">Temporizador de descanso</p>
      <div class="rest-timer card" id="rest-timer-card">
        <p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:8px">Descanso entre series</p>
        <div class="timer-display" id="timer-display">01:30</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="GymModule.setTimer(60)">1min</button>
          <button class="btn btn-secondary btn-sm" onclick="GymModule.setTimer(90)">1:30</button>
          <button class="btn btn-secondary btn-sm" onclick="GymModule.setTimer(120)">2min</button>
          <button class="btn btn-secondary btn-sm" onclick="GymModule.setTimer(180)">3min</button>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:10px">
          <button class="btn btn-primary" onclick="GymModule.toggleTimer()" id="timer-btn">▶ Iniciar</button>
          <button class="btn btn-ghost" onclick="GymModule.resetTimer()">↺ Reset</button>
        </div>
      </div>`;
  }

  function renderExerciseCard(ex, i) {
    const setsHTML = Array.from({length: ex.sets}, (_, s) =>
      `<span class="set-tag">${s+1}: ${ex.reps} reps${ex.weight ? ' · '+ex.weight+'kg' : ''}</span>`
    ).join('');
    return `
    <div class="exercise-card anim-fade-in" draggable="true" data-index="${i}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div class="exercise-name">${Utils.escapeHtml(ex.name)}</div>
        <div style="display:flex;gap:4px">
          <button class="icon-btn" onclick="GymModule.editExercise(${i})" aria-label="Editar" style="width:30px;height:30px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn" onclick="GymModule.deleteExercise(${i})" aria-label="Eliminar" style="width:30px;height:30px;color:var(--danger)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:8px;font-size:0.82rem;color:var(--text-muted)">
        <span>📊 ${ex.sets} series</span>
        <span>🔁 ${ex.reps} reps</span>
        ${ex.weight ? `<span>🏋️ ${ex.weight}kg</span>` : ''}
      </div>
      ${ex.notes ? `<p style="font-size:0.78rem;color:var(--text-muted);font-style:italic">${Utils.escapeHtml(ex.notes)}</p>` : ''}
      <div class="exercise-sets" style="margin-top:8px">${setsHTML}</div>
    </div>`;
  }

  // ================================================================
  // HISTORIAL
  // ================================================================
  function renderHistory() {
    const workouts = Storage.getGymWorkouts().slice().reverse();
    if (workouts.length === 0) return `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <h3>Sin entrenamientos</h3><p>Registra tu primer entrenamiento</p>
      </div>`;

    return `<div class="item-list stagger">` +
      workouts.slice(0, 20).map(w => {
        const vol = w.exercises?.reduce((s, ex) => s + (ex.sets * ex.reps * (ex.weight || 0)), 0) || 0;
        return `
        <div class="list-item card-clickable" onclick="GymModule.showWorkoutDetail('${w.id}')">
          <div class="list-item-icon" style="background:var(--gym-color);background:rgba(255,107,107,0.15);color:var(--gym-color)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><path d="M6.5 6.5h11M6.5 17.5h11M3 12h18"/></svg>
          </div>
          <div class="list-item-body">
            <div class="list-item-title">${Utils.escapeHtml(w.day)} – ${Utils.formatShortDate(w.date)}</div>
            <div class="list-item-sub">${w.exercises?.length || 0} ejercicios · ${vol > 0 ? Utils.formatWeight(vol)+' volumen total' : 'Sin peso registrado'}</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--text-muted)"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`;
      }).join('') + '</div>';
  }

  // ================================================================
  // ESTADÍSTICAS
  // ================================================================
  function renderStats() {
    const workouts = Storage.getGymWorkouts();
    const last7 = Utils.lastNDays(7);
    const trainedDays = last7.filter(d => workouts.some(w => w.date === d)).length;
    const totalVol = workouts.reduce((s, w) =>
      s + (w.exercises||[]).reduce((sv, ex) => sv + ex.sets * ex.reps * (ex.weight||0), 0), 0);

    return `
    <div class="dashboard-grid" style="margin-bottom:16px">
      <div class="card"><div class="card-header"><span class="card-title">Esta semana</span></div>
        <div class="card-value">${trainedDays}</div><div class="card-sub">días entrenados</div></div>
      <div class="card"><div class="card-header"><span class="card-title">Volumen total</span></div>
        <div class="card-value">${Math.round(totalVol/1000)}t</div><div class="card-sub">toneladas levantadas</div></div>
      <div class="card card-wide"><div class="card-header"><span class="card-title">Total entrenamientos</span></div>
        <div class="card-value">${workouts.length}</div><div class="card-sub">sesiones registradas</div></div>
    </div>
    <div class="chart-container">
      <p class="chart-title">Entrenamientos – últimas 2 semanas</p>
      <canvas id="gym-chart" style="width:100%;height:140px"></canvas>
    </div>`;
  }

  function renderStatsCharts() {
    const canvas = document.getElementById('gym-chart');
    if (!canvas) return;
    const workouts = Storage.getGymWorkouts();
    const days = Utils.lastNDays(14);
    const data   = days.map(d => workouts.filter(w => w.date === d).length);
    const labels = days.map(d => Utils.formatShortDate(d).split(' ')[0]);
    Utils.drawBarChart(canvas, data, labels, { color: '#ff6b6b', bgColor: 'rgba(255,107,107,0.1)' });
  }

  // ================================================================
  // ACCIONES
  // ================================================================
  function selectDay(day) {
    selectedDay = day;
    const container = document.getElementById('gym-tab-content');
    if (container) container.innerHTML = renderRoutine();
  }

  function addExerciseModal(editIndex = -1) {
    const routines  = Storage.getGymRoutines();
    const exercises = routines[selectedDay] || [];
    const ex = editIndex >= 0 ? exercises[editIndex] : { name:'', sets:3, reps:10, weight:'', notes:'' };

    openModal(`
      <h3>${editIndex >= 0 ? 'Editar' : 'Añadir'} ejercicio</h3>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
        <div class="input-group">
          <label class="input-label">Nombre del ejercicio *</label>
          <input id="ex-name" class="input" type="text" value="${Utils.escapeHtml(ex.name)}" placeholder="Ej: Press de banca" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="input-group">
            <label class="input-label">Series</label>
            <input id="ex-sets" class="input" type="number" min="1" max="20" value="${ex.sets}" />
          </div>
          <div class="input-group">
            <label class="input-label">Repeticiones</label>
            <input id="ex-reps" class="input" type="number" min="1" max="100" value="${ex.reps}" />
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">Peso (kg) – opcional</label>
          <input id="ex-weight" class="input" type="number" min="0" step="0.5" value="${ex.weight || ''}" placeholder="0" />
        </div>
        <div class="input-group">
          <label class="input-label">Notas – opcional</label>
          <input id="ex-notes" class="input" type="text" value="${Utils.escapeHtml(ex.notes||'')}" placeholder="Técnica, variante..." />
        </div>
        <button class="btn btn-primary btn-full" onclick="GymModule.saveExercise(${editIndex})">
          ${editIndex >= 0 ? 'Actualizar' : 'Añadir'} ejercicio
        </button>
      </div>
    `);
  }

  function saveExercise(editIndex) {
    const name   = document.getElementById('ex-name')?.value.trim();
    const sets   = parseInt(document.getElementById('ex-sets')?.value) || 3;
    const reps   = parseInt(document.getElementById('ex-reps')?.value) || 10;
    const weight = parseFloat(document.getElementById('ex-weight')?.value) || 0;
    const notes  = document.getElementById('ex-notes')?.value.trim();

    if (!name) { showToast('El nombre es obligatorio', 'error'); return; }

    const routines  = Storage.getGymRoutines();
    if (!routines[selectedDay]) routines[selectedDay] = [];
    const ex = { id: Utils.uid(), name, sets, reps, weight: weight || '', notes };

    if (editIndex >= 0) routines[selectedDay][editIndex] = ex;
    else routines[selectedDay].push(ex);

    Storage.saveGymRoutines(routines);
    Storage.addXP(5);
    closeModal();
    renderTab();
    showToast(editIndex >= 0 ? 'Ejercicio actualizado' : 'Ejercicio añadido', 'success');
    Utils.haptic([20]);
  }

  function editExercise(i) { addExerciseModal(i); }

  function deleteExercise(i) {
    const routines = Storage.getGymRoutines();
    routines[selectedDay].splice(i, 1);
    Storage.saveGymRoutines(routines);
    renderTab();
    showToast('Ejercicio eliminado', 'info');
    Utils.haptic([15]);
  }

  function logWorkout() {
    const routines  = Storage.getGymRoutines();
    const exercises = routines[selectedDay] || [];
    if (exercises.length === 0) { showToast('No hay ejercicios en esta rutina', 'warning'); return; }

    const workouts = Storage.getGymWorkouts();
    const today    = Utils.today();
    // Evitar duplicados del mismo día
    const already  = workouts.find(w => w.date === today && w.day === selectedDay);
    if (already) { showToast('Ya registraste este entrenamiento hoy', 'warning'); return; }

    const workout = { id: Utils.uid(), date: today, day: selectedDay, exercises: JSON.parse(JSON.stringify(exercises)) };
    workouts.push(workout);
    Storage.saveGymWorkouts(workouts);

    // Actualizar racha
    _updateGymStreak(today);
    Storage.addXP(20);
    showToast('¡Entrenamiento registrado! +20 XP 🔥', 'success');
    Utils.haptic([30, 20, 30]);
    App.updateDrawerUser();
  }

  function _updateGymStreak(today) {
    const streaks = Storage.getStreaks();
    const yesterday = new Date(today + 'T00:00:00');
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);

    if (streaks.lastGymDate === yStr || streaks.lastGymDate === today) {
      if (streaks.lastGymDate !== today) streaks.gym++;
    } else {
      streaks.gym = 1;
    }
    streaks.lastGymDate = today;
    Storage.saveStreaks(streaks);
    GoalsModule.checkAchievements();
  }

  function showWorkoutDetail(id) {
    const workouts = Storage.getGymWorkouts();
    const w = workouts.find(w => w.id === id);
    if (!w) return;
    const vol = w.exercises?.reduce((s, ex) => s + (ex.sets * ex.reps * (ex.weight || 0)), 0) || 0;
    openModal(`
      <h3>${w.day} – ${Utils.formatShortDate(w.date)}</h3>
      <p style="color:var(--text-muted);font-size:0.82rem;margin-bottom:16px">Volumen total: ${Utils.formatWeight(vol)}</p>
      <div class="item-list">
        ${w.exercises.map(ex => `
          <div class="exercise-card" style="margin-bottom:8px">
            <div class="exercise-name">${Utils.escapeHtml(ex.name)}</div>
            <div style="font-size:0.82rem;color:var(--text-muted)">${ex.sets}×${ex.reps}${ex.weight ? ' · '+ex.weight+'kg' : ''}</div>
          </div>`).join('')}
      </div>
      <button class="btn btn-danger btn-sm" style="margin-top:12px" onclick="GymModule.deleteWorkout('${id}')">
        Eliminar registro
      </button>
    `);
  }

  function deleteWorkout(id) {
    const workouts = Storage.getGymWorkouts().filter(w => w.id !== id);
    Storage.saveGymWorkouts(workouts);
    closeModal();
    renderTab();
    showToast('Entrenamiento eliminado', 'info');
  }

  // ================================================================
  // PLANTILLAS
  // ================================================================
  function showTemplates() {
    const templates = Storage.getGymTemplates();
    const defaults  = getDefaultTemplates();
    const all       = [...defaults, ...templates];

    openModal(`
      <h3>Plantillas de rutina</h3>
      <p style="color:var(--text-muted);font-size:0.82rem;margin-bottom:16px">Aplica una plantilla al día actual (${selectedDay})</p>
      <div class="item-list">
        ${all.map((t, i) => `
          <div class="list-item">
            <div class="list-item-body">
              <div class="list-item-title">${Utils.escapeHtml(t.name)}</div>
              <div class="list-item-sub">${t.exercises.length} ejercicios</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="GymModule.applyTemplate(${i}, ${JSON.stringify(all).split('"').join('&quot;')})">
              Aplicar
            </button>
          </div>`).join('')}
      </div>
    `);
  }

  function applyTemplate(i, allTemplates) {
    const template = typeof allTemplates === 'string' ? JSON.parse(allTemplates.split('&quot;').join('"')) : allTemplates;
    const t = template[i];
    if (!t) return;
    const routines = Storage.getGymRoutines();
    routines[selectedDay] = t.exercises.map(ex => ({ ...ex, id: Utils.uid() }));
    Storage.saveGymRoutines(routines);
    closeModal();
    renderTab();
    showToast(`Plantilla "${t.name}" aplicada al ${selectedDay}`, 'success');
  }

  function getDefaultTemplates() {
    return [
      { name: 'Pecho + Tríceps', exercises: [
        { name:'Press de banca', sets:4, reps:8, weight:60, notes:'' },
        { name:'Press inclinado', sets:3, reps:10, weight:50, notes:'' },
        { name:'Aperturas', sets:3, reps:12, weight:14, notes:'' },
        { name:'Fondos', sets:3, reps:12, weight:0, notes:'' },
        { name:'Extensiones de tríceps', sets:3, reps:15, weight:25, notes:'' },
      ]},
      { name: 'Espalda + Bíceps', exercises: [
        { name:'Peso muerto', sets:4, reps:5, weight:80, notes:'' },
        { name:'Dominadas', sets:4, reps:8, weight:0, notes:'' },
        { name:'Remo con barra', sets:3, reps:10, weight:60, notes:'' },
        { name:'Curl de bíceps', sets:3, reps:12, weight:16, notes:'' },
      ]},
      { name: 'Pierna', exercises: [
        { name:'Sentadilla', sets:4, reps:8, weight:80, notes:'' },
        { name:'Prensa', sets:3, reps:12, weight:120, notes:'' },
        { name:'Extensiones de cuádriceps', sets:3, reps:15, weight:40, notes:'' },
        { name:'Curl femoral', sets:3, reps:12, weight:30, notes:'' },
        { name:'Gemelos de pie', sets:4, reps:20, weight:50, notes:'' },
      ]},
      { name: 'Push (Empuje)', exercises: [
        { name:'Press militar', sets:4, reps:8, weight:50, notes:'' },
        { name:'Elevaciones laterales', sets:3, reps:15, weight:10, notes:'' },
        { name:'Press de banca', sets:3, reps:10, weight:70, notes:'' },
        { name:'Fondos', sets:3, reps:12, weight:0, notes:'' },
      ]},
    ];
  }

  // ================================================================
  // TEMPORIZADOR
  // ================================================================
  function setTimer(secs) {
    if (timerRunning) { clearInterval(timerInterval); timerRunning = false; }
    timerSeconds = secs;
    updateTimerDisplay();
    document.getElementById('timer-btn').textContent = '▶ Iniciar';
  }

  function toggleTimer() {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('timer-btn').textContent = '▶ Reanudar';
    } else {
      timerRunning = true;
      document.getElementById('timer-btn').textContent = '⏸ Pausar';
      timerInterval = setInterval(() => {
        if (timerSeconds <= 0) {
          clearInterval(timerInterval);
          timerRunning = false;
          document.getElementById('timer-btn').textContent = '▶ Iniciar';
          showToast('⏱️ ¡Descanso terminado!', 'info');
          Utils.haptic([100, 50, 100, 50, 100]);
          // Notificación si está habilitada
          if (Notification.permission === 'granted') {
            new Notification('Rutina App', { body: '¡Descanso terminado! Vuelve a entrenar 💪' });
          }
        } else {
          timerSeconds--;
          updateTimerDisplay();
        }
      }, 1000);
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = 90;
    updateTimerDisplay();
    document.getElementById('timer-btn').textContent = '▶ Iniciar';
  }

  function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    if (display) display.textContent = Utils.minsToHHMM(Math.ceil(timerSeconds / 60)).replace(/^0/, '') || `0:${String(timerSeconds).padStart(2,'0')}`;
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    if (display) display.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }

  // ================================================================
  // API PÚBLICA
  // ================================================================
  return {
    render, onEnter,
    switchTab,
    selectDay,
    addExerciseModal, saveExercise, editExercise, deleteExercise,
    logWorkout, showWorkoutDetail, deleteWorkout,
    showTemplates, applyTemplate,
    setTimer, toggleTimer, resetTimer
  };
})();

window.GymModule = GymModule;
