extends Node3D
## Paves every road of VillageLayout.ROADS with evenly laid, slightly varied cobbles plus
## darker kerb stones on both edges. One MultiMesh per stone kind keeps it to two draw calls.

const LAYOUT := preload("res://world/zones/starter_village/village_layout.gd")
const SPACING := 0.48
const STONE_RADIUS := 0.25

var landscape: Node
var random := RandomNumberGenerator.new()


func build(height_source: Node) -> void:
	landscape = height_source
	random.seed = 2026
	var cobbles: Array[Transform3D] = []
	var cobble_colors: Array[Color] = []
	var kerbs: Array[Transform3D] = []
	var kerb_colors: Array[Color] = []
	for road in LAYOUT.ROADS:
		_pave(road[1], float(road[0]), cobbles, cobble_colors, kerbs, kerb_colors)
	add_child(_batch("Cobbles", _stone_mesh(STONE_RADIUS, 0.07, 6), cobbles, cobble_colors))
	add_child(_batch("Kerbs", _stone_mesh(0.22, 0.12, 4), kerbs, kerb_colors))


func _pave(points: Array, width: float, cobbles: Array[Transform3D], cobble_colors: Array[Color],
		kerbs: Array[Transform3D], kerb_colors: Array[Color]) -> void:
	var row := 0
	for i in range(points.size() - 1):
		var a: Vector2 = points[i]
		var b: Vector2 = points[i + 1]
		var length := a.distance_to(b)
		var along := (b - a) / maxf(length, 0.001)
		var side := Vector2(-along.y, along.x)
		var steps := int(length / SPACING)
		for s in range(steps):
			var centre := a + along * (float(s) + 0.5) * SPACING
			var shift := 0.5 * SPACING if row % 2 else 0.0
			row += 1
			var across := -width * 0.5 + 0.26 + shift
			while across < width * 0.5 - 0.22:
				var p := centre + side * across + Vector2(random.randf_range(-0.05, 0.05), random.randf_range(-0.05, 0.05))
				across += SPACING
				if LAYOUT.in_river(p.x, p.y, 4.1):
					continue
				var basis := Basis(Vector3.UP, random.randf_range(0, TAU)).scaled(Vector3.ONE * random.randf_range(0.82, 1.08))
				cobbles.append(Transform3D(basis, _ground(p, 0.012)))
				var tone := random.randf_range(0.78, 1.12)
				var warm := random.randf_range(-0.04, 0.04)
				cobble_colors.append(Color(tone + warm, tone, tone - warm * 0.5))
			for edge in [-1.0, 1.0]:
				var q: Vector2 = centre + side * float(edge) * (width * 0.5 + 0.05)
				if LAYOUT.in_river(q.x, q.y, 4.1):
					continue
				var kb := Basis(Vector3.UP, atan2(along.x, along.y) + random.randf_range(-0.2, 0.2))
				kb = kb.scaled(Vector3(random.randf_range(0.9, 1.1), random.randf_range(0.9, 1.2), random.randf_range(1.1, 1.3)))
				kerbs.append(Transform3D(kb, _ground(q, 0.0)))
				var k := random.randf_range(0.78, 0.92)
				kerb_colors.append(Color(k, k * 0.97, k * 1.02))


func _ground(p: Vector2, lift: float) -> Vector3:
	var y := 0.0
	if landscape != null:
		y = landscape.get_height_at(p.x, p.y)
	return Vector3(p.x, y + lift, p.y)


func _batch(label: String, mesh: Mesh, transforms: Array[Transform3D], colors: Array[Color]) -> MultiMeshInstance3D:
	var multi := MultiMesh.new()
	multi.transform_format = MultiMesh.TRANSFORM_3D
	multi.use_colors = true
	multi.mesh = mesh
	multi.instance_count = transforms.size()
	for i in range(transforms.size()):
		multi.set_instance_transform(i, transforms[i])
		multi.set_instance_color(i, colors[i])
	var instance := MultiMeshInstance3D.new()
	instance.name = label
	instance.multimesh = multi
	instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	instance.visibility_range_end = 140.0
	return instance


## A rounded, slightly domed hexagonal (or square) cobble.
func _stone_mesh(radius: float, height: float, sides: int) -> Mesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var material := StandardMaterial3D.new()
	material.vertex_color_use_as_albedo = true
	material.albedo_color = Color(0.50, 0.45, 0.49)
	material.roughness = 0.88
	st.set_material(material)
	var top := []
	var rim := []
	var base := []
	for i in range(sides):
		var a := TAU * float(i) / float(sides) + PI / float(sides)
		var dir := Vector3(cos(a), 0, sin(a))
		top.append(dir * radius * 0.78 + Vector3(0, height, 0))
		rim.append(dir * radius + Vector3(0, height * 0.65, 0))
		base.append(dir * radius * 1.02 + Vector3(0, -0.04, 0))
	var apex := Vector3(0, height * 1.18, 0)
	for i in range(sides):
		var j := (i + 1) % sides
		_tri(st, apex, top[j], top[i])
		_quad(st, top[i], top[j], rim[j], rim[i])
		_quad(st, rim[i], rim[j], base[j], base[i])
	st.generate_normals()
	return st.commit()


func _tri(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3) -> void:
	# Godot treats clockwise (seen from outside) as the front face.
	st.add_vertex(a)
	st.add_vertex(c)
	st.add_vertex(b)


func _quad(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, d: Vector3) -> void:
	_tri(st, a, b, c)
	_tri(st, a, c, d)
