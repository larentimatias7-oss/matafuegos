# ADR-0005: Offline con IndexedDB y cuarentena

> **Estado**: Aceptado
> **Fecha**: 2026-10-02 (documentado retroactivamente del código)

## Contexto

Los inspectores trabajan en subsuelos y depósitos sin WiFi/4G. Las inspecciones deben poder registrarse offline y sincronizarse cuando la conectividad se restaure.

## Decisión

IndexedDB como cola offline con dos stores (`pending_inspections`, `quarantine_inspections`). Service Worker con estrategia network-first para navegación y cache-first para assets.

## Justificación

- **IndexedDB**: soporta datos estructurados, fotos (base64) y es persistente entre sesiones.
- **Cuarentena**: si el usuario fue desactivado mientras estaba offline, las inspecciones no se pierden sino que se mueven a un store separado para revisión del supervisor.
- **Compresión de fotos**: Canvas API reduce el peso de las fotos antes de almacenarlas en IndexedDB (1200px max, JPEG 70%).

## Consecuencias

- ⚠️ **Sin retry automático**: la sync solo ocurre cuando la app detecta `navigator.onLine`. No hay background sync ni periodic sync.
- ⚠️ **Modo privado**: IndexedDB puede ser limpiado por el navegador en modo incógnito.
- ⚠️ **Capacidad**: depende del navegador (generalmente > 100 MB).
- ✅ **Cuarentena**: protege contra envío de datos de un usuario revocado.
- ✅ **Compresión**: reduce consumo de datos móviles.
