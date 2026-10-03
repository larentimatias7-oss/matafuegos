# 🧩 Diagrama de Clases del Dominio

> **Para quién es**: Desarrolladores backend, arquitectos de software e ingenieros que necesitan comprender la estructura orientada a objetos y las entidades de negocio de Milicic FireControl 365.  
> **Qué vas a entender al terminarlo**: Cuáles son las entidades centrales del dominio, cómo se relacionan entre sí, sus multiplicidades (cardinalidades) y los métodos o reglas de negocio que encapsulan.

---

## 1. Diagrama de Clases (UML)

```mermaid
classDiagram
    direction TB

    class Organizacion {
        +int id
        +string nombre
        +boolean activa
        +string creado_en
    }

    class Usuario {
        +string id
        +int organizacion_id
        +string nombre
        +string apellido
        +string email
        +string origen
        +string rol
        +boolean activo
        +boolean debe_cambiar_password
        +string ultimo_acceso
        +validarPassword(pass)
        +validarPIN(pin)
        +desactivar()
        +cambiarRol(nuevoRol)
    }

    class SectorScope {
        +int id
        +string usuario_id
        +string edificio
        +string piso
        +string sector
    }

    class Extintor {
        +int id
        +int organizacion_id
        +string code
        +string public_id
        +string type
        +string capacity
        +string location
        +string area
        +string floor
        +string building
        +string expiration_charge
        +string expiration_ph
        +string status
        +int fab_year
        +string supplier
        +calcularVencimientos()
        +pasarATaller()
        +retornarOperativo()
        +darDeBaja()
    }

    class Ronda {
        +int id
        +int organizacion_id
        +string name
        +string year_month
        +string status
        +string opened_at
        +string closed_at
        +string notes
        +cerrarRonda(notas)
        +reabrirRonda()
        +calcularCobertura()
    }

    class Inspeccion {
        +int id
        +int extinguisher_id
        +int round_id
        +string usuario_id
        +string inspector_name_snapshot
        +string inspection_date
        +boolean passed
        +boolean check_location
        +boolean check_access
        +boolean check_seal
        +boolean check_pressure
        +boolean check_hose
        +boolean check_card
        +int duration_seconds
        +boolean is_suspicious
        +string fraud_flags
        +boolean is_reinspection
        +string photo_url
        +validarAntifraude()
    }

    class Caso {
        +int id
        +int extinguisher_id
        +int inspection_id
        +string status
        +string severity
        +string description
        +string assigned_to
        +string opened_at
        +string closed_at
        +string resolution_notes
        +transicionarA(nuevoEstado, notas)
    }

    class Auditoria {
        +int id
        +string fecha
        +string usuario_id
        +string accion
        +string entidad
        +string entidad_id
        +json datos_antes
        +json datos_despues
        +string ip
        +string user_agent
    }

    Organizacion "1" -- "0..*" Usuario : agrupa
    Organizacion "1" -- "0..*" Extintor : gestiona
    Organizacion "1" -- "0..*" Ronda : calendariza
    Usuario "1" -- "0..*" SectorScope : asignado
    Usuario "1" -- "0..*" Inspeccion : ejecuta
    Usuario "1" -- "0..*" Auditoria : genera
    Extintor "1" -- "0..*" Inspeccion : recibe
    Extintor "1" -- "0..*" Caso : origina
    Ronda "1" -- "0..*" Inspeccion : consolida
    Inspeccion "1" -- "0..1" Caso : dispara
```

---

## 2. Descripción de Entidades y Reglas

### 2.1 Organización (`Organizacion`)

Raíz multi-inquilino (_multi-tenant_). En la versión actual de Milicic S.A. existe la organización por defecto (`id = 1`), pero todas las entidades de negocio (`Extintor`, `Ronda`, `Usuario`) contienen `organizacion_id`.

### 2.2 Extintor (`Extintor`)

Representa el activo crítico de seguridad. Encapsula las reglas técnicas de la norma **IRAM 3517-2**:

- Vida útil máxima: 20 años para Polvo ABC / Agua / Acetato, 30 años para CO2.
- Recarga obligatoria: frecuencia de 12 meses.
- Prueba Hidráulica (PH): frecuencia de 5 años.

### 2.3 Inspección (`Inspeccion`)

Registro inmutable y legalmente vinculante del control mensual.

- **Inmutabilidad**: Prohibición estricta de `PUT`, `PATCH` y `DELETE` en la API.
- **Antifraude**: Inspecciones con duración menor a 5 segundos son etiquetadas automáticamente como `TIEMPO_INSPECCION_MENOR_5S` para revisión del Supervisor.
- **Snapshot de identidad**: Almacena `inspector_name_snapshot` para preservar el nombre exacto del operario en el momento de la firma electrónica, independientemente de futuros cambios en la cuenta de usuario.

### 2.4 Caso (`Caso`)

Gestión del ciclo de vida de anomalías detectadas en campo:

- Estados posibles: `ABIERTO` $\rightarrow$ `EN_TALLER` $\rightarrow$ `RESUELTO` (o `DESCARTADO`).
- Toda anomalía no aprobada en inspección genera automáticamente un `Caso` abierto con severidad alta o media según el ítem fallado.

---

## Archivos del código relacionados

- [`server/db.js`](file:///c:/antigravity/matafuegos/server/db.js) — Esquema de tablas y relaciones SQLite.
- [`server/services/expirationService.js`](file:///c:/antigravity/matafuegos/server/services/expirationService.js) — Cálculo de vencimientos IRAM.
- [`server/services/antifraudService.js`](file:///c:/antigravity/matafuegos/server/services/antifraudService.js) — Motor de reglas antifraude en inspecciones.
- [`server/services/anomalyService.js`](file:///c:/antigravity/matafuegos/server/services/anomalyService.js) — Detección y reglas de anomalías.
- [`server/routes/cases.js`](file:///c:/antigravity/matafuegos/server/routes/cases.js) — Ciclo de vida y transiciones de casos.
