extends Node3D
## Street furniture for the starter village (chibi05): lamp posts along the roads, bilingual
## signposts at junctions and the closed gate to the Forest of Memories (chapter II hook).
## Positions come from VillageLayout so they follow the road network.

const LAYOUT := preload("res://world/zones/starter_village/village_layout.gd")
const MODELS := "res://assets/environment/village/models/"
const LAMP_SPACING := 16.0
## [position (x, z), [[English, Vietnamese, target (x, z)], ...]]
const SIGNPOSTS := [
	[Vector2(2.6, 13.5), [["Village Square", "Quảng trường", Vector2(0, 0)], ["West Hamlet", "Xóm Tây", Vector2(-45, 12)],
		["South Meadow", "Đồng cỏ phía Nam", Vector2(0, 40)]]],
	[Vector2(-24.5, 20.0), [["West Hamlet", "Xóm Tây", Vector2(-45, 12)], ["Village Square", "Quảng trường", Vector2(0, 11)]]],
	[Vector2(-25.5, -16.5), [["Forest of Memories", "Rừng Ký Ức", Vector2(-24, -74)], ["Village Hall", "Nhà trưởng làng", Vector2(-1, -24)]]],
	[Vector2(20.8, 16.4), [["Orchard", "Vườn cây", Vector2(48, 8)], ["River Dock", "Bến sông", Vector2(20, 1)], ["Village Square", "Quảng trường", Vector2(0, 5)]]],
	[Vector2(3.0, 29.0), [["South Meadow", "Đồng cỏ phía Nam", Vector2(-3, 72)], ["Village Square", "Quảng trường", Vector2(0, 5)]]],
	[Vector2(-5.6, 58.4), [["Fishing Pier", "Bến câu cá", Vector2(3.6, 60)], ["Village Square", "Quảng trường", Vector2(0, 5)]]],
	[Vector2(-6.0, 77.8), [["Lumber Camp", "Trại gỗ", Vector2(38, 85)], ["South Meadow", "Đồng cỏ phía Nam", Vector2(-3, 72)]]],
]
const GATE_POSITION := Vector2(-24.0, -77.0)

var landscape: Node
var random := RandomNumberGenerator.new()
var body: StaticBody3D


func build(height_source: Node) -> void:
	landscape = height_source
	random.seed = 4242
	body = StaticBody3D.new()
	body.name = "PropCollision"
	add_child(body)
	_lamps()
	for entry in SIGNPOSTS:
		_signpost(entry[0], entry[1])
	_forest_gate()


func _y(x: float, z: float) -> float:
	return landscape.get_height_at(x, z) if landscape != null else 0.0


func _cylinder_collider(point: Vector3, radius: float, height: float) -> void:
	var shape := CollisionShape3D.new()
	var cylinder := CylinderShape3D.new()
	cylinder.radius = radius
	cylinder.height = height
	shape.shape = cylinder
	shape.position = point + Vector3(0, height / 2.0, 0)
	body.add_child(shape)


## Lamp posts every ~16 m on alternating sides of the wider roads, in one MultiMesh.
func _lamps() -> void:
	var transforms: Array[Transform3D] = []
	for road in LAYOUT.ROADS:
		var width := float(road[0])
		if width < 2.8:
			continue
		var pts: Array = road[1]
		var carry := LAMP_SPACING * 0.5
		var side := 1.0
		for i in range(pts.size() - 1):
			var a: Vector2 = pts[i]
			var b: Vector2 = pts[i + 1]
			var length := a.distance_to(b)
			var along := (b - a) / maxf(length, 0.001)
			var normal := Vector2(-along.y, along.x)
			var t := carry
			while t < length:
				var p := a + along * t + normal * side * (width * 0.5 + 0.75)
				t += LAMP_SPACING
				side = -side
				if LAYOUT.in_river(p.x, p.y, 4.6) or LAYOUT.near_building(p.x, p.y, 0.5) or LAYOUT.road_distance(p.x, p.y) < 0.4:  # not in the river, by a house or on another road
					continue
				# the lamp arm points over the road
				var facing := -normal * side * -1.0
				var basis := Basis(Vector3.UP, atan2(facing.x, facing.y))
				var point := Vector3(p.x, _y(p.x, p.y) - 0.05, p.y)
				transforms.append(Transform3D(basis, point))
				_cylinder_collider(point, 0.22, 2.4)
			carry = t - length
	var scene := (load(MODELS + "prop_lamp_post_v02.glb") as PackedScene).instantiate()
	var mesh := (scene.find_children("*", "MeshInstance3D", true, false)[0] as MeshInstance3D).mesh
	scene.free()
	var multi := MultiMesh.new()
	multi.transform_format = MultiMesh.TRANSFORM_3D
	multi.mesh = mesh
	multi.instance_count = transforms.size()
	for i in range(transforms.size()):
		multi.set_instance_transform(i, transforms[i])
	var lamps := MultiMeshInstance3D.new()
	lamps.name = "LampPosts"
	lamps.multimesh = multi
	lamps.visibility_range_end = 120.0
	add_child(lamps)


func _signpost(at: Vector2, boards: Array) -> void:
	var root := Node3D.new()
	root.name = "Signpost"
	add_child(root)
	root.position = Vector3(at.x, _y(at.x, at.y), at.y)
	root.add_child((load(MODELS + "prop_signpost_v02.glb") as PackedScene).instantiate())
	_cylinder_collider(root.position, 0.18, 2.5)
	var board_scene := load(MODELS + "prop_sign_board_v02.glb") as PackedScene
	for i in range(boards.size()):
		var entry: Array = boards[i]
		var target: Vector2 = entry[2]
		var dir := (target - at).normalized()
		var holder := Node3D.new()
		root.add_child(holder)
		holder.position.y = 2.05 - float(i) * 0.38
		# the board model points along +X; turn it towards the destination
		holder.rotation.y = atan2(-dir.y, dir.x)
		holder.add_child(board_scene.instantiate())
		for face in [-1.0, 1.0]:
			var label := Label3D.new()
			label.text = "%s\n%s" % [entry[0], entry[1]]
			label.font_size = 26
			label.pixel_size = 0.004
			label.outline_size = 0
			label.modulate = Color(0.25, 0.14, 0.07)
			label.double_sided = false
			label.position = Vector3(0.62, 0.0, float(face) * 0.035)
			label.rotation.y = 0.0 if face > 0 else PI
			holder.add_child(label)


## Closed log gate where the north-west road ends: Chapter II will open it.
func _forest_gate() -> void:
	var road := LAYOUT.nearest_road_point(GATE_POSITION.x, GATE_POSITION.y + 4.0)
	var facing := (road - GATE_POSITION).normalized()
	var gate := Node3D.new()
	gate.name = "ForestGate"
	add_child(gate)
	gate.position = Vector3(GATE_POSITION.x, _y(GATE_POSITION.x, GATE_POSITION.y), GATE_POSITION.y)
	gate.rotation.y = atan2(facing.x, facing.y)
	gate.add_child((load(MODELS + "prop_forest_gate_v02.glb") as PackedScene).instantiate())
	var label := Label3D.new()
	label.text = "Forest of Memories\nRừng Ký Ức"
	label.font_size = 40
	label.pixel_size = 0.004
	label.modulate = Color(0.25, 0.14, 0.07)
	label.outline_size = 0
	label.position = Vector3(0, 2.32, 0.15)
	gate.add_child(label)
	var blocker := StaticBody3D.new()
	gate.add_child(blocker)
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(5.6, 3.0, 0.8)
	shape.shape = box
	shape.position = Vector3(0, 1.5, 0)
	blocker.add_child(shape)
	var hint := Area3D.new()
	hint.collision_layer = 0
	hint.collision_mask = 1
	gate.add_child(hint)
	var hint_shape := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = 4.0
	hint_shape.shape = sphere
	hint_shape.position = Vector3(0, 1.0, 2.0)
	hint.add_child(hint_shape)
	hint.body_entered.connect(_on_gate_near.bind(true))
	hint.body_exited.connect(_on_gate_near.bind(false))


func _on_gate_near(node: Node3D, near: bool) -> void:
	if not node.is_in_group("player"):
		return
	var hud := get_tree().get_first_node_in_group("dialogue_ui")
	if hud == null:
		return
	if near:
		hud.show_interaction("Rừng Ký Ức đang bị phong ấn — sẽ mở ở Chương II")
	else:
		hud.hide_interaction()
