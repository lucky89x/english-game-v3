extends StaticBody3D
## chibi05 curved wooden bridge (prop_bridge_curved_v02.glb, built by
## tools/chibi05/build_props_chibi.py). Collision follows the arched deck in short sloped
## boxes plus side rails and gentle end ramps, so the hero walks over it smoothly.

const LENGTH := 11.5
const WIDTH := 2.8
const RISE := 0.95
const SEGMENTS := 16


func deck_height(z: float) -> float:
	return RISE * cos(PI * z / LENGTH) - 0.03


func _ready() -> void:
	var model := (load("res://assets/environment/village/models/prop_bridge_curved_v02.glb") as PackedScene).instantiate()
	model.name = "Model"
	add_child(model)
	for i in range(SEGMENTS):
		var z0 := -LENGTH / 2.0 + float(i) * LENGTH / SEGMENTS
		var z1 := z0 + LENGTH / SEGMENTS
		_slab(Vector2(z0, deck_height(z0)), Vector2(z1, deck_height(z1)), WIDTH, 0.0)
		for side in [-1.0, 1.0]:
			_rail(Vector2(z0, deck_height(z0)), Vector2(z1, deck_height(z1)), float(side) * (WIDTH / 2.0 + 0.05))
	for end in [-1.0, 1.0]:
		var top := Vector2(float(end) * LENGTH / 2.0, deck_height(LENGTH / 2.0))
		var foot := Vector2(float(end) * (LENGTH / 2.0 + 0.9), -0.35)
		_slab(top, foot, WIDTH, 0.0)


## A box whose top surface runs from a to b (a, b = (z, y)) in the bridge's local YZ plane.
func _slab(a: Vector2, b: Vector2, width: float, x: float) -> void:
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	var length := a.distance_to(b)
	box.size = Vector3(width, 0.24, length + 0.06)
	shape.shape = box
	var mid := (a + b) * 0.5
	var angle := -atan2(b.y - a.y, b.x - a.x)
	shape.rotation.x = angle
	var down := Vector3(0, cos(angle), sin(angle)) * -0.12
	shape.position = Vector3(x, mid.y, mid.x) + down
	add_child(shape)


func _rail(a: Vector2, b: Vector2, x: float) -> void:
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(0.14, 1.0, a.distance_to(b) + 0.04)
	shape.shape = box
	var mid := (a + b) * 0.5
	shape.rotation.x = -atan2(b.y - a.y, b.x - a.x)
	shape.position = Vector3(x, mid.y + 0.5, mid.x)
	add_child(shape)
