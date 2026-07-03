/* ============================================================
   MIDINARI — rules.js
   Reglas financieras del Ecosistema Inteligente
   ============================================================ */

const MidinariRules = [
  {
    id: 'regla-deudas-activas',
    icono: '💳',
    titulo: 'Diseña tu plan de salida de deudas',
    descripcion: 'Tienes deudas activas. Compara el método bola de nieve vs. avalancha para reducir el interés pagado y salir libre más rápido.',
    url: '/simulador-deudas/',
    cta: 'Simular Plan de Pago',
    prioridad: 'alta', // Por defecto alta
    condicion: function (profile) {
      return profile.deudaTotal > 0;
    }
  },
  {
    id: 'regla-fondo-insuficiente',
    icono: '🛡️',
    titulo: 'Fortalece tu red de seguridad',
    descripcion: 'Tu ahorro actual está por debajo de tu objetivo de fondo de emergencia. Asegura tu estabilidad financiera ante cualquier imprevisto.',
    url: '/calculadora-fondo-emergencia/',
    cta: 'Ajustar Fondo de Emergencia',
    prioridad: 'alta',
    condicion: function (profile) {
      // Si el objetivo es mayor al ahorro actual (y el objetivo es mayor a 0)
      return profile.fondoEmergenciaObjetivo > profile.ahorroActual;
    }
  },
  {
    id: 'regla-cero-ahorro',
    icono: '📊',
    titulo: 'Detén la fuga de dinero',
    descripcion: 'No estás logrando ahorrar dinero a fin de mes. Comienza a registrar tus gastos diarios para identificar dónde recortar y crear tu primer excedente.',
    url: '/control-gastos/',
    cta: 'Monitorear mis Gastos',
    prioridad: 'alta',
    condicion: function (profile) {
      return profile.ahorroMensual === 0;
    }
  },
  {
    id: 'regla-sobreendeudamiento',
    icono: '📉',
    titulo: 'Alivia tu carga mensual de deudas',
    descripcion: 'Tus compromisos mensuales de deuda superan el 35% de tus ingresos, lo cual es considerado zona de riesgo. Simula abonos extra o renegociaciones para reducir las cuotas.',
    url: '/calculadora-prestamos/',
    cta: 'Calcular Cuotas y Abonos',
    prioridad: 'alta',
    condicion: function (profile) {
      return profile.ingresosMensuales > 0 && (profile.pagoMensualDeuda / profile.ingresosMensuales) > 0.35;
    }
  },
  {
    id: 'regla-capacidad-ahorro',
    icono: '📈',
    titulo: 'Haz crecer tus ahorros',
    descripcion: '¡Excelente! Tienes capacidad de ahorro mensual. Descubre el poder del interés compuesto a largo plazo y cómo multiplicar tu dinero.',
    url: '/calculadora-intereses/',
    cta: 'Simular Interés Compuesto',
    prioridad: 'media',
    condicion: function (profile) {
      return profile.ahorroMensual > 0;
    }
  },
  {
    id: 'regla-patrimonio-saludable',
    icono: '🏆',
    titulo: 'Optimiza tu patrimonio',
    descripcion: 'Felicidades, no tienes deudas y cuentas con un fondo de emergencia sólido. Es momento de aprender a invertir y planificar metas a largo plazo.',
    url: '/calculadora-intereses/',
    cta: 'Calcular Rendimientos',
    prioridad: 'baja',
    condicion: function (profile) {
      return profile.deudaTotal === 0 && profile.ahorroActual >= profile.fondoEmergenciaObjetivo && profile.ingresosMensuales > 0 && profile.fondoEmergenciaObjetivo > 0;
    }
  }
];

// Registrar globalmente
if (typeof window !== 'undefined') {
  window.MidinariRules = MidinariRules;
}
