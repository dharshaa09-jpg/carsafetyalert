# Ocean Rescue Drone Flutter App

A mobile-ready Flutter dashboard for an ocean rescue drone system.

## Structure

- `lib/main.dart` - the main app UI, state logic, mission map, and simulation timer
- `pubspec.yaml` - Flutter package configuration

## Create Android and iOS App Shells

This folder currently contains the Flutter app source. After Flutter is installed and available on PATH, run these commands from this folder:

```bash
flutter create --platforms=android,ios .
flutter pub get
flutter run
```

For Android, use an Android emulator or a connected Android phone. For iOS, run the project on macOS with Xcode installed.

## Notes

- The app is responsive for phone and tablet layouts.
- The dashboard contains mission status, a mission map placeholder, drone fleet cards, live alerts, and action buttons.
- A timed simulation updates the mission every 18 seconds, matching the web prototype behavior.
