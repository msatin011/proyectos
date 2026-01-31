---
name: Boton Modificar
description: Estándar para el botón de "Modificar" (Editar) con icono SVG específico y estilos consistentes.
---

# Boton Modificar

Este skill define el estándar para los botones de "Modificar" o "Editar" en toda la aplicación, utilizando un SVG inline específico.

## Estructura HTML

```html
<button id="[ID_DEL_BOTON]"
    class="gradiente hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
    <!-- Icono SVG: Edit (Pencil) -->
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
        <path d="m15 5 4 4" />
    </svg>
    <span>Modificar</span>
</button>
```

## Detalles de Implementación

1.  **Clases CSS (Tailwind)**:
    *   `gradiente`: Fondo base.
    *   `hover:bg-blue-600`: Color azul al pasar el mouse (distintivo para editar).
    *   Resto de clases (`text-white`, `font-bold`, `py-2 px-4`, `rounded-lg`, `shadow-md`, `transition-transform`, `transform`, `hover:scale-105`, `flex`, `items-center`, `gap-2`) idénticas al botón de agregar para consistencia.

2.  **Icono SVG**:
    *   Debe ser un `<svg>` inline con `width="24"`, `height="24"`, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`.
    *   Paths: Diseño de lápiz/edición.

## Ejemplo de Uso (JavaScript Template)

```javascript
/* En un módulo JS (ej: cliente.js) */
const btnModificar = `
    <button id="btn-modificar-cli"
        class="gradiente hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
            <path d="m15 5 4 4" />
        </svg>
        <span>Modificar</span>
    </button>
`;
```
