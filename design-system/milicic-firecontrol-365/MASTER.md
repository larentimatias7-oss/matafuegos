# Design System Master File — Milicic FireControl 365

> **PRECEDENCIA INSTITUCIONAL OBLIGATORIA:**  
> Las especificaciones de color, tono de marca y activos gráficos de este documento han sido sincronizadas y subordinadas estrictamente a la skill corporativa oficial de **Milicic S.A.** (`milicic-corporate-docs`). Cualquier recomendación genérica generada previamente queda anulada y sustituida por las directrices institucionales de Milicic.

---

**Proyecto:** Milicic FireControl 365 (Control Mensual de Matafuegos IRAM 3517-2)  
**Entorno Operativo:** Industrial, Minería, Obras Civiles & Oficinas Corporativas  
**Densidad Visual:** 8/10 (Dense / Industrial Safety Dashboard & Mobile-First Field Tool)  
**Sistema Tipográfico:** Inter / Segoe UI (UI & Datos) + JetBrains Mono (Chapas Técnicas MF-XXX)  
**Librería de Íconos Oficial:** Phosphor Icons (`@phosphor-icons/react`) — Zero Emojis en UI  

---

## 1. Tokens de Color Oficiales (Milicic S.A.)

| Rol Institucional | Hex | CSS Variable | Uso y Regla de Precedencia |
| :--- | :--- | :--- | :--- |
| **Naranja Milicic (Primario)** | `#EA580C` | `--color-primary` / `--milicic-orange` | Acento principal, botones primarios, bordes de enfoque y barra de progreso de ronda. |
| **Naranja Hover** | `#C2410C` | `--color-primary-hover` / `--milicic-orange-hover` | Estado :hover y :active en botones principales. |
| **Naranja Suave** | `#FFF7ED` | `--color-primary-soft` / `--milicic-orange-soft` | Fondos de banners de llamado a la acción y badges activos. |
| **Borde Naranja** | `#FDBA74` | `--color-primary-border` / `--milicic-orange-border` | Resaltes sutiles y tarjetas seleccionadas. |
| **Slate Dark (Pizarra Oscura)** | `#0F172A` | `--color-slate-dark` / `--milicic-slate-dark` | Cabecera superior, modo oscuro, fondos de chapa técnica y títulos H1. |
| **Slate Lead (Títulos)** | `#1E293B` | `--color-slate-lead` / `--milicic-slate-lead` | Tarjetas de datos, bordes de sección y cabeceras de tablas. |
| **Slate Body (Cuerpo)** | `#334155` | `--color-slate-body` / `--milicic-slate-body` | Texto de lectura, descripciones técnicas y valores de celda. |
| **Slate Muted (Metadatos)** | `#64748B` | `--color-slate-muted` / `--milicic-slate-muted` | Números de serie, fechas IRAM, subtítulos y labels auxiliares. |
| **Fondo General Claro** | `#F8FAFC` | `--color-bg-light` / `--milicic-bg-light` | Fondo base de la aplicación web. |
| **Borde Neutro** | `#E2E8F0` | `--color-border-light` / `--milicic-border-light` | Líneas de división de grilla, inputs y separadores de tabla. |

### Semáforo de Seguridad y Estados Operativos
- **Operativo / Inspeccionado OK:** Texto `#16A34A` | Fondo `#DCFCE7` | Borde `#86EFAC` | Ícono `CheckCircle` (weight="bold")
- **Pendiente de Inspección:** Texto `#D97706` | Fondo `#FEF3C7` | Borde `#FCD34D` | Ícono `Clock` (weight="bold")
- **Falla Crítica / Anomalía:** Texto `#DC2626` | Fondo `#FEE2E2` | Borde `#FCA5A5` | Ícono `WarningCircle` (weight="bold")
- **Vencido / Fuera de Norma:** Texto `#991B1B` | Fondo `#FEE2E2` | Borde `#F87171` | Ícono `ShieldWarning` (weight="bold")
- **Sincronizado M365 / Cloud:** Texto `#0891B2` | Fondo `#ECFEFF` | Borde `#A5F3FC` | Ícono `CloudCheck` (weight="regular")

---

## 2. Tipografía e Identidad de Chapas Técnicas

1. **Pila Tipográfica de Interfaz:**
   ```css
   font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif;
   ```
2. **Pila Monospace para Chapas de Seguridad (`MF-XXX`):**
   ```css
   font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
   ```
3. **Placa de Identificación Industrial (`.milicic-id-plate`):**
   - Aspecto de chapa metálica de equipo técnico.
   - Tipografía monoespaciada de alto contraste con relieve sutil (`letter-spacing: 0.05em`).
   - Subetiqueta técnica en mayúsculas pequeñas ("IRAM 3517-2 • MILICIC SEGURIDAD").

---

## 3. Elementos Visuales Industriales Propios

1. **Líneas de Advertencia de Peligro (`.hazard-stripes`):**
   - Micro-patrón diagonal de 45° en alertas críticas o matafuegos vencidos:
   ```css
   background: repeating-linear-gradient(
     -45deg,
     rgba(220, 38, 38, 0.08),
     rgba(220, 38, 38, 0.08) 10px,
     transparent 10px,
     transparent 20px
   );
   ```
2. **Grilla / Heatmap de Sectorización:**
   - Panel visual interactivo de los ~130 matafuegos agrupados por sector y piso.
   - Cada matafuego es una micro-celda táctica con estado semántico en tiempo real.
3. **Ergonomía de Campo Mobile-First:**
   - Touch targets mínimos de 48px para uso con una sola mano y guantes.
   - Barra de acción primaria flotante (`fixed bottom`) con feedback háptico (`navigator.vibrate(20)`).
