/* ============================================================
   DINARI — profile-center.js
   Centro Financiero & Score Inteligente
   ============================================================ */

(function () {
  'use strict';

  let activeCurrency = 'MXN';
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
    currency: (n) => {
      const info = CURRENCIES[activeCurrency] || CURRENCIES.MXN;
      return new Intl.NumberFormat(info.locale, {
        style: 'currency', currency: info.code,
        minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(n);
    },
    percent: (n) => `${n.toFixed(1)}%`
  };

  function getActiveSymbol() {
    const info = CURRENCIES[activeCurrency] || CURRENCIES.MXN;
    try {
      const parts = new Intl.NumberFormat(info.locale, { style: 'currency', currency: info.code }).formatToParts(0);
      const symbolPart = parts.find(p => p.type === 'currency');
      return symbolPart ? symbolPart.value : '$';
    } catch (e) {
      return '$';
    }
  }

  function detectInitialCurrency() {
    const saved = localStorage.getItem('dinari_currency');
    if (saved && CURRENCIES[saved]) return saved;

    try {
      const locale = navigator.language || Intl.DateTimeFormat().resolvedOptions().locale;
      const mapping = {
        'es-DO': 'DOP', 'es-MX': 'MXN', 'es-CO': 'COP', 'es-AR': 'ARS',
        'es-CL': 'CLP', 'es-PE': 'PEN', 'es-ES': 'EUR', 'en-US': 'USD'
      };
      if (mapping[locale]) return mapping[locale];
      if (locale.startsWith('es')) return 'MXN';
      return 'USD';
    } catch (e) {
      return 'MXN';
    }
  }

  function applyCurrency(code) {
    if (!CURRENCIES[code]) return;
    activeCurrency = code;
    localStorage.setItem('dinari_currency', code);
    
    const selector = document.getElementById('currency-selector');
    if (selector) selector.value = code;

    const symbol = getActiveSymbol();
    document.querySelectorAll('.currency-symbol').forEach(el => {
      el.textContent = symbol;
    });

    renderProfile();
  }

  function renderProfile() {
    if (!window.MidinariProfile) return;
    const profile = window.MidinariProfile.getProfile();

    // Actualizar Tarjetas
    document.getElementById('card-income').textContent = fmt.currency(profile.ingresosMensuales);
    document.getElementById('card-expenses').textContent = fmt.currency(profile.gastosMensuales);
    document.getElementById('card-savings-monthly').textContent = fmt.currency(profile.ahorroMensual);
    document.getElementById('card-savings-actual').textContent = fmt.currency(profile.ahorroActual);
    document.getElementById('card-emergency-target').textContent = fmt.currency(profile.fondoEmergenciaObjetivo);
    document.getElementById('card-debt-total').textContent = fmt.currency(profile.deudaTotal);
    document.getElementById('card-debt-payment').textContent = fmt.currency(profile.pagoMensualDeuda);
    document.getElementById('card-debt-rate').textContent = fmt.percent(profile.interesPromedio);

    // Barra de Progreso del Fondo
    const fundProgress = profile.fondoEmergenciaObjetivo > 0 
      ? Math.min(100, Math.round((profile.ahorroActual / profile.fondoEmergenciaObjetivo) * 100))
      : 0;
    
    document.getElementById('progress-percent').textContent = `${fundProgress}%`;
    document.getElementById('progress-fill').style.width = `${fundProgress}%`;
    document.getElementById('progress-saved').textContent = `${fmt.currency(profile.ahorroActual)} ahorrados`;
    document.getElementById('progress-target').textContent = `Objetivo: ${fmt.currency(profile.fondoEmergenciaObjetivo)}`;

    // Rellenar Inputs si están vacíos o al renderizar inicialmente
    document.getElementById('inp-income').value = profile.ingresosMensuales || '';
    document.getElementById('inp-expenses').value = profile.gastosMensuales || '';
    document.getElementById('inp-savings-monthly').value = profile.ahorroMensual || '';
    document.getElementById('inp-savings-actual').value = profile.ahorroActual || '';
    document.getElementById('inp-emergency-target').value = profile.fondoEmergenciaObjetivo || '';
    document.getElementById('inp-debt-total').value = profile.deudaTotal || '';
    document.getElementById('inp-debt-payment').value = profile.pagoMensualDeuda || '';
    document.getElementById('inp-debt-rate').value = profile.interesPromedio || '';

    // Mostrar última actualización
    if (profile.fechaActualizacion) {
      document.getElementById('lbl-last-update').textContent = new Date(profile.fechaActualizacion).toLocaleString();
    } else {
      document.getElementById('lbl-last-update').textContent = 'Nunca';
    }

    calculateScore(profile);
  }

  function calculateScore(profile) {
    // 1. Fondo de emergencia (Weight: 30%)
    let scoreEmergency = 100;
    if (profile.fondoEmergenciaObjetivo > 0) {
      scoreEmergency = Math.min(100, (profile.ahorroActual / profile.fondoEmergenciaObjetivo) * 100);
    } else if (profile.ahorroActual === 0) {
      scoreEmergency = 0;
    }

    // 2. Capacidad de ahorro (Weight: 30%)
    let scoreSavings = 0;
    if (profile.ingresosMensuales > 0) {
      const rate = profile.ahorroMensual / profile.ingresosMensuales;
      scoreSavings = Math.min(100, (rate / 0.20) * 100); // 20% es el objetivo ideal
    }

    // 3. Relación deuda/ingresos anual (Weight: 20%)
    let scoreDebtRatio = 100;
    if (profile.deudaTotal > 0) {
      if (profile.ingresosMensuales <= 0) {
        scoreDebtRatio = 0;
      } else {
        const ratio = profile.deudaTotal / (profile.ingresosMensuales * 12);
        if (ratio <= 0.5) scoreDebtRatio = 100;
        else if (ratio >= 2.0) scoreDebtRatio = 0;
        else scoreDebtRatio = 100 - ((ratio - 0.5) / 1.5) * 100;
      }
    }

    // 4. Carga de deudas mensual (Weight: 20%)
    let scoreDebtService = 100;
    if (profile.pagoMensualDeuda > 0) {
      if (profile.ingresosMensuales <= 0) {
        scoreDebtService = 0;
      } else {
        const ratio = profile.pagoMensualDeuda / profile.ingresosMensuales;
        if (ratio <= 0.10) scoreDebtService = 100;
        else if (ratio >= 0.50) scoreDebtService = 0;
        else scoreDebtService = 100 - ((ratio - 0.10) / 0.40) * 100;
      }
    }

    const finalScore = Math.round(
      (scoreEmergency * 0.3) + 
      (scoreSavings * 0.3) + 
      (scoreDebtRatio * 0.2) + 
      (scoreDebtService * 0.2)
    );

    // Actualizar anillo
    const circle = document.getElementById('score-ring');
    if (circle) {
      const circumference = 440; // 2 * pi * r
      const offset = circumference - (circumference * finalScore / 100);
      circle.style.strokeDashoffset = offset;
      
      // Colorear anillo
      if (finalScore < 40) circle.style.stroke = 'var(--danger)';
      else if (finalScore < 60) circle.style.stroke = 'var(--warning)';
      else if (finalScore < 80) circle.style.stroke = '#7A9E7E';
      else circle.style.stroke = 'var(--success)';
    }

    document.getElementById('score-val').textContent = finalScore;

    // Clasificación y textos
    const badge = document.getElementById('score-badge');
    const textEl = document.getElementById('score-text');
    const tipEl = document.getElementById('score-tip');

    badge.className = 'score-label';

    if (finalScore < 40) {
      badge.textContent = 'Crítico';
      badge.classList.add('score-label--critico');
      textEl.textContent = 'Tu salud financiera está en una situación de alta vulnerabilidad. Es prioritario reducir gastos fijos, suspender nuevas deudas y crear un mini-fondo de emergencias.';
    } else if (finalScore < 60) {
      badge.textContent = 'Riesgo';
      badge.classList.add('score-label--riesgo');
      textEl.textContent = 'Tienes debilidades financieras importantes. Tus deudas consumen demasiado presupuesto o tu nivel de ahorros es insuficiente para contingencias.';
    } else if (finalScore < 80) {
      badge.textContent = 'Bueno';
      badge.classList.add('score-label--bueno');
      textEl.textContent = 'Estás en una posición relativamente sólida. Tienes capacidad de ahorro y deudas controladas. Enfócate en maximizar tu fondo y liquidar deudas de forma proactiva.';
    } else {
      badge.textContent = 'Excelente';
      badge.classList.add('score-label--excelente');
      textEl.textContent = '¡Felicidades! Mantienes una disciplina financiera sobresaliente. Deudas mínimas, excelente nivel de fondo de emergencias y alta tasa de ahorro.';
    }

    // Determinar el consejo prioritario en base al menor score individual
    const scores = [
      { name: 'emergencia', val: scoreEmergency, tip: 'Enfócate en construir tu Fondo de Emergencia. Intenta guardar al menos el equivalente a 3 meses de gastos.' },
      { name: 'ahorro', val: scoreSavings, tip: 'Incrementa tu capacidad de ahorro mensual. Revisa tus gastos y automatiza un aporte de al menos 10-20% de tu sueldo.' },
      { name: 'deudaRatio', val: scoreDebtRatio, tip: 'Tu deuda total es muy elevada en comparación con tus ingresos anuales. Prioriza liquidar préstamos usando el simulador de deudas.' },
      { name: 'deudaServicio', val: scoreDebtService, tip: 'Tus pagos de deuda mensuales absorben gran parte de tus ingresos. Usa el método bola de nieve o avalancha para liberar flujo de caja rápido.' }
    ];

    scores.sort((a, b) => a.val - b.val);
    tipEl.textContent = scores[0].tip;
  }

  function init() {
    const cur = detectInitialCurrency();
    applyCurrency(cur);

    // Listener del selector
    const selector = document.getElementById('currency-selector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        applyCurrency(e.target.value);
      });
    }

    // Submit de cambios
    const form = document.getElementById('profile-edit-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!window.MidinariProfile) return;

        const income = parseFloat(document.getElementById('inp-income').value) || 0;
        const expenses = parseFloat(document.getElementById('inp-expenses').value) || 0;
        const savingsMonthly = parseFloat(document.getElementById('inp-savings-monthly').value) || 0;
        const savingsActual = parseFloat(document.getElementById('inp-savings-actual').value) || 0;
        const emergencyTarget = parseFloat(document.getElementById('inp-emergency-target').value) || 0;
        const debtTotal = parseFloat(document.getElementById('inp-debt-total').value) || 0;
        const debtPayment = parseFloat(document.getElementById('inp-debt-payment').value) || 0;
        const debtRate = parseFloat(document.getElementById('inp-debt-rate').value) || 0;

        window.MidinariProfile.updateProfile({
          ingresosMensuales: income,
          gastosMensuales: expenses,
          ahorroMensual: savingsMonthly,
          ahorroActual: savingsActual,
          fondoEmergenciaObjetivo: emergencyTarget,
          deudaTotal: debtTotal,
          pagoMensualDeuda: debtPayment,
          interesPromedio: debtRate
        });

        renderProfile();
      });
    }

    // Resetear perfil
    const btnReset = document.getElementById('btn-reset-profile');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas reiniciar tu perfil financiero? Se borrarán todos los datos unificados.')) {
          if (window.MidinariProfile) {
            window.MidinariProfile.resetProfile();
            renderProfile();
          }
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
