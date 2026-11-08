class_name LostLetterQuest
extends Node3D
## Quest "Bức thư thất lạc" (P1, rebuilt on the GitHub version).
## Original flow: Tom gives the task -> the wind blew a letter for him somewhere inside his house
## -> Ngoc enters Tom's house, finds it near the bookshelf, reads it IN ENGLISH and answers a
## question -> brings it back to Tom for 50 EXP + 20 Gold (paid once). The letter text comes from
## the learning data of the chosen grade only.
## Steps: not_started -> find_letter -> return_letter -> done.

const QUEST_ID := "lost_letter"
const UNIT := 1
const REWARD_EXP := 50
const REWARD_GOLD := 20
const TOM_HOUSE := "res://world/interiors/hall_interior.tscn"
## Local spot inside Tom's house (10 x 10 m room): on the floor in front of the bookshelf.
const LETTER_SPOT := Vector3(-2.3, 0.0, -3.6)
const TOM := "Trưởng làng Tom"

var state: GameState
var letter_root: Node3D
var letter_marker: Label3D
var tom_marker: Label3D
var door_marker: Label3D
var travel: Node
var player_near_letter := false
var _hint_shown := false


func _ready() -> void:
	add_to_group("quest_lost_letter")
	call_deferred("_setup")


func _setup() -> void:
	state = get_tree().get_first_node_in_group("game_state") as GameState
	if state != null:
		state.loaded.connect(_on_profile_loaded)
	_apply_saved_stats()
	travel = get_tree().get_first_node_in_group("building_travel")
	if travel != null:
		travel.room_entered.connect(_on_room_entered)
		var door: Node3D = travel.door_marker(TOM_HOUSE)
		if door != null:
			door_marker = _marker("✉", Color(1.0, 0.85, 0.3))
			door_marker.position.y = 2.6
			door.add_child(door_marker)
	_build_tom_marker()
	_refresh()


func _hud() -> Node:
	return get_tree().get_first_node_in_group("dialogue_ui")


func _player() -> Node3D:
	return get_tree().get_first_node_in_group("player") as Node3D


func step() -> String:
	return String(state.quest(QUEST_ID)["step"]) if state != null else "not_started"


func activity() -> Dictionary:
	return LearningCatalog.activity(state.grade, UNIT, QUEST_ID) if state != null else {}


# ------------------------------------------------------------------ world objects
func _on_room_entered(room: Node3D, scene_path: String) -> void:
	if scene_path == TOM_HOUSE and step() == "find_letter":
		_build_letter(room)


## Built inside Tom's house each time she enters while the letter is still lost (the room is freed on exit).
func _build_letter(room: Node3D) -> void:
	letter_root = Node3D.new()
	letter_root.name = "LostLetter"
	room.add_child(letter_root)
	letter_root.position = LETTER_SPOT
	letter_root.tree_exiting.connect(func() -> void: player_near_letter = false)
	var scroll := (load("res://assets/redesign03/props_scroll_sealed.glb") as PackedScene).instantiate() as Node3D
	scroll.scale = Vector3.ONE * 0.8
	scroll.position.y = 0.12
	scroll.rotation_degrees = Vector3(0, 35, 90)
	letter_root.add_child(scroll)
	var glow := OmniLight3D.new()
	glow.light_color = Color(1.0, 0.85, 0.45)
	glow.light_energy = 0.8
	glow.omni_range = 2.2
	glow.position.y = 0.6
	letter_root.add_child(glow)
	letter_marker = _marker("✉", Color(1.0, 0.85, 0.3))
	letter_marker.position.y = 1.3
	letter_root.add_child(letter_marker)
	var area := Area3D.new()
	area.collision_layer = 0
	area.collision_mask = 1
	var shape := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = 1.8
	shape.shape = sphere
	area.add_child(shape)
	letter_root.add_child(area)
	area.body_entered.connect(_on_letter_area.bind(true))
	area.body_exited.connect(_on_letter_area.bind(false))


func _build_tom_marker() -> void:
	tom_marker = _marker("!", Color(1.0, 0.82, 0.2))
	var tom := get_tree().root.find_child("ElderRowan", true, false) as Node3D
	if tom != null:
		tom.add_child(tom_marker)
		tom_marker.position.y = 2.25


func _marker(text: String, color: Color) -> Label3D:
	var label := Label3D.new()
	label.text = text
	label.font_size = 96
	label.pixel_size = 0.006
	label.modulate = color
	label.outline_size = 18
	label.outline_modulate = Color(0.3, 0.16, 0.05)
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.no_depth_test = true
	return label


func _process(delta: float) -> void:
	if is_instance_valid(letter_root) and letter_root.visible:
		letter_root.get_child(0).rotation.y += delta * 0.8
		letter_marker.position.y = 1.3 + sin(Time.get_ticks_msec() / 300.0) * 0.08


func _refresh() -> void:
	var s := step()
	if is_instance_valid(letter_root):
		letter_root.visible = s == "find_letter"
	if door_marker != null:
		door_marker.visible = s == "find_letter"
	if tom_marker != null:
		tom_marker.visible = s in ["not_started", "return_letter"]
		tom_marker.text = "?" if s == "return_letter" else "!"
	var hud := _hud()
	if hud == null or not hud.has_method("set_quest_text"):
		return
	match s:
		"find_letter":
			hud.set_quest_text("Nhiệm vụ: Bức thư thất lạc\nVào nhà trưởng làng Tom tìm bức thư (✉)")
		"return_letter":
			hud.set_quest_text("Nhiệm vụ: Bức thư thất lạc\nMang thư về cho trưởng làng Tom (?)")
		_:
			hud.set_quest_text("")


# ------------------------------------------------------------------ Tom (called by elder_npc.gd)
## Returns true when the quest handled this conversation.
func handle_tom(elder: Node) -> bool:
	if state == null:
		return false
	var hud := _hud()
	match step():
		"not_started":
			if state.grade == 0 or activity().is_empty():
				_ask_grade(elder)
			else:
				_offer(elder)
			return true
		"find_letter":
			hud.show_dialogue(TOM, "Nhà ta ở phía Bắc quảng trường, mái xanh có dấu ✉. Thư bay lạc đâu đó gần giá sách ấy!\n(My house is north of the square. The letter is somewhere near the bookshelf.)")
			return true
		"return_letter":
			_complete(elder)
			return true
	return false


func _ask_grade(elder: Node) -> void:
	_hud().show_choices(TOM, "Chào Ngọc! Con đang học lớp mấy? Tom sẽ kể chuyện bằng tiếng Anh vừa sức con.",
		["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9"], func(i: int) -> void: _on_grade(elder, [6, 7, 8, 9][i]))


func _on_grade(elder: Node, grade: int) -> void:
	if LearningCatalog.activity(grade, UNIT, QUEST_ID).is_empty():
		# never substitute another grade's content
		_hud().show_dialogue(TOM, "Bài học lớp %d đang được soạn, con thông cảm nhé. Hiện đã có lớp 6 và lớp 8. Nói chuyện lại với Tom để chọn lớp khác." % grade)
		return
	state.grade = grade
	state.save_game()
	_offer(elder)


func _offer(elder: Node) -> void:
	if elder.has_method("_play_gesture"):
		elder._play_gesture("Talk")
	_hud().show_choices(TOM,
		"Sáng nay có người gửi thư cho ta, nhưng gió lùa qua cửa sổ thổi nó bay lạc trong nhà. Mắt ta kém, con vào nhà tìm và đọc giúp ta nhé?\n(A letter for me blew away inside my house. Can you find it and read it for me?)",
		["Vâng, con đi tìm ngay! (Yes, I'll find it!)", "Để lát nữa ạ (Maybe later)"],
		func(i: int) -> void: _on_offer(i))


func _on_offer(index: int) -> void:
	if index != 0:
		_hud().show_dialogue(TOM, "Không sao, khi nào rảnh con quay lại nhé. (No problem, come back later.)")
		return
	state.set_quest_step(QUEST_ID, "find_letter")
	state.save_game()
	_hud().hide_dialogue()
	_refresh()


func _complete(elder: Node) -> void:
	var q := state.quest(QUEST_ID)
	var hud := _hud()
	if not bool(q["rewarded"]):
		q["rewarded"] = true
		hud.stats.add_experience(REWARD_EXP)
		hud.stats.add_gold(REWARD_GOLD)
	q["done"] = true
	state.set_quest_step(QUEST_ID, "done")
	state.stats = hud.stats.to_dict()
	state.save_game()
	if elder.has_method("_play_gesture"):
		elder._play_gesture("Wave")
	var actor := _player()
	if actor != null and actor.has_method("play_action"):
		actor.play_action("Celebrate")
	hud.show_dialogue(TOM, "Cảm ơn con! Nhờ con đọc giúp mà ta biết thư viết gì. Con đọc hiểu tiếng Anh giỏi lắm.\n(Thank you, Ngoc! You read English very well.)\n\nPhần thưởng: +%d EXP, +%d Vàng" % [REWARD_EXP, REWARD_GOLD])
	_refresh()


# ------------------------------------------------------------------ letter pickup + reading task
func _on_letter_area(body: Node3D, entered: bool) -> void:
	if not body.is_in_group("player"):
		return
	player_near_letter = entered
	var hud := _hud()
	if hud == null:
		return
	if not entered:
		hud.hide_interaction()
		if not hud.is_choosing():
			hud.hide_dialogue()
	elif step() == "find_letter":
		hud.show_interaction("Nhấn E để nhặt bức thư")


func _unhandled_input(event: InputEvent) -> void:
	if not event.is_action_pressed("interact") or step() != "find_letter" or not player_near_letter:
		return
	var hud := _hud()
	if hud.is_choosing():
		hud.hide_dialogue()          # E again closes the letter without answering
	else:
		_hint_shown = false
		_ask_letter("")
	get_viewport().set_input_as_handled()


func _ask_letter(prefix: String) -> void:
	var a := activity()
	if a.is_empty():
		_hud().show_dialogue("Bức thư", "Chưa có nội dung bài đọc cho lớp đã chọn.")
		return
	_hud().show_choices("Bức thư (đọc bằng tiếng Anh)", "%s%s\n\n%s" % [prefix, a["letter"], a["question"]], a["choices"],
		func(i: int) -> void: _on_answer(i))


func _on_answer(index: int) -> void:
	var a := activity()
	var correct := index == int(a["answer"])
	state.record_answer(state.grade, UNIT, String(a.get("skill", "reading")), correct, _hint_shown)
	if correct:
		state.set_quest_step(QUEST_ID, "return_letter")
		state.flags["lost_letter_found"] = true
		state.save_game()
		_hud().show_dialogue("Ngọc", "Đúng rồi! Mình mang thư về cho trưởng làng Tom thôi. (Correct! Let's take it to Mr Tom.)")
		_refresh()
	else:
		_hint_shown = true
		state.save_game()
		_ask_letter("Chưa đúng, thử lại nhé! Gợi ý: %s\n\n" % String(a.get("hint", "")))


func _on_profile_loaded() -> void:
	_apply_saved_stats()
	_refresh()


## Stats come from the profile's save; a new profile starts from the default stats (no carry-over).
func _apply_saved_stats() -> void:
	var hud := _hud()
	if state == null or hud == null:
		return
	if state.stats.is_empty():
		hud.stats.update(preload("res://systems/player_stats.gd").new().to_dict())
	else:
		hud.stats.update(state.stats)
