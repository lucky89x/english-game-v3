extends SceneTree
const OUT := "res://assets/pilot_batch01/"

func _initialize() -> void:
	call_deferred("run")

func export_visual(source: Node3D, filename: String) -> void:
	var clean := Node3D.new()
	clean.name = filename.get_basename()
	var inverse := source.global_transform.affine_inverse()
	for node in source.find_children("*", "MeshInstance3D", true, false):
		if not node.is_visible_in_tree():
			continue
		var copy := MeshInstance3D.new()
		copy.name = node.name
		copy.mesh = node.mesh
		copy.skin = null
		copy.transform = inverse * node.global_transform
		for i in range(node.mesh.get_surface_count()):
			var material: Material = node.get_active_material(i)
			if material is ShaderMaterial:
				var fallback := StandardMaterial3D.new()
				fallback.albedo_texture = ImageTexture.create_from_image(Image.load_from_file(OUT+"detail.png"))
				fallback.albedo_color = Color(0.35,0.24,0.13)
				material = fallback
			copy.set_surface_override_material(i,material)
		clean.add_child(copy)
		copy.owner = clean
	var doc := GLTFDocument.new()
	var state := GLTFState.new()
	var error := doc.append_from_scene(clean,state)
	if error == OK:
		error = doc.write_to_filesystem(state,OUT+filename)
	print("EXPORT ",filename," result=",error)
	assert(error==OK)
	clean.free()

func run() -> void:
	var image := Image.create(256,256,false,Image.FORMAT_RGB8)
	var noise := FastNoiseLite.new()
	noise.seed = 51
	noise.frequency = 0.045
	for y in range(256):
		for x in range(256):
			var v := clampf(0.5+noise.get_noise_2d(x,y)*0.35,0.0,1.0)
			image.set_pixel(x,y,Color(v,v,v))
	image.save_png(OUT+"detail.png")
	var world := (load("res://world/main_world.tscn") as PackedScene).instantiate()
	root.add_child(world)
	for i in range(4):
		await process_frame
	var hall := Node3D.new()
	root.add_child(hall)
	# Export the existing kitbash as an explicitly unapproved baseline.
	for label in ["VillageHall","HallWing","HallWatchTower"]:
		var original := world.find_child(label,true,false) as Node3D
		for node in original.find_children("*","MeshInstance3D",true,false):
			var visual := node.duplicate() as MeshInstance3D
			for child in visual.get_children():
				visual.remove_child(child)
				child.free()
			hall.add_child(visual)
			visual.global_transform = node.global_transform
			visual.position -= Vector3(-1,0,-24)
	export_visual(hall,"bld_quaternius_hall_baseline_v01.glb")
	var bridge := world.get_node("WorldGeometry/FantasyVillage/Pond/Bridge") as Node3D
	export_visual(bridge,"brg_quaternius_arch_baseline_v01.glb")
	var interior := (load("res://world/interiors/hall_interior.tscn") as PackedScene).instantiate()
	root.add_child(interior)
	export_visual(interior,"bld_hall_interior_baseline_v01.glb")
	var ground := Node3D.new()
	root.add_child(ground)
	var mesh := MeshInstance3D.new()
	mesh.mesh = preload("res://tests/batch01/pilot_terrain.gd").make_mesh()
	var material := StandardMaterial3D.new()
	material.albedo_texture = ImageTexture.create_from_image(image)
	material.vertex_color_use_as_albedo = true
	material.albedo_color = Color(0.6,0.75,0.4)
	mesh.material_override = material
	ground.add_child(mesh)
	export_visual(ground,"trn_mask_sample_v01.glb")
	var water := Node3D.new()
	root.add_child(water)
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(65):
		var z := -16.0+i*0.5
		for side in [-1.0,1.0]:
			surface.set_uv(Vector2((side+1)/2.0,z*0.2))
			surface.add_vertex(Vector3(8+sin(z*0.18)*0.45+side*3.6,-0.28,z))
	for i in range(64):
		for index in [i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2]:
			surface.add_index(index)
	surface.generate_normals()
	var water_mesh := MeshInstance3D.new()
	water_mesh.mesh=surface.commit()
	water_mesh.material_override=material
	water.add_child(water_mesh)
	export_visual(water,"wat_river_sample_v01.glb")
	quit()

