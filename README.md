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

Build profiles live in `eas.json`:

- `development` — dev client for internal distribution (BLE testing with Metro)
- `preview` — internal APK/IPA for testers (no store submit)
- `production` — store builds with auto-incrementing version; release scripts also submit

### Development client (cloud)

```bash
eas build --platform ios --profile development
eas build --platform android --profile development
```

### Preview / internal test builds

```bash
pnpm preview:ios
pnpm preview:android
pnpm preview
```

Equivalent raw commands:

```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
eas build --platform all --profile preview
```

`pnpm test:ios`, `pnpm test:android`, and `pnpm test:device` run the same `preview` profile.

### Store release (build + submit)

```bash
pnpm release:ios
pnpm release:android
pnpm release
```

These run `eas build` with the `production` profile and `--auto-submit` (App Store Connect and Google Play per `eas.json` submit config).

Equivalent raw commands:

```bash
eas build --platform ios --profile production --auto-submit
eas build --platform android --profile production --auto-submit
eas build --platform all --profile production --auto-submit
```

Android production submit expects `google-service-account.json` at the repo root.

### Troubleshooting EAS locally

```bash
pnpm install
npx expo config --json
eas build --platform ios --clear-cache
eas build --platform android --clear-cache
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
