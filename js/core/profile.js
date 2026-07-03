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

  let toastTimeout = null;

  function showSaveToast() {
    if (typeof document === 'undefined') return;

    // Buscar o crear contenedor de toast
    let toast = document.getElementById('midinari-save-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'midinari-save-toast';
      // Estilos inline discretos y elegantes integrados con el tema de Midinari
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.right = '20px';
      toast.style.backgroundColor = '#5C8060'; // Verde Sage del proyecto
      toast.style.color = '#FFFFFF';
      toast.style.padding = '12px 20px';
      toast.style.borderRadius = '8px';
      toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      toast.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
      toast.style.fontSize = '13px';
      toast.style.fontWeight = '600';
      toast.style.zIndex = '9999';
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.transform = 'translateY(10px)';
      toast.style.pointerEvents = 'none';
      toast.textContent = 'Información guardada en tu Perfil Financiero';
      document.body.appendChild(toast);
    }

    // Limpiar timeout previo
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    // Mostrar
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    // Ocultar tras 2.5 segundos
    toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 2500);
  }

  function getProfile() {
    const store = typeof window !== 'undefined' && window.MidinariStorage ? window.MidinariStorage : null;
    if (!store) {
      return Object.assign({}, DEFAULT_PROFILE);
    }
    const data = store.load();
    if (!data) {
      return Object.assign({}, DEFAULT_PROFILE);
    }
    return Object.assign({}, DEFAULT_PROFILE, data);
  }

  function setProfile(profile) {
    const store = typeof window !== 'undefined' && window.MidinariStorage ? window.MidinariStorage : null;
    if (!store) return false;
    
    const profileToSave = Object.assign({}, profile, {
      fechaActualizacion: new Date().toISOString()
    });
    const success = store.save(profileToSave);
    if (success) {
      if (window.MidinariTimeline) {
        window.MidinariTimeline.recordSnapshot(profileToSave);
      }
      if (window.MidinariMissions) {
        window.MidinariMissions.evaluateMissions(profileToSave);
      }
      if (window.MidinariAchievements) {
        window.MidinariAchievements.evaluateAchievements(profileToSave);
      }
      showSaveToast();
    }
    return success;
  }

  function updateProfile(partialProfile, silent = false) {
    const store = typeof window !== 'undefined' && window.MidinariStorage ? window.MidinariStorage : null;
    if (!store) return false;
    
    const updates = Object.assign({}, partialProfile, {
      fechaActualizacion: new Date().toISOString()
    });
    const success = store.update(updates);
    if (success) {
      const currentProfile = getProfile();
      if (window.MidinariTimeline) {
        window.MidinariTimeline.recordSnapshot(currentProfile);
      }
      if (window.MidinariMissions) {
        window.MidinariMissions.evaluateMissions(currentProfile);
      }
      if (window.MidinariAchievements) {
        window.MidinariAchievements.evaluateAchievements(currentProfile);
      }
      if (!silent) {
        showSaveToast();
      }
    }
    return success;
  }

  function resetProfile() {
    const store = typeof window !== 'undefined' && window.MidinariStorage ? window.MidinariStorage : null;
    if (!store) return false;
    
    const profileToSave = Object.assign({}, DEFAULT_PROFILE, {
      fechaActualizacion: new Date().toISOString()
    });
    const success = store.save(profileToSave);
    if (success) {
      if (window.MidinariTimeline) {
        window.MidinariTimeline.recordSnapshot(profileToSave);
      }
      if (window.MidinariMissions) {
        window.MidinariMissions.evaluateMissions(profileToSave);
      }
      if (window.MidinariAchievements) {
        window.MidinariAchievements.evaluateAchievements(profileToSave);
      }
      showSaveToast();
    }
    return success;
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

// Auto-cargar scripts del copiloto y advisors para garantizar sincronización en tiempo real
if (typeof document !== 'undefined') {
  (function() {
    const currentScript = document.querySelector('script[src*="profile.js"]');
    let basePath = '../js/core/';
    if (currentScript) {
      const src = currentScript.getAttribute('src');
      basePath = src.substring(0, src.lastIndexOf('/') + 1);
    }
    
    const scriptsToLoad = [
      'rules.js',
      'advisor.js',
      'timeline.js',
      'missions.js',
      'achievements.js'
    ];
    
    scriptsToLoad.forEach(scriptName => {
      const alreadyLoaded = Array.from(document.querySelectorAll('script')).some(s => s.src && s.src.includes(scriptName));
      if (!alreadyLoaded) {
        const script = document.createElement('script');
        script.src = basePath + scriptName;
        script.defer = true;
        document.head.appendChild(script);
      }
    });
  })();
}
