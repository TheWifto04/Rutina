/**
 * SYNC.JS – Módulo de sincronización y exportación de datos.
 * Soporta: exportar JSON/CSV, importar, backup automático.
 * La integración con Firebase/Supabase requiere credenciales del usuario.
 */

const SyncModule = (() => {

  // ================================================================
  // EXPORTAR JSON
  // ================================================================
  function exportJSON() {
    const data = Storage.exportAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    _downloadBlob(blob, `rutina-backup-${Utils.today()}.json`);
    showToast('Datos exportados como JSON', 'success');
  }

  // ================================================================
  // EXPORTAR CSV (resumen de comidas y gym)
  // ================================================================
  function exportCSV() {
    const workouts = Storage.getGymWorkouts();
    const logs     = Storage.getSleepLogs();

    // CSV de entrenamientos
    let csvGym = 'Fecha,Día,Ejercicio,Series,Reps,Peso(kg)\n';
    workouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        csvGym += `${w.date},${w.day},"${ex.name}",${ex.sets},${ex.reps},${ex.weight||0}\n`;
      });
    });

    // CSV de sueño
    let csvSleep = 'Fecha,Hora dormir,Hora despertar,Horas,Calidad\n';
    logs.forEach(l => {
      csvSleep += `${l.date},${l.bedtime||''},${l.wakeup||''},${l.hours||0},${l.quality||0}\n`;
    });

    const combined = '=== ENTRENAMIENTOS ===\n' + csvGym + '\n=== SUEÑO ===\n' + csvSleep;
    const blob = new Blob([combined], { type: 'text/csv;charset=utf-8;' });
    _downloadBlob(blob, `rutina-datos-${Utils.today()}.csv`);
    showToast('Datos exportados como CSV', 'success');
  }

  // ================================================================
  // IMPORTAR
  // ================================================================
  function importFromJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          Storage.importAll(data);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // ================================================================
  // BACKUP AUTOMÁTICO (localStorage → descarga manual)
  // ================================================================
  function scheduleAutoBackup() {
    const config = Storage.getSyncConfig();
    if (!config.autoBackup) return;

    const lastBackup = Storage.get('last_backup_date', null);
    if (lastBackup === Utils.today()) return; // Ya hecho hoy

    exportJSON();
    Storage.set('last_backup_date', Utils.today());
  }

  // ================================================================
  // INTEGRACIÓN FIREBASE (stub – requiere credenciales del usuario)
  // ================================================================
  async function connectFirebase(config) {
    // En un escenario real, aquí se inicializaría firebase SDK
    // Este stub simula la estructura que usaría
    try {
      showToast('Funcionalidad Firebase requiere configuración manual. Consulta la documentación.', 'info', 6000);
      return false;
    } catch (e) {
      showToast('Error de conexión Firebase: ' + e.message, 'error');
      return false;
    }
  }

  // ================================================================
  // UI DE SYNC
  // ================================================================
  function showSyncPanel() {
    const config = Storage.getSyncConfig();
    openModal(`
      <h3>Sincronización y datos</h3>

      <p class="section-title" style="margin-top:12px">Exportar</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-secondary btn-full" onclick="SyncModule.exportJSON()">
          📄 Exportar datos (JSON)
        </button>
        <button class="btn btn-secondary btn-full" onclick="SyncModule.exportCSV()">
          📊 Exportar datos (CSV)
        </button>
      </div>

      <p class="section-title">Importar</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-ghost btn-full" onclick="SyncModule.triggerImport()">
          📂 Importar desde archivo JSON
        </button>
      </div>

      <p class="section-title">Nube (próximamente)</p>
      <div class="card" style="opacity:0.6">
        <p style="font-size:0.85rem;color:var(--text-muted);text-align:center;padding:8px">
          🔮 Sincronización con Firebase / Supabase disponible próximamente.
          Por ahora usa la exportación manual para hacer copias de seguridad.
        </p>
      </div>

      <p class="section-title">Backup automático</p>
      <div class="setting-row">
        <div class="setting-info"><h4>Exportar al abrir la app</h4><p>Genera un JSON diario</p></div>
        <label class="toggle">
          <input type="checkbox" id="sync-auto" ${config.autoBackup?'checked':''} onchange="SyncModule.toggleAutoBackup(this.checked)" />
          <span class="toggle-slider"></span>
        </label>
      </div>
    `);
  }

  function triggerImport() {
    const input = document.getElementById('file-import');
    if (input) { closeModal(); input.click(); }
  }

  function toggleAutoBackup(enabled) {
    const config = Storage.getSyncConfig();
    config.autoBackup = enabled;
    Storage.saveSyncConfig(config);
    showToast(enabled ? 'Backup automático activado' : 'Backup automático desactivado', 'info');
  }

  // ================================================================
  // HELPER
  // ================================================================
  function _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download= filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ================================================================
  // API PÚBLICA
  // ================================================================
  return { exportJSON, exportCSV, importFromJSON, scheduleAutoBackup, showSyncPanel, triggerImport, toggleAutoBackup, connectFirebase };
})();

window.SyncModule = SyncModule;
