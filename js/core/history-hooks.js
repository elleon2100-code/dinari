/* ============================================================
   MIDINARI — history-hooks.js
   Inyección dinámica y captura automática para el Historial de Decisiones
   ============================================================ */

(function () {
  'use strict';

  function parseNum(str) {
    if (!str) return 0;
    const clean = str.replace(/[^0-9.-]+/g, "");
    return parseFloat(clean) || 0;
  }

  function parseMonths(str) {
    if (!str) return 0;
    if (str.toLowerCase().includes('eterno') || str.toLowerCase().includes('infinito')) return 999;
    const clean = str.replace(/[^0-9]+/g, "");
    return parseInt(clean) || 0;
  }

  function init() {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;

    // Evitar duplicaciones
    if (document.getElementById('btn-save-sim-history')) return;

    // 1. Inyectar botón de guardado en los resultados
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.justifyContent = 'flex-end';
    wrap.style.padding = '8px 0';
    wrap.style.borderBottom = '1px solid var(--cream-200)';
    wrap.style.marginBottom = '16px';
    wrap.innerHTML = `
      <button class="btn btn--outline btn--sm" id="btn-save-sim-history" style="font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
        💾 Guardar Simulación en mi Historial
      </button>
    `;
    
    // Insertar como primer elemento de results-container
    resultsContainer.insertBefore(wrap, resultsContainer.firstChild);

    // 2. Escuchar click
    const btn = document.getElementById('btn-save-sim-history');
    if (btn) {
      btn.addEventListener('click', handleSaveClick);
    }
  }

  function handleSaveClick() {
    const path = window.location.pathname;
    
    let toolId = 'ahorro';
    let defaultName = 'Simulación de Ahorro';
    let desc = 'Registro de simulación financiera.';
    let inputData = {};
    let outputData = {};

    if (path.includes('/simulador-deudas/')) {
      toolId = 'deudas';
      defaultName = 'Plan de Liquidación de Deudas';
      
      const kpiFree = document.getElementById('kpi-free-date')?.textContent || '';
      const kpiInterest = document.getElementById('kpi-total-interest')?.textContent || '';
      const kpiPaid = document.getElementById('kpi-total-paid')?.textContent || '';
      const kpiMonthly = document.getElementById('kpi-monthly')?.textContent || '';

      const debtsCount = document.querySelectorAll('#debt-order-list .order-item, .debt-row').length;

      inputData = { debtsCount };
      outputData = {
        meses: parseMonths(kpiFree),
        intereses: parseNum(kpiInterest),
        deudaTotal: parseNum(kpiPaid) - parseNum(kpiInterest),
        pagoMensual: parseNum(kpiMonthly)
      };
      desc = `Simulación de plan de deudas con ${debtsCount} cuentas activas.`;

    } else if (path.includes('/simulador-pago-minimo/')) {
      toolId = 'pago-minimo';
      defaultName = 'Impacto de Pago Mínimo';

      const debt = parseNum(document.getElementById('mp-debt')?.value);
      const rate = parseNum(document.getElementById('mp-rate-input')?.value);
      const minPay = parseNum(document.getElementById('mp-min-pay')?.value);

      const kpiTime = document.getElementById('kpi-time')?.textContent || '';
      const kpiInterest = document.getElementById('kpi-interest')?.textContent || '';

      inputData = { debt, rate, minPay };
      outputData = {
        meses: parseMonths(kpiTime),
        intereses: parseNum(kpiInterest),
        deudaTotal: debt,
        pagoMensual: minPay
      };
      desc = `Simulación de amortización pagando el mínimo de ${fmtCurrency(minPay)}.`;

    } else if (path.includes('/calculadora-prestamos/') || path.includes('/calculadora-intereses/')) {
      toolId = 'prestamos';
      defaultName = path.includes('/calculadora-prestamos/') ? 'Simulación de Préstamo' : 'Costo de Intereses';

      const amount = parseNum(document.getElementById('mp-amount')?.value || document.getElementById('inp-amount')?.value);
      const rate = parseNum(document.getElementById('mp-rate')?.value || document.getElementById('inp-rate')?.value);
      const term = parseNum(document.getElementById('mp-term')?.value || document.getElementById('inp-months')?.value);

      const kpiMonthly = document.getElementById('kpi-monthly-payment')?.textContent || '';
      const kpiInterest = document.getElementById('kpi-total-interest')?.textContent || '';

      inputData = { amount, rate, term };
      outputData = {
        meses: term,
        intereses: parseNum(kpiInterest),
        deudaTotal: amount,
        pagoMensual: parseNum(kpiMonthly)
      };
      desc = `Proyección de amortización francesa de ${fmtCurrency(amount)} a ${term} meses.`;

    } else if (path.includes('/calculadora-fondo-emergencia/')) {
      toolId = 'emergencia';
      defaultName = 'Colchón de Emergencia';

      const targetMonths = parseNum(document.getElementById('kpi-fund-months')?.textContent);
      const goal = parseNum(document.getElementById('kpi-emergency-goal')?.textContent);
      const monthsToGoal = parseMonths(document.getElementById('kpi-months-to-goal')?.textContent);

      inputData = { targetMonths, goal };
      outputData = {
        meses: monthsToGoal,
        intereses: 0,
        deudaTotal: 0,
        pagoMensual: 0,
        ahorroMensual: goal / (monthsToGoal || 1)
      };
      desc = `Plan de fondo de emergencias para cubrir ${targetMonths} meses de gastos.`;
    }

    if (window.MidinariHistoryHelper) {
      window.MidinariHistoryHelper.saveRecord(toolId, defaultName, desc, inputData, outputData);
    }
  }

  function fmtCurrency(val) {
    const code = localStorage.getItem('dinari_currency') || 'DOP';
    const symbol = {
      MXN: 'MX$', USD: 'US$', EUR: '€', COP: 'COL$',
      ARS: 'AR$', CLP: 'CLP$', PEN: 'S/', DOP: 'RD$'
    }[code] || '$';
    return `${symbol} ${Math.round(val).toLocaleString('es-DO')}`;
  }

  // Ejecutar inicialización al cargar la página
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    
    // Observador para inyectar el botón si los resultados se cargan de forma dinámica diferida
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        init();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

})();
