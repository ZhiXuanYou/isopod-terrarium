# AGENTS.md

## Project
Isopod Terrarium — V0.1 Prototype

## Source of Truth
Documentation is the source of truth.

Before implementation, read:
1. `AGENTS.md`
2. `docs/PRODUCT_SPEC.md`
3. `docs/GAME_DESIGN.md`
4. `docs/DEVELOPMENT_WORKFLOW.md`
5. Relevant existing source files

If implementation would conflict with documentation, do not silently deviate. Report the conflict and update the relevant specification first.

## Engineering Rules
- Use React + TypeScript + Vite.
- Keep TypeScript strict and avoid `any` unless explicitly justified.
- Keep components small and focused.
- Separate game behavior/state from presentation where practical.
- Keep tunable game values in centralized constants/configuration rather than scattering magic numbers.
- Do not add dependencies unless they are necessary and justified.
- Do not introduce a backend in V0.1.
- Do not introduce Supabase, authentication, database, Phaser, or server code in V0.1.
- Do not implement features outside the documented V0.1 scope.
- Preserve responsive behavior for desktop and mobile.
- Pixel-art assets must render crisply.

## Change Discipline
- Implement only the requested phase.
- Do not opportunistically add future features.
- Do not deploy unless explicitly requested.
- Do not push to a remote repository unless explicitly requested.
- When behavior changes, update the relevant documentation in the same change.

## Completion Report
After each phase, report:
- Files created/modified
- Behavior implemented
- Tests/checks run and results
- Any assumptions or unresolved issues
- Whether manual verification is required
