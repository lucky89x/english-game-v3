extends SceneTree
## Learning data checks: 48 Unit ids, content files match their grade/unit, vocabulary entries are
## clean (no empty or duplicate words) and a grade without data stays empty (no cross-grade fallback).
## Run: godot --headless --path . --script res://tests/learning_data_test.gd
var failed := false


func check(ok: bool, message: String) -> void:
	print("PASS: " if ok else "FAIL: ", message)
	failed = failed or not ok


var missing_files := 0


func check_content_has_file(u: Dictionary, content: Dictionary) -> void:
	if content.is_empty() or content.get("id", "") != u["id"]:
		missing_files += 1


func _initialize() -> void:
	var units := LearningCatalog.units()
	check(units.size() == 48, "48 units in the catalog")
	var ids := {}
	for u in units:
		ids[u["id"]] = true
	check(ids.size() == 48, "Unit ids are unique")
	for grade in [6, 7, 8, 9]:
		check(LearningCatalog.units_for_grade(grade).size() == 12, "Grade %d has 12 units" % grade)

	var with_vocab := 0
	var total_words := 0
	var bad := []
	for u in units:
		var grade := int(u["grade"])
		var unit := int(u["unit"])
		var words := LearningCatalog.vocabulary(grade, unit)
		if String(u.get("content_file", "")) == "":
			if not words.is_empty():
				bad.append("%s has words but no content_file" % u["id"])
			continue
		var content := LearningCatalog.unit_content(grade, unit)
		if content.get("id", "") != u["id"] or int(content.get("grade", 0)) != grade or int(content.get("unit", 0)) != unit:
			bad.append("%s content id/grade/unit mismatch" % u["id"])
		var seen := {}
		for w in words:
			var word := String(w.get("word", "")).strip_edges()
			var vi := String(w.get("vi", "")).strip_edges()
			if word == "" or vi == "":
				bad.append("%s empty word or meaning" % u["id"])
			if seen.has(word.to_lower()):
				bad.append("%s duplicate word %s" % [u["id"], word])
			seen[word.to_lower()] = true
		if int(u.get("vocab_count", words.size())) != words.size():
			bad.append("%s vocab_count differs from the list" % u["id"])
		if not words.is_empty():
			with_vocab += 1
			total_words += words.size()
	for message in bad:
		print("  ", message)
	check(bad.is_empty(), "Every content file is consistent (no empty, duplicate or mismatched entries)")
	check(with_vocab == 24, "Grades 6 and 8 have vocabulary for all 24 units (got %d)" % with_vocab)
	check(total_words > 800, "More than 800 words loaded (got %d)" % total_words)

	var outline := 0
	var playable := 0
	for u in units:
		var content := LearningCatalog.unit_content(int(u["grade"]), int(u["unit"]))
		check_content_has_file(u, content)
		if u.get("status", "") == "outline":
			outline += 1
			if not content.get("vocabulary", []).is_empty() or not content.get("activities", {}).is_empty():
				bad.append("%s is an outline but holds words or activities" % u["id"])
		elif u.get("status", "") == "playable":
			playable += 1
	check(missing_files == 0, "All 48 units have a content file (skeleton at least)")
	check(outline == 24 and playable == 2, "24 outlines (grades 7 and 9) and 2 playable units (got %d / %d)" % [outline, playable])
	check(bad.is_empty(), "Outlines hold no invented words or activities")
	check(LearningCatalog.vocabulary(7, 1).is_empty() and LearningCatalog.vocabulary(9, 1).is_empty(),
		"Grades 7 and 9 stay empty (no substitution from other grades)")
	var words_8: Array = LearningCatalog.vocabulary(8, 1)
	var found := words_8.any(func(w): return w["word"] == "origami")
	check(found, "Grade 8 unit 1 contains origami")
	check(not LearningCatalog.vocabulary(6, 1).any(func(w): return w["word"] == "origami"), "Grade 6 unit 1 does not contain grade 8 words")
	check(not LearningCatalog.activity(6, 1, "lost_letter").is_empty() and not LearningCatalog.activity(8, 1, "lost_letter").is_empty(),
		"Lost letter activities still present after the import")

	print("LEARNING DATA TEST PASSED" if not failed else "LEARNING DATA TEST FAILED")
	quit(1 if failed else 0)
