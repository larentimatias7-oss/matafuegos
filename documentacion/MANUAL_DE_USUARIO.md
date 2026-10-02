# MILICIC S.A. | MANUAL DE USUARIO
## Sistema de Control Mensual de Extintores (Norma IRAM 3517-2)

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ORGANIZACIÓN:        Milicic S.A. (Infraestructura, Minería y Construcciones)   │
│ GERENCIA:            Higiene, Seguridad Laboral y Medio Ambiente (HSE)           │
│ VERSIÓN:             2.4.0 • Edición Oficial 2026                               │
│ CLASIFICACIÓN:       Uso Interno Confidencial                                    │
│ NORMA DE APLICACIÓN: IRAM 3517-2 / Ley 19.587 Dec. 351/79                       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Introducción y Propósito del Sistema

El **Sistema de Control Mensual de Extintores de Milicic S.A.** fue desarrollado para estandarizar, agilizar y dotar de trazabilidad legal a las inspecciones periódicas obligatorias de los equipos de extinción de fuego distribuidos en obradores, oficinas centrales, campamentos y talleres de la empresa.

### Objetivos Principales:
1. **Cumplimiento Normativo Estricto**: Dar respuesta auditable y digitalizada a la norma **IRAM 3517-2**, requerida por aseguradoras de riesgos del trabajo (ART), auditorías de certificación ISO 45001 y cuerpos de bomberos.
2. **Eficiencia en Campo**: Permitir que el inspector u operario calificado complete la verificación de cada equipo en **menos de 15 segundos con un máximo de 3 toques** en su celular.
3. **Resiliencia Operativa (Offline)**: Garantizar el funcionamiento pleno en campamentos o subsuelos sin conectividad celular, almacenando las inspecciones en la memoria del dispositivo y sincronizándolas automáticamente al recuperar señal.
4. **Trazabilidad Inmutable**: Impedir el borrado o alteración de registros históricos; toda anomalía genera un caso de seguimiento con antigüedad y control de equipo de reemplazo.

---

## 2. Roles y Perfiles de Usuario

El sistema cuenta con tres niveles de acceso claramente definidos:

| Rol | Destinatarios | Alcance y Permisos |
| :--- | :--- | :--- |
| **Inspector de Campo** | Técnicos de HyS, supervisores de obra, capataces. | Escaneo QR, visualización de "Mi Ruta", ejecución de checklist mensual, reporte de anomalías, toma de fotos y sincronización offline. |
| **Administrador HyS** | Responsables de HSE, jefes de prevención de pérdidas. | Gestión del parque de extintores (altas, modificaciones, bajas), apertura y cierre de Rondas Mensuales, gestión de Casos y Talleres, configuración de checklist e impresión de etiquetas QR (A4 y stickers 70x40mm). |
| **Auditoría / Lectura** | Gerencia, auditores externos, médicos laborales, ART. | Visualización de KPIs en Dashboard ejecutivo, descarga de informes oficiales en PDF y planillas auditadas en Microsoft Excel 365. |

---

## 3. Guía Operativa para el Inspector de Campo

### 3.1. Acceso a la Aplicación y PWA
1. **Desde el Teléfono Móvil**: Ingrese al enlace institucional provisto por el área de Sistemas (ej. `https://matafuegos.milicic.com.ar`).
2. **Instalación como PWA (Recomendado)**:
   - En **Google Chrome (Android)**: Toque el menú de tres puntos arriba a la derecha y seleccione **"Instalar aplicación"** o **"Agregar a la pantalla de inicio"**.
   - En **Safari (iOS)**: Presione el botón de compartir (flecha hacia arriba) y elija **"Agregar al inicio"**.
   - Esto habilitará el acceso directo con el icono institucional de Milicic y un funcionamiento idéntico al de una aplicación nativa.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      FLUJO DE INSPECCIÓN MENSUAL (3 PASOS)                       │
│                                                                                  │
│   [PASO 1: LOCALIZAR]       ──>   [PASO 2: CONTROLAR]   ──>  [PASO 3: GUARDAR]   │
│   Escanear QR físico con         Revisar cilindro.          Tocar botón verde    │
│   cámara o elegir equipo         Si está conforme,          "Guardar y Siguiente"│
│   desde pestaña "Mi Ruta".       tocar "⚡ Todo OK".        (Vibración de éxito).│
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Uso de la Vista "Mi Ruta"
Para evitar traslados innecesarios y optimizar el tiempo de recorrido en plantas extensas:
1. Abra la pestaña **"Mi Ruta"** en la barra de navegación superior.
2. Los equipos aparecen organizados jerárquicamente por:
   - **Edificio / Obrador** (ej. *Edificio Central*, *Taller Mecánico*).
   - **Piso / Nivel** (ej. *Subsuelo*, *Planta Baja*, *Piso 1*).
   - **Sector específico** (ej. *Tableros Eléctricos*, *Pañol*, *Oficinas Técnicas*).
3. Cada tarjeta indica claramente el código (ej. `MF-014`), tipo de agente extintor, ubicación exacta y su estado mensual:
   - **Pendiente (Amarillo)**: Requiere inspección en la ronda vigente.
   - **Conforme OK (Verde)**: Ya verificado en el mes actual.
   - **Con Anomalía (Rojo)**: Presenta una falla reportada.
4. Al tocar cualquier extintor pendiente se abrirá de inmediato su formulario de control.

### 3.3. Escaneo de Código QR Físico
1. Diríjase a la pestaña **"Escanear QR"**.
2. Apunte la cámara trasera del dispositivo hacia la etiqueta del extintor.
3. El lector cuenta con reconocimiento omnidireccional y corrección de error Nivel H (legible incluso con etiquetas parcialmente sucias, rayadas o con hollín).
4. El sistema vibrará y cargará instantáneamente la ficha técnica del extintor.

> **Respaldo Manual**: Si la etiqueta fue destruida o se encuentra inaccesible, el operario puede seleccionar el equipo mediante el menú desplegable de búsqueda rápida por código `MF-XXX`.

### 3.4. Ejecución del Checklist Mensual (Norma IRAM 3517-2)

La pantalla de inspección presenta en la cabecera los datos clave del equipo: Código, Ubicación física, Tipo (Polvo ABC, CO2, Agua, etc.) y Capacidad.

Los 6 puntos de control reglamentario evaluados son:
1. **Ubicación y Acceso Despejado**: Extintor en su soporte normalizado, accesible sin escaleras ni obstáculos que bloqueen su retiro inmediato.
2. **Presión / Peso Conforme**: En extintores con manómetro (ABC, Agua), la aguja indicadora debe ubicarse dentro del sector verde. En extintores de CO2, se verifica por peso según tara estampada.
3. **Precinto de Seguridad y Traba**: Pasador metálico colocado y precinto plástico numerado intacto (garantía de no haber sido disparado).
4. **Estado Físico del Cilindro y Manguera**: Cilindro libre de corrosión, abolladuras o quemaduras; manguera elástica sin cuarteaduras y tobera libre de suciedad o nidos de insectos.
5. **Señalización y Chapa Baliza**: Cartel reglamentario de tipo de fuego visible a la distancia y franjas refractarias de baliza reglamentaria.
6. **Marbete / Collarín y Tarjeta Vigente**: Collarín plástico del año en curso colocado entre la válvula y el cilindro (evidencia de recarga en taller habilitado) y tarjeta de control mensual firmable.

#### Caso A: Inspección Conforme ("Todo OK")
- Si todos los elementos se encuentran en perfecto estado, presione el botón destacado **"⚡ Marcar Todo OK"**.
- Todos los indicadores pasarán a verde automáticamente en un solo paso.
- Presione el botón inferior **"Guardar y siguiente"**.

#### Caso B: Detección de Falla o No Conformidad
- Toque el botón **"Falla"** en el ítem que presente la deficiencia.
- Se desplegará automáticamente la sección de **Registro de Anomalía**:
  1. **Detalle de la falla**: Describa brevemente el problema (ej: *"Manómetro en zona roja por despresurización"*, *"Falta precinto de seguridad"*).
  2. **Fotografía de evidencia**: Presione **"Tomar / Subir Foto"**. Se abrirá la cámara de su teléfono móvil. La foto es comprimida automáticamente en el dispositivo antes de transmitirse para optimizar el uso del plan de datos.
- Al guardar, el sistema creará automáticamente un **Caso de Anomalía** asignado al área de mantenimiento.

### 3.5. Operación en Modo Sin Conexión (Offline)
En zonas de obra o subsuelos sin cobertura 3G/4G:
1. La aplicación detecta automáticamente la pérdida de señal y activa una barra amarilla superior: **"Modo Sin Conexión (Offline activo)"**.
2. El operario puede continuar escaneando y completando inspecciones con total normalidad.
3. Los registros se encriptan y resguardan localmente en la base de datos interna del navegador (IndexedDB).
4. Al recuperar conexión con la red de datos o Wi-Fi, la aplicación efectúa una sincronización silenciosa en segundo plano. Si lo desea, el usuario también puede tocar el botón **"Sincronizar ahora"**.

---

## 4. Guía para el Administrador de Higiene y Seguridad (HSE)

### 4.1. Tablero de Control Ejecutivo (Dashboard)
El panel principal consolida en tiempo real la información preventiva del parque de extintores:
- **Avance de Ronda Mensual**: Cobertura porcentual del mes en curso y cantidad de equipos auditados sobre el total operativo.
- **Pendientes del Mes**: Listado rápido de equipos aún no visitados en la ronda activa.
- **Casos y Anomalías Abiertas**: Contador de extintores con fallas pendientes de resolución y su antigüedad en días.
- **Semáforo Preventivo de Vencimientos**:
  - *Vencimientos a 15 días*: Prioridad inmediata de intervención.
  - *Vencimientos a 30 y 60 días*: Planificación preventiva de recambios con taller externo.
  - *Pruebas Hidráulicas (PH a 5 años)*: Alertas de prueba de presión obligatoria.

### 4.2. Gestión de Rondas Mensuales
1. Al comenzar un nuevo período calendario, el administrador puede iniciar una nueva ronda desde el panel superior (ej. *"Ronda Noviembre 2026"*).
2. El sistema reinicia el estado de verificación de los 130 extintores a *"Pendiente"*, conservando intacto todo el historial de las rondas anteriores.
3. **Reinspecciones**: Si un extintor fue corregido dentro del mismo mes, puede ser reinspeccionado ingresando el motivo de la reinspección (ej: *"Reemplazo de manguera fisurada por pañol"*). Ambas inspecciones quedan archivadas de manera inmutable.

### 4.3. Administración de Casos y Equipos de Reemplazo
En la pestaña **"Casos de Falla"**:
1. Se visualizan todos los incidentes detectados en campo.
2. Cada caso registra:
   - Fecha y hora de detección.
   - Inspector responsable.
   - Descripción técnica y fotografía adjunta.
   - Antigüedad calculada en días corridos.
3. **Asignación de Reemplazo Provisorio**:
   - Para no dejar desprotegido un sector mientras un extintor se encuentra en taller de recarga, el administrador puede ingresar el código del equipo provisorio (ej: *"MF-R02"*).
4. **Ciclo de Vida del Caso**:
   - `Abierto` ➔ `En Taller` ➔ `Reemplazado Temporalmente` ➔ `Resuelto`.

### 4.4. Impresión de Etiquetas QR Industriales
En la pestaña **"Imprimir QRs"**:
- **Formato Hoja A4**: Grilla balanceada de 12 etiquetas por página, optimizada para papel ilustración autoadhesivo o vinilo laminado para intemperie. Incluye logotipo corporativo de Milicic S.A., código en tipografía legible a 3 metros y código QR de alta resolución.
- **Formato Etiquetas Individuales (70x40 mm / 50x50 mm)**: Para impresoras térmicas de etiquetas (Zebra, Brother). Permite reimprimir etiquetas individuales cuando un equipo es reemplazado o la chapa baliza se deteriora.
- **Filtro por Sector**: Permite mandar a imprimir únicamente los extintores correspondientes a un obrador o nave industrial específica.

### 4.5. Exportación de Informes Oficiales para ART y Auditorías
1. **Informe Oficial en PDF / HTML (`/api/m365/report-html`)**:
   - Accesible directamente desde el botón **"Informe ART / PDF"** en el Dashboard.
   - Incluye membrete institucional de Milicic S.A., resumen estadístico de cobertura, listado de anomalías abiertas, detalle de parque de equipos y el **cuadro formal para firma y aclaración con matrícula profesional del Responsable de Higiene y Seguridad**.
   - Cumple con las exigencias de fiscalización de ART y Bomberos de la provincia.
2. **Planilla Microsoft Excel 365 (`.xlsx`)**:
   - Genera un libro estructurado con formato oficial de Microsoft 365 compuesto por 5 pestañas:
     1. *Resumen Ejecutivo y Métricas*.
     2. *Inventario Técnico Completo* (con fabricantes, años de fabricación y vida útil de 20 años).
     3. *Inspecciones Mensuales Auditables*.
     4. *Casos de Anomalías y Antigüedad*.
     5. *Alertas de Vencimiento Preventivo*.
