# 🚀 Guía de Inicio Rápido para Desarrolladores

> **Para quién es**: Desarrolladores que se incorporan al equipo o montan el entorno local por primera vez.  
> **Qué vas a entender al terminarlo**: Cómo pasar de clonar el repositorio a tener el sistema completo corriendo en local en menos de 15 minutos, con base de datos poblada de prueba y soporte HTTPS para la cámara del celular.

---

## 1. Prerrequisitos del Sistema

- **Node.js 22+**: Requerido obligatoriamente por el uso del driver nativo `node:sqlite` (`DatabaseSync`).
- **npm** (versión 10+ incluida con Node.js).
- **Git**.

---

## 2. Instalación Paso a Paso

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio> matafuegos
cd matafuegos

# 2. Instalar dependencias de desarrollo y producción
npm install

# 3. Configurar variables de entorno desde la plantilla
cp .env.example .env

# 4. Crear el Superadmin local inicial
npm run crear-admin
```

_(Al iniciar por primera vez en desarrollo, el sistema crea automáticamente las tablas en `./data/matafuegos.db` y siembra 130 extintores de prueba)._

---

## 3. Ejecución en Modo Desarrollo

Se recomienda utilizar dos terminales:

```bash
# Terminal 1: Backend Express (API REST en puerto 3000)
npm run server
# -> Servidor activo en http://localhost:3000

# Terminal 2: Frontend Vite (HMR y proxy inverso en puerto 5173)
npm run dev
# -> Interfaz activa en http://localhost:5173
```

_Vite está configurado para reenviar automáticamente cualquier petición a `/api` y `/m` hacia el backend en el puerto 3000._

---

## 4. Probando la Cámara del Celular en Red Local (HTTPS)

Para escanear códigos QR con la cámara de un smartphone en la red WiFi de desarrollo:

```bash
npm run dev:https
```

Abre la IP mostrada en la consola desde el navegador móvil (ej. `https://192.168.1.50:5173`) y acepta el certificado autofirmado para autorizar la cámara.

---

## 5. Verificación de Funcionamiento

Ejecutar la suite rápida de pruebas unitarias para corroborar que todo esté en orden:

```bash
npm run test:unit
```

Deberán pasar el 100% de los tests unitarios.

---

## Archivos del código relacionados

- [`package.json`](file:///c:/antigravity/matafuegos/package.json) — Scripts de ejecución y dependencias.
- [`vite.config.js`](file:///c:/antigravity/matafuegos/vite.config.js) — Configuración del proxy inverso y plugins.
- [`server/index.js`](file:///c:/antigravity/matafuegos/server/index.js) — Entrada principal del backend Express.
