extends SceneTree
## Captures the chibi05 props in game (needs a real renderer): bridge, signpost, lamps,
## forest gate and Tom's house interior.
func _initialize() -> void:
	call_deferred("run")

func shot(name: String) -> void:
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://artifacts/chibi05/props_%s.png" % name)

func run() -> void:
	root.size = Vector2i(1280, 720)
	var world = load("res://world/main_world.tscn").instantiate()
	root.add_child(world)
	for i in range(60):
		await process_frame
	for layer in world.find_children("*", "CanvasLayer", true, false):
		layer.visible = false
	var cam := Camera3D.new()
	world.add_child(cam)
	cam.fov = 50
	for v in [["bridge", Vector3(11, 4.2, 17.5), Vector3(10, 0.6, 7)], ["signpost", Vector3(5.5, 2.6, 17.5), Vector3(2.6, 1.6, 13.5)],
			["gate", Vector3(-23, 3.2, -66), Vector3(-24, 2.2, -77)], ["lamps", Vector3(-1, 3, 34), Vector3(-2, 1, 52)]]:
		cam.global_position = v[1]
		cam.look_at(v[2], Vector3.UP)
		cam.make_current()
		for i in range(6):
			await process_frame
		await shot(v[0])
	var travel = world.find_child("BuildingTravel", true, false)
	var actor := world.get_node("Characters/Player") as Node3D
	actor.global_position = travel.doors[0].marker.global_position + Vector3.UP
	await physics_frame
	travel.travel(0)
	for i in range(20):
		await process_frame
	var room: Node3D = travel.active_room
	cam.global_position = room.global_position + Vector3(0, 6.5, 7.5)
	cam.look_at(room.global_position + Vector3(0, 0.5, -1), Vector3.UP)
	cam.make_current()
	for i in range(6):
		await process_frame
	await shot("interior")
	quit()
