# ZenRun Data Handling

## 1. Overview

ZenRun uses React Context and browser `localStorage` as a lightweight front-end data layer for the prototype. This keeps the system interactive and persistent across browser refreshes without requiring a production backend. The approach is suitable for a coursework prototype because it demonstrates how user input and interaction states drive the interface.

## 2. Main User Inputs

ZenRun handles these user inputs and interactions:

- Username / login state: entered during Login and stored through `DemoContext`.
- Pet selection: selected during onboarding and stored as `selectedCompanion`.
- Weekly running plan: edited from the Home dashboard and stored as `weeklyGoalKm`.
- Route selection: chosen from the Home route card and stored as `lastSelectedRoute` plus current route state.
- Mood and companion settings: voice, music, and preferred mood settings are stored by `userProgressService`.
- Run completion: Tracker and completion pages write completed run entries to `runHistory`.
- Feeding interaction: Profile and Pet Space call `feedPet`, reducing food inventory and increasing pet vitality / affinity.
- Treasure equipment interaction: Collection and Profile use `equipItem` to save equipped treasures.
- Atlas unlock interaction: Journey / Atlas displays visited postcards based on completed route ids and saved reward history.

## 3. Context Responsibilities

### DemoContext

`src/context/DemoContext.tsx` manages the core demo journey:

- User profile and onboarding state
- Selected route and route metadata
- Current tracker state
- Completed run history
- Treasure reward history
- Current run fragment collection
- Route fragment progress
- Reward claiming state
- Demo sign-out and reset behaviours

The weekly plan value is read through `userProgressService`, while Home combines it with `runHistory` to calculate weekly progress and daily companion reminders.

### PetContext

`src/context/PetContext.tsx` manages companion and inventory state:

- Current equipped item / equipped treasure
- Equipped treasure by pet type
- Food inventory
- Food inventory by type
- Pet vitality
- Pet affinity
- Feeding interaction
- Adding food rewards

Selected companion identity is stored in `DemoContext`, while pet care and equipment state is stored in `PetContext`.

## 4. localStorage Persistence

Current `localStorage` keys used by the app:

### DemoContext

- `userName`
- `selectedCompanion`
- `onboardingSeen`
- `preferredRouteType`
- `lastSelectedRoute`
- `runHistory`
- `treasureRewards`
- `currentRunFragments`
- `routeFragmentProgress`

### PetContext

- `equippedTreasure`
- `equippedTreasureByPet`
- `foodInventory`
- `foodInventoryByType`

### userProgressService

- `weeklyGoalKm`
- `runVoiceEnabled`
- `petCompanionSettings`
- `zenrun.notifications`

### Home Companion Message

- `zenrun.lastCompanionMessageId`

Some feeding and equipment history is represented through current state and `zenrun.notifications` rather than a separate formal records table. This is acceptable for the prototype but should be expanded in a production backend.

Mood music audio files are stored as public assets:

- `public/audio/music/happy.mp3`
- `public/audio/music/calm.mp3`
- `public/audio/music/sad.mp3`

The Tracker uses a stable audio reference so selected mood music can continue while the run screen re-renders. It stops when the user turns it off or the run ends.

## 5. Data-Driven UI Changes

Examples of state-driven UI behaviour:

- Selected pet changes the Home, Profile, Pet Space, and companion popup display.
- Completed runs update the Completion Summary, Profile statistics, Insights charts, and run history counts.
- The monthly check-in calendar is derived from `runHistory`; highlighted dates represent days in the current month with at least one completed run, and the check-in number counts unique completed-run dates rather than total runs.
- Treasure rewards update the Collection page and Profile reward totals.
- Collection treasure cards are keyed by stable treasure identity, such as `treasureKey` or normalized title. Earned and equipped states are merged into one card, and duplicate reward records are prevented or deduplicated for display.
- Historical route treasures are driven by route-specific memory fragments. A treasure is only claimed after the fragment count for that same `routeId` reaches its required total.
- Historical route treasures use five cultural relic display names: Mise Celadon Lotus Bowl, Sword of King Fuchai of Wu, Bronze Tripod He with Coiled Chi-dragon Handle, Pearl Sarira Pagoda, and Fish-roe Green Olive-shaped Zun. Legacy prototype names are kept only as aliases for old localStorage records.
- Food inventory affects feeding buttons, pet vitality, and the daily companion message.
- Equipped treasure affects the companion appearance in Profile / Pet Space where supported.
- Atlas cards are unlocked or displayed based on route ids found in `runHistory` and `treasureRewards`.
- Weekly plan and today's completed distance drive the dashboard goal display and daily companion reminder popup.
- The dashboard progress popup shows today's completed distance from `runHistory`, today's planned distance from `weeklyGoalKm`, current fragment progress from `routeFragmentProgress`, and pet energy from `PetContext`.
- Completed route results can generate shareable `/share` links. The share card uses route-specific public result data such as route id, route title, distance, time, pace, completion date, reward, fragment progress, and share image. The XJTLU test route uses `/images/share/xjtlu-library.jpg`.

## 6. Reward Data Flow

The reward flow is:

1. User selects a route from Home.
2. Tracker starts the route and can collect route fragments from checkpoint definitions in `routeFragments.ts`.
3. When the run is completed, `completeRun` writes a new item into `runHistory`.
4. Fragment progress is stored in `routeFragmentProgress[routeId]`, so fragments from one historical route do not unlock another route's treasure.
5. If enough fragments are collected for that specific route, `claimRouteFragmentReward` marks the reward as claimed.
6. Historical treasures are saved into `treasureRewards`; food rewards increase `foodInventory`.
7. `rewardClaimed` and stable route / treasure ids prevent duplicate treasure insertion and prevent the treasure unlock popup from repeating.
8. Collection, Profile, Journey, and reward result pages read the updated state.
9. The completion summary can encode public share-card data into a `/share` URL so the result can be opened without requiring backend storage.

## 7. Atlas Data Flow

The Atlas flow is:

1. Atlas postcard definitions are stored in `src/lib/atlasPoints.ts`.
2. Each route-related China postcard has a `routeId` that matches a runnable route id from `src/lib/demoData.ts`.
3. Completed routes are saved in `runHistory` with the same `routeId`.
4. Journey reads completed route ids from `runHistory` and rewarded route ids from `treasureRewards`.
5. Atlas unlock state is derived at render time by checking whether an Atlas card `routeId` exists in completed route history. As a compatibility fallback for older localStorage data, Journey can also match normalized route names.
6. If a postcard route id has been completed or rewarded, the card is shown as visited and uses the stored completion / reward date where available.
7. If the route has not been completed, the card remains locked while keeping its visual map coordinates.
8. Future destination cards without real route ids remain locked until they are connected to runnable routes.
9. Atlas statistics use the same derived unlock state: `VISITED` counts unique completed route-related Atlas cards, while the denominator represents all Atlas cards shown by the Atlas data set, including future locked cards. `COMPLETE` uses the same denominator, so it reflects overall Atlas card completion rather than only runnable route completion. The `ROUTES` value currently displays the same total Atlas card count. The numerator is still based on unique completed route ids and does not duplicate when the same route is completed more than once.

## 8. Share Link Data Flow

Completed route results can be shared through `/share` links.

1. `RunCompletionSummary` builds public share data with `URLSearchParams`.
2. The link includes public fields such as route id, route title, route type, distance, time, pace, completion date, reward, fragment progress, and share image.
3. `VITE_PUBLIC_SITE_URL` is used as the share origin when configured for deployment.
4. If `VITE_PUBLIC_SITE_URL` is not configured, the app falls back to `window.location.origin` for local testing.
5. The `/share` page reads query parameters and shows a safe result card with fallback values if data is missing.
6. Netlify direct links are supported by `public/_redirects`.

## 9. Prototype Limitation

ZenRun does not use a real backend database. This keeps the prototype lightweight, easy to deploy, and easy for markers to test in a browser. The current data layer is enough to demonstrate interaction state, persistence, reward logic, and data-driven UI changes.

Future production work could add:

- User accounts and authentication
- Cloud database storage
- Real geolocation and activity tracking APIs
- Multi-device sync
- Server-side reward validation
- More complete feeding and equipment event records
