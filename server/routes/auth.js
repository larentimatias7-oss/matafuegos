/**
 * Milicic FireControl 365 - Rutas de Autenticación, Sesiones y Microsoft Entra ID
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../db');
const { authenticate, requirePermiso } = require('../middleware/auth');
const {
  validatePasswordStrength,
  validatePinFormat,
  hashPassword,
  verifyPassword,
  hashPin,
  verifyPin,
  createSession,
  revokeSession,
  revokeAllUserSessions,
  handleFailedLogin,
  resetFailedLogin,
  provisionEntraUser
} = require('../services/authService');
const { recordAudit } = require('../services/auditService');
const { ROLES } = require('../config/permissions');
const {
  validateBody,
  LoginSchema,
  PinSwitchSchema,
  SetPinSchema,
  ChangePasswordSchema
} = require('../validators/schemas');

const COOKIE_NAME = 'firecontrol_session';
const isProd = process.env.NODE_ENV === 'production' || process.env.HTTPS === 'true';

const getCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/',
  maxAge: maxAgeMs
});

// Middleware de autenticación previo para rutas que lo requieran
router.use(authenticate);

// 1. GET /api/auth/me - Estado de autenticación del usuario actual
router.get('/me', (req, res) => {
  if (!req.user || !req.user.authenticated) {
    return res.json({ authenticated: false });
  }

  // Consultar información enriquecida en la base de datos
  let userDb = null;
  try {
    userDb = db.prepare('SELECT id, pin_hash, debe_cambiar_password, ultimo_acceso, origen FROM usuarios WHERE id = ?').get(req.user.id);
  } catch (_e) {
    // Usuario no encontrado en base de datos o error de lectura
  }

  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      nombre: req.user.nombre,
      apellido: req.user.apellido,
      email: req.user.email,
      role: req.user.role,
      rol: req.user.role,
      tenant: 'Milicic S.A.',
      organizacion_id: req.user.organizacion_id || 1,
      isGlobalScope: req.user.isGlobalScope,
      sectores: req.user.sectores || [],
      debe_cambiar_password: userDb ? !!userDb.debe_cambiar_password : false,
      hasPin: userDb ? !!userDb.pin_hash : false,
      origen: userDb ? userDb.origen : 'local'
    }
  });
});

// 2. POST /api/auth/login - Inicio de sesión local con email y contraseña
router.post('/login', validateBody(LoginSchema), async (req, res) => {
  if (process.env.AUTH_LOCAL_ENABLED === 'false') {
    return res.status(403).json({
      success: false,
      error: 'El inicio de sesión local está deshabilitado por políticas de seguridad corporativas. Utilice Microsoft Entra ID.'
    });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Debe ingresar email y contraseña'
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const user = db.prepare('SELECT * FROM usuarios WHERE organizacion_id = 1 AND email = ?').get(normalizedEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas o cuenta bloqueada temporalmente'
      });
    }

    if (user.activo === 0) {
      return res.status(401).json({
        success: false,
        error: 'Su cuenta ha sido desactivada. Comuníquese con el Administrador de Seguridad e Higiene.'
      });
    }

    // Verificar si la cuenta se encuentra bloqueada por intentos fallidos
    if (user.bloqueado_hasta) {
      const lockUntil = new Date(user.bloqueado_hasta);
      if (lockUntil > new Date()) {
        const remainingMinutes = Math.ceil((lockUntil.getTime() - Date.now()) / 60000);
        return res.status(423).json({
          success: false,
          error: `Cuenta bloqueada temporalmente por seguridad. Intente nuevamente en ${remainingMinutes} minutos.`
        });
      }
    }

    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        error: 'Esta cuenta está configurada exclusivamente para ingreso con Microsoft Entra ID.'
      });
    }

    const passwordOk = await verifyPassword(user.password_hash, password);
    if (!passwordOk) {
      handleFailedLogin(db, user);
      recordAudit(db, {
        usuario_id: user.id,
        usuario_nombre_snapshot: `${user.nombre} ${user.apellido}`.trim(),
        accion: 'LOGIN_FALLIDO',
        entidad: 'usuario',
        entidad_id: user.id,
        req
      });

      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas o cuenta bloqueada temporalmente'
      });
    }

    // Login exitoso: restablecer contador de fallos
    resetFailedLogin(db, user.id);

    // Crear sesión en SQLite
    const session = createSession(db, { usuario_id: user.id, req });

    // Setear cookie HttpOnly segura
    res.cookie(COOKIE_NAME, session.sessionId, getCookieOptions(session.maxAgeMs));

    recordAudit(db, {
      usuario_id: user.id,
      usuario_nombre_snapshot: `${user.nombre} ${user.apellido}`.trim(),
      accion: 'LOGIN_EXITOSO',
      entidad: 'sesion',
      entidad_id: session.sessionId,
      req
    });

    const sectores = db.prepare('SELECT sector, piso, edificio FROM usuarios_sectores WHERE usuario_id = ?').all(user.id);

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: `${user.nombre} ${user.apellido}`.trim(),
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.rol,
        rol: user.rol,
        tenant: 'Milicic S.A.',
        debe_cambiar_password: !!user.debe_cambiar_password,
        hasPin: !!user.pin_hash,
        isGlobalScope: (sectores || []).length === 0,
        sectores: sectores || []
      }
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor al autenticar' });
  }
});

// 3. POST /api/auth/pin-switch - Cambio rápido de usuario en dispositivo compartido
router.post('/pin-switch', validateBody(PinSwitchSchema), async (req, res) => {
  const { pin, usuario_id, email } = req.body;

  if (!pin || (!usuario_id && !email)) {
    return res.status(400).json({
      success: false,
      error: 'Debe especificar el PIN y el identificador de usuario'
    });
  }

  try {
    let user;
    if (usuario_id) {
      user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(usuario_id);
    } else {
      user = db.prepare('SELECT * FROM usuarios WHERE organizacion_id = 1 AND email = ?').get(String(email).trim().toLowerCase());
    }

    if (!user || user.activo === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no disponible o desactivado'
      });
    }

    if (!user.pin_hash) {
      return res.status(400).json({
        success: false,
        error: 'El usuario no tiene un PIN configurado. Ingrese con contraseña o Microsoft Entra ID para configurarlo.'
      });
    }

    if (user.pin_bloqueado_hasta) {
      const lockUntil = new Date(user.pin_bloqueado_hasta);
      if (lockUntil > new Date()) {
        const remainingMinutes = Math.ceil((lockUntil.getTime() - Date.now()) / 60000);
        return res.status(423).json({
          success: false,
          error: `PIN bloqueado temporalmente por intentos fallidos. Intente en ${remainingMinutes} minutos o use su contraseña.`
        });
      }
    }

    const pinOk = await verifyPin(user.pin_hash, String(pin));
    if (!pinOk) {
      const newAttempts = (user.pin_intentos_fallidos || 0) + 1;
      let bloqueado = null;
      if (newAttempts >= 3) {
        bloqueado = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
      }
      db.prepare('UPDATE usuarios SET pin_intentos_fallidos = ?, pin_bloqueado_hasta = ? WHERE id = ?').run(newAttempts, bloqueado, user.id);

      return res.status(401).json({
        success: false,
        error: newAttempts >= 3 ? 'PIN bloqueado por 15 minutos.' : `PIN incorrecto (intento ${newAttempts} de 3).`
      });
    }

    // Reset intentos de PIN
    db.prepare('UPDATE usuarios SET pin_intentos_fallidos = 0, pin_bloqueado_hasta = NULL WHERE id = ?').run(user.id);

    // Crear sesión para el usuario seleccionado
    const session = createSession(db, { usuario_id: user.id, req });
    res.cookie(COOKIE_NAME, session.sessionId, getCookieOptions(session.maxAgeMs));

    recordAudit(db, {
      usuario_id: user.id,
      usuario_nombre_snapshot: `${user.nombre} ${user.apellido}`.trim(),
      accion: 'CAMBIO_RAPIDO_PIN',
      entidad: 'sesion',
      entidad_id: session.sessionId,
      req
    });

    const sectores = db.prepare('SELECT sector, piso, edificio FROM usuarios_sectores WHERE usuario_id = ?').all(user.id);

    return res.json({
      success: true,
      message: `Sesión activa transferida a ${user.nombre} ${user.apellido}`,
      user: {
        id: user.id,
        name: `${user.nombre} ${user.apellido}`.trim(),
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.rol,
        rol: user.rol,
        tenant: 'Milicic S.A.',
        isGlobalScope: (sectores || []).length === 0,
        sectores: sectores || []
      }
    });
  } catch (err) {
    console.error('[PIN SWITCH ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al cambiar de usuario por PIN' });
  }
});

// 4. POST /api/auth/set-pin - Configurar o cambiar PIN propio de acceso rápido
router.post('/set-pin', validateBody(SetPinSchema), async (req, res) => {
  if (!req.user || !req.user.authenticated) {
    return res.status(401).json({ success: false, error: 'Debe iniciar sesión para configurar su PIN' });
  }

  const { pin } = req.body;
  const pinCheck = validatePinFormat(pin);
  if (!pinCheck.valid) {
    return res.status(400).json({ success: false, error: pinCheck.error });
  }

  try {
    const pinHashed = await hashPin(pin);
    db.prepare('UPDATE usuarios SET pin_hash = ?, pin_intentos_fallidos = 0, pin_bloqueado_hasta = NULL WHERE id = ?').run(pinHashed, req.user.id);

    recordAudit(db, {
      usuario_id: req.user.id,
      usuario_nombre_snapshot: req.user.name,
      accion: 'CONFIGURAR_PIN',
      entidad: 'usuario',
      entidad_id: req.user.id,
      req
    });

    return res.json({ success: true, message: 'PIN de acceso rápido configurado exitosamente' });
  } catch (err) {
    console.error('[SET PIN ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al guardar PIN' });
  }
});

// 5. POST /api/auth/change-password - Cambio de contraseña (primer acceso o perfil)
router.post('/change-password', validateBody(ChangePasswordSchema), async (req, res) => {
  if (!req.user || !req.user.authenticated) {
    return res.status(401).json({ success: false, error: 'Debe iniciar sesión para cambiar su contraseña' });
  }

  const { current_password, new_password } = req.body;
  const passCheck = validatePasswordStrength(new_password);
  if (!passCheck.valid) {
    return res.status(400).json({ success: false, error: passCheck.error });
  }

  try {
    const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // Si ya tenía contraseña previa, validar la actual
    if (user.password_hash) {
      if (!current_password) {
        return res.status(400).json({ success: false, error: 'Debe ingresar su contraseña actual' });
      }
      const currentOk = await verifyPassword(user.password_hash, current_password);
      if (!currentOk) {
        return res.status(401).json({ success: false, error: 'La contraseña actual no es correcta' });
      }
    }

    const newHash = await hashPassword(new_password);
    db.prepare(`
      UPDATE usuarios 
      SET password_hash = ?, debe_cambiar_password = 0, intentos_fallidos = 0, bloqueado_hasta = NULL
      WHERE id = ?
    `).run(newHash, req.user.id);

    recordAudit(db, {
      usuario_id: req.user.id,
      usuario_nombre_snapshot: req.user.name,
      accion: 'CAMBIO_PASSWORD',
      entidad: 'usuario',
      entidad_id: req.user.id,
      req
    });

    return res.json({ success: true, message: 'Contraseña actualizada con éxito' });
  } catch (err) {
    console.error('[CHANGE PASSWORD ERROR]', err);
    return res.status(500).json({ success: false, error: 'Error al cambiar la contraseña' });
  }
});

// 6. POST /api/auth/logout - Cierre de sesión actual
router.post('/logout', (req, res) => {
  const sessionId = req.cookies?.[COOKIE_NAME] || req.user?.sessionId;
  if (sessionId) {
    try {
      revokeSession(db, sessionId);
      recordAudit(db, {
        usuario_id: req.user?.id,
        usuario_nombre_snapshot: req.user?.name,
        accion: 'LOGOUT',
        entidad: 'sesion',
        entidad_id: sessionId,
        req
      });
    } catch (_e) {
      // Ignorar error al registrar auditoría de logout
    }
  }

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/'
  });

  return res.json({ success: true, message: 'Sesión cerrada exitosamente' });
});

// 7. POST /api/auth/logout-all - Cierre de todas las sesiones activas del usuario
router.post('/logout-all', (req, res) => {
  if (!req.user || !req.user.authenticated) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
    revokeAllUserSessions(db, req.user.id);
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/'
    });

    recordAudit(db, {
      usuario_id: req.user.id,
      usuario_nombre_snapshot: req.user.name,
      accion: 'LOGOUT_TODAS_SESIONES',
      entidad: 'usuario',
      entidad_id: req.user.id,
      req
    });

    return res.json({ success: true, message: 'Todas las sesiones activas han sido revocadas' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Error al revocar sesiones' });
  }
});

// 8. GET /api/auth/sessions - Listar sesiones activas del usuario actual
router.get('/sessions', (req, res) => {
  if (!req.user || !req.user.authenticated) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
    const sessions = db.prepare(`
      SELECT id, dispositivo, ip, user_agent, creada_en, ultimo_uso, expira_en, revocada
      FROM sesiones 
      WHERE usuario_id = ? AND revocada = 0 AND expira_en > datetime('now', 'localtime')
      ORDER BY ultimo_uso DESC
    `).all(req.user.id);

    return res.json({ success: true, data: sessions });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Error al listar sesiones' });
  }
});

// 9. DELETE /api/auth/sessions/:id - Revocar una sesión específica del usuario actual
router.delete('/sessions/:id', (req, res) => {
  if (!req.user || !req.user.authenticated) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const { id } = req.params;
  try {
    const targetSession = db.prepare('SELECT * FROM sesiones WHERE id = ? AND usuario_id = ?').get(id, req.user.id);
    if (!targetSession) {
      return res.status(404).json({ success: false, error: 'Sesión no encontrada o no pertenece al usuario' });
    }

    revokeSession(db, id);
    return res.json({ success: true, message: 'Sesión revocada' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Error al revocar sesión' });
  }
});

// 10. Microsoft Entra ID - Endpoints
router.get('/entra/login', (req, res) => {
  const tenantId = process.env.ENTRA_TENANT_ID;
  const clientId = process.env.ENTRA_CLIENT_ID;
  const redirectUri = process.env.ENTRA_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/entra/callback`;

  if (!tenantId || !clientId) {
    // Si Entra ID no está configurado en el entorno, ofrecer mock login transparente en dev/test
    return res.redirect('/?auth=entra_simulated&user=Operario+Milicic#scan');
  }

  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('entra_state', state, { httpOnly: true, secure: isProd, maxAge: 15 * 60 * 1000, sameSite: 'lax' });

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=openid%20profile%20email%20User.Read&state=${state}`;
  res.redirect(authUrl);
});

router.get('/entra/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.redirect(`/?auth_error=${encodeURIComponent(error_description || error)}`);
  }

  const tenantId = process.env.ENTRA_TENANT_ID;
  const clientId = process.env.ENTRA_CLIENT_ID;
  const clientSecret = process.env.ENTRA_CLIENT_SECRET;
  const redirectUri = process.env.ENTRA_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/entra/callback`;

  if (!tenantId || !clientId || !clientSecret) {
    // Modo simulación local / dev
    return res.redirect('/?auth=success#scan');
  }

  try {
    // Intercambio de código por tokens con Microsoft Entra ID
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'openid profile email User.Read',
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ENTRA TOKEN ERROR]', errText);
      return res.redirect('/?auth_error=Error+en+el+intercambio+de+credenciales+con+Microsoft');
    }

    const tokenData = await response.json();
    const idToken = tokenData.id_token;
    // Decodificar payload de JWT sin verificar firma en este nivel o usando JWKS
    const payloadBase64 = idToken.split('.')[1];
    const claims = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));

    const user = provisionEntraUser(db, {
      oid: claims.oid || claims.sub,
      email: claims.email || claims.preferred_username || claims.upn,
      nombre: claims.given_name || claims.name || 'Usuario',
      apellido: claims.family_name || 'Entra',
      rolesFromEntra: claims.roles || []
    });

    const session = createSession(db, { usuario_id: user.id, req });
    res.cookie(COOKIE_NAME, session.sessionId, getCookieOptions(session.maxAgeMs));

    return res.redirect('/?auth=success#scan');
  } catch (err) {
    console.error('[ENTRA CALLBACK ERROR]', err);
    return res.redirect(`/?auth_error=${encodeURIComponent(err.message)}`);
  }
});

// Endpoint de prueba/mock para Playwright y tests de integración sin depender de la nube
router.post('/entra/mock-login', (req, res) => {
  const { email, nombre, apellido, oid, roles } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'El email corporativo es requerido' });
  }

  try {
    const user = provisionEntraUser(db, {
      oid: oid || crypto.randomUUID(),
      email,
      nombre: nombre || 'Inspector',
      apellido: apellido || 'Milicic',
      rolesFromEntra: roles || []
    });

    const session = createSession(db, { usuario_id: user.id, req });
    res.cookie(COOKIE_NAME, session.sessionId, getCookieOptions(session.maxAgeMs));

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: `${user.nombre} ${user.apellido}`.trim(),
        email: user.email,
        role: user.rol,
        rol: user.rol
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
