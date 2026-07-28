# Building and running — use the package.json scripts

Always drive builds and runs through the `package.json` scripts. Do **not** hand-roll
`xcodebuild`, `xcrun simctl`, `pod install`, or `expo start`/Metro commands — the scripts
already wrap all of that correctly (including the iPhone 17 Pro simulator target, Metro,
install, and launch). Reaching for raw commands is how you end up fighting Metro hostnames,
CocoaPods locale errors, and stale dev-server state.

Use pnpm (the `pn` alias works on this machine):

| Task | Command |
| --- | --- |
| Install deps (applies the required patch) | `pn install` |
| Regenerate the native iOS project | `pn build` (`expo prebuild --platform ios --clean`) |
| Build, install, and run on the simulator | `pn ios` (`expo run:ios --device 'iPhone 17 Pro'`) |
| Start Metro only | `pn start` |
| Lint / format | `pn lint` / `pn format` |

`pn ios` is the one you want to see the app running — it builds, installs, starts Metro,
and launches, all wired together. If native config changed (new Swift files, entitlements,
target membership, podspec), run `pn build` first, then `pn ios`.

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.
