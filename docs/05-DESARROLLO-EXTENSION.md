# 🛠️ Guía de Desarrollo y Extensión

> **Derivado del código real** — `package.json`, `vite.config.js`, `vitest.config.js`, `eslint.config.js`, `Dockerfile`, `server/migrations/index.js`.
> Última actualización: 2026-10-02

---

## 1. Setup del Entorno de Desarrollo

### 1.1 Prerequisitos

- **Node.js 22+** (requerido por `node:sqlite` DatabaseSync).
- **npm** (viene con Node.js).
- **Git**.

### 1.2 Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd matafuegos

# Instalar dependencias
npm install

# Copiar configuración de entorno
cp .env.example .env
```

### 1.3 Inicio en desarrollo

Se necesitan dos terminales:

```bash
# Terminal 1: Backend Express (API + DB)
npm start
# → http://localhost:3000

# Terminal 2: Frontend Vite (HMR + proxy)
npm run dev
# → http://localhost:5173 (proxy /api → :3000)
```

El proxy de Vite (`vite.config.js`) redirige `/api` y `/uploads` al backend en `:3000`.

### 1.4 Desarrollo HTTPS (para cámara móvil)

La cámara del navegador requiere HTTPS en LAN. Si se tienen certificados en `certs/`:

```bash
npm run dev:https
# → https://<ip-local>:5173
```

El servidor Express también soporta HTTPS con `HTTPS=true`.

### 1.5 Base de datos de desarrollo

Al iniciar, si la DB está vacía, el sistema:

1. Crea las tablas base (`db.js`).
2. Aplica migraciones (`migrations/`).
3. Siembra 130 extintores de prueba (`seed130Extinguishers()`), excepto en `NODE_ENV=production` sin `ALLOW_SEED=true`.

**Ubicación**: `./data/matafuegos.db` (SQLite).

---

## 2. Estructura del Código

### 2.1 Backend (CommonJS)

```
server/
├── index.js               # Express app, middleware pipeline, rutas
├── config.js               # Validación de ENV
├── db.js                   # DDL, ensureColumn, seed
├── config/permissions.js   # RBAC (fuente única de verdad)
├── middleware/
│   ├── auth.js             # authenticate, requireRole, requirePermiso, sector scope
│   ├── errorHandler.js     # Error centralizado + 404
│   └── logger.js           # Request ID, métricas
├── routes/                 # 12 módulos de rutas Express
├── services/               # 8 servicios de lógica de dominio
├── validators/             # Zod schemas + validadores de negocio
└── migrations/             # Migraciones versionadas up/down
```

> **Convención**: `type: "commonjs"` en `package.json`. Usar `require()`.

### 2.2 Frontend (ESM + JSX)

```
src/
├── main.jsx               # ReactDOM.createRoot
├── App.jsx                # Router hash, estado global, sync offline
├── index.css              # Design system completo (CSS variables, dark/light)
├── components/            # 19 componentes React
└── utils/
    └── offlineQueue.js    # IndexedDB, sync, cuarentena, compresión
```

> **Convención**: ESM (`import/export`). Sin `react-router`, navegación por `activeTab` + hash.

---

## 3. Cómo Agregar una Migración

### 3.1 Crear archivo

Crear `server/migrations/002_nombre_descriptivo.js` con:

```javascript
function up(db) {
  // DDL: CREATE TABLE, ALTER TABLE, INSERT, UPDATE
  db.exec(`
    ALTER TABLE extinguishers ADD COLUMN nuevo_campo TEXT DEFAULT '';
  `);
}

function down(db) {
  // Rollback (si SQLite lo soporta)
  // NOTA: SQLite no soporta DROP COLUMN directamente.
  // Para columnas: no hacer nada o reconstruir tabla.
}

module.exports = { up, down };
```

### 3.2 Nomenclatura

- Prefijo numérico de 3 dígitos: `001_`, `002_`, etc.
- Nombre descriptivo en snake_case.
- El runner ordena por prefijo numérico.

### 3.3 Ejecución

Las migraciones se aplican **automáticamente** al iniciar el servidor (`initSchema()` → `runMigrations()`). Se registran en la tabla `schema_migrations`.

### 3.4 Rollback

```javascript
const { rollbackLastMigration } = require('./migrations');
const { db } = require('./db');
rollbackLastMigration(db);
```

---

## 4. Cómo Agregar un Endpoint

### 4.1 Crear o modificar archivo de ruta

```javascript
// server/routes/mi_modulo.js
const express = require('express');
const router = express.Router();
const { authenticate, requirePermiso } = require('../middleware/auth');
const { PERMISOS } = require('../config/permissions');
const { db } = require('../db');
const { recordAudit } = require('../services/auditService');

router.get('/', authenticate, requirePermiso(PERMISOS.INVENTARIO_VER), (req, res) => {
  try {
    const orgId = req.user.organizacion_id || 1;
    const rows = db.prepare('SELECT * FROM mi_tabla WHERE organizacion_id = ?').all(orgId);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
```

### 4.2 Montar en `server/index.js`

```javascript
app.use('/api/mi-modulo', require('./routes/mi_modulo'));
```

### 4.3 Checklist de nuevo endpoint

- [ ] Usar `authenticate` middleware.
- [ ] Aplicar `requirePermiso()` o `requireRole()`.
- [ ] Filtrar por `organizacion_id`.
- [ ] Aplicar `requireSectorScope` si aplica.
- [ ] Registrar auditoría con `recordAudit()` en mutaciones.
- [ ] Validar input con Zod schema via `validateBody()`.
- [ ] Retornar `{ success: true/false, data/error }`.
- [ ] Agregar test de integración.

---

## 5. Cómo Agregar un Permiso

### 5.1 Definir en `config/permissions.js`

```javascript
const PERMISOS = {
  // ... existentes ...
  MI_MODULO_VER: 'mi_modulo:ver',
  MI_MODULO_CREAR: 'mi_modulo:crear'
};
```

### 5.2 Asignar a roles en `ROLE_PERMISSIONS`

```javascript
const ROLE_PERMISSIONS = {
  [ROLES.SUPERADMIN]: Object.values(PERMISOS), // automático
  [ROLES.ADMIN]: [
    // ... existentes ...
    PERMISOS.MI_MODULO_VER,
    PERMISOS.MI_MODULO_CREAR
  ]
  // etc.
};
```

### 5.3 Actualizar migración

La migración 001 siembra los permisos de `config/permissions.js` en las tablas `permisos` y `roles_permisos`. Los nuevos permisos se insertarán automáticamente al reiniciar (INSERT OR IGNORE).

---

## 6. Cómo Agregar un Componente Frontend

### 6.1 Crear componente

```jsx
// src/components/MiComponente.jsx
import React, { useState, useEffect } from 'react';

export default function MiComponente({ user, onNavigate }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/mi-modulo')
      .then(r => r.json())
      .then(d => d.success && setData(d.data));
  }, []);

  return (
    <div className="card">
      <h2>Mi Módulo</h2>
      {/* ... */}
    </div>
  );
}
```

### 6.2 Integrar en `App.jsx`

1. Importar el componente.
2. Agregar case en el renderizado de tabs.
3. Agregar tab en `Navbar.jsx` con el permiso correspondiente.

### 6.3 Design System CSS

Las clases CSS están definidas en `src/index.css`. Usar:

- `.card` para contenedores.
- `.btn`, `.btn-primary`, `.btn-danger` para botones.
- `.badge-*` para indicadores.
- Variables CSS: `--milicic-orange`, `--milicic-dark`, `--bg-*`, `--text-*`.
- Tema: `[data-theme="dark"]` / `[data-theme="light"]`.

---

## 7. Testing

### 7.1 Ejecutar tests

```bash
# Todos los tests (unit + integration)
npm test

# Solo unitarios
npm run test:unit

# Solo integración (API)
npm run test:api

# E2E (requiere servidor corriendo)
npm run test:e2e

# Accesibilidad
npm run test:a11y

# Carga
npm run test:load

# Con cobertura
npm run test:coverage
```

### 7.2 Estructura de tests

| Directorio           | Framework          | Fixtures                                                          |
| -------------------- | ------------------ | ----------------------------------------------------------------- |
| `tests/unit/`        | Vitest             | No requiere servidor ni DB. Testean servicios y validators puros. |
| `tests/integration/` | Vitest + Supertest | Usan la app Express real con DB en memoria o temporal.            |
| `tests/e2e/`         | Playwright         | Requieren servidor corriendo. Usan helper `tests/e2e/helpers.js`. |
| `tests/perf/`        | Autocannon         | Requieren servidor corriendo.                                     |

### 7.3 Convenciones de testing

- Nombre: `<modulo>.test.js` (unit/integration), `<flujo>.spec.js` (e2e).
- Variables de entorno para tests: `NODE_ENV=test`, `PORT=3001`, `RATE_LIMIT_DISABLED=true`.
- Para tests de autorización: usar header `x-user-role` en lugar de sesiones reales.

### 7.4 Tests existentes (inventario)

**Unitarios (9)**:

- `anomaly.test.js` — Máquina de estados de casos.
- `antifraud.test.js` — Reglas antifraude.
- `backup_service.test.js` — Backup service.
- `expiration.test.js` — Cálculos de vencimiento IRAM.
- `rbac_matrix.test.js` — Matriz de permisos.
- `round.test.js` — Cobertura y reinspección.
- `schemas.test.js` — Schemas Zod.
- `semaphore.test.js` — Resolución de semáforo.
- `validators.test.js` — Validadores de datos.

**Integración (13)**:

- `auth_endpoints.test.js` — Login, logout, sesiones.
- `auth_rbac.test.js` — Autorización por roles.
- `backup_restore.test.js` — Backup y restore E2E.
- `cases_transitions.test.js` — Transiciones de casos.
- `excel_io.test.js` — Import/export Excel.
- `extinguishers_crud.test.js` — CRUD de extintores.
- `health.test.js` — Healthcheck.
- `idor_and_scope.test.js` — Pruebas IDOR y alcance sectorial.
- `inspections_immutability.test.js` — Inmutabilidad de inspecciones.
- `migrations.test.js` — Migraciones up/down.
- `observability.test.js` — Logs y métricas.
- `security.test.js` — CSP, rate limit, headers.
- `users_admin.test.js` — CRUD de usuarios.

**E2E (11)**:

- `a11y_axe.spec.js` — Accesibilidad con axe-core.
- `export_excel_pdf.spec.js` — Exportación.
- `fault_report.spec.js` — Reporte de fallas.
- `inspector_flow.spec.js` — Flujo del inspector.
- `inventory_crud.spec.js` — CRUD inventario.
- `login_dashboard.spec.js` — Login y dashboard.
- `mobile_layout_scroll.spec.js` — Responsive mobile.
- `offline_sync.spec.js` — Sync offline.
- `qr_generation_decode.spec.js` — QR.
- `users_and_auth.spec.js` — Usuarios.

---

## 8. Linting y Formateo

```bash
# Lint
npm run lint          # Solo verificar
npm run lint:fix      # Corregir automáticamente

# Format
npm run format        # Prettier: src/**/*.{js,jsx,css} server/**/*.js
```

Configuración:

- ESLint: `eslint.config.js` (flat config v9).
- Prettier: `.prettierrc.json`.
- Pre-commit hook: Husky + lint-staged (ESLint + Prettier).

---

## 9. Build y Optimización

### 9.1 Build de producción

```bash
npm run build
# Genera dist/ con chunks optimizados
```

### 9.2 Chunk splitting (`vite.config.js`)

| Chunk          | Contenido               |
| -------------- | ----------------------- |
| `vendor-react` | `react`, `react-dom`    |
| `vendor-icons` | `@phosphor-icons/react` |
| `vendor-table` | `@tanstack/react-table` |
| `vendor-excel` | `exceljs`               |

### 9.3 Caching en producción

- Assets hasheados (`/assets/`): `Cache-Control: public, max-age=31536000, immutable`.
- `index.html`: `Cache-Control: no-cache, no-store, must-revalidate`.

---

## 10. Convenciones del Proyecto

### 10.1 Código

- **Backend**: CommonJS (`require/module.exports`). SQL con prepared statements.
- **Frontend**: ESM + JSX. Estado con `useState`/`useEffect`.
- **Idioma del código**: Nombres de variables y funciones en **inglés**. Mensajes de usuario, errores y logs en **español argentino**.
- **Fechas**: Siempre `YYYY-MM-DD` en la DB. Zona horaria: `America/Argentina/Buenos_Aires`.
- **IDs públicos**: 24 caracteres hexadecimales (`crypto.randomBytes(12).toString('hex')`).
- **UUIDs**: `crypto.randomUUID()` para IDs de usuarios.

### 10.2 Commits

- Pre-commit hook ejecuta `npm run lint && npm run test:unit`.
- Se recomienda Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`.

### 10.3 Documentación

- `docs/` contiene documentación técnica versionada con el código.
- Diagramas en Mermaid dentro de bloques \`\`\`mermaid.
- Idioma: español argentino.
