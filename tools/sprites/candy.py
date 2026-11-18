# Renders the six Candy Match pieces as 160 px PNGs with a transparent background (bpy 4.2, Cycles on the CPU: no GPU here).
# /workspace/.bpyenv/bin/python tools/sprites/candy.py  ->  assets/ui/candy_0.png … candy_5.png
import bpy, math, os, sys
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'ui')
COLORS = [(0.95, 0.12, 0.15), (1.0, 0.55, 0.05), (1.0, 0.85, 0.1), (0.2, 0.8, 0.25), (0.15, 0.45, 1.0), (0.65, 0.25, 0.95)]

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 48; sc.cycles.use_denoising = False; sc.render.resolution_x = sc.render.resolution_y = 160
    sc.render.film_transparent = True; sc.render.image_settings.color_mode = 'RGBA';
    sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.9, 0.9, 1.0, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.6
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = 2.35; cam.location = (0, -6, 0); cam.rotation_euler = (math.pi / 2, 0, 0)
    for loc, en in [((-3, -4, 4), 900), ((4, -3, 1), 250), ((0, 3, 3), 300)]:
        l = bpy.data.objects.new('l', bpy.data.lights.new('l', 'POINT')); l.data.energy = en; l.location = loc; sc.collection.objects.link(l)

def mat(rgb, rough=0.18, trans=0.0):
    m = bpy.data.materials.new('m'); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = 1.0; b.inputs['Coat Roughness'].default_value = 0.05
    b.inputs['Subsurface Weight'].default_value = 0.25; b.inputs['Subsurface Radius'].default_value = (1, 0.4, 0.3)
    return m

def smooth(o, lvl=2):
    o.modifiers.new('s', 'SUBSURF').levels = lvl; o.modifiers['s'].render_levels = lvl
    for p in o.data.polygons: p.use_smooth = True

def stripes(o, rgb):          # white candy stripes as a second material on alternate faces
    w = mat((1, 1, 1), 0.2); o.data.materials.append(w)
    for p in o.data.polygons:
        if int((math.atan2(p.center.z, p.center.x) + math.pi) / (math.pi / 6)) % 2: p.material_index = 1

def piece(k):
    rgb = COLORS[k]; m = mat(rgb)
    if k == 0:      # wrapped round candy with twisted ends
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.62, segments=32, ring_count=16); o = bpy.context.object; o.scale = (1, 0.7, 0.85); o.data.materials.append(m)
        for sx in (-1, 1):
            bpy.ops.mesh.primitive_cone_add(radius1=0.36, radius2=0.08, depth=0.42, vertices=12); e = bpy.context.object; e.rotation_euler = (0, sx * math.pi / 2, 0); e.location = (sx * 0.72, 0, 0); e.data.materials.append(m); smooth(e, 1)
        smooth(o)
    elif k == 1:    # orange jelly bean
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.62, segments=32, ring_count=16); o = bpy.context.object; o.scale = (1.2, 0.75, 0.8); o.rotation_euler = (0, 0.35, 0); o.data.materials.append(m)
        bend = o.modifiers.new('b', 'SIMPLE_DEFORM'); bend.deform_method = 'BEND'; bend.angle = 0.9; bend.deform_axis = 'Z'; smooth(o)
    elif k == 2:    # yellow star
        bpy.ops.mesh.primitive_circle_add(vertices=10, radius=0.85, fill_type='NGON'); o = bpy.context.object
        for i, v in enumerate(o.data.vertices):
            r = 0.85 if i % 2 == 0 else 0.4; a = math.pi / 2 + i * math.pi / 5; v.co = (r * math.cos(a), r * math.sin(a), 0)
        o.rotation_euler = (math.pi / 2, 0, 0); o.data.materials.append(m)
        s = o.modifiers.new('x', 'SOLIDIFY'); s.thickness = 0.42; s.offset = 0; bv = o.modifiers.new('bv', 'BEVEL'); bv.width = 0.16; bv.segments = 4
        for p in o.data.polygons: p.use_smooth = True
    elif k == 3:    # green square gummy
        bpy.ops.mesh.primitive_cube_add(size=1.15); o = bpy.context.object; o.rotation_euler = (0.25, 0, math.pi / 4); o.data.materials.append(mat(rgb, 0.12)); bv = o.modifiers.new('bv', 'BEVEL'); bv.width = 0.24; bv.segments = 5
        for p in o.data.polygons: p.use_smooth = True
    elif k == 4:    # blue drop
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.6, segments=32, ring_count=16); o = bpy.context.object; o.data.materials.append(m)
        for v in o.data.vertices:
            if v.co.z > 0: t = v.co.z / 0.6; v.co.x *= (1 - t * 0.85); v.co.y *= (1 - t * 0.85); v.co.z *= 1.55
        o.location = (0, 0, -0.18); o.scale = (1.05, 0.8, 1); smooth(o)
    else:           # purple heart
        bpy.ops.mesh.primitive_circle_add(vertices=48, radius=0.8, fill_type='NGON'); o = bpy.context.object
        for i, v in enumerate(o.data.vertices):
            t = i / 48 * 2 * math.pi; x = 16 * math.sin(t) ** 3; y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t); v.co = (x / 19, y / 19 + 0.08, 0)
        o.rotation_euler = (math.pi / 2, 0, 0); o.data.materials.append(m)
        s = o.modifiers.new('x', 'SOLIDIFY'); s.thickness = 0.42; s.offset = 0; bv = o.modifiers.new('bv', 'BEVEL'); bv.width = 0.17; bv.segments = 5
        for p in o.data.polygons: p.use_smooth = True
    return o

os.makedirs(OUT, exist_ok=True)
for k in range(6):
    reset(); piece(k)
    bpy.context.scene.render.filepath = os.path.join(OUT, f'candy_{k}.png'); bpy.ops.render.render(write_still=True)
    print('wrote', k)
