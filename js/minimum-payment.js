/**
 * DINARI — Simulador de Pago Mínimo
 * Lógica financiera, interactividad y gráficos (Chart.js asíncrono)
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── ELEMENTOS DEL DOM ──
  const inputs = {
    debt: document.getElementById('mp-debt'),
    rateSlider: document.getElementById('mp-rate-slider'),
    rateInput: document.getElementById('mp-rate-input'),
    minPayment: document.getElementById('mp-min-pay'),
    altPayment: document.getElementById('mp-alt-pay'),
    currency: document.getElementById('mp-currency')
  };

  const results = {
    container: document.getElementById('results-container'),
    empty: document.getElementById('results-empty'),
    time: document.getElementById('kpi-time'),
    totalPaid: document.getElementById('kpi-total'),
    interestPaid: document.getElementById('kpi-interest'),
    endDate: document.getElementById('kpi-date'),
    psyInterestVal: document.getElementById('psy-interest-val'),
    psyPrincipalVal: document.getElementById('psy-principal-val'),
    psyBarInterest: document.getElementById('psy-bar-interest'),
    psyBarPrincipal: document.getElementById('psy-bar-principal'),
    altBox: document.getElementById('alt-pay-box'),
    altSaved: document.getElementById('alt-saved'),
    altTime: document.getElementById('alt-time'),
    amortToggle: document.getElementById('amort-toggle'),
    amortBody: document.getElementById('amort-body'),
    amortTbody: document.getElementById('amort-tbody')
  };

  // ── ESTADO Y FORMATO ──
  let currencyCode = 'DOP';
  let chartDoughnut = null;
  let chartLine = null;
  let chartJsLoaded = false;

  const formatters = {
    currency: (val) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(val),
    decimal: (val) => new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(val),
    compact: (val) => new Intl.NumberFormat('es-DO', { notation: 'compact', maximumFractionDigits: 1 }).format(val)
  };

  // ── UTILIDADES ──
  function updateFormatters() {
    currencyCode = inputs.currency.value;
    const locale = currencyCode === 'USD' ? 'en-US' : (currencyCode === 'EUR' ? 'es-ES' : 'es-DO');
    formatters.currency = (val) => new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(val);
    formatters.compact = (val) => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(val);
    // Update currency prefixes in DOM if any
    document.querySelectorAll('.currency-symbol').forEach(el => {
      el.textContent = (currencyCode === 'EUR') ? '€' : '$';
    });
  }

  function parseInput(val) {
    return parseFloat(val) || 0;
  }

  function getMonthsString(totalMonths) {
    if (totalMonths > 1200) return "Nunca (Infinito)"; // Guard contra pagos que no cubren interés
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    let str = "";
    if (y > 0) str += `${y} año${y > 1 ? 's' : ''}`;
    if (y > 0 && m > 0) str += " y ";
    if (m > 0 || y === 0) str += `${m} mes${m > 1 ? 'es' : ''}`;
    return str;
  }

  function getEndDateString(months) {
    if (months > 1200) return "N/A";
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('es-DO', { month: 'short', year: 'numeric' });
  }

  function animateValue(obj, start, end, duration, isCurrency = true) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(ease * (end - start) + start);
      obj.innerHTML = isCurrency ? formatters.currency(current) : current;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // ── MATEMÁTICAS (SIMULACIÓN) ──
  function simulateAmortization(debt, annualRate, fixedPayment) {
    let balance = debt;
    const monthlyRate = (annualRate / 100) / 12;
    let totalInterest = 0;
    let months = 0;
    const history = [balance];
    const tableData = [];

    // Validar si el pago cubre el interés
    const firstMonthInterest = balance * monthlyRate;
    if (fixedPayment <= firstMonthInterest) {
      return { infinite: true, firstMonthInterest };
    }

    while (balance > 0.01 && months < 1200) {
      months++;
      const interest = balance * monthlyRate;
      let principal = fixedPayment - interest;

      if (balance + interest < fixedPayment) {
        principal = balance;
        totalInterest += interest;
        balance = 0;
      } else {
        totalInterest += interest;
        balance -= principal;
      }

      history.push(balance);
      tableData.push({ month: months, payment: principal + interest, interest, principal, balance });
    }

    return { infinite: false, months, totalInterest, history, tableData };
  }

  // ── LOGICA PRINCIPAL ──
  function calculate() {
    const debt = parseInput(inputs.debt.value);
    const rate = parseInput(inputs.rateInput.value);
    const minPay = parseInput(inputs.minPayment.value);
    const altPay = parseInput(inputs.altPayment.value);

    if (debt <= 0 || rate <= 0 || minPay <= 0) {
      results.empty.style.display = 'block';
      results.container.style.display = 'none';
      return;
    }

    results.empty.style.display = 'none';
    results.container.style.display = 'flex';

    const simMin = simulateAmortization(debt, rate, minPay);

    if (simMin.infinite) {
      results.time.innerHTML = "Infinito";
      results.totalPaid.innerHTML = "∞";
      results.interestPaid.innerHTML = "∞";
      results.endDate.innerHTML = "Tu pago mínimo ( " + formatters.currency(minPay) + " ) no cubre ni siquiera los intereses del primer mes (" + formatters.currency(simMin.firstMonthInterest) + "). La deuda crecerá eternamente.";
      results.endDate.style.color = "var(--danger)";
      results.endDate.style.fontSize = "var(--text-sm)";
      
      // Psy section
      results.psyInterestVal.innerHTML = formatters.currency(simMin.firstMonthInterest) + "+";
      results.psyPrincipalVal.innerHTML = formatters.currency(0);
      results.psyBarInterest.style.width = '100%';
      results.psyBarInterest.innerHTML = '100%';
      results.psyBarPrincipal.style.width = '0%';
      results.psyBarPrincipal.innerHTML = '';
      
      results.altBox.style.display = 'none';
      return;
    }

    // Resultados Básicos (Pago Mínimo)
    results.endDate.style.color = "var(--stone-400)";
    results.endDate.style.fontSize = "var(--text-xs)";
    
    results.time.innerHTML = getMonthsString(simMin.months);
    results.endDate.innerHTML = "Fecha estimada: " + getEndDateString(simMin.months);

    // Animaciones
    animateValue(results.totalPaid, 0, debt + simMin.totalInterest, 800);
    animateValue(results.interestPaid, 0, simMin.totalInterest, 800);

    // Sección Psicológica (Basada en el primer mes)
    const firstMonthInterest = debt * ((rate / 100) / 12);
    const firstMonthPrincipal = minPay - firstMonthInterest;
    
    const pctInterest = (firstMonthInterest / minPay) * 100;
    const pctPrincipal = (firstMonthPrincipal / minPay) * 100;

    animateValue(results.psyInterestVal, 0, firstMonthInterest, 600);
    animateValue(results.psyPrincipalVal, 0, firstMonthPrincipal, 600);
    
    results.psyBarInterest.style.width = `${pctInterest}%`;
    results.psyBarInterest.innerHTML = pctInterest > 10 ? `${pctInterest.toFixed(0)}%` : '';
    results.psyBarPrincipal.style.width = `${pctPrincipal}%`;
    results.psyBarPrincipal.innerHTML = pctPrincipal > 10 ? `${pctPrincipal.toFixed(0)}%` : '';

    // Comparativa Alternativa
    if (altPay > minPay) {
      const simAlt = simulateAmortization(debt, rate, altPay);
      if (!simAlt.infinite) {
        results.altBox.style.display = 'block';
        const savedInterest = simMin.totalInterest - simAlt.totalInterest;
        const savedMonths = simMin.months - simAlt.months;
        
        animateValue(results.altSaved, 0, savedInterest, 800);
        results.altTime.innerHTML = getMonthsString(savedMonths);
      } else {
        results.altBox.style.display = 'none';
      }
    } else {
      results.altBox.style.display = 'none';
    }

    // Actualizar Tabla (lazy)
    renderTable(simMin.tableData);

    // Gráficos (Lazy load Chart.js si no está)
    if (!chartJsLoaded) {
      loadChartJs().then(() => {
        chartJsLoaded = true;
        renderCharts(simMin, altPay > minPay ? simulateAmortization(debt, rate, altPay) : null);
      });
    } else {
      renderCharts(simMin, altPay > minPay ? simulateAmortization(debt, rate, altPay) : null);
    }
  }

  function renderTable(data) {
    if (data.length > 360) {
      // Demasiados datos para renderizar en el DOM de forma síncrona
      results.amortTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Mostrando solo los primeros 360 meses (30 años)...</td></tr>`;
      data = data.slice(0, 360);
    } else {
      results.amortTbody.innerHTML = '';
    }

    let html = '';
    data.forEach(row => {
      html += `<tr>
        <td>Mes ${row.month}</td>
        <td>${formatters.currency(row.payment)}</td>
        <td class="td-interest">${formatters.currency(row.interest)}</td>
        <td class="td-principal">${formatters.currency(row.principal)}</td>
        <td>${formatters.currency(row.balance)}</td>
      </tr>`;
    });
    results.amortTbody.innerHTML = html;
  }

  // ── GRÁFICOS (CHART.JS) ──
  function loadChartJs() {
    return new Promise((resolve) => {
      if (window.Chart) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  function renderCharts(simMin, simAlt) {
    // Doughnut (Intereses vs Capital total)
    const ctxDoughnut = document.getElementById('chart-doughnut');
    if (ctxDoughnut) {
      if (chartDoughnut) chartDoughnut.destroy();
      const debt = parseInput(inputs.debt.value);
      chartDoughnut = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
          labels: ['Capital Real', 'Intereses Pagados'],
          datasets: [{
            data: [debt, simMin.totalInterest],
            backgroundColor: ['#16a34a', '#dc2626'],
            borderWidth: 2,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return ' ' + formatters.currency(context.raw);
                }
              }
            }
          }
        }
      });
    }

    // Line (Evolución Deuda)
    const ctxLine = document.getElementById('chart-timeline');
    if (ctxLine) {
      if (chartLine) chartLine.destroy();
      
      const labels = Array.from({length: simMin.months + 1}, (_, i) => i % 12 === 0 ? `Año ${i/12}` : '');
      const datasets = [{
        label: 'Balance con Pago Mínimo',
        data: simMin.history,
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 3,
        pointRadius: 0,
        fill: true,
        tension: 0.1
      }];

      if (simAlt && !simAlt.infinite) {
        // Rellenar array simAlt con 0s si termina antes
        const altData = [...simAlt.history];
        while(altData.length < simMin.history.length) altData.push(0);

        datasets.push({
          label: 'Balance con Pago Alternativo',
          data: altData,
          borderColor: '#16a34a',
          backgroundColor: 'transparent',
          borderWidth: 3,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          tension: 0.1
        });
      }

      chartLine = new Chart(ctxLine, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
            y: { 
              beginAtZero: true,
              ticks: { callback: (value) => formatters.compact(value) }
            }
          },
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return ' ' + context.dataset.label + ': ' + formatters.currency(context.raw);
                }
              }
            }
          }
        }
      });
    }
  }

  // ── EVENT LISTENERS ──
  // Sincronizar slider e input de tasa
  inputs.rateSlider.addEventListener('input', (e) => {
    inputs.rateInput.value = e.target.value;
    calculate();
  });
  inputs.rateInput.addEventListener('input', (e) => {
    inputs.rateSlider.value = e.target.value;
    calculate();
  });

  // Debounce para inputs manuales para no saturar al tipear
  let timeout = null;
  [inputs.debt, inputs.minPayment, inputs.altPayment].forEach(input => {
    input.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(calculate, 300);
    });
  });

  inputs.currency.addEventListener('change', () => {
    updateFormatters();
    calculate();
  });

  // Toggle tabla
  results.amortToggle.addEventListener('click', () => {
    results.amortToggle.classList.toggle('open');
    results.amortBody.classList.toggle('open');
  });

  // Inicialización
  updateFormatters();
  // No llamamos calculate al inicio porque los campos están vacíos
});
