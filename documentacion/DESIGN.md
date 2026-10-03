# Milicic S.A. | FireControl 365 — Industrial Safety Design System

Sistema de diseño y especificación técnica de interfaz para la plataforma **FireControl 365** de **Milicic S.A.** (Inspección y Control Mensual de Extintores bajo Norma IRAM 3517-2).

---

## 1. Identidad Corporativa e Industrial

El sistema combina el estándar institucional de **Milicic S.A.** (Naranja `#EA580C` y Slate Dark `#0F172A`) con elementos tácticos de herramientas industriales de campo:

- **Placas de Identificación de Equipo (`.milicic-id-plate`):** Los códigos de matafuegos (`MF-XXX`) se presentan como chapas técnicas remachadas con tipografía monoespaciada de alta legibilidad, bisel y metadatos IRAM.
- **Micro-patrón de Seguridad (`.hazard-stripes`):** En extintores vencidos o cabeceras con fallas críticas, se aplica un rayado diagonal reglamentario de 45° de advertencia.
- **Grilla Heatmap de Sectores (`.sector-heatmap`):** Tablero interactivo que mapea los ~130 matafuegos en una matriz táctica organizada por sector y piso, permitiendo identificar al instante la cobertura de la ronda mensual.
- **Íconos de Precisión Técnica:** Migración integral a **Phosphor Icons** (`@phosphor-icons/react`), eliminando todos los emojis de la interfaz para una estética sobria y profesional.

---

## 2. Tokens Oficiales de Marca (Milicic S.A.)

### Paleta Principal

- **Naranja Milicic (Primario):** `#EA580C` (`rgb(234, 88, 12)`)
- **Naranja Hover:** `#C2410C` (`rgb(194, 65, 12)`)
- **Naranja Suave:** `#FFF7ED` (`rgb(255, 247, 237)`)
- **Borde Naranja:** `#FDBA74` (`rgb(253, 186, 116)`)
- **Pizarra Oscura (Slate Dark):** `#0F172A` (`rgb(15, 23, 42)`)
- **Pizarra Títulos (Slate Lead):** `#1E293B` (`rgb(30, 41, 59)`)
- **Pizarra Cuerpo (Slate Body):** `#334155` (`rgb(51, 65, 85)`)
- **Pizarra Muted (Metadatos):** `#64748B` (`rgb(100, 116, 139)`)
- **Fondo General Claro:** `#F8FAFC` (`rgb(248, 250, 252)`)
- **Borde Neutro:** `#E2E8F0` (`rgb(226, 232, 240)`)

### Semáforo de Seguridad (Color + Ícono + Etiqueta)

| Estado                | Color Texto / Ícono | Fondo     | Borde     | Ícono Phosphor (`weight="bold"`) |
| :-------------------- | :------------------ | :-------- | :-------- | :------------------------------- |
| **Operativo / OK**    | `#16A34A`           | `#DCFCE7` | `#86EFAC` | `<CheckCircle />`                |
| **Pendiente**         | `#D97706`           | `#FEF3C7` | `#FCD34D` | `<Clock />`                      |
| **Falla / Anomalía**  | `#DC2626`           | `#FEE2E2` | `#FCA5A5` | `<WarningCircle />`              |
| **Vencido**           | `#991B1B`           | `#FEE2E2` | `#F87171` | `<ShieldWarning />`              |
| **Cloud / Sync M365** | `#0891B2`           | `#ECFEFF` | `#A5F3FC` | `<CloudCheck />`                 |

---

## 3. Tipografía & Chapas

```css
/* UI General */
font-family:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', 'Helvetica Neue', Arial,
  sans-serif;

/* Identificación Técnica (Chapas MF-XXX) */
font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

---

## 4. Componentes Clave

1. **Tabla de Alto Rendimiento (TanStack Table):**
   - Utilizada en vista escritorio para el inventario de extintores.
   - Columnas ordenables, filtros por tipo/sector/estado y conteo dinámico.
   - En celulares conmuta limpiamente a tarjetas ergonómicas con thumb zone.
2. **Tablero Heatmap de Planta (Dashboard):**
   - Agrupación por sectores (Taller, Depósito, Administración, etc.).
   - Celdas tácticas clicables con tooltip de estado y navegación directa.
3. **Barra de Acción de Campo (Thumb Zone):**
   - Acceso inmediato al escáner y flujo de guardado con feedback háptico.
