# MILICIC S.A. | Sistema de Control Mensual de Extintores (IRAM 3517-2)

Aplicación web corporativa y PWA para la gestión de inspecciones periódicas de extintores contra incendio (~130 equipos), trazabilidad de anomalías, generación de etiquetas QR industriales de alta resiliencia y auditoría de Higiene y Seguridad Laboral con integración a Microsoft 365.

---

## 🏗️ 1. Identidad Corporativa y Diseño (Skill Milicic)

- **Paleta Institucional**: Naranja Industrial (`#EA580C`), Slate Dark (`#0F172A`), Slate Lead (`#334155`), Naranja Suave (`#FFF7ED`).
- **Estados Semánticos**: Siempre compuestos por **Color + Ícono + Texto** (Conforme OK / Pendiente / Con Falla / Vencido), garantizando accesibilidad y legibilidad bajo sol directo.
- **Ergonomía Operaria**: Áreas táctiles mínimas de 48px, barra inferior fija para control con una sola mano (zona de pulgar), sin emojis en interfaz (íconos consistentes `lucide-react`), tipografía base de 16px y feedback táctil háptico.
- **Tokens y Componentes**: Documentados en detalle en [`DESIGN.md`](file:///c:/antigravity/matafuegos/DESIGN.md).

---

## 📱 2. Guía de Uso Rápido para el Inspector en Campo (1 Página)

Esta guía resume el procedimiento estándar para operarios e inspectores de Higiene y Seguridad Laboral en planta y obradores:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│               FLUJO DE INSPECCIÓN MENSUAL (EN MENOS DE 15 SEGUNDOS)             │
│                                                                                 │
│   [1. ESCANEAR]            [2. CHEQUEO RÁPIDO]          [3. GUARDAR Y SEGUIR]   │
│   Apuntar cámara al        Verificar el equipo.          Tocar botón verde      │
│   QR del extintor o        Si todo está bien,            "Guardar y Siguiente"  │
│   elegir en "Mi Ruta".     tocar "⚡ Todo OK".           (Vibración de éxito).  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Pasos Operativos:
1. **Abrir la Aplicación**:
   - Ingresá desde el navegador del celular o abrí el acceso directo de la PWA instalada en tu pantalla de inicio.
2. **Iniciar Recorrido con "Mi Ruta"**:
   - En la pestaña **Mi Ruta**, los 130 equipos aparecen agrupados y ordenados lógicamente por Edificio, Piso y Sector para no dar vueltas innecesarias.
3. **Escanear el Código QR**:
   - Apuntá la cámara al código QR pegado en el extintor (legible entre 5 cm y 30 cm con sol o sombra).
   - Se abre de inmediato la ficha del equipo mostrando su código (ej: `MF-014`), ubicación y tipo.
4. **Completar el Control**:
   - **Caso Normal**: Si el manómetro está en verde, el precinto está sano y el acceso está libre, tocá el botón **"⚡ Todo OK"**. Todos los ítems pasan a verde con 1 solo toque.
   - **Caso con Anomalía**: Si detectás una falla (ej: sin presión, precinto roto, sin baliza), cambiá ese ítem a **"Falla"**. Se desplegará automáticamente el campo para escribir la observación y el botón **"Tomar Foto"**. La foto se comprime automáticamente en tu celular para no gastar datos.
5. **Guardar el Control**:
   - Presioná **"Guardar Control Mensual"** en la barra inferior fija accesible con el pulgar.
   - Recibirás una vibración corta de confirmación y el sistema te indicará automáticamente cuál es el **"Siguiente equipo en tu ruta"**.
6. **¿Qué pasa si no hay señal de celular (Modo Offline)?**:
   - La aplicación funciona exactamente igual sin internet.
   - La inspección se guarda de manera segura en la memoria de tu teléfono (IndexedDB) con una etiqueta amarilla: *"Guardado localmente sin conexión"*.
   - Al regresar a una zona con Wi-Fi o 4G, el sistema sincroniza automáticamente todas las inspecciones pendientes con el servidor central de Milicic sin que tengas que hacer nada.

---

## 🖨️ 3. Generación e Impresión de Etiquetas QR

- **Códigos Públicos No Adivinables**: Cada extintor tiene asignado un identificador público corto (`BASE_URL/m/:publicId`) que no revela la secuencia interna.
- **Nivel de Corrección H (High - 30%)**: Los códigos QR se generan con 30% de redundancia contra daños mecánicos, rayaduras, polvo u hollín.
- **Formatos Disponibles en la Pestaña "Imprimir QRs"**:
  1. **Grilla en Hoja A4**: 12 etiquetas por página con logotipo de Milicic S.A., código `MF-XXX` en tipografía grande, ubicación estructurada y QR.
  2. **Etiquetas Individuales (70x40 mm / 50x50 mm)**: Para reimpresión unitaria inmediata de equipos reemplazados o etiquetas dañadas.
  3. **Filtro por Sector / Piso**: Permite mandar a imprimir únicamente las etiquetas del obrador o piso seleccionado.

---

## ☁️ 4. Integración con Microsoft 365

- **Exportación en Excel 365 (`.xlsx`)**: Genera un libro corporativo con 5 hojas:
  - *Resumen Ejecutivo y Métricas*: Cobertura mensual, estado del parque y cuadro de firmas para ART/Bomberos.
  - *Inventario Técnico*: Tipos, fabricantes, vencimiento de carga y prueba hidráulica (5 años).
  - *Inspecciones Mensuales*: Registro auditable inmutable con inspector, duración y flags antifraude.
  - *Casos de Anomalías*: Seguimiento de fallas abiertas, antigüedad en días y equipo de reemplazo.
  - *Alertas de Vencimiento*: Filtro preventivo de extintores a 15, 30 y 60 días del vencimiento.
- **Informe Oficial Imprimible / PDF**: Accesible desde el Dashboard con membrete formal de Milicic S.A.
- **Webhook a Power Automate / Teams**: Despacha alertas instantáneas cuando se registra una falla. Documentado en [`docs/M365_INTEGRATION.md`](file:///c:/antigravity/matafuegos/docs/M365_INTEGRATION.md).

---

## 🐳 5. Despliegue en Dokploy (Docker & Traefik)

### Requisitos:
- Instancia de Dokploy con Docker y Traefik configurados.
- Volumen persistente en `/data` para garantizar la persistencia de SQLite (`matafuegos.db`).

### Pasos en Dokploy:
1. **Crear Nueva Aplicación**:
   - Tipo: **Docker Compose** o **Application via Git Repository**.
   - Repositorio: `https://github.com/larentimatias7-oss/matafuegos.git`
   - Branch: `main`
2. **Configurar Variables de Entorno en Dokploy**:
   Copiar los valores desde `.env.example`:
   ```env
   NODE_ENV=production
   TZ=America/Argentina/Buenos_Aires
   PORT=3000
   DATA_DIR=/data
   BASE_URL=https://matafuegos.tu-dominio.com
   CORS_ORIGIN=*
   ```
3. **Configurar Almacenamiento Persistente (Volume)**:
   - Host path o Volume name: `milicic_matafuegos_data`
   - Mount path en el contenedor: `/data`
4. **Healthcheck en Dokploy**:
   - Path: `/api/health`
   - Puerto: `3000`
5. **Desplegar**:
   - Presionar **Deploy**. Dokploy compilará el frontend con Vite y levantará el runtime de Node.js en Alpine Linux.

---

## 💾 6. Procedimiento de Backup y Restauración

### Backup Automático en Linux / Dokploy:
Dentro del contenedor o mediante tarea cron en el host:
```bash
docker exec -it <ID_CONTENEDOR> /app/scripts/backup.sh
```
El script genera un archivo comprimido `matafuegos_backup_YYYYMMDD_HHMMSS.db.gz` en `/data/backups` y retiene automáticamente los últimos 14 días.

### Backup en Windows (PowerShell):
```powershell
.\scripts\backup.ps1
```

### Restauración de Base de Datos:
1. Detener el contenedor: `docker compose down`
2. Descomprimir el respaldo: `gzip -d matafuegos_backup_20261002.db.gz`
3. Reemplazar el archivo activo: `cp matafuegos_backup_20261002.db /data/matafuegos.db`
4. Iniciar el servicio: `docker compose up -d`

---

## 🔒 7. Seguridad y Buenas Prácticas
- **Cabeceras HTTP Seguras**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`.
- **Rate Limiting**: Limitador por IP para prevenir ataques de denegación o scripts de fuerza bruta.
- **Control Antifraude**: Detección de inspecciones anormalmente veloces (< 5 segundos) o repetitivas, marcadas en el panel sin bloquear la operación de campo.
- **Historial Inmutable**: Prohibición de borrado o sobreescritura de inspecciones históricas; las correcciones generan un nuevo registro de reinspección indicando motivo reglamentario.

---

## 📱 8. Uso en Celulares y PWA (Modo Aplicación)

La aplicación está diseñada bajo filosofía **Mobile-First** con ergonomía para una sola mano, zonas táctiles >= 48px y soporte PWA standalone.

### Cómo instalar la aplicación en el celular:

#### En Android (Google Chrome):
1. Abrí la URL del sistema en Chrome (ej: `https://matafuegos.milicic.com.ar` o el túnel de prueba).
2. Aparecerá un aviso en la parte inferior **"Agregar Milicic Matafuegos a la pantalla principal"** o tocá el menú de tres puntos (⋮) arriba a la derecha.
3. Seleccioná **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.
4. Ahora abrirá como aplicación nativa (pantalla completa, sin barra de direcciones del navegador).

#### En iPhone / iPad (Safari):
1. Abrí la URL del sistema en Safari.
2. Tocá el botón **Compartir** (el ícono de un cuadrado con una flecha hacia arriba en la barra inferior).
3. Deslizá hacia abajo y seleccioná **"Agregar al inicio"** (Add to Home Screen).
4. Asigná el nombre y confirmá tocando **"Agregar"**. La app se abrirá en modo standalone con splash e ícono institucional.

### Cómo permitir la cámara para escanear QR:
- Al ingresar por primera vez a la pestaña **Escanear**, el navegador solicitará: *"¿Permitir que el sitio use tu cámara?"*. Tocá **"Permitir"**.
- Si fue bloqueada accidentalmente:
  - **Android (Chrome)**: Tocá el ícono de candado / ajustes del sitio a la izquierda de la barra de direcciones > *Permisos* > activá **Cámara**.
  - **iPhone (Safari)**: Andá a *Ajustes* de iOS > *Safari* > *Cámara* > seleccionar **Permitir** o **Preguntar**.

---

## 🔒 9. Probar con la Cámara en el Celular (Desarrollo y Demo)

Los navegadores móviles modernos (`getUserMedia`) **solo permiten activar la cámara en contextos seguros (HTTPS)** o `localhost`. Para realizar pruebas desde el teléfono conectado a tu computadora en la red local disponés de dos métodos:

### Método A: Túnel HTTPS Temporal (El más rápido y recomendado para demos)
Utiliza Cloudflare Tunnel para generar una URL pública segura con certificado SSL válido y de confianza universal inmediata, sin necesidad de instalar certificados adicionales en el teléfono:
1. Ejecutá en la terminal de la computadora:
   ```powershell
   .\tunnel.ps1
   ```
   (o directamente `& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000`)
2. Copiá la URL temporal `https://xxxx.trycloudflare.com` y abrila en el celular.
3. **Pros y Contras**:
   - ✅ *Pros*: No requiere configurar certificados CA ni tocar ajustes de seguridad en el teléfono. Funciona en cualquier dispositivo con conexión a internet.
   - ⚠️ *Contras*: Requiere salida a internet y la URL es pública mientras dure la sesión (no utilizar con bases de datos que contengan información confidencial no sanitizada).

---

### Método B: HTTPS Local con `mkcert` (Dentro de la Red LAN)

Genera una Autoridad Certificadora (CA) local en tu computadora y emite certificados válidos para la IP de tu red local:

#### 1. Instalación de mkcert (en Windows):
Si aún no tenés instalado `mkcert`, instalalo ejecutando:
```powershell
winget install FiloSottile.mkcert
# o mediante Chocolatey:
choco install mkcert
```

#### 2. Generación automática de certificados:
Ejecutá el script de automatización provisto en el proyecto:
```powershell
.\certs\setup-https.ps1
```
El script detectará tu IP LAN (ej: `192.168.1.50`), generará los certificados en `./certs/dev-cert.pem` y `./certs/dev-key.pem` y mostrará la ruta de tu `rootCA.pem`.

#### 3. Habilitar puertos en el Firewall de Windows:
Para permitir que el celular se conecte a la PC por la red Wi-Fi, abrí una consola de PowerShell como Administrador y ejecutá:
```powershell
New-NetFirewallRule -DisplayName "Milicic Matafuegos Dev" -Direction Inbound -LocalPort 5173,3000 -Protocol TCP -Action Allow
```

#### 4. Instalar el certificado raíz (`rootCA.pem`) en el celular:
Obtené la ruta del archivo ejecutando `mkcert -CAROOT` en la computadora. Enviate ese archivo `rootCA.pem` al teléfono (por WhatsApp, email o cable):

- **En Android**:
  1. Andá a **Ajustes** > **Seguridad** (o *Seguridad y privacidad*).
  2. Buscá **Cifrado y credenciales** (o *Ajustes avanzados de seguridad*).
  3. Tocá **Instalar un certificado** > **Certificado de CA**.
  4. Seleccioná el archivo `rootCA.pem` descargado y aceptá la advertencia.

- **En iPhone (iOS)**:
  1. Abrí el archivo `rootCA.pem` (Safari descargará el perfil de configuración).
  2. Andá a **Ajustes** > **Perfil descargado** (o *General* > *VPN y administración de dispositivos*) e instalá el perfil de mkcert.
  3. **PASO CRÍTICO**: Andá a **Ajustes** > **General** > **Información** > **Ajustes de confianza de certificados** (al final de todo) y ACTIVÁ el interruptor de confianza total para la CA de mkcert. Sin este paso, Safari rechazará la conexión HTTPS.

#### 5. Iniciar la aplicación en modo HTTPS:
- En modo desarrollo (Vite):
  ```bash
  npm run dev:https
  ```
  Abrí en tu celular: `https://[TU-IP-LAN]:5173`
- En modo servidor Express compilado:
  ```powershell
  $env:HTTPS="true"; node server/index.js
  ```
  Abrí en tu celular: `https://[TU-IP-LAN]:3000`

> ⚠️ **Nota de Red**: La computadora y el teléfono deben estar conectados a la misma red Wi-Fi. Asegurate de que la red no tenga activa la opción de "aislamiento de clientes" (AP Isolation), común en redes públicas o de invitados corporativas.

