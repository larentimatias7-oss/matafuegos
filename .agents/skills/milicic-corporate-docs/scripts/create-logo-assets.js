const fs = require('fs');
const path = require('path');

const pngPath = path.resolve(__dirname, '../resources/assets/logo-milicic.png');
const svgPath = path.resolve(__dirname, '../resources/assets/logo-milicic.svg');
const jsAssetPath = path.resolve(__dirname, '../resources/assets/logo-milicic-base64.js');

if (!fs.existsSync(pngPath)) {
  console.error('No se encontro el archivo PNG en:', pngPath);
  process.exit(1);
}

const b64 = fs.readFileSync(pngPath).toString('base64');
const dataUri = `data:image/png;base64,${b64}`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 740 270" width="740" height="270">
  <!-- Milicic S.A. Corporate Logo Asset -->
  <image href="${dataUri}" width="740" height="270" preserveAspectRatio="xMidYMid meet" />
</svg>
`;

fs.writeFileSync(svgPath, svg, 'utf8');

const jsContent = `/**
 * Milicic S.A. Logo Assets
 * Embebible directamente en Node.js, Python o plantillas HTML sin dependencias externas.
 */
module.exports = {
  LOGO_BASE64: '${b64}',
  LOGO_DATA_URI: '${dataUri}',
  LOGO_SVG: \`${svg.replace(/`/g, '\\`')}\`
};
`;

fs.writeFileSync(jsAssetPath, jsContent, 'utf8');
console.log('✅ Activos de marca Milicic (SVG y Base64 JS) generados exitosamente.');
