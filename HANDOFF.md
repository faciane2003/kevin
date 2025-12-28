# Jacuzzi City Handoff

## Project overview
- React + Babylon.js (Vite) project in `c:\Users\Ames\Desktop\Projects\kevin`.
- Main scene bootstrap: `src/world/BabylonWorld.tsx` (creates engine, scene, camera, lighting, world content, input).
- HUD/menus: `src/components/hud/HUD.tsx`, `src/components/hud/MenuTabs.tsx`, `src/components/hud/JournalPanel.tsx`, `src/components/hud/StatsBars.tsx`.
- Audio: `src/components/sounds/WorldSounds.tsx`.
- World sub-systems (fog, birds, etc.): `src/components/world/*`.

## Key runtime components
- `BabylonWorld.tsx`
  - Owns scene, camera, lights, fog, player, world meshes, perf toggles.
  - Listens to debug CustomEvents for settings updates (see events list).
  - Fog master animation: `fogOpacityMaster` is driven by a timer; it stays 0 for 10s on load, then oscillates with a slow sine. This master is multiplied into all fog layers and scene fog density.
  - Mobile performance staging: on touch devices, perf settings default off and are enabled every 3s in a staged order (borderFog -> windowFlicker -> gargoyles -> collisions -> glow -> postFx).
  - Player halo (black ground disc) is rendered under the player via a DynamicTexture; controllable by `player-halo-settings`.
  - HUD close event (`hud-close`) triggers pointer lock on desktop (non-touch).

- `HUD.tsx`
  - Renders the HUD and a transparent overlay button to close any open HUD panel. Overlay is only shown when a panel is open and dispatches `hud-close`.

- `MenuTabs.tsx`
  - Left-side icon stack with a power button. Emits `power-toggle` (expand/collapse) and `hud-panel-state` (open/closed). Adds blue sparkles behind icons.

- `DebugPanel.tsx`
  - Master debug GUI. Toggle with `g`. Emits all settings via CustomEvents.
  - Contains sections for camera, lighting, fog layers, stars, post-FX, performance, asset toggles, realism extras, and player halo.

- `WorldSounds.tsx`
  - Manages SFX + music. Uses Babylon `Sound` with HTMLAudio fallback.
  - Playlist tracks: Miss Misery, Sycamore, Synthwave, Drop the Game, After Dark, Dark All Day, Earthquake, Flight of the Navigator.
  - Music volume is controlled by `musicGain` (default 0.3). HTML and Babylon audio both follow it.
  - Power button sounds (expand/collapse) are wired to `sfx_poweron.m4a` and `sfx_poweroff.m4a`.

- World subcomponents
  - Fog: `TopFog.tsx`, `MiddleFog.tsx`, `BottomFog.tsx`, `BorderFog.tsx`, `GroundFog.tsx` (mesh-based, opacity + timeScale animations).
  - Stars: `CityStars.tsx` (opacity animation + positioning).
  - Windows: `BuildingWindowFlicker.tsx` (per-building flicker with random colors).
  - Trees: `TreeField.tsx` (procedural tree placement + variation).
  - Other systems: `BirdFlocks.tsx`, `NewspaperDrift.tsx`, `CloudLayer.tsx`, `GargoyleStatues.tsx`, `RealismExtras.tsx`, `TrainSystem.tsx`, `RainSystem.tsx` (some may be disabled by perf toggles).

## Settings/events (CustomEvent bus)
Emitted by `DebugPanel.tsx` and consumed in `BabylonWorld.tsx`:
- `camera-start-update`
- `light-settings`
- `building-settings`
- `top-fog-settings`
- `middle-fog-settings`
- `bottom-fog-settings`
- `performance-settings`
- `star-settings`
- `player-halo-settings`
- `cloud-settings`
- `postfx-settings`
- `asset-toggles`
- `realism-settings`

Other HUD/audio events:
- `hud-close` (close panels + relock pointer on desktop)
- `hud-panel-state` (panel open/closed state)
- `power-toggle` (power icon expand/collapse, plays sfx)
- `music-visibility` (music HUD visibility/panel position)

## Debug panel defaults (from `DebugPanel.tsx`)
- Lighting: hemi 0.6, ambient 2.65, moon 1.4, moon spotlight angle 1.32, glow 0.7, fog enabled.
- Buildings: seed 4864, count 800, scale 1.4.
- Top fog: opacity 0.02, blur 2, height 164, radius 1200.
- Middle fog: opacity 0.02, blur 7, height 74.
- Bottom fog: opacity 0.0, blur 6, height 2.
- Stars: count 55, radius 200, height 165–440, scale 0.8.
- Performance: glow/postFx/collisions/windowFlicker/borderFog/gargoyles true.
- Asset toggles: glowSculptures, cats, neonBillboards true; clouds false; airplanes true.

## Controls (current)
- Debug GUI: `g`.
- Border fog panel: `f`.
- Ground fog panel: `u`.
- Building panel: `b`.
- Performance panel: `o`.
- Sky effects panel: `k`.
- HUD panel hotkeys: number keys and `i` for Items (see `HUD.tsx`).

## Assets of note
- Textures: `public/textures/*` (asphalt, sky, moon, etc.).
- Ads: `public/ads/small/*.jpg`.
- Models: `public/models/*.glb` (cat.glb, bird.glb, etc.).
- Sounds: `public/sounds/*.m4a` including power sfx, music tracks, ambient/cat/wind/footsteps.

## Known behavior
- Fog opacity is globally gated by `fogOpacityMaster` in `BabylonWorld.tsx`. It stays off for 10 seconds at boot and then fades/oscillates.
- On mobile, heavy systems are off by default and re-enable in stages every 3 seconds.
- Menu icon sparkles are purely CSS (`HUD.css`).

## Build/dev
- Build: `npm run build`.
- Dev: `npm run dev -- --host` for LAN testing.

## Recent decisions
- Audio and HUD are expected to work without prompts on mobile after first gesture.
- Asset budget target: 40 MB (future incoming GLB set).

## TODO for next agent
- Place 24+ new GLB models (<=40 MB total) with labels in front of the player.
- Add additional sci-fi/cyberpunk set dressing (100+ elements) and wire toggles in debug GUI.
- Confirm fog timing expectations (currently 10s delay + oscillation) match desired behavior.

