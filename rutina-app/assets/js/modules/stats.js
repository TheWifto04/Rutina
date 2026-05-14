/**
 * STATS.JS – Módulo de Estadísticas Globales
 */

const StatsModule = (() => {

  let currentTab = 'overview';

  function render() {
    return `
    <div id="stats-view" class="anim-fade-in">
      <div class="tabs">
        <button class="tab-btn ${currentTab==='overview'?'active':''}" onclick="StatsModule.switchTab('overview')">General</button>
        <button class="tab-btn ${currentTab==='trends'?'active':''}" onclick="StatsModule.switchTab('trends')">Tendencias</button>
        <button class="tab-btn ${currentTab==='compare'?'active':''}" onclick="StatsModule.switchTab('compare')">Comparar</button>
      </div>
      <div id="stats-tab-content"></div>
    </div>`;
  }

  function onEnter() { renderTab(); }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('#stats-view .tab-btn').forEach((b,i) => {
      b.classList.toggle('active', ['overview','trends','compare'][i] === tab);
    });
    renderTab();
  }

  function renderTab() {
    const container = document.getElementById('stats-tab-content');
    if (!container) return;
    if (currentTab === 'overview') { container.innerHTML = renderOverview(); renderOverviewCharts(); }
    else if (currentTab === 'trends')   container.innerHTML = renderTrends();
    else if (currentTab === 'compare')  { container.innerHTML = renderCompare(); renderCompareCharts(); }
  }

  // ================================================================
  // OVERVIEW
  // ================================================================
  function renderOverview() {
    const workouts = Storage.getGymWorkouts();
    const logs     = Storage.getSleepLogs();
    const events   = Storage.getCalEvents();
    const streaks  = Storage.getStreaks();
    const xp       = Storage.getXP();
    const level    = Math.floor(xp / 100) + 1;
    const last7    = Utils.lastNDays(7);

    const gymWeek  = last7.filter(d => workouts.some(w => w.date === d)).length;
    const sleepAvg = Utils.avg(last7.map(d => logs.find(l => l.date === d)?.hours || 0).filter(h => h > 0));
    const calAvg   = Utils.avg(last7.map(d =>
      Object.values(Storage.getMealDay(d)).flat().reduce((s, f) => s + (f.kcal || 0), 0)
    ).filter(c => c > 0));

    return `
    <!-- Big numbers -->
    <div class="dashboard-grid" style="margin-bottom:20px">
      <div class="card"><div class="card-header"><span class="card-title">💪 Gym esta semana</span></div>
        <div class="card-value">${gymWeek}</div><div class="card-sub">de ${Storage.getGoals().gymDays} días objetivo</div>
        <div class="progress-bar-wrap" style="margin-top:8px">
          <div class="progress-bar-fill" style="width:${Utils.pct(gymWeek, Storage.getGoals().gymDays)}%"></div>
        </div>
      </div>
      <div class="card"><div class="card-header"><span class="card-title">😴 Sueño</span></div>
        <div class="card-value">${sleepAvg || '--'}h</div><div class="card-sub">promedio semanal</div>
        <div class="progress-bar-wrap" style="margin-top:8px">
          <div class="progress-bar-fill success" style="width:${Utils.pct(sleepAvg, Storage.getSleepSettings().goalHours || 8)}%"></div>
        </div>
      </div>
      <div class="card"><div class="card-header"><span class="card-title">🍽️ Calorías</span></div>
        <div class="card-value">${Math.round(calAvg) || '--'}</div><div class="card-sub">kcal/día promedio</div></div>
      <div class="card"><div class="card-header"><span class="card-title">🎯 Nivel</span></div>
        <div class="card-value">${level}</div><div class="card-sub">${xp} XP totales</div></div>
      <div class="card card-wide"><div class="card-header"><span class="card-title">🔥 Rachas activas</span></div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:4px">
          <div class="stat-big"><div class="stat-big-num">${streaks.gym}</div><div class="stat-big-label">Gym</div></div>
          <div class="stat-big"><div class="stat-big-num">${streaks.sleep}</div><div class="stat-big-label">Sueño</div></div>
          <div class="stat-big"><div class="stat-big-num">${workouts.length}</div><div class="stat-big-label">Entrenos totales</div></div>
          <div class="stat-big"><div class="stat-big-num">${events.length}</div><div class="stat-big-label">Eventos</div></div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="chart-container" style="margin-bottom:12px">
      <p class="chart-title">Actividad semanal (últimas 4 semanas)</p>
      <canvas id="stats-gym-chart" style="width:100%;height:130px"></canvas>
    </div>
    <div class="chart-container" style="margin-bottom:12px">
      <p class="chart-title">Calorías diarias (últimos 14 días)</p>
      <canvas id="stats-cal-chart" style="width:100%;height:130px"></canvas>
    </div>
    <div class="chart-container">
      <p class="chart-title">Horas de sueño (últimas 2 semanas)</p>
      <canvas id="stats-sleep-chart" style="width:100%;height:130px"></canvas>
    </div>`;
  }

  function renderOverviewCharts() {
    const workouts = Storage.getGymWorkouts();
    const logs     = Storage.getSleepLogs();

    // Gym
    const gymCanvas = document.getElementById('stats-gym-chart');
    if (gymCanvas) {
      const days  = Utils.lastNDays(28);
      // Agrupar por semanas
      const weeks = [0,1,2,3].map(w => {
        const wDays = days.slice(w*7, (w+1)*7);
        return wDays.filter(d => workouts.some(wo => wo.date === d)).length;
      });
      const weekLabels = ['-4 sem.','-3 sem.','-2 sem.','Esta sem.'];
      Utils.drawBarChart(gymCanvas, weeks, weekLabels, { color:'#ff6b6b', bgColor:'rgba(255,107,107,0.1)' });
    }

    // Calorías
    const calCanvas = document.getElementById('stats-cal-chart');
    if (calCanvas) {
      const days = Utils.lastNDays(14);
      const data = days.map(d => Object.values(Storage.getMealDay(d)).flat().reduce((s,f) => s+(f.kcal||0),0));
      const labels = days.map(d => Utils.getDayShort(new Date(d+'T00:00:00').getDay()));
      Utils.drawLineChart(calCanvas, data, labels, { color:'#ffd93d', fillColor:'rgba(255,217,61,0.1)' });
    }

    // Sueño
    const sleepCanvas = document.getElementById('stats-sleep-chart');
    if (sleepCanvas) {
      const days = Utils.lastNDays(14);
      const data = days.map(d => logs.find(l => l.date === d)?.hours || 0);
      const labels = days.map(d => Utils.getDayShort(new Date(d+'T00:00:00').getDay()));
      Utils.drawLineChart(sleepCanvas, data, labels, { color:'#6bcb77', fillColor:'rgba(107,203,119,0.15)' });
    }
  }

  // ================================================================
  // TENDENCIAS
  // ================================================================
  function renderTrends() {
    const workouts = Storage.getGymWorkouts();
    const logs     = Storage.getSleepLogs();
    const goals    = Storage.getGoals();
    const streaks  = Storage.getStreaks();

    const thisWeek = Utils.lastNDays(7);
    const lastWeek = Utils.lastNDays(14).slice(0,7);

    const gymThis = thisWeek.filter(d => workouts.some(w => w.date === d)).length;
    const gymLast = lastWeek.filter(d => workouts.some(w => w.date === d)).length;
    const gymDiff = gymThis - gymLast;

    const sleepThis = Utils.avg(thisWeek.map(d => logs.find(l=>l.date===d)?.hours||0).filter(h=>h>0));
    const sleepLast = Utils.avg(lastWeek.map(d => logs.find(l=>l.date===d)?.hours||0).filter(h=>h>0));
    const sleepDiff = Utils.round(sleepThis - sleepLast);

    const calThis = Utils.avg(thisWeek.map(d => Object.values(Storage.getMealDay(d)).flat().reduce((s,f)=>s+(f.kcal||0),0)).filter(c=>c>0));
    const calLast = Utils.avg(lastWeek.map(d => Object.values(Storage.getMealDay(d)).flat().reduce((s,f)=>s+(f.kcal||0),0)).filter(c=>c>0));
    const calDiff = Math.round(calThis - calLast);

    function trendRow(label, diff, unit='') {
      const up = diff > 0;
      const arrow = up ? '↑' : diff < 0 ? '↓' : '→';
      const cls   = up ? 'trend-up' : diff < 0 ? 'trend-down' : '';
      return `
        <div class="trend-item">
          <span class="trend-label">${label}</span>
          <span class="trend-change ${cls}">${arrow} ${Math.abs(diff)}${unit} vs sem. anterior</span>
        </div>`;
    }

    return `
    <div class="card" style="margin-bottom:12px">
      <h3 style="margin-bottom:12px">Esta semana vs anterior</h3>
      ${trendRow('Días de gym', gymDiff, ' días')}
      ${trendRow('Sueño promedio', sleepDiff, 'h')}
      ${trendRow('Calorías promedio', calDiff, ' kcal')}
    </div>
    <div class="card" style="margin-bottom:12px">
      <h3 style="margin-bottom:12px">Rachas actuales</h3>
      <div class="trend-item">
        <span class="trend-label">🔥 Racha de gym</span>
        <span class="badge badge-accent">${streaks.gym} días</span>
      </div>
      <div class="trend-item">
        <span class="trend-label">🌙 Racha de sueño</span>
        <span class="badge badge-success">${streaks.sleep} días</span>
      </div>
    </div>
    <div class="card">
      <h3 style="margin-bottom:12px">Objetivos cumplidos esta semana</h3>
      ${_objectiveRow('Gym', gymThis, goals.gymDays || 4)}
      ${_objectiveRow('Calorías (días)', thisWeek.filter(d => {
        const kcal = Object.values(Storage.getMealDay(d)).flat().reduce((s,f)=>s+(f.kcal||0),0);
        return kcal > 0 && Math.abs(kcal - (goals.calGoal||2200)) < 300;
      }).length, 7)}
      ${_objectiveRow('Sueño (días)', thisWeek.filter(d => {
        const h = logs.find(l=>l.date===d)?.hours || 0;
        return h >= (goals.sleepHours || 8);
      }).length, 7)}
    </div>`;
  }

  function _objectiveRow(label, current, goal) {
    const pct = Utils.pct(current, goal);
    return `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.85rem">
        <span>${label}</span><span style="color:var(--accent);font-weight:700">${current}/${goal}</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill ${pct>=100?'success':''}" style="width:${pct}%"></div>
      </div>
    </div>`;
  }

  // ================================================================
  // COMPARATIVA
  // ================================================================
  function renderCompare() {
    return `
    <p class="section-title" style="margin-top:0">Gym – esta semana vs anterior</p>
    <div class="chart-container" style="margin-bottom:12px">
      <canvas id="cmp-gym-chart" style="width:100%;height:120px"></canvas>
    </div>
    <p class="section-title">Sueño – este mes vs anterior</p>
    <div class="chart-container">
      <canvas id="cmp-sleep-chart" style="width:100%;height:120px"></canvas>
    </div>`;
  }

  function renderCompareCharts() {
    const workouts = Storage.getGymWorkouts();
    const logs     = Storage.getSleepLogs();

    const gymCanvas = document.getElementById('cmp-gym-chart');
    if (gymCanvas) {
      const WEEK_DAYS = ['L','M','X','J','V','S','D'];
      const thisWeek = Utils.lastNDays(7);
      const lastWeek = Utils.lastNDays(14).slice(0,7);
      const ctx = gymCanvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const w = gymCanvas.offsetWidth, h = gymCanvas.offsetHeight;
      gymCanvas.width = w*dpr; gymCanvas.height = h*dpr;
      ctx.scale(dpr,dpr);
      ctx.clearRect(0,0,w,h);
      const pad = 12, barW = (w - pad*2) / 7 / 2 - 4, gap = (w-pad*2)/7;
      WEEK_DAYS.forEach((d,i) => {
        const x = pad + i*gap;
        const v1 = workouts.some(wo => wo.date === lastWeek[i]) ? 1 : 0;
        const v2 = workouts.some(wo => wo.date === thisWeek[i]) ? 1 : 0;
        // Sem anterior (gris)
        ctx.fillStyle = 'rgba(159,168,218,0.3)';
        ctx.fillRect(x, h-pad-20-(v1*(h-pad*2-20)), barW, v1*(h-pad*2-20));
        // Esta sem (color)
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(x+barW+2, h-pad-20-(v2*(h-pad*2-20)), barW, v2*(h-pad*2-20));
        ctx.fillStyle = 'rgba(159,168,218,0.7)';
        ctx.font = `${10*dpr}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(d, x+barW, h-4);
      });
    }

    const sleepCanvas = document.getElementById('cmp-sleep-chart');
    if (sleepCanvas) {
      const thisMonth = Utils.lastNDays(30);
      const lastMonth = Utils.lastNDays(60).slice(0,30);
      const data1 = lastMonth.map(d => logs.find(l=>l.date===d)?.hours||0);
      const data2 = thisMonth.map(d => logs.find(l=>l.date===d)?.hours||0);
      // Simplificar a 4 semanas
      const weekAvg = arr => [0,1,2,3].map(w => Utils.avg(arr.slice(w*7,(w+1)*7).filter(h=>h>0)) || 0);
      Utils.drawBarChart(sleepCanvas, weekAvg(data2), ['Sem 1','Sem 2','Sem 3','Sem 4'],
        { color:'#6bcb77', bgColor:'rgba(107,203,119,0.1)' });
    }
  }

  return { render, onEnter, switchTab };
})();

window.StatsModule = StatsModule;
