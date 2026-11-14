# Aya B1 asset provenance

13 November 2026. Built-in image generation/editing; transparent PNG output.
Runtime-consumed asset: `assets/residents/aya-world-b1.png`, with frame-bound
metadata in `assets/residents/aya-world-b1.json`. The original world/home atlases
remain unchanged and recoverable. Generated source is copied without repainting.

Edit target: original `aya-world.png`. Identity/proportion reference: original
`aya-home.png`. Direction: preserve Aya's short dark wavy bob, peach skin,
ochre collared pocketed jacket, dark undershirt, slate trousers and brown boots;
reduce the exterior's oversized head towards the interior adult proportions;
retain four-direction three-quarter top-down exterior camera and the existing
4×3 frame order; use crisp clustered pixels, limited shading, no blur or ground.
Uniform scale, baseline and head size; transparent empty cell spacing; no text.

One corrective follow-up was applied to the first candidate: keep identity,
style and idle/side frames; correct front/back walking legs only. Middle row
columns 1/3 lead with the screen-left boot, columns 2/4 lead with screen-right;
separate grounded boots and opposite arm swing, without adding frames or a new
character style. This is the final asset, not the first candidate.

Frame order: front/back/left/right idle; front A/B and back A/B; left A/B and
right A/B. Sidecar bounds use alpha >160 to exclude near-transparent generation
noise from crop measurement. Runtime retains original alpha and nearest-neighbour
samples; frame cutouts are bounded and cached. No image is a gameplay approval.

## Integrity

- `assets/residents/aya-world-b1.png` — SHA-256 `5db4308666ded5e7f2c0182a20548f97e9d611c7f5730342b7358717208f8d0c`
- `assets/residents/aya-world-b1.json` — SHA-256 `a0a3fdf74ecf1125b4d7e6523a37dcddd7fb0e1fe6bed70a06a20539fa77cbdd`
- `assets/residents/aya-home.png` — SHA-256 `9761119287bd1bd7cd1c91ca4eff0d111bd5ea6b08016e7c4d691d2d324b3acf`
- `assets/residents/aya-home.json` — SHA-256 `1b513ec6d0e51906678839c777a7eaf4ad4fef6a00c75d1eea70f61ea58eac48`
