# Guía de Integración con Microsoft 365 • Milicic S.A.

Esta guía documenta la vinculación entre el sistema de control mensual de extintores y el ecosistema **Microsoft 365** de la empresa (Microsoft Entra ID, Microsoft Teams, SharePoint y Microsoft Graph).

---

## 1. Autenticación con Microsoft Entra ID (Azure AD)

El sistema soporta autenticación corporativa mediante OpenID Connect (OIDC) para restringir el acceso únicamente a colaboradores con cuenta `@milicic.com.ar` o del dominio institucional configurado.

### Configuración en Azure Portal
1. Acceder a [portal.azure.com](https://portal.azure.com) > **Microsoft Entra ID** > **App registrations** > **New registration**.
2. **Nombre**: `Milicic Control Matafuegos`.
3. **Tipos de cuenta admitidos**: Solo cuentas de este directorio organizativo (inquilino único).
4. **URI de redirección (Web)**: `https://<TU-DOMINIO-DOKPLOY>/api/auth/entra/callback`.
5. En **Certificates & secrets**, generar un nuevo Client Secret.
6. En **API permissions**, verificar que tenga `User.Read` (Delegado).

### Variables de Entorno en `.env`
```env
AUTH_PROVIDER=entra
MICROSOFT_CLIENT_ID=00000000-0000-0000-0000-000000000000
MICROSOFT_TENANT_ID=00000000-0000-0000-0000-000000000000
MICROSOFT_CLIENT_SECRET=tu_client_secret_aqui
MICROSOFT_REDIRECT_URI=https://matafuegos.milicic.com.ar/api/auth/entra/callback
```

### Roles en la Aplicación
- **ADMIN**: Gestión total del parque de extintores, cierre/apertura de rondas, configuración y reportes.
- **INSPECTOR**: Acceso a escaneo QR, "Mi Ruta", checklist de control mensual y registro de anomalías.
- **READONLY**: Visualización de métricas en dashboard y descarga de informes ejecutivos (ART / Auditorías).

---

## 2. Alertas Inmediatas vía Webhook a Power Automate (Teams)

Cuando un inspector registra una anomalía en campo o la recarga anual está vencida, el sistema despacha automáticamente un webhook HTTP con el detalle del incidente para notificar en tiempo real al canal de Seguridad e Higiene en Microsoft Teams.

### Configuración en Power Automate
1. Crear un flujo en la nube instantáneo.
2. Disparador: **"Cuando se recibe una solicitud HTTP"** (When an HTTP request is received).
3. Método: `POST`.
4. Esquema JSON de la solicitud:
```json
{
  "type": "object",
  "properties": {
    "event": { "type": "string" },
    "extinguisher_code": { "type": "string" },
    "location": { "type": "string" },
    "floor": { "type": "string" },
    "area": { "type": "string" },
    "inspector": { "type": "string" },
    "inspection_date": { "type": "string" },
    "passed": { "type": "boolean" },
    "case_id": { "type": "integer" },
    "observations": { "type": "string" },
    "checks": {
      "type": "object",
      "properties": {
        "location": { "type": "integer" },
        "pressure": { "type": "integer" },
        "seal": { "type": "integer" },
        "physical": { "type": "integer" },
        "signage": { "type": "integer" },
        "card": { "type": "integer" }
      }
    }
  }
}
```
5. Agregar la acción: **"Publicar mensaje en un chat o canal"** (Microsoft Teams) y seleccionar el equipo de Higiene y Seguridad Laboral.

---

## 3. Sincronización en Planilla Excel de SharePoint / OneDrive (Microsoft Graph)

Además de la exportación directa en formato `.xlsx`, el sistema puede agregar cada inspección como fila de una tabla en un libro de Excel compartido en SharePoint.

### Permisos de Aplicación en Entra ID
- `Files.ReadWrite.All`
- `Sites.ReadWrite.All`

### Endpoint de Graph API utilizado:
```http
POST https://graph.microsoft.com/v1.0/sites/{site-id}/drive/items/{item-id}/workbook/tables/{table-name}/rows/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "values": [
    [
      "MF-014",
      "2026-10-02 11:30:00",
      "Santiago Amaya (Inspector HyS)",
      "FALLA",
      "Manómetro con aguja en zona roja",
      "Edificio Central - Subsuelo"
    ]
  ]
}
```
