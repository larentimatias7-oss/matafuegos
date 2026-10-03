# 📊 Diagramas de Actividad de Procesos Operativos

> **Para quién es**: Supervisores de Seguridad e Higiene, coordinadores de mantenimiento y auditores que necesitan comprender los macro-procesos de negocio de la empresa.  
> **Qué vas a entender al terminarlo**: La secuencia de actividades, bifurcaciones de decisión, roles intervinientes y artefactos producidos a lo largo de las rondas de control, resolución de anomalías y campañas anuales.

---

## 1. Proceso de Ronda Mensual de Extintores

```mermaid
flowchart TD
    Inicio([Inicio de Mes]) --> Apertura[Sistema abre Ronda automáticamente: year_month actual]
    Apertura --> Asignacion[Supervisor revisa asignación de inspectores por sector]
    Asignacion --> Campo[Inspector inicia recorrido en campo con PWA]

    Campo --> Escaneo[Escaneo de QR físico en activo]
    Escaneo --> Checklist[Completar checklist visual, precinto, manómetro y tarjeta]
    Checklist --> Foto[Captura de foto de evidencia en caso de anomalía]
    Foto --> Envio{¿Conectividad?}

    Envio -->|Online| RegistroAPI[Envío inmediato a POST /api/inspections]
    Envio -->|Offline| RegistroLocal[Guardado en IndexedDB local del dispositivo]
    RegistroLocal --> EsperaRed[Espera retorno de conectividad para auto-sync]
    EsperaRed --> RegistroAPI

    RegistroAPI --> Antifraude{¿Duración < 5s?}
    Antifraude -->|Sí| FlagSospecha[Marcar is_suspicious = 1 y flag TIEMPO_MENOR_5S]
    Antifraude -->|No| RegistroOK[Almacenar inspección inmutable]
    FlagSospecha --> RegistroOK

    RegistroOK --> Revision[Supervisor monitorea % de cobertura en Dashboard]
    Revision --> TodosCompletos{¿100% inspeccionados o fin de mes?}
    TodosCompletos -->|No| Campo
    TodosCompletos -->|Sí| Cierre[Supervisor ejecuta Cierre de Ronda con notas]
    Cierre --> Reporte[Descarga de Libro de Auditoría Foliado en Excel/PDF]
    Reporte --> Fin([Fin del Período])
```

---

## 2. Gestión de Casos y Flujo de Mantenimiento / Taller

```mermaid
flowchart TD
    Anomalia([Inspección con anomalía: passed = 0]) --> CasoAuto[Sistema genera Caso en estado ABIERTO]
    CasoAuto --> Notif[Notificación a Supervisor vía Webhook Teams / M365]
    CasoAuto --> Evaluacion[Supervisor evalúa severidad de la anomalía]

    Evaluacion --> Resoluble{¿Falso positivo o arreglo menor in situ?}
    Resoluble -->|Falso positivo| Descartar[Transicionar a DESCARTADO con justificación técnica]
    Resoluble -->|Arreglo in situ| InSitu[Reponer precinto / tarjeta y transicionar a RESUELTO]
    Resoluble -->|Requiere taller| Taller[Transicionar extintor a EN_TALLER]

    Taller --> Reemplazo[Colocar extintor sustituto temporal en la posición balizada]
    Taller --> Proveedor[Envío a taller certificado para recarga / PH]
    Proveedor --> Retorno[Recepción de extintor con remito y certificado]
    Retorno --> Verif[Verificación de marbete y prueba conforme por Admin]
    Verif --> Operativo[Transicionar extintor a OPERATIVO y Caso a RESUELTO]

    Descartar --> FinCaso([Caso Cerrado])
    InSitu --> FinCaso
    Operativo --> FinCaso
```

---

## 3. Campaña Anual de Recarga y Prueba Hidráulica (IRAM 3517-2)

```mermaid
flowchart TD
    AlertaVencimiento([Sistema alerta extintores a vencer en <= 30 días]) --> Export[Admin exporta planilla de vencimientos en Excel]
    Export --> Lote[Coordinación de lote para retiro con taller homologado]
    Lote --> Retiro[Reemplazo preventivo con parque sustituto Milicic]
    Retiro --> TallerExt[Ejecución de recarga de agente y/o prueba de presión hidráulica]
    TallerExt --> Certificado[Recepción de certificado de aptitud y nuevo color de marbete]
    Certificado --> CargaSistema[Admin actualiza fechas last_charge_date / last_ph_date]
    CargaSistema --> Recalculo[Sistema recalcula automáticamente vencimientos a 1 y 5 años]
    Recalculo --> AuditoriaReg[Registro de la operación en tabla auditoria]
```

---

## Archivos del código relacionados

- [`server/routes/rounds.js`](file:///c:/antigravity/matafuegos/server/routes/rounds.js) — Ciclo de vida de rondas mensuales.
- [`server/routes/cases.js`](file:///c:/antigravity/matafuegos/server/routes/cases.js) — Transición y control de anomalías.
- [`server/services/expirationService.js`](file:///c:/antigravity/matafuegos/server/services/expirationService.js) — Detección de vencimientos IRAM.
- [`src/components/ExtinguishersList.jsx`](file:///c:/antigravity/matafuegos/src/components/ExtinguishersList.jsx) — Generación de planillas oficiales y control de inventario.
