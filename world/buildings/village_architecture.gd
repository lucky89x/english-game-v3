extends Node3D

const KIT := "res://assets/Medieval Village MegaKit[Standard]/glTF/"
const HOUSE := preload("res://world/buildings/fantasy_house.tscn")

func _ready() -> void:
	var village := get_tree().root.find_child("FantasyVillage", true, false)
	var west := village.get_node("Buildings/HouseWest") as Node3D
	west.position = Vector3(-12, 0, -6)
	west.scale = Vector3(1.45, 1.35, 1.35)
	add_upper_storey(west)
	tint_roof(west, Color(0.27, 0.43, 0.32))
	module(west, "Roof_2x4_RoundTile", Vector3(0, 2.15, 2.5), Vector3(1.1, 0.55, 0.7))
	for x in [-2.0, 2.0]:
		module(west, "Prop_Support", Vector3(x, 0, 3.0), Vector3.ONE)
	var east := village.get_node("Buildings/HouseEast") as Node3D
	east.position = Vector3(12, 0, -6)
	east.scale = Vector3(1.6, 1.35, 1.4)
	add_upper_storey(east)
	tint_roof(east, Color(0.63,0.31,0.13))
	module(east, "Roof_2x4_RoundTile", Vector3(0, 2.1, 2.8), Vector3(1.2, 0.55, 0.9))
	module(east, "Prop_Crate", Vector3(1.6, 0, 3.4), Vector3.ONE)
	var north := village.get_node("Buildings/HouseNorth") as Node3D
	north.position = Vector3(-13, 0, 10)
	north.scale = Vector3(1.25, 1.4, 1.2)
	tint_roof(north, Color(0.48, 0.30, 0.19))
	var hall := house("VillageHall", Vector3(-1, 0, -24), Vector3(2.15, 1.45, 1.85))
	add_upper_storey(hall)
	decorate_facade(hall, true)
	tint_roof(hall, Color(0.21, 0.39, 0.49))
	var wing := house("HallWing", Vector3(12, 0, -24), Vector3(1.25, 1.3, 1.4))
	wing.rotation.y = PI / 2
	decorate_facade(wing, false)
	tint_roof(wing, Color(0.21, 0.39, 0.49))
	# A two-storey masonry tower assembled from separate wall and roof modules.
	var tower := StaticBody3D.new()
	tower.name = "HallWatchTower"
	add_child(tower)
	tower.position = Vector3(-6, 0, -24)
	for level in range(3):
		for side in range(4):
			for column in [-1.0, 1.0]:
				var angle := float(side) * PI / 2
				var pos := Vector3(column, float(level) * 3.12, 2).rotated(Vector3.UP, angle)
				var wall := module(tower, "Wall_UnevenBrick_Window_Wide_Round", pos, Vector3.ONE)
				wall.rotation.y = angle
	var tower_roof := module(tower, "Roof_Tower_RoundTiles", Vector3(0, 9.36, 0), Vector3.ONE)
	paint_tiles(tower_roof, Color(0.21,0.39,0.49))
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(4.2, 11, 4.2)
	shape.shape = box
	shape.position.y = 5.5
	tower.add_child(shape)
	var barn := house("FarmBarn", Vector3(-24, 0, 14), Vector3(1.2, 0.95, 1.6))
	tint_roof(barn, Color(0.65, 0.68, 0.55))
	module(barn, "Prop_Wagon", Vector3(0, 0, 3.6), Vector3.ONE * 0.7)
	var dock := house("RiverStorehouse", Vector3(20, 0, 1), Vector3(0.95, 0.95, 1.1))
	dock.rotation.y = -PI / 2
	tint_roof(dock, Color(0.6, 0.65, 0.7))
	module(dock, "Prop_Crate", Vector3(-1, 0, 3), Vector3.ONE)
	for building in [west,east,north,barn,dock]:
		decorate_facade(building, false)
	var travel := Node3D.new()
	travel.name = "BuildingTravel"
	travel.set_script(preload("res://systems/building_travel.gd"))
	add_child(travel)
	travel.register_door(hall, "Nhà trưởng làng", "res://world/interiors/hall_interior.tscn")
	travel.register_door(east, "Cửa hàng Ánh Sao", "res://world/interiors/shop_interior.tscn")
	travel.register_door(wing, "Thư viện nhỏ", "res://world/interiors/library_interior.tscn")
	var life := Node3D.new()
	life.set_script(preload("res://systems/village_life.gd"))
	add_child(life)

func house(label: String, point: Vector3, size: Vector3) -> Node3D:
	var building := HOUSE.instantiate() as Node3D
	building.name = label
	add_child(building)
	building.position = point
	building.scale = size
	return building

func module(parent: Node3D, asset: String, point: Vector3, size: Vector3) -> Node3D:
	var model := (load(KIT + asset + ".gltf") as PackedScene).instantiate() as Node3D
	parent.add_child(model)
	model.position = point
	model.scale = size
	return model

func tint_roof(building: Node3D, color: Color) -> void:
	paint_tiles(building.get_node("Architecture/Roof"), color)


func paint_tiles(model: Node3D, color: Color) -> void:
	for mesh in model.find_children("*", "MeshInstance3D", true, false):
		for surface in range(mesh.mesh.get_surface_count()):
			var original: Material = mesh.get_active_material(surface)
			if original is StandardMaterial3D and original.albedo_texture != null:
				var material := ShaderMaterial.new()
				material.shader = preload("res://assets/materials/roof_palette.gdshader")
				material.set_shader_parameter("roof_texture",original.albedo_texture)
				material.set_shader_parameter("tile_color",color)
				mesh.set_surface_override_material(surface,material)


# A real second storey assembled from the imported wall/window modules.
# The ground-floor door and its gameplay marker remain at the same local point.
func add_upper_storey(building: Node3D) -> void:
	var architecture := building.get_node("Architecture")
	architecture.get_node("Roof").position.y += 3.12
	architecture.get_node("Chimney").position.y += 3.12
	for side in range(4):
		var angle := float(side)*PI/2.0
		for x in [-1.0,1.0]:
			var wall := module(building,"Wall_Plaster_Window_Wide_Round",Vector3(x,3.12,2).rotated(Vector3.UP,angle),Vector3.ONE)
			wall.rotation.y=angle
			var window := module(building,"Window_Wide_Round1",Vector3(x,3.12,2.04).rotated(Vector3.UP,angle),Vector3.ONE)
			window.rotation.y=angle
			var shutters := module(building,"WindowShutters_Wide_Round_Open",Vector3(x,3.12,2.07).rotated(Vector3.UP,angle),Vector3.ONE)
			shutters.rotation.y=angle
	for x in [-2.0,2.0]:
		for z in [-2.0,2.0]:
			module(building,"Corner_Exterior_Wood",Vector3(x,3.12,z),Vector3.ONE)
	var collision := building.get_node("CollisionShape3D") as CollisionShape3D
	var shape := collision.shape.duplicate() as BoxShape3D
	shape.size.y += 3.12
	collision.shape = shape
	collision.position.y = shape.size.y/2.0
	# Upper gallery occupies the window side, clear above the ground-floor door.
	module(building,"Floor_WoodDark",Vector3(0,3.12,2.55),Vector3(2,1,0.6))
	var balcony_collision := CollisionShape3D.new()
	var balcony_shape := BoxShape3D.new()
	balcony_shape.size=Vector3(4,0.16,1.2)
	balcony_collision.shape=balcony_shape
	balcony_collision.position=Vector3(0,3.08,2.55)
	building.add_child(balcony_collision)
	for x in [-1.0,1.0]:
		module(building,"Balcony_Cross_Straight",Vector3(x,3.12,2.15),Vector3.ONE)
	for x in [-2.0,2.0]:
		var rail := module(building,"Balcony_Cross_Straight",Vector3(x-signf(x),3.12,2.55),Vector3(0.6,1,1))
		rail.rotation.y = signf(x)*PI/2
		module(building,"Prop_Support",Vector3(x,0.35,1.9),Vector3(1,1,0.62))

func decorate_facade(building: Node3D, civic: bool) -> void:
	# Imported lanterns, potted flowers and signs give each doorway a readable scale.
	for x in [-1.8,1.8]:
		prop(building,"Lantern_Wall",Vector3(x,1.8,2.1),Vector3.ONE*0.45)
		var pot := prop(building,"Pot_1",Vector3(x,0.0,2.65),Vector3.ONE*1.7)
		var flowers := (load("res://assets/glTF/Bush_Common_Flowers.gltf") as PackedScene).instantiate() as Node3D
		pot.add_child(flowers)
		flowers.position.y=0.15
		flowers.scale=Vector3.ONE*0.23
	if civic:
		var banner := prop(building,"Banner_1",Vector3(-0.65,5.2,2.15),Vector3.ONE*0.85)
		banner.name="MayorHallBanner"
		prop(building,"Bench",Vector3(2.85,0,1.4),Vector3.ONE*0.7).rotation.y=PI/2
	else:
		prop(building,"Barrel",Vector3(2.5,0,1.7),Vector3.ONE*0.6)

func prop(parent: Node3D, asset: String, point: Vector3, size: Vector3) -> Node3D:
	var path := "res://assets/Exports/glTF/"+asset+".gltf"
	if not ResourceLoader.exists(path):
		push_warning("Missing facade prop: "+path)
		return Node3D.new()
	var model := (load(path) as PackedScene).instantiate() as Node3D
	parent.add_child(model)
	model.position=point
	model.scale=size
	return model
