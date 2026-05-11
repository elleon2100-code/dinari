/* ============================================================
   DINARI — calculator.js
   Lógica de la Calculadora de Intereses de Préstamos
   ============================================================ */

(function () {
  'use strict';

  // ══════════════════════════════════════════
  // ESTADO Y MULTI-MONEDA
  // ══════════════════════════════════════════
  const state = {
    amount: 50000,
    rate: 24,
    term: 24,
    termType: 'months',
    currencyInfo: { code: 'MXN', locale: 'es-MX' },
    chart: null
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
  // LÓGICA FINANCIERA (SISTEMA FRANCÉS)
  // ══════════════════════════════════════════
  function calculate() {
    let p = state.amount;
    let annualRate = state.rate;
    let months = state.termType === 'years' ? state.term * 12 : state.term;

    if (p <= 0 || annualRate <= 0 || months <= 0) return;

    let monthlyRate = (annualRate / 100) / 12;
    let pmt = 0;
    
    if (annualRate === 0) {
      pmt = p / months;
    } else {
      pmt = p * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    let balance = p;
    let totalInterest = 0;
    let schedule = [];

    for (let i = 1; i <= months; i++) {
      let interest = balance * monthlyRate;
      let principal = pmt - interest;
      
      // Ajuste final para el último mes
      if (i === months) {
        principal = balance;
        pmt = principal + interest;
        balance = 0;
      } else {
        balance -= principal;
      }

      totalInterest += interest;

      schedule.push({
        month: i,
        payment: pmt,
        interest: interest,
        principal: principal,
        balance: Math.max(0, balance)
      });
    }

    renderResults({
      monthlyPayment: pmt,
      totalInterest: totalInterest,
      totalPaid: p + totalInterest,
      months: months,
      schedule: schedule,
      principal: p
    });
  }

  // ══════════════════════════════════════════
  // RENDERIZADO UI
  // ══════════════════════════════════════════
  function renderResults(results) {
    document.getElementById('kpi-monthly-payment').textContent = fmt.currency(results.monthlyPayment);
    document.getElementById('kpi-total-interest').textContent = fmt.currency(results.totalInterest);
    document.getElementById('kpi-total-paid').textContent = fmt.currency(results.totalPaid);
    document.getElementById('kpi-payoff-date').textContent = fmt.date(results.months);

    renderChart(results.principal, results.totalInterest);
    renderTable(results.schedule);
  }

  function renderChart(principal, interest) {
    const canvas = document.getElementById('chart-loan-donut');
    if (!canvas || !window.Chart) return;

    if (state.chart) state.chart.destroy();

    state.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Capital prestado', 'Intereses'],
        datasets: [{
          data: [principal, interest],
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
          legend: { position: 'bottom', labels: { font: { family: "'Plus Jakarta Sans'" }, color: '#635A52', usePointStyle: true } },
          tooltip: {
            callbacks: { label: (ctx) => ` ${ctx.label}: ${fmt.currency(ctx.parsed)}` },
            backgroundColor: '#2C2A27', padding: 12
          }
        }
      }
    });
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
        <td class="td-interest">${fmt.currency(row.interest)}</td>
        <td class="td-principal">${fmt.currency(row.principal)}</td>
        <td>${fmt.currency(row.balance)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ══════════════════════════════════════════
  // EVENT LISTENERS
  // ══════════════════════════════════════════
  function bindEvents() {
    const amountInput = document.getElementById('calc-amount');
    const rateSlider = document.getElementById('calc-rate');
    const rateVal = document.getElementById('calc-rate-val');
    const termInput = document.getElementById('calc-term');
    const termTypeSelect = document.getElementById('calc-term-type');
    const currencySelect = document.getElementById('currency-selector');

    const update = () => {
      state.amount = parseFloat(amountInput.value) || 0;
      state.rate = parseFloat(rateSlider.value) || 0;
      state.term = parseInt(termInput.value) || 0;
      state.termType = termTypeSelect.value;
      rateVal.textContent = state.rate + '%';
      calculate();
    };

    [amountInput, rateSlider, termInput, termTypeSelect].forEach(el => {
      if (el) el.addEventListener('input', update);
    });

    if (currencySelect) {
      currencySelect.addEventListener('change', (e) => applyCurrency(e.target.value));
    }

    const amortToggle = document.getElementById('amort-toggle');
    const amortBody = document.getElementById('amort-body');
    if (amortToggle && amortBody) {
      amortToggle.addEventListener('click', () => {
        const isOpen = amortBody.classList.toggle('open');
        amortToggle.classList.toggle('open', isOpen);
        amortToggle.setAttribute('aria-expanded', String(isOpen));
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
