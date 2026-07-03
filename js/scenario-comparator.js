/* ============================================================
   MIDINARI — scenario-comparator.js
   Controlador del Comparador de Escenarios Financieros
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'midinari_scenarios';

  const fmt = {
    currency: (val) => {
      const code = localStorage.getItem('dinari_currency') || 'DOP';
      const symbol = {
        MXN: 'MX$', USD: 'US$', EUR: '€', COP: 'COL$',
        ARS: 'AR$', CLP: 'CLP$', PEN: 'S/', DOP: 'RD$'
      }[code] || '$';
      return `${symbol} ${Math.round(val).toLocaleString('es-DO')}`;
    },
    percent: (val) => `${val.toFixed(1)}%`
  };

  let activeProfile = null;
  let scenarios = [];

  function init() {
    activeProfile = window.MidinariProfile.getProfile();
    loadScenarios();
    renderAll();
    setupEventListeners();
  }

  function loadScenarios() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        scenarios = JSON.parse(raw);
      } catch (e) {
        scenarios = [];
      }
    }

    // Si está vacío, crear el "Escenario Base" a partir del perfil actual
    if (scenarios.length === 0) {
      const base = createScenarioFromProfile(activeProfile, 'Escenario Base');
      scenarios.push(base);
      saveScenariosToStorage();
    }
  }

  function createScenarioFromProfile(profile, name) {
    const s = {
      id: 'sc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      nombre: name,
      fechaCreacion: new Date().toISOString(),
      ingresos: profile.ingresosMensuales || 0,
      gastos: profile.gastosMensuales || 0,
      ahorroMensual: profile.ahorroMensual || 0,
      deudaTotal: profile.deudaTotal || 0,
      pagoMensualDeuda: profile.pagoMensualDeuda || 0,
      interesPromedio: profile.interesPromedio || 0,
      fondoEmergencia: profile.ahorroActual || 0,
      isActive: true // El primer escenario base es el activo
    };

    calculateScenarioMetrics(s);
    return s;
  }

  function calculateScenarioMetrics(s) {
    // 1. Calcular Financial Score usando el asesor existente
    if (window.MidinariAdvisor) {
      const mockProfile = {
        ingresosMensuales: s.ingresos,
        gastosMensuales: s.gastos,
        ahorroMensual: s.ahorroMensual,
        ahorroActual: s.fondoEmergencia,
        fondoEmergenciaObjetivo: s.gastos * 6, // Meta estándar de 6 meses
        deudaTotal: s.deudaTotal,
        pagoMensualDeuda: s.pagoMensualDeuda,
        interesPromedio: s.interesPromedio
      };
      s.score = window.MidinariAdvisor.computeFinancialScore(mockProfile);
    } else {
      s.score = 50;
    }

    // 2. Simulación de liquidación de deudas
    const payoff = simulateDebtPayoff(s.deudaTotal, s.interesPromedio, s.pagoMensualDeuda);
    s.mesesLiquidar = payoff.months;
    s.interesesTotales = payoff.interestPaid;
  }

  function simulateDebtPayoff(totalDebt, annualRate, monthlyPayment) {
    if (totalDebt <= 0) return { months: 0, interestPaid: 0 };
    if (monthlyPayment <= 0) return { months: 999, interestPaid: 999 };

    let balance = totalDebt;
    const monthlyRate = (annualRate / 100) / 12;
    let months = 0;
    let interestPaid = 0;
    const maxMonths = 360; // Límite de 30 años

    while (balance > 0.01 && months < maxMonths) {
      months++;
      const interest = balance * monthlyRate;
      interestPaid += interest;
      balance += interest;

      if (monthlyPayment <= interest) {
        return { months: 999, interestPaid: 999 }; // Deuda eterna
      }

      const applied = Math.min(monthlyPayment, balance);
      balance -= applied;
    }

    return {
      months: months,
      interestPaid: interestPaid
    };
  }

  function saveScenariosToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  }

  function renderAll() {
    renderTable();
    renderCharts();
  }

  function renderTable() {
    const headerRow = document.getElementById('matrix-header-row');
    const tbody = document.getElementById('matrix-body');
    if (!headerRow || !tbody) return;

    // Resetear
    headerRow.innerHTML = '<th>Métrica / Escenario</th>';
    tbody.innerHTML = '';

    // Encontrar los ganadores de cada categoría para aplicar destaques
    const winners = findWinners();

    // 1. Renderizar cabecera de la tabla
    scenarios.forEach(s => {
      const th = document.createElement('th');
      th.innerHTML = `
        <div class="header-scenario-wrap">
          <div style="font-weight:700; font-size:15px; display:flex; align-items:center; gap:6px;">
            ${s.nombre}
            ${s.isActive ? '<span class="badge badge--sage" style="font-size:9px; padding:2px 6px;">Activo</span>' : ''}
          </div>
          <div class="header-actions">
            ${!s.isActive ? `<button class="btn btn--sage btn--xs btn-activate" data-id="${s.id}">Activar</button>` : ''}
            <button class="btn btn--outline btn--xs btn-duplicate" data-id="${s.id}">Duplicar</button>
            <button class="btn btn--outline btn--xs btn-rename" data-id="${s.id}">Renombrar</button>
            ${scenarios.length > 1 ? `<button class="btn btn--outline btn-delete" data-id="${s.id}" style="border-color:var(--danger); color:var(--danger); padding: 2px 6px; font-size:10px;">Eliminar</button>` : ''}
          </div>
        </div>
      `;
      headerRow.appendChild(th);
    });

    // 2. Definir filas y datos
    const rows = [
      { label: 'Ingresos Mensuales', key: 'ingresos', isCurrency: true },
      { label: 'Gastos Mensuales', key: 'gastos', isCurrency: true },
      { label: 'Capacidad de Ahorro', fn: (s) => s.ingresos - s.gastos, isCurrency: true },
      { label: 'Ahorro Mensual Real', key: 'ahorroMensual', isCurrency: true, winnerKey: 'maxSavings' },
      { label: 'Deuda Total', key: 'deudaTotal', isCurrency: true },
      { label: 'Pago Mensual Deuda', key: 'pagoMensualDeuda', isCurrency: true },
      { label: 'Tasa de Interés Promedio', key: 'interesPromedio', isPercent: true },
      { label: 'Fondo de Emergencia', key: 'fondoEmergencia', isCurrency: true },
      { label: 'Financial Score', key: 'score', isNumber: true, winnerKey: 'maxScore' },
      { label: 'Tiempo de Liquidación', fn: (s) => s.mesesLiquidar === 999 ? 'Eterno (Pago mínimo insuficiente)' : (s.mesesLiquidar === 0 ? 'Sin Deudas' : `${s.mesesLiquidar} meses`), winnerKey: 'minTime' },
      { label: 'Intereses Totales a Pagar', fn: (s) => s.interesesTotales === 999 ? 'Eterno' : (s.interesesTotales === 0 ? 'Sin Intereses' : fmt.currency(s.interesesTotales)), winnerKey: 'minInterest' }
    ];

    rows.forEach(row => {
      const tr = document.createElement('tr');
      
      // Primera columna
      const labelTd = document.createElement('td');
      labelTd.style.fontWeight = '600';
      labelTd.textContent = row.label;
      tr.appendChild(labelTd);

      // Columnas por cada escenario
      scenarios.forEach(s => {
        const td = document.createElement('td');
        
        // Obtener valor
        let val;
        if (row.fn) {
          val = row.fn(s);
        } else {
          val = s[row.key];
        }

        // Formato
        let displayVal = val;
        if (row.isCurrency) displayVal = fmt.currency(val);
        else if (row.isPercent) displayVal = fmt.percent(val);

        td.textContent = displayVal;

        // Comprobar destaque ganador
        if (row.winnerKey && winners[row.winnerKey] && winners[row.winnerKey].id === s.id) {
          td.className = 'cell-highlight';
          td.innerHTML += ` <span class="highlight-badge badge-winner">Mejor</span>`;
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  function findWinners() {
    const res = {
      minTime: null,
      minInterest: null,
      maxScore: null,
      maxSavings: null
    };

    if (scenarios.length < 2) return res;

    // 1. Menor Tiempo (excluyendo sin deudas o eterno)
    const validTime = scenarios.filter(s => s.mesesLiquidar > 0 && s.mesesLiquidar < 999);
    if (validTime.length > 0) {
      res.minTime = validTime.reduce((best, curr) => curr.mesesLiquidar < best.mesesLiquidar ? curr : best, validTime[0]);
    }

    // 2. Menor Interés (excluyendo sin deudas o eterno)
    const validInterest = scenarios.filter(s => s.interesesTotales > 0 && s.interesesTotales < 999);
    if (validInterest.length > 0) {
      res.minInterest = validInterest.reduce((best, curr) => curr.interesesTotales < best.interesesTotales ? curr : best, validInterest[0]);
    }

    // 3. Mayor Score
    res.maxScore = scenarios.reduce((best, curr) => curr.score > best.score ? curr : best, scenarios[0]);

    // 4. Mayor Ahorro Real
    res.maxSavings = scenarios.reduce((best, curr) => curr.ahorroMensual > best.ahorroMensual ? curr : best, scenarios[0]);

    return res;
  }

  function renderCharts() {
    const containerMonths = document.getElementById('chart-months');
    const containerInterest = document.getElementById('chart-interest');
    if (!containerMonths || !containerInterest) return;

    containerMonths.innerHTML = '';
    containerInterest.innerHTML = '';

    // Obtener valores máximos para calcular proporciones de barras
    const maxMonths = Math.max(...scenarios.map(s => s.mesesLiquidar === 999 ? 120 : s.mesesLiquidar), 12);
    const maxInterest = Math.max(...scenarios.map(s => s.interesesTotales === 999 ? 50000 : s.interesesTotales), 1000);

    scenarios.forEach(s => {
      // 1. Barra de meses
      let monthValText = `${s.mesesLiquidar} meses`;
      let barPercentMonths = 0;
      if (s.mesesLiquidar === 999) {
        monthValText = 'Eterno';
        barPercentMonths = 100;
      } else if (s.mesesLiquidar === 0) {
        monthValText = 'Sin Deudas';
        barPercentMonths = 0;
      } else {
        barPercentMonths = (s.mesesLiquidar / maxMonths) * 100;
      }

      const rowMonth = document.createElement('div');
      rowMonth.className = 'chart-bar-row';
      rowMonth.innerHTML = `
        <div class="chart-bar-label" title="${s.nombre}">${s.nombre}</div>
        <div class="chart-bar-outer">
          <div class="chart-bar-inner" style="width: ${barPercentMonths}%; background: ${s.isActive ? 'var(--sage-600)' : 'var(--cream-400)'}"></div>
        </div>
        <div class="chart-bar-value">${monthValText}</div>
      `;
      containerMonths.appendChild(rowMonth);

      // 2. Barra de interés
      let interestValText = fmt.currency(s.interesesTotales);
      let barPercentInterest = 0;
      if (s.interesesTotales === 999) {
        interestValText = 'Eterno';
        barPercentInterest = 100;
      } else if (s.interesesTotales === 0) {
        interestValText = 'Sin Deudas';
        barPercentInterest = 0;
      } else {
        barPercentInterest = (s.interesesTotales / maxInterest) * 100;
      }

      const rowInterest = document.createElement('div');
      rowInterest.className = 'chart-bar-row';
      rowInterest.innerHTML = `
        <div class="chart-bar-label" title="${s.nombre}">${s.nombre}</div>
        <div class="chart-bar-outer">
          <div class="chart-bar-inner" style="width: ${barPercentInterest}%; background: ${s.isActive ? 'var(--sage-600)' : 'var(--cream-400)'}"></div>
        </div>
        <div class="chart-bar-value">${interestValText}</div>
      `;
      containerInterest.appendChild(rowInterest);
    });
  }

  function setupEventListeners() {
    // Abrir Modal
    const btnCreate = document.getElementById('btn-create-scenario');
    const modal = document.getElementById('scenario-modal');
    if (btnCreate && modal) {
      btnCreate.addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Crear Nuevo Escenario';
        document.getElementById('modal-scenario-id').value = '';
        document.getElementById('scenario-form').reset();
        
        // Autorellenar con el perfil actual como base recomendada
        document.getElementById('sc-income').value = activeProfile.ingresosMensuales || '';
        document.getElementById('sc-expenses').value = activeProfile.gastosMensuales || '';
        document.getElementById('sc-savings').value = activeProfile.ahorroMensual || '';
        document.getElementById('sc-emergency').value = activeProfile.ahorroActual || '';
        document.getElementById('sc-debt').value = activeProfile.deudaTotal || '';
        document.getElementById('sc-debt-pay').value = activeProfile.pagoMensualDeuda || '';
        document.getElementById('sc-rate').value = activeProfile.interesPromedio || '';

        modal.classList.add('open');
      });
    }

    // Cerrar Modal
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel-modal');
    if (btnClose && modal) btnClose.addEventListener('click', () => modal.classList.remove('open'));
    if (btnCancel && modal) btnCancel.addEventListener('click', () => modal.classList.remove('open'));

    // Guardar Formulario Escenario
    const form = document.getElementById('scenario-form');
    if (form && modal) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('modal-scenario-id').value;
        const name = document.getElementById('sc-name').value.trim();

        const data = {
          ingresos: parseFloat(document.getElementById('sc-income').value) || 0,
          gastos: parseFloat(document.getElementById('sc-expenses').value) || 0,
          ahorroMensual: parseFloat(document.getElementById('sc-savings').value) || 0,
          fondoEmergencia: parseFloat(document.getElementById('sc-emergency').value) || 0,
          deudaTotal: parseFloat(document.getElementById('sc-debt').value) || 0,
          pagoMensualDeuda: parseFloat(document.getElementById('sc-debt-pay').value) || 0,
          interesPromedio: parseFloat(document.getElementById('sc-rate').value) || 0
        };

        if (id) {
          // Editar existente
          const s = scenarios.find(item => item.id === id);
          if (s) {
            s.nombre = name;
            Object.assign(s, data);
            calculateScenarioMetrics(s);
          }
        } else {
          // Crear nuevo
          const s = {
            id: 'sc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            nombre: name,
            fechaCreacion: new Date().toISOString(),
            isActive: false,
            ...data
          };
          calculateScenarioMetrics(s);
          scenarios.push(s);
        }

        saveScenariosToStorage();
        modal.classList.remove('open');
        renderAll();
      });
    }

    // Delegación de eventos para la tabla comparativa (Activar, Duplicar, Renombrar, Eliminar)
    const table = document.getElementById('matrix-table');
    if (table) {
      table.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.dataset.id;
        if (!id) return;

        if (target.classList.contains('btn-activate')) {
          // Establecer escenario como activo en LocalStorage y aplicarlo al perfil de Midinari
          scenarios.forEach(s => s.isActive = (s.id === id));
          saveScenariosToStorage();

          const active = scenarios.find(s => s.id === id);
          if (active) {
            // Sobrescribir el perfil financiero principal midinariProfile
            const newProfile = {
              ...activeProfile,
              ingresosMensuales: active.ingresos,
              gastosMensuales: active.gastos,
              ahorroMensual: active.ahorroMensual,
              ahorroActual: active.fondoEmergencia,
              deudaTotal: active.deudaTotal,
              pagoMensualDeuda: active.pagoMensualDeuda,
              interesPromedio: active.interesPromedio
            };
            window.MidinariProfile.saveProfile(newProfile);
            activeProfile = newProfile;
          }
          renderAll();
          
          // Mostrar notificación discreta
          showToast('Escenario establecido como Perfil Financiero Activo');

        } else if (target.classList.contains('btn-duplicate')) {
          const original = scenarios.find(s => s.id === id);
          if (original) {
            const clone = {
              ...original,
              id: 'sc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              nombre: original.nombre + ' (Copia)',
              fechaCreacion: new Date().toISOString(),
              isActive: false
            };
            scenarios.push(clone);
            saveScenariosToStorage();
            renderAll();
          }

        } else if (target.classList.contains('btn-rename')) {
          const s = scenarios.find(s => s.id === id);
          if (s) {
            const newName = prompt('Ingresa el nuevo nombre para este escenario:', s.nombre);
            if (newName && newName.trim()) {
              s.nombre = newName.trim();
              saveScenariosToStorage();
              renderAll();
            }
          }

        } else if (target.classList.contains('btn-delete')) {
          if (confirm('¿Estás seguro de que deseas eliminar este escenario?')) {
            const idx = scenarios.findIndex(s => s.id === id);
            if (idx !== -1) {
              const deleted = scenarios[idx];
              scenarios.splice(idx, 1);

              // Si borramos el activo, activar el primero de la lista restante
              if (deleted.isActive && scenarios.length > 0) {
                scenarios[0].isActive = true;
                
                const newProfile = {
                  ...activeProfile,
                  ingresosMensuales: scenarios[0].ingresos,
                  gastosMensuales: scenarios[0].gastos,
                  ahorroMensual: scenarios[0].ahorroMensual,
                  ahorroActual: scenarios[0].fondoEmergencia,
                  deudaTotal: scenarios[0].deudaTotal,
                  pagoMensualDeuda: scenarios[0].pagoMensualDeuda,
                  interesPromedio: scenarios[0].interesPromedio
                };
                window.MidinariProfile.saveProfile(newProfile);
                activeProfile = newProfile;
              }

              saveScenariosToStorage();
              renderAll();
            }
          }
        }
      });
    }
  }

  function showToast(msg) {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.bottom = '20px';
    div.style.right = '20px';
    div.style.background = 'var(--sage-700)';
    div.style.color = '#fff';
    div.style.padding = '12px 24px';
    div.style.borderRadius = 'var(--radius-md)';
    div.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
    div.style.fontSize = '12px';
    div.style.fontWeight = '700';
    div.style.zIndex = '2000';
    div.style.transition = 'all 0.3s ease';
    div.textContent = msg;

    document.body.appendChild(div);
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transform = 'translateY(10px)';
      setTimeout(() => div.remove(), 300);
    }, 2500);
  }

  // Polling para esperar carga completa de scripts del Core
  const checkInterval = setInterval(() => {
    if (window.MidinariProfile && window.MidinariAdvisor) {
      clearInterval(checkInterval);
      init();
    }
  }, 50);

})();
