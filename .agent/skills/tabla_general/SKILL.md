---
name: Tabla General
description: Estándar para tablas con ordenamiento y filtrado
---

# Tabla General

Este skill define la estructura estándar HTML, estilos CSS y lógica JavaScript para implementar tablas con capacidad de ordenamiento y filtrado en la aplicación.

## Estructura HTML

La tabla debe estar contenida dentro de un `div` con `class="flex-grow overflow-y-auto relative"` y un ID único (ej: `grid-clientes`).
La tabla en sí usa la clase `tabla w-full`.
Los encabezados (`th`) que deben ser ordenables llevan el atributo `data-sort` con el nombre de la propiedad del objeto de datos.

```html
<!-- Contenedor para la grilla -->
<div id="grid-identificador" class="flex-grow overflow-y-auto relative">
  <center>
    <table class="tabla w-full-5">
        <thead class="sticky top-0 z-10 bg-gray-100">
            <tr>
                <th data-sort="propiedad1">Encabezado 1</th>
                <th data-sort="propiedad2">Encabezado 2</th>
                <!-- Columnas sin ordenamiento (ej: acciones) no llevan data-sort -->
                <th class="text-center">Acciones</th>
            </tr>
        </thead>
        <tbody id="tabla-cuerpo-id">
            <!-- Las filas se insertarán aquí con JavaScript -->
        </tbody>
    </table>
    </center>
</div>
```

## Estilos CSS (Tailwind)

Estos estilos deben estar presentes en `css/tailwind.input.css` (o similar). Incluyen estilos sticky para el encabezado y los iconos de ordenamiento.

```css
/* Tabla General Styles */
.tabla thead th {
    color: #000 !important;
    background-color: rgba(62, 102, 166, 0.61) !important;
    color: white !important;
    font-weight: 500;
    font-size: 0.775rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.75rem 1rem;
    text-align: left;
    position: sticky !important;
    top: 0 !important;
    z-index: 100 !important;
    box-shadow: inset 0 -4.5pt 0 rgba(62, 102, 166, 0.61);
}

/* Bordes redondeados para el primer y último elemento */
thead th:first-child { border-top-left-radius: 10px; }
thead th:last-child { border-top-right-radius: 10px; }

/* Iconos de Ordenamiento (flechas amarillas) */
.tabla thead th.sort-asc::after {
    content: '  \25BC'; /* Triángulo hacia abajo */
    color: rgb(229, 229, 103);
    margin-left: 5px;
    font-size: 1em;
}

.tabla thead th.sort-desc::after {
    content: '  \25B2'; /* Triángulo hacia arriba */
    color: rgb(240, 240, 112);
    margin-left: 5px;
    font-size: 1em;
}

/* Estilos de cuerpo */
.tabla tbody { position: relative; z-index: 1; }
.tabla tbody td {
    padding: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
    color: #475569;
    background-color: white;
}

/* Hover effects */
table tbody tr:hover td { background-color: #aaddaa; }
table tbody tr:nth-child(even) { background-color: #fafafa; }
table tbody tr:nth-child(even):hover { background-color: #f1f5f9; }
```

## Lógica JavaScript

Se utiliza la función `initTableManager` definida en `js/utils.js`.

### 1. Función de Renderizado
Define una función que recibe un array de datos y renderiza las filas.

```javascript
const renderTabla = (datos) => {
    const tablaBody = document.getElementById('tabla-cuerpo-id');
    tablaBody.innerHTML = '';
    datos.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2">${item.propiedad1}</td>
            <td class="px-4 py-2">${item.propiedad2}</td>
            <td class="px-4 py-2 text-center">
                <button class="btn-accion">Acción</button>
            </td>
        `;
        tablaBody.appendChild(row);
    });
};
```

### 2. Inicialización
Llama a `initTableManager` después de cargar los datos iniciales.

```javascript
// Cargar datos
const datos = await fetchDatos(); 

// Render inicial
renderTabla(datos);

// Inicializar Table Manager (Ordenamiento y Filtro)
// Argumentos: Selector del contenedor, Datos originales, Callback de renderizado
initTableManager('#grid-identificador', datos, (datosProcesados) => {
    renderTabla(datosProcesados);
});
```
