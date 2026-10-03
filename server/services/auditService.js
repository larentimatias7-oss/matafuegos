/**
 * Milicic FireControl 365 - Servicio de Auditoría Inmutable (Append-Only)
 * Registra cada acción de mutación, autenticación y exportación/importación del sistema.
 */

function recordAudit(db, {
  usuario_id = null,
  usuario_nombre_snapshot = null,
  organizacion_id = 1,
  accion,
  entidad,
  entidad_id,
  datos_antes = null,
  datos_despues = null,
  req = null
}) {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1') : '127.0.0.1';
    const userAgent = req ? (req.headers['user-agent'] || 'Sistema') : 'Sistema';

    const uid = usuario_id || req?.user?.id || null;
    const uNombre = usuario_nombre_snapshot || req?.user?.name || req?.user?.nombre || 'Sistema';
    const orgId = organizacion_id || req?.user?.organizacion_id || 1;

    const stmt = db.prepare(`
      INSERT INTO auditoria (
        fecha, usuario_id, usuario_nombre_snapshot, organizacion_id,
        accion, entidad, entidad_id, datos_antes, datos_despues,
        ip, user_agent
      ) VALUES (
        datetime('now', 'localtime'), ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `);

    stmt.run(
      uid,
      uNombre,
      orgId,
      accion,
      entidad,
      String(entidad_id),
      datos_antes ? JSON.stringify(datos_antes) : null,
      datos_despues ? JSON.stringify(datos_despues) : null,
      ip,
      userAgent
    );

    // Retrocompatibilidad transparente con la tabla histórica audit_logs
    try {
      const legacyActionMap = {
        'CREAR_EXTINTOR': 'CREATE',
        'ACTUALIZAR_EXTINTOR': 'UPDATE',
        'ELIMINAR_EXTINTOR': 'DELETE'
      };
      const legacyAction = legacyActionMap[accion] || accion;
      const legacyEntity = entidad === 'extintor' ? 'EXTINGUISHER' : entidad.toUpperCase();

      db.prepare(`
        INSERT INTO audit_logs (entity_type, entity_id, action, changed_by, old_values, new_values)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        legacyEntity,
        Number(entidad_id) || 0,
        legacyAction,
        uNombre,
        datos_antes ? JSON.stringify(datos_antes) : null,
        datos_despues ? JSON.stringify(datos_despues) : null
      );
    } catch (_) {
      // Ignorar si audit_logs no existe
    }
  } catch (err) {
    console.error('[AUDITORIA ERROR] Error al registrar evento inmutable:', err.message);
  }
}

module.exports = {
  recordAudit
};
