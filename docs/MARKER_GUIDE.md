# ZenRun Marker Guide

This guide explains the recommended way to test ZenRun for coursework marking.

## 1. What ZenRun Demonstrates

ZenRun is a mobile-first running prototype. It demonstrates a complete interactive flow rather than a static interface:

- User onboarding
- Companion selection
- Weekly running plan
- Route selection
- Tracker flow
- Landmark discovery
- Run completion
- Reward feedback
- Atlas postcard progress
- Collection and Profile state updates

## 2. Recommended Test Setup

- Use a mobile browser size, such as iPhone 12/13/14.
- Start from the live deployed URL.
- If testing locally, run `npm install` and `npm run dev`, then open `http://localhost:3000`.
- Allow location permission if prompted.

## 3. Main Demo Path

Follow this path:

1. Login
2. Onboarding
3. Home
4. Select a route
5. Tracker
6. Complete run
7. Completion summary
8. Reward result
9. Journey / Atlas
10. Collection
11. Profile

Expected observations:

- The selected companion appears across Home, Tracker, and Profile.
- Completing a run creates a run history record.
- Rewards and fragments update the Collection / Profile experience.
- Journey / Atlas derives visited postcard progress from completed route data.
- Notifications update when feeding or equipment interactions occur.

## 4. Data Handling Evidence

Open `/system-data` after completing at least one demo run.

This page is read-only. It shows current prototype state such as:

- Selected pet
- Current route
- Weekly plan
- Run history count
- Latest completed run
- Food inventory
- Treasure inventory
- Treasure fragments
- Equipped treasure
- Atlas card state
- localStorage keys used by the app

The page is not an admin panel and does not allow editing or deleting data. It is included to make the data flow visible for marking.

## 5. Technical Evidence

Useful files for marking:

- `README.md`: project overview, setup, deployment, limitations
- `docs/DATA_HANDLING.md`: state management and localStorage evidence
- `ai-logs/`: representative AI-assisted development prompts
- `src/context/DemoContext.tsx`: main app journey state
- `src/context/PetContext.tsx`: companion, food, and equipment state
- `src/lib/atlasPoints.ts`: Atlas postcard data
- `src/pages/Journey.tsx`: Atlas unlock and statistics logic
- `src/pages/Tracker.tsx`: running flow, landmark popups, voice, and music

## 6. Network Notes

The Tracker map uses HTTPS GaoDe / Amap web tiles to improve access reliability in mainland China.

If live map tiles are unavailable, the Tracker displays a soft fallback map background instead of blocking the run. The marker can still evaluate:

- Route selection
- Tracker UI
- Landmark and reward logic
- Completion flow
- Collection, Profile, and Atlas state updates
- `/system-data` evidence page

## 7. Submission Checklist

Before final submission, complete:

- Add the public live URL to `README.md`.
- Add the public or accessible GitHub repository URL to `README.md`.
- Replace placeholder group member names and roles.
- Test the full demo path on a mobile viewport.
- Confirm `/system-data` loads after completing a run.
- Confirm the site is public and accessible during the marking period.
