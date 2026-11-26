"""(26/11, turn 63) The robots of the Future City (Map 11), drawn with Blender primitives: four monsters and the boss.
Run:  OUT=assets/models [PREVIEW=<folder>] /workspace/.bpyenv/bin/python tools/lands/build_robots.py
Each model stands on y = 0, faces +Z in the game (-Y in Blender), has flat-colour materials (the eyes and lights glow) and no
skeleton: the game makes clip-less monsters hop (game/combat.js). Sizes are the real sizes in metres (`fit: 1` in rules.js)."""
import math
from prim import *

def colours(body, trim, eye):
    return mat('body', hexc(body)), mat('trim', hexc(trim), 0, 0.6, 0.35), mat('dark', hexc(0x2a3038), 0, 0.5, 0.5), mat('eye', hexc(eye), 4.0, 0, 0.3)

def drone():
    reset(); B, T, D, E = colours(0xf2f4f8, 0xffd24a, 0x6ad8ff)
    ball(B, 0.34, (0, 0, 0.36), (1, 1, 0.72)); ball(D, 0.2, (0, -0.2, 0.34), (1, 0.6, 1)); ball(E, 0.12, (0, -0.3, 0.34))
    ring(T, 0.36, 0.035, (0, 0, 0.36))
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(D, 0.03, 0.42, (sx * 0.36, sy * 0.3, 0.46), (math.radians(90), 0, math.atan2(sx * 0.36, -sy * 0.3)))
            cyl(T, 0.045, 0.1, (sx * 0.52, sy * 0.44, 0.5)); cyl(E, 0.2, 0.012, (sx * 0.52, sy * 0.44, 0.57), seg=16)
    cyl(D, 0.015, 0.22, (0, 0.05, 0.7)); ball(E, 0.04, (0, 0.05, 0.82), seg=8)
    for sx in (-1, 1): cyl(D, 0.025, 0.18, (sx * 0.16, 0, 0.09)); 
    cyl(D, 0.02, 0.4, (0, 0, 0.02), (0, math.radians(90), 0))
    export('mob_robot_drone_v01')

def wheel():
    reset(); B, T, D, E = colours(0x6ad0ff, 0xffffff, 0xffe27a)
    ring(D, 0.34, 0.11, (0, 0, 0.45), (0, math.radians(90), 0)); cyl(T, 0.24, 0.12, (0, 0, 0.45), (0, math.radians(90), 0), seg=16)
    for a in range(5): ang = a / 5 * math.tau; box(D, (0.14, 0.05, 0.05), (0, math.sin(ang) * 0.14, 0.45 + math.cos(ang) * 0.14), (ang, 0, 0), 0)
    for sx in (-1, 1): box(B, (0.07, 0.12, 0.52), (sx * 0.2, 0, 0.72), bevel=0.02)
    box(B, (0.5, 0.36, 0.2), (0, 0, 1.0), bevel=0.06); ball(B, 0.27, (0, 0, 1.16), (1, 1, 0.9)); box(D, (0.36, 0.06, 0.14), (0, -0.23, 1.17), bevel=0.03)
    for sx in (-1, 1): ball(E, 0.055, (sx * 0.09, -0.265, 1.17), seg=8)
    cyl(D, 0.015, 0.2, (0.1, 0, 1.46)); ball(E, 0.04, (0.1, 0, 1.57), seg=8)
    export('mob_robot_wheel_v01')

def boxbot():
    reset(); B, T, D, E = colours(0xffa040, 0xfff2d0, 0x8affc8)
    for sx in (-1, 1): box(D, (0.2, 0.3, 0.14), (sx * 0.2, -0.03, 0.07), bevel=0.03); cyl(D, 0.06, 0.26, (sx * 0.2, 0, 0.26))
    box(B, (0.72, 0.5, 0.56), (0, 0, 0.66), bevel=0.07); box(T, (0.4, 0.04, 0.24), (0, -0.25, 0.7), bevel=0.02); box(E, (0.1, 0.03, 0.05), (-0.1, -0.275, 0.74), bevel=0); box(E, (0.1, 0.03, 0.05), (0.1, -0.275, 0.66), bevel=0)
    cyl(D, 0.08, 0.1, (0, 0, 0.98)); box(B, (0.5, 0.42, 0.36), (0, 0, 1.2), bevel=0.06); box(D, (0.4, 0.05, 0.16), (0, -0.2, 1.22), bevel=0.02)
    for sx in (-1, 1):
        ball(E, 0.06, (sx * 0.1, -0.225, 1.22), seg=8); cyl(D, 0.05, 0.12, (sx * 0.42, 0, 0.8), (0, math.radians(90), 0)); box(B, (0.14, 0.16, 0.42), (sx * 0.52, 0, 0.64), bevel=0.04); ball(D, 0.09, (sx * 0.52, 0, 0.4), seg=8)
    cyl(D, 0.015, 0.2, (0, 0, 1.48)); ball(E, 0.045, (0, 0, 1.6), seg=8)
    export('mob_robot_box_v01')

def guard():
    reset(); B, T, D, E = colours(0x8a98aa, 0x4a6aa8, 0xff5050)
    for sx in (-1, 1): box(D, (0.26, 0.4, 0.16), (sx * 0.24, -0.04, 0.08), bevel=0.04); box(B, (0.2, 0.22, 0.6), (sx * 0.24, 0, 0.46), bevel=0.05); ball(D, 0.12, (sx * 0.24, 0, 0.8), seg=10)
    box(T, (0.62, 0.36, 0.26), (0, 0, 0.92), bevel=0.06); cyl(B, 0.3, 0.7, (0, 0, 1.38), r2=0.5, seg=10); box(E, (0.16, 0.04, 0.16), (0, -0.4, 1.5), bevel=0.02)
    for sx in (-1, 1): ball(T, 0.22, (sx * 0.56, 0, 1.66), (1.1, 1, 0.8), seg=12); box(B, (0.18, 0.2, 0.62), (sx * 0.62, 0, 1.24), bevel=0.05); ball(D, 0.13, (sx * 0.62, 0, 0.88), seg=10)
    cyl(D, 0.1, 0.1, (0, 0, 1.78)); ball(B, 0.24, (0, 0, 1.98), (1, 1, 0.95)); box(E, (0.34, 0.06, 0.07), (0, -0.21, 2.0), bevel=0.02); box(T, (0.06, 0.3, 0.2), (0, 0.02, 2.2), bevel=0.02)
    box(T, (0.08, 0.6, 0.86), (-0.76, -0.2, 1.14), bevel=0.03); box(E, (0.02, 0.2, 0.3), (-0.81, -0.2, 1.16), bevel=0)      # a shield on the left arm
    export('mob_robot_guard_v01')

def warden():
    reset(); B, T, D, E = colours(0x5a6676, 0xd8b44a, 0x6ad8ff)
    for sx in (-1, 1): box(D, (0.6, 0.86, 0.34), (sx * 0.5, -0.06, 0.17), bevel=0.08); box(B, (0.44, 0.5, 1.0), (sx * 0.5, 0, 0.84), bevel=0.09); ball(T, 0.26, (sx * 0.5, 0, 1.4), seg=12)
    box(T, (1.3, 0.7, 0.44), (0, 0, 1.56), bevel=0.1); cyl(B, 0.62, 1.3, (0, 0, 2.4), r2=1.02, seg=12); ball(E, 0.26, (0, -0.74, 2.5), (1, 0.5, 1)); ring(T, 0.32, 0.06, (0, -0.8, 2.5), (math.radians(90), 0, 0))
    for sx in (-1, 1):
        ball(T, 0.46, (sx * 1.14, 0, 2.94), (1.15, 1, 0.8), seg=14); box(B, (0.36, 0.4, 1.0), (sx * 1.26, 0, 2.2), bevel=0.09); ball(D, 0.24, (sx * 1.26, 0, 1.62), seg=10); box(B, (0.46, 0.5, 0.8), (sx * 1.3, -0.06, 1.14), bevel=0.1); box(D, (0.56, 0.6, 0.44), (sx * 1.3, -0.08, 0.6), bevel=0.12)
        box(E, (0.1, 0.04, 0.5), (sx * 0.4, -0.86, 2.0), bevel=0)
    cyl(D, 0.22, 0.16, (0, 0, 3.12)); box(B, (0.72, 0.64, 0.56), (0, 0, 3.46), bevel=0.12); box(E, (0.56, 0.06, 0.12), (0, -0.32, 3.5), bevel=0.02)
    for sx in (-1, 1): box(T, (0.1, 0.3, 0.5), (sx * 0.4, 0.05, 3.8), (0, sx * 0.25, 0), 0.03)
    cyl(T, 0.05, 0.4, (0, 0.1, 3.9)); ball(E, 0.09, (0, 0.1, 4.14), seg=8)
    export('boss_iron_warden_v01')

for f in (drone, wheel, boxbot, guard, warden): f()
print('ok')
