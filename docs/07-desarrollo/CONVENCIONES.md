# 📐 Convenciones de Código, Estilo y Flujo de Trabajo

> **Para quién es**: Todos los desarrolladores y revisores de código que contribuyen al repositorio.  
> **Qué vas a entender al terminarlo**: Los estándares de nomenclatura, arquitectura de código, manejo de errores, formato de mensajes de commit (Conventional Commits) y pautas para revisiones de código (Code Reviews).

---

## 1. Convenciones de Lenguaje y Estructura

### 1.1 Backend (Node.js 22 / Express)

- **Módulos**: CommonJS estricto (`const x = require('...')` y `module.exports = { ... }`).
- **Nomenclatura**:
  - Archivos de rutas y servicios: `camelCase` (ej. `authService.js`, `expirationService.js`).
  - Columnas de base de datos SQL: `snake_case` (ej. `organizacion_id`, `inspector_name_snapshot`).
  - Variables y funciones: `camelCase` (ej. `calculateExpiration()`, `userProfile`).
- **Manejo de Errores**: Todo controlador Express debe atrapar excepciones en bloques `try/catch` y pasarlas al manejador centralizado `next(error)`.
- **Logs**: Prohibido el uso de `console.log` o `console.error` en código de servidor; utilizar siempre el logger estructurado:
  ```javascript
  const logger = require('../logger');
  logger.info('Extintor actualizado con éxito', { extinguisherId: id, user: req.user.id });
  ```

### 1.2 Frontend (React 19 / JSX)

- **Módulos**: ES Modules (`import/export`).
- **Componentes**: Componentes funcionales en archivos `.jsx` con nomenclatura `PascalCase` (ej. `UsersList.jsx`, `InspectionForm.jsx`).
- **Estilos**: Uso de variables CSS nativas (`var(--color-primary)`, `var(--bg-card)`) definidas en `src/index.css`. Prohibido el uso de estilos inline con valores hexadecimales arbitrarios.
- **Iconografía**: Utilizar exclusivamente los íconos de `@phosphor-icons/react` para mantener coherencia estética.

---

## 2. Convenciones de Git y Mensajes de Commit

El proyecto adhiere al estándar **Conventional Commits 1.0.0**:

```text
<tipo>(<alcance opcional>): <descripción concisa en imperativo>

[cuerpo explicativo opcional]

[referencias a issues opcional]
```

### Tipos Permitidos

- `feat`: Nueva funcionalidad para el usuario (ej. `feat(auth): implementar cambio rápido por PIN`).
- `fix`: Corrección de un defecto o bug (ej. `fix(inspections): evitar doble envío en conexiones lentas`).
- `docs`: Modificaciones exclusivamente en la carpeta `docs/` o documentación interna.
- `refactor`: Cambio en el código que no corrige un bug ni añade una feature.
- `test`: Incorporación o corrección de pruebas unitarias, de integración o E2E.
- `chore`: Tareas de build, dependencias o configuración que no tocan código de producción.

---

## 3. Revisión de Código (Code Review Checklist)

Antes de aprobar cualquier Pull Request, los revisores deben verificar:

1. ¿La nueva funcionalidad está protegida por un middleware de autorización (`requirePermiso` / `requireSectorScope`) en el backend?
2. ¿Se ejecutaron y pasaron todas las pruebas automatizadas (`npm test` y `npm run test:e2e`)?
3. ¿Se preservó la inmutabilidad de los registros históricos de inspección?
4. ¿Se respetaron los tokens visuales y la identidad corporativa de Milicic?

---

## Archivos del código relacionados

- [`eslint.config.js`](file:///c:/antigravity/matafuegos/eslint.config.js) — Reglas de linter para React y Node.js.
- [`server/middleware/logger.js`](file:///c:/antigravity/matafuegos/server/middleware/logger.js) — Logger estándar del backend.
- [`src/index.css`](file:///c:/antigravity/matafuegos/src/index.css) — Tokens globales del sistema de diseño.
