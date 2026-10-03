const { db } = require('../server/db');

console.log('--- Limpiando usuarios de pruebas residuales ---');

const testCondition = "email LIKE 'operario.nuevo.%' OR email LIKE 'inspector.%'";

const toDelete = db.prepare(`SELECT id, nombre, apellido, email, rol FROM usuarios WHERE ${testCondition}`).all();
console.log(`Encontrados ${toDelete.length} usuarios de pruebas para eliminar.`);

if (toDelete.length > 0) {
  const delSessions = db.prepare(`DELETE FROM sesiones WHERE usuario_id IN (SELECT id FROM usuarios WHERE ${testCondition})`).run();
  console.log(`Sesiones eliminadas: ${delSessions.changes}`);

  const delSectores = db.prepare(`DELETE FROM usuarios_sectores WHERE usuario_id IN (SELECT id FROM usuarios WHERE ${testCondition})`).run();
  console.log(`Asignaciones sectoriales eliminadas: ${delSectores.changes}`);

  const delUsers = db.prepare(`DELETE FROM usuarios WHERE ${testCondition}`).run();
  console.log(`Usuarios eliminados: ${delUsers.changes}`);
}

const remaining = db.prepare("SELECT id, nombre, apellido, email, rol, activo FROM usuarios ORDER BY rol, apellido").all();
console.log('\n--- Usuarios vigentes en el sistema ---');
console.table(remaining);
