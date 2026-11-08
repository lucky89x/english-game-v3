class_name Minimap
extends Control
## Small north-up map in the top-right corner, centred on Ngọc. Everything is drawn from
## VillageLayout (roads, river, houses, bridges, place names), so it always matches the world.
## Quest markers ("!" / "?") are the visible Label3D nodes in group "quest_marker".

const SIZE := 200
const RADIUS_M := 55.0                       # metres from the centre to the edge
const LAYOUT := preload("res://world/zones/starter_village/village_layout.gd")
const GRASS := Color(0.55, 0.72, 0.38)
const ROAD := Color(0.86, 0.78, 0.6)
const WATER := Color(0.36, 0.62, 0.86)
const HOUSE := Color(0.78, 0.36, 0.26)
const BRIDGE := Color(0.5, 0.32, 0.16)
const INK := Color(0.2, 0.13, 0.07)

var _scale := SIZE / (2.0 * RADIUS_M)
var _centre := Vector2.ZERO                  # world (x, z) at the middle of the map
var _timer := 0.0


func _ready() -> void:
	anchor_left = 1.0
	anchor_right = 1.0
	offset_left = -SIZE - 16
	offset_right = -16
	offset_top = 16
	offset_bottom = 16 + SIZE
	clip_contents = true
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _process(delta: float) -> void:
	_timer -= delta
	if _timer > 0.0:
		return
	_timer = 0.1
	var player := get_tree().get_first_node_in_group("player") as Node3D
	if player != null:
		_centre = Vector2(player.global_position.x, player.global_position.z)
	queue_redraw()


## World (x, z) -> map pixel.
func to_map(world: Vector2) -> Vector2:
	return Vector2(SIZE, SIZE) / 2.0 + (world - _centre) * _scale


func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, Vector2(SIZE, SIZE)), GRASS)
	# river
	var river := PackedVector2Array()
	for i in range(0, 61):
		var z := 1.0 + float(i) * 2.0
		river.append(to_map(Vector2(LAYOUT.river_x(z), z)))
	draw_polyline(river, WATER, 7.5 * _scale, true)
	# roads
	for road in LAYOUT.ROADS:
		var pts := PackedVector2Array()
		for p in road[1]:
			pts.append(to_map(p))
		draw_polyline(pts, ROAD, maxf(float(road[0]) * _scale, 2.0), true)
	# houses
	for f in LAYOUT.CORE_FOOTPRINTS.slice(0, 8):
		_square(Vector2(f.x, f.y), f.z * 0.8)
	for h in LAYOUT.HAMLET:
		_square(h[1], 5.0 * float(h[2]))
	# bridges
	for b in LAYOUT.BRIDGES:
		var c := to_map(b[0])
		var size := Vector2(11.5, 2.8) * _scale
		draw_rect(Rect2(c - size / 2.0, size), BRIDGE)
	# place names
	var font := ThemeDB.fallback_font
	for a in LAYOUT.AREAS:
		var p := to_map(a[0])
		if Rect2(Vector2(-40, -10), Vector2(SIZE + 80, SIZE + 20)).has_point(p):
			var text := String(a[1])
			var w := font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, 11).x
			draw_string_outline(font, p + Vector2(-w / 2.0, 4), text, HORIZONTAL_ALIGNMENT_LEFT, -1, 11, 3, Color(1, 1, 1, 0.85))
			draw_string(font, p + Vector2(-w / 2.0, 4), text, HORIZONTAL_ALIGNMENT_LEFT, -1, 11, INK)
	# quest markers
	for m in get_tree().get_nodes_in_group("quest_marker"):
		var label := m as Label3D
		if label == null or not label.is_visible_in_tree():
			continue
		var p := to_map(Vector2(label.global_position.x, label.global_position.z))
		p = p.clamp(Vector2(8, 8), Vector2(SIZE - 8, SIZE - 8))   # off-map markers stick to the edge
		draw_circle(p, 7, Color(1.0, 0.82, 0.2))
		draw_arc(p, 7, 0, TAU, 16, INK, 1.5)
		draw_string(font, p + Vector2(-3, 4), label.text.left(1), HORIZONTAL_ALIGNMENT_LEFT, -1, 11, INK)
	# player arrow (points where Ngọc faces; she looks along +Z)
	var player := get_tree().get_first_node_in_group("player") as Node3D
	if player != null:
		var forward := player.global_transform.basis.z
		var dir := Vector2(forward.x, forward.z).normalized()
		if dir == Vector2.ZERO:
			dir = Vector2.UP
		var side := Vector2(-dir.y, dir.x)
		var c := Vector2(SIZE, SIZE) / 2.0
		draw_colored_polygon(PackedVector2Array([c + dir * 9, c - dir * 6 + side * 6, c - dir * 3, c - dir * 6 - side * 6]), Color(0.95, 0.2, 0.2))
	# north + frame
	draw_string_outline(font, Vector2(SIZE / 2.0 - 4, 14), "B", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, 3, Color.WHITE)
	draw_string(font, Vector2(SIZE / 2.0 - 4, 14), "B", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, INK)
	draw_rect(Rect2(Vector2(1, 1), Vector2(SIZE - 2, SIZE - 2)), Color(0.45, 0.3, 0.15), false, 3.0)


func _square(at: Vector2, metres: float) -> void:
	var c := to_map(at)
	var s := Vector2.ONE * maxf(metres * _scale, 3.0)
	draw_rect(Rect2(c - s / 2.0, s), HOUSE)
