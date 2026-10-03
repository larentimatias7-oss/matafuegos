# 📜 Historial de Cambios de la Documentación Técnica (Changelog)

> **Para quién es**: Cualquier persona interesada en conocer la evolución de la documentación técnica del proyecto.  
> **Qué vas a entender al terminarlo**: La trazabilidad de versiones, agregados y actualizaciones efectuadas sobre la base de conocimiento técnico de Milicic FireControl 365.

---

## [2.6.0] - 2026-10-03

### Agregado

- Documentación completa de arquitectura Docs-as-Code bajo estándar estructurado:
  - `docs/00-vision/`: Contexto, glosario normativo IRAM, requisitos funcionales y atributos de calidad.
  - `docs/01-arquitectura/`: Visión general, C4 Niveles 1 al 3, despliegue en Dokploy, catálogo de ADRs y matriz de deuda técnica.
  - `docs/02-modelo-de-dominio/`: Diagrama de clases UML, diagramas ERD con diccionario de datos, máquinas de estado del activo y casos, y catálogo numerado de reglas de negocio (`RN-001` a `RN-011`).
  - `docs/03-flujos/`: Diagramas de secuencia detallados (auth, PIN switch, escaneo, offline sync), flujos de actividad BPMN, casos de uso por rol y recorridos de usuario clave (Journeys).
  - `docs/04-api/`: Especificación OpenAPI 3.0.3 actualizada, guía de integración con ejemplos `curl` y catálogo de eventos de integración Microsoft 365 / Teams.
  - `docs/05-seguridad/`: Modelo de amenazas STRIDE con DFD, arquitectura de autenticación dual (Entra ID + Argon2id), inmutabilidad de evidencia legal, política de privacidad Ley 25.326 y checklist OWASP ASVS.
  - `docs/06-operacion/`: Runbook operativo, plan de continuidad y DRP (RPO/RTO), observabilidad y métricas Prometheus, diccionario exhaustivo de variables de entorno y guía de incidentes con plantilla postmortem.
  - `docs/07-desarrollo/`: Guía de inicio rápido en 15 minutos, estructura del repositorio comentada, estándares de código y Conventional Commits, estrategia de pruebas (Vitest, Playwright, Axe-Core), sistema de diseño corporativo Milicic, guía del contribuidor con DoD, pipeline CI/CD, motor de migraciones reversibles y guías de extensión paso a paso.
  - `docs/99-referencias/`: Inventario de dependencias y licencias, repositorio de diagramas fuente `.mmd` y changelog técnico.
- Scripts automatizados en `package.json`: `npm run docs:check` y `npm run docs:generate`.

---

## [1.0.0] - 2026-10-02

### Agregado

- Versión inicial del manual de usuario, inventario básico y especificación original de extintores portátiles.

---

## Archivos del código relacionados

- [`docs/README.md`](file:///c:/antigravity/matafuegos/docs/README.md) — Índice maestro de la documentación.
