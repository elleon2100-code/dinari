/* ============================================================
   DINARI — simulator.js
   Lógica completa del Simulador Inteligente de Deudas
   Métodos: Bola de Nieve · Avalancha · Amortización
   ============================================================ */

(function () {
  'use strict';

  // ══════════════════════════════════════════
  // ESTADO DE LA APLICACIÓN
  // ══════════════════════════════════════════
  const state = {
    debts: [],
    extraPayment: 0,
    currentMethod: 'avalanche',
    results: null,
    charts: { timeline: null, donut: null },
    currencyInfo: { code: 'MXN', locale: 'es-MX' },
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

  let debtIdCounter = 0;

  // ══════════════════════════════════════════
  // DATOS DE EJEMPLO (pre-cargados para demostración)
  // ══════════════════════════════════════════
  const SAMPLE_DEBTS = [
    { name: 'Tarjeta Visa',      balance: 45000, rate: 48, minPayment: 1200 },
    { name: 'Préstamo personal', balance: 28000, rate: 24, minPayment: 800  },
    { name: 'Tarjeta Departamental', balance: 12000, rate: 60, minPayment: 500 },
  ];

  // ══════════════════════════════════════════
  // UTILIDADES DE FORMATO
  // ══════════════════════════════════════════
  const fmt = {
    currency: (n) =>
      new Intl.NumberFormat(state.currencyInfo.locale, {
        style: 'currency', currency: state.currencyInfo.code,
        minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(n),

    months: (m) => {
      if (m >= 12) {
        const y = Math.floor(m / 12);
        const mo = m % 12;
        return mo > 0 ? `${y} año${y > 1 ? 's' : ''} y ${mo} mes${mo > 1 ? 'es' : ''}` : `${y} año${y > 1 ? 's' : ''}`;
      }
      return `${m} mes${m > 1 ? 'es' : ''}`;
    },

    date: (monthsFromNow) => {
      const d = new Date();
      d.setMonth(d.getMonth() + monthsFromNow);
      return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    },

    pct: (n) => `${n.toFixed(1)}%`,
  };

  // ══════════════════════════════════════════
  // SISTEMA MULTI-MONEDA
  // ══════════════════════════════════════════
  function getActiveSymbol() {
    if (!state.currencyInfo) return '$';
    try {
      const parts = new Intl.NumberFormat(state.currencyInfo.locale, { style: 'currency', currency: state.currencyInfo.code }).formatToParts(0);
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
      // Exact match
      if (mapping[locale]) return mapping[locale];
      
      // Fallbacks
      if (locale.startsWith('es')) return 'MXN';
      return 'USD';
    } catch (e) {
      return 'MXN';
    }
  }

  function applyCurrency(code) {
    if (!CURRENCIES[code]) return;
    state.currencyInfo = CURRENCIES[code];
    localStorage.setItem('dinari_currency', code);
    
    const sel = document.getElementById('currency-selector');
    if (sel) sel.value = code;

    const symbol = getActiveSymbol();
    document.querySelectorAll('.currency-symbol').forEach(el => {
      el.textContent = symbol;
    });

    debouncedRecalculate();
  }

  const currencySelector = document.getElementById('currency-selector');
  if (currencySelector) {
    currencySelector.addEventListener('change', (e) => {
      applyCurrency(e.target.value);
    });
  }

  // ══════════════════════════════════════════
  // MOTOR DE CÁLCULO PRINCIPAL
  // ══════════════════════════════════════════
  function calculatePayoff(debts, extraPayment, method) {
    if (!debts.length) return null;

    // Clonar y ordenar según método
    let list = debts.map(d => ({
      ...d,
      balance: d.balance,
      originalBalance: d.balance,
      paidOff: false,
    }));

    if (method === 'snowball') {
      list.sort((a, b) => a.balance - b.balance);
    } else {
      list.sort((a, b) => b.rate - a.rate);
    }

    // Verificar que los pagos mínimos sean suficientes para cubrir intereses
    // Si no, ajustar automáticamente para que el cálculo converja
    list.forEach(d => {
      const monthlyInterest = d.balance * (d.rate / 100 / 12);
      if (d.minPayment <= monthlyInterest) {
        d.minPayment = Math.ceil(monthlyInterest * 1.05); // 5% más que el interés
      }
    });

    let month = 0;
    let totalInterestPaid = 0;
    let totalMinPayments = list.reduce((s, d) => s + d.minPayment, 0);
    const timeline = [];
    const debtPayoffMonths = {};
    const monthlyInterestLog = []; // para tabla amortización

    // Snapshot inicial
    const snap0 = {};
    list.forEach(d => { snap0[d.id] = d.balance; });
    timeline.push({ month: 0, balances: { ...snap0 }, total: list.reduce((s, d) => s + d.balance, 0), interest: 0, principal: 0 });

    const MAX_MONTHS = 600;

    while (list.some(d => !d.paidOff) && month < MAX_MONTHS) {
      month++;
      let remainingExtra = extraPayment;
      let monthInterest = 0;
      let monthPrincipal = 0;

      // 1. Aplicar intereses y pagos mínimos
      for (const debt of list) {
        if (debt.paidOff) continue;
        const monthlyRate = debt.rate / 100 / 12;
        const interest = debt.balance * monthlyRate;
        monthInterest += interest;
        totalInterestPaid += interest;
        debt.balance += interest;
        const minPay = Math.min(debt.minPayment, debt.balance);
        monthPrincipal += minPay - interest;
        debt.balance -= minPay;
        if (debt.balance <= 0.01) {
          debt.balance = 0;
          debt.paidOff = true;
          if (!debtPayoffMonths[debt.id]) debtPayoffMonths[debt.id] = month;
        }
      }

      // 2. Aplicar pago extra
      for (const debt of list) {
        if (debt.paidOff || remainingExtra <= 0) continue;
        const applied = Math.min(remainingExtra, debt.balance);
        debt.balance -= applied;
        monthPrincipal += applied;
        remainingExtra -= applied;
        if (debt.balance <= 0.01) {
          debt.balance = 0;
          debt.paidOff = true;
          if (!debtPayoffMonths[debt.id]) debtPayoffMonths[debt.id] = month;
        }
        break;
      }

      // 3. Snapshot
      const snap = {};
      list.forEach(d => { snap[d.id] = d.balance; });
      timeline.push({
        month,
        balances: { ...snap },
        total: list.reduce((s, d) => s + Math.max(0, d.balance), 0),
        interest: monthInterest,
        principal: Math.max(0, monthPrincipal),
      });
    }

    const originalTotal = debts.reduce((s, d) => s + d.balance, 0);

    return {
      method,
      months: month,
      hitCap: month >= MAX_MONTHS,
      totalInterestPaid,
      totalPaid: originalTotal + totalInterestPaid,
      originalTotal,
      timeline,
      debtPayoffMonths,
      debtOrder: list.map(d => d.id),
      monthlyCommitment: totalMinPayments + extraPayment,
    };
  }

  // ══════════════════════════════════════════
  // GESTIÓN DE DEUDAS (UI)
  // ══════════════════════════════════════════
  const debtList = document.getElementById('debt-list');

  function createDebtCard(debt) {
    const card = document.createElement('div');
    card.className = 'debt-card';
    card.dataset.id = debt.id;

    card.innerHTML = `
      <div class="debt-card__header">
        <span class="debt-card__number">${state.debts.indexOf(debt) + 1}</span>
        <input
          class="field__input"
          type="text"
          placeholder="Nombre de la deuda"
          value="${debt.name}"
          aria-label="Nombre de la deuda"
          data-field="name"
          style="flex:1; margin: 0 var(--sp-3);"
        />
        <button class="debt-card__remove" data-remove="${debt.id}" aria-label="Eliminar deuda" title="Eliminar">&times;</button>
      </div>
      <div class="debt-card__grid">
        <div class="field debt-card__grid--full">
          <label class="field__label" for="balance-${debt.id}">Saldo actual</label>
          <div class="field__prefix-wrap">
            <span class="field__prefix currency-symbol">${getActiveSymbol()}</span>
            <input
              class="field__input field__input--prefixed"
              type="number"
              id="balance-${debt.id}"
              placeholder="0"
              value="${debt.balance || ''}"
              min="0"
              step="100"
              data-field="balance"
              inputmode="numeric"
            />
          </div>
        </div>
        <div class="field">
          <label class="field__label" for="rate-${debt.id}">Tasa anual</label>
          <div class="slider-wrap">
            <div class="slider-row">
              <input
                type="range"
                class="slider"
                id="rate-${debt.id}"
                min="1"
                max="120"
                step="0.5"
                value="${debt.rate || 24}"
                data-field="rate"
                aria-label="Tasa de interés anual"
              />
              <span class="slider__value" id="rate-val-${debt.id}">${debt.rate || 24}%</span>
            </div>
          </div>
        </div>
        <div class="field">
          <label class="field__label" for="min-${debt.id}">Pago mínimo</label>
          <div class="field__prefix-wrap">
            <span class="field__prefix currency-symbol">${getActiveSymbol()}</span>
            <input
              class="field__input field__input--prefixed"
              type="number"
              id="min-${debt.id}"
              placeholder="0"
              value="${debt.minPayment || ''}"
              min="0"
              step="50"
              data-field="minPayment"
              inputmode="numeric"
            />
          </div>
        </div>
      </div>
    `;

    // Listener del slider de tasa
    const rateSlider = card.querySelector(`#rate-${debt.id}`);
    const rateVal = card.querySelector(`#rate-val-${debt.id}`);
    rateSlider.addEventListener('input', () => {
      rateVal.textContent = rateSlider.value + '%';
      updateDebtField(debt.id, 'rate', parseFloat(rateSlider.value));
      debouncedRecalculate();
    });

    // Listeners genéricos de campos
    card.querySelectorAll('[data-field]').forEach(input => {
      if (input === rateSlider) return;
      input.addEventListener('input', () => {
        const field = input.dataset.field;
        const val = field === 'name' ? input.value : parseFloat(input.value) || 0;
        updateDebtField(debt.id, field, val);
        debouncedRecalculate();
      });
    });

    // Botón eliminar
    card.querySelector('[data-remove]').addEventListener('click', () => {
      removeDebt(debt.id);
    });

    return card;
  }

  function updateDebtField(id, field, value) {
    const debt = state.debts.find(d => d.id === id);
    if (debt) debt[field] = value;
  }

  function addDebt(data = {}) {
    if (state.debts.length >= 8) {
      showToast('Máximo 8 deudas por simulación');
      return;
    }
    const debt = {
      id: ++debtIdCounter,
      name: data.name || '',
      balance: data.balance || 0,
      rate: data.rate || 24,
      minPayment: data.minPayment || 0,
    };
    state.debts.push(debt);
    const card = createDebtCard(debt);
    debtList.appendChild(card);
    renumberCards();
  }

  function removeDebt(id) {
    state.debts = state.debts.filter(d => d.id !== id);
    const card = debtList.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.style.animation = 'none';
      card.style.opacity = '0';
      card.style.transform = 'translateY(-8px)';
      card.style.transition = 'opacity 0.2s, transform 0.2s';
      setTimeout(() => card.remove(), 200);
    }
    renumberCards();
    debouncedRecalculate();
  }

  function renumberCards() {
    debtList.querySelectorAll('.debt-card__number').forEach((num, i) => {
      num.textContent = i + 1;
    });
  }

  // ══════════════════════════════════════════
  // CÁLCULO Y RENDERIZADO DE RESULTADOS
  // ══════════════════════════════════════════
  let recalcTimer = null;
  function debouncedRecalculate() {
    clearTimeout(recalcTimer);
    recalcTimer = setTimeout(recalculate, 400);
  }

  function recalculate() {
    // Requiere al menos saldo > 0. El pago mínimo se ajusta automáticamente si es insuficiente.
    const validDebts = state.debts.filter(d => d.balance > 0);
    if (!validDebts.length) {
      showEmptyState();
      return;
    }
    // Asegurar pago mínimo > 0
    validDebts.forEach(d => { if (!d.minPayment || d.minPayment <= 0) d.minPayment = Math.ceil(d.balance * (d.rate / 100 / 12) * 1.1); });

    const results = calculatePayoff(validDebts, state.extraPayment, state.currentMethod);
    const altMethod = state.currentMethod === 'avalanche' ? 'snowball' : 'avalanche';
    const altResults = calculatePayoff(validDebts, state.extraPayment, altMethod);

    state.results = { primary: results, alt: altResults };
    renderResults(results, altResults, validDebts);
  }

  function renderResults(primary, alt, debts) {
    const container = document.getElementById('results-container');
    if (!container) return;

    container.style.display = 'flex';
    document.getElementById('results-empty')?.style.setProperty('display', 'none');

    // KPIs
    setKPI('kpi-free-date', fmt.date(primary.months), primary.months > 60 ? '⚠️ ' + fmt.months(primary.months) : fmt.months(primary.months));
    setKPI('kpi-total-interest', fmt.currency(primary.totalInterestPaid));
    setKPI('kpi-total-paid', fmt.currency(primary.totalPaid));
    setKPI('kpi-monthly', fmt.currency(primary.monthlyCommitment));

    // Savings comparison
    const saving = Math.abs(primary.totalInterestPaid - alt.totalInterestPaid);
    const monthSaving = Math.abs(primary.months - alt.months);
    const primaryIsBetter = primary.totalInterestPaid <= alt.totalInterestPaid;
    const betterLabel = primaryIsBetter
      ? `El método ${primary.method === 'avalanche' ? 'Avalancha' : 'Bola de Nieve'} te ahorra ${fmt.currency(saving)} y ${monthSaving} mes${monthSaving !== 1 ? 'es' : ''} vs. el otro método`
      : `Considera el método ${alt.method === 'avalanche' ? 'Avalancha' : 'Bola de Nieve'} para ahorrar ${fmt.currency(saving)} adicionales`;

    const savingsEl = document.getElementById('method-savings');
    if (savingsEl) savingsEl.textContent = betterLabel;

    // Orden de pago
    renderDebtOrder(primary, debts);

    // Gráficos
    renderTimelineChart(primary, alt);
    renderDonutChart(debts);

    // Tabla de amortización
    renderAmortTable(primary, debts);

    // Animar KPIs
    animateKPIs();
  }

  function setKPI(id, value, sub) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
    if (sub) {
      const subEl = document.getElementById(id + '-sub');
      if (subEl) subEl.textContent = sub;
    }
  }

  function animateKPIs() {
    document.querySelectorAll('.kpi-card').forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(12px)';
      card.style.transition = `opacity 0.35s ${i * 0.07}s ease, transform 0.35s ${i * 0.07}s ease`;
      requestAnimationFrame(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      });
    });
  }

  function renderDebtOrder(results, debts) {
    const container = document.getElementById('debt-order-list');
    if (!container) return;
    container.innerHTML = '';

    results.debtOrder.forEach((id, idx) => {
      const debt = debts.find(d => d.id === id);
      if (!debt) return;
      const payoffMonth = results.debtPayoffMonths[id];
      const item = document.createElement('div');
      item.className = 'order-item';
      item.innerHTML = `
        <span class="order-item__rank">${idx + 1}</span>
        <span class="order-item__name">${debt.name || 'Deuda ' + (idx + 1)}</span>
        <span class="order-item__meta">${payoffMonth ? fmt.date(payoffMonth) : '—'}</span>
      `;
      container.appendChild(item);
    });
  }

  // ── GRÁFICOS (Chart.js lazy) ──
  function renderTimelineChart(primary, alt) {
    const canvas = document.getElementById('chart-timeline');
    if (!canvas || !window.Chart) return;

    const labels = primary.timeline.map(t =>
      t.month === 0 ? 'Hoy' : t.month % 12 === 0 ? `Año ${t.month / 12}` : null
    ).filter((_, i) => i % 3 === 0 || i === 0 || i === primary.timeline.length - 1);

    // Downsample para performance
    const step = Math.max(1, Math.floor(primary.timeline.length / 48));
    const sampled = primary.timeline.filter((_, i) => i % step === 0 || i === primary.timeline.length - 1);
    const sampledAlt = alt.timeline.filter((_, i) => i % step === 0 || i === alt.timeline.length - 1);
    const maxLen = Math.max(sampled.length, sampledAlt.length);

    const primaryData = sampled.map(t => Math.round(t.total));
    const altData = sampledAlt.map(t => Math.round(t.total));
    const monthLabels = sampled.map(t => t.month === 0 ? 'Hoy' : `Mes ${t.month}`);

    if (state.charts.timeline) {
      state.charts.timeline.destroy();
    }

    state.charts.timeline = new Chart(canvas, {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: primary.method === 'avalanche' ? 'Avalancha' : 'Bola de Nieve',
            data: primaryData,
            borderColor: '#5C8060',
            backgroundColor: 'rgba(92,128,96,0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
          },
          {
            label: alt.method === 'avalanche' ? 'Avalancha' : 'Bola de Nieve',
            data: altData,
            borderColor: '#B3A99E',
            backgroundColor: 'rgba(179,169,158,0.05)',
            borderWidth: 1.5,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { font: { size: 11, family: "'Plus Jakarta Sans'" }, color: '#635A52', usePointStyle: true, pointStyleWidth: 10 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${fmt.currency(ctx.parsed.y)}`,
            },
            backgroundColor: '#2C2A27',
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            padding: 12,
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(227,221,212,0.6)', drawBorder: false },
            ticks: { maxTicksLimit: 8, font: { size: 10 }, color: '#8D8078' },
          },
          y: {
            grid: { color: 'rgba(227,221,212,0.6)', drawBorder: false },
            ticks: {
              font: { size: 10 },
              color: '#8D8078',
              callback: (v) => fmt.currency(v),
              maxTicksLimit: 6,
            },
          },
        },
      },
    });
  }

  function renderDonutChart(debts) {
    const canvas = document.getElementById('chart-donut');
    if (!canvas || !window.Chart) return;

    const COLORS = ['#5C8060', '#7A9E7E', '#A8C5AC', '#B3A99E', '#8D8078', '#635A52', '#C4D9C7', '#E3DDD4'];
    const labels = debts.map(d => d.name || 'Deuda');
    const data = debts.map(d => d.balance);

    if (state.charts.donut) state.charts.donut.destroy();

    state.charts.donut = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: COLORS.slice(0, debts.length),
          borderColor: '#FAF8F4',
          borderWidth: 3,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11, family: "'Plus Jakarta Sans'" }, color: '#635A52', usePointStyle: true, padding: 12 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${fmt.currency(ctx.parsed)}`,
            },
            backgroundColor: '#2C2A27',
            padding: 12,
          },
        },
      },
    });
  }

  function renderAmortTable(results, debts) {
    const tbody = document.getElementById('amort-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const MAX_ROWS = 120;
    const shown = results.timeline.slice(1, MAX_ROWS + 1);

    shown.forEach(snapshot => {
      // Usar los datos de interés/principal ya calculados en el motor
      const interest = snapshot.interest || 0;
      const principal = snapshot.principal || 0;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>Mes ${snapshot.month} <small style="color:var(--stone-400)">(${fmt.date(snapshot.month)})</small></td>
        <td class="td-interest">${fmt.currency(interest)}</td>
        <td class="td-principal">${fmt.currency(principal)}</td>
        <td>${fmt.currency(Math.max(0, snapshot.total))}</td>
      `;
      tbody.appendChild(tr);
    });

    if (results.months > MAX_ROWS) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="4" style="text-align:center;color:var(--stone-400);font-style:italic;">... y ${results.months - MAX_ROWS} meses más hasta la liquidación total.</td>`;
      tbody.appendChild(tr);
    }
  }

  function showEmptyState() {
    document.getElementById('results-container')?.style.setProperty('display', 'none');
    document.getElementById('results-empty')?.style.setProperty('display', 'flex');
  }

  // ══════════════════════════════════════════
  // TOGGLE DE MÉTODOS
  // ══════════════════════════════════════════
  document.querySelectorAll('.method-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.method-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.method-detail').forEach(d => d.classList.remove('active'));
      tab.classList.add('active');
      state.currentMethod = tab.dataset.method;
      document.getElementById(`detail-${tab.dataset.method}`)?.classList.add('active');
      debouncedRecalculate();
    });
  });

  // ══════════════════════════════════════════
  // ACCORDION AMORTIZACIÓN
  // ══════════════════════════════════════════
  const amortToggle = document.getElementById('amort-toggle');
  const amortBody = document.getElementById('amort-body');
  if (amortToggle && amortBody) {
    amortToggle.addEventListener('click', () => {
      const isOpen = amortBody.classList.toggle('open');
      amortToggle.classList.toggle('open', isOpen);
      amortToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // ══════════════════════════════════════════
  // FAQs ACCORDION
  // ══════════════════════════════════════════
  document.querySelectorAll('.faq-item__question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // ══════════════════════════════════════════
  // BOTONES PRINCIPALES
  // ══════════════════════════════════════════
  document.getElementById('add-debt-btn')?.addEventListener('click', () => {
    addDebt();
    // Scroll a la nueva card
    setTimeout(() => {
      const cards = debtList.querySelectorAll('.debt-card');
      cards[cards.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  document.getElementById('calculate-btn')?.addEventListener('click', () => {
    recalculate();
    document.getElementById('results-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Pago extra global
  document.getElementById('extra-payment')?.addEventListener('input', (e) => {
    state.extraPayment = parseFloat(e.target.value) || 0;
    debouncedRecalculate();
  });

  // ══════════════════════════════════════════
  // TOAST NOTIFICATION
  // ══════════════════════════════════════════
  function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      background:var(--charcoal); color:var(--white); padding:12px 20px;
      border-radius:999px; font-size:14px; z-index:9999;
      box-shadow:0 4px 20px rgba(0,0,0,0.25);
      animation: toastIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ══════════════════════════════════════════
  // CARGA DE CHART.JS (LAZY)
  // ══════════════════════════════════════════
  function loadChartJS(callback) {
    if (window.Chart) { callback(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = callback;
    script.onerror = () => console.warn('Dinari: Chart.js no disponible');
    document.head.appendChild(script);
  }

  // ══════════════════════════════════════════
  // INICIALIZACIÓN
  // ══════════════════════════════════════════
  function init() {
    const initialCurrency = detectInitialCurrency();
    applyCurrency(initialCurrency);

    loadChartJS(() => {
      // Precargar datos de ejemplo
      SAMPLE_DEBTS.forEach(d => addDebt(d));
      // Calcular al cargar
      setTimeout(recalculate, 100);
    });
  }

  // Esperar a DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
