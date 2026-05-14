/**
 * NOTIFICATIONS.JS – Sistema de notificaciones internas y push.
 */

const Notifications = (() => {

  let scheduledTimers = [];

  // ================================================================
  // INIT
  // ================================================================
  function init() {
    _scheduleAll();
    _checkMissed();
  }

  // ================================================================
  // NOTIFICACIONES INTERNAS (cola)
  // ================================================================
  function addInternal(title, body) {
    const queue = Storage.getNotifQueue();
    queue.push({
      id:    Utils.uid(),
      title,
      body,
      time:  new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' }),
      read:  false,
    });
    // Limitar a 50
    if (queue.length > 50) queue.splice(0, queue.length - 50);
    Storage.saveNotifQueue(queue);
    if (typeof App !== 'undefined') App.updateNotifBadge();
  }

  // ================================================================
  // PUSH (nativa del navegador)
  // ================================================================
  async function requestPermission() {
    if (!('Notification' in window)) {
      showToast('Tu navegador no soporta notificaciones', 'warning');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied')  {
      showToast('Notificaciones bloqueadas. Actívalas en la configuración del navegador.', 'warning', 5000);
      return false;
    }
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  function sendPush(title, body, options = {}) {
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        body,
        icon: './assets/icons/icon-192.png',
        badge: './assets/icons/icon-192.png',
        ...options
      });
    } catch (e) {
      console.warn('[Notifications] Error al enviar push:', e);
    }
  }

  // ================================================================
  // RECORDATORIOS PROGRAMADOS
  // ================================================================
  function _scheduleAll() {
    // Limpiar timers anteriores
    scheduledTimers.forEach(t => clearTimeout(t));
    scheduledTimers = [];

    const settings = Storage.getNotifSettings();
    if (!settings.enabled) return;

    const now  = new Date();
    const today = now.toLocaleDateString('es-ES', { weekday:'long' });

    // Gym
    if (settings.gym && settings.gymTime) {
      _scheduleAt(settings.gymTime, '💪 Hora de entrenar', '¡Tu rutina de hoy te espera!');
    }

    // Comidas
    if (settings.meals && settings.mealsTime) {
      const mealNames = ['Desayuno','Almuerzo','Comida','Merienda','Cena'];
      settings.mealsTime.forEach((t, i) => {
        _scheduleAt(t, `🍽️ ${mealNames[i]}`, 'Recuerda registrar tu comida');
      });
    }

    // Sueño
    if (settings.sleep && settings.sleepTime) {
      _scheduleAt(settings.sleepTime, '😴 Hora de dormir', `Tu objetivo es ${Storage.getSleepSettings().targetBedtime}`);
    }
  }

  function _scheduleAt(hhmm, title, body) {
    const now   = new Date();
    const [h, m] = hhmm.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1); // mañana
    const ms = target - now;
    const t = setTimeout(() => {
      addInternal(title, body);
      sendPush(title, body);
      // Re-programar para mañana
      _scheduleAt(hhmm, title, body);
    }, ms);
    scheduledTimers.push(t);
  }

  function _checkMissed() {
    // Añadir notificación de bienvenida si hace más de un día que no se abre
    const lastActive = Storage.get(Storage.KEYS.lastActive, 0);
    const diff = Date.now() - lastActive;
    if (diff > 24 * 60 * 60 * 1000 && lastActive > 0) {
      addInternal('👋 ¡Te echamos de menos!', 'Han pasado más de 24h. Retoma tus rutinas hoy.');
    }
  }

  // ================================================================
  // SETTINGS UI
  // ================================================================
  function showSettings() {
    const s = Storage.getNotifSettings();

    openModal(`
      <h3>Notificaciones</h3>
      <p style="color:var(--text-muted);font-size:0.82rem;margin-bottom:16px">
        Las notificaciones te recuerdan entrenar, comer y dormir a tiempo.
      </p>

      <div class="card" style="margin-bottom:12px">
        <div class="setting-row">
          <div class="setting-info"><h4>Activar notificaciones</h4><p>Requiere permiso del navegador</p></div>
          <label class="toggle">
            <input type="checkbox" id="n-enabled" ${s.enabled?'checked':''} onchange="Notifications.toggleEnabled(this.checked)" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div id="notif-detail" style="${s.enabled?'':'display:none'}">
        <div class="card" style="margin-bottom:12px">
          <div class="setting-row">
            <div class="setting-info"><h4>💪 Recordatorio de gym</h4></div>
            <label class="toggle"><input type="checkbox" id="n-gym" ${s.gym?'checked':''} /><span class="toggle-slider"></span></label>
          </div>
          <input type="time" id="n-gym-time" class="input" value="${s.gymTime||'08:00'}" style="margin-top:8px" />
        </div>

        <div class="card" style="margin-bottom:12px">
          <div class="setting-row">
            <div class="setting-info"><h4>😴 Recordatorio de sueño</h4></div>
            <label class="toggle"><input type="checkbox" id="n-sleep" ${s.sleep?'checked':''} /><span class="toggle-slider"></span></label>
          </div>
          <input type="time" id="n-sleep-time" class="input" value="${s.sleepTime||'22:30'}" style="margin-top:8px" />
        </div>

        <div class="card" style="margin-bottom:12px">
          <div class="setting-row">
            <div class="setting-info"><h4>🍽️ Recordatorio de comidas</h4></div>
            <label class="toggle"><input type="checkbox" id="n-meals" ${s.meals?'checked':''} /><span class="toggle-slider"></span></label>
          </div>
        </div>

        <button class="btn btn-primary btn-full" onclick="Notifications.saveSettings()">Guardar</button>
      </div>
    `);
  }

  async function toggleEnabled(checked) {
    const detail = document.getElementById('notif-detail');
    if (checked) {
      const granted = await requestPermission();
      if (!granted) {
        document.getElementById('n-enabled').checked = false;
        return;
      }
      detail?.style.removeProperty('display');
    } else {
      if (detail) detail.style.display = 'none';
    }
  }

  function saveSettings() {
    const s = {
      enabled:   document.getElementById('n-enabled')?.checked || false,
      gym:       document.getElementById('n-gym')?.checked || false,
      gymTime:   document.getElementById('n-gym-time')?.value || '08:00',
      sleep:     document.getElementById('n-sleep')?.checked || false,
      sleepTime: document.getElementById('n-sleep-time')?.value || '22:30',
      meals:     document.getElementById('n-meals')?.checked || false,
      mealsTime: ['08:00','13:00','15:00','19:00','21:00'],
    };
    Storage.saveNotifSettings(s);
    _scheduleAll();
    closeModal();
    showToast('Notificaciones configuradas', 'success');
  }

  // ================================================================
  // API PÚBLICA
  // ================================================================
  return { init, addInternal, sendPush, requestPermission, showSettings, toggleEnabled, saveSettings };
})();

window.Notifications = Notifications;
