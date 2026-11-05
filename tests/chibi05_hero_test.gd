extends SceneTree
## Validates the chibi05 Ngoc hero in MainWorld: face controller, jump/fall/land and joy face.
var failed := false

func check(ok: bool, message: String) -> void:
	print("PASS: " if ok else "FAIL: ", message)
	failed = failed or not ok

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var world = load("res://world/main_world.tscn").instantiate()
	root.add_child(world)
	for i in range(20):
		await physics_frame
	var actor := get_first_node_in_group("player") as PlayerController
	check(actor != null, "Player exists")
	check(actor.animation_player != null, "Hero AnimationPlayer found")
	for clip in ["Jump", "Fall", "Land", "Talk", "Celebrate"]:
		check(actor.animation_player.has_animation(clip), "Hero clip " + clip)
	var face := actor.face_controller as NgocFaceController
	check(face != null, "Face controller found")
	check(face != null and face.face_material != null, "NgocFace material overridden")
	check(actor.is_on_floor(), "Hero grounded at start")
	Input.action_press("jump")
	await physics_frame
	await physics_frame
	Input.action_release("jump")
	for i in range(6):
		await physics_frame
	check(actor.animation_player.current_animation == "Jump", "Jump clip while rising (got %s)" % actor.animation_player.current_animation)
	var saw_fall := false
	var landed := false
	for i in range(180):
		await physics_frame
		if actor.animation_player.current_animation == "Fall":
			saw_fall = true
		if saw_fall and actor.is_on_floor():
			landed = true
			break
	check(saw_fall, "Fall clip while descending")
	await physics_frame
	await physics_frame
	check(landed and actor.animation_player.current_animation == "Land", "Land clip on touchdown (got %s)" % actor.animation_player.current_animation)
	actor.play_action("Wave")
	await process_frame
	await process_frame
	check(face != null and face.current_face in ["joy", "blink"], "Joy face while waving (got %s)" % (face.current_face if face else "none"))
	face.talk(1.0)
	var saw_talk := false
	for i in range(30):
		await process_frame
		if face.current_face == "talk":
			saw_talk = true
	check(saw_talk, "Talking mouth flaps")
	quit(1 if failed else 0)
