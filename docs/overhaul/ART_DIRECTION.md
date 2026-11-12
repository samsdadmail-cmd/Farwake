# Occupied places

The home plate is an empty room. The application adds only actual indoor occupants
and derives lighting from their awake/rest activities. No relationship is implied
by two residents reading independently. Camp and workplace interiors retain their
distinct procedural layouts. Rain and daytime modify the window, not the economy.

`interior-home.webp` is a 109 KB web export of an image created with the built-in
image generation tool, then refined to match the game's pixel language. No people
are baked into the plate. The original generation files were retained separately.
The image is loaded lazily, shared across rooms and has a procedural fallback.

Final refinement prompt:

> Edit target: the supplied empty FARWAKE frontier home. Preserve the exact room
> layout, furniture positions, sci-fi identity, empty seats, empty beds, tool desk
> and cool alien view. Convert the entire image into true handcrafted LOW RESOLUTION
> PIXEL ART. It must visibly read as an approximately 400 by 225 pixel game background
> enlarged with NEAREST NEIGHBOUR, with hard square pixel edges, chunky deliberate
> pixel clusters, limited palette and clean stair-step lines. NO painted brushwork,
> NO smooth high-resolution texture, NO realistic tiny detail, NO antialiased smooth
> curves, NO photographic shading. Simplify material texture into purposeful 1-3
> pixel marks, preserve the cozy rich arrangement and shape silhouettes. Comparable
> to a polished premium pixel-art RPG room, not a digital painting with a pixel filter.
> Maintain dim neutral ambient light and no people, silhouettes, fire, bright lamps,
> text, logos or interface. No new objects. This is the actual in-game background
> with separately animated occupants.

Layout: two bunks at left; central seating around a low table; desk at right;
window onto the alien landscape. Additional real residents use authored positions,
with additional sleeping residents shown on individual bedrolls. This is a selected
home close-up, not a navigable interior/pathfinding implementation.
