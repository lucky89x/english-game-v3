extends Resource
@export var player_name := "Ngọc"
@export var level := 1
@export var hp := 85
@export var max_hp := 85
@export var experience := 45
@export var max_experience := 90
@export var gold := 32
@export var vocabulary := 8

## Adds EXP and levels up (each level needs 25% more EXP). Returns levels gained.
func add_experience(amount: int) -> int:
	var gained := 0
	experience += maxi(0, amount)
	while experience >= max_experience:
		experience -= max_experience
		level += 1
		max_experience = int(round(max_experience * 1.25))
		max_hp += 5
		hp = max_hp
		gained += 1
	changed.emit()
	return gained


func add_gold(amount: int) -> void:
	gold = maxi(0, gold + amount)
	changed.emit()


func to_dict() -> Dictionary:
	return {"level": level, "hp": hp, "max_hp": max_hp, "experience": experience, "max_experience": max_experience,
		"gold": gold, "vocabulary": vocabulary}


func update(values: Dictionary) -> void:
	for key in values:
		if key in ["player_name", "level", "hp", "max_hp", "experience", "max_experience", "gold", "vocabulary"]:
			set(key, values[key])
	max_hp = maxi(1, max_hp)
	max_experience = maxi(1, max_experience)
	hp = clampi(hp, 0, max_hp)
	experience = clampi(experience, 0, max_experience)
	changed.emit()
