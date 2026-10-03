# ADR-0002: SPA con hash routing (sin react-router)

> **Estado**: Aceptado
> **Fecha**: 2026-10-02 (documentado retroactivamente del código)

## Contexto

La app necesita múltiples vistas (dashboard, inventario, inspección, casos, usuarios, auditoría). Se debe decidir el mecanismo de navegación.

## Decisión

React SPA con navegación por `activeTab` en `useState` y hash fragments. Sin `react-router`.

## Justificación

- **Simplicidad**: no requiere configuración de rutas server-side más allá del SPA fallback.
- **La ruta pública `/m/:publicId`** (QR) se resuelve **en el servidor** antes del SPA fallback.
- **Offline**: el Service Worker solo necesita cachear un `index.html`.
- **Sin deep linking**: los usuarios no necesitan URLs bookmarkeables para cada vista.

## Consecuencias

- ⚠️ **Sin URLs directas a vistas**: no se puede compartir un link a "la lista de extintores del piso 3".
- ⚠️ **Sin back/forward**: el botón atrás del navegador no cambia de vista (podría implementarse con `hashchange`).
- ✅ **Build más liviano**: sin dependencia de `react-router`.
- ✅ **Menos complejidad en el Service Worker**.
