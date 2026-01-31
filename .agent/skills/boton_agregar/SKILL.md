---
name: Boton Agregar
description: Estándar para el botón de "Agregar" con icono SVG específico y estilos consistentes.
---

# Boton Agregar

Este skill define el estándar para los botones de "Agregar" (Alta) en toda la aplicación, reemplazando el uso de Font Awesome con un SVG inline específico.

## Estructura HTML

```html
<button id="[ID_DEL_BOTON]"
    class="gradiente hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
    <!-- Icono SVG: Plus -->
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14" />
        <path d="M12 5v14" />
    </svg>
    <span>Agregar</span>
</button>
```

## Detalles de Implementación

1.  **Clases CSS (Tailwind)**:
    *   `gradiente`: Clase personalizada (definida en `tailwind.input.css` o `index.css`) para el fondo base.
    *   `hover:bg-green-600`: Cambio de color al pasar el mouse (si `gradiente` no lo cubre o para validaciones visuales).
    *   `text-white`: Texto blanco.
    *   `font-bold`: Texto en negrita.
    *   `py-2 px-4`: Padding vertical y horizontal.
    *   `rounded-lg`: Bordes redondeados grandes.
    *   `shadow-md`: Sombra media.
    *   `transition-transform transform hover:scale-105`: Animación de escala al hacer hover.
    *   `flex items-center gap-2`: Flexbox para alinear el icono y el texto con separación.

2.  **Icono SVG**:
    *   Debe ser un `<svg>` inline con `width="24"`, `height="24"`, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`.
    *   Paths: Línea horizontal (`M5 12h14`) y vertical (`M12 5v14`) centradas.

## Ejemplo de Uso (JavaScript Template)

```javascript
/* En un módulo JS (ej: cliente.js) */
const btnAlta = `
    <button id="btn-alta-cli"
        class="gradiente hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
        <span>Agregar</span>
    </button>
`;
```
