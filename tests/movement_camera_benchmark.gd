extends SceneTree

const WARMUP_FRAMES := 30
const MOVEMENT_FRAMES := 240
const ROTATION_FRAMES := 240


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var packed_scene := load("res://world/main_world.tscn") as PackedScene
	if packed_scene == null:
		push_error("Cannot load MainWorld")
		quit(1)
		return

	var world := packed_scene.instantiate()
	get_root().add_child(world)
	var player := world.get_node("Characters/Player") as CharacterBody3D
	var orbit_camera := world.get_node("OrbitCamera") as OrbitCamera

	for frame in WARMUP_FRAMES:
		await process_frame

	var start_position := player.global_position
	var start_yaw := orbit_camera.rotation.y
	var start_usec := Time.get_ticks_usec()

	Input.action_press("move_forward")
	Input.action_press("run")
	for frame in MOVEMENT_FRAMES:
		await process_frame
	Input.action_release("run")
	Input.action_release("move_forward")

	var left_down := InputEventMouseButton.new()
	left_down.button_index = MOUSE_BUTTON_RIGHT
	left_down.pressed = true
	orbit_camera._unhandled_input(left_down)
	for frame in ROTATION_FRAMES:
		var motion := InputEventMouseMotion.new()
		motion.relative = Vector2(2.0, 0.0)
		orbit_camera._unhandled_input(motion)
		await process_frame
	var left_up := InputEventMouseButton.new()
	left_up.button_index = MOUSE_BUTTON_RIGHT
	left_up.pressed = false
	orbit_camera._unhandled_input(left_up)

	var elapsed_ms := (Time.get_ticks_usec() - start_usec) / 1000.0
	var measured_frames := MOVEMENT_FRAMES + ROTATION_FRAMES
	var average_ms := elapsed_ms / measured_frames
	var moved_distance := start_position.distance_to(player.global_position)
	var yaw_change := absf(angle_difference(start_yaw, orbit_camera.rotation.y))

	print("BENCHMARK frames=", measured_frames)
	print("BENCHMARK headless_average_ms=", snappedf(average_ms, 0.001))
	print("BENCHMARK simulated_fps=", snappedf(1000.0 / maxf(average_ms, 0.001), 0.1))
	print("BENCHMARK moved_distance=", snappedf(moved_distance, 0.01))
	print("BENCHMARK camera_yaw_change_rad=", snappedf(yaw_change, 0.01))
	print("NOTE: Headless CPU/logic result; use the in-game FPS counter for rendered GPU performance.")

	var passed := moved_distance > 1.0 and yaw_change > 0.2
	world.queue_free()
	quit(0 if passed else 1)
