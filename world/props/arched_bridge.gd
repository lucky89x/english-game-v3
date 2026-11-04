extends StaticBody3D

# Bend the existing Quaternius wooden floor; collision follows the visible deck.
func _ready() -> void:
	$CollisionShape3D.disabled = true
	for side in [-1.0, 1.0]:
		# Use textured Quaternius wood modules instead of an untextured triangle.
		var approach := preload("res://assets/Medieval Village MegaKit[Standard]/glTF/Floor_WoodDark.gltf").instantiate() as Node3D
		approach.name = "WoodApproachNorth" if side < 0 else "WoodApproachSouth"
		add_child(approach)
		approach.position = Vector3(0,0.045,side*3.815)
		approach.rotation.x = side*atan(0.49/1.47)
		approach.scale = Vector3(1.5,1.0,sqrt(1.47*1.47+0.49*0.49)/2.0)
		for visual in approach.find_children("*","MeshInstance3D",true,false):
			visual.create_trimesh_collision()
	for deck_name in ["Deck1", "Deck2", "Deck3"]:
		var deck := get_node(deck_name) as Node3D
		for item in deck.find_children("*", "MeshInstance3D", true, false):
			var visual := item as MeshInstance3D
			var original := visual.mesh
			var bent := ArrayMesh.new()
			var relative := global_transform.affine_inverse() * visual.global_transform
			for index in range(original.get_surface_count()):
				var arrays := original.surface_get_arrays(index)
				var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
				for vertex_index in range(vertices.size()):
					var point := relative * vertices[vertex_index]
					point.y += arch(point.z)
					vertices[vertex_index] = relative.affine_inverse() * point
				arrays[Mesh.ARRAY_VERTEX] = vertices
				var temporary := ArrayMesh.new()
				temporary.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
				var surface := SurfaceTool.new()
				surface.create_from(temporary, 0)
				surface.generate_normals()
				surface.set_material(original.surface_get_material(index))
				surface.commit(bent)
			visual.mesh = bent
			visual.create_trimesh_collision()
	for child in get_children():
		if "Rail" in child.name:
			child.position.y += arch(child.position.z)
			child.rotation.x = atan(-0.30 * PI / 6.2 * sin(child.position.z * PI / 6.2))
			var rail_collision := CollisionShape3D.new()
			var shape := BoxShape3D.new()
			shape.size = Vector3(0.14, 0.8, 2.0)
			rail_collision.shape = shape
			rail_collision.position = child.position + Vector3(0, 0.4, 0)
			add_child(rail_collision)

	_add_structural_timber()

func arch(z: float) -> float:
	return 0.30 * maxf(0.0, cos(z * PI / 6.2))

# Visible structural ribs use the textured Quaternius timber asset.
# Decorations stay outside the 2.7 m navigable deck.
func _add_structural_timber() -> void:
	var timber := preload("res://assets/Medieval Village MegaKit[Standard]/glTF/Corner_Exterior_Wood.gltf")
	for side in [-1.0,1.0]:
		for i in range(8):
			var z0 := -4.25+float(i)*8.5/8.0
			var z1 := -4.25+float(i+1)*8.5/8.0
			var a := Vector3(side*1.34,-0.35+0.74*(1.0-pow(z0/4.25,2)),z0)
			var b := Vector3(side*1.34,-0.35+0.74*(1.0-pow(z1/4.25,2)),z1)
			var rib := timber.instantiate() as Node3D
			rib.name="ArchTimber_%d_%d" % [int(side),i]
			add_child(rib)
			rib.position=a
			rib.basis=Basis(Quaternion(Vector3.UP,(b-a).normalized())).scaled(Vector3(1.4,(b-a).length()/3.0,1.4))
		for end in [-1.0,1.0]:
			var post := timber.instantiate() as Node3D
			post.name="EndPost"
			add_child(post)
			post.position=Vector3(side*1.47,0.05,end*3.25)
			post.scale=Vector3(1.4,0.5,1.4)
			var lantern := preload("res://assets/Exports/glTF/Lantern_Wall.gltf").instantiate() as Node3D
			add_child(lantern)
			lantern.position=Vector3(side*1.47,1.05,end*3.25)
			lantern.rotation.y=side*PI/2
			lantern.scale=Vector3.ONE*0.36
