const fs = require('fs');

let content = fs.readFileSync('js/minimum-payment.js', 'utf8');

const newDOM = `
    amortTbody: document.getElementById('amort-tbody'),
    // Nuevos elementos comparativa
    compTimeMin: document.getElementById('comp-time-min'),
    compIntMin: document.getElementById('comp-int-min'),
    compTotalMin: document.getElementById('comp-total-min'),
    compTimeAlt: document.getElementById('comp-time-alt'),
    compIntAlt: document.getElementById('comp-int-alt'),
    compTotalAlt: document.getElementById('comp-total-alt'),
    compEmotional: document.getElementById('comp-emotional')
`;
content = content.replace("amortTbody: document.getElementById('amort-tbody')", newDOM);

const populateLogic = `
    // Populate dynamic SEO table
    if (results.compTimeMin) {
      results.compTimeMin.innerHTML = getMonthsString(simMin.months);
      animateValue(results.compIntMin, 0, simMin.totalInterest, 800);
      animateValue(results.compTotalMin, 0, debt + simMin.totalInterest, 800);

      if (altPay > minPay && simAlt && !simAlt.infinite) {
        results.compTimeAlt.innerHTML = getMonthsString(simAlt.months);
        animateValue(results.compIntAlt, 0, simAlt.totalInterest, 800);
        animateValue(results.compTotalAlt, 0, debt + simAlt.totalInterest, 800);
        
        const savedM = simMin.months - simAlt.months;
        const savedYearsText = savedM > 12 ? ' (' + Math.floor(savedM/12) + ' años)' : '';
        results.compEmotional.innerHTML = '¡Ahorras ' + savedM + ' meses' + savedYearsText + ' de pagos mensuales y angustia financiera!';
      } else {
        results.compTimeAlt.innerHTML = '—';
        results.compIntAlt.innerHTML = '—';
        results.compTotalAlt.innerHTML = '—';
        results.compEmotional.innerHTML = 'Ingresa un Pago Alternativo mayor al mínimo para ver la diferencia.';
      }
    }
`;
content = content.replace('renderTable(simMin.tableData);', populateLogic + '\n    renderTable(simMin.tableData);');

fs.writeFileSync('js/minimum-payment.js', content, 'utf8');
console.log('minimum-payment.js updated successfully');
