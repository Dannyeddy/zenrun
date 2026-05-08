# Core Development Prompts

## Main App

Build a mobile-first running web app prototype called ZenRun. It should combine route selection, a running tracker flow, companion pets, post-run rewards, progress tracking, and a playful visual identity.

## Route Selection

Create a Home dashboard where users can choose between historical cultural routes and modern urban routes. Each route card should show an image, distance, estimated time, and a clear action to start the run.

## Tracker Flow

Implement a tracker screen for a selected route. It should show run status, distance, duration, route information, and allow the demo user to complete the run so the prototype can move into a completion summary.

## Results And Rewards

After a run is completed, create a completion summary and reward result flow. Historical routes should lead to treasure-style rewards and modern routes should connect to food or vitality rewards.

## Companion System

Add a companion pet system where the user chooses a pet during onboarding. The pet should appear across the dashboard and profile, have vitality or affinity states, and connect emotionally to running progress.

## Collection System

Create a collection page that displays earned treasures and available food. Users should be able to equip earned treasures to their companion without affecting the running tracker flow.

## Historical Treasure Completion

Audit and implement route-specific historical treasure logic. A treasure should unlock only after all memory fragments for the same route are collected, then show a one-time unlock popup and add the corrected cultural relic item to Collection without duplicates.

## Shareable Results

Create route-specific post-run share cards. Use the completed route title, distance, time, pace, reward, fragment progress, and route-specific image, then generate a real `/share` link that can use a deployed public site URL.
