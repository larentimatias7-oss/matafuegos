# 📊 Observabilidad, Métricas y Monitoreo del Sistema

> **Para quién es**: Operadores de infraestructura, ingenieros SRE y administradores de monitoreo con Prometheus y Grafana.  
> **Qué vas a entender al terminarlo**: Cómo instrumenta Milicic FireControl 365 sus logs estructurados, las métricas Prometheus expuestas en `/api/metrics`, el endpoint de salud `/api/health` y cómo configurar alertas automáticas.

---

## 1. Logs Estructurados y Trazabilidad

El sistema incorpora un logger propio sin dependencias externas pesadas (`server/logger.js`) que respeta las mejores prácticas de observabilidad:

- **Trazabilidad por Request**: Todo request HTTP recibe un `x-request-id` único generado al ingresar, el cual se propaga en los logs asociados y se retorna en los encabezados HTTP.
- **Formato**:
  - **Producción (`NODE_ENV=production`)**: Emite líneas en formato JSON plano (`ndjson`) preparadas para ser indexadas por Datadog, Loki o ElasticSearch.
  - **Desarrollo**: Emite texto coloreado de fácil lectura humana.
- **Sanitización de Seguridad**: Las contraseñas, PINs, tokens de sesión y fotos base64 son excluidos estrictamente de los logs.

---

## 2. Métricas Prometheus (`GET /api/metrics`)

Expone contadores y gauges en formato estándar OpenMetrics compatible con Prometheus y Telegraf:

| Nombre de la Métrica               |  Tipo   | Descripción                                                 |
| ---------------------------------- | :-----: | ----------------------------------------------------------- |
| `firecontrol_uptime_seconds`       |  Gauge  | Tiempo de actividad continuo del proceso en segundos        |
| `firecontrol_memory_heap_bytes`    |  Gauge  | Memoria heap asignada al runtime de Node.js                 |
| `firecontrol_memory_rss_bytes`     |  Gauge  | Memoria física total (RSS) consumida por el contenedor      |
| `firecontrol_http_requests_total`  | Counter | Total acumulado de peticiones HTTP procesadas               |
| `firecontrol_http_errors_total`    | Counter | Peticiones que respondieron con código 4xx o 5xx            |
| `firecontrol_extinguishers_total`  |  Gauge  | Cantidad total de extintores en el inventario               |
| `firecontrol_inspections_total`    | Counter | Total acumulado de controles mensuales registrados          |
| `firecontrol_inspections_today`    |  Gauge  | Controles realizados en el día de la fecha                  |
| `firecontrol_open_cases_total`     |  Gauge  | Anomalías pendientes de resolución en campo o taller        |
| `firecontrol_round_coverage_ratio` |  Gauge  | Porcentaje de avance de la ronda mensual actual (0.0 a 1.0) |

---

## 3. Verificación de Salud (`GET /api/health`)

Utilizado por Docker `HEALTHCHECK`, Dokploy y balanceadores de carga para determinar la vitalidad del servicio:

```json
{
  "status": "healthy",
  "system": "Milicic FireControl 365",
  "timestamp": "2026-10-02T18:00:00.000Z",
  "uptimeSeconds": 86400,
  "checks": {
    "database": {
      "status": "healthy",
      "integrity": "ok"
    },
    "storage": {
      "status": "healthy",
      "freeMb": 8450,
      "freePercent": 45.2
    },
    "memory": {
      "status": "healthy",
      "rssMb": 68.4,
      "heapUsedMb": 32.1
    }
  }
}
```

Si la base de datos no responde a `PRAGMA integrity_check` o el disco tiene menos del 5% libre, el endpoint responde `503 Service Unavailable`.

---

## Archivos del código relacionados

- [`server/middleware/logger.js`](file:///c:/antigravity/matafuegos/server/middleware/logger.js) — Logger estructurado con request-id.
- [`server/routes/health.js`](file:///c:/antigravity/matafuegos/server/routes/health.js) — Implementación del healthcheck.
- [`server/routes/metrics.js`](file:///c:/antigravity/matafuegos/server/routes/metrics.js) — Recolección y serialización de métricas Prometheus.
