class_name AnimatedChest
extends StaticBody3D

@export var display_name := "Rương gỗ"

@onready var interaction_area: Area3D = $InteractionArea

var animation_player: AnimationPlayer
var open_animation := ""
var close_animation := ""
var player_in_range := false
var is_open := false
var is_animating := false


func _ready() -> void:
	interaction_area.body_entered.connect(_on_body_entered)
	interaction_area.body_exited.connect(_on_body_exited)
	animation_player = _find_animation_player(self)
	if animation_player == null:
		push_error("AnimatedChest: Chest_Wood has no AnimationPlayer")
		return
	open_animation = _find_clip("chest_open", "open")
	close_animation = _find_clip("chest_close", "close")
	animation_player.animation_finished.connect(_on_animation_finished)
	if open_animation.is_empty() or close_animation.is_empty():
		push_error("AnimatedChest: required Chest_Open/Chest_Close clips are missing")


func _unhandled_input(event: InputEvent) -> void:
	if not player_in_range or is_animating or not event.is_action_pressed("interact"):
		return
	var next_animation := close_animation if is_open else open_animation
	if animation_player == null or next_animation.is_empty():
		return
	is_animating = true
	var actor := get_tree().get_first_node_in_group("player")
	if actor != null and actor.has_method("play_action"):
		actor.play_action("Interact")
	animation_player.play(next_animation, 0.12)
	var hud := _get_hud()
	if hud != null:
		hud.hide_interaction()
	get_viewport().set_input_as_handled()


func _find_animation_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node as AnimationPlayer
	for child in node.get_children():
		var found := _find_animation_player(child)
		if found != null:
			return found
	return null


func _find_clip(exact_name: String, fallback_keyword: String) -> String:
	for animation_name in animation_player.get_animation_list():
		var normalized := String(animation_name).to_lower()
		if normalized == exact_name or normalized.ends_with("/" + exact_name):
			return animation_name
	for animation_name in animation_player.get_animation_list():
		var normalized := String(animation_name).to_lower()
		if fallback_keyword in normalized and not normalized.ends_with("ed"):
			return animation_name
	return ""


func _on_animation_finished(_animation_name: StringName) -> void:
	if not is_animating:
		return
	is_animating = false
	is_open = not is_open
	if player_in_range:
		_show_hint()


func _on_body_entered(body: Node3D) -> void:
	if not body.is_in_group("player"):
		return
	player_in_range = true
	_show_hint()


func _on_body_exited(body: Node3D) -> void:
	if not body.is_in_group("player"):
		return
	player_in_range = false
	var hud := _get_hud()
	if hud != null:
		hud.hide_interaction()


func _show_hint() -> void:
	var hud := _get_hud()
	if hud == null:
		return
	var action := "đóng" if is_open else "mở"
	hud.show_interaction("Nhấn E để %s %s" % [action, display_name])


func _get_hud() -> Node:
	return get_tree().get_first_node_in_group("dialogue_ui")
