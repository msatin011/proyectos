---
name: Indicador Estado
description: Estándar para indicadores de estado (Activo/Inactivo, Habilitado/Deshabilitado) tanto en formularios (Toggle) como en tablas (Badges SI/NO). Basado en el estilo de cron.js.
---

# Indicador de Estado

Este skill define el estándar para la visualización y edición del estado de una entidad (activo/inactivo, habilitado/deshabilitado) para mantener la consistencia en toda la aplicación.

## 1. Versión para Formularios (Toggle Switch)

Este componente se utiliza en modales de edición o creación para cambiar el estado. Utiliza un checkbox oculto (`sr-only`) y un estilo de "switch" basado en la clase `peer` de Tailwind.

### Estructura HTML

```html
<div class="mb-4">
    <label class="flex items-center cursor-pointer">
        <span class="text-gray-700 text-sm font-bold mr-3">[ETIQUETA]</span> <!-- Ej: Activo, Habilitado -->
        <div class="relative">
            <input id="[ID_INPUT]" type="checkbox" checked class="sr-only peer">
            <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </div>
    </label>
</div>
```

### Detalles de Implementación (Toggle)
*   **Contenedor**: `flex items-center` para alinear etiqueta y switch.
*   **Fondo (Inactivo)**: `bg-gray-300`.
*   **Fondo (Activo)**: `peer-checked:bg-blue-600`.
*   **Círculo Deslizante**: Animación suave con `after:transition-all`.

---

## 2. Versión para Tablas (Badges SI/NO)

Este componente se utiliza dentro de las celdas (`<td>`) de una tabla para mostrar el estado actual de forma rápida y visual.

### Estructura HTML (Template String)

```javascript
`<td class="px-6 py-4 whitespace-nowrap text-sm">
    ${item.activo
    ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Sí</span>'
    : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">No</span>'}
</td>`
```

### Detalles de Implementación (Badges)
*   **Estado Positivo (Activo/SI)**:
    *   `bg-green-100`: Fondo verde muy claro.
    *   `text-green-800`: Texto verde oscuro.
*   **Estado Negativo (Inactivo/NO)**:
    *   `bg-red-100`: Fondo rojo muy claro.
    *   `text-red-800`: Texto rojo oscuro.
*   **Estilo Común**: `rounded-full` (forma de píldora), `font-semibold`, `text-xs`.

## Ejemplo de Integración en un ABM

### En el Template del Modal:
```javascript
// ... dentro del form del modal
<div class="mb-6">
    <label class="flex items-center cursor-pointer">
        <span class="text-gray-700 text-sm font-bold mr-3">Habilitado</span>
        <div class="relative">
            <input id="input-habilitado" type="checkbox" checked class="sr-only peer">
            <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </div>
    </label>
</div>
```

### En el Render de la Tabla:
```javascript
const htmlRow = `
    <tr>
        <!-- ... otras celdas ... -->
        <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
            ${data.activo 
                ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Sí</span>' 
                : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">No</span>'
            }
        </td>
    </tr>
`;
```
