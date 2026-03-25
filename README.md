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

- Expo
- React Native
- React
- NativeWind
- `@hangtime/grip-connect-react-native` for BLE

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

## Testing On Your Phone

Because the game uses BLE, you cannot test it in Expo Go. Use a development build on a real device.

### iPhone or Android on your local machine

1. Install dependencies:

```bash
pnpm install
```

2. Start Metro in dev-client mode:

```bash
pnpm dev
```

3. Install a development build on your phone:

```bash
# iPhone with a connected device
npx expo run:ios --device

# Android with a connected device
npx expo run:android -d
```

4. After the app is installed, open it on your phone and connect it to the local Metro server.

Notes:

- iPhone testing requires a Mac, Xcode, an Apple developer signing setup, and a physically connected or trusted device.
- Android testing requires USB debugging enabled on the device.
- Your phone and computer should be on the same network when connecting to Metro.
- BLE testing should be done on the phone, not on web.

### Internal development build with EAS

If you want to install the app on a phone without building locally each time, use the `development` profile from `eas.json`:

```bash
eas build --platform ios --profile development
eas build --platform android --profile development
```

That profile creates a development client (`developmentClient: true`) for internal distribution. After installing the build on your phone:

1. Run `pnpm dev` on your computer.
2. Open the dev client on your phone.
3. Connect to the local Metro server from the dev client launcher.

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
