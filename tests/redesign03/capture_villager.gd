extends SceneTree
func _initialize():
 call_deferred("run")
func run():
 var world=Node3D.new()
 root.add_child(world)
 var env=WorldEnvironment.new()
 env.environment=Environment.new()
 env.environment.background_mode=Environment.BG_COLOR
 env.environment.background_color=Color(0.16,0.21,0.25)
 env.environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
 env.environment.ambient_light_color=Color(0.9,0.85,0.75)
 env.environment.ambient_light_energy=0.65
 world.add_child(env)
 var sun=DirectionalLight3D.new()
 sun.rotation_degrees=Vector3(-30,-35,0)
 sun.light_energy=1.3
 world.add_child(sun)
 var camera=Camera3D.new()
 world.add_child(camera)
 camera.current=true
 camera.fov=38
 var doc=GLTFDocument.new()
 var state=GLTFState.new()
 assert(doc.append_from_file("res://assets/redesign03/npc_villager.glb",state)==OK)
 var model=doc.generate_scene(state)
 world.add_child(model)
 var anim=model.find_children("*","AnimationPlayer",true,false)[0]
 print("CLIPS ",anim.get_animation_list())
 for clip in ["Idle","Walk","Run"]:
  anim.play(clip)
  anim.advance(0.25)
  anim.pause()
  for a in [0,90,180]:
   camera.position=Vector3(sin(deg_to_rad(a))*3.0,1.15,cos(deg_to_rad(a))*3.0)
   camera.look_at(Vector3(0,0.85,0))
   for i in range(8):await process_frame
   await RenderingServer.frame_post_draw
   root.get_texture().get_image().save_png("res://artifacts/redesign03/villager_%s_%d.png"%[clip,a])
 quit()
