# Contexto y Alcance

> **Para quién**: Cualquier persona que necesite entender rápidamente qué hace esta aplicación, para quién y qué queda fuera.
> **Qué vas a entender**: El problema que resuelve, los usuarios objetivo, las restricciones del entorno y los límites explícitos del sistema.

---

## 1. Problema que resuelve

Milicic S.A. es una empresa constructora con sede central en Rosario que debe cumplir con la norma **IRAM 3517-2** de mantenimiento de extintores portátiles. Antes de este sistema, el control se hacía con planillas Excel, chequeos manuales y tarjetas de cartón — sin trazabilidad, sin evidencia fotográfica y sin alertas de vencimiento.

**Milicic FireControl 365** digitaliza todo el ciclo de vida del extintor: alta, inspección mensual, anomalías, taller, recarga, prueba hidráulica y baja — con evidencia inmutable, auditoría y alertas automáticas.

---

## 2. Usuarios del sistema

| Rol               | Perfil real                                                                               | Dispositivo habitual         |
| ----------------- | ----------------------------------------------------------------------------------------- | ---------------------------- |
| **Inspector**     | Operario de Seguridad e Higiene (HyS) que recorre los pisos con un celular escaneando QR  | Smartphone Android/iOS (PWA) |
| **Supervisor**    | Jefe de HyS que revisa cobertura, cierra rondas y gestiona anomalías                      | PC de escritorio o tablet    |
| **Administrador** | Responsable de IT/HyS que gestiona usuarios, importa extintores y configura integraciones | PC de escritorio             |
| **Superadmin**    | Administrador con acceso total, incluyendo backup, config y gestión de la organización    | PC de escritorio             |
| **Auditor**       | Personal interno o externo con acceso de solo lectura a inspecciones y auditoría          | PC de escritorio             |

---

## 3. Entorno operativo

- **Conectividad**: Los inspectores trabajan en subsuelos, depósitos y zonas de obra con señal WiFi/4G intermitente. El sistema **debe funcionar offline** para el flujo de inspección.
- **Dispositivos compartidos**: Una tablet puede ser compartida por 2-3 inspectores en campo. Se requiere cambio rápido de usuario sin cerrar la app (PIN).
- **QR físicos**: Los extintores tienen etiquetas QR impresas y pegadas. Las URLs codificadas (`/m/<publicId>`) **no pueden cambiar** sin reimprimir todas las etiquetas.
- **Normativa**: IRAM 3517-2 exige evidencia de cada control mensual. Las inspecciones registradas son legalmente vinculantes y no deben poder ser modificadas ni eliminadas.

---

## 4. Qué está dentro del alcance

- ✅ Inventario de extintores portátiles con datos técnicos completos
- ✅ Inspección mensual por QR con checklist configurable
- ✅ PWA con funcionamiento offline (cola en IndexedDB)
- ✅ Autenticación local y corporativa (Microsoft Entra ID)
- ✅ RBAC con 5 roles, 27 permisos y alcance sectorial
- ✅ Gestión de anomalías/casos con máquina de estados
- ✅ Auditoría inmutable (append-only) con doble escritura
- ✅ Backup y restore con VACUUM INTO y verificación de integridad
- ✅ Integración con Microsoft 365 (Power Automate, SharePoint)
- ✅ Métricas Prometheus y healthcheck para monitoreo
- ✅ CI/CD con GitHub Actions → Dokploy

---

## 5. Qué está fuera del alcance

- ❌ **Otros tipos de activos**: El modelo genérico fue diseñado pero actualmente solo se implementan extintores portátiles.
- ❌ **Multi-organización real**: La tabla `organizaciones` existe pero solo hay una organización (Milicic S.A., id=1). El filtrado multitenant está implementado pero no probado con múltiples orgs.
- ❌ **Notificaciones por email**: Las variables SMTP están definidas en `.env.example` pero el servicio de envío de emails **no está implementado** en el código actual.
- ❌ **Flujo de compras**: No hay módulo de compras, presupuestos ni proveedores más allá del campo `supplier` en extintores.
- ❌ **App nativa**: Solo PWA. No hay app store builds.
- ❌ **Cadena de hashes con anclaje externo**: Aunque se mencionó en la arquitectura, la implementación actual de auditoría es append-only pero **no implementa hashing encadenado** ni anclaje externo.

---

## Archivos del código relacionados

- [README.md](file:///c:/antigravity/matafuegos/README.md) — Overview del proyecto
- [server/config.js](file:///c:/antigravity/matafuegos/server/config.js) — Configuración del entorno
- [server/config/permissions.js](file:///c:/antigravity/matafuegos/server/config/permissions.js) — Roles y permisos
- [public/manifest.webmanifest](file:///c:/antigravity/matafuegos/public/manifest.webmanifest) — Definición PWA
- [.env.example](file:///c:/antigravity/matafuegos/.env.example) — Variables de entorno
