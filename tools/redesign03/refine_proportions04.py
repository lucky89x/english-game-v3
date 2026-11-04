import bpy
from pathlib import Path
R=Path.cwd();bpy.ops.wm.open_mainfile(filepath=str(R/'backups/redesign04/art_source/redesign03/ngoc_adventurer.blend'))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE');rig.data.pose_position='REST'
def change(v):
 if v.z<1.0:
  v.x*=1.18;v.y*=1.13;v.z*=.78
 else:v.z-=.22
for o in bpy.data.objects:
 if o.type=='MESH':
  for v in o.data.vertices:change(v.co)
bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
for b in rig.data.edit_bones:change(b.head);change(b.tail)
bpy.ops.object.mode_set(mode='OBJECT')
for a in bpy.data.actions:
 for f in a.fcurves:
  if f.data_path.endswith('location'):
   factor=[1.18,1.13,.78][f.array_index]
   for k in f.keyframe_points:k.co.y*=factor;k.handle_left.y*=factor;k.handle_right.y*=factor
rig.scale=(1.08,1.08,1.08);rig.data.pose_position='POSE'
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
 if o.type in ['MESH','ARMATURE']:o.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'art_source/redesign03/ngoc_adventurer.blend'))
bpy.ops.export_scene.gltf(filepath=str(R/'assets/redesign03/ngoc_adventurer.glb'),export_format='GLB',use_selection=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True)
