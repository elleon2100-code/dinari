/* ============================================================
   MIDINARI — recommendation-engine.js
   Motor de recomendaciones basado en reglas financieras
   ============================================================ */

const MidinariRecommendationEngine = (function () {
  'use strict';

  /**
   * Obtiene una lista de recomendaciones para el perfil financiero.
   * @param {Object} profile - Perfil de Midinari del usuario.
   * @returns {Array} Listado de recomendaciones ordenadas por prioridad.
   */
  function getRecommendations(profile) {
    const active = [];
    const rules = window.MidinariRules || [];

    // Evaluar cada regla
    rules.forEach(rule => {
      try {
        if (rule.condicion(profile)) {
          active.push({
            id: rule.id,
            icono: rule.icono,
            titulo: rule.titulo,
            descripcion: rule.descripcion,
            url: rule.url,
            cta: rule.cta,
            prioridad: rule.prioridad
          });
        }
      } catch (e) {
        console.error('Error al evaluar regla ' + rule.id, e);
      }
    });

    // Ordenar por prioridad: alta -> media -> baja
    const priorityWeight = { alta: 3, media: 2, baja: 1 };
    active.sort((a, b) => (priorityWeight[b.prioridad] || 0) - (priorityWeight[a.prioridad] || 0));

    return active;
  }

  /**
   * Genera el HTML de una tarjeta de recomendación.
   */
  function renderRecommendationCard(rec) {
    const badgeClass = {
      alta: 'score-label--critico',
      media: 'score-label--riesgo',
      baja: 'score-label--bueno'
    }[rec.prioridad] || 'score-label--bueno';

    const cardClass = 'recommendation-card--' + rec.prioridad;

    return `
      <div class="recommendation-card ${cardClass}" role="listitem">
        <div class="recommendation-card__header">
          <span class="recommendation-card__icon" aria-hidden="true">${rec.icono}</span>
          <span class="score-label ${badgeClass}" style="margin:0; font-size:10px; padding:2px 8px;">Prioridad ${rec.prioridad}</span>
        </div>
        <h3 class="recommendation-card__title">${rec.titulo}</h3>
        <p class="recommendation-card__desc">${rec.descripcion}</p>
        <a href="${rec.url}" class="btn btn--sage btn--sm" style="width:100%; text-align:center;">${rec.cta}</a>
      </div>
    `;
  }

  /**
   * Inyecta la sección de recomendaciones en el DOM.
   */
  function injectRecommendationsSection() {
    const pathsToInject = [
      '/simulador-deudas',
      '/simulador-pago-minimo',
      '/calculadora-intereses',
      '/calculadora-prestamos',
      '/calculadora-fondo-emergencia',
      '/control-gastos',
      '/mi-perfil'
    ];

    const currentPath = window.location.pathname;
    const shouldInject = pathsToInject.some(p => currentPath.includes(p));
    if (!shouldInject) return;

    // Obtener perfil y recomendaciones
    if (!window.MidinariProfile) return;
    const profile = window.MidinariProfile.getProfile();
    const recs = getRecommendations(profile);

    // Si no hay recomendaciones específicas, mostrar una por defecto (ej. Interés compuesto si no hay deudas)
    const activeRecs = recs.length > 0 ? recs : [
      {
        icono: '📈',
        titulo: 'Haz crecer tus ahorros',
        descripcion: '¡Excelente! No tienes alertas financieras críticas en tu perfil. Descubre el poder del interés compuesto y haz crecer tu dinero.',
        url: '/calculadora-intereses/',
        cta: 'Simular Interés Compuesto',
        prioridad: 'media'
      }
    ];

    // Limitar a las 3 recomendaciones principales
    const shownRecs = activeRecs.slice(0, 3);

    // Inyectar Estilos CSS necesarios
    const style = document.createElement('style');
    style.textContent = `
      .recommendations-section {
        padding-block: var(--sp-10);
        background-color: var(--cream-100);
        border-top: 1px solid var(--cream-300);
        border-bottom: 1px solid var(--cream-300);
        margin-top: var(--sp-12);
      }
      .recommendations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--sp-4);
        margin-top: var(--sp-6);
      }
      .recommendation-card {
        background: var(--white);
        border: 1px solid var(--cream-300);
        border-radius: var(--radius-lg);
        padding: var(--sp-5);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: transform 0.2s, box-shadow 0.2s;
        border-top: 4px solid var(--sage-400);
      }
      .recommendation-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      }
      .recommendation-card--alta {
        border-top-color: var(--danger);
      }
      .recommendation-card--media {
        border-top-color: var(--warning);
      }
      .recommendation-card--baja {
        border-top-color: var(--sage-600);
      }
      .recommendation-card__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--sp-3);
      }
      .recommendation-card__icon {
        font-size: 1.5rem;
      }
      .recommendation-card__title {
        font-size: var(--text-base);
        font-weight: 700;
        color: var(--charcoal);
        margin: 0 0 var(--sp-2) 0;
      }
      .recommendation-card__desc {
        font-size: var(--text-sm);
        color: var(--stone-500);
        line-height: 1.5;
        margin: 0 0 var(--sp-4) 0;
        flex-grow: 1;
      }
    `;
    document.head.appendChild(style);

    // Crear elemento de la sección
    const section = document.createElement('section');
    section.className = 'recommendations-section';
    section.setAttribute('aria-labelledby', 'recs-title');
    section.innerHTML = `
      <div class="container">
        <h2 class="heading-2" id="recs-title" style="margin-bottom:var(--sp-2);">💡 Recomendaciones para tu Perfil</h2>
        <p class="body-sm" style="color:var(--stone-500); margin:0;">
          Basado en tus datos financieros actuales guardados localmente o consulta tu 
          <a href="../copiloto/" style="color:var(--sage-700); font-weight:700; text-decoration:underline;">Copiloto Financiero</a>.
        </p>
        <div class="recommendations-grid" role="list">
          ${shownRecs.map(renderRecommendationCard).join('')}
        </div>
      </div>
    `;

    // Buscar dónde colocarlo: al final del <main> o antes de las secciones finales
    const main = document.querySelector('main');
    if (main) {
      // Intentar colocarlo antes de .faq-section o del footer de enlazado interno si existen
      const faq = main.querySelector('.faq-section');
      const related = main.querySelector('section[aria-labelledby="related-title-bottom"]');
      
      if (faq) {
        main.insertBefore(section, faq);
      } else if (related) {
        main.insertBefore(section, related);
      } else {
        main.appendChild(section);
      }
    }
  }

  // Escuchar cuando el DOM esté listo
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectRecommendationsSection);
    } else {
      injectRecommendationsSection();
    }
  }

  return {
    getRecommendations: getRecommendations
  };
})();

// Registrar globalmente
if (typeof window !== 'undefined') {
  window.MidinariRecommendationEngine = MidinariRecommendationEngine;
}
