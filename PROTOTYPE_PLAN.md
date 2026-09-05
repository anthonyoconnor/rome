# Little Rome — browser city-builder prototype plan

Working title. Research and planning complete; implementation has not started.

Build a small Roman town where arranging neighborhoods is the main activity. Players lay roads, provide services, watch modest homes become attractive townhouses, and use the resulting income to expand. Target a satisfying 20–30 minute scenario that can be continued as a sandbox, with unlimited pause and affordable changes of plan.

The first development priority is an enjoyable, understandable growth loop. Prove that loop with placeholder graphics, then improve presentation. All proposed numbers below are starting hypotheses, not tested balance values.

## 1. What to take from Caesar II

The research focuses specifically on Caesar II, with its manual as the primary source and a community FAQ for practical play observations.

| Finding from the original | Implication for this prototype |
| --- | --- |
| Housing improves or declines with land value; missing essentials limit development. Better housing supports population and tax income. | Make visible housing evolution the central reward. |
| Service delivery mixes road walkers, nearby influence, and citywide coverage. Markets and forums use walkers; baths and schools provide local effects. | Use a consistent, visible rule for neighborhood services. |
| Useful neighbors can constrain development: markets and businesses can cap nearby land values. Gardens and civic amenities help. | Preserve a tension between economic space and attractive residential space. |
| Water distinguishes primitive sources from reservoir/fountain infrastructure. Employment and taxation influence population growth. | Keep water and employment, with fewer dependencies. |
| The game already offers a city-only mode without provincial management or combat. | A focused city-building interpretation is appropriate. |

These original-game findings come from the [Caesar II manual, especially pp. 10, 13–15, 22–27, and 33–41](https://manualmachine.com/gamespc/caesarii/1118384-user-manual/).

The [community FAQ](https://www.caesar2.com/caesar-ii-faq/) describes how road forks can make walker coverage unreliable, encouraging isolated loops. It also distinguishes Caesar II from Caesar III: goods deliveries are not required for housing evolution. Industry supplies employment and tax revenue. Its planning advice emphasizes residential neighborhoods and space for services.

**Design interpretation:** preserve the satisfaction of improving neighborhoods and choosing where to expand. Replace opaque service delivery with predictable information. The rules in the rest of this document are proposals for our game, not claims about Caesar II.

## 2. The proposed game

**Player promise:** “Build a pleasant little Roman town, and make it prosper through thoughtful planning.”

The repeatable loop is:

**Lay out a neighborhood → connect homes and services → attract residents → improve homes → earn income → choose between upgrading this neighborhood and founding another.**

Each investment should answer a concrete question: Can this market cover another street? Should this space become homes or a bathhouse? Is a second neighborhood cheaper than upgrading the first? Where can workshops provide jobs without spoiling nearby homes?

### Prototype boundary

- Desktop browser, mouse and keyboard, one player. Small screens and touch come later if wanted.
- One hand-authored 32 × 32 tile map, with a river along one edge, limited building space, and a preplaced forum connected to an entry road. Start on one bank; bridges are deferred.
- A fixed isometric view, with pan and zoom. Use the same projection and footprints for placeholders and final sprites.
- Eight build tools: roads, residential plots, wells, markets, workshops, gardens, bathhouses, and a theater. The forum is preplaced and cannot be demolished.
- Four housing tiers using the same 2 × 2 footprint. Houses become visibly taller and richer without merging plots or taking neighboring land.
- One spendable resource: coins. Show population, available jobs, service demand/capacity, and projected net income as supporting information.
- Pause, normal speed, and fast speed; building is allowed while paused.
- One guided scenario, a completion celebration, and a continue-building option. One local save slot and restart.

Defer armies, provinces, imperial politics, disasters, disease, crime, food and goods logistics, warehouses, aqueduct networks, tax sliders, individual citizen simulation, research trees, procedural maps, multiplayer, and accounts. These are outside the first prototype's scope.

### Rules that make placement matter

**Road access.** Homes and functional buildings must touch the road network connected to the forum. This is a deliberate simplification. Connectivity should be visible before placing a building. Gardens are exempt.

**Service reach.** Wells, markets, baths, and theaters have a maximum distance measured along roads and a finite resident capacity. A disconnected house receives no service. A reachable house may still be blocked by a full provider. Preview both reach and remaining capacity; show the exact reason in the house inspector.

Start with wells reaching 8 road steps and markets, baths, and theaters reaching 12. Count from a provider's adjacent road tiles to a home's adjacent road tiles, using the shortest route. These are tuning values; no random walkers determine coverage. Later pedestrians are decorative.

**Capacity stability.** Allocate service deterministically and retain valid existing assignments. Reserve capacity for a house's current tier, including its empty beds. An upgrade requires spare capacity for its next tier. This avoids repeatedly upgrading and downgrading the same homes as they fill. Start with provider capacities that support roughly 4–8 improved homes; choose exact values during the economy milestone.

**Neighborhood appeal.** Gardens and civic amenities improve nearby appeal; workshops reduce it nearby. Use a short geometric radius independent of roads and display a simple 0–100 overlay with named contributions. Cap repeated garden bonuses so filling every spare tile with gardens does not solve every problem. Markets have no appeal penalty in the first version, keeping one clear source of nuisance.

**Housing growth.** All tier requirements are cumulative. Start with these targets:

| Tier | Capacity per plot | Requirements |
| --- | ---: | --- |
| 1 — Huts | 8 residents | Connected road and water |
| 2 — Cottages | 16 residents | Market service |
| 3 — Courtyard homes | 24 residents | Bath service and appeal ≥ 30 |
| 4 — Townhouses | 32 residents | Theater service and appeal ≥ 60 |

Require about 20 seconds of satisfied conditions before an upgrade. Immigration fills available beds gradually; no instant population jumps on upgrade. Show the next tier, every missing requirement, and upgrade progress when selecting a home.

**Employment.** Begin with roughly half the residents participating in the workforce. Civic buildings offer a small number of jobs; workshops provide most expansion capacity. Assign workers automatically. Unemployment slows immigration rather than causing riots. Worker shortages reduce workshop income; essential services continue to operate while funded. Initial forum jobs and staff-independent water avoid a startup deadlock.

**Economy.** Construction costs coins. Public services have recurring upkeep. Occupied homes generate fixed tax income, with higher tiers earning more per resident; staffed workshops contribute income too. The player controls buildings and placement rather than tax rates. Empty plots do not generate income. Show the projected recurring balance beside the treasury.

**Recoverable setbacks.** Missing requirements immediately stop upgrades. After a visible grace period of approximately 60 seconds, unmet needs cause gradual departures and at most one housing downgrade per grace period. Essential services keep operating during debt so recovery remains possible. At zero coins, paid construction stops; pausing or demolishing unnecessary buildings remains available. Paused buildings provide neither benefits, jobs, income, nor upkeep. Demolition refunds 75% of the original construction price, including automatically upgraded homes; upgrades never increase the refund.

This gives planning consequences without sudden city destruction. Tune the grace period and refund after observing play.

### Scenario and progression

Guide the player through a few actions in the game world, keeping upcoming unlock requirements visible:

1. Connect the first homes and well; welcome 16 residents.
2. Add a market and obtain four cottages.
3. Reach 64 residents to unlock baths; improve one neighborhood into courtyard homes.
4. Reach 128 residents to unlock the theater; choose where to create the best district.
5. Complete the town charter: at least 256 residents, eight townhouses, and positive recurring income for three consecutive economy periods.

Roads, homes, wells, markets, workshops, and gardens are available from the beginning. Unlocks persist, and there is no countdown to failure. Offer continued sandbox play after completing the charter. Avoid large cash rewards for the charter steps: the city should prove it can fund itself.

## 3. Development milestones

Effort ranges assume one developer and existing web-development familiarity. They are planning estimates, excluding time spent recruiting or waiting for playtesters. Sequence: **M0 → M1 → M2 → M3 → M4 → M5 → M6**. M3 can send work back to M2.

### M0 — Research and define the experiment — complete

**Deliverable:** this document, the proposed rules, an explicit scope boundary, and pass/fail criteria for the prototype.

**Exit condition:** the next implementation task is small enough to begin without designing the entire game. Open design questions become experiments in M3 rather than extra features.

### M1 — Basic playable neighborhood — 1–2 days

**Build:** browser project, fixed map, isometric tile selection, road drawing, building placement previews, demolition, costs, pause/speed controls, selection inspector, and connected-road highlighting. Implement only homes, wells, and the preplaced forum initially. Add simple immigration and housing tax income with labeled placeholder blocks.

**Playable result:** draw a street, add homes and water, see people move in, and spend the income on another block.

**Exit checks:**

- A fresh start reaches its first occupied home in roughly two minutes without debug money.
- Invalid placements explain themselves and spend no coins.
- Removing and restoring a road changes the displayed service state correctly, including during pause.
- Camera movement, tile picking, and multi-tile placement agree at both zoom extremes.

**Do not add yet:** elaborate art, the full building catalog, audio, or extra scenarios.

### M2 — Complete the city-growth loop — 2–3 days

**Build:** markets, workshops, gardens, baths, theater, all four housing tiers, appeal, provider capacity, automatic employment, recurring costs, recovery behavior, and the draft charter. Add the “why isn't this growing?” inspector and placement forecasts now; they are necessary to judge the mechanics.

Put prices, ranges, capacities, jobs, upgrade requirements, and timing into one editable configuration. Add a small development panel for money, simulation speed, and loading saved example layouts.

**Playable result:** a placeholder-art city can reach the final housing tier and complete the charter through ordinary play.

**Exit checks:**

- A start-to-finish run works without cheats or ongoing grants.
- Starter housing becomes self-supporting; it does not require an unaffordable service to generate its first income.
- Adding housing eventually creates a visible infrastructure or employment decision.
- Every stalled house has an accurate, actionable explanation.
- Disconnecting a service district and reconnecting it demonstrates both decline and recovery without an immediate cascade.

### M3 — Prove the mechanics and planning are worthwhile — 1–2 days

**Build:** only the small simulation checks and playtest aids needed for the experiments below. Use three saved layouts on the same map and starting budget: a compact service hub, two smaller neighborhoods, and a deliberately inefficient sprawl. Keep graphics as placeholders.

**Run:** compare population, housing mix, operating surplus, service utilization, and time to the charter. Invite 3–5 people for short observed sessions; record where they stall and ask them to explain their decisions. These are directional observations, not statistical proof.

**Exit checks:**

- Both compact and split-neighborhood layouts can finish; they expose different costs or expansion opportunities.
- Inefficient placement creates a measurable disadvantage and players can identify a useful correction.
- At least 3 of 5 testers, or 2 of 3 if only three are available, reach cottages and explain one growth blocker without coaching.
- The same threshold can explain a meaningful tradeoff between improving an existing district and expanding elsewhere.
- A disconnected road, over-capacity service, noisy neighbor, and loss of income each have understandable effects and a practical recovery route.
- A favorable starting position does not make every later placement irrelevant, and waiting alone does not solve missing service requirements.

**Decision gate:** if layouts perform essentially identically, strengthen space, range, capacity, or upkeep constraints. If one layout wins on every measure, tune those constraints or the map. If testers mostly fight the interface, fix feedback first. If capacity causes confusing churn, simplify it before adding systems. Repeat the focused experiment before proceeding to graphics polish.

### M4 — Turn the mechanics into a complete casual session — 1–2 days

**Build:** contextual introduction, staged unlocks, town-charter progress, restart, one local save/resume slot, autosave, demolition previews, clear debt and shortage feedback, and a completion celebration with continue-building.

**Playable result:** someone can open the browser, learn while playing, finish a town, and return later.

**Exit checks:**

- First meaningful improvement occurs within about five minutes; a first successful charter run targets 20–30 minutes at normal speed.
- An unfamiliar player can complete the session using only in-game guidance.
- Refresh resumes the city; returning after closing or hiding the tab does not simulate unattended losses.
- The player can recover from an overbuilt district using the visible budget and pause/demolition tools.
- After the first neighborhood is established, there is a useful planning action available without prolonged forced waiting.

### M5 — Polish graphics and game feel — 2–3 days

**Build:** a coherent original Roman art set: warm stone, terracotta roofs, green courtyards, blue water, readable roads, and distinct building silhouettes. Replace placeholders using the established footprints and camera. Make the four housing tiers visibly different at normal zoom.

Add restrained construction and upgrade animations, light water motion, a small number of decorative pedestrians, responsive hover/selection effects, readable icons, and a few optional sound effects with mute. Prioritize map clarity and the satisfaction of housing evolution.

**Exit checks:**

- Testers distinguish homes, services, and workshops without selecting each one.
- Housing improvement is apparent both up close and across the town.
- Sprites do not obscure essential placement boundaries or service warnings.
- Text, symbols, and selection outlines remain legible over the finished art; warnings are not conveyed by color alone.
- A populated target-sized town remains responsive on the development machine; trim decorative effects if necessary.

**Scope rule:** one consistent art pass before optional decorative variants. No 3D engine, camera rotation, cinematic sequences, or large asset catalog.

### M6 — Browser playtest and rapid iteration — 1–2 days

**Build:** a shareable static browser build, a simple way to capture feedback, and the highest-value fixes from fresh sessions. Check the intended desktop browser plus one other available browser. Perform a complete playthrough after the final balance changes.

**Exit checks:**

- Testers can load, start, grow, finish, save, and resume without developer intervention.
- The core layout tradeoffs remain visible after the visual polish.
- Record observed session length, unclear moments, recovery attempts, and whether testers choose to continue or restart voluntarily.
- Fix blockers, misleading feedback, and obvious economy exploits; defer cosmetic edge cases and speculative features.
- Write a short playtest report with findings and a ranked next-iteration backlog. A request for more content does not automatically justify another simulation system.

**Prototype complete:** a shareable, self-contained, attractive town-building session with a proven basic economy and observable planning decisions. Further work follows player evidence.

**Estimated implementation effort:** 8–14 hands-on developer days for M1–M6, plus any extra mechanics iteration justified by M3. A first playable neighborhood arrives at M1, well before the complete prototype.

## 4. The specific mechanics tests

These tests target the simulation's useful guarantees; they are not a production testing program.

| Experiment | Evidence to capture | Passing behavior |
| --- | --- | --- |
| Short route versus detour | Same service and house; road distance changes | Reach follows the actual road route, and the preview matches the simulation. |
| Break and restore connection | Service state, upgrade timer, population | Coverage loss is immediate; decline follows the grace period; reconnection permits recovery. |
| Provider at capacity | Assigned homes, reserved beds, upgrade requests | Capacity is not double-counted; blocked upgrades say “service full”; stable layouts do not oscillate. |
| Workshop beside homes versus on a separate street | Jobs, income, appeal, attainable housing tier | Both employment benefit and residential cost are visible; relocation has a predictable effect. |
| Compact hub versus two neighborhoods | Equal budget and map; progress, upkeep, expansion room | Both are viable, with an understandable difference in efficiency or flexibility. |
| Build only housing; build only workshops | Growth and cash over time | Neither spam strategy independently satisfies the charter. |
| Overbuild, then recover | Cash balance and actions required | Pausing excess services or refunding construction restores a route to progress. |
| Pause and fast-forward | Same actions at the same simulation times | Pause freezes simulation; higher speed changes elapsed real time, not economic outcomes. |

Automate road reach, capacity reservation, housing transitions, and money arithmetic. Use saved layouts and observed play for economy and fun. Do not infer that correct formulas prove an enjoyable game.

## 5. Implementation approach for quick changes

Use TypeScript with a minimal Vite project, Canvas 2D for the map, and ordinary HTML/CSS for controls and inspectors. Vite provides a development server and static build workflow; Canvas supports browser 2D drawing. This is a proposed lightweight stack for this small map, not a requirement to introduce a game engine. See the [Vite guide](https://vite.dev/guide/) and [Canvas API documentation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API).

Keep only a few clear boundaries:

- `simulation`: map/building state, road reach, service assignments, economy, population, and housing updates. Fixed simulation steps, independent of the drawing rate.
- `config`: building definitions and balance numbers, edited in one place.
- `render`: isometric drawing, picking, camera, and later visual effects.
- `ui`: build tools, inspector, overlays, charter, and budget display.
- `save`: serialize the small city state to one local slot. Browser local storage persists across sessions; see [localStorage documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

At this map size, prefer direct calculations and straightforward road searches. Keep gameplay deterministic so recorded layouts help compare tuning changes. Pause simulation while the page is hidden and provide no offline progression. Use local debugging information and brief playtest notes instead of a telemetry system.

Allow prototype save resets when the model changes; do not build save migration tooling. No backend, authentication, cloud database, deployment pipeline, elaborate automated browser suite, broad device matrix, or performance infrastructure is needed. Address concrete play blockers as they appear.

## 6. Immediate next implementation slice

Begin M1 with the smallest complete interaction: **open a map → draw a road from the forum → place a well and four homes → see coverage → unpause → watch residents arrive and income increase.**

Once that works, finish placement and inspection feedback, then add the systems in M2. Revisit the prototype's rules at the M3 gate before committing effort to finished assets.
