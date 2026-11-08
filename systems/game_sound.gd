class_name GameSound
extends Node
## Sound effects and village music (files made by tools/audio/make_sounds.py, original synthesis).
## Anyone plays a sound with: get_tree().call_group("sound", "play", "correct")
## Buses: SFX and Music are created under Master if the project has none.

const SFX := ["correct", "wrong", "pickup", "coin", "tick", "fanfare"]
const MUSIC := "res://assets/audio/music/village_theme.wav"
const MUSIC_DB := -14.0

var players := {}
var music: AudioStreamPlayer


func _ready() -> void:
	add_to_group("sound")
	_ensure_bus("SFX")
	_ensure_bus("Music")
	for name in SFX:
		var stream := load("res://assets/audio/sfx/%s.wav" % name) as AudioStream
		if stream == null:
			continue
		var p := AudioStreamPlayer.new()
		p.name = name
		p.stream = stream
		p.bus = "SFX"
		p.max_polyphony = 4
		p.volume_db = -4.0
		add_child(p)
		players[name] = p
	var song := load(MUSIC) as AudioStreamWAV
	if song != null:
		song = song.duplicate()
		song.loop_mode = AudioStreamWAV.LOOP_FORWARD
		song.loop_begin = 0
		song.loop_end = int(song.get_length() * song.mix_rate)
		music = AudioStreamPlayer.new()
		music.name = "Music"
		music.stream = song
		music.bus = "Music"
		music.volume_db = MUSIC_DB
		add_child(music)
		music.play()


func _ensure_bus(bus_name: String) -> void:
	if AudioServer.get_bus_index(bus_name) != -1:
		return
	AudioServer.add_bus()
	var idx := AudioServer.bus_count - 1
	AudioServer.set_bus_name(idx, bus_name)
	AudioServer.set_bus_send(idx, "Master")


## Plays a short effect with a slight random pitch so repeats do not tire the ear.
func play(sound: String) -> void:
	var p := players.get(sound) as AudioStreamPlayer
	if p == null:
		return
	p.pitch_scale = randf_range(0.96, 1.04)
	p.play()


func last_played_ok(sound: String) -> bool:
	return players.has(sound)
