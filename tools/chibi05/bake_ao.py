"""Bake soft contact shadows (ambient occlusion) into vertex colours so models keep depth under any game light.

Why: flat palette colours + one sun make chibi models look like plastic toys. The reference paintings have warm
shadow in every crease (under the hair, between curls, under eaves, around windows). A vertex-colour AO bake gives
that for free at run time: glTF COLOR_0 multiplies the base colour in three.js, no texture, no extra draw call.

    from bake_ao import bake_ao;  bake_ao(mesh_object)        # call after decimation, before export

Environment: CHIBI_AO=0 switches it off, CHIBI_AO_STRENGTH sets how dark creases get (characters 0.6; houses 0.3,
because big flat walls have few vertices and a strong per-vertex bake smears grey across them).
"""
import bpy, os


def bake_ao(ob, strength=None, samples=48, ground=True, tint=(0.60, 0.46, 0.52)):
    if os.environ.get('CHIBI_AO', '1') == '0':
        return False
    strength = float(os.environ.get('CHIBI_AO_STRENGTH', strength if strength is not None else 0.6))
    scene = bpy.context.scene
    prev_engine = scene.render.engine
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = samples
    me = ob.data
    for ca in list(me.color_attributes):
        me.color_attributes.remove(ca)
    col = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    me.color_attributes.active_color = col
    me.color_attributes.render_color_index = 0
    plane = None
    if ground:        # a floor under the model: feet and wall bottoms pick up a little ground shadow
        zmin = min((ob.matrix_world @ v.co).z for v in me.vertices)
        bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, zmin - 0.002))
        plane = bpy.context.active_object
    for o in bpy.context.view_layer.objects:
        o.select_set(o is ob)
    bpy.context.view_layer.objects.active = ob
    hidden = [(m, m.show_viewport, m.show_render) for m in ob.modifiers]
    for m in ob.modifiers:      # bake in the rest pose
        m.show_viewport = m.show_render = False
    scene.render.bake.target = 'VERTEX_COLORS'
    bpy.ops.object.bake(type='AO')
    for m, a, b in hidden:
        m.show_viewport, m.show_render = a, b
    if plane:
        bpy.data.objects.remove(plane)
    # remap: creases go towards a warm plum shadow instead of grey, open surfaces stay untouched
    n = len(col.data)
    buf = [0.0] * (n * 4)
    col.data.foreach_get('color', buf)
    lo = 1.0
    for i in range(n):
        ao = buf[i * 4]
        k = min(1.0, max(0.0, (ao - 0.25) / 0.6)) ** 0.8        # 0 = deep crease, 1 = open
        lo = min(lo, k)
        for c in range(3):      # white when open; towards the tint in creases
            buf[i * 4 + c] = 1.0 - strength * (1.0 - k) * (1.0 - tint[c])
        buf[i * 4 + 3] = 1.0
    # faces are painted textures with their own soft shading: keep them clean
    face_slots = {i for i, m in enumerate(me.materials) if m and 'face' in m.name.lower()}
    if face_slots:
        for poly in me.polygons:
            if poly.material_index in face_slots:
                for vi in poly.vertices:
                    buf[vi * 4] = buf[vi * 4 + 1] = buf[vi * 4 + 2] = 1.0
    col.data.foreach_set('color', buf)
    me.update()
    scene.render.engine = prev_engine
    print('baked AO into vertex colours:', n, 'points, deepest crease', round(lo, 2))
    return True
