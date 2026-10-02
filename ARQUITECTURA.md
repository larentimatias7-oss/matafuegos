# ARQUITECTURA DEL SISTEMA | MILICIC FIRECONTROL 365

Sistema corporativo de trazabilidad, control mensual bajo norma IRAM 3517-2 e inspección de extintores contra incendio con capacidad Offline-First y despliegue sobre Docker/Dokploy.

---

## 1. Diagrama General de Arquitectura

```mermaid
graph TD
    subgraph Clientes ["Clientes y Dispositivos"]
        M[📱 PWA Móvil Inspector<br/>360x640 / 390x844<br/>Offline-First / IndexedDB]
        D[💻 Web Desktop Admin<br/>1280x800+<br/>Gestión e Informes]
    end

    subgraph Edge ["Capa de Red & Proxy"]
        TR["Traefik / Dokploy Ingress<br/>Terminación TLS / HTTPS<br/>Strict Headers / Rate Limit"]
    end

    subgraph AppContainer ["Contenedor Node.js (Docker Unprivileged 'node')"]
        subgraph FrontendBuild ["Frontend Estático (Vite + Rolldown)"]
            SPA["React 19 SPA<br/>Vite 8 Rolldown Chunks<br/>Design System Milicic"]
        end

        subgraph ExpressAPI ["Backend Express 5"]
            SEC["Helmet CSP + CORS + RateLimit"]
            LOG["Structured JSON Logger<br/>X-Request-ID Tracking"]
            VAL["Zod Schemas Validation"]
            AUTH["RBAC Middleware<br/>ADMIN / INSPECTOR / LECTURA"]
            ROUTES["Rutas de API:<br/>/extinguishers, /inspections,<br/>/rounds, /cases, /m365"]
            OBS["Observabilidad:<br/>/api/health (Storage/DB/Mem)<br/>/api/metrics (Prometheus)"]
        end

        subgraph ServicesLayer ["Servicios de Negocio"]
            EXP["expirationService<br/>(IRAM 3517-2 / Bisiestos / TZ Arg)"]
            SEM["semaphoreService<br/>(OK / Pendiente / Falla / Vencido)"]
            RND["roundService & anomalyService"]
            FRAUD["antifraudService (Inspecciones sospechosas)"]
            BAK["backupService (VACUUM INTO consistente)"]
        end

        subgraph DatabaseEngine ["Motor de Persistencia"]
            SQLITE["SQLite Nativo (node:sqlite)<br/>WAL Mode + busy_timeout=5000<br/>Transacciones ACID Atómicas"]
        end
    end

    subgraph StorageVolume ["Volumen Persistente (/data)"]
        DBFILE[("matafuegos.db<br/>Base Activa SQLite")]
        WALFILE[("matafuegos.db-wal<br/>Write-Ahead Log")]
        BACKUPS[("backups/*.sqlite<br/>Snapshots VACUUM INTO")]
    end

    subgraph External ["Integraciones Externas"]
        M365["Microsoft 365 / ExcelJS<br/>Exportación de Auditoría ART"]
        GRAF["Prometheus / Grafana<br/>Scrape /api/metrics"]
    end

    M -->|HTTPS / WSS| TR
    D -->|HTTPS| TR
    TR --> SEC
    SEC --> LOG
    LOG --> VAL
    VAL --> AUTH
    AUTH --> ROUTES
    ROUTES --> ServicesLayer
    ServicesLayer --> SQLITE
    SQLITE --> DBFILE
    SQLITE --> WALFILE
    BAK --> BACKUPS
    OBS --> GRAF
    ROUTES --> M365
    SPA --> ExpressAPI
```

---

## 2. Decisiones Técnicas Fundamentales

### 2.1 Persistencia: SQLite en Modo WAL (`node:sqlite`)

- **Modo WAL (Write-Ahead Logging)**: Permite múltiples lectores simultáneos sin bloquear a los escritores, eliminando los errores de contención `SQLITE_BUSY`.
- **`busy_timeout = 5000`**: Si una escritura entra en colisión temporal, el motor espera hasta 5000 ms automáticamente antes de abortar.
- **Sin servidor de base de datos adicional**: Cero latencia de red en las consultas (in-process microsegundos), eliminando la necesidad de PostgreSQL o MySQL para un parque de 130 a 500 extintores.

### 2.2 Frontend: React 19 + Vite 8 (Rolldown Chunk Splitting)

- **Arquitectura de Chunks**:
  - `vendor-react`: React, React-DOM.
  - `vendor-icons`: Lucide React.
  - `vendor-table`: TanStack Table.
  - `index`: Lógica de la aplicación y componentes.
- **Offline-First**: Implementado sobre `localStorage` e `IndexedDB` con cola de sincronización de reintento automático al recuperar conectividad.

### 2.3 Seguridad y Privacidad

- **Contenedor No-Root**: La aplicación corre bajo el usuario sin privilegios `node` (UID/GID 1000).
- **Helmet Content Security Policy**: Reglas estrictas para scripts, estilos y fuentes, habilitando explícitamente `blob:` y `data:` para la captura de fotos de la cámara y decodificación de QR.
- **Inmutabilidad de Inspecciones**: Las inspecciones registradas bajo norma IRAM 3517-2 no admiten modificación (`PUT`/`PATCH`) ni borrado (`DELETE`), devolviendo `405 Method Not Allowed`.
- **Entropy de QRs**: Tokens de 24 caracteres hexadecimales criptográficamente generados con `crypto.randomBytes(12)`.

---

## 3. Modelo de Capas del Backend

1. **Capa de Transporte y Seguridad**: Helmet, Rate Limiter (general y login), CORS restringido, Parser multipart.
2. **Capa de Observabilidad**: Request ID (`X-Request-ID`), JSON estructurado, métricas en vivo.
3. **Capa de Validación y Autenticación**: Esquemas Zod estrictos, verificación de roles RBAC.
4. **Capa de Rutas (Controllers)**: Mapeo de verbos HTTP a servicios.
5. **Capa de Lógica de Negocio (Domain Services)**: Lógica pura, aislada y 100% testeable.
6. **Capa de Datos**: `node:sqlite`, migraciones incrementales automáticas idempotentes.
