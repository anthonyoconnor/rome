# 3D town trial

Open `/trials/citizens-3d/index.html` on the Little Rome development server. The existing character-trial URL now opens the expanded town. The trial also ships as static files in the normal production build. It is separate from the playable town renderer and simulation.

## Buildings

Ten original procedural buildings cover every building type in the game: cottage, townhouse, courtyard home, Forum, market, workshop, well, garden, bathhouse and theater. Walls, roof tiles, columns, steps, shutters, stalls and props are actual 3D geometry. Static geometry is combined by material and roof tiles use instancing.

The models are detailed around their full exterior for the orbit camera. Homes have rear entrances, windows and animated shutters on both sides, stone corner blocks, lamps and gable medallions. The courtyard home has windows on its outer wings and doors into the court. The Forum has rear access, side windows and a continuous decorated cornice. The workshop has a service door, ventilation grilles, a barrel and crates. The bathhouse has framed windows, rear access and a supported dome. The theater has backstage entrances and an arched retaining facade around its seating. Market stalls have rear shelves, fully modeled crates, canopy trim and timber bracing; the well and garden have detail visible around the perimeter. Gabled roofs use solid sloping slabs, closed gables and fascia on both ends, so their undersides remain visible at low camera angles.

Select a building from the inspector or click it in the scene to focus the camera. Close-up hides neighboring buildings so the selected model is unobstructed; Town and Game scale show the whole neighborhood. The inspector collapses on narrow screens. The building descriptions explain the visible animation:

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
- Rotatable orthographic camera, street/close-up/game-scale presets (about 36 CSS pixels tall at game scale), and click to follow a citizen.
- Instanced paving stones and curbs; real directional shadows and warm ambient lighting.

Models and gait are authored in code for this trial; these are not imported production character assets, motion capture, or generated sprite images. There is no cloth or finger simulation. Changing activities currently switches the pose immediately. The close-up view is intended to expose these limitations as well as the advantages of 3D.

Three.js 0.180.0 is vendored under `vendor/` with its MIT license. The trial needs no CDN request at runtime and no additional npm installation.

## Camera

Drag sideways to orbit a full 360° around the town or selected subject; drag vertically to tilt between 10° and 80° above the ground. Right-drag, middle-drag or Shift-drag pans at any camera angle. Scroll to zoom. The **Rotate / Pan** buttons choose the drag action, including for touch screens. **Isometric** restores the original angle without leaving your close-up; **Overhead** gives a view from above. **Reset view** restores the town overview, original angle, pan and zoom. Camera movement remains available when animations are paused.

Run `node scripts/check-citizens-3d.mjs` from the project root to check planted-foot math, inverse kinematics, the continuous road path, and every actual character rig. Run `node scripts/check-buildings-3d.mjs` for building coverage, finite geometry, deterministic animation/freeze behavior, nonoverlapping lots, and a walking route that stays outside the building lots.
