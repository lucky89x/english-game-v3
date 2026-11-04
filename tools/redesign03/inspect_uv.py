import bpy
from pathlib import Path
bpy.ops.wm.open_mainfile(filepath=str(Path('backups/redesign03/pre_atlas/ngoc_adventurer.blend').resolve()))
for n in ['Moss green pack','Cinnamon leather.001','Warm parchment']:
 m=bpy.data.materials[n];print(n)
 for node in m.node_tree.nodes:
  print(node.type,node.name,[(i.name,list(i.default_value) if hasattr(i.default_value,'__iter__') else i.default_value) for i in node.inputs if hasattr(i,'default_value') and not i.is_linked][:5])
 for l in m.node_tree.links:print(l.from_node.type,l.from_socket.name,'->',l.to_node.type,l.to_socket.name)
