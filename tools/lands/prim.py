"""(27/11) Small helpers to draw game props with Blender primitives: flat-colour materials, boxes, balls, cylinders, rings,
join + export as GLB (y up) with a preview picture. Used by build_robots.py and build_souvenirs.py."""
import bpy, os, math
from mathutils import Vector

OUT = os.environ.get('OUT', 'assets/models'); PREVIEW = os.environ.get('PREVIEW')
MATS = {}
def mat(name, rgb, glow=0.0, metal=0.3, rough=0.45):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Metallic'].default_value = metal; b.inputs['Roughness'].default_value = rough
    if glow: b.inputs['Emission Color'].default_value = (*rgb, 1); b.inputs['Emission Strength'].default_value = glow
    MATS[name] = m; return m
def hexc(h): return tuple(((h >> s) & 255) / 255 for s in (16, 8, 0))
def done(o, m, smooth=True, bevel=0.0):
    o.data.materials.append(m)
    if bevel: md = o.modifiers.new('b', 'BEVEL'); md.width = bevel; md.segments = 2; bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='b')
    if smooth: bpy.ops.object.shade_smooth()
    return o
def box(m, size, at, rot=(0, 0, 0), bevel=0.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at, rotation=rot); o = bpy.context.object; o.scale = size; bpy.ops.object.transform_apply(scale=True); return done(o, m, True, bevel)
def ball(m, r, at, scale=(1, 1, 1), seg=14):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=max(6, seg // 2), location=at); o = bpy.context.object; o.scale = scale; bpy.ops.object.transform_apply(scale=True); return done(o, m)
def cyl(m, r, h, at, rot=(0, 0, 0), r2=None, seg=12):
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r, radius2=r if r2 is None else r2, depth=h, location=at, rotation=rot); return done(bpy.context.object, m)
def ring(m, R, r, at, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=20, minor_segments=6, location=at, rotation=rot); return done(bpy.context.object, m)
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True); MATS.clear()
def export(name):
    obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for o in obs: o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]; bpy.ops.object.join(); o = bpy.context.object; o.name = name
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + '.glb'), export_format='GLB', export_apply=True, export_yup=True, export_animations=False)
    zs = [(o.matrix_world @ Vector(c)).z for c in o.bound_box]; print(f'{name}: {tris} tris, height {max(zs) - min(zs):.2f} m, base {min(zs):.2f}')
    if PREVIEW:
        cam = bpy.data.cameras.new('c'); co = bpy.data.objects.new('c', cam); bpy.context.scene.collection.objects.link(co); h = max(zs)
        co.location = (h * 1.3, -h * 2.4, h * 1.1); d = Vector((0, 0, h * 0.5)) - co.location; co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); bpy.context.scene.camera = co
        sun = bpy.data.lights.new('s', 'SUN'); sun.energy = 3; so = bpy.data.objects.new('s', sun); so.rotation_euler = (0.8, 0.2, 0.6); bpy.context.scene.collection.objects.link(so)
        w = bpy.data.worlds.new('w'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.75, 0.82, 0.9, 1); bpy.context.scene.world = w
        sc = bpy.context.scene; sc.render.engine = 'BLENDER_WORKBENCH' if False else 'CYCLES'; sc.cycles.samples = 12; sc.render.resolution_x = 360; sc.render.resolution_y = 360; sc.render.filepath = os.path.join(PREVIEW, name + '.png'); bpy.ops.render.render(write_still=True)

