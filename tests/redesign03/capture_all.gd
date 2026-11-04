extends SceneTree
func _initialize() -> void:
 call_deferred("run")
func run() -> void:
 var gallery=load("res://tests/redesign03/asset_review.tscn").instantiate()
 root.add_child(gallery)
 await process_frame
 for i in range(6):
  gallery.show_model(i)
  for a in [0,90,180,270]:
   gallery.yaw=deg_to_rad(a)
   for frame in range(10):await process_frame
   await RenderingServer.frame_post_draw
   root.get_texture().get_image().save_png("res://artifacts/redesign03/review_%d_%d.png"%[i,a])
 quit()
