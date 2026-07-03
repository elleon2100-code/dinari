/* ============================================================
   MIDINARI — financial-plan.js
   Controlador principal del Plan Financiero Inteligente
   ============================================================ */

(function () {
  'use strict';

  // Formato local dominicano por defecto, heredado de utils o redefinido localmente
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

  function init() {
    activeProfile = window.MidinariProfile.getProfile();
    
    // Configurar sliders según los datos del perfil
    setupSliders();

    // Renderizar Score y Journey
    renderScoreAndJourney();

    // Ejecutar simulación inicial
    calculateSimulation();

    // Event listeners para sliders
    const ids = ['slide-extra-savings', 'slide-reduced-expenses', 'slide-extra-debt-pay', 'slide-refinance-rate'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          updateSliderLabel(id);
          calculateSimulation();
        });
      }
    });
  }

  function setupSliders() {
    // Ahorro mensual adicional: max = ingresos o 3x ahorro actual (mínimo 50,000)
    const slideSavings = document.getElementById('slide-extra-savings');
    if (slideSavings) {
      const maxVal = Math.max(50000, activeProfile.ingresosMensuales);
      slideSavings.max = maxVal;
      slideSavings.value = 0;
      updateSliderLabel('slide-extra-savings');
    }

    // Reducción de gastos: max = gastos mensuales actuales
    const slideExpenses = document.getElementById('slide-reduced-expenses');
    if (slideExpenses) {
      slideExpenses.max = Math.max(30000, activeProfile.gastosMensuales);
      slideExpenses.value = 0;
      updateSliderLabel('slide-reduced-expenses');
    }

    // Pago extra deuda: max = ingresos o 3x pago mensual actual
    const slideDebt = document.getElementById('slide-extra-debt-pay');
    if (slideDebt) {
      const maxVal = Math.max(30000, activeProfile.ingresosMensuales);
      slideDebt.max = maxVal;
      slideDebt.value = 0;
      updateSliderLabel('slide-extra-debt-pay');
    }

    // Refinanciar: de 0% a 15%
    const slideRefinance = document.getElementById('slide-refinance-rate');
    if (slideRefinance) {
      slideRefinance.value = 0;
      updateSliderLabel('slide-refinance-rate');
    }

    // Ocultar sliders innecesarios si no hay deudas
    if (activeProfile.deudaTotal === 0) {
      const debtSliders = ['slide-extra-debt-pay', 'slide-refinance-rate'];
      debtSliders.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const group = el.closest('.sim-slider-group');
          if (group) group.style.display = 'none';
        }
      });
    }
  }

  function updateSliderLabel(id) {
    const el = document.getElementById(id);
    if (!el) return;

    const valElId = id.replace('slide-', 'val-');
    const valEl = document.getElementById(valElId);
    if (!valEl) return;

    const val = parseFloat(el.value);
    if (id === 'slide-refinance-rate') {
      valEl.textContent = `${val}%`;
    } else {
      valEl.textContent = fmt.currency(val);
    }
  }

  function renderScoreAndJourney() {
    const scoreValEl = document.getElementById('plan-score-val');
    const scoreStatusEl = document.getElementById('plan-score-status');

    if (!window.MidinariAdvisor) return;

    const score = window.MidinariAdvisor.computeFinancialScore(activeProfile);
    const diagnosis = window.MidinariAdvisor.getDiagnosis(activeProfile);

    if (scoreValEl) scoreValEl.textContent = score;
    if (scoreStatusEl) {
      scoreStatusEl.textContent = diagnosis.estadoGeneral.toUpperCase();
      scoreStatusEl.className = 'score-label';
      const labelClass = {
        'Excelente': 'score-label--bueno',
        'Bueno': 'score-label--bueno',
        'Riesgo': 'score-label--riesgo',
        'Crítico': 'score-label--critico'
      }[diagnosis.estadoGeneral] || 'score-label--bueno';
      scoreStatusEl.classList.add(labelClass);
    }

    // Calcular etapas del Journey
    const stages = calculateJourneyStages(activeProfile);
    renderJourney(stages);
    renderActions(stages);
  }

  function calculateJourneyStages(profile) {
    const stages = [
      {
        id: 'diagnostico',
        titulo: '1. Diagnóstico Inicial',
        desc: 'Completado al registrar tus ingresos iniciales en tu perfil financiero.',
        progreso: profile.ingresosMensuales > 0 ? 100 : 0
      },
      {
        id: 'control',
        titulo: '2. Control de Presupuesto',
        desc: 'Completado si tienes tus gastos controlados y capacidad de ahorro positiva.',
        progreso: (profile.ahorroMensual > 0 && profile.gastosMensuales > 0) ? 100 : 0
      },
      {
        id: 'emergencia',
        titulo: '3. Fondo de Emergencia',
        desc: 'Reserva de liquidez equivalente a tu objetivo mensual de imprevistos.',
        progreso: profile.fondoEmergenciaObjetivo > 0 
          ? Math.min(100, Math.round((profile.ahorroActual / profile.fondoEmergenciaObjetivo) * 100))
          : (profile.ahorroActual > 0 ? 100 : 0)
      },
      {
        id: 'sin-deudas',
        titulo: '4. Cero Deudas',
        desc: 'Eliminación completa de deudas de consumo para recuperar flujo de caja.',
        progreso: profile.deudaTotal === 0 ? 100 : 0
      },
      {
        id: 'inversion',
        titulo: '5. Inversión y Multiplicación',
        desc: 'Colocación del capital extra en activos que generen interés compuesto.',
        progreso: (profile.deudaTotal === 0 && profile.ahorroMensual > 0) ? 100 : 0
      },
      {
        id: 'libertad',
        titulo: '6. Libertad Financiera',
        desc: 'Tus ahorros acumulados cubren 25 veces tus gastos anuales (Regla del 4%).',
        progreso: 0
      }
    ];

    // Calcular progreso de libertad financiera basado en la regla de 25
    if (profile.gastosMensuales > 0 && profile.deudaTotal === 0) {
      const metaLibertad = profile.gastosMensuales * 12 * 25;
      stages[5].progreso = Math.min(100, Math.round((profile.ahorroActual / metaLibertad) * 100));
    }

    return stages;
  }

  function renderJourney(stages) {
    const container = document.getElementById('journey-container');
    if (!container) return;

    container.innerHTML = '';

    stages.forEach((stage, idx) => {
      const isCompleted = stage.progreso === 100;
      let activeClass = '';
      
      // La primera etapa incompleta es la activa
      const prevCompleted = idx === 0 || stages[idx - 1].progreso === 100;
      if (!isCompleted && prevCompleted) {
        activeClass = 'journey-step--active';
      }
      
      const completedClass = isCompleted ? 'journey-step--completed' : '';

      const div = document.createElement('div');
      div.className = `journey-step ${completedClass} ${activeClass}`;
      div.innerHTML = `
        <div class="journey-dot"></div>
        <div class="journey-step__title">
          <span>${stage.titulo}</span>
          <span style="font-size:10px; color:${isCompleted ? 'var(--success)' : 'var(--stone-500)'};">
            ${stage.progreso}%
          </span>
        </div>
        <p class="journey-step__desc">${stage.desc}</p>
        <div class="journey-progress">
          <div class="journey-progress-fill" style="width: ${stage.progreso}%;"></div>
        </div>
      `;
      container.appendChild(div);
    });
  }

  function renderActions(stages) {
    const list = document.getElementById('actions-list');
    if (!list) return;

    list.innerHTML = '';

    // Encontrar la etapa activa (la primera no completada al 100%)
    let activeStage = stages.find(s => s.progreso < 100);
    if (!activeStage) {
      // Si todo está al 100%, es la última
      activeStage = stages[stages.length - 1];
    }

    const actions = getActionsForStage(activeStage.id);

    actions.forEach((act, idx) => {
      const div = document.createElement('div');
      div.className = 'action-item';
      div.innerHTML = `
        <div class="action-item__number">${idx + 1}</div>
        <div class="action-item__body">
          <h3 class="action-item__title">${act.titulo}</h3>
          <p class="action-item__desc">${act.desc}</p>
          <a href="${act.url}" class="btn btn--sage btn--xs" style="margin-top:var(--sp-2); display:inline-block;">
            ${act.cta}
          </a>
        </div>
      `;
      list.appendChild(div);
    });
  }

  function getActionsForStage(stageId) {
    const map = {
      diagnostico: [
        {
          titulo: 'Completa tu presupuesto unificado',
          desc: 'Registra tus ingresos y gastos para que el ecosistema de Midinari calcule tu capacidad real de ahorro.',
          url: '../mi-perfil/',
          cta: 'Ir a mi perfil'
        },
        {
          titulo: 'Identifica gastos hormiga',
          desc: 'Utiliza el Control de Gastos para categorizar tus egresos y recortar lo innecesario.',
          url: '../control-gastos/',
          cta: 'Abrir Control de Gastos'
        }
      ],
      control: [
        {
          titulo: 'Corta fugas de dinero',
          desc: 'Comienza registrando tus salidas de dinero diarias para consolidar una capacidad de ahorro positiva.',
          url: '../control-gastos/',
          cta: 'Abrir Control de Gastos'
        },
        {
          titulo: 'Define tu colchón financiero',
          desc: 'Calcula cuántos meses necesitas cubrir según tu estabilidad laboral.',
          url: '../calculadora-fondo-emergencia/',
          cta: 'Ir a Fondo de Emergencia'
        }
      ],
      emergencia: [
        {
          titulo: 'Llena tu fondo básico',
          desc: 'Separa tus aportes mensuales directamente en una cuenta separada de tus gastos diarios.',
          url: '../calculadora-fondo-emergencia/',
          cta: 'Ir a Fondo de Emergencia'
        },
        {
          titulo: 'Compara simulaciones de ahorro',
          desc: 'Estima cuánto tiempo te tomará completar tu meta en base a diferentes tasas de rendimiento.',
          url: '../calculadora-intereses/',
          cta: 'Ir a Calculadora de Intereses'
        }
      ],
      'sin-deudas': [
        {
          titulo: 'Estructura tu plan de deudas',
          desc: 'Simula el método Bola de Nieve y Avalancha con tus deudas reales para definir tu fecha exacta de salida.',
          url: '../simulador-deudas/',
          cta: 'Ir al Simulador de Deudas'
        },
        {
          titulo: 'Mide el impacto de los pagos mínimos',
          desc: 'Descubre cuánto te cuesta financieramente pagar solo el mínimo requerido en tus tarjetas.',
          url: '../simulador-pago-minimo/',
          cta: 'Ver Simulador de Pago Mínimo'
        }
      ],
      inversion: [
        {
          titulo: 'Aprovecha el interés compuesto',
          desc: 'Simula depósitos periódicos en base a una tasa anual esperada para ver crecer tu patrimonio.',
          url: '../calculadora-intereses/',
          cta: 'Ir a Calculadora de Intereses'
        },
        {
          titulo: 'Simula un préstamo inteligente',
          desc: 'Si planeas tomar un crédito productivo o hipotecario, amortízalo bajo el sistema francés antes de firmar.',
          url: '../calculadora-prestamos/',
          cta: 'Ver Calculadora de Préstamos'
        }
      ],
      libertad: [
        {
          titulo: 'Mantén la consistencia',
          desc: 'Tu capacidad de ahorro es óptima. Monitorea periódicamente tu patrimonio consolidado.',
          url: '../mi-perfil/',
          cta: 'Ver mi perfil consolidado'
        }
      ]
    };

    return map[stageId] || map.diagnostico;
  }

  function calculateSimulation() {
    const extSavings = parseFloat(document.getElementById('slide-extra-savings')?.value) || 0;
    const redExpenses = parseFloat(document.getElementById('slide-reduced-expenses')?.value) || 0;
    const extDebtPay = parseFloat(document.getElementById('slide-extra-debt-pay')?.value) || 0;
    const rateRed = parseFloat(document.getElementById('slide-refinance-rate')?.value) || 0;

    const summaryEl = document.getElementById('projection-summary');
    if (!summaryEl) return;

    if (activeProfile.deudaTotal > 0) {
      // 1. Simulación con Deudas
      const baseline = simulateDebtPayoff(
        activeProfile.deudaTotal,
        activeProfile.interesPromedio,
        activeProfile.pagoMensualDeuda
      );

      const simulated = simulateDebtPayoff(
        activeProfile.deudaTotal,
        Math.max(0, activeProfile.interesPromedio - rateRed),
        activeProfile.pagoMensualDeuda + extDebtPay + redExpenses
      );

      if (baseline.infinite || simulated.infinite) {
        summaryEl.innerHTML = `
          El pago mensual actual o simulado es insuficiente para cubrir los intereses de la deuda.<br>
          <span style="color:var(--danger); font-weight:700;">Incrementa el abono a deudas o reduce los gastos para iniciar la amortización.</span>
        `;
        return;
      }

      const monthsSaved = Math.max(0, baseline.months - simulated.months);
      const interestSaved = Math.max(0, baseline.interestPaid - simulated.interestPaid);

      if (monthsSaved === 0 && interestSaved === 0) {
        summaryEl.innerHTML = `
          Si continúas con tu ritmo actual, liquidarás tus deudas en aproximadamente <strong>${baseline.months} meses</strong>.<br>
          <span style="color:var(--stone-500); font-size:12px; display:block; margin-top:4px;">Arrastra los controles superiores para ver cuántos meses e intereses puedes ahorrar.</span>
        `;
      } else {
        summaryEl.innerHTML = `
          Si aplicas estos cambios, terminarás tus deudas en aproximadamente <strong>${simulated.months} meses</strong>.<br>
          ¡Ahorrarás <strong>${fmt.currency(interestSaved)}</strong> en intereses totales y terminarás <strong>${monthsSaved} meses antes</strong> de lo previsto!
        `;
      }

    } else {
      // 2. Simulación de Ahorro / Inversión (Sin deudas)
      const baselineSavings = simulateSavings(
        activeProfile.ahorroActual,
        activeProfile.ahorroMensual,
        60,
        0.06 // 6% anual conservador
      );

      const simulatedSavings = simulateSavings(
        activeProfile.ahorroActual,
        activeProfile.ahorroMensual + extSavings + redExpenses,
        60,
        0.06
      );

      const extraAccumulated = Math.max(0, simulatedSavings - baselineSavings);

      summaryEl.innerHTML = `
        En 5 años, acumularás un patrimonio proyectado de <strong>${fmt.currency(simulatedSavings)}</strong>.<br>
        ¡Esto representa un incremento de <strong>${fmt.currency(extraAccumulated)} extra</strong> frente a tu ritmo actual de ahorro, asumiendo un rendimiento promedio del 6% anual!
      `;
    }
  }

  function simulateDebtPayoff(totalDebt, annualRate, monthlyPayment) {
    if (totalDebt <= 0) return { months: 0, interestPaid: 0, infinite: false };
    if (monthlyPayment <= 0) return { months: 999, interestPaid: 999, infinite: true };

    let balance = totalDebt;
    const monthlyRate = (annualRate / 100) / 12;
    let months = 0;
    let interestPaid = 0;
    const maxMonths = 360; // Limite de 30 años para evitar loops infinitos

    while (balance > 0.01 && months < maxMonths) {
      months++;
      const interest = balance * monthlyRate;
      interestPaid += interest;
      balance += interest;

      if (monthlyPayment <= interest) {
        return { months: 999, interestPaid: 999, infinite: true }; // Interés rotativo eterno
      }

      const applied = Math.min(monthlyPayment, balance);
      balance -= applied;
    }

    return {
      months: months,
      interestPaid: interestPaid,
      infinite: months >= maxMonths
    };
  }

  function simulateSavings(initial, monthly, monthsCount, annualReturn) {
    let balance = initial;
    const monthlyReturn = annualReturn / 12;

    for (let m = 0; m < monthsCount; m++) {
      balance += monthly;
      balance += balance * monthlyReturn;
    }

    return balance;
  }

  // Polling para esperar a que todos los scripts del core estén cargados en el DOM
  const checkInterval = setInterval(() => {
    if (window.MidinariProfile && window.MidinariAdvisor) {
      clearInterval(checkInterval);
      init();
    }
  }, 50);

})();
