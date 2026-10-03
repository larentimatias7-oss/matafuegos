import React from 'react';
import { ShieldWarning, ArrowLeft, House } from '@phosphor-icons/react';

export default function AccessDenied({ 
  userRole = 'INSPECTOR', 
  requiredRole = 'ADMIN o SUPERADMIN',
  moduleName = 'este módulo',
  onReturn
}) {
  return (
    <div style={{
      maxWidth: '650px',
      margin: '3rem auto',
      padding: '2.5rem 2rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      textAlign: 'center'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'var(--status-pending-bg)',
        border: '2px solid var(--status-pending-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem auto'
      }}>
        <ShieldWarning size={36} weight="bold" color="var(--milicic-orange)" aria-hidden="true" />
      </div>

      <h2 style={{
        fontSize: '1.4rem',
        fontWeight: 800,
        color: 'var(--text-main)',
        marginBottom: '0.75rem',
        letterSpacing: '-0.01em'
      }}>
        Acceso Restringido por Perfil de Seguridad
      </h2>

      <p style={{
        fontSize: '0.92rem',
        color: 'var(--text-body)',
        lineHeight: 1.6,
        marginBottom: '1.5rem'
      }}>
        Su perfil actual de usuario (<strong>{userRole}</strong>) no dispone de los permisos necesarios para acceder o modificar <strong>{moduleName}</strong>. Esta sección se encuentra reservada para usuarios con rol <strong>{requiredRole}</strong>.
      </p>

      <div style={{
        background: 'var(--bg-card-header)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.85rem 1rem',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        marginBottom: '2rem',
        textAlign: 'left'
      }}>
        <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
          📋 Política Corporativa Milicic S.A.
        </div>
        <div>
          Si considera que requiere acceso para el desempeño de sus tareas operativas en obra o planta, solicite la asignación del rol correspondiente a través del Jefe de Seguridad e Higiene o del Administrador de TI.
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {onReturn && (
          <button
            onClick={onReturn}
            className="btn btn-primary"
            style={{ minHeight: '44px', padding: '0.5rem 1.5rem', fontWeight: 700 }}
          >
            <House size={18} weight="bold" aria-hidden="true" />
            <span>Volver al Dashboard</span>
          </button>
        )}
      </div>
    </div>
  );
}
