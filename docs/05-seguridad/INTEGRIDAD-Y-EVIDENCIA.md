# 🔐 Integridad de Registros, Inmutabilidad y Evidencia Legal

> **Para quién es**: Auditores de calidad, responsables legales de Seguridad e Higiene e ingenieros de software que verifican la cadena de custodia de las inspecciones.  
> **Qué vas a entender al terminarlo**: Cómo garantiza Milicic FireControl 365 que las inspecciones periódicas no puedan ser adulteradas, cómo se preserva la identidad del inspector mediante snapshots inmutables y los controles técnicos exigidos por la norma IRAM 3517-2.

---

## 1. Principio de Inmutabilidad Regulatoria (IRAM 3517-2)

La norma **IRAM 3517-2** exige que todo control mensual registrado posea valor de declaración jurada y no pueda ser alterado a posteriori para ocultar irregularidades o accidentes.

### Controles Técnicos en el Servidor

- **Bloqueo HTTP Estricto**: La ruta `/api/inspections/:id` rechaza expresamente cualquier método de mutación:
  - `PUT /api/inspections/:id` $\rightarrow$ `405 Method Not Allowed`
  - `PATCH /api/inspections/:id` $\rightarrow$ `405 Method Not Allowed`
  - `DELETE /api/inspections/:id` $\rightarrow$ `405 Method Not Allowed`
- **Reinspecciones Justificadas**: Si un extintor fue inspeccionado erróneamente, no se edita el registro original; se crea una **segunda inspección vinculada** (`is_reinspection = 1`) que exige un motivo formal de al menos 5 caracteres, preservando ambas para auditoría.

---

## 2. Snapshots Inmutables de Identidad y Activo

Para evitar que cambios futuros en los datos maestros invaliden el historial histórico:

- **`inspector_name_snapshot`**: Se copia y sella el nombre completo del usuario que ejecutó el control al momento de la firma. Si el usuario luego cambia su nombre, es desactivado o eliminado, el registro de la inspección permanece intacto y legible.
- **`extinguisher_code`**: Se almacena una copia estática del código del extintor en el instante de la inspección.

---

## 3. Bitácora Append-Only de Auditoría

Toda operación de mutación en la plataforma (altas, modificaciones técnicas de extintores, cambios de rol, desactivaciones de cuenta, login exitoso o fallido) escribe un registro inalterable en la tabla `auditoria`:

```sql
CREATE TABLE IF NOT EXISTS auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    accion TEXT NOT NULL,
    entidad TEXT NOT NULL,
    entidad_id TEXT NOT NULL,
    datos_antes TEXT,
    datos_despues TEXT,
    ip TEXT,
    user_agent TEXT
);
```

- **Inalterabilidad**: La tabla no cuenta con endpoints de eliminación ni edición en la API.
- **Exportación**: Los administradores pueden exportar la bitácora completa en planillas Excel para respaldo ante pericias judiciales.

---

## Archivos del código relacionados

- [`server/routes/inspections.js`](file:///c:/antigravity/matafuegos/server/routes/inspections.js) — Implementación del rechazo 405 en mutaciones de inspecciones.
- [`server/services/auditService.js`](file:///c:/antigravity/matafuegos/server/services/auditService.js) — Grabación append-only de eventos de auditoría.
- [`tests/integration/inspections_immutability.test.js`](file:///c:/antigravity/matafuegos/tests/integration/inspections_immutability.test.js) — Pruebas de inmutabilidad estricta.
