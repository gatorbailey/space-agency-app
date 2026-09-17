# Space Agency

A strategy/management sim where the player administers a Cold War-era space
program, starting 1960, with the goal of putting a human on Mars. See
[CLAUDE.md](CLAUDE.md) for the full project brief.

## Stack

- React + TypeScript + Tailwind, built with Vite.
- Wrapped for iOS distribution via Capacitor.
- Architecture split into `src/simulation` (pure TS engine, zero UI deps),
  `src/content` (cards/missions/site data), `src/ui` (React screens), and
  `src/save` (local persistence).

## Development

```bash
npm install
npm run dev
```

## Testing

The Simulation Core is fully unit-tested in isolation:

```bash
npm run test
```

## iOS

```bash
npm run ios   # builds the web app, syncs it into the Xcode project, and opens Xcode
```

## Current scope

This is the MVP vertical slice: one site (Cape Canaveral), a trimmed
Sentiment/Budget/Materials resource loop, a small set of Mercury-era decision
cards, a simplified 3-stage launch sequence (weather check → go/no-go →
outcome), and one scripted milestone mission with headlines from both press
outlets. See CLAUDE.md's "MVP Scope" section for the exact boundaries and the
Phase 2/3 backlog.
