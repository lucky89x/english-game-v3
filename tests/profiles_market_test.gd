extends SceneTree
## Profiles (one per child), spaced word review and Ben's word-jar market.
## Run: godot --headless --path . --script res://tests/profiles_market_test.gd
const SAVE := "user://test_pm_state.json"
const INDEX := "user://test_pm_profiles.json"
var failed := false
var world: Node
var actor: CharacterBody3D
var hud: Node
var state: GameState
var menu: ProfileMenu
var market: WordMarket


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


func clean_files() -> void:
	var dir := DirAccess.open("user://")
	for f in dir.get_files():
		if f.begins_with("test_pm_") or f.begins_with("profile_p"):
			dir.remove(f)


func run() -> void:
	clean_files()
	GameState.override_path = SAVE
	ProfileStore.index_path = INDEX
	world = load("res://world/main_world.tscn").instantiate()
	root.add_child(world)
	await frames(30)
	actor = world.get_node("Characters/Player") as CharacterBody3D
	hud = get_first_node_in_group("dialogue_ui")
	state = get_first_node_in_group("game_state") as GameState
	menu = get_first_node_in_group("profile_menu") as ProfileMenu
	market = get_first_node_in_group("word_market") as WordMarket
	check(menu != null and market != null, "ProfileMenu and WordMarket nodes exist")
	check(not menu.is_open(), "Profile menu stays closed in tests (only a real start opens it)")

	# ---------------------------------------------------------------- profiles
	menu.open()
	check(menu.is_open() and actor.input_locked, "Menu opens and holds the hero still")
	var minh := menu.create_profile("Minh", 8)
	check(not minh.is_empty() and state.grade == 8 and state.profile_name == "Minh", "Profile Minh (grade 8) created and loaded")
	check(not menu.is_open() and not actor.input_locked, "Menu closes and frees the hero")
	check(state.save_path == minh["save"] and FileAccess.file_exists(minh["save"]), "Minh has a save file of his own")
	hud.stats.add_gold(100)
	state.stats = hud.stats.to_dict()
	state.save_game()
	var minh_gold: int = hud.stats.gold
	menu.open()
	var an := menu.create_profile("An", 6)
	check(state.grade == 6 and state.profile_id == an["id"], "Second profile An (grade 6)")
	check(hud.stats.gold < minh_gold, "An starts with default gold, not Minh's")
	check(ProfileStore.profiles().size() == 2, "Two profiles stored in the index")
	menu.open()
	menu.choose(ProfileStore.find(minh["id"]))
	check(state.grade == 8 and hud.stats.gold == minh_gold, "Back to Minh: grade 8 and his gold")
	check(menu.create_profile("X", 0).is_empty(), "No profile without a grade")
	menu.choose(ProfileStore.find(minh["id"]))

	# Tom no longer asks the grade: he offers the quest straight away
	var quest := get_first_node_in_group("quest_lost_letter")
	var tom: Node3D = world.get_node("WorldGeometry/FantasyVillage/NPCs/ElderRowan")
	quest.handle_tom(tom)
	check(hud.is_choosing() and hud.dialogue_label.text.contains("thư"), "Tom offers the letter quest without asking the grade")
	hud.hide_dialogue()

	# ---------------------------------------------------------------- spaced review
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	var probe := GameState.new()
	var c6: Dictionary = WordReview.cards_of(6, 1)[0]
	var c8: Dictionary = WordReview.cards_of(8, 1)[0]
	var day := 1000
	WordReview.record(probe, c6, false, day)
	WordReview.record(probe, c8, false, day)
	check(int(probe.words[c6["id"]]["box"]) == 0 and int(probe.words[c6["id"]]["due"]) == day, "Wrong answer: box 0, due again today")
	var due6 := WordReview.due_cards(probe, 6, day)
	check(due6.size() == 1 and due6[0]["id"] == c6["id"], "A grade 6 child never gets grade 8 review words")
	check(WordReview.due_cards(probe, 8, day).size() == 2, "A grade 8 child reviews grade 6 words too")
	WordReview.record(probe, c6, true, day)
	WordReview.record(probe, c6, true, day + 1)
	check(int(probe.words[c6["id"]]["box"]) == 2 and int(probe.words[c6["id"]]["due"]) == day + 1 + 2, "Right answers move up and space out")
	check(WordReview.due_cards(probe, 8, day + 1).size() == 1, "Known word leaves the due list")
	var round8 := WordReview.pick_round(probe, 8, 1, 6, rng, day)
	check(round8.size() == 6 and round8.any(func(c): return c["id"] == c8["id"]), "Round has 6 words and includes the due one")
	var place8 := WordReview.pick_placement(8, 1, 6, rng)
	check(place8.size() == 6 and place8.any(func(c): return int(c["grade"]) < 8) and place8.all(func(c): return int(c["grade"]) <= 8),
		"Grade 8 placement asks lower-grade words, never higher")
	var place6 := WordReview.pick_placement(6, 1, 6, rng)
	check(place6.size() == 6 and place6.all(func(c): return int(c["grade"]) == 6), "Grade 6 placement stays in grade 6")
	var wrong := WordReview.distractors(c8, 3, rng)
	var vis := {String(c8["vi"]).to_lower(): true}
	for w in wrong:
		vis[String(w["vi"]).to_lower()] = true
	check(wrong.size() == 3 and vis.size() == 4, "3 distractors with different meanings")
	probe.free()

	# ---------------------------------------------------------------- Ben's market (first day = placement)
	await teleport(market.to_global(Vector3(-1.0, 0, 0.0)))
	await key(KEY_E)
	check(hud.is_choosing(), "E near Ben: he asks for help")
	await key(KEY_1)
	check(market.active and market.placement, "Round starts; first market day is the placement check")
	check(not actor.input_locked, "Hero can walk during the round (no menu)")
	check(market.jar_labels.all(func(l): return l.visible and l.text != ""), "Jars show Vietnamese labels")
	check(market.round_cards.any(func(c): return int(c["grade"]) < 8), "Some travellers ask lower-grade words")
	var target: Dictionary = market.round_cards[0]
	check(market.bubble.text.contains(target["word"]), "Traveller asks in English")
	var right := -1
	for i in range(WordMarket.JARS):
		if market.jar_cards[i].get("id", "") == target["id"]:
			right = i
	var bad := (right + 1) % WordMarket.JARS
	var gold0: int = hud.stats.gold
	await teleport(market.to_global(market.jars[bad].position + Vector3(-0.6, 0, 0)))
	await key(KEY_E)
	check(market.index == 0 and market.bubble.text.contains("I need"), "Wrong jar (real E key): traveller says what it is and asks again")
	check(hud.stats.gold == gold0, "No gold for a wrong jar")
	check(market.serve(right) and hud.stats.gold == gold0 + WordMarket.GOLD_RETRY, "Right jar on the 2nd try: small reward")
	check(not market.serve(right), "No double serve while the next traveller walks up")
	await create_timer(1.3).timeout
	var guard := 0
	while market.active and guard < 20:
		guard += 1
		var t: Dictionary = market.round_cards[market.index]
		for i in range(WordMarket.JARS):
			if market.jar_cards[i].get("id", "") == t["id"]:
				market.serve(i)
		await create_timer(1.3).timeout
	check(market.served == WordMarket.CUSTOMERS and bool(state.flags.get("market_first_day", false)), "All 6 travellers served; first day done")
	check(market.first_try == WordMarket.CUSTOMERS - 1, "First-try count is right (5/6)")
	check(state.words.size() == WordMarket.CUSTOMERS, "Each asked word is in the review deck")
	check(int(state.words[target["id"]]["box"]) == 0, "The missed word is due again (box 0)")
	check(hud.stats.vocabulary == WordMarket.CUSTOMERS - 1, "HUD 'Từ đã học' counts known words")
	check(hud.dialogue_label.text.contains(target["word"]), "Ben's summary repeats the missed word with its meaning")
	var saved = JSON.parse_string(FileAccess.get_file_as_string(state.save_path))
	check(saved is Dictionary and saved["words"].has(target["id"]) and int(saved["grade"]) == 8, "Review deck saved in Minh's file")

	# next day: a normal round mixes in the due word
	hud.hide_dialogue()
	market.start_round()
	check(market.active and not market.placement, "Second round is a normal round")
	check(market.round_cards.any(func(c): return c["id"] == target["id"]), "The missed word comes back for review")
	market.end_round(true)

	print("PROFILES MARKET TEST PASSED" if not failed else "PROFILES MARKET TEST FAILED")
	clean_files()
	quit(1 if failed else 0)
