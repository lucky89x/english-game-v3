from pathlib import Path
import json,hashlib,html
R=Path(__file__).resolve().parents[2];O=R/'artifacts/redesign03'
manifest=json.loads((O/'delivery_manifest.json').read_text(encoding='utf-8'))
production=['characters/player/player.tscn','npc/elder/elder_npc.tscn','npc/ambient_villager.gd','scripts/elder_npc.gd','ui/character_portrait.gd','world/main_world.tscn','world/buildings/village_architecture.gd','world/props/arched_bridge.gd','systems/redesigned_equipment.gd']
files=production+[str(p.relative_to(R)).replace('\\','/') for folder in ['assets/redesign03','art_source/redesign03','tools/redesign03','tests/redesign03'] for p in (R/folder).glob('*') if p.is_file() and not p.name.endswith(('.import','.blend1'))]
(O/'files_changed.txt').write_text('\n'.join(files),encoding='utf-8')
# Exact backups let reviewers restore the previous working game.
protected=['scripts/player_controller.gd','scripts/orbit_camera.gd','project.godot','scripts/animated_chest.gd','systems/building_travel.gd']
original=json.loads((R/'artifacts/batch01/gameplay_before.json').read_text())
checks={}
for n in protected:
 old=original.get(n.replace('/','\\'),original.get(n))
 if old and (R/n).exists():checks[n]=hashlib.sha256((R/n).read_bytes()).hexdigest()==old
(O/'protected_gameplay.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
assert all(checks.values())
table='\n'.join(f"| {x['file']} | {x['triangles']:,} | {x['materials']} | {x['bytes']/1048576:.2f} |" for x in manifest)
perf=(O/'render_report.txt').read_text(encoding='utf-8')
report='''# EnglishQuestV3 — bản thiết kế asset 03 đã tích hợp F5

Ngày 03/11/2026. Kết quả mới này thay trạng thái “chưa có Blender/chưa thay nhân vật” trong báo cáo lô trước. **Đã thay nhân vật, NPC, HUD và đưa dụng cụ mới vào MainWorld.** Đây là bản thiết kế đầu để nghiệm thu mỹ thuật, chưa tuyên bố tương đương hoàn toàn ảnh concept hoặc hoàn thành toàn bộ 105 asset.

## Asset thật và nơi xuất hiện trong game

- **Ngọc:** đầu/mặt/mắt/tóc búi/kính đồng/khăn đỏ được dựng mới, thân và rig Quaternius Adventurer được sửa tỷ lệ và làm mềm. Bình xanh, cuộn giấy và ba lô gắn vào xương. Có Skeleton3D 62 xương; Idle/Walk/Run/Interact/Wave từ rig nguồn sau chỉnh tỷ lệ. Thay trực tiếp model Player và chân dung HUD.
- **Tom:** model chibi mới gồm áo xanh kem viền vàng, râu trắng, mặt, tay, gậy đèn; rig mới 17 xương. Idle/Walk/Run/Talk/Wave được dựng keyframe riêng. E mở hội thoại sẽ Wave, sau đó Talk; đóng hoặc đi khỏi vùng sẽ Idle. Không đổi tên clip chiến đấu để giả Talk/Wave.
- **Dân làng:** model mới tóc nâu, áo xanh lá, không râu/gậy, cùng bộ rig của Tom. Thay năm NPC đi lại; giữ route và tránh người chơi hiện có. Đây là một mẫu cơ sở dùng chung, chưa năm tạo hình nghề nghiệp riêng.
- **Dụng cụ:** GLB bình thuốc xanh, cuộn giấy niêm phong, ba lô và gậy đèn. Ba món gắn trên Ngọc; đủ bốn món đặt trên/cạnh bàn cạnh quảng trường gần vị trí xuất phát. Các món hiện là đồ trang trí, chưa có hệ thống nhặt/sử dụng mới.
- **Nhà:** nhà tây/đông và hội trường thêm tầng thực bằng module tường/cửa sổ, nâng mái/chimney/collider tương ứng. Thêm ban công, cửa chớp, chậu hoa, cờ, đèn, ghế; tăng tỷ lệ barn/storehouse. Các cửa E hiện có vẫn hoạt động.
- **Cầu:** thêm sườn vòm gỗ thật dưới cầu, bốn trụ và bốn đèn. Giữ lối đi, hai đầu dốc gỗ textured và rail collision đã kiểm tra.
- **Sông/địa hình:** giữ bản hòa trộn đất/cỏ/bờ ẩm và shader nước chuyển động lượt02 đang chạy; lượt03 tập trung vào model, nhà và cầu. Không tuyên bố đã dựng lại sông trong lượt này.

## File model bàn giao

Mỗi asset có `.blend` nguồn trong `art_source/redesign03/`, GLB thật trong `assets/redesign03/`; ảnh texture nhúng và UV. Folder nguồn và Blender portable có .gdignore.

| GLB | Tam giác | Vật liệu | MiB |
|---|---:|---:|---:|
'''+table+'''

Ngọc được tối ưu từ 103.046 xuống 32.973 tam giác và 22 xuống 3 material, một atlas 2048² đã bake màu (EMIT albedo, không ánh sáng). Tom 23.270 tam giác/1material. Vật liệu kim loại/thuốc được kiểm tra lại vì glTF không giữ MixRGB tùy ý và vertex color mặc định từng làm đen pack; đã bake màu và loại vertex color không dùng.

## Nguồn và quy trình

Blender portable 4.5.9 lấy từ máy chủ download.blender.org, đặt trong `tools/blender_portable/`; không cài toàn hệ thống. Script dựng/xuất nằm tại `tools/redesign03/`. Quy trình dựng lại: build_props.py → build_ngoc.py → bake_ngoc_atlas.py; build_tom.py và build_tom.py -- --villager. Các .blend có rig/mesh/material/texture chỉnh sửa được, không chỉ là ảnh PNG.

Ngọc thân/rig/clip kế thừa Quaternius Ultimate Modular Women; cuộn giấy/ba lô kitbash Scroll_1/Pouch_Large từ Fantasy Props MegaKit; nhà/cầu dùng Medieval Village MegaKit [Standard]; cây/hoa dùng nature đang có. License CC0 kèm nguồn. Đầu Ngọc, tóc/kính/khăn, Tom/dân làng, chi tiết dụng cụ mới được dựng bằng script Blender. Ảnh tham chiếu REF01/REF02/REF04/REF05 trong hồ sơ dùng đối chiếu; REF03 có nội dung nhân vật dù tên ENVIRONMENT.

## Kiểm tra

- GLB binary hợp lệ, mesh/material/ảnh đều nhúng: delivery_manifest.json có SHA256, clip, số xương.
- Nhập lại Blender/Godot, so pose xương ở nhiều thời điểm: Idle/Walk/Run/Interact/Wave Ngọc và Idle/Walk/Run/Talk/Wave Tom PASS.
- Wave→Talk khi hội thoại mở, đóng→Idle và đóng giữa Wave→Idle: PASS.
- WASD/Shift, camera, HUD, rương E, NPC E và MainWorldCompatibility: PASS các test hiện có.
- Năm NPC mới đi theo waypoint, ba cửa vào/ra, floor/furniture collision: PASS.
- Cầu qua hai chiều và đi trên cao độ deck: PASS.
- 24 ảnh Godot bốn góc của hai nhân vật và bốn dụng cụ, ba góc Idle/Walk/Run Ngọc, ảnh bốn khu + hội trường. Xem review.html.
- Kiểm tra hash controller/camera/project/building_travel: không thay ngoài phạm vi. Game JavaScript gốc không sửa.

## Hiệu năng render thật

Godot 4.7.2 Forward+ D3D12, RX6600 LE; VSync OFF, 15 giây mỗi độ phân giải sau warmup, nhân vật di chuyển và camera xoay liên tục. Không lấy FPS headless:

```text
'''+perf+'''
```

Đây là đo cục bộ máy hiện tại, không bảo đảm máy khác. Log benchmark riêng performance_final.log. Không dùng số gallery nhỏ thay số game chính.

## Phần còn hạn chế

- Tạo hình mới đã thay vào game, nhưng silhouette/tóc/da/vải và biểu cảm còn đơn giản hơn concept; cần bạn duyệt, không tự đánh dấu art_approved=true.
- Ngọc chưa có Jump/Fall/Land/Talk riêng theo manifest rộng; gameplay nhảy vẫn chạy cơ học cũ. Chưa có blendshape miệng/chớp mắt, Talk của Tom là cử chỉ đầu/tay.
- Dân làng dùng chung một mẫu, chưa có đầy đủ nghề nghiệp/trang phục riêng. Chuyển động Tom có chỗ bàn chân chìm khoảng 1,4 cm khi đo; cần animation polish.
- Player collider cao1,8m, visual Ngọc khoảng1,58m; giữ collider cũ để không đổi gameplay. Hai tầng nhà là ngoại thất; interior E vẫn các phòng cũ, chưa cầu thang đi tầng hai.
- Các dụng cụ phụ còn 4–5 material, chưa đạt ngân sách thấp nhất cho nhân rộng. Chưa làm LOD riêng đầy đủ.
- Headless sandbox có lỗi root certificate store; lần import cuối chạy ngoài sandbox hoàn tất, không có lỗi shader/GDScript khi render cuối. Cảnh báo tên hoa/thường trong texture Quaternius cũ còn tồn tại khi scan toàn dự án.

## File tích hợp thay đổi

'''+ '\n'.join('- `'+p+'`' for p in production)+'''

Danh sách asset/source/tool/test đầy đủ: files_changed.txt. Backup trước lượt này: backups/redesign03. Báo cáo trước giữ lại để đối chiếu lịch sử, không phải trạng thái bản F5 mới.

## Kiểm tra trong Godot

Mở project.godot của EnglishQuestV3, F8 dừng bản cũ rồi F5. Ngọc mới và HUD xuất hiện ngay. Bàn dụng cụ cạnh quảng trường, Tom gần chợ; E để xem vẫy tay/nói chuyện. Đi phía bắc xem nhà trưởng làng hai tầng, đến bến sông xem sườn cầu và đèn.

Scene riêng: tests/redesign03/asset_review.tscn + F6. Tab đổi mẫu, chuột phải xoay, con lăn zoom; 1/2/3 Idle/Walk/Run,4Talk,5Wave. Scene này dành xem mẫu; F5 vẫn game chính mới.
'''
(O/'REPORT.md').write_text(report,encoding='utf-8')
ref='../../assets/EnglishQuestV3_Asset_Spec_Codex_2026-11-03/EnglishQuestV3_Asset_Spec_Codex_2026-11-03/04_REFERENCES/'
page='''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EnglishQuestV3 · asset mới trong F5</title><style>body{margin:0;background:#15232b;color:#edf2ee;font:17px/1.6 system-ui}main{max-width:1500px;padding:30px;margin:auto}h1,h2{line-height:1.3}img{width:100%;display:block}a{color:#b8dcff}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}section{padding:24px 0;border-top:1px solid #52616b}figure{margin:0}figcaption{color:#aebec6;font-size:14px}.note{color:#ffd69b}@media(max-width:800px){.grid{grid-template-columns:1fr}}</style><main><h1>Nhân vật và dụng cụ mới đã vào MainWorld / F5</h1><p>Ngọc • Tom • dân làng • dụng cụ • nhà hai tầng • cầu có sườn vòm</p><p class="note">Bản thiết kế đầu chờ duyệt mỹ thuật, còn khác concept. Đã thay model thật, rig và hoạt ảnh.</p><p><a href="REPORT.md">Báo cáo và hạn chế</a> · <a href="files_changed.txt">File thay đổi</a> · <a href="delivery_manifest.json">Thông số GLB</a></p><section><h2>Game chính</h2><img src="game_1920.png" alt="MainWorld 1080p với Ngọc và HUD mới"></section>'''
for i,(title,reference) in enumerate([('Ngọc','REF_01_FEMALE_HERO.png'),('Tom','REF_02_ELDER_NPCS.png'),('Bình thuốc xanh','REF_05_WEAPONS.png'),('Cuộn giấy niêm phong','REF_05_WEAPONS.png'),('Ba lô phiêu lưu','REF_01_FEMALE_HERO.png'),('Gậy đèn','REF_02_ELDER_NPCS.png')]):
 page+=f'<section><h2>{title}</h2><details><summary>Xem ảnh tham chiếu gốc</summary><img src="{ref+reference}" alt="Concept"></details><div class="grid">'
 for a in [0,90,180,270]:page+=f'<figure><a href="review_{i}_{a}.png"><img src="review_{i}_{a}.png" alt="{title} {a} độ"></a><figcaption>Godot runtime {a}°</figcaption></figure>'
 page+='</div></section>'
page+='<section><h2>Cảnh làng</h2><div class="grid">'
for name,label in [('01_village_square','Quảng trường'),('02_river_dock','Bến sông'),('03_farm','Nông trại'),('04_forest_edge','Rìa rừng'),('05_hall','Nhà trưởng làng')]:page+=f'<figure><a href="{name}.png"><img src="{name}.png" alt="{label}"></a><figcaption>{label}</figcaption></figure>'
page+='</div></section><section><h2>Kiểm tra bản mới</h2><p>F8 → F5. Chưa sản xuất số lượng lớn hoặc thay đủ 105 asset. Phần còn thiếu ghi trong báo cáo.</p></section></main></html>'
(O/'review.html').write_text(page,encoding='utf-8')
print('Report and review saved; protected original gameplay:',checks)
