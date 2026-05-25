const fs=require('fs');

function addLink(file, originalText) {
  let c = fs.readFileSync(file,'utf8');
  const linkHtml = `\n    </p>\n    <p style="margin-top: var(--sp-4); font-size: var(--text-sm); color: var(--stone-500);">\n      <a href="../sobre-dinari/index.html" style="color: var(--sage-600); text-decoration: underline;">Descubre por qué construimos esta herramienta</a> y cómo protegemos tu privacidad.\n    </p>`;
  
  if (!c.includes('Descubre por qué construimos esta herramienta')) {
    c = c.replace(originalText, originalText.replace('</p>', linkHtml));
    fs.writeFileSync(file,c,'utf8');
    console.log('Updated ' + file);
  }
}

addLink('simulador-deudas/index.html', `<p class="body-lg page-hero__subtitle">
      Ingresa tus deudas y descubre exactamente <strong>cuándo serás libre</strong>. Compara el método bola de nieve vs avalancha y encuentra el plan óptimo para ti.
    </p>`);

addLink('simulador-pago-minimo/index.html', `<p class="body-lg page-hero__subtitle">
      Calcula cuánto terminarás pagando realmente si solo haces el pago mínimo de tu tarjeta y descubre el costo real de tu deuda.
    </p>`);
