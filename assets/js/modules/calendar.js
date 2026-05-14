/**
 * CALENDAR.JS – Módulo de Calendario y Agenda
 */

const CalendarModule = (() => {

  let viewDate    = new Date();
  let selectedDay = Utils.today();
  let currentView = 'month'; // 'month' | 'day'

  const CATEGORIES = [
    { id:'personal', label:'Personal', color:'#6C63FF' },
    { id:'trabajo',  label:'Trabajo',  color:'#ff6b6b' },
    { id:'gym',      label:'Gym',      color:'#ffd93d' },
    { id:'salud',    label:'Salud',    color:'#6bcb77' },
    { id:'otro',     label:'Otro',     color:'#9fa8da' },
  ];

  // ================================================================
  // RENDER
  // ================================================================
  function render() {
    return `<div id="cal-view" class="anim-fade-in"><div id="cal-content"></div></div>`;
  }

  function onEnter() { renderCalendar(); }

  function renderCalendar() {
    const container = document.getElementById('cal-content');
    if (!container) return;
    container.innerHTML = currentView === 'month' ? renderMonth() : renderDay();
  }

  // ================================================================
  // VISTA MENSUAL
  // ================================================================
  function renderMonth() {
    const year  = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const dayNames   = ['L','M','X','J','V','S','D'];

    const firstDay = new Date(year, month, 1);
    let startDow = firstDay.getDay() - 1; // lunes=0
    if (startDow < 0) startDow = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const events = Storage.getCalEvents();

    const nav = `
      <div class="cal-nav">
        <button class="icon-btn" onclick="CalendarModule.prevMonth()" aria-label="Mes anterior">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 class="cal-month-title">${monthNames[month]} ${year}</h2>
        <button class="icon-btn" onclick="CalendarModule.nextMonth()" aria-label="Mes siguiente">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>`;

    const headers = dayNames.map(d => `<div class="cal-header-cell">${d}</div>`).join('');

    let cells = '';
    // Celdas vacías al inicio
    for (let i = 0; i < startDow; i++) cells += `<div class="cal-day other-month"></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday    = dateStr === Utils.today();
      const isSelected = dateStr === selectedDay;
      const hasEvent   = events.some(e => e.date === dateStr);
      cells += `<div class="cal-day ${isToday?'today':''} ${isSelected?'selected':''} ${hasEvent?'has-event':''}"
        onclick="CalendarModule.selectDay('${dateStr}')" role="button" tabindex="0"
        aria-label="${d} de ${monthNames[month]}" aria-pressed="${isSelected}">
        ${d}
      </div>`;
    }

    // Eventos del día seleccionado
    const dayEvents = events.filter(e => e.date === selectedDay).sort((a,b) => (a.startTime||'').localeCompare(b.startTime||''));
    const eventsHTML = dayEvents.length === 0
      ? `<p style="color:var(--text-muted);font-size:0.85rem;padding:12px 0">Sin eventos para este día</p>`
      : dayEvents.map(ev => renderEventItem(ev)).join('');

    return `
      ${nav}
      <div class="calendar-grid">${headers}${cells}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0">
        <h3 style="font-size:0.95rem">${Utils.formatShortDate(selectedDay)}</h3>
        <button class="btn btn-primary btn-sm" onclick="CalendarModule.addEventModal()">+ Evento</button>
      </div>
      <div id="day-events">${eventsHTML}</div>`;
  }

  // ================================================================
  // VISTA DIARIA (AGENDA)
  // ================================================================
  function renderDay() {
    const events = Storage.getCalEvents()
      .filter(e => e.date === selectedDay)
      .sort((a,b) => (a.startTime||'').localeCompare(b.startTime||''));

    return `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <button class="icon-btn" onclick="CalendarModule.switchView('month')" aria-label="Volver">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style="flex:1">${Utils.formatDate(selectedDay)}</h2>
        <button class="btn btn-primary btn-sm" onclick="CalendarModule.addEventModal()">+ Evento</button>
      </div>
      ${events.length === 0
        ? `<div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <h3>Día libre</h3><p>No tienes eventos programados</p>
          </div>`
        : `<div class="stagger">${events.map(ev => renderEventItem(ev)).join('')}</div>`
      }`;
  }

  function renderEventItem(ev) {
    const cat = CATEGORIES.find(c => c.id === ev.category) || CATEGORIES[4];
    return `
      <div class="event-item card-clickable" onclick="CalendarModule.showEventDetail('${ev.id}')">
        <div class="event-time-col">
          <span class="event-time">${ev.startTime || '--'}</span>
          <div class="event-line" style="background:${cat.color}"></div>
        </div>
        <div class="event-body">
          <div class="event-title">${Utils.escapeHtml(ev.title)}</div>
          ${ev.description ? `<div class="event-desc">${Utils.escapeHtml(ev.description)}</div>` : ''}
          <span class="badge event-cat" style="background:${cat.color}22;color:${cat.color}">${cat.label}</span>
          ${ev.endTime ? `<span style="font-size:0.75rem;color:var(--text-muted);margin-left:8px">hasta ${ev.endTime}</span>` : ''}
        </div>
      </div>`;
  }

  // ================================================================
  // ACCIONES
  // ================================================================
  function prevMonth() {
    viewDate.setMonth(viewDate.getMonth() - 1);
    renderCalendar();
  }

  function nextMonth() {
    viewDate.setMonth(viewDate.getMonth() + 1);
    renderCalendar();
  }

  function selectDay(dateStr) {
    selectedDay = dateStr;
    if (currentView === 'month') {
      // Actualizar celdas
      document.querySelectorAll('.cal-day').forEach(cell => cell.classList.remove('selected'));
      const clicked = [...document.querySelectorAll('.cal-day')].find(c =>
        c.getAttribute('aria-pressed') === 'true' || c.textContent.trim() == new Date(dateStr+'T00:00:00').getDate()
      );
      renderCalendar(); // Re-render para actualizar día seleccionado y eventos
    }
  }

  function switchView(view) {
    currentView = view;
    renderCalendar();
  }

  function addEventModal(editId = null) {
    const events = Storage.getCalEvents();
    const ev = editId ? events.find(e => e.id === editId) : {
      title:'', date: selectedDay, startTime:'09:00', endTime:'10:00', description:'', category:'personal'
    };
    if (!ev) return;

    const catsHTML = CATEGORIES.map(c =>
      `<option value="${c.id}" ${ev.category===c.id?'selected':''}>${c.label}</option>`
    ).join('');

    openModal(`
      <h3>${editId ? 'Editar' : 'Nuevo'} evento</h3>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
        <div class="input-group">
          <label class="input-label">Título *</label>
          <input id="ev-title" class="input" type="text" value="${Utils.escapeHtml(ev.title)}" placeholder="Ej: Médico, Reunión..." />
        </div>
        <div class="input-group">
          <label class="input-label">Fecha</label>
          <input id="ev-date" class="input" type="date" value="${ev.date}" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="input-group">
            <label class="input-label">Inicio</label>
            <input id="ev-start" class="input" type="time" value="${ev.startTime}" />
          </div>
          <div class="input-group">
            <label class="input-label">Fin</label>
            <input id="ev-end" class="input" type="time" value="${ev.endTime}" />
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">Categoría</label>
          <select id="ev-cat" class="input select">${catsHTML}</select>
        </div>
        <div class="input-group">
          <label class="input-label">Descripción – opcional</label>
          <input id="ev-desc" class="input" type="text" value="${Utils.escapeHtml(ev.description||'')}" placeholder="Notas adicionales..." />
        </div>
        <button class="btn btn-primary btn-full" onclick="CalendarModule.saveEvent('${editId||''}')">
          ${editId ? 'Actualizar' : 'Crear evento'}
        </button>
        ${editId ? `<button class="btn btn-danger btn-sm btn-full" onclick="CalendarModule.deleteEvent('${editId}')">Eliminar</button>` : ''}
      </div>
    `);
  }

  function saveEvent(editId) {
    const title    = document.getElementById('ev-title')?.value.trim();
    const date     = document.getElementById('ev-date')?.value;
    const startTime= document.getElementById('ev-start')?.value;
    const endTime  = document.getElementById('ev-end')?.value;
    const category = document.getElementById('ev-cat')?.value;
    const description = document.getElementById('ev-desc')?.value.trim();

    if (!title) { showToast('El título es obligatorio', 'error'); return; }
    if (!date)  { showToast('La fecha es obligatoria', 'error'); return; }

    const events = Storage.getCalEvents();
    const ev = { id: editId || Utils.uid(), title, date, startTime, endTime, category, description };

    if (editId) {
      const idx = events.findIndex(e => e.id === editId);
      if (idx >= 0) events[idx] = ev;
    } else {
      events.push(ev);
      Storage.addXP(5);
    }

    Storage.saveCalEvents(events);
    selectedDay = date;
    closeModal();
    renderCalendar();
    showToast(editId ? 'Evento actualizado' : 'Evento creado', 'success');
    Utils.haptic([15]);
  }

  function showEventDetail(id) {
    const ev = Storage.getCalEvents().find(e => e.id === id);
    if (!ev) return;
    const cat = CATEGORIES.find(c => c.id === ev.category) || CATEGORIES[4];
    openModal(`
      <div style="margin-bottom:8px">
        <span class="badge" style="background:${cat.color}22;color:${cat.color}">${cat.label}</span>
      </div>
      <h2 style="margin-bottom:8px">${Utils.escapeHtml(ev.title)}</h2>
      <p style="color:var(--text-muted);font-size:0.88rem;margin-bottom:4px">${Utils.formatDate(ev.date)}</p>
      ${ev.startTime ? `<p style="color:var(--text-muted);font-size:0.88rem;margin-bottom:12px">${ev.startTime}${ev.endTime ? ' → '+ev.endTime : ''}</p>` : ''}
      ${ev.description ? `<p style="margin-bottom:16px">${Utils.escapeHtml(ev.description)}</p>` : ''}
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary btn-full" onclick="CalendarModule.addEventModal('${id}');closeModal()">Editar</button>
        <button class="btn btn-danger" onclick="CalendarModule.deleteEvent('${id}')">Eliminar</button>
      </div>
    `);
  }

  function deleteEvent(id) {
    const events = Storage.getCalEvents().filter(e => e.id !== id);
    Storage.saveCalEvents(events);
    closeModal();
    renderCalendar();
    showToast('Evento eliminado', 'info');
  }

  // ================================================================
  // API PÚBLICA
  // ================================================================
  return {
    render, onEnter,
    prevMonth, nextMonth,
    selectDay, switchView,
    addEventModal, saveEvent, showEventDetail, deleteEvent
  };
})();

window.CalendarModule = CalendarModule;
