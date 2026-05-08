# Data Handling Prompts

## Context Inspection

Inspect `DemoContext` and `PetContext` and explain how ZenRun stores user profile state, route selection, run history, reward progress, pet vitality, food inventory, and equipped treasure.

## localStorage Documentation

Find all current `localStorage` keys used in the codebase and document what each key stores and which part of the app reads or writes it.

## Route And Reward Flow

Explain the data flow from route selection to tracker completion, fragment collection, reward claiming, inventory updates, and Collection / Profile display updates.

## Pet Data Flow

Explain how selected companion, food inventory, feeding, vitality, affinity, and equipped treasure are handled in the prototype.

## Atlas Data Flow

Explain how completed routes and reward history unlock Atlas postcards, and how the Journey page chooses between world and China region coordinates.

## Dashboard Data Binding

Make the monthly check-in calendar and dashboard companion stats data-driven. Completed runs in `runHistory` should determine check-in days and today's completed distance, while route fragment progress and PetContext should drive fragment and energy values.

## Audio Lifecycle

Audit the mood music and landmark voice narration logic. Confirm mood music persists during the run, stops only on Turn Off or run end, and ducks smoothly when narration plays.

## Share Link Data

Document how share links encode public route result data with `URLSearchParams`, use `VITE_PUBLIC_SITE_URL` for deployed origins, and fall back safely in local development.

## Collection Data Correction

Audit Collection treasure definitions, reward names, equipped treasure state, and legacy localStorage aliases. Correct the visible cultural relic names and ensure earned and equipped states merge into one card by stable treasure id.

## Coursework Evidence

Prepare a clear data handling evidence document for markers. Keep it accurate to the actual front-end prototype and do not invent backend features that do not exist.
