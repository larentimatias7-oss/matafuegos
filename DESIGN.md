# Milicic S.A. | Design System & UI Specification (`DESIGN.md`)

Este documento especifica los tokens de diseño, componentes y directrices visuales y de interacción aplicados a la aplicación **FireControl 365** para el control periódico de matafuegos (IRAM 3517-2), conforme a la skill corporativa institucional de **Milicic S.A.**.

---

## 1. Principios de Diseño para Operarios en Campo

1. **Diseño Mobile-First Extremo:** Pensado para operarios de pie, utilizando el celular con una sola mano (a menudo con guantes) y en condiciones de alta luminosidad (sol directo en obras/playas) o baja visibilidad (subsuelos/salas de máquinas).
2. **Ergonomía de Pulgar:** Acciones primarias fijas en una barra inferior (`bottom-bar`), accesibles cómodamente con el pulgar.
3. **Áreas Táctiles Mínimas:** Altura mínima de 48px para todos los botones, toggles, campos de formulario e interactivos.
4. **Tipografía y Alto Contraste:** Tamaño de cuerpo base de 16px. Fondo claro por defecto (`#F8FAFC`) con soporte para Modo Oscuro (`#0F172A`).
5. **Estados Accesibles (Color + Ícono + Texto):** Ningún estado se comunica exclusivamente por color. Siempre se combina color, ícono unificado (`lucide-react`) y texto explicativo. Prohibido el uso de emojis en la interfaz operativa.
6. **Flujo de 1 Sola Pantalla:** Inspección sin navegación intermedia ni pasos redundantes: Cabecera ➔ Checklist ➔ Observación/Foto condicional (solo si hay falla) ➔ Guardar y Siguiente.
7. **Respuesta Táctil Háptica:** Vibración corta (`navigator.vibrate`) y banners de confirmación inmediatos. Skeletons de carga en lugar de spinners genéricos.

---

## 2. Tokens de Diseño (CSS Custom Properties)

### Paleta Institucional Milicic S.A.
| Token | Valor Hex | Descripción |
| :--- | :--- | :--- |
| `--milicic-orange` | `#EA580C` | Naranja institucional primario (botones de acción, acentos principales). |
| `--milicic-orange-hover` | `#C2410C` | Estado hover/active de botones naranjas. |
| `--milicic-orange-soft` | `#FFF7ED` | Fondos de alerta suave y llamadas de atención. |
| `--milicic-orange-border` | `#FDBA74` | Bordes destacados sutiles. |
| `--milicic-slate-dark` | `#0F172A` | Cabeceras institucionales, fondos oscuros y texto de máxima jerarquía. |
| `--milicic-slate-lead` | `#1E293B` | Títulos principales, tarjetas en modo oscuro. |
| `--milicic-slate-body` | `#334155` | Texto regular de párrafos e ítems de checklist. |
| `--milicic-slate-muted` | `#64748B` | Metadatos, fechas, subtítulos secundarios. |
| `--milicic-bg-light` | `#F8FAFC` | Fondo de la aplicación en modo claro (default). |
| `--milicic-border-light` | `#E2E8F0` | Bordes de tarjetas y divisiones en modo claro. |

### Estados Semánticos (Color + Ícono + Etiqueta)
| Estado | Color Texto / Ícono | Fondo | Borde | Ícono Recomendado |
| :--- | :--- | :--- | :--- | :--- |
| **OK / Aprobado** | `#16A34A` | `#DCFCE7` | `#86EFAC` | `CheckCircle2` |
| **Pendiente** | `#D97706` | `#FEF3C7` | `#FCD34D` | `Clock` |
| **Falla / Anomalía** | `#DC2626` | `#FEE2E2` | `#FCA5A5` | `AlertTriangle` |
| **Vencido** | `#991B1B` | `#FEE2E2` | `#F87171` | `ShieldAlert` |
| **Informativo / Sync** | `#0891B2` | `#ECFEFF` | `#A5F3FC` | `Info` / `CloudCheck` |

### Tipografía
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
```

---

## 3. Catálogo de Componentes de Interfaz

1. **`Navbar` / Cabecera Corporativa:**
   - Logotipo oficial de Milicic S.A.
   - Píldora de estado de ronda mensual y selector de tema claro/oscuro.
   - Barra de pestañas táctil y accesible.
2. **`CheckToggle` (Control de Inspección):**
   - Altura mínima: 56px.
   - Estado binario claro: Botón verde "OK" vs Botón rojo "FALLA".
   - Al pulsar "FALLA", expande automáticamente el campo de observación y foto para documentar la anomalía.
3. **`ActionBottomBar` (Barra Inferior Accesible con el Pulgar):**
   - Fija en la base de la pantalla móvil (`position: sticky` / `fixed bottom: 0`).
   - Botón primario de ancho completo: "Guardar y siguiente pendiente".
4. **`StatusBadge` (Píldora Semántica Obligatoria):**
   - Siempre incluye ícono + texto en mayúsculas pequeñas y fondo coloreado.
5. **`SkeletonCard`:**
   - Animación de shimmer sutil con los tonos neutros de Milicic para dar feedback instantáneo antes de cargar datos.
6. **`LoginView`:**
   - Acceso con Microsoft Entra ID institucional y credenciales locales de desarrollo.
