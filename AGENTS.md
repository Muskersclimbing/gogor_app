# AGENTS.md

## Purpose

Gogor Games is an Expo/React Native app for finger strength warmup and training using BLE devices.

Currently supported devices:
- Tindeq Progressor
- Pitchsix Force Board

Current gameplay:
- Main flow: `home -> mode-select -> connect -> game -> results`
- The game uses a force-controlled Flappy Bird variant.
- Custom games also exist and are stored through `customGamesService`.

## Stack and scripts

- Expo Router + React Native 0.81 + React 19
- BLE via `@hangtime/grip-connect-react-native`
- Styling with NativeWind
- Audio with `expo-av`

Main scripts from `package.json`:
- `pnpm dev`
- `pnpm check`
- `pnpm lint`
- `pnpm test`
- `pnpm android`
- `pnpm ios`

## Runtime constraints

- `Expo Go` cannot be used for BLE.
- Bluetooth testing requires a development build or native build.
- On web, the BLE service is expected to fail by design.

## Canonical files

- `app/(tabs)/index.tsx`: home
- `app/mode-select.tsx`: mode selection and custom games
- `app/connect.tsx`: BLE scan and connection
- `app/game.tsx`: main game flow, calibration, timer, and navigation
- `app/results.tsx`: final summary
- `components/flappy-bird-game.tsx`: game loop, obstacles, fruit, collisions, and audio
- `lib/force-device-service.ts`: active BLE service
- `lib/custom-games-service.ts`: custom game persistence

Legacy/non-canonical files:
- `lib/tindeq-service.ts`
- `lib/force-device-service-new.ts`

These should not be treated as the primary reference unless an intentional migration is underway.

## BLE and devices

The live app uses `lib/force-device-service.ts`.

Name-based detection:
- `progressor` or `tindeq` -> `tindeq`
- `force board`, `pitchsix`, or `force` -> `force_board`

Current service contract:
- `scanForDevices(onDeviceFound)`
- `connect(deviceId, deviceType)`
- `tare()`
- `startMeasurement()`
- `stopMeasurement()`
- `readBattery()`
- force, battery, and connection listeners

## Useful Tindeq notes

If low-level protocol work is needed:
- Service UUID: `7e4e1701-1ea6-40c9-9dcc-13d34ffead57`
- Data Point UUID: `7e4e1702-1ea6-40c9-9dcc-13d34ffead57`
- Control Point UUID: `7e4e1703-1ea6-40c9-9dcc-13d34ffead57`

Relevant commands:
- `0x64`: tare
- `0x65`: start measurement
- `0x66`: stop measurement
- `0x6E`: shutdown
- `0x6F`: battery

Force response:
- Response code `0x01`
- payload: `float32 weight` + `uint32 timestamp`
- little endian
- expected frequency: `80 Hz`

## Modes and current behavior

Built-in modes:
- `quick`: 180s, target 15 fruit
- `total`: 300s, target 25 fruit

Actual state in `app/game.tsx` today:
- both modes use a single fixed scene
- there is no active night transition
- the real `GameMode` type is `"quick" | "total"`
- `resistance` appears in old docs, but is not implemented in the current flow

Custom games:
- they load when `mode === "custom"` and `gameId` is present
- minimum duration is forced to `60s`
- fruit goal is derived from `duration / 15`

## UI and assets

Active backgrounds:
- `assets/images/yosemite-day.png`
- `assets/images/yosemite-night.png`
- `assets/images/utah-day.png`
- `assets/images/utah-night.png`
- `assets/images/albarracin-day.png`
- `assets/images/albarracin-night.png`
- `assets/images/fontainebleau-day.png`
- `assets/images/fontainebleau-night.png`

Active sprites:
- `assets/sprites/*.png`

Active in-game audio:
- `assets/audio/background_music.wav`
- `assets/audio/fruit_collect.wav`

## Active discrepancies to keep in mind

- `app/mode-select.tsx` describes `Calentamiento Total` as having 2 scenes and a night transition, but `app/game.tsx` does not implement that right now.
- The home screen still says "Juego de fuerza con Tindeq Progressor" even though the app already supports Force Board.
- Some legacy docs and service files were removed or are unused; if they reappear, validate against live code before trusting them.

## Documentation rule going forward

- Keep only `AGENTS.md` at the repo root as the operational source of truth.
- Do not create temporary handoff, historical debug, or "tomorrow" root notes again.
- If a bug is fixed, document it in code or commits, not in new root-level `.md` files.
