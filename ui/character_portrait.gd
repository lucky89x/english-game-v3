extends SubViewport

func _ready() -> void:
	size = Vector2i(256, 256)
	own_world_3d = true
	transparent_bg = true
	var model = load("res://assets/redesign03/ngoc_adventurer.glb").instantiate()
	add_child(model)
	for animation in model.find_children("*", "AnimationPlayer", true, false):
		animation.play("Idle")
		animation.advance(0.1)
		animation.pause()
	var camera := Camera3D.new()
	add_child(camera)
	camera.position = Vector3(0, 1.37, 1.3)
	camera.look_at(Vector3(0, 1.25, 0))
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.size = 0.80
	var light := DirectionalLight3D.new()
	add_child(light)
	light.rotation_degrees = Vector3(-25, -25, 0)
	light.light_energy = 1.3
	var environment := WorldEnvironment.new()
	environment.environment = Environment.new()
	environment.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.environment.ambient_light_color = Color(0.85, 0.88, 1)
	environment.environment.ambient_light_energy = 0.7
	add_child(environment)
	await RenderingServer.frame_post_draw
	await RenderingServer.frame_post_draw
	render_target_update_mode = SubViewport.UPDATE_DISABLED
