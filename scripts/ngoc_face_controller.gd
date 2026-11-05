class_name NgocFaceController
extends Node
## Drives a chibi05 painted face: random blinking, talking mouth flaps and short "joy"
## expressions. Works for Ngoc (material "NgocFace") and the chibi05 NPCs (materials named
## "<asset>_Face"); textures are loaded from `texture_dir`/`texture_prefix`_face_<key>.png.

@export var model_path: NodePath = ^".."
@export var texture_dir := "res://assets/characters/models"
@export var texture_prefix := "ngoc"
@export var blink_interval := Vector2(2.2, 4.8)
@export var blink_duration := 0.12
@export var talk_flap_rate := 7.0

var face_material: BaseMaterial3D
var faces := {}
var current_face := ""
var _blink_wait := 0.0
var _blink_left := 0.0
var _talk_left := 0.0
var _talk_clock := 0.0
var _expression := "happy"
var _expression_left := 0.0


func _ready() -> void:
	for key in ["happy", "blink", "talk", "joy"]:
		var path := "%s/%s_face_%s.png" % [texture_dir, texture_prefix, key]
		if ResourceLoader.exists(path):
			faces[key] = load(path)
	if not faces.has("joy") and faces.has("happy"):
		faces["joy"] = faces["happy"]
	var model := get_node_or_null(model_path)
	if model == null:
		push_warning("NgocFaceController: model not found")
		return
	for node in model.find_children("*", "MeshInstance3D", true, false):
		var mesh_instance := node as MeshInstance3D
		if mesh_instance.mesh == null:
			continue
		for surface in mesh_instance.mesh.get_surface_count():
			var material := mesh_instance.get_active_material(surface)
			if material is BaseMaterial3D and (material.resource_name == "NgocFace" or material.resource_name.ends_with("_Face")):
				face_material = material.duplicate() as BaseMaterial3D
				mesh_instance.set_surface_override_material(surface, face_material)
				break
		if face_material != null:
			break
	_blink_wait = randf_range(blink_interval.x, blink_interval.y)
	_show("happy")


## Mouth flaps for `duration` seconds (e.g. while a dialogue line is shown).
func talk(duration: float = 1.6) -> void:
	_talk_left = maxf(_talk_left, duration) if duration > 0.0 else 0.0


## Hold an expression ("joy", "happy", "blink", "talk") for `duration` seconds.
func express(face: String, duration: float = 1.2) -> void:
	if faces.has(face):
		_expression = face
		_expression_left = duration


func _process(delta: float) -> void:
	if face_material == null:
		return
	_blink_wait -= delta
	if _blink_wait <= 0.0:
		_blink_left = blink_duration
		_blink_wait = randf_range(blink_interval.x, blink_interval.y)
	_blink_left = maxf(0.0, _blink_left - delta)
	_expression_left = maxf(0.0, _expression_left - delta)
	if _expression_left <= 0.0:
		_expression = "happy"
	var face := _expression
	if _talk_left > 0.0:
		_talk_left -= delta
		_talk_clock += delta
		face = "talk" if fmod(_talk_clock * talk_flap_rate, 2.0) < 1.0 else "happy"
	if _blink_left > 0.0 and face != "joy":
		face = "blink"
	_show(face)


func _show(face: String) -> void:
	if face == current_face or face_material == null or not faces.has(face):
		return
	current_face = face
	face_material.albedo_texture = faces[face]
