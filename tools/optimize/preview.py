"""Contact sheet of GLB files rendered with Cycles on the CPU (no GPU needed), to eyeball a model before / after optimisation.
Run:  <python with bpy 4.2> tools/optimize/preview.py -- <out.png> <label=path.glb> [<label=path.glb> ...]  [cols=4] [px=360] [samples=12] [view=front|back]
Vertex-coloured models (no texture) are drawn with their COLOR_0; textured ones with their base-colour image."""
import bpy, sys, os, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
OUT = a[0]; items = [x.split('=', 1) for x in a[1:] if x.split('=', 1)[0] not in ('cols', 'px', 'samples', 'view')]
opt = dict(x.split('=', 1) for x in a[1:] if x.split('=', 1)[0] in ('cols', 'px', 'samples', 'view'))
COLS, PX, SAMPLES = int(opt.get('cols', 4)), int(opt.get('px', 360)), int(opt.get('samples', 12))
tmp = os.path.splitext(OUT)[0] + '_tiles'; os.makedirs(tmp, exist_ok=True)

def shot(label, path, png):
    bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=path)
    sc = bpy.context.scene; meshes = [o for o in sc.objects if o.type == 'MESH']
    for o in meshes:                                      # vertex-coloured meshes: show the colour layer whatever the importer did
        me = o.data
        if me.color_attributes and not any(n.type == 'TEX_IMAGE' for m in me.materials if m and m.use_nodes for n in m.node_tree.nodes):
            m = bpy.data.materials.new('vc'); m.use_nodes = True; nt = m.node_tree; pb = nt.nodes['Principled BSDF']
            at = nt.nodes.new('ShaderNodeVertexColor'); at.layer_name = me.color_attributes[0].name; nt.links.new(at.outputs['Color'], pb.inputs['Base Color'])
            pb.inputs['Roughness'].default_value = 0.8; me.materials.clear(); me.materials.append(m)
    bpy.context.view_layer.update()
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3); tris = 0
    for o in meshes:
        tris += sum(len(p.vertices) - 2 for p in o.data.polygons)
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            for k in range(3): lo[k] = min(lo[k], w[k]); hi[k] = max(hi[k], w[k])
    ctr = (lo + hi) / 2; r = (hi - lo).length / 2
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 60
    d = (Vector((-0.75, 1.0, 0.45)) if opt.get('view') == 'back' else Vector((0.75, -1.0, 0.45))).normalized(); cam.location = ctr + d * r * 3.6
    cam.rotation_euler = (ctr - cam.location).to_track_quat('-Z', 'Y').to_euler(); cam.data.clip_start = r * 0.05; cam.data.clip_end = r * 20
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3.0; sun.rotation_euler = (math.radians(50), 0, math.radians(35)); sc.collection.objects.link(sun)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.75, 0.78, 0.82, 1); bg.inputs[1].default_value = 1.0
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = False; sc.cycles.max_bounces = 2
    sc.render.resolution_x = sc.render.resolution_y = PX; sc.render.filepath = png; sc.view_settings.view_transform = 'Standard'
    bpy.ops.render.render(write_still=True)
    return tris

tiles = []
for label, path in items:
    png = os.path.join(tmp, label.replace('/', '_').replace(' ', '_') + '.png'); t = shot(label, path, png); tiles.append((label, t, png)); print('SHOT', label, t)
from PIL import Image, ImageDraw
rows = (len(tiles) + COLS - 1) // COLS; sheet = Image.new('RGB', (COLS * PX, rows * (PX + 18)), (30, 30, 30)); dr = ImageDraw.Draw(sheet)
for i, (label, t, png) in enumerate(tiles):
    x, y = (i % COLS) * PX, (i // COLS) * (PX + 18); sheet.paste(Image.open(png).convert('RGB'), (x, y + 18)); dr.text((x + 4, y + 3), '%s  %d tris' % (label, t), fill=(255, 255, 255))
sheet.save(OUT); print('SHEET', OUT)
