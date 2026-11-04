extends Node3D

@export_enum("hall", "shop", "library") var room_type := "hall"
const KIT := "res://assets/Medieval Village MegaKit[Standard]/glTF/"
const PROPS := "res://assets/Exports/glTF/"

func _ready() -> void:
	for x in range(-4, 5, 2):
		for z in range(-4, 5, 2):
			prop(KIT + "Floor_WoodDark.gltf", Vector3(x, -0.1, z))
	box(Vector3(10, 0.2, 10), Vector3(0, -0.1, 0))
	for x in range(-4, 5, 2):
		prop(KIT + "Wall_Plaster_Window_Wide_Round.gltf", Vector3(x, 0, -5))
	box(Vector3(10, 3.2, 0.2), Vector3(0, 1.6, -5))
	for side in [-1.0, 1.0]:
		for z in range(-4, 5, 2):
			var wall := prop(KIT + "Wall_Plaster_Straight.gltf", Vector3(side*5, 0, z))
			wall.rotation.y = side * PI/2
		box(Vector3(0.2, 3.2, 10), Vector3(side*5, 1.6, 0))
	box(Vector3(10, 1, 0.2), Vector3(0, 0.5, 5))
	prop(PROPS + "Table_Large.gltf", Vector3(0, 0, -1.5))
	box(Vector3(2.7, 1.1, 1.5), Vector3(0, 0.55, -1.5))
	for x in [-2.0, 2.0]:
		prop(PROPS + "Chair_1.gltf", Vector3(x, 0, -1.5))
	prop(PROPS + "Bookcase_2.gltf", Vector3(-3.2, 0, -4.2))
	for shelf_y in [0.65, 1.25, 1.85]:
		prop(PROPS + "BookGroup_Medium_1.gltf", Vector3(-3.2, shelf_y, -4.0))
	box(Vector3(2.0, 2.8, 0.8), Vector3(-3.2, 1.4, -4.2))
	prop(PROPS + "Book_Stack_1.gltf", Vector3(-0.4, 1.0, -1.5))
	prop(PROPS + "CandleStick_Triple.gltf", Vector3(0.6, 1.0, -1.5))
	var bench := prop(PROPS + "Bench.gltf", Vector3(-4, 0, 0.5))
	bench.rotation.y = PI/2
	box(Vector3(0.9, 1, 2.2), Vector3(-4, 0.5, 0.5))
	prop(PROPS + "Pot_1.gltf", Vector3(-4, 0, 3))
	var plant := prop("res://assets/glTF/Bush_Common.gltf", Vector3(-4, 0.4, 3))
	plant.scale = Vector3.ONE * 0.25
	var rug := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(3.5, 2.5)
	var fabric := StandardMaterial3D.new()
	fabric.albedo_color = Color(0.35, 0.13, 0.09) if room_type == "hall" else Color(0.08, 0.25, 0.3)
	fabric.roughness = 1.0
	plane.material = fabric
	rug.mesh = plane
	rug.position = Vector3(0, 0.015, 1.0)
	add_child(rug)
	if room_type == "hall":
		prop(PROPS + "Bed_Twin1.gltf", Vector3(3.3, 0, -3.5))
		box(Vector3(2, 0.8, 3), Vector3(3.3, 0.4, -3.5))
	elif room_type == "shop":
		prop(PROPS + "Shelf_Small_Bottles.gltf", Vector3(3.3, 0, -4.2))
		prop(PROPS + "Crate_Wooden.gltf", Vector3(3.5, 0, 1))
		box(Vector3(1.2, 1.2, 1.2), Vector3(3.5, 0.6, 1))
		prop(PROPS + "Potion_1.gltf", Vector3(0, 1.0, -1.5))
	else:
		prop(PROPS + "Bookcase_2.gltf", Vector3(3.2, 0, -4.2))
		for shelf_y in [0.65, 1.25, 1.85]:
			prop(PROPS + "BookGroup_Medium_2.gltf", Vector3(3.2, shelf_y, -4.0))
		box(Vector3(2, 2.8, 0.8), Vector3(3.2, 1.4, -4.2))
		prop(PROPS + "BookStand.gltf", Vector3(3, 0, 0))
	if room_type != "hall":
		var keeper := CharacterBody3D.new()
		keeper.set_script(preload("res://npc/ambient_villager.gd"))
		keeper.model_name = "Monk" if room_type == "shop" else "Cleric"
		keeper.position = Vector3(0, 0.1, -3.4)
		add_child(keeper)
	var light := OmniLight3D.new()
	light.position = Vector3(0, 3.5, 0)
	light.omni_range = 12
	light.light_color = Color(1, 0.8, 0.55)
	light.light_energy = 1.8
	add_child(light)
	var sign := Label3D.new()
	sign.text = "Nhấn E gần lối vào để trở lại làng"
	sign.position = Vector3(0, 1.5, 4.4)
	sign.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	sign.font_size = 28
	add_child(sign)

func prop(path: String, point: Vector3) -> Node3D:
	var model := (load(path) as PackedScene).instantiate() as Node3D
	add_child(model)
	model.position = point
	return model

func box(size: Vector3, point: Vector3) -> void:
	var body := StaticBody3D.new()
	var collider := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collider.shape = shape
	body.add_child(collider)
	add_child(body)
	body.position = point
