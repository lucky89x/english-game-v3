extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var gallery = load("res://tests/batch01/test_interiors.tscn").instantiate()
	root.add_child(gallery)
	await process_frame
	var event := InputEventKey.new()
	event.physical_keycode = KEY_E
	event.pressed = true
	gallery._unhandled_input(event)
	assert(gallery.inside)
	gallery.distance = 21
	gallery.focus = Vector3(0,1,0)
	for angle in [0,90]:
		gallery.yaw = deg_to_rad(angle)
		gallery.update_camera()
		for frame in range(10):
			await process_frame
		await RenderingServer.frame_post_draw
		var error := root.get_texture().get_image().save_png("res://artifacts/batch01/interior_%d.png" % angle)
		assert(error == OK)
	print("PASS GLB interior imported and E preview opened; this is not a walkable doorway test")
	quit()
