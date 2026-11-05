"""
Blender 5.2 Python script to generate an authoritative 3D model of the SiGe HBT
based on the reference cross-section diagram and color palette:
Palette:
- #173F5F (Deep Navy): P- Substrate, P+ Isolation Wells
- #20639B (Ocean Blue): N+ Emitter, N- Epitaxy
- #3CAEA3 (Muted Teal): P Base (SiGe Extrinsic)
- #F6D55C (Golden Yellow): N+ Buried Layer, Collector Sinker
- #ED553B (Coral Red): Intrinsic Active Transistor Core
- #78808A (Pewter/Metal): Metal Contacts (B, E, C, S)
- #DDE5ED (Soft Slate): Field Oxide / STI Passivation
"""

import bpy
import bmesh
import math
import os

# Ensure clean scene
bpy.ops.wm.read_factory_settings(use_empty=True)

def srgb_to_linear(hex_code):
    hex_code = hex_code.lstrip('#')
    r, g, b = [int(hex_code[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    def to_lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (to_lin(r), to_lin(g), to_lin(b), 1.0)

# Colors from user palette
PALETTE = {
    'substrate_navy': '#173F5F',
    'emitter_blue': '#20639B',
    'base_teal': '#3CAEA3',
    'buried_yellow': '#F6D55C',
    'intrinsic_coral': '#ED553B',
    'contact_metal': '#78808A',
    'oxide_slate': '#DDE5ED',
}

def create_pbr_material(name, hex_color, roughness=0.45, metallic=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = srgb_to_linear(hex_color)
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metallic
        if alpha < 1.0:
            if 'Alpha' in bsdf.inputs:
                bsdf.inputs['Alpha'].default_value = alpha
            mat.blend_method = 'BLEND'
    return mat

materials = {
    'substrate': create_pbr_material('Mat_Substrate_Navy', PALETTE['substrate_navy'], roughness=0.55),
    'isolation': create_pbr_material('Mat_Isolation_Navy', PALETTE['substrate_navy'], roughness=0.50),
    'emitter': create_pbr_material('Mat_Emitter_Blue', PALETTE['emitter_blue'], roughness=0.40),
    'epitaxy': create_pbr_material('Mat_Epi_Blue', PALETTE['emitter_blue'], roughness=0.50),
    'base': create_pbr_material('Mat_Base_Teal', PALETTE['base_teal'], roughness=0.45),
    'buried_layer': create_pbr_material('Mat_Buried_Yellow', PALETTE['buried_yellow'], roughness=0.40),
    'sinker': create_pbr_material('Mat_Sinker_Yellow', PALETTE['buried_yellow'], roughness=0.40),
    'intrinsic_core': create_pbr_material('Mat_Intrinsic_Coral', PALETTE['intrinsic_coral'], roughness=0.35),
    'contact': create_pbr_material('Mat_Contact_Metal', PALETTE['contact_metal'], roughness=0.25, metallic=0.75),
    'oxide': create_pbr_material('Mat_Oxide_Passivation', PALETTE['oxide_slate'], roughness=0.30, alpha=0.92),
}

SCALE = 10.0 # 1 um = 10 Blender units

def create_extruded_polygon(name, poly_pts, z_min=-0.50, z_max=0.50, material=None):
    """Creates a 3D prism from 2D polygon points extruded along Z."""
    mesh = bpy.data.meshes.new(name=f"{name}_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    
    # Bottom face vertices (at z_min)
    z0 = z_min * SCALE
    z1 = z_max * SCALE
    
    verts_bottom = [bm.verts.new((x * SCALE, y * SCALE, z0)) for x, y in poly_pts]
    face_bottom = bm.faces.new(reversed(verts_bottom)) # normal pointing -Z
    
    # Extrude along Z
    geom = bmesh.ops.extrude_face_region(bm, geom=[face_bottom])
    verts_extruded = [v for v in geom['geom'] if isinstance(v, bmesh.types.BMVert)]
    del_faces = [f for f in geom['geom'] if isinstance(f, bmesh.types.BMFace)]
    
    # Translate top vertices to z1
    bmesh.ops.translate(bm, vec=(0.0, 0.0, z1 - z0), verts=verts_extruded)
    
    # Recalculate face normals
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()

    if material:
        obj.data.materials.append(material)

    # Add Bevel modifier for publication-grade specular edges
    bev = obj.modifiers.new(name="Bevel", type='BEVEL')
    bev.width = 0.06
    bev.segments = 2
    bev.limit_method = 'ANGLE'
    bev.angle_limit = math.radians(40)

    return obj

# 1. P- Substrate Foundation Block
create_extruded_polygon(
    'P_Substrate_Bulk',
    [
        (-1.05, -0.55),
        (1.35, -0.55),
        (1.35, -0.10),
        (0.80, -0.10),
        (0.80, -0.26),
        (-1.05, -0.26),
    ],
    z_min=-0.50, z_max=0.50,
    material=materials['substrate']
)

# 2. N+ Buried Layer (Subcollector)
create_extruded_polygon(
    'N_Plus_Buried_Layer',
    [
        (-0.80, -0.26),
        (0.80, -0.26),
        (0.80, -0.10),
        (-0.80, -0.10),
    ],
    z_min=-0.48, z_max=0.48,
    material=materials['buried_layer']
)

# 3. Collector Sinker Column
create_extruded_polygon(
    'Collector_Sinker',
    [
        (0.55, -0.10),
        (0.80, -0.10),
        (0.80, 0.10),
        (0.55, 0.10),
    ],
    z_min=-0.46, z_max=0.46,
    material=materials['sinker']
)

# 4. P+ Deep Isolation Wells
create_extruded_polygon(
    'P_Plus_Isolation_Well_Center',
    [
        (0.80, -0.45),
        (0.98, -0.45),
        (0.98, 0.10),
        (0.80, 0.10),
    ],
    z_min=-0.48, z_max=0.48,
    material=materials['isolation']
)

create_extruded_polygon(
    'P_Plus_Isolation_Well_Right',
    [
        (1.22, -0.45),
        (1.35, -0.45),
        (1.35, 0.10),
        (1.22, 0.10),
    ],
    z_min=-0.48, z_max=0.48,
    material=materials['isolation']
)

# 5. N- Epitaxy Layer
create_extruded_polygon(
    'N_Minus_Epitaxy',
    [
        (-0.80, -0.10),
        (0.55, -0.10),
        (0.55, -0.02),
        (-0.80, -0.02),
    ],
    z_min=-0.46, z_max=0.46,
    material=materials['epitaxy']
)

# 6. P Base (SiGe Extrinsic Base)
create_extruded_polygon(
    'P_Base_SiGe_Extrinsic',
    [
        (-0.75, -0.02),
        (-0.08, -0.02),
        (-0.08, 0.10),
        (-0.75, 0.10),
    ],
    z_min=-0.46, z_max=0.46,
    material=materials['base']
)

# 7. Intrinsic Active Transistor Core (Active BE & BC zone, Coral Red)
create_extruded_polygon(
    'Intrinsic_Active_Transistor_Core',
    [
        (-0.08, -0.08),
        (0.38, -0.08),
        (0.38, 0.03),
        (-0.08, 0.03),
    ],
    z_min=-0.45, z_max=0.45,
    material=materials['intrinsic_core']
)

# 8. N+ Emitter
create_extruded_polygon(
    'N_Plus_Emitter',
    [
        (-0.02, 0.03),
        (0.28, 0.03),
        (0.28, 0.10),
        (-0.02, 0.10),
    ],
    z_min=-0.45, z_max=0.45,
    material=materials['emitter']
)

# 9. Top Passivation / Field Oxide (STI)
create_extruded_polygon(
    'Oxide_Passivation_Left',
    [
        (-1.05, 0.10),
        (-0.75, 0.10),
        (-0.75, 0.14),
        (-1.05, 0.14),
    ],
    z_min=-0.48, z_max=0.48,
    material=materials['oxide']
)

create_extruded_polygon(
    'Oxide_Passivation_BE',
    [
        (-0.55, 0.10),
        (0.02, 0.10),
        (0.02, 0.14),
        (-0.55, 0.14),
    ],
    z_min=-0.48, z_max=0.48,
    material=materials['oxide']
)

create_extruded_polygon(
    'Oxide_Passivation_EC',
    [
        (0.24, 0.10),
        (0.58, 0.10),
        (0.58, 0.14),
        (0.24, 0.14),
    ],
    z_min=-0.48, z_max=0.48,
    material=materials['oxide']
)

create_extruded_polygon(
    'Oxide_Passivation_CS',
    [
        (0.78, 0.10),
        (1.00, 0.10),
        (1.00, 0.14),
        (0.78, 0.14),
    ],
    z_min=-0.48, z_max=0.48,
    material=materials['oxide']
)

create_extruded_polygon(
    'Oxide_Passivation_Right',
    [
        (1.20, 0.10),
        (1.35, 0.10),
        (1.35, 0.14),
        (1.20, 0.14),
    ],
    z_min=-0.48, z_max=0.48,
    material=materials['oxide']
)

# 10. Metal Contacts on Top (B, E, C, S)
contacts_def = [
    ('Contact_Base', -0.75, -0.55),
    ('Contact_Emitter', 0.02, 0.24),
    ('Contact_Collector', 0.58, 0.78),
    ('Contact_Substrate', 1.00, 1.20),
]

for name, x0, x1 in contacts_def:
    create_extruded_polygon(
        name,
        [
            (x0, 0.10),
            (x1, 0.10),
            (x1, 0.14),
            (x0, 0.14),
        ],
        z_min=-0.45, z_max=0.45,
        material=materials['contact']
    )

# 11. Add Lead Stems and Terminal Spheres for B, E, C, S
terminals_pos = [
    ('Terminal_B', -0.65, 0.14, 0.34),
    ('Terminal_E', 0.13, 0.14, 0.34),
    ('Terminal_C', 0.68, 0.14, 0.34),
    ('Terminal_S', 1.10, 0.14, 0.34),
]

mat_wire = create_pbr_material('Mat_Wire', '#ED553B', roughness=0.2, metallic=0.9)

for term_name, tx, ty_base, ty_top in terminals_pos:
    # Vertical cylinder lead
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.08,
        depth=(ty_top - ty_base) * SCALE,
        location=(tx * SCALE, ((ty_base + ty_top) / 2) * SCALE, 0.0)
    )
    cyl = bpy.context.active_object
    cyl.name = f"{term_name}_Stem"
    cyl.data.materials.append(mat_wire)

    # Terminal Sphere
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.22,
        location=(tx * SCALE, ty_top * SCALE, 0.0)
    )
    sph = bpy.context.active_object
    sph.name = term_name
    sph.data.materials.append(mat_wire)

# Studio Lights
bpy.ops.object.light_add(type='SUN', location=(10.0, 25.0, 30.0))
sun = bpy.context.active_object
sun.data.energy = 4.0
sun.data.color = (1.0, 0.98, 0.95)

bpy.ops.object.light_add(type='AREA', location=(-20.0, 15.0, 20.0))
area1 = bpy.context.active_object
area1.data.energy = 150.0
area1.data.size = 15.0
area1.data.color = (0.85, 0.92, 1.0)

bpy.ops.object.light_add(type='AREA', location=(0.0, -20.0, -15.0))
area2 = bpy.context.active_object
area2.data.energy = 80.0
area2.data.size = 10.0
area2.data.color = (1.0, 0.95, 0.88)

# Camera Setup
bpy.ops.object.camera_add(location=(1.5, -34.0, 16.0))
cam = bpy.context.active_object
cam.name = "Studio_Camera"
cam.data.lens = 55
# Point camera towards center of model (1.5, -1.5, 0.0)
cam.rotation_euler = (math.radians(65.0), 0.0, math.radians(0.0))
bpy.context.scene.camera = cam

# Set render settings
bpy.context.scene.render.engine = 'BLENDER_EEVEE'
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080
bpy.context.scene.render.film_transparent = True

# Export GLB to public/models/ and dist/models/
os.makedirs('public/models', exist_ok=True)
os.makedirs('dist/models', exist_ok=True)

glb_path_pub = os.path.abspath('public/models/sige_hbt_sentaurus.glb')
glb_path_dist = os.path.abspath('dist/models/sige_hbt_sentaurus.glb')

print(f"Exporting GLB to: {glb_path_pub}")
bpy.ops.export_scene.gltf(
    filepath=glb_path_pub,
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_materials='EXPORT',
)

if os.path.exists(glb_path_pub):
    import shutil
    shutil.copyfile(glb_path_pub, glb_path_dist)
    print(f"Copied to: {glb_path_dist}")

# Render preview image
render_path = os.path.abspath('public/models/sige_hbt_sentaurus_preview.png')
bpy.context.scene.render.filepath = render_path
bpy.ops.render.render(write_still=True)
print(f"Rendered preview image: {render_path}")

print("=== BLENDER 3D MODEL GENERATION COMPLETE ===")
