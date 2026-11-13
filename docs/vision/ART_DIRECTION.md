# Unified visual art direction — proposed specification

This is a production proposal for checkpoint A, not creative approval. The world
and homes are different views of the same settlement, with shared identities,
materials and palette. References describe complete compositions, not a checklist
of objects to enlarge and paste into a phone.

| Layer | Proposed specification / constraint |
| --- | --- |
| Overworld | Preserve existing top-down 32-world-pixel tile camera, paths, portals and management readability. No isometric camera conversion. |
| Exterior people | Preserve founder identity mapping; replace primitive final artwork only at the approved character checkpoint. |
| Home | One complete shelter diorama: roof, walls, both bunks, chairs/table, desk, stove, foundation and alien surroundings. No repeated floor or axis stretching. |
| Composition | Portrait keeps the complete house. Landscape can trim surplus sky/foreground, never the building or furniture. Negative space must establish the surrounding world. |
| Art source | Paired 768×1152 WebP composition assets, nearest-neighbour sampling. Do not generate a new style for each object. |
| Characters, checkpoint B | Authored sprite sheet; proposed 20–24 source-pixel bodies, founder coat/hair/skin/role identity, standing/seated/bed poses; establish final scale against the accepted furniture before rollout. |
| Perspective | Interior front cutaway with shallow floor depth, coherent with the furnished reference; building shell and exterior scene share that viewpoint. |
| Palette | Cold slate/blue/teal surroundings; lichen/stone vegetation; worn timber, ceramic, fabric and restrained warm lamplight. Avoid luxury dashboard gold. |
| Lighting | Read real time, weather, actual indoor occupancy, sleeping/awake state and available grid power. Warm occupied homes contrast with cold outside. No fabricated fire/fuel/smoke state. |
| Layering | Background/shell → room back → furniture backs → residents sorted by anchor y → authored furniture-front masks → subtle lighting. Masks and poses come after framing approval. |
| Motion | Low-amplitude authored cycles, roughly 4–8 fps per sprite pose; walking/transition separate from simulation. Reduced Motion removes decorative cycles and transition travel. |
| Controls | Field labels and equipment-like sans/monospace marks; 44 CSS-pixel targets; safe-area margins; concise context. Separate inspect, enter and manage. No large dashboard over the room. |
| Budget | Interior surface capped at one million backing pixels, balanced density ≤1.5, performance density 1; one same-sized cache. Re-measure on resize/entry, not every frame. Honour 30-Hz performance draw limit. |

The composition assets contain no residents or smoke. Painted furnishings do not
establish a new inventory or domestic history system. The night-lit plate is used
only for actual powered occupancy; empty/unpowered rooms use the neutral plate
with a cold night treatment. Sleeping households dim. These are checkpoint-A
lighting treatments, to be reviewed for actual light falloff before expansion.

## Reference inventory and uncertainty

The 13 November attachments actually supplied here show (1) a multi-storey domed
space cutaway, (2) a dark organic/industrial interior, and (3) an isometric frontier
colony at dusk. They do not match the three A/B/C descriptions verbatim. Their
useful common lessons are complete building silhouettes, human-scale spaces,
atmospheric surroundings, readable purpose and inhabited light. They are not
production assets or permission to change the top-down camera.

The described new single-home concept and original affectionate cozy-room image
are not present among these three attachments. Review against the described
composition and retained furnished-room source is possible; exact reference
fidelity to missing images is not claimed. Kyle/Atlas should resolve the reference
mapping at checkpoint A, before artwork/occlusion positions are locked.

## Asset provenance

Checkpoint-A paired scene assets are generated from the existing furnished room,
not in-engine proof by themselves. Prompt intent: retain the entire room, build a
complete modest frontier house around it, surround it with a vast cold alien
landscape, no people/UI/repeated floors; produce matched day/night lighting.
A separate edit removed painted chimney smoke. Real gameplay captures must show
these assets consumed by the actual home-view system. Geometry drift between
variants remains a visual-review risk; do not build resident anchors until approved.

## A2 revision after Kyle/Atlas review — not yet approved

A1's direction was welcomed, but its scale, plain margins and generic controls were
rejected. Preserve A1 at `recovery/home-composition-a1` / `988e3ac629d1b0e0e09edabd851a88c3c7570af7`.

The initial layered portrait prototype was rejected internally after rendering:
a narrow ground strip produced oversized foreground rocks. The revised portrait
uses a continuous 768×1660 day/night composition, not a collection of scaled
strips. Uniform cover may trim surplus sky/ground on shorter phones, never the
house. Landscape retains a complete-house crop with restrained contextual sky and
ground around it. Original A1 assets remain unchanged.

The actual house is already nearly phone-width, so portrait has a physical limit
to full-room detail. Provide an explicit 1.7× Room camera with bounded drag/keyboard
navigation and a one-tap Whole home return. Do not represent a cropped close view
as a full-house view. Both views require actual 390×844 gameplay evidence and
creative review. No fixed 16:9 requirement applies.

Controls are small field marks with one consistent line-icon system and readable
labels over scene-aware shading. No filled button tray, gold dashboard borders or
serif headings in home mode. Resident artwork remains prohibited until approval.
The paired continuous portrait assets are introduced by this revision; no save fields are added.
