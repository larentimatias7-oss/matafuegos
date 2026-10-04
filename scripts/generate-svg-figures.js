const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(__dirname, '../docs/documento/figuras');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. FIGURA 1: Mapa del Sistema Ejecutivo
const svg1 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" width="100%" height="100%">
  <defs>
    <linearGradient id="gradMilicic" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#f97316"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>

  <rect width="900" height="380" fill="#f8fafc" rx="12"/>

  <!-- Card 1: Inspector -->
  <g transform="translate(40, 50)" filter="url(#shadow)">
    <rect width="240" height="280" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
    <path d="M 0 12 Q 0 0 12 0 L 228 0 Q 240 0 240 12 L 240 45 L 0 45 Z" fill="#0f172a"/>
    <text x="120" y="28" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="14" text-anchor="middle">1. OPERACIÓN EN CAMPO</text>
    
    <rect x="20" y="65" width="200" height="50" rx="8" fill="#fff7ed" stroke="#fdba74" stroke-width="1"/>
    <text x="120" y="88" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Dispositivo Móvil / Tablet</text>
    <text x="120" y="104" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">PWA Offline • Cambio por PIN</text>

    <rect x="20" y="130" width="200" height="50" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
    <text x="120" y="153" fill="#1e293b" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Escaneo QR en Baliza</text>
    <text x="120" y="169" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Identificación de Puesto (public_id)</text>

    <rect x="20" y="195" width="200" height="50" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
    <text x="120" y="218" fill="#1e293b" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Checklist IRAM 3517-2</text>
    <text x="120" y="234" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">6 Puntos • Foto si hay falla</text>

    <text x="120" y="270" fill="#ea580c" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">⏱ &lt; 15 segundos / equipo</text>
  </g>

  <!-- Flecha 1 -> 2 -->
  <path d="M 290 190 L 330 190" stroke="#ea580c" stroke-width="3" fill="none" stroke-linecap="round"/>
  <polygon points="330,185 340,190 330,195" fill="#ea580c"/>

  <!-- Card 2: Servidor Central -->
  <g transform="translate(345, 50)" filter="url(#shadow)">
    <rect width="240" height="280" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
    <path d="M 0 12 Q 0 0 12 0 L 228 0 Q 240 0 240 12 L 240 45 L 0 45 Z" fill="#ea580c"/>
    <text x="120" y="28" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="14" text-anchor="middle">2. FIRECONTROL 365 SERVER</text>
    
    <rect x="20" y="65" width="200" height="50" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="120" y="88" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Node.js Express / Docker</text>
    <text x="120" y="104" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">API REST • RBAC • Inmutabilidad</text>

    <rect x="20" y="130" width="200" height="50" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="120" y="153" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">SQLite en Modo WAL</text>
    <text x="120" y="169" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Concurrencia ACID • Backups VACUUM</text>

    <rect x="20" y="195" width="200" height="50" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="120" y="218" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Bitácora Append-Only</text>
    <text x="120" y="234" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Auditoría inalterable de cada evento</text>

    <text x="120" y="270" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">🔒 Inmutable (HTTP 405 en edición)</text>
  </g>

  <!-- Flecha 2 -> 3 -->
  <path d="M 595 190 L 635 190" stroke="#ea580c" stroke-width="3" fill="none" stroke-linecap="round"/>
  <polygon points="635,185 645,190 635,195" fill="#ea580c"/>

  <!-- Card 3: Salidas y Decisión -->
  <g transform="translate(650, 50)" filter="url(#shadow)">
    <rect width="220" height="280" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
    <path d="M 0 12 Q 0 0 12 0 L 208 0 Q 220 0 220 12 L 220 45 L 0 45 Z" fill="#0f172a"/>
    <text x="110" y="28" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="14" text-anchor="middle">3. TOMA DE DECISIONES</text>
    
    <rect x="15" y="65" width="190" height="50" rx="8" fill="#ecfeff" stroke="#a5f3fc" stroke-width="1"/>
    <text x="105" y="88" fill="#0891b2" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Tablero de Gerencia</text>
    <text x="105" y="104" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">12 KPIs • ISPCI (0-100) • Heatmap</text>

    <rect x="15" y="130" width="190" height="50" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="105" y="153" fill="#1e293b" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Reporte Mensual PDF</text>
    <text x="105" y="169" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Código verificable para ART</text>

    <rect x="15" y="195" width="190" height="50" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="105" y="218" fill="#1e293b" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Conector Power BI / Excel</text>
    <text x="105" y="234" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Datasets OData protegidos por token</text>

    <text x="110" y="270" fill="#0284c7" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">📊 Información en tiempo real</text>
  </g>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-1-mapa-sistema-ejecutivo.svg'), svg1);

// 2. FIGURA 2: Arquitectura Técnica de Red y Contenedores
const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 420" width="100%" height="100%">
  <rect width="920" height="420" fill="#f8fafc" rx="12"/>
  
  <!-- Boundary Cloudflare / Internet -->
  <rect x="30" y="30" width="220" height="360" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
  <rect x="30" y="30" width="220" height="40" rx="10" fill="#0f172a"/>
  <text x="140" y="55" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="13" text-anchor="middle">CLIENTES &amp; BORDE</text>
  
  <rect x="45" y="90" width="190" height="60" rx="6" fill="#fff7ed" stroke="#ea580c"/>
  <text x="140" y="115" fill="#ea580c" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Navegador PWA (Móvil)</text>
  <text x="140" y="133" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">IndexedDB • Service Worker</text>

  <rect x="45" y="170" width="190" height="60" rx="6" fill="#f1f5f9" stroke="#cbd5e1"/>
  <text x="140" y="195" fill="#1e293b" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Navegador Escritorio (BI)</text>
  <text x="140" y="213" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Tablero Gerencial • Administración</text>

  <rect x="45" y="250" width="190" height="60" rx="6" fill="#eff6ff" stroke="#93c5fd"/>
  <text x="140" y="275" fill="#1d4ed8" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Power BI / Excel OData</text>
  <text x="140" y="293" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Autenticado vía bi_tokens</text>

  <!-- Flechas a Proxy -->
  <path d="M 250 120 L 310 170" stroke="#0284c7" stroke-width="2" stroke-dasharray="4" fill="none"/>
  <path d="M 250 200 L 310 200" stroke="#0284c7" stroke-width="2" fill="none"/>
  <path d="M 250 280 L 310 230" stroke="#0284c7" stroke-width="2" stroke-dasharray="4" fill="none"/>
  <text x="280" y="190" fill="#0284c7" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">HTTPS</text>

  <!-- Dokploy Host Container -->
  <rect x="310" y="30" width="580" height="360" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <rect x="310" y="30" width="580" height="40" rx="10" fill="#1e293b"/>
  <text x="600" y="55" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="13" text-anchor="middle">HOST DOKPLOY / DOCKER LINUX (INFRAESTRUCTURA MILICIC)</text>

  <!-- Proxy Inverso -->
  <rect x="330" y="90" width="130" height="280" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
  <text x="395" y="120" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">REVERSE PROXY</text>
  <text x="395" y="140" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Cloudflare Tunnel /</text>
  <text x="395" y="155" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Traefik Ingress</text>
  <line x1="345" y1="175" x2="445" y2="175" stroke="#e2e8f0"/>
  <text x="395" y="200" fill="#16a34a" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">• TLS 1.3 / HSTS</text>
  <text x="395" y="220" fill="#16a34a" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">• Rate Limiter</text>
  <text x="395" y="240" fill="#16a34a" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">• Puerto 3000</text>

  <!-- Flecha Proxy -> Node -->
  <path d="M 460 210 L 490 210" stroke="#ea580c" stroke-width="3" fill="none"/>
  <polygon points="490,205 500,210 490,215" fill="#ea580c"/>

  <!-- Node Container -->
  <rect x="500" y="90" width="370" height="280" rx="8" fill="#fff7ed" stroke="#fdba74" stroke-width="1.5"/>
  <rect x="500" y="90" width="370" height="35" rx="8" fill="#ea580c"/>
  <text x="685" y="113" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">CONTENEDOR FIRECONTROL 365 (NODE.JS 22 LTS)</text>

  <!-- Sub-blocks en Node -->
  <rect x="520" y="140" width="160" height="60" rx="6" fill="#ffffff" stroke="#fed7aa"/>
  <text x="600" y="165" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">Express 5 API</text>
  <text x="600" y="183" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Auth, RBAC, Inspecciones</text>

  <rect x="695" y="140" width="160" height="60" rx="6" fill="#ffffff" stroke="#fed7aa"/>
  <text x="775" y="165" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">Servicios de Dominio</text>
  <text x="775" y="183" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">KPIs, Antifraude, Backups</text>

  <rect x="520" y="215" width="335" height="70" rx="6" fill="#ffffff" stroke="#cbd5e1"/>
  <text x="687" y="240" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Base SQLite Embebida (node:sqlite DatabaseSync)</text>
  <text x="687" y="258" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">PRAGMA journal_mode=WAL • synchronous=NORMAL • busy_timeout=5000</text>
  <text x="687" y="273" fill="#ea580c" font-family="system-ui, sans-serif" font-weight="600" font-size="10" text-anchor="middle">Volumen Persistente: /app/data/matafuegos.db</text>

  <rect x="520" y="295" width="160" height="60" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="600" y="320" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">/app/data/backups/</text>
  <text x="600" y="338" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Copias VACUUM INTO</text>

  <rect x="695" y="295" width="160" height="60" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="775" y="320" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">/app/public/uploads/</text>
  <text x="775" y="338" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Fotos comprimidas (JPEG)</text>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-2-arquitectura-tecnica-red.svg'), svg2);

// 3. FIGURA 3: Flujo de un Día de Ronda
const svg3 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 940 320" width="100%" height="100%">
  <rect width="940" height="320" fill="#f8fafc" rx="12"/>
  
  <!-- Paso 1 -->
  <g transform="translate(30, 40)">
    <circle cx="35" cy="35" r="25" fill="#ea580c"/>
    <text x="35" y="42" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="800" font-size="16" text-anchor="middle">1</text>
    <rect x="0" y="75" width="150" height="180" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="75" y="100" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">INICIO Y PIN</text>
    <text x="75" y="125" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Inspector toma tablet.</text>
    <text x="75" y="145" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Ingresa PIN de 4 dígitos.</text>
    <text x="75" y="165" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Se activa su sector.</text>
    <rect x="15" y="195" width="120" height="45" rx="6" fill="#fff7ed"/>
    <text x="75" y="215" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">Cambio Rápido</text>
    <text x="75" y="230" fill="#c2410c" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Sin contraseña larga</text>
  </g>
  <path d="M 190 140 L 210 140" stroke="#ea580c" stroke-width="2" fill="none"/>

  <!-- Paso 2 -->
  <g transform="translate(220, 40)">
    <circle cx="35" cy="35" r="25" fill="#ea580c"/>
    <text x="35" y="42" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="800" font-size="16" text-anchor="middle">2</text>
    <rect x="0" y="75" width="150" height="180" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="75" y="100" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">ESCANEO QR</text>
    <text x="75" y="125" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Cámara lee QR en baliza.</text>
    <text x="75" y="145" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Carga de ficha técnica.</text>
    <text x="75" y="165" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Valida ubicación física.</text>
    <rect x="15" y="195" width="120" height="45" rx="6" fill="#f1f5f9"/>
    <text x="75" y="215" fill="#1e293b" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">public_id Seguro</text>
    <text x="75" y="230" fill="#1e293b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Evita falsificación</text>
  </g>
  <path d="M 380 140 L 400 140" stroke="#ea580c" stroke-width="2" fill="none"/>

  <!-- Paso 3 -->
  <g transform="translate(410, 40)">
    <circle cx="35" cy="35" r="25" fill="#ea580c"/>
    <text x="35" y="42" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="800" font-size="16" text-anchor="middle">3</text>
    <rect x="0" y="75" width="150" height="180" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="75" y="100" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">6 PUNTOS IRAM</text>
    <text x="75" y="125" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Acceso • Manómetro</text>
    <text x="75" y="145" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Precinto • Cilindro</text>
    <text x="75" y="165" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Señal • Marbete oficial</text>
    <rect x="15" y="195" width="120" height="45" rx="6" fill="#dcfce7"/>
    <text x="75" y="215" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">Antifraude Activo</text>
    <text x="75" y="230" fill="#16a34a" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Marca &lt; 5s sospechoso</text>
  </g>
  <path d="M 570 140 L 590 140" stroke="#ea580c" stroke-width="2" fill="none"/>

  <!-- Paso 4 -->
  <g transform="translate(600, 40)">
    <circle cx="35" cy="35" r="25" fill="#ea580c"/>
    <text x="35" y="42" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="800" font-size="16" text-anchor="middle">4</text>
    <rect x="0" y="75" width="150" height="180" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="75" y="100" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">CASO SI HAY FALLA</text>
    <text x="75" y="125" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Foto obligatoria.</text>
    <text x="75" y="145" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Abre caso ABIERTO.</text>
    <text x="75" y="165" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Prioridad ALTA.</text>
    <rect x="15" y="195" width="120" height="45" rx="6" fill="#fee2e2"/>
    <text x="75" y="215" fill="#dc2626" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">Trazabilidad Falla</text>
    <text x="75" y="230" fill="#dc2626" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Asigna sustituto prov.</text>
  </g>
  <path d="M 760 140 L 780 140" stroke="#ea580c" stroke-width="2" fill="none"/>

  <!-- Paso 5 -->
  <g transform="translate(790, 40)">
    <circle cx="35" cy="35" r="25" fill="#0f172a"/>
    <text x="35" y="42" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="800" font-size="16" text-anchor="middle">5</text>
    <rect x="0" y="75" width="130" height="180" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="65" y="100" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">CIERRE &amp; BI</text>
    <text x="65" y="125" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Supervisor audita.</text>
    <text x="65" y="145" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Cierre de ronda.</text>
    <text x="65" y="165" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">KPIs congelados.</text>
    <rect x="10" y="195" width="110" height="45" rx="6" fill="#ecfeff"/>
    <text x="65" y="215" fill="#0891b2" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">Reporte Oficial</text>
    <text x="65" y="230" fill="#0891b2" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">PDF &amp; Power BI</text>
  </g>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-3-flujo-dia-ronda.svg'), svg3);

// 4. FIGURA 4: Flujo de Autenticación y PIN Switch
const svg4 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 360" width="100%" height="100%">
  <rect width="860" height="360" fill="#f8fafc" rx="12"/>
  
  <!-- Usuario inicia -->
  <rect x="40" y="140" width="160" height="80" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <text x="120" y="175" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="13" text-anchor="middle">USUARIO INGRESA</text>
  <text x="120" y="195" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Pantalla de Login</text>

  <!-- Bifurcación -->
  <path d="M 200 180 L 260 180" stroke="#ea580c" stroke-width="2" fill="none"/>
  <path d="M 260 180 L 260 80 L 310 80" stroke="#ea580c" stroke-width="2" fill="none"/>
  <path d="M 260 180 L 310 180" stroke="#ea580c" stroke-width="2" fill="none"/>
  <path d="M 260 180 L 260 280 L 310 280" stroke="#ea580c" stroke-width="2" fill="none"/>

  <!-- Vía 1: Entra ID -->
  <rect x="310" y="45" width="250" height="70" rx="8" fill="#eff6ff" stroke="#93c5fd"/>
  <text x="435" y="75" fill="#1d4ed8" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">VÍA A: Microsoft Entra ID (M365)</text>
  <text x="435" y="95" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">OAuth2 / OpenID Connect • @milicic.com.ar</text>

  <!-- Vía 2: PIN Switch -->
  <rect x="310" y="145" width="250" height="70" rx="8" fill="#fff7ed" stroke="#fdba74" stroke-width="2"/>
  <text x="435" y="173" fill="#ea580c" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">VÍA B: Cambio Rápido por PIN</text>
  <text x="435" y="190" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Tablet Compartida • /api/auth/pin-switch</text>
  <text x="435" y="205" fill="#c2410c" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle">Bloqueo 15 min al 5° intento fallido</text>

  <!-- Vía 3: Usuario Local -->
  <rect x="310" y="245" width="250" height="70" rx="8" fill="#f1f5f9" stroke="#cbd5e1"/>
  <text x="435" y="275" fill="#1e293b" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">VÍA C: Cuenta Local de Respaldo</text>
  <text x="435" y="295" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Argon2id Hash • Contingencia ante corte M365</text>

  <!-- Convergencia a Sesión -->
  <path d="M 560 80 L 610 80 L 610 180 L 650 180" stroke="#16a34a" stroke-width="2" fill="none"/>
  <path d="M 560 180 L 650 180" stroke="#16a34a" stroke-width="2" fill="none"/>
  <path d="M 560 280 L 610 280 L 610 180 L 650 180" stroke="#16a34a" stroke-width="2" fill="none"/>

  <!-- Bloque Sesión Validada -->
  <rect x="650" y="135" width="180" height="90" rx="10" fill="#dcfce7" stroke="#86efac" stroke-width="2"/>
  <text x="740" y="165" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="800" font-size="13" text-anchor="middle">SESIÓN ACTIVA</text>
  <text x="740" y="185" fill="#334155" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Cookie HttpOnly (256-bit)</text>
  <text x="740" y="202" fill="#334155" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Filtro de Sector Asignado</text>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-4-flujo-auth-pin.svg'), svg4);

// 5. FIGURA 5: Máquina de Estados del Activo y Caso
const svg5 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 340" width="100%" height="100%">
  <rect width="880" height="340" fill="#f8fafc" rx="12"/>
  
  <text x="440" y="35" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="800" font-size="14" text-anchor="middle">MÁQUINA DE ESTADOS: ACTIVO &amp; ANOMALÍAS</text>

  <!-- Estado OPERATIVO -->
  <g transform="translate(60, 90)">
    <rect width="190" height="90" rx="12" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text x="95" y="35" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="800" font-size="15" text-anchor="middle">OPERATIVO</text>
    <text x="95" y="55" fill="#334155" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">En puesto reglamentario</text>
    <text x="95" y="70" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="600" font-size="10" text-anchor="middle">Listo para actuar</text>
  </g>

  <!-- Transición Falla -->
  <path d="M 250 120 L 370 120" stroke="#dc2626" stroke-width="2.5" fill="none"/>
  <polygon points="370,115 380,120 370,125" fill="#dc2626"/>
  <text x="315" y="110" fill="#dc2626" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">Inspección Fallida</text>
  <text x="315" y="140" fill="#64748b" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle">Abre caso ABIERTO</text>

  <!-- Estado EN TALLER -->
  <g transform="translate(380, 90)">
    <rect width="190" height="90" rx="12" fill="#fff7ed" stroke="#ea580c" stroke-width="2"/>
    <text x="95" y="35" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="800" font-size="15" text-anchor="middle">EN_TALLER</text>
    <text x="95" y="55" fill="#334155" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Enviado con Orden Servicio</text>
    <text x="95" y="70" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="600" font-size="10" text-anchor="middle">Con cilindro sustituto</text>
  </g>

  <!-- Transición Retorno de Taller -->
  <path d="M 475 180 L 475 240 L 155 240 L 155 180" stroke="#16a34a" stroke-width="2.5" fill="none"/>
  <polygon points="150,185 155,180 160,185" fill="#16a34a"/>
  <text x="315" y="230" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">Retorno con Remito y Marbete Nuevo (Caso RESUELTO)</text>

  <!-- Transición Descarte / Fin vida útil -->
  <path d="M 570 135 L 690 135" stroke="#64748b" stroke-width="2" stroke-dasharray="4" fill="none"/>
  <polygon points="690,130 700,135 690,140" fill="#64748b"/>
  <text x="635" y="125" fill="#64748b" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">Fallo PH / &gt;20 Años</text>

  <!-- Estado DE BAJA -->
  <g transform="translate(700, 90)">
    <rect width="140" height="90" rx="12" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="70" y="35" fill="#475569" font-family="system-ui, sans-serif" font-weight="800" font-size="14" text-anchor="middle">DE_BAJA</text>
    <text x="70" y="55" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Chatarrización</text>
    <text x="70" y="70" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Baja contable</text>
  </g>

  <!-- Leyenda inferior -->
  <rect x="60" y="275" width="760" height="40" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="440" y="300" fill="#334155" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Regla de Negocio: Mientras un extintor está EN_TALLER, se exige la asignación de temp_replacement_code para mantener cubierto el puesto.</text>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-5-maquina-estados-activo-anomalia.svg'), svg5);

// 6. FIGURA 6: Secuencia Offline & Cuarentena
const svg6 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 360" width="100%" height="100%">
  <rect width="900" height="360" fill="#f8fafc" rx="12"/>
  
  <text x="450" y="30" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="800" font-size="14" text-anchor="middle">SECUENCIA OFFLINE: ENCOLADO, REVALIDACIÓN Y CUARENTENA</text>

  <!-- Carriles -->
  <text x="150" y="70" fill="#ea580c" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">DISPOSITIVO EN CAMPO</text>
  <line x1="150" y1="80" x2="150" y2="330" stroke="#fed7aa" stroke-width="2" stroke-dasharray="4"/>

  <text x="450" y="70" fill="#0891b2" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">INDEXEDDB LOCAL</text>
  <line x1="450" y1="80" x2="450" y2="330" stroke="#bae6fd" stroke-width="2" stroke-dasharray="4"/>

  <text x="750" y="70" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">SERVIDOR BACKEND</text>
  <line x1="750" y1="80" x2="750" y2="330" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4"/>

  <!-- Evento 1: Sin red -->
  <rect x="70" y="100" width="160" height="30" rx="6" fill="#fee2e2" stroke="#fca5a5"/>
  <text x="150" y="120" fill="#dc2626" font-family="system-ui, sans-serif" font-weight="600" font-size="10" text-anchor="middle">Pérdida de Señal (Subsuelo)</text>

  <path d="M 150 140 L 440 140" stroke="#ea580c" stroke-width="2" fill="none"/>
  <polygon points="440,135 450,140 440,145" fill="#ea580c"/>
  <text x="290" y="132" fill="#c2410c" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Encolar en pending_inspections (Foto Canvas 70%)</text>

  <!-- Evento 2: Vuelve red -->
  <rect x="70" y="170" width="160" height="30" rx="6" fill="#dcfce7" stroke="#86efac"/>
  <text x="150" y="190" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="600" font-size="10" text-anchor="middle">Conexión Restablecida</text>

  <path d="M 150 215 L 740 215" stroke="#0284c7" stroke-width="2" fill="none"/>
  <polygon points="740,210 750,215 740,220" fill="#0284c7"/>
  <text x="450" y="208" fill="#0284c7" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">1. Revalidar Sesión: GET /api/auth/me</text>

  <!-- Bifurcación Éxito vs Cuarentena -->
  <path d="M 750 250 L 460 250" stroke="#16a34a" stroke-width="2" fill="none"/>
  <polygon points="460,245 450,250 460,255" fill="#16a34a"/>
  <text x="600" y="242" fill="#16a34a" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Si 200 OK: Sincronizar y depurar cola</text>

  <path d="M 750 290 L 460 290" stroke="#dc2626" stroke-width="2" stroke-dasharray="4" fill="none"/>
  <polygon points="460,285 450,290 460,295" fill="#dc2626"/>
  <text x="600" y="282" fill="#dc2626" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Si 401/403: Mover a 'quarantine_inspections'</text>

  <rect x="360" y="305" width="180" height="35" rx="6" fill="#fef3c7" stroke="#fcd34d"/>
  <text x="450" y="325" fill="#d97706" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">Protegido para Auditoría HyS</text>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-6-secuencia-offline-quarantine.svg'), svg6);

// 7. FIGURA 7: Inmutabilidad y Hashes
const svg7 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 300" width="100%" height="100%">
  <rect width="880" height="300" fill="#f8fafc" rx="12"/>
  <text x="440" y="30" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="800" font-size="14" text-anchor="middle">INMUTABILIDAD DE REGISTROS Y HASH CRIPTOGRÁFICO DE CIERRE</text>

  <!-- Bloque Inspección 1 -->
  <g transform="translate(60, 60)">
    <rect width="200" height="130" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <rect x="0" y="0" width="200" height="30" rx="8" fill="#0f172a"/>
    <text x="100" y="20" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">INSPECCIÓN #1042</text>
    <text x="15" y="55" fill="#334155" font-family="system-ui, sans-serif" font-size="10">Extintor: MF-014</text>
    <text x="15" y="72" fill="#334155" font-family="system-ui, sans-serif" font-size="10">Inspector: Santiago Amaya</text>
    <text x="15" y="89" fill="#334155" font-family="system-ui, sans-serif" font-size="10">Resultado: APROBADO</text>
    <text x="15" y="110" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="700" font-size="10">PUT / PATCH / DELETE: 405</text>
  </g>

  <!-- Flecha Encadenada -->
  <path d="M 260 125 L 340 125" stroke="#ea580c" stroke-width="2" fill="none"/>
  <polygon points="340,120 350,125 340,130" fill="#ea580c"/>

  <!-- Bloque Inspección 2 -->
  <g transform="translate(350, 60)">
    <rect width="200" height="130" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <rect x="0" y="0" width="200" height="30" rx="8" fill="#0f172a"/>
    <text x="100" y="20" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">INSPECCIÓN #1043</text>
    <text x="15" y="55" fill="#334155" font-family="system-ui, sans-serif" font-size="10">Extintor: MF-015</text>
    <text x="15" y="72" fill="#334155" font-family="system-ui, sans-serif" font-size="10">Inspector: Marcos Paz</text>
    <text x="15" y="89" fill="#334155" font-family="system-ui, sans-serif" font-size="10">Resultado: FALLA (Manómetro)</text>
    <text x="15" y="110" fill="#dc2626" font-family="system-ui, sans-serif" font-weight="700" font-size="10">Apertura Caso #45</text>
  </g>

  <!-- Flecha Encadenada -->
  <path d="M 550 125 L 630 125" stroke="#ea580c" stroke-width="2" fill="none"/>
  <polygon points="630,120 640,125 630,130" fill="#ea580c"/>

  <!-- Bloque Snapshot Mensual -->
  <g transform="translate(640, 60)">
    <rect width="200" height="130" rx="8" fill="#fff7ed" stroke="#fdba74" stroke-width="2"/>
    <rect x="0" y="0" width="200" height="30" rx="8" fill="#ea580c"/>
    <text x="100" y="20" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">SNAPSHOT MENSUAL</text>
    <text x="15" y="55" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="700" font-size="10">Mes: 2026-10 (Ronda)</text>
    <text x="15" y="72" fill="#334155" font-family="system-ui, sans-serif" font-size="10">Cobertura: 98.5%</text>
    <text x="15" y="90" fill="#0f172a" font-family="Courier, monospace" font-size="9">hash_integridad:</text>
    <text x="15" y="105" fill="#0f172a" font-family="Courier, monospace" font-size="8">e3b0c44298fc1c149af...</text>
    <text x="15" y="122" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="700" font-size="9">✔ SHA-256 Verificado</text>
  </g>

  <!-- Barra informativa inferior -->
  <rect x="60" y="220" width="780" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="450" y="243" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">Principio de No Repudio: Si se intentara editar la base de datos externamente sin la app,</text>
  <text x="450" y="258" fill="#dc2626" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">la huella SHA-256 no coincidirá con el snapshot registrado, denunciando la adulteración en auditoría.</text>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-7-inmutabilidad-hashes.svg'), svg7);

// 8. FIGURA 8: Línea de Tiempo de Vida Útil (20 años)
const svg8 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 280" width="100%" height="100%">
  <rect width="920" height="280" fill="#f8fafc" rx="12"/>
  <text x="460" y="30" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="800" font-size="14" text-anchor="middle">LÍNEA DE TIEMPO DEL CICLO DE VIDA DE UN EXTINTOR (IRAM 3517-2)</text>

  <!-- Línea principal -->
  <line x1="80" y1="120" x2="840" y2="120" stroke="#cbd5e1" stroke-width="4"/>

  <!-- Hito 0 Años -->
  <circle cx="80" cy="120" r="10" fill="#0f172a"/>
  <text x="80" y="150" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Año 0</text>
  <text x="80" y="170" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Fabricación</text>
  <text x="80" y="185" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Estampado Domo</text>

  <!-- Hito 1 Año (Recurrente) -->
  <circle cx="160" cy="120" r="6" fill="#ea580c"/>
  <text x="160" y="95" fill="#ea580c" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">Recarga Anual</text>
  <text x="160" y="80" fill="#64748b" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle">Nuevo Marbete</text>

  <!-- Hito 5 Años -->
  <circle cx="270" cy="120" r="12" fill="#c2410c"/>
  <text x="270" y="150" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Año 5</text>
  <text x="270" y="170" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="600" font-size="10" text-anchor="middle">1ª Prueba Hidráulica</text>
  <text x="270" y="185" fill="#64748b" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle">Ensayo Presión PH</text>

  <!-- Hito 10 Años -->
  <circle cx="460" cy="120" r="12" fill="#c2410c"/>
  <text x="460" y="150" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Año 10</text>
  <text x="460" y="170" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="600" font-size="10" text-anchor="middle">2ª Prueba Hidráulica</text>

  <!-- Hito 15 Años -->
  <circle cx="650" cy="120" r="12" fill="#c2410c"/>
  <text x="650" y="150" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">Año 15</text>
  <text x="650" y="170" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="600" font-size="10" text-anchor="middle">3ª Prueba Hidráulica</text>

  <!-- Hito 20 Años - Límite Fatal -->
  <circle cx="840" cy="120" r="14" fill="#dc2626"/>
  <text x="840" y="150" fill="#dc2626" font-family="system-ui, sans-serif" font-weight="800" font-size="13" text-anchor="middle">Año 20</text>
  <text x="840" y="170" fill="#dc2626" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">FIN VIDA ÚTIL</text>
  <text x="840" y="185" fill="#64748b" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle">Baja Ineludible</text>

  <!-- Caja inferior explicativa -->
  <rect x="80" y="215" width="760" height="40" rx="8" fill="#fff7ed" stroke="#fdba74"/>
  <text x="460" y="240" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="600" font-size="11" text-anchor="middle">FireControl 365 calcula automáticamente lifespan_limit y bloquea la habilitación al cumplir los 20 años.</text>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-8-linea-tiempo-vida-util-20-anos.svg'), svg8);

// 9. FIGURA 9: Flujo Backup ACID VACUUM INTO
const svg9 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 300" width="100%" height="100%">
  <rect width="880" height="300" fill="#f8fafc" rx="12"/>
  <text x="440" y="30" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="800" font-size="14" text-anchor="middle">RESPALDO ATÓMICO EN CALIENTE: SQLITE VACUUM INTO &amp; INTEGRITY CHECK</text>

  <!-- Paso 1 -->
  <g transform="translate(60, 60)">
    <rect width="210" height="150" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <rect x="0" y="0" width="210" height="35" rx="10" fill="#0f172a"/>
    <text x="105" y="22" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">1. BASE VIVA OPERATIVA</text>
    <text x="15" y="55" fill="#334155" font-family="system-ui, sans-serif" font-size="11">data/matafuegos.db</text>
    <text x="15" y="75" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">Usuarios operando en campo.</text>
    <text x="15" y="95" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">Sin detención del servicio.</text>
    <text x="15" y="125" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="700" font-size="10">Cero bloqueos de lectura/escritura</text>
  </g>

  <!-- Flecha VACUUM INTO -->
  <path d="M 270 135 L 340 135" stroke="#ea580c" stroke-width="2.5" fill="none"/>
  <polygon points="340,130 350,135 340,140" fill="#ea580c"/>
  <text x="310" y="125" fill="#ea580c" font-family="Courier, monospace" font-weight="700" font-size="9" text-anchor="middle">VACUUM INTO</text>

  <!-- Paso 2 -->
  <g transform="translate(350, 60)">
    <rect width="210" height="150" rx="10" fill="#fff7ed" stroke="#fdba74" stroke-width="2"/>
    <rect x="0" y="0" width="210" height="35" rx="10" fill="#ea580c"/>
    <text x="105" y="22" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">2. COPIA ATÓMICA GENERADA</text>
    <text x="15" y="55" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="600" font-size="10">firecontrol-backup-*.sqlite</text>
    <text x="15" y="75" fill="#334155" font-family="system-ui, sans-serif" font-size="10">Archivo compactado y consistente.</text>
    <text x="15" y="95" fill="#334155" font-family="system-ui, sans-serif" font-size="10">Ejecución inmediata de:</text>
    <text x="15" y="115" fill="#0f172a" font-family="Courier, monospace" font-weight="700" font-size="10">PRAGMA integrity_check;</text>
    <text x="15" y="135" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="700" font-size="10">Si check != 'ok' ➔ Se borra</text>
  </g>

  <!-- Flecha Aprobado -->
  <path d="M 560 135 L 630 135" stroke="#16a34a" stroke-width="2.5" fill="none"/>
  <polygon points="630,130 640,135 630,140" fill="#16a34a"/>
  <text x="600" y="125" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="700" font-size="9" text-anchor="middle">check == 'ok'</text>

  <!-- Paso 3 -->
  <g transform="translate(640, 60)">
    <rect width="180" height="150" rx="10" fill="#dcfce7" stroke="#86efac" stroke-width="1.5"/>
    <rect x="0" y="0" width="180" height="35" rx="10" fill="#16a34a"/>
    <text x="90" y="22" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">3. REPOSITORIO LISTO</text>
    <text x="15" y="55" fill="#166534" font-family="system-ui, sans-serif" font-size="10">Retención: 7 copias.</text>
    <text x="15" y="75" fill="#166534" font-family="system-ui, sans-serif" font-size="10">Purga &gt; 30 días.</text>
    <text x="15" y="105" fill="#166534" font-family="system-ui, sans-serif" font-weight="700" font-size="11">RTO: 15 minutos</text>
    <text x="15" y="125" fill="#166534" font-family="system-ui, sans-serif" font-weight="700" font-size="11">RPO: &lt; 24 horas</text>
  </g>

  <rect x="60" y="235" width="760" height="40" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="440" y="260" fill="#334155" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Comandos CLI automatizados: npm run backup (disparo programado) y npm run restore (contingencia rápida).</text>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-9-flujo-backup-acid-vacuum.svg'), svg9);

// 10. FIGURA 10: Matriz de Roles Heatmap
const svg10 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 350" width="100%" height="100%">
  <rect width="880" height="350" fill="#f8fafc" rx="12"/>
  <text x="440" y="30" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="800" font-size="14" text-anchor="middle">MAPA DE CALOR: MATRIZ DE ROLES Y PERMISOS (RBAC)</text>

  <!-- Encabezados de tabla -->
  <g transform="translate(60, 55)">
    <rect x="0" y="0" width="220" height="30" fill="#0f172a"/>
    <text x="110" y="20" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">MÓDULO / ACCIÓN</text>

    <rect x="225" y="0" width="90" height="30" fill="#0f172a"/>
    <text x="270" y="20" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">SUPERADMIN</text>

    <rect x="320" y="0" width="85" height="30" fill="#0f172a"/>
    <text x="362" y="20" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">ADMIN</text>

    <rect x="410" y="0" width="85" height="30" fill="#0f172a"/>
    <text x="452" y="20" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">SUPERVISOR</text>

    <rect x="500" y="0" width="85" height="30" fill="#0f172a"/>
    <text x="542" y="20" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">INSPECTOR</text>

    <rect x="590" y="0" width="85" height="30" fill="#0f172a"/>
    <text x="632" y="20" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">AUDITOR</text>

    <rect x="680" y="0" width="85" height="30" fill="#0f172a"/>
    <text x="722" y="20" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">GERENCIA</text>
  </g>

  <!-- Filas -->
  <!-- Fila 1 -->
  <g transform="translate(60, 90)">
    <rect x="0" y="0" width="220" height="28" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="10" y="18" fill="#1e293b" font-family="system-ui, sans-serif" font-size="11">Crear / Editar Extintores</text>
    <rect x="225" y="0" width="90" height="28" fill="#dcfce7"/><text x="270" y="18" fill="#16a34a" font-weight="700" text-anchor="middle">SÍ</text>
    <rect x="320" y="0" width="85" height="28" fill="#dcfce7"/><text x="362" y="18" fill="#16a34a" font-weight="700" text-anchor="middle">SÍ</text>
    <rect x="410" y="0" width="85" height="28" fill="#fee2e2"/><text x="452" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
    <rect x="500" y="0" width="85" height="28" fill="#fee2e2"/><text x="542" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
    <rect x="590" y="0" width="85" height="28" fill="#fee2e2"/><text x="632" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
    <rect x="680" y="0" width="85" height="28" fill="#fee2e2"/><text x="722" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
  </g>

  <!-- Fila 2 -->
  <g transform="translate(60, 122)">
    <rect x="0" y="0" width="220" height="28" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="10" y="18" fill="#1e293b" font-family="system-ui, sans-serif" font-size="11">Registrar Inspección</text>
    <rect x="225" y="0" width="90" height="28" fill="#dcfce7"/><text x="270" y="18" fill="#16a34a" font-weight="700" text-anchor="middle">SÍ</text>
    <rect x="320" y="0" width="85" height="28" fill="#dcfce7"/><text x="362" y="18" fill="#16a34a" font-weight="700" text-anchor="middle">SÍ</text>
    <rect x="410" y="0" width="85" height="28" fill="#dcfce7"/><text x="452" y="18" fill="#16a34a" font-weight="700" text-anchor="middle">SÍ</text>
    <rect x="500" y="0" width="85" height="28" fill="#dcfce7"/><text x="542" y="18" fill="#16a34a" font-weight="700" text-anchor="middle">SÍ*</text>
    <rect x="590" y="0" width="85" height="28" fill="#fee2e2"/><text x="632" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
    <rect x="680" y="0" width="85" height="28" fill="#fee2e2"/><text x="722" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
  </g>

  <!-- Fila 3 -->
  <g transform="translate(60, 154)">
    <rect x="0" y="0" width="220" height="28" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="10" y="18" fill="#1e293b" font-family="system-ui, sans-serif" font-size="11">Cerrar / Reabrir Rondas</text>
    <rect x="225" y="0" width="90" height="28" fill="#dcfce7"/><text x="270" y="18" fill="#16a34a" font-weight="700" text-anchor="middle">SÍ</text>
    <rect x="320" y="0" width="85" height="28" fill="#dcfce7"/><text x="362" y="18" fill="#16a34a" font-weight="700" text-anchor="middle">SÍ</text>
    <rect x="410" y="0" width="85" height="28" fill="#fef3c7"/><text x="452" y="18" fill="#d97706" font-weight="700" text-anchor="middle">REABRIR</text>
    <rect x="500" y="0" width="85" height="28" fill="#fee2e2"/><text x="542" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
    <rect x="590" y="0" width="85" height="28" fill="#fee2e2"/><text x="632" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
    <rect x="680" y="0" width="85" height="28" fill="#fee2e2"/><text x="722" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
  </g>

  <!-- Fila 4 -->
  <g transform="translate(60, 186)">
    <rect x="0" y="0" width="220" height="28" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="10" y="18" fill="#1e293b" font-family="system-ui, sans-serif" font-size="11">Tablero de Gerencia (BI)</text>
    <rect x="225" y="0" width="90" height="28" fill="#dcfce7"/><text x="270" y="18" fill="#16a34a" font-weight="700" text-anchor="middle">SÍ</text>
    <rect x="320" y="0" width="85" height="28" fill="#dcfce7"/><text x="362" y="18" fill="#16a34a" font-weight="700" text-anchor="middle">SÍ</text>
    <rect x="410" y="0" width="85" height="28" fill="#fee2e2"/><text x="452" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
    <rect x="500" y="0" width="85" height="28" fill="#fee2e2"/><text x="542" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
    <rect x="590" y="0" width="85" height="28" fill="#dcfce7"/><text x="632" y="18" fill="#16a34a" font-weight="700" text-anchor="middle">SÍ</text>
    <rect x="680" y="0" width="85" height="28" fill="#dcfce7"/><text x="722" y="18" fill="#16a34a" font-weight="700" text-anchor="middle">SÍ</text>
  </g>

  <!-- Fila 5 -->
  <g transform="translate(60, 218)">
    <rect x="0" y="0" width="220" height="28" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="10" y="18" fill="#1e293b" font-family="system-ui, sans-serif" font-size="11">Backups y Configuración TI</text>
    <rect x="225" y="0" width="90" height="28" fill="#dcfce7"/><text x="270" y="18" fill="#16a34a" font-weight="700" text-anchor="middle">SÍ</text>
    <rect x="320" y="0" width="85" height="28" fill="#fee2e2"/><text x="362" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
    <rect x="410" y="0" width="85" height="28" fill="#fee2e2"/><text x="452" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
    <rect x="500" y="0" width="85" height="28" fill="#fee2e2"/><text x="542" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
    <rect x="590" y="0" width="85" height="28" fill="#fee2e2"/><text x="632" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
    <rect x="680" y="0" width="85" height="28" fill="#fee2e2"/><text x="722" y="18" fill="#dc2626" font-weight="700" text-anchor="middle">NO</text>
  </g>

  <text x="440" y="280" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">* El rol INSPECTOR tiene su alcance limitado exclusivamente a los pisos y edificios definidos en usuarios_sectores.</text>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-10-matriz-roles-heatmap.svg'), svg10);

// 11. FIGURA 11: Escenarios de Falla y Resiliencia
const svg11 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 320" width="100%" height="100%">
  <rect width="900" height="320" fill="#f8fafc" rx="12"/>
  <text x="450" y="30" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="800" font-size="14" text-anchor="middle">MATRIZ DE ESCENARIOS DE FALLA Y RESILIENCIA TÉCNICA</text>

  <!-- Escenario 1 -->
  <g transform="translate(40, 60)">
    <rect width="185" height="220" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
    <rect x="0" y="0" width="185" height="40" rx="8" fill="#dc2626"/>
    <text x="92" y="25" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">SERVIDOR CAÍDO</text>
    <text x="15" y="65" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11">Causa:</text>
    <text x="15" y="80" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">Falla eléctrica o host.</text>
    <text x="15" y="105" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11">Respuesta:</text>
    <text x="15" y="120" fill="#334155" font-family="system-ui, sans-serif" font-size="10">Dokploy reinicia el</text>
    <text x="15" y="135" fill="#334155" font-family="system-ui, sans-serif" font-size="10">contenedor Docker.</text>
    <rect x="15" y="165" width="155" height="35" rx="6" fill="#fef2f2"/>
    <text x="92" y="187" fill="#dc2626" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">RTO &lt; 30 segundos</text>
  </g>

  <!-- Escenario 2 -->
  <g transform="translate(250, 60)">
    <rect width="185" height="220" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
    <rect x="0" y="0" width="185" height="40" rx="8" fill="#d97706"/>
    <text x="92" y="25" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">SIN INTERNET</text>
    <text x="15" y="65" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11">Causa:</text>
    <text x="15" y="80" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">Corte de fibra o subsuelo.</text>
    <text x="15" y="105" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11">Respuesta:</text>
    <text x="15" y="120" fill="#334155" font-family="system-ui, sans-serif" font-size="10">PWA almacena en</text>
    <text x="15" y="135" fill="#334155" font-family="system-ui, sans-serif" font-size="10">IndexedDB local.</text>
    <rect x="15" y="165" width="155" height="35" rx="6" fill="#fef3c7"/>
    <text x="92" y="187" fill="#d97706" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">Continuidad 100%</text>
  </g>

  <!-- Escenario 3 -->
  <g transform="translate(460, 60)">
    <rect width="185" height="220" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
    <rect x="0" y="0" width="185" height="40" rx="8" fill="#c2410c"/>
    <text x="92" y="25" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">DISCO DAÑADO</text>
    <text x="15" y="65" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11">Causa:</text>
    <text x="15" y="80" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">Corrupción de bloques.</text>
    <text x="15" y="105" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11">Respuesta:</text>
    <text x="15" y="120" fill="#334155" font-family="system-ui, sans-serif" font-size="10">Restauración atómica</text>
    <text x="15" y="135" fill="#334155" font-family="system-ui, sans-serif" font-size="10">del último backup ACID.</text>
    <rect x="15" y="165" width="155" height="35" rx="6" fill="#fff7ed"/>
    <text x="92" y="187" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">RTO &lt; 15 minutos</text>
  </g>

  <!-- Escenario 4 -->
  <g transform="translate(670, 60)">
    <rect width="185" height="220" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
    <rect x="0" y="0" width="185" height="40" rx="8" fill="#0f172a"/>
    <text x="92" y="25" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">CELULAR ROTO</text>
    <text x="15" y="65" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11">Causa:</text>
    <text x="15" y="80" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">Caída física en obra.</text>
    <text x="15" y="105" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11">Respuesta:</text>
    <text x="15" y="120" fill="#334155" font-family="system-ui, sans-serif" font-size="10">Toma otro equipo.</text>
    <text x="15" y="135" fill="#334155" font-family="system-ui, sans-serif" font-size="10">Ingresa PIN de 4 dígitos.</text>
    <rect x="15" y="165" width="155" height="35" rx="6" fill="#f1f5f9"/>
    <text x="92" y="187" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">Cero datos perdidos</text>
  </g>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-11-escenarios-falla-resiliencia.svg'), svg11);

// 12. FIGURA 12: Arquitectura del Tablero de Gerencia y BI
const svg12 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 320" width="100%" height="100%">
  <rect width="880" height="320" fill="#f8fafc" rx="12"/>
  <text x="440" y="30" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="800" font-size="14" text-anchor="middle">ARQUITECTURA DEL TABLERO GERENCIAL Y SNAPSHOTS INMUTABLES</text>

  <!-- Base Operativa -->
  <g transform="translate(50, 70)">
    <rect width="220" height="200" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <rect x="0" y="0" width="220" height="35" rx="10" fill="#0f172a"/>
    <text x="110" y="22" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">BASE OPERATIVA VIVA</text>
    <text x="20" y="60" fill="#334155" font-family="system-ui, sans-serif" font-size="11">• extinguishers (130)</text>
    <text x="20" y="85" fill="#334155" font-family="system-ui, sans-serif" font-size="11">• inspections (en vivo)</text>
    <text x="20" y="110" fill="#334155" font-family="system-ui, sans-serif" font-size="11">• cases (desvíos)</text>
    <text x="20" y="135" fill="#334155" font-family="system-ui, sans-serif" font-size="11">• ordenes_servicio</text>
    <text x="110" y="175" fill="#ea580c" font-family="system-ui, sans-serif" font-weight="600" font-size="10" text-anchor="middle">Mutaciones continuas en campo</text>
  </g>

  <!-- Flecha Motor de KPIs -->
  <path d="M 270 170 L 330 170" stroke="#ea580c" stroke-width="2.5" fill="none"/>
  <polygon points="330,165 340,170 330,175" fill="#ea580c"/>

  <!-- Motor kpiService.js -->
  <g transform="translate(340, 70)">
    <rect width="230" height="200" rx="10" fill="#fff7ed" stroke="#fdba74" stroke-width="2"/>
    <rect x="0" y="0" width="230" height="35" rx="10" fill="#ea580c"/>
    <text x="115" y="22" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">MOTOR KPISERVICE.JS</text>
    <text x="15" y="60" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="600" font-size="11">Cálculo de 12 KPIs:</text>
    <text x="15" y="80" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Cobertura de Ronda (%)</text>
    <text x="15" y="100" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Vigencia Técnica IRAM (%)</text>
    <text x="15" y="120" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Índice de Salud ISPCI (0-100)</text>
    <text x="15" y="140" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• MTTR y Costos de Taller</text>
    <text x="115" y="175" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">Genera Hash SHA-256</text>
  </g>

  <!-- Flecha a Consumo -->
  <path d="M 570 170 L 630 170" stroke="#0891b2" stroke-width="2.5" fill="none"/>
  <polygon points="630,165 640,170 630,175" fill="#0891b2"/>

  <!-- Capa de Consumo Ejecutivo -->
  <g transform="translate(640, 70)">
    <rect width="200" height="200" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <rect x="0" y="0" width="200" height="35" rx="10" fill="#0f172a"/>
    <text x="100" y="22" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">VISTA EJECUTIVA</text>
    <rect x="15" y="50" width="170" height="35" rx="6" fill="#ecfeff"/>
    <text x="100" y="72" fill="#0891b2" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">Web /gerencia (PBI Style)</text>

    <rect x="15" y="95" width="170" height="35" rx="6" fill="#f8fafc"/>
    <text x="100" y="117" fill="#1e293b" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">Power BI Desktop / Service</text>

    <rect x="15" y="140" width="170" height="35" rx="6" fill="#f8fafc"/>
    <text x="100" y="162" fill="#1e293b" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">Exportación Excel .xlsx</text>
  </g>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-12-tablero-gerencia-kpi-bi.svg'), svg12);

// 13. FIGURA 13: Matriz Impacto vs Esfuerzo
const svg13 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 340" width="100%" height="100%">
  <rect width="860" height="340" fill="#f8fafc" rx="12"/>
  <text x="430" y="30" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="800" font-size="14" text-anchor="middle">MATRIZ ESTRATÉGICA: IMPACTO VS. ESFUERZO DE MEJORAS</text>

  <!-- Ejes -->
  <line x1="80" y1="280" x2="800" y2="280" stroke="#94a3b8" stroke-width="2"/>
  <line x1="80" y1="280" x2="80" y2="60" stroke="#94a3b8" stroke-width="2"/>
  <polygon points="795,275 805,280 795,285" fill="#94a3b8"/>
  <polygon points="75,65 80,55 85,65" fill="#94a3b8"/>
  
  <text x="750" y="305" fill="#64748b" font-family="system-ui, sans-serif" font-weight="700" font-size="11">ESFUERZO DE TI ➔</text>
  <text x="40" y="70" fill="#64748b" font-family="system-ui, sans-serif" font-weight="700" font-size="11" transform="rotate(-90 40 70)">IMPACTO OPERATIVO ➔</text>

  <!-- Cuadrante 1: Alto Impacto / Bajo Esfuerzo (Quick Wins) -->
  <rect x="90" y="70" width="340" height="95" rx="8" fill="#dcfce7" fill-opacity="0.5" stroke="#86efac"/>
  <text x="260" y="90" fill="#166534" font-family="system-ui, sans-serif" font-weight="800" font-size="11" text-anchor="middle">ALTO IMPACTO / BAJO ESFUERZO (PRIORIDAD 1)</text>
  <text x="105" y="115" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="700" font-size="10">• Alertas Automáticas Correo / Teams (S)</text>
  <text x="105" y="135" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="700" font-size="10">• Prueba Piloto en Base Central Rosario (S)</text>
  <text x="105" y="155" fill="#16a34a" font-family="system-ui, sans-serif" font-weight="700" font-size="10">• Replicación Offsite con Litestream (S)</text>

  <!-- Cuadrante 2: Alto Impacto / Alto Esfuerzo (Estratégicas) -->
  <rect x="450" y="70" width="340" height="95" rx="8" fill="#eff6ff" fill-opacity="0.5" stroke="#93c5fd"/>
  <text x="620" y="90" fill="#1e40af" font-family="system-ui, sans-serif" font-weight="800" font-size="11" text-anchor="middle">ALTO IMPACTO / ALTO ESFUERZO (PRIORIDAD 2)</text>
  <text x="465" y="115" fill="#2563eb" font-family="system-ui, sans-serif" font-weight="700" font-size="10">• Plano Digital Interactivo de Planta CAD (M)</text>
  <text x="465" y="135" fill="#2563eb" font-family="system-ui, sans-serif" font-weight="700" font-size="10">• Módulo de Firma Digital Ley 25.506 (M)</text>
  <text x="465" y="155" fill="#2563eb" font-family="system-ui, sans-serif" font-weight="700" font-size="10">• Incorporación de Hidrantes y Luces (L)</text>

  <!-- Cuadrante 3: Bajo Impacto / Bajo Esfuerzo -->
  <rect x="90" y="175" width="340" height="95" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="260" y="195" fill="#64748b" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">BAJO IMPACTO / BAJO ESFUERZO</text>
  <text x="105" y="220" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">• Personalización de colores de interfaz</text>
  <text x="105" y="240" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">• Exportaciones secundarias a CSV plano</text>

  <!-- Cuadrante 4: Bajo Impacto / Alto Esfuerzo -->
  <rect x="450" y="175" width="340" height="95" rx="8" fill="#fee2e2" fill-opacity="0.4" stroke="#fca5a5"/>
  <text x="620" y="195" fill="#991b1b" font-family="system-ui, sans-serif" font-weight="700" font-size="11" text-anchor="middle">ALTO ESFUERZO / BAJO VALOR INMEDIATO</text>
  <text x="465" y="220" fill="#dc2626" font-family="system-ui, sans-serif" font-size="10">• App móvil nativa para Play Store / App Store</text>
  <text x="465" y="240" fill="#dc2626" font-family="system-ui, sans-serif" font-size="10">• Inteligencia Artificial predictiva de fallas mecánicas</text>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-13-matriz-impacto-esfuerzo.svg'), svg13);

// 14. FIGURA 14: Hoja de Ruta en 3 Horizontes
const svg14 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 300" width="100%" height="100%">
  <rect width="900" height="300" fill="#f8fafc" rx="12"/>
  <text x="450" y="30" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="800" font-size="14" text-anchor="middle">HOJA DE RUTA DE EVOLUCIÓN TECNOLÓGICA (3 HORIZONTES)</text>

  <!-- Horizonte 1 -->
  <g transform="translate(50, 60)">
    <rect width="250" height="210" rx="10" fill="#ffffff" stroke="#ea580c" stroke-width="2"/>
    <path d="M 0 10 Q 0 0 10 0 L 240 0 Q 250 0 250 10 L 250 40 L 0 40 Z" fill="#ea580c"/>
    <text x="125" y="25" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">HORIZONTE 1: INMEDIATO (1 M)</text>
    <text x="15" y="65" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11">Despliegue y Adopción:</text>
    <text x="15" y="85" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Piloto 130 extintores Base Rosario</text>
    <text x="15" y="105" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Pegado de etiquetas QR laminadas UV</text>
    <text x="15" y="125" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Taller de 20 min para inspectores</text>
    <text x="15" y="145" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Alertas por email ante fallas críticas</text>
    <rect x="15" y="165" width="220" height="30" rx="6" fill="#fff7ed"/>
    <text x="125" y="185" fill="#c2410c" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">Objetivo: 100% Cobertura Digital</text>
  </g>

  <!-- Horizonte 2 -->
  <g transform="translate(325, 60)">
    <rect width="250" height="210" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <path d="M 0 10 Q 0 0 10 0 L 240 0 Q 250 0 250 10 L 250 40 L 0 40 Z" fill="#0f172a"/>
    <text x="125" y="25" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">HORIZONTE 2: CORTO (3 M)</text>
    <text x="15" y="65" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11">Capacidades Avanzadas:</text>
    <text x="15" y="85" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Planos interactivos de planta (SVG)</text>
    <text x="15" y="105" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Firma digital tokenizada (Ley 25.506)</text>
    <text x="15" y="125" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Replicación continua Azure (Litestream)</text>
    <text x="15" y="145" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Notificaciones Web Push en PWA</text>
    <rect x="15" y="165" width="220" height="30" rx="6" fill="#ecfeff"/>
    <text x="125" y="185" fill="#0891b2" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">Objetivo: Plena Eficacia Pericial</text>
  </g>

  <!-- Horizonte 3 -->
  <g transform="translate(600, 60)">
    <rect width="250" height="210" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <path d="M 0 10 Q 0 0 10 0 L 240 0 Q 250 0 250 10 L 250 40 L 0 40 Z" fill="#334155"/>
    <text x="125" y="25" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">HORIZONTE 3: MADUREZ (6-12 M)</text>
    <text x="15" y="65" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="11">Expansión Patrimonial:</text>
    <text x="15" y="85" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Módulo de Hidrantes y Nichos</text>
    <text x="15" y="105" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Luces de emergencia y detectores</text>
    <text x="15" y="125" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Enlace con inventario y compras SAP</text>
    <text x="15" y="145" fill="#334155" font-family="system-ui, sans-serif" font-size="10">• Asistente de cálculo de carga de fuego</text>
    <rect x="15" y="165" width="220" height="30" rx="6" fill="#f1f5f9"/>
    <text x="125" y="185" fill="#1e293b" font-family="system-ui, sans-serif" font-weight="700" font-size="10" text-anchor="middle">Objetivo: Gestión Integral Activos</text>
  </g>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'figura-14-hoja-ruta-3-horizontes.svg'), svg14);

console.log('Las 14 figuras SVG se generaron con éxito en:', outputDir);
