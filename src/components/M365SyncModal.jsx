import React, { useState, useEffect } from 'react';
import { 
  FileXls, 
  UploadSimple, 
  DownloadSimple, 
  Link, 
  PaperPlaneTilt, 
  CheckCircle, 
  WarningCircle, 
  Question,
  ShareNetwork,
  GitFork
} from '@phosphor-icons/react';

export default function M365SyncModal({ onExportExcel, onRefreshData }) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetch('/api/m365/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings?.m365_webhook_url) {
          setWebhookUrl(data.settings.m365_webhook_url);
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveWebhook = async (e) => {
    e.preventDefault();
    setSavingWebhook(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/m365/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ m365_webhook_url: webhookUrl.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: 'URL de Webhook M365 guardada.' });
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/m365/test-webhook', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleImportExcel = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/m365/import-excel', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setImportResult(data);
      if (data.success && onRefreshData) {
        onRefreshData();
      }
    } catch (err) {
      setImportResult({ success: false, error: err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--milicic-slate-dark) 0%, var(--milicic-slate-lead) 100%)',
        borderLeft: '4px solid #0078d4',
        color: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            background: '#0078d4',
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FileXls size={24} weight="bold" color="#fff" aria-hidden="true" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Integración con Microsoft 365 (Excel & SharePoint)
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              Vinculá el control de matafuegos con el ecosistema de Microsoft de la empresa.
            </p>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '1.25rem'
      }}>
        
        {/* Card 1: Descargar / Exportar Planilla Excel 365 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <DownloadSimple size={20} weight="bold" color="#16a34a" aria-hidden="true" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                1. Descargar Planilla Excel 365
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.4' }}>
              Genera un archivo <strong>.xlsx</strong> nativo con estilos institucionales de Microsoft, pestañas independientes para los 130 matafuegos y el historial mensual, y semáforos de color.
            </p>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-body)', paddingLeft: '1.2rem', marginBottom: '1.25rem', lineHeight: '1.6' }}>
              <li>Compatible al 100% con <strong>Excel Online 365</strong> y desktop.</li>
              <li>Pestaña 1: Inventario con vencimientos de carga y PH.</li>
              <li>Pestaña 2: Registro de inspecciones del mes actual.</li>
            </ul>
          </div>

          <button onClick={onExportExcel} className="btn btn-primary btn-lg" style={{ width: '100%', background: '#0078d4', borderColor: '#0078d4' }}>
            <FileXls size={18} weight="bold" aria-hidden="true" />
            <span>Descargar Excel 365 Ahora</span>
          </button>
        </div>

        {/* Card 2: Importar Extintores desde Excel */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <UploadSimple size={20} weight="bold" color="#0284c7" aria-hidden="true" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              2. Importar o Actualizar desde Excel
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Si Santiago Amaya o la empresa ya tienen una lista de los 130 matafuegos en una planilla Excel, subila aquí para cargarla masivamente en 2 segundos.
          </p>

          <form onSubmit={handleImportExcel} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input 
              type="file" 
              accept=".xlsx, .xls"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="input"
              style={{ fontSize: '0.85rem' }}
              aria-label="Seleccionar archivo Excel"
            />

            <button 
              type="submit" 
              disabled={!selectedFile || importing}
              className="btn btn-secondary"
            >
              <UploadSimple size={16} weight="bold" aria-hidden="true" />
              <span>{importing ? 'Procesando archivo...' : 'Cargar Extintores'}</span>
            </button>
          </form>

          {importResult && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              background: importResult.success ? 'var(--status-ok-bg)' : 'var(--status-fault-bg)',
              color: importResult.success ? 'var(--status-ok-text)' : 'var(--status-fault-text)',
              border: `1px solid ${importResult.success ? 'var(--status-ok-border)' : 'var(--status-fault-border)'}`
            }}>
              {importResult.success ? importResult.message : `Error: ${importResult.error}`}
            </div>
          )}
        </div>

      </div>

      {/* Card 3: Sincronización en Vivo con Power Automate (M365 Webhook) */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <GitFork size={22} weight="bold" color="#0078d4" aria-hidden="true" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            3. Sincronización en Tiempo Real con Excel Online / SharePoint (Power Automate)
          </h3>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
          En empresas que usan Microsoft 365, la forma más rápida y sin código para conectar una app web con un archivo Excel en OneDrive/SharePoint es mediante <strong>Power Automate</strong> (incluido en las cuentas 365):
        </p>

        {/* 3 Step Tutorial */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ padding: '0.75rem', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 800, color: '#0078d4', fontSize: '0.8rem' }}>PASO 1</span>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-body)', marginTop: '0.2rem', marginBottom: 0 }}>
              En <strong>make.powerautomate.com</strong>, creá un flujo instantáneo con el desencadenador: <em>"Cuando se recibe una solicitud HTTP"</em>.
            </p>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 800, color: '#0078d4', fontSize: '0.8rem' }}>PASO 2</span>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-body)', marginTop: '0.2rem', marginBottom: 0 }}>
              Agregá la acción: <em>"Excel Online (Business) - Agregar una fila a una tabla"</em> y elegí el archivo en tu OneDrive o SharePoint.
            </p>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 800, color: '#0078d4', fontSize: '0.8rem' }}>PASO 3</span>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-body)', marginTop: '0.2rem', marginBottom: 0 }}>
              Copiá la <strong>URL de HTTP POST</strong> que te da Power Automate y pegala abajo. Cada inspección agregará una fila en vivo.
            </p>
          </div>
        </div>

        {/* Webhook URL Input & Test */}
        <form onSubmit={handleSaveWebhook}>
          <label className="label">URL del Webhook de Power Automate (HTTP POST URL)</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <input 
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://prod-xx.westus.logic.azure.com/workflows/..."
              className="input"
              style={{ flex: 1, minWidth: '280px' }}
              aria-label="URL del webhook"
            />
            <button type="submit" disabled={savingWebhook} className="btn btn-primary">
              <span>{savingWebhook ? 'Guardando...' : 'Guardar URL'}</span>
            </button>
            <button 
              type="button" 
              onClick={handleTestWebhook}
              disabled={!webhookUrl || testingWebhook}
              className="btn btn-secondary"
            >
              <PaperPlaneTilt size={15} weight="bold" aria-hidden="true" />
              <span>{testingWebhook ? 'Probando...' : 'Probar Envío'}</span>
            </button>
          </div>
        </form>

        {testResult && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            background: testResult.success ? 'var(--status-ok-bg)' : 'var(--status-fault-bg)',
            color: testResult.success ? 'var(--status-ok-text)' : 'var(--status-fault-text)',
            border: `1px solid ${testResult.success ? 'var(--status-ok-border)' : 'var(--status-fault-border)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {testResult.success ? <CheckCircle size={18} weight="bold" aria-hidden="true" /> : <WarningCircle size={18} weight="bold" aria-hidden="true" />}
            <span>{testResult.message || testResult.error}</span>
          </div>
        )}

      </div>

    </div>
  );
}
