# Product Specification — V0.1

## 1. Product Vision
Create a tiny, relaxing browser-based isopod terrarium that feels alive through simple autonomous movement and lightweight player interaction.

V0.1 is a playable prototype, not a complete game.

## 2. Primary Experience
When the player opens the page:
1. A cute pixel-art transparent terrarium is visible.
2. Before the terrarium starts, the player selects exactly three resident slots from the supported species registry; species may repeat.
3. Starting care creates three independently identified residents and enters the terrarium without reloading the page.
4. Each isopod independently wanders slowly around the terrarium.
5. The player can click/tap an isopod and watch it roll into a ball.
6. The player can feed carrot or Bauhinia leaf with separate controls.
7. The selected food appears in a fixed food bowl.
8. After a short delay, one or more hungry isopods, limited by the serving count, notice the food and gather around the bowl.
9. Each isopod has an independent satiety value that affects whether it can notice food.
10. The player can open one isopod status panel at a time to observe that individual's live satiety and behavior state.
11. The player can assign an independent session-only custom name to each isopod from its status panel.

## 3. Visual Direction
- Retro cute pixel art.
- Realistic terrarium fundamentals, presented in a cute/game-like way.
- Camera: 2D oblique/top-down view.
- Transparent-plastic-container feeling may be suggested through borders/highlights; true 3D rendering is not required.
- The terrarium should be the visual focus of the page.

### Terrarium Elements
V0.1 scene should visually contain:
- Soil/substrate
- Leaf litter
- Moss
- Cork bark / decaying wood
- Small stones
- Small plants
- One fixed food bowl

These are decorative in V0.1 except for the food bowl.

## 4. Residents and Species
- Initial resident quantity: 3.
- Each resident has a stable individual ID and a separate species ID; species IDs are never used as individual identity.
- Supported Phase 4A species are Panda King, Lemon Blue, Magic Potion, Sakura, Amber, and Golden.
- Species definitions centrally provide Chinese/English display names and idle, walk, and roll frames.
- Multiple residents may legally use the same species without sharing custom name, satiety, movement, position, Roll state, food assignment, gathering slot, happy feedback, status selection, or actor label.
- Phase 4B replaces the temporary roster with a session-only initial selection flow. Runtime resident IDs remain stable per slot (`resident-1` through `resident-3`) even when species repeat.

### 4.1 Initial Resident Selection
- The initial page shows all species directly from the registry, with idle preview, Chinese name, and English name.
- Clicking a species fills the next empty one of three independent slots; the same species can be selected repeatedly.
- Removing a slot clears that exact slot without reordering the other selections.
- `開始飼養` is disabled until all three slots are filled and never auto-fills missing residents.
- Starting creates exactly three residents with null custom names and the existing independent 60–90 satiety initialization, then mounts the terrarium without navigation or reload.
- Selection is session-only. Reloading returns to selection; no local storage, backend, or database is used.
- Phase 4B does not provide in-game resident replacement or management; that is deferred to Phase 4C.

## 5. Player Interactions

### 5.1 Click/Tap Isopod
Clicking/tapping an eligible isopod:
- Stops its current movement.
- Plays roll-up animation.
- Holds the fully rolled state for exactly 3 seconds.
- Plays the roll animation in reverse to unroll.
- Briefly returns to idle.
- Resumes normal wandering.

Clicking again while already rolling/rolled/unrolling must not restart or extend the timer.

### 5.2 Feed
- Page contains visible carrot and Bauhinia-leaf feeding controls.
- Terrarium contains one fixed food bowl.
- Initially the bowl is empty.
- Pressing a food control adds one serving of that food, up to a maximum of three.
- The visible food sprite represents the current quantity: one, two, or three servings.
- Feed actions at three servings keep the quantity at three.
- Switching food type replaces the bowl contents and starts the new type at one serving.
- The bowl renders only one food type and one matching quantity sprite at a time.
- A newly placed food type starts a new 1–3 second discovery lifecycle and invalidates any lifecycle for the replaced type.
- Quantity increases never create or reset discovery timers or food assignments.

### 5.3 Food Reaction
After a food type is newly placed:
- Wait a random 1–3 seconds.
- Select up to the current food amount from hungry, available isopods, prioritizing the lowest satiety and randomly resolving cutoff ties.
- Selected isopods abandon normal wandering and simultaneously approach distinct geometry-derived gathering slots around the bowl.
- Each arrival enters `AT_FOOD`; when all remaining participants have arrived, the group remains gathered for one shared random 6–10 second period.
- While in `AT_FOOD`, each participant independently performs a subtle 2–4 px forward-and-back eating bob toward the bowl every 300–500 ms while remaining anchored to its gathering slot.
- After the shared wait, every remaining participant consumes one serving, gains 30 satiety, returns to idle, and independently resumes wandering.
- Every successful consumer briefly shows its own pixel-art fed/happy bubble above its actor for about 1.8 seconds. This feedback does not alter movement, Roll, or feeding timing.
- Isopods not selected for the event continue normal behavior.
- V0.1 uses the existing idle sprite for this lightweight eating feedback; it has no dedicated eating sprite or complex eating animation.

After successful group consumption:
- Reduce the current food amount atomically by the number of successful participants, clamped at zero.
- If food remains, wait a new random 8–15 seconds before starting another independent discovery event.
- If the bowl becomes empty, clear the food type and stop automatic discovery.
- Do not immediately chain another isopod after consumption.

If a selected participant is clicked while moving to/at food:
- Roll interaction takes priority.
- Only that participant's food behavior is cancelled without consuming food or gaining satiety; the rest of the group continues.
- After unrolling, the isopod returns to ordinary wandering.
- If food remains, schedule a new discovery after 8–15 seconds.

If the player replaces the food type during discovery, movement, or `AT_FOOD`, every participant in the old group is invalidated and cannot consume or gain satiety from the replacement food. The new type starts its own 1–3 second initial discovery. Increasing the same food type never adds participants to an active group; extra servings remain for a later discovery.

### 5.4 Satiety
- Each resident has an independent satiety value from 0 to 100.
- Initial satiety is independently randomized from 60 to 90.
- Satiety decreases by one every 10 seconds in every behavior state, clamped at zero.
- Only an `IDLE` or `WANDERING` isopod with satiety at or below 70 is eligible for food discovery.
- Discovery selects up to the food amount from eligible isopods in lowest-satiety order. Exact ties at the selection boundary are resolved randomly.
- If no isopod is hungry, food remains untouched and discovery retries at a short, non-busy interval until an eligible isopod exists.
- Successful group completion consumes one serving per remaining participant and gives each successful consumer 30 satiety, clamped at 100.
- Carrot and Bauhinia leaf provide the same satiety gain.
- Roll interruption or food replacement gives no satiety and consumes no food.
- Roll interruption, food replacement, and stale assignments never show the fed/happy feedback because no valid consumption occurred.
- Satiety is displayed only in the player-opened individual status panel introduced in Phase 3F; it is not permanently overlaid on the habitat.

### 5.5 Individual Status
- Each resident has a small `ⓘ` button that follows the individual without covering or replacing its Roll target.
- Activating `ⓘ` opens that individual's status panel; activating another individual's button switches the same panel to that individual.
- At most one status panel is visible.
- The panel displays species, display name, live satiety as a number and pixel-style bar, and a human-readable current state.
- The panel updates from current application state as satiety decays, food is consumed, or behavior state changes.
- Closing the panel affects no gameplay state.
- Clicking the isopod body continues to trigger Roll and does not open the panel.

### 5.6 Individual Naming
- Existing isopod IDs remain the source of identity; names are display metadata and never keys.
- Default names resolve from species plus roster slot, such as `Lemon Blue #1`, `Sakura #2`, and `Golden #3`.
- Each ID may have one independent custom name. The resolved display name is the custom name when present and the default name otherwise.
- Naming is performed inline in the status panel with a text input, confirm, and cancel controls; browser prompts and modal overlays are not used.
- Trimmed names must contain 1–12 characters. Empty, whitespace-only, and longer names show inline validation and are not saved.
- Chinese, English, numbers, ordinary spaces, and duplicate names are allowed.
- Enter confirms a valid name and Escape cancels editing.
- Successful naming immediately updates the panel and accessible info/Roll labels without changing movement, Roll, feeding, food, assignment, state, or satiety.
- Each actor shows a lightweight name label beside its `ⓘ` control. Unnamed actors use the compact labels `#1`, `#2`, and `#3`; named actors use their custom name.
- Actor labels update immediately after naming, move with their actor, and remain separate from sprite-facing transforms and the Roll target.
- Long actor labels are visually truncated with an ellipsis without changing the stored name or the full panel title.
- Actor label text is non-interactive; only `ⓘ` opens status and only the isopod body triggers Roll.
- Custom names are session-only in V0.1 Phase 3G and return to defaults after a browser reload. No persistence storage is used.

## 6. Movement
- Full 2D random wandering within the terrarium.
- Slow movement.
- Each isopod acts independently.
- Isopods must remain within safe terrarium bounds.
- On reaching a destination, an isopod pauses before choosing another destination.
- Suggested movement duration: 4–8 seconds.
- Suggested idle duration: 2–6 seconds.
- Individual timing may vary.
- No collision avoidance is required in V0.1.
- Isopods may visually overlap each other and decorative scenery.

## 7. Directional Art
V0.1 uses a left-facing walk sprite.
- Movement toward the left: original sprite.
- Movement toward the right: horizontally mirrored sprite.
- Vertical/diagonal movement still uses the nearest left/right facing sprite.
- Do not rotate the sprite to match arbitrary movement angles.
- Eight-direction sprites are out of scope.

## 8. Responsive Design
Support:
- Desktop browser
- Mobile browser

The same game is used on both. The terrarium scales responsively; no separate mobile game implementation is required.

## 9. V0.1 Out of Scope
Do not implement:
- Supabase
- Login/authentication
- Database/cloud save
- Phaser
- Multiplayer
- Breeding
- Growth/aging
- Health stats
- Dedicated eating sprite assets or complex eating animation
- Inventory
- Coins/currency
- Shop
- Collection encyclopedia
- Pest/cockroach invasion
- Environmental simulation
- Humidity/temperature mechanics
- Hiding under objects
- Collision system
- Eight-direction character art
- Species beyond the six registered Phase 4A species
- In-game resident replacement or management before Phase 4C
- Sound system unless separately approved

## 10. V0.1 Acceptance Criteria
V0.1 is complete when:
- Project runs locally.
- Terrarium renders correctly on desktop and mobile.
- The initial selection lists every registry species, supports duplicates, preserves three explicit slots, and disables start unless exactly three slots are filled.
- Starting creates exactly three independently identified residents from the selected species without reloading.
- Every resident resolves its names and idle/walk/roll frames through the species registry; duplicate species remain independent individuals.
- All 3 independently wander without leaving the playable bounds.
- Walk animation plays while moving.
- Idle animation can play while paused.
- Clicking/tapping any isopod triggers the documented roll behavior.
- Roll hold lasts 3 seconds and repeated clicks do not reset it.
- Carrot and Bauhinia-leaf controls increase their matching quantity from one to a maximum of three.
- Switching food type replaces the previous type and starts at one serving.
- One, two, and three servings use their matching single quantity sprite without stacking images or food types.
- Food replacement never creates duplicate discovery timers or assignments.
- Between one and three eligible isopods, never exceeding the food amount, react after 1–3 seconds.
- Participants approach different bowl slots, share a 6–10 second gathering period after all remaining participants arrive, consume one serving each, then return to wandering.
- `AT_FOOD` participants bob subtly toward the bowl with independent timing; the motion stops immediately on completion, cancellation, replacement, or Roll.
- Remaining food starts another discovery only after a random 8–15 second delay.
- Each isopod independently loses one satiety every 10 seconds, never below zero.
- Food discovery only selects hungry (`satiety <= 70`) `IDLE`/`WANDERING` isopods and prioritizes the lowest satiety, with random tie-breaking.
- Completed consumption adds 30 satiety to the consuming isopod, never above 100; interruption or replacement adds none.
- Food amounts progress from three to two to one to an empty bowl without becoming negative.
- Clicking one food participant cancels only that participant and performs Roll while the remaining group continues.
- Each successful consumer shows one independent fed/happy bubble for about 1.8 seconds; interrupted, replaced, or stale tasks show none.
- Each isopod's accessible info control opens a single live status panel without triggering Roll.
- The panel switches between individuals, displays live satiety and localized state text, and can close without affecting gameplay.
- Each individual can be named independently in the panel; valid names update all live display labels and remain for the current session only.
- The compact actor label changes from `#n` to the resolved custom name immediately, truncates long names safely, and never triggers Roll.
- TypeScript/build checks pass.
