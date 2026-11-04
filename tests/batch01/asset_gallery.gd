extends Node3D

const DIR := "res://assets/pilot_batch01/"
const FILES := ["chr_quaternius_adventurer_baseline_v01.glb", "npc_quaternius_wizard_baseline_v01.glb", "bld_quaternius_hall_baseline_v01.glb", "brg_quaternius_arch_baseline_v01.glb", "trn_mask_sample_v01.glb"]
const TITLES := ["Ngọc: Quaternius baseline — CHƯA ĐẠT CONCEPT", "Tom: Wizard baseline — Talk/Wave MISSING", "Nhà trưởng làng: kitbash đối chứng — CHƯA DUYỆT", "Cầu gỗ: kitbash đối chứng — CHƯA DUYỆT", "Terrain: mask 5 vùng — ART_IN_PROGRESS"]
@export var start_index := 0
var index := 0
var subject: Node3D
var camera: Camera3D
var label: Label
var animation: AnimationPlayer
var yaw := 0.0
var pitch := -0.3
var distance := 4.0
var focus := Vector3.UP
var dragging := false
var inside := false
var angle_auto := false

static func read_glb(filename: String) -> Node3D:
	var document := GLTFDocument.new()
	var state := GLTFState.new()
	var error := document.append_from_file(DIR+filename,state)
	assert(error==OK,"GLB import failed: " + filename)
	return document.generate_scene(state)

static func bounds_of(node: Node3D) -> AABB:
	var bounds := AABB()
	var first := true
	for mesh in node.find_children("*","MeshInstance3D",true,false):
		var box: AABB = node.global_transform.affine_inverse() * mesh.global_transform * mesh.get_aabb()
		bounds = box if first else bounds.merge(box)
		first = false
	return bounds

func _ready() -> void:
	var environment := WorldEnvironment.new()
	environment.environment = Environment.new()
	environment.environment.background_mode = Environment.BG_COLOR
	environment.environment.background_color = Color(0.14,0.18,0.22)
	environment.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.environment.ambient_light_color = Color(0.8,0.85,1.0)
	environment.environment.ambient_light_energy = 0.6
	add_child(environment)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-45,-30,0)
	sun.light_energy = 1.4
	sun.shadow_enabled = true
	add_child(sun)
	camera = Camera3D.new()
	add_child(camera)
	camera.current = true
	camera.fov = 45
	camera.far = 400
	var canvas := CanvasLayer.new()
	add_child(canvas)
	label = Label.new()
	label.position = Vector2(18,18)
	label.add_theme_font_size_override("font_size",20)
	label.add_theme_color_override("font_outline_color",Color.BLACK)
	label.add_theme_constant_override("outline_size",6)
	canvas.add_child(label)
	show_asset(start_index)

func show_asset(which: int) -> void:
	if subject != null:
		remove_child(subject)
		subject.queue_free()
	index = posmod(which,FILES.size())
	inside = false
	subject = read_glb(FILES[index])
	add_child(subject)
	animation = null
	if index < 2:
		var box := bounds_of(subject)
		var factor := 1.5/box.size.y if index==0 else 1.55/box.size.y
		subject.scale = Vector3.ONE*factor
		subject.position.y = -box.position.y*factor
		var players := subject.find_children("*","AnimationPlayer",true,false)
		if not players.is_empty():
			animation = players[0]
			play_clip("Idle")
		focus = Vector3(0,0.75,0)
		distance = 3.4
	else:
		var box := bounds_of(subject)
		focus = box.get_center()
		distance = box.size.length()*1.15
	if index==4:
		var material := ShaderMaterial.new()
		material.shader = load(DIR+"terrain_mask_blend.gdshader")
		var detail := Image.load_from_file(DIR+"detail.png")
		detail.generate_mipmaps()
		material.set_shader_parameter("detail_texture",ImageTexture.create_from_image(detail))
		for mesh in subject.find_children("*","MeshInstance3D",true,false):
			mesh.material_override = material
			mesh.create_trimesh_collision()
		var water := read_glb("wat_river_sample_v01.glb")
		subject.add_child(water)
		var water_material := ShaderMaterial.new()
		water_material.shader = load("res://assets/materials/stylized_water.gdshader")
		for mesh in water.find_children("*","MeshInstance3D",true,false):
			mesh.material_override = water_material
		var bridge := read_glb(FILES[3])
		subject.add_child(bridge)
		bridge.position = Vector3(8,0,0)
		bridge.rotation.y = PI/2
		bridge.scale.z = 1.3
		for mesh in bridge.find_children("*","MeshInstance3D",true,false):
			mesh.create_trimesh_collision()
		pitch = -0.65
	label.text = TITLES[index]+"\nTab: mẫu kế | Chuột phải: xoay | Con lăn: zoom | O: quay tự động\n1 Idle · 2 Walk · 3 Run · 4 Talk · 5 Wave · E: xem nội thất / trò chuyện Tom"
	update_camera()

func play_clip(clip: String) -> bool:
	if animation == null or not animation.has_animation(clip):
		label.text += "\nMISSING: " + clip + " — không thay bằng clip khác"
		return false
	animation.get_animation(clip).loop_mode = Animation.LOOP_LINEAR
	animation.play(clip,0.2)
	return true

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_RIGHT:
			dragging = event.pressed
		if event.pressed and event.button_index in [MOUSE_BUTTON_WHEEL_UP,MOUSE_BUTTON_WHEEL_DOWN]:
			distance = clampf(distance * (0.9 if event.button_index==MOUSE_BUTTON_WHEEL_UP else 1.1),1,100)
	if event is InputEventMouseMotion and dragging:
		yaw -= event.relative.x*0.006
		pitch = clampf(pitch-event.relative.y*0.004,-1.35,0.2)
	if event is InputEventKey and event.pressed and not event.echo:
		if event.physical_keycode == KEY_TAB:
			show_asset(index+1)
		if event.physical_keycode == KEY_O:
			angle_auto = not angle_auto
		if event.physical_keycode in [KEY_1,KEY_2,KEY_3,KEY_4,KEY_5]:
			play_clip(["Idle","Walk","Run","Talk","Wave"][event.physical_keycode-KEY_1])
		if event.physical_keycode == KEY_E:
			if index==1:
				label.text += "\nTom baseline: Chào cháu! (Talk/Wave chưa được dựng.)"
			elif index==2:
				if inside:
					show_asset(2)
				else:
					remove_child(subject)
					subject.queue_free()
					subject = read_glb("bld_hall_interior_baseline_v01.glb")
					add_child(subject)
					inside = true
					focus = Vector3(0,0,0)
					distance = 14
					pitch = -0.7

func _process(delta: float) -> void:
	if angle_auto:
		yaw += delta*0.35
	update_camera()

func update_camera() -> void:
	camera.position = focus + Vector3(sin(yaw)*cos(pitch),-sin(pitch),cos(yaw)*cos(pitch))*distance
	camera.look_at(focus)
