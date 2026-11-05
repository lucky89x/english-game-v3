extends Node3D

const NATURE := "res://assets/glTF/"
## chibi05 replacements for the Quaternius trees/bushes (same real-world size).
const CHIBI := {
	"Pine_1": "veg_pine_a", "Pine_3": "veg_pine_b", "CommonTree_2": "veg_oak_b", "CommonTree_1": "veg_oak_a",
	"Bush_Common_Flowers": "veg_bush_flower",
}

func asset_path(asset: String) -> String:
	if CHIBI.has(asset):
		return "res://assets/environment/village/models/%s_v02.glb" % CHIBI[asset]
	return NATURE + asset + ".gltf"
var random := RandomNumberGenerator.new()

func _ready() -> void:
	random.seed = 72814
	call_deferred("_add_architecture")
	var landscape := get_parent()
	for i in range(100):
		var angle := float(i) * TAU / 100.0
		var radius := random.randf_range(27, 47)
		var point := Vector3(cos(angle) * radius, 0, sin(angle) * radius)
		if point.z > 0 and absf(point.x - 12) < 6:
			continue
		point.y = landscape.get_height_at(point.x, point.z)
		place(["Pine_1", "CommonTree_2", "Pine_3"][i % 3], point, random.randf_range(0.55, 0.9))
	for i in range(100):
		var z := random.randf_range(-17, 18)
		var x := random.randf_range(2.5, 3.7) * (-1 if i % 2 == 0 else 1)
		if absf(z - 2.5) < 2.0 or absf(z - 10.5) < 1.8:
			continue
		var point := Vector3(x, landscape.get_height_at(x, z), z)
		place(["Grass_Common_Short", "Flower_3_Group", "Flower_4_Group"][i % 3], point, random.randf_range(0.2, 0.4))
	for i in range(64):
		var z := 3.0 + float(i / 2) * 1.55
		var side := -1.0 if i % 2 == 0 else 1.0
		var x := 10.5 + sin((z - 7) * 0.085) * 3 + side * random.randf_range(3.7, 4.6)
		if z < 11.0:
			continue
		place("Rock_Medium_1" if i % 4 == 0 else "Bush_Common_Flowers",
			Vector3(x, landscape.get_height_at(x, z) - 0.08, z), random.randf_range(0.3, 0.55))
	# One draw per imported surface keeps the small ground cover affordable.
	_scatter_ground_cover("Grass_Wispy_Short", 280, 0.43)
	_scatter_ground_cover("Grass_Common_Short", 200, 0.35)
	_scatter_ground_cover("Pebble_Round_2", 125, 0.26)
	_scatter_ground_cover("Flower_4_Single", 52, 0.32)

func _scatter_ground_cover(asset: String, count: int, size_factor: float) -> void:
	var source := (load(NATURE + asset + ".gltf") as PackedScene).instantiate()
	add_child(source)
	var source_mesh := source.find_children("*", "MeshInstance3D", true, false)[0] as MeshInstance3D
	var multi := MultiMesh.new()
	multi.transform_format = MultiMesh.TRANSFORM_3D
	multi.mesh = source_mesh.mesh
	multi.instance_count = count
	var source_transform := transform.affine_inverse() * source_mesh.global_transform
	var landscape := get_parent()
	for i in range(count):
		var point := Vector3.ZERO
		for attempt in range(12):
			point.x = random.randf_range(-34.0, 34.0)
			point.z = random.randf_range(-34.0, 34.0)
			if _inside_building(point):
				continue
			var river_x := 10.5 + sin((point.z - 7.0) * 0.085) * 3.0
			if point.z > 2.0 and absf(point.x - river_x) < 4.8:
				continue
			if absf(point.x) < 2.9 and point.z > -23.0 and point.z < 20.0:
				continue
			if Vector2(point.x, point.z).distance_to(Vector2(-16, 15)) < 6.0:
				continue
			break
		point.y = landscape.get_height_at(point.x, point.z) - 0.06
		var scale_factor := random.randf_range(0.7, 1.25) * size_factor
		var basis := Basis(Vector3.UP, random.randf_range(0, TAU)).scaled(Vector3.ONE * scale_factor)
		multi.set_instance_transform(i, Transform3D(basis, point) * source_transform)
	var batch := MultiMeshInstance3D.new()
	batch.multimesh = multi
	batch.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(batch)
	source.queue_free()

func _add_architecture() -> void:
	var buildings := Node3D.new()
	buildings.set_script(preload("res://world/buildings/village_architecture.gd"))
	add_child(buildings)

func place(asset: String, point: Vector3, factor: float) -> void:
	if _inside_building(point):
		return
	var model = load(asset_path(asset)).instantiate()
	add_child(model)
	model.position = point
	model.scale = Vector3.ONE * factor
	model.rotation.y = random.randf_range(0, TAU)
	for mesh in model.find_children("*", "GeometryInstance3D", true, false):
		mesh.visibility_range_end = 90
		if point.length() > 30:
			mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF

func _inside_building(point: Vector3) -> bool:
	return (point.x > -9 and point.x < 9 and point.z > -29 and point.z < -19) \
		or (absf(point.x + 24) < 3 and absf(point.z - 14) < 4) \
		or (absf(point.x - 20) < 4 and absf(point.z - 1) < 3)
