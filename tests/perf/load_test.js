const autocannon = require('autocannon');

async function runLoadBenchmark(url, name, connections = 20, duration = 5) {
  console.log(`\n======================================================`);
  console.log(`Iniciando prueba de carga: ${name}`);
  console.log(`URL: ${url} | Conexiones: ${connections} | Duración: ${duration}s`);
  console.log(`======================================================`);

  const result = await autocannon({
    url,
    connections,
    duration,
    headers: {
      'x-role': 'ADMIN'
    }
  });

  const p50 = result.latency.p50 || result.latency.average;
  const p95 = result.latency.p97_5 || result.latency.p99 || result.latency.max;
  const p99 = result.latency.p99 || result.latency.max;

  console.log(`Resultados para ${name}:`);
  console.log(`- Solicitudes totales: ${result.requests.total}`);
  console.log(`- Req/Seg (promedio): ${result.requests.average}`);
  console.log(`- Rendimiento: ${(result.throughput.average / (1024 * 1024)).toFixed(2)} MB/s`);
  console.log(`- Latencia promedio: ${result.latency.average} ms`);
  console.log(`- Latencia p50: ${p50} ms`);
  console.log(`- Latencia p95 / p97.5: ${p95} ms`);
  console.log(`- Latencia p99: ${p99} ms`);
  console.log(`- Errores HTTP no-2xx: ${result.non2xx}`);
  console.log(`- Errores de conexión: ${result.errors}`);
  console.log(`- Timeouts: ${result.timeouts}`);

  if (result.errors > 0 || result.timeouts > 0 || result.non2xx > 0) {
    throw new Error(`Prueba de carga fallida para ${name}: ${result.errors} errores, ${result.non2xx} no-2xx`);
  }

  return result;
}

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  console.log(`Conectando al servidor en: ${baseUrl}`);

  try {
    await runLoadBenchmark(`${baseUrl}/api/extinguishers`, 'Inventario Completo (/api/extinguishers)', 20, 5);
    await runLoadBenchmark(`${baseUrl}/api/inspections/stats`, 'KPIs / Estadísticas (/api/inspections/stats)', 20, 5);
    await runLoadBenchmark(`${baseUrl}/api/rounds/active`, 'Ronda Mensual Activa (/api/rounds/active)', 20, 5);

    console.log('\n======================================================');
    console.log('✅ [PASS] Todas las pruebas de carga finalizaron con 0 errores.');
    console.log('WAL mode + busy_timeout previnieron bloqueos de SQLite.');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ [FAIL] Error en la prueba de carga:', err.message);
    process.exit(1);
  }
}

main();
