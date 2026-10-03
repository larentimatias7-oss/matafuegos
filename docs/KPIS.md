# Catálogo Oficial de KPIs Ejecutivos — Milicic FireControl 365 BI

**Documento Técnico de Referencia y Gobernanza de Métricas**  
**Organización:** Milicic S.A. — Higiene, Seguridad y Medio Ambiente / Gerencia de Operaciones  
**Versión:** 1.0.0 (Propuesta Oficial para Aprobación)  
**Normativa Base:** IRAM 3517-2 • ISO 45001 • Principio de Transparencia de Auditoría

---

## 1. Estructura Estándar de Fichas de Indicadores

Cada indicador del sistema cuenta con una definición formal e inequívoca para garantizar que los valores mostrados en la interfaz `/gerencia`, los informes en PDF, las exportaciones a Excel y los datasets de Power BI sean matemáticamente idénticos.

---

## 2. Catálogo Detallado de Indicadores

### KPI 1: Cumplimiento de Ronda Mensual (`KPI-01`)

- **Nombre:** Porcentaje de Cumplimiento de Ronda Periódica.
- **Pregunta de Negocio:** _¿Qué porcentaje del parque de extintores fue efectivamente controlado dentro del período reglamentario?_
- **Fórmula Matemática:**
  $$\text{Cumplimiento (\%)} = \left( \frac{\text{Extintores con al menos 1 inspección en el mes}}{\text{Total de extintores activos en la planta}} \right) \times 100$$
- **Consulta SQL Base:**
  ```sql
  SELECT
    COUNT(DISTINCT i.extinguisher_id) * 100.0 / NULLIF((SELECT COUNT(*) FROM extinguishers WHERE status != 'DE_BAJA' AND organizacion_id = :org_id), 0) AS valor
  FROM inspections i
  WHERE i.year_month = :year_month AND i.organizacion_id = :org_id;
  ```
- **Fuente de Datos:** Tablas `inspections` y `extinguishers`.
- **Periodicidad:** Mensual (cálculo en vivo durante el mes abierto; congelado al cierre de la ronda).
- **Dirección Deseada:** Mayor es mejor ($\uparrow$).
- **Umbrales RAG (Configurables):**
  - **Verde ($\ge 95\%$):** Cumplimiento reglamentario IRAM alcanzado.
  - **Amarillo ($80\% - 94.9\%$):** Demora operativa moderada; requiere refuerzo en campo.
  - **Rojo ($< 80\%$):** Incumplimiento crítico; riesgo de observaciones en auditorías de ART.
- **Decisión que Habilita:** Redirigir recursos de inspección, reabrir rondas atrasadas con justificación o programar jornadas extraordinarias.
- **Factibilidad Actual:** **100% Exacto** con los datos actuales en BD.

---

### KPI 2: Cumplimiento Normativo y Vigencia Técnica (`KPI-02`)

- **Nombre:** Índice de Vigencia Técnica IRAM 3517-2 y Cero Pasivo Legal.
- **Pregunta de Negocio:** _¿Cuántos extintores tienen su carga anual, su prueba hidráulica (PH) o su vida útil vencidas al día de hoy?_
- **Fórmula Matemática:**
  $$\text{Vigencia (\%)} = \left( \frac{\text{Extintores vigentes en carga, PH y vida útil}}{\text{Total de extintores en servicio}} \right) \times 100$$
  $$\text{Pasivo Crítico} = \text{Cantidad de extintores con } \min(\text{exp\_charge}, \text{exp\_ph}, \text{lifespan}) < \text{Fecha Actual}$$
- **Consulta SQL Base:**
  ```sql
  SELECT
    COUNT(*) AS total_activos,
    SUM(CASE WHEN expiration_charge < date('now') OR expiration_ph < date('now') OR lifespan_limit < date('now') THEN 1 ELSE 0 END) AS total_vencidos,
    ROUND(100.0 * SUM(CASE WHEN expiration_charge >= date('now') AND expiration_ph >= date('now') AND (lifespan_limit IS NULL OR lifespan_limit >= date('now')) THEN 1 ELSE 0 END) / COUNT(*), 1) AS porcentaje_vigencia
  FROM extinguishers
  WHERE status IN ('OPERATIVO', 'EN_TALLER') AND organizacion_id = :org_id;
  ```
- **Fuente de Datos:** Tabla `extinguishers` (columnas `expiration_charge`, `expiration_ph`, `lifespan_limit`, `status`).
- **Periodicidad:** Diario continuo (corte a medianoche).
- **Dirección Deseada:** Mayor es mejor ($\uparrow$) para porcentaje; Menor es mejor ($\downarrow$) para cantidad de vencidos.
- **Umbrales RAG (Configurables):**
  - **Verde ($100\%$ vigentes / 0 vencidos):** Conformidad legal plena.
  - **Amarillo ($95\% - 99.9\%$ vigentes / 1 a 3 vencidos):** Riesgo acotado en proceso de recambio.
  - **Rojo ($< 95\%$ vigentes / $> 3$ vencidos):** Alto riesgo legal y potencial rechazo de cobertura por aseguradora ante siniestro.
- **Decisión que Habilita:** Disponer retiro inmediato y reemplazo de cilindros vencidos; emisión urgente de orden de recarga externa.
- **Factibilidad Actual:** **100% Exacto** con los 186 equipos actuales.

---

### KPI 3: Calendario y Proyección de Vencimientos a 12 Meses (`KPI-03`)

- **Nombre:** Proyección Mensual de Cargas y Pruebas Hidráulicas Quinquenales.
- **Pregunta de Negocio:** _¿Cuántos equipos vencerán mes a mes durante los próximos 12 meses y qué campañas de taller debemos presupuestar?_
- **Fórmula Matemática:**
  $$\text{Vencimientos}(m) = \sum \text{extintores cuya } \text{fecha de vencimiento cae en el mes } m \quad (m \in [1..12])$$
- **Consulta SQL Base:**
  ```sql
  SELECT
    strftime('%Y-%m', expiration_charge) AS mes_vencimiento,
    COUNT(*) AS cantidad_cargas,
    SUM(CASE WHEN strftime('%Y-%m', expiration_ph) = strftime('%Y-%m', expiration_charge) THEN 1 ELSE 0 END) AS incluyen_ph
  FROM extinguishers
  WHERE expiration_charge BETWEEN date('now') AND date('now', '+12 months')
    AND status != 'DE_BAJA' AND organizacion_id = :org_id
  GROUP BY mes_vencimiento
  ORDER BY mes_vencimiento ASC;
  ```
- **Fuente de Datos:** Tabla `extinguishers`.
- **Periodicidad:** Mensual móvil a 365 días.
- **Dirección Deseada:** Planificación balanceada (evitar picos imprevistos de > 25% del parque en un único mes).
- **Umbrales RAG:**
  - **Verde:** Menos de 20 equipos venciendo en el próximo mes (< 15% del parque).
  - **Amarillo:** Entre 21 y 35 equipos en los próximos 30 días.
  - **Rojo:** Más de 35 equipos en los próximos 30 días sin orden de servicio planificada.
- **Decisión que Habilita:** Negociar tarifas por volumen con el proveedor de taller certificado y coordinar con Operaciones el retiro escalonado sin desproteger sectores.
- **Factibilidad Actual:** **100% Exacto** con los datos vigentes.

---

### KPI 4: Tasa de Fallas en Inspección (`KPI-04`)

- **Nombre:** Tasa de Detección de Falla / No Conformidad en Ronda.
- **Pregunta de Negocio:** _¿Qué porcentaje de los controles mensuales detecta fallas físicas o de presión, y en qué tipos de extintores o sectores se concentran?_
- **Fórmula Matemática:**
  $$\text{Tasa de Fallas (\%)} = \left( \frac{\text{Inspecciones con } passed = 0}{\text{Total de inspecciones realizadas en el período}} \right) \times 100$$
- **Consulta SQL Base:**
  ```sql
  SELECT
    ROUND(100.0 * SUM(CASE WHEN passed = 0 THEN 1 ELSE 0 END) / COUNT(*), 1) AS tasa_fallas_global,
    SUM(CASE WHEN check_pressure = 0 THEN 1 ELSE 0 END) AS fallas_presion,
    SUM(CASE WHEN check_seal = 0 THEN 1 ELSE 0 END) AS fallas_precinto,
    SUM(CASE WHEN check_physical = 0 THEN 1 ELSE 0 END) AS fallas_fisicas
  FROM inspections
  WHERE year_month = :year_month AND organizacion_id = :org_id;
  ```
- **Fuente de Datos:** Tabla `inspections` (campos `passed`, `check_location`, `check_pressure`, `check_seal`, etc.).
- **Periodicidad:** Mensual.
- **Dirección Deseada:** Menor es mejor ($\downarrow$).
- **Umbrales RAG:**
  - **Verde ($< 3\%$):** Estado de conservación óptimo de la instalación.
  - **Amarillo ($3\% - 7\%$):** Desgaste o manipulación moderada; requiere supervisión.
  - **Rojo ($> 7\%$):** Alto índice de anomalías; posible vandalismo, condiciones agresivas (corrosión/polvo) o envejecimiento acelerado.
- **Decisión que Habilita:** Analizar causas raíz (ej. vibraciones que descargan manómetros, rotura frecuente de precintos por tránsito de maquinaria pesada).
- **Factibilidad Actual:** **100% Exacto**.

---

### KPI 5: Gestión de Anomalías y Tiempo Medio de Resolución — MTTR (`KPI-05`)

- **Nombre:** Tiempo Medio de Resolución de Casos (Mean Time to Repair - MTTR) y Eficacia de Cierre.
- **Pregunta de Negocio:** _¿Cuánto tardamos en corregir una anomalía desde que el inspector la detecta hasta que el equipo vuelve a estar 100% operativo?_
- **Fórmula Matemática:**
  $$\text{MTTR (días)} = \frac{\sum (\text{Fecha Cierre} - \text{Fecha Apertura})}{\text{Total de casos resueltos en el período}}$$
  $$\text{\% Resueltos en Plazo} = \left( \frac{\text{Casos resueltos con días } \le \text{Plazo Objetivo}}{\text{Total de casos cerrados}} \right) \times 100 \quad (\text{Plazo Objetivo: 7 días})$$
- **Consulta SQL Base:**
  ```sql
  SELECT
    COUNT(*) AS casos_resueltos,
    ROUND(AVG(julianday(closed_at) - julianday(opened_at)), 1) AS mttr_dias,
    MAX(CAST(julianday(closed_at) - julianday(opened_at) AS INT)) AS peor_caso_dias,
    ROUND(100.0 * SUM(CASE WHEN (julianday(closed_at) - julianday(opened_at)) <= 7.0 THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct_en_plazo
  FROM cases
  WHERE status = 'RESUELTO' AND closed_at IS NOT NULL AND organizacion_id = :org_id;
  ```
- **Fuente de Datos:** Tabla `cases` (`opened_at`, `closed_at`, `status`).
- **Periodicidad:** Mensual y acumulado móvil de 90 días.
- **Dirección Deseada:** Menor es mejor para MTTR ($\downarrow$); Mayor es mejor para % en plazo ($\uparrow$).
- **Umbrales RAG:**
  - **Verde (MTTR $\le 5$ días / $\ge 90\%$ en plazo):** Gestión ágil de incidentes.
  - **Amarillo (MTTR $5.1 - 10$ días / $75\% - 89\%$ en plazo):** Demoras operativas tolerables.
  - **Rojo (MTTR $> 10$ días / $< 75\%$ en plazo):** Inmovilización prolongada de equipos críticos.
- **Decisión que Habilita:** Reducir tiempos muertos entre detección, envío a taller y retorno a puesto.
- **Factibilidad Actual:** **100% Exacto** con los 139 casos registrados.

---

### KPI 6: Disponibilidad de la Protección contra Incendios (`KPI-06`)

- **Nombre:** Coeficiente de Cobertura Física de Puestos Protegidos.
- **Pregunta de Negocio:** _¿Qué porcentaje de los puestos de extinción de la planta cuenta con un equipo operativo disponible (ya sea el titular o un extintor sustituto)?_
- **Fórmula Matemática:**
  $$\text{Disponibilidad (\%)} = \left( \frac{\text{Total Puestos} - \text{Puestos Descubiertos}}{\text{Total Puestos}} \right) \times 100$$
  _Donde un puesto descubierto es un extintor con `status IN ('EN_TALLER', 'FUERA_DE_SERVICIO')` que NO posee `temp_replacement_code` asignado en la tabla `cases`._
- **Consulta SQL Base:**
  ```sql
  SELECT
    COUNT(*) AS total_puestos,
    SUM(CASE WHEN e.status IN ('EN_TALLER', 'FUERA_DE_SERVICIO') AND (c.temp_replacement_code IS NULL OR c.temp_replacement_code = '') THEN 1 ELSE 0 END) AS puestos_descubiertos,
    ROUND(100.0 * (COUNT(*) - SUM(CASE WHEN e.status IN ('EN_TALLER', 'FUERA_DE_SERVICIO') AND (c.temp_replacement_code IS NULL OR c.temp_replacement_code = '') THEN 1 ELSE 0 END)) / COUNT(*), 1) AS disponibilidad_pct
  FROM extinguishers e
  LEFT JOIN cases c ON e.id = c.extinguisher_id AND c.status != 'RESUELTO'
  WHERE e.status != 'DE_BAJA' AND e.organizacion_id = :org_id;
  ```
- **Fuente de Datos:** Tablas `extinguishers` y `cases`.
- **Periodicidad:** Diario en tiempo real.
- **Dirección Deseada:** Mayor es mejor ($\uparrow$).
- **Umbrales RAG:**
  - **Verde ($\ge 98\%$):** Planta protegida íntegramente (todos los retiros tienen sustituto).
  - **Amarillo ($95\% - 97.9\%$):** Hasta 3 puestos sin cobertura temporal; riesgo moderado.
  - **Rojo ($< 95\%$):** Sectores críticos desprotegidos; alerta operativa inmediata.
- **Decisión que Habilita:** Adquisición de lote de extintores "muletto" para respaldo rotativo.
- **Factibilidad Actual:** **100% Exacto**.

---

### KPI 7: Desempeño y Cumplimiento de Servicios de Taller Externo (`KPI-07`)

- **Nombre:** Tasa de Cumplimiento de Fecha Prometida por Proveedor de Taller.
- **Pregunta de Negocio:** _¿Los talleres certificados entregan los equipos en la fecha prometida y cuánto tiempo tardan en devolverlos?_
- **Fórmula Matemática:**
  $$\text{OT a Tiempo (\%)} = \left( \frac{\text{Órdenes recibidas con fecha de retorno } \le \text{Fecha Prometida}}{\text{Total de órdenes cerradas en el período}} \right) \times 100$$
  $$\text{Tiempo Medio en Taller} = \text{Promedio de días }(\text{Fecha Retorno} - \text{Fecha Envío})$$
- **Fuente de Datos:** Tabla `ordenes_servicio` (a crear en Fase 1, vinculada a `cases` y `extinguishers`).
- **Periodicidad:** Mensual y semestral por proveedor.
- **Dirección Deseada:** Mayor es mejor ($\uparrow$) para puntualidad; Menor es mejor ($\downarrow$) para tiempo en taller.
- **Umbrales RAG:**
  - **Verde ($\ge 90\%$ a tiempo / Media $\le 7$ días):** Proveedor confiable.
  - **Amarillo ($75\% - 89\%$ a tiempo / Media $8 - 14$ días):** Demoras recurrentes.
  - **Rojo ($< 75\%$ a tiempo / Media $> 14$ días):** Incumplimiento sistemático de plazos de servicio.
- **Decisión que Habilita:** Reclamar penalidades contractuales o reasignar compras a talleres con mejor SLA.
- **Factibilidad Actual:** **Requiere creación de tabla `ordenes_servicio` en Fase 1**. En el interín se reporta el volumen de casos con `status = 'EN_TALLER'`.

---

### KPI 8: Salud de Seguridad por Sector — Mapa de Calor (`KPI-08`)

- **Nombre:** Semáforo de Integridad Sectorial (Edificio / Piso / Área).
- **Pregunta de Negocio:** _¿Cuáles son los sectores o pisos con peor condición de seguridad (extintores vencidos o con fallas abiertas)?_
- **Fórmula Matemática:**
  Para cada sector $S$:
  $$\text{Riesgo}(S) = (3 \times \text{Vencidos}) + (2 \times \text{Fallas Abiertas}) + (1 \times \text{Pendientes de Inspección})$$
- **Fuente de Datos:** `extinguishers.floor`, `extinguishers.area`, `cases.status`, `inspections.passed`.
- **Periodicidad:** Continuo.
- **Dirección Deseada:** Menor puntaje de riesgo es mejor ($\downarrow$).
- **Visualización:** Grilla matricial interactiva Edificio/Piso con códigos de color de alto contraste.
- **Decisión que Habilita:** Focalizar inspecciones y mantenimientos prioritarios en los sectores de mayor riesgo acumulado.
- **Factibilidad Actual:** **100% Exacto**.

---

### KPI 9: Índice Global de Salud de la Instalación — ISI (`KPI-09`)

- **Nombre:** Índice Compuesto de Salud de la Planta (Score de 0 a 100).
- **Pregunta de Negocio:** _En un único número ponderado y objetivo, ¿cuál es el estado de seguridad de la planta en materia de protección contra incendios?_
- **Fórmula Matemática Ponderada:**
  $$\text{ISI} = (0.40 \times \text{Vigencia}) + (0.25 \times \text{Cumplimiento Ronda}) + (0.20 \times \text{Disponibilidad}) + (0.15 \times \text{Eficacia Casos})$$
  _Donde:_
  - $\text{Vigencia}$ = KPI-02 (% de equipos con carga y PH no vencidas).
  - $\text{Cumplimiento Ronda}$ = KPI-01 (% inspeccionado en el mes).
  - $\text{Disponibilidad}$ = KPI-06 (% de puestos con extintor operativo).
  - $\text{Eficacia Casos}$ = $\max(0, 100 - (10 \times \text{Casos Críticos Abiertos}))$.
- **Tooltip y Documentación:** Visible al posar el cursor sobre la tarjeta del ISI en la interfaz ejecutiva.
- **Periodicidad:** Diario y congelado mensualmente en snapshots.
- **Dirección Deseada:** Mayor es mejor ($\uparrow$).
- **Umbrales RAG:**
  - **Verde ($\ge 90$ puntos):** Instalación en condición de excelencia y bajo riesgo.
  - **Amarillo ($75 - 89.9$ puntos):** Alerta preventiva; requiere acciones correctivas.
  - **Rojo ($< 75$ puntos):** Condición deficiente; vulnerabilidad estructural ante siniestros.
- **Decisión que Habilita:** Presentación directa a Directorio y fijación de objetivos trimestrales corporativos.
- **Factibilidad Actual:** **100% Exacto**.

---

### KPI 10: Confiabilidad e Integridad de Datos Operativos (`KPI-10`)

- **Nombre:** Tasa de Inspecciones Confiables y Respaldo Físico (Índice Antifraude).
- **Pregunta de Negocio:** _¿Qué porcentaje de los controles registrados cumple con los estándares técnicos y no presenta señales de escaneo fraudulento o ejecución ficticia?_
- **Fórmula Matemática:**
  $$\text{Confiabilidad (\%)} = \left( 1 - \frac{\text{Inspecciones marcadas como sospechosas}}{\text{Total de inspecciones del período}} \right) \times 100$$
  _Una inspección se marca como sospechosa por el motor del servidor si su duración fue menor a 5 segundos o si existió manipulación horaria._
- **Consulta SQL Base:**
  ```sql
  SELECT
    COUNT(*) AS total_inspecciones,
    SUM(CASE WHEN is_suspicious = 1 THEN 1 ELSE 0 END) AS sospechosas,
    ROUND(100.0 * (COUNT(*) - SUM(CASE WHEN is_suspicious = 1 THEN 1 ELSE 0 END)) / COUNT(*), 1) AS confiabilidad_pct
  FROM inspections
  WHERE year_month = :year_month AND organizacion_id = :org_id;
  ```
- **Fuente de Datos:** Tabla `inspections` (`is_suspicious`, `duration_seconds`, `fraud_flags`).
- **Periodicidad:** Mensual (junto a los demás KPIs en la franja principal).
- **Dirección Deseada:** Mayor es mejor ($\uparrow$).
- **Umbrales RAG:**
  - **Verde ($\ge 98\%$):** Rigurosidad y apego al procedimiento IRAM.
  - **Amarillo ($90\% - 97.9\%$):** Sospechas aisladas; amerita llamado de atención a supervisores.
  - **Rojo ($< 90\%$):** Controles acelerados sin verificación técnica real; riesgo de auditoría legal.
- **Decisión que Habilita:** Auditoría en campo de sectores específicos y recalibración de rutas de supervisión.
- **Factibilidad Actual:** **100% Exacto**.

---

### KPI 11: Adopción Organizacional y Cierre de Rondas (`KPI-11`)

- **Nombre:** Índice de Puntualidad en el Cierre de Rondas Periódicas.
- **Pregunta de Negocio:** _¿Las rondas mensuales se completan y cierran dentro del mes calendario establecido?_
- **Fórmula Matemática:**
  $$\text{Puntualidad de Ronda (\%)} = \left( \frac{\text{Rondas cerradas con } closed\_at \le \text{Último día del mes}}{\text{Total de rondas ejecutadas}} \right) \times 100$$
- **Fuente de Datos:** Tabla `rounds` (`status`, `opened_at`, `closed_at`).
- **Periodicidad:** Anual / Histórico.
- **Dirección Deseada:** Mayor es mejor ($\uparrow$).
- **Decisión que Habilita:** Determinar si la dotación técnica asignada a seguridad es suficiente para cubrir la planta en tiempo y forma.
- **Factibilidad Actual:** **100% Exacto**.

---

### KPI 12: Costos Operativos de Mantenimiento y Servicios (`KPI-12` - Opcional / Fase 1)

- **Nombre:** Gasto Ejecutado en Mantenimiento, Recargas y Reposición de Activos.
- **Pregunta de Negocio:** _¿Cuánto hemos invertido en servicios de taller en el período y cuál es el costo promedio por cilindro mantenido?_
- **Fórmula Matemática:**
  $$\text{Costo Total} = \sum \text{costo\_real de órdenes de servicio cerradas}$$
  $$\text{Costo Promedio por Equipo} = \frac{\text{Costo Total}}{\text{Cantidad de equipos atendidos}}$$
- **Fuente de Datos:** Campo `costo_servicio` en la nueva tabla `ordenes_servicio`.
- **Periodicidad:** Mensual y acumulado anual.
- **Dirección Deseada:** Eficiencia presupuestaria contra presupuesto planificado ($\pm 5\%$).
- **Decisión que Habilita:** Comparar competitividad de talleres y optimizar la rotación de cilindros.
- **Factibilidad Actual:** **Requiere implementación de la tabla `ordenes_servicio` en Fase 1**. La interfaz mostrará "Módulo de Costos: pendiente de ingreso de tarifas" sin bloquear la navegación.

---

## 3. Resumen de la Franja Superior de Tarjetas Principales (Top Cards)

La pantalla `/gerencia` contará con 6 tarjetas ejecutivas destacadas con valores grandes, sparkline y variación:

1. **Índice de Salud de la Planta (ISI):** 0 a 100 con badge semántico.
2. **Cumplimiento de Ronda Mensual:** % inspeccionado contra meta del 95%.
3. **Vigencia Normativa IRAM 3517-2:** % al día y conteo explícito de extintores vencidos.
4. **Casos y Anomalías Abiertas:** Conteo activo y MTTR en días.
5. **Disponibilidad de la Protección:** % de puestos con extintor titular o sustituto.
6. **Confiabilidad de Datos:** % de controles sin banderas antifraude.
