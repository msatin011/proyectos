---
name: Manual
description: Defines the standard structure, styling, and behavior for user manuals in the system.
---

# Manual Skill

This skill prescribes the standard template for creating user manuals in the application. All new manual pages must follow this structure to ensure consistency in design, navigation, and functionality.

## 1. File Structure & Metadata

*   **Location:** Store manual files in the `ayudas/` directory (e.g., `ayudas/manual_nombre_modulo.html`).
*   **Doctype:** `<!DOCTYPE html>`
*   **Language:** `<html lang="es">`
*   **Meta Tags:** Standard Viewport meta tag.
*   **Title:** `Manual de Usuario - {{MODULE_NAME}}`

## 2. Dependencies

The manual relies on the following external libraries, which must be included in the `<head>`:

*   **Tailwind CSS:** `https://cdn.tailwindcss.com`
*   **FontAwesome:** `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css`

## 3. CSS Styling

Include the following custom styles to override or extend Tailwind classes for specific manual elements (cards, step numbers, alert boxes, navigation buttons).

```css
<style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .section { scroll-margin-top: 80px; }
    
    /* Feature Cards */
    .feature-card { transition: all 0.3s ease; }
    .feature-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); }

    /* Step Numbers */
    .step-number {
        width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
        border-radius: 50%; font-weight: bold; font-size: 1.2rem;
    }

    /* Alert Boxes */
    .tip-box { border-left: 4px solid #3b82f6; background: #eff6ff; padding: 1rem; margin: 1rem 0; }
    .warning-box { border-left: 4px solid #f59e0b; background: #fffbeb; padding: 1rem; margin: 1rem 0; }
    .success-box { border-left: 4px solid #10b981; background: #f0fdf4; padding: 1rem; margin: 1rem 0; }

    /* Navigation Buttons */
    .nav-btn {
        display: inline-block; width: 140px; padding: 0.5rem 0.75rem;
        text-align: center; font-size: 0.875rem; font-weight: 500;
        color: white; background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%);
        border: solid 0.5pt #888; border-radius: 0.375rem;
        transition: all 0.3s ease; text-decoration: none;
    }
    .nav-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
</style>
```

## 4. Body Structure

### A. Navigation Bar
A sticky top navigation bar containing anchor links to the main sections of the manual.

```html
<nav class="bg-white shadow-md sticky top-0 z-40">
    <div class="container mx-auto px-6 py-3">
        <div class="flex flex-wrap justify-center gap-2">
            <a href="#introduccion" class="nav-btn">Introducción</a>
            <!-- Add module specific links here -->
            <a href="#tutorial" class="nav-btn">Guía de Uso</a>
            <a href="#soporte" class="nav-btn">Soporte</a>
        </div>
    </div>
</nav>
```

### B. Main Content Container
Wrap all distinct sections within a `<main>` container with max-width.

```html
<main class="container mx-auto px-6 py-8 max-w-5xl">
    <!-- Sections go here -->
</main>
```

### C. Standard Sections

#### 1. Introduction (`#introduccion`)
Use specific container styles `bg-white rounded-lg shadow-lg p-8 border-t-4 border-blue-600`.
Includes a header with an icon (`fa-info-circle`), description text, and optionally grid-based "Feature Cards".

#### 2. Usage Guide / Tutorial (`#tutorial`)
Container border color: `border-indigo-600`. Icon: `fa-play-circle`.
Use the `.step-number` class for numbered lists or steps.
Use `.tip-box`, `.warning-box`, or `.success-box` for highlighting information.

```html
<!-- Example Step -->
<div class="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
    <div class="step-number bg-indigo-600 text-white">1</div>
    <div>
        <h4 class="font-bold">Paso 1</h4>
        <p class="text-sm text-gray-600">Instrucciones...</p>
    </div>
</div>
```

#### 3. Support (`#soporte`)
Use a gradient background: `bg-gradient-to-r from-blue-600 to-blue-800`.
Must include placeholders (`span` with IDs `support-email` and `support-phone`) which are populated via JavaScript.

### D. Footer
Standard footer with copyright notice.

```html
<footer class="bg-gray-800 text-white py-6 mt-12">
    <div class="container mx-auto px-6 text-center">
        <p class="text-sm">© 2026 Proyectos App - Manual de Usuario v1.0</p>
    </div>
</footer>
```

## 5. JavaScript Functionality

The manual requires a script to:
1.  **Fetch Support Info:** Asynchronously retrieve email and phone from `/api/support-info` using the session token and populate the support section.
2.  **Smooth Scroll:** Enable smooth scrolling for anchor links (`a[href^="#"]`).

```javascript
<script>
    // Load support contact information from database
    async function loadSupportInfo() {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) return;
            const response = await fetch('/api/support-info', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const data = await response.json();
                document.getElementById('support-email').textContent = data.email;
                document.getElementById('support-phone').textContent = data.phone;
            }
        } catch (error) { console.error('Error loading support info:', error); }
    }
    document.addEventListener('DOMContentLoaded', loadSupportInfo);

    // Smooth scroll logic...
</script>
```

## 6. Modal Integration Template (Host Screen)

When integrating the manual into a screen (e.g., `cliente.js`), use the following HTML structure for the help modal to ensure consistent controls (Maximize/Close buttons with white SVGs).

```html
<div id="help-modal-[ID]">
    <div id="help-modal-header-[ID]" style="background: linear-gradient(180deg, #aad2eb 0%, #8c9bc4 100%); color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
        <div class="flex items-center gap-4 font-bold text-lg">
            <span>Manual de Usuario - [Titulo]</span>
            <!-- Print Button (Optional) -->
        </div>
        <div class="flex items-center">
            <span class="text-white text-sm mr-2">Abrir en una nueva solapa la ayuda -></span>
            <!-- Maximize Button -->
            <button id="maximize-help-[ID]" title="Maximizar / Abrir en nueva pestaña"
                class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            </button>
            <!-- Close Button -->
            <button id="close-help-[ID]"
                class="text-white hover:text-gray-200 hover:bg-blue-700 rounded p-1 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    </div>
    <iframe id="help-iframe-[ID]" src="" class="w-full flex-grow bg-white" frameborder="0"></iframe>
</div>
```
