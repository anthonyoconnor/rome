# Rendered game artwork

The 22 original PNG assets in `public/art/` were generated with the built-in image generator from the finished-game concepts. These are individually rendered game assets, not flattened scene backgrounds. The game places, upgrades, shades, highlights, and selects each building independently.

`manifest.json` records the first 19 source images, their exact prompts, dimensions, hashes and transparency checks. `variation-prompts.md` records the two additional affluent housing designs and meadow scatter. Their alpha measurements are in `variation-alpha-audit.txt`.

PNG exports preserve genuine alpha. Some transparent pixels contain underlying RGB colors; these are invisible when correctly composited. The runtime finds visible bounds, preserves the native aspect ratio and builds shadow masks from alpha. `scene.ts` projects those shadows onto the landscape and uses the same bounds for picking roofs and walls.

The three materials use top-down texture coordinates transformed into the same 2:1 isometric world as the roads. Landscape decoration is deterministic and clears from occupied cells. Artwork loading completes before simulation time advances.
