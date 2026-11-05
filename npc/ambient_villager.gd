extends CharacterBody3D

## chibi05 villager models: "Monk" -> Ben the merchant, "Cleric" -> Sam the fisherman.
const VILLAGER_MODELS := {"Monk": "npc_ben_merchant_v02", "Cleric": "npc_sam_fisherman_v02"}
const MODEL_HEIGHT := 1.32

var route: Array[Vector3] = []
var model_name := "Monk"
var waypoint := 1
var pause := 1.5
var blocked_time := 0.0
var animation: AnimationPlayer
var model: Node3D

func _ready() -> void:
	add_to_group("ambient_villagers")
	collision_layer = 4
	collision_mask = 5
	var collider := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.32
	capsule.height = 1.7
	collider.shape = capsule
	collider.position.y = 0.85
	add_child(collider)
	var asset: String = VILLAGER_MODELS.get(model_name, VILLAGER_MODELS["Monk"])
	model = (load("res://assets/npc/models/%s.glb" % asset) as PackedScene).instantiate()
	add_child(model)
	var face := Node.new()
	face.set_script(preload("res://scripts/ngoc_face_controller.gd"))
	face.set("texture_dir", "res://assets/npc/models")
	face.set("texture_prefix", asset)
	model.add_child(face)
	var bounds := AABB()
	var first := true
	for mesh in model.find_children("*", "MeshInstance3D", true, false):
		var local_bounds: AABB = (model.global_transform.affine_inverse() * mesh.global_transform) * mesh.get_aabb()
		bounds = local_bounds if first else bounds.merge(local_bounds)
		first = false
	var factor := MODEL_HEIGHT / maxf(bounds.size.y, 0.1)
	model.scale = Vector3.ONE * factor
	model.position.y = -bounds.position.y * factor
	animation = model.find_children("*", "AnimationPlayer", true, false)[0]
	for clip in ["Idle", "Walk"]:
		if animation.has_animation(clip):
			animation.get_animation(clip).loop_mode = Animation.LOOP_LINEAR
	if route.size() < 2:
		waypoint = 0

func _physics_process(delta: float) -> void:
	var previous := global_position
	var player := get_tree().get_first_node_in_group("player") as Node3D
	var player_near := player != null and global_position.distance_to(player.global_position) < 1.3
	var direction := Vector3.ZERO
	pause = maxf(0, pause - delta)
	if pause == 0 and route.size() > 1 and not player_near:
		direction = route[waypoint] - global_position
		direction.y = 0
		if direction.length() < 0.3:
			waypoint = (waypoint + 1) % route.size()
			pause = 1.8 + float(waypoint % 3)
			direction = Vector3.ZERO
		direction = direction.normalized()
	velocity.x = direction.x * 1.1
	velocity.z = direction.z * 1.1
	velocity.y -= 9.8 * delta
	move_and_slide()
	if direction.length() > 0:
		model.rotation.y = lerp_angle(model.rotation.y, atan2(direction.x, direction.z), 1.0-exp(-7.0*delta))
		blocked_time = blocked_time + delta if global_position.distance_to(previous) < 0.002 else 0.0
		if blocked_time > 2.0:
			waypoint = (waypoint + 1) % route.size()
			pause = 1.0
			blocked_time = 0
	var clip := "Walk" if Vector2(velocity.x, velocity.z).length() > 0.1 else "Idle"
	if animation.has_animation(clip) and animation.current_animation != clip:
		animation.play(clip, 0.25)
