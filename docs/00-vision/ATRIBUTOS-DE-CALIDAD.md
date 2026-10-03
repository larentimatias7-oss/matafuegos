# Atributos de Calidad

> **Para quién**: Arquitectos y desarrolladores que necesiten evaluar trade-offs o priorizar mejoras.
> **Qué vas a entender**: Los escenarios de calidad priorizados del sistema, con la implementación actual y las limitaciones.

---

## Escenarios de Calidad Priorizados

### AQ-01: Inspección offline en < 15 segundos

| Aspecto                | Detalle                                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Atributo**           | Disponibilidad + Rendimiento                                                                                                                                                         |
| **Estímulo**           | El inspector escanea un QR en un subsuelo sin señal WiFi/4G.                                                                                                                         |
| **Respuesta esperada** | La app carga el formulario de inspección, permite completar el checklist, capturar foto y guardar — todo en < 15 segundos — sin conexión a internet.                                 |
| **Implementación**     | Service Worker (network-first para navegación, cache-first para assets). IndexedDB via `offlineQueue.js` para encolar inspecciones. Compresión de foto en Canvas (1200px, JPEG 70%). |
| **Medición**           | Timer `duration_seconds` en cada inspección.                                                                                                                                         |
| **Limitaciones**       | La primera visita requiere conexión para cachear la app. Si el service worker no instaló, no hay fallback.                                                                           |

### AQ-02: Inmutabilidad regulatoria de inspecciones

| Aspecto                | Detalle                                                                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Atributo**           | Integridad + Conformidad normativa                                                                                                                    |
| **Estímulo**           | Un usuario intenta modificar o eliminar una inspección registrada.                                                                                    |
| **Respuesta esperada** | El sistema rechaza la operación con HTTP 405 y un mensaje explicando la restricción normativa.                                                        |
| **Implementación**     | Middleware en `routes/inspections.js` que intercepta PUT, PATCH y DELETE. Auditoría append-only en tabla `auditoria`.                                 |
| **Medición**           | Test de integración `inspections_immutability.test.js`.                                                                                               |
| **Limitaciones**       | Un administrador con acceso directo a SQLite podría modificar registros manualmente. No hay mecanismo de hashing encadenado implementado actualmente. |

### AQ-03: Sincronización confiable post-offline

| Aspecto                | Detalle                                                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Atributo**           | Confiabilidad + Consistencia                                                                                                                                               |
| **Estímulo**           | El inspector vuelve a una zona con señal después de registrar 5 inspecciones offline.                                                                                      |
| **Respuesta esperada** | Las 5 inspecciones se sincronizan automáticamente, en orden, con revalidación de sesión. Si el usuario fue desactivado, las inspecciones van a cuarentena (no se pierden). |
| **Implementación**     | `syncOfflineInspections()` en `offlineQueue.js`: revalida sesión → envía cada inspección → si 401/403, cuarentena las restantes.                                           |
| **Medición**           | Test E2E `offline_sync.spec.js`.                                                                                                                                           |
| **Limitaciones**       | Si el navegador limpia IndexedDB (ej. modo privado, limpieza automática), los datos se pierden. No hay retry automático periódico.                                         |

### AQ-04: Escalada de privilegios imposible

| Aspecto                | Detalle                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Atributo**           | Seguridad                                                                                                                                        |
| **Estímulo**           | Un INSPECTOR intenta crear un usuario ADMIN o acceder a la gestión de backup.                                                                    |
| **Respuesta esperada** | HTTP 403 con mensaje de acceso denegado.                                                                                                         |
| **Implementación**     | `canManageRole()` con jerarquía numérica (SUPERADMIN=100 > ADMIN=80 > SUPERVISOR=60 > INSPECTOR=40 > AUDITOR=20). `requirePermiso()` middleware. |
| **Medición**           | Tests `rbac_matrix.test.js`, `auth_rbac.test.js`, `idor_and_scope.test.js`.                                                                      |

### AQ-05: QR físicos permanentes

| Aspecto                | Detalle                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Atributo**           | Estabilidad + Retrocompatibilidad                                                                                                     |
| **Estímulo**           | Los QR impresos y pegados en los extintores deben seguir funcionando indefinidamente.                                                 |
| **Respuesta esperada** | La URL `/m/<publicId>` redirige al extintor correcto. El `publicId` (24 hex chars) es inmutable y nunca se regenera.                  |
| **Implementación**     | Ruta `GET /m/:publicId` en `server/index.js`. El `publicId` se genera una sola vez en `generatePublicId()` y nunca cambia.            |
| **Limitaciones**       | Si se cambia `BASE_URL`, los QR impresos con la URL anterior dejan de funcionar a menos que se configure un redirect en el DNS/proxy. |

### AQ-06: Tiempo de despliegue < 10 minutos

| Aspecto                | Detalle                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Atributo**           | Deployability                                                                                                                |
| **Estímulo**           | Un push a `main` con todos los tests pasando.                                                                                |
| **Respuesta esperada** | CI ejecuta lint + test + build + Docker + webhook Dokploy en < 10 minutos.                                                   |
| **Implementación**     | GitHub Actions con `timeout-minutes: 15` para tests y `timeout-minutes: 10` para Docker build. Cache de npm y Docker layers. |

---

## Matriz de Prioridad

| #   | Atributo               | Prioridad | Justificación                                                                         |
| --- | ---------------------- | --------- | ------------------------------------------------------------------------------------- |
| 1   | Disponibilidad offline | **Alta**  | Los inspectores trabajan en zonas sin señal. Sin offline, no pueden hacer su trabajo. |
| 2   | Integridad de datos    | **Alta**  | Normativa IRAM 3517-2 requiere evidencia inmutable.                                   |
| 3   | Seguridad              | **Alta**  | Datos corporativos, autenticación corporativa Entra ID.                               |
| 4   | Rendimiento            | **Media** | Volumen bajo (130 extintores), pero la UX en campo debe ser rápida.                   |
| 5   | Escalabilidad          | **Baja**  | Un solo tenant, un solo servidor. No se prevé crecimiento horizontal.                 |

---

## Archivos del código relacionados

- [src/utils/offlineQueue.js](file:///c:/antigravity/matafuegos/src/utils/offlineQueue.js) — Cola offline
- [public/sw.js](file:///c:/antigravity/matafuegos/public/sw.js) — Service worker
- [server/routes/inspections.js](file:///c:/antigravity/matafuegos/server/routes/inspections.js) — Inmutabilidad
- [server/config/permissions.js](file:///c:/antigravity/matafuegos/server/config/permissions.js) — RBAC
- [.github/workflows/ci.yml](file:///c:/antigravity/matafuegos/.github/workflows/ci.yml) — CI/CD
