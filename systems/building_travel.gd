extends Node3D

var doors: Array[Dictionary] = []
var active_room: Node3D
var return_position := Vector3.ZERO
var saved_camera := Vector3.ZERO
var nearby := -1
var owns_hint := false
var cooldown := 0.0

func register_door(building: Node3D, title: String, room: String, door_local := Vector3(-1, 0, 3.4)) -> void:
	var marker := Marker3D.new()
	marker.name = "Entrance"
	building.add_child(marker)
	marker.position = door_local
	doors.append({"marker": marker, "title": title, "scene": room})
	var label := Label3D.new()
	label.text = title + " · E"
	marker.add_child(label)
	label.position.y = 1.8
	label.font_size = 25
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED

func _process(delta: float) -> void:
	cooldown = maxf(0, cooldown-delta)
	var player := get_tree().get_first_node_in_group("player") as Node3D
	var hud := get_tree().get_first_node_in_group("dialogue_ui")
	if player == null or hud == null:
		return
	nearby = -1
	var message := ""
	if active_room != null:
		if player.global_position.distance_to(active_room.global_position + Vector3(0, 0.9, 3.5)) < 2.0:
			nearby = -2
			message = "E · Trở lại làng"
	else:
		for i in range(doors.size()):
			if player.global_position.distance_to(doors[i].marker.global_position + Vector3.UP*0.9) < 2.0:
				nearby = i
				message = "E · Vào " + doors[i].title
				break
	if not message.is_empty():
		hud.show_interaction(message)
		owns_hint = true
	elif owns_hint:
		hud.hide_interaction()
		owns_hint = false

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("interact") and not event.is_echo() and nearby != -1 and cooldown == 0:
		travel(nearby)
		get_viewport().set_input_as_handled()

func travel(index: int) -> void:
	var player := get_tree().get_first_node_in_group("player") as CharacterBody3D
	var camera := get_tree().root.find_child("OrbitCamera", true, false)
	if active_room != null:
		player.global_position = return_position
		active_room.queue_free()
		active_room = null
		camera.target_yaw = saved_camera.x
		camera.target_pitch = saved_camera.y
		camera.target_distance = saved_camera.z
	else:
		return_position = player.global_position
		saved_camera = Vector3(camera.target_yaw, camera.target_pitch, camera.target_distance)
		active_room = (load(doors[index].scene) as PackedScene).instantiate()
		add_child(active_room)
		active_room.position = Vector3(180, 0, 0)
		player.global_position = active_room.global_position + Vector3(0, 0.95, 3.3)
		camera.target_yaw = 0
		camera.target_pitch = deg_to_rad(-55)
		camera.target_distance = 5.5
	player.velocity = Vector3.ZERO
	camera.global_position = player.global_position + camera.target_offset
	camera.rotation.y = camera.target_yaw
	camera.pitch_pivot.rotation.x = camera.target_pitch
	camera.spring_arm.spring_length = camera.target_distance
	cooldown = 0.5
	get_tree().get_first_node_in_group("dialogue_ui").hide_dialogue()
