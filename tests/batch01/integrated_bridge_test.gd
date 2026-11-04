extends SceneTree
var failed := false
func _initialize() -> void:
	call_deferred("run")
func check(ok: bool, message: String) -> void:
	print("PASS " if ok else "FAIL ", message)
	failed = failed or not ok
func run() -> void:
	await test_bridge()
	quit(1 if failed else 0)
func test_bridge() -> void:
	var arena := Node3D.new()
	root.add_child(arena)
	var bridge := (load("res://world/props/wooden_bridge.tscn") as PackedScene).instantiate()
	arena.add_child(bridge)
	var ground := StaticBody3D.new()
	arena.add_child(ground)
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size=Vector3(20,0.2,24)
	shape.shape=box
	shape.position.y=-0.3
	ground.add_child(shape)
	var actor := CharacterBody3D.new()
	arena.add_child(actor)
	var capsule := CapsuleShape3D.new()
	capsule.radius=0.3
	capsule.height=1.8
	var body_shape := CollisionShape3D.new()
	body_shape.shape=capsule
	actor.add_child(body_shape)
	actor.position=Vector3(0,0.75,-5.5)
	var highest := 0.0
	for direction in [1.0,-1.0]:
		for frame in range(240):
			await physics_frame
			actor.velocity=Vector3(0,-2,direction*3)
			actor.move_and_slide()
			highest=maxf(highest,actor.position.y)
		check(actor.position.z>5 if direction>0 else actor.position.z < -5,"MainWorld bridge crossing direction "+str(direction)+" end="+str(actor.position))
	check(highest>1.35,"Actor followed curved deck, not ground below bridge")
	arena.queue_free()

