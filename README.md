# Little Rome

A casual Roman town-building game. Connect neighborhoods, provide services, cultivate appeal, and grow eight townhouses into a prosperous town of 256 residents.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. All game state exists only during the current session. The town pauses when the page is hidden. Sound starts muted.

## Controls

- **1–8:** choose roads, homes, well, market, garden, workshop, bathhouse, or theater.
- **Click:** build or inspect. Drag with the road tool to draw connected streets.
- **Right-drag / WASD / arrow keys:** move the camera. Scroll or **+/−** to zoom.
- **Space:** pause. **Esc:** inspect. **G:** building grid. **B:** demolition.
- The **Town** button opens the charter, building guidance, and accounts. Select a building to inspect it.

Homes require water, then a market, then baths and 30 appeal, then a theater and 60 appeal. Service reach follows roads; capacity includes the empty beds reserved for each home's current tier. Gardens help nearby homes, while workshops provide jobs and create noise. The inspector explains exactly what is missing.

## Build and verify

```sh
npm run check:mechanics
npm run check:citizens
npm run build
npm start
```

The mechanics checks cover construction/refunds, routed coverage, grace periods, stable capacity allocation, appeal, suspension, and a complete charter using starting funds and earned income. The static build is written to `dist/`.

## Change the game

- `src/game/config.ts`: prices, service reach/capacity, jobs, tax rates, and housing tiers.
- `src/game/simulation.ts`: deterministic town rules, progression, and economy.
- `src/game/scene.ts`: textured landscape, building sprites, cast shadows, camera, selection, and animation.
- `src/game/assets.ts`: artwork loading, transparent bounds, shadow masks, and housing variations.
- `src/game/citizens.ts` and `citizen-art.ts`: street movement, gait timing, and the textured character rig.
- `public/art/`: original rendered building, landscape, and citizen assets.
- `src/game/Game.tsx`: controls, inspector, charter, and guidance.
- `app/globals.css`: interface styling and responsive layout.

See [the prototype plan](PROTOTYPE_PLAN.md) for scope and inspiration. No accounts, server application, or production infrastructure are needed.

## Art direction

### 3D town trial

Open `/trials/citizens-3d/index.html` to explore ten actual 3D buildings and six citizens. Select a building or citizen for a close-up. Buildings include moving awnings, banners, shutters and laundry; kiln fire and smoke; a working well bucket; fountains, pool water and steam. Pause, step and speed controls apply to the whole scene, with a separate building-motion toggle. This visual trial is independent of the playable town and its economy. See [trial notes](public/trials/citizens-3d/README.md). Run `node scripts/check-citizens-3d.mjs` and `node scripts/check-buildings-3d.mjs` for the rig, building-animation and layout checks.

### Current town

The game uses detailed rendered isometric sprites with real transparency, inspired by the three [finished-game visual concepts](art/finished-game-concepts/PROMPTS.md). The map combines continuous meadow and river materials, connected stone paving, olive and cypress groves, small ground vegetation, and layered building shadows. Top-tier housing has three architectural variants. Citizens follow the actual connected streets; workshops smoke and the river moves. Buildings remain individually selectable and placeable.

For quick visual iteration in the development server, use `?scene=early`, `?scene=growing`, or `?scene=flourishing`. These views construct towns through the real simulation with normal building costs and earned income. They begin paused and remain playable. Production builds always begin with a fresh town.
