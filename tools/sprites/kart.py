# Renders the Kart Race sprites seen from above (bpy 4.2, Cycles on the CPU): four karts, a rock, a traffic cone,
# a gold coin, a mud puddle and a round tree.  /workspace/.bpyenv/bin/python tools/sprites/kart.py -> assets/ui/race_*.png
import bpy, math, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'ui')

def reset(w, h, scale):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 40; sc.cycles.use_denoising = False
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.film_transparent = True; sc.render.image_settings.color_mode = 'RGBA'; sc.view_settings.view_transform = 'Standard'
    wd = bpy.data.worlds.new('w'); sc.world = wd; wd.use_nodes = True; wd.node_tree.nodes['Background'].inputs[0].default_value = (0.85, 0.9, 1, 1); wd.node_tree.nodes['Background'].inputs[1].default_value = 0.45
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = scale; cam.location = (0, -1.2, 10); cam.rotation_euler = (math.radians(7), 0, 0)
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 2.4; sun.rotation_euler = (math.radians(35), math.radians(-25), 0); sc.collection.objects.link(sun)

def mat(rgb, rough=0.35, metal=0.0):
    m = bpy.data.materials.new('m'); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m

def box(size, loc, m, bevel=0.08, segs=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object; o.scale = size; o.data.materials.append(m)
    bpy.ops.object.transform_apply(scale=True); bv = o.modifiers.new('b', 'BEVEL'); bv.width = bevel; bv.segments = segs
    for p in o.data.polygons: p.use_smooth = True
    return o

def cyl(r, d, loc, rot, m, v=24):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, location=loc, rotation=rot, vertices=v); o = bpy.context.object; o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    return o

def sphere(r, loc, m, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=24, ring_count=12); o = bpy.context.object; o.scale = scale; o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    return o

def render(name):
    bpy.context.scene.render.filepath = os.path.join(OUT, name); bpy.ops.render.render(write_still=True); print('wrote', name)

KARTS = {'red': (0.92, 0.12, 0.1), 'blue': (0.1, 0.35, 0.95), 'green': (0.1, 0.7, 0.25), 'purple': (0.55, 0.2, 0.85)}
for name, col in KARTS.items():       # nose points up the image (+y)
    reset(96, 144, 3.2)
    body, dark, tyre, white, metal = mat(col, 0.25), mat((0.08, 0.08, 0.1), 0.5), mat((0.05, 0.05, 0.06), 0.8), mat((0.95, 0.95, 0.95), 0.3), mat((0.75, 0.75, 0.8), 0.25, 0.8)
    box((0.9, 2.0, 0.35), (0, 0, 0.35), body, 0.15)                      # tub
    box((0.55, 0.7, 0.25), (0, 1.05, 0.33), body, 0.12)                   # nose
    box((1.25, 0.28, 0.12), (0, 1.38, 0.28), dark, 0.05)                  # front bumper
    box((1.35, 0.32, 0.08), (0, -1.15, 0.78), dark, 0.04)                 # rear wing
    for sx in (-0.55, 0.55): box((0.06, 0.12, 0.35), (sx, -1.1, 0.6), dark, 0.02)
    for sx in (-0.72, 0.72):
        for sy in (-0.75, 0.8): cyl(0.3, 0.32, (sx, sy, 0.3), (0, math.pi / 2, 0), tyre); cyl(0.16, 0.34, (sx, sy, 0.3), (0, math.pi / 2, 0), metal)
    box((0.5, 0.55, 0.06), (0, 0.15, 0.55), dark, 0.04)                   # seat
    sphere(0.3, (0, -0.05, 0.85), white, (1, 1.1, 1)); box((0.34, 0.12, 0.1), (0, 0.2, 0.86), dark, 0.03)   # helmet + visor
    cyl(0.18, 0.05, (0, 0.62, 0.55), (math.radians(60), 0, 0), dark)      # steering wheel
    box((0.2, 0.9, 0.02), (0, 0.4, 0.53), white, 0.01)                    # racing stripe
    render(f'race_kart_{name}.png')
# rock
reset(96, 96, 2.0); r = sphere(0.7, (0, 0, 0.3), mat((0.36, 0.34, 0.32), 0.85), (1.1, 0.9, 0.6)); d = r.modifiers.new('d', 'DISPLACE'); d.strength = 0.18; d.texture = bpy.data.textures.new('t', 'CLOUDS'); d.texture.noise_scale = 0.4
sphere(0.35, (0.45, -0.3, 0.2), mat((0.42, 0.4, 0.37), 0.85), (1, 0.9, 0.6)); render('race_rock.png')
# cone
reset(80, 80, 1.6); bpy.ops.mesh.primitive_cone_add(radius1=0.45, radius2=0.06, depth=1.0, location=(0, 0, 0.55), vertices=24); c = bpy.context.object; c.data.materials.append(mat((1, 0.4, 0.05), 0.4))
box((1.1, 1.1, 0.1), (0, 0, 0.05), mat((1, 0.4, 0.05), 0.4), 0.04); cyl(0.33, 0.14, (0, 0, 0.5), (0, 0, 0), mat((1, 1, 1), 0.3)); render('race_cone.png')
# coin
reset(72, 72, 1.3); cyl(0.5, 0.12, (0, 0, 0.1), (0, 0, 0), mat((1, 0.78, 0.15), 0.2, 1.0), 48); cyl(0.38, 0.14, (0, 0, 0.1), (0, 0, 0), mat((1, 0.86, 0.35), 0.25, 1.0), 48)
bpy.ops.object.text_add(location=(0, -0.03, 0.18)); t = bpy.context.object; t.data.body = '$'; t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'; t.data.size = 0.55; t.data.extrude = 0.02; t.data.materials.append(mat((0.6, 0.38, 0.02), 0.4, 0.5)); render('race_coin.png')
# mud
reset(128, 96, 2.6); bpy.ops.mesh.primitive_circle_add(vertices=24, radius=1, fill_type='NGON', location=(0, 0, 0.02)); m = bpy.context.object; m.scale = (1.15, 0.75, 1); m.data.materials.append(mat((0.16, 0.09, 0.04), 0.12))
for i, v in enumerate(m.data.vertices): k = 1 + 0.12 * math.sin(i * 2.3); v.co.x *= k; v.co.y *= k
sphere(0.15, (0.3, 0.1, 0.03), mat((0.26, 0.16, 0.08), 0.2), (1.4, 1, 0.3)); sphere(0.1, (-0.4, -0.15, 0.03), mat((0.26, 0.16, 0.08), 0.2), (1.4, 1, 0.3)); render('race_mud.png')
# tree
reset(112, 112, 2.6)
for (x, y, r, g) in [(0, 0, 0.8, (0.08, 0.36, 0.1)), (0.38, 0.32, 0.5, (0.16, 0.48, 0.12)), (-0.38, 0.28, 0.48, (0.12, 0.42, 0.1)), (0.05, -0.4, 0.46, (0.1, 0.4, 0.1)), (-0.3, -0.25, 0.4, (0.2, 0.52, 0.14))]: sphere(r, (x, y, 0.6 + r * 0.4), mat(g, 0.7))
render('race_tree.png')
