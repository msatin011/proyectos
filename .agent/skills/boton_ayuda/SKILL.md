---
name: Boton Ayuda
description: Estándar para el botón de "Ayuda" aplicando el estilo del manual y utilizando un icono SVG integrado.
---

# Boton Ayuda

Este skill define el estándar para los botones de "Ayuda", combinando el estilo visual del manual de usuario con un icono SVG vectorial estándar para mayor nitidez y consistencia.

## Estructura HTML

```html
<button id="[ID_DEL_BOTON]"
    class="flex items-center justify-center gap-2 rounded-md shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-white font-medium text-sm"
    style="width: 140px; padding: 0.5rem 0.75rem; background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%); border: 0.5px solid #888;">
    <!-- Icono SVG: Help Circle -->
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
    <span>Ayuda</span>
</button>
```

## Detalles de Implementación

1.  **Estilos Base**:
    *   Mantiene el gradiente `#aad2eb` a `#8c9bc4`, ancho fijo de `140px` y borde sutil.
    *   Texto blanco (`text-white`) para alto contraste.

2.  **Icono SVG**:
    *   **Tipo**: `Help Circle` (Signo de interrogación encerrado en un círculo).
    *   **Configuración**:
        *   `width="20"`, `height="20"`: Tamaño estándar.
        *   `stroke="currentColor"`: Hereda el color del texto (blanco).
        *   `stroke-width="2"`: Grosor de línea para buena legibilidad.
        *   `fill="none"`: Fondo transparente.

## Ejemplo de Uso

```javascript
/* En un módulo JS */
const btnAyuda = `
    <button id="btn-ayuda-cli"
        class="flex items-center justify-center gap-2 rounded-md shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-white font-medium text-sm"
        style="width: 140px; padding: 0.5rem 0.75rem; background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%); border: 0.5px solid #888;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <span>Ayuda</span>
    </button>
`;
```
