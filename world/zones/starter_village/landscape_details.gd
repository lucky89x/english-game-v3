extends Node3D
## Vegetation and ground cover for the expanded (240 m) starter village. Trees are batched
## per species in MultiMeshes so hundreds of leafy chibi05 trees stay cheap; placement keeps
## clear of roads, buildings and the river using VillageLayout.

const NATURE := "res://assets/glTF/"
const VEG := "res://assets/environment/village/models/"
const LAYOUT := preload("res://world/zones/starter_village/village_layout.gd")
## chibi05 replacements for the Quaternius trees/bushes (same real-world size).
const CHIBI := {
	"Pine_1": "veg_pine_a", "Pine_3": "veg_pine_b", "CommonTree_2": "veg_oak_b", "CommonTree_1": "veg_oak_a",
	"Bush_Common_Flowers": "veg_bush_flower",
}
## species -> relative weight in the wild forest ring
const FOREST := {"veg_oak_a": 3, "veg_oak_b": 3, "veg_oak_wide": 2, "veg_pine_a": 3, "veg_pine_b": 2, "veg_birch": 2, "veg_blossom": 1}
const MEADOW := {"veg_bush": 3, "veg_bush_flower": 3, "veg_bush_red": 2}

var random := RandomNumberGenerator.new()
var landscape: Node
var collision_body: StaticBody3D


func asset_path(asset: String) -> String:
	if CHIBI.has(asset):
		return VEG + "%s_v02.glb" % CHIBI[asset]
	return NATURE + asset + ".gltf"


func _ready() -> void:
	random.seed = 72814
	landscape = get_parent()
	call_deferred("_add_architecture")
	collision_body = StaticBody3D.new()
	collision_body.name = "TreeTrunks"
	add_child(collision_body)
	_forest_ring()
	_road_trees()
	_meadow_bushes()
	_river_banks()
	# One draw per imported surface keeps the small ground cover affordable.
	_scatter_ground_cover("Grass_Wispy_Short", 1300, 0.43)
	_scatter_ground_cover("Grass_Common_Short", 900, 0.35)
	_scatter_ground_cover("Pebble_Round_2", 360, 0.26)
	_scatter_ground_cover("Flower_4_Single", 340, 0.32)
	_scatter_ground_cover("Flower_3_Group", 140, 0.30)


func _free_spot(x: float, z: float, road_margin: float, house_margin: float) -> bool:
	if LAYOUT.in_river(x, z, 5.2):
		return false
	if LAYOUT.road_distance(x, z) < road_margin:
		return false
	if LAYOUT.near_building(x, z, house_margin):
		return false
	if absf(x) < 4.5 and z > -20.0 and z < 22.0:
		return false  # village main street and square
	return true


func _pick(weights: Dictionary) -> String:
	var total := 0
	for k in weights:
		total += weights[k]
	var r := random.randi_range(1, total)
	for k in weights:
		r -= weights[k]
		if r <= 0:
			return k
	return weights.keys()[0]


## Dense forest between the village and the hills, thinning towards the centre.
func _forest_ring() -> void:
	var groups := {}
	for i in range(520):
		var angle := random.randf_range(0, TAU)
		var radius := sqrt(random.randf_range(30.0 * 30.0, 112.0 * 112.0))
		var x := cos(angle) * radius
		var z := sin(angle) * radius
		if not _free_spot(x, z, 5.0, 4.0):
			continue
		# leave open meadows around the hamlets
		if radius < 70.0 and random.randf() < 0.45:
			continue
		var species := _pick(FOREST)
		var size := random.randf_range(0.7, 1.15)
		_add_instance(groups, species, Vector3(x, _height(x, z) - 0.05, z), size)
		if radius < 100.0:
			_add_trunk(Vector3(x, _height(x, z), z), size)
	_commit(groups, 125.0)


## Avenue trees along the roads (a little back from the kerb).
func _road_trees() -> void:
	var groups := {}
	for road in LAYOUT.ROADS:
		var pts: Array = road[1]
		var width := float(road[0])
		for i in range(pts.size() - 1):
			var a: Vector2 = pts[i]
			var b: Vector2 = pts[i + 1]
			var length := a.distance_to(b)
			var along := (b - a) / maxf(length, 0.001)
			var side := Vector2(-along.y, along.x)
			var t := random.randf_range(3.0, 7.0)
			while t < length:
				var edge := -1.0 if random.randf() < 0.5 else 1.0
				var p := a + along * t + side * edge * (width * 0.5 + random.randf_range(3.0, 5.5))
				t += random.randf_range(7.0, 12.0)
				if not _free_spot(p.x, p.y, 2.6, 3.0):
					continue
				var species: String = ["veg_oak_a", "veg_oak_b", "veg_blossom", "veg_birch"][random.randi_range(0, 3)]
				var size := random.randf_range(0.75, 1.0)
				_add_instance(groups, species, Vector3(p.x, _height(p.x, p.y) - 0.05, p.y), size)
				_add_trunk(Vector3(p.x, _height(p.x, p.y), p.y), size)
	_commit(groups, 110.0)


func _meadow_bushes() -> void:
	var groups := {}
	for i in range(260):
		var x := random.randf_range(-100.0, 100.0)
		var z := random.randf_range(-100.0, 100.0)
		if not _free_spot(x, z, 1.4, 1.5):
			continue
		_add_instance(groups, _pick(MEADOW), Vector3(x, _height(x, z) - 0.06, z), random.randf_range(0.55, 1.0))
	_commit(groups, 60.0)


func _river_banks() -> void:
	var groups := {}
	for i in range(150):
		var z := 3.0 + float(i / 2) * 1.55
		var side := -1.0 if i % 2 == 0 else 1.0
		var x := LAYOUT.river_x(z) + side * random.randf_range(3.7, 4.6)
		if z < 11.0 or LAYOUT.road_distance(x, z) < 1.0 or LAYOUT.near_building(x, z):
			continue
		var species := "veg_bush" if i % 4 == 0 else "veg_bush_flower"
		_add_instance(groups, species, Vector3(x, _height(x, z) - 0.08, z), random.randf_range(0.45, 0.7))
	_commit(groups, 70.0)


func _height(x: float, z: float) -> float:
	if landscape != null and landscape.has_method("get_height_at"):
		return landscape.get_height_at(x, z)
	return 0.0


func _add_instance(groups: Dictionary, species: String, point: Vector3, size: float) -> void:
	if not groups.has(species):
		groups[species] = []
	var basis := Basis(Vector3.UP, random.randf_range(0, TAU)).scaled(Vector3.ONE * size)
	groups[species].append(Transform3D(basis, point))


func _add_trunk(point: Vector3, size: float) -> void:
	var shape := CollisionShape3D.new()
	var cylinder := CylinderShape3D.new()
	cylinder.radius = 0.45 * size
	cylinder.height = 3.0
	shape.shape = cylinder
	shape.position = point + Vector3(0, 1.5, 0)
	collision_body.add_child(shape)


func _commit(groups: Dictionary, visible_to: float) -> void:
	for species in groups:
		var scene := (load(VEG + "%s_v02.glb" % species) as PackedScene).instantiate() as Node3D
		var meshes := scene.find_children("*", "MeshInstance3D", true, false)
		if meshes.is_empty():
			scene.free()
			continue
		var source := meshes[0] as MeshInstance3D
		# transform of the mesh relative to the scene root (GLB nodes may carry one)
		var local := Transform3D.IDENTITY
		var node: Node = source
		while node != null and node != scene:
			if node is Node3D:
				local = (node as Node3D).transform * local
			node = node.get_parent()
		var transforms: Array[Transform3D] = []
		for t in groups[species]:
			transforms.append(t * local)
		var lod_path := VEG + "%s_lod_v02.glb" % species
		if ResourceLoader.exists(lod_path):
			# leafy tree up close, light decimated version further away
			_add_chunked("Trees_" + species, source.mesh, transforms, LOD_SWITCH, true)
			var lod_scene := (load(lod_path) as PackedScene).instantiate()
			var lod_meshes := lod_scene.find_children("*", "MeshInstance3D", true, false)
			if not lod_meshes.is_empty():
				_add_chunked("TreesFar_" + species, (lod_meshes[0] as MeshInstance3D).mesh, transforms, visible_to, false, LOD_SWITCH)
			lod_scene.free()
		else:
			_add_chunked("Trees_" + species, source.mesh, transforms, visible_to, true)
		scene.free()


## Split instances into CHUNK-sized cells: one MultiMesh spanning the whole map can never be
## culled (its bounds always contain the camera), so far or off-screen cells drew anyway.
const CHUNK := 32.0
const LOD_SWITCH := 45.0


func _add_chunked(label: String, mesh: Mesh, transforms: Array[Transform3D], visible_to: float, shadows: bool, visible_from := 0.0) -> void:
	var cells := {}
	for t in transforms:
		var key := Vector2i(floori(t.origin.x / CHUNK), floori(t.origin.z / CHUNK))
		if not cells.has(key):
			cells[key] = []
		cells[key].append(t)
	for key in cells:
		var list: Array = cells[key]
		var multi := MultiMesh.new()
		multi.transform_format = MultiMesh.TRANSFORM_3D
		multi.mesh = mesh
		multi.instance_count = list.size()
		for i in range(list.size()):
			multi.set_instance_transform(i, list[i])
		var batch := MultiMeshInstance3D.new()
		batch.name = "%s_%d_%d" % [label, key.x, key.y]
		batch.multimesh = multi
		batch.visibility_range_begin = visible_from
		batch.visibility_range_begin_margin = 6.0 if visible_from > 0.0 else 0.0
		batch.visibility_range_end = visible_to
		batch.visibility_range_end_margin = 6.0
		batch.visibility_range_fade_mode = GeometryInstance3D.VISIBILITY_RANGE_FADE_SELF
		if not shadows:
			batch.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(batch)


func _scatter_ground_cover(asset: String, count: int, size_factor: float) -> void:
	var source := (load(NATURE + asset + ".gltf") as PackedScene).instantiate()
	add_child(source)
	var source_mesh := source.find_children("*", "MeshInstance3D", true, false)[0] as MeshInstance3D
	var source_transform := transform.affine_inverse() * source_mesh.global_transform
	var transforms: Array[Transform3D] = []
	for i in range(count):
		var point := Vector3.ZERO
		for attempt in range(12):
			point.x = random.randf_range(-105.0, 105.0)
			point.z = random.randf_range(-105.0, 105.0)
			if _free_spot(point.x, point.z, 0.3, 0.5):
				break
		point.y = _height(point.x, point.z) - 0.06
		var scale_factor := random.randf_range(0.7, 1.25) * size_factor
		var basis := Basis(Vector3.UP, random.randf_range(0, TAU)).scaled(Vector3.ONE * scale_factor)
		transforms.append(Transform3D(basis, point) * source_transform)
	_add_chunked("Ground_" + asset, source_mesh.mesh, transforms, 40.0, false)
	source.queue_free()


func _add_architecture() -> void:
	var buildings := Node3D.new()
	buildings.set_script(preload("res://world/buildings/village_architecture.gd"))
	add_child(buildings)


func place(asset: String, point: Vector3, factor: float) -> void:
	if LAYOUT.near_building(point.x, point.z):
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
