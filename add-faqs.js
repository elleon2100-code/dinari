const fs = require('fs');
const path = require('path');

const faqs = {
  'como-salir-de-deudas.mdx': `

---

## Preguntas Frecuentes sobre cómo salir de deudas

### ¿Debo pagar la deuda más grande o la más pequeña primero?
A nivel puramente matemático, siempre es mejor pagar primero la deuda con la tasa de interés más alta (Método Avalancha). Sin embargo, a nivel psicológico, pagar primero la deuda más pequeña (Método Bola de Nieve) te da victorias rápidas que te motivan a no abandonar el proceso.

### ¿Consolidar mis deudas arruinará mi crédito?
No. Solicitar el préstamo de consolidación bajará tu score unos pocos puntos por la "consulta dura" inicial, pero al liquidar tus tarjetas a tope, tu porcentaje de utilización bajará drásticamente, lo cual disparará tu score hacia arriba a mediano plazo.

### ¿Es buena idea usar mis ahorros para pagar deudas?
Depende. Nunca uses tu fondo de emergencia de supervivencia, ya que podrías necesitarlo mañana. Pero si tienes "ahorros" ganando un 5% de interés mientras pagas tarjetas al 60%, matemáticamente estás perdiendo dinero todos los días. Usa parte de esos ahorros para matar la deuda tóxica.`,

  'crear-un-presupuesto.mdx': `

---

## Preguntas Frecuentes sobre el presupuesto

### ¿Qué pasa si mis gastos básicos superan el 50% de mis ingresos?
En Latinoamérica, debido al costo de la vivienda y la inflación, es muy común que las necesidades básicas consuman el 60% o 70%. En este caso, ajusta la regla a 70/15/15. Lo importante no es cumplir a rajatabla el porcentaje de los libros estadounidenses, sino tener una estructura clara.

### ¿Debo incluir deudas en el presupuesto?
Sí. Los pagos mínimos obligatorios entran en tu categoría de "Necesidades Básicas" (el 50%). Cualquier pago extraordinario o abono extra a capital que hagas para salir de deudas más rápido, entra en la categoría de "Tu Futuro" (el 20%).

### Me rindo rápido al presupuestar, ¿qué hago?
Deja de intentar registrar cada centavo manualmente. Usa la automatización de tu banco para apartar el dinero de tus gastos fijos y tu ahorro el mismo día que cobras. Si el dinero de los gastos variables (el 30%) es lo único que ves en tu cuenta principal, no podrás gastar de más.`,

  'el-peligro-del-pago-minimo.mdx': `

---

## Preguntas Frecuentes sobre el Pago Mínimo

### ¿Pagar solo el mínimo afecta mi historial crediticio?
Pagar el mínimo te mantiene "al día" y evita recargos por mora, pero indirectamente destruye tu score. Al no bajar tu deuda principal, tu porcentaje de "utilización de crédito" se mantiene altísimo, lo que alerta a los burós de que estás financieramente estresado.

### ¿Si pago el doble del mínimo, acabo más rápido?
¡Por supuesto! Abonar cualquier cantidad por encima del pago mínimo exigido va 100% destinado a reducir el capital principal (la raíz de la deuda). Esto genera un efecto dominó que reduce drásticamente los intereses que pagarás el mes siguiente.

### ¿Qué pasa si un mes no puedo pagar ni siquiera el mínimo?
Entrarás en mora. El banco te cobrará comisiones por atraso (late fees), intereses moratorios (más altos que los normales) y, después de 30 días, lo reportará al buró de crédito. Si estás en esta situación, llama a tu banco antes de la fecha límite y trata de negociar un plan de pagos o reestructuración.`,

  'fondo-de-emergencia.mdx': `

---

## Preguntas Frecuentes sobre el Fondo de Emergencia

### ¿Dónde exactamente debo guardar mi fondo de emergencia?
Nunca en efectivo ni en tu cuenta corriente principal donde gastas. Ábrele una "Cajita" o "Apartado" en tu app bancaria, o mejor aún, mételo en una Cuenta de Ahorro de Alto Rendimiento que te pague intereses mensuales y puedas sacar el dinero el mismo día si lo necesitas.

### ¿Debo invertir mi fondo de emergencia en la bolsa?
**Rotundamente no.** Si hay una crisis económica, la bolsa puede caer un 30% exactamente en el mismo mes que pierdes tu trabajo. Te verías obligado a vender tus inversiones con pérdidas. El fondo de emergencia no es una inversión para ganar dinero, es un seguro para darte paz mental.

### ¿Qué pasa si tengo que usarlo?
Para eso está. Úsalo sin culpa. Una vez que pase la crisis y tus finanzas se estabilicen, pausa tus aportes a otras metas temporalmente y vuelve a redirigir ese dinero hasta reponer tu fondo de emergencia a su nivel óptimo.`,

  'hoja-de-ruta-financiera.mdx': `

---

## Preguntas Frecuentes sobre tu plan financiero

### ¿Puedo saltarme un paso de la hoja de ruta?
No es recomendable. La hoja de ruta financiera está diseñada en orden por una razón matemática y psicológica. Si intentas invertir (Paso 4) antes de matar tus deudas tóxicas (Paso 2), los intereses del 60% en tus tarjetas anularán cualquier ganancia del 8% que hagas en la bolsa.

### ¿Cuánto tiempo me tomará completar todos los pasos?
Depende enteramente de tu nivel de ingresos y el tamaño de tus deudas iniciales. Algunas personas completan los primeros 3 pasos en 18 meses, mientras que otras tardan 3 a 5 años. Lo importante no es la velocidad, sino nunca caminar hacia atrás.

### ¿En qué momento puedo empezar a disfrutar mi dinero?
¡Desde el primer mes! Tu presupuesto siempre debe incluir una pequeña partida para "Estilo de Vida". Si conviertes tus finanzas en un castigo y te privas de todo, abandonarás la hoja de ruta por completo. Disciplina no es sinónimo de sufrimiento.`,

  'metodo-bola-de-nieve.mdx': `

---

## Preguntas Frecuentes sobre el Método Bola de Nieve

### ¿Por qué la bola de nieve no toma en cuenta los intereses?
Porque la bola de nieve asume que el comportamiento humano es más importante que la matemática pura. Si te enfocas en una deuda inmensa solo por su alto interés, tardarás meses sin ver progreso y te rendirás. Pagar la más pequeña primero te da un pico de dopamina que te ayuda a mantener el hábito.

### ¿Debo dejar de pagar las otras deudas mientras ataco la primera?
**No. ¡Nunca!** El método consiste en hacer el **pago mínimo exacto** en todas tus deudas, excepto en la más pequeña. A esa deuda más pequeña le lanzas el mínimo más todo el dinero extra que hayas podido ahorrar o ganar en el mes, hasta fulminarla.

### ¿Qué pasa si dos deudas tienen exactamente el mismo saldo?
En ese caso, sí aplicas la lógica matemática: ataca primero la que tenga la tasa de interés más alta. Así obtendrás el impacto psicológico rápido ahorrando la mayor cantidad de dinero posible.`,

  'retiro-tardio.mdx': `

---

## Preguntas Frecuentes sobre el retiro tardío

### ¿Aún vale la pena empezar a ahorrar a los 50 años?
Totalmente. A los 50 años, es probable que estés en el pico de tus ingresos y tus gastos (hijos, universidad) estén bajando. Esto te permite tener una tasa de ahorro agresiva (ej. 30% de tu sueldo), compensando con capital la falta de tiempo para el interés compuesto.

### ¿Dónde invierto si ya no tengo mucho tiempo?
Si tienes poco tiempo para recuperarte de una crisis del mercado, no debes poner el 100% de tu dinero en acciones de alto riesgo. Debes buscar un equilibrio (por ejemplo, 60% en fondos indexados globales y 40% en bonos gubernamentales o instrumentos de renta fija) que te proteja de caídas abruptas.

### ¿Debería usar mi plan de pensiones (AFP/Afore) o hacerlo por mi cuenta?
Usa ambos. Las aportaciones voluntarias a tu cuenta de retiro oficial suelen tener beneficios fiscales (deducción de impuestos) que te dan un retorno automático. Una vez maximizados esos beneficios, complementa con un portafolio personal en una casa de bolsa regulada.`
};

for (const [filename, contentToAdd] of Object.entries(faqs)) {
  const filePath = path.join('astro-blog/src/content/guias', filename);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('## Preguntas Frecuentes')) {
      fs.appendFileSync(filePath, contentToAdd, 'utf8');
      console.log('Added FAQ to ' + filename);
    } else {
      console.log('FAQ already exists in ' + filename);
    }
  }
}
