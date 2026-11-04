extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var world = load("res://world/main_world.tscn").instantiate()
	root.add_child(world)
	await physics_frame
	var actor = world.get_node("Characters/Player")
	world.get_node("OrbitCamera").process_mode = Node.PROCESS_MODE_DISABLED
	var camera := Camera3D.new()
	world.add_child(camera)
	camera.position = Vector3(10, 10, 20)
	camera.current = true
	actor.position = Vector3(3.5, 1.2, 7)
	actor.velocity = Vector3.ZERO
	for i in range(30):
		await physics_frame
	Input.action_press("move_right")
	for i in range(190):
		await physics_frame
	Input.action_release("move_right")
	print("Bridge crossing end: ", actor.position)
	for i in range(actor.get_slide_collision_count()):
		var collision = actor.get_slide_collision(i)
		print("Collision: ", collision.get_collider().get_path(), " at ", collision.get_position(), " normal ", collision.get_normal())
	var passed: bool = actor.position.x > 16.0 and actor.position.y > 0.4
	print("PASS: walk across bridge" if passed else "FAIL: walk across bridge")
	Input.action_press("move_left")
	for i in range(230):
		await physics_frame
	Input.action_release("move_left")
	var returned: bool = actor.position.x < 5.0
	print("Return end: ", actor.position)
	for i in range(actor.get_slide_collision_count()):
		var collision = actor.get_slide_collision(i)
		print("Return collision: ", collision.get_collider().get_path(), " at ", collision.get_position())
	print("PASS: return across bridge" if returned else "FAIL: return across bridge")
	passed = passed and returned
	quit(0 if passed else 1)
