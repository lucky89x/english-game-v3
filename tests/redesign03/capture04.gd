extends SceneTree

const OUTPUT_DIR := "res://artifacts/redesign04"
const VIEWPOINTS := [{"name":"05_hall", "position":Vector3(12,12,-9), "target":Vector3(-1,4,-24)},
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

	world.queue_free()
	quit(0)

