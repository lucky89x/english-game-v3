import bpy,json
from pathlib import Path
r=Path.cwd()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(r/'assets/Ultimate Modular Women - April 2022/Individual Characters/glTF/Adventurer.gltf'))
for o in bpy.data.objects:
 if o.type=='MESH': print('MESH',o.name,'verts',len(o.data.vertices),'bounds',list(o.dimensions),'materials',[m.name for m in o.data.materials])
 if o.type=='ARMATURE':
  print('RIG',o.name,'matrix',o.matrix_world)
  for n in ['Head','Neck','Hips','Root','UpperArm.R']:
   b=o.data.bones.get(n)
   if b: print('BONE',n,list(b.head_local),list(b.tail_local))
print('ACTIONS',[(a.name,len(a.fcurves) if hasattr(a,'fcurves') else len(a.slots)) for a in bpy.data.actions])
