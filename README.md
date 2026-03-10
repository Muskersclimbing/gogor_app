# Gogor Games

Gogor Games is an Expo and React Native app for finger strength warmup and training with BLE-connected force devices.

Currently supported devices:
- Tindeq Progressor
- Pitchsix Force Board

Current gameplay flow:
- `home -> mode-select -> connect -> game -> results`
- Main game: a force-controlled Flappy Bird variant
- Custom games persisted through `customGamesService`

## Stack

- Expo Router
- React Native 0.83
- React 19
- NativeWind
- `@hangtime/grip-connect-react-native` for BLE
- `expo-audio` and `expo-video`

## Requirements

- Node.js 22+
- `pnpm`
- Xcode for iOS builds
- Android Studio for Android builds

Install dependencies:

```bash
pnpm install
```

## Development

BLE does not work in Expo Go. Use a development build or native run target.

Start the default development workflow:

```bash
pnpm dev
```

This starts:
- the local server watcher
- Expo Metro in `--dev-client` mode

Start web-only development:

```bash
pnpm dev:web
```

## Common scripts

```bash
pnpm check
pnpm lint
pnpm test
pnpm ios
pnpm android
```

## EAS builds

The project is configured for EAS Build with settings in `eas.json`.

Useful commands:

```bash
eas build --platform ios --clear-cache
eas build --platform android --clear-cache
```

If EAS reports plugin resolution errors locally, make sure dependencies are installed before running:

```bash
npx expo config --json
```

## BLE notes

The active BLE integration lives in `lib/force-device-service.ts`.

Device name detection:
- `progressor` or `tindeq` -> `tindeq`
- `force board`, `pitchsix`, or `force` -> `force_board`

Web is expected to fail for BLE-related behavior by design.

## Main app files

- `app/(tabs)/index.tsx`: home
- `app/mode-select.tsx`: mode selection and custom games
- `app/connect.tsx`: BLE scanning and connection
- `app/game.tsx`: main game flow
- `app/results.tsx`: results summary
- `components/flappy-bird-game.tsx`: gameplay loop
- `lib/custom-games-service.ts`: custom game persistence

