---
name: Boton Cancelar
description: Estándar para el botón de "Cancelar" con icono SVG específico y estilos consistentes (Gris secundario).
---

# Boton Cancelar

Este skill define el estándar para los botones de "Cancelar" en toda la aplicación, utilizando un SVG inline específico y un fondo gris claro, comúnmente utilizado para acciones secundarias en modales.

## Estructura HTML

```html
<button id="[ID_DEL_BOTON]" type="button"
    class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
    <!-- Icono SVG: X (Close) -->
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
    <span>Cancelar</span>
</button>
```

## Detalles de Implementación

1.  **Clases CSS (Tailwind)**:
    *   `bg-gray-200`: Fondo gris claro base (acción secundaria).
    *   `hover:bg-gray-300`: Fondo gris más oscuro al pasar el mouse.
    *   `text-gray-800`: Texto gris oscuro para contraste.
    *   `font-bold`: Texto en negrita.
    *   `py-2 px-4`: Padding estándar.
    *   `rounded-lg`: Bordes redondeados.
    *   `shadow-md`: Sombra media.
    *   `transition-transform transform hover:scale-105`: Efecto de escala al hover.
    *   `flex items-center gap-2`: Alineación flex con separación.

2.  **Icono SVG**:
    *   Standard `feather-x` icon.
    *   `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="2"`.

## Ejemplo de Uso (JavaScript Template)

```javascript
const btnCancelar = `
    <button type="button"
        class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <span>Cancelar</span>
    </button>
`;
```
