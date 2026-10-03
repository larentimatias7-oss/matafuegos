# 📚 Documentación Técnica — Milicic FireControl 365

> Documentación técnica completa para programadores que se incorporen al proyecto o lo mantengan.
> Generada del código real. Idioma: español argentino.

---

## Índice de Documentos

| #   | Documento                                                      | Descripción                                                                                                                                  |
| --- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 00  | [Inventario Técnico](./00-INVENTARIO.md)                       | Inventario completo del repositorio: stack, tablas, endpoints, roles, servicios, componentes, tests, variables de entorno.                   |
| 01  | [Arquitectura del Sistema](./01-ARQUITECTURA.md)               | Visión general, decisiones arquitectónicas (ADR), capas, modelo de datos (ER diagram), autenticación, despliegue, seguridad, observabilidad. |
| 02  | [Modelo de Dominio](./02-MODELO-DOMINIO.md)                    | Entidades, campos, reglas de negocio IRAM 3517-2, semáforo de estado, niveles de alerta, validaciones, glosario.                             |
| 03  | [Flujos Operativos](./03-FLUJOS-OPERATIVOS.md)                 | Flujos de inspección, sync offline, autenticación (local + Entra ID + PIN), anomalías, rondas, backup, Excel, QR, M365.                      |
| 04  | [API, Seguridad y Operación](./04-API-SEGURIDAD-OPERACION.md)  | Referencia REST, modelo de seguridad, rate limiting, auditoría, Docker, healthcheck, métricas Prometheus, CI/CD.                             |
| 05  | [Guía de Desarrollo y Extensión](./05-DESARROLLO-EXTENSION.md) | Setup, cómo agregar migraciones/endpoints/permisos/componentes, testing, linting, build, convenciones.                                       |
| —   | [Hallazgos de Documentación](./HALLAZGOS-DOCUMENTACION.md)     | Ambigüedades, inconsistencias y posibles defectos encontrados durante la auditoría del código.                                               |

---

## Documentación preexistente

Estos documentos **anteriores** se mantienen en la carpeta `docs/` por compatibilidad:

| Documento                                    | Descripción                                            |
| -------------------------------------------- | ------------------------------------------------------ |
| [ADR-usuarios.md](./ADR-usuarios.md)         | ADR del sistema de usuarios y roles.                   |
| [ROLES.md](./ROLES.md)                       | Documentación de roles y permisos.                     |
| [M365_INTEGRATION.md](./M365_INTEGRATION.md) | Guía de integración con Microsoft 365.                 |
| [openapi.yaml](./openapi.yaml)               | Especificación OpenAPI (puede requerir actualización). |

---

## Documentación en la raíz del proyecto

| Documento                                 | Descripción                                    |
| ----------------------------------------- | ---------------------------------------------- |
| [README.md](../README.md)                 | Guía de inicio rápido y overview del proyecto. |
| [ARQUITECTURA.md](../ARQUITECTURA.md)     | Documento de arquitectura original.            |
| [CHANGELOG.md](../CHANGELOG.md)           | Registro de cambios.                           |
| [DESIGN.md](../DESIGN.md)                 | Decisiones de diseño visual.                   |
| [GUIA_INSPECTOR.md](../GUIA_INSPECTOR.md) | Guía de uso para inspectores de campo.         |
| [RUNBOOK.md](../RUNBOOK.md)               | Procedimientos operativos.                     |

---

## Principios de documentación

1. **Derivada del código**: cada afirmación fue verificada contra el código fuente.
2. **Docs-as-code**: Markdown + Mermaid, versionados con Git.
3. **Hallazgos honestos**: si algo es ambiguo o parece un defecto, se documenta en [HALLAZGOS-DOCUMENTACION.md](./HALLAZGOS-DOCUMENTACION.md).
4. **Idioma**: español argentino. Código en inglés.
