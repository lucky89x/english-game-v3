extends Node3D
const MODELS := ["ngoc_adventurer.glb", "tom_elder.glb", "props_potion_blue.glb", "props_scroll_sealed.glb", "props_explorer_pack.glb", "props_lantern_staff.glb"]
var subject: Node3D
var camera: Camera3D
var animation: AnimationPlayer
var label: Label
var index := 0
var yaw := 0.0
var pitch := -0.15
var distance := 3.3
var focus := Vector3(0,0.85,0)
var dragging := false
func _ready() -> void:
 var environment := WorldEnvironment.new()
 environment.environment = Environment.new()
 environment.environment.background_mode = Environment.BG_COLOR
 environment.environment.background_color = Color(0.16,0.21,0.25)
 environment.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
 environment.environment.ambient_light_energy = 0.65
 add_child(environment)
 var sun := DirectionalLight3D.new()
 sun.rotation_degrees = Vector3(-30,-35,0)
 sun.light_energy = 1.3
 add_child(sun)
 camera = Camera3D.new()
 camera.fov = 38
 add_child(camera)
 camera.current = true
 var canvas := CanvasLayer.new()
 add_child(canvas)
 label = Label.new()
 label.position = Vector2(20,20)
 label.add_theme_font_size_override("font_size",20)
 canvas.add_child(label)
 show_model(0)
func show_model(which: int) -> void:
 if subject != null:
  remove_child(subject)
  subject.queue_free()
 index = posmod(which,MODELS.size())
 var doc := GLTFDocument.new()
 var state := GLTFState.new()
 assert(doc.append_from_file("res://assets/redesign03/"+MODELS[index],state)==OK)
 subject = doc.generate_scene(state)
 add_child(subject)
 var players := subject.find_children("*","AnimationPlayer",true,false)
 animation = players[0] if not players.is_empty() else null
 distance = 3.3 if index < 2 or index == 5 else 1.0
 focus = Vector3(0,0.85,0) if index < 2 or index == 5 else Vector3(0,0.15,0)
 label.text = MODELS[index]+"\nTab: đổi mẫu | Chuột phải kéo: xoay | Con lăn: zoom\n1 Idle · 2 Walk · 3 Run · 4 Talk · 5 Wave"
 play("Idle")
func play(clip: String) -> void:
 if animation == null: return
 if not animation.has_animation(clip):
  label.text += "\nChưa có clip: "+clip
  return
 animation.get_animation(clip).loop_mode = Animation.LOOP_LINEAR
 animation.play(clip,0.18)
func _unhandled_input(event: InputEvent) -> void:
 if event is InputEventMouseButton:
  if event.button_index == MOUSE_BUTTON_RIGHT: dragging = event.pressed
  if event.pressed and event.button_index in [MOUSE_BUTTON_WHEEL_UP,MOUSE_BUTTON_WHEEL_DOWN]:
   distance = clampf(distance*(0.9 if event.button_index==MOUSE_BUTTON_WHEEL_UP else 1.1),0.3,10)
 if event is InputEventMouseMotion and dragging:
  yaw -= event.relative.x*0.006
  pitch = clampf(pitch-event.relative.y*0.004,-1.3,0.8)
 if event is InputEventKey and event.pressed and not event.echo:
  if event.physical_keycode == KEY_TAB: show_model(index+1)
  if event.physical_keycode in [KEY_1,KEY_2,KEY_3,KEY_4,KEY_5]: play(["Idle","Walk","Run","Talk","Wave"][event.physical_keycode-KEY_1])
func _process(_delta: float) -> void:
 camera.position = focus+Vector3(sin(yaw)*cos(pitch),-sin(pitch),cos(yaw)*cos(pitch))*distance
 camera.look_at(focus)
