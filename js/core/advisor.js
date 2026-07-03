/* ============================================================
   MIDINARI — advisor.js
   Motor de asesoría financiera del Copiloto
   ============================================================ */

const MidinariAdvisor = (function () {
  'use strict';

  /**
   * Genera el diagnóstico de salud financiera del usuario.
   * @param {Object} profile - Perfil financiero de Midinari.
   * @param {Array} history - Historial de snapshots del timeline.
   * @returns {Object} Diagnóstico estructurado.
   */
  function getDiagnosis(profile, history = []) {
    const score = computeFinancialScore(profile);
    const lastSnapshot = history.length > 0 ? history[history.length - 1] : null;

    // 1. Estado General
    let estadoGeneral = 'Crítico';
    let estadoColor = 'var(--danger)';
    if (score >= 80) {
      estadoGeneral = 'Excelente';
      estadoColor = 'var(--success)';
    } else if (score >= 60) {
      estadoGeneral = 'Bueno';
      estadoColor = 'var(--sage-600)';
    } else if (score >= 40) {
      estadoGeneral = 'Riesgo';
      estadoColor = 'var(--warning)';
    }

    // 2. Lo estás haciendo bien (Aspectos Positivos)
    const fortalezas = [];
    
    if (profile.deudaTotal === 0 && profile.ingresosMensuales > 0) {
      fortalezas.push({
        titulo: 'Libre de deudas de consumo',
        desc: 'No tienes deudas activas registradas. Esto te da una enorme ventaja y flexibilidad.'
      });
    }
    if (profile.ahorroActual >= profile.fondoEmergenciaObjetivo && profile.fondoEmergenciaObjetivo > 0) {
      fortalezas.push({
        titulo: 'Fondo de emergencia completo',
        desc: 'Cuentas con la reserva de efectivo recomendada para cubrir imprevistos sin endeudarte.'
      });
    }
    if (profile.ingresosMensuales > 0 && (profile.ahorroMensual / profile.ingresosMensuales) >= 0.2) {
      fortalezas.push({
        titulo: 'Excelente tasa de ahorro',
        desc: 'Ahorras un 20% o más de tus ingresos mensuales, superando el estándar recomendado.'
      });
    }
    if (profile.ingresosMensuales > 0 && (profile.pagoMensualDeuda / profile.ingresosMensuales) < 0.1) {
      fortalezas.push({
        titulo: 'Carga de deuda bajo control',
        desc: 'El pago mensual de tus deudas representa menos del 10% de tus ingresos.'
      });
    }

    // Comparaciones históricas si hay snapshots previos
    if (lastSnapshot) {
      if (profile.deudaTotal < lastSnapshot.deudaTotal) {
        fortalezas.push({
          titulo: 'Estás reduciendo tu deuda',
          desc: `Has disminuido tu deuda total respecto a tu último registro.`
        });
      }
      if (profile.ahorroActual > lastSnapshot.ahorroActual) {
        fortalezas.push({
          titulo: 'Tu fondo de emergencia está creciendo',
          desc: `Tus ahorros actuales aumentaron respecto al registro anterior.`
        });
      }
      if (profile.ahorroMensual > lastSnapshot.ahorroMensual) {
        fortalezas.push({
          titulo: 'Tu capacidad de ahorro aumentó',
          desc: `Estás logrando separar más dinero mensualmente que antes.`
        });
      }
    }

    // Fortalezas fallback si no hay ninguna activa
    if (fortalezas.length === 0) {
      fortalezas.push({
        titulo: 'Perfil inicializado',
        desc: 'El primer paso para mejorar tus finanzas es medirlas. ¡Sigue adelante!'
      });
    }

    // 3. Lo que necesita atención (Debilidades)
    const debilidades = [];
    if (profile.fondoEmergenciaObjetivo > profile.ahorroActual) {
      debilidades.push({
        titulo: 'Fondo de emergencia insuficiente',
        desc: 'Tu reserva actual no cubre tu objetivo. Estás expuesto ante emergencias imprevistas.'
      });
    }
    if (profile.deudaTotal > 0) {
      debilidades.push({
        titulo: 'Deudas activas',
        desc: 'Tus deudas te restan liquidez mensual. El pago de intereses encarece tu vida financiera.'
      });
    }
    if (profile.ingresosMensuales > 0 && (profile.pagoMensualDeuda / profile.ingresosMensuales) > 0.35) {
      debilidades.push({
        titulo: 'Exceso de deudas mensuales',
        desc: 'Destinas más del 35% de tus ingresos a cuotas de deudas, comprometiendo tu presupuesto.'
      });
    }
    if (profile.ahorroMensual === 0 && profile.ingresosMensuales > 0) {
      debilidades.push({
        titulo: 'Baja capacidad de ahorro',
        desc: 'No estás separando dinero mensual. Cualquier emergencia te obligará a endeudarte más.'
      });
    }
    if (profile.ingresosMensuales > 0 && (profile.deudaTotal / (profile.ingresosMensuales * 12)) > 1.0) {
      debilidades.push({
        titulo: 'Alta relación deuda/ingreso',
        desc: 'Tu deuda total supera el equivalente a un año de tus ingresos totales.'
      });
    }

    // 4. Prioridad del mes
    let prioridadMes = {
      titulo: 'Maximizar tu capacidad de ahorro',
      desc: 'Tu prioridad número uno debe ser revisar tus gastos mensuales para liberar al menos una pequeña porción de ingresos que puedas ahorrar.'
    };

    if (profile.ahorroMensual > 0) {
      if (profile.pagoMensualDeuda / profile.ingresosMensuales > 0.35) {
        prioridadMes = {
          titulo: 'Reducir la carga de deudas',
          desc: 'Tienes una carga de cuotas muy alta. Enfoca tu ahorro extra en abonar al capital de las deudas con mayor tasa de interés.'
        };
      } else if (profile.ahorroActual < (profile.fondoEmergenciaObjetivo * 0.3)) {
        prioridadMes = {
          titulo: 'Construir tu fondo de emergencia básico',
          desc: 'Asegura un fondo mínimo equivalente a 1 o 2 meses de gastos antes de realizar grandes aportes a deudas o inversiones.'
        };
      } else if (profile.deudaTotal > 0) {
        prioridadMes = {
          titulo: 'Liquidación total de deudas',
          desc: 'Con un colchón de emergencia inicial listo, usa tus ahorros mensuales para liquidar tus deudas de consumo por completo.'
        };
      } else if (profile.ahorroActual < profile.fondoEmergenciaObjetivo) {
        prioridadMes = {
          titulo: 'Completar tu fondo de emergencia',
          desc: 'Aumenta tus ahorros hasta cubrir tu objetivo total de meses recomendados para blindarte financieramente.'
        };
      } else {
        prioridadMes = {
          titulo: 'Multiplicar tu patrimonio e inversión',
          desc: 'Sin deudas y con tu fondo completo, enfoca tus esfuerzos en canalizar tu ahorro mensual hacia activos que rindan interés compuesto.'
        };
      }
    }

    // 5. Objetivos automáticos
    const objetivos = [];
    
    // Objetivo Fondo de Emergencia
    if (profile.fondoEmergenciaObjetivo > 0) {
      const progFondo = Math.min(Math.round((profile.ahorroActual / profile.fondoEmergenciaObjetivo) * 100), 100);
      objetivos.push({
        nombre: 'Blindar mi Fondo de Emergencia',
        meta: `Llegar a $${profile.fondoEmergenciaObjetivo.toLocaleString()}`,
        actual: `$${profile.ahorroActual.toLocaleString()}`,
        progreso: progFondo
      });
    }

    // Objetivo Liquidar Deuda
    if (profile.deudaTotal > 0) {
      // Intentar calcular el avance basándonos en un historial o simplemente que el objetivo final es 0
      // Usaremos un progreso relativo simulado o dinámico según snapshots.
      let progDeuda = 0;
      if (lastSnapshot && lastSnapshot.deudaTotal > 0 && profile.deudaTotal < lastSnapshot.deudaTotal) {
        progDeuda = Math.min(Math.round(((lastSnapshot.deudaTotal - profile.deudaTotal) / lastSnapshot.deudaTotal) * 100), 100);
      }
      objetivos.push({
        nombre: 'Eliminar mis Deudas de Consumo',
        meta: '$0 de deuda restante',
        actual: `$${profile.deudaTotal.toLocaleString()} pendiente`,
        progreso: progDeuda
      });
    }

    // Objetivo Capacidad de Ahorro (Llegar al 20% de los ingresos)
    if (profile.ingresosMensuales > 0) {
      const tasaActual = profile.ahorroMensual / profile.ingresosMensuales;
      const progAhorro = Math.min(Math.round((tasaActual / 0.20) * 100), 100);
      objetivos.push({
        nombre: 'Alcanzar una Tasa de Ahorro del 20%',
        meta: `Ahorrar $${Math.round(profile.ingresosMensuales * 0.20).toLocaleString()} al mes`,
        actual: `$${profile.ahorroMensual.toLocaleString()} ahorrados`,
        progreso: progAhorro
      });
    }

    return {
      score: score,
      estadoGeneral: estadoGeneral,
      estadoColor: estadoColor,
      fortalezas: fortalezas,
      debilidades: debilidades,
      prioridadMes: prioridadMes,
      objetivos: objetivos
    };
  }

  /**
   * Calcula el Score de Salud Financiera (de 0 a 100).
   * Mantiene el cálculo unificado con el Centro Financiero.
   */
  function computeFinancialScore(profile) {
    if (profile.ingresosMensuales === 0 && profile.gastosMensuales === 0 && profile.deudaTotal === 0) {
      return 0; // Perfil vacío
    }

    let score = 0;

    // 1. Fondo de emergencia (30%)
    if (profile.fondoEmergenciaObjetivo > 0) {
      const ratioFondo = profile.ahorroActual / profile.fondoEmergenciaObjetivo;
      score += Math.min(ratioFondo * 30, 30);
    } else {
      score += 15; // puntuación media si no se ha configurado meta
    }

    // 2. Tasa de Ahorro Mensual (30%)
    if (profile.ingresosMensuales > 0) {
      const tasaAhorro = profile.ahorroMensual / profile.ingresosMensuales;
      const ratioAhorro = tasaAhorro / 0.20; // 20% es la meta ideal
      score += Math.min(ratioAhorro * 30, 30);
    }

    // 3. Relación Deuda/Ingreso Anual (20%)
    const ingresoAnual = profile.ingresosMensuales * 12;
    if (profile.deudaTotal === 0) {
      score += 20;
    } else if (ingresoAnual > 0) {
      const ratioDeudaIngreso = profile.deudaTotal / ingresoAnual;
      if (ratioDeudaIngreso <= 0.5) {
        score += 20;
      } else if (ratioDeudaIngreso < 2.0) {
        score += 20 * (1 - (ratioDeudaIngreso - 0.5) / 1.5);
      }
    }

    // 4. Relación Pago Deuda/Ingreso Mensual (20%)
    if (profile.deudaTotal === 0 || profile.pagoMensualDeuda === 0) {
      score += 20;
    } else if (profile.ingresosMensuales > 0) {
      const ratioCarga = profile.pagoMensualDeuda / profile.ingresosMensuales;
      if (ratioCarga <= 0.10) {
        score += 20;
      } else if (ratioCarga < 0.50) {
        score += 20 * (1 - (ratioCarga - 0.10) / 0.40);
      }
    }

    return Math.max(0, Math.min(Math.round(score), 100));
  }

  return {
    getDiagnosis: getDiagnosis,
    computeFinancialScore: computeFinancialScore
  };
})();

// Registrar globalmente
if (typeof window !== 'undefined') {
  window.MidinariAdvisor = MidinariAdvisor;
}
