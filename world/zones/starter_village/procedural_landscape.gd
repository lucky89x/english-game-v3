class_name ProceduralLandscape
extends Node3D

@export_range(48, 128, 1) var terrain_resolution := 80
@export var terrain_size := 112.0
@export var terrain_material: Material
@export var path_material: Material
@export var water_material: Material

@onready var terrain_mesh: MeshInstance3D = $Terrain
@onready var terrain_collision: CollisionShape3D = $TerrainBody/CollisionShape3D
@onready var paths_root: Node3D = $CurvedPaths
@onready var water_root: Node3D = $RiverSystem


func _ready() -> void:
	_build_terrain()
	_build_path_network()
	_build_river()
	_build_horizon()
	var details := Node3D.new()
	details.set_script(preload("res://world/zones/starter_village/landscape_details.gd"))
	add_child(details)


func _build_horizon() -> void:
	$MidgroundHills.hide()
	for old in $DistantMountains.get_children():
		old.hide()
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.28, 0.39, 0.40)
	material.roughness = 1.0
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	surface.set_material(material)
	for i in range(192):
		var quad: Array[Vector3] = []
		for ring in range(2):
			for j in range(2):
				var angle := float(i + j) * TAU / 192.0
				var radius := 52.0 if ring == 0 else 77.0 + sin(angle * 7.0) * 5.0
				var height := 1.5 if ring == 0 else 10.0 + sin(angle * 9.0) * 3.5 + sin(angle * 17.0) * 2.0 + sin(angle * 5.0) * 4.0
				quad.append(Vector3(cos(angle) * radius, height, sin(angle) * radius))
		for index in [0, 2, 1, 1, 2, 3]:
			surface.add_vertex(quad[index])
	surface.generate_normals()
	var ridge := MeshInstance3D.new()
	ridge.mesh = surface.commit()
	ridge.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	$DistantMountains.add_child(ridge)


func get_height_at(world_x: float, world_z: float) -> float:
	var distance_from_center := Vector2(world_x, world_z).length()
	var center_weight := smoothstep(16.0, 36.0, distance_from_center)
	var rolling := sin(world_x * 0.13) * cos(world_z * 0.11) * 0.34
	rolling += sin((world_x + world_z) * 0.055) * 0.42
	var edge_distance := maxf(absf(world_x), absf(world_z))
	var rim := smoothstep(31.0, 55.0, edge_distance)
	var hills := rim * (4.2 + sin(world_x * 0.18) * 1.1 + cos(world_z * 0.15) * 0.9)
	var height := rolling * center_weight + hills

	if world_z > 1.0:
		var river_center_x := 10.5 + sin((world_z - 7.0) * 0.085) * 3.0
		var river_distance := absf(world_x - river_center_x)
		var river_influence := (1.0 - smoothstep(3.6, 8.0, river_distance)) * smoothstep(1.0, 7.0, world_z)
		height = lerpf(height, -0.42 + river_distance * 0.055, river_influence)

	return height


func _build_terrain() -> void:
	var vertices := PackedVector3Array()
	var normals := PackedVector3Array()
	var uvs := PackedVector2Array()
	var indices := PackedInt32Array()
	var half_size := terrain_size * 0.5
	var step := terrain_size / float(terrain_resolution)

	for z_index in range(terrain_resolution + 1):
		var z := -half_size + z_index * step
		for x_index in range(terrain_resolution + 1):
			var x := -half_size + x_index * step
			var y := get_height_at(x, z)
			vertices.append(Vector3(x, y, z))
			var sample := 0.45
			var normal := Vector3(
				get_height_at(x - sample, z) - get_height_at(x + sample, z),
				2.0 * sample,
				get_height_at(x, z - sample) - get_height_at(x, z + sample)
			).normalized()
			normals.append(normal)
			uvs.append(Vector2(float(x_index) / terrain_resolution, float(z_index) / terrain_resolution) * 10.0)

	for z_index in range(terrain_resolution):
		for x_index in range(terrain_resolution):
			var row := terrain_resolution + 1
			var a := z_index * row + x_index
			var b := a + 1
			var c := a + row
			var d := c + 1
			indices.append_array(PackedInt32Array([a, b, c, b, d, c]))

	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_NORMAL] = normals
	arrays[Mesh.ARRAY_TEX_UV] = uvs
	arrays[Mesh.ARRAY_INDEX] = indices
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	mesh.surface_set_material(0, terrain_material)
	terrain_mesh.mesh = mesh
	terrain_collision.shape = mesh.create_trimesh_shape()


func _build_path_network() -> void:
	# Paths are painted continuously in world space by terrain_blend now.
	# Retain the root for compatibility, but avoid raised ribbon edges/z-fighting.
	return


func _build_legacy_path_network() -> void:
	_add_ribbon(paths_root, PackedVector2Array([
		Vector2(0, 19), Vector2(-0.5, 13), Vector2(0.4, 7),
		Vector2(-0.2, 1), Vector2(0.5, -6), Vector2(-1.0, -14), Vector2(-2.0, -22)
	]), 4.6, path_material, 0.055)
	_add_ribbon(paths_root, PackedVector2Array([
		Vector2(0, 5), Vector2(3, 5.5), Vector2(5.3, 7)
	]), 3.2, path_material, 0.06)
	_add_ribbon(paths_root, PackedVector2Array([
		Vector2(15.8, 7), Vector2(18, 8), Vector2(18, 12)
	]), 3.2, path_material, 0.06)
	_add_ribbon(paths_root, PackedVector2Array([
		Vector2(-0.2, 11), Vector2(-5, 12), Vector2(-10, 14), Vector2(-15, 16), Vector2(-21, 17)
	]), 3.0, path_material, 0.06)
	_add_ribbon(paths_root, PackedVector2Array([
		Vector2(0.2, -7), Vector2(-5, -9), Vector2(-10, -12), Vector2(-16, -15), Vector2(-23, -20)
	]), 2.7, path_material, 0.06)


func _build_river() -> void:
	var points := PackedVector2Array()
	for z in range(3, 57, 3):
		points.append(Vector2(10.5 + sin((float(z) - 7.0) * 0.085) * 3.0, float(z)))
	_add_ribbon(water_root, points, 7.2, water_material, -0.14, true)


func _add_ribbon(
	parent: Node3D,
	points: PackedVector2Array,
	width: float,
	material: Material,
	y_offset: float,
	flat_water := false
) -> void:
	var vertices := PackedVector3Array()
	var normals := PackedVector3Array()
	var uvs := PackedVector2Array()
	var indices := PackedInt32Array()

	for index in range(points.size()):
		var previous := points[maxi(index - 1, 0)]
		var following := points[mini(index + 1, points.size() - 1)]
		var tangent := (following - previous).normalized()
		var side := Vector2(-tangent.y, tangent.x)
		var local_width := width
		if flat_water and index < 4:
			local_width += sin(float(index) / 3.0 * PI) * 2.6
		if flat_water and index == 0:
			local_width = 0.2
		for direction in [-1.0, 1.0]:
			var point: Vector2 = points[index] + side * local_width * 0.5 * direction
			var y: float = y_offset if flat_water else get_height_at(point.x, point.y) + y_offset
			vertices.append(Vector3(point.x, y, point.y))
			normals.append(Vector3.UP)
			uvs.append(Vector2((direction + 1.0) * 0.5, float(index) * 0.48))

	for index in range(points.size() - 1):
		var base := index * 2
		indices.append_array(PackedInt32Array([base, base + 2, base + 1, base + 1, base + 2, base + 3]))

	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_NORMAL] = normals
	arrays[Mesh.ARRAY_TEX_UV] = uvs
	arrays[Mesh.ARRAY_INDEX] = indices
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	mesh.surface_set_material(0, material)
	var instance := MeshInstance3D.new()
	instance.mesh = mesh
	instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF if flat_water else GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	parent.add_child(instance)
