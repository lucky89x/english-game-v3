# Vũ khí và công cụ GLB (phụ trợ, không ưu tiên cao hơn nhân vật/địa hình)

Phù hợp trẻ em: dụng cụ phiêu lưu và chiến đấu fantasy nhẹ, không mô tả bạo lực đồ họa. Tham chiếu bộ vũ khí người dùng đã chọn; nhóm ưu tiên:

- `wpn_wood_practice_sword`, `wpn_short_sword`, `wpn_hero_sword`, `wpn_bow_forest`, `wpn_shield_star`.
- `wpn_staff_leaf`, `wpn_staff_scholar`, `wpn_wand_star`, `wpn_lantern_staff`.
- `tool_pickaxe`, `tool_hammer`, `tool_hoe`, `tool_fishing_rod`, `tool_torch`, `tool_axe`.
- `prop_scroll`, `prop_spellbook`, `prop_potion_red`, `prop_potion_blue`, `prop_compass`, `prop_backpack`, `prop_chest`.

Mỗi model `.glb` có pivot **tại tay nắm**, định hướng gắn nhân vật, độ dài tương xứng hero 1.5 m, chất liệu thân thiện, không xuyên mesh tay khi chạy/đứng. Tạo scene test `test_equipment.tscn` gắn vào tay phải của hero và NPC khác, kiểm tra chạm/không tự quay ngược. Vũ khí tĩnh không cần Skeleton3D, chỉ animate bằng bone/socket hoặc scene Godot khi cần. Không ghép tất cả vũ khí thành một mesh không tách được.
