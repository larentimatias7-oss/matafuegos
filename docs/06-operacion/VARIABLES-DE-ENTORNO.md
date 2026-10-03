# ⚙️ Diccionario de Variables de Entorno

> **Para quién es**: Desarrolladores, administradores de sistemas y operadores de despliegue en Dokploy o Docker.  
> **Qué vas a entender al terminarlo**: La totalidad de variables de configuración admitidas por la aplicación, si son obligatorias, sus valores por defecto, ejemplos ficticios de configuración y en qué módulo del sistema tienen impacto.

---

## 1. Tabla Maestra de Variables de Configuración

| Variable                  | Obligatoria  |    Valor por Defecto    | Ejemplo Ficticio                                            | Módulo donde se utiliza                               |
| ------------------------- | :----------: | :---------------------: | ----------------------------------------------------------- | ----------------------------------------------------- |
| `NODE_ENV`                |      Sí      |      `development`      | `production`                                                | Global (Express, Vite, Logger)                        |
| `TZ`                      | Recomendado  |          `UTC`          | `America/Argentina/Buenos_Aires`                            | Formateo horario oficial IRAM                         |
| `PORT`                    |      No      |         `3000`          | `3000`                                                      | Servidor HTTP Express (`server/index.js`)             |
| `DATA_DIR`                |      No      |        `./data`         | `/data`                                                     | Directorio de SQLite y backups (`server/db.js`)       |
| `BASE_URL`                |  Sí en prod  | `http://localhost:3000` | `https://matafuegos.milicic.com.ar`                         | Generación de enlaces y QR (`server/routes/qr.js`)    |
| `CORS_ORIGIN`             |      No      |           `*`           | `https://matafuegos.milicic.com.ar`                         | Middleware CORS (`server/index.js`)                   |
| `SESSION_SECRET`          |      No      |   Generado aleatorio    | `c4b8e2...a91f`                                             | Firma de cookies de sesión (`server/index.js`)        |
| `AUTH_LOCAL_ENABLED`      |      No      |         `true`          | `true`                                                      | Habilitación de login local (`server/routes/auth.js`) |
| `AUTH_PROVIDER`           |      No      |         `local`         | `entra`                                                     | Selector de proveedor auth principal                  |
| `MICROSOFT_CLIENT_ID`     | Si usa Entra |         _Vacío_         | `11111111-2222-3333-4444-555555555555`                      | OIDC Client ID (`server/services/authService.js`)     |
| `MICROSOFT_TENANT_ID`     | Si usa Entra |         _Vacío_         | `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`                      | ID del tenant Azure AD de Milicic                     |
| `MICROSOFT_CLIENT_SECRET` | Si usa Entra |         _Vacío_         | `sec_98765~abcdef`                                          | Secreto de aplicación OIDC                            |
| `MICROSOFT_REDIRECT_URI`  | Si usa Entra |       _Derivado_        | `https://matafuegos.milicic.com.ar/api/auth/entra/callback` | Callback OIDC de retorno                              |
| `M365_WEBHOOK_URL`        |      No      |         _Vacío_         | `https://prod-00.brazilsouth.logic.azure.com/...`           | Webhook de Teams (`server/services/m365Service.js`)   |
| `SMTP_HOST`               |      No      |  `smtp.office365.com`   | `smtp.office365.com`                                        | Notificaciones por email                              |
| `SMTP_PORT`               |      No      |          `587`          | `587`                                                       | Puerto STARTTLS                                       |
| `SMTP_USER`               |      No      |         _Vacío_         | `notificaciones@milicic.com.ar`                             | Usuario de correo saliente                            |
| `SMTP_PASS`               |      No      |         _Vacío_         | `clave_app_m365`                                            | Contraseña o token SMTP                               |
| `SMTP_FROM`               |      No      |         _Vacío_         | `"Higiene y Seguridad Milicic" <hys@milicic.com.ar>`        | Remitente visible de alertas                          |
| `ALERT_RECIPIENTS`        |      No      |         _Vacío_         | `hys@milicic.com.ar,guardia@milicic.com.ar`                 | Destinatarios de vencimientos                         |

---

## 2. Reglas de Validación al Inicio

- Si `NODE_ENV=production` y `BASE_URL` apunta a `localhost`, el logger emite una advertencia de seguridad.
- Si `AUTH_PROVIDER=entra` y faltan `MICROSOFT_CLIENT_ID` o `MICROSOFT_TENANT_ID`, el servidor emite una advertencia y deshabilita temporalmente el botón de inicio con Microsoft para evitar errores 500 a los usuarios.

---

## Archivos del código relacionados

- [`.env.example`](file:///c:/antigravity/matafuegos/.env.example) — Plantilla base con comentarios para nuevos despliegues.
- [`server/index.js`](file:///c:/antigravity/matafuegos/server/index.js) — Carga y verificación de variables básicas.
- [`server/services/authService.js`](file:///c:/antigravity/matafuegos/server/services/authService.js) — Integración de variables Microsoft Entra ID.
