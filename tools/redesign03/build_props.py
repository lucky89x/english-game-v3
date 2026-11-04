"""EnglishQuestV3 first authored prop kit. Blender 4.5, meters, glTF + packed textures.
Quaternius CC0 Scroll_1 and Pouch_Large supply the base meshes for two kitbashes.
Other pieces are authored surfaces/curves; not claimed to match concept exactly.
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/redesign03'; SOURCE=ROOT/'art_source/redesign03'; QA=ROOT/'artifacts/redesign03'
for p in [OUT,SOURCE,QA]:p.mkdir(exist_ok=True,parents=True)

def clean():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def texture():
    im=bpy.data.images.new('EQ_PropSurface_512',width=512,height=512)
    rng=random.Random(354); px=[]
    for y in range(512):
      for x in range(512):
        v=.88+.035*math.sin(x*.17+math.sin(y*.04))+.025*math.sin(x*.51+y*.21)+rng.random()*.045
        px.extend((v,v,v,1))
    im.pixels.foreach_set(px);im.filepath_raw=str(SOURCE/'prop_surface.png');im.file_format='PNG';im.save();im.pack()
    return im

clean();tex=texture()
def mat(name,color,metal=0,rough=.5,emit=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    nodes=m.node_tree.nodes; bs=nodes.get('Principled BSDF')
    # Bake the tint into pixels. glTF does not serialize arbitrary MixRGB graphs.
    import numpy as np
    tinted=bpy.data.images.new(name+'_Albedo',width=512,height=512)
    pixels=np.array(tex.pixels[:],dtype=np.float32).reshape((-1,4))
    pixels[:,:3]*=np.array(color,dtype=np.float32)
    tinted.pixels.foreach_set(pixels.reshape(-1))
    tinted.filepath_raw=str(SOURCE/(name.replace(' ','_')+'_Albedo.png'));tinted.file_format='PNG';tinted.save();tinted.pack()
    t=nodes.new('ShaderNodeTexImage');t.image=tinted
    m.node_tree.links.new(t.outputs['Color'],bs.inputs['Base Color'])
    bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
    if emit:
      bs.inputs['Emission Color'].default_value=(*color,1);bs.inputs['Emission Strength'].default_value=emit
    m.diffuse_color=(*color,1)
    return m

gold=mat('Antique honey brass',(.83,.48,.095),.72,.28)
darkgold=mat('Aged brass recess',(.26,.115,.035),.55,.44)
leather=mat('Cinnamon leather',(.29,.105,.035),0,.6)
red=mat('Crimson ribbon',(.5,.035,.045),0,.55)
cream=mat('Warm parchment',(.88,.69,.39),0,.8)
blue=mat('Azure potion enamel',(.025,.38,.73),.15,.16)
glass=mat('Pale cyan rim',(.28,.73,.85),.2,.16)
wood=mat('Carved walnut',(.22,.075,.024),0,.56)
glow=mat('Amber lantern glass',(.95,.40,.035),.05,.24,1.4)
canvas=mat('Moss green pack',(.18,.29,.075),0,.8)
cork=mat('Cork',(.46,.25,.10),0,.93)

def finish(ob,m,bevel=0):
    ob.data.materials.append(m)
    if bevel:
      mod=ob.modifiers.new('Soft handcrafted edges','BEVEL');mod.width=bevel;mod.segments=3
      bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=mod.name)
    if ob.type=='MESH':
      for p in ob.data.polygons:p.use_smooth=True
    return ob

def uv_smart(ob):
    bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.02);bpy.ops.object.mode_set(mode='OBJECT')

def lathe(name,profile,m,sides=48):
    verts=[];faces=[]
    for z,r in profile:
      for i in range(sides):
        a=i*math.tau/sides;verts.append((r*math.cos(a),r*math.sin(a),z))
    for j in range(len(profile)-1):
      for i in range(sides):faces.append((j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i))
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob)
    finish(ob,m);uv_smart(ob);return ob

def ball(name,loc,scale,m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,m)

def ring(name,loc,major,minor,m,rot=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=40,minor_segments=8,location=loc,rotation=rot);o=bpy.context.object;o.name=name;return finish(o,m)

def box(name,loc,scale,m,bevel=.008):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,m,bevel);uv_smart(o);return o

def cord(name,points,radius,m,cyclic=False):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=6;cu.bevel_depth=radius;cu.bevel_resolution=2
    sp=cu.splines.new('POLY' if len(points)>20 else 'BEZIER')
    if sp.type=='POLY':
      sp.points.add(len(points)-1)
      for b,co in zip(sp.points,points):b.co=(*co,1)
    else:
      sp.bezier_points.add(len(points)-1)
      for b,co in zip(sp.bezier_points,points):b.co=co;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    sp.use_cyclic_u=cyclic
    ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob);ob.data.materials.append(m)
    bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob;bpy.ops.object.convert(target='MESH');uv_smart(ob);return ob

def import_model(name,height=None):
    before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/Exports/glTF'/f'{name}.gltf'))
    obs=list(set(bpy.data.objects)-before);meshes=[o for o in obs if o.type=='MESH']
    for o in meshes:
      mw=o.matrix_world.copy();o.parent=None;o.matrix_world=mw
    for o in obs:
      if o.type!='MESH':bpy.data.objects.remove(o,do_unlink=True)
    pts=[o.matrix_world@Vector(v) for o in meshes for v in o.bound_box];low=min(v.z for v in pts);high=max(v.z for v in pts)
    fac=height/(high-low) if height else 1
    for o in meshes:
      o.location.z-=low;o.location*=fac;o.scale*=fac
      bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return meshes

def potion():
    lathe('Round flask silhouette',[(0,0),(.008,.04),(.025,.073),(.065,.092),(.115,.096),(.16,.075),(.192,.04),(.217,.035),(.221,.034)],blue)
    lathe('Thick glass neck',[(.209,.034),(.212,.043),(.223,.043),(.229,.035)],glass)
    lathe('Carved cork stopper',[(.221,.027),(.25,.029),(.264,.034),(.27,.029),(.27,0)],cork)
    ring('Neck leather cord',(0,0,.201),.038,.006,leather)
    for z in [.015,.18]:ring('Brass bottle binding',(0,0,z),.055 if z<.1 else .051,.004,gold)
    for x in [-.048,.048]:
      cord('Leather bottle cradle',[(x*.5,0,.012),(x*1.5,-.045,.06),(x*1.45,-.045,.13),(x,-.025,.18)],.005,leather)
    ball('Sunburst medallion',(0,-.095,.10),(.022,.005,.027),gold)
    ball('Cyan inset gem',(0,-.101,.10),(.011,.003,.014),glass)
    ring('Hanging loop',(.052,0,.22),.022,.004,gold,(math.pi/2,0,0))
    for i in range(3):ball('Hand blown bubble',(.03+i*.008,-.082,.085+i*.023),(.004,.002,.005),glass)

def scroll():
    obs=import_model('Scroll_1')
    for o in obs:o.scale*=1.35
    # Fitted crimson ribbon follows the rolled parchment rather than a flat label.
    ring('Crimson seal binding',(0,0,.041),.035,.009,red,(0,math.pi/2,0))
    ball('Wax seal',(0,-.04,.048),(.025,.007,.026),red)
    ring('Embossed seal border',(0,-.047,.048),.016,.0025,gold,(math.pi/2,0,0))
    for dx in [-1,1]:
      o=box('Ribbon tail',(dx*.014,-.03,.014),(.019,.009,.046),red,.003);o.rotation_euler[1]=dx*.24
    ball('Seal star center',(0,-.05,.048),(.007,.003,.007),gold)
    for k in range(5):
      a=k*math.tau/5;cord('Seal star ray',[(0,-.05,.048),(.012*math.sin(a),-.05,.048+.012*math.cos(a))],.002,gold)

def staff():
    cord('Curved carved staff',[(0,0,.035),(-.018,.005,.40),(.015,0,.85),(.025,0,1.21),(.005,0,1.38),(-.08,0,1.46),(-.17,0,1.43),(-.185,0,1.36)],.027,wood)
    for z in [.04,.42,.48]:ring('Brass ferrule',(0,0,z),.029,.007,gold)
    for i in range(8):ring('Leather hand grip',(.005,0,.65+i*.015),.029,.004,leather)
    ring('Lantern hanging link',(-.17,0,1.32),.026,.005,gold,(math.pi/2,0,0))
    cx=-.17
    base=lathe('Lantern bevelled foot',[(.96,0),(.96,.07),(.975,.085),(.99,.075),(1.0,.067)],gold,32);base.location.x=cx
    body=lathe('Amber light chamber',[(.99,.057),(1.03,.064),(1.15,.064),(1.19,.052)],glow,32);body.location.x=cx
    cap=lathe('Tiered lantern roof',[(1.18,.07),(1.195,.088),(1.205,.087),(1.22,.063),(1.26,.033),(1.27,0)],gold,32);cap.location.x=cx
    for i in range(6):
      a=i*math.tau/6;x=math.cos(a)*.071;y=math.sin(a)*.071
      cord('Lantern cage pillar',[(cx+x,y,.987),(cx+x*1.1,y*1.1,1.09),(cx+x,y,1.195)],.005,darkgold)
    ring('Lantern handle',(-.17,0,1.282),.025,.005,gold,(math.pi/2,0,0))
    for i in range(5):
      z=.83+i*.1;ball('Wood knot',(.027,-.015,z),(.008,.004,.013),darkgold)

def pack():
    obs=import_model('Pouch_Large',.36)
    # The source provides seams, curved flap, buckle and leather edge topology.
    for ob in obs:
      for i,m in enumerate(ob.data.materials):
        if m and 'Metal' not in m.name:ob.data.materials[i]=canvas
    for sign in [-1,1]:
      cord('Shoulder strap',[(sign*.10,.025,.32),(sign*.12,.13,.27),(sign*.12,.13,.08),(sign*.10,.01,.04)],.014,leather)
      ob=box('Side satchel',(sign*.225,0,.13),(.105,.11,.16),leather,.024)
      box('Side pocket flap',(sign*.225,-.063,.19),(.108,.019,.065),leather,.015)
      ball('Pocket brass stud',(sign*.225,-.077,.18),(.01,.004,.01),gold)
    roll=lathe('Rolled parchment blanket',[(-.24,0),(-.24,.07),(-.22,.08),(.22,.08),(.24,.07),(.24,0)],cream)
    roll.rotation_euler[1]=math.pi/2;roll.location.z=.40
    for x in [-.14,.14]:ring('Bedroll leather tie',(x,0,.40),.082,.009,leather,(0,math.pi/2,0))
    for side in [-1,1]:
      pts=[]
      for i in range(100):
        a=i/99*math.tau*2.6;r=.004+i/99*.059;pts.append((side*.243,math.cos(a)*r,.40+math.sin(a)*r))
      cord('Visible rolled blanket spiral',pts,.0025,leather)
    for x in [-.12,.12]:
      box('Front leather strap',(x,-.105,.19),(.026,.014,.28),leather,.005)
      ring('Brass strap buckle',(x,-.117,.21),.025,.004,gold,(math.pi/2,0,0))

def export(name,builder):
    clean();builder()
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
    for o in meshes:
      for attr in list(o.data.color_attributes):o.data.color_attributes.remove(attr)
      if not o.data.uv_layers:uv_smart(o)
    for im in bpy.data.images:
      if im.type=='IMAGE':
        _ = im.pixels[0] if len(im.pixels)>0 else None
        if max(im.size)>1024:
          if im.packed_file:im.unpack(method='REMOVE')
          factor=1024/max(im.size);im.scale(max(1,round(im.size[0]*factor)),max(1,round(im.size[1]*factor)))
          im.filepath_raw=str(SOURCE/(im.name.replace(' ','_')+'_1K.png'));im.file_format='PNG';im.save()
        im.pack()
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:o.select_set(True)
    bpy.context.view_layer.objects.active=meshes[0]
    bpy.ops.object.join()
    joined=bpy.context.object;joined.name=name
    meshes=[joined]
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/(name+'.blend')))
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_vertex_color='NONE')
    tri=sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons)
    points=[o.matrix_world@Vector(v) for o in meshes for v in o.bound_box]
    dims=[max(v[i] for v in points)-min(v[i] for v in points) for i in range(3)]
    print('DELIVERED',name,'tris',tri,'xyz_blender',dims)
    return dict(file=name+'.glb',triangles=tri,dimensions_blender_xyz=dims,authorship='Quaternius kitbash plus authored fittings' if 'pack' in name or 'scroll' in name else 'Authored mesh surfaces and curved fittings',art_status='FIRST_REDESIGN_REVIEW_REQUIRED')

reports=[]
for name,fn in [('props_potion_blue',potion),('props_scroll_sealed',scroll),('props_lantern_staff',staff),('props_explorer_pack',pack)]:reports.append(export(name,fn))
(QA/'props_manifest.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')
