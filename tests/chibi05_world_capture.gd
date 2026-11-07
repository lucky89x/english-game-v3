extends SceneTree
## Survey captures of the starter village (needs a real renderer).
## Usage: godot --rendering-driver opengl3 --script res://tests/chibi05_world_capture.gd -- <prefix>
func _initialize() -> void:
	call_deferred("run")

func shot(name: String) -> void:
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://artifacts/chibi05/%s.png" % name)

func get_viewport_camera() -> Camera3D:
	return root.get_camera_3d()


func run() -> void:
	var prefix := "world"
	var args := OS.get_cmdline_user_args()
	if not args.is_empty():
		prefix = args[0]
	root.size = Vector2i(1280, 720)
	var world = load("res://world/main_world.tscn").instantiate()
	root.add_child(world)
	for i in range(60):
		await process_frame
	var hud: Node = world.find_child("DebugHud", true, false)
	if hud is CanvasItem:
		hud.hide()
	for layer in world.find_children("*", "CanvasLayer", true, false):
		layer.visible = false
	var cam := Camera3D.new()
	world.add_child(cam)
	cam.fov = 50
	var gameplay_cam := get_viewport_camera()
	for i in range(10):
		await process_frame
	await shot("%s_gameplay" % prefix)
	print("PERF gameplay draw_calls=%d primitives=%d objects=%d" % [
		Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
		Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),
		Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME)])
	var views := [
		["world", Vector3(0, 95, 125), Vector3(0, 0, 0)],
		["west_hamlet", Vector3(-30, 14, 30), Vector3(-52, 1, 8)],
		["east_orchard", Vector3(22, 12, 30), Vector3(45, 1, 12)],
		["road", Vector3(-3, 3.2, 26), Vector3(0, 0, 10)],
		["overview", Vector3(0, 32, 40), Vector3(0, 0, -2)],
		["houses", Vector3(-2, 6, 6), Vector3(-6, 2, -12)],
		["hall", Vector3(0, 5, -10), Vector3(0, 3, -24)],
		["river", Vector3(4, 5, 4), Vector3(12, 0, 18)],
		["trees", Vector3(-8, 4, 22), Vector3(-20, 2, 4)],
		["elder", Vector3(0, 2.2, 0), Vector3(0, 1, 0)],
	]
	var elder: Node3D = world.find_child("ElderRowan", true, false) as Node3D
	for v in views:
		var pos: Vector3 = v[1]
		var target: Vector3 = v[2]
		if v[0] == "elder" and elder != null:
			var f := elder.global_basis.z.normalized()
			target = elder.global_position + Vector3(0, 0.9, 0)
			pos = target + f * 3.5 + Vector3(1.2, 0.5, 0)
		cam.global_position = pos
		cam.look_at(target, Vector3.UP)
		cam.make_current()
		for i in range(6):
			await process_frame
		await shot("%s_%s" % [prefix, v[0]])
	# villagers
	var vill: Array = get_nodes_in_group("ambient_villagers")
	if not vill.is_empty():
		var a := vill[0] as Node3D
		var tgt := a.global_position + Vector3(0, 0.9, 0)
		cam.global_position = tgt + Vector3(2.0, 0.6, 2.6)
		cam.look_at(tgt, Vector3.UP)
		for i in range(6):
			await process_frame
		await shot("%s_villager" % prefix)
	quit()
