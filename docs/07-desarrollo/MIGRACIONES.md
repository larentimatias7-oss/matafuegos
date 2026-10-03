# 🗃️ Guía de Migraciones de Base de Datos Versionadas y Reversibles

> **Para quién es**: Desarrolladores backend y administradores de base de datos que necesitan modificar el esquema de tablas en SQLite.  
> **Qué vas a entender al terminarlo**: La arquitectura del motor de migraciones propio de Milicic FireControl 365, cómo se aplican de forma atómica y el procedimiento para crear y revertir una migración con métodos `up()` y `down()`.

---

## 1. Arquitectura del Motor de Migraciones

Para mantener el principio de cero dependencias externas innecesarias, el sistema incluye un runner nativo en [`server/migrations/index.js`](file:///c:/antigravity/matafuegos/server/migrations/index.js):

- **Control de Versiones**: Utiliza la tabla interna `_migrations(id, name, applied_at)` en SQLite.
- **Ejecución Automática**: Al iniciar el servidor en `server/db.js`, el runner lee todos los archivos en `server/migrations/`, detecta los no aplicados y los ejecuta en orden lexicográfico dentro de una transacción.
- **Atomicidad Transaccional**: Si una migración falla a mitad de camino, se ejecuta un `ROLLBACK` completo en SQLite, impidiendo esquemas a medio aplicar o inconsistentes.

---

## 2. Creación de una Nueva Migración

Para añadir o alterar tablas, se crea un nuevo archivo numerado secuencialmente en `server/migrations/`:

**Ejemplo**: `server/migrations/002_agregar_tabla_proveedores.js`

```javascript
/**
 * Migración 002: Tabla de Proveedores de Mantenimiento Externo
 */
module.exports = {
  name: '002_agregar_tabla_proveedores',

  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS proveedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        cuit TEXT,
        habilitacion_iram TEXT,
        activo INTEGER DEFAULT 1,
        creado_en TEXT DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE extinguishers ADD COLUMN proveedor_id INTEGER REFERENCES proveedores(id);
    `);
  },

  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS proveedores;
    `);
  }
};
```

---

## 3. Pruebas y Validación de Migraciones

Para validar que las migraciones son completamente reversibles sin corromper la base de datos de producción:

```bash
# Ejecutar las pruebas de integración de migraciones
npm test tests/integration/migrations.test.js
```

El test valida:

1. Aplicación limpia de todas las migraciones en una base virgen (`up`).
2. Rollback controlado de las migraciones en orden inverso (`down`).
3. Preservación intacta de datos preexistentes sin pérdida de filas históricas.

---

## Archivos del código relacionados

- [`server/migrations/index.js`](file:///c:/antigravity/matafuegos/server/migrations/index.js) — Orquestador de migraciones atómicas.
- [`server/migrations/001_multi_org_and_users.js`](file:///c:/antigravity/matafuegos/server/migrations/001_multi_org_and_users.js) — Migración inicial multi-organización y usuarios.
- [`tests/integration/migrations.test.js`](file:///c:/antigravity/matafuegos/tests/integration/migrations.test.js) — Suite de verificación de migraciones.
