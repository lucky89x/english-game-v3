from pathlib import Path
import json,struct,hashlib
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts/batch01'

def read(path):
    raw=path.read_bytes()
    magic,version,total=struct.unpack_from('<III',raw)
    assert magic==0x46546c67 and version==2 and total==len(raw)
    size,kind=struct.unpack_from('<II',raw,12)
    assert kind==0x4e4f534a
    doc=json.loads(raw[20:20+size])
    binary=raw[28+size:]
    return doc,binary

reports=[]
for path in sorted((ROOT/'assets/pilot_batch01').glob('*.glb')):
    doc,old=read(path)
    original_size=path.stat().st_size
    new=bytearray();seen={}
    for view in doc.get('bufferViews',[]):
        start=view.get('byteOffset',0);data=old[start:start+view['byteLength']]
        assert len(data)==view['byteLength']
        key=hashlib.sha256(data).hexdigest()
        if key not in seen:
            new+=b'\0'*((-len(new))%4)
            seen[key]=len(new);new+=data
        view['byteOffset']=seen[key]
    doc['buffers']=[{'byteLength':len(new)}]
    encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
    new+=b'\0'*((-len(new))%4)
    raw=struct.pack('<III',0x46546c67,2,28+len(encoded)+len(new))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(new),0x004e4942)+new
    path.write_bytes(raw)
    doc,binary=read(path)
    assert all('uri' not in x for kind in ['images','buffers'] for x in doc.get(kind,[]))
    textures=[]
    for img in doc.get('images',[]):
        view=doc['bufferViews'][img['bufferView']]
        data=binary[view['byteOffset']:view['byteOffset']+view['byteLength']]
        dims=list(struct.unpack_from('>II',data,16)) if data.startswith(b'\x89PNG') else None
        textures.append({'name':img.get('name',''),'mime':img['mimeType'],'size':dims,'bytes':len(data)})
    triangles=0
    for node in doc.get('nodes',[]):
        if 'mesh' in node:
            for prim in doc['meshes'][node['mesh']]['primitives']:
                if prim.get('mode',4)==4:
                    triangles+=doc['accessors'][prim.get('indices',prim['attributes']['POSITION'])]['count']//3
    report={'file':path.name,'bytes':len(raw),'before_dedup_bytes':original_size,'mesh_definitions':len(doc.get('meshes',[])), 'triangles_instanced':triangles,'materials':len(doc.get('materials',[])), 'textures':textures,'skins':[len(x['joints']) for x in doc.get('skins',[])], 'animations':[a.get('name') for a in doc.get('animations',[])], 'external_dependencies':False,'art_approved':False}
    reports.append(report)
    print(path.name,original_size,'->',len(raw),'bytes; triangles',triangles,'materials',report['materials'],'images',len(textures))
(OUT/'glb_structure.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')

before=json.loads((OUT/'gameplay_before.json').read_text())
changed=[p for p,digest in before.items() if not (ROOT/p).exists() or hashlib.sha256((ROOT/p).read_bytes()).hexdigest()!=digest]
(OUT/'gameplay_integrity.json').write_text(json.dumps({'tracked_files':len(before),'changed':changed},indent=2))
assert not changed,changed
print('Gameplay source hashes unchanged:',len(before))
