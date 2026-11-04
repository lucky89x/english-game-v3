extends Resource
@export var player_name := "Ngọc"
@export var level := 1
@export var hp := 85
@export var max_hp := 85
@export var experience := 45
@export var max_experience := 90
@export var gold := 32
@export var vocabulary := 8

func update(values: Dictionary) -> void:
	for key in values:
		if key in ["player_name", "level", "hp", "max_hp", "experience", "max_experience", "gold", "vocabulary"]:
			set(key, values[key])
	max_hp = maxi(1, max_hp)
	max_experience = maxi(1, max_experience)
	hp = clampi(hp, 0, max_hp)
	experience = clampi(experience, 0, max_experience)
	changed.emit()
