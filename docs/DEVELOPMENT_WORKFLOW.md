# Development Workflow — V0.1

## 1. General Rule
Implement V0.1 incrementally. Each phase must be runnable and verifiable before proceeding.

Do not deploy or add future features during these phases.

## 2. Phase 0 — Repository Preparation
Goal:
- Create/prepare Git repository.
- Add project documentation.
- Add approved art assets when available.

Validation:
- Documentation paths are correct.
- Asset filenames/paths are known.

No application implementation is required yet.

## 3. Phase 1 — React Foundation
Goal:
- Initialize React + TypeScript + Vite.
- Remove unnecessary starter/demo content.
- Establish minimal app structure.
- Add responsive page shell.

Validation:
- Development server starts.
- TypeScript check passes.
- Production build passes.

Do not implement game behavior yet.

## 4. Phase 2 — Static Terrarium Scene
Goal:
- Render the V0.1 terrarium.
- Add substrate and approved decorative visual elements.
- Add fixed empty food bowl.
- Add 3 static Panda King isopods.
- Add `🥕 餵食` button.
- Support desktop/mobile layout.

Validation:
- Exactly 3 isopods visible.
- Bowl visible.
- Scene scales without overflow/broken layout.
- Pixel art renders crisply.

No autonomous movement yet.

## 5. Phase 3 — Independent Wandering
Goal:
- Add `IDLE` and `WANDERING`.
- Each isopod independently selects destinations and timing.
- Implement left/right sprite facing.
- Implement walk/idle animation.
- Keep sprites inside safe bounds.

Validation:
- Three isopods do not intentionally synchronize.
- Movement is slow.
- Destinations vary.
- No sprite visibly leaves terrarium.
- Right movement uses horizontal mirror.
- Diagonal movement does not rotate sprite.

## 6. Phase 4 — Roll Interaction
Goal:
- Clicking/tapping an isopod triggers roll sequence.
- Stop its movement.
- Hold rolled state exactly 3 seconds.
- Reverse animation to unroll.
- Resume ordinary behavior.
- Ignore repeated clicks during roll sequence.

Validation:
- Test all three individuals.
- Test click while wandering.
- Test click while idle.
- Repeated clicks do not extend timer.
- Other isopods continue independently.

## 7. Phase 5 — Feeding
Goal:
- Separate controls feed carrot or Bauhinia leaf, each up to three servings.
- Render only the matching food type and one-, two-, or three-serving sprite.
- Switching food type replaces the bowl contents and restarts that type at one.
- A new type starts discovery only when no discovery or assignment is active.
- Consumption is added separately in Phase 3D.

Validation:
- First, second, and third feeds of either type show their matching quantity sprite.
- Fourth and later feeds remain at three servings.
- Only one quantity sprite is rendered at a time.
- Switching types never stacks both foods or creates duplicate tasks.
- Bowl remains fixed.

## 8. Phase 6 — Food Reaction (superseded by Phase 3H grouping)
Goal:
- On eligible placement of a new food type, wait random 1–3 seconds.
- Choose hungry participants up to the serving count.
- Move them toward distinct geometry-derived slots near the bowl.
- Hold the completed gathering for 6–10 seconds.
- Return participants to normal wandering.
- Roll interaction cancels only the clicked participant.

Validation:
- Participant count never exceeds food amount.
- Non-participants continue normally.
- Participants approach distinct bowl slots and return to wandering after the shared wait.
- Clicking one participant during approach/at-food causes Roll and cancels only its participation.
- Current food remains unchanged during this reaction-only phase; Phase 3D adds consumption after `AT_FOOD`.

## 9. Phase 3D — Food Consumption (extended atomically by Phase 3H)
Goal:
- Completed group gathering consumes exactly one serving per successful participant.
- Show the matching lower-quantity sprite or the empty bowl.
- If food remains, start the next independent discovery after a random 8–15 seconds.
- Roll interruption consumes nothing and reschedules remaining food after 8–15 seconds.
- Replacing the food type cancels the old discovery, assignment, and pending consumption before starting a fresh 1–3 second initial discovery.

Validation:
- Carrot and Bauhinia both progress from three to two to one to zero.
- No amount goes below zero or above three.
- Only one discovery timer or active group event exists at a time.
- Same-type quantity increases do not duplicate or reset the active lifecycle.
- Replacement food cannot be consumed by an assignment created for the previous type.
- An empty bowl stops automatic discovery.

## 10. Phase 3E — Hunger / Satiety System
Goal:
- Give each Panda King independent satiety initialized from 60 to 90.
- Decay satiety by one every 10 seconds, clamped from 0 to 100.
- Restrict food eligibility to `IDLE`/`WANDERING` isopods at satiety 70 or below.
- Prioritize the lowest-satiety candidate and randomly resolve exact ties.
- Add 30 satiety only when the same valid food task successfully consumes one serving.
- Keep Phase 3D initial discovery, eating, and subsequent discovery timing unchanged.

Validation:
- Independent satiety values decay without duplicate intervals or stale updates.
- Non-hungry isopods are never assigned; no-hungry discovery retries without consuming food.
- Lowest satiety wins and exact ties randomize only among tied eligible candidates.
- Successful consumption clamps satiety at 100 and food at zero.
- Roll interruption and food replacement neither consume food nor add satiety.
- No hunger UI appears in the production terrarium.

## 11. Phase 3F — Isopod Status UI
Goal:
- Add a separate accessible info control that follows each Panda King without replacing the Roll target.
- Show at most one status panel below the terrarium.
- Display species, individual display name, live satiety number/bar, and localized live behavior state.
- Allow switching individuals and closing the panel without changing gameplay.

Validation:
- Clicking an isopod body still rolls it and does not open the panel.
- Clicking info never rolls the isopod and switches the single panel to the selected individual.
- Satiety decay, successful feeding, movement, food states, and Roll states update live in the open panel.
- The panel and info hit targets remain usable without horizontal overflow on desktop and mobile.

## 12. Phase 3G — Individual Identity / Naming
Goal:
- Store one optional custom name per existing isopod ID in the Terrarium coordinator.
- Resolve every formal display label from a single custom-name-or-default-name rule.
- Add an inline status-panel editor with confirm, cancel, Enter, Escape, and 1–12 character validation.
- Show the resolved custom name beside each actor's info control, falling back to compact `#1`–`#3` labels.
- Keep custom names session-only with no persistence.

Validation:
- Naming one individual does not rename another; duplicate names are allowed.
- Panel titles and accessible info/Roll labels update immediately and use defaults when unnamed.
- Empty, whitespace-only, and over-12-character values are rejected inline.
- Closing and reopening a panel retains names during the session, while browser reload restores defaults.
- Renaming in every behavior state leaves movement, Roll, feeding, food, assignment, and satiety unchanged.
- Desktop and mobile editors remain usable without horizontal overflow.
- Actor labels update immediately, follow movement without mirroring, truncate long names, and cannot trigger Roll.

## 13. Phase 3H — Group Feeding / Gathering
Goal:
- Replace the single food assignment with one group event containing up to three hungry participants, limited by serving count.
- Prioritize lowest satiety, assign distinct responsive gathering slots, and freeze event membership after assignment.
- Start one shared 6–10 second gathering timer after all remaining participants arrive.
- Atomically consume one serving and add 30 satiety per successful participant.
- Preserve per-participant Roll cancellation, whole-group replacement invalidation, and 8–15 second subsequent discovery.

Validation:
- Food amounts one, two, and three select at most one, two, and three participants respectively.
- Participants occupy distinct in-bounds slots and do not completely overlap on desktop or mobile.
- Same-food additions do not change active membership; replacement cancels the whole old group.
- Roll removes only the clicked participant without consuming or adding satiety for it.
- Group completion cannot lose decrements to stale state and remaining food schedules exactly one subsequent discovery.
- Status, naming, actor labels, wandering, facing, and responsive layout remain intact.

### Phase 3H Completion Feedback Polish
Goal:
- Show `fed_happy.png` independently above every Panda King that completes a valid consumption.
- Keep the bubble visible for 1.8 seconds, refreshing rather than stacking if the same actor consumes again.
- Keep feedback outside sprite-facing transforms and make it non-interactive.

Validation:
- Food decrement, satiety gain, and bubble occur together only for valid successful consumers.
- Roll interruption, food replacement, and stale assignments show no bubble.
- Group consumers each receive their own bubble without delaying movement or blocking Roll/info controls.
- Desktop and mobile remain in bounds without horizontal overflow or console warnings.

## 14. Phase 3I — Eating Animation Polish
Goal:
- During `AT_FOOD`, use the existing idle sprite with a subtle 2–4 px forward-and-back bob toward the bowl every 300–500 ms.
- Derive direction from the assigned gathering slot and vary duration, distance, and phase per actor.
- Keep the gathering position and actor UI stationary, and stop motion immediately when `AT_FOOD` ends.

Validation:
- Eating motion is visible but restrained on desktop and mobile, with no drift, rotation, mirroring regression, or overflow.
- Multiple participants do not bob in mechanical synchronization.
- Roll interruption immediately stops bobbing and still consumes no food, adds no satiety, and shows no happy bubble.
- Normal completion still atomically consumes food, adds satiety, shows happy feedback, and returns the actor to autonomous behavior.

## 15. Phase 4A — Multi-Species Foundation
Goal:
- Register Panda King, Lemon Blue, Magic Potion, Sakura, Amber, and Golden in one data-driven species registry.
- Separate stable resident identity from species identity and keep all runtime gameplay/UI state keyed by resident ID.
- Resolve idle, walk, Roll, default display name, and status species from the resident's registry definition.
- Use a centralized temporary three-resident roster for development verification; do not add player selection UI.

Validation:
- All six species provide the exact shared ten-frame asset structure and every PNG is readable.
- Lemon Blue, Sakura, and Golden simultaneously share all existing gameplay without species-specific component branches.
- Two Sakura residents remain independent in movement, satiety, Roll, naming, feeding assignment, and feedback.
- Desktop/mobile layout, status panel, actor labels, feeding, gathering, consumption, eating bob, and happy feedback remain intact.
- Phase 4B initial three-resident selection is not implemented.

## 16. Phase 4B — Initial Resident Selection
Goal:
- Show the registry-driven species selection screen before the terrarium.
- Require exactly three explicit slots, allow duplicate species, and create stable independent residents on start.
- Enter the existing terrarium through React state without reload or persistence.

Validation:
- Start is disabled with zero, one, or two filled slots and becomes disabled again when a filled slot is cleared.
- Lemon Blue/Sakura/Golden, Sakura/Sakura/Golden, and Panda King/Panda King/Panda King all create the correct independent residents.
- Registry additions naturally appear as cards without another hard-coded list.
- Desktop/mobile selection, touch targets, preview art, and selected slots have no horizontal overflow.
- Existing wandering, Roll, naming, status, satiety, feeding, gathering, consumption, eating bob, and happy feedback remain intact.
- Reload returns to selection; no storage or backend is introduced.

## 17. Phase 4C — In-Game Resident Replacement (deferred)
Goal:
- Add resident replacement or management only in a later approved phase.

Phase 4B must not implement in-game replacement.

## 18. Phase 7 — Final V0.1 Verification
Run:
- TypeScript checks
- Automated tests if present
- Production build
- Manual desktop verification
- Manual mobile/responsive verification

Verify all acceptance criteria in `PRODUCT_SPEC.md`.

## 19. Codex Work Pattern
Before each coding phase:
1. Read `AGENTS.md`.
2. Read relevant specs.
3. Inspect current source.
4. State the implementation plan.
5. Identify any spec conflict before coding.

After each phase:
1. Run relevant checks.
2. Report changed files.
3. Report test/build results.
4. Report manual verification still needed.
5. Stop. Do not automatically begin the next phase.

## 20. Deployment
Deployment is outside the initial implementation workflow.

Netlify may be added after local V0.1 is accepted by the user.

Supabase is explicitly not required for V0.1.
