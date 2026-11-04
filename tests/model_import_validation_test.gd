extends SceneTree

var failures: Array[String] = []


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var packed := load("res://tests/model_import_validation.tscn") as PackedScene
	_check(packed != null, "Validation scene loads")
	if packed == null:
		_finish()
		return

	var scene := packed.instantiate()
	get_root().add_child(scene)
	await process_frame
	await process_frame

	_check(scene.mesh_count > 0, "Imported assets contain MeshInstance3D nodes")
	_check(scene.material_surface_count > 0, "Imported assets retain materials")
	_check(scene.skeleton_count > 0, "Animated chest mechanical rig is detected")
	_check(scene.humanoid_skeleton_count == 0, "Mechanical rig is not misclassified as a humanoid")
	_check(not scene.animation_names.is_empty(), "Animated chest exposes an animation clip")
	_check(scene.get_node_or_null("ModelStage/MedievalHouse") != null, "Quaternius medieval construction is present")
	_check(scene.get_node_or_null("ModelStage/MapleTree") != null, "Quaternius nature model is present")

	scene.queue_free()
	_finish()


func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: ", label)
	else:
		failures.append(label)
		push_error("FAIL: " + label)


func _finish() -> void:
	if failures.is_empty():
		print("MODEL IMPORT VALIDATION PASSED")
		quit(0)
	else:
		print("MODEL IMPORT VALIDATION FAILED: ", failures)
		quit(1)
