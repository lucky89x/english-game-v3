class_name ElderNPC
extends Node3D

@export var npc_name := "Trưởng làng Tom"
@export_multiline var dialogue_text := "Chào mừng con đến Thung Lũng Ánh Sao. Ngôi làng vẫn đang được dựng lại, nhưng con cứ tự nhiên khám phá nhé!"

var player_in_range := false
var dialogue_open := false
var animation_player: AnimationPlayer


func _ready() -> void:
	for player in find_children("*", "AnimationPlayer", true, false):
		animation_player = player
		if player.has_animation("Idle"):
			player.get_animation("Idle").loop_mode = Animation.LOOP_LINEAR
			player.play("Idle")
		if player.has_animation("Talk"):
			player.get_animation("Talk").loop_mode = Animation.LOOP_LINEAR
		if player.has_animation("Wave"):
			player.get_animation("Wave").loop_mode = Animation.LOOP_NONE
		player.animation_finished.connect(_on_animation_finished)
	$InteractionArea.body_entered.connect(_on_body_entered)
	$InteractionArea.body_exited.connect(_on_body_exited)


func _unhandled_input(event: InputEvent) -> void:
	if not player_in_range or not event.is_action_pressed("interact"):
		return
	var actor := get_tree().get_first_node_in_group("player") as Node3D
	if actor == null:
		return
	var query := PhysicsRayQueryParameters3D.create(actor.global_position, global_position + Vector3.UP, 1)
	query.exclude = [(actor as CollisionObject3D).get_rid()]
	if not get_world_3d().direct_space_state.intersect_ray(query).is_empty():
		return
	dialogue_open = not dialogue_open
	var hud := _get_dialogue_hud()
	if hud == null:
		return
	if dialogue_open:
		_play_gesture("Wave")
		if actor.has_method("play_action"):
			actor.play_action("Wave")
		hud.show_dialogue(npc_name, dialogue_text)
	else:
		_play_gesture("Idle")
		hud.hide_dialogue()
		hud.show_interaction("Nhấn E để trò chuyện với %s" % npc_name)
	get_viewport().set_input_as_handled()


func _on_body_entered(body: Node3D) -> void:
	if not body.is_in_group("player"):
		return
	player_in_range = true
	var hud := _get_dialogue_hud()
	if hud != null:
		hud.show_interaction("Nhấn E để trò chuyện với %s" % npc_name)


func _on_body_exited(body: Node3D) -> void:
	if not body.is_in_group("player"):
		return
	player_in_range = false
	dialogue_open = false
	_play_gesture("Idle")
	var hud := _get_dialogue_hud()
	if hud != null:
		hud.hide_interaction()
		hud.hide_dialogue()


func _get_dialogue_hud() -> Node:
	return get_tree().get_first_node_in_group("dialogue_ui")


func _play_gesture(clip: String) -> void:
	if animation_player != null and animation_player.has_animation(clip):
		animation_player.play(clip, 0.2)
	var faces := find_children("*", "NgocFaceController", true, false)
	if not faces.is_empty():
		if clip in ["Wave", "Talk"]:
			faces[0].talk(2.4)
		else:
			faces[0].talk(0.0)


func _on_animation_finished(clip: StringName) -> void:
	if clip == &"Wave" and dialogue_open:
		_play_gesture("Talk")
