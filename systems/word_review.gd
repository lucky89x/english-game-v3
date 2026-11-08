class_name WordReview
extends RefCounted
## Spaced review of words (Leitner boxes) stored in GameState.words.
## Box 0 = just missed (due again today) ... box 5 = well known (due in 15 days). A right answer
## moves a word up one box, a wrong one sends it back to box 0. Words come only from the profile's
## own grade and LOWER grades (review is labelled, it never stands in for missing content).

const INTERVAL_DAYS := [0, 1, 2, 4, 7, 15]
const MAX_BOX := 5


static func today() -> int:
	return int(Time.get_unix_time_from_system() / 86400.0)


static func word_id(grade: int, unit: int, word: String) -> String:
	return "g%d_u%02d:%s" % [grade, unit, word.strip_edges().to_lower()]


static func parse_id(id: String) -> Dictionary:
	var head := id.get_slice(":", 0)
	return {"grade": int(head.substr(1, 1)), "unit": int(head.get_slice("_u", 1)), "word": id.get_slice(":", 1)}


## One card: {id, word, vi, grade, unit}.
static func card(grade: int, unit: int, entry: Dictionary) -> Dictionary:
	return {"id": word_id(grade, unit, entry["word"]), "word": String(entry["word"]), "vi": String(entry["vi"]),
		"grade": grade, "unit": unit}


static func cards_of(grade: int, unit: int) -> Array:
	var result := []
	for entry in LearningCatalog.vocabulary(grade, unit):
		result.append(card(grade, unit, entry))
	return result


static func record(state: GameState, card_data: Dictionary, correct: bool, day := -1) -> Dictionary:
	var now := today() if day < 0 else day
	var id := String(card_data["id"])
	var row: Dictionary = state.words.get(id, {"box": 0, "due": now, "seen": 0, "right": 0, "wrong": 0})
	row["seen"] = int(row["seen"]) + 1
	if correct:
		row["right"] = int(row["right"]) + 1
		row["box"] = mini(int(row["box"]) + 1, MAX_BOX)
	else:
		row["wrong"] = int(row["wrong"]) + 1
		row["box"] = 0
	row["due"] = now + INTERVAL_DAYS[int(row["box"])]
	state.words[id] = row
	return row


## Words of this grade or lower grades that are due for review, weakest first.
static func due_cards(state: GameState, grade: int, day := -1) -> Array:
	var now := today() if day < 0 else day
	var due := []
	for id in state.words:
		var row: Dictionary = state.words[id]
		var info := parse_id(id)
		if int(info["grade"]) > grade or int(row["due"]) > now:
			continue
		for entry in LearningCatalog.vocabulary(int(info["grade"]), int(info["unit"])):
			if String(entry["word"]).to_lower() == String(info["word"]):
				var c := card(int(info["grade"]), int(info["unit"]), entry)
				c["box"] = int(row["box"])
				due.append(c)
				break
	due.sort_custom(func(a, b): return int(a["box"]) < int(b["box"]))
	return due


## A round of `count` cards: mostly the current unit, about 30% due review words (lower grades
## included). A brand-new card is one the profile has never seen.
static func pick_round(state: GameState, grade: int, unit: int, count: int, rng: RandomNumberGenerator, day := -1) -> Array:
	var chosen := []
	var used := {}
	var review_slots := int(round(count * 0.3))
	for c in due_cards(state, grade, day):
		if chosen.size() >= review_slots:
			break
		c["review"] = true
		chosen.append(c)
		used[c["id"]] = true
	var current := cards_of(grade, unit)
	_shuffle(current, rng)
	# never-seen words first, then the rest of the unit
	current.sort_custom(func(a, b): return int(not state.words.has(a["id"])) > int(not state.words.has(b["id"])))
	for c in current:
		if chosen.size() >= count:
			break
		if not used.has(c["id"]):
			c["review"] = false
			chosen.append(c)
			used[c["id"]] = true
	_shuffle(chosen, rng)
	return chosen


## First market day = a hidden placement check: for grades 7-9 most customers ask for words of
## the lower grades (spread over their units), the rest come from the current unit.
static func pick_placement(grade: int, unit: int, count: int, rng: RandomNumberGenerator) -> Array:
	var lower := []
	for g in range(6, grade):
		for u in range(1, 13):
			var cards := cards_of(g, u)
			if not cards.is_empty():
				lower.append(cards[rng.randi_range(0, cards.size() - 1)])
	_shuffle(lower, rng)
	var lower_slots := 0 if lower.is_empty() else int(round(count * 0.6))
	var chosen := lower.slice(0, lower_slots)
	for c in chosen:
		c["review"] = true
	var current := cards_of(grade, unit)
	_shuffle(current, rng)
	for c in current:
		if chosen.size() >= count:
			break
		c["review"] = false
		chosen.append(c)
	_shuffle(chosen, rng)
	return chosen


## `count` wrong options (Vietnamese meanings) from the same unit, then the same grade.
static func distractors(target: Dictionary, count: int, rng: RandomNumberGenerator) -> Array:
	var pool := cards_of(int(target["grade"]), int(target["unit"]))
	_shuffle(pool, rng)
	var result := []
	var seen := {String(target["vi"]).to_lower(): true}
	for source in [pool, _grade_pool(int(target["grade"]), rng)]:
		for c in source:
			if result.size() >= count:
				return result
			var vi := String(c["vi"]).to_lower()
			if seen.has(vi) or c["id"] == target["id"]:
				continue
			seen[vi] = true
			result.append(c)
	return result


## Words the profile has answered right at least once (shown as "Từ đã học").
static func learned_count(state: GameState) -> int:
	var n := 0
	for id in state.words:
		if int(state.words[id]["right"]) > 0:
			n += 1
	return n


static func _grade_pool(grade: int, rng: RandomNumberGenerator) -> Array:
	var pool := []
	for u in range(1, 13):
		pool.append_array(cards_of(grade, u))
	_shuffle(pool, rng)
	return pool


static func _shuffle(items: Array, rng: RandomNumberGenerator) -> void:
	for i in range(items.size() - 1, 0, -1):
		var j := rng.randi_range(0, i)
		var tmp = items[i]
		items[i] = items[j]
		items[j] = tmp
