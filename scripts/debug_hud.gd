extends CanvasLayer

@onready var fps_label: Label = $FPSLabel
@onready var interaction_hint: Label = $InteractionHint
@onready var dialogue_panel: PanelContainer = $DialoguePanel
@onready var speaker_label: Label = $DialoguePanel/Margin/VBox/Speaker
@onready var dialogue_label: Label = $DialoguePanel/Margin/VBox/Dialogue

var update_accumulator := 0.0
var stats = preload("res://systems/player_stats.gd").new()
var title: Label
var hp_bar: ProgressBar
var exp_bar: ProgressBar
var wallet: Label
var quest_label: Label
var choices_box: VBoxContainer
var _choice_callback: Callable


func _ready() -> void:
	interaction_hint.hide()
	dialogue_panel.hide()
	$ControlHint.hide()
	fps_label.hide()
	$ControlHint.offset_top = 220
	$ControlHint.offset_bottom = 340
	$ControlHint/MarginContainer/Label.text = "WASD: di chuyển · Shift: chạy · Space: nhảy\nGiữ chuột phải: xoay · Con lăn: zoom · R: đặt lại\nE: tương tác · F1: trợ giúp · F3: FPS"
	_build_rpg_hud()
	_build_quest_ui()
	stats.changed.connect(_refresh_stats)
	_refresh_stats()


func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.physical_keycode == KEY_F1:
			$ControlHint.visible = not $ControlHint.visible
		elif event.physical_keycode == KEY_F3:
			fps_label.visible = not fps_label.visible
		elif choices_box != null and choices_box.visible:
			var index: int = event.physical_keycode - KEY_1
			if index >= 0 and index < choices_box.get_child_count():
				_pick_choice(index)
				get_viewport().set_input_as_handled()


func _style(color: Color, border: Color) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = color
	box.border_color = border
	box.set_border_width_all(2)
	box.set_corner_radius_all(12)
	box.content_margin_left = 12
	box.content_margin_right = 12
	box.content_margin_top = 10
	box.content_margin_bottom = 10
	return box


func _build_rpg_hud() -> void:
	var panel := PanelContainer.new()
	panel.name = "RPGHUD"
	panel.position = Vector2(18, 18)
	panel.custom_minimum_size = Vector2(320, 0)
	var paper := _style(Color("#f4e6c8"), Color("#977047"))
	paper.shadow_color = Color(0, 0, 0, 0.25)
	paper.shadow_size = 5
	panel.add_theme_stylebox_override("panel", paper)
	panel.add_theme_color_override("font_color", Color("#493421"))
	var parchment_theme := Theme.new()
	parchment_theme.set_color("font_color", "Label", Color("#493421"))
	panel.theme = parchment_theme
	add_child(panel)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	panel.add_child(row)
	var avatar := PanelContainer.new()
	avatar.name = "AvatarSlot"
	avatar.custom_minimum_size = Vector2(64, 64)
	avatar.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	avatar.add_theme_stylebox_override("panel", _style(Color("#dfcda5"), Color("#b28a50")))
	row.add_child(avatar)
	var viewport := SubViewport.new()
	viewport.set_script(preload("res://ui/character_portrait.gd"))
	add_child(viewport)
	var portrait := TextureRect.new()
	portrait.custom_minimum_size = Vector2(64, 64)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	portrait.texture = viewport.get_texture()
	avatar.add_child(portrait)
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(column)
	title = Label.new()
	title.add_theme_font_size_override("font_size", 20)
	column.add_child(title)
	hp_bar = _bar(column, Color("#b34347"))
	exp_bar = _bar(column, Color("#378caa"))
	wallet = Label.new()
	wallet.add_theme_font_size_override("font_size", 14)
	column.add_child(wallet)
	var hint := Label.new()
	hint.text = "F1 · Trợ giúp"
	hint.add_theme_font_size_override("font_size", 12)
	column.add_child(hint)


func _bar(parent: Node, color: Color) -> ProgressBar:
	var bar := ProgressBar.new()
	bar.custom_minimum_size = Vector2(220, 24)
	bar.show_percentage = false
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bar.add_theme_stylebox_override("background", _style(Color("#d6c8ab"), Color("#b49b72")))
	bar.add_theme_stylebox_override("fill", _style(color, color))
	parent.add_child(bar)
	var label := Label.new()
	label.name = "Value"
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	label.add_theme_font_size_override("font_size", 14)
	label.add_theme_color_override("font_color", Color.WHITE)
	label.add_theme_color_override("font_outline_color", Color("#493421"))
	label.add_theme_constant_override("outline_size", 3)
	bar.add_child(label)
	return bar


func _refresh_stats() -> void:
	title.text = "%s · Cấp %d" % [stats.player_name, stats.level]
	hp_bar.max_value = stats.max_hp
	hp_bar.value = stats.hp
	hp_bar.get_node("Value").text = "HP  %d / %d" % [stats.hp, stats.max_hp]
	exp_bar.max_value = stats.max_experience
	exp_bar.value = stats.experience
	exp_bar.get_node("Value").text = "EXP  %d / %d" % [stats.experience, stats.max_experience]
	wallet.text = "Vàng: %d   ·   Từ đã học: %d" % [stats.gold, stats.vocabulary]


func _process(delta: float) -> void:
	update_accumulator += delta
	if update_accumulator >= 0.25:
		update_accumulator = 0.0
		fps_label.text = "FPS: %d" % Engine.get_frames_per_second()


func show_interaction(message: String) -> void:
	interaction_hint.text = message
	interaction_hint.show()


func hide_interaction() -> void:
	interaction_hint.hide()


func show_dialogue(speaker: String, message: String) -> void:
	speaker_label.text = speaker
	dialogue_label.text = message
	dialogue_panel.show()
	interaction_hint.hide()


func hide_dialogue() -> void:
	dialogue_panel.hide()
	if choices_box != null and choices_box.visible:
		_close_choices()


# ------------------------------------------------------------------ quest tracker + answer choices
func _build_quest_ui() -> void:
	quest_label = Label.new()
	quest_label.name = "QuestTracker"
	quest_label.anchor_left = 1.0
	quest_label.anchor_right = 1.0
	quest_label.offset_left = -430
	quest_label.offset_right = -18
	quest_label.offset_top = 18
	quest_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	quest_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	quest_label.add_theme_color_override("font_color", Color("#fff6dc"))
	quest_label.add_theme_color_override("font_outline_color", Color("#3a2414"))
	quest_label.add_theme_constant_override("outline_size", 6)
	quest_label.add_theme_font_size_override("font_size", 18)
	quest_label.hide()
	add_child(quest_label)
	choices_box = VBoxContainer.new()
	choices_box.name = "Choices"
	choices_box.add_theme_constant_override("separation", 6)
	choices_box.hide()
	$DialoguePanel/Margin/VBox.add_child(choices_box)


func set_quest_text(text: String) -> void:
	quest_label.text = text
	quest_label.visible = not text.is_empty()


## Shows the dialogue panel with answer buttons (mouse or keys 1-9). Movement is locked
## until an answer is picked; callback(index) receives the chosen option.
func show_choices(speaker: String, message: String, options: Array, callback: Callable) -> void:
	show_dialogue(speaker, message)
	for child in choices_box.get_children():
		child.queue_free()
	for i in range(options.size()):
		var button := Button.new()
		button.text = "%d. %s" % [i + 1, options[i]]
		button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		button.focus_mode = Control.FOCUS_NONE
		button.pressed.connect(_pick_choice.bind(i))
		choices_box.add_child(button)
	_choice_callback = callback
	choices_box.show()
	get_tree().call_group("player", "set_input_locked", true)


func _pick_choice(index: int) -> void:
	var callback := _choice_callback
	_close_choices()
	if callback.is_valid():
		callback.call(index)


func _close_choices() -> void:
	choices_box.hide()
	for child in choices_box.get_children():
		child.queue_free()
	_choice_callback = Callable()
	get_tree().call_group("player", "set_input_locked", false)


func is_choosing() -> bool:
	return choices_box != null and choices_box.visible
