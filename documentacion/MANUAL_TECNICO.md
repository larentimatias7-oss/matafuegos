# MILICIC S.A. | MANUAL TÉCNICO Y DE ARQUITECTURA
## Sistema de Control Mensual de Extintores (IRAM 3517-2)

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ORGANIZACIÓN:   Milicic S.A. (Infraestructura, Minería y Construcciones)         │
│ ÁREA TÉCNICA:   Tecnologías de la Información & Prevención de Riesgos            │
│ VERSIÓN:        2.4.0 • Edición Oficial 2026                                     │
│ RUNTIME:        Node.js v22/v24 Alpine • Express 5 • React 19 • Vite • SQLite    │
│ DEPLOYMENT:     Dokploy (Docker Compose & Traefik Reverse Proxy)                 │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Arquitectura General del Sistema

El sistema implementa una arquitectura monolítica moderna, modular y ligera, diseñada para despliegue simplificado en contenedores Docker y ejecución sin dependencias externas complejas.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          ARQUITECTURA DE LA SOLUCIÓN                            │
│                                                                                 │
│   [DISPOSITIVO MÓVIL (PWA / BROWSER)]                                           │
│   ├── UI: React 19 + Vite (Mobile-First, Milicic Tokens, Lucide Icons)          │
│   ├── Storage Offline: IndexedDB (milicic_matafuegos_offline)                   │
│   ├── Service Worker: Network-First Cache (milicic-firecontrol-v3)              │
│   └── Multimedia: HTML5 Canvas Client-Side JPEG Compression (70%, 1024px)       │
│                                  │                                              │
│                                  ▼ HTTPS (Cloudflare / Traefik Dokploy)         │
│                                                                                 │
│   [BACKEND ENGINE (NODE.JS / EXPRESS 5)]                                        │
│   ├── Security Middleware: Helmet-style Headers + In-Memory Rate Limiter        │
│   ├── Auth Layer: Microsoft Entra ID (OIDC) / Local Dev Auth                   │
│   ├── REST API: /api/extinguishers, /rounds, /inspections, /cases, /qrs, /m365  │
│   ├── Short Link Resolver: /m/:publicId ➔ Redirect /?code=MF-XXX#check          │
│   └── Antifraud Engine: Duration Check (< 5s flag) + Geolocation Audit          │
│                                  │                                              │
│                                  ▼ Synchronous Native Drivers                   │
│                                                                                 │
│   [DATA & STORAGE LAYER (/data)]                                                │
│   ├── SQLite Engine: Native node:sqlite (Sin bindings C++ externos)             │
│   ├── Database File: /data/matafuegos.db (Con migraciones automáticas)          │
│   ├── Automated Backups: /data/backups/ (Scripts Bash & PowerShell)             │
│   └── Microsoft 365 Connector: ExcelJS XLSX Engine + Power Automate Webhooks    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Diccionario de Datos y Modelo de Tablas (SQLite)

El almacenamiento se realiza en SQLite mediante el driver nativo integrado `node:sqlite`, garantizando portabilidad absoluta entre Windows y Linux sin necesidad de compiladores nativos (`node-gyp`).

### 2.1. Tabla: `extinguishers` (Parque de Equipos)
Contiene la ficha técnica reglamentaria de cada extintor según IRAM 3517-2.

| Campo | Tipo | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador numérico interno. |
| `public_id` | TEXT | UNIQUE NOT NULL | Identificador público no adivinable (UUID) para enlace físico del QR. |
| `code` | TEXT | UNIQUE NOT NULL | Código interno visible de la empresa (ej: `MF-014`). |
| `type` | TEXT | NOT NULL | Agente extintor (`Polvo ABC`, `CO2`, `Agua`, `Clase K`, etc.). |
| `capacity` | TEXT | NOT NULL | Capacidad nominal (ej: `5 kg`, `10 kg`, `50 L`). |
| `location` | TEXT | NOT NULL | Descripción de ubicación detallada. |
| `floor` | TEXT | NOT NULL | Nivel o piso (`Subsuelo`, `Planta Baja`, `Piso 1`, etc.). |
| `area` | TEXT | NOT NULL | Sector o dependencia (`Pañol`, `Taller`, `Oficinas`). |
| `building` | TEXT | DEFAULT 'Edificio Central' | Identificador del predio u obrador. |
| `location_ref` | TEXT | | Referencia visual adicional (ej: *"Junto a salida de emergencia"*). |
| `manufacturer` | TEXT | | Fabricante homologado (ej: *Melisam*, *Georgia*, *Matafuegos DR*). |
| `fab_year` | INTEGER | | Año de fabricación del cilindro metálico. |
| `lifespan_limit` | TEXT | | Fecha límite de vida útil del cilindro (20 años según IRAM). |
| `expiration_charge` | TEXT | NOT NULL | Fecha de vencimiento de la recarga anual (`YYYY-MM-DD`). |
| `expiration_ph` | TEXT | NOT NULL | Fecha de vencimiento de la Prueba Hidráulica (`YYYY-MM-DD`, cada 5 años). |
| `collar_year_color` | TEXT | | Año y color reglamentario del marbete o collarín plástico. |
| `supplier` | TEXT | | Taller habilitado que certificó la última carga. |
| `certificate_number`| TEXT | | Número de certificado IRAM o remito de recarga. |
| `status` | TEXT | DEFAULT 'OPERATIVO' | Estado operativo: `OPERATIVO`, `EN_TALLER`, `FUERA_DE_SERVICIO`, `REEMPLAZADO`. |
| `notes` | TEXT | | Observaciones históricas o técnicas. |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Fecha de alta en el sistema. |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Fecha de última modificación técnica. |

---

### 2.2. Tabla: `rounds` (Rondas de Inspección Mensual)
Controla el ciclo de inspecciones periódicas de la empresa.

| Campo | Tipo | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador de ronda. |
| `name` | TEXT | UNIQUE NOT NULL | Identificador de período (ej: `2026-10`). |
| `title` | TEXT | NOT NULL | Título legible (ej: `Ronda Octubre 2026`). |
| `start_date` | TEXT | NOT NULL | Fecha de inicio del ciclo. |
| `end_date` | TEXT | | Fecha de cierre efectivo. |
| `status` | TEXT | DEFAULT 'OPEN' | Estado del ciclo: `OPEN` (activa) o `CLOSED` (cerrada). |
| `notes` | TEXT | | Observaciones de la ronda. |

---

### 2.3. Tabla: `inspections` (Registro Inmutable de Controles)
Almacena cada control periódico realizado por los inspectores. **Esta tabla no admite borrado ni modificaciones (auditoría legal).**

| Campo | Tipo | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador de la inspección. |
| `extinguisher_id` | INTEGER | REFERENCES extinguishers(id) | Llave foránea al extintor. |
| `extinguisher_code`| TEXT | NOT NULL | Código redundante para preservación histórica. |
| `round_id` | INTEGER | REFERENCES rounds(id) | Ronda a la que pertenece el control. |
| `year_month` | TEXT | NOT NULL | Período de auditoría (`YYYY-MM`). |
| `inspection_date` | TEXT | NOT NULL | Marca temporal exacta de realización. |
| `inspector_name` | TEXT | NOT NULL | Nombre y cargo del inspector interviniente. |
| `passed` | INTEGER | NOT NULL (1 o 0) | `1` si aprobó todos los controles; `0` si presentó alguna falla. |
| `check_location` | INTEGER | DEFAULT 1 | 1=OK / 0=Falla: Ubicación y acceso libre. |
| `check_pressure` | INTEGER | DEFAULT 1 | 1=OK / 0=Falla: Presión en verde o peso conforme. |
| `check_seal` | INTEGER | DEFAULT 1 | 1=OK / 0=Falla: Precinto y pasador intactos. |
| `check_physical` | INTEGER | DEFAULT 1 | 1=OK / 0=Falla: Cilindro y manguera en buen estado. |
| `check_signage` | INTEGER | DEFAULT 1 | 1=OK / 0=Falla: Cartel baliza visible. |
| `check_card` | INTEGER | DEFAULT 1 | 1=OK / 0=Falla: Tarjeta y collarín vigentes. |
| `checklist_results` | TEXT | | Detalle en formato JSON con la respuesta a cada punto del checklist. |
| `observations` | TEXT | | Justificación técnica de la falla o comentarios. |
| `photo_url` | TEXT | | Fotografía de evidencia en Base64 o URL. |
| `duration_seconds` | INTEGER | | Tiempo cronometrado entre la apertura y el guardado. |
| `is_suspicious` | INTEGER | DEFAULT 0 | Flag antifraude: `1` si la duración fue inferior a 5 segundos. |
| `fraud_flags` | TEXT | | Códigos de advertencia antifraude detectados. |
| `latitude` / `longitude` | REAL | | Coordenadas GPS opcionales capturadas en campo. |
| `geo_accuracy` | REAL | | Margen de precisión del GPS en metros. |
| `is_reinspection` | INTEGER | DEFAULT 0 | `1` si es una segunda inspección en el mismo mes. |
| `reinspection_reason` | TEXT | | Motivo obligatorio que justificó la reinspección. |

---

### 2.4. Tabla: `cases` (Casos de Falla y Anomalías)
Gestiona la resolución técnica de extintores no conformes.

| Campo | Tipo | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Número de caso (`#CASO-X`). |
| `extinguisher_id` | INTEGER | REFERENCES extinguishers(id) | Extintor afectado. |
| `extinguisher_code`| TEXT | NOT NULL | Código del extintor. |
| `inspection_id` | INTEGER | REFERENCES inspections(id) | Inspección que originó el caso. |
| `title` | TEXT | NOT NULL | Resumen del problema (ej: *"Baja Presión"*). |
| `description` | TEXT | | Explicación detallada de la anomalía. |
| `status` | TEXT | DEFAULT 'OPEN' | `OPEN`, `IN_WORKSHOP`, `TEMP_REPLACED`, `RESOLVED`. |
| `temp_replacement_code` | TEXT | | Código del extintor provisorio instalado. |
| `responsible` | TEXT | | Responsable de la gestión del caso. |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Fecha de apertura (usada para calcular antigüedad). |
| `resolved_at` | TEXT | | Fecha de cierre definitivo del caso. |

---

## 3. Seguridad, Antifraude y Resiliencia

### 3.1. Protección de Cabeceras HTTP y Rate Limiting
En `server/index.js`, se implementa una capa de seguridad para entornos de producción:
- `X-Content-Type-Options: nosniff`: Previene ataques de interpretación errónea de tipos MIME.
- `X-Frame-Options: SAMEORIGIN`: Impide ataques de clickjacking mediante incrustación en iframes no autorizados.
- `X-XSS-Protection: 1; mode=block`: Filtro activo contra inyecciones XSS en navegadores heredados.
- `Referrer-Policy: strict-origin-when-cross-origin`: Resguardo de cabeceras en enlaces externos.
- **In-Memory Rate Limiting**: Limitador de tasa por IP que restringe a 300 peticiones por minuto en rutas `/api/`, bloqueando intentos de scraping o ataques de denegación de servicio.

### 3.2. Mecanismo de Control Antifraude
Para asegurar la validez pericial de los controles ante la ART o la justicia laboral:
1. **Medición de Tiempo Real**: Al cargarse la ficha del extintor en el celular del operario, se inicia un cronómetro interno inalterable (`startTimeRef`).
2. **Detección de Inspección Apresurada**: Si el tiempo de control es inferior a **5 segundos**, la inspección es clasificada automáticamente como `is_suspicious = 1`.
3. **No Bloqueo Operativo**: El sistema **no interrumpe ni bloquea** la tarea del operario para mantener la agilidad del trabajo en obra, pero resalta el evento con una pastilla roja en los paneles gerenciales y en las planillas de auditoría de Excel.
4. **Geolocalización Asistida**: Captura latitud, longitud y radio de precisión si el dispositivo tiene habilitado el GPS y el operario concede el permiso.

### 3.3. Arquitectura Offline y Sincronización (IndexedDB + PWA)
- **IndexedDB (`src/utils/offlineQueue.js`)**: Base de datos local transaccional `milicic_matafuegos_offline` con el almacén `pending_inspections`.
- **Estrategia Service Worker**: El archivo `public/sw.js` opera bajo la política **Network-First para navegación**, asegurando que el cliente siempre descargue la última versión de código y recursos visuales, utilizando la caché local exclusivamente cuando no existe conectividad a internet.
- **Compresión Client-Side de Fotografías**: Antes de subir o almacenar una foto en IndexedDB, la función `compressImageFile` la procesa en un elemento `<canvas>` HTML5 reduciendo su dimensión máxima a 1024 píxeles y codificándola en JPEG al 70% de calidad. Esto reduce el peso de una imagen típica de 8 MB a menos de 150 KB.

---

## 4. Guía de Despliegue en Dokploy con Docker

Dokploy gestiona el ciclo de vida del contenedor, certificados SSL automáticos con Let's Encrypt y enrutamiento inverso mediante Traefik.

### 4.1. Archivo `Dockerfile` Multi-Stage Optimizado
El build está desacoplado en dos etapas para minimizar el tamaño de la imagen final:
```dockerfile
# Etapa 1: Compilación de Vite
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Runtime de Producción
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache tzdata sqlite bash
ENV NODE_ENV=production
ENV TZ=America/Argentina/Buenos_Aires
ENV PORT=3000
ENV DATA_DIR=/data
COPY package*.json ./
RUN npm install --omit=dev
COPY server/ ./server/
COPY scripts/ ./scripts/
RUN chmod +x ./scripts/*.sh 2>/dev/null || true
COPY --from=builder /app/dist ./dist
RUN mkdir -p /data/backups
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "server/index.js"]
```

### 4.2. Pasos de Configuración en el Panel de Dokploy
1. Iniciar sesión en el panel web de Dokploy.
2. Crear un nuevo servicio de tipo **Application**.
3. Seleccionar origen **GitHub Repository**:
   - URL: `https://github.com/larentimatias7-oss/matafuegos.git`
   - Branch: `main`
   - Build Type: `Dockerfile` (o `Docker Compose`).
4. **Almacenamiento Persistente (Volume)**:
   - Volume Name: `milicic_matafuegos_data`
   - Mount Path en el contenedor: `/data` *(Crítico: aquí reside `matafuegos.db`)*.
5. **Configuración de Dominio y SSL**:
   - Host: `matafuegos.milicic.com.ar` (o subdominio asignado).
   - Port: `3000`.
   - Certificate: Let's Encrypt (Automático vía Traefik).
6. **Variables de Entorno**:
   Cargar los valores definidos en `.env.example`:
   ```env
   NODE_ENV=production
   TZ=America/Argentina/Buenos_Aires
   PORT=3000
   DATA_DIR=/data
   BASE_URL=https://matafuegos.milicic.com.ar
   CORS_ORIGIN=*
   AUTH_PROVIDER=local
   ```
7. Presionar **Deploy**. Dokploy compilará la imagen y verificará el estado mediante `/api/health`.

---

## 5. Procedimiento de Respaldo y Restauración (Disaster Recovery)

### 5.1. Script de Backup en Caliente (`scripts/backup.sh`)
El script ejecuta un backup online sin interrumpir el funcionamiento de la aplicación:
```bash
# Ejecución manual o programada por crontab del host
docker exec -it <CONTAINER_ID> /app/scripts/backup.sh
```
El script genera un archivo `matafuegos_backup_YYYYMMDD_HHMMSS.db.gz` en `/data/backups/` y purga automáticamente los archivos con más de 14 días de antigüedad.

### 5.2. Procedimiento de Restauración Paso a Paso:
1. Detener el contenedor de la aplicación:
   ```bash
   docker stop milicic-matafuegos
   ```
2. Descomprimir el archivo de respaldo seleccionado:
   ```bash
   gzip -d /data/backups/matafuegos_backup_20261002_120000.db.gz
   ```
3. Reemplazar la base de datos activa:
   ```bash
   cp /data/backups/matafuegos_backup_20261002_120000.db /data/matafuegos.db
   ```
4. Reiniciar el contenedor:
   ```bash
   docker start milicic-matafuegos
   ```
5. Comprobar la integridad ejecutando:
   ```bash
   curl -s http://localhost:3000/api/health
   ```
