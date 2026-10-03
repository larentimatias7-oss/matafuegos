# 🔏 Privacidad de Datos y Política de Retención Legal

> **Para quién es**: Oficiales de privacidad, asesores legales, ingenieros de datos y administradores de sistemas.  
> **Qué vas a entender al terminarlo**: El marco de cumplimiento con la Ley Argentina de Protección de los Datos Personales (Ley 25.326), qué información personal se procesa, las políticas de retención temporal y cómo se gestiona la baja lógica de usuarios sin quebrantar la inmutabilidad de los controles.

---

## 1. Cumplimiento con la Ley 25.326 (República Argentina)

Milicic FireControl 365 recopila únicamente los datos estrictamente necesarios (_principio de minimización_) para la trazabilidad y validez laboral de los controles de higiene y seguridad:

| Dato Recopilado                | Finalidad Primaria                                           | Base Legal                                                | Nivel de Sensibilidad |
| ------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------- | :-------------------: |
| **Nombre y Apellido**          | Identificación del inspector en la firma del control mensual | Cumplimiento reglamentario IRAM 3517-2 / Contrato laboral |       Estándar        |
| **Email Corporativo**          | Credencial de acceso y notificaciones operativas             | Operatividad laboral interna                              |       Estándar        |
| **Dirección IP y User-Agent**  | Detección de intrusiones y auditoría forense                 | Seguridad técnica del sistema                             |        Técnico        |
| **Coordenadas GPS (opcional)** | Comprobar cercanía física al extintor al inspeccionar        | Antifraude preventivo                                     |  Técnico / Ubicación  |

---

## 2. Política de Retención Legal de Registros

- **Inspecciones Mensuales y Casos de Mantenimiento**: Retención obligatoria mínima de **10 años** (conforme a los plazos de prescripción de responsabilidad civil contractual y normas de la Superintendencia de Riesgos del Trabajo - SRT).
- **Bitácora de Auditoría Técnica**: Retención de **5 años** para investigaciones forenses de seguridad.
- **Sesiones Expiradas**: Purga automática tras **90 días** de inactividad.

---

## 3. Procedimiento de Baja Lógica (Desactivación)

Para preservar la validez legal del historial sin violar el derecho de supresión de cuentas:

- **Prohibición de `DELETE` físico**: La cuenta de un colaborador desvinculado nunca se borra de la base de datos; se marca como `activo = 0` con timestamp `desactivado_en`.
- **Revocación Inmediata de Sesiones**: Al desactivar un usuario, todas sus sesiones activas en la tabla `sesiones` son revocadas de forma instantánea.
- **Conservación de Firmas**: Las inspecciones previas conservan el `inspector_name_snapshot`, garantizando que los libros foliados sigan siendo válidos ante la ART.

---

## Archivos del código relacionados

- [`server/routes/users.js`](file:///c:/antigravity/matafuegos/server/routes/users.js) — Implementación del endpoint de desactivación lógica.
- [`server/services/authService.js`](file:///c:/antigravity/matafuegos/server/services/authService.js) — Revocación masiva de sesiones por baja.
- [`server/migrations/001_multi_org_and_users.js`](file:///c:/antigravity/matafuegos/server/migrations/001_multi_org_and_users.js) — Esquema de campos de estado y snapshots.
