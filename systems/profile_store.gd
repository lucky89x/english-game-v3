class_name ProfileStore
extends RefCounted
## Player profiles (one per child): name, grade and a save file of its own.
## Index file: user://profiles.json {"version": 1, "last": id, "profiles": [{id, name, grade, save, created}]}.
## A save made before profiles existed (user://english_quest_save.json) becomes the first profile.

const VERSION := 1
const DEFAULT_INDEX := "user://profiles.json"
const GRADES := [6, 7, 8, 9]

## Tests point this at a scratch file so they never touch the family's real profiles.
static var index_path := DEFAULT_INDEX


static func load_index() -> Dictionary:
	var data = null
	for path in [index_path, index_path + ".bak"]:
		if FileAccess.file_exists(path):
			data = JSON.parse_string(FileAccess.get_file_as_string(path))
			if data is Dictionary and data.has("profiles"):
				break
			data = null
	if data == null:
		data = {"version": VERSION, "last": "", "profiles": []}
		_adopt_legacy_save(data)
	data["version"] = int(data.get("version", VERSION))
	for p in data["profiles"]:
		p["grade"] = int(p.get("grade", 0))
	return data


static func profiles() -> Array:
	return load_index()["profiles"]


static func find(profile_id: String) -> Dictionary:
	for p in profiles():
		if p["id"] == profile_id:
			return p
	return {}


## Creates and stores a profile; returns it. Empty names become "Người chơi N".
static func create(player_name: String, grade: int) -> Dictionary:
	var data := load_index()
	var clean := player_name.strip_edges().left(20)
	if clean.is_empty():
		clean = "Người chơi %d" % (data["profiles"].size() + 1)
	var id := "p%d_%d" % [int(Time.get_unix_time_from_system()), randi() % 100000]
	var profile := {"id": id, "name": clean, "grade": grade if GRADES.has(grade) else 6,
		"save": "user://profile_%s.json" % id, "created": Time.get_datetime_string_from_system()}
	data["profiles"].append(profile)
	data["last"] = id
	_write(data)
	return profile


static func set_last(profile_id: String) -> void:
	var data := load_index()
	data["last"] = profile_id
	_write(data)


static func _adopt_legacy_save(data: Dictionary) -> void:
	if not FileAccess.file_exists(GameState.DEFAULT_PATH) or index_path != DEFAULT_INDEX:
		return
	var old = JSON.parse_string(FileAccess.get_file_as_string(GameState.DEFAULT_PATH))
	var grade := int(old.get("grade", 6)) if old is Dictionary else 6
	data["profiles"].append({"id": "legacy", "name": "Người chơi 1", "grade": grade if GRADES.has(grade) else 6,
		"save": GameState.DEFAULT_PATH, "created": ""})
	data["last"] = "legacy"
	_write(data)


static func _write(data: Dictionary) -> void:
	var tmp := index_path + ".tmp"
	var f := FileAccess.open(tmp, FileAccess.WRITE)
	if f == null:
		push_warning("ProfileStore: cannot write " + tmp)
		return
	f.store_string(JSON.stringify(data, "\t"))
	f.close()
	if FileAccess.file_exists(index_path):
		DirAccess.rename_absolute(index_path, index_path + ".bak")
	DirAccess.rename_absolute(tmp, index_path)
