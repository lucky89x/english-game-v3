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
var choices_box: HFlowContainer
var quest_panel: PanelContainer
var request_panel: PanelContainer
var request_title: Label
var request_text: Label
var request_hint: Label
var minimap: Control
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
	if choices_box != null and choices_box.visible:
		_close_choices()          # a plain line never keeps old answer buttons
	speaker_label.text = speaker
	# keep the panel short: no empty lines between paragraphs
	dialogue_label.text = message.strip_edges().replace("\n\n\n", "\n").replace("\n\n", "\n")
	dialogue_panel.show()
	$DialoguePanel/Margin/VBox/CloseHint.show()
	interaction_hint.hide()


func hide_dialogue() -> void:
	dialogue_panel.hide()
	if choices_box != null and choices_box.visible:
		_close_choices()


# ------------------------------------------------------------------ quest tracker + answer choices
func _build_quest_ui() -> void:
	minimap = preload("res://ui/minimap.gd").new()
	minimap.name = "Minimap"
	add_child(minimap)
	# quest tracker: a small parchment card under the minimap
	quest_panel = PanelContainer.new()
	quest_panel.name = "QuestPanel"
	quest_panel.anchor_left = 1.0
	quest_panel.anchor_right = 1.0
	quest_panel.offset_left = -352
	quest_panel.offset_right = -16
	quest_panel.offset_top = 16 + preload("res://ui/minimap.gd").SIZE + 10
	quest_panel.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	quest_panel.add_theme_stylebox_override("panel", _card_style(Color(0.16, 0.11, 0.07, 0.78), Color(0.85, 0.66, 0.35)))
	quest_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	quest_panel.hide()
	add_child(quest_panel)
	quest_label = Label.new()
	quest_label.name = "QuestTracker"
	quest_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	quest_label.add_theme_color_override("font_color", Color("#fff6dc"))
	quest_label.add_theme_font_size_override("font_size", 16)
	quest_label.hide()
	quest_panel.add_child(quest_label)
	# request card (top centre): what a character asks for, e.g. the traveller at Ben's stall
	request_panel = PanelContainer.new()
	request_panel.name = "RequestCard"
	request_panel.anchor_left = 0.5
	request_panel.anchor_right = 0.5
	request_panel.offset_left = -300
	request_panel.offset_right = 300
	request_panel.offset_top = 40
	request_panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	request_panel.add_theme_stylebox_override("panel", _card_style(Color(0.99, 0.95, 0.84, 0.96), Color(0.62, 0.42, 0.2)))
	request_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	request_panel.hide()
	add_child(request_panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 2)
	request_panel.add_child(column)
	request_title = _card_label(15, Color(0.55, 0.36, 0.16))
	request_text = _card_label(26, Color(0.18, 0.11, 0.05))
	request_hint = _card_label(14, Color(0.4, 0.32, 0.22))
	for l in [request_title, request_text, request_hint]:
		column.add_child(l)
	choices_box = HFlowContainer.new()
	choices_box.name = "Choices"
	choices_box.add_theme_constant_override("h_separation", 8)
	choices_box.add_theme_constant_override("v_separation", 6)
	choices_box.hide()
	$DialoguePanel/Margin/VBox.add_child(choices_box)


func set_quest_text(text: String) -> void:
	quest_label.text = text
	quest_label.visible = not text.is_empty()
	quest_panel.visible = quest_label.visible


## A card at the top of the screen with what a character asks for (English line in big type).
func show_request(title: String, text: String, hint := "") -> void:
	request_title.text = title
	request_text.text = text
	request_hint.text = hint
	request_hint.visible = not hint.is_empty()
	request_panel.show()


func hide_request() -> void:
	request_panel.hide()


func _card_style(bg: Color, border: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = bg
	style.border_color = border
	style.set_border_width_all(2)
	style.set_corner_radius_all(10)
	style.content_margin_left = 14
	style.content_margin_right = 14
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	return style


func _card_label(size: int, color: Color) -> Label:
	var l := Label.new()
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	return l


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
	$DialoguePanel/Margin/VBox/CloseHint.hide()
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
