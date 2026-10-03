# 🎨 Sistema de Diseño e Identidad Visual (Skill Milicic)

> **Para quién es**: Desarrolladores frontend, diseñadores UI/UX y maquetadores.  
> **Qué vas a entender al terminarlo**: La guía de estilos y tokens oficiales de Milicic S.A., los colores corporativos, tipografía, semáforos normativos IRAM y directivas ergonómicas para dispositivos táctiles en obra.

---

## 1. Paleta de Colores Institucional

El sistema de diseño está codificado mediante variables CSS nativas en [`src/index.css`](file:///c:/antigravity/matafuegos/src/index.css) con soporte para temas Claro y Oscuro:

```css
:root {
  /* Milicic Brand Tokens */
  --milicic-orange: #ea580c; /* Naranja Corporativo Principal */
  --milicic-orange-hover: #c2410c; /* Naranja en hover/active */
  --milicic-slate: #0f172a; /* Slate Dark Institucional */
  --milicic-slate-light: #1e293b; /* Slate para bordes y fondos oscuros */

  /* Semáforos Normativos IRAM */
  --status-green: #16a34a; /* Operativo / Conforme (aprobado) */
  --status-yellow: #ca8a04; /* Alerta (vence en <= 30 días) */
  --status-red: #dc2626; /* Vencido / Fuera de Servicio / Rechazado */
  --status-blue: #2563eb; /* En Mantenimiento / Taller Externo */
}
```

---

## 2. Tipografía y Jerarquía Visual

- **Familia Tipográfica Principal**: `'Inter', system-ui, -apple-system, sans-serif`.
- **Pesos Utilizados**:
  - `400 (Regular)`: Texto de lectura, descripciones y tablas.
  - `500 (Medium)`: Etiquetas de formulario, encabezados de columnas.
  - `600 (Semi-Bold)`: Botones primarios, estados y subtítulos.
  - `700 (Bold)`: Títulos de sección, cifras numéricas de KPIs (`font-mono`).

---

## 3. Ergonomía en Campo (Uso con Guantes)

Dado que los inspectores operan tablets y smartphones en ambientes industriales y de obra con elementos de protección personal (EPP):

1. **Tamaño Táctil Mínimo**: Todos los botones de acción principal, checkboxes y controles tienen un área táctil mínima de **44 $\times$ 44 píxeles** (conforme a los estándares WCAG y Apple HIG).
2. **Flujo Ágil en $\le$ 3 Toques**: El formulario de inspección permite marcar un control conforme, confirmar y pasar al siguiente activo en un máximo de 3 interacciones de pantalla.
3. **Prevención de Desborde Horizontal**: Diseño 100% fluido probado en anchos de pantalla extremos de **360 px** (Android compacto) y **390 px** (iPhone estándar).

---

## Archivos del código relacionados

- [`src/index.css`](file:///c:/antigravity/matafuegos/src/index.css) — Definición central de tokens y reglas CSS.
- [`.agents/skills/milicic-corporate-docs/SKILL.md`](file:///c:/antigravity/matafuegos/.agents/skills/milicic-corporate-docs/SKILL.md) — Especificación formal de la skill Milicic.
- [`src/components/Navbar.jsx`](file:///c:/antigravity/matafuegos/src/components/Navbar.jsx) — Aplicación de la identidad corporativa en la cabecera.
