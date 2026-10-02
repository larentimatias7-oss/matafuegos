import React, { useState } from 'react';
import { Shield, UserCheck, Key, Lock, ArrowRight, Buildings } from '@phosphor-icons/react';

export default function LoginModal({ onLogin }) {
  const [localRole, setLocalRole] = useState('INSPECTOR');
  const [localName, setLocalName] = useState('Santiago Amaya (Inspector HyS)');

  const handleEntraLogin = () => {
    // Redirect to Entra ID endpoint or simulate corporate SSO
    window.location.href = '/api/auth/entra/login';
  };

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    if (!localName.trim()) return;
    onLogin({
      name: localName.trim(),
      role: localRole,
      type: 'local'
    });
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="bottom-sheet" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem 1.25rem', textAlign: 'center' }}>
        <div className="drag-handle" />
        
        {/* Milicic Logo */}
        <div style={{
          background: '#ffffff',
          display: 'inline-flex',
          padding: '6px 14px',
          borderRadius: '8px',
          marginBottom: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <img 
            src="/logo-milicic.svg" 
            alt="Milicic S.A." 
            style={{ height: '36px', width: 'auto' }} 
            onError={(e) => { e.target.src = '/logo-milicic.png'; }} 
          />
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          FireControl 365
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Sistema Institucional de Control Periódico de Extintores (IRAM 3517-2)
        </p>

        {/* Option 1: Microsoft 365 Entra ID */}
        <button
          onClick={handleEntraLogin}
          className="btn btn-full"
          style={{
            background: '#0078d4',
            color: '#ffffff',
            marginBottom: '1rem',
            boxShadow: '0 4px 10px rgba(0, 120, 212, 0.25)'
          }}
        >
          <Buildings size={18} weight="bold" aria-hidden="true" />
          <span>Iniciar sesión con Microsoft 365</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          margin: '1.25rem 0',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span>O acceso para desarrollo / campo</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Option 2: Local user mode */}
        <form onSubmit={handleLocalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
          <div>
            <label className="label">Nombre de Operario / Inspector</label>
            <input
              type="text"
              required
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="input"
              placeholder="Ej: Santiago Amaya (Inspector HyS)"
            />
          </div>

          <div>
            <label className="label">Rol en el Sistema</label>
            <select
              value={localRole}
              onChange={(e) => setLocalRole(e.target.value)}
              className="select"
            >
              <option value="INSPECTOR">Inspector / Operario (Escanear y Auditar)</option>
              <option value="ADMIN">Administrador (Inventario, Configuración y Reportes)</option>
              <option value="AUDITOR">Auditor / Lectura (Dashboard y Exportación)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '0.5rem' }}>
            <span>Ingresar al Sistema</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
          Milicic S.A. • Seguridad, Higiene y Medio Ambiente
        </p>

      </div>
    </div>
  );
}
