# ABC HAND integration

ABC HAND is available from the English Stage home screen at `dist/abc-hand.html`.
The supplied crane, pendulum, colored tiles, tap-to-select interaction with buffered consecutive taps, automatic demonstration, sound toggle, five-star animation and completion effects are retained.

## Vocabulary and media

`dist/hunter-data.js` is the single shared vocabulary, genre and MP3 index for both Hunter and ABC HAND (904 entries, 26 genres at integration). Keep `D`, `GI`, and `audioFiles` aligned when adding words. Both pages reference this file with a content version; update that version after changes.

ABC HAND uses the current reviewed Grade 5 raster illustration for the same spelling and sense, then falls back to Hunter's existing raster. `scripts/sync-abc-hand-images.mjs` generates the ID-aligned `dist/abc-hand-images.js` map and content-versions the engine and map; `release:entry` / `validate:entry` automatically synchronize / check it, including after later image replacements. No new SVG word illustrations are generated. The current image and next three images are prefetched through a bounded cache. Slow requests remain in flight for up to 12 seconds per attempt, with at most three automatic attempts and backoff; retries bypass cached failures. The card shows a loading message until the raster is drawn, and a manual reload button on failure. Late responses from older words cannot replace the current image. Words without an existing illustration explicitly invite the learner to answer from Japanese; image/audio loading failure is reported. The original machine and tiles remain SVG geometry.

Tap the picture card to hear the same MP3 as Hunter (enable the sound button first). Word completion also plays it. Spaces, punctuation and parenthetical sense labels are omitted from letter tiles; the original spelling appears on completion. All current entries fit at most two answer rows and three tile rows.

## Difficulty and scoring

Select any nonempty combination of genres, 0/2/4/8 distractor letters, 5/10/20/all words, and always-visible / after-error / no hints. Each round samples without replacement. Input is independent of robot motion: correct letters are reserved immediately and appear in the answer slots; the robot delivers them in order. Queued delivery runs up to five times faster. A repeated tap on the same tile is ignored, while repeated letters require separate tiles. Errors apply to the next unentered position and do not discard correctly queued letters. Repeated letters retain separate physical tiles; distractors exclude correct-word letters. Settings are saved under `abc-hand-v1`, independently of Hunter progress. Settings stay fixed during a session; open Settings to pause before the next selection and continue.

Base points = round(sqrt(selected vocabulary count / 30) * 10) * 10, as in Hunter's stage mode. Each completed manual word earns base * combo * (1 + floor(combo / 3)). No hints doubles this value. A wrong letter resets the combo; finishing the word begins the combo again. Hints enabled at either level use the normal multiplier. Any use of automatic mode during a word makes the whole word worth zero and resets the combo, even if switched back to manual. There is no extra bonus for distractors. This avoids silently changing Hunter's score formula.

Session scores are independent of Hunter's collection, main-app XP and water rewards. Only settings persist; an interrupted session starts again.

## Verification

- `node scripts/qa-abc-hand-flow.cjs` also checks rapid real touch input without accelerated test clocks, repeated letters, queue pause/resume, hint position, automatic-mode score exclusion, image delays, automatic/manual retries and late responses. It accepts the same public URL argument.
- `npm test`, `npm run validate`, `npm run release:entry`, `npm run validate:entry`
- `node scripts/qa-abc-hand.cjs`: local Edge QA with real MP3 playback, manual error/correct paths, hint-free combo scoring, auto zero points, all media paths, long-word layout, locked settings, Hunter regression and 320/390/430/1280px screenshots. Animation clocks are accelerated after real playback for the complete-session checks.

Publishing uses the existing GitHub Pages workflow after a push to main. Confirm the deployment for the exact commit, then run `node scripts/qa-abc-hand.cjs https://yggdrasilw-spec.github.io/english-stage/` to exercise the public game and `node scripts/qa-startup.cjs https://yggdrasilw-spec.github.io/english-stage/` to verify the main learning app.
