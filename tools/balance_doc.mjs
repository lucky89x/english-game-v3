// Regenerates the monster and boss tables of docs/CAP_DO_QUAI_TRANG_BI.md from the code (25/11).
//   node tools/balance_doc.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { MONSTERS, BOSSES, LAND_BOSSES } from '../src/core/rules.js';
import { ZONES } from '../src/core/zones.js';
import * as P from '../src/core/progress.js';
const file = new URL('../docs/CAP_DO_QUAI_TRANG_BI.md', import.meta.url);
let doc = readFileSync(file, 'utf8');
const rows = [];
for (const [region, list] of Object.entries(ZONES)) for (const z of list) { const m = MONSTERS[z.kind]; rows.push(`| ${region} | ${z.vi} | ${m.name} | ${m.level} | ${m.role} | ${m.hp} | ${m.atk} | ${m.exp} | ${m.gold} | ${z.n} |`); }
const mobs = `## Bãi quái (mỗi loại một bãi)
Công thức (\`progress.js\`): máu = công của bé trong đồ cùng cấp × \`hitsToKill\` (3 + 0,25·cấp, tối đa 10); công = máu bé / \`MOB_BITES\` (${P.MOB_BITES}); EXP = EXP cấp / \`killsPerLevel\` (15 + 0,35·cấp); đánh tay không = ${P.UNARMED * 100}% công cơ bản (\`UNARMED\`).
| Map | Bãi | Quái | Cấp | Loại | Máu | Công | EXP | Vàng | Số con |
|---|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}

`;
const bosses = `## Trùm
| Trùm | Map | Thức dậy ở cấp | Máu | Công | EXP lần đầu |
|---|---|---|---|---|---|
${[...BOSSES, ...Object.values(LAND_BOSSES)].sort((a, b) => a.level - b.level).map((b) => `| ${b.name} | ${b.region || 'village'} | ${b.level} | ${b.hp} | ${b.atk} | ${b.exp} |`).join('\n')}

`;
const cut = (head, body) => { const a = doc.indexOf(head), b = doc.indexOf('\n## ', a + 3); if (a < 0) throw new Error('missing ' + head); doc = doc.slice(0, a) + body + (b < 0 ? '' : doc.slice(b + 1)); };
cut('## Bãi quái', mobs); cut('## Trùm', bosses);
doc = doc.replace(/^# Cấp độ, bãi quái, trang bị \([^)]*\)/m, `# Cấp độ, bãi quái, trang bị (${new Date().toISOString().slice(8, 10)}/${new Date().toISOString().slice(5, 7)})`);
writeFileSync(file, doc); console.log('written', rows.length, 'monsters,', BOSSES.length + Object.keys(LAND_BOSSES).length, 'bosses');
