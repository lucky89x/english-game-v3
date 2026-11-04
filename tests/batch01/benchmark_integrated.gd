extends SceneTree
func _initialize() -> void:
	call_deferred("run")
func run() -> void:
	DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	var world = load(ProjectSettings.get_setting("application/run/main_scene")).instantiate()
	root.add_child(world)
	await process_frame
	var actor = world.get_node("Characters/Player")
	var orbit = world.get_node("OrbitCamera")
	var report := "Rendered GPU test; VSync off; includes physics and orbit camera.\n"
	for size in [Vector2i(1280, 720), Vector2i(1920, 1080)]:
		root.size = size
		DisplayServer.window_set_size(size)
		var warmup := Time.get_ticks_msec()
		while Time.get_ticks_msec() - warmup < 2500:
			await process_frame
		actor.position = Vector3(0, 0.95, 14)
		actor.visual_root.rotation.y = 0
		orbit.target_yaw = 0
		orbit.target_distance = 5
		await create_timer(1.0).timeout
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://artifacts/integration02/game_%d.png" % size.x)
		var samples: Array[float] = []
		var started := Time.get_ticks_usec()
		var previous := started
		Input.action_press("move_forward")
		Input.action_press("run")
		while Time.get_ticks_usec() - started < 15000000:
			var elapsed := (Time.get_ticks_usec() - started) / 1000000.0
			orbit.target_yaw = elapsed * TAU / 5.0
			if elapsed > 2.0:
				Input.action_release("move_forward")
				Input.action_release("run")
			await RenderingServer.frame_post_draw
			await process_frame
			var now := Time.get_ticks_usec()
			samples.append((now - previous) / 1000.0)
			previous = now
		var elapsed_ms := (Time.get_ticks_usec() - started) / 1000.0
		samples.sort()
		report += "%s: %d frames; %.1f FPS; mean %.2f ms; p95 %.2f ms; p99 %.2f ms; draw calls %.0f; primitives %.0f\n" % [size, samples.size(), samples.size() * 1000.0 / elapsed_ms, elapsed_ms / samples.size(), samples[int(samples.size()*0.95)], samples[int(samples.size()*0.99)], Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME), Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)]
	report += "GPU: " + RenderingServer.get_video_adapter_name()
	print(report)
	var file := FileAccess.open("res://artifacts/integration02/render_report.txt", FileAccess.WRITE)
	file.store_string(report)
	quit()


