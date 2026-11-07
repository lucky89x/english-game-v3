class_name VillageLayout
extends RefCounted
## Single source of truth for the starter-village map layout (chibi05 expansion).
## Roads feed the paved cobbles, the terrain shader's dirt verges and the vegetation
## exclusion; buildings feed placement and exclusion. Units: metres, Godot X/Z.

const TERRAIN_SIZE := 240.0
const PLAY_RADIUS := 110.0

## Each road: [width (m), polyline points (x, z)].
const ROADS := [
	[3.8, [Vector2(0, 19), Vector2(-0.5, 13), Vector2(0.4, 7), Vector2(-0.2, 1), Vector2(0.5, -6), Vector2(-1, -14), Vector2(-1.5, -18.5)]],
	[2.6, [Vector2(0, 5), Vector2(3, 5.5), Vector2(5.3, 7)]],
	[2.6, [Vector2(15.8, 7), Vector2(18, 8), Vector2(18, 12)]],
	[3.0, [Vector2(0, 11), Vector2(-10, 14), Vector2(-21, 17)]],
	[2.8, [Vector2(0, -7), Vector2(-10, -12), Vector2(-23, -20)]],
	# south meadow road
	[3.2, [Vector2(0, 19), Vector2(1.5, 30), Vector2(-1, 42), Vector2(-4, 56), Vector2(-3, 72), Vector2(-6, 88)]],
	# west hamlet road and its two lanes
	[3.0, [Vector2(-21, 17), Vector2(-33, 16), Vector2(-45, 12), Vector2(-58, 10), Vector2(-72, 14), Vector2(-86, 12)]],
	[2.4, [Vector2(-45, 12), Vector2(-48, 0), Vector2(-52, -12)]],
	[2.4, [Vector2(-58, 10), Vector2(-62, 24), Vector2(-60, 36)]],
	# north-west road to the gate of Rung Ky Uc (chapter II hook)
	[2.8, [Vector2(-23, -20), Vector2(-30, -32), Vector2(-29, -46), Vector2(-26, -60), Vector2(-24, -74)]],
	# east orchard road (starts at the existing bridge) and its lane
	[3.0, [Vector2(18, 12), Vector2(26, 16), Vector2(36, 14), Vector2(48, 8), Vector2(60, 12), Vector2(74, 10)]],
	[2.4, [Vector2(36, 14), Vector2(40, 28), Vector2(38, 42)]],
]

## Extra houses outside the core village: [model, position (x, z), scale]. They face the
## nearest road automatically.
const HAMLET := [
	["cottage_red", Vector2(-34, 7), 1.35],
	["house_blue", Vector2(-41, 23), 1.35],
	["store_slate", Vector2(-38, -2), 1.35],
	["cottage_red", Vector2(-58, -2), 1.35],
	["shop_orange", Vector2(-52, 20), 1.30],
	["library_green", Vector2(-68, 3), 1.30],
	["barn_red", Vector2(-70, 28), 1.35],
	["cottage_red", Vector2(46, -1), 1.35],
	["house_blue", Vector2(54, 22), 1.35],
	["barn_red", Vector2(28, 27), 1.35],
	["cottage_red", Vector2(49, 34), 1.35],
	["cottage_red", Vector2(-12, 42), 1.35],
	["house_blue", Vector2(-16, 60), 1.35],
	["store_slate", Vector2(-18, 80), 1.35],
]

## Footprints of the core-village buildings (centre x, z, radius) for vegetation exclusion.
const CORE_FOOTPRINTS := [
	Vector3(-12, -6, 6.5), Vector3(12, -6, 7.0), Vector3(-14, 7, 5.5), Vector3(-1, -24.5, 9.0),
	Vector3(12, -24, 7.0), Vector3(-11.5, -24, 4.5), Vector3(-27, 6, 6.5), Vector3(20, 1, 5.0),
]


static func river_x(z: float) -> float:
	return 10.5 + sin((z - 7.0) * 0.085) * 3.0


static func in_river(x: float, z: float, margin := 4.4) -> bool:
	return z > 1.0 and absf(x - river_x(z)) < margin


static func _segment_distance(p: Vector2, a: Vector2, b: Vector2) -> float:
	var ab := b - a
	var t := clampf((p - a).dot(ab) / maxf(ab.length_squared(), 0.0001), 0.0, 1.0)
	return p.distance_to(a + ab * t)


## Distance from a point to the nearest road edge (negative = on the road).
static func road_distance(x: float, z: float) -> float:
	var p := Vector2(x, z)
	var best := 1e9
	for road in ROADS:
		var pts: Array = road[1]
		for i in range(pts.size() - 1):
			best = minf(best, _segment_distance(p, pts[i], pts[i + 1]) - float(road[0]) * 0.5)
	return best


static func nearest_road_point(x: float, z: float) -> Vector2:
	var p := Vector2(x, z)
	var best := 1e9
	var best_point := p
	for road in ROADS:
		var pts: Array = road[1]
		for i in range(pts.size() - 1):
			var a: Vector2 = pts[i]
			var ab: Vector2 = pts[i + 1] - a
			var t := clampf((p - a).dot(ab) / maxf(ab.length_squared(), 0.0001), 0.0, 1.0)
			var q := a + ab * t
			if p.distance_to(q) < best:
				best = p.distance_to(q)
				best_point = q
	return best_point


static func near_building(x: float, z: float, margin := 0.0) -> bool:
	for f in CORE_FOOTPRINTS:
		if Vector2(x, z).distance_to(Vector2(f.x, f.y)) < f.z + margin:
			return true
	for h in HAMLET:
		if Vector2(x, z).distance_to(h[1]) < 6.5 * float(h[2]) + margin:
			return true
	return false


## Road segments packed for the terrain shader: (ax, az, bx, bz) + half width.
static func shader_segments() -> Array:
	var segments: Array[Vector4] = []
	var widths: Array[float] = []
	for road in ROADS:
		var pts: Array = road[1]
		for i in range(pts.size() - 1):
			segments.append(Vector4(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y))
			widths.append(float(road[0]) * 0.5)
	return [segments, widths]
