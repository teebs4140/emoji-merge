# Emoji Merge Game Plan

## Vision & Goals
- Build a browser-based physics puzzle where players drop emojis into a container, combining identical emojis into higher-tier variants.
- Preserve the cozy, stacked aesthetic from the reference screenshot while leveraging a playful emoji palette.
- Deliver satisfying chain reactions, gentle feedback (sound, animation), and clear scoring/goal states around achieving the top-tier emoji without overflowing the container.

## Core Mechanics
- **Drop system**: Player aims with mouse/touch; tap/click releases the queued emoji from the top center. Limited horizontal drag before release to align drop.
- **Physics container**: Rectangular well with rounded bottom edges to mimic a basket. Uses a light 2D physics engine; emojis are circular bodies sized per tier.
- **Emoji progression (10 tiers)**:
  1. 🐭 (base)
  2. 🐹
  3. 🐸
  4. 🐰
  5. 🐱
  6. 🐷
  7. 🐶
  8. 🐻
  9. 🦁
  10. 🐻‍❄️
  11. 🫎
  12. 🦄
  13. 🐲 (win condition)
- **Merge rule**: When two bodies of the same tier sleep-touch, they merge into the next tier at the collision point, emit particles, and increase score.
- **Fail state**: If any emoji crosses the container rim after settling, game over. Clearing all tiers up to 🐻‍❄️ unlocks additional tiers and the run continues until 🐲 is reached.
- **Bonus level**: Clearing the main ladder extends the same play session with the mythical trio (🫎/🦄/🐲) appended to the ladder, preserving the existing stack while introducing the tougher finale.

## Technical Stack
- **Rendering**: HTML5 Canvas for performant sprite drawing and post-processing glow.
- **Logic**: Vanilla ES modules with lightweight state manager; no framework required for speed.
- **Physics**: Matter.js (browser bundle) for rigid-body simulation, collision, and constraints. Store vendor build in `vendor/` to avoid network installs.
- **Styling**: Tailored CSS with CSS variables for theme colors; responsive layout to handle desktop/mobile aspect ratios.
- **Assets**: System emoji glyphs rendered via `CanvasRenderingContext2D` using large font sizes. Optional soft shadow textures.

## Systems Breakdown
- **Game state manager** flags for `ready`, `dropping`, `merging`, `gameOver`, `victory`.
- **Spawner** queue keeps `currentEmoji` and `nextEmoji`; drop pool limited to the first three tiers (🐭/🐹/🐸) so progression relies on in-container merging.
- **Physics world** tuned gravity, restitution, damping; static bodies for container walls and floor.
- **Merge handler** listens for collision-start events, validates matching tiers, schedules merge after physics step to avoid instability.
- **Score & UI** scoreboard, highest tier notification, progress bar to the top emoji.
- **Audio & FX** loop quiet zoo ambience (`safari-sounds.mp3`), gentle pop, sparkle particles, subtle screen shake on high-tier merges.
- **Accessibility**: Provide emoji labels, toggles for reduced motion, keyboard fallback to drop (space bar).

## Development Milestones
1. **Foundation**
   - Project scaffold (`index.html`, `src/`, `styles/`, `vendor/`)
   - Load Matter.js, render static container, display queued emoji.
2. **Core Loop**
   - Input handling for aim/drop
   - Rigidbody creation & collision filtering
   - Merge logic with tier progression and score tracking
   - Detect overflow and top-tier victory conditions
3. **Juice & UX**
   - UI polish (backgrounds, HUD, modals)
   - Particle/sound hooks
   - Responsiveness & reduced-motion option
4. **Testing & Polish**
   - Manual playtest scenarios (early overflow, late-chain merge)
   - Debug overlay toggles (physics wireframe)
   - Performance profiling on desktop & mobile

## Immediate Next Steps
- Initialize Vite-like bundler or simple ES module build; opt for no-build pipeline for simplicity.
- Prepare vendor bundle of Matter.js (downloaded offline or pre-bundled in repo) and wire into HTML.
- Implement foundation milestone before layering in the rest.

## Open Questions
- Confirm target platforms (desktop-first vs equal mobile focus) for tuning touch inputs.
- Decide on difficulty curve adjustments (spawn bias, gravity) after initial prototype.
- Determine whether to include progression/persistence beyond single round (leaderboard, session stats).
