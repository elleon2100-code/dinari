const fs = require('fs');
const path = require('path');

const tools = [
  'simulador-deudas/index.html',
  'simulador-pago-minimo/index.html',
  'calculadora-intereses/index.html'
];

const legals = [
  'terminos/index.html',
  'privacidad/index.html',
  'cookies/index.html',
  'contacto/index.html'
];

const home = 'index.html';

// 1. Añadir "Aprende más" al final de las herramientas
const aprendeMasHTML = `
<section class="container" style="padding-bottom: var(--sp-12);">
  <div style="border-top: 1px solid var(--cream-300); padding-top: var(--sp-8);">
    <h2 style="font-size: var(--text-xl); font-weight: 700; color: var(--charcoal); margin-bottom: var(--sp-6);">
      Aprende más sobre el manejo de deudas
    </h2>
    <div class="tools-grid" style="display: grid; gap: var(--sp-4); grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
      <a href="../como-salir-de-deudas/index.html" class="tool-card" style="border: 1px solid var(--cream-300); padding: var(--sp-5); border-radius: var(--radius-lg); text-decoration: none; display: block; background: var(--white);">
        <div style="font-size: 1.5rem; background: var(--cream-100); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); margin-bottom: var(--sp-3);">📖</div>
        <h3 style="font-size: var(--text-base); font-weight: 600; color: var(--charcoal); margin: 0 0 var(--sp-2) 0;">Cómo salir de deudas</h3>
        <p style="font-size: var(--text-sm); color: var(--stone-500); margin: 0;">La guía definitiva con pasos concretos y estrategias probadas.</p>
      </a>
      <a href="../el-peligro-del-pago-minimo/index.html" class="tool-card" style="border: 1px solid var(--cream-300); padding: var(--sp-5); border-radius: var(--radius-lg); text-decoration: none; display: block; background: var(--white);">
        <div style="font-size: 1.5rem; background: rgba(220,38,38,0.1); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); margin-bottom: var(--sp-3);">⚠️</div>
        <h3 style="font-size: var(--text-base); font-weight: 600; color: var(--charcoal); margin: 0 0 var(--sp-2) 0;">El peligro del pago mínimo</h3>
        <p style="font-size: var(--text-sm); color: var(--stone-500); margin: 0;">Descubre por qué tu deuda parece no bajar nunca.</p>
      </a>
      <a href="../metodo-bola-de-nieve/index.html" class="tool-card" style="border: 1px solid var(--cream-300); padding: var(--sp-5); border-radius: var(--radius-lg); text-decoration: none; display: block; background: var(--white);">
        <div style="font-size: 1.5rem; background: var(--sage-100); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); margin-bottom: var(--sp-3);">⛄</div>
        <h3 style="font-size: var(--text-base); font-weight: 600; color: var(--charcoal); margin: 0 0 var(--sp-2) 0;">Método Bola de Nieve</h3>
        <p style="font-size: var(--text-sm); color: var(--stone-500); margin: 0;">Gana impulso pagando la deuda más pequeña primero.</p>
      </a>
    </div>
  </div>
</section>
`;

tools.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('Aprende más sobre el manejo de deudas')) {
      content = content.replace('</main>', `\n${aprendeMasHTML}\n</main>`);
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated', file, 'with Aprende mas');
    }
  }
});

// 2. Breadcrumbs en páginas legales
const names = {
  'terminos': 'Términos',
  'privacidad': 'Privacidad',
  'cookies': 'Cookies',
  'contacto': 'Contacto'
};

legals.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const folder = path.dirname(file);
    const name = names[folder];
    
    const breadcrumbHTML = `
    <nav class="page-hero__breadcrumb" aria-label="Ruta de navegación" style="margin-bottom: var(--sp-6);">
      <a href="../" style="color: var(--sage-600); text-decoration: none; font-size: var(--text-sm); font-weight: 600;">Inicio</a>
      <span aria-hidden="true" style="color: var(--stone-400); margin-inline: var(--sp-2);">›</span>
      <span style="color: var(--stone-500); font-size: var(--text-sm);">${name}</span>
    </nav>
    `;

    if (!content.includes('Ruta de navegación')) {
      // Inserción en páginas que no tienen hero explícito, buscamos <main> y <div class="container">
      content = content.replace(/<main[^>]*>[\s\n]*<section[^>]*>[\s\n]*<div class="container[^"]*">/, match => `${match}\n${breadcrumbHTML}`);
      
      // Add JSON-LD BreadcrumbList
      const jsonLd = `
      <script type="application/ld+json">
      {
        "@context":"https://schema.org",
        "@graph":[
          {
            "@type":"BreadcrumbList",
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Inicio","item":"https://dinari.app/"},
              {"@type":"ListItem","position":2,"name":"${name}","item":"https://dinari.app/${folder}/"}
            ]
          }
        ]
      }
      </script>
      `;
      content = content.replace('</head>', `${jsonLd}\n</head>`);
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated', file, 'with Breadcrumbs');
    }
  }
});

// 3. Homepage (Index.html) - Cambiar herramientas a "Herramientas más usadas" y añadir "Guías más leídas"
if (fs.existsSync(home)) {
  let content = fs.readFileSync(home, 'utf8');
  if (!content.includes('Guías más leídas')) {
    content = content.replace('Las herramientas que nadie te enseñó a usar', 'Herramientas más usadas');
    
    const guiasSection = `
    <section class="guides-section" aria-labelledby="guides-title" style="padding-block: var(--sp-12); background: var(--cream-50);">
      <div class="container">
        <div class="section-header reveal">
          <div class="section-header__eyebrow">
            <span class="badge badge--cream">Educación</span>
          </div>
          <h2 class="section-header__title" id="guides-title">Guías más leídas</h2>
          <p class="section-header__subtitle">Artículos fundamentales para tomar el control de tu dinero hoy mismo.</p>
        </div>
        <div class="tools-grid" style="display: grid; gap: var(--sp-4); grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
          <a href="como-salir-de-deudas/index.html" class="tool-card reveal" style="border: 1px solid var(--cream-300); padding: var(--sp-5); border-radius: var(--radius-lg); text-decoration: none; display: block; background: var(--white);">
            <div style="font-size: 1.5rem; background: var(--sage-100); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); margin-bottom: var(--sp-3);">📘</div>
            <h3 style="font-size: var(--text-base); font-weight: 600; color: var(--charcoal); margin: 0 0 var(--sp-2) 0;">Cómo salir de deudas rápido</h3>
            <p style="font-size: var(--text-sm); color: var(--stone-500); margin: 0;">La guía paso a paso para auditar tus deudas y empezar a eliminarlas.</p>
          </a>
          <a href="hoja-de-ruta-financiera/index.html" class="tool-card reveal reveal--delay-1" style="border: 1px solid var(--cream-300); padding: var(--sp-5); border-radius: var(--radius-lg); text-decoration: none; display: block; background: var(--white);">
            <div style="font-size: 1.5rem; background: var(--sage-100); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); margin-bottom: var(--sp-3);">🗺️</div>
            <h3 style="font-size: var(--text-base); font-weight: 600; color: var(--charcoal); margin: 0 0 var(--sp-2) 0;">Tu hoja de ruta financiera</h3>
            <p style="font-size: var(--text-sm); color: var(--stone-500); margin: 0;">Descubre en qué etapa estás y cuál es tu siguiente paso lógico.</p>
          </a>
          <a href="retiro-tardio/index.html" class="tool-card reveal reveal--delay-2" style="border: 1px solid var(--cream-300); padding: var(--sp-5); border-radius: var(--radius-lg); text-decoration: none; display: block; background: var(--white);">
            <div style="font-size: 1.5rem; background: var(--sage-100); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); margin-bottom: var(--sp-3);">⏳</div>
            <h3 style="font-size: var(--text-base); font-weight: 600; color: var(--charcoal); margin: 0 0 var(--sp-2) 0;">Recupera el tiempo para tu retiro</h3>
            <p style="font-size: var(--text-sm); color: var(--stone-500); margin: 0;">Estrategias agresivas para quienes empiezan a ahorrar después de los 40.</p>
          </a>
        </div>
      </div>
    </section>
    `;

    // Insertar después de tools-section
    content = content.replace('</section>\n\n<!-- CÓMO FUNCIONA -->', `</section>\n\n${guiasSection}\n\n<!-- CÓMO FUNCIONA -->`);
    fs.writeFileSync(home, content, 'utf8');
    console.log('Updated', home, 'with Guias mas leidas');
  }
}
