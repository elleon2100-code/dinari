/* ============================================================
   MIDINARI — timeline.js
   Historial y evolución de Score Financiero (Snapshots)
   ============================================================ */

const MidinariTimeline = (function () {
  'use strict';

  const STORAGE_KEY = 'midinariTimeline';

  /**
   * Obtiene los snapshots guardados en LocalStorage.
   */
  function getHistory() {
    if (typeof localStorage === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Guarda el historial en LocalStorage.
   */
  function saveHistory(history) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }

  /**
   * Registra un snapshot del estado actual del perfil.
   * Evita duplicar registros en el mismo día (actualiza el del día actual).
   * @param {Object} profile - Perfil financiero de Midinari.
   */
  function recordSnapshot(profile) {
    if (!window.MidinariAdvisor) return;

    const history = getHistory();
    const score = window.MidinariAdvisor.computeFinancialScore(profile);
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    const newSnapshot = {
      fecha: today,
      score: score,
      deudaTotal: profile.deudaTotal,
      ahorroActual: profile.ahorroActual,
      ahorroMensual: profile.ahorroMensual,
      ingresosMensuales: profile.ingresosMensuales
    };

    // Buscar si ya hay un registro de hoy
    const existingIndex = history.findIndex(s => s.fecha === today);

    if (existingIndex !== -1) {
      // Reemplazar snapshot de hoy con los valores más recientes
      history[existingIndex] = newSnapshot;
    } else {
      // Añadir nuevo snapshot
      history.push(newSnapshot);
    }

    // Limitar el historial a los últimos 30 snapshots para optimizar espacio
    if (history.length > 30) {
      history.shift();
    }

    saveHistory(history);
  }

  /**
   * Dibuja un gráfico SVG dinámico del historial de score.
   * @param {string} containerId - ID del div contenedor para el gráfico.
   */
  function renderScoreChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const history = getHistory();

    // Si no hay suficientes snapshots, inyectar datos iniciales de ejemplo/histórico inicial para visualización
    const dataPoints = [...history];
    if (dataPoints.length === 0) {
      container.innerHTML = `
        <div style="background:var(--cream-100); border:1px dashed var(--cream-300); border-radius:var(--radius-md); padding:var(--sp-6); text-align:center; color:var(--stone-500);">
          <span style="font-size: 1.5rem; display:block; margin-bottom:var(--sp-2);">📈</span>
          <p class="body-sm" style="margin:0;">Tu gráfico de evolución aparecerá aquí a medida que guardes tus progresos en diferentes días.</p>
        </div>
      `;
      return;
    }

    // Si solo hay 1 punto, duplicamos para tener una línea de base
    if (dataPoints.length === 1) {
      const single = dataPoints[0];
      // Crear un punto inicial simulado anterior de score 0
      dataPoints.unshift({
        fecha: 'Inicio',
        score: Math.max(0, single.score - 10)
      });
    }

    const width = container.clientWidth || 500;
    const height = 180;
    const padding = 25;

    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxScore = 100;
    const minScore = 0;

    // Calcular puntos de coordenadas
    const points = dataPoints.map((dp, index) => {
      const x = padding + (index / (dataPoints.length - 1)) * chartWidth;
      const y = padding + chartHeight - (dp.score / maxScore) * chartHeight;
      return { x, y, score: dp.score, fecha: dp.fecha };
    });

    // Construir el string del path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    // Construir el string del path de relleno (gradiente)
    const fillD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    // Renderizar SVG en el contenedor
    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;">
        <defs>
          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--sage-500)" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="var(--sage-500)" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        
        <!-- Líneas de cuadrícula horizontal (0, 50, 100) -->
        <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="var(--cream-300)" stroke-dasharray="4" />
        <line x1="${padding}" y1="${padding + chartHeight/2}" x2="${width - padding}" y2="${padding + chartHeight/2}" stroke="var(--cream-300)" stroke-dasharray="4" />
        <line x1="${padding}" y1="${padding + chartHeight}" x2="${width - padding}" y2="${padding + chartHeight}" stroke="var(--cream-300)" />
        
        <!-- Etiquetas Y -->
        <text x="${padding - 5}" y="${padding + 4}" fill="var(--stone-400)" font-size="9" text-anchor="end">100</text>
        <text x="${padding - 5}" y="${padding + chartHeight/2 + 4}" fill="var(--stone-400)" font-size="9" text-anchor="end">50</text>
        <text x="${padding - 5}" y="${padding + chartHeight + 4}" fill="var(--stone-400)" font-size="9" text-anchor="end">0</text>

        <!-- Relleno de Área -->
        <path d="${fillD}" fill="url(#chart-grad)" />
        
        <!-- Línea del Gráfico -->
        <path d="${pathD}" fill="none" stroke="var(--sage-600)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Círculos y Etiquetas X -->
        ${points.map((p, index) => {
          // Solo mostrar algunas fechas para no saturar si hay muchas
          const showLabel = points.length <= 6 || index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2);
          const dateObj = new Date(p.fecha + 'T00:00:00');
          const dateStr = p.fecha === 'Inicio' ? 'Inicio' : dateObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

          return `
            <circle cx="${p.x}" cy="${p.y}" r="5" fill="var(--white)" stroke="var(--sage-600)" stroke-width="2" />
            <text x="${p.x}" y="${p.y - 10}" fill="var(--charcoal)" font-size="9" font-weight="700" text-anchor="middle">${p.score}</text>
            ${showLabel ? `<text x="${p.x}" y="${height - 5}" fill="var(--stone-400)" font-size="9" text-anchor="middle">${dateStr}</text>` : ''}
          `;
        }).join('')}
      </svg>
    `;
  }

  return {
    getHistory: getHistory,
    recordSnapshot: recordSnapshot,
    renderScoreChart: renderScoreChart
  };
})();

// Registrar globalmente
if (typeof window !== 'undefined') {
  window.MidinariTimeline = MidinariTimeline;
}
