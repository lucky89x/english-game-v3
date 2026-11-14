import bpy, sys, math, mathutils
glb, out = sys.argv[sys.argv.index('--')+1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
sc = bpy.context.scene
cam=bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera=cam; cam.data.type='ORTHO'
sun=bpy.data.objects.new('sun', bpy.data.lights.new('sun','SUN')); sun.data.energy=3.2; sun.rotation_euler=(math.radians(55),0,math.radians(25)); sc.collection.objects.link(sun)
fill=bpy.data.objects.new('fill', bpy.data.lights.new('fill','SUN')); fill.data.energy=1.2; fill.rotation_euler=(math.radians(70),0,math.radians(-140)); sc.collection.objects.link(fill)
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; b=w.node_tree.nodes['Background']; b.inputs[0].default_value=(0.97,0.93,0.94,1); b.inputs[1].default_value=1.1
sc.render.engine='CYCLES'; sc.cycles.samples=32; sc.cycles.device='CPU'; sc.view_settings.view_transform='Standard'
sc.render.resolution_x=640; sc.render.resolution_y=640
def shot(name, cx, cy, cz, scale, ang):
    cam.data.ortho_scale=scale; a=math.radians(ang); r=6
    # glTF +Z front -> after import Blender -Y front. camera on -Y side at ang 0
    cam.location=(cx+r*math.sin(a), cy-r*math.cos(a), cz)
    cam.rotation_euler=(mathutils.Vector((cx,cy,cz))-cam.location).to_track_quat('-Z','Y').to_euler()
    sc.render.filepath=out+'_'+name+'.png'; bpy.ops.render.render(write_still=True)
shot('full', 0,0,0.80, 1.8, 25)
shot('head', 0,0,1.22, 0.78, 0)
shot('back', 0,0,0.80, 1.8, 180)
