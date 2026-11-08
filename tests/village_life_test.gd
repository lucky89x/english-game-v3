extends SceneTree
var failed := false
func check(value: bool, message: String) -> void:
	print("PASS: " if value else "FAIL: ", message)
	failed = failed or not value
func _initialize() -> void:
	call_deferred("run")
func run() -> void:
	var world := preload("res://world/main_world.tscn").instantiate()
	root.add_child(world)
	for i in range(3):
		await physics_frame
	var travel := root.find_child("BuildingTravel", true, false)
	var villagers := get_nodes_in_group("ambient_villagers")
	check(villagers.size() == 4, "Four animated ambient NPCs (Ben now keeps his market stall)")
	var starts: Array[Vector3] = []
	for npc in villagers:
		starts.append(npc.global_position)
	for i in range(240):
		await physics_frame
	for i in range(villagers.size()):
		check(villagers[i].global_position.distance_to(starts[i]) > 0.5, "Waypoint movement " + villagers[i].name)
	check(root.find_child("ForestStoryKeeper", true, false).has_meta("quest_hook"), "Hidden NPC quest data")
	var actor := world.get_node("Characters/Player") as CharacterBody3D
	var event := InputEventAction.new()
	event.action = "interact"
	event.pressed = true
	for door_index in [0, 1, 2]:
		actor.global_position = travel.doors[door_index].marker.global_position + Vector3.UP * 0.95
		actor.velocity = Vector3.ZERO
		for i in range(45):
			await physics_frame
		var departure := actor.global_position
		check(travel.nearby == door_index, "Entrance reachable " + str(door_index))
		travel._unhandled_input(event)
		check(travel.active_room != null, "E opens interior " + str(door_index))
		for i in range(60):
			await physics_frame
		check(actor.is_on_floor() and actor.position.y > 0.7, "Interior floor collision")
		if DisplayServer.get_name() != "headless":
			await RenderingServer.frame_post_draw
			root.get_texture().get_image().save_png("res://artifacts/visual_upgrade/interior_%d.png" % door_index)
		Input.action_press("move_forward")
		for i in range(80):
			await physics_frame
		Input.action_release("move_forward")
		check(actor.position.z > -0.5 and actor.position.z < 1.0, "Walk inside and stop at furniture")
		Input.action_press("move_backward")
		for i in range(65):
			await physics_frame
		Input.action_release("move_backward")
		travel._unhandled_input(event)
		check(travel.active_room == null, "E returns to village")
		check(actor.global_position.distance_to(departure) < 0.2, "Exterior position restored")
		for i in range(35):
			await physics_frame
	quit(1 if failed else 0)
