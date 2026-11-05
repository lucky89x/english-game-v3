extends SceneTree
## Renders gameplay captures of the chibi05 hero (needs a real renderer, not --headless).
func _initialize() -> void:
	call_deferred("run")

func shot(name: String) -> void:
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://artifacts/chibi05/%s.png" % name)

func run() -> void:
	root.size = Vector2i(1280, 720)
	var world = load("res://world/main_world.tscn").instantiate()
	root.add_child(world)
	for i in range(40):
		await process_frame
	await shot("game_default_camera")
	var actor := get_first_node_in_group("player") as Node3D
	var cam := Camera3D.new()
	world.add_child(cam)
	cam.fov = 35
	var visual := actor.get_node("VisualRoot") as Node3D
	for spec in [["front", 0.0, "Idle", 0.5], ["q34", 40.0, "Walk", 0.2], ["side", 90.0, "Run", 0.15], ["back", 180.0, "Idle", 0.5], ["wave", 20.0, "Wave", 1.0]]:
		var ang := deg_to_rad(spec[1])
		var forward := visual.global_basis.z.normalized()
		var dir := forward.rotated(Vector3.UP, ang)
		var target := actor.global_position + Vector3(0, -0.1, 0)
		cam.global_position = target + dir * 3.6 + Vector3(0, 0.6, 0)
		cam.look_at(target, Vector3.UP)
		cam.make_current()
		var ap := (actor as PlayerController).animation_player
		ap.play(spec[2])
		ap.seek(spec[3], true)
		ap.pause()
		for i in range(4):
			await process_frame
		await shot("game_" + spec[0])
	quit()
