class_name OrbitCamera
extends Node3D

@export var target_path: NodePath
@export var target_offset := Vector3(0.0, 1.25, 0.0)
@export_range(2.0, 20.0, 0.1) var distance: float = 8.5
@export_range(2.0, 20.0, 0.1) var min_distance: float = 3.5
@export_range(2.0, 30.0, 0.1) var max_distance: float = 14.0
@export_range(-80.0, -5.0, 1.0) var pitch_degrees: float = -32.0
@export var rotation_sensitivity: float = 0.22
@export var zoom_step: float = 1.0
@export var follow_smoothing: float = 12.0
@export var rotation_smoothing: float = 16.0
@export var zoom_smoothing: float = 14.0
@export var orbit_button: MouseButton = MOUSE_BUTTON_RIGHT
## Left button also drags the camera (players naturally try "hold mouse and drag").
@export var secondary_orbit_button: MouseButton = MOUSE_BUTTON_LEFT

@onready var pitch_pivot: Node3D = $PitchPivot
@onready var spring_arm: SpringArm3D = $PitchPivot/SpringArm3D
@onready var camera: Camera3D = $PitchPivot/SpringArm3D/Camera3D

var target: Node3D
var target_yaw: float
var target_pitch: float
var target_distance: float
var is_rotating := false


func _ready() -> void:
	target = get_node_or_null(target_path) as Node3D
	target_yaw = rotation.y
	target_pitch = deg_to_rad(pitch_degrees)
	target_distance = clampf(distance, min_distance, max_distance)
	rotation.y = target_yaw
	pitch_pivot.rotation.x = target_pitch
	spring_arm.spring_length = target_distance

	if target != null:
		global_position = target.global_position + target_offset
		if target is CollisionObject3D:
			spring_arm.add_excluded_object((target as CollisionObject3D).get_rid())


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.physical_keycode == KEY_R:
		target_yaw = 0.0
		target_pitch = deg_to_rad(pitch_degrees)
		target_distance = distance
	if event is InputEventMouseButton:
		if event.button_index == orbit_button or event.button_index == secondary_orbit_button:
			is_rotating = event.pressed
			Input.set_default_cursor_shape(
				Input.CURSOR_DRAG if is_rotating else Input.CURSOR_ARROW
			)
		elif event.pressed and event.button_index == MOUSE_BUTTON_WHEEL_UP:
			target_distance = maxf(min_distance, target_distance - zoom_step)
		elif event.pressed and event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			target_distance = minf(max_distance, target_distance + zoom_step)
	elif event is InputEventMouseMotion and is_rotating:
		target_yaw -= deg_to_rad(event.relative.x * rotation_sensitivity)
		target_pitch -= deg_to_rad(event.relative.y * rotation_sensitivity)
		target_pitch = clampf(target_pitch, deg_to_rad(-75.0), deg_to_rad(-8.0))


func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton and not event.pressed \
			and (event.button_index == orbit_button or event.button_index == secondary_orbit_button):
		is_rotating = false
		Input.set_default_cursor_shape(Input.CURSOR_ARROW)


func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		is_rotating = false
		Input.set_default_cursor_shape(Input.CURSOR_ARROW)


func _process(delta: float) -> void:
	if target == null:
		return

	var follow_weight := 1.0 - exp(-follow_smoothing * delta)
	var rotation_weight := 1.0 - exp(-rotation_smoothing * delta)
	var zoom_weight := 1.0 - exp(-zoom_smoothing * delta)

	global_position = global_position.lerp(target.global_position + target_offset, follow_weight)
	rotation.y = lerp_angle(rotation.y, target_yaw, rotation_weight)
	pitch_pivot.rotation.x = lerp_angle(pitch_pivot.rotation.x, target_pitch, rotation_weight)
	spring_arm.spring_length = lerpf(spring_arm.spring_length, target_distance, zoom_weight)
