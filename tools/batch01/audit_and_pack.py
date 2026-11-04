"""Reproducible audit and lossless glTF->GLB packing, NOT concept modelling."""
from pathlib import Path
import json, csv, hashlib, struct, shutil, urllib.parse, base64
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/batch01'
OUT.mkdir(parents=True, exist_ok=True)
SPEC = ROOT / 'assets/EnglishQuestV3_Asset_Spec_Codex_2026-11-03/EnglishQuestV3_Asset_Spec_Codex_2026-11-03'

def snapshot():
    records = {}
    backup = ROOT / 'backups/before_asset_batch01_20261103'
    for folder in ['world','scripts','systems','characters','npc','ui','tests']:
        for path in (ROOT/folder).rglob('*'):
            if path.is_file():
                records[str(path.relative_to(ROOT))] = hashlib.sha256(path.read_bytes()).hexdigest()
                target = backup/path.relative_to(ROOT)
                target.parent.mkdir(parents=True, exist_ok=True)
                if not target.exists(): shutil.copy2(path, target)
    for name in ['project.godot','main_world.tscn']:
        path=ROOT/name
        records[name]=hashlib.sha256(path.read_bytes()).hexdigest()
        if not (backup/name).exists(): shutil.copy2(path,backup/name)
    if not (backup/'.gdignore').exists(): (backup/'.gdignore').touch()
    target=OUT/'gameplay_before.json'
    if not target.exists(): target.write_text(json.dumps(records,indent=2),encoding='utf-8')

def audit():
    manifest = json.loads((SPEC/'03_MANIFEST/ASSET_MANIFEST.json').read_text(encoding='utf-8'))
    rows = list(csv.DictReader((SPEC/'03_MANIFEST/ASSET_MANIFEST.csv').open(encoding='utf-8-sig')))
    assert rows == manifest['assets'] and len(rows)==105
    inventory=[]
    for path in sorted((ROOT/'assets').rglob('*.gltf')):
        doc=json.loads(path.read_text(encoding='utf-8'))
        inventory.append({'path':str(path.relative_to(ROOT)), 'meshes':len(doc.get('meshes',[])),
          'skins':len(doc.get('skins',[])), 'joints':[len(s['joints']) for s in doc.get('skins',[])],
          'animations':[a.get('name','') for a in doc.get('animations',[])], 'materials':len(doc.get('materials',[])),
          'textures':len(doc.get('textures',[])), 'missing_external_files':[x['uri'] for kind in ['buffers','images'] for x in doc.get(kind,[]) if 'uri' in x and not x['uri'].startswith('data:') and not (path.parent/urllib.parse.unquote(x['uri'])).exists()]})
    (OUT/'asset_inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2),encoding='utf-8')
    sources=[str(p.relative_to(ROOT)) for p in (ROOT/'assets').rglob('*.blend')]
    (OUT/'blend_sources.json').write_text(json.dumps(sources,indent=2),encoding='utf-8')
    for row in rows:
        row['target_exists']=str((ROOT/row['target_path']).exists())
        row['review_status']='BLOCKED_MISSING_ASSET' if row['priority']=='P0' else 'OUT_OF_BATCH_01'
    with (OUT/'manifest_audit.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
    print('Manifest JSON/CSV identical: 105. glTF files:',len(inventory),'Blend sources:',len(sources))

def pack(source, name):
    path=ROOT/source
    doc=json.loads(path.read_text(encoding='utf-8'))
    binary=bytearray(); offsets=[]
    def uri_bytes(uri):
        return base64.b64decode(uri.split(',',1)[1]) if uri.startswith('data:') else (path.parent/urllib.parse.unquote(uri)).read_bytes()
    def append(data):
        while len(binary)%4: binary.append(0)
        start=len(binary); binary.extend(data); return start
    for buf in doc.get('buffers',[]):
        offsets.append(append(uri_bytes(buf['uri'])))
    for view in doc.get('bufferViews',[]):
        view['byteOffset']=view.get('byteOffset',0)+offsets[view.get('buffer',0)];view['buffer']=0
    for img in doc.get('images',[]):
        if 'uri' in img:
            data=uri_bytes(img.pop('uri')); start=append(data)
            img['bufferView']=len(doc.setdefault('bufferViews',[]))
            img['mimeType']='image/png' if data.startswith(b'\x89PNG') else 'image/jpeg'
            doc['bufferViews'].append({'buffer':0,'byteOffset':start,'byteLength':len(data)})
    doc['buffers']=[{'byteLength':len(binary)}]
    doc.setdefault('asset',{})['extras']={'source':source,'author':'Quaternius','license':'CC0 per bundled License.txt','art_status':'BLOCKED_MISSING_ASSET','note':'Technical baseline only; NOT Ngoc/Tom concept model. No new animations authored.'}
    encoded=json.dumps(doc,separators=(',',':')).encode(); encoded+=b' '*((-len(encoded))%4)
    binary+=b'\0'*((-len(binary))%4)
    glb=struct.pack('<III',0x46546c67,2,28+len(encoded)+len(binary))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(binary),0x004e4942)+binary
    target=ROOT/'assets/pilot_batch01'/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(glb)
    print('Packed',name,len(glb),'bytes; clips:',[a['name'] for a in doc.get('animations',[])])

if __name__=='__main__':
    snapshot();audit()
    pack('assets/Ultimate Modular Women - April 2022/Individual Characters/glTF/Adventurer.gltf','chr_quaternius_adventurer_baseline_v01.glb')
    pack('assets/RPG Characters - Nov 2020/glTF/Wizard.gltf','npc_quaternius_wizard_baseline_v01.glb')
