/* ============================================================
   MIDINARI — achievements.js
   Módulo de logros e insignias del Copiloto Financiero
   ============================================================ */

const MidinariAchievements = (function () {
  'use strict';

  const STORAGE_KEY = 'midinariAchievements';

  const DEFAULT_ACHIEVEMENTS = [
    {
      id: 'logro-primeros-pasos',
      titulo: 'Primeros Pasos',
      descripcion: 'Registraste tus ingresos en tu perfil financiero.',
      icono: '🚀',
      desbloqueado: false,
      fechaDesbloqueo: null
    },
    {
      id: 'logro-ahorrador',
      titulo: 'Ahorrador Júnior',
      descripcion: 'Comenzaste tu ahorro acumulando tus primeros fondos.',
      icono: '🌱',
      desbloqueado: false,
      fechaDesbloqueo: null
    },
    {
      id: 'logro-blindado',
      titulo: 'Fondo Blindado',
      descripcion: 'Alcanzaste la meta completa de tu Fondo de Emergencia.',
      icono: '🛡️',
      desbloqueado: false,
      fechaDesbloqueo: null
    },
    {
      id: 'logro-libre-deuda',
      titulo: 'Libertad de Deuda',
      descripcion: 'Estás libre de deudas de consumo activas.',
      icono: '🏆',
      desbloqueado: false,
      fechaDesbloqueo: null
    },
    {
      id: 'logro-maestro-presupuesto',
      titulo: 'Maestro del Presupuesto',
      descripcion: 'Ahorras un 20% o más de tus ingresos mensuales.',
      icono: '👑',
      desbloqueado: false,
      fechaDesbloqueo: null
    },
    {
      id: 'logro-explorador',
      titulo: 'Explorador del Ecosistema',
      descripcion: 'Utilizaste al menos 3 simuladores financieros del sitio.',
      icono: '🗺️',
      desbloqueado: false,
      fechaDesbloqueo: null
    }
  ];

  /**
   * Obtiene los logros desde LocalStorage.
   */
  function getAchievements() {
    if (typeof localStorage === 'undefined') return DEFAULT_ACHIEVEMENTS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACHIEVEMENTS));
      return DEFAULT_ACHIEVEMENTS;
    }
    return JSON.parse(stored);
  }

  /**
   * Guarda los logros en LocalStorage.
   */
  function saveAchievements(achievements) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
    }
  }

  /**
   * Evalúa y desbloquea logros según el perfil financiero del usuario.
   * @param {Object} profile - Perfil de Midinari del usuario.
   * @returns {Array} Listado de logros actualizados.
   */
  function evaluateAchievements(profile) {
    const achievements = getAchievements();
    let changed = false;

    // Calcular cuántos simuladores se han calculado
    let calculatorsUsedCount = 0;
    const calcs = ['simulator', 'minimum_payment', 'loans', 'tracker', 'emergency'];
    calcs.forEach(c => {
      if (localStorage.getItem(`midinari_calc_${c}`) === 'true') {
        calculatorsUsedCount++;
      }
    });

    achievements.forEach(ach => {
      if (ach.desbloqueado) return;

      let shouldUnlock = false;

      switch (ach.id) {
        case 'logro-primeros-pasos':
          if (profile.ingresosMensuales > 0) {
            shouldUnlock = true;
          }
          break;
        case 'logro-ahorrador':
          if (profile.ahorroActual > 0) {
            shouldUnlock = true;
          }
          break;
        case 'logro-blindado':
          if (profile.ahorroActual >= profile.fondoEmergenciaObjetivo && profile.fondoEmergenciaObjetivo > 0) {
            shouldUnlock = true;
          }
          break;
        case 'logro-libre-deuda':
          if (profile.deudaTotal === 0 && profile.ingresosMensuales > 0) {
            shouldUnlock = true;
          }
          break;
        case 'logro-maestro-presupuesto':
          if (profile.ingresosMensuales > 0 && (profile.ahorroMensual / profile.ingresosMensuales) >= 0.20) {
            shouldUnlock = true;
          }
          break;
        case 'logro-explorador':
          if (calculatorsUsedCount >= 3) {
            shouldUnlock = true;
          }
          break;
      }

      if (shouldUnlock) {
        ach.desbloqueado = true;
        ach.fechaDesbloqueo = new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        changed = true;
      }
    });

    if (changed) {
      saveAchievements(achievements);
    }

    return achievements;
  }

  return {
    getAchievements: getAchievements,
    evaluateAchievements: evaluateAchievements
  };
})();

// Registrar globalmente
if (typeof window !== 'undefined') {
  window.MidinariAchievements = MidinariAchievements;
}
