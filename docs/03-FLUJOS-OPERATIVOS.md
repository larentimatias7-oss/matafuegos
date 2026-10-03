# 🔄 Flujos Operativos

> **Derivado del código real** — `server/routes/*.js`, `server/services/*.js`, `src/components/*.jsx`, `src/utils/offlineQueue.js`.
> Última actualización: 2026-10-02

---

## 1. Flujo de Inspección Mensual

El flujo principal del sistema. Un inspector recorre los extintores de su sector, escanea el QR y completa el checklist.

```mermaid
sequenceDiagram
    actor I as Inspector
    participant QR as QR Físico
    participant PWA as PWA (Scanner)
    participant API as Backend
    participant DB as SQLite
    participant AF as AntifraudService
    participant Audit as AuditService
    participant WH as M365 Webhook

    I->>QR: Escanea con cámara
    QR-->>PWA: public_id extraído
    PWA->>API: GET /m/:publicId
    API->>DB: SELECT code FROM extinguishers WHERE public_id = ?
    API-->>PWA: Redirect /?code=MF-042#check

    PWA->>PWA: Abre InspectionForm con datos del extintor
    I->>PWA: Completa checklist + foto + observaciones
    PWA->>PWA: Timer de duración (start → submit)
    PWA->>PWA: Compresión de foto (Canvas 1200px, JPEG 70%)

    alt Online
        PWA->>API: POST /api/inspections
        API->>API: Validate (Zod + roundService)
        API->>AF: evaluateInspectionFraud(duration, intervalo)
        AF-->>API: {isSuspicious, fraudFlags}
        API->>DB: INSERT INTO inspections (inmutable)
        API->>Audit: recordAudit("CREAR_INSPECCION")
        API-->>WH: POST webhook (si falla)
        API-->>PWA: 201 Created
    else Offline
        PWA->>PWA: enqueueOfflineInspection() → IndexedDB
        PWA-->>I: "Guardado offline, se sincronizará"
    end
```

### 1.1 Validaciones en el registro de inspección

1. **Ronda abierta**: debe existir una ronda con `status = 'ABIERTA'` para el `year_month` actual.
2. **Inspección única**: el extintor no debe tener otra inspección en el mismo `year_month`, salvo que sea reinspección con motivo justificado (≥ 5 caracteres).
3. **Antifraude**: el servicio `antifraudService` evalúa:
   - `TIEMPO_INSPECCION_MENOR_5S`: duración < 5 segundos.
   - `DURACION_CERO`: duración reportada como 0.
   - `INTERVALO_CONSECUTIVO_SOSPECHOSO`: < 8 segundos desde la inspección anterior del mismo inspector.
4. **Alcance sectorial**: si el usuario tiene sectores asignados, el extintor debe estar en su alcance.

---

## 2. Flujo de Sincronización Offline

```mermaid
flowchart TD
    A["Dispositivo vuelve online"] --> B["App detecta navigator.onLine"]
    B --> C["syncOfflineInspections()"]
    C --> D["GET /api/auth/me"]
    D --> E{"¿Sesión válida?"}
    E -->|No| F["quarantineInspections()\n→ IndexedDB quarantine_inspections"]
    F --> G["Notificar: AUTH_REJECTED"]
    E -->|Sí| H["Loop: POST /api/inspections\npor cada pendiente"]
    H --> I{"¿Respuesta OK\no 409?"}
    I -->|Sí| J["removeOfflineInspection(id)"]
    I -->|401/403| K["quarantineInspections(remaining)"]
    I -->|Error otro| L["Incrementar failed"]
    J --> M["Siguiente item"]
    K --> N["Retornar AUTH_REJECTED"]
    M --> H
```

### 2.1 Cuarentena

Si durante la sincronización la sesión es rechazada (usuario desactivado, sesión revocada), todas las inspecciones **pendientes restantes** se mueven al store `quarantine_inspections` de IndexedDB con:

- `quarantined_at`: timestamp.
- `quarantine_reason`: mensaje del servidor.

Estas inspecciones quedan disponibles para revisión manual por un supervisor.

---

## 3. Flujo de Autenticación

### 3.1 Login Local

```mermaid
sequenceDiagram
    actor U as Usuario
    participant PWA as LoginModal
    participant API as POST /api/auth/login
    participant Auth as authService
    participant DB as SQLite

    U->>PWA: Email + contraseña
    PWA->>API: POST {email, password}
    API->>DB: SELECT FROM usuarios WHERE email = ?

    alt Usuario no encontrado
        API-->>PWA: 401 "Credenciales inválidas"
    else Usuario bloqueado
        API-->>PWA: 403 "Cuenta bloqueada hasta HH:MM"
    else Password incorrecta
        API->>Auth: handleFailedLogin() → incrementar intentos
        API-->>PWA: 401 "Credenciales inválidas"
    else OK
        API->>Auth: verifyPassword(hash, password) ✓
        API->>Auth: resetFailedLogin()
        API->>Auth: createSession() → sesiones table
        API-->>PWA: Set-Cookie firecontrol_session + userData
        PWA->>PWA: localStorage.setItem + setUser()
    end
```

### 3.2 Login Microsoft Entra ID (OIDC)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant PWA as LoginModal
    participant API as Backend
    participant Entra as Microsoft Entra ID
    participant DB as SQLite

    U->>PWA: Click "Iniciar con Microsoft"
    PWA->>API: GET /api/auth/entra/login
    API-->>U: Redirect a login.microsoftonline.com
    U->>Entra: Credenciales corporativas
    Entra-->>API: GET /api/auth/entra/callback?code=...
    API->>Entra: Exchange code → access_token
    API->>Entra: GET /me → {oid, email, nombre}
    API->>DB: provisionEntraUser() (JIT)

    Note over API,DB: Si el usuario no existe,<br/>se crea con rol mapeado<br/>desde grupos de Entra

    API->>DB: createSession()
    API-->>U: Redirect a / + Set-Cookie
```

### 3.3 Cambio Rápido por PIN

Para dispositivos compartidos (tablet de inspección), los usuarios pueden cambiar rápidamente sin cerrar la app:

```mermaid
sequenceDiagram
    actor I as Inspector actual
    participant PWA as QuickPinSwitchModal
    participant API as POST /api/auth/pin-switch
    participant DB as SQLite

    I->>PWA: Selecciona otro usuario + PIN
    PWA->>API: POST {email, pin}
    API->>DB: SELECT FROM usuarios WHERE email = ?
    API->>API: verifyPin(pin_hash, pin)

    alt PIN correcto
        API->>DB: Revocar sesión anterior
        API->>DB: createSession() para nuevo usuario
        API-->>PWA: Set-Cookie + userData
    else PIN incorrecto
        API->>DB: Incrementar pin_intentos_fallidos
        API-->>PWA: 401
    end
```

---

## 4. Flujo de Gestión de Anomalías (Casos)

```mermaid
stateDiagram-v2
    direction LR
    [*] --> ABIERTO : Inspección detecta falla\no reporte manual

    ABIERTO --> EN_TALLER : Extintor enviado\na taller certificado
    ABIERTO --> TEMP_REPLACED : Se coloca\nextintor sustituto
    ABIERTO --> RESUELTO : Resolución directa\n(requiere notas ≥5 chars)

    EN_TALLER --> TEMP_REPLACED : Sustituto colocado\n(requiere código sustituto)
    EN_TALLER --> RESUELTO : Retorno de taller OK\n(requiere notas ≥5 chars)

    TEMP_REPLACED --> EN_TALLER : Sustituto retirado,\noriginal sigue en taller
    TEMP_REPLACED --> RESUELTO : Original reinstalado\n(requiere notas ≥5 chars)

    RESUELTO --> [*] : Estado terminal
```

### 4.1 Validaciones de transición (`anomalyService.js`)

| Transición        | Validación adicional                                                 |
| ----------------- | -------------------------------------------------------------------- |
| → `RESUELTO`      | `resolution_notes` obligatorio, mínimo 5 caracteres.                 |
| → `TEMP_REPLACED` | `temp_replacement_code` obligatorio (código del extintor sustituto). |
| Desde `RESUELTO`  | **Prohibido**: estado terminal, no permite transición posterior.     |

---

## 5. Flujo de Ronda Mensual

```mermaid
flowchart TD
    A["Inicio de mes"] --> B{"¿Existe ronda\npara YYYY-MM?"}
    B -->|No| C["Auto-creación:\nINSERT INTO rounds\n(ABIERTA)"]
    B -->|Sí| D["Usar ronda existente"]
    C --> D
    D --> E["Inspectores realizan\ncontroles mensuales"]
    E --> F["Dashboard muestra\ncobertura en tiempo real"]
    F --> G{"¿100% cobertura?"}
    G -->|No| E
    G -->|Sí| H["Supervisor/Admin\ncierra ronda"]
    H --> I["UPDATE rounds\nSET status = 'CERRADA'"]
```

### 5.1 Cobertura de ronda (`roundService.js`)

```
cobertura = extintores_distintos_inspeccionados / total_extintores_operativos × 100
```

El servicio `groupPendingBySector()` agrupa los extintores **pendientes** por piso y sector para facilitar la planificación de rutas.

---

## 6. Flujo de Backup y Restore

### 6.1 Backup (`backupService.js`)

```mermaid
sequenceDiagram
    participant Admin as Admin/Script
    participant BS as backupService
    participant DB as SQLite
    participant FS as Filesystem

    Admin->>BS: createBackup(db)
    BS->>DB: VACUUM INTO '/data/backups/firecontrol-backup-2026-10-02T...sqlite'
    DB-->>FS: Archivo .sqlite compactado
    BS->>BS: verifyBackupIntegrity(path)
    BS->>DB: PRAGMA integrity_check (en backup)

    alt Integridad OK
        BS-->>Admin: {path, sizeBytes, durationMs, integrityOk: true}
    else Corrupto
        BS->>FS: Eliminar archivo corrupto
        BS-->>Admin: Error: backup corrupto
    end
```

### 6.2 Retención automática

```javascript
cleanOldBackups({
  keepCount: 7, // Máximo 7 backups recientes
  maxAgeDays: 30 // Máximo 30 días de antigüedad
});
```

### 6.3 Restore

1. Verificar integridad del archivo fuente (`PRAGMA integrity_check`).
2. Eliminar archivos WAL/SHM del destino.
3. Copiar archivo atómicamente (`fs.copyFileSync`).
4. Si `EBUSY`/`EPERM`: instrucciones para detener el contenedor primero.

---

## 7. Flujo de Importación/Exportación Excel

### 7.1 Importación masiva

```mermaid
flowchart TD
    A["Usuario sube .xlsx"] --> B["multer recibe archivo"]
    B --> C["ExcelJS parsea filas"]
    C --> D["validateExcelImportRows()"]
    D --> E{"¿Filas válidas?"}
    E -->|Sí| F["INSERT OR IGNORE\npor cada fila válida"]
    E -->|No| G["Retornar errores\npor fila"]
    F --> H["Generar public_id\npara cada nuevo extintor"]
    H --> I["Respuesta:\nvalidRows, invalidRows,\nduplicateCodes"]
```

### 7.2 Exportación

El sistema exporta a Excel (.xlsx) las siguientes entidades:

- Inventario completo de extintores con estado de semáforo.
- Historial de inspecciones por ronda.
- Reporte de anomalías/casos.

---

## 8. Flujo de Integración M365

### 8.1 Webhook de Power Automate

Cuando una inspección resulta con fallas (`passed = false`), el sistema envía un POST al webhook configurado en `settings.m365_webhook_url` con el payload de la inspección para activar un flujo de Power Automate (ej: notificación en canal de Teams).

### 8.2 Sincronización con SharePoint

El módulo `routes/m365.js` (29KB) gestiona:

- Exportación de datos a listas de SharePoint.
- Subida de reportes a bibliotecas de documentos.
- Lectura de configuración desde SharePoint.

---

## 9. Flujo de Escaneo QR

```mermaid
sequenceDiagram
    actor I as Inspector
    participant Cam as Cámara del celular
    participant Scan as Scanner.jsx
    participant SW as Service Worker
    participant API as Backend

    I->>Cam: Apunta al QR del extintor
    Cam->>Scan: html5-qrcode decodifica URL

    alt URL contiene /m/<publicId>
        Scan->>API: GET /m/<publicId>
        API->>API: SELECT code FROM extinguishers WHERE public_id = ?
        API-->>Scan: Redirect /?code=MF-042#check
        Scan->>Scan: Navegar a InspectionForm
    else URL contiene ?code=MF-042
        Scan->>Scan: Extraer código directamente
        Scan->>Scan: Navegar a InspectionForm
    end
```

> **Nota crítica**: Los QR ya impresos contienen URLs del formato `https://<BASE_URL>/m/<publicId>`. El `publicId` es inmutable (24 hex chars generado una sola vez).
