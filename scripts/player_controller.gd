class_name PlayerController
extends CharacterBody3D

@export_category("Movement")
@export var move_speed: float = 5.5
@export var run_speed: float = 8.0
@export var acceleration: float = 22.0
@export var deceleration: float = 28.0
@export var rotation_speed: float = 12.0
@export var jump_velocity: float = 6.0

@onready var visual_root: Node3D = $VisualRoot

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity", 9.8)
var animation_player: AnimationPlayer
var idle_animation := ""
var walk_animation := ""
var run_animation := ""
var action_time := 0.0

func play_action(clip: String) -> void:
	if animation_player != null and animation_player.has_animation(clip):
		action_time = animation_player.get_animation(clip).length
		animation_player.play(clip, 0.18)


func _ready() -> void:
	# Imported character assets can be placed below AssetSocket. If they contain an
	# AnimationPlayer, common Idle/Walk/Run clip names are detected automatically.
	var animation_players := find_children("*", "AnimationPlayer", true, false)
	if not animation_players.is_empty():
		animation_player = animation_players[0] as AnimationPlayer
		idle_animation = _find_animation("idle")
		walk_animation = _find_animation("walk")
		run_animation = _find_animation("run")
		for clip in [idle_animation, walk_animation, run_animation]:
			if not clip.is_empty():
				animation_player.get_animation(clip).loop_mode = Animation.LOOP_LINEAR


func _physics_process(delta: float) -> void:
	action_time = maxf(0.0, action_time - delta)
	if not is_on_floor():
		velocity.y -= gravity * delta
	elif Input.is_action_just_pressed("jump"):
		velocity.y = jump_velocity

	var input_vector := Input.get_vector(
		"move_left", "move_right", "move_forward", "move_backward"
	)
	var move_direction := _camera_relative_direction(input_vector)
	var is_running := Input.is_action_pressed("run") and move_direction != Vector3.ZERO
	var current_speed := run_speed if is_running else move_speed
	var target_velocity := move_direction * current_speed
	var change_rate := acceleration if move_direction != Vector3.ZERO else deceleration

	velocity.x = move_toward(velocity.x, target_velocity.x, change_rate * delta)
	velocity.z = move_toward(velocity.z, target_velocity.z, change_rate * delta)

	if move_direction != Vector3.ZERO:
		var target_angle := atan2(move_direction.x, move_direction.z)
		visual_root.rotation.y = lerp_angle(
			visual_root.rotation.y,
			target_angle,
			1.0 - exp(-rotation_speed * delta)
		)

	move_and_slide()
	_update_animation(move_direction, is_running)


func _camera_relative_direction(input_vector: Vector2) -> Vector3:
	if input_vector == Vector2.ZERO:
		return Vector3.ZERO

	var active_camera := get_viewport().get_camera_3d()
	if active_camera == null:
		return Vector3(input_vector.x, 0.0, input_vector.y).normalized()

	var camera_right := active_camera.global_basis.x
	var camera_back := active_camera.global_basis.z
	camera_right.y = 0.0
	camera_back.y = 0.0
	return (camera_right.normalized() * input_vector.x + camera_back.normalized() * input_vector.y).normalized()


func _find_animation(keyword: String) -> String:
	if animation_player == null:
		return ""
	for animation_name in animation_player.get_animation_list():
		if String(animation_name).to_lower() == keyword:
			return animation_name
	for animation_name in animation_player.get_animation_list():
		if keyword in String(animation_name).to_lower():
			return animation_name
	return ""


func _update_animation(move_direction: Vector3, is_running: bool) -> void:
	if animation_player == null:
		return
	if action_time > 0.0 and move_direction == Vector3.ZERO:
		return
	action_time = 0.0
	var next_animation := idle_animation
	if Vector2(velocity.x, velocity.z).length() > 0.15:
		next_animation = run_animation if is_running and not run_animation.is_empty() else walk_animation
	if next_animation.is_empty() or animation_player.current_animation == next_animation:
		return
	animation_player.play(next_animation, 0.18)
