# usage: python sheet.py out.jpg scale cz a.glb b.glb ...   (front 3/4 view of each, one sheet)
import bpy, sys, math, mathutils, os
a=sys.argv[sys.argv.index('--')+1:]; out, scale, cz, files = a[0], float(a[1]), float(a[2]), a[3:]
tmp=[]
for i,f in enumerate(files):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=f)
    sc=bpy.context.scene
    cam=bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera=cam; cam.data.type='ORTHO'; cam.data.ortho_scale=scale
    for nm,e,rot in (('s',3.2,(55,0,25)),('f',1.2,(70,0,-140))):
        l=bpy.data.objects.new(nm, bpy.data.lights.new(nm,'SUN')); l.data.energy=e; l.rotation_euler=[math.radians(x) for x in rot]; sc.collection.objects.link(l)
    w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; b=w.node_tree.nodes['Background']; b.inputs[0].default_value=(0.97,0.93,0.94,1); b.inputs[1].default_value=1.1
    sc.render.engine='CYCLES'; sc.cycles.samples=24; sc.view_settings.view_transform='Standard'; sc.render.resolution_x=480; sc.render.resolution_y=480
    ang=math.radians(float(os.environ.get('ANG','25'))); el=math.radians(float(os.environ.get('EL','8'))); r=30
    c=mathutils.Vector((0,0,cz)); cam.location=c+mathutils.Vector((r*math.sin(ang)*math.cos(el), -r*math.cos(ang)*math.cos(el), r*math.sin(el)))
    cam.rotation_euler=(c-cam.location).to_track_quat('-Z','Y').to_euler()
    p=f'{out}.{i}.png'; sc.render.filepath=p; bpy.ops.render.render(write_still=True); tmp.append(p)
from PIL import Image
n=len(tmp); cols=min(n,4); rows=(n+cols-1)//cols
W=Image.new('RGB',(cols*480,rows*480),'white')
for i,p in enumerate(tmp): W.paste(Image.open(p).convert('RGB'),((i%cols)*480,(i//cols)*480)); os.remove(p)
W.save(out,quality=82); os._exit(0)
