# 🧭 Recorridos de Usuario Clave (User Journeys)

> **Para quién es**: Diseñadores UX/UI, desarrolladores frontend, inspectores y supervisores que necesitan comprender la experiencia de usuario real en condiciones operativas exigentes.  
> **Qué vas a entender al terminarlo**: Cómo interactúan los diferentes perfiles con la aplicación en situaciones reales (campo sin conectividad, auditoría de emergencia, monitoreo de cobertura).

---

## Journey 1: Inspector en Campo Minero / Industrial sin Conectividad

- **Actor**: Inspector de Seguridad e Higiene.
- **Contexto**: Zona de obradores y talleres en obra minera cordillerana sin cobertura 4G ni WiFi.
- **Objetivo**: Completar el control mensual de 25 extintores en menos de 45 minutos.

```mermaid
journey
    title Recorrido del Inspector sin Conectividad
    section Preparación
      Abrir PWA en campamento con WiFi: 5: Inspector
      Verificar sesión activa y ronda abierta: 5: Inspector
    section Operación en Campo
      Traslado a zona sin señal: 3: Inspector
      Aparición de badge "Modo Sin Conexión": 4: Inspector, PWA
      Escaneo de código QR en poste balizado: 5: Inspector, PWA
      Carga instantánea de ficha técnica desde caché: 5: PWA
      Completar 6 checks obligatorios en 3 toques: 5: Inspector
      Guardar inspección: 5: PWA
      Mensaje de confirmación: "Guardado en cola offline": 4: PWA
    section Sincronización
      Retorno a obrador central con señal WiFi: 4: Inspector
      Detección automática de conectividad: 5: PWA
      Revalidación silenciosa de sesión de usuario: 5: PWA, API
      Envío en lote de las 25 inspecciones: 5: PWA, API
      Notificación: "25 inspecciones sincronizadas con éxito": 5: Inspector, PWA
```

---

## Journey 2: Supervisor Monitoreando Rondas y Casos Sospechosos

- **Actor**: Supervisor de SySO (Seguridad y Salud Ocupacional).
- **Contexto**: Oficina de obra, día 22 del mes calendario.
- **Objetivo**: Verificar el avance de la ronda mensual, analizar inspecciones sospechosas marcadas por antifraude y derivar equipos defectuosos a taller.

```mermaid
journey
    title Recorrido del Supervisor de Seguridad
    section Monitoreo de Ronda
      Ingreso al Dashboard con credenciales corporativas: 5: Supervisor
      Revisión de KPI de Cobertura mensual (ej. 82% completado): 4: Supervisor
      Filtrado de extintores no inspeccionados por sector: 5: Supervisor
    section Control Antifraude
      Alerta en Dashboard: "2 inspecciones sospechosas (<5s)": 3: Supervisor
      Apertura de detalle de inspección sospechosa: 4: Supervisor
      Revisión de tiempo reportado (2.1s) y operador: 3: Supervisor
      Contacto con inspector para solicitar reinspección justificada: 4: Supervisor
    section Gestión de Taller
      Revisión de 1 caso ABIERTO por manómetro despresurizado: 4: Supervisor
      Cambio de estado del caso a EN_TALLER con remito interno: 5: Supervisor
```

---

## Journey 3: Auditor Externo Requerimiento de Evidencia Legal

- **Actor**: Auditor de ART / Aseguradora / IRAM.
- **Contexto**: Inspección anual sorpresiva de cumplimiento normativo IRAM 3517-2.
- **Objetivo**: Comprobar que todos los extintores han sido controlados mensualmente, verificar la inmutabilidad de los registros y constatar que no existan extintores vencidos.

```mermaid
journey
    title Recorrido de Auditoría Legal
    section Acceso Seguro
      Login con usuario de rol LECTURA asignado por la empresa: 5: Auditor
      Verificación de que las opciones de modificación están bloqueadas: 5: Auditor, PWA
    section Constatación de Vencimientos
      Acceso al Inventario de Extintores: 5: Auditor
      Filtrado por semáforo de vencimientos (Verde / Amarillo / Rojo): 5: Auditor
      Comprobación de que no hay equipos vencidos en uso: 5: Auditor
    section Evidencia Inmutable
      Descarga del Libro Foliado Oficial en Excel con fórmulas y colores IRAM: 5: Auditor, PWA
      Revisión de bitácora de auditoría con fecha, hora, IP y usuario firmante: 5: Auditor
      Dictamen de auditoría: Conforme sin observaciones: 5: Auditor
```

---

## Archivos del código relacionados

- [`src/utils/offlineQueue.js`](file:///c:/antigravity/matafuegos/src/utils/offlineQueue.js) — Cola offline IndexedDB.
- [`src/components/Dashboard.jsx`](file:///c:/antigravity/matafuegos/src/components/Dashboard.jsx) — Panel de KPIs y alertas antifraude.
- [`src/components/ExtinguishersList.jsx`](file:///c:/antigravity/matafuegos/src/components/ExtinguishersList.jsx) — Exportación oficial para auditores y gestión de inventario.
- [`server/services/antifraudService.js`](file:///c:/antigravity/matafuegos/server/services/antifraudService.js) — Detección de controles rápidos.
