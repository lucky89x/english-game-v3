extends SceneTree
## "Sửa cây cầu" vertical slice: Tom -> Sam -> 3 items with decoys -> Pip's English steps in
## order -> bridge rebuilt -> Tom's reward once + forest clue; saved and restored; grade without
## content is told honestly. Also checks the minimap and the new river crossings.
## Run: godot --headless --path . --script res://tests/bridge_repair_quest_test.gd
const SAVE := "user://test_bridge_state.json"
var failed := false
var world: Node
var actor: CharacterBody3D
var hud: Node
var state: GameState
var quest: BridgeRepairQuest


func check(ok: bool, message: String) -> void:
	print("PASS: " if ok else "FAIL: ", message)
	failed = failed or not ok


func _initialize() -> void:
	call_deferred("run")


func frames(count: int) -> void:
	for i in range(count):
		await physics_frame


func key(code: Key) -> void:
	for pressed in [true, false]:
		var event := InputEventKey.new()
		event.physical_keycode = code
		event.keycode = code
		event.pressed = pressed
		Input.parse_input_event(event)
		Input.flush_buffered_events()
	await frames(2)


func teleport(point: Vector3) -> void:
	actor.global_position = point + Vector3(0, 0.9, 0)
	actor.velocity = Vector3.ZERO
	await frames(15)


func load_world() -> void:
	world = load("res://world/main_world.tscn").instantiate()
	root.add_child(world)
	await frames(30)
	actor = world.get_node("Characters/Player") as CharacterBody3D
	hud = get_first_node_in_group("dialogue_ui")
	state = get_first_node_in_group("game_state") as GameState
	quest = get_first_node_in_group("quest_bridge_repair") as BridgeRepairQuest


func item_of(id: String, needed: bool) -> Dictionary:
	for item in quest.items:
		if item["id"] == id and item["needed"] == needed:
			return item
	return {}


func run() -> void:
	for p in [SAVE, SAVE + ".bak"]:
		if FileAccess.file_exists(p):
			DirAccess.remove_absolute(p)
	GameState.override_path = SAVE
	await load_world()
	check(quest != null, "BridgeRepairQuest node exists")
	check(hud.minimap != null and hud.minimap.is_visible_in_tree(), "Minimap is on the HUD")
	check(world.find_child("CầuTrạiGỗ", true, false) != null and world.find_child("CầuCuốiSông", true, false) != null, "Two new river bridges are built")
	check(world.find_child("FishingPier", true, false) != null, "Fishing pier is built")
	check(world.find_child("Pier", true, false) == null, "Old pier next to the village bridge is gone")

	state.grade = 6
	state.set_quest_step("lost_letter", "done")
	quest._refresh()
	check(quest.broken_model.visible and quest.fixed_bridge == null, "South bridge starts broken")
	check(quest.tom_marker.visible, "Tom shows ! for the next quest after the letter")

	var tom: Node3D = world.get_node("WorldGeometry/FantasyVillage/NPCs/ElderRowan")
	await teleport(tom.global_position + Vector3(0, 0, 1.5))
	await key(KEY_E)
	check(hud.is_choosing() and hud.dialogue_label.text.contains("Sam"), "Tom offers 'Sửa cây cầu' (letter quest hands over)")
	await key(KEY_1)
	check(quest.step() == "ask_sam", "Quest accepted: go to Sam")

	await teleport(quest.sam.global_position + Vector3(1.2, 0, 0.4))
	await key(KEY_E)
	check(quest.step() == "collect" and hud.dialogue_label.text.contains("rope"), "Sam asks in English for rope, axe, log")
	await key(KEY_E)  # close
	var shown := quest.items.filter(func(i): return (i["node"] as Node3D).visible)
	check(shown.size() == 4, "4 items appear (rope, log + 2 look-alikes); the axe comes from Ben")
	check(item_of("rope", false)["word"] == "chain", "Decoy next to the rope is a chain")

	var decoy := item_of("rope", false)
	await teleport((decoy["node"] as Node3D).global_position + Vector3(-0.7, 0, 0))
	await key(KEY_E)
	check(quest.collected().is_empty() and hud.dialogue_label.text.contains("Sam đã nói"), "Decoy (real E): not taken, Sam's request shown again")
	await key(KEY_E)
	var rope := item_of("rope", true)
	await teleport((rope["node"] as Node3D).global_position + Vector3(-0.7, 0, 0))
	await key(KEY_E)
	check(quest.collected() == ["rope"], "Rope picked with the E key")
	check(quest.pick(item_of("log", true)), "Log picked")
	# Ben trades the axe for one market shift
	var market := get_first_node_in_group("word_market") as WordMarket
	check(quest.needs_axe(), "Axe still needed: Ben has it")
	await teleport(market.to_global(Vector3(-1.0, 0, 0)))
	market.talk_to_ben()
	check(hud.is_choosing() and hud.dialogue_label.text.contains("Rìu"), "Ben offers the axe for a market shift")
	await key(KEY_1)
	check(market.active, "Market shift starts")
	var guard := 0
	while market.active and guard < 30:
		guard += 1
		if not market.waiting:
			var t: Dictionary = market.round_cards[market.index]
			for i in range(WordMarket.JARS):
				if market.jar_cards[i].get("id", "") == t["id"]:
					market.serve(i)
		await create_timer(1.3).timeout
	check(quest.collected().has("axe") and hud.dialogue_label.text.contains("axe"), "After the shift Ben gives the axe")
	hud.hide_dialogue()
	await frames(30)
	check(quest.collected().size() == 3 and not (rope["node"] as Node3D).visible, "All 3 collected, picked items hidden")

	await teleport(quest.sam.global_position + Vector3(1.2, 0, 0.4))
	await key(KEY_E)
	check(quest.step() == "repair" and quest.pip.visible and hud.is_choosing(), "Back at Sam: Pip appears and reads the steps")
	check(hud.dialogue_label.text.contains("First") , "Pip's English instructions are shown")
	var steps: Array = quest.activity()["instructions"]
	var options := []
	for ins in steps:
		options.append(String(ins["vi"]))
	options.sort()
	var wrong := options.find(String(steps[2]["vi"]))
	await key(KEY_1 + wrong)
	check(quest._repair_step == 0 and hud.dialogue_label.text.contains("Read again"), "Wrong first step: Pip repeats that line")
	for k in range(3):
		await key(KEY_1 + options.find(String(steps[k]["vi"])))
	check(quest.step() == "report_tom", "Three steps in order: bridge repaired")
	check(not quest.broken_model.visible and quest.fixed_bridge.visible and (quest.fixed_bridge as CollisionObject3D).collision_layer == 1, "Repaired bridge is shown and walkable")
	check(hud.dialogue_label.text.contains("Forest of Memories"), "Pip shows the clue to the Forest of Memories")

	var gold0: int = hud.stats.gold
	await teleport(tom.global_position + Vector3(0, 0, 1.5))
	await key(KEY_E)
	check(quest.step() == "done" and hud.stats.gold == gold0 + BridgeRepairQuest.REWARD_GOLD, "Tom: quest done, +30 Gold")
	check(bool(state.flags.get("forest_clue", false)), "Forest clue flag saved")
	await key(KEY_E)
	await key(KEY_E)
	check(hud.stats.gold == gold0 + BridgeRepairQuest.REWARD_GOLD, "Reward paid only once")

	world.queue_free()
	await frames(5)
	await load_world()
	check(quest.step() == "done" and quest.fixed_bridge != null and quest.fixed_bridge.visible, "Reload: bridge stays repaired")

	# a grade without bridge content is told honestly (no other grade's text)
	tom = world.get_node("WorldGeometry/FantasyVillage/NPCs/ElderRowan")
	state.grade = 7
	state.set_quest_step("bridge_repair", "not_started")
	quest.handle_tom(tom)
	check(not hud.is_choosing() and hud.dialogue_label.text.contains("lớp 7"), "Grade 7: Tom says this part is not written yet")

	print("BRIDGE REPAIR TEST PASSED" if not failed else "BRIDGE REPAIR TEST FAILED")
	quit(1 if failed else 0)
