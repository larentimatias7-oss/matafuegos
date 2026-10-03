# 👥 Casos de Uso por Rol y Matriz de Permisos

> **Para quién es**: Analistas de requerimientos, desarrolladores de seguridad y auditores que necesitan conocer exactamente qué operaciones puede y no puede realizar cada perfil de usuario en el sistema.  
> **Qué vas a entender al terminarlo**: El mapeo completo de casos de uso del sistema según los 5 roles definidos, las restricciones impuestas en el backend y la matriz granular de permisos.

---

## 1. Casos de Uso por Perfil

```mermaid
graph LR
    subgraph Roles
        SA["Superadmin (TI)"]
        AD["Administrador (Seg e Higiene)"]
        SV["Supervisor"]
        IN["Inspector"]
        AU["Auditor / Lectura"]
    end

    subgraph Casos de Uso
        CU1["CU-01: Gestionar Usuarios y Roles"]
        CU2["CU-02: Configurar Integraciones y Backups"]
        CU3["CU-03: Visualizar Auditoría Completa"]
        CU4["CU-04: Alta y Edición de Extintores"]
        CU5["CU-05: Abrir / Cerrar Rondas"]
        CU6["CU-06: Gestionar Casos y Taller"]
        CU7["CU-07: Escaneo e Inspección de Activos"]
        CU8["CU-08: Exportar Libros Excel y Reportes PDF"]
        CU9["CU-09: Cambio Rápido por PIN"]
    end

    SA --> CU1
    SA --> CU2
    SA --> CU3
    SA --> CU4
    SA --> CU5
    SA --> CU6
    SA --> CU7
    SA --> CU8
    SA --> CU9

    AD --> CU1
    AD --> CU4
    AD --> CU5
    AD --> CU6
    AD --> CU7
    AD --> CU8
    AD --> CU9

    SV --> CU5
    SV --> CU6
    SV --> CU7
    SV --> CU8
    SV --> CU9

    IN --> CU7
    IN --> CU9

    AU --> CU8
```

---

## 2. Matriz Granular de Permisos (RBAC)

Extraída directamente de la configuración centralizada en [`server/config/permissions.js`](file:///c:/antigravity/matafuegos/server/config/permissions.js):

| Permiso Técnico      | Descripción de Operación                   | `SUPERADMIN` | `ADMIN` | `SUPERVISOR` | `INSPECTOR` | `LECTURA` |
| -------------------- | ------------------------------------------ | :----------: | :-----: | :----------: | :---------: | :-------: |
| `extintor:crear`     | Dar de alta un nuevo extintor              |      ✅      |   ✅    |      ❌      |     ❌      |    ❌     |
| `extintor:editar`    | Modificar datos técnicos o ubicación       |      ✅      |   ✅    |      ❌      |     ❌      |    ❌     |
| `extintor:eliminar`  | Eliminar activo del parque                 |      ✅      |   ✅    |      ❌      |     ❌      |    ❌     |
| `inspeccion:crear`   | Registrar control mensual o reinspección   |      ✅      |   ✅    |      ✅      |     ✅      |    ❌     |
| `ronda:abrir_cerrar` | Abrir período o ejecutar cierre de ronda   |      ✅      |   ✅    |      ✅      |     ❌      |    ❌     |
| `caso:gestionar`     | Transicionar estados de casos y taller     |      ✅      |   ✅    |      ✅      |     ❌      |    ❌     |
| `usuario:gestionar`  | Crear, editar y desactivar usuarios        |      ✅      |   ✅    |      ❌      |     ❌      |    ❌     |
| `auditoria:ver`      | Consultar la bitácora inmutable de eventos |      ✅      |   ✅    |      ❌      |     ❌      |    ❌     |
| `reporte:exportar`   | Descargar libros Excel y reportes PDF      |      ✅      |   ✅    |      ✅      |     ❌      |    ✅     |
| `sistema:configurar` | Configurar webhooks M365 y backups         |      ✅      |   ❌    |      ❌      |     ❌      |    ❌     |

---

## 3. Reglas Críticas de Seguridad

1. **No Escalada**: Un usuario con rol `ADMIN` solo puede invitar o crear usuarios con roles `SUPERVISOR`, `INSPECTOR` o `LECTURA`. Nunca `SUPERADMIN` ni `ADMIN`.
2. **Inmutabilidad del Último Superadmin**: Si queda un solo usuario con rol `SUPERADMIN` activo en la organización, el backend rechaza de plano (`400 Bad Request`) su desactivación o degradación.
3. **Verificación Estricta en Servidor**: El acceso no depende de si el botón está visible u oculto en React; cada endpoint valida obligatoriamente `requirePermiso(...)`.

---

## Archivos del código relacionados

- [`server/config/permissions.js`](file:///c:/antigravity/matafuegos/server/config/permissions.js) — Definición formal de la matriz.
- [`server/middleware/auth.js`](file:///c:/antigravity/matafuegos/server/middleware/auth.js) — Implementación de `requirePermiso` y `requireRole`.
- [`tests/unit/rbac_matrix.test.js`](file:///c:/antigravity/matafuegos/tests/unit/rbac_matrix.test.js) — Pruebas unitarias de la matriz.
- [`tests/integration/auth_rbac.test.js`](file:///c:/antigravity/matafuegos/tests/integration/auth_rbac.test.js) — Pruebas de integración HTTP.
