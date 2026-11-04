"""Bake the final Ngoc source to three materials, preserving rig and authored colors.

Run only AFTER build_ngoc.py has exported the final corrected prop colors:
  blender --background --python tools/redesign03/bake_ngoc_atlas.py

All rendering is Cycles CPU diffuse COLOR only (no direct/indirect illumination).
Sources are backed up and final files are replaced only after staged validation.
"""
import bpy
import json
import math
import os
from pathlib import Path
import shutil
import struct
import time

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "art_source/redesign03/ngoc_adventurer.blend"
FINAL = ROOT / "assets/redesign03/ngoc_adventurer.glb"
STAGE = ROOT / "art_source/redesign03/atlas_stage"
BACKUP = ROOT / "backups/redesign03/pre_atlas"
REPORT = ROOT / "artifacts/redesign03/ngoc_atlas_bake.json"
SIZE = 2048
STAGE.mkdir(parents=True, exist_ok=True)
BACKUP.mkdir(parents=True, exist_ok=True)
if not (BACKUP / ".gdignore").exists(): (BACKUP / ".gdignore").touch()


def glb_json(path):
    raw = path.read_bytes()
    magic, version, length = struct.unpack_from("<III", raw)
    assert magic == 0x46546C67 and version == 2 and length == len(raw)
    chunk_length, chunk_type = struct.unpack_from("<II", raw, 12)
    assert chunk_type == 0x4E4F534A
    return json.loads(raw[20:20 + chunk_length])


def classify(material):
    principal = next((n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    assert principal is not None, "No Principled material: " + material.name
    roughness = float(principal.inputs["Roughness"].default_value)
    metallic = float(principal.inputs["Metallic"].default_value)
    name = material.name.lower()
    if any(token in name for token in ["lens", "glass", "liquid", "potionblue"]):
        return 2
    if metallic > 0.35 or any(token in name for token in ["gold", "brass", "copper", "metal"]):
        return 1
    return 0


started = time.monotonic()
assert SOURCE.exists() and FINAL.exists()
original_doc = glb_json(FINAL)
expected_clips = {a["name"] for a in original_doc.get("animations", [])}
expected_joints = len(original_doc["skins"][0]["joints"])
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
rig = next(obj for obj in bpy.data.objects if obj.type == "ARMATURE")
meshes = [obj for obj in bpy.data.objects if obj.type == "MESH" and not obj.hide_render]
assert meshes
vertices_before = sum(len(obj.data.vertices) for obj in meshes)
polygons_before = sum(len(obj.data.polygons) for obj in meshes)
actions_before = {action.name for action in bpy.data.actions}
original_pose_position = rig.data.pose_position
rig.data.pose_position = "REST"

# Preserve original UV coordinates explicitly, regardless of which UV layer is
# later selected for the destination bake. Shared materials all use this name.
materials = set()
for obj in meshes:
    assert any(mod.type == "ARMATURE" and mod.object == rig for mod in obj.modifiers), obj.name
    source_uv = obj.data.uv_layers.active
    assert source_uv is not None, "Unmapped source object: " + obj.name
    old_name = source_uv.name
    source_uv.name = "SourceUV"
    for material in obj.data.materials:
        assert material and material.use_nodes
        materials.add(material)
        for node in material.node_tree.nodes:
            if node.type == "UVMAP" and node.uv_map == old_name:
                node.uv_map = "SourceUV"
    obj.data.uv_layers.new(name="BakeUV")

for material in materials:
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    source = nodes.new("ShaderNodeUVMap")
    source.name = "AtlasBake_PreservedSourceUV"
    source.uv_map = "SourceUV"
    for node in list(nodes):
        if node.type == "TEX_IMAGE" and not node.inputs["Vector"].is_linked:
            links.new(source.outputs["UV"], node.inputs["Vector"])
        elif node.type == "TEX_COORD":
            # Explicit UVMap replaces only implicit UV output, preserving
            # Generated/Object/etc. coordinates if a source uses them.
            for link in list(node.outputs["UV"].links):
                destination = link.to_socket
                links.remove(link)
                links.new(source.outputs["UV"], destination)

bpy.ops.object.select_all(action="DESELECT")
for obj in meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.join()
body = bpy.context.object
body.name = "Ngoc_SkinnedAtlas"
# Reduce before UV packing in rest pose, preserving skin groups.
reduce=body.modifiers.new("Game mesh reduction", "DECIMATE")
reduce.ratio=0.32
while body.modifiers.find(reduce.name)>0:
    bpy.ops.object.modifier_move_up(modifier=reduce.name)
bpy.ops.object.modifier_apply(modifier=reduce.name)
assert all(len(vertex.groups)>0 for vertex in body.data.vertices), "Lost skin weights"
vertices_after=len(body.data.vertices)
polygons_after=len(body.data.polygons)
body.data.uv_layers.active = body.data.uv_layers["BakeUV"]
body.data.uv_layers["BakeUV"].active_render = True

bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003)
bpy.ops.object.mode_set(mode="OBJECT")

atlas = bpy.data.images.new("Ngoc_Baked_BaseColor_2K", width=SIZE, height=SIZE, alpha=True)
atlas.colorspace_settings.name = "sRGB"
atlas.generated_color = (0, 0, 0, 1)
for material in body.data.materials:
    nodes = material.node_tree.nodes
    for node in nodes:
        node.select = False
    target = nodes.new("ShaderNodeTexImage")
    target.name = "AtlasBake_Destination"
    target.image = atlas
    target.select = True
    nodes.active = target

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 1
scene.render.bake.use_pass_direct = False
scene.render.bake.use_pass_indirect = False
scene.render.bake.use_pass_color = True
scene.render.bake.use_selected_to_active = False
scene.render.bake.use_clear = True
scene.render.bake.margin = 8
print("NGOC_ATLAS_BAKE_START", SIZE, len(body.data.materials), flush=True)
# Emission bake preserves albedo of metallic parts too (diffuse bake makes metal black).
for material in body.data.materials:
    nodes=material.node_tree.nodes;links=material.node_tree.links
    principal=next(n for n in nodes if n.type=="BSDF_PRINCIPLED")
    output=next(n for n in nodes if n.type=="OUTPUT_MATERIAL")
    emission=nodes.new("ShaderNodeEmission")
    color=principal.inputs["Base Color"]
    if color.is_linked:links.new(color.links[0].from_socket,emission.inputs["Color"])
    else:emission.inputs["Color"].default_value=color.default_value
    links.new(emission.outputs[0],output.inputs["Surface"])
bpy.ops.object.bake(type="EMIT")

# Validate nonempty colors before replacing any source or final model.
import numpy as np
pixels = np.empty(SIZE * SIZE * 4, dtype=np.float32)
atlas.pixels.foreach_get(pixels)
rgb = pixels.reshape(-1, 4)[:, :3]
colored = rgb.max(axis=1) > 0.025
assert float(colored.mean()) > 0.08, "Bake appears empty"
assert float(rgb[colored].std()) > 0.025, "Bake lost color variation"
atlas_path = STAGE / "ngoc_baked_basecolor_2k.png"
atlas.filepath_raw = str(atlas_path)
atlas.file_format = "PNG"
atlas.save()
atlas.pack()

categories = [classify(material) for material in body.data.materials]
face_categories = [categories[face.material_index] for face in body.data.polygons]
body.data.materials.clear()
for name, metallic, roughness in [
    ("Ngoc_ClothSkin", 0.0, 0.68),
    ("Ngoc_Brass", 0.65, 0.28),
    ("Ngoc_Glass", 0.20, 0.16),
]:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    principal = nodes.get("Principled BSDF")
    principal.inputs["Metallic"].default_value = metallic
    principal.inputs["Roughness"].default_value = roughness
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = atlas
    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "BakeUV"
    material.node_tree.links.new(uv.outputs["UV"], texture.inputs["Vector"])
    material.node_tree.links.new(texture.outputs["Color"], principal.inputs["Base Color"])
    body.data.materials.append(material)
for face, category in zip(body.data.polygons, face_categories):
    face.material_index = category

assert {action.name for action in bpy.data.actions} == actions_before
assert len(body.data.vertices) == vertices_after
rig.data.pose_position = original_pose_position
bpy.ops.object.select_all(action="DESELECT")
body.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
blend_path = STAGE / "ngoc_adventurer.blend"
glb_path = STAGE / "ngoc_adventurer.glb"
bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
bpy.ops.export_scene.gltf(
    filepath=str(glb_path), export_format="GLB", use_selection=True,
    export_animations=True, export_animation_mode="NLA_TRACKS",
    export_force_sampling=True, export_skins=True, export_morph=False,
)
doc = glb_json(glb_path)
assert len(doc.get("materials", [])) <= 3
assert len(doc.get("meshes", [])) == 1
assert {a["name"] for a in doc.get("animations", [])} == expected_clips
assert len(doc["skins"][0]["joints"]) == expected_joints
assert doc.get("images") and all("bufferView" in image and "uri" not in image for image in doc["images"])
assert all("JOINTS_0" in p["attributes"] and "WEIGHTS_0" in p["attributes"] for p in doc["meshes"][0]["primitives"])

# Backup validated inputs once. Stage all outputs in their destination folder
# before os.replace so readers cannot observe partially written GLB files.
for path in [SOURCE, FINAL]:
    backup = BACKUP / path.name
    if not backup.exists():
        shutil.copy2(path, backup)
for source, target in [(blend_path, SOURCE), (glb_path, FINAL), (atlas_path, FINAL.parent / atlas_path.name)]:
    pending = target.with_name(target.name + ".atlas_pending")
    shutil.copy2(source, pending)
    os.replace(pending, target)
report = {
    "source": str(SOURCE.relative_to(ROOT)),
    "output": str(FINAL.relative_to(ROOT)),
    "texture_size": SIZE, "texture_colored_fraction": float(colored.mean()),
    "before_materials": len(original_doc.get("materials", [])),
    "after_materials": len(doc.get("materials", [])),
    "before_meshes": len(original_doc.get("meshes", [])),
    "after_meshes": len(doc.get("meshes", [])),
    "vertices_before": vertices_before, "vertices_after":vertices_after, "polygons_before":polygons_before, "polygons_after":polygons_after,
    "joints": expected_joints, "clips": sorted(expected_clips),
    "bake": "Cycles CPU, emission albedo only, no lighting",
    "seconds": time.monotonic() - started,
    "status": "STRUCTURE_VALIDATED_REQUIRES_RUNTIME_COLOR_REVIEW",
}
REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
print("NGOC_ATLAS_COMPLETE", json.dumps(report), flush=True)
