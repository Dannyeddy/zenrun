# ZenRun Architecture

This diagram summarizes the final front-end prototype architecture used for coursework submission.

```mermaid
flowchart TD
  User["Mobile user"] --> Login["Login / Onboarding"]
  Login --> Home["Home Dashboard"]
  Home --> RouteSelect["Route Selection"]
  RouteSelect --> Tracker["Tracker / Run Flow"]
  Tracker --> Completion["Run Completion Summary"]
  Completion --> ShareCard["Share Card"]
  ShareCard --> SharePage["/share Result Page"]
  Completion --> Journey["Journey / Atlas"]
  Completion --> Collection["Collection"]
  Collection --> Profile["Profile / Pet Care"]
  Home --> SystemData["/system-data Evidence Page"]

  DemoContext["DemoContext"] --> Home
  DemoContext --> Tracker
  DemoContext --> Completion
  DemoContext --> Journey
  DemoContext --> Collection
  DemoContext --> SystemData

  PetContext["PetContext"] --> Home
  PetContext --> Collection
  PetContext --> Profile
  PetContext --> SystemData

  LocalStorage["browser localStorage"] <--> DemoContext
  LocalStorage <--> PetContext
  LocalStorage <--> ProgressService["userProgressService"]

  RouteData["route data / routeFragments.ts"] --> RouteSelect
  RouteData --> Tracker
  RouteData --> Completion
  AtlasData["atlasPoints.ts"] --> Journey
  TreasureData["treasure assets and wearable mapping"] --> Collection
  TreasureData --> Profile

  Tracker --> RunHistory["runHistory"]
  Tracker --> FragmentProgress["routeFragmentProgress"]
  FragmentProgress --> TreasureUnlock["route-specific treasure unlock"]
  TreasureUnlock --> TreasureRewards["treasureRewards"]
  RunHistory --> HomeStats["today distance / monthly check-ins"]
  RunHistory --> AtlasUnlocks["Atlas unlocked cards and stats"]
  TreasureRewards --> Collection
  TreasureRewards --> Journey

  Media["public assets"] --> Tracker
  Media --> Collection
  Media --> ShareCard
  Media --> Journey
  Media --> Profile

  Music["public/audio/music/happy.mp3 calm.mp3 sad.mp3"] --> Tracker
  MapTiles["HTTPS GaoDe / Amap map tiles + fallback"] --> Tracker
  ShareImages["public/images/share"] --> ShareCard
```

Key data flow:

- Route selection writes the active route into `DemoContext`.
- Tracker completion writes a completed run into `runHistory`.
- `runHistory` drives dashboard distance, monthly check-ins, Atlas unlocks, and share result data.
- Route-specific memory fragments are stored in `routeFragmentProgress[routeId]`.
- A historical treasure is claimed only after all fragments for that route are collected.
- Collection and Profile merge earned and equipped treasure state by stable treasure ids.
- Share links encode public run summary data and use `VITE_PUBLIC_SITE_URL` when configured.
