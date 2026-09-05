# 3D town trial

Open `/trials/citizens-3d/index.html` on the Little Rome development server. The existing character-trial URL now opens the expanded town. The trial also ships as static files in the normal production build. It is separate from the playable town renderer and simulation.

## Buildings

Ten original procedural buildings cover every building type in the game: cottage, townhouse, courtyard home, Forum, market, workshop, well, garden, bathhouse and theater. Walls, roof tiles, columns, steps, shutters, stalls and props are actual 3D geometry. Static geometry is combined by material and roof tiles use instancing.

Select a building from the inspector or click it in the scene to focus the fixed camera. Close-up hides neighboring buildings so the selected model is unobstructed; Town and Game scale show the whole neighborhood. The inspector collapses on narrow screens. The building descriptions explain the visible animation:

- Homes: hinged shutters, moving laundry, and water in the courtyard.
- Forum and theater: moving banners and stage curtains.
- Market: deforming striped awnings and a swinging sign.
- Workshop: kiln fire and warm light, rising smoke, and a rotating pottery wheel.
- Well: a turning windlass, moving bucket and a rope that follows its height.
- Garden: fountain jets, expanding ripples and animated water.
- Bathhouse: animated pool water and rising steam.

Pause, speed and frame-step controls affect the entire scene. **Building motion** can freeze only the buildings while citizens continue. Every effect uses the same explicit simulation clock, so pausing freezes water shaders and cloth as well as object transforms. Standing citizens do not stop building activity.

These are ambient visual animations. The trial does not yet connect buildings to the economy, construction, service coverage, or production rates.

## Citizens

- Six original procedural 3D Roman citizens, with sculpted primitive meshes, tunics, faces, hair, belts and sandals.
- A 17-bone skeleton per citizen. The tunic is a weighted `SkinnedMesh`; head, limbs and props attach to the same bone hierarchy.
- Analytic two-joint leg motion, a 58% stance interval, lifted recovery, counter-swinging arms and stride tied to road distance. Feet remain planted on straight sections; the rounded ends are a turning trial and do not use world-space foot locking.
- Walking, carrying a produce basket, and standing. Pause, single-frame step and ¼×–2× speed.
- Fixed orthographic camera, street/close-up/game-scale presets (about 36 CSS pixels tall at game scale), drag to pan, scroll to zoom, and click to follow a citizen.
- Instanced paving stones and curbs; real directional shadows and warm ambient lighting.

Models and gait are authored in code for this trial; these are not imported production character assets, motion capture, or generated sprite images. There is no cloth or finger simulation. Changing activities currently switches the pose immediately. The close-up view is intended to expose these limitations as well as the advantages of 3D.

Three.js 0.180.0 is vendored under `vendor/` with its MIT license. The trial needs no CDN request at runtime and no additional npm installation.

Run `node scripts/check-citizens-3d.mjs` from the project root to check planted-foot math, inverse kinematics, the continuous road path, and every actual character rig. Run `node scripts/check-buildings-3d.mjs` for building coverage, finite geometry, deterministic animation/freeze behavior, nonoverlapping lots, and a walking route that stays outside the building lots.
