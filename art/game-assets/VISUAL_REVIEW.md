# Graphics review — 2026-09-05

The three images in `../finished-game-concepts/` are generated visual targets. The live game now renders individual detailed sprites in an interactive isometric town, with textured terrain, connected paving, riverbank vegetation, cast shadows, citizens, building previews, and service overlays.

## Reviewed in the browser

- Early settlement at 1280 × 720: opaque terrain fills the viewport; transparent building edges composite cleanly; the forum, cottages, wells, markets, and building dock are legible.
- Flourishing town at 2052 × 1127: three top-tier housing variants, baths, theaters, workshop district, trees, and river appear together with consistent scale and depth ordering.
- Bath coverage: teal routes follow the connected streets and small service markers appear above reached homes. Buildings remain visible through the ground overlay.
- Construction: placing a garden reduced the paused treasury from 592 to 574 and changed upkeep by 0.2 per month.
- Selection: clicking a visible townhouse roof opened the correct 32-resident inspector with its needs and appeal.
- Responsive layout was reviewed at a narrow viewport, including the compact resource bar and two-row building dock.
- No warnings or errors were recorded in the final Chrome review tab.

## Checks

`npm run build` passes. All seven `npm run check:mechanics` checks pass, including completing the charter from normal starting funds and earned income. The final build was repeated successfully after reclaiming verified duplicate task artwork when the disk filled.

## Iteration boundaries

This is a detailed sprite renderer with a fixed isometric viewing angle. The concepts remain art-direction references; their illustrative population counts, layouts, and individual architecture are not exact game captures. Original generated PNGs remain in `public/art/`, with prompts and provenance alongside this review. Development-only early, growing, and flourishing towns use the actual simulation and can be played normally.

Shadow masks are softened once at load time. Rendering is capped at 30 frames per second and stops in hidden tabs. No production infrastructure or persistence was added.
