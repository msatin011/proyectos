---
name: Boton Eliminar
description: Estándar para el botón de "Eliminar" con icono SVG específico y estilos consistentes (Rojo).
---

# Boton Eliminar

Este skill define el estándar para los botones de "Eliminar" (Baja) en toda la aplicación, utilizando un SVG inline específico y un fondo rojo distintivo.

## Estructura HTML

```html
<button id="[ID_DEL_BOTON]"
    class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
    <!-- Icono SVG: Trash -->
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
    <span>Eliminar</span>
</button>
```

## Detalles de Implementación

1.  **Clases CSS (Tailwind)**:
    *   `bg-red-600`: Fondo rojo base.
    *   `hover:bg-red-700`: Fondo rojo más oscuro al pasar el mouse.
    *   `text-white`: Texto blanco.
    *   Resto de clases (`font-bold`, `py-2 px-4`, `rounded-lg`, `shadow-md`, `transition-transform`, `transform`, `hover:scale-105`, `flex`, `items-center`, `gap-2`) idénticas a los otros botones para consistencia.

2.  **Icono SVG**:
    *   Debe ser un `<svg>` inline con `width="24"`, `height="24"`, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`.
    *   Paths: Diseño de cesto de basura (`M3 6h18...`).

## Ejemplo de Uso (JavaScript Template)

```javascript
/* En un módulo JS (ej: cliente.js) */
const btnEliminar = `
    <button id="btn-eliminar-cli"
        class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
        <span>Eliminar</span>
    </button>
`;
```
