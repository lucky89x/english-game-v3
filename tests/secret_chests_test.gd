extends SceneTree
## Secret chests: E near a hidden chest opens a spelling lock (Vietnamese meaning shown, letters
## tapped in order), a wrong letter costs nothing but is remembered, the chest opens once and pays
## once, the word goes into the review deck and everything survives a reload.
## Run: godot --headless --path . --script res://tests/secret_chests_test.gd
const SAVE := "user://test_chests_state.json"
var failed := false
var world: Node
var actor: CharacterBody3D
var hud: Node
var state: GameState
var chests: SecretChests


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


func load_world() -> void:
	world = load("res://world/main_world.tscn").instantiate()
	root.add_child(world)
	await frames(30)
	actor = world.get_node("Characters/Player") as CharacterBody3D
	hud = get_first_node_in_group("dialogue_ui")
	state = get_first_node_in_group("game_state") as GameState
	chests = get_first_node_in_group("secret_chests") as SecretChests


func letter_index(ch: String) -> int:
	for i in range(chests.letters.size()):
		if String(chests.letters[i]) == ch:
			return i
	return -1


func run() -> void:
	for p in [SAVE, SAVE + ".bak"]:
		if FileAccess.file_exists(p):
			DirAccess.remove_absolute(p)
	GameState.override_path = SAVE
	await load_world()
	check(chests != null and chests.chests.size() == 4, "4 secret chests placed")
	var sound := get_first_node_in_group("sound") as GameSound
	check(sound != null and sound.players.size() == 6, "6 sound effects loaded")
	check(sound.music != null and sound.music.playing and sound.music.bus == "Music", "Village music plays on the Music bus")
	check(AudioServer.get_bus_index("SFX") != -1 and AudioServer.get_bus_index("Music") != -1, "SFX and Music buses exist")
	for id in chests.chests:
		var p: Vector3 = (chests.chests[id]["node"] as Node3D).global_position
		check(VillageLayout.road_distance(p.x, p.z) > 0.8, "Chest %s is off the road" % id)
	state.grade = 8
	var node := chests.chests["pier"]["node"] as Node3D
	actor.global_position = node.global_position + Vector3(-1.2, 0.9, 0.6)
	await frames(15)
	await key(KEY_E)
	check(hud.is_choosing() and chests.current_id == "pier", "E near the chest opens the spelling lock")
	var word := String(chests.card["word"]).to_lower()
	check(int(chests.card["grade"]) <= 8 and word.length() <= SecretChests.MAX_LEN, "Word comes from the child's grade (or lower)")
	check(hud.dialogue_label.text.contains(String(chests.card["vi"])), "Lock shows the Vietnamese meaning")
	check(chests.letters.size() == word.length() + 1, "Letters = the word's letters + 1 extra")
	var gold0: int = hud.stats.gold
	# one wrong letter (a letter that is not the next one), then spell it right
	var wrong := -1
	for i in range(chests.letters.size()):
		if String(chests.letters[i]) != word[0]:
			wrong = i
			break
	chests._on_letter(wrong)
	check(chests.progress == 0 and chests.mistakes == 1 and hud.dialogue_label.text.contains("Chưa đúng"), "Wrong letter: try again, nothing lost")
	for k in range(word.length()):
		chests._on_letter(letter_index(word[k]))
	check(bool(chests.opened().get("pier", false)), "Chest opens after spelling the word")
	check(hud.stats.gold == gold0 + SecretChests.REWARD_GOLD, "+10 Gold")
	check(state.words.has(chests.card["id"]) and int(state.words[chests.card["id"]]["box"]) == 0, "Word with a mistake goes back to review (box 0)")
	check(not (chests.chests["pier"]["glint"] as OmniLight3D).visible, "Glint switches off")
	await key(KEY_E)
	await key(KEY_E)
	check(not hud.is_choosing() and hud.dialogue_label.text.contains("đã mở"), "Opened chest cannot be farmed")
	check(hud.stats.gold == gold0 + SecretChests.REWARD_GOLD, "Reward paid once")
	world.queue_free()
	await frames(5)
	await load_world()
	check(bool(chests.opened().get("pier", false)) and chests.opened().size() == 1, "Reload: chest stays open")
	print("SECRET CHESTS TEST PASSED" if not failed else "SECRET CHESTS TEST FAILED")
	quit(1 if failed else 0)
