# ⏱️ Diagramas de Secuencia de Flujos Críticos

> **Para quién es**: Desarrolladores backend y frontend que necesitan entender el intercambio paso a paso de mensajes HTTP, sockets, consultas SQL y llamadas a servicios entre los componentes de Milicic FireControl 365.  
> **Qué vas a entender al terminarlo**: El ciclo de vida cronológico de los flujos más sensibles: autenticación, escaneo e inspección, sincronización offline, cambio rápido de usuario por PIN y backups de seguridad.

---

## 1. Login Local y Bloqueo por Fuerza Bruta

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Frontend (LoginModal)
    participant Auth as POST /api/auth/login
    participant Svc as AuthService
    participant DB as SQLite
    participant Audit as AuditService

    U->>FE: Ingresa email y contraseña
    FE->>Auth: POST { email, password }
    Auth->>Svc: authenticateLocal(email, password, ip, userAgent)
    Svc->>DB: SELECT * FROM usuarios WHERE email = ?

    alt Usuario no existe o inactivo
        Svc-->>Auth: Error 401 "Credenciales inválidas"
    else Usuario bloqueado temporalmente (bloqueado_hasta > NOW)
        Svc-->>Auth: Error 423 Locked "Cuenta bloqueada temporalmente"
    else Contraseña incorrecta
        Svc->>DB: UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1
        alt intentos >= 5
            Svc->>DB: UPDATE usuarios SET bloqueado_hasta = +15min
        end
        Svc-->>Auth: Error 401 "Credenciales inválidas"
    else Contraseña correcta (Argon2id verify)
        Svc->>DB: UPDATE usuarios SET intentos_fallidos = 0, ultimo_acceso = NOW()
        Svc->>DB: INSERT INTO sesiones (id, usuario_id, ip, ...)
        Svc->>Audit: recordAudit("LOGIN_EXITOSO")
        Auth-->>FE: 200 OK + Set-Cookie (session_id HttpOnly) + userProfile
        FE-->>U: Redirección al Dashboard
    end
```

---

## 2. Cambio Rápido de Usuario por PIN (Shared Device)

Permite alternar entre inspectores en una misma tablet industrial sin cerrar sesión completa.

```mermaid
sequenceDiagram
    actor I as Inspector B
    participant FE as QuickPinSwitchModal
    participant API as POST /api/auth/switch-pin
    participant Svc as AuthService
    participant DB as SQLite

    I->>FE: Selecciona su nombre e ingresa PIN (4-6 dígitos)
    FE->>API: POST { usuario_id, pin } (con Cookie de sesión actual)
    API->>Svc: switchUserByPin(usuario_id, pin, session_id)
    Svc->>DB: SELECT pin_hash, activo FROM usuarios WHERE id = ?
    Svc->>Svc: argon2.verify(pin_hash, pin)

    alt PIN Válido y Usuario Activo
        Svc->>DB: UPDATE sesiones SET usuario_id = ? WHERE id = ?
        Svc->>DB: INSERT INTO auditoria ("CAMBIO_USUARIO_PIN")
        API-->>FE: 200 OK { user: { id, nombre, rol, scope } }
        FE-->>I: Interfaz actualizada para Inspector B
    else PIN Incorrecto
        API-->>FE: 401 Unauthorized "PIN incorrecto"
    end
```

---

## 3. Escaneo QR, Inspección y Evaluación Antifraude

```mermaid
sequenceDiagram
    actor I as Inspector
    participant QR as Etiqueta QR
    participant CAM as Scanner html5-qrcode
    participant API as Backend Express
    participant AF as AntifraudService
    participant DB as SQLite
    participant M365 as Power Automate Webhook

    I->>CAM: Apunta cámara al extintor
    CAM->>QR: Lee URL `/m/<public_id>`
    CAM->>API: GET /m/:public_id
    API->>DB: SELECT code FROM extinguishers WHERE public_id = ?
    API-->>CAM: 302 Redirect `/?code=MF-012#check`

    I->>CAM: Completa checklist, foto y observaciones
    CAM->>API: POST /api/inspections { checklist, duration_seconds, photo }
    API->>API: authenticate + requirePermiso('inspeccion:crear') + requireSectorScope
    API->>AF: evaluate(duration_seconds, previousInspections)
    AF-->>API: { is_suspicious: 1, flags: "TIEMPO_INSPECCION_MENOR_5S" }

    API->>DB: BEGIN TRANSACTION
    API->>DB: INSERT INTO inspections (inmutable, inspector_name_snapshot, ...)
    alt passed = 0 (Con anomalías)
        API->>DB: INSERT INTO cases (status='ABIERTO', severity='ALTA')
    end
    API->>DB: COMMIT

    opt Notificación activada
        API->>M365: POST Webhook { event: "INSPECTION_FAIL", case_id }
    end

    API-->>CAM: 201 Created { id, passed, is_suspicious }
```

---

## 4. Sincronización Offline y Cuarentena de Sesión

```mermaid
sequenceDiagram
    participant PWA as PWA OfflineQueue
    participant API as /api/inspections
    participant DB as SQLite
    participant IDB as IndexedDB (quarantine)

    Note over PWA: Dispositivo recupera conexión a Internet
    PWA->>API: GET /api/auth/me
    alt Sesión expirada o usuario desactivado (401/403)
        API-->>PWA: 401 Unauthorized
        PWA->>IDB: quarantineInspections(pendingItems, "AUTH_REJECTED")
        PWA-->>PWA: Notifica al inspector: "Inspecciones guardadas para revisión"
    else Sesión activa
        API-->>PWA: 200 OK
        loop Por cada inspección offline
            PWA->>API: POST /api/inspections
            alt 201 Created o 409 (Duplicado)
                API-->>PWA: OK
                PWA->>PWA: removeOfflineInspection(id)
            else Error de conexión inesperado
                PWA-->>PWA: Detiene sincronización para próximo ciclo
            end
        end
    end
```

---

## Archivos del código relacionados

- [`server/routes/auth.js`](file:///c:/antigravity/matafuegos/server/routes/auth.js) — Endpoints de login y cambio de PIN.
- [`server/routes/inspections.js`](file:///c:/antigravity/matafuegos/server/routes/inspections.js) — Endpoint inmutable de inspecciones.
- [`server/services/antifraudService.js`](file:///c:/antigravity/matafuegos/server/services/antifraudService.js) — Detección de sospechas de fraude.
- [`src/utils/offlineQueue.js`](file:///c:/antigravity/matafuegos/src/utils/offlineQueue.js) — Gestión de cola IndexedDB y cuarentena.
