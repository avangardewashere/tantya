# Fieldnote: build guide

> **Fieldnote**: a field notebook is the small book a naturalist carries and writes one observation in
> every day. Tagline: **One thing a day. Kept for good.**
> A phone-first journal for what you learned today, with a review schedule that brings each note back
> at 1, 3, 7, 14, 30 and 90 days, so it sticks. You write in the evening; the app decides what you
> re-read in the morning.
>
> *This guide lives in the Tantya repo only until the Fieldnote repo exists. It becomes that repo's
> first commit, the way the Tantya guide was.*

## Goal

Take a fifth app from an empty folder to shipped, **three features at a time**, with the same rules as
Tantya. Tantya's lesson was that a wrong number looks exactly like a right one. Fieldnote has the same
shape of trap, one level up: **a wrong date looks exactly like a right one, and you only find out weeks
later.** A note that should come back on day 25 and comes back on day 24 will never be noticed by a
person. So the skill this project teaches is **time correctness**: days as whole numbers, "due" as
something computed and never stored, one calendar for every machine, and a scheduler proven by
simulating a whole year in a test.

The second skill is the one Tantya never needed: **data that must outlive the app.** A journal that
loses a note is worse than no journal. Every version of Fieldnote has to open every earlier version's
data.

The third reason to build it is the one you said out loud: **a portfolio piece.** Fieldnote is small
enough to finish and public enough to show. React 19 and Next.js 16 features get used where they earn
their place, and the block notes record which ones and why.

## Who it's for

| | |
|---|---|
| **Main user** | You. Someone curious who reads and watches a lot and forgets most of it. Writes on an Android phone at night, reviews over coffee |
| **Second user** | Anyone who wants the same habit: students, people learning a language or a trade, developers keeping a "today I learned" log |
| **Not for** | Flashcard drilling (Anki does that), long essays, teams, or anything that needs images in v1. Fieldnote is one short note a day and the discipline of coming back to it |

## How we work: the rules of this guide

The rules are Tantya's, unchanged:

1. **Three features per version.** No more, no fewer.
2. **One feature per block.** A *feature* is one new thing a user can do, with one way in.
3. **Every block has its own testing phase**, and it must pass before the block can close.
4. **Every block ends with a summary of one to three sentences.**
5. **Claude asks before starting the next block**, before a version, before a cut line, before changing
   an earlier test, and before adding a new tool.

### The block loop

```
 plan the block ─► WORK THE EXAMPLES BY HAND ─► write the test rows ─► build ─► TESTING PHASE
 (read this file)  (you and Claude, separately;                                  │ red? fix, run again
                    the answers must match)                                      ▼
        ASK ◄── SUMMARY ◄── block note ◄── WALKTHROUGH ◄── YOUR ANDROID CHECKS ◄─┘
 "Start Block N+1?"  (1–3        (docs/blocks/)  (Claude walks you through
  wait for a yes     sentences)                   the new files; you ask)
```

**The examples here are calendars, not sums.** You work each one on paper: "written on day 0,
remembered on day 1, remembered on day 4, forgot on day 11, so it is due on day 12." Claude works it
separately. The two must match before the row becomes a test. Both workings go in
`docs/worked-examples.md`. **The example numbers printed in this file are Claude's only, so they count
as "to be confirmed by hand".**

### What "testing phase" means

The same seven as Tantya. The one that changes weight is number 3:

1. Every row in this file exists as a test or a named check, with an ID (`B2-T4`).
2. `npm test` is green, pinned to Manila time, on this PC and in CI.
3. **`npm run test:utc` is green.** In Tantya this run was boring until Block 3. Here it matters from
   **Block 0**, because the whole product is a calendar. Between midnight and 8 a.m. Manila, "today"
   on GitHub's machines is yesterday. A note written at 1 a.m. must land on the right day in both runs.
4. Planted bugs go red.
5. Every earlier block's tests still pass, unchanged.
6. CI is green on GitHub: lint, typecheck, `test`, `test:utc`, build.
7. The "outside Jest" list is run by hand. Android Chrome and desktop Chrome must pass. iOS never blocks.

### Cut lines

As in Tantya. Cut work goes to the [Backlog](#backlog), never into another block. Claude asks first.

### The test tools

Tantya's stack, unchanged, so nothing new has to be learned to start:

| Tool | Used for |
|---|---|
| **Jest 30** through `next/jest` | Everything. The scheduler and the day ruler get table tests with `test.each` |
| **React Testing Library + user-event** | Screens: type a note, tap "remembered", search |
| **jest-axe** | A basic accessibility check on each screen |
| **Seeded random loops** | The year simulation in Block 2: a seeded run of 365 days of remembered/forgot, checked against rules that must hold on every day |
| **A slow oracle** | The scheduler is written twice: a fast version and an obviously correct one that replays every review from the start. They must always agree |
| **Playwright** | Block 8 only (the public page is an `async` Server Component, which Jest cannot render), and only after asking you |

### What the ask sounds like

> Block 2 is done. *(summary)* Tests: 131 passing in both timezones, 4 planted bugs caught, CI green.
> Outside Jest: 3 ✅. **Shall I start Block 3, the shelf?**

## Before you say yes

**Size.** A session is one sitting of about two hours. Block 0 is about 2 sessions (it is your fifth
setup, and most of Tantya's Block 0 copies across). Blocks 1 to 3 are about 3 each, so **v1 is roughly
11 sessions** plus the release. v2 and v3 are sized when they are re-planned.

**Your part, which Claude cannot do for you:**
- Work each calendar example by hand before its test is written.
- Choose the review ladder (see [Decisions](#decisions)). It is a taste decision and it is yours.
- Write in it every day from Block 1 onward. **Your own notes are the test data for Blocks 2 to 6**,
  and a journal with three notes in it teaches nothing about a queue of forty.
- Run the Android checks.
- Create accounts and paste keys yourself (GitHub, Vercel, Supabase, the email service in Block 9).
- Before the v1 release, get one other person to write in it for a week.

**What a yes to Block 0 accepts:** every row in [Decisions](#decisions) marked "Block 0". The name
becomes the repo and the URL.

## Stack

| Piece | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 | Same as the other four. **Read `node_modules/next/dist/docs/` before each block**; this version differs from older guides |
| Language | TypeScript, strict | A `DayNumber` and a `Millisecond` are different branded types, so a timestamp can never be passed where a day is wanted |
| Styling | Tailwind CSS 4 | Same as before |
| Tests | Jest 30, React Testing Library, user-event, jest-axe | See above |
| Validation | Zod, **from Block 1** | Unlike Tantya, saved data exists from the first feature, and every read from storage is checked |
| Storage | localStorage from Block 1, behind a seam | A journal that forgets on refresh is useless, so v1 saves. In-memory is kept as the test implementation |
| Backend | Supabase (Block 7), an email API (Block 9) | You know Supabase from Habibit v2 |
| CI | GitHub Actions | Every push runs lint, typecheck, both test runs and the build |
| Hosting | Vercel free tier | Connected in Block 0. Block 9's weekly job runs as a Vercel cron |
| Port | 3005 | Tantya has 3004 |

## The time rule: days are whole numbers

`new Date()` is the float trap of this project. It carries the device's timezone, it changes meaning on
a server, and `toISOString()` silently turns a Manila evening into a UTC afternoon.

| Thing | Stored as |
|---|---|
| A calendar day | A whole **day number**: days since 1970-01-01 in Manila. 2026-09-28 is `20724` |
| An instant (created, updated) | Whole **milliseconds** since the epoch, from a clock that is passed in |
| A review ladder | Whole **days**: `[1, 3, 7, 14, 30, 90]` |
| A stage | A whole number `0..5` |
| "Due" | **Never stored.** Computed from the note's day and its reviews, every time |
| "Today" | A day number passed into every function. Nothing in `src/engine` reads the clock |

**The day ruler** is one function: `dayOf(ms)` adds 8 hours and divides by 86,400,000, rounding down.
The Philippines has no daylight saving, so the offset is a constant. Its inverse, `dateParts(day)`,
reads the UTC parts of `day × 86,400,000`. Nothing else in the app converts between the two.

Four scheduling rules, each pinned by a test:

1. **A new note is at stage 0 and is due the next day.** Written on day D, due D+1. Never due today.
2. **Remembered moves one stage up, capped at 5. Forgot goes back to stage 0.** The next due day is
   `reviewDay + ladder[newStage]`.
3. **Due is counted from the day you actually reviewed, never from the day it was due.** A late review
   does not compress the ladder. Due on D+4, reviewed on D+9 and remembered: due D+16, not D+11.
4. **One review per note per day.** A second one on the same day is refused and changes nothing.

Remembered every time, on time, a note written on day D comes back on **D+1, D+4, D+11, D+25, D+55,
D+145**, and every 90 days after that. *(Claude's working; confirm by hand.)*

## The data

```
Note      id · day (DayNumber) · title · body (plain text; [[Title]] makes a link from Block 4)
          · tags[] · createdAt · updatedAt · deletedAt (a tombstone, never a hard delete)
Review    noteId · day · result (remembered | forgot)          append-only, never edited
Schedule  pure: (note, reviews[], today) → { stage, due, overdueBy }     never stored
Queue     pure: (notes, reviews, today, cap) → Note[]           most overdue first, then oldest note
Settings  ladder · reviewCap (10) · schemaVersion
Link      derived from [[Title]] in a body at render time            never stored
Streak    derived from the set of days that have a note              never stored
```

Nothing derived is ever saved. Due, queue, links, backlinks and streaks are all worked out from notes
and reviews. That is what makes import, sync and a changed ladder safe: there is nothing stale to fix.

**Where state lives:** v1 and v2 in localStorage on the device, behind one seam. v3 in Supabase as
well, with the device copy kept as the source of truth while offline.

## Roadmap: three versions, nine features

| Version | Theme | Feature 1 | Feature 2 | Feature 3 |
|---|---|---|---|---|
| **v1** | One notebook, on this phone | **1** Write today's note | **2** Review: the queue and the ladder | **3** The shelf: browse and search |
| **v2** | A notebook that grows | **4** Links between notes and backlinks | **5** Export and import, with migrations | **6** The year view: streaks and a heatmap |
| **v3** | Out of one phone | **7** Accounts and sync | **8** A public link for one note | **9** The Monday digest email |

v1 is planned in full. v2 and v3 are the current best guess and get **re-planned when that version
starts**, with what a week of real use taught.

---

## Block 0: Groundwork (not a feature)

**What we build**
- `create-next-app` in `Shipped Products/fieldnote`: Next.js 16, React 19, strict TypeScript,
  Tailwind 4, `src/` folder. Port 3005 in `.claude/launch.json`.
- Jest through `next/jest`, React Testing Library, user-event, jest-dom, jest-axe, Zod. The timezone pin
  in `jest.config.ts` and `scripts/test-in-timezone.mjs` copied from Tantya. `npm run test:utc`.
- **The folder contract:** `src/engine` (the day ruler, the scheduler, search, streaks: pure),
  `src/store` (the reducer and the storage seam), `src/ui`, `src/app`. The ESLint wall from Tantya:
  `src/engine` and `src/store` may not import React or Next. **A second wall: nothing outside
  `src/engine/day.ts` may call `new Date()` or `Date.now()`**, enforced by the same lint probe.
- **The day ruler** in `src/engine/day.ts`: `dayOf`, `dateParts`, `formatDay` ("Mon 28 Sep 2026"),
  `addDays`, the branded `DayNumber` and `Millis` types.
- **The look:** CSS variables and the page shell.
- GitHub repo, the Actions workflow copied from Tantya, **Vercel connected now**.
- `docs/worked-examples.md` as an empty template. `.gitattributes`.

**What you learn.** *The one new idea:* a calendar day as a whole number, behind a lint rule that
allows the clock in exactly one file. *Also:* your fifth setup, faster; why `test:utc` matters on day
one here.

**Testing phase**

| ID | Proves |
|---|---|
| B0-T1 | Smoke test: the shell renders a heading "Fieldnote", jest-axe finds nothing |
| B0-T2 | Timezone: the offset is −480 under `test` and 0 under `test:utc`, and **B0-T4 passes under both** |
| B0-T3 | The lint walls: a file in `src/engine` importing React gets one error; a file in `src/ui` calling `Date.now()` gets one error; the same call inside `src/engine/day.ts` gets none |
| B0-T4 | The day ruler: `2026-09-27T16:00:00Z` is day 20724 (Manila midnight, 28 Sep); `2026-09-27T15:59:59Z` is day 20723; `0` ms is day 0; `1969-12-31T16:00:00Z` is also day 0. `dateParts(20724)` is 2026, 9, 28. `formatDay` gives "Mon 28 Sep 2026" |
| B0-T5 | The round trip: for 1,000 seeded random instants across 1970 to 2100, `dayOf(ms)` equals `dayOf(dateParts→midnight)` and `addDays(d, n) − d` is `n` |
| B0-T6 | The date trap, recorded: a test shows `new Date(ms).getDate()` gives a different day under the two runs for the instant in B0-T4, while `dayOf` gives the same |
| B0-T7 | CI green: lint, typecheck, test, test:utc, build |

**Planted bugs:** `getDate()` in place of the UTC parts; adding 8 hours after dividing.

**Outside Jest:** the preview link opens on your phone; contrast checked once.

**Cut line:** none.

> **Summary:** Block 0 builds the workshop and the calendar ruler. After it, every later block starts
> from a green, deployed app that already knows what day it is on any machine.
>
> **Gate:** "Groundwork is done. Shall I start Block 1, writing today's note?"

---

# Version 1: One notebook, on this phone

Write one thing a day. It comes back on the ladder. Everything stays on this phone.

## Block 1: Write today's note

**Feature:** "Write down the one thing I learned today." Opens on today, saves as you type, survives a
refresh.

**What we build**
- `src/store/reducer.ts`: one reducer for every write. Actions: `noteAdded`, `noteEdited`,
  `noteDeleted` (sets the tombstone). IDs and the clock are passed in. A refused change returns the
  same object.
- `src/store/storage.ts`: the seam. `load(): State` and `save(State)`. Two implementations: `memory`
  (tests) and `local` (localStorage). Every `load` runs the saved JSON through the Zod schema; a bad
  or foreign blob is **quarantined, not deleted**: kept under a second key, reported on screen, and
  the app starts empty.
- `NoteEditor`: a title and a body, autosaved after a short pause, with a visible "Saved 19:42" line.
  Opens on today's day number, from the clock passed through a prop. A note written at 1 a.m. lands on
  the right Manila day.
- The **quota case**: a `save` that throws (storage full, private mode) shows a persistent warning and
  keeps the note in memory. It is never lost silently.

**What you learn.** *The one new idea:* the storage seam with validation on every read, and
quarantine instead of deletion. *Also:* autosave as a reducer plus a debounce, not a special path;
`useActionState` or a controlled form (decide against the Next 16 docs at the time); a component
either draws or runs an effect.

**Testing phase**

| ID | Proves |
|---|---|
| B1-T1 | Reducer goldens: add a note on day 20724; edit it (updatedAt moves, createdAt does not); delete it (tombstone set, note still present) |
| B1-T2 | Refusals return the same object: editing a deleted note, editing with no change, adding an empty title and empty body |
| B1-T3 | Contract suite over the seam, run against `memory` and `local`: save then load is equal; a second save replaces; an empty store loads the empty state |
| B1-T4 | Quarantine: a blob that fails the schema is moved to `fieldnote.quarantine`, the app loads empty, and the original is byte-for-byte intact |
| B1-T5 | Quota: a `save` that throws leaves the state unchanged in the store, the note still on screen, and a `role="alert"` warning visible |
| B1-T6 | The 1 a.m. note: with the clock at `2026-09-27T17:30:00Z`, the editor shows "Mon 28 Sep 2026" under **both** test runs |
| B1-T7 | Editor: type a title and a body, advance fake timers, see "Saved"; reload the component from the same store and the text is there; jest-axe finds nothing |
| B1-T8 | Coverage: at least 95% of branches in `src/engine` and `src/store`, enforced in CI |

**Planted bugs:** `Date.now()` in the reducer; quarantine that deletes; a debounce that saves the
previous keystroke's state.

**Outside Jest:** typing on Android does not jump the page; the "Saved" line is readable one-handed;
close Chrome fully, reopen, the note is there.

**Cut line:** the quota warning (B1-T5) can move to Block 3 if the block runs long. Nothing else.

**Not in this block:** review, a list of past notes, tags, links, search.

> **Summary:** Block 1 is a notebook that keeps its promise: one screen, today's note, saved as you
> type, checked on every read, and never thrown away by the app.
>
> **Gate:** "Block 1 is done. Before Block 2 I need your yes on the ladder. Then: shall I start
> Block 2, the review queue?"

## Block 2: Review: the queue and the ladder

**Feature:** "What should I re-read this morning?" A queue of notes that are due, one at a time, with
two buttons: **Remembered** and **Forgot**.

**What we build**
- `src/engine/schedule.ts`: `scheduleOf(note, reviews, today)` returns `{ stage, due, overdueBy }`.
  Written twice: `fast` (folds over the reviews once) and `oracle` (replays from scratch, plainly).
  Tests assert they agree on every input.
- `queue(notes, reviews, today, cap)`: due notes only, most overdue first, then oldest note first,
  cut at the cap. Deleted notes never appear.
- Reducer action `reviewed(noteId, day, result)`. A second review of the same note on the same day is
  refused. Reviews are append-only: there is no edit or delete action for them.
- `ReviewScreen`: one note, the two buttons, "3 of 7 today", and "Nothing due. Come back tomorrow."
  The ladder is shown on the note ("stage 2 of 5, next in 7 days") so the schedule is never a secret.

**What you learn.** *The one new idea:* "due" as a pure function of history and today, proven by a
seeded year and a slow oracle. *Also:* `useOptimistic` for the button tap if the Next 16 docs make it
the right tool; a queue as a sorted view, not a stored list.

**Testing phase** (ladder `[1, 3, 7, 14, 30, 90]`, cap 10, unless the Decisions row changes them)

| ID | Proves |
|---|---|
| B2-T1 | The happy ladder: written day 0, remembered on 1, 4, 11, 25, 55, 145: stage rises 0→5 and due is exactly those days, then 235. *(Claude's; confirm by hand)* |
| B2-T2 | Forgot resets: remembered on 1 and 4, forgot on 11: stage 0, due 12. Remembered on 12: stage 1, due 15 |
| B2-T3 | Late does not compress: due on 4, remembered on 9: stage 2, due 16. The wrong rule gives 11 |
| B2-T4 | Never due today: a note written today has due today+1, and is not in today's queue |
| B2-T5 | Stage caps at 5: ten remembered reviews in a row on time end at stage 5 with a 90-day gap, never stage 10 |
| B2-T6 | The queue order: three due notes overdue by 0, 3 and 3 days: the 3s come first, and between them the older note. With cap 2 the third waits |
| B2-T7 | One review per day: the second `reviewed` on the same day returns the same object; the next day it is accepted |
| B2-T8 | The seeded year: 40 notes added on random days, 365 days of random remembered/forgot at the queue's own pace. Every day: due is after the review day, stage is 0..5, the queue never exceeds the cap, `fast` equals `oracle`, and no deleted note appears. Failures print the seed |
| B2-T9 | Screen: two due notes, tap Remembered, see "2 of 2", tap Forgot, see the empty state; the stage line reads "stage 0 of 5, next tomorrow"; jest-axe finds nothing |
| B2-T10 | The timezone edge on the queue: the clock at `2026-09-27T16:00:00Z` shows a note due day 20724 under both runs; at `15:59:59Z` it does not |

**Planted bugs:** count due from the due day; forget the cap on stage; sort oldest-overdue last; allow
two reviews a day; use `Date.now()` for "today".

**Outside Jest:** the two buttons are thumb-sized and cannot be double-tapped by accident (the second
tap is refused by the reducer, but the screen should not flash).

**Cut line:** the "stage 2 of 5" line on the note (part of B2-T9) can move to Block 3.

**Not in this block:** changing the ladder from the screen, undo, statistics.

> **Summary:** Block 2 is the heart of Fieldnote: a pure scheduler with a slow twin, proven over a
> simulated year, and one screen that asks two questions a morning.
>
> **Gate:** "Block 2 is done. Shall I start Block 3, the shelf?"

## Block 3: The shelf: browse and search

**Feature:** "Find that thing I wrote about in July." A list of every note, newest first, with a search
box and tags.

**What we build**
- Tags: a `tags[]` field on the note, edited as a comma list in the editor. Lower-cased and trimmed by
  the reducer, duplicates dropped.
- `src/engine/search.ts`: `search(notes, query)`: every word in the query must appear (case-insensitive)
  in the title, body or a tag; results newest first; the matched spans returned so the screen can
  highlight them. Pure, no index in v1 (a few thousand notes is fine; measured in B3-T6).
- `Shelf`: the list grouped by month, the search box, a tap on a tag filters by it, a tap on a note
  opens the editor on that day. Deleted notes are hidden, with a "show deleted" toggle and **Restore**.
- The quota warning from Block 1 if it was cut.

**What you learn.** *The one new idea:* search as a pure function that returns spans, so highlighting
is a rendering concern and the matching is testable without a DOM. *Also:* restoring from a tombstone
as the reason tombstones exist; a list that stays fast without a library, and how to measure that.

**Testing phase**

| ID | Proves |
|---|---|
| B3-T1 | Tag normalisation: `" React, react ,Gym"` becomes `["react", "gym"]` |
| B3-T2 | Search goldens: "react hooks" matches a note with "React" in the title and "hooks" in a tag; "react hook" matches "hooks" (substring); "reacts" does not match "react"; an empty query returns everything newest first |
| B3-T3 | Spans: the match in "Learned about useEffect today" for "useeffect" is `[14, 23]`, in the original case |
| B3-T4 | Deleted notes are hidden by default, shown by the toggle, and `noteRestored` clears the tombstone and puts the note back in the queue at its current stage |
| B3-T5 | Screen: five notes across two months, two month headings; type "gym", one result with a highlighted `<mark>`; tap the tag, the same one result; jest-axe finds nothing |
| B3-T6 | A named check, not a golden: `search` over 5,000 generated notes finishes under 50 ms on CI. Recorded, so a slow change is noticed |

**Planted bugs:** OR instead of AND between words; spans in lower-cased offsets; restore that resets
the stage.

**Outside Jest:** scrolling 200 notes on the phone is smooth; the search box does not zoom the page on
focus (`font-size` at least 16px).

**Cut line:** month grouping (part of B3-T5) becomes a flat list.

**Not in this block:** links, export, the year view.

> **Summary:** Block 3 makes the notebook browsable: tags, a search that shows its matches, and a way
> back for anything deleted.
>
> **Gate:** "Block 3 is done. v1 is complete. Shall we do the v1 release?"

## v1 release (after Block 3)

No new code. A README with screenshots and the known limits; the timezone story written down; merge;
tag `v1.0.0`; a GitHub Release; the live link on your phone.

**Then use it for two weeks and hand it to one other person for one week.** Your queue on day 14 and
what they say re-plan v2. Claude asks, **"Shall we plan v2?"**, writes the re-plan into this file,
shows the diff, and asks again: **"Shall I start Block 4, links?"**

---

# Version 2: A notebook that grows

Notes start pointing at each other, the data can leave and come back, and the calendar becomes
something you can see. *Re-planned when v2 starts.*

## Block 4: Links between notes and backlinks

**Feature:** "Connect today's note to the one from March." `[[Title]]` in a body becomes a link, and
the March note shows who links to it.

- `src/engine/links.ts`: `linksIn(body)` returns the titles; `resolve(notes, title)` matches
  case-insensitively among non-deleted notes; `backlinks(notes, id)` is derived every time.
- An unresolved link renders as plain text with a dotted underline and a "create this note" action.
- **Renaming a title** shows how many links point at the old title and offers to rewrite them. It is
  one reducer action so it is one undo. *(This is the deviation to watch: links by title are fragile.
  The alternative, links by id with the title as display text, is decided at this block's gate.)*

**Tests:** parsing goldens (nested brackets, a link at the very end, two links to one note count once);
resolve is case-insensitive and ignores deleted notes; backlinks of a note with none is `[]`; the rename
rewrite changes exactly the linked bodies and their `updatedAt`; the screen shows a backlinks panel.
**Planted bugs:** resolve that finds deleted notes; rename that touches every note.

## Block 5: Export and import, with migrations

**Feature:** "Get my notes out, and back in." A JSON backup and a readable Markdown file, and a way to
import the JSON on another phone.

- `export(state)` produces `{ schemaVersion, exportedAt, notes, reviews, settings }`. `import(bytes)`
  validates, **migrates** from any earlier `schemaVersion` through a chain of pure steps, and merges:
  same id keeps the newer `updatedAt`, reviews are unioned by `(noteId, day)`.
- The import screen previews **"12 new, 3 newer, 40 unchanged"** before anything is written.
- The Markdown export is for reading, never for import: one heading per day, oldest first, with the
  stage of each note.

**Tests:** the round trip (`import(export(s))` equals `s`, for seeded random states); a v1 fixture kept
in the repo imports forever (the migration chain is tested against real old files, never regenerated);
merge goldens; a foreign file is refused with a named reason and nothing is written; the Markdown
export is byte-for-byte a fixture, with Windows line endings kept by `.gitattributes`.
**Planted bugs:** merge that keeps the older note; a migration step that drops a field.

## Block 6: The year view: streaks and a heatmap

**Feature:** "Did I actually do this every day?" A year of squares, darker for more reviews, and a
streak count.

- `src/engine/streak.ts`: a streak is a run of consecutive Manila days with at least one note, ending
  on today or yesterday. Neither written: 0. The longest streak is also computed.
- `heatmap(notes, reviews, year)`: 365 or 366 cells with a count each. Rendered as inline SVG, no
  chart library. The `dataviz` conventions for a sequential palette in both themes.

**Tests:** streak goldens (today written: 1; yesterday and today: 2; yesterday only: 1 "at risk";
neither: 0; a gap breaks it); leap year 2028 has 366 cells; the cell for 2026-09-28 sits in the right
week column; **the same year under both timezone runs**. **Planted bugs:** a streak that counts
calendar days by `getDate()`; a heatmap that starts the year on the wrong weekday.

## v2 release (after Block 6)

As v1. Then the v3 re-plan, with the sync decision below settled first.

---

# Version 3: Out of one phone

The first server code. *Re-planned when v3 starts.*

## Block 7: Accounts and sync

Supabase with row-level security. The device copy stays the source of truth; a change log of reducer
actions is pushed, and pulled changes are folded through the same reducer. Per-note last-write-wins by
`updatedAt` as set on push by the server clock; reviews and tombstones are unioned, so a note edited on
two phones keeps the later edit and loses no review. The storage contract suite runs against a third
implementation. **Never destroy user data silently:** a conflict is logged and shown, not hidden.

## Block 8: A public link for one note

A secret URL per note, read on the server through a database function that accepts only a token hash.
`noindex`, no queue or review data on the page, revocable. This page is an `async` Server Component,
so this is where Playwright is proposed. The public page is also the portfolio piece: it is the page
you show people.

## Block 9: The Monday digest email

A pure `digest(notes, reviews, weekEndingDay)` tested in Jest: last week's notes, the streak, and what
is due this week. A Vercel cron at **Monday 07:00 Manila, which is Sunday 23:00 UTC**, sends it through
an email API, keyed by `(userId, weekNumber)` so a retried cron never sends twice. This block is the
first paid feature if Fieldnote ever charges (see [Money](#money)).

---

## Decisions

Each 🟡 row is a **recommendation, not a decision**. Claude asks about it at the gate before its
"decide before" block.

| Decision | Recommendation | Decide before | Status |
|---|---|---|---|
| The product | **Fieldnote**, the daily journal with a review ladder, picked from six ideas in the brainstorm (Setweight, Cutline, Meal Ratio, Rateboard, Unitprice, Fieldnote) | Block 0 | 🟡 |
| Name | **Fieldnote.** Also considered: **Marginalia** (notes in the margin), **Gleaning** (what you pick up after the harvest). Check the GitHub and Vercel names are free | Block 0 | 🟡 |
| One note a day, or many | **Many.** The prompt says "one thing", the streak counts days with at least one, and nothing stops a second. The alternative (id = day number) is simpler but punishes a curious day | Block 0 | 🟡 |
| Look and feel | **Field notebook:** cream paper, a ruled body, one ink colour, a serif for the note body and a sans for the chrome, light and dark. Others: **Index card** (white, a red rule, monospace) or **Terminal** (dark, green on black) | Block 0 | 🟡 |
| Whose calendar | **Manila**, as a constant, for v1 and v2. A per-account offset is decided before Block 7, because a second user abroad breaks the constant | Block 0, again at Block 7 | 🟡 |
| Saving from Block 1 | **Yes, localStorage.** Tantya's v1 was in memory because the PDF was the record. A journal has no such record | Block 0 | 🟡 |
| How work is pushed | One branch per block, merged to `master` only after your yes at the gate, as in Tantya | Block 0 | 🟡 |
| The ladder | **`[1, 3, 7, 14, 30, 90]`**, stage capped at 5. A common alternative is `[1, 3, 7, 21, 60]`. Once chosen, changing it is safe (due is never stored) but every Block 2 example is re-worked | Block 2 | 🟡 |
| The review cap | **10 a day**, most overdue first. The rest wait. A cap of 0 means "everything", and is refused | Block 2 | 🟡 |
| Links by title or by id | **By title in v2**, with the rename rewrite. By id if the rename rewrite turns out to be the thing that breaks | Block 4 | 🟡 |
| Sync conflict rule | Per-note last-write-wins on the server clock; reviews and tombstones unioned | Block 7 | 🟡 |

## Money

Be honest about this one. **Fieldnote is a portfolio piece first.** It is the project you can finish,
put a public URL on, and walk a hiring manager through: a pure scheduler with a slow oracle, a seeded
year, a storage seam with quarantine, a migration chain tested against real old files, and a public
Server Component page.

If it ever charges, the shape is the usual one: **free on one phone** (v1 and v2, forever), and one
paid tier for the server features (sync, the public link, the Monday digest). One price, yearly, in
pesos. That decision is not before Block 7, and needs the two-week test with a second person to have
gone well. Nothing in v1 or v2 is built differently because of it.

## Known limits (on purpose)

| Limit | Why | Plan |
|---|---|---|
| **Tests cannot prove the ladder is good for memory.** They prove the code follows the ladder | No test knows how your memory works | The ladder is a setting, and the year view in Block 6 shows whether you are actually coming back |
| Plain text only | Markdown, images and rich text triple the surface for a v1 | `[[links]]` in Block 4; light Markdown is in the Backlog |
| localStorage holds about 5 MB | Browser limit | Thousands of notes fit. The quota path in Block 1 keeps the note on screen and says so |
| Search is substring, one language | No stemming, no accents folded | Fine for one person's notes. Backlog if the second user asks |
| One calendar for everyone until v3 | The Manila constant | Decided again before Block 7 |
| A secret URL is not a password | Block 8 | The page says so, and links can be revoked |
| Not installable, not offline-first as a PWA | Learned in Habibit, left out of the nine | A cheap add later; localStorage already works offline once loaded |

## Backlog

| Item | From |
|---|---|
| Light Markdown in the body (bold, italic, code, a bullet list) | Left out of Block 1 |
| A daily reminder notification | Needs a PWA or an email; Block 9 covers the weekly one |
| Undo for the last review ("I tapped the wrong button") | Would need an edit on an append-only log; a "correction" review is the honest shape |
| Import from another app's export (Obsidian, Apple Notes) | Only if the second user brings one |
| A per-account calendar offset | Block 7's decision |
| *(cut-line items land here as they happen)* | |

**Never planned:** flashcards with front and back; teams or shared notebooks; images in v1 to v3;
ads.

## Rules carried over from Habibit, Sipat, Tipon and Tantya

- **Logic is pure and lives apart from the screens.** IDs and the clock are passed in.
- **Every write goes through one reducer.** A refused change returns the same object.
- **A component either draws something or runs an effect**, not both.
- **Swappable parts sit behind interfaces:** storage (Block 1), the email sender (Block 9).
- **Dates use Manila calendar parts.** Never `toISOString()` for a day, never the device's timezone.
  New here: the clock is allowed in one file only, and a lint rule proves it.
- **Never destroy user data silently.** New here: quarantine, tombstones with restore, the import
  preview, and a logged conflict.
- **Test devices:** Android Chrome and desktop Chrome must pass. iOS never blocks a release.
- **Next.js 16 differs from older guides.** Read `node_modules/next/dist/docs/` before writing code.

## Words used in this guide

| Word | Meaning |
|---|---|
| **Day number** | Days since 1970-01-01 in Manila, as a whole number. The only way a date is stored |
| **Ladder** | The list of gaps, in days, between reviews: `[1, 3, 7, 14, 30, 90]` |
| **Stage** | How far up the ladder a note is, `0` to `5`. Forgot sends it back to `0` |
| **Due** | The first day a note may be reviewed. Computed, never stored |
| **Queue** | Today's due notes, most overdue first, cut at the cap |
| **Tombstone** | A "this was deleted" marker on a note. It keeps the note restorable and syncs like an edit |
| **Quarantine** | Saved data that failed validation, moved aside and kept, never deleted |
| **Oracle** | A slow, obviously correct scheduler the fast one must always agree with |
| **Seeded** | Random inputs that start from a fixed number, so a failing year can be replayed |
| **Migration chain** | The pure steps that bring an older export up to the current schema, one version at a time |
| **Backlink** | Every note whose body links to this one. Derived, never stored |
| **Golden test** | A test whose expected answer was worked out by hand first and is never changed to fit the code |

## Block note template

The same as Tantya's, in `docs/blocks/block-N.md`: what we built, the one new idea in your words,
decisions, deviations, worked examples, the testing phase table, planted bugs, outside-Jest checks,
what was deliberately left out, the summary, and the gate.

## The other five ideas from the brainstorm

| Idea | In one line | Why not now |
|---|---|---|
| **Setweight** | Plate calculator and progression tracker | Strongest personal pull. The second candidate: its plate maths is Tantya's whole-number engine again, in kilograms |
| **Rateboard** | A freelance quote builder for developers | The clearest path to money, and most of Tantya's quotation layout carries over. A strong v4 |
| **Cutline** | A cut and bulk calorie ladder | Real audience, but the nutrition numbers need a source you trust, the Tantya factors problem again |
| **Meal Ratio** | A macro-first grocery list in whole units | Good engine, small audience |
| **Unitprice** | Price-per-gram comparison for shoppers | Viral shape, but it is a one-screen tool, not nine features |

If one of these is closer to what you want, say so before Block 0 and this guide gets redrawn with the
same rules.
