extends SceneTree

const OUTPUT_DIR := "res://artifacts/visual_upgrade"
const VIEWPOINTS := [
	{
		"name": "01_village_square",
		"position": Vector3(13.5, 10.5, 17.5),
		"target": Vector3(0.0, 1.6, 1.5),
	},
	{
		"name": "02_river_dock",
		"position": Vector3(25.0, 9.0, 19.0),
		"target": Vector3(12.0, 1.1, 9.5),
	},
	{
		"name": "03_farm",
		"position": Vector3(-3.0, 10.0, 28.0),
		"target": Vector3(-16.0, 1.5, 15.0),
	},
	{
		"name": "04_forest_edge",
		"position": Vector3(-6.0, 9.0, -4.0),
		"target": Vector3(-18.0, 2.0, -17.0),
	},
]


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	Engine.max_fps = 0
	var packed := load("res://world/main_world.tscn") as PackedScene
	if packed == null:
		push_error("Cannot load MainWorld for rendered capture")
		quit(1)
		return

	var world := packed.instantiate()
	get_root().add_child(world)
	for frame in range(90):
		await process_frame

	var orbit := world.get_node("OrbitCamera") as Node3D
	orbit.process_mode = Node.PROCESS_MODE_DISABLED
	var camera := world.get_node("OrbitCamera/PitchPivot/SpringArm3D/Camera3D") as Camera3D
	camera.top_level = true
	camera.current = true
	camera.fov = 54.0

	for viewpoint in VIEWPOINTS:
		camera.global_position = viewpoint.position
		camera.look_at(viewpoint.target, Vector3.UP)
		for frame in range(45):
			await process_frame
		await RenderingServer.frame_post_draw
		var image := get_root().get_texture().get_image()
		var output_path := "%s/%s.png" % [OUTPUT_DIR, viewpoint.name]
		var error := image.save_png(output_path)
		if error != OK:
			push_error("Could not save capture: " + output_path)

	var frame_samples: Array[float] = []
	var fps_samples: Array[float] = []
	var start_usec := Time.get_ticks_usec()
	var previous_usec := start_usec
	for frame in range(360):
		var angle := float(frame) / 360.0 * TAU
		camera.global_position = Vector3(cos(angle) * 19.0, 8.5, sin(angle) * 19.0)
		camera.look_at(Vector3(0, 1.5, 2), Vector3.UP)
		await process_frame
		var now_usec := Time.get_ticks_usec()
		frame_samples.append((now_usec - previous_usec) / 1000.0)
		fps_samples.append(float(Engine.get_frames_per_second()))
		previous_usec = now_usec

	var total_ms := 0.0
	var minimum_fps := 100000.0
	var total_fps := 0.0
	for sample in frame_samples:
		total_ms += sample
	for sample in fps_samples:
		minimum_fps = minf(minimum_fps, sample)
		total_fps += sample
	var average_ms := total_ms / maxf(frame_samples.size(), 1.0)
	var average_fps := total_fps / maxf(fps_samples.size(), 1.0)
	var measured_fps := 1000.0 / maxf(average_ms, 0.001)
	var draw_calls := Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
	var objects := Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME)
	var report := (
		"EnglishQuestV3 landscape rendered benchmark\n"
		+ "Renderer: %s\n" % RenderingServer.get_video_adapter_name()
		+ "Resolution: %s\n" % get_root().get_visible_rect().size
		+ "Frames: %d\n" % frame_samples.size()
		+ "Average frame time: %.3f ms\n" % average_ms
		+ "Measured FPS: %.1f\n" % measured_fps
		+ "Engine FPS average: %.1f\n" % average_fps
		+ "Engine FPS minimum sample: %.1f\n" % minimum_fps
		+ "Draw calls (last frame): %d\n" % int(draw_calls)
		+ "Rendered objects (last frame): %d\n" % int(objects)
	)
	print(report)
	var report_file := FileAccess.open(OUTPUT_DIR + "/render_report.txt", FileAccess.WRITE)
	if report_file != null:
		report_file.store_string(report)
		report_file.close()
	world.queue_free()
	quit(0)
