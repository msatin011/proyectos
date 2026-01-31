---
name: Boton Exportar
description: Estándar para el botón de "Exportar" con icono SVG específico y estilos consistentes.
---

# Boton Exportar

Este skill define el estándar para los botones de "Exportar" en toda la aplicación, utilizando un SVG inline específico.

## Estructura HTML

```html
<button id="[ID_DEL_BOTON]"
    class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
    <!-- Icono SVG: Export/Upload -->
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
    <span>Exportar</span>
</button>
```

## Detalles de Implementación

1.  **Clases CSS (Tailwind)**:
    *   `gradiente`: Fondo base.
    *   `hover:bg-gray-600`: Color gris oscuro al pasar el mouse.
    *   Resto de clases (`text-white`, `font-bold`, `py-2 px-4`, `rounded-lg`, `shadow-md`, `transition-transform`, `transform`, `hover:scale-105`, `flex`, `items-center`, `gap-2`) idénticas a los otros botones.

2.  **Icono SVG**:
    *   Debe ser un `<svg>` inline con `width="24"`, `height="24"`, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`.
    *   Paths: Flecha hacia arriba indicando exportación/subida.

## Ejemplo de Uso (JavaScript Template)

```javascript
/* En un módulo JS (ej: cliente.js) */
const btnExportar = `
    <button id="btn-exportar-cli"
        class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        <span>Exportar</span>
    </button>
`;
```
