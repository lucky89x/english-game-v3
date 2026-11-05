extends Node3D
## Places the chibi05 village buildings (tools/chibi05/build_houses_chibi.py).
## Node names, positions and interior doors are kept from the previous layout so quests,
## tests and BuildingTravel keep working; each building is one static GLB + box collision.

const MODELS := "res://assets/environment/village/models/"
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
	var north := rebuild(village.get_node("Buildings/HouseNorth") as Node3D, "cottage_red", Vector3(-13, 0, 10))
	var hall := building("VillageHall", "hall_blue", Vector3(-1, 0, -24.5), 0.0)
	var wing := building("HallWing", "library_green", Vector3(12, 0, -24), PI / 2)
	var tower := building("HallWatchTower", "tower", Vector3(-8.6, 0, -24), 0.0)
	var barn := building("FarmBarn", "barn_red", Vector3(-24, 0, 14), 0.0)
	var dock := building("RiverStorehouse", "store_slate", Vector3(20, 0, 1), -PI / 2)
	hall.get_node("Model").set_meta("banner", "MayorHallBanner")
	for b in [west, east, north, hall, wing, tower, barn, dock]:
		b.set_meta("chibi05", true)
	var travel := Node3D.new()
	travel.name = "BuildingTravel"
	travel.set_script(preload("res://systems/building_travel.gd"))
	add_child(travel)
	travel.register_door(hall, "Nhà trưởng làng", "res://world/interiors/hall_interior.tscn", SPECS["hall_blue"][1])
	travel.register_door(east, "Cửa hàng Ánh Sao", "res://world/interiors/shop_interior.tscn", SPECS["shop_orange"][1])
	travel.register_door(wing, "Thư viện nhỏ", "res://world/interiors/library_interior.tscn", SPECS["library_green"][1])
	var life := Node3D.new()
	life.set_script(preload("res://systems/village_life.gd"))
	add_child(life)
	_tint_path_stones(village.get_node_or_null("Paths/StoneRoad"))


## The imported cobbles are near-white/blue; warm them towards REF_04's lilac-grey stone.
func _tint_path_stones(root: Node) -> void:
	if root == null:
		return
	for node in root.find_children("*", "MeshInstance3D", true, false):
		var mesh := (node as MeshInstance3D).mesh
		if mesh == null:
			continue
		for surface in mesh.get_surface_count():
			var material := (node as MeshInstance3D).get_active_material(surface)
			if material is StandardMaterial3D:
				var tinted := material.duplicate() as StandardMaterial3D
				tinted.albedo_color = Color(0.74, 0.66, 0.68)
				(node as MeshInstance3D).set_surface_override_material(surface, tinted)


## Reuse an existing FantasyHouse node from fantasy_village.tscn (keeps its name/path).
func rebuild(node: Node3D, model: String, point: Vector3) -> Node3D:
	for child in node.get_children():
		child.free()
	node.position = point
	node.scale = Vector3.ONE
	_dress(node, model)
	return node


func building(label: String, model: String, point: Vector3, yaw: float) -> Node3D:
	var body := StaticBody3D.new()
	body.name = label
	add_child(body)
	body.position = point
	body.rotation.y = yaw
	_dress(body, model)
	return body


func _dress(body: Node3D, model: String) -> void:
	var spec: Array = SPECS[model]
	var scene := (load(MODELS + "bld_%s_v02.glb" % model) as PackedScene).instantiate() as Node3D
	scene.name = "Model"
	body.add_child(scene)
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = spec[0]
	shape.shape = box
	shape.position.y = box.size.y / 2.0
	body.add_child(shape)
	body.set_meta("model", model)
	body.set_meta("lantern_point", spec[2])
