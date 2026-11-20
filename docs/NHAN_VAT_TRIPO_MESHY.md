# Thiết kế lại nhân vật 3D theo ảnh mẫu mới: Tripo3D / Meshy + Blender MCP (20/11)

Ảnh mẫu anh đưa (lưu ở `reference_art/15_redesign_village_elders_3d.jpg` và `16_redesign_heroine_and_friends_3d.jpg`): kiểu **chibi 3D bóng, mềm, màu ấm**, mặt to biểu cảm, có bảng 5 góc nhìn, 4–6 biểu cảm, đồ cầm theo.
Hai ảnh gồm **6 ông cụ** (ảnh 1) và **nữ chính + 5 bạn nữ** (ảnh 2). Em tạm ghép với nhân vật trong game như bảng dưới, anh sửa nếu khác ý.

| Ảnh | Nhân vật mới | Ghép với (file hiện tại) | Ghi chú |
|---|---|---|---|
| 1, ô 1 | Ông trưởng làng áo choàng xanh, gậy đèn lồng | Tom `npc_tom_elder_v02` | |
| 1, ô 2 | Ông câu cá nón rơm, xô cá | Sam `npc_sam_fisherman_v02` | |
| 1, ô 3 | Ông bán hàng ria mép, thùng trái cây | Ben `npc_ben_merchant_v02` | |
| 1, ô 4 | Thầy giáo mũ cử nhân, kính tròn, sách | **mới** (thầy giáo/thủ thư, dự phòng Cú Mèo dạng người) | |
| 1, ô 5 | Thợ rèn kính bảo hộ, búa, đe | Bram `npc_forge_blacksmith_v01` | |
| 1, ô 6 | Ông thầy cây, mũ phù thủy xanh, bình thuốc | **mới** (ông trông vườn/dược sư, dự phòng) | |
| 2, trên | Nữ chính kính bảo hộ, khăn đỏ, tóc xoăn búi | **nhân vật con tự tạo** (`chr_ngoc_adventurer`) | trang phục mặc định |
| 2, dưới 1 | Cô gái lá, gậy dây leo | Lily `npc_lily_druid_v02` | |
| 2, dưới 2 | Cô gái áo choàng tuyết, ba lô cuộn | **mới** (hướng dẫn viên vùng núi tuyết, Map 4–5) | |
| 2, dưới 3 | Cô thợ bánh | Rose `npc_rose_baker_v02` | |
| 2, dưới 4 | Cô hát rong đàn lute | Anna `npc_anna_bard_v02` | |
| 2, dưới 5 | Cô tiên đũa sao | Pip (dạng người) hoặc bộ đồ tiên bán ở tiệm Mia | |

## 1. Kết luận trước khi làm

1. **Chia hai đường, đừng dùng một cách cho tất cả.**
   - **NPC (11 người)**: dùng AI (Tripo/Meshy) là hợp, vì NPC không đổi quần áo. Một model liền, một tấm texture, gắn xương, xong.
   - **Nhân vật của con (nữ chính)**: **KHÔNG nên để AI dựng cả người**. Game đang cho bé đổi mặt, tóc, áo, quần, váy, trang sức, nhuộm màu. AI cho ra **một khối liền có texture vẽ sẵn**, không tách được tóc/áo, không nhuộm màu được, không gắn được lên bộ xương hiện tại. Cách đúng: **thân + đầu dựng bằng Blender (lấy ảnh làm mẫu), còn tóc, phụ kiện, từng món đồ thì để AI dựng riêng từng món rồi gắn vào xương.**
2. **Phong cách phải thống nhất.** Ảnh mẫu bóng kiểu phim hoạt hình 3D, còn nhà cửa/cây trong game là màu phẳng + viền. Nhân vật mới đẹp hơn thế giới thì nhìn như dán vào. Em đề nghị: nhân vật vẽ tay mềm (màu có nét vẽ tay, **bỏ bóng phản chiếu in sẵn**), game giữ viền. Sau đó nâng dần cây, nhà để đồng bộ (mục 6).
3. **Giữ nguyên bộ xương hiện tại** (`hips, spine, chest, neck, head, shoulder/upper_arm/forearm/hand .L/.R, thigh/shin/foot .L/.R`, thêm `bun`, `scarf_tail.R` cho nữ chính) và **tên clip** (`Idle, Walk, Run, Talk, Wave, Jump, Land, Fall, Interact, Celebrate`). Nhờ vậy toàn bộ code, hoạt ảnh, đổi trang phục không phải sửa.
4. **Ngân sách** (`PERFORMANCE_BUDGET.md`): texture ≤ 1024 px. Nữ chính ≤ 12.000 tam giác (không tính tóc/phụ kiện đang đeo thêm ≤ 3.000). NPC ≤ 8.000 tam giác, file ≤ 1,2 MB. Chỉ nạp NPC của map đang chơi.
5. **Bản quyền**: gói miễn phí của Tripo/Meshy thường chỉ cho dùng cá nhân/ghi công. Game dự định đưa lên mạng nên **dùng gói trả phí có quyền thương mại** khi dựng bản chính thức; kiểm tra điều khoản ngay lúc dùng vì họ hay đổi.
6. Em (trong container) **không vào được Tripo/Meshy**. Anh làm bước 1–2 trên máy anh, rồi Claude Code trên máy anh (có Blender MCP) làm bước 3–4.

## 2. Quy trình cho mỗi NPC (đường A)

**Bước 1. Chuẩn bị ảnh đầu vào** (quan trọng nhất; bảng nhiều góc nhìn làm AI dựng sai).
Dùng công cụ vẽ ảnh anh đã tạo ảnh mẫu, dán prompt bên dưới (thay phần trong ngoặc vuông) để ra **một ảnh toàn thân, nền trắng, tư thế chữ A, mặt nhìn thẳng, miệng cười nhẹ** (đừng cười há miệng, vì AI sẽ dựng miệng há cứng):

```
Full body character, chibi 3D toy style, big head, soft hand-painted look, warm colours, NO baked highlights or cast shadows,
neutral soft ambient light, plain white background, front view, straight-on, standing in a relaxed A-pose (arms slightly away from the body,
hands open, legs shoulder width apart, feet flat), gentle closed-mouth smile, eyes open looking at camera.
[Mô tả nhân vật, ví dụ: elderly village elder with big white beard, blue and gold robe with a tassel, round belt pouch, holding a wooden staff with a small lantern]
The staff/props are held in the hand but do not hide the body. Consistent design with the reference sheet. No text, no frame.
```
Làm thêm ảnh **nhìn nghiêng** và **nhìn sau** cùng nhân vật (đổi "front view" thành "side view" / "back view"), để dùng chế độ nhiều ảnh nếu bản Tripo/Meshy anh dùng có.
Đồ cầm (gậy, cần câu, búa…) **nên bỏ ra** và dựng riêng thành vật nhỏ, để game có thể đổi/ẩn: ghi "no held props, empty hands in loose fists". Chỉ giữ lại nếu đồ gắn liền (mũ, túi).

**Bước 2. Dựng 3D trên Tripo3D hoặc Meshy** (tên nút có thể khác theo phiên bản):
- Chọn **Image to 3D** (Tripo) / **Image to 3D** (Meshy); dán ảnh trước, nếu có ô nhiều góc thì thêm ảnh nghiêng, ảnh sau.
- Chọn: có **texture + PBR**, tư thế **A-pose** (nếu có ô chọn), kiểu lưới **quad / low-poly sạch**, giới hạn mặt khoảng **15.000–20.000** (Blender sẽ giảm tiếp).
- Tạo 3 lần, chọn bản có **mặt đẹp, tay chân tách khỏi thân, không dính ống tay vào thân**. Bản nào chân dính nhau hoặc áo choàng dính chân: bỏ, tạo lại.
- Tải về dạng **GLB** (hoặc FBX), đặt vào thư mục `assets_src/ai/<tên nhân vật>/raw.glb` (thư mục này **không** đưa lên GitHub; chỉ file cuối ở `assets/models`).
- Chưa dùng chức năng tự gắn xương của họ; xương của game quan trọng hơn (bước 3).

**Bước 3. Dán lệnh sau cho Claude Code trên máy anh (có Blender MCP)** để dọn, gắn xương, chuyển hoạt ảnh:

```
Lô 26 (NPC từ AI): viết tools/ai_chars/ai_npc.py chạy bằng: NAME=<tên> SRC=<raw.glb> REF=assets/models/npc_tom_elder_v02.glb
  blender -b -P tools/ai_chars/ai_npc.py   (REF là NPC cũ cùng giới tính có sẵn xương và clip để lấy bộ xương + hoạt ảnh)
Làm lần lượt:
1. Nhập raw.glb. Xoá mọi xương/animation AI tự gắn nếu có. Gộp thành MỘT object mesh tên <Tên> (ví dụ Tom). In ra: số tam giác, bbox, số vật liệu, kích thước texture.
2. Chuẩn hoá: cao đúng chiều cao ghi trong bảng (ông cụ 1,25–1,35 m, bạn nữ 1,2–1,3 m, tính từ gót đến đỉnh đầu), gốc toạ độ ở giữa hai chân y=0, mặt nhìn +Z glTF (−Y Blender), áp dụng scale/rotation, +Y lên.
3. Giảm mặt: Decimate (collapse) về ≤ 8.000 tam giác, giữ viền mắt-miệng (vertex group mặt trọng số cao), kiểm tra không vỡ UV.
   Texture: gộp về MỘT tấm 1024×1024 (nén WebP khi xuất nếu được), bỏ normal map nếu nặng; roughness 0,8, metallic 0 (tránh bóng loá trên nền màu phẳng).
4. Gắn xương: nhập REF lấy armature (<Tên>Rig: hips, spine, chest, neck, head, shoulder/upper_arm/forearm/hand .L/.R, thigh/shin/foot .L/.R)
   và các action Idle, Walk, Run, Talk, Wave. Co/dãn armature cho khớp thân mới (vai, khuỷu, đầu gối, cổ khớp đúng chỗ, đầu to chibi).
   Parent mesh vào armature bằng Automatic Weights, rồi sửa trọng số bằng tay: toàn bộ đầu, râu, mũ, tóc = 100% xương head; áo choàng/váy dài chỉ theo xương thigh vừa phải (không xuyên chân khi Walk).
   Giữ đúng TÊN xương cũ để các clip dùng được ngay. Nếu nhân vật có thứ thừa (râu dài, mũ, đuôi tóc) thì thêm xương phụ con của head/chest, đặt tên rõ.
5. Kiểm: render 4 tư thế cho mỗi clip Idle/Walk/Talk/Wave (ảnh ghép), không được xuyên thân, không méo mặt. Nếu có, sửa weight rồi render lại.
6. Xuất assets/models/npc_<tên>_<vai>_v03.glb (GLB, kèm clip Idle, Walk, Run, Talk, Wave; vật liệu đặt tên <tên>_Body, <tên>_Face như file cũ để game nhận). Không ghi đè bản v02.
7. Tạo ảnh chân dung hội thoại: render đầu + vai (sau này em thay bằng 4 biểu cảm vẽ tay) tại assets/ui/portrait_<tên>.png 256×256 nền trong suốt.
Chạy lần lượt cho: Tom, Sam, Ben, Bram, Lily, Rose, Anna, + 4 nhân vật mới (thầy giáo, ông thầy cây, cô áo tuyết, cô tiên). Mỗi người xong thì commit từng file, nhánh blender-assets, báo "đã đẩy NPC <tên>".
```

**Bước 4. Em nối vào game**: đổi tên file trong `content.js` (giữ tint nếu có), thêm hiển thị chân dung, chạy thử, chụp ảnh so sánh.

### Mô tả cho từng NPC (dán vào phần [Mô tả nhân vật] ở bước 1)
- **Tom**: elderly village elder, big fluffy white beard and eyebrows, royal-blue robe with gold star trim and a tassel, cream inner tunic, brown leather belt with pouch, small gold medallion, brown boots. Warm kind face.
- **Sam**: elderly fisherman, white beard, wide straw hat with a small blue fish ornament, olive shorts, brown leather vest over cream shirt, blue neckerchief, tall rubber boots, a small bucket on the belt.
- **Ben**: cheerful elderly grocer, big curled moustache, cream flat cap with red band, green apron over cream shirt with red bow tie, red-and-white checkered cloth at the hip, brown boots.
- **Thầy giáo**: elderly teacher, white hair, round black glasses, blue graduation cap with golden tassel, blue-and-gold academic robe with red bow tie, satchel full of scrolls.
- **Bram**: elderly blacksmith, white beard, aviator goggles on the forehead, brown leather apron with tool pockets, red neckerchief, thick leather gloves, rolled sleeves.
- **Ông thầy cây**: elderly druid, long white beard, tall green pointed hat wrapped with leaves and tiny flowers, moss-green robe, brown shoulder bag, small potion bottles on the belt.
- **Lily**: girl druid, orange wavy hair with a leaf-and-flower crown, green leaf cape, cream skirt, brown satchel, leather boots with small flowers.
- **Cô áo tuyết**: girl explorer, brown braids, blue fur-trimmed hooded cape with white pattern, olive shorts, fur boots, big rolled blanket backpack.
- **Rose**: girl baker, pink curly hair under a white chef hat with red band, white blouse, red embroidered apron-skirt, red bow, brown satchel.
- **Anna**: girl bard, brown curly hair in a high bun with a big yellow bow, blue dress with golden music-note trim, white collar, brown satchel, boots.
- **Cô tiên**: girl fairy-mage, long wavy blonde hair with purple flowers, purple-white dress with gold stars, translucent fairy wings, brown satchel.

## 3. Nữ chính (đường B: dựng theo mô-đun)

Mục tiêu: bé tạo nhân vật như bây giờ, nhưng người đẹp theo ảnh mẫu 2. Bộ đồ mặc định (kính bảo hộ, khăn đỏ, tóc xoăn búi + băng đô đỏ, áo gile nâu, túi, bình xanh, cuộn bản đồ, giày bốt) là "bộ khởi đầu" mà bé có thể thay.

**Việc AI làm (Tripo/Meshy), từng món một**, dùng cách ở mục 2 (ảnh từng món riêng trên nền trắng, vật thể **một mình, không có người**), mỗi món ≤ 3.000 tam giác:
`goggles` (kính bảo hộ viền đồng, kính xanh), `scarf_red` (khăn đỏ có đuôi bay), `satchel` (túi đeo chéo nâu), `backpack_scroll` (ba lô có cuộn), `potion_blue` (bình xanh bên hông), `map_scroll`, `gloves_brown`, `boots_lace` (bốt cột dây), `hair_curly_bun` (tóc xoăn búi cao), `hairband_red`, và 5 bộ trang phục "cosplay" (lá, tuyết, thợ bánh, hát rong, tiên) mỗi bộ gồm tóc + áo + váy/quần + phụ kiện, để bán ở tiệm Mia.
Prompt ảnh (mỗi món): `single object, 3D toy style, soft hand-painted, no baked highlights, plain white background, three-quarter view, centred: <mô tả món>`.

**Việc Blender làm (Claude Code + MCP)**:

```
Lô 27 (nữ chính mới): viết tools/hero_v06/build_hero_v06.py xuất assets/models/chr_ngoc_adventurer_v06.glb, GIỮ NGUYÊN bộ xương, tên clip và tên vật liệu của v05
  (ngoc_skin, NgocFace, ngoc_hair_tint, ngoc_top_tint, ngoc_bottom_tint, ngoc_boots, ngoc_gear; xương hips…foot, bun, scarf_tail.R).
1. Thân + đầu dựng lại bằng Blender theo ảnh docs/reference_art/16_redesign_heroine_and_friends_3d.jpg: đầu chibi to (≈ 1/3 chiều cao), tai nhỏ,
   vùng mặt là mảng UV phẳng riêng cho vật liệu NgocFace (game dán khuôn mặt 2D lên đó, mắt to bóng kiểu ảnh mẫu — em sẽ vẽ lại 8 khuôn mặt theo ảnh), cổ ngắn,
   bàn tay 4 ngón gộp (như ảnh), thân nhỏ, chân ngắn. Da dùng vật liệu ngoc_skin (xám 0,8 nhân màu), KHÔNG vẽ mặt vào texture da.
   ≤ 7.000 tam giác cả thân; cao 1,2 m; chân ở y=0; mặt +Z glTF.
2. Nhập các món AI ở assets_src/ai/hero_parts/*.glb. Mỗi món: giảm mặt ≤ 3.000, đặt đúng chỗ trên thân, parent vào xương phù hợp
   (kính, tóc, băng đô → head; khăn → neck + xương scarf_tail.R cho đuôi khăn; túi → chest; bình → hips; giày → foot.L/R; găng → hand.L/R),
   tên object chuẩn: Gear_goggles, Gear_scarf, Gear_satchel, Gear_backpack, Gear_potion, Gear_map, Gear_gloves, Boots, Hair_curly (đã có), Hair_hairband.
3. CHUYỂN MÀU THÀNH NHÂN ĐƯỢC: với tóc, áo, quần/váy (phần game cho tô màu), nướng texture về xám 0,8 giữ nguyên chi tiết sáng tối/hoa văn
   (vật liệu ngoc_hair_tint / ngoc_top_tint / ngoc_bottom_tint, game nhân với màu bé chọn). Phần cố định màu (kính, khăn đỏ, bốt, túi) giữ texture màu.
4. Trọng số: copy từ thân, tóc/kính 100% head; kiểm 4 tư thế cho Idle, Run, Jump, Attack, Wave: không xuyên thân, khăn không chui vào áo.
5. Mỗi món quần áo/phụ kiện thay được có extras eq_hidden: 1 khi mặc đồ khác (như lô 19). Quần áo mặc định (áo gile + sơ mi + quần short) là Top_default, Bottom_default.
6. Render bảng so sánh v05 và v06 (5 góc nhìn như ảnh mẫu), commit từng file, nhánh blender-assets.
Làm tiếp: cùng bộ xương làm chr_ban_nam_v02 (bạn nam) theo cùng phong cách.
```

**Việc em làm sau khi anh đẩy**: vẽ lại 8 khuôn mặt (mắt to, bóng) theo ảnh biểu cảm, nối `chr_ngoc_adventurer_v06`, 5 bộ cosplay vào tiệm Mia, chân dung hội thoại theo biểu cảm (ô "!", "?", "♪", "✦" trong ảnh mẫu), cập nhật bảng tạo nhân vật.

## 4. Kiểm nhận (mỗi nhân vật)
- Cao đúng, đứng chạm đất, mặt về +Z, 4 clip chạy mượt, không xuyên.
- Tam giác và texture trong ngân sách; file ≤ 1,2 MB (NPC), ≤ 2,5 MB (nữ chính, tóc, đồ kèm).
- Màu cùng tông với nhân vật cũ và cảnh game (kiểm bằng ảnh chụp trong game, không chỉ ảnh render Blender).
- Không có chữ, logo, tên thương hiệu in trên model.

## 5. Ý kiến về Unity
**Em khuyên: chưa chuyển sang Unity, và đừng chạy hai engine song song.** Lý do cụ thể với dự án này:
1. **Phải viết lại gần như tất cả.** Game đã có 32 lượt làm (nhiệm vụ, kỹ năng 4 hệ, cửa hàng, mini game, lưu hồ sơ, học tiếng Anh theo lớp). Chuyển sang Unity là làm lại từ đầu bằng C#, mất nhiều tháng, trong khi nội dung (Map 3–10) còn chưa làm.
2. **Chơi trên web là điểm mạnh.** Bản Three.js nặng ~12 MB, mở bằng trình duyệt, gửi link là chơi, hợp cho các bé và bạn nam nhà khác. Bản Unity WebGL thường 30–80 MB, nạp lâu, hay lỗi trên máy yếu và điện thoại; phải cài .exe/.apk thì rào cản cao hơn.
3. **Anh đã có quy trình.** Anh làm với Claude, Blender, Electron. Thêm Unity là thêm một công cụ phải học, thêm lỗi xuất bản.
4. **Đẹp hơn không cần Unity.** Nhân vật đẹp là do model và texture (làm ở Blender), cùng ánh sáng/hậu kỳ. Three.js làm được viền, đổ bóng mềm, bloom, SSAO; em sẽ nâng dần.
5. **Nối mạng LAN** (2 máy chơi chung) làm được trong Electron + WebSocket/WebRTC, không cần Unity.

**Khi nào mới nên cân nhắc Unity**: (a) muốn lên Steam/App Store/Google Play với đồ họa như game thương mại, (b) cần vật lý, ánh sáng, thế giới mở rất lớn, nhiều người chơi cùng lúc trên máy chủ, (c) có người cùng làm thạo C#. Khi đó nên làm **bản mới sau khi nội dung Map 1–3 ổn định**, dùng lại nguyên các file GLB, ảnh, âm thanh, và các file luật (`src/core/*.js`) chuyển thành tài liệu thiết kế.
**Việc nên làm ngay để sẵn sàng đường lui**: giữ asset theo chuẩn mở (GLB, PNG, tên xương/clip nhất quán như bây giờ), giữ luật game tách khỏi hiển thị (đã làm ở `src/core`), nhờ đó sau này sang Unity vẫn dùng được tài sản đã vẽ.
Nếu anh vẫn muốn thử Unity: thử một **mini game riêng** (ví dụ boss sự kiện) trong một dự án nhỏ, không đụng game chính, để xem có hợp không.

## 6. Thứ tự đề xuất
1. Làm thử **1 NPC (Tom)** hết quy trình đường A để xem chất lượng thật, thời gian và dung lượng. Gửi ảnh render, em duyệt và chỉnh prompt.
2. Nếu ổn: 6 NPC có sẵn (Sam, Ben, Bram, Lily, Rose, Anna), rồi 4–5 NPC mới.
3. Nữ chính v06 (lô 27) cùng lúc với lô 19, vì hai việc đụng cùng bộ xương, nên **làm lô 27 trước, bỏ lô 19 làm trên v05**, để đỡ làm hai lần (kiểu áo/quần/đầm của lô 19 chuyển sang v06).
4. Sau khi nhân vật xong mới nâng cây, nhà, địa hình cho cùng phong cách.

## 7. Cách làm tắt: ra lệnh Tripo/Meshy ngay trong Claude Code qua Blender MCP (bổ sung 20/11)
Nếu bảng cài đặt Blender MCP của anh có ô tích **Tripo3D / Meshy** (nhập API key), Claude Code gọi được thẳng: tạo model từ chữ hoặc ảnh, tự nhập vào cảnh Blender, rồi làm tiếp bước dọn/gắn xương ở mục 2 bước 3. Khi đó bỏ bước tải GLB thủ công.
Giữ nguyên các quy tắc: ảnh đầu vào nền trắng chữ A, nữ chính dựng theo mô-đun (mục 3), NPC giảm ≤ 8.000 tam giác và gắn xương cũ.
Lệnh thử (dán cho Claude Code trên máy anh):
```
Hãy liệt kê các tool của Blender MCP đang có (đặc biệt phần Tripo3D và Meshy: tạo từ chữ, từ ảnh, kiểm tra trạng thái, nhập model, có hỗ trợ ảnh cục bộ không).
Rồi làm thử NPC ông Tom: dùng ảnh docs/reference_art/15_redesign_village_elders_3d.jpg (ô 1) hoặc ảnh nền trắng anh cung cấp, tạo model bằng Tripo3D (hoặc Meshy), nhập vào Blender,
rồi chạy quy trình Lô 26 trong docs/NHAN_VAT_TRIPO_MESHY.md (chuẩn hoá, giảm mặt, gắn xương và clip từ npc_tom_elder_v02, render 4 tư thế). Báo số credit đã dùng. Chưa commit, đợi tôi duyệt ảnh.
```
Lưu ý: mỗi lần tạo tốn credit (nên giới hạn 2–3 lần thử cho mỗi nhân vật); ảnh ghép nhiều góc nhìn (như ảnh mẫu) cho kết quả kém, hãy cắt riêng một góc hoặc làm ảnh nền trắng.
