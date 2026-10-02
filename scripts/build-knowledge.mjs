// Compila knowledge/*.md en api/_lib/knowledge.generated.js (string único para el prompt del bot).
// Uso: npm run build:knowledge  (volver a correr cada vez que cambie el sitio o la base de conocimiento)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'knowledge');
const files = readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_')).sort();
const text = files.map((f) => readFileSync(join(dir, f), 'utf8').trim()).join('\n\n---\n\n');
const out = `// ARCHIVO GENERADO — no editar. Fuente: /knowledge/*.md\nexport const KNOWLEDGE = ${JSON.stringify(text)};\n`;
writeFileSync(join(root, 'api/_lib/knowledge.generated.js'), out);
console.log(`knowledge: ${files.length} archivos, ${text.length} caracteres`);
