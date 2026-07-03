/* ============================================================
   MIDINARI — report.js
   Controlador del Informe Financiero Profesional
   ============================================================ */

(function () {
  'use strict';

  const fmt = {
    currency: (val) => {
      const code = localStorage.getItem('dinari_currency') || 'DOP';
      const symbol = {
        MXN: 'MX$', USD: 'US$', EUR: '€', COP: 'COL$',
        ARS: 'AR$', CLP: 'CLP$', PEN: 'S/', DOP: 'RD$'
      }[code] || '$';
      return `${symbol} ${Math.round(val).toLocaleString('es-DO')}`;
    },
    percent: (val) => `${val.toFixed(1)}%`,
    date: (isoStr) => {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  let activeProfile = null;
  let scenarios = [];
  let historyRecords = [];

  function init() {
    activeProfile = window.MidinariProfile.getProfile();
    loadExternalData();
    renderAll();
    setupEventListeners();
  }

  function loadExternalData() {
    // Escenarios
    const rawSc = localStorage.getItem('midinari_scenarios');
    if (rawSc) {
      try { scenarios = JSON.parse(rawSc); } catch (e) {}
    }
    // Historial
    const rawHist = localStorage.getItem('midinari_history');
    if (rawHist) {
      try { historyRecords = JSON.parse(rawHist); } catch (e) {}
    }
  }

  function renderAll() {
    renderHeaderCover();
    renderSummaryAndDonut();
    renderFODA();
    renderObjectives();
    renderActiveScenarioTable();
    renderComparisonTable();
    renderProjections();
    renderRecommendations();
    renderHistorySection();
  }

  function renderHeaderCover() {
    const dateEl = document.getElementById('rep-date');
    if (dateEl) {
      dateEl.textContent = `Fecha de generación: ${new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }

    if (!window.MidinariAdvisor) return;

    const score = window.MidinariAdvisor.computeFinancialScore(activeProfile);
    const diagnosis = window.MidinariAdvisor.getDiagnosis(activeProfile);

    // Score ring progress
    const circle = document.getElementById('rep-score-stroke');
    if (circle) {
      const circumference = 389; // 2 * Math.PI * 62
      const offset = circumference - (score / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }

    const scoreVal = document.getElementById('rep-score-val');
    if (scoreVal) scoreVal.textContent = score;

    const label = document.getElementById('rep-score-label');
    if (label) {
      label.textContent = diagnosis.estadoGeneral.toUpperCase();
      label.className = 'score-label';
      const labelClass = {
        'Excelente': 'score-label--bueno',
        'Bueno': 'score-label--bueno',
        'Riesgo': 'score-label--riesgo',
        'Crítico': 'score-label--critico'
      }[diagnosis.estadoGeneral] || 'score-label--bueno';
      label.classList.add(labelClass);
    }
  }

  function renderSummaryAndDonut() {
    const table = document.getElementById('rep-summary-table');
    const svg = document.getElementById('rep-donut-svg');
    const legend = document.getElementById('rep-donut-legend');
    if (!table || !svg || !legend) return;

    // 1. Tabla de resumen
    const ahorroReal = activeProfile.ingresosMensuales - activeProfile.gastosMensuales;
    table.innerHTML = `
      <thead>
        <tr>
          <th>Métrica Presupuestaria</th>
          <th>Monto Mensual</th>
          <th>Porcentaje</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Ingresos Totales</strong></td>
          <td>${fmt.currency(activeProfile.ingresosMensuales)}</td>
          <td>100%</td>
        </tr>
        <tr>
          <td>Gastos Mensuales</td>
          <td>${fmt.currency(activeProfile.gastosMensuales)}</td>
          <td>${fmt.percent((activeProfile.gastosMensuales / (activeProfile.ingresosMensuales || 1)) * 100)}</td>
        </tr>
        <tr>
          <td>Ahorro Programado</td>
          <td>${fmt.currency(activeProfile.ahorroMensual)}</td>
          <td>${fmt.percent((activeProfile.ahorroMensual / (activeProfile.ingresosMensuales || 1)) * 100)}</td>
        </tr>
        <tr>
          <td>Capacidad Libre Restante</td>
          <td>${fmt.currency(Math.max(0, ahorroReal - activeProfile.ahorroMensual))}</td>
          <td>${fmt.percent((Math.max(0, ahorroReal - activeProfile.ahorroMensual) / (activeProfile.ingresosMensuales || 1)) * 100)}</td>
        </tr>
      </tbody>
    `;

    // 2. Gráfico Donut SVG
    const inc = activeProfile.ingresosMensuales || 1;
    const expPct = Math.min(100, (activeProfile.gastosMensuales / inc) * 100);
    const savPct = Math.min(100 - expPct, (activeProfile.ahorroMensual / inc) * 100);
    const freePct = Math.max(0, 100 - (expPct + savPct));

    const circ = 251.3; // 2 * Math.PI * 40

    // Slices calculations
    const sliceExp = (expPct / 100) * circ;
    const sliceSav = (savPct / 100) * circ;
    const sliceFree = (freePct / 100) * circ;

    const offsetExp = 0;
    const offsetSav = -sliceExp;
    const offsetFree = -(sliceExp + sliceSav);

    svg.innerHTML = `
      <circle cx="60" cy="60" r="40" fill="none" stroke="var(--cream-200)" stroke-width="18"></circle>
      <!-- Gastos (Rojo/Naranja) -->
      <circle cx="60" cy="60" r="40" fill="none" stroke="#e57373" stroke-width="18" stroke-dasharray="${sliceExp} ${circ}" stroke-dashoffset="${offsetExp}" transform="rotate(-90 60 60)"></circle>
      <!-- Ahorro (Verde/Sage) -->
      <circle cx="60" cy="60" r="40" fill="none" stroke="#81c784" stroke-width="18" stroke-dasharray="${sliceSav} ${circ}" stroke-dashoffset="${offsetSav}" transform="rotate(-90 60 60)"></circle>
      <!-- Libre (Crema/Moka) -->
      <circle cx="60" cy="60" r="40" fill="none" stroke="#b0bec5" stroke-width="18" stroke-dasharray="${sliceFree} ${circ}" stroke-dashoffset="${offsetFree}" transform="rotate(-90 60 60)"></circle>
      
      <circle cx="60" cy="60" r="26" fill="var(--white)"></circle>
    `;

    // 3. Leyenda
    legend.innerHTML = `
      <div class="rep-donut-legend-item"><div class="rep-donut-color-box" style="background:#e57373;"></div>Gastos: ${expPct.toFixed(0)}%</div>
      <div class="rep-donut-legend-item"><div class="rep-donut-color-box" style="background:#81c784;"></div>Ahorro: ${savPct.toFixed(0)}%</div>
      <div class="rep-donut-legend-item"><div class="rep-donut-color-box" style="background:#b0bec5;"></div>Libre: ${freePct.toFixed(0)}%</div>
    `;
  }

  function renderFODA() {
    const listFort = document.getElementById('rep-foda-fortalezas');
    const listDeb = document.getElementById('rep-foda-debilidades');
    if (!listFort || !listDeb) return;

    if (!window.MidinariAdvisor) return;

    const diagnosis = window.MidinariAdvisor.getDiagnosis(activeProfile);

    listFort.innerHTML = '';
    listDeb.innerHTML = '';

    // Fortalezas
    diagnosis.puntosFuertes.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      listFort.appendChild(li);
    });
    if (diagnosis.puntosFuertes.length === 0) {
      listFort.innerHTML = '<li>Registra tu información para encontrar fortalezas.</li>';
    }

    // Debilidades
    diagnosis.puntosAtencion.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      listDeb.appendChild(li);
    });
    if (diagnosis.puntosAtencion.length === 0) {
      listDeb.innerHTML = '<li>¡No se detectaron riesgos críticos en tu perfil!</li>';
    }
  }

  function renderObjectives() {
    const container = document.getElementById('rep-objectives-container');
    if (!container) return;

    // Calcular progreso
    const fundMeta = activeProfile.fondoEmergenciaObjetivo || 1;
    const fundProgress = Math.min(100, Math.round((activeProfile.ahorroActual / fundMeta) * 100));

    const debtProgress = activeProfile.deudaTotal === 0 ? 100 : 0;

    container.innerHTML = `
      <div style="margin-bottom:var(--sp-4);">
        <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:4px;">
          <span>Fondo de Emergencia</span>
          <span>${fundProgress}% (${fmt.currency(activeProfile.ahorroActual)} / ${fmt.currency(activeProfile.fondoEmergenciaObjetivo)})</span>
        </div>
        <div class="journey-progress">
          <div class="journey-progress-fill" style="width:${fundProgress}%;"></div>
        </div>
      </div>

      <div>
        <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:4px;">
          <span>Liquidación de Deuda Total</span>
          <span>${debtProgress === 100 ? 'Completado (Cero Deudas)' : `Pendiente (${fmt.currency(activeProfile.deudaTotal)} restante)`}</span>
        </div>
        <div class="journey-progress">
          <div class="journey-progress-fill" style="width:${debtProgress}%; background:var(--sage-500);"></div>
        </div>
      </div>
    `;
  }

  function renderActiveScenarioTable() {
    const table = document.getElementById('rep-active-scenario-table');
    if (!table) return;

    table.innerHTML = `
      <thead>
        <tr>
          <th>Parámetro</th>
          <th>Monto Activo</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Ingresos Mensuales</td><td><strong>${fmt.currency(activeProfile.ingresosMensuales)}</strong></td></tr>
        <tr><td>Gastos Mensuales</td><td><strong>${fmt.currency(activeProfile.gastosMensuales)}</strong></td></tr>
        <tr><td>Ahorro Programado</td><td><strong>${fmt.currency(activeProfile.ahorroMensual)}</strong></td></tr>
        <tr><td>Líquido de Emergencia</td><td><strong>${fmt.currency(activeProfile.ahorroActual)}</strong></td></tr>
        <tr><td>Deuda Consolidada</td><td><strong>${fmt.currency(activeProfile.deudaTotal)}</strong></td></tr>
        <tr><td>Pago Mensual Deuda</td><td><strong>${fmt.currency(activeProfile.pagoMensualDeuda)}</strong></td></tr>
        <tr><td>Tasa de Interés Promedio</td><td><strong>${fmt.percent(activeProfile.interesPromedio)}</strong></td></tr>
      </tbody>
    `;
  }

  function renderComparisonTable() {
    const section = document.getElementById('rep-scenarios-compare-section');
    const table = document.getElementById('rep-scenarios-compare-table');
    if (!section || !table) return;

    if (scenarios.length < 2) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';

    let headersHtml = '<th>Métrica</th>';
    scenarios.forEach(s => {
      headersHtml += `<th>${s.nombre} ${s.isActive ? '(Activo)' : ''}</th>`;
    });

    // Filas
    const rows = [
      { label: 'Pago Mensual Deuda', key: 'pagoMensualDeuda', isCurrency: true },
      { label: 'Tiempo de Liquidación', fn: (s) => s.mesesLiquidar === 999 ? 'Eterno' : (s.mesesLiquidar === 0 ? 'Sin Deudas' : `${s.mesesLiquidar} meses`) },
      { label: 'Intereses Totales', fn: (s) => s.interesesTotales === 999 ? 'Eterno' : (s.interesesTotales === 0 ? 'Sin Intereses' : fmt.currency(s.interesesTotales)) },
      { label: 'Financial Score', key: 'score' }
    ];

    let bodyHtml = '';
    rows.forEach(r => {
      bodyHtml += `<tr><td><strong>${r.label}</strong></td>`;
      scenarios.forEach(s => {
        let val = r.fn ? r.fn(s) : s[r.key];
        if (r.isCurrency) val = fmt.currency(val);
        bodyHtml += `<td>${val}</td>`;
      });
      bodyHtml += '</tr>';
    });

    table.innerHTML = `
      <thead>
        <tr>${headersHtml}</tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    `;
  }

  function renderProjections() {
    const block = document.getElementById('rep-projection-block');
    if (!block) return;

    if (activeProfile.deudaTotal > 0) {
      const payoff = simulateDebtPayoff(
        activeProfile.deudaTotal,
        activeProfile.interesPromedio,
        activeProfile.pagoMensualDeuda
      );

      if (payoff.infinite) {
        block.innerHTML = `
          <div style="background:#ffebee; color:var(--danger); padding:12px; border-radius:6px; font-size:12px; font-weight:700;">
            ⚠️ ADVERTENCIA CRÍTICA: Tu nivel de pago mensual actual es insuficiente para cubrir la acumulación de intereses. La deuda crecerá indefinidamente si no realizas abonos extraordinarios.
          </div>
        `;
      } else {
        block.innerHTML = `
          <p class="body-sm" style="margin:0; line-height:1.5;">
            Bajo las condiciones actuales, liquidarás tus deudas en aproximadamente <strong>${payoff.months} meses</strong>.<br>
            El costo real de financiamiento por concepto de intereses acumulados será de <strong>${fmt.currency(payoff.interestPaid)}</strong>.
          </p>
        `;
      }
    } else {
      block.innerHTML = `
        <p class="body-sm" style="margin:0; line-height:1.5;">
          No posees deudas activas registradas. Tu perfil se enfoca en la fase de **Inversión y Libertad Financiera** para multiplicar el capital remanente mediante interés compuesto.
        </p>
      `;
    }
  }

  function simulateDebtPayoff(totalDebt, annualRate, monthlyPayment) {
    if (totalDebt <= 0) return { months: 0, interestPaid: 0, infinite: false };
    if (monthlyPayment <= 0) return { months: 999, interestPaid: 999, infinite: true };

    let balance = totalDebt;
    const monthlyRate = (annualRate / 100) / 12;
    let months = 0;
    let interestPaid = 0;
    const maxMonths = 360;

    while (balance > 0.01 && months < maxMonths) {
      months++;
      const interest = balance * monthlyRate;
      interestPaid += interest;
      balance += interest;

      if (monthlyPayment <= interest) {
        return { months: 999, interestPaid: 999, infinite: true };
      }

      const applied = Math.min(monthlyPayment, balance);
      balance -= applied;
    }

    return {
      months: months,
      interestPaid: interestPaid,
      infinite: months >= maxMonths
    };
  }

  function renderRecommendations() {
    const container = document.getElementById('rep-recommendations-list');
    if (!container) return;

    if (!window.MidinariAdvisor) return;

    const diagnosis = window.MidinariAdvisor.getDiagnosis(activeProfile);

    container.innerHTML = `
      <p style="margin:0 0 10px 0;"><strong>Prioridad Principal del Mes:</strong> ${diagnosis.prioridadMes}</p>
      <p style="margin:0;"><strong>Sugerencia de Acción:</strong> Para optimizar tu salud financiera, te recomendamos seguir las misiones de Copiloto y consolidar tu fondo de contingencia antes de buscar adquirir créditos de consumo adicionales.</p>
    `;
  }

  function renderHistorySection() {
    const section = document.getElementById('rep-history-section');
    const table = document.getElementById('rep-history-table');
    if (!section || !table) return;

    if (historyRecords.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';

    let rowsHtml = '';
    // Mostrar últimas 5 simulaciones
    const recent = historyRecords.slice(-5).reverse();

    recent.forEach(r => {
      const toolLabel = {
        deudas: 'Deudas',
        'pago-minimo': 'Pago Mínimo',
        ahorro: 'Ahorro',
        prestamos: 'Préstamos',
        emergencia: 'Emergencia'
      }[r.herramienta] || r.herramienta;

      rowsHtml += `
        <tr>
          <td>${fmt.date(r.fecha)}</td>
          <td><strong>${r.nombre}</strong></td>
          <td>${toolLabel}</td>
          <td>Score: ${r.score}</td>
        </tr>
      `;
    });

    table.innerHTML = `
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Nombre de Simulación</th>
          <th>Módulo</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    `;
  }

  function setupEventListeners() {
    // 1. Botón Imprimir/Descargar PDF
    const btnPrint = document.getElementById('btn-print-pdf');
    if (btnPrint) {
      btnPrint.onclick = () => {
        window.print();
      };
    }

    // 2. Botón Guardar HTML
    const btnSaveHtml = document.getElementById('btn-save-html');
    if (btnSaveHtml) {
      btnSaveHtml.onclick = () => {
        downloadReportHtml();
      };
    }
  }

  function downloadReportHtml() {
    const reportHtml = document.getElementById('report-page').outerHTML;
    
    // Boilerplate auto-contenido
    const fileContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte Financiero Profesional - Dinari</title>
<style>
  body {
    background: #f7f9f6;
    padding: 2rem;
    font-family: sans-serif;
    color: #2d312e;
  }
  .report-page-container {
    background: #fff;
    border: 1px solid #e1e5e2;
    border-radius: 12px;
    padding: 3rem;
    max-width: 800px;
    margin: 0 auto;
    box-shadow: 0 10px 40px rgba(0,0,0,0.03);
  }
  .rep-cover {
    text-align: center;
    padding: 4rem 0 6rem 0;
    border-bottom: 2px solid #5c8060;
    margin-bottom: 3rem;
  }
  .rep-cover__logo {
    font-size: 2.5rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 2.5rem;
  }
  .rep-cover__logo-mark {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #5c8060, #4c6a4f);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-family: serif;
  }
  .rep-score-ring {
    position: relative;
    width: 140px;
    height: 140px;
    margin: 0 auto 16px auto;
  }
  .rep-section {
    margin-bottom: 2.5rem;
    border-bottom: 1px solid #e1e5e2;
    padding-bottom: 1.5rem;
  }
  .rep-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #4c6a4f;
    margin-bottom: 1.25rem;
  }
  .foda-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .foda-card {
    background: #fcfdfc;
    border: 1px solid #e1e5e2;
    border-radius: 8px;
    padding: 16px;
  }
  .rep-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }
  .rep-table th, .rep-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #e1e5e2;
    font-size: 12px;
  }
  .rep-table th {
    background: #f1f4f1;
    font-weight: 700;
  }
  .journey-progress {
    height: 6px;
    background: #e1e5e2;
    border-radius: 99px;
    overflow: hidden;
  }
  .journey-progress-fill {
    height: 100%;
    background: #5c8060;
  }
  .rep-donut-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }
  .rep-donut-legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .rep-donut-color-box {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
</style>
</head>
<body>
  ${reportHtml}
</body>
</html>`;

    const blob = new Blob([fileContent], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Reporte_Financiero_Midinari_${new Date().toISOString().substring(0,10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Polling para esperar la carga del Core
  const checkInterval = setInterval(() => {
    if (window.MidinariProfile && window.MidinariAdvisor) {
      clearInterval(checkInterval);
      init();
    }
  }, 50);

})();
