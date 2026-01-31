---
name: Boton Salir
description: Estándar para el botón de "Salir" con icono SVG específico y estilos consistentes.
---

# Boton Salir

Este skill define el estándar para los botones de "Salir" en toda la aplicación, utilizando un SVG inline específico.

## Estructura HTML

```html
<button id="[ID_DEL_BOTON]"
    class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
    <!-- Icono SVG: Log Out -->
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
    <span>Salir</span>
</button>
```

## Detalles de Implementación

1.  **Clases CSS (Tailwind)**:
    *   `gradiente`: Fondo base.
    *   `hover:bg-gray-600`: Color gris oscuro al pasar el mouse.
    *   `text-white`: Texto blanco.
    *   Resto de clases (`font-bold`, `py-2 px-4`, `rounded-lg`, `shadow-md`, `transition-transform`, `transform`, `hover:scale-105`, `flex`, `items-center`, `gap-2`) idénticas a los otros botones para consistencia.

2.  **Icono SVG**:
    *   Debe ser un `<svg>` inline con `width="24"`, `height="24"`, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`.
    *   Paths: Icono de salida (puerta/flecha).

## Ejemplo de Uso (JavaScript Template)

```javascript
/* En un módulo JS (ej: cliente.js) */
const btnSalir = `
    <button id="btn-salir-cli"
        class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Salir</span>
    </button>
`;
```
