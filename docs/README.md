# 📚 Portal Maestro de Documentación Técnica — Milicic FireControl 365

> **Docs-as-Code** — Documentación técnica oficial derivada 100% del código fuente real de la aplicación.  
> Versión del Sistema: **2.6.0** | Norma: **IRAM 3517-2** | Stack: React 19, Express 5, SQLite WAL, Docker, Dokploy.

---

## 🗺️ Mapa de Lectura Recomendado por Perfil

| Perfil de Lector                        | Ruta de Lectura Sugerida                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nuevo Desarrollador (Onboarding)**    | [`07-desarrollo/GUIA-DE-INICIO.md`](./07-desarrollo/GUIA-DE-INICIO.md) $\rightarrow$ [`01-arquitectura/VISION-GENERAL.md`](./01-arquitectura/VISION-GENERAL.md) $\rightarrow$ [`07-desarrollo/ESTRUCTURA-DEL-REPOSITORIO.md`](./07-desarrollo/ESTRUCTURA-DEL-REPOSITORIO.md) $\rightarrow$ [`07-desarrollo/COMO-EXTENDER.md`](./07-desarrollo/COMO-EXTENDER.md) |
| **Ingeniero DevOps / SRE / Sysadmin**   | [`01-arquitectura/DESPLIEGUE.md`](./01-arquitectura/DESPLIEGUE.md) $\rightarrow$ [`06-operacion/RUNBOOK.md`](./06-operacion/RUNBOOK.md) $\rightarrow$ [`06-operacion/VARIABLES-DE-ENTORNO.md`](./06-operacion/VARIABLES-DE-ENTORNO.md) $\rightarrow$ [`06-operacion/CONTINUIDAD.md`](./06-operacion/CONTINUIDAD.md)                                             |
| **Auditor de Seguridad / Cumplimiento** | [`05-seguridad/INTEGRIDAD-Y-EVIDENCIA.md`](./05-seguridad/INTEGRIDAD-Y-EVIDENCIA.md) $\rightarrow$ [`05-seguridad/CHECKLIST-SEGURIDAD.md`](./05-seguridad/CHECKLIST-SEGURIDAD.md) $\rightarrow$ [`02-modelo-de-dominio/REGLAS-DE-NEGOCIO.md`](./02-modelo-de-dominio/REGLAS-DE-NEGOCIO.md)                                                                      |
| **Arquitecto de Software / Tech Lead**  | [`01-arquitectura/`](./01-arquitectura/) $\rightarrow$ [`02-modelo-de-dominio/`](./02-modelo-de-dominio/) $\rightarrow$ [`03-flujos/`](./03-flujos/) $\rightarrow$ [`01-arquitectura/DEUDA-TECNICA.md`](./01-arquitectura/DEUDA-TECNICA.md)                                                                                                                     |

---

## 📁 Estructura Completa de Documentación

### 00. Visión y Alcance

- [`00-vision/CONTEXTO-Y-ALCANCE.md`](./00-vision/CONTEXTO-Y-ALCANCE.md): Problema resuelto, usuarios y límites de alcance.
- [`00-vision/GLOSARIO.md`](./00-vision/GLOSARIO.md): Definiciones técnicas y normativas IRAM 3517-2.
- [`00-vision/REQUISITOS.md`](./00-vision/REQUISITOS.md): Requisitos funcionales y no funcionales trazados a módulos.
- [`00-vision/ATRIBUTOS-DE-CALIDAD.md`](./00-vision/ATRIBUTOS-DE-CALIDAD.md): Escenarios de calidad priorizados (rendimiento, offline, seguridad).

### 01. Arquitectura de Software

- [`01-arquitectura/VISION-GENERAL.md`](./01-arquitectura/VISION-GENERAL.md): Principios, capas y trade-offs de diseño.
- [`01-arquitectura/C4-1-CONTEXTO.md`](./01-arquitectura/C4-1-CONTEXTO.md): Modelo C4 Nivel 1 (Sistema, personas, servicios externos).
- [`01-arquitectura/C4-2-CONTENEDORES.md`](./01-arquitectura/C4-2-CONTENEDORES.md): Modelo C4 Nivel 2 (SPA/PWA, Express, SQLite, SW, Docker).
- [`01-arquitectura/C4-3-COMPONENTES-API.md`](./01-arquitectura/C4-3-COMPONENTES-API.md): Modelo C4 Nivel 3 Backend (Rutas, servicios, validators).
- [`01-arquitectura/C4-3-COMPONENTES-WEB.md`](./01-arquitectura/C4-3-COMPONENTES-WEB.md): Modelo C4 Nivel 3 Frontend (Vistas, estado, cola offline).
- [`01-arquitectura/DESPLIEGUE.md`](./01-arquitectura/DESPLIEGUE.md): Diagrama de infraestructura en Dokploy PaaS y Traefik.
- [`01-arquitectura/DECISIONES/`](./01-arquitectura/DECISIONES/): Catálogo de Registros de Decisiones Arquitectónicas (ADR-0001 a ADR-0005).
- [`01-arquitectura/DEUDA-TECNICA.md`](./01-arquitectura/DEUDA-TECNICA.md): Matriz priorizada de riesgos técnicos y limitaciones conocidas.

### 02. Modelo de Dominio y Datos

- [`02-modelo-de-dominio/UML-CLASES-DOMINIO.md`](./02-modelo-de-dominio/UML-CLASES-DOMINIO.md): Diagrama de clases UML y cardinalidades.
- [`02-modelo-de-dominio/ERD-BASE-DE-DATOS.md`](./02-modelo-de-dominio/ERD-BASE-DE-DATOS.md): Diagramas entidad-relación y diccionario de datos completo.
- [`02-modelo-de-dominio/UML-ESTADOS.md`](./02-modelo-de-dominio/UML-ESTADOS.md): Máquinas de estados del extintor, rondas, anomalías y sesiones.
- [`02-modelo-de-dominio/REGLAS-DE-NEGOCIO.md`](./02-modelo-de-dominio/REGLAS-DE-NEGOCIO.md): Catálogo numerado de reglas (`RN-001` a `RN-011`) con trazabilidad a código y tests.

### 03. Flujos Operativos y Casos de Uso

- [`03-flujos/UML-SECUENCIA-CRITICOS.md`](./03-flujos/UML-SECUENCIA-CRITICOS.md): Secuencias de auth, PIN switch, escaneo y offline sync.
- [`03-flujos/UML-ACTIVIDAD-PROCESOS.md`](./03-flujos/UML-ACTIVIDAD-PROCESOS.md): Actividades BPMN de ronda mensual, taller y recargas anuales.
- [`03-flujos/CASOS-DE-USO.md`](./03-flujos/CASOS-DE-USO.md): Casos de uso por rol y matriz granular de permisos RBAC.
- [`03-flujos/JOURNEYS.md`](./03-flujos/JOURNEYS.md): Recorridos de usuario (inspector en campo sin señal, supervisor, auditor).

### 04. API REST e Integraciones

- [`04-api/openapi.yaml`](./04-api/openapi.yaml): Especificación OpenAPI 3.0.3 validada.
- [`04-api/API-GUIA.md`](./04-api/API-GUIA.md): Convenciones, códigos de error y ejemplos con `curl`.
- [`04-api/EVENTOS-Y-WEBHOOKS.md`](./04-api/EVENTOS-Y-WEBHOOKS.md): Integración asíncrona con Microsoft 365, Teams y Power Automate.

### 05. Seguridad y Privacidad

- [`05-seguridad/MODELO-DE-AMENAZAS.md`](./05-seguridad/MODELO-DE-AMENAZAS.md): DFD con límites de confianza y análisis STRIDE.
- [`05-seguridad/AUTENTICACION-Y-AUTORIZACION.md`](./05-seguridad/AUTENTICACION-Y-AUTORIZACION.md): OIDC Entra ID, Local Argon2id, bloqueo temporal y IDOR.
- [`05-seguridad/INTEGRIDAD-Y-EVIDENCIA.md`](./05-seguridad/INTEGRIDAD-Y-EVIDENCIA.md): Inmutabilidad legal IRAM 3517-2 y bitácora de auditoría.
- [`05-seguridad/PRIVACIDAD-Y-RETENCION.md`](./05-seguridad/PRIVACIDAD-Y-RETENCION.md): Protección de datos personales (Ley 25.326) y retención legal.
- [`05-seguridad/CHECKLIST-SEGURIDAD.md`](./05-seguridad/CHECKLIST-SEGURIDAD.md): Lista de verificación pre-despliegue OWASP ASVS Nivel 2.

### 06. Operación y Confiabilidad

- [`06-operacion/RUNBOOK.md`](./06-operacion/RUNBOOK.md): Guía de operaciones diarias, backups en caliente y superadmin.
- [`06-operacion/CONTINUIDAD.md`](./06-operacion/CONTINUIDAD.md): Plan de continuidad, RPO/RTO y protocolos ante contingencias.
- [`06-operacion/OBSERVABILIDAD.md`](./06-operacion/OBSERVABILIDAD.md): Logs estructurados, métricas Prometheus y healthcheck.
- [`06-operacion/VARIABLES-DE-ENTORNO.md`](./06-operacion/VARIABLES-DE-ENTORNO.md): Diccionario completo de variables verificado con `.env.example`.
- [`06-operacion/INCIDENTES.md`](./06-operacion/INCIDENTES.md): Diagnóstico de problemas frecuentes y plantilla postmortem.

### 07. Desarrollo y Extensión

- [`07-desarrollo/GUIA-DE-INICIO.md`](./07-desarrollo/GUIA-DE-INICIO.md): Guía de instalación y primer arranque en 15 minutos.
- [`07-desarrollo/ESTRUCTURA-DEL-REPOSITORIO.md`](./07-desarrollo/ESTRUCTURA-DEL-REPOSITORIO.md): Árbol de carpetas comentado.
- [`07-desarrollo/CONVENCIONES.md`](./07-desarrollo/CONVENCIONES.md): Estándares de código, manejo de errores y Conventional Commits.
- [`07-desarrollo/ESTRATEGIA-DE-PRUEBAS.md`](./07-desarrollo/ESTRATEGIA-DE-PRUEBAS.md): Pirámide de pruebas (Vitest, Playwright, Axe-Core).
- [`07-desarrollo/DESIGN-SYSTEM.md`](./07-desarrollo/DESIGN-SYSTEM.md): Paleta corporativa Milicic (#EA580C y #0F172A) y ergonomía táctil.
- [`07-desarrollo/CONTRIBUIR.md`](./07-desarrollo/CONTRIBUIR.md): Flujo de contribución, plantilla de PR y Definición de Terminado (DoD).
- [`07-desarrollo/CI-CD.md`](./07-desarrollo/CI-CD.md): Pipeline en GitHub Actions y auto-deploy a Dokploy.
- [`07-desarrollo/MIGRACIONES.md`](./07-desarrollo/MIGRACIONES.md): Motor de migraciones atómicas y reversibles en SQLite.
- [`07-desarrollo/COMO-EXTENDER.md`](./07-desarrollo/COMO-EXTENDER.md): Guías paso a paso para añadir activos, permisos, endpoints y reportes.

### 99. Referencias y Metadatos

- [`99-referencias/DEPENDENCIAS.md`](./99-referencias/DEPENDENCIAS.md): Inventario de dependencias, licencias de código abierto y riesgos.
- [`99-referencias/DIAGRAMAS-FUENTE/`](./99-referencias/DIAGRAMAS-FUENTE/): Archivos `.mmd` fuente de todos los diagramas Mermaid.
- [`99-referencias/CHANGELOG-DOCS.md`](./99-referencias/CHANGELOG-DOCS.md): Historial de versiones de la documentación técnica.
- [`HALLAZGOS-DOCUMENTACION.md`](./HALLAZGOS-DOCUMENTACION.md): Bitácora de hallazgos e inconsistencias técnicas auditadas.
