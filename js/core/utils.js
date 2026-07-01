/* ============================================================
   MIDINARI — utils.js
   Funciones utilitarias y helpers compartidos
   ============================================================ */

const MidinariUtils = (function () {
  'use strict';

  /**
   * Formatea un número como moneda local.
   * @param {number} val - El valor a formatear.
   * @param {string} [locale='es-MX'] - Configuración regional.
   * @param {string} [currency='MXN'] - Código de moneda.
   * @returns {string} Valor formateado.
   */
  function formatCurrency(val, locale = 'es-MX', currency = 'MXN') {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    } catch (e) {
      return '$' + val.toFixed(0);
    }
  }

  /**
   * Formatea un valor numérico como porcentaje.
   * @param {number} val - El valor a formatear (ej. 18 o 18.5).
   * @returns {string} Cadena formateada con signo %.
   */
  function formatPercent(val) {
    return val + '%';
  }

  /**
   * Restringe un número dentro de un rango definido.
   * @param {number} val - El valor numérico.
   * @param {number} min - Mínimo permitido.
   * @param {number} max - Máximo permitido.
   * @returns {number} Valor acotado.
   */
  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  /**
   * Redondea un número a ciertos decimales.
   * @param {number} val - El número.
   * @param {number} [decimals=2] - Número de decimales.
   * @returns {number} Valor redondeado.
   */
  function round(val, decimals = 2) {
    const p = Math.pow(10, decimals);
    return Math.round(val * p) / p;
  }

  /**
   * Parsea un string o número de forma segura a float.
   * @param {any} val - El valor a parsear.
   * @returns {number} El número decodificado o 0 en caso de error.
   */
  function parseNumber(val) {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }

  return {
    formatCurrency: formatCurrency,
    formatPercent: formatPercent,
    clamp: clamp,
    round: round,
    parseNumber: parseNumber
  };
})();

// Registrar globalmente
if (typeof window !== 'undefined') {
  window.MidinariUtils = MidinariUtils;
}
