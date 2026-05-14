/**
 * UTILS.JS – Rutina App
 * Funciones utilitarias puras, sin efectos secundarios.
 * No depende de ningún otro módulo.
 */

const Utils = (() => {

  // ================================================================
  // FECHAS Y TIEMPO
  // ================================================================

  /** Devuelve la fecha de hoy como string YYYY-MM-DD */
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  /** Formatea una fecha ISO a string legible */
  function formatDate(dateStr, locale = 'es-ES') {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  }

  /** Formatea solo día + mes */
  function formatShortDate(dateStr, locale = 'es-ES') {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  }

  /** Devuelve el nombre del día de la semana (0=Dom...6=Sáb) */
  function getDayName(dayIndex) {
    const names = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    return names[dayIndex] ?? '';
  }

  /** Devuelve el nombre corto del día */
  function getDayShort(dayIndex) {
    const names = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    return names[dayIndex] ?? '';
  }

  /** Convierte minutos a formato hh:mm */
  function minsToHHMM(mins) {
    const h = Math.floor(Math.abs(mins) / 60);
    const m = Math.abs(mins) % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  /** Convierte hh:mm a minutos */
  function hhmmToMins(hhmm) {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    return h * 60 + m;
  }

  /** Diferencia en horas entre dos hhmm (admite cruce de medianoche) */
  function hoursBetween(startHHMM, endHHMM) {
    let startMins = hhmmToMins(startHHMM);
    let endMins   = hhmmToMins(endHHMM);
    if (endMins <= startMins) endMins += 24 * 60; // cruce medianoche
    return parseFloat(((endMins - startMins) / 60).toFixed(2));
  }

  /** Array de los últimos N días como strings YYYY-MM-DD */
  function lastNDays(n) {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }

  /** Inicio de semana (lunes) para una fecha dada */
  function weekStart(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay(); // 0=Dom
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }

  // ================================================================
  // NÚMEROS Y MATEMÁTICAS
  // ================================================================

  /** Clamp un valor entre min y max */
  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  /** Porcentaje redondeado (0–100) */
  function pct(value, total) {
    if (!total) return 0;
    return Math.min(100, Math.round((value / total) * 100));
  }

  /** Promedio de un array */
  function avg(arr) {
    if (!arr.length) return 0;
    return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
  }

  /** Redondea a N decimales */
  function round(val, decimals = 1) {
    return parseFloat(val.toFixed(decimals));
  }

  // ================================================================
  // DOM HELPERS
  // ================================================================

  /** Crea un elemento con atributos y contenido */
  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') e.className = v;
      else if (k === 'innerHTML') e.innerHTML = v;
      else if (k === 'textContent') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v);
    }
    for (const child of children) {
      if (child instanceof Node) e.appendChild(child);
      else if (typeof child === 'string') e.appendChild(document.createTextNode(child));
    }
    return e;
  }

  /** $ y $$ como aliases */
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  /** Muestra/oculta elementos */
  function show(el)   { el?.classList.remove('hidden'); }
  function hide(el)   { el?.classList.add('hidden'); }
  function toggle(el) { el?.classList.toggle('hidden'); }

  /** Anima entrada de un elemento */
  function animateIn(element, cls = 'anim-fade-in') {
    if (!element) return;
    element.classList.remove(cls);
    void element.offsetWidth; // fuerza reflow
    element.classList.add(cls);
  }

  // ================================================================
  // STRING HELPERS
  // ================================================================

  /** Capitaliza primera letra */
  function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  }

  /** Genera un ID único */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /** Escapa HTML */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ================================================================
  // VIBRACIÓN HÁPTICA
  // ================================================================

  function haptic(pattern = [20]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // ================================================================
  // FORMATO DE NÚMEROS
  // ================================================================

  function formatKcal(n) {
    return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(Math.round(n));
  }

  function formatWeight(kg) {
    return `${round(kg, 1)} kg`;
  }

  function formatDuration(mins) {
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins/60)}h ${mins%60}min`;
  }

  // ================================================================
  // GRÁFICAS SIMPLES (Canvas sin librerías)
  // ================================================================

  /**
   * Dibuja un gráfico de barras simple en un canvas.
   * @param {HTMLCanvasElement} canvas
   * @param {number[]} data - valores
   * @param {string[]} labels - etiquetas
   * @param {object} opts
   */
  function drawBarChart(canvas, data, labels, opts = {}) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const {
      color = '#6C63FF',
      bgColor = 'rgba(108,99,255,0.1)',
      textColor = '#9fa8da',
      padding = 16,
      barRadius = 4
    } = opts;

    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...data, 1);
    const n = data.length;
    const chartH = h - padding * 2 - 20;
    const chartW = w - padding * 2;
    const barW = (chartW / n) * 0.6;
    const gap   = (chartW / n) * 0.4;

    data.forEach((val, i) => {
      const barH = (val / maxVal) * chartH;
      const x = padding + i * (barW + gap) + gap / 2;
      const y = padding + chartH - barH;

      // Fondo barra
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      roundRect(ctx, x, padding, barW, chartH, barRadius);
      ctx.fill();

      // Barra real
      ctx.fillStyle = color;
      ctx.beginPath();
      roundRect(ctx, x, y, barW, barH, barRadius);
      ctx.fill();

      // Etiqueta
      ctx.fillStyle = textColor;
      ctx.font = `${dpr > 1 ? 10 : 11}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText(labels[i] || '', x + barW / 2, h - 4);
    });
  }

  /**
   * Dibuja un gráfico de línea simple.
   */
  function drawLineChart(canvas, data, labels, opts = {}) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const {
      color = '#6C63FF',
      fillColor = 'rgba(108,99,255,0.15)',
      textColor = '#9fa8da',
      padding = 16
    } = opts;

    ctx.clearRect(0, 0, w, h);
    if (!data.length) return;

    const maxVal = Math.max(...data, 1);
    const minVal = Math.min(...data, 0);
    const range  = maxVal - minVal || 1;
    const chartH = h - padding * 2 - 16;
    const chartW = w - padding * 2;
    const stepX  = chartW / Math.max(data.length - 1, 1);

    const points = data.map((val, i) => ({
      x: padding + i * stepX,
      y: padding + chartH - ((val - minVal) / range) * chartH
    }));

    // Área rellena
    ctx.beginPath();
    ctx.moveTo(points[0].x, h - padding - 16);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h - padding - 16);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Línea
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Puntos
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'var(--bg-card, #16213e)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Etiquetas
    ctx.fillStyle = textColor;
    ctx.font = `${dpr > 1 ? 9 : 10}px system-ui`;
    ctx.textAlign = 'center';
    points.forEach((p, i) => {
      if (labels[i]) ctx.fillText(labels[i], p.x, h - 4);
    });
  }

  /** Helper para rect redondeado en Canvas */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ================================================================
  // CIFRADO SIMPLE (XOR + base64) – no criptográfico, solo ofuscación
  // ================================================================
  function simpleEncrypt(str, key = 'rutina42') {
    let out = '';
    for (let i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(out);
  }

  function simpleDecrypt(encoded, key = 'rutina42') {
    try {
      const str = atob(encoded);
      let out = '';
      for (let i = 0; i < str.length; i++) {
        out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return out;
    } catch { return null; }
  }

  // ================================================================
  // DEBOUNCE / THROTTLE
  // ================================================================
  function debounce(fn, ms = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function throttle(fn, ms = 200) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn(...args); }
    };
  }

  // ================================================================
  // API PÚBLICA
  // ================================================================
  return {
    today, formatDate, formatShortDate, getDayName, getDayShort,
    minsToHHMM, hhmmToMins, hoursBetween, lastNDays, weekStart,
    clamp, pct, avg, round,
    el, $, $$, show, hide, toggle, animateIn,
    capitalize, uid, escapeHtml,
    haptic,
    formatKcal, formatWeight, formatDuration,
    drawBarChart, drawLineChart,
    simpleEncrypt, simpleDecrypt,
    debounce, throttle
  };
})();

// Expose globally
window.Utils = Utils;
