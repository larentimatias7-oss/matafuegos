---
name: milicic-corporate-docs
description: >-
  Genera reportes ejecutivos en PDF, planillas Excel (.xlsx), minutas en Word (.docx) e interfaces Web/UI con el estándar corporativo oficial de Milicic S.A. Codifica la paleta institucional (Naranja #EA580C y Slate Dark #0F172A), tipografía, diseño editorial de alta jerarquía, control de saltos de página y numeración dinámica.
---

# Milicic Corporate Documentation & UI Standard (`milicic-corporate-docs`)

Esta skill proporciona los estándares visuales, lineamientos editoriales, activos vectoriales y scripts de automatización para generar entregables gerenciales y técnicos en **Milicic S.A.** (Infraestructura, Minería, Construcción & TI).

---

## 1. Identidad de Marca Institucional de Milicic S.A.

### Paleta Cromática Oficial

| Token de Color | Hex | RGB | Uso y Aplicación |
| :--- | :--- | :--- | :--- |
| **Naranja Milicic (Primario)** | `#EA580C` | `rgb(234, 88, 12)` | Acento principal, botones primarios, divisores de cabecera, bordes de callouts y títulos H1. |
| **Naranja Hover** | `#C2410C` | `rgb(194, 65, 12)` | Estados activos y hover de botones e hipervínculos. |
| **Naranja Suave (Light)** | `#FFF7ED` | `rgb(255, 247, 237)` | Fondo de tarjetas KPI, cajas de callout y badges de categoría. |
| **Borde Naranja** | `#FDBA74` | `rgb(253, 186, 116)` | Bordes sutiles para elementos destacados. |
| **Slate Dark (Pizarra Oscura)** | `#0F172A` | `rgb(15, 23, 42)` | Encabezado corporativo superior, cabeceras de tablas gerenciales y fondo de banners. |
| **Slate Lead (Títulos)** | `#1E293B` | `rgb(30, 41, 59)` | Títulos principales, nombres de sección y texto de máxima jerarquía. |
| **Slate Body (Cuerpo)** | `#334155` | `rgb(51, 65, 85)` | Texto regular de párrafos, reportes y celdas de tabla. |
| **Slate Muted (Metadatos)** | `#64748B` | `rgb(100, 116, 139)` | Fechas, versiones, leyendas de pie y subtítulos secundarios. |
| **Fondo de Página** | `#F8FAFC` | `rgb(248, 250, 252)` | Fondo general de páginas web y filas alternadas en tablas (zebra). |
| **Borde Neutro** | `#E2E8F0` | `rgb(226, 232, 240)` | Líneas de división de tabla, bordes de tarjetas e inputs. |

### Semáforo de Estados

- **Éxito (En Línea / Operativo):** Texto `#16A34A`, Fondo `#DCFCE7`, Borde `#86EFAC`.
- **Alerta (En Observación / Modo Isla):** Texto `#D97706`, Fondo `#FEF3C7`, Borde `#FCD34D`.
- **Peligro (Crítico / Desconectado):** Texto `#DC2626`, Fondo `#FEE2E2`, Borde `#FCA5A5`.
- **Información (Tráfico / Nube):** Texto `#0891B2`, Fondo `#ECFEFF`, Borde `#A5F3FC`.

### Tipografía Oficial
Pila sans-serif de precisión de ingeniería y máxima legibilidad:
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

---

## 2. Estructura de la Skill

```text
.agents/skills/milicic-corporate-docs/
├── SKILL.md                          # Guía integral y especificaciones
├── scripts/
│   ├── generate-pdf.js               # Motor CLI de renderizado PDF vía Chrome/Edge CDP
│   ├── generate-excel.py             # Generador de planillas ejecutivas con openpyxl
│   ├── generate-word.py              # Generador de documentos Word con python-docx
│   └── create-logo-assets.js         # Script utilitario para sincronizar el logo
└── resources/
    ├── milicic-ui.css                # Hoja de estilos del Design System corporativo
    ├── pdf-template.html             # Plantilla HTML completa para reportes A4
    ├── ui-dashboard-sample.html      # Prototipo interactivo de panel gerencial
    └── assets/
        ├── logo-milicic.png          # Logotipo oficial en mapa de bits
        ├── logo-milicic.svg          # Logotipo vectorial escalable
        └── logo-milicic-base64.js    # Módulo JS con base64 listo para embeber
```

---

## 3. Generación de PDFs Institucionales (A4)

El motor utiliza **Google Chrome o Microsoft Edge en modo Headless** a través del protocolo nativo **Chrome DevTools Protocol (CDP)**. Esto garantiza 300 DPI, renderizado exacto de fuentes del sistema y cálculo de páginas real.

### Comando de Ejecución:
```bash
node .agents/skills/milicic-corporate-docs/scripts/generate-pdf.js <input.html> <output.pdf> [opciones]
```
**Opciones disponibles:**
- `--landscape`: Formato apaisado para diagramas o cronogramas extensos.
- `--no-header-footer`: Suprime los encabezados de impresión si se maquetan dentro del propio HTML.
- `--title "..."`: Personaliza el título institucional del encabezado superior.

### Reglas de Diseño PDF:
1. **Configuración de Página:** Declarar siempre en el CSS:
   ```css
   @page { size: A4 portrait; margin: 22mm 16mm 20mm 16mm; }
   * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
   ```
2. **Control de Paginación:** Usar `page-break-after: always;` o `break-after: page;` para separar la portada, el resumen ejecutivo y los anexos. Para tablas o bloques que no deben cortarse al medio, usar `break-inside: avoid;`.
3. **Portada Corporativa:** Debe incluir el logotipo oficial, la pastilla naranja con la categoría del documento, título con gran jerarquía (`24pt` - `28pt`), subtítulo descriptivo y bloque inferior con metadatos (organización, área emisora, fecha, versión y clasificación de confidencialidad).

---

## 4. Generación de Planillas Excel (.xlsx)

El generador construye planillas financieras y operativas con el estándar estético de Milicic mediante `openpyxl`.

### Comando de Ejecución:
```bash
uv run --with openpyxl python .agents/skills/milicic-corporate-docs/scripts/generate-excel.py [output.xlsx]
```

### Reglas de Estilizado en Excel:
1. **Banner Superior:** Fila 1 y 2 fusionadas con fondo Slate Dark (`#0F172A`), texto blanco en negrita y subtítulo descriptivo en gris tenue.
2. **Tarjetas KPI Superiores:** Bloque de resumen de métricas clave con borde superior grueso naranja (`#EA580C`) y valores destacados en negrita.
3. **Encabezados de Tabla:** Fondo `#0F172A` o `#EA580C`, texto blanco en negrita, centrado vertical y autofiltro habilitado (`ws.auto_filter.ref`).
4. **Zebra Striping & Bordes:** Filas pares con fondo `#F8FAFC` y bordes finos `#E2E8F0` en todas las celdas.
5. **Formatos Numéricos Estrictos:** Moneda `$ #,##0.00`, porcentajes `0.0%`, cantidades enteras `#,##0`.
6. **Paneles Inmovilizados:** Inmovilizar paneles debajo de la cabecera (`ws.freeze_panes`) para facilitar la lectura.

---

## 5. Generación de Documentos Word (.docx)

Para minutas técnicas, pliegos de especificaciones o manuales de procedimientos se utiliza `python-docx`.

### Comando de Ejecución:
```bash
uv run --with python-docx python .agents/skills/milicic-corporate-docs/scripts/generate-word.py [output.docx]
```

### Reglas de Estilizado en Word:
1. **Portada Ejecutiva:** Título con acento naranja, espaciado generoso y tabla de metadatos formal de 2 columnas.
2. **Títulos H1:** Color `#EA580C`, negrita, tamaño `15pt` con espaciado anterior y posterior proporcional.
3. **Títulos H2:** Color `#0F172A`, negrita, tamaño `13pt`.
4. **Callout Boxes:** Implementados como tablas de 1 celda con relleno suave (`#FFF7ED`), padding amplio y borde izquierdo grueso naranja (`#EA580C`) inyectado vía XML (`w:tcBorders`).
5. **Tablas de Datos:** Cabeceras con relleno Slate Dark (`#0F172A`), texto blanco en negrita y filas alternadas con padding interno adecuado.

---

## 6. Componentes Web & Dashboards (UI)

Para el desarrollo de interfaces y portales técnicos, se debe vincular la hoja de estilos institucional:
```html
<link rel="stylesheet" href="path/to/milicic-ui.css">
```

### Clases Principales:
- **Header:** `.milicic-header`, `.brand-badge`, `.brand-info`, `.header-actions`.
- **Tarjetas KPI:** `.kpi-card`, `.kpi-primary`, `.kpi-success`, `.kpi-warning`, `.kpi-title`, `.kpi-value`.
- **Badges:** `.badge-online`, `.badge-warning`, `.badge-danger`, `.badge-info`, `.badge-orange`.
- **Tablas:** `.milicic-table`, thead con `.theme-dark` o `.theme-orange`.
- **Botones:** `.btn-primary` (naranja), `.btn-secondary` (blanco outline), `.btn-outline-primary`, `.btn-danger`, `.btn-sm`.
- **Callouts:** `.callout`, `.callout-blue`, `.callout-amber`, `.callout-green`.
- **Modales:** `.modal-backdrop`, `.modal-card`, `.modal-header`, `.modal-body`, `.modal-footer`.
- **Formularios:** `.form-group`, `.form-label`, `.form-control` (foco con aura naranja).

---

## 7. Embebido del Logotipo Milicic en Código Autónomo

Cuando se crean scripts o páginas autónomas sin depender de rutas relativas al disco, se puede importar o inyectar el logotipo en Base64 desde `.agents/skills/milicic-corporate-docs/resources/assets/logo-milicic-base64.js`:

```javascript
const { LOGO_DATA_URI } = require('./resources/assets/logo-milicic-base64.js');

// En HTML:
const html = `<img src="${LOGO_DATA_URI}" alt="Milicic S.A." height="48" />`;
```

O en formato SVG vectorial:
```html
<svg viewBox="0 0 740 270" width="160">
  <image href="assets/logo-milicic.png" width="740" height="270" />
</svg>
```
