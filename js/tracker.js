/* ============================================================
   DINARI — tracker.js
   MVP Control de Gastos (LocalStorage)
   ============================================================ */

(function () {
  'use strict';

  const state = {
    income: 0,
    expenses: [],
    currencyInfo: { code: 'MXN', locale: 'es-MX' },
    chart: null,
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

  const CATEGORY_COLORS = {
    'Vivienda': '#5C8060',
    'Comida': '#D4A373',
    'Transporte': '#8C9A9E',
    'Servicios': '#B3A99E',
    'Deudas': '#D96C6C',
    'Ocio': '#E9D8A6',
    'Otros': '#635A52'
  };

  const fmt = {
    currency: (n) =>
      new Intl.NumberFormat(state.currencyInfo.locale, {
        style: 'currency', currency: state.currencyInfo.code,
        minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(n)
  };

  // ══════════════════════════════════════════
  // PERSISTENCIA Y MONEDA
  // ══════════════════════════════════════════
  function loadData() {
    state.income = parseFloat(localStorage.getItem('dinari_income')) || 0;
    try {
      state.expenses = JSON.parse(localStorage.getItem('dinari_expenses')) || [];
    } catch(e) { state.expenses = []; }
    
    document.getElementById('income-amount').value = state.income || '';
  }

  function saveData() {
    localStorage.setItem('dinari_income', state.income);
    localStorage.setItem('dinari_expenses', JSON.stringify(state.expenses));
  }

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

    updateUI();
  }

  // ══════════════════════════════════════════
  // UI Y GRÁFICOS
  // ══════════════════════════════════════════
  function updateUI() {
    const totalExpenses = state.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = state.income - totalExpenses;

    document.getElementById('kpi-income').textContent = fmt.currency(state.income);
    document.getElementById('kpi-expenses').textContent = fmt.currency(totalExpenses);
    
    const remEl = document.getElementById('kpi-remaining');
    remEl.textContent = fmt.currency(remaining);
    remEl.style.color = remaining < 0 ? 'var(--danger-600)' : 'var(--sage-700)';

    renderList();
    renderChart();
  }

  function renderList() {
    const listEl = document.getElementById('expense-list');
    listEl.innerHTML = '';

    if (state.expenses.length === 0) {
      listEl.innerHTML = '<p class="body-sm" style="text-align:center;color:var(--stone-400);padding:var(--sp-4);">No has registrado gastos aún.</p>';
      return;
    }

    state.expenses.forEach(exp => {
      const div = document.createElement('div');
      div.className = 'expense-item';
      div.innerHTML = `
        <div>
          <p class="expense-item__name">${exp.name}</p>
          <p class="expense-item__cat" style="color:${CATEGORY_COLORS[exp.category] || '#000'};">${exp.category}</p>
        </div>
        <div style="display:flex; align-items:center; gap:var(--sp-2);">
          <span class="expense-item__amount">${fmt.currency(exp.amount)}</span>
          <button class="expense-item__delete" data-id="${exp.id}" aria-label="Eliminar gasto">&times;</button>
        </div>
      `;
      listEl.appendChild(div);
    });

    // Delete events
    document.querySelectorAll('.expense-item__delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id, 10);
        state.expenses = state.expenses.filter(x => x.id !== id);
        saveData();
        updateUI();
      });
    });
  }

  function renderChart() {
    const canvas = document.getElementById('chart-expenses');
    if (!canvas || !window.Chart) return;

    if (state.chart) state.chart.destroy();

    if (state.expenses.length === 0) {
      // Empty chart placeholder
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#999';
      ctx.textAlign = 'center';
      ctx.fillText('Sin datos para graficar', canvas.width/2, canvas.height/2);
      return;
    }

    // Group by category
    const grouped = {};
    state.expenses.forEach(exp => {
      grouped[exp.category] = (grouped[exp.category] || 0) + exp.amount;
    });

    const labels = Object.keys(grouped);
    const data = Object.values(grouped);
    const bgColors = labels.map(l => CATEGORY_COLORS[l] || '#000');

    state.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderColor: '#FAF8F4',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'right', labels: { font: { family: "'Plus Jakarta Sans'" }, color: '#635A52', usePointStyle: true, boxWidth:8 } },
          tooltip: {
            callbacks: { label: (ctx) => ` ${ctx.label}: ${fmt.currency(ctx.parsed)}` },
            backgroundColor: '#2C2A27', padding: 12
          }
        }
      }
    });
  }

  // ══════════════════════════════════════════
  // EVENTOS E INICIALIZACIÓN
  // ══════════════════════════════════════════
  function bindEvents() {
    const incomeInput = document.getElementById('income-amount');
    incomeInput.addEventListener('input', (e) => {
      state.income = parseFloat(e.target.value) || 0;
      saveData();
      updateUI();
    });

    const form = document.getElementById('expense-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('exp-name').value;
      const cat = document.getElementById('exp-cat').value;
      const amount = parseFloat(document.getElementById('exp-amount').value);

      if (!name || amount <= 0) return;

      state.expenses.push({
        id: Date.now(),
        name,
        category: cat,
        amount
      });

      saveData();
      updateUI();
      form.reset();
      document.getElementById('exp-name').focus();
    });

    const currencySelect = document.getElementById('currency-selector');
    if (currencySelect) {
      currencySelect.addEventListener('change', (e) => applyCurrency(e.target.value));
    }

    const btnClear = document.getElementById('btn-clear-data');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres borrar todos los datos? Esto no se puede deshacer.')) {
          state.income = 0;
          state.expenses = [];
          saveData();
          document.getElementById('income-amount').value = '';
          updateUI();
        }
      });
    }
  }

  function loadChartJS(cb) {
    if (window.Chart) { cb(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = cb;
    document.head.appendChild(script);
  }

  function init() {
    loadData();
    bindEvents();
    
    // Auto-detect currency
    let initialCurrency = localStorage.getItem('dinari_currency') || 'MXN';
    applyCurrency(initialCurrency);

    loadChartJS(() => { updateUI(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
