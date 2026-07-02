/* ============================================================
   DINARI — loans.js
   Lógica de la Calculadora de Préstamos con Amortización
   ============================================================ */

(function () {
  'use strict';

  const state = {
    amount: 50000,
    rate: 18,
    term: 36,
    termType: 'months',
    currencyInfo: { code: 'MXN', locale: 'es-MX' },
    chartDonut: null
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

  function calculate() {
    // Read input values
    const amountInput = document.getElementById('calc-amount');
    const rateInput = document.getElementById('calc-rate');
    const termInput = document.getElementById('calc-term');
    const termTypeSelect = document.getElementById('calc-term-type');

    if (!amountInput || !rateInput || !termInput || !termTypeSelect) return;

    state.amount = parseFloat(amountInput.value) || 0;
    state.rate = parseFloat(rateInput.value) || 0;
    state.term = parseFloat(termInput.value) || 0;
    state.termType = termTypeSelect.value;

    const p = state.amount;
    const annualRate = state.rate;
    const months = state.termType === 'years' ? state.term * 12 : state.term;

    if (p <= 0 || annualRate <= 0 || months <= 0) return;

    const monthlyRate = (annualRate / 100) / 12;

    let pmt = 0;
    if (annualRate === 0) {
      pmt = p / months;
    } else {
      pmt = p * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    let balance = p;
    let totalInterest = 0;
    const schedule = [];

    for (let i = 1; i <= months; i++) {
      let interest = balance * monthlyRate;
      let principal = pmt - interest;

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
      principal: p,
      monthlyPayment: pmt,
      totalInterest: totalInterest,
      totalPaid: p + totalInterest,
      months: months,
      schedule: schedule
    });
  }

  function renderResults(res) {
    document.getElementById('kpi-monthly-payment').textContent = fmt.currency(res.monthlyPayment);
    document.getElementById('kpi-total-interest').textContent = fmt.currency(res.totalInterest);
    document.getElementById('kpi-total-paid').textContent = fmt.currency(res.totalPaid);
    document.getElementById('kpi-payoff-date').textContent = fmt.date(res.months);

    // Cards summary
    const cardMonthly = document.getElementById('card-monthly-val');
    const cardInterest = document.getElementById('card-interest-val');
    const cardPaid = document.getElementById('card-paid-val');
    const cardRequested = document.getElementById('card-requested-val');

    if (cardMonthly) cardMonthly.textContent = fmt.currency(res.monthlyPayment);
    if (cardInterest) cardInterest.textContent = fmt.currency(res.totalInterest);
    if (cardPaid) cardPaid.textContent = fmt.currency(res.totalPaid);
    if (cardRequested) cardRequested.textContent = fmt.currency(res.principal);

    renderChart(res.principal, res.totalInterest);
    renderTable(res.schedule);
  }

  function renderChart(principal, interest) {
    const canvasDonut = document.getElementById('chart-loan-donut');
    if (!window.Chart || !canvasDonut) return;

    if (state.chartDonut) state.chartDonut.destroy();

    state.chartDonut = new Chart(canvasDonut, {
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
          legend: { position: 'bottom', labels: { font: { family: "'Plus Jakarta Sans'" }, color: '#635A52', usePointStyle: true } }
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
        <td>${fmt.currency(row.principal)}</td>
        <td>${fmt.currency(row.interest)}</td>
        <td>${fmt.currency(row.balance)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function resetForm() {
    const amountInput = document.getElementById('calc-amount');
    const rateInput = document.getElementById('calc-rate');
    const termInput = document.getElementById('calc-term');
    const termTypeSelect = document.getElementById('calc-term-type');

    if (amountInput) amountInput.value = 50000;
    if (rateInput) {
      rateInput.value = 18;
      const valEl = document.getElementById('calc-rate-val');
      if (valEl) valEl.textContent = '18%';
    }
    if (termInput) termInput.value = 36;
    if (termTypeSelect) termTypeSelect.value = 'months';

    calculate();
  }

  function bindEvents() {
    const btnCalculate = document.getElementById('btn-calculate');
    if (btnCalculate) {
      btnCalculate.addEventListener('click', calculate);
    }

    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', resetForm);
    }

    const rateInput = document.getElementById('calc-rate');
    if (rateInput) {
      rateInput.addEventListener('input', (e) => {
        const valEl = document.getElementById('calc-rate-val');
        if (valEl) valEl.textContent = e.target.value + '%';
      });
    }

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

  let saveDebounce = null;
  function saveToProfileDebounced(pmt) {
    if (saveDebounce) clearTimeout(saveDebounce);
    saveDebounce = setTimeout(() => {
      if (window.MidinariProfile) {
        window.MidinariProfile.updateProfile({
          deudaTotal: state.amount,
          pagoMensualDeuda: pmt
        });
      }
    }, 1000);
  }

  function init() {
    // Cargar perfil si existe
    if (window.MidinariProfile) {
      const profile = window.MidinariProfile.getProfile();
      if (profile.deudaTotal > 0) {
        state.amount = profile.deudaTotal;
        const amountInput = document.getElementById('calc-amount');
        if (amountInput) amountInput.value = state.amount;
      }
    }

    bindEvents();
    
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

  // Hook saveToProfileDebounced on calculate
  const originalCalculate = calculate;
  calculate = function() {
    originalCalculate();
    // Obtener cuota mensual fija recalculada
    const p = state.amount;
    const annualRate = state.rate;
    const months = state.termType === 'years' ? state.term * 12 : state.term;
    if (p > 0 && annualRate > 0 && months > 0) {
      const monthlyRate = (annualRate / 100) / 12;
      const pmt = p * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
      saveToProfileDebounced(pmt);
    }
  };

})();

