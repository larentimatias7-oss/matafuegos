/**
 * Middleware centralizado de manejo de errores
 * Garantiza respuestas en formato uniforme en español y evita la fuga de trazas o rutas internas
 */
function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV === 'development';
  const statusCode = err.status || err.statusCode || 500;

  // Log estructurado en servidor (sin exponer al cliente)
  console.error(`[ERROR] [${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    status: statusCode,
    stack: isDev ? err.stack : undefined
  });

  // Mensaje amigable para el cliente
  let clientMessage = err.message || 'Ocurrió un error inesperado al procesar la solicitud.';

  // Ocultar errores internos no controlados en producción
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    clientMessage = 'Error interno del servidor. Por favor, reintente en unos momentos o contacte al administrador.';
  }

  res.status(statusCode).json({
    success: false,
    error: clientMessage,
    code: err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR')
  });
}

/**
 * Middleware 404 para rutas de API no encontradas
 */
function notFoundHandler(req, res, _next) {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND'
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
