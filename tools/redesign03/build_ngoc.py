import bpy,math,json
from pathlib import Path
from mathutils import Vector
R=Path.cwd(); OUT=R/'assets/redesign03'; SRC=R/'art_source/redesign03'; OUT.mkdir(exist_ok=True); SRC.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'assets/Ultimate Modular Women - April 2022/Individual Characters/glTF/Adventurer.gltf'))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
rig.animation_data.action=None
for t in rig.animation_data.nla_tracks:t.mute=True
for p in rig.pose.bones:p.matrix_basis.identity()
bpy.context.view_layer.update()
for o in list(bpy.data.objects):
 if o.type=='MESH' and (o.name=='Icosphere' or 'Head' in o.name):bpy.data.objects.remove(o,do_unlink=True)
# Shorten original rig and body proportionally; keep all original skin weights and clips.
scale=.65
for o in bpy.data.objects:
 if o.type=='MESH':
  for v in o.data.vertices:
   v.co*=scale;v.co.x*=1.25;v.co.y*=1.12
bpy.context.view_layer.objects.active=rig;rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for b in rig.data.edit_bones:
 b.head*=scale;b.tail*=scale
 b.head.x*=1.25;b.tail.x*=1.25;b.head.y*=1.12;b.tail.y*=1.12
bpy.ops.object.mode_set(mode='OBJECT')
for a in bpy.data.actions:
 for c in a.fcurves:
  if c.data_path.endswith('location'):
   for k in c.keyframe_points:
    factor=scale*([1.25,1.12,1.0][c.array_index]);k.co.y*=factor;k.handle_left.y*=factor;k.handle_right.y*=factor
palette={
'Skin':(.82,.57,.40),'White':(.88,.77,.54),'Brown2':(.23,.105,.045),'LightGreen':(.79,.66,.43),'Gold':(.72,.43,.105),'Green':(.62,.035,.025),'Brown_02':(.16,.065,.024),'Hair_Brown':(.16,.045,.018),'Brown':(.20,.075,.025),
'Cheek':(.85,.41,.30),'EyeWhite':(.96,.91,.78),'Iris':(.13,.06,.025),'Pupil':(.014,.009,.008),'Highlight':(1,.98,.85),'Scarf':(.67,.035,.028),'Hair':(.20,.061,.025),'HairLight':(.31,.105,.035),'Lens':(.045,.21,.27)}
materials={}
for name,rgb in palette.items():
 m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Roughness'].default_value=.68
 if name=='Gold':p.inputs['Metallic'].default_value=.6;p.inputs['Roughness'].default_value=.28
 if name=='Lens':p.inputs['Metallic'].default_value=.3;p.inputs['Roughness'].default_value=.15
 materials[name]=m
# Weld split source vertices then smooth the cloth silhouette (retain rig and seams by material).
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.00003);bpy.ops.object.mode_set(mode='OBJECT')
 sub=o.modifiers.new('Tailored smooth silhouette','SUBSURF');sub.levels=1;bpy.ops.object.modifier_apply(modifier=sub.name)
 for p in o.data.polygons:p.use_smooth=True

def skin(o,bone):
 o.parent=rig
 g=o.vertex_groups.new(name=bone);g.add(list(range(len(o.data.vertices))),1,'REPLACE')
 m=o.modifiers.new('Character skin','ARMATURE');m.object=rig
 return o

def finish(o,name,mat,bone):
 o.name=name;o.data.materials.clear();o.data.materials.append(materials[mat])
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 for p in o.data.polygons:p.use_smooth=True
 return skin(o,bone)

def ell(name,loc,size,mat,bone='Head',segments=24,rings=16):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc);o=bpy.context.object;o.scale=size
 return finish(o,name,mat,bone)

def tube(name,points,radius,mat,bone='Head'):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=3;c.resolution_u=10
 s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for p,co in zip(s.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
 return finish(o,name,mat,bone)
# Full modelled face: soft jaw, projecting cheeks and nose, layered eyes, lashes and smile.
head=ell('Ngoc sculpted face',(0,-.026,1.205),(.231,.187,.239),'Skin')
for v in head.data.vertices:
 z=v.co.z
 if z<1.15:v.co.x*=.89+max(0,z-.99)*.6
for side in [-1,1]:
 ell('Ear',(.221*side,-.02,1.20),(.043,.026,.065),'Skin')
 ell('Ear inner',(.232*side,-.041,1.205),(.022,.01,.04),'Cheek')
 ell('Cheek blush',(.147*side,-.173,1.155),(.034,.003,.015),'Cheek')
 ell('Eye outline',(.092*side,-.184,1.24),(.064,.029,.078),'Hair')
 ell('Eye white',(.092*side,-.202,1.241),(.056,.021,.067),'EyeWhite')
 ell('Iris',(.087*side,-.222,1.239),(.037,.012,.051),'Iris')
 ell('Pupil',(.085*side,-.232,1.243),(.024,.007,.036),'Pupil')
 ell('Catchlight',(.085*side-.012,-.239,1.264),(.011,.004,.014),'Highlight',segments=16,rings=10)
 ell('Small catchlight',(.085*side+.012,-.239,1.222),(.005,.003,.006),'Highlight',segments=12,rings=8)
 tube('Eyebrow',[(side*.041,-.187,1.332),(side*.09,-.198,1.349),(side*.145,-.175,1.332)],.012,'Hair')
 tube('Upper eyelashes',[(side*.047,-.217,1.292),(side*.095,-.222,1.313),(side*.149,-.199,1.292)],.006,'Hair')
ell('Button nose',(0,-.218,1.185),(.027,.031,.026),'Skin')
tube('Warm smile',[(-.055,-.194,1.116),(0,-.212,1.099),(.055,-.194,1.116)],.008,'Brown2')
# Shaped hair cap, curly side locks, swept fringe and braided bun.
ell('Hair cap',(0,.009,1.31),(.241,.19,.163),'Hair')
for side in [-1,1]:
 for i in range(3):
  tube('Side curl',[(side*(.18+i*.018),-.07+i*.03,1.34),(side*(.245+i*.009),-.09+i*.02,1.23),(side*.23,-.045+i*.03,1.11),(side*.195,-.075+i*.03,1.15)],.022,'HairLight' if i==1 else 'Hair')
for i in range(7):
 x=-.18+i*.055
 tube('Swept fringe',[(x*.8,.015,1.449),(x,-.137,1.408),(x-.045,-.192,1.347),(x-.072,-.183,1.313)],.031,'HairLight' if i%3==0 else 'Hair')
ell('Bun core',(.035,.075,1.48),(.13,.113,.107),'Hair')
for i in range(7):
 a=i*math.tau/7
 tube('Bun braid',[(.035+math.cos(a)*.11,.075+math.sin(a)*.095,1.46),(.035+math.cos(a)*.12,.075+math.sin(a)*.10,1.51),(.035+math.cos(a+.7)*.065,.075+math.sin(a+.7)*.065,1.568)],.019,'HairLight')
# Headband and individually modelled brass goggle frames/lenses.
tube('Red headband',[(math.cos(a)*.241,math.sin(a)*.189,1.394) for a in [i*math.tau/16 for i in range(17)]],.022,'Scarf')
for side in [-1,1]:
 x=side*.105
 tube('Brass goggles',[(x+math.cos(a)*.063,-.177,1.415+math.sin(a)*.048) for a in [i*math.tau/16 for i in range(17)]],.011,'Gold')
 ell('Goggle glass',(x,-.178,1.415),(.052,.012,.037),'Lens')
 tube('Glass glint',[(x-.026,-.191,1.431),(x+.005,-.193,1.441)],.003,'Highlight')
tube('Goggle bridge',[(-.045,-.179,1.415),(0,-.188,1.423),(.045,-.179,1.415)],.009,'Gold')
# Cloth collar and scarf tails have real thickness/subdivision, weighted to Chest.
tube('Scarf collar',[(math.cos(a)*.119,math.sin(a)*.081-.035,1.009+math.cos(a)*.008) for a in [i*math.tau/16 for i in range(17)]],.035,'Scarf','Chest')
ell('Scarf knot',(-.075,-.102,.985),(.047,.029,.035),'Scarf','Chest')
for side in [-1,1]:
 tube('Scarf fold',[(-.07,-.095,.99),(-.12+side*.02,-.12,.92),(-.08+side*.025,-.12,.86)],.021,'Scarf','Chest')
# Add individually modelled brass belt clasp and shoulder straps.
for side in [-1,1]:
 tube('Leather shoulder strap',[(side*.12,.05,.96),(side*.14,-.10,.93),(side*.12,-.13,.78)],.012,'Brown2','Chest')
 tube('Golden buckle',[(side*.12-.018,-.145,.85),(side*.12+.018,-.145,.85),(side*.12+.018,-.145,.82),(side*.12-.018,-.145,.82),(side*.12-.018,-.145,.85)],.004,'Gold','Chest')
# Atlas is authored from palette with subtle cloth variation, not external raster editing.
import numpy as np
names=list(palette);W=2048;H=2048;img=bpy.data.images.new('Ngoc_Atlas_2K',width=W,height=H,alpha=True)
a=np.ones((H,W,4),dtype=np.float32)
for i,n in enumerate(names):
 x0=i*W//len(names);x1=(i+1)*W//len(names)
 y,x=np.mgrid[0:H,x0:x1];variation=1+0.012*np.sin(x*.73)*np.sin(y*.81)
 a[:,x0:x1,:3]=np.array(palette[n])[None,None,:]*variation[:,:,None]
img.pixels.foreach_set(a.ravel());img.filepath_raw=str(OUT/'ngoc_atlas_2k.png');img.file_format='PNG';img.save();img.pack()
for n,m in materials.items():
 node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=img;m.node_tree.links.new(node.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
for o in bpy.data.objects:
 if o.type!='MESH':continue
 uv=o.data.uv_layers.active or o.data.uv_layers.new(name='UVMap')
 for face in o.data.polygons:
  m=o.data.materials[face.material_index];n=m.name.split('.')[0]
  idx=names.index(n) if n in names else 2
  for li in face.loop_indices:
   v=o.data.vertices[o.data.loops[li].vertex_index].co
   uv.data[li].uv=((idx+.25+(v.x*3%1)*.5)/len(names),.05+(v.z*.57%1)*.9)
# Reuse authored equipment; bake transforms then rigidly weight to the appropriate moving bone.
def equipment(filename,loc,factor,rotation,bone):
 before=set(bpy.data.objects)
 bpy.ops.import_scene.gltf(filepath=str(OUT/filename))
 new=set(bpy.data.objects)-before
 for o in list(new):
  if o.type!='MESH':continue
  world=o.matrix_world.copy();o.parent=None;o.matrix_world=world
  from mathutils import Matrix,Euler
  transform=Matrix.Translation(Vector(loc))@Euler(rotation).to_matrix().to_4x4()@Matrix.Scale(factor,4)@o.matrix_world
  o.data.transform(transform);o.matrix_world=Matrix.Identity(4)
  skin(o,bone)
 for o in list(new):
  if o.type!='MESH':bpy.data.objects.remove(o,do_unlink=True)
equipment('props_potion_blue.glb',(.17,-.055,.53),.62,(0,0,0),'Hips')
equipment('props_explorer_pack.glb',(0,.075,.65),.58,(0,0,math.pi),'Chest')
equipment('props_scroll_sealed.glb',(-.18,-.01,.68),.65,(0,math.pi/2,0),'Hips')
# Consolidate custom facial surfaces with identical shading into one skinned draw group.
for o in list(bpy.data.objects):
 if o.type=='MESH' and len(o.data.materials)==1:
  m=o.data.materials[0]
  if m.name.split('.')[0] in names and m.name not in ['Gold','Lens']:
   o.data.materials[0]=materials['Skin']
groups={}
for o in list(bpy.data.objects):
 if o.type=='MESH':groups.setdefault(tuple(m.name for m in o.data.materials),[]).append(o)
for objects in groups.values():
 if len(objects)<2:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join()
# Keep only useful adventure clips; no combat requirements in this children's village.
keep=['Idle','Walk','Run','Interact','Wave']
for a in list(bpy.data.actions):
 if a.name not in keep:bpy.data.actions.remove(a)
for t in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(t)
for a in bpy.data.actions:
 t=rig.animation_data.nla_tracks.new();t.name=a.name;t.strips.new(a.name,int(a.frame_range[0]),a)
rig.animation_data.action=None
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
 if o.type in {'MESH','ARMATURE'}:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'ngoc_adventurer.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'ngoc_adventurer.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_skins=True,export_morph=False)
print('NGOC_EXPORT_COMPLETE',len([o for o in bpy.data.objects if o.type=='MESH']))
