class_name LearningCatalog
extends RefCounted
## Read-only access to the learning data in res://data/learning (kept separate from gameplay).
## A grade only ever gets its own content: a missing unit/activity returns {} and the caller
## must say so; never substitute another grade's data.

const DATA_DIR := "res://data/learning/"

static var _units: Array = []
static var _content_cache := {}


static func units() -> Array:
	if _units.is_empty():
		var data = _read_json(DATA_DIR + "units.json")
		if data is Dictionary:
			_units = data.get("units", [])
	return _units


static func units_for_grade(grade: int) -> Array:
	return units().filter(func(u): return int(u["grade"]) == grade)


static func unit_content(grade: int, unit: int) -> Dictionary:
	var key := "g%d_u%02d" % [grade, unit]
	if _content_cache.has(key):
		return _content_cache[key]
	var content := {}
	for u in units():
		if int(u["grade"]) == grade and int(u["unit"]) == unit and String(u.get("content_file", "")) != "":
			var data = _read_json(DATA_DIR + String(u["content_file"]))
			if data is Dictionary and int(data.get("grade", -1)) == grade:
				content = data
	_content_cache[key] = content
	return content


## Activity data (e.g. "lost_letter") for exactly this grade and unit, or {} when not written yet.
static func activity(grade: int, unit: int, activity_id: String) -> Dictionary:
	return unit_content(grade, unit).get("activities", {}).get(activity_id, {})


## Vocabulary list [{word, vi, source?}] for exactly this grade and unit, or [] when none was entered.
static func vocabulary(grade: int, unit: int) -> Array:
	return unit_content(grade, unit).get("vocabulary", [])


static func _read_json(path: String) -> Variant:
	if not FileAccess.file_exists(path):
		push_warning("LearningCatalog: missing " + path)
		return null
	return JSON.parse_string(FileAccess.get_file_as_string(path))
