class_name GameState
extends Node
## Persistent game/learning state for English Quest (one node, group "game_state").
## Saves plain data as versioned JSON with an atomic temp-write + .bak (save-systems skill).

signal changed
signal quest_changed(quest_id: String)

const SAVE_VERSION := 1
const DEFAULT_PATH := "user://english_quest_save.json"
const GRADES := [6, 7, 8, 9]
## Tests set this before loading the world so they never touch the player's real save.
static var override_path := ""

@export var save_path := DEFAULT_PATH
@export var load_on_ready := true

var grade := 0                    # 0 = not chosen yet
var quests := {}                  # quest_id -> {"step": String, "done": bool, "rewarded": bool}
var flags := {}                   # world flags, e.g. {"lost_letter_picked": true}
var learning := {}                # "g6_u01" -> {"reading": {"attempts": n, "correct": n, "hints_used": n, "last_reviewed": "..."}}
var stats := {}                   # mirror of PlayerStats fields at save time
var last_error := ""


func _ready() -> void:
	add_to_group("game_state")
	if override_path != "":
		save_path = override_path
	if load_on_ready:
		load_game()


# ------------------------------------------------------------------ quests & learning
func quest(quest_id: String) -> Dictionary:
	if not quests.has(quest_id):
		quests[quest_id] = {"step": "not_started", "done": false, "rewarded": false}
	return quests[quest_id]


func set_quest_step(quest_id: String, step: String) -> void:
	quest(quest_id)["step"] = step
	quest_changed.emit(quest_id)
	changed.emit()


func record_answer(grade_value: int, unit: int, skill: String, correct: bool, used_hint: bool) -> void:
	var key := "g%d_u%02d" % [grade_value, unit]
	if not learning.has(key):
		learning[key] = {}
	if not learning[key].has(skill):
		learning[key][skill] = {"attempts": 0, "correct": 0, "hints_used": 0, "last_reviewed": ""}
	var row: Dictionary = learning[key][skill]
	row["attempts"] = int(row["attempts"]) + 1
	row["correct"] = int(row["correct"]) + (1 if correct else 0)
	row["hints_used"] = int(row["hints_used"]) + (1 if used_hint else 0)
	row["last_reviewed"] = Time.get_datetime_string_from_system()
	changed.emit()


# ------------------------------------------------------------------ save / load
func capture() -> Dictionary:
	return {"version": SAVE_VERSION, "grade": grade, "quests": quests, "flags": flags, "learning": learning, "stats": stats}


func save_game() -> Error:
	var tmp := save_path + ".tmp"
	var f := FileAccess.open(tmp, FileAccess.WRITE)
	if f == null:
		last_error = "Không lưu được tiến độ (mở tệp lỗi %d)" % FileAccess.get_open_error()
		return FileAccess.get_open_error()
	if not f.store_string(JSON.stringify(capture(), "\t")):
		last_error = "Không ghi được tệp lưu"
		return ERR_FILE_CANT_WRITE
	f.close()
	if FileAccess.file_exists(save_path):
		DirAccess.rename_absolute(save_path, save_path + ".bak")
	var err := DirAccess.rename_absolute(tmp, save_path)
	last_error = "" if err == OK else "Không đổi tên được tệp lưu (%d)" % err
	return err


func load_game() -> bool:
	for path in [save_path, save_path + ".bak"]:
		if not FileAccess.file_exists(path):
			continue
		var data = JSON.parse_string(FileAccess.get_file_as_string(path))
		if not (data is Dictionary) or not data.has("version"):
			continue
		var version := int(data["version"])          # JSON numbers load as float
		if version > SAVE_VERSION:
			last_error = "Tệp lưu từ phiên bản game mới hơn (%d)" % version
			return false
		data = _migrate(data, version)
		grade = int(data.get("grade", 0))
		if not GRADES.has(grade):
			grade = 0
		quests = data.get("quests", {})
		flags = data.get("flags", {})
		learning = data.get("learning", {})
		stats = {}
		var saved_stats: Dictionary = data.get("stats", {})
		for key in saved_stats:
			stats[key] = int(saved_stats[key]) if saved_stats[key] is float else saved_stats[key]
		changed.emit()
		return true
	return false


## Migrations run in order v -> v+1. Version 1 is the first schema, nothing to migrate yet.
func _migrate(data: Dictionary, from_version: int) -> Dictionary:
	var v := from_version
	while v < SAVE_VERSION:
		v += 1
		data["version"] = v
	return data


func reset() -> void:
	grade = 0
	quests = {}
	flags = {}
	learning = {}
	stats = {}
	changed.emit()
