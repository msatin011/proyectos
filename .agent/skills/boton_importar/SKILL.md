---
name: Boton Importar
description: Estándar para el botón de "Importar" con icono SVG específico y estilos consistentes.
---

# Boton Importar

Este skill define el estándar para los botones de "Importar" en toda la aplicación, utilizando un SVG inline específico.

## Estructura HTML

```html
<button id="[ID_DEL_BOTON]"
    class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
    <!-- Icono SVG: Import/Download -->
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
    <span>Importar</span>
</button>
```

## Detalles de Implementación

1.  **Clases CSS (Tailwind)**:
    *   `gradiente`: Fondo base.
    *   `hover:bg-gray-600`: Color gris oscuro al pasar el mouse (para distinguir de Agregar/Modificar).
    *   Resto de clases (`text-white`, `font-bold`, `py-2 px-4`, `rounded-lg`, `shadow-md`, `transition-transform`, `transform`, `hover:scale-105`, `flex`, `items-center`, `gap-2`) idénticas a los otros botones.

2.  **Icono SVG**:
    *   Debe ser un `<svg>` inline con `width="24"`, `height="24"`, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`.
    *   Paths: Flecha hacia abajo indicando importación/descarga.

## Ejemplo de Uso (JavaScript Template)

```javascript
/* En un módulo JS (ej: cliente.js) */
const btnImportar = `
    <button id="btn-importar-cli"
        class="gradiente hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
        <span>Importar</span>
    </button>
`;
```
