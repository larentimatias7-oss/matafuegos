# C4 Nivel 1 — Diagrama de Contexto

> **Para quién**: Cualquier persona que necesite ver el sistema desde afuera: qué actores lo usan y qué sistemas externos lo rodean.
> **Qué vas a entender**: Los límites del sistema, los roles de usuario y las integraciones externas.

---

## Diagrama de Contexto

> **Propósito**: Mostrar Milicic FireControl 365 como caja negra, sus actores y sistemas externos.
> **Verificado contra**: `server/index.js`, `server/routes/auth.js`, `server/routes/m365.js`, `server/routes/metrics.js`.
> **Fecha**: 2026-10-02

```mermaid
graph TB
    subgraph "Actores"
        Inspector["🧑‍🔧 Inspector\n(smartphone/PWA)"]
        Supervisor["👨‍💼 Supervisor\n(PC/tablet)"]
        Admin["🛠️ Administrador\n(PC)"]
        Auditor["📋 Auditor\n(PC, solo lectura)"]
    end

    FC["🔥 Milicic FireControl 365\n(Monolito Node.js + SQLite)"]

    subgraph "Sistemas Externos"
        EntraID["Microsoft Entra ID\n(OIDC)"]
        M365["M365 Power Automate\n(webhook HTTP)"]
        SharePoint["SharePoint Online\n(API Graph)"]
        Prometheus["Prometheus / Grafana\n(scraping)"]
        Dokploy["Dokploy PaaS\n(webhook deploy)"]
        GitHub["GitHub Actions\n(CI/CD)"]
    end

    Inspector -->|Escanea QR,\ninspecciona,\nfoto, offline| FC
    Supervisor -->|Cierra rondas,\ngestiona anomalías,\nrevisión| FC
    Admin -->|Gestiona usuarios,\nimporta extintores,\nconfig| FC
    Auditor -->|Consulta\ninspecciones\ny auditoría| FC

    FC <-->|OIDC login\nJIT provisioning| EntraID
    FC -->|Webhook POST\n(inspección con falla)| M365
    FC <-->|Sync listas\ny documentos| SharePoint
    FC -->|/api/metrics\n(text/plain)| Prometheus
    GitHub -->|Webhook HTTP POST| Dokploy
    Dokploy -->|Pull + rebuild| FC
```

### Leyenda

| Color/Forma                     | Significado                     |
| ------------------------------- | ------------------------------- |
| Rectángulo con emoji de persona | Actor humano                    |
| Rectángulo central              | Sistema FireControl 365         |
| Rectángulos externos            | Sistemas de terceros            |
| Flecha con texto                | Interacción (protocolo y datos) |

---

## Actores

| Actor         | Rol en el código                              | Descripción                                 |
| ------------- | --------------------------------------------- | ------------------------------------------- |
| Inspector     | `INSPECTOR` (nivel 40)                        | Realiza inspecciones mensuales con celular. |
| Supervisor    | `SUPERVISOR` (nivel 60)                       | Gestiona rondas y anomalías.                |
| Administrador | `ADMIN` (nivel 80) o `SUPERADMIN` (nivel 100) | Gestión completa.                           |
| Auditor       | `AUDITOR` (nivel 20)                          | Solo lectura de todo + auditoría.           |

## Sistemas Externos

| Sistema                  | Obligatorio                | Protocolo                             | Archivo                    |
| ------------------------ | -------------------------- | ------------------------------------- | -------------------------- |
| Microsoft Entra ID       | No (opcional)              | OIDC (HTTP redirect + token exchange) | `routes/auth.js`           |
| M365 Power Automate      | No (opcional)              | HTTP POST (webhook)                   | `routes/inspections.js`    |
| SharePoint Online        | No (opcional)              | REST API + OAuth                      | `routes/m365.js`           |
| Prometheus               | No (opcional)              | HTTP GET scraping                     | `routes/metrics.js`        |
| GitHub Actions → Dokploy | No (manual deploy posible) | HTTP POST webhook                     | `.github/workflows/ci.yml` |

---

## Archivos del código relacionados

- [server/index.js](file:///c:/antigravity/matafuegos/server/index.js) — Montaje de rutas y middleware
- [server/routes/auth.js](file:///c:/antigravity/matafuegos/server/routes/auth.js) — Integración Entra ID
- [server/routes/m365.js](file:///c:/antigravity/matafuegos/server/routes/m365.js) — Integración M365
- [server/routes/metrics.js](file:///c:/antigravity/matafuegos/server/routes/metrics.js) — Métricas Prometheus
- [server/config/permissions.js](file:///c:/antigravity/matafuegos/server/config/permissions.js) — Roles
