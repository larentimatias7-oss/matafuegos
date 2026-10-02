# 🧯 FireControl 365 | Control y Vencimiento de Matafuegos (IRAM 3517-2)

Aplicación web completa diseñada para el **control mensual periódico**, seguimiento de vencimientos e impresión de etiquetas QR para parques de matafuegos (~130 equipos), con integración directa a **Microsoft 365 (Excel & SharePoint)** y lista para desplegar en **Dokploy con Docker**.

---

## 💬 1. ¿Qué responderle a Santi en el chat? (Mensaje sugerido)

Podés responderle algo así para dejarlo tranquilo y mostrarle que el flujo ya está pensado de punta a punta:

> *"¡Hola Santi! Ya investigué todo el marco normativo (rige la norma **IRAM 3517-2** de control periódico de extintores) y te armé la solución completa.*
>
> *El flujo funciona así:*
> 1. *Cargamos los 130 matafuegos en el sistema con su código (ej: MF-001 al MF-130), ubicación (piso/sector), tipo (Polvo ABC, CO2, etc.) y vencimientos de carga y prueba hidráulica.*
> 2. *La aplicación tiene un generador que imprime en 1 clic las **130 etiquetas con código QR** listas para pegar en cada extintor.*
> 3. *Durante la ronda mensual, vas con el celular, escaneás el QR con la cámara y te abre directamente la ficha del equipo.*
> 4. *En 10 segundos hacés el checklist reglamentario (presión en verde, precinto sano, acceso despejado, estado de manguera). Si todo está bien, tocás **'Marcar Todo OK'** y se guarda.*
> 5. *En el panel web queda el **semáforo mensual** (verde los controlados, amarillo los pendientes del mes, rojo si hay alguna falla o vencimiento).*
> 6. *Como usamos Microsoft 365, con un botón descargamos la planilla oficial en **Excel 365** o la sincronizamos automáticamente para que impacte en tiempo real en OneDrive/SharePoint para cualquier auditoría de ART o bomberos.*
>
> *Ya lo tengo listo para que lo probemos."*

---

## 📋 2. Aspectos Clave sobre Matafuegos (Norma IRAM 3517-2)

### Tipos de Matafuegos Habituales
- **Polvo Químico Seco (ABC):** El más habitual (*"el blanco"* al que se refería Santi). Sirve para sólidos (madera/papel), líquidos combustibles y electricidad. Cuenta con manómetro.
- **Dióxido de Carbono (CO2):** Para tableros eléctricos y salas de servidores. No deja residuos y no tiene manómetro (se controla por peso).
- **Agua bajo presión:** Para depósitos de cartón/madera.
- **Acetato de Potasio (Clase K):** Para cocinas industriales y freidoras (cilindros de acero inoxidable).

### Puntos de Control Mensual en la App
1. **Ubicación y Acceso:** En su lugar asignado y sin obstáculos que impidan sacarlo rápido.
2. **Presión:** Aguja en zona verde del manómetro (o peso en CO2).
3. **Precinto y Seguro:** Traba metálica colocada y precinto plástico intacto (garantiza que no fue accionado).
4. **Estado Físico:** Cilindro sin golpes ni óxido, manguera flexible y tobera sin obstrucciones.
5. **Señalización:** Chapa baliza y cartel reglamentario visibles.
6. **Tarjeta y Marbete:** Registro de recarga anual vigente.

---

## 🚀 3. Características de la Aplicación

- 📊 **Dashboard Ejecutivo:** Semáforo del mes, % de cobertura mensual, alertas de recarga anual (próximos 30/60 días) y prueba hidráulica (PH cada 5 años).
- 🧯 **Inventario Completo (~130 extintores):** Búsqueda en tiempo real, filtros por piso/nivel, sector y tipo. Viene precargado con 130 puestos de ejemplo reales.
- 📷 **Escáner Móvil QR:** Funciona con la cámara del smartphone o con selector rápido de código en pantalla.
- ⚡ **Checklist Rápido con 1-Tap:** Permite auditar cada equipo en menos de 10 segundos con el botón *'⚡ Marcar Todo OK'*.
- 🖨️ **Generador e Impresión de 130 Etiquetas QR:** Vista de impresión maquetada en grilla para hojas A4 o stickers autoadhesivos con código QR, ID y puesto.
- 📑 **Historial Inmutable:** Auditoría completa de cada control mensual con fecha, hora, responsable y observaciones.
- ☁️ **Integración Microsoft 365:**
  - Exportación de planilla `.xlsx` con estilos nativos de Microsoft Excel 365, tablas dinámicas y colores de estado.
  - Importación masiva desde Excel si ya tienen un archivo con los 130 equipos.
  - Conector para Webhooks de **Power Automate** (agrega filas automáticamente a un Excel Online en SharePoint/OneDrive).

---

## 🐳 4. Despliegue en Dokploy con Docker

La aplicación está lista para desplegarse en **Dokploy** mediante Docker Compose o Dockerfile.

### Pasos en Dokploy:
1. En el panel de Dokploy, crear una nueva aplicación (Application).
2. Seleccionar repositorio Git o Docker Compose.
3. Configurar las variables de entorno:
   ```env
   PORT=3000
   DATA_DIR=/data
   BASE_URL=https://matafuegos.tu-dominio.com
   ```
4. Configurar el volumen persistente para la base de datos SQLite:
   - **Host Path / Volume:** `firecontrol_data` ➔ **Container Path:** `/data`
5. Dokploy se encarga del certificado SSL automático y el enrutamiento con Traefik.

---

## 💻 5. Ejecución y Pruebas Locales

```bash
# Instalar dependencias
npm install

# Compilar frontend
npm run build

# Iniciar servidor
npm start
```
Abrí tu navegador en: `http://localhost:3000`

---

## 🔄 6. Sincronización con Microsoft 365 vía Power Automate

Para que cada inspección impacte automáticamente en un archivo Excel en SharePoint / OneDrive:
1. Entrá a [make.powerautomate.com](https://make.powerautomate.com).
2. Creá un flujo automatizado en blanco con el disparador: **"Cuando se recibe una solicitud HTTP"**.
3. Agregá la acción: **Excel Online (Business) ➔ "Agregar una fila a una tabla"**.
4. Seleccioná el archivo Excel de la empresa en SharePoint/OneDrive.
5. Copiá la URL del HTTP POST generada por Power Automate.
6. Pegala en la pestaña **"Microsoft 365"** de la app y pulsá **"Probar Envío"**.
