---
name: Modal
description: Defines the standard format, styling, and behavior for pop-up modals (specifically tailored for help/manuals but adaptable) for all future system screens.
---

# Modal Skill

This skill prescribes the exact implementation for pop-up modals in the application. It acts as a standard for creating consistent, draggable, and responsive modals, particularly used for displaying help manuals or other auxiliary content.

## 1. Dependencies

Ensure the following libraries are present in the project:
-   **Tailwind CSS:** `<script src="https://cdn.tailwindcss.com"></script>`
-   **FontAwesome:** `<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">`

## 2. CSS Styles

Include these specific styles to ensure the modal's appearance and animation are consistent.

```css
<style>
    /* Modal Styles */
    #help-modal {
        position: fixed;
        top: 5%;
        right: 2%;
        width: 90%;
        height: 70%;
        background-color: white;
        border: 1px solid #d1d5db;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        display: none;
        flex-direction: column;
        resize: both;
        overflow: auto;
        min-width: 400px;
        min-height: 300px;
        border-radius: 8px;
        animation: fadeIn 0.3s;
    }

    /* Modal Animation */
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    #help-modal-header {
        background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%);
        color: rgb(255, 255, 255);
        padding: 12px 16px;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
        border-top-left-radius: 7px;
        border-top-right-radius: 7px;
        user-select: none;
    }

    #help-modal-iframe {
        flex-grow: 1;
        width: 100%;
        height: 100%;
        border: none;
    }
</style>
```

## 3. HTML Structure

### A. Trigger Button
Place this button in the header/navbar or the appropriate location to trigger the modal.
*Replace `img/ayuda.png` with the actual icon path.*

```html
<button id="btn-ayuda"
    class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
    <img src="img/ayuda.png" alt="Ayuda" class="h-5 w-5">
    <span>Ayuda</span>
</button>
```

### B. Modal Container
Place this snippet at the end of the `<body>` tag.
*Replace `{{PAGE_NAME}}` with the specific name of the current page/feature.*

```html
<div id="help-modal">
    <div id="help-modal-header">
        <div class="flex items-center gap-4 font-bold text-lg">
            <span>Manual de Usuario - {{PAGE_NAME}}</span>
            <button onclick="document.getElementById('help-modal-iframe').contentWindow.print()"
                class="bg-white text-blue-600 px-3 py-1 text-sm rounded hover:bg-blue-50 transition flex items-center gap-2 shadow-sm">
                <i class="fas fa-print"></i>
                <span>Imprimir</span>
            </button>
        </div>
        <div class="flex items-center">
            <span class="text-white text-sm mr-2">Abrir en una nueva solapa la ayuda -></span>
            <button id="maximize-help-modal" title="Maximizar / Abrir en nueva pestaña"
                class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors mr-2">
                <i class="fas fa-external-link-alt"></i>
            </button>
            <button id="close-help-modal"
                class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>
    <iframe id="help-modal-iframe" src="" class="w-full flex-grow bg-white" frameborder="0"></iframe>
</div>
```

## 4. JavaScript Logic

Include this logic in your script file or inside a `<script>` tag. It handles:
-   Opening the modal.
-   Closing the modal.
-   Maximizing (opening in new tab).
-   Draggable behavior.

*Replace `ayudas/manual_{{PAGE_NAME}}.html` with the correct path to the content to be loaded.*

```javascript
document.addEventListener('DOMContentLoaded', () => {

    // --- Modal Logic ---
    const helpModal = document.getElementById('help-modal');
    const helpIframe = document.getElementById('help-modal-iframe');
    const closeHelpBtn = document.getElementById('close-help-modal');
    const helpHeader = document.getElementById('help-modal-header');

    // DEFINE THE MANUAL PATH HERE
    const manualPath = 'ayudas/manual_{{PAGE_NAME}}.html';

    // Open Modal
    const btnAyuda = document.getElementById('btn-ayuda');
    if (btnAyuda) {
        btnAyuda.addEventListener('click', () => {
            // Only set src if it's different/empty to avoid reloading
            if (!helpIframe.getAttribute('src') || helpIframe.getAttribute('src') !== manualPath) {
                helpIframe.src = manualPath;
            }
            helpModal.style.display = 'flex';
        });
    }

    // Close Modal
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
    }

    // Maximize Modal
    const btnMaximize = document.getElementById('maximize-help-modal');
    if (btnMaximize) {
        btnMaximize.addEventListener('click', () => {
            helpModal.style.display = 'none';
            window.open(manualPath, '_blank');
        });
    }

    // Draggable Logic
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    if (helpHeader) {
        helpHeader.addEventListener('mousedown', function (e) {
            // Ignore if clicking buttons inside header
            if (e.target.closest('button')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            // Set absolute positioning based on current computed position
            const rect = helpModal.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            // Switch to using left/top for positioning if not already
            helpModal.style.right = 'auto';
            helpModal.style.bottom = 'auto';
            helpModal.style.left = initialLeft + 'px';
            helpModal.style.top = initialTop + 'px';

            document.body.style.userSelect = 'none'; // Prevent selection
        });

        document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            e.preventDefault();

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            helpModal.style.left = (initialLeft + dx) + 'px';
            helpModal.style.top = (initialTop + dy) + 'px';
        });

        document.addEventListener('mouseup', function () {
            isDragging = false;
            document.body.style.userSelect = '';
        });
    }
});
```
