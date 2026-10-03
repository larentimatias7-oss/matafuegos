# ADR: Sistema de Identidad, Autenticación y Control de Acceso (RBAC)

- **Estado**: Propuesto
- **Fecha**: 2026-10-02
- **Autor**: Antigravity (Senior Software Architect) & Equipo de Arquitectura Milicic S.A.
- **Proyecto**: Milicic FireControl 365 (`c:\antigravity\matafuegos`)

---

## 1. Contexto y Diagnóstico del Estado Actual

La aplicación de control de extintores de Milicic S.A. se encuentra operativa en producción (Node.js/Express, SQLite WAL, React 19, Docker/Dokploy). Sin embargo, carece de un sistema de identidad y seguridad de nivel corporativo:

1. **Identificación Actual del Inspector**:
   - Las inspecciones almacenan el nombre del inspector como texto libre (`inspector_name TEXT NOT NULL`), sin vínculo relacional a un identificador único de usuario (`usuario_id`).
   - El middleware `server/middleware/auth.js` utiliza un mock estático que asigna por defecto a _"Santiago Amaya (Inspector HyS)"_ con rol `INSPECTOR`, o toma valores no validados de cabeceras `x-user-role` / `x-user-name`.
   - En el frontend (`src/App.jsx`), la identidad reside en `localStorage.getItem('firecontrol_user')`. El componente `LoginModal.jsx` permite a cualquier persona seleccionar libremente cualquier rol (`ADMIN`, `INSPECTOR`, etc.) sin autenticación real.
2. **Carencia de Multitenancy**:
   - Tablas clave (`extinguishers`, `inspections`, `rounds`, `cases`) carecen de `organizacion_id`, imposibilitando la futura segregación de datos entre diferentes empresas o unidades de negocio.
3. **Carencia de Alcance Sectorial (Scoping)**:
   - Todo inspector puede ver y operar sobre los 130 extintores de la planta indiscriminadamente, sin restricción por sector, nave u obrador asignado.
4. **Falta de Trazabilidad y Revocación**:
   - No existe tabla de sesiones activas, imposibilitando cerrar sesiones remotas ante extravío de dispositivos móviles o desactivación inmediata de colaboradores desvinculados.

---

## 2. Decisiones Arquitectónicas y Alternativas Evaluadas

### ADR-01: Gestión de Sesiones — Sesión Opaca en SQLite vs. JWT Stateless

- **Alternativa A (Descartada)**: Tokens JWT stateless en cookies o cabeceras `Authorization: Bearer`.
  - _Motivo de descarte_: Los JWT puros no admiten revocación instantánea sin mantener una lista negra distribuida (Redis o base de datos), lo cual elimina su ventaja stateless. Si un inspector pierde el celular en obra o es desactivado por RRHH, un JWT seguiría siendo válido hasta su expiración.
- **Alternativa B (Aceptada)**: **Cookies `HttpOnly` + `Secure` + `SameSite=Lax` con ID de sesión opaco (32 bytes criptográficos aleatorios)** respaldado en la tabla `sesiones` de SQLite.
  - _Justificación_:
    1. **Revocación Inmediata**: Un administrador puede revocar una sesión individual o todas las sesiones de un usuario al instante con un simple `UPDATE sesiones SET revocada = 1`.
    2. **Rendimiento Óptimo**: Con SQLite en modo WAL y un índice sobre `id`, la validación de sesión toma menos de `0.15ms`.
    3. **Trazabilidad Integral**: Permite registrar dispositivo, IP, User-Agent, fecha de creación y `ultimo_uso` (expiración deslizante).
    4. **Inmunidad XSS**: Al ser `HttpOnly`, el token no puede ser extraído por scripts maliciosos.
    5. **Protección CSRF**: Uso de atributo `SameSite=Lax` y validación de cabeceras de origen / token anti-CSRF para mutaciones sensibles.

### ADR-02: Modelo Multitenant Preparado para el Futuro (`organizaciones`)

- **Decisión**: Crear la tabla `organizaciones` e incorporar la columna `organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id)` en todas las tablas de dominio (`usuarios`, `extinguishers`, `rounds`, `inspections`, `cases`, `auditoria`).
- **Organización Inicial**: Se inicializa la organización ID `1`: **"Milicic S.A."** (`activa = 1`).
- **Seguridad en Servidor**: El middleware de autenticación inyecta obligatoriamente `req.user.organizacion_id` y todos los endpoints de lectura y escritura filtran forzosamente por `organizacion_id = ?`, previniendo ataques de tipo IDOR (Insecure Direct Object References) entre organizaciones.

### ADR-03: Autenticación Híbrida — Microsoft Entra ID + Local con Argon2id

- **Método Principal (Corporativo)**: **Microsoft Entra ID** vía protocolo OpenID Connect (Authorization Code Flow con PKCE).
  - Restringido estrictamente al tenant de la empresa (`ENTRA_TENANT_ID`).
  - **Aprovisionamiento Just-In-Time (JIT)**: Al iniciar sesión por primera vez con cuenta corporativa `@milicic.com.ar`, el usuario se crea automáticamente con rol base `INSPECTOR` (o se mapea según grupos de seguridad Entra configurados).
- **Método de Respaldo (Contingencia y Admin Inicial)**: Usuarios locales con email y contraseña.
  - Hashing con **Argon2id** (estándar OWASP para contraseñas de alta seguridad).
  - Validación de contraseña segura (mínimo 10 caracteres, verificado contra diccionario de contraseñas débiles comunes).
  - Forzado de cambio de contraseña en el primer acceso (`debe_cambiar_password = 1`).
  - Bloqueo temporal de cuenta tras 5 intentos fallidos consecutivos (bloqueo por 15 minutos).
  - Variable de entorno `AUTH_LOCAL_ENABLED=true/false` para deshabilitar el acceso local en producción excepto para cuentas de emergencia.
- **Bootstrap Seguro del Superadmin**:
  - Comando CLI `npm run crear-admin` que solicita interactivamente credenciales o lee variables protegidas (`ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_PASSWORD`), impidiendo credenciales fijas en el código fuente.

### ADR-04: Matriz de Roles y Permisos Granulares (RBAC)

Se define una jerarquía estricta de 5 roles:

| Rol            | Propósito y Alcance                   | Permisos Principales                                                                                                                                     |
| :------------- | :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SUPERADMIN** | Administrador de TI / Infraestructura | `usuario:gestionar`, `usuario:invitar`, `sesion:revocar`, `config:modificar`, `auditoria:ver_todo`, `backup:gestionar`, y todos los permisos inferiores. |
| **ADMIN**      | Seguridad e Higiene (Jefe HyS)        | `inventario:gestionar`, `ronda:abrir_cerrar`, `checklist:modificar`, `qr:imprimir`, `caso:gestionar`, `reporte:exportar`, `usuario:invitar_inferior`.    |
| **SUPERVISOR** | Capataz / Supervisor de Turno         | `ronda:reabrir`, `inspeccion:revisar_sospechosas`, `caso:asignar`, `inventario:ver_alcance`, `inspeccion:ver_alcance`.                                   |
| **INSPECTOR**  | Operario / Inspector en Campo         | `inspeccion:crear`, `inspeccion:ver_propia`, `caso:abrir`, `qr:escanear`. Limitado a sus sectores asignados.                                             |
| **AUDITOR**    | Auditor Externo / ART / Lectura       | `dashboard:ver`, `inventario:ver_todo`, `historial:ver_todo`, `reporte:exportar`. Sin permisos de escritura.                                             |

#### Reglas de Invarianza RBAC:

1. **Regla de No Auto-Elevación**: Ningún usuario puede modificarse el rol a sí mismo.
2. **Regla de Techo Jerárquico**: Ningún usuario puede asignar o crear un rol superior o igual al propio.
3. **Protección del Último Superadmin**: La API rechaza cualquier intento de desactivar o degradar al último `SUPERADMIN` activo del sistema (`400 Bad Request`).
4. **Validación Declarativa**: Middleware `requirePermiso('inspeccion:crear')` en cada endpoint.

### ADR-05: Control de Alcance Sectorial (`usuarios_sectores`)

- Para usuarios con rol `INSPECTOR` o `SUPERVISOR`, la tabla `usuarios_sectores (usuario_id, sector, piso, edificio)` restringe la visibilidad:
  - Si un usuario **no tiene filas** en `usuarios_sectores`, su alcance es **toda la organización** (global).
  - Si tiene filas asignadas, las consultas de `extinguishers`, `RouteView` y validación al registrar inspecciones verifican que el equipo pertenezca al sector asignado.
  - Si un inspector intenta inspeccionar un extintor fuera de su alcance, el servidor responde `403 Forbidden` (`"Extintor fuera de su sector asignado"`).

### ADR-06: Dispositivo Compartido y Cambio Rápido por PIN

- En cuadrillas y talleres donde una tablet o celular industrial es compartido por varios operarios:
  - El dispositivo mantiene una sesión de dispositivo autorizada.
  - Se permite el cambio rápido entre inspectores mediante un **PIN de 4 a 6 dígitos** (hasheado con sal mediante Argon2id o scrypt).
  - Tras 3 intentos fallidos de PIN, se exige la contraseña o login completo Entra ID.
  - Cada inspección queda atribuida con exactitud al inspector que validó su PIN antes de ejecutar el checklist.

### ADR-07: Resiliencia Offline y Sincronización en Campo

- La sesión del inspector se descarga en el almacenamiento local seguro de la PWA (IndexedDB cifrado) permitiendo operar durante toda la jornada sin conexión a internet.
- Al recuperar señal (evento `online` o reintento de sincronización):
  1. El cliente valida el estado de la sesión contra el servidor (`GET /api/auth/me`).
  2. Si el usuario fue desactivado o la sesión revocada mientras estaba offline: el servidor rechaza la sincronización (`401/403`).
  3. **Preservación de Datos**: Las inspecciones rechazadas **no se eliminan del dispositivo**; se transfieren a una cola de revisión de contingencia (`quarantine_inspections`) con aviso claro en pantalla, permitiendo que un supervisor de HyS apruebe o reasigne la autoría formal de los controles realizados sin perder el trabajo de campo.

### ADR-08: Preservación Histórica de Inspecciones Anteriores

- **Inmutabilidad y Compatibilidad**:
  - Las 130+ inspecciones existentes en `inspections` mantienen intacta su columna original `inspector_name`.
  - Se agregan las columnas `usuario_id TEXT REFERENCES usuarios(id)` e `inspector_name_snapshot TEXT`.
  - Se ejecuta una migración de datos que:
    1. Da de alta al usuario formal de Santiago Amaya: `santiago.amaya@milicic.com.ar` con rol `INSPECTOR`.
    2. Da de alta un usuario institucional del sistema: `sistema.historico@milicic.com.ar` con rol `AUDITOR` (_"Usuario Histórico / Importado"_).
    3. Asocia las inspecciones cuyo `inspector_name` coincida con Santiago Amaya a su `usuario_id`, y el resto al usuario histórico, copiando el nombre a `inspector_name_snapshot`.
  - **Cero registros perdidos y trazabilidad legal retroactiva garantizada.**

---

## 3. Matriz de Riesgos y Mitigaciones

| Riesgo                                                     | Probabilidad | Impacto | Mitigación Arquitectónica                                                                                                                                                          |
| :--------------------------------------------------------- | :----------: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bloqueo de SQLite por escrituras de sesión/auditoría**   |     Baja     |  Alta   | SQLite configurado con `PRAGMA journal_mode = WAL`, `busy_timeout = 5000` y transacciones inmediatas indexadas.                                                                    |
| **Ataques de fuerza bruta a contraseñas locales**          |    Media     |  Alta   | Limitador de tasa (10 intentos / 15 min), bloqueo temporal de cuenta tras 5 intentos fallidos y logs de seguridad.                                                                 |
| **Suplantación de identidad en dispositivos compartidos**  |    Media     |  Media  | El PIN rápido requiere dispositivo previamente enrolado por un Administrador; expiración de sesión de dispositivo tras inactividad.                                                |
| **Falsos rechazos en sincronización offline**              |     Baja     |  Media  | Si la sesión expiró mientras el operario estaba en campo, la app solicita reingreso de credenciales/PIN para autorizar la sincronización pendiente sin borrar los datos encolados. |
| **Escalación de privilegios horizontal o vertical (IDOR)** |    Media     | Crítica | Aislamiento automático por `organizacion_id` y validación de `usuarios_sectores` a nivel de base de datos/middleware en cada petición.                                             |

---

## 4. Plan de Implementación por Fases

- **Fase 1: Modelo de Datos y Migraciones Versionadas**: Tablas `organizaciones`, `usuarios`, `usuarios_sectores`, `sesiones`, `auditoria`, `tokens_seguridad`. Migración reversible de datos existentes.
- **Fase 2: Motor RBAC en Servidor**: Matriz de permisos, middleware `requirePermiso` y `requireSectorScope`, reglas anti-escalada y protección del último Superadmin.
- **Fase 3: Autenticación y Sesiones**: OIDC Entra ID con PKCE + Local con Argon2id, cambio de contraseña forzado, CLI `npm run crear-admin`, cookies seguras y PIN de dispositivo.
- **Fase 4: Interfaces de Administración (UI Milicic)**: Vistas de gestión de usuarios, edición de alcance, pantalla de login dual, visor de auditoría y perfil.
- **Fase 5: Integración Total del Dominio**: Adaptación de inspecciones, casos, inventario, reportes Excel/PDF y panel de control con filtros por usuario y alcance.
- **Fase 6: Seguridad & Endurecimiento**: Auditoría estricta, rate-limiting, validación Zod completa, sanitización de logs.
- **Fase 7: Cobertura de Pruebas**: Tests unitarios de RBAC, tests de API contra todos los roles, IDOR, y tests E2E Playwright con mock de Entra ID.
- **Fase 8: Documentación y Guías Operativas**: Guía de registro de app en Azure / Entra ID, actualización de `.env.example`, Docker y manual de administración.
