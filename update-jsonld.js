const fs = require('fs');

let content = fs.readFileSync('simulador-pago-minimo/index.html', 'utf8');

const newJsonLd = `{
      "@type":"FAQPage",
      "mainEntity":[
        {"@type":"Question","name":"¿Qué pasa si solo pago el mínimo?","acceptedAnswer":{"@type":"Answer","text":"Mantienes tu tarjeta al día pero terminas pagando tu compra varias veces debido a la acumulación de intereses, alargando tu deuda por décadas."}},
        {"@type":"Question","name":"¿Cuánto tarda una tarjeta en pagarse?","acceptedAnswer":{"@type":"Answer","text":"Depende de la tasa de interés y de tu pago. Si pagas solo el mínimo de una deuda con 60% anual, podrías tardar entre 8 y 15 años en saldarla."}},
        {"@type":"Question","name":"¿El pago mínimo afecta el crédito?","acceptedAnswer":{"@type":"Answer","text":"No daña tu historial por impago, pero mantiene tu índice de utilización de crédito alto, lo cual sí baja tu puntuación crediticia."}},
        {"@type":"Question","name":"¿Qué interés cobran las tarjetas en RD?","acceptedAnswer":{"@type":"Answer","text":"Las tasas anuales (CAT) para tarjetas clásicas suelen rondar entre el 45% y el 85%."}},
        {"@type":"Question","name":"¿Conviene consolidar deuda?","acceptedAnswer":{"@type":"Answer","text":"Solo si consigues un préstamo con una tasa sustancialmente menor y tienes la disciplina absoluta de no volver a usar las tarjetas de crédito."}}
      ]
    }`;

content = content.replace(/{\s*"@type"\s*:\s*"FAQPage"[\s\S]*?}\s*}/, newJsonLd);

fs.writeFileSync('simulador-pago-minimo/index.html', content, 'utf8');
console.log('JSON-LD updated successfully');
