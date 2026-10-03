#!/usr/bin/env node
/**
 * Script de validación de calidad y enlaces de documentación técnica (Docs-as-Code)
 * Uso: node scripts/docs-check.js
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.resolve(__dirname, '../docs');
const REPO_ROOT = path.resolve(__dirname, '..');

let errors = [];
let checkedDocs = 0;
let checkedLinks = 0;
let checkedMermaid = 0;

function getAllMarkdownFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(fullPath));
    } else if (file.endsWith('.md')) {
      results.push(fullPath);
    }
  });
  return results;
}

console.log('🔍 Iniciando verificación de documentación Docs-as-Code en docs/...\n');

const files = getAllMarkdownFiles(DOCS_DIR);

files.forEach(filePath => {
  checkedDocs++;
  const relPath = path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');

  // 1. Verificar encabezado "Para quién" y sección final "Archivos del código relacionados"
  // Solo se exige en los documentos organizados dentro de subcarpetas temáticas (00-vision a 07-desarrollo)
  const isSubfolderDoc = path.dirname(filePath) !== DOCS_DIR && 
                         !filePath.includes('DECISIONES') && 
                         !filePath.includes('CHANGELOG') &&
                         !filePath.includes('99-referencias');

  if (isSubfolderDoc) {
    if (!content.includes('Para quién')) {
      errors.push(`[ESTRUCTURA] ${relPath} no contiene el encabezado obligatorio 'Para quién' o 'Para quién es'`);
    }
    if (!content.includes('Archivos del código relacionados')) {
      errors.push(`[ESTRUCTURA] ${relPath} no contiene la sección final 'Archivos del código relacionados'`);
    }
  }

  // 2. Verificar enlaces locales [texto](ruta) y file:///rutas
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    let linkTarget = match[2].trim();
    if (linkTarget.startsWith('#') || linkTarget.startsWith('http://') || linkTarget.startsWith('https://')) {
      continue; // Enlaces externos o anclas internas
    }

    checkedLinks++;

    // Resolver ruta de archivo
    let targetPath;
    if (linkTarget.startsWith('file:///')) {
      let clean = linkTarget.replace('file:///', '');
      targetPath = path.resolve(clean);
    } else {
      targetPath = path.resolve(path.dirname(filePath), linkTarget.split('#')[0]);
    }

    if (!fs.existsSync(targetPath)) {
      errors.push(`[ENLACE ROTO] En ${relPath}: el archivo referenciado "${linkTarget}" no existe en disco.`);
    }
  }

  // 3. Verificar bloques de diagramas Mermaid
  const mermaidRegex = /```mermaid([\s\S]*?)```/g;
  while ((match = mermaidRegex.exec(content)) !== null) {
    checkedMermaid++;
    const diagramCode = match[1].trim();
    const validStarts = ['flowchart', 'sequenceDiagram', 'classDiagram', 'erDiagram', 'stateDiagram', 'stateDiagram-v2', 'journey', 'graph'];
    const hasValidStart = validStarts.some(type => diagramCode.startsWith(type));
    if (!hasValidStart) {
      errors.push(`[MERMAID] En ${relPath}: diagrama Mermaid no inicia con una sintaxis reconocida (${diagramCode.slice(0, 20)}...)`);
    }
  }
});

console.log(`📑 Documentos analizados: ${checkedDocs}`);
console.log(`🔗 Enlaces a archivos comprobados: ${checkedLinks}`);
console.log(`📊 Diagramas Mermaid validados: ${checkedMermaid}\n`);

if (errors.length > 0) {
  console.error(`❌ Se encontraron ${errors.length} problemas en la documentación:\n`);
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('✅ ¡Todos los documentos, enlaces internos y diagramas Mermaid son 100% válidos y consistentes!');
  process.exit(0);
}
