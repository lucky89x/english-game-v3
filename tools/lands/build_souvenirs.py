"""(27/11, turn 64) Souvenirs of the nine later lands and the boss trophy, for the child's home (core/rules.js: slot 'home', sold by
the land's merchant). Each stands on the floor on its own little stand, 0.9-1.3 m tall, so it reads in a room.
Run:  OUT=assets/models [PREVIEW=<folder>] /workspace/.bpyenv/bin/python tools/lands/build_souvenirs.py"""
import math
from prim import *

def stand(top=0.5, r=0.26, wood=0x9a6436):
    W = mat('wood', hexc(wood), 0, 0.0, 0.7); cyl(W, r * 0.75, 0.06, (0, 0, 0.03), seg=14); cyl(W, 0.05, top - 0.1, (0, 0, top / 2)); cyl(W, r, 0.05, (0, 0, top - 0.025), seg=16); return top

def cactus():
    reset(); z = stand(); P = mat('pot', hexc(0xd8743a), 0, 0, 0.8); G = mat('green', hexc(0x5aa84a), 0, 0, 0.7); F = mat('flower', hexc(0xff7ac8), 0, 0, 0.6)
    cyl(P, 0.15, 0.2, (0, 0, z + 0.1), r2=0.19, seg=12); ball(G, 0.12, (0, 0, z + 0.42), (1, 1, 2.0)); ball(G, 0.07, (0.15, 0, z + 0.44), (1, 1, 1.6)); ball(G, 0.06, (-0.14, 0, z + 0.36), (1, 1, 1.5)); ball(F, 0.05, (0, 0, z + 0.68), seg=8); ball(F, 0.035, (0.15, 0, z + 0.57), seg=8)
    export('home_sv_cactus_v01')

def globe():
    reset(); z = stand(); B = mat('base', hexc(0x4a6aa8), 0, 0.2, 0.5); Gl = mat('glass', hexc(0xcfeaff), 0.3, 0.1, 0.1); W = mat('white', hexc(0xffffff), 0, 0, 0.8); T = mat('tree', hexc(0x3f8a4a), 0, 0, 0.7)
    cyl(B, 0.2, 0.1, (0, 0, z + 0.05), r2=0.16, seg=14); ball(W, 0.14, (0, 0, z + 0.12), (1, 1, 0.3)); cyl(T, 0.09, 0.2, (0, 0, z + 0.24), r2=0.0, seg=8); ball(W, 0.05, (0.08, 0.03, z + 0.17), seg=8); ball(W, 0.035, (0.08, 0.03, z + 0.24), seg=8)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, segments=16, ring_count=10, location=(0, 0, z + 0.26)); o = bpy.context.object; o.data.materials.append(Gl); bpy.ops.object.shade_smooth(); Gl.blend_method = 'BLEND'; Gl.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.35
    export('home_sv_snowglobe_v01')

def vase():
    reset(); z = stand(); C = mat('clay', hexc(0xc98a52), 0, 0, 0.8); D = mat('band', hexc(0x3a5a8a), 0, 0, 0.7)
    cyl(C, 0.1, 0.12, (0, 0, z + 0.06), r2=0.2, seg=14); cyl(C, 0.2, 0.22, (0, 0, z + 0.23), r2=0.17, seg=14); cyl(C, 0.17, 0.14, (0, 0, z + 0.41), r2=0.07, seg=14); cyl(C, 0.07, 0.1, (0, 0, z + 0.53), r2=0.1, seg=14)
    ring(D, 0.2, 0.02, (0, 0, z + 0.14)); ring(D, 0.175, 0.02, (0, 0, z + 0.33))
    for sx in (-1, 1): ring(C, 0.07, 0.018, (sx * 0.17, 0, z + 0.42), (math.radians(90), 0, 0))
    export('home_sv_vase_v01')

def cloudlamp():
    reset(); z = stand(0.9, 0.2); C = mat('cloud', hexc(0xffffff), 1.2, 0, 0.9); Y = mat('star', hexc(0xffe27a), 4.0, 0, 0.4)
    for x, y, zz, r in ((0, 0, 0.16, 0.2), (0.2, 0, 0.12, 0.15), (-0.2, 0, 0.12, 0.16), (0.08, 0.05, 0.27, 0.14), (-0.1, -0.04, 0.26, 0.13)): ball(C, r, (x, y, z + zz), seg=12)
    for sx in (-0.18, 0.0, 0.18): cyl(mat('thread', hexc(0xdddddd)), 0.006, 0.2, (sx, 0, z - 0.12)); ball(Y, 0.04, (sx, 0, z - 0.24), seg=8)
    export('home_sv_cloudlamp_v01')

def mushroom():
    reset(); z = stand(0.3, 0.3); S = mat('stem', hexc(0xfff2d8), 0.6, 0, 0.8); R = mat('cap', hexc(0xe2483e), 0.4, 0, 0.6); W = mat('dot', hexc(0xffffff), 1.5, 0, 0.6)
    cyl(S, 0.11, 0.42, (0, 0, z + 0.21), r2=0.08, seg=12); ball(R, 0.3, (0, 0, z + 0.44), (1, 1, 0.6), seg=16)
    for a in range(6): ang = a / 6 * math.tau; ball(W, 0.045, (math.cos(ang) * 0.2, math.sin(ang) * 0.2, z + 0.54), (1, 1, 0.5), seg=8)
    ball(W, 0.05, (0, 0, z + 0.62), (1, 1, 0.5), seg=8); cyl(S, 0.07, 0.2, (0.24, 0.05, z + 0.1), r2=0.05, seg=10); ball(R, 0.14, (0.24, 0.05, z + 0.2), (1, 1, 0.6), seg=12)
    export('home_sv_mushroom_v01')

def lavalamp():
    reset(); z = stand(); M = mat('metal', hexc(0x8a8f98), 0, 0.8, 0.3); L = mat('lava', hexc(0xff5a1a), 3.0, 0, 0.3); Gl = mat('glassL', hexc(0xffc890), 0.6, 0, 0.1)
    cyl(M, 0.15, 0.14, (0, 0, z + 0.07), r2=0.1, seg=14); cyl(Gl, 0.1, 0.5, (0, 0, z + 0.39), r2=0.06, seg=14); cyl(M, 0.06, 0.08, (0, 0, z + 0.68), r2=0.04, seg=14)
    Gl.blend_method = 'BLEND'; Gl.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.4
    for zz, r in ((0.22, 0.07), (0.36, 0.05), (0.48, 0.04), (0.57, 0.03)): ball(L, r, (0, 0, z + zz), (1, 1, 1.3), seg=10)
    export('home_sv_lavalamp_v01')

def crystal():
    reset(); z = stand(0.4, 0.3); R = mat('rock', hexc(0x5a5670), 0, 0, 0.9); ball(R, 0.24, (0, 0, z + 0.04), (1, 1, 0.35), seg=10)
    for x, y, h, r, col, tx, ty in ((0, 0, 0.6, 0.09, 0xb48cff, 0, 0), (0.14, 0.04, 0.4, 0.07, 0x6ad8ff, 0, 0.35), (-0.13, 0.02, 0.44, 0.07, 0xff8ad8, 0, -0.3), (0.02, -0.14, 0.32, 0.06, 0x8affc8, 0.35, 0), (-0.04, 0.14, 0.3, 0.055, 0x6ad8ff, -0.35, 0.1)):
        m = mat('gem%x' % col, hexc(col), 2.0, 0, 0.15); bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=r, radius2=r * 0.6, depth=h * 0.75, location=(x, y, z + 0.06 + h * 0.375), rotation=(tx, ty, 0)); o = bpy.context.object; o.data.materials.append(m)
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=r * 0.6, radius2=0, depth=h * 0.25, location=(x + math.sin(ty) * h * 0.5, y - math.sin(tx) * h * 0.5, z + 0.06 + h * 0.875 * math.cos(max(abs(tx), abs(ty)))), rotation=(tx, ty, 0)); o = bpy.context.object; o.data.materials.append(m)
    export('home_sv_crystal_v01')

def toyrobot():
    reset(); z = stand(); B = mat('body', hexc(0x6ad0ff), 0, 0.3, 0.4); D = mat('dark', hexc(0x2a3038), 0, 0.5, 0.5); E = mat('eye', hexc(0xffe27a), 4.0, 0, 0.3); R = mat('red', hexc(0xff5a5a), 0, 0.2, 0.5)
    for sx in (-1, 1): box(D, (0.08, 0.1, 0.12), (sx * 0.08, 0, z + 0.06), bevel=0.015); box(B, (0.06, 0.07, 0.2), (sx * 0.2, 0, z + 0.28), bevel=0.015); ball(E, 0.03, (sx * 0.055, -0.1, z + 0.52), seg=8)
    box(B, (0.28, 0.2, 0.24), (0, 0, z + 0.26), bevel=0.03); box(R, (0.1, 0.02, 0.08), (0, -0.105, z + 0.27), bevel=0.01); box(B, (0.22, 0.18, 0.16), (0, 0, z + 0.5), bevel=0.03); box(D, (0.18, 0.02, 0.07), (0, -0.09, z + 0.52), bevel=0.01)
    cyl(D, 0.01, 0.1, (0, 0, z + 0.63)); ball(R, 0.03, (0, 0, z + 0.7), seg=8); cyl(D, 0.03, 0.03, (0, 0.12, z + 0.3), (math.radians(90), 0, 0)); box(D, (0.02, 0.02, 0.1), (0, 0.15, z + 0.3), bevel=0)
    export('home_sv_toyrobot_v01')

def nightlight():
    reset(); z = stand(0.5, 0.22); Y = mat('star', hexc(0xffe27a), 3.5, 0, 0.4); M = mat('moon', hexc(0xfff6d0), 2.0, 0, 0.5); B = mat('base', hexc(0x8a7ad0), 0, 0.1, 0.6)
    cyl(B, 0.15, 0.06, (0, 0, z + 0.03), seg=14); cyl(B, 0.02, 0.2, (0, 0, z + 0.16))
    for a in range(5): ang = a / 5 * math.tau; bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.085, radius2=0, depth=0.2, location=(math.sin(ang) * 0.14, 0, z + 0.44 + math.cos(ang) * 0.14), rotation=(0, ang, 0)); o = bpy.context.object; o.scale = (1, 0.45, 1); o.data.materials.append(Y)
    ball(Y, 0.11, (0, 0, z + 0.44), (1, 0.5, 1), seg=10); ring(M, 0.09, 0.022, (0.2, 0, z + 0.2), (math.radians(90), 0, 0))
    export('home_sv_nightlight_v01')

def trophy():
    reset(); G = mat('gold', hexc(0xffcf3a), 0.4, 0.9, 0.25); W = mat('plinth', hexc(0x6a4a2a), 0, 0, 0.7); S = mat('gem', hexc(0x6ad8ff), 3.0, 0, 0.2)
    box(W, (0.34, 0.34, 0.7), (0, 0, 0.35), bevel=0.03); box(G, (0.2, 0.02, 0.1), (0, -0.175, 0.5), bevel=0.01); cyl(G, 0.11, 0.05, (0, 0, 0.725), seg=14); cyl(G, 0.03, 0.14, (0, 0, 0.82)); cyl(G, 0.07, 0.2, (0, 0, 0.99), r2=0.15, seg=14)
    for sx in (-1, 1): ring(G, 0.06, 0.014, (sx * 0.17, 0, 1.0), (math.radians(90), 0, 0))
    ball(S, 0.05, (0, 0, 1.13), (1, 1, 1.3), seg=8)
    export('home_trophy_v01')

for f in (cactus, globe, vase, cloudlamp, mushroom, lavalamp, crystal, toyrobot, nightlight, trophy): f()
print('ok')
