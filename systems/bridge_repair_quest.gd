class_name BridgeRepairQuest
extends Node3D
## Vertical slice "Sửa cây cầu" (P1). After the lost letter, Tom sends Ngọc to Sam at the broken
## south bridge. Sam asks IN ENGLISH for three things and where they are; Ngọc finds each one in
## the village next to a look-alike decoy (rope/chain, axe/pickaxe, log/rock). Back at the bridge
## Pip, the river spirit, reads the repair steps in English and Ngọc does them in the right order.
## The bridge is rebuilt, Pip shows a clue towards the Forest of Memories and Tom gives the reward.
## Steps: not_started -> ask_sam -> collect -> repair -> report_tom -> done.
## Text comes from data/learning (activity "bridge_repair") for the profile's grade only.

const QUEST_ID := "bridge_repair"
const UNIT := 1
const REWARD_EXP := 80
const REWARD_GOLD := 30
const BRIDGE_POS := Vector2(10.5, 44.0)             # river crossing on the south meadow road
const SAM_POS := Vector2(2.6, 46.8)
const PIP_POS := Vector2(4.2, 42.6)
const PICK_RADIUS := 1.3
const TALK_RADIUS := 2.4
const TOM := "Trưởng làng Tom"
const SAM := "Sam ngư dân"
const PIP := "Pip (tinh linh)"
const PROPS := "res://assets/Exports/glTF/"
## Where each item lies: [needed (x, z), decoy (x, z)] and the models used.
const SPOTS := {
	"rope": [Vector2(17.0, 10.0), Vector2(17.0, 11.8)],
	"log": [Vector2(2.0, 49.6), Vector2(2.0, 51.6)],
}
const MODELS := {
	"rope": "Rope_1.gltf", "chain": "Chain_Coil.gltf", "axe": "Axe_Bronze.gltf", "pickaxe": "Pickaxe_Bronze.gltf",
	"log": "Anvil_Log.gltf", "rock": "res://assets/glTF/Rock_Medium_1.gltf",
}
const PLACE_NAMES := {"rope": "bến thuyền", "axe": "rìu: phụ Ben bán hàng", "log": "bờ sông gần Sam"}
const NEEDED := ["rope", "axe", "log"]

var state: GameState
var land: Node
var bridge_root: Node3D
var broken_model: Node3D
var fixed_bridge: Node3D
var sam: Node3D
var sam_marker: Label3D
var pip: Node3D
var tom_marker: Label3D
var items: Array[Dictionary] = []                  # {node, id, word, needed}
var _repair_step := 0


func _ready() -> void:
	add_to_group("quest_bridge_repair")
	call_deferred("_setup")


func _setup() -> void:
	state = get_tree().get_first_node_in_group("game_state") as GameState
	land = get_tree().root.find_child("StarterVillageEnvironment", true, false)
	_build_bridge()
	_build_sam()
	_build_pip()
	_build_items()
	tom_marker = _marker("!", Color(1.0, 0.82, 0.2))
	tom_marker.add_to_group("quest_marker")
	var tom := get_tree().root.find_child("ElderRowan", true, false) as Node3D
	if tom != null:
		tom.add_child(tom_marker)
		tom_marker.position.y = 2.25
	var market := get_tree().get_first_node_in_group("word_market")
	if market != null and market.has_signal("round_finished"):
		market.round_finished.connect(_on_market_round)
	if state != null:
		state.loaded.connect(_refresh)
		state.quest_changed.connect(func(_id: String) -> void: _refresh())
	_refresh()


func _hud() -> Node:
	return get_tree().get_first_node_in_group("dialogue_ui")


func _player() -> Node3D:
	return get_tree().get_first_node_in_group("player") as Node3D


func _y(x: float, z: float) -> float:
	return land.get_height_at(x, z) if land != null and land.has_method("get_height_at") else 0.0


func step() -> String:
	return String(state.quest(QUEST_ID)["step"]) if state != null else "not_started"


func activity() -> Dictionary:
	return LearningCatalog.activity(state.grade, UNIT, QUEST_ID) if state != null else {}


func collected() -> Array:
	return state.quest(QUEST_ID).get("items", [])


# ------------------------------------------------------------------ world
func _build_bridge() -> void:
	bridge_root = Node3D.new()
	bridge_root.name = "SouthBridge"
	add_child(bridge_root)
	var half := 11.5 / 2.0
	var y := (_y(BRIDGE_POS.x - half, BRIDGE_POS.y) + _y(BRIDGE_POS.x + half, BRIDGE_POS.y)) / 2.0
	bridge_root.position = Vector3(BRIDGE_POS.x, y, BRIDGE_POS.y)
	bridge_root.rotation.y = PI / 2.0                 # the bridge spans X (across the river)
	broken_model = (load("res://assets/environment/village/models/prop_bridge_broken_v02.glb") as PackedScene).instantiate()
	broken_model.name = "Broken"
	bridge_root.add_child(broken_model)


func _set_repaired(repaired: bool) -> void:
	broken_model.visible = not repaired
	if repaired and fixed_bridge == null:
		fixed_bridge = (load("res://world/props/chibi_bridge.tscn") as PackedScene).instantiate()
		fixed_bridge.name = "Repaired"
		bridge_root.add_child(fixed_bridge)
	if fixed_bridge != null:
		fixed_bridge.visible = repaired
		fixed_bridge.process_mode = Node.PROCESS_MODE_INHERIT if repaired else Node.PROCESS_MODE_DISABLED
		(fixed_bridge as CollisionObject3D).collision_layer = 1 if repaired else 0


func _build_sam() -> void:
	sam = Node3D.new()
	sam.name = "SamAtBridge"
	add_child(sam)
	sam.position = Vector3(SAM_POS.x, _y(SAM_POS.x, SAM_POS.y), SAM_POS.y)
	sam.rotation.y = PI / 2.0                        # looks at the bridge (+X)
	var model := load("res://assets/npc/models/npc_sam_fisherman_v02.glb") as PackedScene
	if model != null:
		sam.add_child(model.instantiate())
	_play(sam, "Idle")
	sam_marker = _marker("!", Color(1.0, 0.82, 0.2))
	sam_marker.add_to_group("quest_marker")
	sam_marker.position.y = 2.2
	sam.add_child(sam_marker)


## Pip: the little river spirit (chibi05 model from tools/chibi05/build_pip_chibi.py), glowing softly.
func _build_pip() -> void:
	pip = Node3D.new()
	pip.name = "Pip"
	add_child(pip)
	pip.position = Vector3(PIP_POS.x, _y(PIP_POS.x, PIP_POS.y) + 1.6, PIP_POS.y)
	var model := (load("res://assets/npc/models/npc_pip_spirit_v02.glb") as PackedScene).instantiate() as Node3D
	model.name = "Model"
	model.scale = Vector3.ONE * 1.5
	model.position.y = -0.45
	pip.add_child(model)
	var light := OmniLight3D.new()
	light.light_color = Color(0.55, 0.85, 1.0)
	light.light_energy = 1.2
	light.omni_range = 3.0
	pip.add_child(light)
	var label := _marker("Pip", Color(0.75, 0.95, 1.0))
	label.font_size = 48
	label.position.y = 0.55
	label.font_size = 40
	pip.add_child(label)
	pip.visible = false


func _build_items() -> void:
	for id in SPOTS:
		var spots: Array = SPOTS[id]
		for k in [0, 1]:
			var at: Vector2 = spots[k]
			var holder := Node3D.new()
			holder.name = "Item_%s_%d" % [id, k]
			add_child(holder)
			holder.position = Vector3(at.x, _y(at.x, at.y), at.y)
			var label := _marker("", Color(1, 0.97, 0.85))
			label.font_size = 52
			label.position.y = 1.2
			holder.add_child(label)
			var glow := OmniLight3D.new()
			glow.light_color = Color(1.0, 0.9, 0.6)
			glow.light_energy = 0.6
			glow.omni_range = 1.8
			glow.position.y = 0.6
			holder.add_child(glow)
			items.append({"node": holder, "label": label, "id": id, "needed": k == 0, "model": null})


func _dress_items() -> void:
	var a := activity()
	for item in items:
		var mat: Dictionary = {}
		for m in a.get("materials", []):
			if m["id"] == item["id"]:
				mat = m
		var word := String(mat.get("word", item["id"])) if item["needed"] else String(mat.get("decoy", {}).get("word", ""))
		item["word"] = word
		(item["label"] as Label3D).text = word
		if item["model"] == null and word != "":
			var path := String(MODELS.get(word, ""))
			if path != "":
				var scene := load(path if path.begins_with("res://") else PROPS + path) as PackedScene
				if scene != null:
					var model := scene.instantiate() as Node3D
					model.scale = Vector3.ONE * (0.55 if word == "rock" else 1.2)
					(item["node"] as Node3D).add_child(model)
					item["model"] = model


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


func _play(holder: Node3D, clip: String) -> void:
	for player in holder.find_children("*", "AnimationPlayer", true, false):
		var anim := player as AnimationPlayer
		if anim.has_animation(clip):
			anim.play(clip)
			return


func _process(_delta: float) -> void:
	if pip != null and pip.visible:
		var t := Time.get_ticks_msec() / 1000.0
		pip.position.y = _y(PIP_POS.x, PIP_POS.y) + 1.6 + sin(t * 2.5) * 0.12
		var actor := _player()
		if actor != null:                            # always faces Ngọc, with a gentle sway
			var to := actor.global_position - pip.global_position
			pip.rotation.y = atan2(to.x, to.z)
		pip.rotation.z = sin(t * 1.7) * 0.12


## Shows everything that depends on the quest step (also after a profile switch or a load).
func _refresh() -> void:
	if state == null or broken_model == null:
		return
	var s := step()
	_set_repaired(s in ["report_tom", "done"])
	_dress_items()
	var got := collected()
	for item in items:
		var visible: bool = s == "collect" and not got.has(item["id"]) and String(item["word"]) != ""
		(item["node"] as Node3D).visible = visible
	pip.visible = s in ["repair", "report_tom"]
	sam_marker.visible = s in ["ask_sam", "repair"] or (s == "collect" and got.size() >= 3)
	sam_marker.text = "?" if s == "collect" else "!"
	var letter_done := String(state.quest("lost_letter")["step"]) == "done"
	tom_marker.visible = (s == "not_started" and letter_done and not activity().is_empty()) or s == "report_tom"
	tom_marker.text = "?" if s == "report_tom" else "!"
	_update_tracker()


func _update_tracker() -> void:
	var hud := _hud()
	if hud == null or not hud.has_method("set_quest_text"):
		return
	var market := get_tree().get_first_node_in_group("word_market")
	if market != null and market.active:
		return
	var letter := String(state.quest("lost_letter")["step"])
	if letter != "done" and letter != "not_started":
		return                                       # the letter quest owns the tracker
	match step():
		"ask_sam":
			hud.set_quest_text("Nhiệm vụ: Sửa cây cầu\nGặp Sam ở đầu cầu gỗ phía Nam (!)")
		"collect":
			var got := collected()
			var lines := []
			for id in NEEDED:
				lines.append(("✔ " if got.has(id) else "• ") + PLACE_NAMES[id])
			hud.set_quest_text("Nhiệm vụ: Sửa cây cầu · tìm đồ Sam cần (%d/3)\n%s" % [got.size(), "   ".join(lines)])
		"repair":
			hud.set_quest_text("Nhiệm vụ: Sửa cây cầu\nĐem đồ về cho Sam ở đầu cầu")
		"report_tom":
			hud.set_quest_text("Nhiệm vụ: Sửa cây cầu\nKể cho trưởng làng Tom nghe (?)")
		_:
			if letter == "done":
				hud.set_quest_text("")


# ------------------------------------------------------------------ Tom (via lost_letter_quest)
## Returns true when this quest handled the talk with Tom.
func handle_tom(elder: Node) -> bool:
	if state == null:
		return false
	var hud := _hud()
	match step():
		"not_started":
			var a := activity()
			if a.is_empty():
				hud.show_dialogue(TOM, "Cây cầu phía Nam bị lũ làm gãy rồi. Phần sửa cầu cho lớp %d đang được soạn, con chờ thêm nhé." % state.grade)
				return true
			if elder.has_method("_play_gesture"):
				elder._play_gesture("Talk")
			hud.show_choices(TOM, String(a["tom_offer"]), ["Vâng, con đi ngay!", "Để lát nữa ạ"], func(i: int) -> void:
				if i == 0:
					state.set_quest_step(QUEST_ID, "ask_sam")
					state.save_game()
					hud.show_dialogue(TOM, "Đi theo con đường lát đá về phía Nam, qua biển chỉ đường là thấy Sam.")
				else:
					hud.show_dialogue(TOM, "Ừ, khi nào sẵn sàng thì quay lại nhé."))
			return true
		"ask_sam", "collect", "repair":
			hud.show_dialogue(TOM, "Sam đang chờ con ở đầu cầu phía Nam đấy.")
			return true
		"report_tom":
			_finish(elder)
			return true
	return false


func _finish(elder: Node) -> void:
	var q := state.quest(QUEST_ID)
	var hud := _hud()
	if not bool(q.get("rewarded", false)):
		q["rewarded"] = true
		hud.stats.add_experience(REWARD_EXP)
		hud.stats.add_gold(REWARD_GOLD)
	q["done"] = true
	state.flags["forest_clue"] = true
	get_tree().call_group("sound", "play", "coin")
	state.set_quest_step(QUEST_ID, "done")
	state.stats = hud.stats.to_dict()
	state.save_game()
	if elder.has_method("_play_gesture"):
		elder._play_gesture("Wave")
	hud.show_dialogue(TOM, "Con và Pip sửa được cây cầu rồi ư? Giỏi lắm!\nDấu chân về phía Rừng Ký Ức... Có lẽ mảnh La Bàn Ngôn Ngữ đầu tiên ở đó. Khi cổng rừng mở, ta sẽ cùng đi.\n\nPhần thưởng: +%d EXP, +%d Vàng" % [REWARD_EXP, REWARD_GOLD])
	_refresh()


# ------------------------------------------------------------------ Ben gives the axe for a market shift
func needs_axe() -> bool:
	return state != null and step() == "collect" and not collected().has("axe")


func _on_market_round(_first_try: int, _total: int) -> void:
	if not needs_axe():
		return
	var got: Array = collected()
	got.append("axe")
	state.quest(QUEST_ID)["items"] = got
	state.save_game()
	var hud := _hud()
	hud.show_dialogue("Ben bán hàng", hud.dialogue_label.text + "\n\nĐây, cái rìu ta hứa! Cháu mang cho Sam nhé. (Nhận được: axe — cái rìu, %d/3)" % got.size())
	_update_tracker()


# ------------------------------------------------------------------ Sam, items, repair
func _unhandled_input(event: InputEvent) -> void:
	if not event.is_action_pressed("interact") or state == null:
		return
	var hud := _hud()
	var actor := _player()
	if hud == null or actor == null or hud.is_choosing():
		return
	var s := step()
	if s == "collect":
		var item := nearest_item(actor.global_position)
		if not item.is_empty():
			pick(item)
			get_viewport().set_input_as_handled()
			return
	if s in ["ask_sam", "collect", "repair", "report_tom", "done"] and _flat(actor.global_position, sam.global_position) < TALK_RADIUS:
		talk_to_sam()
		get_viewport().set_input_as_handled()


func _flat(a: Vector3, b: Vector3) -> float:
	return Vector2(a.x - b.x, a.z - b.z).length()


func nearest_item(at: Vector3) -> Dictionary:
	var best := {}
	var best_d := PICK_RADIUS
	for item in items:
		var node := item["node"] as Node3D
		if not node.visible:
			continue
		var d := _flat(at, node.global_position)
		if d < best_d:
			best = item
			best_d = d
	return best


func talk_to_sam() -> void:
	var hud := _hud()
	var a := activity()
	_play(sam, "Wave")
	match step():
		"ask_sam":
			state.set_quest_step(QUEST_ID, "collect")
			state.quest(QUEST_ID)["items"] = []
			state.save_game()
			hud.show_dialogue(SAM, String(a.get("sam_request", "")))
		"collect":
			if collected().size() >= 3:
				_start_repair()
			else:
				hud.show_dialogue(SAM, String(a.get("sam_request", "")))
		"repair":
			_start_repair()
		_:
			hud.show_dialogue(SAM, "Thanks again! Now I can cross the river to go fishing.")


## Ngọc picks up an item; a decoy makes her re-read Sam's request.
func pick(item: Dictionary) -> bool:
	var a := activity()
	var hud := _hud()
	var correct: bool = item["needed"]
	state.record_answer(state.grade, UNIT, "vocabulary", correct, false)
	if correct:
		var got: Array = collected()
		got.append(item["id"])
		state.quest(QUEST_ID)["items"] = got
		get_tree().call_group("sound", "play", "pickup")
		var node := item["node"] as Node3D
		var tw := create_tween()
		tw.tween_property(node, "scale", Vector3(1.3, 1.3, 1.3), 0.12).set_ease(Tween.EASE_OUT)
		tw.tween_property(node, "scale", Vector3.ZERO, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
		tw.tween_callback(func() -> void:
			node.scale = Vector3.ONE
			_refresh())
		if got.size() >= 3:
			hud.show_dialogue("Ngọc", "Đủ \"%s\" rồi! Mang về cho Sam ở đầu cầu thôi." % ", ".join(got))
		else:
			hud.show_dialogue("Ngọc", "Đây rồi: \"%s\"! (%d/3)" % [item["word"], got.size()])
	else:
		get_tree().call_group("sound", "play", "wrong")
		var node := item["node"] as Node3D
		var base := node.position
		var tw := create_tween()
		for dx in [0.08, -0.08, 0.05, 0.0]:
			tw.tween_property(node, "position", base + Vector3(dx, 0, 0), 0.05)
		hud.show_dialogue("Ngọc", "Hmm, \"%s\"... Hình như Sam không cần cái này. Sam đã nói:\n%s" % [item["word"], String(a.get("sam_request", ""))])
	state.save_game()
	_update_tracker()
	return correct


func _start_repair() -> void:
	var a := activity()
	if step() == "collect":
		state.set_quest_step(QUEST_ID, "repair")
		state.save_game()
	pip.visible = true
	pip.scale = Vector3(0.2, 0.2, 0.2)
	create_tween().tween_property(pip, "scale", Vector3.ONE, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_repair_step = 0
	_ask_repair_step(String(a.get("pip_intro", "")) + "\n")


func _instructions_text() -> String:
	var lines := []
	for ins in activity().get("instructions", []):
		lines.append(String(ins["en"]))
	return "\n".join(lines)


func _ask_repair_step(prefix: String) -> void:
	var steps: Array = activity().get("instructions", [])
	var order := ["Việc đầu tiên", "Việc tiếp theo", "Việc cuối cùng"]
	var options := []
	for ins in steps:
		options.append(String(ins["vi"]))
	var shuffled := options.duplicate()
	shuffled.sort()                                    # stable but not in the reading order
	_hud().show_choices(PIP, "%s%s\n\n%s là gì?" % [prefix, _instructions_text(), order[mini(_repair_step, 2)]], shuffled,
		func(i: int) -> void: _on_repair_choice(String(shuffled[i])))


func _on_repair_choice(choice_vi: String) -> void:
	var steps: Array = activity().get("instructions", [])
	var expected: Dictionary = steps[_repair_step]
	var correct := choice_vi == String(expected["vi"])
	state.record_answer(state.grade, UNIT, "reading", correct, false)
	get_tree().call_group("sound", "play", "correct" if correct else "wrong")
	if not correct:
		_ask_repair_step("Not yet! Read again: \"%s\"\n" % expected["en"])
		return
	_repair_step += 1
	_float_text(["Xẻ ván!", "Đặt ván!", "Buộc dây!"][mini(_repair_step - 1, 2)])
	if _repair_step < steps.size():
		_ask_repair_step("Great!\n")
		return
	_complete_repair()


func _complete_repair() -> void:
	state.set_quest_step(QUEST_ID, "report_tom")
	state.save_game()
	_set_repaired(true)
	get_tree().call_group("sound", "play", "fanfare")
	fixed_bridge.scale = Vector3(1.0, 0.2, 1.0)
	create_tween().tween_property(fixed_bridge, "scale", Vector3.ONE, 0.45).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_play(sam, "Wave")
	var actor := _player()
	if actor != null and actor.has_method("play_action"):
		actor.play_action("Celebrate")
	_hud().show_dialogue(PIP, "%s\n\n(Pip: Bên kia sông có dấu chân nhỏ dẫn về Rừng Ký Ức! Về kể cho trưởng làng Tom nhé.)" % String(activity().get("clue", "")))
	_refresh()


func _float_text(text: String) -> void:
	var label := _marker(text, Color(1, 0.88, 0.35))
	label.font_size = 56
	add_child(label)
	label.global_position = bridge_root.global_position + Vector3(0, 2.2, 0)
	var tw := create_tween().set_parallel(true)
	tw.tween_property(label, "position:y", label.position.y + 1.0, 0.9).set_ease(Tween.EASE_OUT)
	tw.tween_property(label, "modulate:a", 0.0, 0.9).set_delay(0.3)
	tw.chain().tween_callback(label.queue_free)
