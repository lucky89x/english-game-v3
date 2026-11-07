extends SceneTree
## "Bức thư thất lạc" end-to-end: grade choice, missing grade content (no substitution), offer,
## enter Tom's house, letter pickup with real E key, wrong answer + hint, input lock, correct answer, reward once,
## versioned save file and reload. Run: godot --headless --path . --script res://tests/lost_letter_quest_test.gd
const SAVE := "user://test_lost_letter_save.json"
var failed := false
var world: Node
var actor: CharacterBody3D
var hud: Node
var state: GameState
var quest: LostLetterQuest


func check(ok: bool, message: String) -> void:
	print("PASS: " if ok else "FAIL: ", message)
	failed = failed or not ok


func _initialize() -> void:
	call_deferred("run")


func key(code: Key) -> void:
	for pressed in [true, false]:
		var event := InputEventKey.new()
		event.physical_keycode = code
		event.keycode = code
		event.pressed = pressed
		Input.parse_input_event(event)
		Input.flush_buffered_events()
	await frames(2)


func frames(count: int) -> void:
	for i in range(count):
		await physics_frame


func teleport(point: Vector3) -> void:
	actor.global_position = point + Vector3(0, 0.9, 0)
	actor.velocity = Vector3.ZERO
	await frames(20)


func load_world() -> void:
	world = load("res://world/main_world.tscn").instantiate()
	root.add_child(world)
	await frames(30)
	actor = world.get_node("Characters/Player") as CharacterBody3D
	hud = get_first_node_in_group("dialogue_ui")
	state = get_first_node_in_group("game_state") as GameState
	quest = get_first_node_in_group("quest_lost_letter") as LostLetterQuest


func run() -> void:
	for p in [SAVE, SAVE + ".bak", SAVE + ".tmp"]:
		if FileAccess.file_exists(p):
			DirAccess.remove_absolute(p)
	GameState.override_path = SAVE
	# data layer
	check(LearningCatalog.units().size() == 48, "48 Unit metadata")
	check(not LearningCatalog.activity(6, 1, "lost_letter").is_empty(), "Grade 6 Unit 1 letter exists")
	check(not LearningCatalog.activity(8, 1, "lost_letter").is_empty(), "Grade 8 Unit 1 letter exists")
	check(LearningCatalog.activity(7, 1, "lost_letter").is_empty(), "Grade 7 has no content (no substitution)")

	await load_world()
	check(state != null and quest != null, "GameState and quest nodes exist")
	check(quest.step() == "not_started" and state.grade == 0, "Fresh save: quest not started, no grade")
	check(quest.tom_marker != null and quest.tom_marker.visible, "Tom shows ! marker")
	check(quest.letter_root == null and not quest.door_marker.visible, "No letter, no door marker before quest")

	var tom: Node3D = world.get_node("WorldGeometry/FantasyVillage/NPCs/ElderRowan")
	await teleport(tom.global_position + Vector3(0, 0, 1.5))
	await key(KEY_E)
	check(hud.is_choosing(), "E on Tom asks for the grade")
	check(actor.input_locked, "Movement locked while choosing")
	var start := actor.global_position
	Input.action_press("move_forward")
	await frames(20)
	Input.action_release("move_forward")
	check(actor.global_position.distance_to(start) < 0.2, "W does nothing while the menu is open")

	await key(KEY_2)   # grade 7: not ready
	check(not hud.is_choosing() and not actor.input_locked, "Menu closes and unlocks after picking")
	check(state.grade == 0 and quest.step() == "not_started", "Grade 7 refused honestly, nothing changed")
	await key(KEY_E)   # close the message
	await key(KEY_E)   # talk again
	check(hud.is_choosing(), "Talking again asks grade again")
	await key(KEY_1)   # grade 6 -> offer
	check(state.grade == 6 and hud.is_choosing(), "Grade 6 chosen, Tom offers the quest")
	await key(KEY_1)   # accept
	check(quest.step() == "find_letter", "Quest accepted: find_letter")
	check(quest.door_marker.visible and not quest.tom_marker.visible, "Tom's door shows ✉, Tom marker hides")
	check(hud.quest_label.visible and hud.quest_label.text.contains("Bức thư"), "Quest tracker shows the task")

	var travel: Node = get_first_node_in_group("building_travel")
	var door: Node3D = travel.door_marker(LostLetterQuest.TOM_HOUSE)
	await teleport(door.global_position)
	await key(KEY_E)
	check(travel.active_room != null and is_instance_valid(quest.letter_root) and quest.letter_root.visible, "E at the door enters Tom's house; letter is inside")
	await teleport(quest.letter_root.global_position + Vector3(0.8, 0, 0.4))
	check(quest.player_near_letter, "Player reaches the letter")
	await key(KEY_E)
	check(hud.is_choosing() and hud.dialogue_label.text.contains("Mai"), "E opens the English letter (grade 6 text)")
	var a := quest.activity()
	var wrong: int = (int(a["answer"]) + 1) % (a["choices"] as Array).size()
	await key(KEY_1 + wrong)
	check(quest.step() == "find_letter" and hud.is_choosing(), "Wrong answer: retry stays open")
	check(hud.dialogue_label.text.contains("Gợi ý"), "Wrong answer shows a hint")
	await key(KEY_1 + int(a["answer"]))
	check(quest.step() == "return_letter" and not actor.input_locked, "Correct answer: return_letter, unlocked")
	var row: Dictionary = state.learning["g6_u01"]["reading"]
	check(int(row["attempts"]) == 2 and int(row["correct"]) == 1 and int(row["hints_used"]) == 1, "Learning record per grade/unit/skill")
	check(not quest.letter_root.visible and quest.tom_marker.text == "?" and not quest.door_marker.visible, "Letter gone, door marker off, Tom shows ?")
	await teleport(travel.active_room.global_position + Vector3(0, 0, 3.4))
	await key(KEY_E)
	await frames(10)
	check(travel.active_room == null, "E at the room exit returns to the village")

	await teleport(tom.global_position + Vector3(0, 0, 1.5))
	var gold_before: int = hud.stats.gold
	var exp_total_before: int = hud.stats.experience
	var level_before: int = hud.stats.level
	await key(KEY_E)
	check(quest.step() == "done" and bool(state.quest("lost_letter")["rewarded"]), "Return to Tom: quest done, rewarded")
	check(hud.stats.gold == gold_before + 20, "+20 Gold")
	check(hud.stats.level > level_before or hud.stats.experience == exp_total_before + 50, "+50 EXP (level-up counted)")
	check(not quest.tom_marker.visible and not hud.quest_label.visible, "Markers and tracker cleared")
	var gold_after: int = hud.stats.gold
	await key(KEY_E)  # close
	await key(KEY_E)  # talk again: plain dialogue, no second reward
	check(hud.stats.gold == gold_after and not hud.is_choosing(), "Reward paid only once")

	var data = JSON.parse_string(FileAccess.get_file_as_string(SAVE))
	check(data is Dictionary and int(data["version"]) == GameState.SAVE_VERSION, "Save file has version")
	check(data["quests"]["lost_letter"]["step"] == "done" and int(data["grade"]) == 6, "Save holds quest + grade")
	check(FileAccess.file_exists(SAVE + ".bak") and not FileAccess.file_exists(SAVE + ".tmp"), "Atomic write keeps .bak, no .tmp left")

	world.queue_free()
	await frames(5)
	await load_world()
	check(quest.step() == "done" and state.grade == 6, "Reload: quest done, grade 6")
	check(hud.stats.gold == gold_after, "Reload: gold restored from save")
	check(not quest.tom_marker.visible and not quest.door_marker.visible, "Reload: no markers")

	print("LOST LETTER QUEST TEST PASSED" if not failed else "LOST LETTER QUEST TEST FAILED")
	quit(1 if failed else 0)
