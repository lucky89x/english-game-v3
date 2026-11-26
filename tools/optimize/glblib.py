"""Pure-python GLB helpers (no Blender): read/write the JSON + BIN chunks, measure a file, swap embedded images.
Used by resize_textures.py and verify.py."""
import json, struct, io

def read_glb(path):
    return parse_glb(open(path, 'rb').read(), path)

def parse_glb(data, path='(bytes)'):
    magic, ver, total = struct.unpack('<4sII', data[:12])
    if magic != b'glTF': raise ValueError('not a GLB: ' + path)
    off, js, binc = 12, None, b''
    while off < len(data):
        ln, typ = struct.unpack('<II', data[off:off + 8]); chunk = data[off + 8:off + 8 + ln]
        if typ == 0x4E4F534A: js = json.loads(chunk.decode('utf8'))
        elif typ == 0x004E4942: binc = chunk
        off += 8 + ln
    return js, binc

def write_glb(path, js, binc):
    j = json.dumps(js, separators=(',', ':'), ensure_ascii=False).encode('utf8'); j += b' ' * (-len(j) % 4)
    binc = bytes(binc) + b'\0' * (-len(binc) % 4)
    total = 12 + 8 + len(j) + (8 + len(binc) if binc else 0)
    with open(path, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total)); f.write(struct.pack('<II', len(j), 0x4E4F534A)); f.write(j)
        if binc: f.write(struct.pack('<II', len(binc), 0x004E4942)); f.write(binc)

def view_bytes(js, binc, i):
    v = js['bufferViews'][i]; o = v.get('byteOffset', 0); return binc[o:o + v['byteLength']]

def rebuild(js, binc, replace):
    """replace: {bufferView index: new bytes}. Lays every view out again (4-byte aligned) and fixes byteOffset/byteLength."""
    out = bytearray()
    for i, v in enumerate(js.get('bufferViews', [])):
        b = replace[i] if i in replace else view_bytes(js, binc, i)
        out += b'\0' * (-len(out) % 4); v['byteOffset'] = len(out); v['byteLength'] = len(b); out += b
    out += b'\0' * (-len(out) % 4); js['buffers'][0]['byteLength'] = len(out); return bytes(out)

def image_size(b):
    from PIL import Image
    im = Image.open(io.BytesIO(b)); return im.format, im.size[0], im.size[1], im.mode

def stats(path):
    """Numbers that must survive an optimisation: triangles, bounding box, skins, joints, clips, images, vertex colours."""
    return stats_of(*read_glb(path))

def stats_of(js, binc):
    acc = js.get('accessors', [])
    tris = 0; lo = [1e9] * 3; hi = [-1e9] * 3; col = 0; uv = 0; prims = 0; names = []
    for m in js.get('meshes', []):
        names.append(m.get('name', ''))
        for p in m['primitives']:
            prims += 1; a = p['attributes']
            n = acc[p['indices']]['count'] if 'indices' in p else acc[a['POSITION']]['count']
            if p.get('mode', 4) == 4: tris += n // 3
            pa = acc[a['POSITION']]
            if 'min' in pa:
                for k in range(3): lo[k] = min(lo[k], pa['min'][k]); hi[k] = max(hi[k], pa['max'][k])
            col += 'COLOR_0' in a; uv += 'TEXCOORD_0' in a
    imgs = []; img_views = set(im['bufferView'] for im in js.get('images', []) if 'bufferView' in im)
    import hashlib
    data_hash = hashlib.md5(b''.join(view_bytes(js, binc, i) for i in range(len(js.get('bufferViews', []))) if i not in img_views)).hexdigest()
    for im in js.get('images', []):
        if 'bufferView' in im:
            b = view_bytes(js, binc, im['bufferView']); f, w, h, mode = image_size(b); imgs.append((f, w, h, len(b)))
    return dict(tris=tris, prims=prims, lo=lo, hi=hi, color=col, uv=uv, meshes=names, nodes=[n.get('name', '') for n in js.get('nodes', [])],
                materials=[m.get('name', '') for m in js.get('materials', [])], skins=len(js.get('skins', [])),
                joints=sum(len(s['joints']) for s in js.get('skins', [])), anims=[a.get('name', '') for a in js.get('animations', [])],
                channels=sum(len(a['channels']) for a in js.get('animations', [])), images=imgs, accessors=len(acc), data_hash=data_hash)
