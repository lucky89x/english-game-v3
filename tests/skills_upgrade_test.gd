extends SceneTree
var failed := false
func check(ok: bool, message: String) -> void:
	print("PASS: " if ok else "FAIL: ", message)
	failed = failed or not ok
func _initialize() -> void:
	call_deferred("run")
func run() -> void:
	var world = load(ProjectSettings.get_setting("application/run/main_scene")).instantiate()
	root.add_child(world)
	await physics_frame
	await physics_frame
	var actor = world.get_node("Characters/Player")
	var hud = world.get_node("DebugHUD")
	check(not actor.get_node("VisualRoot/PlaceholderBody").visible, "Capsule visual hidden")
	check(actor.find_children("*", "Skeleton3D", true, false).size() > 0, "Player skeleton imported")
	for clip in ["Idle", "Walk", "Run"]:
		check(actor.animation_player.has_animation(clip), "Real clip " + clip)
		actor.animation_player.play(clip)
		actor.animation_player.advance(0.2)
		check(actor.animation_player.current_animation == clip, "Playback " + clip)
	check(hud.has_node("RPGHUD"), "RPG HUD in F5")
	check(not hud.get_node("ControlHint").visible, "Help hidden")
	hud.stats.update({"hp": 40, "gold": 99})
	check(hud.hp_bar.value == 40 and "99" in hud.wallet.text, "Stats update HUD via signal")
	hud.stats.update({"hp": 85, "gold": 32})
	var camera = world.get_node("OrbitCamera")
	check(camera.orbit_button == MOUSE_BUTTON_RIGHT, "Right mouse camera")
	var reset := InputEventKey.new()
	reset.physical_keycode = KEY_R
	reset.pressed = true
	camera.target_yaw = 1.5
	camera._unhandled_input(reset)
	check(camera.target_yaw == 0.0, "Reset camera")
	var start: Vector3 = actor.position
	Input.action_press("move_forward")
	for i in range(50):
		await physics_frame
	check(actor.position.distance_to(start) > 1.0, "Physical WASD movement")
	check(actor.animation_player.current_animation == "Walk", "Walk triggered by movement")
	Input.action_press("run")
	for i in range(20):
		await physics_frame
	check(actor.animation_player.current_animation == "Run", "Run triggered by Shift")
	Input.action_release("move_forward")
	Input.action_release("run")
	for i in range(30):
		await physics_frame
	check(actor.animation_player.current_animation == "Idle", "Return to Idle")
	actor.play_action("Interact")
	check(actor.animation_player.current_animation == "Interact", "Interact clip starts")
	actor.play_action("Wave")
	check(actor.animation_player.current_animation == "Wave", "Wave clip starts")
	var npc = world.get_node("WorldGeometry/FantasyVillage/NPCs/ElderRowan")
	actor.global_position = npc.global_position + Vector3(0, 0.9, 1.5)
	actor.velocity = Vector3.ZERO
	await physics_frame
	await physics_frame
	npc.player_in_range = true
	var interact := InputEventAction.new()
	interact.action = "interact"
	interact.pressed = true
	npc._unhandled_input(interact)
	check(hud.dialogue_panel.visible, "NPC E opens dialogue")
	npc._unhandled_input(interact)
	check(not hud.dialogue_panel.visible, "NPC E closes dialogue")
	world.queue_free()
	quit(1 if failed else 0)
