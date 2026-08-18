# Game Design — V0.1

## 1. Design Goal
The terrarium should feel calm and alive even when the player does nothing.

The primary emotional beats are:
- Observe: “The isopods are moving by themselves.”
- Discover: “I can click one.”
- Delight: “It rolled into a ball.”
- Influence: “I placed food.”
- Response: “One of them noticed the food.”

## 2. Resident Behavior

### Species Registry and Resident Identity
- The species registry is the only source for a species ID, Chinese/English name, and idle/walk/roll frames.
- The six registered species are Panda King / 熊貓王, Lemon Blue / 檸檬藍, Magic Potion / 魔藥, Sakura / 櫻花, Amber / 琥珀, and Golden / 黃金.
- A resident owns a stable individual ID, species ID, roster slot, initial position, and optional initial facing.
- Runtime state is keyed by resident ID. Two residents of the same species share art definitions only; all gameplay and UI state remains independent.
- Phase 4B creates the roster from three explicit selection slots. Slot index determines the stable resident ID and default-name number; duplicate species remain separate residents.

### Initial Selection Flow
1. Render species cards by iterating the registry; do not maintain a second species list.
2. A card activation places that species into the lowest-index empty slot, including when that species is already selected elsewhere.
3. A slot removal clears only that slot and preserves the other slot identities.
4. Enable start only when all three slots contain a species.
5. On start, create `resident-1`, `resident-2`, and `resident-3` with the existing initial positions/facing and mount the gameplay coordinator.

Selection state exists only for the current page session. The terrarium has no resident replacement flow in Phase 4B; Phase 4C owns that future behavior.

### States
Recommended conceptual states:

- `IDLE`
- `WANDERING`
- `ROLLING`
- `ROLLED`
- `UNROLLING`
- `MOVING_TO_FOOD`
- `AT_FOOD`

Implementation naming may differ, but behavior must match this specification.

### Normal Loop
`IDLE → WANDERING → IDLE → WANDERING`

#### WANDERING
- Choose a random safe destination inside terrarium bounds.
- Move slowly toward it.
- Suggested travel duration: random 4–8 seconds.
- Face left when horizontal movement is leftward.
- Face right by horizontally mirroring the left sprite when movement is rightward.
- Do not rotate sprites for diagonal movement.

#### IDLE
- Stop positional movement.
- Play idle animation if available.
- Suggested duration: random 2–6 seconds.
- When complete, choose a new random destination.

### Independent Individuals
All three isopods:
- Maintain their own state.
- Maintain their own timers.
- Maintain independent satiety, initialized randomly from 60 to 90.
- Choose their own destinations.
- Must not synchronize intentionally.

### Satiety
- Satiety ranges from 0 to 100 and decreases by one every 10 seconds regardless of behavior state.
- An isopod is hungry and eligible for food discovery only at satiety 70 or below.
- Successful consumption adds 30 satiety, clamped at 100.
- Carrot and Bauhinia leaf restore the same amount.
- Satiety has no permanent habitat overlay. From Phase 3F it is visible only while the player has opened an individual's status panel.

### Individual Status UI
- Every isopod actor carries a small, separately interactive `ⓘ` control that follows its position in all states.
- The isopod body remains the Roll control; the info control must not trigger Roll.
- One selected individual ID controls one shared panel below the terrarium. Selecting another individual replaces the panel contents.
- The panel reads live satiety and behavior state rather than taking an open-time snapshot.
- State labels are localized for players: resting, wandering, moving to food, eating, rolling, rolled, and unrolling.
- Closing or switching the panel never changes movement, Roll, feeding, assignment, food, or satiety.

### Individual Naming
- Identity continues to use the existing unique isopod ID and fixed default name.
- A per-ID optional custom name resolves to the visible display name; duplicate custom names are valid because names are not identity keys.
- The shared status panel owns only temporary edit draft/error state. Confirmed names live in the Terrarium coordinator so changing panel selection does not lose them.
- The inline editor accepts a trimmed 1–12 character name, confirms with Enter, and cancels with Escape or its cancel button.
- Renaming updates the panel title and accessible actor controls immediately while all gameplay state continues uninterrupted.
- The actor HUD resolves its visible label from the same custom-name state, falling back to compact `#1`–`#3` labels rather than the full default panel names.
- The compact label and `ⓘ` share a lightweight UI group inside the moving actor wrapper but outside the mirrored sprite control.
- Label text ignores pointer input, while the info button remains independently operable. Long labels ellipsize visually and retain their full stored value in the panel.
- Names are deliberately session-only in Phase 3G; reload restores default names and no browser or backend persistence is used.

## 3. Safe Movement Bounds
The visual sprite must remain inside the playable terrarium area.

Do not select destinations directly on the outer edge. Maintain padding based on sprite dimensions so antennae/body do not visibly escape the enclosure.

Decorative objects do not block movement in V0.1.

## 4. Roll Interaction

### Trigger
Player clicks/taps an isopod that is not currently `ROLLING`, `ROLLED`, or `UNROLLING`.

### Sequence
1. Cancel current positional movement/behavior.
2. Enter `ROLLING`.
3. Play `roll_01 → roll_02 → roll_03 → roll_04`.
4. Enter `ROLLED`.
5. Hold `roll_04` for exactly 3 seconds.
6. Enter `UNROLLING`.
7. Play `roll_04 → roll_03 → roll_02 → roll_01`.
8. Enter a short `IDLE`.
9. Return to normal wandering.

### Input Lock
During `ROLLING`, `ROLLED`, or `UNROLLING`:
- Additional clicks/taps are ignored.
- They do not restart animation.
- They do not extend the 3-second hold.

### Priority
Roll interaction has priority over food behavior.

If player clicks an isopod in `MOVING_TO_FOOD` or `AT_FOOD`, cancel its food task and begin the roll sequence.

## 5. Feeding

### Bowl
- Exactly one fixed bowl.
- Bowl does not move in V0.1.
- Bowl is a functional target but not a collision obstacle.

### Food Types
Supported food: carrot and Bauhinia leaf. Initial state: empty bowl.

Food controls:
- Increase the selected food quantity by one, clamped to a maximum of three.
- Show the matching carrot or Bauhinia-leaf quantity sprite for one, two, or three servings.
- Render only the sprite matching the current quantity rather than stacking quantity sprites.
- Switching type replaces the current food and starts the new type at one serving.
- A new type invalidates the previous food lifecycle and starts a fresh 1–3 second discovery; quantity changes do not create or reset food tasks.

Food remains until consumed or replaced. Each successful group participant consumes one serving.

## 6. Food Discovery
When a newly placed food type is eligible to start discovery:
1. Start a random delay of 1–3 seconds.
2. At the end of delay, read each isopod's latest state and satiety and choose up to the current food amount.
3. Eligible means the state is `IDLE` or `WANDERING` and satiety is at or below 70.
4. Assign each selected isopod a distinct gathering slot.

Order eligible isopods by lowest satiety. If a tie crosses the food-amount cutoff, randomize within that tied group. Event membership is fixed once assigned; same-type food additions wait for the next discovery.

If no isopod is eligible at selection time, leave food untouched and retry after a short 500–1000 ms delay rather than breaking the game or busy-looping. Each retry reads current state and satiety.

One to three isopods may receive a food task, never exceeding the current serving count. Each receives a different geometry-derived slot around the actual bowl and remains visually distinguishable from the others.

After successful group consumption, remaining food waits a random 8–15 seconds before starting another independent discovery event. Only one discovery timer or active group event may exist at once. An empty bowl stops automatic discovery.

## 7. Moving to Food
Each selected participant:
- Enters `MOVING_TO_FOOD`.
- Stops choosing random destinations.
- Moves slowly toward its assigned slot near the actual bowl geometry.
- Uses the same general visual movement speed as normal wandering.

On arrival:
- Enter `AT_FOOD`.
- Report arrival and remain near the bowl. After all remaining participants arrive, one shared gathering timer lasts a random 6–10 seconds.
- Continue using the idle sprite while the sprite/Roll layer independently bobs 2–4 px toward the bowl and back every 300–500 ms. Slot geometry determines direction, and per-actor duration/distance/phase variation prevents synchronized motion.
- The actor wrapper, name, info button, and gathering slot remain stationary. Leaving `AT_FOOD` immediately removes the visual motion without affecting gameplay timing.
- No dedicated eating sprite is played.
- When the shared timer completes, consume one serving per remaining participant in one atomic group result and show the matching lower quantity or empty bowl.
- The same result adds 30 satiety once to every successful participant, clamped at 100.
- The same valid result refreshes one independent 1.8-second `fed_happy.png` feedback bubble above every successful consumer. It is actor-bound, non-interactive, and outside the mirrored sprite layer.
- Then return to `IDLE` and resume normal wandering.

If Roll interrupts `MOVING_TO_FOOD` or `AT_FOOD`, remove only that participant; it consumes nothing, gains no satiety, and shows no fed/happy feedback while the remaining group continues. If no participant remains, schedule remaining food after 8–15 seconds. Replacing the food type invalidates the entire old group and shared timer so no old task can consume the new food, add satiety, or show feedback.

## 8. Animation Assets

Every registered species uses this asset convention under `src/assets/isopod/<species>/`:

```text
<species>/
├── idle/
│   ├── idle_01.png
│   └── idle_02.png
├── walk/
│   ├── walk_left_01.png
│   ├── walk_left_02.png
│   ├── walk_left_03.png
│   └── walk_left_04.png
└── roll/
    ├── roll_01.png
    ├── roll_02.png
    ├── roll_03.png
    └── roll_04.png
```

Food:
```text
food/
├── food_bowl.png
├── carrot_slice.png
├── carrot_slices_2.png
├── carrot_slices_3.png
├── bauhinia_leaf_01.png
├── bauhinia_leaf_02.png
└── bauhinia_leaf_03.png
```

UI feedback:
```text
ui/
└── fed_happy.png
```

### Rendering
- Pixel art should remain crisp.
- Use `image-rendering: pixelated` where appropriate.
- Right-facing walk uses horizontal mirroring.
- Unroll uses roll frames in reverse order.

## 9. Scene Art
The scene is a cute pixel-art interpretation of a realistic isopod enclosure.

Visual layers may include:
1. Page/background
2. Terrarium outer frame/transparent wall
3. Substrate
4. Decorative habitat objects
5. Bowl/current food
6. Isopods
7. Foreground glass highlight if it does not obstruct interaction

No scene object collision is required.

## 10. Future Ideas — Not V0.1
Ideas intentionally deferred:
- Nutrition differences and food preferences
- Persistent names and additional identity traits
- Species-specific preferences
- Hiding
- Molting
- Breeding
- Juveniles
- Environmental stats
- Pest invasions, including cockroaches stealing food
- Collection/encyclopedia
- More species beyond the Phase 4A registry
- In-game resident replacement until Phase 4C
