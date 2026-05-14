/**
 * MEALS.JS – Módulo de Comidas
 * Gestión de 5 comidas diarias, macros, calorías y estadísticas.
 */

const MealsModule = (() => {

  const MEAL_NAMES = ['Desayuno', 'Almuerzo', 'Comida', 'Merienda', 'Cena'];
  let selectedDate  = Utils.today();
  let currentTab    = 'today';
  let openMeals     = { Desayuno: true };

  // ================================================================
  // RENDER
  // ================================================================
  function render() {
    return `
    <div id="meals-view" class="anim-fade-in">
      <div class="tabs">
        <button class="tab-btn ${currentTab==='today'?'active':''}" onclick="MealsModule.switchTab('today')">Hoy</button>
        <button class="tab-btn ${currentTab==='stats'?'active':''}" onclick="MealsModule.switchTab('stats')">Stats</button>
        <button class="tab-btn ${currentTab==='settings'?'active':''}" onclick="MealsModule.switchTab('settings')">Config</button>
      </div>
      <div id="meals-tab-content"></div>
    </div>`;
  }

  function onEnter() { renderTab(); }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('#meals-view .tab-btn').forEach((b,i) => {
      b.classList.toggle('active', ['today','stats','settings'][i] === tab);
    });
    renderTab();
  }

  function renderTab() {
    const container = document.getElementById('meals-tab-content');
    if (!container) return;
    if (currentTab === 'today')    container.innerHTML = renderToday();
    else if (currentTab === 'stats') { container.innerHTML = renderMealStats(); renderMealCharts(); }
    else if (currentTab === 'settings') container.innerHTML = renderMealSettings();
  }

  // ================================================================
  // HOY
  // ================================================================
  function renderToday() {
    const mealDay  = Storage.getMealDay(selectedDate);
    const settings = Storage.getMealSettings();
    const calGoal  = settings.calGoal || 2200;

    let totalKcal = 0, totalP = 0, totalC = 0, totalF = 0;
    MEAL_NAMES.forEach(meal => {
      (mealDay[meal] || []).forEach(f => {
        totalKcal += f.kcal || 0;
        totalP    += f.protein || 0;
        totalC    += f.carbs || 0;
        totalF    += f.fat || 0;
      });
    });

    const calPct = Utils.pct(totalKcal, calGoal);
    const calColor = totalKcal > calGoal ? 'danger' : totalKcal > calGoal * 0.9 ? 'warning' : '';

    const dateNav = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <button class="icon-btn" onclick="MealsModule.changeDate(-1)" aria-label="Día anterior">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style="font-weight:700">${selectedDate === Utils.today() ? 'Hoy' : Utils.formatShortDate(selectedDate)}</span>
        <button class="icon-btn" onclick="MealsModule.changeDate(1)" aria-label="Día siguiente" ${selectedDate >= Utils.today() ? 'disabled style="opacity:0.3"' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>`;

    const summaryHTML = `
      <div class="calories-summary" style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="cal-total">${Math.round(totalKcal)} <span style="font-size:1rem">kcal</span></div>
            <div class="cal-goal">de ${calGoal} kcal objetivo (${calPct}%)</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.78rem;opacity:0.8">Restante</div>
            <div style="font-size:1.3rem;font-weight:800">${Math.max(0, calGoal - totalKcal)} kcal</div>
          </div>
        </div>
        <div class="progress-bar-wrap" style="margin:12px 0;background:rgba(255,255,255,0.2)">
          <div class="progress-bar-fill" style="width:${Math.min(calPct,100)}%;background:white;opacity:0.9"></div>
        </div>
        <div style="display:flex;justify-content:space-around;font-size:0.8rem">
          <div style="text-align:center"><div style="font-weight:800">${Math.round(totalP)}g</div><div style="opacity:0.8">Proteína</div></div>
          <div style="text-align:center"><div style="font-weight:800">${Math.round(totalC)}g</div><div style="opacity:0.8">Carbos</div></div>
          <div style="text-align:center"><div style="font-weight:800">${Math.round(totalF)}g</div><div style="opacity:0.8">Grasas</div></div>
        </div>
      </div>`;

    const mealsHTML = MEAL_NAMES.map(meal => {
      const foods = mealDay[meal] || [];
      const kcal  = foods.reduce((s, f) => s + (f.kcal || 0), 0);
      const isOpen = openMeals[meal] || false;
      return `
        <div class="meal-section">
          <div class="meal-header" onclick="MealsModule.toggleMeal('${meal}')">
            <div class="meal-header-left">
              <div class="meal-dot"></div>
              <span class="meal-name">${meal}</span>
              ${foods.length > 0 ? `<span class="badge badge-accent" style="font-size:0.7rem">${foods.length}</span>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="meal-kcal">${Math.round(kcal)} kcal</span>
              <svg class="meal-chevron ${isOpen?'open':''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <div class="meal-body ${isOpen?'open':''}">
            ${foods.length === 0
              ? '<p style="color:var(--text-muted);font-size:0.82rem;padding:4px 0">Sin alimentos registrados</p>'
              : foods.map((f, i) => `
                  <div class="food-item">
                    <div>
                      <div style="font-weight:600">${Utils.escapeHtml(f.name)}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted)">${f.amount}${f.unit||'g'}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div style="text-align:right">
                        <div style="font-weight:700">${Math.round(f.kcal)} kcal</div>
                        <div class="food-macros">
                          <span class="macro-chip macro-p">${Math.round(f.protein)}P</span>
                          <span class="macro-chip macro-c">${Math.round(f.carbs)}C</span>
                          <span class="macro-chip macro-f">${Math.round(f.fat)}G</span>
                        </div>
                      </div>
                      <button class="icon-btn" onclick="MealsModule.removeFood('${meal}',${i})" style="width:28px;height:28px;color:var(--danger)" aria-label="Eliminar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>`
                ).join('')
            }
            <button class="btn btn-secondary btn-sm btn-full" style="margin-top:8px" onclick="MealsModule.addFoodModal('${meal}')">
              + Añadir alimento
            </button>
          </div>
        </div>`;
    }).join('');

    return dateNav + summaryHTML + mealsHTML;
  }

  // ================================================================
  // ESTADÍSTICAS
  // ================================================================
  function renderMealStats() {
    const days = Utils.lastNDays(7);
    const calPerDay = days.map(d => {
      const md = Storage.getMealDay(d);
      return Object.values(md).flat().reduce((s, f) => s + (f.kcal || 0), 0);
    });
    const avgKcal = Utils.avg(calPerDay.filter(c => c > 0));
    const settings = Storage.getMealSettings();

    return `
    <div class="dashboard-grid" style="margin-bottom:16px">
      <div class="card"><div class="card-header"><span class="card-title">Promedio semanal</span></div>
        <div class="card-value">${Math.round(avgKcal)}</div><div class="card-sub">kcal/día</div></div>
      <div class="card"><div class="card-header"><span class="card-title">Objetivo</span></div>
        <div class="card-value">${settings.calGoal}</div><div class="card-sub">kcal diarias</div></div>
    </div>
    <div class="chart-container" style="margin-bottom:12px">
      <p class="chart-title">Calorías – últimos 7 días</p>
      <canvas id="meals-cal-chart" style="width:100%;height:140px"></canvas>
    </div>
    <div class="chart-container">
      <p class="chart-title">Distribución de macros (hoy)</p>
      <canvas id="meals-macro-chart" style="width:100%;height:100px"></canvas>
    </div>`;
  }

  function renderMealCharts() {
    const days = Utils.lastNDays(7);
    const calCanvas = document.getElementById('meals-cal-chart');
    if (calCanvas) {
      const calData  = days.map(d => Object.values(Storage.getMealDay(d)).flat().reduce((s,f) => s+(f.kcal||0),0));
      const calLabels = days.map(d => Utils.getDayShort(new Date(d+'T00:00:00').getDay()));
      Utils.drawBarChart(calCanvas, calData, calLabels, { color:'#ffd93d', bgColor:'rgba(255,217,61,0.1)' });
    }

    const macroCanvas = document.getElementById('meals-macro-chart');
    if (macroCanvas) {
      const today = Storage.getMealDay(Utils.today());
      const all = Object.values(today).flat();
      const p = Math.round(all.reduce((s,f) => s+(f.protein||0),0));
      const c = Math.round(all.reduce((s,f) => s+(f.carbs||0),0));
      const f = Math.round(all.reduce((s,f) => s+(f.fat||0),0));
      Utils.drawBarChart(macroCanvas, [p,c,f], ['Prot.','Carbs','Grasa'], {
        color:'#6C63FF', bgColor:'rgba(108,99,255,0.1)'
      });
    }
  }

  // ================================================================
  // CONFIGURACIÓN
  // ================================================================
  function renderMealSettings() {
    const s = Storage.getMealSettings();
    return `
    <div class="card">
      <h3 style="margin-bottom:16px">Objetivos nutricionales</h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="input-group">
          <label class="input-label">Calorías objetivo (kcal/día)</label>
          <input id="ms-cal" class="input" type="number" value="${s.calGoal}" min="800" max="6000" />
        </div>
        <div class="input-group">
          <label class="input-label">Proteínas objetivo (g/día)</label>
          <input id="ms-prot" class="input" type="number" value="${s.proteinGoal}" min="0" max="500" />
        </div>
        <div class="input-group">
          <label class="input-label">Carbohidratos objetivo (g/día)</label>
          <input id="ms-carbs" class="input" type="number" value="${s.carbsGoal}" min="0" max="800" />
        </div>
        <div class="input-group">
          <label class="input-label">Grasas objetivo (g/día)</label>
          <input id="ms-fat" class="input" type="number" value="${s.fatGoal}" min="0" max="300" />
        </div>
        <button class="btn btn-primary btn-full" onclick="MealsModule.saveMealConfig()">Guardar</button>
      </div>
    </div>`;
  }

  function saveMealConfig() {
    const s = {
      calGoal:     parseInt(document.getElementById('ms-cal')?.value)  || 2200,
      proteinGoal: parseInt(document.getElementById('ms-prot')?.value) || 150,
      carbsGoal:   parseInt(document.getElementById('ms-carbs')?.value)|| 250,
      fatGoal:     parseInt(document.getElementById('ms-fat')?.value)  || 70,
    };
    Storage.saveMealSettings(s);
    showToast('Configuración guardada', 'success');
  }

  // ================================================================
  // ACCIONES
  // ================================================================
  function toggleMeal(meal) {
    openMeals[meal] = !openMeals[meal];
    renderTab();
  }

  function changeDate(delta) {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    const newDate = d.toISOString().slice(0, 10);
    if (newDate > Utils.today()) return;
    selectedDate = newDate;
    renderTab();
  }

  function addFoodModal(meal) {
    const db = Storage.getMealFoodsDB();
    const dbHTML = db.map((f, i) => `
      <div class="list-item card-clickable" onclick="MealsModule.selectFoodFromDB(${i})">
        <div class="list-item-body">
          <div class="list-item-title">${Utils.escapeHtml(f.name)}</div>
          <div class="list-item-sub">${f.kcal} kcal / ${f.unit} · P:${f.protein}g C:${f.carbs}g G:${f.fat}g</div>
        </div>
      </div>`).join('');

    openModal(`
      <h3>Añadir alimento a ${meal}</h3>
      <div id="food-form" data-meal="${Utils.escapeHtml(meal)}">
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;margin-bottom:16px">
          <div class="input-group">
            <label class="input-label">Nombre *</label>
            <input id="food-name" class="input" type="text" placeholder="Ej: Pollo a la plancha" />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="input-group">
              <label class="input-label">Cantidad (g/ml)</label>
              <input id="food-amount" class="input" type="number" value="100" min="1" />
            </div>
            <div class="input-group">
              <label class="input-label">Calorías (kcal)</label>
              <input id="food-kcal" class="input" type="number" value="0" min="0" />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
            <div class="input-group">
              <label class="input-label">Prot. (g)</label>
              <input id="food-prot" class="input" type="number" value="0" min="0" step="0.1" />
            </div>
            <div class="input-group">
              <label class="input-label">Carbs (g)</label>
              <input id="food-carbs" class="input" type="number" value="0" min="0" step="0.1" />
            </div>
            <div class="input-group">
              <label class="input-label">Grasas (g)</label>
              <input id="food-fat" class="input" type="number" value="0" min="0" step="0.1" />
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary btn-full" onclick="MealsModule.saveFood('${Utils.escapeHtml(meal)}')">Añadir</button>
            <button class="btn btn-ghost btn-sm" onclick="MealsModule.saveToFoodsDB()">💾 Guardar en BD</button>
          </div>
        </div>
        <p class="section-title">Base de datos rápida</p>
        <div class="item-list" id="food-db-list" style="max-height:200px;overflow-y:auto">${dbHTML}</div>
      </div>
    `);

    // Input de búsqueda live
    setTimeout(() => {
      const nameInput = document.getElementById('food-name');
      if (nameInput) nameInput.addEventListener('input', Utils.debounce(e => filterFoodDB(e.target.value), 250));
    }, 100);
  }

  function filterFoodDB(query) {
    const db = Storage.getMealFoodsDB();
    const filtered = db.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
    const list = document.getElementById('food-db-list');
    if (!list) return;
    list.innerHTML = filtered.map((f, i) => `
      <div class="list-item card-clickable" onclick="MealsModule.selectFoodFromDB(${db.indexOf(f)})">
        <div class="list-item-body">
          <div class="list-item-title">${Utils.escapeHtml(f.name)}</div>
          <div class="list-item-sub">${f.kcal} kcal / ${f.unit}</div>
        </div>
      </div>`).join('');
  }

  function selectFoodFromDB(i) {
    const db = Storage.getMealFoodsDB();
    const f  = db[i];
    if (!f) return;
    const nameEl   = document.getElementById('food-name');
    const kcalEl   = document.getElementById('food-kcal');
    const protEl   = document.getElementById('food-prot');
    const carbsEl  = document.getElementById('food-carbs');
    const fatEl    = document.getElementById('food-fat');
    const amountEl = document.getElementById('food-amount');
    if (nameEl)  nameEl.value  = f.name;
    if (kcalEl)  kcalEl.value  = f.kcal;
    if (protEl)  protEl.value  = f.protein;
    if (carbsEl) carbsEl.value = f.carbs;
    if (fatEl)   fatEl.value   = f.fat;
    if (amountEl) amountEl.value = 100;
    nameEl?.focus();
  }

  function saveFood(meal) {
    const name   = document.getElementById('food-name')?.value.trim();
    const amount = parseFloat(document.getElementById('food-amount')?.value) || 100;
    const ratio  = amount / 100;
    const kcal   = Math.round((parseFloat(document.getElementById('food-kcal')?.value) || 0) * ratio);
    const prot   = Utils.round((parseFloat(document.getElementById('food-prot')?.value) || 0) * ratio);
    const carbs  = Utils.round((parseFloat(document.getElementById('food-carbs')?.value) || 0) * ratio);
    const fat    = Utils.round((parseFloat(document.getElementById('food-fat')?.value) || 0) * ratio);

    if (!name) { showToast('El nombre es obligatorio', 'error'); return; }

    const mealDay = Storage.getMealDay(selectedDate);
    if (!mealDay[meal]) mealDay[meal] = [];
    mealDay[meal].push({ id: Utils.uid(), name, amount, unit:'g', kcal, protein: prot, carbs, fat });
    Storage.saveMealDay(selectedDate, mealDay);
    Storage.addXP(3);

    closeModal();
    renderTab();
    showToast(`${name} añadido a ${meal}`, 'success');
    Utils.haptic([15]);
  }

  function saveToFoodsDB() {
    const name  = document.getElementById('food-name')?.value.trim();
    const kcal  = parseFloat(document.getElementById('food-kcal')?.value) || 0;
    const prot  = parseFloat(document.getElementById('food-prot')?.value) || 0;
    const carbs = parseFloat(document.getElementById('food-carbs')?.value) || 0;
    const fat   = parseFloat(document.getElementById('food-fat')?.value) || 0;
    if (!name) { showToast('Escribe el nombre antes de guardar', 'error'); return; }
    const db = Storage.getMealFoodsDB();
    if (db.find(f => f.name.toLowerCase() === name.toLowerCase())) {
      showToast('Ya existe en la base de datos', 'warning'); return;
    }
    db.push({ id: Utils.uid(), name, kcal, protein: prot, carbs, fat, unit:'100g' });
    Storage.saveMealFoodsDB(db);
    showToast(`"${name}" guardado en tu base de datos`, 'success');
  }

  function removeFood(meal, index) {
    const mealDay = Storage.getMealDay(selectedDate);
    mealDay[meal].splice(index, 1);
    Storage.saveMealDay(selectedDate, mealDay);
    renderTab();
    Utils.haptic([10]);
  }

  // ================================================================
  // API PÚBLICA
  // ================================================================
  return {
    render, onEnter,
    switchTab,
    toggleMeal,
    changeDate,
    addFoodModal, selectFoodFromDB, saveFood, saveToFoodsDB, removeFood,
    saveMealConfig
  };
})();

window.MealsModule = MealsModule;
