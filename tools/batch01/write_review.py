"""Publish evidence and art failures without changing source manifest or gameplay."""
from pathlib import Path
import csv, hashlib, html, json

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/batch01'
REF = '../../assets/EnglishQuestV3_Asset_Spec_Codex_2026-11-03/EnglishQuestV3_Asset_Spec_Codex_2026-11-03/04_REFERENCES/'

items = [
    dict(id='chr_ngoc_adventurer', title='Ngọc', status='BLOCKED_MISSING_ASSET', ref='REF_01_FEMALE_HERO.png',
         technical='Adventurer Quaternius: 62 xương, Idle/Walk/Run có thay đổi bone pose thực. Có 24 clip nguồn.',
         failure='Không phải Ngọc trong concept: tỷ lệ người lớn, tóc/áo/phụ kiện khác; 9 material, không texture, thiếu atlas 2K. Jump/Fall/Land/Talk còn thiếu theo manifest. Chưa có model chibi custom.',
         files=['chr_quaternius_adventurer_baseline_v01.glb']),
    dict(id='npc_tom_elder', title='Trưởng làng Tom', status='BLOCKED_MISSING_ASSET', ref='REF_02_ELDER_NPCS.png',
         technical='Wizard Quaternius: 32 xương, Idle/Walk có chuyển động xương; texture 512/1024 nhúng trong GLB.',
         failure='Không đạt tạo hình Tom, râu/mặt/thân người quá góc cạnh, màu tối; Talk và Wave MISSING. Không đổi tên animation chiến đấu để giả lập clip yêu cầu.',
         files=['npc_quaternius_wizard_baseline_v01.glb']),
    dict(id='bld_mayor_hall', title='Nhà trưởng làng và nội thất', status='BLOCKED_MISSING_ASSET', ref='REF_04_VILLAGE_SCENE.png',
         technical='Xuất riêng mesh/material/texture của nhà kitbash và nội thất hiện có; E trong gallery chuyển sang xem nội thất. Ba portal của game chính vẫn vượt kiểm thử vào/ra.',
         failure='Baseline mái nâu + tháp chưa phải nhà concept mái xanh. Bounds 18,29 × 16,95 × 9,31 m (X/Y/Z); chưa đúng chuẩn 18 × 14 × 13 m (rộng/sâu/cao). GLB nhà có cửa đóng; preview E không chứng minh cửa đi xuyên được. Chưa có nội thất hai phòng/cầu thang mới.',
         files=['bld_quaternius_hall_baseline_v01.glb','bld_hall_interior_baseline_v01.glb']),
    dict(id='brg_wood_arch', title='Cầu gỗ cong', status='BLOCKOUT', ref='REF_04_VILLAGE_SCENE.png',
         technical='GLB 9,1 m dài, 3,17 m rộng tổng thể, khoảng 2,7 m lối đi; có lan can. CharacterBody qua cầu hai chiều và đi theo cao độ deck trong kiểm thử physics.',
         failure='Chỉ 340 tam giác từ kitbash cũ: ván mỏng, đoạn dốc đơn giản, thiếu kết cấu cong dưới cầu, bo cạnh và vân gỗ có chủ đích. Không được xem là asset mỹ thuật hoàn chỉnh. Collision được Godot tạo từ mesh, không nhúng sẵn trong chuẩn GLB.',
         files=['brg_quaternius_arch_baseline_v01.glb']),
    dict(id='terrain_water_pilot', title='Địa hình và nước', status='ART_IN_PROGRESS', ref='REF_04_VILLAGE_SCENE.png',
         technical='Mẫu kỹ thuật mới 32 × 32 m: mesh rãnh sông/bờ/đồi nhẹ, vertex mask hòa trộn cỏ sáng/tối, đất, sỏi, bờ ướt; mesh nước GLB + shader nước hiện có của Godot.',
         failure='Chỉ texture detail 256 px và màu pha; chưa có năm bộ texture PBR hoặc sculpt/paint thủ công. Bờ sông quá đều, nước có vệt lặp. Chưa đạt độ tự nhiên của concept, chưa có foam tương tác quanh từng đá. Shader chuyển động không được lưu như animation trong GLB.',
         files=['trn_mask_sample_v01.glb','wat_river_sample_v01.glb']),
]

for item in items:
    item.update(art_approved=False, integrated_into_main=False)
(OUT/'pilot_acceptance.json').write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf-8')

before = json.loads((OUT/'gameplay_before.json').read_text())
changed = [name for name,digest in before.items() if not (ROOT/name).exists() or hashlib.sha256((ROOT/name).read_bytes()).hexdigest()!=digest]
integrity = dict(checked=len(before),changed=changed)
(OUT/'gameplay_integrity.json').write_text(json.dumps(integrity,indent=2),encoding='utf-8')
assert not changed, changed

audit_path = OUT/'manifest_audit.csv'
rows = list(csv.DictReader(audit_path.open(encoding='utf-8-sig')))
statuses = {item['id']:item['status'] for item in items}
for row in rows:
    row['pilot_status'] = statuses.get(row['id'],'ART_IN_PROGRESS' if row['id'] in ['trn_ground_grass_mix','trn_ground_dirt_path','trn_ground_shore','wat_river_straight'] else 'OUT_OF_BATCH_01')
with audit_path.open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)

structures=json.loads((OUT/'glb_structure.json').read_text())
table='\n'.join(f"| `{s['file']}` | {s['triangles_instanced']:,} | {s['materials']} | {len(s['textures'])} | {s['bytes']/1000000:.2f} MB |" for s in structures)
perf=(OUT/'render_report.txt').read_text(encoding='utf-8').strip() if (OUT/'render_report.txt').exists() else 'Chưa có kết quả MainWorld hoàn tất.'
sections='\n\n'.join(f"### {x['title']} — {x['status']}\n\n{x['technical']}\n\n**Chưa đạt:** {x['failure']}\n\nFile: "+', '.join(f'`assets/pilot_batch01/{n}`' for n in x['files']) for x in items)
report=f'''# EnglishQuestV3 — Kết quả lô thử 01, 2026-11-03

**Kết luận: 0/5 hạng mục đạt chuẩn mỹ thuật để tích hợp.** Đã hoàn tất audit, đóng gói GLB đối chứng, mẫu terrain kỹ thuật và kiểm thử riêng. Chưa sản xuất được bộ model Ngọc/Tom/nhà/cầu đạt concept. Không thay thế asset đang chạy trong MainWorld, không sản xuất hàng loạt. Việc giữ nguyên F5 là có chủ đích trong lô kiểm định này.

## Tài liệu và công cụ

- Đã đọc hai skill `.agents/skills/my-game-skill/SKILL.md` và `skill2.md`; áp dụng tách collider/visual, kiểm tra camera/physics và đo render thực. Không tìm thấy AGENTS.md trong project và các thư mục cha đã kiểm tra.
- Đã đọc toàn bộ chín tài liệu Markdown trong bộ hồ sơ, đối chiếu đủ **105 mục CSV/JSON** và xem cả năm PNG tham chiếu. Các PNG chỉ là ảnh chuẩn mỹ thuật, không được dùng thay model.
- Lưu ý hồ sơ: `REF_03_ENVIRONMENT.png` thực tế là sheet nhân vật; ảnh nhà/cầu/cảnh quan nằm ở `REF_04_VILLAGE_SCENE.png`. Giữ nguyên tài liệu gốc, sửa mapping chỉ trong trang review.
- Có **390 glTF, 553 FBX, 103 .blend nguồn**, cùng 7 GLB vừa xuất trong lô này. `model_files.json` liệt kê đường dẫn/kích thước mọi file; FBX mới kiểm kê định dạng và file, chưa import/kiểm rig toàn bộ. Audit sâu 390 glTF không phát hiện đường dẫn buffer/image ngoài bị thiếu. Chi tiết ở `asset_inventory.json`, `blend_sources.json`, `manifest_audit.csv`.
- Chưa tìm thấy Blender trong PATH, registry ứng dụng, các thư mục cài phổ biến/Downloads; không có công cụ tạo 3D chuyên dụng trong phiên. **Chưa mở/kiểm tra .blend bằng Blender, không tạo .blend custom mới.** GLB xuất bằng GLTFDocument của Godot và đóng gói glTF2 binary trực tiếp.
- Nguồn tái sử dụng: Quaternius Ultimate Modular Women / Adventurer; RPG Characters / Wizard; Medieval Village MegaKit [Standard] cho nhà, sàn và hàng rào; Fantasy Props MegaKit (`assets/Exports/glTF/`) cho bàn, ghế, giường, sách và tủ; Stylized Nature MegaKit cho cây chậu trong nội thất. License kèm các bộ nguồn ghi CC0. Header License.txt của bộ Women ghi “Males”; chưa có xác minh nguồn bên ngoài.

## Năm hạng mục

{sections}

## GLB đã bàn giao

Tất cả là binary glTF2 thật, có mesh và material; sáu file có ảnh texture nhúng. **Adventurer không có texture trong nguồn** nên chưa đạt yêu cầu mesh/material/texture đầy đủ. Nhân vật giữ skin, inverse bind và animation gốc; không bịa hoạt ảnh mới. Các file mang tên baseline/sample để không lẫn với asset đích `assets/original_3d/...` chưa tồn tại.

| File | Tam giác theo instance | Material | Image reference | Dung lượng |
|---|---:|---:|---:|---:|
{table}

Số image reference có thể trỏ tới cùng dữ liệu ảnh; đã loại byte buffer trùng, giảm nhà từ 144 MB xuống 50,49 MB, nội thất 125,14 xuống 48,44 MB. Vẫn quá nặng cho sản xuất; cần atlas, giảm material và tối ưu lại. Character được scale trong gallery về 1,50/1,55 m, **GLB gốc vẫn chưa bake đúng kích thước/pivot/hướng đích** (Adventurer cao 1,83 m, Wizard 3,12 m ở bind pose).

## Kiểm thử và giới hạn

- GLB magic/version/length, buffer và texture nhúng: PASS; nhập lại bằng Godot: PASS.
- Skeleton3D và thay đổi pose xương: Adventurer Idle/Walk/Run/Interact PASS; Wizard Idle/Walk PASS. Talk/Wave của Tom MISSING, không được tính là đạt nghiệm thu.
- Cầu GLB với collision dựng trong scene: qua hai chiều PASS; kiểm tra cao độ chứng minh actor đi trên deck. Chưa đo va chạm mọi góc lan can.
- Bộ test game hiện có `smoke_test.gd`, `skills_upgrade_test.gd`, `village_life_test.gd`: PASS. Bao gồm WASD/Run/Idle, camera, HUD, rương E, hội thoại E, ba cửa vào/ra nội thất và NPC di chuyển. Đây là hồi quy gameplay cũ, không chứng minh nhà GLB mới có cửa thông thủy.
- Chụp 4 góc × 5 hạng mục, một chân dung gần và hai góc nội thất: xem `review.html`. Đối chiếu thị giác cho thấy chưa đạt concept; tất cả `art_approved=false`.
- Kiểm tra SHA256: **{len(before)} file gameplay/config/test cũ không đổi**. Backup ở `backups/before_asset_batch01_20261103/`. Không sửa dự án JavaScript gốc.
- Headless có cảnh báo root certificate store của môi trường sandbox; không thấy lỗi parse GDScript hay resource thiếu trong các lần kiểm thử kết thúc. Headless chỉ dùng cho logic, không làm căn cứ FPS.

## Hiệu năng hiển thị thật

Godot 4.7.2, Forward+ / D3D12, Radeon RX 6600 LE, VSync tắt. MainWorld đo 15 giây mỗi độ phân giải sau warmup, có hai giây chạy nhân vật và camera xoay liên tục. Kết quả cục bộ máy này, không phải bảo đảm cho máy khác:

```text
{perf}
```

Gallery terrain/cầu là scene rất nhỏ; số FPS ở `pilot_performance.txt` không đại diện cả game. Không dùng số đó để kết luận chất lượng hoặc hiệu năng của 105 asset chưa được sản xuất. Không có phép đo trước/sau tối ưu MainWorld vì MainWorld không được sửa trong lô này.

## File mới / thay đổi

- `assets/pilot_batch01/`: 7 GLB, `detail.png`, `terrain_mask_blend.gdshader` (và metadata import tự sinh).
- `tests/batch01/`: gallery GDScript, terrain generator, validator/capture/benchmark và ba scene `test_asset_gallery.tscn`, `test_characters.tscn`, `test_interiors.tscn`.
- `tools/batch01/`: audit/packer, exporter, binary validator/deduplicator, trình tạo report.
- `art_source/batch01/BLENDER_HANDOFF.md`: việc mỹ thuật/rig/UV/animation còn thiếu; `.gdignore` giữ nguồn ngoài luồng import game.
- `artifacts/batch01/`: report, bảng kiểm 105 mục, cấu trúc GLB, trạng thái nghiệm thu, log, benchmark và PNG runtime.
- `backups/before_asset_batch01_20261103/`: bản sao gameplay trước thay đổi. Không sửa `project.godot`, MainWorld, camera, HUD hoặc gameplay đang dùng.

## Mở kiểm tra

1. Mở `project.godot` của EnglishQuestV3. **F5** chạy MainWorld hiện tại; lô này chưa tích hợp model chưa đạt.
2. Mở `tests/batch01/test_asset_gallery.tscn`, nhấn **F6** để xem riêng. Tab đổi hạng mục, giữ chuột phải kéo xoay, con lăn zoom, O quay tự động.
3. Phím 1/2/3 chọn Idle/Walk/Run; 4/5 thử Talk/Wave. Clip không có sẽ báo MISSING, không âm thầm dùng clip khác.
4. Ở nhà, E xem nội thất đối chứng; E lần nữa quay về ngoài. Đây là trình xem, chưa phải test đi xuyên cửa của model mới.
5. Mở `artifacts/batch01/review.html` trong trình duyệt để đối chiếu concept với bốn góc runtime. Danh sách việc Blender cụ thể ở `art_source/batch01/BLENDER_HANDOFF.md`.

**Dừng tại lô 01.** Phần còn thiếu là sản xuất mỹ thuật custom và animation thiếu, không chỉ chỉnh vài thiết lập Godot. Chưa có cơ sở báo hoàn thành hoặc nhân rộng 105 asset.
'''
(OUT/'REPORT.md').write_text(report,encoding='utf-8')

cards=[]
for i,x in enumerate(items):
    views=''.join(f'<figure><a href="asset_{i}_angle_{a}.png"><img loading="lazy" src="asset_{i}_angle_{a}.png" alt="Runtime {html.escape(x["title"])} góc {a}"></a><figcaption>Runtime {a}°</figcaption></figure>' for a in [0,90,180,270])
    cards.append(f'<section><h2>{html.escape(x["title"])}</h2><p class="badge">{x["status"]} · CHƯA DUYỆT</p><p>{html.escape(x["technical"])}</p><p><strong>Chưa đạt:</strong> {html.escape(x["failure"])}</p><div class="compare"><figure><a href="{REF+x["ref"]}"><img loading="lazy" src="{REF+x["ref"]}" alt="Ảnh chuẩn mỹ thuật"><figcaption>Concept gốc — {x["ref"]}</figcaption></a></figure><div class="views">{views}</div></div></section>')
page='''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EnglishQuestV3 — Review lô 01</title><style>body{margin:0;background:#101b23;color:#e5eaf0;font:17px/1.6 system-ui}main{max-width:1550px;margin:auto;padding:30px}h1,h2{line-height:1.25}section{border-top:1px solid #52616c;padding:28px 0}.badge{color:#ffd791;font-weight:700}.compare{display:grid;grid-template-columns:1fr 2fr;gap:20px}.views{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{width:100%;height:auto;display:block}figcaption{font-size:14px;color:#b4c3d0}a{color:#a4d9ff}strong{color:#ffd791}pre{overflow:auto;padding:18px;background:#1b2c38}@media(max-width:850px){.compare,.views{grid-template-columns:1fr}}</style><main><h1>EnglishQuestV3 · Lô 01</h1><p class="badge">0/5 ĐẠT MỸ THUẬT · CHƯA TÍCH HỢP MAINWORLD</p><p>GLB thật và ảnh Godot thật; các mẫu Quaternius bên dưới chỉ làm đối chứng kỹ thuật. Chưa có model Ngọc/Tom/nhà/cầu được sản xuất đạt concept. Không có .blend custom mới.</p><p><a href="REPORT.md">Báo cáo đầy đủ</a> · <a href="../../art_source/batch01/BLENDER_HANDOFF.md">Phần cần dựng trong Blender</a> · <a href="pilot_acceptance.json">Trạng thái từng hạng mục</a></p><p>REF_03_ENVIRONMENT.png trong hồ sơ là sheet nhân vật; review dùng REF_04_VILLAGE_SCENE.png cho môi trường. Nhấn ảnh để xem kích thước gốc.</p>'''+''.join(cards)+f'<section><h2>Nội thất đối chứng</h2><p>Nhấn E trong gallery chỉ chuyển preview, không phải cửa đi bộ mới.</p><div class="views"><img src="interior_0.png" alt="Nội thất 0 độ"><img src="interior_90.png" alt="Nội thất 90 độ"></div></section><section><h2>Hiệu năng MainWorld</h2><pre>{html.escape(perf)}</pre><p>F5 vẫn chạy game hiện tại. Mở tests/batch01/test_asset_gallery.tscn rồi F6 để xem lô kiểm định riêng.</p></section></main></html>'
(OUT/'review.html').write_text(page,encoding='utf-8')
print('Review ready;',len(before),'original files unchanged; 0/5 art-approved.')
