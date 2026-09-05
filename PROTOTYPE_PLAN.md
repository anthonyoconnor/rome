# Little Rome — browser city-builder prototype plan

Working title. Implementation in progress.

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
- One guided scenario, a completion celebration, and a continue-building option. Restart at any time.

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

This gives planning consequences without sudden city destruction. The grace period and refund keep changes of plan affordable.

### Scenario and progression

Guide the player through a few actions in the game world, keeping upcoming unlock requirements visible:

1. Connect the first homes and well; welcome 16 residents.
2. Add a market and obtain four cottages.
3. Reach 64 residents to unlock baths; improve one neighborhood into courtyard homes.
4. Reach 128 residents to unlock the theater; choose where to create the best district.
5. Complete the town charter: at least 256 residents, eight townhouses, and positive recurring income for three consecutive economy periods.

Roads, homes, wells, markets, workshops, and gardens are available from the beginning. Unlocks persist, and there is no countdown to failure. Offer continued sandbox play after completing the charter. Avoid large cash rewards for the charter steps: the city should prove it can fund itself.

## 3. Implementation milestones

1. **Basic gameplay:** create the map, canvas, camera, building tools, road connections, water, immigration, and income.
2. **Complete city growth:** implement all eight build tools, four housing tiers, finite service capacities, appeal, jobs, expenses, recovery, and the town charter.
3. **Mechanics verification:** check road routing, capacity stability, tier transitions, money arithmetic, and a complete deterministic progression through the charter.
4. **Complete casual session:** add contextual guidance, persistent-in-session unlocks, speed controls, building suspension, restart, and a celebration with continued sandbox play.
5. **Graphics and game feel:** develop distinct Roman architecture, lush terrain, flowing water, decorative residents, responsive placement feedback, clear overlays, and optional sound.
6. **Finish and final graphics pass:** verify the browser build and revisit the complete visual presentation. Refine lighting, terrain, silhouettes, typography, transitions, and readability.

Commit working changes to Git in logical groups throughout implementation.

## 4. Implementation approach

Keep simulation, configuration, rendering, and interface code separate. Use a fixed simulation step independent of drawing speed. All state lives in memory for the current session. Stop simulation while the page is hidden.

Use a lightweight static browser build. No backend, authentication, cloud database, deployment pipeline, or production infrastructure. Balance values stay in one configuration file. Focus verification on actual mechanics and the completed browser experience.
