extends RefCounted

static func height_at(x: float, z: float) -> float:
	var river_distance := absf(x - 8.0 - sin(z * 0.18) * 0.45)
	var bank := smoothstep(2.8, 5.0, river_distance)
	var hills := smoothstep(10, 16, absf(z)) * smoothstep(4, 10, absf(x)) * (0.45 + sin(x*0.4)*0.2)
	return lerpf(-0.8, hills, bank)

static func make_mesh() -> ArrayMesh:
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	var noise := FastNoiseLite.new()
	noise.seed = 145
	noise.frequency = 0.3
	var resolution := 128
	for z_i in range(resolution+1):
		for x_i in range(resolution+1):
			var x := -16.0 + x_i * 0.25
			var z := -16.0 + z_i * 0.25
			var river_distance := absf(x - 8.0 - sin(z*0.18)*0.45)
			var path := 1.0-smoothstep(1.3, 2.5, absf(z) + noise.get_noise_2d(x,z)*0.3)
			var yard := 1.0-smoothstep(3.0, 6.5, Vector2(x,z+11).length())
			var wet := 1.0-smoothstep(3.2,4.8,river_distance)
			var gravel := (1.0-smoothstep(4.5,6.0,river_distance)) * (1.0-wet)
			var dirt := maxf(path,yard)*(1.0-wet)*(1.0-gravel)
			var grass := maxf(0,1.0-wet-gravel-dirt)
			surface.set_color(Color(grass,dirt,gravel,wet))
			surface.set_uv(Vector2(x,z)*0.2)
			surface.add_vertex(Vector3(x,height_at(x,z),z))
	for z in range(resolution):
		for x in range(resolution):
			var a := z*(resolution+1)+x
			for index in [a,a+1,a+resolution+1,a+1,a+resolution+2,a+resolution+1]:
				surface.add_index(index)
	surface.generate_normals()
	return surface.commit()
