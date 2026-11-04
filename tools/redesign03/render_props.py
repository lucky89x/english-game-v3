import bpy,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
for name in ['props_potion_blue','props_scroll_sealed','props_lantern_staff','props_explorer_pack']:
 bpy.ops.wm.open_mainfile(filepath=str(ROOT/'art_source/redesign03'/f'{name}.blend'))
 scene=bpy.context.scene
 mesh=[o for o in scene.objects if o.type=='MESH']
 pts=[o.matrix_world@Vector(v) for o in mesh for v in o.bound_box]
 lo=Vector([min(v[i] for v in pts) for i in range(3)]);hi=Vector([max(v[i] for v in pts) for i in range(3)])
 target=(lo+hi)/2;size=(hi-lo).length
 bpy.ops.object.camera_add(location=target+Vector((.8,-1.7,.7))*size)
 cam=bpy.context.object;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=max((hi-lo).x,(hi-lo).z)*1.35
 scene.camera=cam
 for loc,power in [((2,-3,5),500),((-3,-2,2),250),((0,3,3),500)]:
  bpy.ops.object.light_add(type='AREA',location=target+Vector(loc)*size)
  light=bpy.context.object;light.data.energy=power*size*size;light.data.shape='DISK';light.data.size=3*size
  light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
 scene.world.color=(.2,.2,.2)
 scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=24
 scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
 scene.view_settings.view_transform='AgX';scene.render.filepath=str(ROOT/'artifacts/redesign03'/f'{name}.png')
 bpy.ops.render.render(write_still=True)
