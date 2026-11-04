extends SceneTree

var failures: Array[String] = []


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var packed_scene := load("res://world/main_world.tscn") as PackedScene
	_check(packed_scene != null, "MainWorld scene loads")
	if packed_scene == null:
		_finish()
		return

	var world := packed_scene.instantiate()
	get_root().add_child(world)
	await process_frame

	var village := world.get_node_or_null("WorldGeometry/FantasyVillage")
	_check(village != null, "Fantasy village is instanced")
	var landscape := world.get_node_or_null("WorldGeometry/StarterVillageEnvironment")
	_check(landscape != null, "Starter Village 3D landscape is instanced")
	if landscape != null:
		var terrain := landscape.get_node_or_null("Terrain") as MeshInstance3D
		var terrain_shape := landscape.get_node_or_null("TerrainBody/CollisionShape3D") as CollisionShape3D
		_check(terrain != null and terrain.mesh != null, "Generated terrain mesh exists")
		_check(terrain_shape != null and terrain_shape.shape != null, "Generated terrain collision exists")
		_check(landscape.get_node_or_null("Zones/VillageSquare") != null, "Village square zone exists")
		_check(landscape.get_node_or_null("Zones/RiverDock") != null, "River dock zone exists")
		_check(landscape.get_node_or_null("Zones/Farm") != null, "Farm zone exists")
		_check(landscape.get_node_or_null("Zones/ForestEdge") != null, "Forest edge zone exists")
		_check(landscape.get_node_or_null("HorizonForest") != null, "360 degree horizon forest exists")
		_check(landscape.get_node_or_null("DistantMountains/MountainN2") != null, "Distant mountain layer exists")
		_check(landscape.get_node_or_null("RiverSystem/WaterBoundary") != null, "River prevents walking through water outside bridge corridor")
	if village != null:
		var buildings := village.get_node_or_null("Buildings")
		_check(buildings != null and buildings.get_child_count() >= 4, "Three houses and wagon exist")
		_check(village.get_node_or_null("Buildings/MarketSquare") != null, "Reusable fantasy market is instanced")
		_check(village.get_node_or_null("Paths/StoneRoad/Stone01") != null, "Stone village road exists")
		_check(village.get_node_or_null("Vegetation/MapleFarNW") != null, "Expanded nature assets are instanced")
		var chest := village.get_node_or_null("InteractiveProps/AnimatedChest")
		_check(chest != null, "Animated Quaternius chest is integrated into F5 MainWorld")
		_check(
			chest != null and chest.get_script() != null
			and chest.get_script().resource_path == "res://scripts/animated_chest.gd",
			"MainWorld chest uses the interaction controller"
		)
		if chest != null:
			var open_clip: String = chest.get("open_animation")
			var close_clip: String = chest.get("close_animation")
			_check(not open_clip.is_empty() and not close_clip.is_empty(), "Chest_Open and Chest_Close clips are detected")
			chest.set("player_in_range", true)
			var interact_event := InputEventAction.new()
			interact_event.action = "interact"
			interact_event.pressed = true
			chest.call("_unhandled_input", interact_event)
			var chest_player := chest.get("animation_player") as AnimationPlayer
			_check(
				chest_player != null and chest_player.current_animation == open_clip,
				"Pressing E starts the real chest opening animation"
			)
		_check(village.get_node_or_null("Pond/Bridge") != null, "Pond bridge exists")
		_check(village.get_node_or_null("NPCs/ElderRowan") != null, "Interactive elder NPC exists")

	_check(world.get_node_or_null("OrbitCamera/PitchPivot/SpringArm3D/Camera3D") != null, "Collision-aware camera exists")
	_check(world.get_node_or_null("Characters/Player") != null, "Player exists")
	_check(InputMap.has_action("interact"), "Interact input exists")
	_check(InputMap.has_action("run"), "Run input exists")
	_check(load("res://main_world.tscn") != null, "MainWorldCompatibility still loads")

	world.queue_free()
	_finish()


func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: ", label)
	else:
		failures.append(label)
		push_error("FAIL: " + label)


func _finish() -> void:
	if failures.is_empty():
		print("SMOKE TEST PASSED")
		quit(0)
	else:
		print("SMOKE TEST FAILED: ", failures)
		quit(1)
