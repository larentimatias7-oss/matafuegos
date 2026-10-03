# Diagrama de Despliegue

> **Para quién**: DevOps, administradores y desarrolladores que configuren o diagnostiquen el entorno de producción.
> **Qué vas a entender**: Cómo se despliega el sistema, la infraestructura, volúmenes, red y monitoreo.

---

## Diagrama de Despliegue

> **Propósito**: Vista de infraestructura y red del sistema en producción.
> **Verificado contra**: `Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml`.
> **Fecha**: 2026-10-02

```mermaid
graph TB
    subgraph "GitHub"
        Repo["Repositorio\nmatafuegos"]
        CI["GitHub Actions\nCI/CD Pipeline"]
    end

    subgraph "Servidor Dokploy"
        Traefik["Traefik\n(reverse proxy + TLS)"]
        subgraph "Contenedor Docker"
            Node["node:22-alpine\n(usuario: node)"]
            Express["Express 5\n(puerto 3000)"]
            Dist["dist/\n(assets React)"]
        end
        subgraph "Volumen Persistente"
            DB["matafuegos.db\n(SQLite WAL)"]
            BK["backups/\n(VACUUM INTO)"]
        end
    end

    subgraph "Servicios Externos"
        Entra["Microsoft\nEntra ID"]
        PA["Power\nAutomate"]
        Prom["Prometheus\n+ Grafana"]
    end

    subgraph "Clientes"
        Phone["Smartphone\n(PWA, QR scan)"]
        PC["PC\n(Browser)"]
    end

    Repo -->|push main| CI
    CI -->|webhook POST| Traefik
    Traefik -->|HTTP :3000| Express
    Express --> DB
    Express --> BK
    Phone -->|HTTPS| Traefik
    PC -->|HTTPS| Traefik
    Express <-->|OIDC| Entra
    Express -->|webhook| PA
    Prom -->|scrape /api/metrics| Express
```

---

## Componentes de Infraestructura

| Componente        | Detalle                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| **Servidor**      | VPS/Servidor dedicado con Dokploy instalado                               |
| **Reverse Proxy** | Traefik (gestionado por Dokploy): TLS automático (Let's Encrypt), routing |
| **Contenedor**    | `node:22-alpine`, multi-stage build, corre como usuario `node` (no root)  |
| **Volumen**       | Docker named volume `milicic_matafuegos_data` → `/data`                   |
| **DB**            | `/data/matafuegos.db` (SQLite, journal_mode=WAL)                          |
| **Backups**       | `/data/backups/*.sqlite` (VACUUM INTO, retención: 7 archivos / 30 días)   |
| **Puerto**        | 3000 (interno), expuesto a Traefik                                        |
| **Healthcheck**   | `wget -qO- http://localhost:3000/api/health` cada 30s                     |

## Pipeline CI/CD

```
push/PR → npm audit → Prettier → ESLint → Vitest → Vite build → Playwright → Axe → Docker build → Webhook Dokploy
```

| Job               | Timeout | Trigger                  |
| ----------------- | ------- | ------------------------ |
| quality-and-tests | 15 min  | Push/PR a main           |
| docker-build      | 10 min  | Post quality-and-tests   |
| deploy-dokploy    | 5 min   | Solo push a main (no PR) |

## Variables de entorno en producción

Ver documento completo: [06-operacion/VARIABLES-DE-ENTORNO.md](../06-operacion/VARIABLES-DE-ENTORNO.md)

---

## Archivos del código relacionados

- [Dockerfile](file:///c:/antigravity/matafuegos/Dockerfile) — Multi-stage build
- [docker-compose.yml](file:///c:/antigravity/matafuegos/docker-compose.yml) — Servicio y volumen
- [.github/workflows/ci.yml](file:///c:/antigravity/matafuegos/.github/workflows/ci.yml) — Pipeline
- [server/routes/health.js](file:///c:/antigravity/matafuegos/server/routes/health.js) — Healthcheck
