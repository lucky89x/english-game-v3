extends SceneTree
var failed := false
func check(ok: bool,message: String) -> void:
 print("PASS " if ok else "FAIL ",message)
 failed = failed or not ok
func _initialize() -> void:
 call_deferred("run")
func run() -> void:
 var report: Array = []
 for filename in ["ngoc_adventurer.glb","tom_elder.glb"]:
  var doc := GLTFDocument.new()
  var state := GLTFState.new()
  check(doc.append_from_file("res://assets/redesign03/"+filename,state)==OK,"GLB loads "+filename)
  var model := doc.generate_scene(state)
  root.add_child(model)
  var skeletons := model.find_children("*","Skeleton3D",true,false)
  check(not skeletons.is_empty(),"Real skeleton "+filename)
  var skeleton := skeletons[0] as Skeleton3D
  var player := model.find_children("*","AnimationPlayer",true,false)[0] as AnimationPlayer
  var wanted := ["Idle","Walk","Run","Interact","Wave"] if filename.begins_with("ngoc") else ["Idle","Walk","Run","Talk","Wave"]
  var row := {"file":filename,"bones":skeleton.get_bone_count(),"clips":{}}
  for clip in wanted:
   check(player.has_animation(clip),"Required clip "+clip)
   player.play(clip)
   player.seek(0,true)
   var before: Array[Transform3D] = []
   for bone in range(skeleton.get_bone_count()):before.append(skeleton.get_bone_pose(bone))
   player.advance(0.37)
   var changes := 0
   for bone in range(skeleton.get_bone_count()):
    if not before[bone].is_equal_approx(skeleton.get_bone_pose(bone)):changes+=1
   check(changes>0,"Bone motion "+filename+" "+clip)
   row.clips[clip]=changes
  report.append(row)
  model.queue_free()
  await process_frame
 var world = load("res://world/main_world.tscn").instantiate()
 root.add_child(world)
 for i in range(5):await physics_frame
 var elder = world.get_node("WorldGeometry/FantasyVillage/NPCs/ElderRowan")
 check(elder.animation_player.has_animation("Talk"),"Tom main has Talk")
 elder.dialogue_open=true
 elder._play_gesture("Wave")
 await create_timer(2.4).timeout
 check(elder.animation_player.current_animation=="Talk","Wave finishes into Talk while dialogue open")
 elder.dialogue_open=false
 elder._play_gesture("Idle")
 check(elder.animation_player.current_animation=="Idle","Closed dialogue returns Idle")
 FileAccess.open("res://artifacts/redesign03/animation_validation.json",FileAccess.WRITE).store_string(JSON.stringify(report,"\t"))
 quit(1 if failed else 0)

