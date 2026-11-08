class_name ProfileMenu
extends CanvasLayer
## "Ai đang chơi?" screen shown when the game starts (F5): pick a child's profile or create one
## with a name and a grade. Each profile keeps its own save (ProfileStore + GameState.use_profile).
## Headless tests load the world without this screen; they call open() themselves.

signal profile_chosen(profile: Dictionary)

const FONT_BIG := 30
const FONT := 24

var root: Control
var list_box: VBoxContainer
var create_box: VBoxContainer
var name_edit: LineEdit
var grade_buttons: Array[Button] = []
var chosen_grade := 0
var start_button: Button
var badge: Label


func _ready() -> void:
	layer = 20
	add_to_group("profile_menu")
	_build()
	root.hide()
	call_deferred("_auto_open")


## Only a real game start shows the menu (the world is the running main scene, not a test).
func _auto_open() -> void:
	var world := get_parent().get_parent() if get_parent() != null else null
	if GameState.override_path == "" and world != null and get_tree().current_scene == world:
		open()


func open() -> void:
	_show_list()
	root.show()
	get_tree().call_group("player", "set_input_locked", true)


func is_open() -> bool:
	return root.visible


# ------------------------------------------------------------------ layout
func _build() -> void:
	root = Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(root)
	var dim := ColorRect.new()
	dim.color = Color(0.08, 0.12, 0.10, 0.82)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(center)
	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.98, 0.93, 0.80)
	style.border_color = Color(0.55, 0.36, 0.16)
	style.set_border_width_all(4)
	style.set_corner_radius_all(18)
	style.content_margin_left = 36
	style.content_margin_right = 36
	style.content_margin_top = 28
	style.content_margin_bottom = 28
	panel.add_theme_stylebox_override("panel", style)
	panel.custom_minimum_size = Vector2(560, 0)
	center.add_child(panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 14)
	panel.add_child(column)
	column.add_child(_label("English Quest", 40, Color(0.45, 0.24, 0.08)))
	list_box = VBoxContainer.new()
	list_box.add_theme_constant_override("separation", 10)
	column.add_child(list_box)
	create_box = VBoxContainer.new()
	create_box.add_theme_constant_override("separation", 10)
	column.add_child(create_box)
	create_box.add_child(_label("Tên của con", FONT, Color(0.3, 0.2, 0.1)))
	name_edit = LineEdit.new()
	name_edit.placeholder_text = "Ví dụ: Minh"
	name_edit.max_length = 20
	name_edit.add_theme_font_size_override("font_size", FONT)
	name_edit.text_submitted.connect(func(_t: String) -> void: _on_start())
	create_box.add_child(name_edit)
	create_box.add_child(_label("Con đang học lớp mấy?", FONT, Color(0.3, 0.2, 0.1)))
	var grades := HBoxContainer.new()
	grades.add_theme_constant_override("separation", 10)
	create_box.add_child(grades)
	for g in ProfileStore.GRADES:
		var b := _button("Lớp %d" % g)
		b.toggle_mode = true
		b.custom_minimum_size = Vector2(110, 56)
		b.pressed.connect(_pick_grade.bind(g))
		grades.add_child(b)
		grade_buttons.append(b)
	start_button = _button("Bắt đầu phiêu lưu!")
	start_button.pressed.connect(_on_start)
	create_box.add_child(start_button)
	var back := _button("Quay lại")
	back.pressed.connect(_show_list)
	create_box.add_child(back)
	badge = Label.new()
	badge.add_theme_font_size_override("font_size", 18)
	badge.add_theme_color_override("font_color", Color(1, 0.95, 0.8))
	badge.add_theme_color_override("font_outline_color", Color(0.2, 0.12, 0.05))
	badge.add_theme_constant_override("outline_size", 6)
	badge.set_anchors_preset(Control.PRESET_CENTER_TOP)
	badge.position.y = 8
	badge.hide()
	add_child(badge)


func _label(text: String, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	return l


func _button(text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(0, 58)
	b.add_theme_font_size_override("font_size", FONT)
	return b


# ------------------------------------------------------------------ screens
func _show_list() -> void:
	create_box.hide()
	list_box.show()
	for child in list_box.get_children():
		child.queue_free()
	var profiles := ProfileStore.profiles()
	list_box.add_child(_label("Ai đang chơi?" if not profiles.is_empty() else "Chào mừng! Tạo hồ sơ cho con nhé.", FONT_BIG, Color(0.3, 0.2, 0.1)))
	var first: Button = null
	for p in profiles:
		var b := _button("%s  ·  Lớp %d" % [p["name"], int(p["grade"])])
		b.pressed.connect(choose.bind(p))
		list_box.add_child(b)
		if first == null or p["id"] == ProfileStore.load_index().get("last", ""):
			first = b
	var add := _button("+ Thêm người chơi mới")
	add.pressed.connect(show_create)
	list_box.add_child(add)
	(first if first != null else add).call_deferred("grab_focus")


func show_create() -> void:
	list_box.hide()
	create_box.show()
	name_edit.text = ""
	_pick_grade(0)
	name_edit.call_deferred("grab_focus")


func _pick_grade(grade: int) -> void:
	chosen_grade = grade
	for i in range(grade_buttons.size()):
		grade_buttons[i].button_pressed = ProfileStore.GRADES[i] == grade
	start_button.disabled = grade == 0


## Create the profile typed in the form (also used by tests).
func create_profile(player_name: String, grade: int) -> Dictionary:
	name_edit.text = player_name
	_pick_grade(grade)
	return _on_start()


func _on_start() -> Dictionary:
	if chosen_grade == 0:
		return {}
	var profile := ProfileStore.create(name_edit.text, chosen_grade)
	choose(profile)
	return profile


func choose(profile: Dictionary) -> void:
	ProfileStore.set_last(String(profile["id"]))
	var state := get_tree().get_first_node_in_group("game_state") as GameState
	if state != null:
		state.use_profile(profile)
	root.hide()
	badge.text = "%s · lớp %d" % [profile["name"], int(profile["grade"])]
	badge.show()
	get_tree().call_group("player", "set_input_locked", false)
	profile_chosen.emit(profile)
