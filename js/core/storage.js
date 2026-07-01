/* ============================================================
   MIDINARI — storage.js
   Módulo de persistencia local para el perfil unificado
   ============================================================ */

const MidinariStorage = (function () {
  'use strict';

  const STORAGE_KEY = 'midinariProfile';

  function exists() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  function load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('MidinariStorage: Error al cargar los datos', e);
      return null;
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('MidinariStorage: Error al guardar los datos', e);
      return false;
    }
  }

  function update(partialData) {
    try {
      const current = load() || {};
      const merged = Object.assign({}, current, partialData);
      return save(merged);
    } catch (e) {
      console.error('MidinariStorage: Error al actualizar los datos', e);
      return false;
    }
  }

  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('MidinariStorage: Error al eliminar la clave', e);
      return false;
    }
  }

  // Exportar API pública
  return {
    exists: exists,
    load: load,
    save: save,
    update: update,
    reset: reset
  };
})();

// Registrar globalmente si estamos en navegador
if (typeof window !== 'undefined') {
  window.MidinariStorage = MidinariStorage;
}
