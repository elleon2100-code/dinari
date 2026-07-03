/* ============================================================
   MIDINARI — missions.js
   Módulo de misiones del Copiloto Financiero
   ============================================================ */

const MidinariMissions = (function () {
  'use strict';

  const STORAGE_KEY = 'midinariMissions';

  // Plantilla inicial de misiones
  const DEFAULT_MISSIONS = [
    {
      id: 'mision-presupuesto',
      texto: 'Registra tus ingresos en tu Perfil Financiero',
      tipo: 'perfil',
      meta: 1,
      actual: 0,
      completada: false,
      icono: '📊'
    },
    {
      id: 'mision-simular-deuda',
      texto: 'Completa una simulación en el Simulador de Deudas',
      tipo: 'simulador-deuda',
      meta: 1,
      actual: 0,
      completada: false,
      icono: '💳'
    },
    {
      id: 'mision-pago-minimo',
      texto: 'Calcula el impacto en el Simulador de Pago Mínimo',
      tipo: 'simulador-pago-minimo',
      meta: 1,
      actual: 0,
      completada: false,
      icono: '📉'
    },
    {
      id: 'mision-ahorrar-algo',
      texto: 'Comienza tu fondo con ahorros mayores a $0',
      tipo: 'ahorro-inicial',
      meta: 1,
      actual: 0,
      completada: false,
      icono: '🛡️'
    },
    {
      id: 'mision-meta-fondo',
      texto: 'Establece tu primer objetivo de Fondo de Emergencia',
      tipo: 'meta-fondo',
      meta: 1,
      actual: 0,
      completada: false,
      icono: '🎯'
    }
  ];

  /**
   * Obtiene las misiones desde LocalStorage.
   */
  function getMissions() {
    if (typeof localStorage === 'undefined') return DEFAULT_MISSIONS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MISSIONS));
      return DEFAULT_MISSIONS;
    }
    return JSON.parse(stored);
  }

  /**
   * Guarda las misiones en LocalStorage.
   */
  function saveMissions(missions) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
    }
  }

  /**
   * Evalúa y actualiza el progreso de las misiones según el estado del perfil.
   * @param {Object} profile - Perfil financiero de Midinari.
   * @returns {Array} Listado de misiones actualizado.
   */
  function evaluateMissions(profile) {
    const missions = getMissions();
    let changed = false;

    missions.forEach(mission => {
      if (mission.completada) return;

      let currentVal = 0;

      switch (mission.id) {
        case 'mision-presupuesto':
          if (profile.ingresosMensuales > 0) {
            currentVal = 1;
          }
          break;
        case 'mision-simular-deuda':
          if (localStorage.getItem('midinari_calc_simulator') === 'true') {
            currentVal = 1;
          }
          break;
        case 'mision-pago-minimo':
          if (localStorage.getItem('midinari_calc_minimum_payment') === 'true') {
            currentVal = 1;
          }
          break;
        case 'mision-ahorrar-algo':
          if (profile.ahorroActual > 0) {
            currentVal = 1;
          }
          break;
        case 'mision-meta-fondo':
          if (profile.fondoEmergenciaObjetivo > 0) {
            currentVal = 1;
          }
          break;
      }

      if (currentVal !== mission.actual) {
        mission.actual = currentVal;
        if (mission.actual >= mission.meta) {
          mission.completada = true;
          // Registrar logro si aplica
          if (window.MidinariAchievements) {
            window.MidinariAchievements.evaluateAchievements(profile);
          }
        }
        changed = true;
      }
    });

    if (changed) {
      saveMissions(missions);
    }

    return missions;
  }

  /**
   * Registra que se ha completado una simulación externa.
   */
  function registerSimulationEvent(type) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`midinari_calc_${type}`, 'true');
      if (window.MidinariProfile) {
        evaluateMissions(window.MidinariProfile.getProfile());
      }
    }
  }

  return {
    getMissions: getMissions,
    evaluateMissions: evaluateMissions,
    registerSimulationEvent: registerSimulationEvent
  };
})();

// Registrar globalmente
if (typeof window !== 'undefined') {
  window.MidinariMissions = MidinariMissions;
}
