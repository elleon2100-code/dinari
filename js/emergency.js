/* ============================================================
   DINARI — emergency.js
   Lógica de la Calculadora de Fondo de Emergencia
   ============================================================ */

(function () {
  'use strict';

  const state = {
    expenses: 30000,
    jobType: 'stable',
    dependents: false,
    otherIncome: true,
    currentSavings: 0,
    currencyInfo: { code: 'MXN', locale: 'es-MX' }
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
      }).format(n)
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
    const expenses = state.expenses;
    const job = state.jobType;
    const deps = state.dependents;
    const otherInc = state.otherIncome;
    const current = state.currentSavings;

    if (expenses <= 0) return;

    // 1. Determinar meses sugeridos base
    let baseMonths = 4;
    if (job === 'very_stable') baseMonths = 3;
    else if (job === 'stable') baseMonths = 4;
    else if (job === 'freelance') baseMonths = 6;
    else if (job === 'business') baseMonths = 8;

    // 2. Modificadores
    let extraMonths = 0;
    if (deps) extraMonths += 1;
    if (!otherInc) extraMonths += 1;

    const totalMonths = baseMonths + extraMonths;
    const recommendedFund = expenses * totalMonths;

    // 3. Objetivos de ahorro mensual
    const monthly6 = recommendedFund / 6;
    const monthly12 = recommendedFund / 12;
    const monthly18 = recommendedFund / 18;
    const monthly24 = recommendedFund / 24;

    // 4. Progreso del fondo
    const progressPercent = Math.min(100, Math.max(0, (current / recommendedFund) * 100));

    renderResults({
      recommendedFund,
      totalMonths,
      monthly6,
      monthly12,
      monthly18,
      monthly24,
      progressPercent,
      expenses,
      current
    });
  }

  function renderResults(res) {
    document.getElementById('kpi-recommended-fund').textContent = fmt.currency(res.recommendedFund);
    document.getElementById('kpi-suggested-months').textContent = res.totalMonths + (res.totalMonths === 1 ? ' mes' : ' meses');
    
    document.getElementById('val-6m').textContent = fmt.currency(res.monthly6);
    document.getElementById('val-12m').textContent = fmt.currency(res.monthly12);
    document.getElementById('val-18m').textContent = fmt.currency(res.monthly18);
    document.getElementById('val-24m').textContent = fmt.currency(res.monthly24);

    const formattedExpenses = fmt.currency(res.expenses);
    const formattedFund = fmt.currency(res.recommendedFund);
    document.getElementById('summary-text-sentence').innerHTML = 
      `Con un gasto mensual de <strong>${formattedExpenses}</strong>, un fondo de emergencia recomendado sería de <strong>${formattedFund}</strong>.`;

    // Barra de progreso
    const progressBar = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text-val');
    if (progressBar && progressText) {
      progressBar.style.width = res.progressPercent.toFixed(1) + '%';
      progressText.textContent = res.progressPercent.toFixed(0) + '%';
    }
  }

  function bindEvents() {
    // Gastos
    const expensesInput = document.getElementById('calc-expenses');
    if (expensesInput) {
      expensesInput.addEventListener('input', (e) => {
        state.expenses = parseFloat(e.target.value) || 0;
        calculate();
      });
    }

    // Tipo de Empleo
    const jobInput = document.getElementById('calc-job');
    if (jobInput) {
      jobInput.addEventListener('change', (e) => {
        state.jobType = e.target.value;
        calculate();
      });
    }

    // Dependientes
    const depsYes = document.getElementById('calc-deps-yes');
    const depsNo = document.getElementById('calc-deps-no');
    if (depsYes && depsNo) {
      const handler = () => {
        state.dependents = depsYes.checked;
        calculate();
      };
      depsYes.addEventListener('change', handler);
      depsNo.addEventListener('change', handler);
    }

    // Otras fuentes
    const incYes = document.getElementById('calc-inc-yes');
    const incNo = document.getElementById('calc-inc-no');
    if (incYes && incNo) {
      const handler = () => {
        state.otherIncome = incYes.checked;
        calculate();
      };
      incYes.addEventListener('change', handler);
      incNo.addEventListener('change', handler);
    }

    // Ahorro actual
    const currentInput = document.getElementById('calc-current-savings');
    if (currentInput) {
      currentInput.addEventListener('input', (e) => {
        state.currentSavings = parseFloat(e.target.value) || 0;
        calculate();
      });
    }

    const currencySel = document.getElementById('currency-selector');
    if (currencySel) {
      currencySel.addEventListener('change', (e) => {
        applyCurrency(e.target.value);
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

  let saveDebounce = null;
  function saveToProfileDebounced(recommendedFund) {
    if (saveDebounce) clearTimeout(saveDebounce);
    saveDebounce = setTimeout(() => {
      if (window.MidinariProfile) {
        window.MidinariProfile.updateProfile({
          gastosMensuales: state.expenses,
          ahorroActual: state.currentSavings,
          fondoEmergenciaObjetivo: recommendedFund
        });
      }
      if (window.MidinariMissions) {
        window.MidinariMissions.registerSimulationEvent('emergency');
      }
    }, 1000);
  }

  function init() {
    // Cargar perfil si existe
    if (window.MidinariProfile) {
      const profile = window.MidinariProfile.getProfile();
      if (profile.gastosMensuales > 0) state.expenses = profile.gastosMensuales;
      if (profile.ahorroActual > 0) state.currentSavings = profile.ahorroActual;

      const expensesInput = document.getElementById('calc-expenses');
      const currentInput = document.getElementById('calc-current-savings');
      if (expensesInput) expensesInput.value = state.expenses;
      if (currentInput) currentInput.value = state.currentSavings;
    }

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
    // Obtener recomendación actual
    let baseMonths = 4;
    if (state.jobType === 'very_stable') baseMonths = 3;
    else if (state.jobType === 'stable') baseMonths = 4;
    else if (state.jobType === 'freelance') baseMonths = 6;
    else if (state.jobType === 'business') baseMonths = 8;
    let extraMonths = 0;
    if (state.dependents) extraMonths += 1;
    if (!state.otherIncome) extraMonths += 1;
    const totalMonths = baseMonths + extraMonths;
    const recommendedFund = state.expenses * totalMonths;
    saveToProfileDebounced(recommendedFund);
  };

})();
