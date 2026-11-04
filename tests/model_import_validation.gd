extends Node3D

@onready var stage: Node3D = $ModelStage
@onready var camera: Camera3D = $Camera3D
@onready var report_label: Label = $ValidationUI/Panel/Margin/VBox/Report

var mesh_count := 0
var material_surface_count := 0
var skeleton_count := 0
var humanoid_skeleton_count := 0
var skeleton_bone_names: Array[String] = []
var animation_names: Array[String] = []


func _ready() -> void:
	camera.look_at(Vector3(0.0, 1.7, 0.0), Vector3.UP)
	_scan_node(stage)
	_play_first_animation(stage)
	_update_report()


func _scan_node(node: Node) -> void:
	if node is MeshInstance3D:
		var mesh_instance := node as MeshInstance3D
		mesh_count += 1
		if mesh_instance.mesh != null:
			for surface_index in mesh_instance.mesh.get_surface_count():
				if mesh_instance.get_active_material(surface_index) != null:
					material_surface_count += 1
	elif node is Skeleton3D:
		skeleton_count += 1
		var skeleton := node as Skeleton3D
		var humanoid_markers := 0
		for bone_index in skeleton.get_bone_count():
			var bone_name := skeleton.get_bone_name(bone_index)
			if not skeleton_bone_names.has(bone_name):
				skeleton_bone_names.append(bone_name)
			var normalized := bone_name.to_lower()
			for marker in ["hips", "pelvis", "spine", "head", "thigh", "upperarm", "forearm"]:
				if normalized.contains(marker):
					humanoid_markers += 1
					break
		if humanoid_markers >= 3:
			humanoid_skeleton_count += 1
	elif node is AnimationPlayer:
		var player := node as AnimationPlayer
		for animation_name in player.get_animation_list():
			if animation_name != "RESET" and not animation_names.has(animation_name):
				animation_names.append(animation_name)

	for child in node.get_children():
		_scan_node(child)


func _play_first_animation(node: Node) -> bool:
	if node is AnimationPlayer:
		var player := node as AnimationPlayer
		for animation_name in player.get_animation_list():
			if animation_name != "RESET":
				player.play(animation_name)
				return true

	for child in node.get_children():
		if _play_first_animation(child):
			return true
	return false


func _update_report() -> void:
	var animation_text := ", ".join(animation_names) if not animation_names.is_empty() else "không có"
	var bone_text := ", ".join(skeleton_bone_names) if not skeleton_bone_names.is_empty() else "không có"
	report_label.text = (
		"MODEL IMPORT VALIDATION\n"
		+ "Nguồn: Quaternius glTF (không dùng PNG concept làm mesh)\n"
		+ "MeshInstance3D: %d | Material surfaces: %d\n" % [mesh_count, material_surface_count]
		+ "Skeleton3D: %d (humanoid: %d) | Animation: %s\n" % [skeleton_count, humanoid_skeleton_count, animation_text]
		+ "Bones: %s\n" % bone_text
		+ "House: 0.72x | Maple: 0.72x | Rock: 0.8x | Chest: 1.0x\n"
		+ "Skeleton hiện có là rig nắp rương, không phải nhân vật."
	)
