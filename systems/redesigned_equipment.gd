extends Node3D
# A small equipment display beside the existing square, using authored GLB assets.
func _ready() -> void:
 var table := (load("res://assets/Exports/glTF/Table_Large.gltf") as PackedScene).instantiate() as Node3D
 add_child(table)
 table.position = Vector3(-4.5,0,14.5)
 var top := 0.0
 for mesh in table.find_children("*","MeshInstance3D",true,false):
  var box: AABB = mesh.global_transform * mesh.get_aabb()
  top = maxf(top,box.end.y)
 var body := StaticBody3D.new()
 add_child(body)
 var shape := CollisionShape3D.new()
 var box := BoxShape3D.new()
 box.size=Vector3(2.6,maxf(top,0.8),1.4)
 shape.shape=box
 shape.position=Vector3(-4.5,top*0.5,14.5)
 body.add_child(shape)
 for i in range(3):
  var potion := asset("props_potion_blue.glb")
  potion.position=Vector3(-5.1+float(i)*0.25,top+0.02,14.5)
 var scroll := asset("props_scroll_sealed.glb")
 scroll.position=Vector3(-4.2,top+0.02,14.5)
 scroll.rotation.y=0.25
 var pack := asset("props_explorer_pack.glb")
 pack.position=Vector3(-3.85,top+0.02,14.4)
 var staff := asset("props_lantern_staff.glb")
 staff.position=Vector3(-5.9,0,14.6)
 staff.rotation.z=0.12
func asset(filename: String) -> Node3D:
 var model := (load("res://assets/redesign03/"+filename) as PackedScene).instantiate() as Node3D
 add_child(model)
 return model
