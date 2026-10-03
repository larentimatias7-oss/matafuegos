| Variable                  | Valor Ejemplo / Default                                         | Descripción                                                                   |
| ------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `NODE_ENV`                | `production`                                                    | Entorno y Zona Horaria (Obligatorio Argentina)                                |
| `TZ`                      | `America/Argentina/Buenos_Aires`                                |                                                                               |
| `PORT`                    | `3000`                                                          |                                                                               |
| `DATA_DIR`                | `/data`                                                         | Directorio de datos persistente para SQLite (Volumen Docker /data)            |
| `BASE_URL`                | `https://matafuegos.milicic.com.ar`                             | Ejemplo: https://matafuegos.milicic.com.ar o URL pública de Dokploy           |
| `CORS_ORIGIN`             | `*`                                                             | Dominios autorizados separados por coma, o * para permitir todos              |
| `AUTH_PROVIDER`           | `local`                                                         | Modo: 'entra' para login corporativo Microsoft 365, o 'local' para desarrollo |
| `MICROSOFT_CLIENT_ID`     | `vacío`                                                         |                                                                               |
| `MICROSOFT_TENANT_ID`     | `vacío`                                                         |                                                                               |
| `MICROSOFT_CLIENT_SECRET` | `vacío`                                                         |                                                                               |
| `MICROSOFT_REDIRECT_URI`  | `https://matafuegos.milicic.com.ar/api/auth/entra/callback`     |                                                                               |
| `M365_WEBHOOK_URL`        | `vacío`                                                         | Webhook HTTP instantáneo para notificar anomalías y fallas en canal de Teams  |
| `SMTP_HOST`               | `smtp.office365.com`                                            | Resúmenes automáticos de alertas de vencimiento (60 / 30 / 15 días)           |
| `SMTP_PORT`               | `587`                                                           |                                                                               |
| `SMTP_USER`               | `notificaciones@milicic.com.ar`                                 |                                                                               |
| `SMTP_PASS`               | `vacío`                                                         |                                                                               |
| `SMTP_FROM`               | `"Seguridad e Higiene Milicic <notificaciones@milicic.com.ar>"` |                                                                               |
| `ALERT_RECIPIENTS`        | `hys@milicic.com.ar`                                            |                                                                               |
