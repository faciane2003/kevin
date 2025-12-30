# Jacuzzi City Handoff

## Project overview
- React + Babylon.js (Vite) project in `c:\Users\Ames\Desktop\Projects\kevin`.
- Main scene bootstrap: `src/world/BabylonWorld.tsx` (creates engine, scene, camera, lighting, world content, input).
- HUD/menus: `src/components/hud/HUD.tsx`, `src/components/hud/MenuTabs.tsx`, `src/components/hud/JournalPanel.tsx`, `src/components/hud/StatsBars.tsx`.
- Audio: `src/components/sounds/WorldSounds.tsx`.
- World sub-systems (fog, birds, etc.): `src/components/world/*`.

## Key runtime components

### `BabylonWorld.tsx`
- Owns scene, camera, lights, fog, player, world meshes, perf toggles.
- Listens to debug CustomEvents for settings updates (see events list).
- Fog master animation: `fogOpacityRef` is used to modulate scene fog density; fog sphere settings are driven by `fog-sphere-settings`.
- Mobile performance staging: on touch devices, perf settings default off and are enabled every 3s in a staged order:
  - `windowFlicker` → `gargoyles` → `collisions` → `glow` → `postFx`.
- Player:
  - Camera: `UniversalCamera` in `WorldSceneController`, referenced via `cameraRef`.
  - Walk input: `walkInputActive` + `walkInputActiveRef`.
- HUD close event (`hud-close`) triggers pointer lock on desktop (non-touch).

### `WorldSceneController.tsx` (main Babylon scene logic)
- Responsible for:
  - Creating engine and scene (`Engine`, `Scene`).
  - Setting up camera, collisions, and first-person movement.
  - Lighting: hemispheric lights, moon directional + spot, glow layer.
  - Ground PBR material.
  - Procedural buildings and LOD.
  - Neon signs and billboards.
  - Drones, cats, pickups, NPCs, drones, airplanes with trails.
  - Post-processing pipeline (FXAA, depth of field, color curves).
  - Touch controls (walk/look zones) and hints/sparkles.
  - Various Debug/CustomEvents (performance, star settings, asset toggles, realism settings, etc.).

Key notes:
- Touch controls:
  - `interactZone`, `walkZone`, `lookZone`, `walkLabelZone` are created only on touch devices.
  - Sparkles and hint animations are capped (`Math.min(count, isTouchDevice ? 8 : 18)`) and cleaned up on unmount.
- Building system:
  - Uses `BuildingInfo` via `buildingInfosRef`.
  - Building geometry: boxes with varied shapes (tower, squat, slab, etc.), plus optional neon panels and frames.
  - `createBuildingMaterial` uses a dynamic texture for windows with randomized lit/off patterns.
  - Materials and the neon frame texture are cached:
    - `cachedBuildingMatsRef` stores building materials.
    - `cachedNeonFrameTex` stores a shared neon frame `DynamicTexture`.
  - `rebuildBuildings`:
    - Disposes only meshes and neon meshes, reuses materials/textures.
    - Applies building tiling via `applyBuildingTiling()`.
    - Writes new `BuildingInfo[]` into `buildingInfosRef` and `setBuildingInfos`.
    - Updates `ShootingStars` min/max height based on tallest building.
  - LOD metadata:
    - Each building (`b`) gets `_lodData = { collider, neonPanels: [...] }`.
    - A `lodObserver` in `scene.onBeforeRenderObservable`:
      - Computes distance from camera.
      - Disables building colliders when very far (`dist > veryFarBuildingDistance`).
      - Hides neon panels when far (`dist > farBuildingDistance`).
      - Dims emissive windows for very far buildings.
- Ground:
  - PBR material with asphalt textures.
  - On touch devices:
    - No bump/metallic maps (`isTouchDevice` guard).
  - Tiling: `groundTiling = isTouchDevice ? 40 : 70`.
- PostFX:
  - Uses `DefaultRenderingPipeline` with:
    - `fxaaEnabled = !isTouchDevice`.
    - `depthOfFieldEnabled = !isTouchDevice`.
    - Color curves configured via `ColorCurves`.
  - `applyPostFx` applies debug panel changes:
    - Toggles pipeline enabled state.
    - Adjusts DoF and color curves.
  - On touch:
    - Reduces DoF blur.
    - Reduces glow intensity.
    - Slightly reduces fog density.
- Neon billboards:
  - Textured via `createNeonSignTexture`.
  - Bulbs:
    - Instanced from a single `bulbSource` sphere:
      - `bulbSource.createInstance(...)`.
    - Fewer bulbs on touch (spacing increased).
    - Added to glow layer via `glowLayer.addExcludedMesh(top as unknown as Mesh)` to satisfy TS types.
- Movement:
  - WASD + mouse look.
  - Eye height: `eyeHeight = 2`.
  - Gravity/jump integration:
    - Uses raycast (`scene.pickWithRay`) to find ground height.
    - Clamps camera Y to groundY + eyeHeight.
    - `verticalVel` updated with gravity and jump, clamped on ground contact.
  - Walk input from custom touch zones is merged into movement vector.

### `HUD.tsx`
- Renders HUD panels and a transparent overlay button to close any open HUD panel.
- Overlay only visible when a panel is open; dispatches `hud-close`.

### `MenuTabs.tsx`
- Left-hand vertical icon bar with a power button.
- Emits:
  - `power-toggle` (expanded/collapsed state).
  - `hud-panel-state` (panel open/closed).
- Adds sparkles behind icons via CSS/JS.

### `DebugPanel.tsx`
- Debug GUI toggled with `g`.
- Emits many settings via CustomEvents:
  - Camera, light, building, fog layers, stars, post-FX, performance, asset toggles, realism settings, player halo.
- Central control for the scene’s parameters.

### `WorldSounds.tsx`
- Uses Babylon `Sound` plus HTML `<audio>` fallback.
- Manages ambient SFX and a music playlist.
- `musicGain` controls volume for both systems.
- Power toggle sfx for HUD power icon.

### World subcomponents (`src/components/world`)
- Fog:
  - `FogSphere.tsx`: sphere-based fog overlay controlled via `fogSphereSettings`.
- Stars:
  - `CityStars.tsx`: starfield with glow/fade.
  - `ShootingStars.tsx`: shooting star system.
- Buildings:
  - `BuildingWindowFlicker.tsx`: randomized emissive window flicker.
- Trees:
  - `TreeField.tsx`: procedural tree placements based on building layout and sign positions.
- RealismExtras:
  - `AmbientOcclusionDecals`, `PuddleDecals`, `LightCones`, `SkylineBackdrop`, `CameraBob`, `FootstepZones`, `SteamVents`, `MovingShadows`, `DebrisScatter`, `TrafficLights`, `StreetSigns`, `SirenSweep`, `Banners`, `NightColorGrade`, `AlleyRumble`, `LODManager`, `VegetationSway`, `AlleyFog`.
- Other systems (some disabled or not visible in TS snippet):
  - `CloudLayer.tsx` (removed from BabylonWorld usage).
  - `GargoyleStatues.tsx`, `BirdFlocks.tsx`, `NewspaperDrift.tsx`, etc.

## Settings/events (CustomEvent bus)

Emitted (mostly) by `DebugPanel.tsx` and consumed in `BabylonWorld.tsx` / `WorldSceneController.tsx`:

- `camera-start-update`
- `light-settings`
- `building-settings`
- `performance-settings`
- `star-settings`
- `fog-sphere-settings`
- `postfx-settings`
- `asset-toggles`
- `realism-settings`
- `atmosphere-props-settings`
- `performance-master`
- `tree-positions`
- `walk-input`
- `jump-input`
- `npc-dialogue-open`
- `npc-dialogue-close`
- `npc-dialogue`
- `player-heading`
- `player-move`
- `pickup-item`
- `hud-close`
- `hud-panel-state`
- `power-toggle`
- `music-visibility`
- `interact-input`
- `look-input`
- `camera-info`
- `minimap-data`
- `export-world` (see UE integration section)

## Debug panel defaults (from `DebugPanel.tsx`)
- Lighting:
  - Hemi: 0.6
  - Ambient: 2.65
  - Moon: 1.4
  - Moon spotlight angle: 1.32
  - Glow intensity: 0.7
  - Fog enabled.
- Buildings:
  - Seed: 4864
  - Count: 800
  - Scale: 1.4
- Fog sphere:
  - Opacity: 0.2
  - Blur: 20
  - Radius: 3000
  - FadeTop: 0.68
  - FadeBottom: 0
  - OffsetY: -215
  - Color: `Color3(0.42, 0.46, 0.55)`
- Stars:
  - Count: 55
  - Radius: 200
  - MinHeight: 165
  - MaxHeight: 440
  - Scale: 0.8
- Shooting stars:
  - Count: 4
  - Radius: 800
  - MinHeight: 260
  - MaxHeight: 520
  - Scale: 0.5
- Performance:
  - `glow`, `postFx`, `collisions`, `windowFlicker`, `gargoyles` true (desktop).
  - On touch devices, start off and re-enable in stages via `performance-master`.
- Asset toggles (default in `BabylonWorld.tsx`):
  - `glowSculptures`: true
  - `cats`: true
  - `neonBillboards`: true
  - `clouds`: false (CloudLayer removed from scene)
  - `airplanes`: true
- Realism extras:
  - Most booleans true by default (aoDecals, puddles, lightCones, skyline, cameraBob, footstepZones, steamVents, movingShadows, debris, trafficLights, streetSigns, sirenSweep, banners, nightGrade, vegetationSway, alleyFog).
  - `alleyRumble`: false by default.

## Controls (current)
- Debug GUI: `g`.
- Panels:
  - Building panel: `b`.
  - Performance panel: `o`.
  - Sky effects panel: `k`.
- HUD:
  - Panel hotkeys: number keys and `i` for Items (see `HUD.tsx`).
- First-person:
  - WASD + mouse look on desktop.
  - Touch:
    - Left lower half: Walk (walkZone).
    - Right lower half: Look (lookZone).
    - Top half: Interact (interactZone).

## Assets
- Textures:
  - `public/textures/*` (asphalt, galaxy sky, moon, etc.).
  - Ground: cracked asphalt textures.
  - Sky: `/textures/sky_galaxy.png`.
  - Moon: `/textures/moon.jpg`.
- Ads:
  - `public/ads/small/*.jpg`.
- Models:
  - `public/models/cat.glb`, `bird.glb`, `RiggedFigure.glb`, `CesiumMan.glb`, etc.
- Sounds:
  - `public/sounds/*.m4a`, including power sfx, ambient loops, and music tracks.

## Known behavior
- Fog:
  - Uses Babylon scene `FOGMODE_EXP2` plus `FogSphere` overlay.
  - Fog density is modulated by `fogOpacityRef` and `fog-sphere-settings`.
- NPC dialogue:
  - NPCs are simple meshes spawned via `MeshBuilder.CreateCylinder` and replaced/overlayed with loaded GLBs.
  - `npc-dialogue-open` / `npc-dialogue-close` events manage dialogue UI; auto-close after some time in HUD (not detailed in excerpt).
- Mobile:
  - Heavy systems off at start and re-enable via staged `performance-master` event.
  - Touch zones and hints only for `isTouchDevice`.

## Build/dev
- Build: `npm run build`.
- Dev: `npm run dev` (with Vite).
- Entry HTML:
  - `index.html` uses `<title>Ames Belmont</title>`.

---

## UE Integration (WIP)

Goal: Use `BabylonWorld` as the authoring scene and bring the city layout into Unreal Engine 5.6 for further work (lighting, cinematics, etc.).

### Data export from BabylonWorld

**File:** `src/world/BabylonWorld.tsx`

**Export hook:**

```ts
useEffect(() => {
  const onExportWorld = () => {
    const buildings = buildingInfos.map((info) => ({
      x: info.mesh.position.x,
      y: info.mesh.position.y,
      z: info.mesh.position.z,
      width: info.width,
      depth: info.depth,
      height: info.height,
    }));

    const exportData = {
      buildings,
      roads: { xRoads, zRoads },
    };

    console.log("[EXPORT WORLD]", JSON.stringify(exportData, null, 2));
  };

  window.addEventListener("export-world", onExportWorld as EventListener);
  return () => window.removeEventListener("export-world", onExportWorld as EventListener);
}, [buildingInfos, xRoads, zRoads]);
