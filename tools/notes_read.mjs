// Reads a file of review notes exported from the game (F1 panel of the admin account):
//   node tools/notes_read.mjs <english-quest-gop-y-….json> [folder for the pictures]
// Prints every note with its place, grouped by kind, and writes the pictures as note-<id>.jpg so they can be looked at.
import fs from 'node:fs'; import path from 'node:path';
import { parse, exportText, whereLine, kindVi, levelVi } from '../src/core/notes.js';

const [file, out] = process.argv.slice(2);
if (!file) { console.error('usage: node tools/notes_read.mjs <file.json> [picture folder]'); process.exit(2); }
const data = parse(fs.readFileSync(file, 'utf8'));
if (!data) { console.error('not a notes file exported by the game: ' + file); process.exit(1); }
console.log(`${data.notes.length} notes · made ${data.made || '?'} · build ${data.game.build || '?'} · quality ${data.game.quality || '?'} · screen ${data.game.screen || '?'} · ${data.game.gpu || ''}`);
console.log(exportText(data.notes, new Date(data.made || Date.now())));
const done = data.notes.filter((n) => n.done); if (done.length) console.log(`\n(${done.length} notes are marked done: ${done.map((n) => '#' + n.id).join(' ')})`);
if (out) {
  fs.mkdirSync(out, { recursive: true }); let k = 0;
  for (const n of data.notes) if (n.shot) { const m = /^data:image\/(\w+);base64,(.+)$/.exec(n.shot); fs.writeFileSync(path.join(out, `note-${n.id}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`), Buffer.from(m[2], 'base64')); k++; }
  console.log(`\n${k} pictures written to ${out}`);
  for (const n of data.notes) if (n.shot) console.log(`  note-${n.id}: [${kindVi(n.kind)} · ${levelVi(n.level)}] ${n.text.slice(0, 80)} — ${whereLine(n.where).slice(0, 100)}`);
}
