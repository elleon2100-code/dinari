/* ============================================================
   MIDINARI — roadmap.js
   Controlador de la Hoja de Ruta Financiera
   ============================================================ */

(function () {
  'use strict';

  function renderRoadmap() {
    if (!window.MidinariProfile || !window.MidinariRecommendationEngine) return;

    const profile = window.MidinariProfile.getProfile();
    const recs = window.MidinariRecommendationEngine.getRecommendations(profile);
    const totalRules = window.MidinariRules ? window.MidinariRules.length : 6;

    // Calcular progreso
    const activeCount = recs.length;
    const completedCount = totalRules - activeCount;
    let progressPercent = Math.round((completedCount / totalRules) * 100);

    // Ajustar si el perfil está completamente vacío (primer ingreso)
    const isProfileEmpty = profile.ingresosMensuales === 0 && 
                           profile.gastosMensuales === 0 && 
                           profile.deudaTotal === 0 && 
                           profile.ahorroActual === 0;
    
    if (isProfileEmpty) {
      progressPercent = 0;
    }

    // Actualizar barra de progreso
    document.getElementById('progress-val').textContent = `${progressPercent}%`;
    document.getElementById('progress-fill').style.width = `${progressPercent}%`;

    const statusEl = document.getElementById('progress-status');
    if (isProfileEmpty) {
      statusEl.innerHTML = '⚠️ <strong>Aún no has configurado tu perfil.</strong> Ve al <a href="../mi-perfil/" style="color:var(--sage-700); font-weight:700;">Centro Financiero</a> para ingresar tus datos e iniciar tu plan personalizado.';
    } else if (progressPercent === 100) {
      statusEl.textContent = '🏆 ¡Excelente! Has completado todas las metas de tu hoja de ruta financiera. Tu salud financiera es óptima.';
    } else if (progressPercent >= 70) {
      statusEl.textContent = '💪 ¡Buen progreso! Estás cerca de una estabilidad total. Enfócate en las pocas recomendaciones pendientes.';
    } else if (progressPercent >= 40) {
      statusEl.textContent = '📈 Estás avanzando. Resuelve primero las prioridades altas para asegurar tus bases financieras.';
    } else {
      statusEl.textContent = '🚨 Tu salud financiera requiere atención prioritaria. Concéntrate en resolver los puntos marcados con prioridad alta.';
    }

    // Agrupar recomendaciones activas
    const grouped = { alta: [], media: [], baja: [] };
    recs.forEach(r => {
      if (grouped[r.prioridad]) {
        grouped[r.prioridad].push(r);
      }
    });

    // Renderizar grids
    renderGrid('alta', grouped.alta, '🏆 ¡Sin alertas críticas! Tu nivel de deuda mensual, deuda total y fondo de emergencia están en orden.');
    renderGrid('media', grouped.media, '💪 ¡Excelente! Cuentas con capacidad de ahorro activa y progresando en tu fondo de emergencia.');
    renderGrid('baja', grouped.baja, '🌱 Has cubierto las metas de crecimiento básicas. Sigue manteniendo una disciplina saludable.');
  }

  function renderGrid(priority, items, successMessage) {
    const grid = document.getElementById(`grid-${priority}`);
    if (!grid) return;
    grid.innerHTML = '';

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="roadmap-empty" role="status">
          <span style="font-size: 1.5rem; display: block; margin-bottom: var(--sp-2);">✅</span>
          <p class="body-sm" style="margin: 0; font-weight:600; color:var(--sage-700);">${successMessage}</p>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = `roadmap-card roadmap-card--${priority}`;
      card.setAttribute('role', 'listitem');
      
      const badgeClass = {
        alta: 'score-label--critico',
        media: 'score-label--riesgo',
        baja: 'score-label--bueno'
      }[priority] || 'score-label--bueno';

      card.innerHTML = `
        <div>
          <div class="roadmap-card__header">
            <span class="roadmap-card__icon" aria-hidden="true">${item.icono}</span>
            <span class="score-label ${badgeClass}" style="margin:0; font-size:10px; padding:2px 8px;">Prioridad ${priority}</span>
          </div>
          <h3 class="roadmap-card__title">${item.titulo}</h3>
          <p class="roadmap-card__desc">${item.descripcion}</p>
        </div>
        <a href="${item.url}" class="btn btn--sage btn--sm" style="width:100%; text-align:center; margin-top: var(--sp-2);">${item.cta}</a>
      `;
      grid.appendChild(card);
    });
  }

  function init() {
    renderRoadmap();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
