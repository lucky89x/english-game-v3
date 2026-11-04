"""Authored chibi elder pilot. New meshes, UV atlas, armature and noncombat clips."""
import bpy, math, sys, random
import numpy as np
from pathlib import Path
from mathutils import Vector, Quaternion
ROOT=Path(__file__).resolve().parents[2]
VILLAGER='--villager' in sys.argv
ASSET='npc_villager' if VILLAGER else 'tom_elder'
OUT=ROOT/'assets/redesign03'; SRC=ROOT/'art_source/redesign03'
OUT.mkdir(exist_ok=True,parents=True);SRC.mkdir(exist_ok=True,parents=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
random.seed(14)
# One packed 2K atlas: deliberate blue/cream/gold/leather palette with mild grain.
colors=[(.91,.59,.36),(.98,.76,.52),(.92,.88,.72),(.13,.32,.60),(.07,.18,.38),(.92,.61,.18),(.27,.12,.055),(.08,.035,.025),(.98,.97,.91),(.72,.27,.20),(.015,.01,.012),(.42,.20,.07),(.95,.44,.12),(.38,.59,.65),(.68,.73,.72),(.86,.71,.45)]
if VILLAGER:colors[3]=(.22,.44,.24);colors[4]=(.10,.24,.12);colors[8]=(.24,.095,.035)
size=2048; pixels=np.ones((size,size,4),dtype=np.float32)
rng=np.random.default_rng(14)
for i,c in enumerate(colors):
 x=(i%4)*512;y=(i//4)*512
 noise=rng.uniform(.96,1.04,(512,512,1))
 pixels[y:y+512,x:x+512,:3]=np.array(c)[None,None,:]*noise
img=bpy.data.images.new('Tom_handcrafted_palette_2K',width=size,height=size)
img.pixels.foreach_set(pixels.ravel());img.filepath_raw=str(OUT/(ASSET+'_palette_2k.png'));img.file_format='PNG';img.save();img.pack()
mat=bpy.data.materials.new('Tom_Atlas');mat.use_nodes=True
bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.72
tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=img
mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
objects=[]
def finish(o,name,color,bone):
 if VILLAGER and any(s in name for s in ['hair','forelock','Forelock','White brow','Sideburn']):color=6
 o.name=name;o.data.materials.clear();o.data.materials.append(mat)
 if not o.data.uv_layers:
  o.data.uv_layers.new(name='UVMap')
  uv=o.data.uv_layers.active.data
  for poly in o.data.polygons:
   for li in poly.loop_indices:
    p=o.data.vertices[o.data.loops[li].vertex_index].co
    uv[li].uv=((p.x+1)*.5,(p.z+1)*.5)
 uv=o.data.uv_layers.active.data
 for v in uv:
  v.uv=((color%4+(0.04+float(v.uv.x%1)*.92))/4,(color//4+(0.04+float(v.uv.y%1)*.92))/4)
 for p in o.data.polygons:p.use_smooth=True
 g=o.vertex_groups.new(name=bone);g.add(list(range(len(o.data.vertices))),1,'REPLACE')
 objects.append(o);return o
def ell(name,loc,scale,color,bone,seg=20,rings=12):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc)
 o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 return finish(o,name,color,bone)
def loft(name,levels,color,bone,segments=32):
 verts=[];faces=[]
 for z,rx,ry,cy in levels:
  for i in range(segments):
   a=i*math.tau/segments;verts.append((math.cos(a)*rx,cy+math.sin(a)*ry,z))
 for j in range(len(levels)-1):
  for i in range(segments):
   a=j*segments+i;b=j*segments+(i+1)%segments;faces.append((a,b,b+segments,a+segments))
 faces.extend([tuple(reversed(range(segments))),tuple((len(levels)-1)*segments+i for i in range(segments))])
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o)
 return finish(o,name,color,bone)
def tube(name,points,radius,color,bone):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=6;cu.bevel_depth=radius;cu.bevel_resolution=2
 sp=cu.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
 for p,co in zip(sp.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True)
 bpy.ops.object.convert(target='MESH');o=bpy.context.object;o.select_set(False);return finish(o,name,color,bone)
def segment(name,a,b,width,color,bone):
 a,b=Vector(a),Vector(b);o=ell(name,(a+b)/2,(width,width,(b-a).length*.6),color,bone)
 o.rotation_mode='QUATERNION';o.rotation_quaternion=(b-a).to_track_quat('Z','Y');return o
def box(name,loc,scale,color,bone,bevel=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 m=o.modifiers.new('Soft carved edges','BEVEL');m.width=bevel;m.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
 return finish(o,name,color,bone)
# Silhouette: broad shoes, short legs, full robe, large kind face.
for side,x in [('L',-.16),('R',.16)]:
 ell('Leather boot '+side,(x,-.065,.085),(.13,.19,.085),6,'Foot.'+side)
 ell('Boot cuff '+side,(x,0,.20),(.10,.11,.07),11,'Shin.'+side)
 segment('Leg '+side,(x,0,.20),(x,0,.55),.085,2,'Thigh.'+side)
loft('Cream inner robe',[(.22,.26,.17,0),(.27,.28,.18,0),(.52,.235,.17,0),(.76,.24,.17,0),(.94,.22,.14,0), (1.00,.16,.12,0)],2,'Spine')
loft('Blue travelling coat',[(.25,.295,.19,.03),(.30,.30,.19,.03),(.52,.27,.18,.03),(.78,.26,.18,.03),(.94,.26,.155,.03),(1.025,.18,.13,.03)],3,'Spine')
# Front cream panel overlays coat, framed by paired gold piping.
box('Cream front inset',(0,-.172,.57),(.23,.035,.61),2,'Spine',.035)
for s in [-1,1]:
 tube('Gold coat piping',[(s*.135,-.195,.28),(s*.13,-.20,.48),(s*.12,-.19,.75),(s*.09,-.15,.99)],.012,5,'Spine')
 tube('Gold hem',[(s*.01,-.19,.27),(s*.18,-.16,.27),(s*.285,.03,.27)],.012,5,'Spine')
box('Leather belt',(0,-.188,.65),(.52,.045,.07),6,'Spine',.016)
box('Gold belt buckle',(0,-.226,.65),(.11,.027,.09),5,'Spine',.012)
box('Buckle inset',(0,-.246,.65),(.061,.012,.04),6,'Spine',.006)
ell('Round clasp',(0,-.215,.905),(.052,.018,.052),5,'Spine')
ell('Clasp amber',(0,-.235,.905),(.025,.009,.025),12,'Spine')
for s in [-1,1]:
 shoulder=(s*.23,0,.94);elbow=(s*.36,-.005,.78);wrist=(s*.43,-.035,.64)
 segment('Cream upper sleeve',shoulder,elbow,.105,2,'UpperArm.'+('R' if s>0 else 'L'))
 segment('Cream fore sleeve',elbow,wrist,.10,2,'Forearm.'+('R' if s>0 else 'L'))
 ell('Gold cuff',(s*.427,-.035,.665),(.09,.09,.045),5,'Forearm.'+('R' if s>0 else 'L'))
 hand='Hand.'+('R' if s>0 else 'L')
 ell('Palm',(s*.445,-.045,.60),(.072,.049,.083),1,hand)
 for k in range(4):ell('Finger',(s*(.401+k*.026),-.052,.55),(.018,.023,.047-abs(k-1.5)*.004),1,hand,12,8)
 ell('Thumb',(s*.495,-.077,.615),(.028,.026,.045),1,hand,14,8)
 # Blue shoulder cape rounded layered cloth.
 ell('Blue cape shoulder',(s*.225,.025,.985),(.16,.165,.075),3,'UpperArm.'+('R' if s>0 else 'L'))
# Neck and friendly sculpted face, facing -Y.
ell('Neck',(0,0,1.03),(.105,.09,.11),1,'Neck')
ell('Face',(0,-.025,1.235),(.255,.215,.265),1,'Head',32,20)
ell('Chin',(0,-.105,1.075),(.19,.125,.095),1,'Head')
for s in [-1,1]:
 ell('Ear',(s*.25,-.015,1.22),(.055,.048,.075),0,'Head')
 ell('Ear inner',(s*.275,-.043,1.22),(.022,.014,.042),9,'Head',16,10)
 ell('Cheek',(s*.145,-.205,1.17),(.075,.035,.055),0,'Head')
 ell('Eye white',(s*.10,-.218,1.27),(.061,.022,.067),8,'Head')
 ell('Warm iris',(s*.10,-.239,1.263),(.040,.012,.048),7,'Head')
 ell('Pupil',(s*.10,-.249,1.263),(.026,.009,.036),10,'Head')
 ell('Eye sparkle',(s*.10-.011,-.258,1.281),(.012,.005,.014),8,'Head',12,8)
 tube('White brow',[(s*.045,-.224,1.345),(s*.10,-.241,1.365),(s*.16,-.212,1.35)],.021,8,'Head')
ell('Nose',(0,-.25,1.205),(.065,.065,.058),0,'Head')
tube('Smile',[(-.075,-.219,1.13),(0,-.244,1.105),(.075,-.219,1.13)],.014,7,'Head')
for s in [-1,1]:
 ell('White moustache',(s*.065,-.248,1.16),(.085,.038,.035),8,'Head')
 # swept sideburns and layered beard lobes, not a single cone.
 for k in range(3):ell('Sideburn',(s*(.205-.012*k),-.09-.04*k,1.28-.085*k),(.065,.075,.09),8,'Head',16,10)
for k in range(9):
 x=(k-4)*.038; z=1.045+.045*(abs(k-4)/4)
 ell('Beard curl',(x,-.188,z),(.055,.08,.105-abs(k-4)*.007),8,'Head',16,10)
for k in range(7):
 a=k*math.pi/6
 ell('Crown hair',(math.cos(a)*.19,.035+math.sin(a)*.08,1.432),(.093,.09,.07),8,'Head',16,10)
ell('Swept forelock',(-.045,-.09,1.478),(.125,.09,.063),8,'Head',20,12).rotation_euler.y=-.25
ell('Forelock tip',(.045,-.075,1.497),(.07,.07,.045),8,'Head',16,10)
# Pouch and useful scroll on belt.
box('Leather satchel',(-.25,-.14,.57),(.15,.10,.17),11,'Spine',.035)
box('Satchel flap',(-.25,-.20,.625),(.16,.025,.07),6,'Spine',.02)
ell('Satchel clasp',(-.25,-.223,.61),(.016,.008,.018),5,'Spine',12,8)
segment('Rolled map',(.24,-.15,.54),(.25,-.15,.74),.045,2,'Spine')
# Lantern staff, attached to left hand. Bent wood and lantern cage are real meshes.
staff_bone='Hand.L'
tube('Carved lantern staff',[(-.48,-.015,.035),(-.49,-.025,.58),(-.51,-.01,1.16),(-.55,0,1.53),(-.48,-.015,1.64),(-.39,-.02,1.60),(-.40,-.02,1.51)],.027,11,staff_bone)
for z in [.54,.59,.64]:tube('Staff leather grip',[(-.48,-.05,z),(-.52,-.02,z+.01),(-.49,.01,z+.018)],.012,6,staff_bone)
cx,cy,cz=-.40,-.02,1.39
box('Lantern warm glass',(cx,cy,cz),(.105,.09,.13),12,staff_bone,.015)
for z in [1.31,1.47]:box('Lantern rim',(cx,cy,z),(.15,.13,.028),5,staff_bone,.012)
for x in [-.062,.062]:
 for y in [-.052,.052]:segment('Lantern cage',(cx+x,cy+y,1.32),(cx+x,cy+y,1.46),.008,6,staff_bone)
tube('Lantern hook',[(cx,cy,1.49),(cx-.025,cy,1.52),(cx,cy,1.55),(cx+.025,cy,1.52)],.008,5,staff_bone)
# Consolidate the authored pieces into one skinned mesh and one atlas material.
if VILLAGER:
 for o in list(objects):
  if any(s in o.name for s in ['staff','Staff','Lantern','lantern','Beard','moustache','Sideburn']):
   objects.remove(o);bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.object.join()
joined=bpy.context.object;joined.name='Tom_Custom_SkinnedMesh';objects=[joined]
reduce=joined.modifiers.new('Game topology reduction','DECIMATE');reduce.ratio=.70
bpy.context.view_layer.objects.active=joined;bpy.ops.object.modifier_apply(modifier=reduce.name)
# Skeleton with explicit in-place animated bone tracks.
bpy.ops.object.select_all(action='DESELECT');bpy.ops.object.armature_add(enter_editmode=True,location=(0,0,0));rig=bpy.context.object;rig.name='TomRig';bones=rig.data.edit_bones
bones.remove(bones[0])
spec=[('Root',(0,0,0),(0,0,.15),None),('Hips',(0,0,.51),(0,0,.68),'Root'),('Spine',(0,0,.68),(0,0,.99),'Hips'),('Neck',(0,0,.99),(0,0,1.10),'Spine'),('Head',(0,0,1.10),(0,0,1.44),'Neck')]
for side,s in [('L',-1),('R',1)]:
 spec += [('Thigh.'+side,(s*.16,0,.51),(s*.16,0,.29),'Hips'),('Shin.'+side,(s*.16,0,.29),(s*.16,0,.13),'Thigh.'+side),('Foot.'+side,(s*.16,0,.13),(s*.16,-.16,.07),'Shin.'+side),('UpperArm.'+side,(s*.23,0,.94),(s*.36,-.005,.78),'Spine'),('Forearm.'+side,(s*.36,-.005,.78),(s*.43,-.035,.64),'UpperArm.'+side),('Hand.'+side,(s*.43,-.035,.64),(s*.45,-.04,.55),'Forearm.'+side)]
for name,head,tail,parent in spec:
 b=bones.new(name);b.head=head;b.tail=tail
 if parent:b.parent=bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
for o in objects:
 o.parent=rig;m=o.modifiers.new('Tom skin deformation','ARMATURE');m.object=rig
scene=bpy.context.scene;scene.render.fps=30
for name,duration in [('Idle',3.0),('Walk',1.0),('Run',.70),('Talk',2.4),('Wave',2.0)]:
 rig.animation_data_create();action=bpy.data.actions.new(name);rig.animation_data.action=action
 frames=round(duration*30)
 for frame in range(0,frames+1,3):
  t=frame/frames;phase=t*math.tau
  for b in rig.pose.bones:b.rotation_mode='QUATERNION';b.rotation_quaternion=Quaternion();b.location=(0,0,0)
  rig.pose.bones['Hips'].location.z=math.sin(phase)*.006
  def rotate(bone,axis,angle):
   b=rig.pose.bones[bone];local=b.bone.matrix_local.to_quaternion().inverted()@Vector(axis);b.rotation_quaternion=Quaternion(local,angle)
  rotate('Spine',(0,1,0),math.sin(phase)*.012)
  if name in ['Walk','Run']:
   strength=.42 if name=='Walk' else .65
   for side,s in [('L',-1),('R',1)]:
    v=math.sin(phase)*s
    rotate('Thigh.'+side,(1,0,0),v*strength)
    rotate('Shin.'+side,(1,0,0),max(0,-v)*.55)
    rotate('UpperArm.'+side,(1,0,0),-v*.18)
   rig.pose.bones['Hips'].location.z=abs(math.sin(phase))*.018
  if name=='Talk':
   rotate('Head',(1,0,0),math.sin(phase*2)*.055)
   rotate('UpperArm.R',(0,1,0),-.30-.12*math.sin(phase))
   rotate('Forearm.R',(1,0,0),-.25-.18*math.sin(phase*2))
   rotate('Hand.R',(0,1,0),math.sin(phase*2)*.10)
  if name=='Wave':
   envelope=min(1,t*5,(1-t)*5)
   rotate('UpperArm.R',(0,1,0),-1.55*envelope)
   rotate('Forearm.R',(0,1,0),-.3*envelope)
   rotate('Hand.R',(0,1,0),math.sin(phase*3)*.25*envelope)
  for b in rig.pose.bones:
   b.keyframe_insert('rotation_quaternion',frame=frame,group=b.name);b.keyframe_insert('location',frame=frame,group=b.name)
 action.use_fake_user=True
 track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,0,action)
 rig.animation_data.action=None
# Blender scene saved as authorable source; select only model for portable GLB export.
for track in rig.animation_data.nla_tracks:track.mute=True
scene.frame_set(0)
for b in rig.pose.bones:b.rotation_quaternion=Quaternion();b.location=(0,0,0)
bpy.ops.object.select_all(action='SELECT');bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/(ASSET+'.blend')))
for track in rig.animation_data.nla_tracks:track.mute=False
bpy.ops.export_scene.gltf(filepath=str(OUT/(ASSET+'.glb')),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_yup=True,export_apply=False)
print('TOM_EXPORT_OK',len(objects),'meshes',str(OUT/(ASSET+'.glb')))
