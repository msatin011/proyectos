---
name: Boton Guardar
description: Estándar para el botón de "Guardar" con icono SVG específico y estilos consistentes (Azul primario).
---

# Boton Guardar

Este skill define el estándar para los botones de "Guardar" en toda la aplicación, utilizando un SVG inline específico y un fondo azul sólido, comúnmente utilizado en los pies de página de los modales.

## Estructura HTML

```html
<button id="[ID_DEL_BOTON]" type="submit"
    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
    <!-- Icono SVG: Save -->
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
    <span>Guardar</span>
</button>
```

## Detalles de Implementación

1.  **Clases CSS (Tailwind)**:
    *   `bg-blue-600`: Fondo azul primario base.
    *   `hover:bg-blue-700`: Fondo azul más oscuro al pasar el mouse.
    *   `text-white`: Texto blanco.
    *   `font-bold`: Texto en negrita.
    *   `py-2 px-4`: Padding estándar.
    *   `rounded-lg`: Bordes redondeados.
    *   `shadow-md`: Sombra media.
    *   `transition-transform transform hover:scale-105`: Efecto de escala al hover.
    *   `flex items-center gap-2`: Alineación flex con separación.

2.  **Icono SVG**:
    *   Standard `feather-save` icon.
    *   `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="2"`.

## Ejemplo de Uso (JavaScript Template)

```javascript
const btnGuardar = `
    <button type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>Guardar</span>
    </button>
`;
```
