from pathlib import Path
import struct,json,hashlib
R=Path(__file__).resolve().parents[2];O=R/'artifacts/redesign03'
rows=[]
for p in sorted((R/'assets/redesign03').glob('*.glb')):
 b=p.read_bytes();magic,ver,size=struct.unpack_from('<III',b);assert magic==0x46546c67 and ver==2 and size==len(b)
 n=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+n]);assert all('uri' not in a for a in d.get('buffers',[])+d.get('images',[]))
 tri=sum(d['accessors'][pr['indices']]['count']//3 for node in d['nodes'] if 'mesh' in node for pr in d['meshes'][node['mesh']]['primitives'] if pr.get('mode',4)==4 and 'indices' in pr)
 rows.append(dict(file=p.name,bytes=len(b),triangles=tri,mesh_count=len(d.get('meshes',[])),materials=len(d.get('materials',[])),embedded_images=len(d.get('images',[])),joints=[len(s['joints']) for s in d.get('skins',[])],clips=[a.get('name') for a in d.get('animations',[])],sha256=hashlib.sha256(b).hexdigest()))
(O/'delivery_manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
for r in rows:print(r['file'],r['triangles'],'tri',r['materials'],'materials',r['bytes']//1024,'KiB',r['clips'])
