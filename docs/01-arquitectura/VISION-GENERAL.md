# Visión General de Arquitectura

> **Para quién**: Desarrolladores y arquitectos que necesiten una vista rápida de la arquitectura antes de profundizar.
> **Qué vas a entender**: Los principios arquitectónicos, restricciones y supuestos del sistema.

---

## 1. Estilo Arquitectónico

**Monolito modular** desplegado como un único contenedor Docker:

- **Backend**: Express 5 (Node.js 22) con SQLite embebida (API `node:sqlite` DatabaseSync).
- **Frontend**: React 19 SPA empaquetada con Vite, servida como assets estáticos por el mismo Express.
- **Persistencia**: SQLite en modo WAL con archivo único en volumen Docker persistente.

No hay microservicios, colas de mensajes ni bases de datos externas.

## 2. Principios

1. **Offline-first para inspecciones**: el flujo crítico (escanear QR → completar checklist → guardar) debe funcionar sin red.
2. **Inmutabilidad regulatoria**: las inspecciones registradas no pueden ser modificadas ni eliminadas (IRAM 3517-2).
3. **QR permanentes**: las URLs codificadas en QR físicos no deben cambiar.
4. **Auditoría completa**: toda mutación queda registrada con snapshot del actor, diff y metadata.
5. **Seguridad por defecto**: Argon2id, cookies httpOnly, RBAC, rate limiting, CSP.
6. **Simplicidad operativa**: un contenedor, un volumen, sin dependencias externas obligatorias.

## 3. Restricciones

| Restricción          | Origen                                            | Impacto                               |
| -------------------- | ------------------------------------------------- | ------------------------------------- |
| Node.js 22+          | API `node:sqlite` (DatabaseSync) requiere Node 22 | Dockerfile usa `node:22-alpine`       |
| SQLite (un escritor) | No escala horizontalmente                         | Adecuado para el volumen actual       |
| QR impresos          | URLs `/m/<publicId>` inmutables                   | Cambiar BASE_URL requiere reimpresión |
| IRAM 3517-2          | Inspecciones inmutables                           | PUT/PATCH/DELETE → 405                |

## 4. Supuestos

- Una sola organización (Milicic S.A.) usa el sistema en producción.
- El volumen de datos es bajo (≈130 extintores, ≈1500 inspecciones/año).
- El servidor corre en un único contenedor con acceso a un volumen persistente.
- La autenticación corporativa (Entra ID) es opcional; el sistema funciona con login local.

## 5. Navegación a documentos detallados

- [C4-1-CONTEXTO.md](./C4-1-CONTEXTO.md) — Sistema, actores y sistemas externos
- [C4-2-CONTENEDORES.md](./C4-2-CONTENEDORES.md) — Contenedores técnicos
- [C4-3-COMPONENTES-API.md](./C4-3-COMPONENTES-API.md) — Módulos del backend
- [C4-3-COMPONENTES-WEB.md](./C4-3-COMPONENTES-WEB.md) — Estructura del frontend
- [DESPLIEGUE.md](./DESPLIEGUE.md) — Diagrama de despliegue
- [DECISIONES/](./DECISIONES/) — ADRs (Architecture Decision Records)
- [DEUDA-TECNICA.md](./DEUDA-TECNICA.md) — Deuda técnica y mejoras sugeridas

---

## Archivos del código relacionados

- [server/index.js](file:///c:/antigravity/matafuegos/server/index.js) — Entry point del servidor
- [server/db.js](file:///c:/antigravity/matafuegos/server/db.js) — Schema y persistencia
- [vite.config.js](file:///c:/antigravity/matafuegos/vite.config.js) — Build del frontend
- [Dockerfile](file:///c:/antigravity/matafuegos/Dockerfile) — Imagen de producción
