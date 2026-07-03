/* ============================================================
   MIDINARI — copilot.js
   Controlador principal del Copiloto Financiero de Midinari
   ============================================================ */

(function () {
  'use strict';

  function init() {
    const profile = window.MidinariProfile.getProfile();
    
    // Evaluar estado actual de misiones y logros
    window.MidinariMissions.evaluateMissions(profile);
    window.MidinariAchievements.evaluateAchievements(profile);

    // Obtener historial y asegurar al menos un registro inicial
    let history = window.MidinariTimeline.getHistory();
    if (history.length === 0) {
      window.MidinariTimeline.recordSnapshot(profile);
      history = window.MidinariTimeline.getHistory();
    }

    const diagnosis = window.MidinariAdvisor.getDiagnosis(profile, history);
    
    renderScoreRing(diagnosis.score, diagnosis.estadoGeneral, diagnosis.estadoColor);
    renderLastUpdate(profile.fechaActualizacion);
    renderAdvisorSections(diagnosis);
    renderAchievements();
    renderMissions();

    // Dibuja el gráfico de evolución
    window.MidinariTimeline.renderScoreChart('score-chart');

    // Escuchar redibujado en resize para mantener responsividad del SVG del gráfico
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        window.MidinariTimeline.renderScoreChart('score-chart');
      }, 200);
    });
  }

  function renderScoreRing(score, label, color) {
    const scoreValEl = document.getElementById('score-val');
    const scoreRingEl = document.getElementById('score-ring');
    const scoreStatusEl = document.getElementById('score-status');

    if (!scoreValEl || !scoreRingEl || !scoreStatusEl) return;

    scoreValEl.textContent = score;

    // Actualizar anillo
    const radius = 70;
    const circ = 2 * Math.PI * radius; // Aprox 439.8
    scoreRingEl.style.strokeDasharray = circ;
    scoreRingEl.style.strokeDashoffset = circ - (score / 100) * circ;
    scoreRingEl.style.stroke = color;

    // Badge de estado
    scoreStatusEl.textContent = label.toUpperCase();
    
    // Limpiar clases de color
    scoreStatusEl.className = 'score-label';
    const labelClass = {
      'Excelente': 'score-label--bueno',
      'Bueno': 'score-label--bueno',
      'Riesgo': 'score-label--riesgo',
      'Crítico': 'score-label--critico'
    }[label] || 'score-label--bueno';
    scoreStatusEl.classList.add(labelClass);
  }

  function renderLastUpdate(fechaIso) {
    const lastUpdateEl = document.getElementById('last-update');
    if (!lastUpdateEl) return;

    if (!fechaIso) {
      lastUpdateEl.textContent = 'Nunca';
      return;
    }

    const date = new Date(fechaIso);
    lastUpdateEl.textContent = date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function renderAdvisorSections(diagnosis) {
    // 1. Prioridad del mes
    const priorityTitle = document.getElementById('priority-title');
    const priorityDesc = document.getElementById('priority-desc');
    if (priorityTitle && priorityDesc) {
      priorityTitle.textContent = diagnosis.prioridadMes.titulo;
      priorityDesc.textContent = diagnosis.prioridadMes.desc;
    }

    // 2. Objetivos
    const goalsList = document.getElementById('goals-list');
    if (goalsList) {
      goalsList.innerHTML = '';
      if (diagnosis.objetivos.length === 0) {
        goalsList.innerHTML = '<p class="body-sm" style="color:var(--stone-400); margin:0;">No tienes objetivos activos. Completa tu perfil para calcularlos.</p>';
      } else {
        diagnosis.objetivos.forEach(goal => {
          const div = document.createElement('div');
          div.style.marginBottom = 'var(--sp-4)';
          div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:var(--text-sm);">
              <span style="font-weight:600; color:var(--charcoal);">${goal.nombre}</span>
              <span style="font-weight:700; color:var(--sage-700);">${goal.progreso}%</span>
            </div>
            <div class="goal-bar-wrap">
              <div class="goal-bar-fill" style="width: ${goal.progreso}%;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:var(--stone-500); margin-top:-4px;">
              <span>Actual: ${goal.actual}</span>
              <span>Meta: ${goal.meta}</span>
            </div>
          `;
          goalsList.appendChild(div);
        });
      }
    }

    // 3. Aspectos Positivos
    const listGood = document.getElementById('list-good');
    if (listGood) {
      listGood.innerHTML = '';
      diagnosis.fortalezas.forEach(fort => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${fort.titulo}:</strong> ${fort.desc}`;
        listGood.appendChild(li);
      });
    }

    // 4. Puntos de Atención
    const listWarn = document.getElementById('list-warn');
    if (listWarn) {
      listWarn.innerHTML = '';
      if (diagnosis.debilidades.length === 0) {
        const li = document.createElement('li');
        li.style.listStyle = 'none';
        li.style.paddingLeft = '0';
        li.style.color = 'var(--success)';
        li.style.fontWeight = '600';
        li.textContent = '🎉 ¡Increíble! No tienes puntos de atención críticos hoy.';
        listWarn.appendChild(li);
      } else {
        diagnosis.debilidades.forEach(deb => {
          const li = document.createElement('li');
          li.innerHTML = `<strong>${deb.titulo}:</strong> ${deb.desc}`;
          listWarn.appendChild(li);
        });
      }
    }
  }

  function renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;

    const achievements = window.MidinariAchievements.getAchievements();
    grid.innerHTML = '';

    achievements.forEach(ach => {
      const div = document.createElement('div');
      div.className = `ach-badge ${ach.desbloqueado ? 'ach-badge--unlocked' : ''}`;
      
      div.innerHTML = `
        <span class="ach-badge__icon">${ach.icono}</span>
        <span class="ach-badge__title">${ach.titulo}</span>
        <div class="ach-tooltip">
          <strong>${ach.titulo}</strong><br>
          ${ach.descripcion}<br>
          <span style="color:var(--sage-400); font-weight:700;">
            ${ach.desbloqueado ? '🔓 Desbloqueado el ' + ach.fechaDesbloqueo : '🔒 Requisito: ' + getRequirementText(ach.id)}
          </span>
        </div>
      `;
      grid.appendChild(div);
    });
  }

  function getRequirementText(id) {
    return {
      'logro-primeros-pasos': 'Configurar tus ingresos',
      'logro-ahorrador': 'Tener ahorro actual > $0',
      'logro-blindado': 'Completar meta del Fondo de Emergencia',
      'logro-libre-deuda': 'No tener deudas de consumo activas',
      'logro-maestro-presupuesto': 'Tasa de ahorro mensual >= 20%',
      'logro-explorador': 'Usar 3 o más calculadoras de Dinari'
    }[id] || '';
  }

  function renderMissions() {
    const list = document.getElementById('missions-list');
    if (!list) return;

    const missions = window.MidinariMissions.getMissions();
    list.innerHTML = '';

    missions.forEach(mission => {
      const item = document.createElement('div');
      item.className = 'mission-item';
      
      const checkClass = mission.completada ? 'mission-checkbox--completed' : '';
      const textClass = mission.completada ? 'mission-text--completed' : '';

      item.innerHTML = `
        <div class="mission-checkbox ${checkClass}">
          ${mission.completada ? '✓' : ''}
        </div>
        <div style="flex-grow:1;">
          <span class="mission-text ${textClass}">${mission.texto}</span>
        </div>
        <div>
          <span style="font-size:10px; font-weight:700; color: ${mission.completada ? 'var(--success)' : 'var(--stone-400)'};">
            ${mission.completada ? 'Completada' : 'Activa'}
          </span>
        </div>
      `;
      list.appendChild(item);
    });
  }

  // Polling para esperar a que todos los scripts dinámicos se carguen en el objeto window
  const checkInterval = setInterval(() => {
    if (window.MidinariProfile && 
        window.MidinariAdvisor && 
        window.MidinariTimeline && 
        window.MidinariMissions && 
        window.MidinariAchievements) {
      clearInterval(checkInterval);
      init();
    }
  }, 50);

})();
