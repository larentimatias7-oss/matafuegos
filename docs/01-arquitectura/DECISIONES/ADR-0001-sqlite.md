# ADR-0001: SQLite como base de datos

> **Estado**: Aceptado
> **Fecha**: 2026-10-02 (documentado retroactivamente del código)

## Contexto

El sistema necesita persistencia de datos para extintores, inspecciones, usuarios y auditoría. El entorno de despliegue es un único contenedor Docker en un servidor con Dokploy.

## Opciones consideradas

1. **PostgreSQL**: RDBMS robusto, requiere contenedor separado.
2. **SQLite**: Embebida, sin servidor, un archivo.
3. **MongoDB**: NoSQL, requiere servidor separado.

## Decisión

SQLite con la API nativa `node:sqlite` (DatabaseSync) de Node.js 22.

## Justificación

- **Simplicidad operativa**: un archivo, sin proceso separado, backup con `VACUUM INTO`.
- **Sin dependencias nativas**: `node:sqlite` es builtin, no requiere `better-sqlite3` (C++).
- **Volumen adecuado**: ≈130 extintores, ≈1500 inspecciones/año. SQLite maneja millones de filas.
- **WAL mode**: Permite lecturas concurrentes durante escrituras.

## Consecuencias

- ⚠️ **No escala horizontalmente**: un solo escritor. Si se necesitara multi-instancia, habría que migrar.
- ⚠️ **Node 22+ obligatorio**: La API `node:sqlite` no está disponible en versiones anteriores.
- ✅ **Backup simple**: `VACUUM INTO` genera una copia atómica sin bloquear el servicio.
- ✅ **Deploy simple**: Un contenedor con un volumen persistente.
