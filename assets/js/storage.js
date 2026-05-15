/**
 * STORAGE.JS – Rutina App
 * Capa de abstracción sobre localStorage.
 * Ofrece: get, set, remove, clear, backup, restore.
 * Los datos sensibles (PIN) se guardan ofuscados.
 */

const Storage = (() => {

  const PREFIX = 'rutina_';

  // ----------------------------------------------------------------
  // CRUD BÁSICO
  // ----------------------------------------------------------------

  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[Storage] Error al guardar:', key, e);
      return false;
    }
  }

  function get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Storage] Error al leer:', key, e);
      return defaultValue;
    }
  }

  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  function clear() {
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(PREFIX)) keysToDelete.push(k);
    }
    keysToDelete.forEach(k => localStorage.removeItem(k));
  }

  // ----------------------------------------------------------------
  // CLAVES ESTANDARIZADAS
  // ----------------------------------------------------------------

  const KEYS = {
    // Config
    settings:      'settings',
    theme:         'theme',
    userName:      'user_name',
    onboardingDone:'onboarding_done',
    pinHash:       'pin_hash',
    pinEnabled:    'pin_enabled',
    lockAfter:     'lock_after_mins',
    lastActive:    'last_active',

    // Gym
    gymRoutines:   'gym_routines',
    gymWorkouts:   'gym_workouts',
    gymTemplates:  'gym_templates',

    // Meals
    mealDays:      'meal_days',
    mealFoods:     'meal_foods_db',
    mealSettings:  'meal_settings',

    // Sleep
    sleepLogs:     'sleep_logs',
    sleepSettings: 'sleep_settings',

    // Calendar
    calEvents:     'cal_events',

    // Goals
    goals:         'goals',
    achievements:  'achievements',
    xpPoints:      'xp_points',
    streaks:       'streaks',

    // Notifications
    notifQueue:    'notif_queue',
    notifSettings: 'notif_settings',

    // Sync
    syncConfig:    'sync_config',
    lastSync:      'last_sync',

    // Water
    waterLogs:     'water_logs',
    waterSettings: 'water_settings',

    // Weight
    weightLogs:    'weight_logs',
  };

  // ----------------------------------------------------------------
  // HELPERS TIPADOS
  // ----------------------------------------------------------------

  /** Obtiene configuración general */
  function getSettings() {
    return get(KEYS.settings, {
      userName: 'Usuario',
      theme: 'auto',
      pinEnabled: false,
      lockAfterMins: 5,
      calGoal: 2200,
      proteinGoal: 150,
      sleepGoal: 8,
      gymDaysGoal: 4,
    });
  }

  function saveSettings(settings) {
    return set(KEYS.settings, settings);
  }

  // ---- GYM ----
  function getGymRoutines() {
    return get(KEYS.gymRoutines, {
      Lunes: [], Martes: [], Miércoles: [], Jueves: [],
      Viernes: [], Sábado: [], Domingo: []
    });
  }
  function saveGymRoutines(data) { return set(KEYS.gymRoutines, data); }

  function getGymWorkouts() { return get(KEYS.gymWorkouts, []); }
  function saveGymWorkouts(data) { return set(KEYS.gymWorkouts, data); }

  function getGymTemplates() { return get(KEYS.gymTemplates, []); }
  function saveGymTemplates(data) { return set(KEYS.gymTemplates, data); }

  // ---- MEALS ----
  function getMealDay(dateStr) {
    const days = get(KEYS.mealDays, {});
    return days[dateStr] || {
      Desayuno: [], Almuerzo: [], Comida: [], Merienda: [], Cena: []
    };
  }
  function saveMealDay(dateStr, data) {
    const days = get(KEYS.mealDays, {});
    days[dateStr] = data;
    // Limitar a últimos 90 días para no saturar storage
    const keys = Object.keys(days).sort().reverse().slice(0, 90);
    const pruned = {};
    keys.forEach(k => { pruned[k] = days[k]; });
    return set(KEYS.mealDays, pruned);
  }
  function getMealFoodsDB() { return get(KEYS.mealFoods, getDefaultFoodsDB()); }
  function saveMealFoodsDB(data) { return set(KEYS.mealFoods, data); }
  function getMealSettings() {
    return get(KEYS.mealSettings, { calGoal: 2200, proteinGoal: 150, carbsGoal: 250, fatGoal: 70 });
  }
  function saveMealSettings(data) { return set(KEYS.mealSettings, data); }

  // ---- SLEEP ----
  function getSleepLogs() { return get(KEYS.sleepLogs, []); }
  function saveSleepLogs(data) { return set(KEYS.sleepLogs, data); }
  function getSleepSettings() {
    return get(KEYS.sleepSettings, { goalHours: 8, targetBedtime: '23:00', targetWakeup: '07:00' });
  }
  function saveSleepSettings(data) { return set(KEYS.sleepSettings, data); }

  // ---- CALENDAR ----
  function getCalEvents() { return get(KEYS.calEvents, []); }
  function saveCalEvents(data) { return set(KEYS.calEvents, data); }

  // ---- GOALS ----
  function getGoals() {
    return get(KEYS.goals, {
      gymDays: 4, calGoal: 2200, sleepHours: 8, eventsPerWeek: 5
    });
  }
  function saveGoals(data) { return set(KEYS.goals, data); }

  function getAchievements() { return get(KEYS.achievements, {}); }
  function saveAchievements(data) { return set(KEYS.achievements, data); }

  function getXP() { return get(KEYS.xpPoints, 0); }
  function addXP(amount) {
    const current = getXP();
    return set(KEYS.xpPoints, current + amount);
  }

  function getStreaks() {
    return get(KEYS.streaks, { gym: 0, sleep: 0, meals: 0, lastGymDate: null, lastSleepDate: null });
  }
  function saveStreaks(data) { return set(KEYS.streaks, data); }

  // ---- NOTIFICACIONES ----
  function getNotifQueue() { return get(KEYS.notifQueue, []); }
  function saveNotifQueue(data) { return set(KEYS.notifQueue, data); }
  function getNotifSettings() {
    return get(KEYS.notifSettings, {
      enabled: false, gym: true, meals: true, sleep: true, calendar: true,
      gymTime: '08:00', mealsTime: ['08:00','13:00','15:00','19:00','21:00'],
      sleepTime: '22:30'
    });
  }
  function saveNotifSettings(data) { return set(KEYS.notifSettings, data); }

  // ---- SYNC ----
  function getSyncConfig() { return get(KEYS.syncConfig, { provider: null, enabled: false, autoBackup: false }); }
  function saveSyncConfig(data) { return set(KEYS.syncConfig, data); }

  // ---- WATER ----
  function getWaterLog(dateStr) {
    const logs = get(KEYS.waterLogs, {});
    return logs[dateStr] || 0;
  }
  function addWater(dateStr, ml) {
    const logs = get(KEYS.waterLogs, {});
    logs[dateStr] = Math.max(0, (logs[dateStr] || 0) + ml);
    // Keep last 90 days
    const keys = Object.keys(logs).sort().reverse().slice(0, 90);
    const pruned = {};
    keys.forEach(k => { pruned[k] = logs[k]; });
    return set(KEYS.waterLogs, pruned);
  }
  function getWaterLogs() { return get(KEYS.waterLogs, {}); }
  function getWaterSettings() {
    return get(KEYS.waterSettings, { goalMl: 2000 });
  }
  function saveWaterSettings(data) { return set(KEYS.waterSettings, data); }

  // ---- WEIGHT ----
  function getWeightLogs() { return get(KEYS.weightLogs, []); }
  function saveWeightLogs(data) { return set(KEYS.weightLogs, data); }
  function addWeightEntry(kg, dateStr) {
    const logs = getWeightLogs();
    const filtered = logs.filter(l => l.date !== dateStr);
    filtered.push({ date: dateStr, kg: parseFloat(kg) });
    filtered.sort((a, b) => a.date.localeCompare(b.date));
    return saveWeightLogs(filtered.slice(-365));
  }

  // ---- PIN ----
  function savePIN(pin) {
    // Guardar ofuscado (no es hash criptográfico, solo protección básica local)
    const hashed = Utils.simpleEncrypt(pin);
    set(KEYS.pinHash, hashed);
    set(KEYS.pinEnabled, true);
  }

  function verifyPIN(pin) {
    const stored = get(KEYS.pinHash);
    if (!stored) return true;
    const decoded = Utils.simpleDecrypt(stored);
    return decoded === pin;
  }

  function isPINEnabled() {
    return get(KEYS.pinEnabled, false);
  }

  function disablePIN() {
    remove(KEYS.pinHash);
    set(KEYS.pinEnabled, false);
  }

  function setLastActive() {
    set(KEYS.lastActive, Date.now());
  }

  function isLocked() {
    if (!isPINEnabled()) return false;
    const lockAfter = (getSettings().lockAfterMins || 5) * 60 * 1000;
    const last = get(KEYS.lastActive, 0);
    return (Date.now() - last) > lockAfter;
  }

  // ----------------------------------------------------------------
  // BACKUP & RESTORE
  // ----------------------------------------------------------------

  /** Exporta todos los datos de la app como objeto JSON */
  function exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(PREFIX)) {
        try { data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)); }
        catch { data[k.slice(PREFIX.length)] = localStorage.getItem(k); }
      }
    }
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data
    };
  }

  /** Importa datos desde un objeto exportado con exportAll() */
  function importAll(exported) {
    if (!exported?.data) throw new Error('Formato inválido');
    for (const [k, v] of Object.entries(exported.data)) {
      // No restaurar PIN por seguridad
      if (k === KEYS.pinHash || k === KEYS.pinEnabled) continue;
      set(k, v);
    }
    return true;
  }

  // ----------------------------------------------------------------
  // BASE DE DATOS DE ALIMENTOS POR DEFECTO
  // ----------------------------------------------------------------
  function getDefaultFoodsDB() {
    return [
      { id:'f1', name:'Pollo a la plancha', kcal:165, protein:31, carbs:0, fat:3.6, unit:'100g' },
      { id:'f2', name:'Arroz cocido',        kcal:130, protein:2.7, carbs:28, fat:0.3, unit:'100g' },
      { id:'f3', name:'Huevo entero',        kcal:155, protein:13, carbs:1.1, fat:11, unit:'100g' },
      { id:'f4', name:'Avena',               kcal:389, protein:17, carbs:66, fat:7, unit:'100g' },
      { id:'f5', name:'Plátano',             kcal:89,  protein:1.1, carbs:23, fat:0.3, unit:'100g' },
      { id:'f6', name:'Manzana',             kcal:52,  protein:0.3, carbs:14, fat:0.2, unit:'100g' },
      { id:'f7', name:'Leche entera',        kcal:61,  protein:3.2, carbs:4.8, fat:3.3, unit:'100ml' },
      { id:'f8', name:'Pasta cocida',        kcal:131, protein:5, carbs:25, fat:1.1, unit:'100g' },
      { id:'f9', name:'Atún en lata',        kcal:132, protein:28, carbs:0, fat:1, unit:'100g' },
      { id:'f10', name:'Proteína en polvo',  kcal:120, protein:24, carbs:3, fat:1.5, unit:'30g scoop' },
      { id:'f11', name:'Pan integral',       kcal:247, protein:13, carbs:41, fat:3.4, unit:'100g' },
      { id:'f12', name:'Yogur griego',       kcal:97,  protein:9, carbs:3.6, fat:5, unit:'100g' },
      { id:'f13', name:'Almendras',          kcal:579, protein:21, carbs:22, fat:50, unit:'100g' },
      { id:'f14', name:'Brócoli cocido',     kcal:35,  protein:2.4, carbs:7, fat:0.4, unit:'100g' },
      { id:'f15', name:'Salmón a la plancha',kcal:208, protein:20, carbs:0, fat:13, unit:'100g' },
    ];
  }

  // ----------------------------------------------------------------
  // API PÚBLICA
  // ----------------------------------------------------------------
  return {
    get, set, remove, clear, KEYS,
    getSettings, saveSettings,
    getGymRoutines, saveGymRoutines,
    getGymWorkouts, saveGymWorkouts,
    getGymTemplates, saveGymTemplates,
    getMealDay, saveMealDay,
    getMealFoodsDB, saveMealFoodsDB,
    getMealSettings, saveMealSettings,
    getSleepLogs, saveSleepLogs,
    getSleepSettings, saveSleepSettings,
    getCalEvents, saveCalEvents,
    getGoals, saveGoals,
    getAchievements, saveAchievements,
    getXP, addXP,
    getStreaks, saveStreaks,
    getNotifQueue, saveNotifQueue,
    getNotifSettings, saveNotifSettings,
    getSyncConfig, saveSyncConfig,
    getWaterLog, addWater, getWaterLogs, getWaterSettings, saveWaterSettings,
    getWeightLogs, saveWeightLogs, addWeightEntry,
    savePIN, verifyPIN, isPINEnabled, disablePIN,
    setLastActive, isLocked,
    exportAll, importAll
  };
})();

window.Storage = Storage;
