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
      'achievements.js',
      'history-hooks.js'
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

// Helper global para el Historial de Decisiones
if (typeof window !== 'undefined') {
  window.MidinariHistoryHelper = {
    saveRecord: function (toolId, defaultName, desc, inputData, outputData) {
      let modal = document.getElementById('dyn-history-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dyn-history-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.background = 'rgba(0,0,0,0.4)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '10000';
        modal.innerHTML = `
          <div style="background:#fff; border-radius:12px; width:95%; max-width:450px; padding:24px; box-shadow:0 10px 30px rgba(0,0,0,0.15); font-family:var(--font-sans, sans-serif);">
            <h3 style="margin-top:0; font-size:18px; color:var(--charcoal, #2d312e); font-weight:700;">💾 Guardar en mi Historial</h3>
            <p style="font-size:12px; color:var(--stone-500, #888); margin-bottom:16px;">La simulación se guardará localmente en tu dispositivo.</p>
            <div style="margin-bottom:16px;">
              <label style="display:block; font-size:12px; font-weight:600; margin-bottom:6px; color:var(--charcoal-soft, #4a4e4b);">Nombre de la simulación</label>
              <input type="text" id="dyn-hist-name" style="width:100%; padding:10px; border-radius:6px; border:1px solid #d1d5db; font-size:13px;" required />
            </div>
            <div style="margin-bottom:20px;">
              <label style="display:block; font-size:12px; font-weight:600; margin-bottom:6px; color:var(--charcoal-soft, #4a4e4b);">Notas personales</label>
              <textarea id="dyn-hist-notes" rows="3" style="width:100%; padding:10px; border-radius:6px; border:1px solid #d1d5db; font-size:13px; font-family:inherit; resize:vertical;" placeholder="Opcional..."></textarea>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:12px;">
              <button id="dyn-hist-cancel" style="background:#fff; border:1px solid #d1d5db; color:#374151; padding:8px 16px; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer;">Cancelar</button>
              <button id="dyn-hist-save" style="background:var(--sage-600, #5c8060); border:none; color:#fff; padding:8px 16px; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer;">Guardar</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }

      document.getElementById('dyn-hist-name').value = defaultName;
      document.getElementById('dyn-hist-notes').value = '';
      modal.style.display = 'flex';

      return new Promise((resolve) => {
        const cancelBtn = document.getElementById('dyn-hist-cancel');
        const saveBtn = document.getElementById('dyn-hist-save');

        const close = () => {
          modal.style.display = 'none';
        };

        cancelBtn.onclick = () => {
          close();
          resolve(false);
        };

        saveBtn.onclick = () => {
          const name = document.getElementById('dyn-hist-name').value.trim();
          if (!name) {
            alert('Por favor, ingresa un nombre.');
            return;
          }
          const notes = document.getElementById('dyn-hist-notes').value.trim();

          const profile = window.MidinariProfile.getProfile();
          const score = window.MidinariAdvisor ? window.MidinariAdvisor.computeFinancialScore(profile) : 50;

          const record = {
            id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            fecha: new Date().toISOString(),
            herramienta: toolId,
            nombre: name,
            descripcion: desc,
            profileSnapshot: profile,
            inputData: inputData,
            outputData: outputData,
            score: score,
            observaciones: window.MidinariAdvisor ? window.MidinariAdvisor.getDiagnosis(profile).observacionGeneral : '',
            notes: notes,
            isFavorite: false
          };

          const raw = localStorage.getItem('midinari_history');
          let history = [];
          if (raw) {
            try { history = JSON.parse(raw); } catch (e) {}
          }
          history.push(record);
          localStorage.setItem('midinari_history', JSON.stringify(history));

          close();
          showSaveToastMsg('Simulación guardada en tu Historial');
          resolve(true);
        };
      });
    }
  };

  function showSaveToastMsg(msg) {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.bottom = '20px';
    div.style.right = '20px';
    div.style.background = 'var(--sage-700, #5c8060)';
    div.style.color = '#fff';
    div.style.padding = '12px 24px';
    div.style.borderRadius = '8px';
    div.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
    div.style.fontSize = '12px';
    div.style.fontWeight = '700';
    div.style.zIndex = '20000';
    div.style.transition = 'all 0.3s ease';
    div.textContent = msg;

    document.body.appendChild(div);
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transform = 'translateY(10px)';
      setTimeout(() => div.remove(), 300);
    }, 2500);
  }
}
