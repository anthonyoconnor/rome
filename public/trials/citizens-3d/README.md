# 3D citizen trial

Open `/trials/citizens-3d/` on the Little Rome development server. The trial also ships as static files in the normal production build. It is separate from the town renderer and simulation.

- Six original procedural 3D Roman citizens, with sculpted primitive meshes, tunics, faces, hair, belts and sandals.
- A 17-bone skeleton per citizen. The tunic is a weighted `SkinnedMesh`; head, limbs and props attach to the same bone hierarchy.
- Analytic two-joint leg motion, a 58% stance interval, lifted recovery, counter-swinging arms and stride tied to road distance. Feet remain planted on straight sections; the rounded ends are a turning trial and do not use world-space foot locking.
- Walking, carrying a produce basket, and standing. Pause, single-frame step and ¼×–2× speed.
- Fixed orthographic camera, street/close-up/game-scale presets (about 36 CSS pixels tall at game scale), drag to pan, scroll to zoom, and click to follow a citizen.
- Instanced paving stones and curbs; real directional shadows and warm ambient lighting.

Models and gait are authored in code for this trial; these are not imported production character assets, motion capture, or generated sprite images. There is no cloth or finger simulation. Changing activities currently switches the pose immediately. The close-up view is intended to expose these limitations as well as the advantages of 3D.

Three.js 0.180.0 is vendored under `vendor/` with its MIT license. The trial needs no CDN request at runtime and no additional npm installation.

Run `node scripts/check-citizens-3d.mjs` from the project root to check planted-foot math, inverse kinematics, the continuous road path, and every actual character rig.
