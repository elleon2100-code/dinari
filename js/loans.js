/* ============================================================
   DINARI — loans.js
   Lógica de la Calculadora de Préstamos con Amortización
   ============================================================ */

(function () {
  'use strict';

  // ══════════════════════════════════════════
  // ESTADO Y MULTI-MONEDA
  // ══════════════════════════════════════════
  const state = {
    amount: 50000,
    rate: 18,
    term: 36,
    termType: 'months',
    amortType: 'french',
    extraPayment: 0,
    currencyInfo: { code: 'MXN', locale: 'es-MX' },
    chartDonut: null,
    chartLine: null
  };

  const CURRENCIES = {
    DOP: { code: 'DOP', locale: 'es-DO' },
    USD: { code: 'USD', locale: 'en-US' },
    MXN: { code: 'MXN', locale: 'es-MX' },
    COP: { code: 'COP', locale: 'es-CO' },
    ARS: { code: 'ARS', locale: 'es-AR' },
    CLP: { code: 'CLP', locale: 'es-CL' },
    PEN: { code: 'PEN', locale: 'es-PE' },
    EUR: { code: 'EUR', locale: 'es-ES' }
  };

  const fmt = {
    currency: (n) =>
      new Intl.NumberFormat(state.currencyInfo.locale, {
        style: 'currency', currency: state.currencyInfo.code,
        minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(n),
    date: (monthsFromNow) => {
      const d = new Date();
      d.setMonth(d.getMonth() + monthsFromNow);
      return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    }
  };

  function getActiveSymbol() {
    try {
      const parts = new Intl.NumberFormat(state.currencyInfo.locale, { style: 'currency', currency: state.currencyInfo.code }).formatToParts(0);
      const symbolPart = parts.find(p => p.type === 'currency');
      return symbolPart ? symbolPart.value : '$';
    } catch (e) { return '$'; }
  }

  function applyCurrency(code) {
    if (!CURRENCIES[code]) return;
    state.currencyInfo = CURRENCIES[code];
    localStorage.setItem('dinari_currency', code);
    
    const sel = document.getElementById('currency-selector');
    if (sel) sel.value = code;

    const symbol = getActiveSymbol();
    document.querySelectorAll('.currency-symbol').forEach(el => { el.textContent = symbol; });
    
    calculate();
  }

  // ══════════════════════════════════════════
  // LÓGICA FINANCIERA (AMORTIZACIÓN Y PAGOS EXTRA)
  // ══════════════════════════════════════════
  function calculate() {
    const p = state.amount;
    const annualRate = state.rate;
    const originalMonths = state.termType === 'years' ? state.term * 12 : state.term;
    const extra = state.extraPayment;

    if (p <= 0 || annualRate <= 0 || originalMonths <= 0) return;

    const monthlyRate = (annualRate / 100) / 12;

    // 1. Cálculo base (Sin pagos extra)
    let standardPmt = 0;
    if (annualRate === 0) {
      standardPmt = p / originalMonths;
    } else {
      standardPmt = p * monthlyRate * Math.pow(1 + monthlyRate, originalMonths) / (Math.pow(1 + monthlyRate, originalMonths) - 1);
    }

    let baseBalance = p;
    let baseTotalInterest = 0;
    const baseSchedule = [];
    const baseBalances = [p];

    for (let i = 1; i <= originalMonths; i++) {
      let interest = baseBalance * monthlyRate;
      let principal = standardPmt - interest;

      if (i === originalMonths) {
        principal = baseBalance;
        interest = baseBalance * monthlyRate;
        baseBalance = 0;
      } else {
        baseBalance -= principal;
      }
      baseTotalInterest += interest;
      baseSchedule.push({
        month: i,
        payment: principal + interest,
        interest: interest,
        principal: principal,
        balance: Math.max(0, baseBalance)
      });
      baseBalances.push(Math.max(0, baseBalance));
    }

    // 2. Cálculo con pagos extra (si existen)
    let activeBalance = p;
    let activeTotalInterest = 0;
    const activeSchedule = [];
    const activeBalances = [p];
    let monthCounter = 0;

    while (activeBalance > 0.01 && monthCounter < 600) { // Límite de 50 años para evitar loops infinitos
      monthCounter++;
      let interest = activeBalance * monthlyRate;
      let principal = standardPmt - interest;

      let thisMonthExtra = extra;
      if (principal + thisMonthExtra > activeBalance) {
        thisMonthExtra = Math.max(0, activeBalance - principal);
      }

      let totalPrincipal = principal + thisMonthExtra;

      if (totalPrincipal > activeBalance) {
        totalPrincipal = activeBalance;
        activeBalance = 0;
      } else {
        activeBalance -= totalPrincipal;
      }

      activeTotalInterest += interest;
      activeSchedule.push({
        month: monthCounter,
        payment: totalPrincipal + interest,
        interest: interest,
        principal: totalPrincipal,
        balance: Math.max(0, activeBalance)
      });
      activeBalances.push(Math.max(0, activeBalance));
    }

    const hasExtra = extra > 0;
    const finalSchedule = hasExtra ? activeSchedule : baseSchedule;
    const finalInterest = hasExtra ? activeTotalInterest : baseTotalInterest;
    const finalMonths = hasExtra ? monthCounter : originalMonths;

    const interestSaved = Math.max(0, baseTotalInterest - activeTotalInterest);
    const monthsReduced = Math.max(0, originalMonths - finalMonths);

    renderResults({
      principal: p,
      monthlyPayment: standardPmt,
      totalInterest: finalInterest,
      totalPaid: p + finalInterest,
      months: finalMonths,
      schedule: finalSchedule,
      hasExtra: hasExtra,
      interestSaved: interestSaved,
      monthsReduced: monthsReduced,
      baseBalances: baseBalances,
      activeBalances: activeBalances,
      termType: state.termType,
      rate: annualRate
    });
  }

  // ══════════════════════════════════════════
  // RENDERIZADO UI Y EXPLICACIÓN DINÁMICA
  // ══════════════════════════════════════════
  function renderResults(res) {
    document.getElementById('kpi-monthly-payment').textContent = fmt.currency(res.monthlyPayment);
    document.getElementById('kpi-total-interest').textContent = fmt.currency(res.totalInterest);
    document.getElementById('kpi-total-paid').textContent = fmt.currency(res.totalPaid);
    document.getElementById('kpi-payoff-date').textContent = fmt.date(res.months);

    // KPI Extras
    const extraBox = document.getElementById('extra-kpi-box');
    if (res.hasExtra && res.interestSaved > 0) {
      extraBox.style.display = 'block';
      document.getElementById('kpi-interest-saved').textContent = fmt.currency(res.interestSaved);
      document.getElementById('kpi-months-reduced').textContent = res.monthsReduced + (res.monthsReduced === 1 ? ' mes' : ' meses');
    } else {
      extraBox.style.display = 'none';
    }

    renderCharts(res);
    renderTable(res.schedule);
    renderExplanation(res);
  }

  function renderCharts(res) {
    const canvasDonut = document.getElementById('chart-loan-donut');
    const canvasLine = document.getElementById('chart-loan-line');
    if (!window.Chart) return;

    // 1. Donut Chart
    if (canvasDonut) {
      if (state.chartDonut) state.chartDonut.destroy();
      state.chartDonut = new Chart(canvasDonut, {
        type: 'doughnut',
        data: {
          labels: ['Capital solicitado', 'Intereses totales'],
          datasets: [{
            data: [res.principal, res.totalInterest],
            backgroundColor: ['#5C8060', '#B3A99E'],
            borderColor: '#FAF8F4',
            borderWidth: 3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { position: 'bottom', labels: { font: { family: "'Plus Jakarta Sans'" }, color: '#635A52', usePointStyle: true } }
          }
        }
      });
    }

    // 2. Line Chart
    if (canvasLine) {
      if (state.chartLine) state.chartLine.destroy();
      
      const labels = Array.from({ length: Math.max(res.baseBalances.length, res.activeBalances.length) }, (_, i) => `Mes ${i}`);
      const datasets = [{
        label: 'Saldo Sin Pagos Extra',
        data: res.baseBalances,
        borderColor: '#B3A99E',
        backgroundColor: 'rgba(179, 169, 158, 0.1)',
        tension: 0.1,
        fill: true
      }];

      if (res.hasExtra) {
        datasets.push({
          label: 'Saldo Con Pagos Extra',
          data: res.activeBalances,
          borderColor: '#5C8060',
          backgroundColor: 'rgba(92, 128, 96, 0.1)',
          tension: 0.1,
          fill: true
        });
      }

      state.chartLine = new Chart(canvasLine, {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              ticks: {
                callback: function(value) { return fmt.currency(value); },
                font: { family: "'Plus Jakarta Sans'" }
              }
            },
            x: {
              ticks: { font: { family: "'Plus Jakarta Sans'" } }
            }
          },
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  }

  function renderTable(schedule) {
    const tbody = document.getElementById('amort-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    schedule.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.month}</td>
        <td>${fmt.currency(row.payment)}</td>
        <td>${fmt.currency(row.interest)}</td>
        <td>${fmt.currency(row.principal)}</td>
        <td>${fmt.currency(row.balance)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderExplanation(res) {
    const container = document.getElementById('educational-explanation');
    if (!container) return;

    let text = `<h3>📊 Análisis de tu Préstamo de ${fmt.currency(res.principal)}</h3>`;
    text += `<p>Al solicitar un crédito con una tasa de interés del <strong>${res.rate}% anual</strong>, cada cuota mensual fija de <strong>${fmt.currency(res.monthlyPayment)}</strong> amortiza parte del saldo y cubre los intereses mensuales calculados sobre el saldo insoluto restante (Método Francés).</p>`;

    if (res.hasExtra && res.interestSaved > 0) {
      text += `<p class="alert-success"><strong>💡 ¡Excelente estrategia!</strong> Añadir un abono extra mensual de <strong>${fmt.currency(state.extraPayment)}</strong> te permitirá ahorrar <strong>${fmt.currency(res.interestSaved)}</strong> en intereses totales y terminar de pagar la deuda <strong>${res.monthsReduced} meses antes</strong> de lo previsto.</p>`;
    } else {
      text += `<p><strong>💡 Consejo de Dinari:</strong> Si realizas abonos al capital de forma recurrente (pagos adelantados), reducirás directamente el saldo sobre el cual se calculan los intereses del siguiente mes. Esto puede acortar considerablemente la vida de tu préstamo y ahorrarte miles de pesos o dólares.</p>`;
    }

    container.innerHTML = text;
  }

  // ══════════════════════════════════════════
  // EVENTOS Y ENLACES
  // ══════════════════════════════════════════
  function bindEvents() {
    const inputs = [
      { id: 'calc-amount', prop: 'amount', isNum: true },
      { id: 'calc-rate', prop: 'rate', isNum: true, hasValEl: 'calc-rate-val', valSuffix: '%' },
      { id: 'calc-term', prop: 'term', isNum: true },
      { id: 'calc-term-type', prop: 'termType' },
      { id: 'calc-extra-payment', prop: 'extraPayment', isNum: true }
    ];

    inputs.forEach(item => {
      const el = document.getElementById(item.id);
      if (!el) return;

      const updateState = () => {
        let val = el.value;
        if (item.isNum) {
          val = parseFloat(val) || 0;
          if (val < 0) val = 0;
        }
        state[item.prop] = val;

        if (item.hasValEl) {
          const valEl = document.getElementById(item.hasValEl);
          if (valEl) valEl.textContent = val + (item.valSuffix || '');
        }

        calculate();
      };

      el.addEventListener('input', updateState);
      el.addEventListener('change', updateState);
    });

    const currencySel = document.getElementById('currency-selector');
    if (currencySel) {
      currencySel.addEventListener('change', (e) => {
        applyCurrency(e.target.value);
      });
    }

    const amortToggle = document.getElementById('amort-toggle');
    const amortBody = document.getElementById('amort-body');
    if (amortToggle && amortBody) {
      amortToggle.addEventListener('click', () => {
        const isOpen = amortBody.classList.contains('open');
        amortBody.classList.toggle('open', !isOpen);
        amortToggle.classList.toggle('open', !isOpen);
        amortToggle.setAttribute('aria-expanded', String(!isOpen));
      });
    }

    document.querySelectorAll('.faq-item__question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const wasOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });
  }

  function loadChartJS(cb) {
    if (window.Chart) { cb(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = cb;
    document.head.appendChild(script);
  }

  function init() {
    bindEvents();
    
    // Auto-detect currency
    let initialCurrency = localStorage.getItem('dinari_currency');
    if (!initialCurrency) {
      try {
        const loc = navigator.language;
        if (loc.startsWith('es-DO')) initialCurrency = 'DOP';
        else if (loc.startsWith('es-CO')) initialCurrency = 'COP';
        else if (loc.startsWith('es-AR')) initialCurrency = 'ARS';
        else if (loc.startsWith('es-CL')) initialCurrency = 'CLP';
        else if (loc.startsWith('es-PE')) initialCurrency = 'PEN';
        else if (loc.startsWith('es-ES')) initialCurrency = 'EUR';
        else if (loc.startsWith('es')) initialCurrency = 'MXN';
        else initialCurrency = 'USD';
      } catch (e) { initialCurrency = 'MXN'; }
    }
    applyCurrency(initialCurrency || 'MXN');

    loadChartJS(() => { calculate(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
