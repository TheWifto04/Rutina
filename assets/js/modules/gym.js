/**
 * GYM.JS – Módulo de Gimnasio v2
 * Con biblioteca de 60+ ejercicios por grupo muscular.
 */

const GymModule = (() => {

  const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  let selectedDay   = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  let timerInterval = null;
  let timerSeconds  = 90;
  let timerRunning  = false;
  let currentTab    = 'routine';
  let libFilter     = 'Todo';

  // ================================================================
  // BIBLIOTECA DE EJERCICIOS (60+)
  // ================================================================
  const EXERCISE_LIBRARY = [
    // ── PECHO ──
    { name:'Press de banca plano',       muscle:'Pecho',  eq:'Barra',    sets:4, reps:8,  desc:'Ejercicio rey de pecho. Agarre ligeramente más ancho que hombros.' },
    { name:'Press de banca inclinado',   muscle:'Pecho',  eq:'Barra',    sets:3, reps:10, desc:'Trabaja la parte superior del pecho.' },
    { name:'Press de banca declinado',   muscle:'Pecho',  eq:'Barra',    sets:3, reps:10, desc:'Trabaja la parte inferior del pecho.' },
    { name:'Press con mancuernas plano', muscle:'Pecho',  eq:'Mancuerna',sets:3, reps:12, desc:'Mayor rango de movimiento que la barra.' },
    { name:'Aperturas con mancuernas',   muscle:'Pecho',  eq:'Mancuerna',sets:3, reps:12, desc:'Estiramiento profundo del pecho.' },
    { name:'Fondos en paralelas',        muscle:'Pecho',  eq:'Peso corp.',sets:3, reps:12, desc:'Inclínate hacia adelante para enfatizar el pecho.' },
    { name:'Pullover con mancuerna',     muscle:'Pecho',  eq:'Mancuerna',sets:3, reps:12, desc:'Trabaja pecho y serrato anterior.' },
    { name:'Crossover en polea',         muscle:'Pecho',  eq:'Polea',    sets:3, reps:15, desc:'Aislamiento de pecho en todas las porciones.' },
    { name:'Push-up / Flexión',          muscle:'Pecho',  eq:'Peso corp.',sets:4, reps:15, desc:'Clásica con manos a anchura de hombros.' },
    { name:'Push-up diamante',           muscle:'Pecho',  eq:'Peso corp.',sets:3, reps:12, desc:'Más énfasis en tríceps y pecho interno.' },

    // ── ESPALDA ──
    { name:'Peso muerto convencional',   muscle:'Espalda',eq:'Barra',    sets:4, reps:5,  desc:'Ejercicio fundamental. Espalda recta siempre.' },
    { name:'Remo con barra',             muscle:'Espalda',eq:'Barra',    sets:4, reps:8,  desc:'Codo pegado al cuerpo, tira hacia el ombligo.' },
    { name:'Remo con mancuerna',         muscle:'Espalda',eq:'Mancuerna',sets:3, reps:10, desc:'Apoyo en banco, trabaja un lado a la vez.' },
    { name:'Dominadas (pull-up)',        muscle:'Espalda',eq:'Peso corp.',sets:4, reps:8,  desc:'Agarre pronado. Rey del ancho de espalda.' },
    { name:'Jalón al pecho en polea',    muscle:'Espalda',eq:'Polea',    sets:3, reps:12, desc:'Alternativa a dominadas, controla el peso.' },
    { name:'Jalón al cuello (detrás)',   muscle:'Espalda',eq:'Polea',    sets:3, reps:12, desc:'Cuidado con el cuello. Usar peso moderado.' },
    { name:'Remo en polea baja',         muscle:'Espalda',eq:'Polea',    sets:3, reps:12, desc:'Tira hacia el abdomen, contrae en el punto final.' },
    { name:'Remo en máquina',            muscle:'Espalda',eq:'Máquina',  sets:3, reps:12, desc:'Movimiento guiado, ideal para principiantes.' },
    { name:'Encogimientos de trapecios', muscle:'Espalda',eq:'Mancuerna',sets:3, reps:15, desc:'Sube los hombros hacia las orejas.' },
    { name:'Peso muerto sumo',           muscle:'Espalda',eq:'Barra',    sets:3, reps:6,  desc:'Piernas más abiertas, más trabajo de aductores.' },
    { name:'Hiperextensiones',           muscle:'Espalda',eq:'Banco',    sets:3, reps:15, desc:'Trabaja erector espinal y glúteos.' },

    // ── HOMBRO ──
    { name:'Press militar (barra)',      muscle:'Hombro', eq:'Barra',    sets:4, reps:8,  desc:'Press sobre la cabeza. Espalda neutra.' },
    { name:'Press con mancuernas',       muscle:'Hombro', eq:'Mancuerna',sets:3, reps:10, desc:'Mayor rango que barra. Se puede hacer alterno.' },
    { name:'Elevaciones laterales',      muscle:'Hombro', eq:'Mancuerna',sets:3, reps:15, desc:'Aislamiento del deltoides lateral. Codo ligeramente flexionado.' },
    { name:'Elevaciones frontales',      muscle:'Hombro', eq:'Mancuerna',sets:3, reps:12, desc:'Trabaja el deltoides anterior.' },
    { name:'Pájaro / Remo al cuello',    muscle:'Hombro', eq:'Mancuerna',sets:3, reps:15, desc:'Deltoides posterior. Inclínate hacia adelante.' },
    { name:'Press Arnold',               muscle:'Hombro', eq:'Mancuerna',sets:3, reps:10, desc:'Rotación completa. Trabaja los 3 fascículos.' },
    { name:'Encogimientos en polea',     muscle:'Hombro', eq:'Polea',    sets:3, reps:15, desc:'Elevación lateral con polea baja.' },

    // ── BÍCEPS ──
    { name:'Curl de bíceps con barra',   muscle:'Bíceps', eq:'Barra',    sets:3, reps:12, desc:'Agarre supino. No balancees el torso.' },
    { name:'Curl con mancuernas',        muscle:'Bíceps', eq:'Mancuerna',sets:3, reps:12, desc:'Alterna o simultáneo. Codo fijo.' },
    { name:'Curl martillo',              muscle:'Bíceps', eq:'Mancuerna',sets:3, reps:12, desc:'Agarre neutro. Trabaja bíceps y braquial.' },
    { name:'Curl concentrado',           muscle:'Bíceps', eq:'Mancuerna',sets:3, reps:12, desc:'Máximo aislamiento del bíceps.' },
    { name:'Curl en banco Scott',        muscle:'Bíceps', eq:'Barra',    sets:3, reps:10, desc:'Evita usar el torso. Máximo control.' },
    { name:'Curl en polea baja',         muscle:'Bíceps', eq:'Polea',    sets:3, reps:15, desc:'Tensión constante en todo el recorrido.' },
    { name:'Chin-up (agarre supino)',    muscle:'Bíceps', eq:'Peso corp.',sets:3, reps:8,  desc:'Dominada con agarre supino. Bíceps y espalda.' },

    // ── TRÍCEPS ──
    { name:'Press francés (barra Z)',    muscle:'Tríceps',eq:'Barra',    sets:3, reps:10, desc:'Tumbado, baja la barra hacia la frente.' },
    { name:'Extensión de tríceps polea',muscle:'Tríceps',eq:'Polea',    sets:3, reps:15, desc:'Empuja hacia abajo. Codo fijo.' },
    { name:'Patadas de tríceps',         muscle:'Tríceps',eq:'Mancuerna',sets:3, reps:15, desc:'Espalda recta, extiende el codo.' },
    { name:'Fondos en banco',            muscle:'Tríceps',eq:'Banco',    sets:3, reps:15, desc:'Manos en banco detrás. Cuanto más rectas las piernas, más difícil.' },
    { name:'Press cerrado (barra)',      muscle:'Tríceps',eq:'Barra',    sets:3, reps:10, desc:'Agarre estrecho en press de banca.' },
    { name:'Extensión por encima',       muscle:'Tríceps',eq:'Mancuerna',sets:3, reps:12, desc:'Con mancuerna sobre la cabeza. Trabaja cabeza larga.' },

    // ── CUÁDRICEPS / PIERNA FRONTAL ──
    { name:'Sentadilla libre',           muscle:'Piernas',eq:'Barra',    sets:4, reps:8,  desc:'Reina de todos los ejercicios. Profundidad completa.' },
    { name:'Sentadilla goblet',          muscle:'Piernas',eq:'Mancuerna',sets:3, reps:12, desc:'Mancuerna al pecho. Ideal para técnica.' },
    { name:'Prensa de pierna 45°',       muscle:'Piernas',eq:'Máquina',  sets:4, reps:12, desc:'No bloquees las rodillas arriba del todo.' },
    { name:'Extensiones de cuádriceps', muscle:'Piernas',eq:'Máquina',  sets:3, reps:15, desc:'Aislamiento de cuádriceps. Extiende completo.' },
    { name:'Hack squat',                 muscle:'Piernas',eq:'Máquina',  sets:3, reps:10, desc:'Cuádriceps con menos carga en la espalda.' },
    { name:'Zancadas (lunges)',          muscle:'Piernas',eq:'Mancuerna',sets:3, reps:12, desc:'Paso largo. Rodilla no supera el pie.' },
    { name:'Sentadilla búlgara',         muscle:'Piernas',eq:'Mancuerna',sets:3, reps:10, desc:'Pie trasero elevado. Excelente para glúteo.' },
    { name:'Sentadilla frontal',         muscle:'Piernas',eq:'Barra',    sets:3, reps:8,  desc:'Barra en la parte delantera. Más cuádriceps.' },

    // ── ISQUIOTIBIALES / GLÚTEO ──
    { name:'Curl femoral tumbado',       muscle:'Piernas',eq:'Máquina',  sets:3, reps:12, desc:'Contrae en el punto alto. No uses impulso.' },
    { name:'Curl femoral de pie',        muscle:'Piernas',eq:'Máquina',  sets:3, reps:12, desc:'Un pie a la vez. Mayor concentración.' },
    { name:'Romanian deadlift (RDL)',    muscle:'Piernas',eq:'Barra',    sets:4, reps:10, desc:'Bisagra de cadera. Estira los isquios.' },
    { name:'Hip thrust (empuje de cadera)', muscle:'Piernas', eq:'Barra', sets:4, reps:12, desc:'Mejor ejercicio para glúteos. Espalda en banco.' },
    { name:'Sentadilla sumo',            muscle:'Piernas',eq:'Mancuerna',sets:3, reps:12, desc:'Piernas abiertas, pies hacia afuera. Más aductores y glúteos.' },
    { name:'Peso muerto a una pierna',   muscle:'Piernas',eq:'Mancuerna',sets:3, reps:10, desc:'Equilibrio y propiocepción. Control total.' },

    // ── GEMELOS ──
    { name:'Gemelo de pie en máquina',  muscle:'Gemelos',eq:'Máquina',  sets:4, reps:20, desc:'Rango completo, baja el talón hasta abajo.' },
    { name:'Gemelo sentado',             muscle:'Gemelos',eq:'Máquina',  sets:3, reps:20, desc:'Trabaja el sóleo. No sólo los gastrocnemios.' },
    { name:'Gemelo con barra',           muscle:'Gemelos',eq:'Barra',    sets:3, reps:20, desc:'De pie en step con barra en trapecios.' },

    // ── CORE / ABDOMINALES ──
    { name:'Crunch abdominal',           muscle:'Core',   eq:'Peso corp.',sets:3, reps:20, desc:'No pongas las manos en la nuca. Contrae el core.' },
    { name:'Plancha',                    muscle:'Core',   eq:'Peso corp.',sets:3, reps:45, desc:'Mantén el cuerpo alineado. Tiempo en segundos.' },
    { name:'Plancha lateral',            muscle:'Core',   eq:'Peso corp.',sets:3, reps:30, desc:'Trabaja el oblicuo. Tiempo en segundos.' },
    { name:'Elevación de piernas',       muscle:'Core',   eq:'Peso corp.',sets:3, reps:15, desc:'Tumbado, eleva las piernas rectas a 90°.' },
    { name:'Ab wheel (rueda abdominal)', muscle:'Core',   eq:'Rueda',    sets:3, reps:10, desc:'De rodillas al principio. Gran activación del core.' },
    { name:'Mountain climbers',          muscle:'Core',   eq:'Peso corp.',sets:3, reps:30, desc:'Cardio + core. Alterna rodillas al pecho rápido.' },
    { name:'Crunch inverso',             muscle:'Core',   eq:'Peso corp.',sets:3, reps:20, desc:'Levanta la cadera del suelo. Abdomen inferior.' },
    { name:'Russian twist',              muscle:'Core',   eq:'Peso corp.',sets:3, reps:20, desc:'Gira el torso. Con o sin peso. Oblicuos.' },
  ];

  const MUSCLE_GROUPS = ['Todo', ...new Set(EXERCISE_LIBRARY.map(e => e.muscle))];

  // ================================================================
  // RENDER
  // ================================================================
  function render() {
    return `
    <div id="gym-view" class="anim-fade-in">
      <div class="tabs">
        <button class="tab-btn ${currentTab==='routine'?'active':''}" onclick="GymModule.switchTab('routine')">Rutina</button>
        <button class="tab-btn ${currentTab==='library'?'active':''}" onclick="GymModule.switchTab('library')">Ejercicios</button>
        <button class="tab-btn ${currentTab==='history'?'active':''}" onclick="GymModule.switchTab('history')">Historial</button>
        <button class="tab-btn ${currentTab==='stats'?'active':''}" onclick="GymModule.switchTab('stats')">Stats</button>
      </div>
      <div id="gym-tab-content"></div>
    </div>`;
  }

  function onEnter() { renderTab(); }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('#gym-view .tab-btn').forEach((b,i) => {
      b.classList.toggle('active', ['routine','library','history','stats'][i] === tab);
    });
    renderTab();
  }

  function renderTab() {
    const container = document.getElementById('gym-tab-content');
    if (!container) return;
    if (currentTab === 'routine')  container.innerHTML = renderRoutine();
    else if (currentTab === 'library')  { container.innerHTML = renderLibrary(); }
    else if (currentTab === 'history')  container.innerHTML = renderHistory();
    else if (currentTab === 'stats')    { container.innerHTML = renderStats(); renderStatsCharts(); }
  }

  // ================================================================
  // RUTINA DEL DÍA
  // ================================================================
  function renderRoutine() {
    const routines   = Storage.getGymRoutines();
    const exercises  = routines[selectedDay] || [];

    const daySelectorHTML = DAYS.map(day => {
      const hasWorkout = (routines[day] || []).length > 0;
      const isToday = day === DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
      return `<button class="day-btn ${day === selectedDay ? 'active' : ''} ${hasWorkout ? 'has-workout' : ''}"
        onclick="GymModule.selectDay('${day}')">
        <span class="day-short">${day.slice(0,3)}</span>
        ${isToday ? '<span style="font-size:0.6rem;color:inherit;opacity:0.7">HOY</span>' : ''}
      </button>`;
    }).join('');

    const exercisesHTML = exercises.length === 0
      ? `<div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.5 6.5h11M6.5 17.5h11M3 12h18M7 3l-2 4h14l-2-4M7 21l-2-4h14l-2 4"/></svg>
          <h3>Sin ejercicios</h3>
          <p>Añade ejercicios de la biblioteca o manualmente</p>
          <button class="btn btn-primary btn-sm" onclick="GymModule.switchTab('library')">📚 Ver biblioteca</button>
        </div>`
      : exercises.map((ex, i) => renderExerciseCard(ex, i)).join('');

    return `
      <div class="day-selector">${daySelectorHTML}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px">
        <h3 style="font-size:1rem">${selectedDay}</h3>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" onclick="GymModule.showTemplates()">📋</button>
          <button class="btn btn-secondary btn-sm" onclick="GymModule.switchTab('library')">📚 Biblioteca</button>
          <button class="btn btn-primary btn-sm" onclick="GymModule.addExerciseModal()">+ Manual</button>
        </div>
      </div>
      <div id="exercises-list" class="stagger">${exercisesHTML}</div>

      ${exercises.length > 0 ? `
      <div style="padding:16px 0;display:flex;gap:8px">
        <button class="btn btn-primary btn-full" onclick="GymModule.logWorkout()">
          ✅ Registrar entrenamiento
        </button>
        <button class="btn btn-ghost btn-sm" onclick="GymModule.clearDay()" style="flex-shrink:0">🗑️</button>
      </div>` : ''}

      <!-- Temporizador -->
      <p class="section-title">⏱️ Temporizador de descanso</p>
      <div class="rest-timer card" id="rest-timer-card">
        <div class="timer-display" id="timer-display">01:30</div>
        <div style="display:flex;gap:6px;justify-content:center;margin:10px 0;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="GymModule.setTimer(45)">45s</button>
          <button class="btn btn-secondary btn-sm" onclick="GymModule.setTimer(60)">1min</button>
          <button class="btn btn-secondary btn-sm" onclick="GymModule.setTimer(90)">1:30</button>
          <button class="btn btn-secondary btn-sm" onclick="GymModule.setTimer(120)">2min</button>
          <button class="btn btn-secondary btn-sm" onclick="GymModule.setTimer(180)">3min</button>
        </div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button class="btn btn-primary" onclick="GymModule.toggleTimer()" id="timer-btn">▶ Iniciar</button>
          <button class="btn btn-ghost" onclick="GymModule.resetTimer()">↺</button>
        </div>
      </div>`;
  }

  function renderExerciseCard(ex, i) {
    return `
    <div class="exercise-card anim-fade-in">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div style="flex:1;min-width:0">
          <div class="exercise-name" style="font-size:0.95rem">${Utils.escapeHtml(ex.name)}</div>
          <div style="display:flex;gap:10px;margin-top:4px;font-size:0.8rem;color:var(--text-muted)">
            <span>🔢 ${ex.sets} series</span>
            <span>🔁 ${ex.reps} reps</span>
            ${ex.weight ? `<span>🏋️ ${ex.weight}kg</span>` : ''}
          </div>
          ${ex.muscle ? `<span class="badge badge-accent" style="margin-top:6px;font-size:0.65rem">${ex.muscle}</span>` : ''}
          ${ex.notes ? `<p style="font-size:0.76rem;color:var(--text-muted);margin-top:4px;font-style:italic">${Utils.escapeHtml(ex.notes)}</p>` : ''}
        </div>
        <div style="display:flex;gap:2px;flex-shrink:0">
          <button class="icon-btn" onclick="GymModule.editExercise(${i})" aria-label="Editar" style="width:36px;height:36px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn" onclick="GymModule.deleteExercise(${i})" aria-label="Eliminar" style="width:36px;height:36px;color:var(--danger)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
    </div>`;
  }

  // ================================================================
  // BIBLIOTECA DE EJERCICIOS
  // ================================================================
  function renderLibrary() {
    const tabsHTML = MUSCLE_GROUPS.map(g => `
      <button class="muscle-tab ${g === libFilter ? 'active' : ''}" onclick="GymModule.filterLib('${g}')">${g}</button>
    `).join('');

    const filtered = libFilter === 'Todo'
      ? EXERCISE_LIBRARY
      : EXERCISE_LIBRARY.filter(e => e.muscle === libFilter);

    const eqIcons = { 'Barra':'🏋️', 'Mancuerna':'💪', 'Peso corp.':'🤸', 'Máquina':'⚙️', 'Polea':'🔗', 'Banco':'🛋️', 'Rueda':'⭕' };

    const listHTML = filtered.map((ex, i) => {
      const realIdx = EXERCISE_LIBRARY.indexOf(ex);
      return `
      <div class="exercise-lib-item" onclick="GymModule.addFromLibrary(${realIdx})">
        <div style="flex:1;min-width:0">
          <div class="exercise-lib-name">${Utils.escapeHtml(ex.name)}</div>
          <div class="exercise-lib-meta">${eqIcons[ex.eq]||'🏋️'} ${ex.eq} · ${ex.sets}×${ex.reps} · <span class="badge badge-accent" style="font-size:0.65rem">${ex.muscle}</span></div>
          ${ex.desc ? `<div style="font-size:0.74rem;color:var(--text-muted);margin-top:3px">${Utils.escapeHtml(ex.desc)}</div>` : ''}
        </div>
        <div class="exercise-lib-add" title="Añadir al día ${selectedDay}">+</div>
      </div>`;
    }).join('');

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <p style="font-size:0.85rem;color:var(--text-muted)">${EXERCISE_LIBRARY.length} ejercicios · Añadir a: <b>${selectedDay}</b></p>
      </div>
      <div style="margin-bottom:8px">
        <input id="lib-search" class="input" type="text" placeholder="🔍 Buscar ejercicio..."
          oninput="GymModule.searchLib(this.value)" style="margin-bottom:8px" />
      </div>
      <div class="muscle-group-tabs">${tabsHTML}</div>
      <div id="lib-list" class="stagger">${listHTML}</div>`;
  }

  function filterLib(group) {
    libFilter = group;
    renderTab();
  }

  function searchLib(query) {
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const q    = norm(query.trim());
    const container = document.getElementById('lib-list');
    if (!container) return;

    const filtered = q.length === 0
      ? (libFilter === 'Todo' ? EXERCISE_LIBRARY : EXERCISE_LIBRARY.filter(e => e.muscle === libFilter))
      : EXERCISE_LIBRARY.filter(e => norm(e.name).includes(q) || norm(e.muscle).includes(q) || norm(e.eq).includes(q));

    const eqIcons = { 'Barra':'🏋️', 'Mancuerna':'💪', 'Peso corp.':'🤸', 'Máquina':'⚙️', 'Polea':'🔗', 'Banco':'🛋️', 'Rueda':'⭕' };
    container.innerHTML = filtered.map(ex => {
      const realIdx = EXERCISE_LIBRARY.indexOf(ex);
      return `
        <div class="exercise-lib-item" onclick="GymModule.addFromLibrary(${realIdx})">
          <div style="flex:1;min-width:0">
            <div class="exercise-lib-name">${Utils.escapeHtml(ex.name)}</div>
            <div class="exercise-lib-meta">${eqIcons[ex.eq]||''} ${ex.eq} · ${ex.sets}×${ex.reps} · <span class="badge badge-accent" style="font-size:0.65rem">${ex.muscle}</span></div>
          </div>
          <div class="exercise-lib-add">+</div>
        </div>`;
    }).join('') || '<p style="color:var(--text-muted);text-align:center;padding:20px">Sin resultados</p>';
  }

  function addFromLibrary(libIndex) {
    const ex = EXERCISE_LIBRARY[libIndex];
    if (!ex) return;

    // Pedir personalización rápida antes de añadir
    openModal(`
      <h3>${Utils.escapeHtml(ex.name)}</h3>
      <p style="color:var(--text-muted);font-size:0.82rem;margin-bottom:4px">${ex.muscle} · ${ex.eq}</p>
      ${ex.desc ? `<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.5">${Utils.escapeHtml(ex.desc)}</p>` : '<br>'}
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">
        <div class="input-group">
          <label class="input-label">Series</label>
          <input id="lib-sets" class="input" type="number" inputmode="numeric" value="${ex.sets}" min="1" max="10" />
        </div>
        <div class="input-group">
          <label class="input-label">Reps</label>
          <input id="lib-reps" class="input" type="number" inputmode="numeric" value="${ex.reps}" min="1" max="100" />
        </div>
        <div class="input-group">
          <label class="input-label">Peso (kg)</label>
          <input id="lib-weight" class="input" type="number" inputmode="decimal" value="" placeholder="0" min="0" step="0.5" />
        </div>
      </div>
      <div class="input-group" style="margin-bottom:16px">
        <label class="input-label">Notas opcionales</label>
        <input id="lib-notes" class="input" type="text" placeholder="Técnica, variante..." />
      </div>
      <button class="btn btn-primary btn-full btn-lg" onclick="GymModule.confirmAddFromLibrary(${libIndex})">
        ✅ Añadir a ${selectedDay}
      </button>
    `);
  }

  function confirmAddFromLibrary(libIndex) {
    const ex     = EXERCISE_LIBRARY[libIndex];
    const sets   = parseInt(document.getElementById('lib-sets')?.value) || ex.sets;
    const reps   = parseInt(document.getElementById('lib-reps')?.value) || ex.reps;
    const weight = parseFloat(document.getElementById('lib-weight')?.value) || 0;
    const notes  = document.getElementById('lib-notes')?.value.trim() || ex.desc || '';

    const routines = Storage.getGymRoutines();
    if (!routines[selectedDay]) routines[selectedDay] = [];
    routines[selectedDay].push({
      id: Utils.uid(),
      name: ex.name,
      muscle: ex.muscle,
      sets, reps,
      weight: weight || '',
      notes
    });
    Storage.saveGymRoutines(routines);
    Storage.addXP(5);
    closeModal();
    switchTab('routine');
    showToast(`${ex.name} añadido al ${selectedDay}`, 'success');
    Utils.haptic([15, 10, 15]);
  }

  // ================================================================
  // HISTORIAL
  // ================================================================
  function renderHistory() {
    const workouts = Storage.getGymWorkouts().slice().reverse();
    if (workouts.length === 0) return `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <h3>Sin entrenamientos</h3><p>Registra tu primer entrenamiento completando una rutina</p>
      </div>`;
    return `<div class="item-list stagger">` +
      workouts.slice(0, 30).map(w => {
        const vol = w.exercises?.reduce((s, ex) => s + (ex.sets * ex.reps * (ex.weight || 0)), 0) || 0;
        return `
        <div class="list-item card-clickable" onclick="GymModule.showWorkoutDetail('${w.id}')">
          <div class="list-item-icon" style="background:rgba(255,107,107,0.15);color:var(--gym-color)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><path d="M6.5 6.5h11M6.5 17.5h11M3 12h18"/></svg>
          </div>
          <div class="list-item-body">
            <div class="list-item-title">${Utils.escapeHtml(w.day)} · ${Utils.formatShortDate(w.date)}</div>
            <div class="list-item-sub">${w.exercises?.length||0} ejercicios · ${vol > 0 ? Utils.formatWeight(vol) + ' vol.' : 'Peso corporal'}</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--text-muted)"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`;
      }).join('') + '</div>';
  }

  // ================================================================
  // ESTADÍSTICAS
  // ================================================================
  function renderStats() {
    const workouts = Storage.getGymWorkouts();
    const last7    = Utils.lastNDays(7);
    const trained  = last7.filter(d => workouts.some(w => w.date === d)).length;
    const totalVol = workouts.reduce((s, w) =>
      s + (w.exercises||[]).reduce((sv, ex) => sv + ex.sets * ex.reps * (ex.weight||0), 0), 0);
    const streaks  = Storage.getStreaks();

    return `
    <div class="dashboard-grid" style="margin-bottom:16px">
      <div class="card"><div class="card-header"><span class="card-title">Esta semana</span></div>
        <div class="card-value">${trained}</div><div class="card-sub">días entrenados</div></div>
      <div class="card"><div class="card-header"><span class="card-title">🔥 Racha</span></div>
        <div class="card-value">${streaks.gym}</div><div class="card-sub">días consecutivos</div></div>
      <div class="card"><div class="card-header"><span class="card-title">Total entrenos</span></div>
        <div class="card-value">${workouts.length}</div><div class="card-sub">sesiones registradas</div></div>
      <div class="card"><div class="card-header"><span class="card-title">Volumen total</span></div>
        <div class="card-value">${Math.round(totalVol/1000) || 0}t</div><div class="card-sub">toneladas levantadas</div></div>
    </div>
    <div class="chart-container">
      <p class="chart-title">Entrenamientos – últimas 2 semanas</p>
      <canvas id="gym-chart" style="width:100%;height:130px"></canvas>
    </div>`;
  }

  function renderStatsCharts() {
    const canvas = document.getElementById('gym-chart');
    if (!canvas) return;
    const workouts = Storage.getGymWorkouts();
    const days     = Utils.lastNDays(14);
    const data     = days.map(d => workouts.filter(w => w.date === d).length);
    const labels   = days.map(d => Utils.getDayShort(new Date(d+'T00:00:00').getDay()));
    Utils.drawBarChart(canvas, data, labels, { color:'#ff6b6b', bgColor:'rgba(255,107,107,0.1)' });
  }

  // ================================================================
  // ACCIONES
  // ================================================================
  function selectDay(day) {
    selectedDay = day;
    renderTab();
  }

  function addExerciseModal(editIndex = -1) {
    const routines  = Storage.getGymRoutines();
    const exercises = routines[selectedDay] || [];
    const ex = editIndex >= 0 ? exercises[editIndex] : { name:'', muscle:'', sets:3, reps:10, weight:'', notes:'' };

    openModal(`
      <h3>${editIndex >= 0 ? 'Editar' : 'Añadir'} ejercicio</h3>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
        <div class="input-group">
          <label class="input-label">Nombre *</label>
          <input id="ex-name" class="input" type="text" value="${Utils.escapeHtml(ex.name)}" placeholder="Ej: Press de banca" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div class="input-group">
            <label class="input-label">Series</label>
            <input id="ex-sets" class="input" type="number" inputmode="numeric" min="1" max="20" value="${ex.sets}" />
          </div>
          <div class="input-group">
            <label class="input-label">Reps</label>
            <input id="ex-reps" class="input" type="number" inputmode="numeric" min="1" max="100" value="${ex.reps}" />
          </div>
          <div class="input-group">
            <label class="input-label">Peso (kg)</label>
            <input id="ex-weight" class="input" type="number" inputmode="decimal" min="0" step="0.5" value="${ex.weight||''}" placeholder="0" />
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">Notas opcionales</label>
          <input id="ex-notes" class="input" type="text" value="${Utils.escapeHtml(ex.notes||'')}" placeholder="Técnica, variante..." />
        </div>
        <button class="btn btn-primary btn-full" onclick="GymModule.saveExercise(${editIndex})">
          ${editIndex >= 0 ? 'Actualizar' : 'Añadir ejercicio'}
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
    const routines = Storage.getGymRoutines();
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
  }

  function clearDay() {
    if (!confirm(`¿Borrar todos los ejercicios del ${selectedDay}?`)) return;
    const routines = Storage.getGymRoutines();
    routines[selectedDay] = [];
    Storage.saveGymRoutines(routines);
    renderTab();
    showToast(`Rutina del ${selectedDay} limpiada`, 'info');
  }

  function logWorkout() {
    const routines  = Storage.getGymRoutines();
    const exercises = routines[selectedDay] || [];
    if (!exercises.length) { showToast('No hay ejercicios en la rutina', 'warning'); return; }
    const workouts = Storage.getGymWorkouts();
    const today    = Utils.today();
    if (workouts.find(w => w.date === today && w.day === selectedDay)) {
      showToast('Ya registraste este entrenamiento hoy', 'warning'); return;
    }
    workouts.push({ id: Utils.uid(), date: today, day: selectedDay, exercises: JSON.parse(JSON.stringify(exercises)) });
    Storage.saveGymWorkouts(workouts);
    _updateGymStreak(today);
    Storage.addXP(20);
    showToast('¡Entrenamiento registrado! +20 XP 🔥', 'success');
    Utils.haptic([30, 20, 30]);
    App.updateDrawerUser();
    GoalsModule.checkAchievements();
  }

  function _updateGymStreak(today) {
    const streaks   = Storage.getStreaks();
    const yesterday = new Date(today + 'T00:00:00');
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    if (streaks.lastGymDate === yStr) streaks.gym++;
    else if (streaks.lastGymDate !== today) streaks.gym = 1;
    streaks.lastGymDate = today;
    Storage.saveStreaks(streaks);
  }

  function showWorkoutDetail(id) {
    const w = Storage.getGymWorkouts().find(w => w.id === id);
    if (!w) return;
    const vol = w.exercises?.reduce((s, ex) => s + (ex.sets * ex.reps * (ex.weight || 0)), 0) || 0;
    openModal(`
      <h3>${w.day} · ${Utils.formatShortDate(w.date)}</h3>
      <p style="color:var(--text-muted);font-size:0.82rem;margin-bottom:16px">
        ${w.exercises?.length||0} ejercicios · ${vol > 0 ? 'Volumen: ' + Utils.formatWeight(vol) : 'Sin peso'}
      </p>
      <div>
        ${(w.exercises||[]).map(ex => `
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:0.87rem">
            <span style="font-weight:600">${Utils.escapeHtml(ex.name)}</span>
            <span style="color:var(--text-muted)">${ex.sets}×${ex.reps}${ex.weight?` · ${ex.weight}kg`:''}</span>
          </div>`).join('')}
      </div>
      <button class="btn btn-danger btn-sm" style="margin-top:16px" onclick="GymModule.deleteWorkout('${id}')">
        Eliminar registro
      </button>
    `);
  }

  function deleteWorkout(id) {
    Storage.saveGymWorkouts(Storage.getGymWorkouts().filter(w => w.id !== id));
    closeModal();
    renderTab();
    showToast('Entrenamiento eliminado', 'info');
  }

  // ================================================================
  // PLANTILLAS
  // ================================================================
  function showTemplates() {
    const defaults = [
      { name:'Pecho + Tríceps (Push A)',  exercises: EXERCISE_LIBRARY.filter(e => ['Pecho','Tríceps'].includes(e.muscle)).slice(0,6) },
      { name:'Espalda + Bíceps (Pull A)', exercises: EXERCISE_LIBRARY.filter(e => ['Espalda','Bíceps'].includes(e.muscle)).slice(0,6) },
      { name:'Pierna completa',           exercises: EXERCISE_LIBRARY.filter(e => ['Piernas','Gemelos'].includes(e.muscle)).slice(0,6) },
      { name:'Hombro + Core',             exercises: EXERCISE_LIBRARY.filter(e => ['Hombro','Core'].includes(e.muscle)).slice(0,6) },
      { name:'Full Body',                 exercises: EXERCISE_LIBRARY.filter((e,i) => i % 5 === 0).slice(0,8) },
    ];
    openModal(`
      <h3>Plantillas de rutina</h3>
      <p style="color:var(--text-muted);font-size:0.82rem;margin-bottom:12px">Se aplica al día: <b>${selectedDay}</b></p>
      <div class="item-list">
        ${defaults.map((t, i) => `
          <div class="list-item">
            <div class="list-item-body">
              <div class="list-item-title">${t.name}</div>
              <div class="list-item-sub">${t.exercises.length} ejercicios</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="GymModule.applyTemplate(${i})">Aplicar</button>
          </div>`).join('')}
      </div>
    `);
    // Guardar templates en estado temporal
    GymModule._tempTemplates = defaults;
  }

  function applyTemplate(i) {
    const t = GymModule._tempTemplates?.[i];
    if (!t) return;
    const routines = Storage.getGymRoutines();
    routines[selectedDay] = t.exercises.map(ex => ({
      id: Utils.uid(), name: ex.name, muscle: ex.muscle,
      sets: ex.sets, reps: ex.reps, weight: '', notes: ex.desc || ''
    }));
    Storage.saveGymRoutines(routines);
    closeModal();
    switchTab('routine');
    showToast(`Plantilla "${t.name}" aplicada`, 'success');
  }

  // ================================================================
  // TEMPORIZADOR
  // ================================================================
  function setTimer(secs) {
    if (timerRunning) { clearInterval(timerInterval); timerRunning = false; }
    timerSeconds = secs;
    updateTimerDisplay();
    const btn = document.getElementById('timer-btn');
    if (btn) btn.textContent = '▶ Iniciar';
  }

  function toggleTimer() {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      const btn = document.getElementById('timer-btn');
      if (btn) btn.textContent = '▶ Reanudar';
    } else {
      timerRunning = true;
      const btn = document.getElementById('timer-btn');
      if (btn) btn.textContent = '⏸ Pausar';
      timerInterval = setInterval(() => {
        if (timerSeconds <= 0) {
          clearInterval(timerInterval);
          timerRunning = false;
          const btn = document.getElementById('timer-btn');
          if (btn) btn.textContent = '▶ Iniciar';
          showToast('⏱️ ¡Descanso terminado! Vuelve a entrenar', 'info');
          Utils.haptic([100, 50, 100, 50, 100]);
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
    const btn = document.getElementById('timer-btn');
    if (btn) btn.textContent = '▶ Iniciar';
  }

  function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    if (!display) return;
    const m = Math.floor(timerSeconds / 60);
    const s = timerSeconds % 60;
    display.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    // Color de urgencia
    if (timerSeconds <= 10) display.style.color = 'var(--danger)';
    else if (timerSeconds <= 30) display.style.color = 'var(--warning)';
    else display.style.color = 'var(--accent)';
  }

  // ================================================================
  // API PÚBLICA
  // ================================================================
  return {
    render, onEnter, switchTab,
    selectDay,
    addExerciseModal, saveExercise, editExercise, deleteExercise, clearDay,
    logWorkout, showWorkoutDetail, deleteWorkout,
    showTemplates, applyTemplate,
    filterLib, searchLib, addFromLibrary, confirmAddFromLibrary,
    setTimer, toggleTimer, resetTimer,
    _tempTemplates: null
  };
})();

window.GymModule = GymModule;
