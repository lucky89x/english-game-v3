class_name SecretChests
extends Node3D
## Hidden treasure chests (P3 "rương bí mật"). Each one is locked with an English word: the lid
## shows the Vietnamese meaning and Ngọc taps the letters in order to spell the word. A soft glint
## shows a chest is near, the minimap does not. Words come from the profile's own grade (due
## review words first), so spelling practice lands on the words the child is learning.

const CHESTS := {
	"pier": Vector2(0.6, 63.0),
	"camp": Vector2(42.0, 89.5),
	"gate": Vector2(-29.0, -70.0),
	"orchard": Vector2(53.0, 3.0),
}
const RADIUS := 1.8
const REWARD_GOLD := 10
const REWARD_EXP := 15
const MAX_LEN := 8

var state: GameState
var rng := RandomNumberGenerator.new()
var chests := {}                                  # id -> {"node", "anim", "glint"}
var current_id := ""
var card := {}
var progress := 0
var mistakes := 0
var letters: Array = []


func _ready() -> void:
	add_to_group("secret_chests")
	rng.randomize()
	call_deferred("_setup")


func _setup() -> void:
	state = get_tree().get_first_node_in_group("game_state") as GameState
	var land := get_tree().root.find_child("StarterVillageEnvironment", true, false)
	var model := load("res://assets/Exports/glTF/Chest_Wood.gltf") as PackedScene
	for id in CHESTS:
		var at: Vector2 = CHESTS[id]
		var root := StaticBody3D.new()
		root.name = "SecretChest_" + id
		add_child(root)
		var y: float = land.get_height_at(at.x, at.y) if land != null and land.has_method("get_height_at") else 0.0
		root.position = Vector3(at.x, y, at.y)
		root.rotation.y = rng.randf_range(-0.6, 0.6)
		root.add_child(model.instantiate())
		var shape := CollisionShape3D.new()
		var box := BoxShape3D.new()
		box.size = Vector3(1.45, 1.05, 0.95)
		shape.shape = box
		shape.position.y = 0.52
		root.add_child(shape)
		var glint := OmniLight3D.new()
		glint.light_color = Color(1.0, 0.86, 0.45)
		glint.light_energy = 0.9
		glint.omni_range = 2.2
		glint.position.y = 1.1
		root.add_child(glint)
		chests[id] = {"node": root, "anim": _anim(root), "glint": glint}
	if state != null:
		state.loaded.connect(_refresh)
	_refresh()


func _anim(node: Node) -> AnimationPlayer:
	var found := node.find_children("*", "AnimationPlayer", true, false)
	return found[0] as AnimationPlayer if not found.is_empty() else null


func _play(anim: AnimationPlayer, keyword: String) -> void:
	if anim == null:
		return
	for clip in anim.get_animation_list():
		if String(clip).to_lower().contains(keyword):
			anim.play(clip)
			return


func opened() -> Dictionary:
	if state == null:
		return {}
	if not state.flags.has("secret_chests"):
		state.flags["secret_chests"] = {}
	return state.flags["secret_chests"]


func _refresh() -> void:
	for id in chests:
		var open := opened().has(id)
		(chests[id]["glint"] as OmniLight3D).visible = not open
		_play(chests[id]["anim"], "open" if open else "close")


var _hint_owned := false
var _hint_timer := 0.0


func _process(delta: float) -> void:
	_hint_timer -= delta
	if _hint_timer > 0.0 or state == null:
		return
	_hint_timer = 0.2
	var hud := _hud()
	var actor := get_tree().get_first_node_in_group("player") as Node3D
	if hud == null or actor == null:
		return
	var id := nearest(actor.global_position)
	if id != "" and not opened().has(id) and not hud.is_choosing():
		hud.show_interaction("Nhấn E để mở rương bí mật")
		_hint_owned = true
	elif _hint_owned:
		hud.hide_interaction()
		_hint_owned = false


func _hud() -> Node:
	return get_tree().get_first_node_in_group("dialogue_ui")


func _unhandled_input(event: InputEvent) -> void:
	if not event.is_action_pressed("interact") or state == null:
		return
	var hud := _hud()
	var actor := get_tree().get_first_node_in_group("player") as Node3D
	if hud == null or actor == null or hud.is_choosing():
		return
	var id := nearest(actor.global_position)
	if id == "":
		return
	get_viewport().set_input_as_handled()
	if opened().has(id):
		hud.show_dialogue("Rương bí mật", "Rương này đã mở rồi. Còn rương nào khác quanh làng không nhỉ?")
		return
	start(id)


func nearest(at: Vector3) -> String:
	for id in chests:
		var p := (chests[id]["node"] as Node3D).global_position
		if Vector2(at.x - p.x, at.z - p.z).length() < RADIUS:
			return id
	return ""


## Picks a word: a due review word of this grade first, otherwise one from the current unit.
func pick_word() -> Dictionary:
	var pool: Array = WordReview.due_cards(state, state.grade)
	pool.append_array(WordReview.cards_of(state.grade, int(state.flags.get("current_unit", 1))))
	for c in pool:
		var w := String(c["word"]).to_lower()
		if w.length() >= 3 and w.length() <= MAX_LEN and w.is_valid_identifier() and w == String(c["word"]).to_lower().strip_edges():
			if rng.randf() < 0.6 or c == pool.back():
				return c
	return {}


func start(id: String) -> bool:
	card = pick_word()
	if card.is_empty():
		_hud().show_dialogue("Rương bí mật", "Ổ khóa phủ đầy rêu, chưa mở được. (Lớp này chưa có từ vựng.)")
		return false
	current_id = id
	progress = 0
	mistakes = 0
	var word := String(card["word"]).to_lower()
	letters = []
	for ch in word:
		letters.append(ch)
	letters.append("aeioustrln"[rng.randi_range(0, 9)])          # one extra letter to think about
	WordReview._shuffle(letters, rng)
	_ask("")
	return true


func _ask(prefix: String) -> void:
	var word := String(card["word"]).to_lower()
	var shown := ""
	for i in range(word.length()):
		shown += (word[i].to_upper() if i < progress else "_") + " "
	var options := []
	for ch in letters:
		options.append(String(ch).to_upper())
	_hud().show_choices("Rương bí mật · khóa chữ",
		"%sỔ khóa khắc chữ: \"%s\"\nĐánh vần từ tiếng Anh này để mở rương:\n\n%s" % [prefix, card["vi"], shown.strip_edges()],
		options, func(i: int) -> void: _on_letter(i))


func _on_letter(index: int) -> void:
	var word := String(card["word"]).to_lower()
	var picked := String(letters[index])
	get_tree().call_group("sound", "play", "tick" if picked == word[progress] else "wrong")
	if picked == word[progress]:
		letters.remove_at(index)
		progress += 1
		if progress >= word.length():
			_open()
			return
		_ask("")
	else:
		mistakes += 1
		_ask("Chưa đúng, thử chữ khác nhé!\n")


func _open() -> void:
	var hud := _hud()
	var flags := opened()
	flags[current_id] = true
	WordReview.record(state, card, mistakes == 0)
	state.record_answer(int(card["grade"]), int(card["unit"]), "spelling", mistakes == 0, false)
	hud.stats.add_gold(REWARD_GOLD)
	hud.stats.add_experience(REWARD_EXP)
	hud.stats.vocabulary = WordReview.learned_count(state)
	hud.stats.changed.emit()
	state.stats = hud.stats.to_dict()
	state.save_game()
	_play(chests[current_id]["anim"], "open")
	get_tree().call_group("sound", "play", "fanfare")
	(chests[current_id]["glint"] as OmniLight3D).visible = false
	var actor := get_tree().get_first_node_in_group("player")
	if actor != null and actor.has_method("play_action"):
		actor.play_action("Celebrate")
	hud.show_dialogue("Rương bí mật", "Cạch! \"%s\" = %s\nTrong rương có %d Vàng! (+%d EXP)\nĐã tìm được %d/%d rương bí mật." % [
		String(card["word"]).to_upper(), card["vi"], REWARD_GOLD, REWARD_EXP, flags.size(), CHESTS.size()])
	current_id = ""
