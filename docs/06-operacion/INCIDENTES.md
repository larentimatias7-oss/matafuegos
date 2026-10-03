# 🚨 Guía de Diagnóstico de Incidentes y Plantilla Postmortem

> **Para quién es**: Ingenieros de soporte técnico, desarrolladores de guardia y líderes de operaciones de TI.  
> **Qué vas a entender al terminarlo**: Cómo diagnosticar y resolver con rapidez los incidentes operativos más frecuentes del sistema, y la plantilla estandarizada para elaborar informes postmortem tras una interrupción de servicio.

---

## 1. Guía de Diagnóstico Rápido de Problemas Frecuentes

### 1.1 Error: `SQLITE_BUSY` o `database is locked`

- **Causa**: Una transacción de escritura prolongada bloqueó temporalmente el cerrojo de SQLite, o una herramienta externa accedió al archivo mientras estaba en modo WAL.
- **Diagnóstico**:
  ```bash
  # Verificar si existen procesos bloqueantes en el host
  lsof data/matafuegos.db
  ```
- **Solución**:
  - Asegurarse de que `PRAGMA busy_timeout = 5000;` esté activo en `server/db.js`.
  - No abrir el archivo SQLite en modo escritura desde herramientas externas (ej. DB Browser) mientras el contenedor esté en ejecución.

### 1.2 Error: La cámara del celular no abre para escanear el QR

- **Causa**: La API de cámara de los navegadores (`navigator.mediaDevices.getUserMedia`) requiere de forma obligatoria un **contexto seguro (HTTPS)**.
- **Diagnóstico**: Si la URL en la barra del navegador comienza con `http://` en lugar de `https://`, los navegadores modernos (Safari iOS y Chrome Android) bloquean el hardware de la cámara sin emitir prompt de permisos.
- **Solución**: Asegurarse de que el reverse proxy (Traefik / Dokploy) tenga el certificado TLS activo y fuerce redirección HTTPS. Para pruebas locales en red interna, iniciar con `npm run dev:https`.

### 1.3 Error: Inspector con cuenta bloqueada (`423 Locked`)

- **Causa**: Se ingresó una contraseña errónea más de 5 veces consecutivas.
- **Solución**:
  - Esperar 15 minutos para el desbloqueo automático del temporizador.
  - O un Administrador puede ingresar a la vista de Usuarios, editar al usuario y restablecer su contraseña temporal, lo cual limpia el contador de intentos fallidos.

### 1.4 Error: Fallo en entrega de alertas al webhook de Microsoft Teams

- **Causa**: La URL del conector de Power Automate o Teams fue revocada o expiró el flujo.
- **Diagnóstico**: Revisar los logs con `docker compose logs | grep M365Service`.
- **Solución**: Ir a Configuración M365 en la UI con rol SUPERADMIN, ingresar la nueva URL generada en Power Automate y pulsar "Probar Conexión".

---

## 2. Plantilla Oficial de Informe Postmortem

```markdown
# 📄 Informe Postmortem de Incidente - [INC-YYYY-XXXX]

## 1. Resumen Ejecutivo

- **Fecha y Hora de Inicio**: YYYY-MM-DD HH:MM (ART)
- **Fecha y Hora de Resolución**: YYYY-MM-DD HH:MM (ART)
- **Duración Total de la Interrupción**: X horas Y minutos
- **Severidad**: [Crítica / Alta / Media / Baja]
- **Líder del Incidente**: [Nombre]

## 2. Impacto en el Negocio

- Cantidad aproximada de inspectores afectados.
- Rondas de inspección o controles que sufrieron demora.
- ¿Se perdió algún registro de inspección? [Sí / No (Detallar IndexedDB)]

## 3. Causa Raíz (Root Cause Analysis - 5 Porqués)

1. ¿Por qué falló el servicio? ...
2. ¿Por qué ocurrió esa condición? ...
3. ¿Por qué no fue detectada por las alertas preventivas? ...

## 4. Cronología de los Hechos

- **HH:MM** - Detección de la alerta / Reporte de usuario.
- **HH:MM** - Inicio del triage por equipo técnico.
- **HH:MM** - Aplicación de la medida de contención.
- **HH:MM** - Servicio restablecido y verificado vía `/api/health`.

## 5. Acciones Correctivas y Preventivas (Action Items)

| Acción                                      | Responsable | Fecha Límite | Estado    |
| ------------------------------------------- | ----------- | ------------ | --------- |
| Mejorar timeout o índice en tabla X         | [Dev]       | YYYY-MM-DD   | Pendiente |
| Agregar alerta en Prometheus para métrica Y | [DevOps]    | YYYY-MM-DD   | Pendiente |
```

---

## Archivos del código relacionados

- [`server/db.js`](file:///c:/antigravity/matafuegos/server/db.js) — Timeout y pragmas de SQLite.
- [`server/middleware/logger.js`](file:///c:/antigravity/matafuegos/server/middleware/logger.js) — Registro de errores para diagnóstico.
- [`server/routes/m365.js`](file:///c:/antigravity/matafuegos/server/routes/m365.js) — Manejo de fallos en webhook.
