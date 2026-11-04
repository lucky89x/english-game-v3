extends SceneTree
func _initialize() -> void:
	call_deferred("run")
func run() -> void:
	for path in ["res://assets/Ultimate Modular Women - April 2022/Individual Characters/glTF/Adventurer.gltf", "res://assets/RPG Characters - Nov 2020/glTF/Wizard.gltf"]:
		var model = load(path).instantiate()
		root.add_child(model)
		print("MODEL ", path)
		for skeleton in model.find_children("*", "Skeleton3D", true, false):
			print("BONES ", skeleton.get_bone_count())
		for mesh in model.find_children("*", "MeshInstance3D", true, false):
			print("BOUNDS ", mesh.name, " ", mesh.global_transform * mesh.get_aabb())
		for player in model.find_children("*", "AnimationPlayer", true, false):
			print("CLIPS ", player.get_animation_list())
		model.free()
	quit()
