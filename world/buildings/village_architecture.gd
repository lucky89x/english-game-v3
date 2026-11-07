extends Node3D
## Places the chibi05 village buildings (tools/chibi05/build_houses_chibi.py).
## Node names, positions and interior doors are kept from the previous layout so quests,
## tests and BuildingTravel keep working; each building is one static GLB + box collision.

const MODELS := "res://assets/environment/village/models/"
## Buildings were too small next to the chibi hero; everything in the core village is scaled up.
const HOUSE_SCALE := 1.45
const LAYOUT := preload("res://world/zones/starter_village/village_layout.gd")
## name: [collision size (w, h, d), door marker (local), lantern point (local)]
const SPECS := {
	"cottage_red": [Vector3(5.3, 3.2, 4.9), Vector3(-1.0, 0, 3.35), Vector3(0.6, 2.6, 2.55)],
	"house_blue": [Vector3(5.9, 6.0, 5.3), Vector3(-1.0, 0, 3.55), Vector3(0.6, 2.6, 2.75)],
	"shop_orange": [Vector3(6.3, 6.0, 5.5), Vector3(-1.0, 0, 3.65), Vector3(0.6, 2.6, 2.85)],
	"library_green": [Vector3(5.5, 6.0, 5.7), Vector3(-1.0, 0, 3.75), Vector3(0.6, 2.6, 2.95)],
	"hall_blue": [Vector3(8.9, 6.6, 7.1), Vector3(0.0, 0, 4.75), Vector3(2.2, 2.9, 3.65)],
	"barn_red": [Vector3(4.9, 3.3, 6.3), Vector3(0.0, 0, 3.95), Vector3(1.7, 2.5, 3.25)],
	"store_slate": [Vector3(4.1, 3.2, 4.5), Vector3(-0.6, 0, 3.15), Vector3(0.6, 2.4, 2.35)],
	"tower": [Vector3(3.6, 8.0, 3.6), Vector3(0.0, 0, 2.6), Vector3(0.9, 2.3, 1.9)],
}

func _ready() -> void:
	var village := get_tree().root.find_child("FantasyVillage", true, false)
	var west := rebuild(village.get_node("Buildings/HouseWest") as Node3D, "house_blue", Vector3(-12, 0, -6))
	var east := rebuild(village.get_node("Buildings/HouseEast") as Node3D, "shop_orange", Vector3(12, 0, -6))
	var north := rebuild(village.get_node("Buildings/HouseNorth") as Node3D, "cottage_red", Vector3(-14, 0, 7))
	var hall := building("VillageHall", "hall_blue", Vector3(-1, 0, -24.5), 0.0)
	var wing := building("HallWing", "library_green", Vector3(12, 0, -24), PI / 2)
	var tower := building("HallWatchTower", "tower", Vector3(-11.5, 0, -24), 0.0)
	var barn := building("FarmBarn", "barn_red", Vector3(-27, 0, 6), 0.0)
	var dock := building("RiverStorehouse", "store_slate", Vector3(20, 0, 1), -PI / 2)
	_build_hamlets()
	hall.get_node("Model").set_meta("banner", "MayorHallBanner")
	for b in [west, east, north, hall, wing, tower, barn, dock]:
		b.set_meta("chibi05", true)
	var travel := Node3D.new()
	travel.name = "BuildingTravel"
	travel.set_script(preload("res://systems/building_travel.gd"))
	add_child(travel)
	travel.register_door(hall, "Nhà trưởng làng", "res://world/interiors/hall_interior.tscn", SPECS["hall_blue"][1] * HOUSE_SCALE)
	travel.register_door(east, "Cửa hàng Ánh Sao", "res://world/interiors/shop_interior.tscn", SPECS["shop_orange"][1] * HOUSE_SCALE)
	travel.register_door(wing, "Thư viện nhỏ", "res://world/interiors/library_interior.tscn", SPECS["library_green"][1] * HOUSE_SCALE)
	var life := Node3D.new()
	life.set_script(preload("res://systems/village_life.gd"))
	add_child(life)
	call_deferred("_trim_small_shadows", get_tree().root.find_child("WorldGeometry", true, false))
	# The old scattered cobbles are replaced by the paved road network (paved_roads.gd).
	var old_road := village.get_node_or_null("Paths/StoneRoad")
	if old_road != null:
		for stone in old_road.get_children():
			if stone is Node3D:
				(stone as Node3D).visible = false


## Performance (measured): shadow passes were ~2/3 of all triangles drawn. Small props
## (flowers, grass, pots, crates under 1.2 m) gain little from a shadow, so they stop casting one.
func _trim_small_shadows(root: Node) -> void:
	if root == null:
		return
	for node in root.find_children("*", "GeometryInstance3D", true, false):
		var geo := node as GeometryInstance3D
		if geo.cast_shadow == GeometryInstance3D.SHADOW_CASTING_SETTING_OFF:
			continue
		var box := geo.get_aabb()
		var size := box.size * geo.global_transform.basis.get_scale()
		if maxf(size.x, maxf(size.y, size.z)) < 1.2:
			geo.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


## Houses of the west hamlet, east orchard and south meadow (VillageLayout.HAMLET).
func _build_hamlets() -> void:
	var landscape := _landscape()
	var root := Node3D.new()
	root.name = "Hamlets"
	add_child(root)
	var index := 0
	for entry in LAYOUT.HAMLET:
		var pos: Vector2 = entry[1]
		var road := LAYOUT.nearest_road_point(pos.x, pos.y)
		var facing := road - pos
		var y := 0.0
		if landscape != null:
			y = landscape.get_height_at(pos.x, pos.y)
			for offset in [Vector2(3, 3), Vector2(-3, 3), Vector2(3, -3), Vector2(-3, -3)]:
				y = minf(y, landscape.get_height_at(pos.x + offset.x, pos.y + offset.y))
		var body := StaticBody3D.new()
		body.name = "HamletHouse%02d" % index
		root.add_child(body)
		body.position = Vector3(pos.x, y - 0.05, pos.y)
		body.rotation.y = atan2(facing.x, facing.y)
		_dress(body, entry[0], float(entry[2]))
		index += 1


func _landscape() -> Node:
	var node: Node = self
	while node != null:
		if node.has_method("get_height_at"):
			return node
		node = node.get_parent()
	return null



## Reuse an existing FantasyHouse node from fantasy_village.tscn (keeps its name/path).
func rebuild(node: Node3D, model: String, point: Vector3) -> Node3D:
	for child in node.get_children():
		child.free()
	node.position = point
	node.scale = Vector3.ONE
	_dress(node, model, HOUSE_SCALE)
	return node


func building(label: String, model: String, point: Vector3, yaw: float) -> Node3D:
	var body := StaticBody3D.new()
	body.name = label
	add_child(body)
	body.position = point
	body.rotation.y = yaw
	_dress(body, model, HOUSE_SCALE)
	return body


func _dress(body: Node3D, model: String, size := 1.0) -> void:
	var spec: Array = SPECS[model]
	var scene := (load(MODELS + "bld_%s_v02.glb" % model) as PackedScene).instantiate() as Node3D
	scene.name = "Model"
	scene.scale = Vector3.ONE * size
	body.add_child(scene)
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = spec[0] * size
	shape.shape = box
	shape.position.y = box.size.y / 2.0
	body.add_child(shape)
	body.set_meta("model", model)
	body.set_meta("lantern_point", spec[2] * size)
