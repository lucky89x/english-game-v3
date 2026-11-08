extends Node3D

const VILLAGER := preload("res://npc/ambient_villager.gd")
var lanterns: Array[Node3D] = []
var elapsed := 0.0

func _ready() -> void:
	name = "VillageLife"
	# Ben now keeps his word-jar stall east of the square (systems/word_market.gd)
	spawn("VillageWalker", "Cleric", [Vector3(-1.6, 0.1, -2), Vector3(-1.6, 0.1, -13)])
	spawn("DockWalker", "Monk", [Vector3(17.5, 0.1, 8), Vector3(18.5, 0.1, 13)])
	spawn("Farmer", "Monk", [Vector3(-12, 0.1, 18), Vector3(-18, 0.1, 19)])
	spawn("LibraryVisitor", "Cleric", [Vector3(3, 0.1, -17), Vector3(-1, 0.1, -18)])
	var hidden := preload("res://npc/elder/elder_npc.tscn").instantiate()
	hidden.name = "ForestStoryKeeper"
	hidden.npc_name = "Bác giữ rừng"
	hidden.dialogue_text = "Cháu có nghe tiếng gió qua những tán cây không? Khi nào thư thả, hãy ghé lại nghe bác kể chuyện về chiếc chuông cũ nhé."
	hidden.set_meta("quest_hook", {"id": "forest_old_bell", "hidden": true, "state": "not_implemented", "discovery": "talk"})
	add_child(hidden)
	hidden.position = Vector3(-20, 0.2, -12)
	hidden.get_node("MissingAssetMarker").text = "Bác giữ rừng"
	var architecture := get_parent()
	for building in [architecture.get_node("VillageHall"), architecture.get_node("RiverStorehouse"), architecture.get_node("FarmBarn")]:
		var pivot := Node3D.new()
		building.add_child(pivot)
		pivot.position = building.get_meta("lantern_point", Vector3(1.5, 2.0, 2.2))
		var lantern := preload("res://assets/Exports/glTF/Lantern_Wall.gltf").instantiate()
		pivot.add_child(lantern)
		lantern.scale = Vector3.ONE * 0.7
		lanterns.append(pivot)

func spawn(label: String, asset: String, points: Array[Vector3]) -> void:
	var actor := CharacterBody3D.new()
	actor.set_script(VILLAGER)
	actor.name = label
	actor.model_name = asset
	actor.route = points
	actor.position = points[0]
	add_child(actor)

func _process(delta: float) -> void:
	elapsed += delta
	for i in range(lanterns.size()):
		lanterns[i].rotation.z = sin(elapsed * 1.3 + i) * 0.035
