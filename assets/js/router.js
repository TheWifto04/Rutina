/**
 * ROUTER.JS – Rutina App
 * Router SPA basado en hash (#).
 */

const Router = (() => {

  const routes = {};
  let currentRoute = null;
  let previousRoute = null;
  const listeners = [];

  function register(name, renderFn, onEnter, onLeave) {
    routes[name] = { render: renderFn, onEnter, onLeave };
  }

  function navigate(route, pushState = true) {
    if (route === currentRoute) return;
    if (currentRoute && routes[currentRoute]?.onLeave) routes[currentRoute].onLeave();
    previousRoute = currentRoute;
    currentRoute  = route;
    if (pushState) window.location.hash = route;
    _render(route);
    _updateNav(route);
    _notifyListeners(route);
  }

  function _render(route) {
    const main = document.getElementById('main-content');
    if (!main) return;
    const def = routes[route];
    if (!def) {
      main.innerHTML = `<div class="empty-state anim-fade-in">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg><h3>Página no encontrada</h3><p>La ruta <b>${route}</b> no existe.</p></div>`;
      return;
    }
    const content = def.render();
    if (typeof content === 'string') main.innerHTML = content;
    else if (content instanceof Node) { main.innerHTML = ''; main.appendChild(content); }
    main.scrollTop = 0;
    main.classList.add('anim-fade-in');
    setTimeout(() => main.classList.remove('anim-fade-in'), 400);
    if (def.onEnter) requestAnimationFrame(() => { try { def.onEnter(); } catch(e){ console.error(e); } });
  }

  function _updateNav(route) {
    document.querySelectorAll('.nav-item').forEach(item => {
      const active = item.dataset.route === route;
      item.classList.toggle('active', active);
      item.setAttribute('aria-current', active ? 'page' : 'false');
    });
    const titles = {
      home:'Inicio', gym:'💪 Gimnasio', meals:'🍽️ Comidas',
      sleep:'😴 Sueño', stats:'📊 Estadísticas', calendar:'📅 Agenda',
      goals:'🎯 Objetivos', settings:'⚙️ Configuración'
    };
    const t = document.getElementById('page-title');
    if (t) t.textContent = titles[route] || route;
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i > -1) listeners.splice(i,1); };
  }

  function _notifyListeners(route) {
    listeners.forEach(fn => { try { fn(route, previousRoute); } catch(e){} });
  }

  function init() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1) || 'home';
      navigate(hash, false);
    });
    const initial = window.location.hash.slice(1) || 'home';
    navigate(initial, false);
  }

  function getCurrent()  { return currentRoute; }
  function getPrevious() { return previousRoute; }

  return { register, navigate, init, onChange, getCurrent, getPrevious };
})();

window.Router = Router;
