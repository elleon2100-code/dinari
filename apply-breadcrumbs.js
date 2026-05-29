const fs = require('fs');
const path = require('path');

const toolsDict = {
  'simulador-deudas/index.html': 'Simulador de Deudas',
  'calculadora-intereses/index.html': 'Calculadora de Intereses',
  'control-gastos/index.html': 'Control de Gastos'
};

Object.entries(toolsDict).forEach(([file, name]) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const folder = file.split('/')[0];
    
    // Breadcrumb visual
    const breadcrumbHTML = `
    <nav class="page-hero__breadcrumb" aria-label="Ruta de navegación" style="margin-bottom: var(--sp-4);">
      <a href="../" style="color: var(--sage-600); text-decoration: none; font-size: var(--text-sm); font-weight: 600;">Inicio</a>
      <span aria-hidden="true" style="color: var(--stone-400); margin-inline: var(--sp-2);">›</span>
      <span style="color: var(--stone-500); font-size: var(--text-sm);">${name}</span>
    </nav>
    `;

    if (!content.includes('page-hero__breadcrumb')) {
      content = content.replace(/<div class="container">[\s\n]*<div class="page-hero__eyebrow"/, match => `<div class="container">\n${breadcrumbHTML}\n<div class="page-hero__eyebrow"`);
      
      // JSON-LD
      const jsonLd = `
      <script type="application/ld+json">
      {
        "@context":"https://schema.org",
        "@graph":[
          {
            "@type":"BreadcrumbList",
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Inicio","item":"https://midinari.com/"},
              {"@type":"ListItem","position":2,"name":"${name}","item":"https://midinari.com/${folder}/"}
            ]
          }
        ]
      }
      </script>
      `;
      content = content.replace('</head>', `${jsonLd}\n</head>`);
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated breadcrumbs in', file);
    }
  }
});
