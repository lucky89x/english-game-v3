extends SceneTree
const Gallery := preload("res://tests/batch01/asset_gallery.gd")
const OUT := "res://artifacts/batch01/"
var failed := false
var report: Array[Dictionary] = []

func check(ok: bool, message: String) -> void:
	print("PASS " if ok else "FAIL ",message)
	failed = failed or not ok

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var gallery := Node3D.new()
	gallery.set_script(Gallery)
	root.add_child(gallery)
	var render := DisplayServer.get_name() != "headless"
	if render:
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
		root.size = Vector2i(1280,720)
	for asset_index in range(5):
		gallery.show_asset(asset_index)
		await process_frame
		var subject: Node3D = gallery.subject
		var bounds := Gallery.bounds_of(subject)
		var info := {"file":Gallery.FILES[asset_index],"bounds_local":str(bounds),"mesh_instances":subject.find_children("*","MeshInstance3D",true,false).size(),"art_approved":false,"clips":[],"missing":[],"bone_pose_changes":{}}
		check(info.mesh_instances>0,"Meshes loaded "+Gallery.FILES[asset_index])
		if asset_index<2:
			var skeletons := subject.find_children("*","Skeleton3D",true,false)
			check(not skeletons.is_empty(),"Skeleton3D imported")
			var skeleton := skeletons[0] as Skeleton3D
			info["bones"]=skeleton.get_bone_count()
			info["bone_names"]=[]
			for bone in range(skeleton.get_bone_count()):
				info.bone_names.append(skeleton.get_bone_name(bone))
			info.clips=Array(gallery.animation.get_animation_list())
			var requested := ["Idle","Walk","Run","Jump","Fall","Land","Talk","Interact"] if asset_index==0 else ["Idle","Talk","Wave","Walk"]
			for clip in requested:
				if not gallery.animation.has_animation(clip):
					info.missing.append(clip)
					print("MISSING ",clip," in ",Gallery.FILES[asset_index])
					continue
				gallery.animation.play(clip)
				gallery.animation.seek(0,true)
				var before: Array[Transform3D] = []
				for bone in range(skeleton.get_bone_count()):
					before.append(skeleton.get_bone_pose(bone))
				gallery.animation.advance(0.37)
				var changed := 0
				for bone in range(skeleton.get_bone_count()):
					if not before[bone].is_equal_approx(skeleton.get_bone_pose(bone)):
						changed += 1
				info.bone_pose_changes[clip]=changed
				check(changed>0,"Real bone motion: "+clip)
			gallery.animation.play("Idle")
			gallery.animation.seek(0.2,true)
			gallery.animation.pause()
			info["display_height_m"] = bounds.size.y * subject.scale.y
		report.append(info)
		if render:
			for angle in range(4):
				gallery.yaw=angle*PI/2
				gallery.update_camera()
				for frame in range(5):
					await process_frame
				await RenderingServer.frame_post_draw
				root.get_texture().get_image().save_png(OUT+"asset_%d_angle_%d.png" % [asset_index,angle*90])
			if asset_index==0:
				gallery.focus=Vector3(0,1.28,0)
				gallery.distance=0.85
				gallery.pitch=-0.05
				gallery.yaw=0
				gallery.update_camera()
				await process_frame
				await RenderingServer.frame_post_draw
				root.get_texture().get_image().save_png(OUT+"hero_portrait_baseline.png")
	if render:
		var samples_report := "Pilot gallery; real rendering; VSync OFF; orbit on terrain + bridge\nGPU: "+RenderingServer.get_video_adapter_name()+"\n"
		for size in [Vector2i(1280,720),Vector2i(1920,1080)]:
			root.size=size
			DisplayServer.window_set_size(size)
			gallery.angle_auto=true
			await create_timer(2.0).timeout
			var samples: Array[float]=[]
			var started := Time.get_ticks_usec()
			var previous := started
			while Time.get_ticks_usec()-started < 10000000:
				await RenderingServer.frame_post_draw
				await process_frame
				var now := Time.get_ticks_usec()
				samples.append((now-previous)/1000.0)
				previous=now
			samples.sort()
			samples_report += "%s %.1f FPS p95 %.2f ms p99 %.2f ms\n" % [size,samples.size()*1000000.0/(Time.get_ticks_usec()-started),samples[int(samples.size()*0.95)],samples[int(samples.size()*0.99)]]
		FileAccess.open(OUT+"pilot_performance.txt",FileAccess.WRITE).store_string(samples_report)
		print(samples_report)
	FileAccess.open(OUT+"godot_validation.json",FileAccess.WRITE).store_string(JSON.stringify(report,"\t"))
	gallery.queue_free()
	await process_frame
	await test_bridge()
	quit(1 if failed else 0)

func test_bridge() -> void:
	var arena := Node3D.new()
	root.add_child(arena)
	var bridge := Gallery.read_glb(Gallery.FILES[3])
	arena.add_child(bridge)
	for mesh in bridge.find_children("*","MeshInstance3D",true,false):
		mesh.create_trimesh_collision()
	var ground := StaticBody3D.new()
	arena.add_child(ground)
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size=Vector3(20,0.2,24)
	shape.shape=box
	shape.position.y=-0.3
	ground.add_child(shape)
	var actor := CharacterBody3D.new()
	arena.add_child(actor)
	var capsule := CapsuleShape3D.new()
	capsule.radius=0.3
	capsule.height=1.8
	var body_shape := CollisionShape3D.new()
	body_shape.shape=capsule
	actor.add_child(body_shape)
	actor.position=Vector3(0,0.75,-5.5)
	var highest := 0.0
	for direction in [1.0,-1.0]:
		for frame in range(240):
			await physics_frame
			actor.velocity=Vector3(0,-2,direction*3)
			actor.move_and_slide()
			highest=maxf(highest,actor.position.y)
		check(actor.position.z>5 if direction>0 else actor.position.z < -5,"Imported GLB bridge crossing direction "+str(direction)+" end="+str(actor.position))
	check(highest>1.35,"Actor followed curved deck, not ground below bridge")
	arena.queue_free()
