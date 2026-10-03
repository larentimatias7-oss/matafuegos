#!/usr/bin/env node
/**
 * Script de generación y sincronización automática de documentación desde el código
 * Uso: node scripts/docs-generate.js
 */

const fs = require('fs');
const path = require('path');
const { PERMISOS, ROLE_PERMISSIONS, ROLES } = require('../server/config/permissions');

console.log('⚙️ Iniciando generación automática de documentación técnica (docs:generate)...\n');

// 1. Generar matriz de permisos en Markdown
let rbacMarkdown = `| Permiso Técnico | Descripción | ${Object.values(ROLES).join(' | ')} |\n`;
rbacMarkdown += `|---|---|${Object.values(ROLES).map(() => ':---:').join('|')}|\n`;

Object.entries(PERMISOS).forEach(([key, perm]) => {
  const row = [
    `\`${perm}\``,
    key.replace(/_/g, ' ').toLowerCase(),
    ...Object.values(ROLES).map(role => ROLE_PERMISSIONS[role].includes(perm) ? '✅' : '❌')
  ];
  rbacMarkdown += `| ${row.join(' | ')} |\n`;
});

// Guardar snippet generado
const generatedDir = path.resolve(__dirname, '../docs/99-referencias/GENERADOS');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

fs.writeFileSync(path.join(generatedDir, 'matriz-permisos-auto.md'), rbacMarkdown);
console.log('✅ Matriz RBAC generada desde server/config/permissions.js');

// 2. Extraer variables de entorno desde .env.example
const envContent = fs.readFileSync(path.resolve(__dirname, '../.env.example'), 'utf8');
const envLines = envContent.split('\n');
const envVars = [];
let currentComment = '';

envLines.forEach(line => {
  line = line.trim();
  if (line.startsWith('#')) {
    currentComment = line.replace(/^#\s*/, '');
  } else if (line.includes('=')) {
    const [name, val] = line.split('=');
    envVars.push({ name: name.trim(), defaultVal: val ? val.trim() : 'vacío', desc: currentComment });
    currentComment = '';
  }
});

let envMarkdown = '| Variable | Valor Ejemplo / Default | Descripción |\n|---|---|---|\n';
envVars.forEach(v => {
  envMarkdown += `| \`${v.name}\` | \`${v.defaultVal}\` | ${v.desc} |\n`;
});

fs.writeFileSync(path.join(generatedDir, 'variables-entorno-auto.md'), envMarkdown);
console.log('✅ Tabla de variables de entorno generada desde .env.example');

console.log('\n🎉 ¡Generación automática completada con éxito en docs/99-referencias/GENERADOS/!');
