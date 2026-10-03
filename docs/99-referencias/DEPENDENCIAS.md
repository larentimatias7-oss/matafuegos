# 📦 Inventario de Dependencias, Licencias y Análisis de Riesgos

> **Para quién es**: Ingenieros de software, auditores legales de licencias y encargados de seguridad de la cadena de suministro de software.  
> **Qué vas a entender al terminarlo**: La totalidad de librerías de terceros utilizadas por Milicic FireControl 365, su justificación funcional, tipo de licencia de código abierto y análisis preventivo de riesgos.

---

## 1. Dependencias de Producción (Runtime)

| Paquete                 |  Versión  |  Licencia  | Propósito en el Sistema                                                  |    Nivel de Riesgo    |
| ----------------------- | :-------: | :--------: | ------------------------------------------------------------------------ | :-------------------: |
| `express`               | `^5.2.1`  |    MIT     | Framework HTTP del backend y montaje del pipeline de middlewares         |         Bajo          |
| `argon2`                | `^0.45.1` |    MIT     | Algoritmo resistente a GPUs para hashing de contraseñas y PINs           | Bajo (Binario nativo) |
| `zod`                   | `^4.6.5`  |    MIT     | Validación declarativa de esquemas y sanitización de payloads            |       Muy Bajo        |
| `helmet`                | `^8.3.0`  |    MIT     | Configuración de cabeceras HTTP de seguridad (CSP, HSTS, X-Frame)        |       Muy Bajo        |
| `cookie-parser`         | `^1.4.7`  |    MIT     | Parseo de cookies firmadas `HttpOnly` para sesiones de usuario           |       Muy Bajo        |
| `exceljs`               | `^4.4.0`  |    MIT     | Generación de libros oficiales de auditoría Excel con estilos y fórmulas |         Bajo          |
| `qrcode`                | `^1.5.4`  |    MIT     | Generación de imágenes y vectores de códigos QR para activos             |       Muy Bajo        |
| `html5-qrcode`          | `^2.3.8`  | Apache-2.0 | Lectura de códigos QR mediante la cámara web/móvil del dispositivo       |         Bajo          |
| `react`                 | `^19.3.0` |    MIT     | Biblioteca base para la interfaz de usuario reactiva                     |       Muy Bajo        |
| `react-dom`             | `^19.3.0` |    MIT     | Renderizado en DOM para React 19                                         |       Muy Bajo        |
| `@phosphor-icons/react` | `^2.1.10` |    MIT     | Familia de íconos SVG corporativos de alta consistencia                  |       Muy Bajo        |
| `@tanstack/react-table` | `^8.21.3` |    MIT     | Gestión eficiente de grillas de datos y ordenamiento                     |       Muy Bajo        |
| `cors`                  | `^2.8.6`  |    MIT     | Configuración de Cross-Origin Resource Sharing                           |       Muy Bajo        |
| `multer`                | `^2.4.0`  |    MIT     | Procesamiento de adjuntos multipart/form-data                            |         Bajo          |

_Nota: La persistencia SQLite se gestiona mediante el módulo nativo oficial de Node.js `node:sqlite` (`DatabaseSync`), eliminando la necesidad de binarios nativos externos como `better-sqlite3`._

---

## 2. Dependencias de Desarrollo y Pruebas

| Paquete                |  Versión  |  Licencia  | Propósito                                                       |
| ---------------------- | :-------: | :--------: | --------------------------------------------------------------- |
| `vite`                 | `^8.3.2`  |    MIT     | Bundler frontend y servidor de desarrollo ultrarrápido con HMR  |
| `vitest`               | `^5.0.3`  |    MIT     | Test runner para pruebas unitarias y de integración API         |
| `@playwright/test`     | `^1.63.0` | Apache-2.0 | Framework de pruebas End-to-End multi-navegador                 |
| `@axe-core/playwright` | `^4.13.0` |  MPL-2.0   | Motor de auditoría automatizada de accesibilidad web (WCAG 2.1) |
| `autocannon`           | `^8.0.0`  |    MIT     | Herramienta de benchmarking y pruebas de carga HTTP             |
| `eslint`               | `^9.39.5` |    MIT     | Linter estático de código                                       |
| `prettier`             |  `^3.x`   |    MIT     | Formateador de código                                           |

---

## 3. Análisis de Riesgos y Cumplimiento de Licencias

- **100% Permisivas**: Todas las dependencias emplean licencias compatibles con el uso comercial cerrado de Milicic S.A. (`MIT`, `Apache-2.0`, `MPL-2.0`). No existen dependencias con licencias infectivas tipo `GPL-3.0`.
- **Auditoría de Vulnerabilidades**: El pipeline de CI ejecuta `npm audit --audit-level=critical` en cada commit a `main`.

---

## Archivos del código relacionados

- [`package.json`](file:///c:/antigravity/matafuegos/package.json) — Manifiesto de dependencias y versiones.
- [`package-lock.json`](file:///c:/antigravity/matafuegos/package-lock.json) — Árbol de resolución determinista.
