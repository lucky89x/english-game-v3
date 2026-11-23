extends RefCounted

const PARTS = ["Tunic","Belt","Sleeves","ArmGuards","Boots","Trousers","Coat","Panels","Pleated_Underskirt","Shoulder_Left","Shoulder_Right","WaistClasp"]

static func equip(character: Node3D, outfit: PackedScene) -> bool:
    var target := character.find_children("*", "Skeleton3D", true, false)
    if target.size() != 1 or outfit == null:
        return false
    var skeleton := target[0] as Skeleton3D
    var donor := outfit.instantiate()
    var replacements: Array[MeshInstance3D] = []
    for node in donor.find_children("*", "MeshInstance3D", true, false):
        if str(node.name) in PARTS:
            var part := node as MeshInstance3D
            if part.skin == null:
                donor.free()
                return false
            replacements.append(part)
    if replacements.is_empty():
        donor.free()
        return false
    for node in character.find_children("*", "MeshInstance3D", true, false):
        if str(node.name) in PARTS:
            node.free()
    for part in replacements:
        part.owner = null
        part.get_parent().remove_child(part)
        skeleton.add_child(part)
        part.skeleton = part.get_path_to(skeleton)
    donor.free()
    return true
