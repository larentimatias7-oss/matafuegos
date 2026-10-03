# Guía Oficial de Integración con Microsoft Power BI Desktop

**FireControl 365 • Milicic S.A. • Gestión de Activos Contra Incendios**
_Norma de Referencia: IRAM 3517-2_

---

## 1. Arquitectura y Modelo Dimensional (Star Schema)

FireControl 365 expone endpoints analíticos diseñados específicamente para su consumo directo desde **Power BI Desktop**, **Power BI Service** y herramientas de Inteligencia de Negocios (Tableau, Looker, Excel).

Los datos se estructuran siguiendo las mejores prácticas de modelado dimensional en estrella (_Star Schema_):

```
                        +----------------------+
                        |     dim_activos      |
                        +----------------------+
                                   | 1
                                   |
                                   | *
+--------------------+  *       +----------------------+       *  +--------------------+
|  dim_ubicaciones   |----------|  fact_inspecciones   |----------|     dim_tiempo     |
+--------------------+          +----------------------+          +--------------------+
                                   | *
                                   |
                                   | 1
                        +----------------------+
                        |      fact_casos      |
                        +----------------------+
                                   | 1
                                   |
                                   | *
                        +----------------------+
                        |   fact_servicios     |
                        +----------------------+
```

### Principio de Privacidad Institucional

> [!IMPORTANT]
> **Privacidad y Protección del Personal:**
> Siguiendo la política de auditoría y privacidad de Milicic S.A. ([`docs/ADR-gerencia.md`](file:///c:/antigravity/matafuegos/docs/ADR-gerencia.md)), **ningún endpoint expone nombres, apellidos ni identificadores personales de los inspectores u operarios**.
> Todas las inspecciones se seudonimizan automáticamente con identificadores opacos (`Inspector #01`, `Inspector #02`), orientando el análisis exclusivamente hacia la salud del activo, el sector y el cumplimiento normativo.

---

## 2. Catálogo de Endpoints Analíticos

Todos los endpoints soportan tanto formato **JSON** (por defecto) como **CSV con codificación UTF-8 y Byte Order Mark (BOM)** para compatibilidad nativa con Excel y Power Query sin problemas de tildes ni caracteres especiales.

| Recurso                        | Endpoint               | Método | Descripción                                                                                                                         |
| :----------------------------- | :--------------------- | :----: | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Dimensión Activos**          | `/api/bi/activos`      | `GET`  | Maestro de todos los extintores y puestos con tipo, capacidad, vigencia de carga, prueba hidrostática y estado operativo.           |
| **Hechos Inspecciones**        | `/api/bi/inspecciones` | `GET`  | Registro histórico de controles mensuales realizados, resultado (conforme/no conforme) y seudónimo de inspector.                    |
| **Hechos Casos / Anomalías**   | `/api/bi/casos`        | `GET`  | Anomalías detectadas, criticidad, fecha de apertura, fecha de cierre, resolución y días transcurridos.                              |
| **Hechos Servicios de Taller** | `/api/bi/servicios`    | `GET`  | Órdenes de trabajo enviadas a talleres certificados IRAM, tipo de servicio, fechas de envío/recepción, costo y cumplimiento de SLA. |
| **Snapshots Mensuales KPI**    | `/api/bi/snapshots`    | `GET`  | Foto histórica inmutable de los 12 KPIs mensuales consolidados con hash de integridad SHA-256.                                      |

Para solicitar la descarga en formato CSV plano, añada el parámetro `?format=csv` a la URL:

```text
https://su-servidor/api/bi/activos?format=csv
```

---

## 3. Autenticación con Token de Solo Lectura

El acceso a los endpoints `/api/bi/*` requiere autenticación para garantizar la confidencialidad de la información de la empresa. Se utiliza un token Bearer específico con privilegios restringidos de **solo lectura**.

### Obtención del Token

1. Ingrese a la aplicación FireControl 365 con una cuenta con rol `ADMIN`, `SUPERADMIN` o `GERENCIA`.
2. Diríjase a la pestaña **Gerencia**.
3. Haga clic en el botón **Power BI**.
4. Copie el token que aparece en el campo **Token de Acceso Solo Lectura**.

Ejemplo de Token:

```text
bi_tok_99ffc78c187a550d
```

---

## 4. Instrucciones de Conexión en Power BI Desktop

### Método 1: Conexión mediante Power Query (Lenguaje M) - _Recomendado_

1. Abra **Power BI Desktop**.
2. En la cinta de opciones, seleccione **Obtener datos** > **Consulta en blanco**.
3. Haga clic en **Editor avanzado**.
4. Pegue la siguiente plantilla en el editor (reemplazando la URL y el Token por los suyos):

```powerquery
let
    // Configuración de Servidor y Token
    BaseUrl = "http://localhost:3000", // o la URL de producción/Cloudflare
    Token = "bi_tok_99ffc78c187a550d",

    // Consulta HTTP a la API de Snapshots
    Source = Json.Document(Web.Contents(BaseUrl & "/api/bi/snapshots", [
        Headers = [
            #"Authorization" = "Bearer " & Token,
            #"Content-Type" = "application/json"
        ]
    ])),

    // Extracción de la tabla de datos
    Data = Source[data],
    TableData = Table.FromList(Data, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    Expanded = Table.ExpandRecordColumn(TableData, "Column1", {
        "periodo",
        "isi",
        "cumplimiento_ronda",
        "vigencia_normativa",
        "anomalias_abiertas",
        "mttr_dias",
        "disponibilidad_operativa",
        "confiabilidad_datos",
        "tasa_fallas",
        "cobertura_ph",
        "sla_taller",
        "costo_promedio_servicio",
        "es_reconstruido"
    })
in
    Expanded
```

5. Haga clic en **Listo** y luego en **Cerrar y aplicar**.

---

### Método 2: Conexión mediante Conector Web (CSV)

1. En Power BI Desktop, haga clic en **Obtener datos** > **Web**.
2. Seleccione **Básico** e ingrese la URL con el parámetro CSV:
   ```text
   http://localhost:3000/api/bi/activos?format=csv
   ```
3. En la ventana emergente de autenticación, seleccione **Anónimo** si está en sesión o configure el encabezado HTTP personalizado.
4. Power BI detectará automáticamente las columnas y los tipos de datos.
5. Haga clic en **Cargar**.

---

## 5. Medidas DAX Sugeridas para el Tablero Ejecutivo

Una vez cargadas las tablas en Power BI, cree una tabla de medidas y defina las siguientes fórmulas DAX estándar:

### 1. Cumplimiento de Ronda Mensual (%)

```dax
Cumplimiento_Ronda_Pct =
VAR TotalActivos = COUNTROWS('dim_activos')
VAR InspeccionadosMes = DISTINCTCOUNT('fact_inspecciones'[id_extintor])
RETURN
DIVIDE(InspeccionadosMes, TotalActivos, 0) * 100
```

### 2. Vigencia Normativa IRAM 3517-2 (%)

```dax
Vigencia_Normativa_Pct =
VAR TotalActivos = COUNTROWS('dim_activos')
VAR ActivosVencidos = CALCULATE(
    COUNTROWS('dim_activos'),
    'dim_activos'[dias_para_vencer] < 0
)
RETURN
DIVIDE(TotalActivos - ActivosVencidos, TotalActivos, 1) * 100
```

### 3. Índice de Salud de la Infraestructura (ISI)

```dax
Indice_Salud_ISI =
VAR Vigencia = [Vigencia_Normativa_Pct]
VAR Cumplimiento = [Cumplimiento_Ronda_Pct]
VAR Disponibilidad = 99.5
VAR Eficacia = 85.0
RETURN
(0.40 * Vigencia) + (0.25 * Cumplimiento) + (0.20 * Disponibilidad) + (0.15 * Eficacia)
```

### 4. Tiempo Medio de Reparación (MTTR en días)

```dax
MTTR_Dias =
AVERAGEX(
    FILTER('fact_casos', 'fact_casos'[estado] = "CERRADO"),
    'fact_casos'[dias_resolucion]
)
```

### 5. Semáforo RAG Condicional (Color Hexadecimal)

```dax
Color_Semaforo_ISI =
SWITCH(
    TRUE(),
    [Indice_Salud_ISI] >= 90, "#16a34a", // Verde
    [Indice_Salud_ISI] >= 75, "#d97706", // Amarillo
    "#dc2626"                            // Rojo
)
```

---

## 6. Actualización Automática Programada (Scheduled Refresh)

Para configurar la actualización diaria automática de sus paneles en **Power BI Service (app.powerbi.com)**:

1. Publique el informe desde Power BI Desktop hacia su área de trabajo corporativa en Microsoft Fabric / Power BI.
2. En Power BI Service, ingrese a la configuración del **Conjunto de datos (Semantic Model)**.
3. En la sección **Credenciales del origen de datos**, configure:
   - Método de autenticación: `Anónimo` (si el token está incluido en la consulta M) o `Clave de API`.
   - Nivel de privacidad: `Organizativo`.
4. En **Actualización programada**, active la frecuencia diaria (recomendado: 06:00 AM ART antes del inicio del turno de operaciones).

---

## 7. Soporte y Auditoría Criptográfica

Cada extracción analítica incluye en su metadato la firma digital `hash_sha256`. En caso de discrepancia en auditorías externas IRAM o ISO 45001, puede cotejarse dicho valor contra la tabla interna `kpi_snapshots` de FireControl 365.
