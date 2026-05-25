const fs = require('fs');
const path = require('path');

const mappings = {
  'como-salir-de-deudas.mdx': 'Métodos para salir de deudas',
  'crear-un-presupuesto.mdx': 'Finanzas personales reales',
  'el-peligro-del-pago-minimo.mdx': 'Tarjetas de crédito y pago mínimo',
  'fondo-de-emergencia.mdx': 'Finanzas personales reales',
  'hoja-de-ruta-financiera.mdx': 'Finanzas personales reales',
  'interes-compuesto-en-contra.mdx': 'Tarjetas de crédito y pago mínimo',
  'metodo-bola-de-nieve.mdx': 'Métodos para salir de deudas',
  'por-que-baja-mi-score-crediticio.mdx': 'Score crediticio',
  'retiro-tardio.mdx': 'Finanzas personales reales'
};

const dir = 'astro-blog/src/content/guias';

for (const [file, category] of Object.entries(mappings)) {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace category: "Guías fundamentales" or whatever it is
    content = content.replace(/category:\s*".*?"/, `category: "${category}"`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated category for', file);
  }
}
