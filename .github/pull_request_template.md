### 📝 Descripción del Cambio

- Breve descripción del cambio o de la funcionalidad incorporada.

### 🔒 Impacto en Seguridad y Permisos

- [ ] ¿Requiere un nuevo permiso en `server/config/permissions.js`?
- [ ] ¿Afecta el aislamiento multi-organización o por sector?
- [ ] ¿Preserva la inmutabilidad de inspecciones históricas (IRAM 3517-2)?

### 🧪 Verificación Realizada

- [ ] `npm test -- --run` pasó al 100% (unitarios e integración API).
- [ ] `npm run test:e2e` pasó al 100% (Playwright multi-dispositivo).
- [ ] `npm run lint` pasó sin errores.

### 📚 Documentación (Docs-as-Code)

- [ ] ¿Actualicé la documentación y los diagramas afectados en `docs/`?
- [ ] `npm run docs:check` pasó sin errores de enlaces ni de sintaxis Mermaid.
