# 🛠️ Guía Paso a Paso: Cómo Extender el Sistema

> **Para quién es**: Desarrolladores que necesitan añadir nuevas capacidades, tipos de activos, controles normativos o permisos a la aplicación.  
> **Qué vas a entender al terminarlo**: Instrucciones precisas y patrones de diseño para extender el sistema en 5 áreas habituales: agregar un tipo de activo, un nuevo check de inspección, un nuevo permiso RBAC, un endpoint protegido y una exportación a Excel.

---

## 1. Cómo Agregar un Nuevo Tipo de Activo o Extintor

Para incorporar un nuevo tipo de agente (por ejemplo, `Espuma AFFF`):

1. **Definir Vida Útil en el Servicio de Vencimientos** ([`server/services/expirationService.js`](file:///c:/antigravity/matafuegos/server/services/expirationService.js)):
   ```javascript
   function calculateLifespanLimit(fabYear, type) {
     const lifespanYears = type === 'CO2' ? 30 : 20; // Si Espuma AFFF tiene 20 años, se integra por defecto
     return `${fabYear + lifespanYears}-12-31`;
   }
   ```
2. **Actualizar el Validador de Tipos** ([`server/validators/schemas.js`](file:///c:/antigravity/matafuegos/server/validators/schemas.js)):
   ```javascript
   type: z.enum(['Polvo ABC', 'CO2', 'Acetato K', 'Agua', 'Haloclean', 'Espuma AFFF']);
   ```
3. **Añadir el Selector en el Frontend** ([`src/components/ExtinguishersList.jsx`](file:///c:/antigravity/matafuegos/src/components/ExtinguishersList.jsx)):
   Incorporar la opción en los filtros desplegables de tipo y en el modal de alta/edición.

---

## 2. Cómo Agregar un Nuevo Ítem al Checklist de Inspección

Para añadir un nuevo control obligatorio (por ejemplo, `check_soporte` para verificar la fijación mecánica a la pared):

1. **Crear una Migración** (`server/migrations/002_add_check_soporte.js`):
   ```javascript
   module.exports = {
     name: '002_add_check_soporte',
     up: db => db.exec('ALTER TABLE inspections ADD COLUMN check_soporte INTEGER DEFAULT 1;'),
     down: db => {}
   };
   ```
2. **Actualizar Esquema Zod** ([`server/validators/schemas.js`](file:///c:/antigravity/matafuegos/server/validators/schemas.js)):
   ```javascript
   check_soporte: z.number().int().min(0).max(1).optional();
   ```
3. **Incorporar el Control en la UI** ([`src/components/InspectionForm.jsx`](file:///c:/antigravity/matafuegos/src/components/InspectionForm.jsx)):
   Añadir el checkbox ergonómico correspondiente en la lista de verificación mensual.

---

## 3. Cómo Agregar un Nuevo Permiso Granular en RBAC

Para crear un permiso nuevo (por ejemplo, `reporte:programar`):

1. **Registrar en la Matriz** ([`server/config/permissions.js`](file:///c:/antigravity/matafuegos/server/config/permissions.js)):
   ```javascript
   const PERMISOS = {
     // ...
     REPORTE_PROGRAMAR: 'reporte:programar'
   };

   const ROLE_PERMISSIONS = {
     SUPERADMIN: [...todos],
     ADMIN: [..., PERMISOS.REPORTE_PROGRAMAR],
     // Asignar según la matriz deseada
   };
   ```
2. **Proteger el Endpoint en el Router**:
   ```javascript
   router.post('/api/reports/schedule', authenticate, requirePermiso('reporte:programar'), handler);
   ```
3. **Condicionar la Visibilidad en la UI**:
   ```jsx
   {
     hasPermiso('reporte:programar') && <BotonProgramarReporte />;
   }
   ```

---

## 4. Cómo Crear un Nuevo Endpoint Protegido con Auditoría

1. Declarar la ruta en `server/routes/`.
2. Encadenar los middlewares:
   ```javascript
   const { authenticate, requirePermiso, requireSectorScope } = require('../middleware/auth');
   const auditService = require('../services/auditService');

   router.put(
     '/api/recurso/:id',
     authenticate,
     requirePermiso('recurso:editar'),
     async (req, res, next) => {
       try {
         // Operación de actualización...
         auditService.recordAudit({
           usuario_id: req.user.id,
           accion: 'EDITAR_RECURSO',
           entidad: 'recurso',
           entidad_id: req.params.id,
           datos_antes: antes,
           datos_despues: despues,
           ip: req.ip,
           user_agent: req.headers['user-agent']
         });
         res.json({ success: true });
       } catch (err) {
         next(err);
       }
     }
   );
   ```

---

## Archivos del código relacionados

- [`server/config/permissions.js`](file:///c:/antigravity/matafuegos/server/config/permissions.js)
- [`server/validators/schemas.js`](file:///c:/antigravity/matafuegos/server/validators/schemas.js)
- [`server/services/auditService.js`](file:///c:/antigravity/matafuegos/server/services/auditService.js)
- [`src/components/InspectionForm.jsx`](file:///c:/antigravity/matafuegos/src/components/InspectionForm.jsx)
