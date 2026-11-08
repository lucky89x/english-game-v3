extends Node3D
## Places along the river and in the south-east forest (data in VillageLayout):
## the extra bridges (Cầu Trại Gỗ, Cầu Cuối Sông), Sam's fishing pier and the lumber camp.
## The village bridge (Pond) and the south bridge (BridgeRepairQuest) are built elsewhere.

const LAYOUT := preload("res://world/zones/starter_village/village_layout.gd")
const PROPS := "res://assets/Exports/glTF/"
const BRIDGE_LENGTH := 11.5
const PIER := Vector2(3.6, 60.0)
const CAMP := Vector2(38.0, 85.0)

var landscape: Node
var body: StaticBody3D


func build(height_source: Node) -> void:
	landscape = height_source
	body = StaticBody3D.new()
	body.name = "AreaCollision"
	add_child(body)
	for entry in LAYOUT.BRIDGES:
		var at: Vector2 = entry[0]
		if at.y > 60.0:                      # the two new crossings south of the meadow
			_bridge(at, String(entry[1]))
	_fishing_pier()
	_lumber_camp()


func _y(x: float, z: float) -> float:
	return landscape.get_height_at(x, z) if landscape != null else 0.0


func _bridge(at: Vector2, title: String) -> void:
	var half := BRIDGE_LENGTH / 2.0
	var bridge := (load("res://world/props/chibi_bridge.tscn") as PackedScene).instantiate() as Node3D
	bridge.name = title.replace(" ", "")
	add_child(bridge)
	bridge.position = Vector3(at.x, (_y(at.x - half, at.y) + _y(at.x + half, at.y)) / 2.0, at.y)
	bridge.rotation.y = PI / 2.0


func _prop(file: String, at: Vector3, yaw := 0.0, scale_by := 1.0) -> Node3D:
	var scene := load(file if file.begins_with("res://") else PROPS + file) as PackedScene
	if scene == null:
		return null
	var node := scene.instantiate() as Node3D
	add_child(node)
	node.position = at
	node.rotation.y = yaw
	node.scale = Vector3.ONE * scale_by
	return node


func _box_collider(at: Vector3, size: Vector3) -> void:
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = size
	shape.shape = box
	shape.position = at + Vector3(0, size.y / 2.0, 0)
	body.add_child(shape)


func _sign(at: Vector3, text: String) -> void:
	var label := Label3D.new()
	label.text = text
	label.font_size = 40
	label.pixel_size = 0.005
	label.modulate = Color(0.3, 0.17, 0.07)
	label.outline_size = 12
	label.outline_modulate = Color(1, 0.95, 0.82)
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.position = at
	add_child(label)


## Sam's fishing pier: a short wooden jetty out into the river with a bench and barrels.
func _fishing_pier() -> void:
	var y := _y(PIER.x, PIER.y)
	var pier := _prop("res://world/props/wooden_bridge.tscn", Vector3(PIER.x + 1.6, y + 0.1, PIER.y), PI / 2.0)
	if pier != null:
		pier.name = "FishingPier"
		pier.scale = Vector3(0.7, 0.7, 0.9)
	_prop("Bench.gltf", Vector3(PIER.x - 1.2, y, PIER.y + 2.0), PI)
	_prop("Barrel.gltf", Vector3(PIER.x - 1.6, y, PIER.y - 1.8))
	_prop("Bucket_Wooden_1.gltf", Vector3(PIER.x - 0.8, y, PIER.y - 2.1))
	_box_collider(Vector3(PIER.x - 1.6, y, PIER.y - 1.8), Vector3(0.8, 1.0, 0.8))
	_sign(Vector3(PIER.x - 1.5, y + 2.4, PIER.y), "Fishing Pier\nBến câu cá")


## Lumber camp in the south-east pines: log piles, a workbench, a cooking pot and a torch.
func _lumber_camp() -> void:
	var y := _y(CAMP.x, CAMP.y)
	for i in range(4):
		var a := float(i) * 0.9 - 1.3
		_prop("Anvil_Log.gltf", Vector3(CAMP.x - 3.5, y + float(i % 2) * 0.35, CAMP.y + a), PI / 2.0, 1.3)
	_box_collider(Vector3(CAMP.x - 3.5, y, CAMP.y), Vector3(1.4, 0.9, 3.4))
	_prop("Workbench.gltf", Vector3(CAMP.x + 2.5, y, CAMP.y - 2.0), -PI / 2.0)
	_box_collider(Vector3(CAMP.x + 2.5, y, CAMP.y - 2.0), Vector3(1.2, 1.0, 2.0))
	_prop("Axe_Bronze.gltf", Vector3(CAMP.x + 2.5, y + 1.0, CAMP.y - 2.4), 0.4)
	_prop("Cauldron.gltf", Vector3(CAMP.x, y, CAMP.y + 1.0))
	var torch := _prop("Torch_Metal.gltf", Vector3(CAMP.x + 1.2, y, CAMP.y + 2.2))
	var fire := OmniLight3D.new()
	fire.light_color = Color(1.0, 0.65, 0.3)
	fire.light_energy = 1.4
	fire.omni_range = 6.0
	fire.position = Vector3(CAMP.x, y + 1.2, CAMP.y + 1.0)
	add_child(fire)
	_prop("Barrel_Apples.gltf", Vector3(CAMP.x + 3.0, y, CAMP.y + 1.5))
	_sign(Vector3(CAMP.x, y + 2.8, CAMP.y - 3.5), "Lumber Camp\nTrại gỗ")
	if torch != null:
		torch.scale = Vector3.ONE * 1.2
