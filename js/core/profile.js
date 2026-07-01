/* ============================================================
   MIDINARI — profile.js
   Módulo de gestión del perfil unificado del usuario
   ============================================================ */

const MidinariProfile = (function () {
  'use strict';

  // Perfil por defecto inicial
  const DEFAULT_PROFILE = {
    ingresosMensuales: 0,
    gastosMensuales: 0,
    ahorroActual: 0,
    ahorroMensual: 0,
    deudaTotal: 0,
    pagoMensualDeuda: 0,
    interesPromedio: 0,
    fondoEmergenciaObjetivo: 0,
    patrimonio: 0,
    herramientasUsadas: [],
    recomendacionesIgnoradas: [],
    fechaActualizacion: null
  };

  function getProfile() {
    // Si no tiene cargada la base de almacenamiento, se usa globalmente
    const store = typeof window !== 'undefined' && window.MidinariStorage ? window.MidinariStorage : null;
    if (!store) {
      return Object.assign({}, DEFAULT_PROFILE);
    }
    const data = store.load();
    if (!data) {
      return Object.assign({}, DEFAULT_PROFILE);
    }
    // Combinar con defaults para evitar campos no definidos
    return Object.assign({}, DEFAULT_PROFILE, data);
  }

  function setProfile(profile) {
    const store = typeof window !== 'undefined' && window.MidinariStorage ? window.MidinariStorage : null;
    if (!store) return false;
    
    const profileToSave = Object.assign({}, profile, {
      fechaActualizacion: new Date().toISOString()
    });
    return store.save(profileToSave);
  }

  function updateProfile(partialProfile) {
    const store = typeof window !== 'undefined' && window.MidinariStorage ? window.MidinariStorage : null;
    if (!store) return false;
    
    const updates = Object.assign({}, partialProfile, {
      fechaActualizacion: new Date().toISOString()
    });
    return store.update(updates);
  }

  function resetProfile() {
    const store = typeof window !== 'undefined' && window.MidinariStorage ? window.MidinariStorage : null;
    if (!store) return false;
    
    return store.save(Object.assign({}, DEFAULT_PROFILE, {
      fechaActualizacion: new Date().toISOString()
    }));
  }

  return {
    getProfile: getProfile,
    setProfile: setProfile,
    updateProfile: updateProfile,
    resetProfile: resetProfile
  };
})();

// Registrar globalmente
if (typeof window !== 'undefined') {
  window.MidinariProfile = MidinariProfile;
}
