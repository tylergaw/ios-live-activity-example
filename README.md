# Study Timer

A React Native/Expo iOS app with a study/focus timer that shows a Live Activity on the lock screen and Dynamic Island.

## Prerequisites

- Xcode 26+ with iOS Simulator
- Node.js 20+
- pnpm (`pnpm install -g pnpm` if not installed)
- CocoaPods (`gem install cocoapods` if not installed)

## Setup

```sh
pnpm install
pnpm build
```

## Running

```sh
pnpm ios
```

This builds and launches on an iPhone 17 Pro simulator (iOS 26) by default.

You can also open `ios/StudyTimer.xcworkspace` in Xcode and run the `StudyTimer` scheme directly.

Note: Live Activities work in the simulator but Dynamic Island is only visible on devices with Dynamic Island hardware (iPhone 14 Pro and later).

## Project structure

```
App.tsx                                  Main timer UI
modules/study-timer-live-activity/
  src/StudyTimerLiveActivity.ts          TypeScript interface to native module
  ios/StudyTimerLiveActivityModule.swift ActivityKit bridge (start/update/stop)
  ios/StudyTimerAttributes.swift         Shared ActivityAttributes definition
targets/StudyTimerWidget/
  StudyTimerWidgetBundle.swift           Widget entry point
  StudyTimerLiveActivityWidget.swift     Lock screen and Dynamic Island views
  StudyTimerAttributes.swift             ActivityAttributes (duplicated for widget target)
  expo-target.config.js                  @bacons/apple-targets config
patches/
  expo-modules-jsi.patch                Fix for Swift 6.2 type inference bug
```

## Notes

- The `patches/` directory contains a fix for a Swift 6.2 / Xcode 26 compatibility issue in `expo-modules-jsi`. It is applied automatically by pnpm during install.
- `StudyTimerAttributes.swift` is duplicated in both the module and widget directories because they compile as separate targets and cannot share source files directly.
- The widget extension is added to the Xcode project by `@bacons/apple-targets` during prebuild.
