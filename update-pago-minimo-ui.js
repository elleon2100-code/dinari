const fs = require('fs');

const file = 'simulador-pago-minimo/index.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Reemplazar Hero
const newHero = `
<section class="page-hero" aria-labelledby="page-title">
  <div class="container">
    <nav class="page-hero__breadcrumb" aria-label="Ruta de navegación">
      <a href="../">Inicio</a>
      <span aria-hidden="true">›</span>
      <span>Pago Mínimo</span>
    </nav>
    <div class="page-hero__eyebrow">
      <span class="badge badge--danger" style="background:rgba(220,38,38,0.1);color:#dc2626;">Herramienta Financiera</span>
    </div>
    <h1 class="display-2 page-hero__title" id="page-title">
      Descubre cuánto tiempo te atrapará el pago mínimo
    </h1>
    <p class="body-lg page-hero__subtitle" style="margin-bottom: var(--sp-4);">
      Pagar el mínimo puede hacer que una deuda dure años, aunque pagues religiosamente todos los meses. Averigua hoy mismo tu verdadera fecha de salida.
    </p>
    <ul style="list-style: none; padding: 0; margin-bottom: var(--sp-6); text-align: left; display: inline-block; color: var(--stone-500);">
      <li style="margin-bottom: 8px;">✅ Descubre cuánto terminarás pagando realmente</li>
      <li style="margin-bottom: 8px;">✅ Ve cuánto dinero se evapora en intereses</li>
      <li>✅ Simula escenarios reales en segundos</li>
    </ul>
    <p style="font-size: var(--text-xs); color: var(--stone-400); font-style: italic;">
      * Simulación educativa basada en tasas promedio de tarjetas de crédito en LATAM.
    </p>
  </div>
</section>
`;
content = content.replace(/<section class="page-hero"[^>]*>[\s\S]*?<\/section>/, newHero.trim());

// 2. Tabla Comparativa (Inyectar justo antes de <div class="amort-section">)
const compTable = `
        <!-- Tabla Comparativa Dinámica -->
        <div class="comp-table-section" style="margin-top: var(--sp-8); margin-bottom: var(--sp-8);">
          <h3 style="font-size: var(--text-lg); margin-bottom: var(--sp-4);">Comparativa: Mínimo vs Alternativo</h3>
          <div style="overflow-x: auto;">
            <table class="amort-table">
              <thead>
                <tr>
                  <th scope="col">Estrategia</th>
                  <th scope="col">Tiempo Total</th>
                  <th scope="col">Intereses Pagados</th>
                  <th scope="col">Total Desembolsado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Pago Mínimo</strong></td>
                  <td id="comp-time-min">—</td>
                  <td class="td-interest" id="comp-int-min">—</td>
                  <td id="comp-total-min">—</td>
                </tr>
                <tr style="background-color: var(--sage-50);">
                  <td style="color: var(--sage-700);"><strong>Pago Alternativo</strong></td>
                  <td id="comp-time-alt" style="font-weight: bold; color: var(--sage-700);">—</td>
                  <td class="td-interest" id="comp-int-alt" style="font-weight: bold; color: var(--sage-700);">—</td>
                  <td id="comp-total-alt" style="font-weight: bold; color: var(--sage-700);">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p id="comp-emotional" style="margin-top: var(--sp-3); font-size: var(--text-sm); color: var(--sage-600); font-weight: 600;"></p>
        </div>
`;
content = content.replace('<div class="amort-section">', `${compTable}\n        <div class="amort-section">`);

// 3. Reemplazar sección SEO
const seoStart = '<!-- CONTENIDO SEO -->';
const seoEnd = '</main>';
const newSEO = `
<!-- CONTENIDO SEO -->
<section class="container" style="max-width:800px; padding-bottom:var(--sp-12);">
  <article class="article-content">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-6);">
      <span style="font-size:var(--text-sm); color:var(--stone-400);">⏱️ Tiempo estimado de lectura: 5 min</span>
    </div>

    <h2>Por qué las deudas parecen no bajar aunque sigas pagando</h2>
    <p>La trampa del pago mínimo es una de las más rentables para los bancos. Cuando recibes tu estado de cuenta, el "Pago Mínimo" suele estar resaltado, creando un efecto ancla en tu cerebro. Asumes que es la cantidad sugerida para mantener tus finanzas sanas.</p>
    <p>La realidad en América Latina es más cruda. El pago mínimo suele calcularse como apenas el <strong>2% al 5% de tu saldo total</strong>, o una pequeña tarifa fija. Esto genera un problema matemático grave:</p>
    <ul>
      <li><strong>Jerarquía de pagos:</strong> El banco siempre se cobra los intereses del mes primero, además de seguros y comisiones.</li>
      <li><strong>Abono a capital:</strong> Al ser un pago tan bajo, casi todo tu dinero se va en cubrir esos intereses. Lo que sobra para reducir tu deuda real (el capital) son migajas.</li>
      <li><strong>Ejemplo realista:</strong> Si debes $10,000 con una tasa del 60% anual, en tu primer mes generarás $500 de puro interés. Si tu pago mínimo es de $600, solo $100 se restan de tu deuda. ¡El 83% de tu esfuerzo se evaporó!</li>
    </ul>

    <h2>4 Errores comunes que te mantienen endeudado</h2>
    <div style="display:grid; gap:var(--sp-4); margin-bottom:var(--sp-8);">
      <details style="background:var(--white); border:1px solid var(--cream-300); border-radius:var(--radius-md); padding:var(--sp-4);">
        <summary style="font-weight:600; cursor:pointer; color:var(--charcoal);">❌ Seguir usando la tarjeta mientras pagas</summary>
        <p style="margin-top:var(--sp-2); font-size:var(--text-sm); color:var(--stone-500);">Si abonas $500 y al día siguiente gastas $600 en el supermercado con la misma tarjeta, estás cavando un hoyo más profundo. Es vital "congelar" la tarjeta temporalmente.</p>
      </details>
      <details style="background:var(--white); border:1px solid var(--cream-300); border-radius:var(--radius-md); padding:var(--sp-4);">
        <summary style="font-weight:600; cursor:pointer; color:var(--charcoal);">❌ Ignorar el CAT (Costo Anual Total)</summary>
        <p style="margin-top:var(--sp-2); font-size:var(--text-sm); color:var(--stone-500);">Muchos solo miran el pago mensual y no la tasa anual. Una tarjeta con 80% de interés requiere una estrategia de pago radicalmente distinta (avalancha) a una del 20%.</p>
      </details>
      <details style="background:var(--white); border:1px solid var(--cream-300); border-radius:var(--radius-md); padding:var(--sp-4);">
        <summary style="font-weight:600; cursor:pointer; color:var(--charcoal);">❌ Consolidar deuda sin cambiar hábitos</summary>
        <p style="margin-top:var(--sp-2); font-size:var(--text-sm); color:var(--stone-500);">Sacar un préstamo para pagar tarjetas funciona matemáticamente, pero si no cortas los gastos que causaron la deuda, terminarás con el préstamo Y las tarjetas llenas de nuevo.</p>
      </details>
      <details style="background:var(--white); border:1px solid var(--cream-300); border-radius:var(--radius-md); padding:var(--sp-4);">
        <summary style="font-weight:600; cursor:pointer; color:var(--charcoal);">❌ Usar adelantos de efectivo</summary>
        <p style="margin-top:var(--sp-2); font-size:var(--text-sm); color:var(--stone-500);">Sacar efectivo de una tarjeta para pagar otra es el inicio del fin. Los adelantos de efectivo cobran comisiones instantáneas y tasas de interés aún más altas.</p>
      </details>
    </div>

    <h2>Qué puedes hacer ahora mismo</h2>
    <div class="tools-grid" style="display: grid; gap: var(--sp-4); grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-bottom:var(--sp-8);">
      <a href="../simulador-deudas/index.html" class="tool-card" style="border: 1px solid var(--cream-300); padding: var(--sp-5); border-radius: var(--radius-lg); text-decoration: none; display: block; background: var(--white);">
        <div style="font-size: 1.5rem; background: var(--sage-100); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); margin-bottom: var(--sp-3);">📊</div>
        <h3 style="font-size: var(--text-base); font-weight: 600; color: var(--charcoal); margin: 0 0 var(--sp-2) 0;">Simulador Inteligente de Deudas</h3>
        <p style="font-size: var(--text-sm); color: var(--stone-500); margin: 0;">Organiza todas tus deudas y crea un plan maestro para pagarlas.</p>
      </a>
      <a href="../metodo-bola-de-nieve/index.html" class="tool-card" style="border: 1px solid var(--cream-300); padding: var(--sp-5); border-radius: var(--radius-lg); text-decoration: none; display: block; background: var(--white);">
        <div style="font-size: 1.5rem; background: var(--cream-100); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); margin-bottom: var(--sp-3);">⛄</div>
        <h3 style="font-size: var(--text-base); font-weight: 600; color: var(--charcoal); margin: 0 0 var(--sp-2) 0;">Método Bola de Nieve</h3>
        <p style="font-size: var(--text-sm); color: var(--stone-500); margin: 0;">Descubre por qué pagar la deuda más pequeña primero funciona psicológicamente.</p>
      </a>
    </div>

    <h2>Preguntas frecuentes</h2>
    
    <h3>¿Qué pasa si solo pago el mínimo?</h3>
    <p>Mantienes tu tarjeta "al día" y evitas reportes negativos en tu historial de crédito temporalmente, pero terminas pagando tu compra original dos, tres o hasta cuatro veces debido a la acumulación implacable de intereses, alargando tu deuda por décadas.</p>
    
    <h3>¿Cuánto tarda una tarjeta de crédito en pagarse?</h3>
    <p>Depende de la tasa de interés y de tu pago. Si pagas solo el mínimo de una deuda de $50,000 al 60% anual, podrías tardar entre 8 y 15 años en saldarla. Cada $100 extras que aportes por encima del mínimo reduce drásticamente esos años.</p>
    
    <h3>¿El pago mínimo afecta el crédito?</h3>
    <p>Pagar el mínimo se reporta como un "pago a tiempo", por lo que no daña tu historial por impago. Sin embargo, mantiene tu <strong>índice de utilización de crédito alto</strong>, lo cual sí baja tu puntuación crediticia, haciéndote lucir riesgoso ante otros bancos.</p>

    <h3>¿Qué interés cobran las tarjetas en América Latina?</h3>
    <p>Es uno de los mercados más costosos del mundo. En países como República Dominicana, México o Colombia, las tasas anuales (CAT) para tarjetas clásicas suelen rondar entre el 45% y el 85%. Por eso es vital no financiar estilo de vida con ellas.</p>

    <h3>¿Conviene consolidar deuda?</h3>
    <p>Solo si cumples dos condiciones: 1) Consigues un préstamo con una tasa sustancialmente menor a la de tus tarjetas, y 2) Tienes la disciplina absoluta de no volver a usar las tarjetas de crédito una vez que las hayas pagado con el nuevo préstamo.</p>

    <div style="margin-top:var(--sp-12); padding-top:var(--sp-8); border-top:1px solid var(--cream-300);">
      <h3 style="font-size:var(--text-sm); color:var(--stone-400);">Fuentes y Metodología (E-E-A-T)</h3>
      <p style="font-size:var(--text-xs); color:var(--stone-500);">Los cálculos de esta herramienta utilizan la fórmula estándar de amortización de préstamos revolving (interés simple sobre saldo insoluto). Textos educativos fundamentados en mejores prácticas de la <em>Consumer Financial Protection Bureau (CFPB)</em> y promedios de tasas reportados por los Bancos Centrales de LATAM (ej. Banco Central de la República Dominicana). No constituye asesoría financiera oficial.</p>
    </div>

  </article>
</section>

<!-- Sticky Mobile CTA -->
<div class="sticky-cta-mobile" aria-hidden="true">
  <button onclick="window.scrollTo({top:0, behavior:'smooth'});" class="btn btn--sage btn--lg sticky-cta-btn">
    🔄 Calcular otra deuda
  </button>
</div>
<style>
  .sticky-cta-mobile { display: none; }
  @media (max-width: 768px) {
    .sticky-cta-mobile {
      display: block; position: fixed; bottom: -100px; left: 0; width: 100%;
      padding: var(--sp-4);
      background: linear-gradient(to top, rgba(255,255,255,1) 60%, rgba(255,255,255,0));
      z-index: 50; transition: bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    }
    .sticky-cta-mobile.visible { bottom: 0; }
    .sticky-cta-btn { width: 100%; box-shadow: 0 4px 15px rgba(92,128,96,0.4); pointer-events: auto; }
  }
</style>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const stickyCta = document.querySelector('.sticky-cta-mobile');
    if (!stickyCta) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 800) {
        stickyCta.classList.add('visible');
        stickyCta.setAttribute('aria-hidden', 'false');
      } else {
        stickyCta.classList.remove('visible');
        stickyCta.setAttribute('aria-hidden', 'true');
      }
    }, { passive: true });
  });
</script>
`;

const startIndex = content.indexOf(seoStart);
const endIndex = content.lastIndexOf(seoEnd);
if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + newSEO + '\n' + content.slice(endIndex);
}

fs.writeFileSync(file, content, 'utf8');
