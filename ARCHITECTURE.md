# Arquitectura del Ecosistema Inteligente de Midinari

Este documento describe la infraestructura compartida ("core") diseñada para unificar el comportamiento de todas las herramientas y calculadoras de Midinari a través de un perfil financiero único almacenado de forma segura en `LocalStorage`.

---

## 📂 Estructura de Archivos

Los archivos que componen el núcleo se ubican en la carpeta `/js/core/`:

1. **`storage.js`**: Abstracción de bajo nivel para interactuar con `LocalStorage` bajo una única clave: `midinariProfile`.
2. **`profile.js`**: Gestión y estructura del perfil unificado del usuario. Contiene valores predeterminados y funciones de lectura/escritura seguras.
3. **`recommendation-engine.js`**: Motor preparado para procesar reglas financieras inteligentes basadas en los datos de perfil del usuario.
4. **`utils.js`**: Colección de funciones de utilidad comunes (formateo de moneda, acotación numérica, redondeo seguro, etc.).

---

## 🔧 Integración en una Calculadora/Herramienta

Para utilizar esta infraestructura en cualquier herramienta existente o futura de Midinari, se deben seguir los siguientes pasos:

### 1. Inclusión de Scripts en el HTML

En el archivo `index.html` de la herramienta, se deben referenciar los archivos del núcleo en la cabecera o al final del `body` **antes** de cargar el script específico de la calculadora:

```html
<!-- Cargar Core de Midinari primero -->
<script src="../js/core/storage.js" defer></script>
<script src="../js/core/profile.js" defer></script>
<script src="../js/core/recommendation-engine.js" defer></script>
<script src="../js/core/utils.js" defer></script>

<!-- Cargar Script de la calculadora específica -->
<script src="../js/mi-calculadora.js" defer></script>
```

---

## 💻 Uso de la API del Core desde JavaScript

Una vez cargados, los módulos quedan expuestos en el objeto global `window` para ser utilizados directamente.

### 1. Leer Datos del Perfil
Al iniciar la calculadora, se recomienda leer el perfil del usuario para rellenar automáticamente los campos del formulario con los valores históricos guardados.

```javascript
// Obtener el perfil unificado actual
const perfil = window.MidinariProfile.getProfile();

// Rellenar entradas de la interfaz
document.getElementById('input-ingresos').value = perfil.ingresosMensuales || '';
document.getElementById('input-gastos').value = perfil.gastosMensuales || '';
```

### 2. Guardar o Actualizar Datos del Perfil
Cada vez que el usuario realice un cálculo exitoso o modifique datos financieros clave, se debe actualizar el perfil compartido de forma parcial.

```javascript
// Capturar nuevos datos calculados o ingresados
const nuevosGastos = parseFloat(document.getElementById('input-gastos').value) || 0;

// Actualizar el perfil compartido de forma parcial
window.MidinariProfile.updateProfile({
  gastosMensuales: nuevosGastos
});
```

### 3. Usar Helpers de Formateo
Evita volver a escribir formateadores de números o monedas locales. Utiliza `MidinariUtils`.

```javascript
const valorFormateado = window.MidinariUtils.formatCurrency(50000, 'es-DO', 'DOP'); 
// Retorna: "RD$50,000"
```

### 4. Consultar Recomendaciones Inteligentes
Puedes pasar el perfil al motor de recomendaciones en cualquier momento para obtener consejos educativos dirigidos.

```javascript
const perfil = window.MidinariProfile.getProfile();
const recomendaciones = window.MidinariRecommendationEngine.getRecommendations(perfil);

if (recomendaciones.length > 0) {
  // Renderizar recomendaciones en el panel informativo
}
```

---

## ⚡ Buenas Prácticas
- **Inmutable**: No modifiques los archivos en `/js/core/` para agregar lógica específica de una sola calculadora. Extiende tu script específico.
- **Seguridad frente a nulos**: Al leer cualquier campo del perfil, utiliza desestructuración o valores fallback (ej. `perfil.ingresosMensuales || 0`) para evitar errores en consola si el perfil es nuevo.
- **Rendimiento**: Evita guardar datos masivos en el perfil. Solo almacena los KPI financieros consolidados.
