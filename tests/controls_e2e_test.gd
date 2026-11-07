extends SceneTree
## End-to-end controls test: real key/mouse events pushed through the engine input pipeline
## (not Input.action_press shortcuts). Covers WASD, Shift, Space, camera orbit with the right
## AND left mouse button, wheel zoom, E interaction and that dialogue never locks controls.
## Run: godot --headless --path . --script res://tests/controls_e2e_test.gd
var failed := false
var world: Node
var actor: CharacterBody3D
var camera: OrbitCamera


func check(ok: bool, message: String) -> void:
	print("PASS: " if ok else "FAIL: ", message)
	failed = failed or not ok


func _initialize() -> void:
	call_deferred("run")


func key(code: Key, pressed: bool) -> void:
	var event := InputEventKey.new()
	event.physical_keycode = code
	event.keycode = code
	event.pressed = pressed
	Input.parse_input_event(event)
	Input.flush_buffered_events()


func mouse_button(button: MouseButton, pressed: bool) -> void:
	var event := InputEventMouseButton.new()
	event.button_index = button
	event.pressed = pressed
	event.position = Vector2(640, 360)
	event.global_position = event.position
	Input.parse_input_event(event)
	Input.flush_buffered_events()


func mouse_move(relative: Vector2) -> void:
	var event := InputEventMouseMotion.new()
	event.relative = relative
	event.position = Vector2(640, 360) + relative
	event.global_position = event.position
	Input.parse_input_event(event)
	Input.flush_buffered_events()


func frames(count: int) -> void:
	for i in range(count):
		await physics_frame


func planar_distance(a: Vector3, b: Vector3) -> float:
	return Vector2(a.x - b.x, a.z - b.z).length()


func walk_test(code: Key, label: String) -> void:
	var start := actor.global_position
	key(code, true)
	await frames(30)
	var moved := planar_distance(actor.global_position, start)
	key(code, false)
	await frames(25)
	check(moved > 0.8, "%s moves the hero (%.2f m)" % [label, moved])


func orbit_test(button: MouseButton, label: String) -> void:
	var yaw_before := camera.target_yaw
	mouse_button(button, true)
	mouse_move(Vector2(120, 0))
	await frames(2)
	mouse_button(button, false)
	await frames(2)
	check(absf(camera.target_yaw - yaw_before) > 0.2, "%s drag rotates the camera around the hero" % label)
	check(not camera.is_rotating, "%s release stops rotation" % label)
	var after_release := camera.target_yaw
	mouse_move(Vector2(200, 0))
	await frames(2)
	check(is_equal_approx(camera.target_yaw, after_release), "%s: moving the mouse after release does not rotate" % label)


func run() -> void:
	GameState.override_path = "user://test_controls_save.json"
	world = load("res://world/main_world.tscn").instantiate()
	root.add_child(world)
	await frames(30)
	actor = world.get_node("Characters/Player") as CharacterBody3D
	camera = world.get_node("OrbitCamera") as OrbitCamera
	check(actor != null and camera != null, "Player and OrbitCamera exist")
	check(actor.is_on_floor(), "Hero stands on the ground at start")

	await walk_test(KEY_W, "W")
	await walk_test(KEY_S, "S")
	await walk_test(KEY_A, "A")
	await walk_test(KEY_D, "D")

	var start := actor.global_position
	key(KEY_W, true)
	await frames(30)
	var walk_distance := planar_distance(actor.global_position, start)
	key(KEY_W, false)
	await frames(25)
	start = actor.global_position
	key(KEY_SHIFT, true)
	key(KEY_W, true)
	await frames(30)
	var run_distance := planar_distance(actor.global_position, start)
	key(KEY_W, false)
	key(KEY_SHIFT, false)
	await frames(25)
	check(run_distance > walk_distance * 1.2, "Shift+W runs faster (%.2f m vs %.2f m)" % [run_distance, walk_distance])

	await frames(20)
	var ground_y := actor.global_position.y
	key(KEY_SPACE, true)
	await frames(3)
	key(KEY_SPACE, false)
	await frames(12)
	check(actor.global_position.y > ground_y + 0.3, "Space makes the hero jump")
	await frames(90)
	check(actor.is_on_floor(), "Hero lands again after the jump")

	await orbit_test(MOUSE_BUTTON_RIGHT, "Right mouse")
	await orbit_test(MOUSE_BUTTON_LEFT, "Left mouse")

	var distance_before := camera.target_distance
	mouse_button(MOUSE_BUTTON_WHEEL_UP, true)
	mouse_button(MOUSE_BUTTON_WHEEL_UP, false)
	await frames(2)
	check(camera.target_distance < distance_before, "Mouse wheel zooms in")

	# Talk to Tom with the real E key, then confirm movement and camera still work.
	var npc: Node3D = world.get_node("WorldGeometry/FantasyVillage/NPCs/ElderRowan")
	var hud := get_first_node_in_group("dialogue_ui")
	# plain talk (quest finished) must never lock controls; quest menus are covered by lost_letter_quest_test
	get_first_node_in_group("game_state").set_quest_step("lost_letter", "done")
	actor.global_position = npc.global_position + Vector3(0, 0.9, 1.5)
	actor.velocity = Vector3.ZERO
	await frames(15)
	key(KEY_E, true)
	key(KEY_E, false)
	await frames(3)
	check(hud != null and hud.dialogue_panel.visible, "E opens Tom's dialogue")
	await orbit_test(MOUSE_BUTTON_RIGHT, "Camera during dialogue")
	key(KEY_SPACE, true)
	await frames(3)
	key(KEY_SPACE, false)
	await frames(12)
	check(actor.global_position.y > npc.global_position.y + 0.3, "Jump works during dialogue")
	await frames(60)
	key(KEY_E, true)
	key(KEY_E, false)
	await frames(3)
	check(not hud.dialogue_panel.visible, "E closes the dialogue")
	await walk_test(KEY_W, "W after dialogue closes")
	# Walking away closes the dialogue by itself and never leaves the hero locked.
	actor.global_position = npc.global_position + Vector3(0, 0.9, 1.5)
	actor.velocity = Vector3.ZERO
	await frames(15)
	key(KEY_E, true)
	key(KEY_E, false)
	await frames(3)
	check(hud.dialogue_panel.visible, "Dialogue opens again")
	key(KEY_D, true)
	await frames(80)
	key(KEY_D, false)
	await frames(10)
	check(not hud.dialogue_panel.visible, "Walking out of range closes the dialogue")
	await walk_test(KEY_A, "A after walking away")
	world.queue_free()
	quit(1 if failed else 0)
