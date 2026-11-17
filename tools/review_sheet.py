"""Builds docs/DOI_CHIEU_NOI_DUNG.html: a tick sheet for a teacher or parent to check every unit's words and grammar
against the Global Success book (N1). Run again after the data changes: python3 tools/review_sheet.py
The page lists each unit's words and grammar lines with two tick boxes and a note field. At the bottom it shows a
short line (e.g. "g6_u01:TV,NP; g8_u01:TV") for the person to copy back; the codes then go into the data files
(vocabulary_checked / grammar_checked)."""
import json, html, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
units = []
for g in (6, 8, 7, 9):            # the two children's grades first
    for u in range(1, 13):
        d = json.loads((ROOT / f'data/learning/g{g}_u{u:02d}.json').read_text())
        units.append(d)
def esc(s): return html.escape(str(s))
rows = []
for d in units:
    uid = d['id']; vc, gc = d.get('vocabulary_checked'), d.get('grammar_checked')
    words = ' · '.join(f"<b>{esc(w['word'])}</b> {esc(w['vi'])}" for w in d.get('vocabulary', []))
    gram = ''.join(f'<li>{esc(x)}</li>' for x in d.get('grammar', [])) or '<li class="mute">(chưa có ngữ pháp trong dữ liệu)</li>'
    state = ('<span class="ok">từ vựng đã đối chiếu</span>' if vc else '<span class="no">từ vựng chưa đối chiếu</span>') + ' ' + \
            ('<span class="ok">ngữ pháp đã đối chiếu</span>' if gc else '<span class="no">ngữ pháp chưa đối chiếu</span>')
    rows.append(f'''<details class="unit" data-id="{uid}" {'open' if d['grade'] in (6, 8) and d['unit'] == 1 else ''}>
<summary><span class="id">{uid}</span> Lớp {d['grade']} · Unit {d['unit']}: <b>{esc(d['title'])}</b> <small>{len(d.get('vocabulary', []))} từ</small> {state}</summary>
<p class="words">{words or '<span class="mute">(chưa có từ)</span>'}</p>
<p class="lbl">Ngữ pháp game đang dùng:</p><ul>{gram}</ul>
<div class="ticks"><label><input type="checkbox" data-k="TV" {'checked' if vc else ''}> Từ vựng khớp sách</label>
<label><input type="checkbox" data-k="NP" {'checked' if gc else ''}> Ngữ pháp khớp sách</label>
<input class="note" placeholder="Ghi chú: từ thiếu / sai nghĩa / ngữ pháp đúng là…"></div>
</details>''')
page = f'''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Đối chiếu nội dung</title>
<style>
:root{{--bg:#fbf6ea;--card:#fff;--ink:#3a2a18;--mute:#8a7a62;--line:#e4d6b8;--ok:#2f7d3a;--no:#b5452e;--acc:#c98a1c}}
@media (prefers-color-scheme:dark){{:root:not([data-theme=light]){{--bg:#1e1a14;--card:#2a241b;--ink:#efe4cf;--mute:#a8987c;--line:#4a3f2e;--ok:#7fcf88;--no:#f08a72;--acc:#f0b84a}}}}
body{{background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,sans-serif;margin:0;padding:16px}} main{{max-width:960px;margin:auto}}
h1{{font-size:22px;margin:.2em 0}} .mute{{color:var(--mute)}} .unit{{background:var(--card);border:1px solid var(--line);border-radius:10px;margin:8px 0;padding:8px 12px}}
summary{{cursor:pointer}} .id{{font-family:monospace;color:var(--acc);margin-right:6px}} small{{color:var(--mute)}}
.ok,.no{{font-size:12px;border-radius:6px;padding:1px 6px;margin-left:4px;border:1px solid}} .ok{{color:var(--ok)}} .no{{color:var(--no)}}
.words{{font-size:14px}} .lbl{{margin:.4em 0 0;font-weight:600}} ul{{margin:.2em 0 .5em}}
.ticks{{display:flex;flex-wrap:wrap;gap:12px;align-items:center}} .note{{flex:1;min-width:220px;padding:5px 8px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink)}}
textarea{{width:100%;min-height:90px;box-sizing:border-box;font:13px monospace;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink)}}
.bar{{position:sticky;top:0;background:var(--bg);padding:6px 0;z-index:2}} button{{font:inherit;padding:4px 10px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}}
</style></head><body><main>
<h1>Đối chiếu từ vựng và ngữ pháp với sách Global Success</h1>
<p>Mỗi Unit: đọc danh sách từ và dòng ngữ pháp game đang dùng, so với sách, tick ô nếu khớp và ghi chú chỗ sai. Lớp 6 và 8 xếp trước. Mục cuối trang tạo một dòng mã, anh chép gửi lại để em cập nhật dữ liệu.</p>
<p class="mute">Game chỉ lấy danh sách từ, nghĩa và tên điểm ngữ pháp; thư, lời thoại, câu hỏi đều tự viết. Lưu ý riêng: Unit 1 lớp 6 đang ghi “hiện tại đơn + hiện tại tiếp diễn”; nếu sách là “hiện tại đơn + trạng từ tần suất” thì ghi vào ô ghi chú.</p>
<div class="bar"><button id="all">Mở tất cả</button> <button id="none">Thu gọn</button> <span id="count" class="mute"></span></div>
{''.join(rows)}
<h2>Kết quả để gửi lại</h2><textarea id="out" readonly></textarea>
</main><script>
const out=document.getElementById('out'), cnt=document.getElementById('count');
function sync(){{const parts=[];let n=0;for(const u of document.querySelectorAll('.unit')){{const k=[...u.querySelectorAll('input[type=checkbox]:checked')].map(i=>i.dataset.k);const note=u.querySelector('.note').value.trim();if(k.length)n++;if(k.length||note)parts.push(u.dataset.id+':'+(k.join(',')||'-')+(note?' ('+note+')':''));}}
out.value=parts.length?'Đối chiếu: '+parts.join('; '):'Chưa tick mục nào.';cnt.textContent=n+'/{len(units)} Unit đã tick';
try{{localStorage.setItem('eq-review-sheet',JSON.stringify([...document.querySelectorAll('.unit')].map(u=>[u.dataset.id,[...u.querySelectorAll('input[type=checkbox]')].map(i=>i.checked),u.querySelector('.note').value])))}}catch(e){{}}}}
try{{const saved=JSON.parse(localStorage.getItem('eq-review-sheet')||'[]');for(const [id,ticks,note] of saved){{const u=document.querySelector('.unit[data-id="'+id+'"]');if(!u)continue;u.querySelectorAll('input[type=checkbox]').forEach((i,k)=>i.checked=ticks[k]);u.querySelector('.note').value=note;}}}}catch(e){{}}
document.addEventListener('input',sync);document.addEventListener('change',sync);
document.getElementById('all').onclick=()=>document.querySelectorAll('.unit').forEach(u=>u.open=true);document.getElementById('none').onclick=()=>document.querySelectorAll('.unit').forEach(u=>u.open=false);
sync();
</script></body></html>'''
(ROOT / 'docs/DOI_CHIEU_NOI_DUNG.html').write_text(page)
print('wrote docs/DOI_CHIEU_NOI_DUNG.html with', len(units), 'units')
