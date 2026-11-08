class_name WordMarket
extends Node3D
## Ben's word-jar stall (first minigame). In the fantasy village Ben sells "word jars": a traveller
## asks for a jar in English, Ngọc walks to the jar whose Vietnamese label matches and presses E.
## No menus during play: she keeps walking; a wrong jar makes the traveller say what that jar is
## ("That's a rubber! I need a compass."), so both words are learnt from the mistake.
## The first market day is the hidden placement check (lower-grade words); later days mix in the
## words that are due for spaced review (WordReview).

const STALL := Vector3(-5.0, 0.0, 18.5)         # open lawn south-west of the square, by the south road (probed)
const STALL_YAW := PI                            # customers' side (local -X) faces the road (world +X)
const CUSTOMERS := 6
const JARS := 4
const JAR_SPACING := 1.5
const PICK_RADIUS := 1.25
const BEN_RADIUS := 3.3                         # Ben stands behind the jars: talk to him across them
const GOLD_FIRST_TRY := 3
const GOLD_RETRY := 1
const EXP_PER_WORD := 5
const BEN := "Ben bán hàng"
const MODELS := "res://assets/npc/models/"

var state: GameState
var rng := RandomNumberGenerator.new()
var ben: Node3D
var customer: Node3D
var bubble: Label3D
var jars: Array[Node3D] = []
var jar_labels: Array[Label3D] = []
var jar_tags: Array[MeshInstance3D] = []
var jar_cards: Array = []
var ben_marker: Label3D

var active := false
var placement := false
var round_cards: Array = []
var index := 0
var tries := 0
var served := 0
var first_try := 0
var streak := 0
var gold_earned := 0
var missed: Array = []
var waiting := false                 # short pause while the next traveller walks up


func _ready() -> void:
	add_to_group("word_market")
	rng.randomize()
	call_deferred("_setup")


func _setup() -> void:
	state = get_tree().get_first_node_in_group("game_state") as GameState
	var land := get_tree().root.find_child("StarterVillageEnvironment", true, false)
	var y: float = land.get_height_at(STALL.x, STALL.z) if land != null and land.has_method("get_height_at") else 0.0
	global_position = Vector3(STALL.x, y, STALL.z)
	rotation.y = STALL_YAW
	_build()


func _hud() -> Node:
	return get_tree().get_first_node_in_group("dialogue_ui")


func _player() -> Node3D:
	return get_tree().get_first_node_in_group("player") as Node3D


# ------------------------------------------------------------------ stall
## Local layout (the player comes from the square on the -X side):
## Ben stands behind the jars at +X, the jars form a row along Z, the traveller waits at -X.
func _build() -> void:
	ben = _character("npc_ben_merchant_v02.glb", Vector3(1.7, 0, 0), -PI / 2)
	ben.name = "BenStall"
	ben_marker = _marker("!", Color(1.0, 0.82, 0.2), 2.3)
	ben_marker.add_to_group("quest_marker")
	ben.add_child(ben_marker)
	var sign := Label3D.new()
	sign.text = "Ben's Word Jars\nHũ Chữ của Ben"
	sign.font_size = 34
	sign.pixel_size = 0.005
	sign.modulate = Color(0.35, 0.18, 0.06)
	sign.outline_size = 10
	sign.outline_modulate = Color(1, 0.94, 0.8)
	sign.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	sign.position = Vector3(1.7, 2.75, 0)
	add_child(sign)
	var pot := load("res://assets/Exports/glTF/Pot_1.gltf") as PackedScene
	var crate_scene := load("res://assets/Exports/glTF/Crate_Wooden.gltf") as PackedScene
	for i in range(JARS):
		var jar := Node3D.new()
		jar.name = "Jar%d" % i
		jar.position = Vector3(0, 0, (i - (JARS - 1) / 2.0) * JAR_SPACING)
		add_child(jar)
		var crate := crate_scene.instantiate() as Node3D
		crate.scale = Vector3.ONE * 0.8
		jar.add_child(crate)
		var top := _top_of(crate)
		var body := StaticBody3D.new()
		var shape := CollisionShape3D.new()
		var box := BoxShape3D.new()
		box.size = Vector3(0.7, maxf(top, 0.5), 0.7)
		shape.shape = box
		shape.position.y = box.size.y / 2.0
		body.add_child(shape)
		jar.add_child(body)
		var model := pot.instantiate() as Node3D
		model.scale = Vector3.ONE * 2.0
		model.position.y = top
		jar.add_child(model)
		var label := Label3D.new()
		label.font_size = 40
		label.pixel_size = 0.005
		label.modulate = Color(0.25, 0.15, 0.06)
		label.outline_size = 0
		label.render_priority = 2
		label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		label.no_depth_test = true
		label.position.y = top + 0.95
		label.font_size = 46
		label.width = 300
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		jar.add_child(label)
		var tag := _tag()
		tag.position = label.position + Vector3(0, 0, 0)
		jar.add_child(tag)
		jar_tags.append(tag)
		jars.append(jar)
		jar_labels.append(label)
		jar_cards.append({})
	customer = _character("npc_sam_fisherman_v02.glb", Vector3(-2.6, 0, 0), PI / 2)
	customer.name = "Traveller"
	customer.visible = false
	bubble = Label3D.new()
	bubble.font_size = 44
	bubble.pixel_size = 0.005
	bubble.modulate = Color(0.15, 0.1, 0.05)
	bubble.outline_size = 16
	bubble.outline_modulate = Color(1, 1, 1)
	bubble.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	bubble.no_depth_test = true
	bubble.width = 520
	bubble.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	bubble.position.y = 3.0
	bubble.visible = false
	customer.add_child(bubble)
	_set_jars_visible(false)


## Height of the top of a model (its meshes' bounding box), in its parent's space.
func _top_of(node: Node3D) -> float:
	var top := 0.0
	for mesh_node in node.find_children("*", "MeshInstance3D", true, false):
		var mi := mesh_node as MeshInstance3D
		var box := mi.get_aabb()
		var local := node.transform * mi.transform if mi.get_parent() == node else node.transform * (node.global_transform.affine_inverse() * mi.global_transform)
		top = maxf(top, (local * box).end.y)
	return top


func _character(file: String, at: Vector3, yaw: float) -> Node3D:
	var holder := Node3D.new()
	holder.position = at
	holder.rotation.y = yaw
	add_child(holder)
	var scene := load(MODELS + file) as PackedScene
	if scene != null:
		holder.add_child(scene.instantiate())
	_play(holder, "Idle")
	return holder


func _marker(text: String, color: Color, height: float) -> Label3D:
	var label := Label3D.new()
	label.text = text
	label.font_size = 96
	label.pixel_size = 0.006
	label.modulate = color
	label.outline_size = 18
	label.outline_modulate = Color(0.3, 0.16, 0.05)
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.no_depth_test = true
	label.position.y = height
	return label


func _play(holder: Node3D, clip: String) -> void:
	if holder == null:
		return
	for player in holder.find_children("*", "AnimationPlayer", true, false):
		var anim := player as AnimationPlayer
		for name in [clip, clip.to_lower()]:
			if anim.has_animation(name):
				anim.play(name)
				return


func _set_jars_visible(on: bool) -> void:
	for label in jar_labels:
		label.visible = on
	for tag in jar_tags:
		tag.visible = on


## Parchment tag behind a jar label (a camera-facing card, so the word is easy to read).
func _tag() -> MeshInstance3D:
	var tag := MeshInstance3D.new()
	var quad := QuadMesh.new()
	quad.size = Vector2(1.45, 0.5)
	tag.mesh = quad
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = Color(0.98, 0.93, 0.78)
	mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	mat.no_depth_test = true
	mat.render_priority = 1
	tag.material_override = mat
	tag.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return tag


func _fit_tag(i: int) -> void:
	var text := jar_labels[i].text
	var lines := 2 if text.length() > 16 else 1
	(jar_tags[i].mesh as QuadMesh).size = Vector2(clampf(float(mini(text.length(), 16)) * 0.105 + 0.35, 0.7, 1.6), 0.32 + 0.24 * lines)


# ------------------------------------------------------------------ input
func _unhandled_input(event: InputEvent) -> void:
	if not event.is_action_pressed("interact") or state == null:
		return
	var hud := _hud()
	if hud == null or hud.is_choosing():
		return
	var actor := _player()
	if actor == null:
		return
	if active:
		var jar := nearest_jar(actor.global_position)
		if jar >= 0:
			serve(jar)
			get_viewport().set_input_as_handled()
	elif _flat_distance(actor.global_position, ben.global_position) < BEN_RADIUS:
		talk_to_ben()
		get_viewport().set_input_as_handled()


func _process(_delta: float) -> void:
	if not active or state == null:
		return
	var actor := _player()
	if actor != null and actor.global_position.distance_to(global_position) > 16.0:
		end_round(true)


func _flat_distance(a: Vector3, b: Vector3) -> float:
	return Vector2(a.x - b.x, a.z - b.z).length()


func nearest_jar(at: Vector3) -> int:
	var best := -1
	var best_d := PICK_RADIUS
	for i in range(jars.size()):
		var d := Vector2(at.x - jars[i].global_position.x, at.z - jars[i].global_position.z).length()
		if d < best_d:
			best = i
			best_d = d
	return best


# ------------------------------------------------------------------ Ben
func talk_to_ben() -> void:
	var hud := _hud()
	if state.grade == 0:
		hud.show_dialogue(BEN, "Chào cháu! Hãy nói chuyện với trưởng làng Tom trước đã nhé.")
		return
	_play(ben, "Talk")
	var first := not bool(state.flags.get("market_first_day", false))
	var text := "Hôm nay chợ đông khách lạ từ xứ khác tới. Họ chỉ nói tiếng Anh thôi! Cháu đọc tên món họ cần rồi đưa đúng hũ chữ giúp ta nhé?" if first \
		else "Lại có khách tới mua hũ chữ đây. Cháu phụ ta một buổi nhé?"
	hud.show_choices(BEN, text + "\n(Đi tới hũ có nghĩa đúng rồi nhấn E.)",
		["Vâng, cháu giúp ngay!", "Để lát nữa ạ"], func(i: int) -> void:
			if i == 0:
				start_round()
			else:
				hud.show_dialogue(BEN, "Ừ, khi nào rảnh cháu quay lại nhé!"))


func start_round() -> void:
	placement = not bool(state.flags.get("market_first_day", false))
	var unit := int(state.flags.get("current_unit", 1))
	round_cards = WordReview.pick_placement(state.grade, unit, CUSTOMERS, rng) if placement \
		else WordReview.pick_round(state, state.grade, unit, CUSTOMERS, rng)
	if round_cards.is_empty():
		_hud().show_dialogue(BEN, "Hôm nay chưa có hàng cho lớp của cháu. Ta sẽ nhập thêm sau nhé!")
		return
	active = true
	index = 0
	served = 0
	first_try = 0
	streak = 0
	gold_earned = 0
	missed = []
	ben_marker.visible = false
	_hud().hide_dialogue()
	_next_customer()


func _next_customer() -> void:
	if not active:
		return
	if index >= round_cards.size():
		end_round(false)
		return
	tries = 0
	var target: Dictionary = round_cards[index]
	var options := [target] + WordReview.distractors(target, JARS - 1, rng)
	WordReview._shuffle(options, rng)
	for i in range(JARS):
		jar_cards[i] = options[i] if i < options.size() else {}
		jar_labels[i].text = String(jar_cards[i].get("vi", ""))
		_fit_tag(i)
	_set_jars_visible(true)
	customer.visible = true
	customer.scale = Vector3(0.6, 1.25, 0.6)
	create_tween().tween_property(customer, "scale", Vector3.ONE, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_play(customer, "Wave")
	_say("A jar of \"%s\", please!" % target["word"], "Đi tới hũ có nghĩa đúng rồi nhấn E")
	waiting = false
	_update_tracker()


## Ngọc hands over jar `jar_index` to the current traveller.
func serve(jar_index: int) -> bool:
	if not active or waiting or jar_index < 0 or jar_index >= JARS:
		return false
	var target: Dictionary = round_cards[index]
	var given: Dictionary = jar_cards[jar_index]
	var correct: bool = not given.is_empty() and given["id"] == target["id"]
	if tries == 0:
		WordReview.record(state, target, correct)
		state.record_answer(int(target["grade"]), int(target["unit"]), "vocabulary", correct, false)
	tries += 1
	var hud := _hud()
	if correct:
		var gold := GOLD_FIRST_TRY if tries == 1 else GOLD_RETRY
		if tries == 1:
			first_try += 1
			streak += 1
			if streak >= 3:
				gold += 1
		else:
			streak = 0
		gold_earned += gold
		served += 1
		hud.stats.add_gold(gold)
		hud.stats.add_experience(EXP_PER_WORD)
		_pop(jars[jar_index])
		_float_text(jars[jar_index], "+%d Vàng" % gold + ("  Chuỗi %d!" % streak if streak >= 3 else ""), Color(1, 0.85, 0.25))
		_play(customer, "Wave")
		_say("Thank you!  \"%s\" = %s" % [target["word"], target["vi"]], "")
		index += 1
		waiting = true
		_save()
		get_tree().create_timer(1.1).timeout.connect(_next_customer)
	else:
		streak = 0
		if tries == 1:
			missed.append(target)
		_shake(jars[jar_index])
		var what := "That's \"%s\"!" % given.get("word", "?") if not given.is_empty() else "Hmm?"
		_say("%s  I need \"%s\"." % [what, target["word"]], "Thử hũ khác nhé")
		_save()
	_update_tracker()
	return correct


## The traveller speaks: the line goes to the HUD request card (bubble mirrors it, hidden).
func _say(text: String, hint: String) -> void:
	bubble.text = text
	var hud := _hud()
	if hud != null and hud.has_method("show_request"):
		hud.show_request("Khách lạ (Traveller):", text, hint)


func end_round(left_early: bool) -> void:
	active = false
	if _hud() != null and _hud().has_method("hide_request"):
		_hud().hide_request()
	_set_jars_visible(false)
	customer.visible = false
	ben_marker.visible = true
	_play(ben, "Talk")
	var was_placement := placement
	if served > 0 or not left_early:
		state.flags["market_first_day"] = true
	if not left_early:
		var bonus := 5 if first_try == round_cards.size() else 0
		if bonus > 0:
			_hud().stats.add_gold(bonus)
			gold_earned += bonus
	_save()
	_restore_tracker()
	var hud := _hud()
	if left_early:
		hud.show_dialogue(BEN, "Ơ, cháu đi đâu thế? Không sao, lúc nào quay lại phụ ta tiếp nhé!")
		return
	var text := "Xong buổi chợ! Cháu đưa đúng ngay lần đầu %d/%d hũ, được %d Vàng." % [first_try, round_cards.size(), gold_earned]
	if not missed.is_empty():
		var words := []
		for c in missed.slice(0, 4):
			words.append("%s = %s" % [c["word"], c["vi"]])
		text += "\nKhách sẽ còn hỏi lại mấy hũ này: " + ", ".join(words)
	if was_placement:
		text += "\n(Ben đã nhớ những từ cháu còn lúng túng để lần sau hỏi lại.)"
	hud.show_dialogue(BEN, text)


func _save() -> void:
	var hud := _hud()
	hud.stats.vocabulary = WordReview.learned_count(state)
	hud.stats.changed.emit()
	state.stats = hud.stats.to_dict()
	state.save_game()


func _update_tracker() -> void:
	var hud := _hud()
	if hud != null and hud.has_method("set_quest_text"):
		hud.set_quest_text("Chợ Ben · Khách %d/%d · Vàng +%d\nĐưa đúng hũ chữ (đứng cạnh hũ, nhấn E)" % [mini(index + 1, round_cards.size()), round_cards.size(), gold_earned])


func _restore_tracker() -> void:
	var quest := get_tree().get_first_node_in_group("quest_lost_letter")
	if quest != null and quest.has_method("_refresh"):
		quest._refresh()
	elif _hud() != null:
		_hud().set_quest_text("")


# ------------------------------------------------------------------ feedback (game-feel: short, eased, returns to rest)
func _pop(node: Node3D) -> void:
	node.scale = Vector3(1.25, 0.75, 1.25)
	create_tween().tween_property(node, "scale", Vector3.ONE, 0.22).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func _shake(node: Node3D) -> void:
	var base := node.position
	var tw := create_tween()
	for dx in [0.08, -0.08, 0.05, 0.0]:
		tw.tween_property(node, "position", base + Vector3(0, 0, dx), 0.05)


func _float_text(node: Node3D, text: String, color: Color) -> void:
	var label := Label3D.new()
	label.text = text
	label.font_size = 48
	label.pixel_size = 0.005
	label.modulate = color
	label.outline_size = 14
	label.outline_modulate = Color(0.3, 0.16, 0.05)
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.no_depth_test = true
	add_child(label)
	label.global_position = node.global_position + Vector3(0, 1.6, 0)
	var tw := create_tween().set_parallel(true)
	tw.tween_property(label, "position:y", label.position.y + 0.9, 0.9).set_ease(Tween.EASE_OUT)
	tw.tween_property(label, "modulate:a", 0.0, 0.9).set_delay(0.3)
	tw.chain().tween_callback(label.queue_free)
