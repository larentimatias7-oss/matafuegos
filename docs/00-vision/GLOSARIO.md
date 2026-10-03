# Glosario

> **Para quién**: Cualquier persona nueva al proyecto o al dominio de seguridad contra incendios.
> **Qué vas a entender**: Todos los términos técnicos, de negocio y normativos usados en el código y la documentación.

---

## Dominio de Seguridad contra Incendios

| Término                    | Definición                                                                                                                       | Usado en               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Matafuego**              | Extintor portátil de incendios. Término argentino oficial. En el código: tabla `extinguishers`.                                  | Todo el sistema        |
| **Carga anual**            | Recarga obligatoria del agente extintor (polvo, CO2, etc.). IRAM 3517-2 exige recarga cada 12 meses. Campo: `expiration_charge`. | `expirationService.js` |
| **Prueba hidráulica (PH)** | Ensayo de resistencia del cilindro metálico a presión interna. Vence cada 5 años. Campo: `expiration_ph`.                        | `expirationService.js` |
| **Vida útil**              | Máximo período de servicio desde fabricación: 20 años (polvo/agua/acetato), 30 años (CO2). Campo: `lifespan_limit`.              | `expirationService.js` |
| **Marbete**                | Precinto plástico en el cuello del extintor con color correspondiente al año de la última carga. Campo: `collar_year_color`.     | `extinguishers`        |
| **Chapa baliza**           | Señalización reglamentaria sobre la pared o columna indicando la ubicación del extintor.                                         | UI, seed data          |
| **IRAM 3517-2**            | Norma argentina de mantenimiento de extintores portátiles. Define frecuencias de control, recarga y PH.                          | Reglas de negocio      |
| **Polvo ABC**              | Agente extintor universal para incendios clase A (sólidos), B (líquidos) y C (eléctricos).                                       | `type` enum            |
| **CO2**                    | Dióxido de carbono, agente extintor para incendios eléctricos y líquidos. Sin manómetro, se verifica por peso.                   | `type` enum            |
| **Acetato K**              | Agente extintor para incendios clase K (aceites de cocina).                                                                      | `type` enum            |
| **Haloclean**              | Agente extintor limpio (no deja residuo). Para equipos electrónicos y salas de servidores.                                       | `type` enum            |

## Dominio de la Aplicación

| Término               | Definición                                                                                                                                            | Usado en              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **Ronda**             | Período mensual de inspección obligatoria. Cada extintor OPERATIVO debe ser controlado una vez por ronda. Tabla: `rounds`.                            | `roundService.js`     |
| **Reinspección**      | Segunda inspección del mismo extintor en la misma ronda, con justificación documentada (mínimo 5 caracteres).                                         | `roundService.js`     |
| **Semáforo**          | Indicador visual del estado combinado del extintor: VENCIDO (rojo) > FALLA (naranja) > PENDIENTE (amarillo) > OK (verde).                             | `semaphoreService.js` |
| **Caso / Anomalía**   | Registro de un problema detectado que requiere seguimiento. Tabla: `cases`. Tiene máquina de estados: ABIERTO → EN_TALLER → TEMP_REPLACED → RESUELTO. | `anomalyService.js`   |
| **Código MF-XXX**     | Identificador visual/físico del extintor impreso en la chapa baliza. Formato: `MF-001` a `MF-9999`. Campo: `code`.                                    | `dataValidators.js`   |
| **public_id**         | Identificador criptográficamente aleatorio (24 hex chars, 12 bytes) usado en URLs de QR: `/m/<publicId>`. No adivinable.                              | `db.js`               |
| **Cobertura**         | Porcentaje de extintores inspeccionados en una ronda: `inspectedCount / totalOperativos × 100`.                                                       | `roundService.js`     |
| **Alcance sectorial** | Restricción de visibilidad de un usuario a determinados sectores, pisos o edificios. Tabla: `usuarios_sectores`.                                      | `auth.js`             |

## Dominio Técnico

| Término                   | Definición                                                                                                                         | Usado en                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **Auditoría append-only** | Registro inmutable de operaciones. Las filas de `auditoria` solo se insertan, nunca se modifican ni eliminan.                      | `auditService.js`               |
| **Sesión opaca**          | Token de sesión de 32 bytes (64 hex chars) almacenado en cookie httpOnly. No contiene datos (no es JWT). Revocable inmediatamente. | `authService.js`                |
| **JIT Provisioning**      | Creación automática de una cuenta de usuario la primera vez que alguien inicia sesión con Microsoft Entra ID.                      | `authService.js`                |
| **Entra ID**              | Servicio de identidad corporativa de Microsoft (antes Azure AD). Usado para autenticación OIDC.                                    | `routes/auth.js`                |
| **RBAC**                  | Role-Based Access Control. Modelo de autorización donde los permisos se asignan a roles, y los roles a usuarios.                   | `permissions.js`                |
| **PWA**                   | Progressive Web App. Aplicación web que funciona como app nativa: offline, instalable, con service worker.                         | `sw.js`, `manifest.webmanifest` |
| **WAL**                   | Write-Ahead Logging. Modo de journal de SQLite que permite lecturas concurrentes durante escrituras.                               | `db.js`                         |
| **VACUUM INTO**           | Comando de SQLite que crea una copia compactada y consistente de la base de datos. Usado para backups sin bloquear.                | `backupService.js`              |
| **Dokploy**               | PaaS de despliegue de contenedores Docker. Se despliega vía webhook desde GitHub Actions.                                          | `ci.yml`                        |

---

## Archivos del código relacionados

- [server/config/permissions.js](file:///c:/antigravity/matafuegos/server/config/permissions.js) — Definición de roles y permisos
- [server/services/expirationService.js](file:///c:/antigravity/matafuegos/server/services/expirationService.js) — Cálculos IRAM 3517-2
- [server/services/anomalyService.js](file:///c:/antigravity/matafuegos/server/services/anomalyService.js) — Estados de casos
- [server/services/semaphoreService.js](file:///c:/antigravity/matafuegos/server/services/semaphoreService.js) — Resolución de semáforo
- [server/db.js](file:///c:/antigravity/matafuegos/server/db.js) — Schema y seed
