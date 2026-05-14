/**
 * ONBOARDING.JS – Pantallas de bienvenida e introducción.
 */

const Onboarding = (() => {

  const SLIDES = [
    {
      icon: '👋',
      color: '#6C63FF',
      bg: 'rgba(108,99,255,0.15)',
      title: '¡Bienvenido a Rutina App!',
      desc: 'Tu compañero diario para gestionar el gimnasio, la alimentación, el sueño y mucho más.',
    },
    {
      icon: '💪',
      color: '#ff6b6b',
      bg: 'rgba(255,107,107,0.15)',
      title: 'Gym sin excusas',
      desc: 'Crea tus rutinas, registra cada entrenamiento, usa el temporizador de descanso y sigue tu progreso.',
    },
    {
      icon: '🍽️',
      color: '#ffd93d',
      bg: 'rgba(255,217,61,0.15)',
      title: 'Nutrición inteligente',
      desc: 'Registra tus 5 comidas, controla calorías y macros, y cumple tus objetivos nutricionales.',
    },
    {
      icon: '😴',
      color: '#6bcb77',
      bg: 'rgba(107,203,119,0.15)',
      title: 'Duerme mejor',
      desc: 'Monitoriza tus horas de sueño, mantén una racha y mejora tu descanso cada semana.',
    },
    {
      icon: '🎯',
      color: '#ff9f43',
      bg: 'rgba(255,159,67,0.15)',
      title: 'Objetivos y logros',
      desc: 'Gana XP con cada acción, sube de nivel y desbloquea logros conforme mejoras.',
    },
    {
      icon: '⚙️',
      color: '#9fa8da',
      bg: 'rgba(159,168,218,0.15)',
      title: 'Configuración inicial',
      desc: 'Personaliza tu nombre y tus objetivos para una experiencia a tu medida.',
      isSetup: true,
    },
  ];

  let currentSlide = 0;
  let onFinish = null;

  // ================================================================
  // SHOW / HIDE
  // ================================================================
  function show(callback) {
    onFinish = callback;
    currentSlide = 0;
    const screen = document.getElementById('onboarding-screen');
    screen.innerHTML = buildHTML();
    Utils.show(screen);
    updateSlide();
    bindEvents();
  }

  function buildHTML() {
    const slidesHTML = SLIDES.map((s, i) => {
      if (s.isSetup) {
        return `
          <div class="onboarding-slide" data-slide="${i}">
            <div class="onboarding-icon" style="background:${s.bg};font-size:2.5rem">${s.icon}</div>
            <h2>${s.title}</h2>
            <p>${s.desc}</p>
            <div style="width:100%;display:flex;flex-direction:column;gap:12px;margin-top:8px">
              <div class="input-group">
                <label class="input-label">Tu nombre</label>
                <input id="ob-name" class="input" type="text" placeholder="Ej: Carlos" maxlength="30" />
              </div>
              <div class="input-group">
                <label class="input-label">¿Cuántos días al gym por semana?</label>
                <select id="ob-gym-days" class="input select">
                  <option value="2">2 días</option>
                  <option value="3">3 días</option>
                  <option value="4" selected>4 días</option>
                  <option value="5">5 días</option>
                  <option value="6">6 días</option>
                </select>
              </div>
              <div class="input-group">
                <label class="input-label">Objetivo de calorías (kcal/día)</label>
                <input id="ob-cal" class="input" type="number" value="2200" min="1000" max="6000" />
              </div>
            </div>
          </div>`;
      }
      return `
        <div class="onboarding-slide" data-slide="${i}">
          <div class="onboarding-icon" style="background:${s.bg};font-size:2.5rem">${s.icon}</div>
          <h2>${s.title}</h2>
          <p>${s.desc}</p>
        </div>`;
    }).join('');

    const dotsHTML = SLIDES.map((_, i) =>
      `<div class="o-dot ${i===0?'active':''}" data-dot="${i}"></div>`
    ).join('');

    return `
      <div class="onboarding-slides" id="ob-slides">${slidesHTML}</div>
      <div class="onboarding-footer">
        <div class="onboarding-dots" id="ob-dots">${dotsHTML}</div>
        <button class="btn btn-primary btn-lg btn-full" id="ob-next">Siguiente →</button>
        <button class="btn btn-ghost btn-full" id="ob-skip">Omitir introducción</button>
      </div>`;
  }

  function bindEvents() {
    document.getElementById('ob-next')?.addEventListener('click', nextSlide);
    document.getElementById('ob-skip')?.addEventListener('click', finish);
  }

  function nextSlide() {
    if (currentSlide === SLIDES.length - 1) {
      saveSetup();
      finish();
      return;
    }
    currentSlide++;
    updateSlide();
    Utils.haptic([10]);
  }

  function updateSlide() {
    const total = SLIDES.length;
    // Mover slides
    const slidesEl = document.getElementById('ob-slides');
    if (slidesEl) {
      slidesEl.style.transform = `translateX(-${currentSlide * 100}%)`;
      slidesEl.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1)';
    }

    // Dots
    document.querySelectorAll('.o-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });

    // Botón
    const btn = document.getElementById('ob-next');
    if (btn) {
      btn.textContent = currentSlide === total - 1 ? '¡Comenzar! 🚀' : 'Siguiente →';
    }

    // Skip visible solo en primeras pantallas
    const skip = document.getElementById('ob-skip');
    if (skip) skip.style.display = currentSlide >= total - 1 ? 'none' : 'block';
  }

  function saveSetup() {
    const name    = document.getElementById('ob-name')?.value.trim() || 'Usuario';
    const gymDays = parseInt(document.getElementById('ob-gym-days')?.value) || 4;
    const calGoal = parseInt(document.getElementById('ob-cal')?.value) || 2200;

    const settings = Storage.getSettings();
    settings.userName = name;
    Storage.saveSettings(settings);

    const goals = Storage.getGoals();
    goals.gymDays = gymDays;
    goals.calGoal = calGoal;
    Storage.saveGoals(goals);

    const mealSettings = Storage.getMealSettings();
    mealSettings.calGoal = calGoal;
    Storage.saveMealSettings(mealSettings);
  }

  function finish() {
    const screen = document.getElementById('onboarding-screen');
    Utils.hide(screen);
    if (typeof onFinish === 'function') onFinish();
  }

  return { show };
})();

window.Onboarding = Onboarding;
