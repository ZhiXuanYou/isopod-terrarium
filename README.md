# Isopod Terrarium

A small browser-based pixel-art terrarium prototype featuring three independently simulated isopod residents selected from a six-species registry.

## V0.1 Goal
Open the web page, choose exactly three isopod residents from the six-species registry, then enter a transparent, cute pixel-art terrarium. Each selected slot becomes an independently identified resident while sharing the existing movement, Roll, feeding, satiety, naming, and status systems.

## Tech Stack
- React
- TypeScript
- Vite
- CSS

## V0.1 Has No Backend
V0.1 intentionally does not use:
- Supabase
- Database
- Authentication
- Phaser
- Cloud save
- Multiplayer

## Documentation
- `AGENTS.md` — rules for coding agents
- `docs/PRODUCT_SPEC.md` — product scope and acceptance criteria
- `docs/GAME_DESIGN.md` — game behavior and state rules
- `docs/DEVELOPMENT_WORKFLOW.md` — implementation phases and validation

## Assets
Species sprite assets are stored under `src/assets/isopod/<species>/` with shared idle, walk, and roll frame conventions.

The initial art direction is cute retro pixel art with a lightly realistic isopod-terrarium foundation.
