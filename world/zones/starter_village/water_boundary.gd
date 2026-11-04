extends Area3D

@export var river_half_width := 3.7
@export var bridge_z_min := 4.8
@export var bridge_z_max := 10.2


func _physics_process(_delta: float) -> void:
	for body in get_overlapping_bodies():
		if not body.is_in_group("player") or not body is CharacterBody3D:
			continue
		var player := body as CharacterBody3D
		var z := player.global_position.z
		if z >= bridge_z_min and z <= bridge_z_max:
			continue
		var center_x := 10.5 + sin((z - 7.0) * 0.085) * 3.0
		var offset := player.global_position.x - center_x
		if absf(offset) >= river_half_width:
			continue
		var bank_side := 1.0 if offset >= 0.0 else -1.0
		player.global_position.x = center_x + bank_side * (river_half_width + 0.55)
		player.velocity.x = 0.0
		player.velocity.z = 0.0
