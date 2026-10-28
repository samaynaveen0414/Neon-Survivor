# Neon Survivor

A self-contained neon arena survival game built with TypeScript, Vite and Canvas. No backend, accounts, external fonts, images, or runtime asset requests. Survive nine 35-second waves, then destroy the Null Engine in wave ten (arrives at 5:15). A typical successful run takes 6–8 minutes.

## Run

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local address printed by Vite (normally http://127.0.0.1:5173).

```sh
npm test        # gameplay logic tests
npm run build  # TypeScript check + optimized dist/
npm run preview # serve the production build
```

## Controls

- WASD / arrow keys: move (normalized diagonal speed)
- Mouse: aim; left click or hold: shoot
- Space: dash with brief invulnerability; 3-second cooldown
- Escape: pause / resume
- Menu buttons and upgrades: Tab and Enter / Space

Collect green XP crystals and choose one of three upgrades at each level. Leveling depends only on XP, with no timer or cooldown. XP requirements start at 85 and increase by 25 per level (17, 22, then 27 standard enemy pickups). Upgrades appear as soon as enough XP is collected; surplus XP carries over. Pulse fires quickly, Prism fires five close-range pellets, and Ion fires slower piercing bolts. Weapon choices replace the current weapon while stat upgrades carry over. Pink enemies pursue, amber enemies burst toward you, purple enemies keep distance and shoot. The boss fires rotating radial patterns. There is no time limit after the boss arrives.

Settings include sound volume, mute, screen shake and reduced motion (defaults to the OS preference). Audio starts after interaction. Best completed-run score and settings persist in localStorage when available; active runs do not persist. Losing focus pauses combat. Returning from a background tab requires Resume. Upgrade selection already pauses combat and remains open on focus loss.

## Organization

`game.ts`: simulation and entity lifecycle; `logic.ts`: damage, progression, upgrades; `render.ts`: procedural Canvas visuals; `backdrop.ts`: cached planets, rings, nebulae, and stars; `input.ts`: controls and pointer mapping; `audio.ts`: synthesized effects; `save.ts`: validated browser storage; `main.ts`: menus, HUD, app state; `style.css`: responsive presentation.

The arena uses a fixed 1200×760 logical playfield with responsive letterboxing and device-pixel-ratio rendering. Keyboard and mouse are required; touch controls and gamepads are outside this first version. There are no external game assets or network services. Dependency installation requires internet access; built runtime assets are fully local. Production is intended to be served over HTTP, not opened as a file URL.
