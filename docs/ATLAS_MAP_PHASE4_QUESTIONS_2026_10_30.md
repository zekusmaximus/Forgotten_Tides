# Atlas Map Phase 4: Questions for the Author

**Date:** 2026-10-30
**Phase:** 4, "Depth and time," of the [atlas map plan](ATLAS_MAP_PLAN_2026_10_29.md)
**Status:** Accepted by the author on 2026-10-30, all fifteen as recommended.
[The cartographic brief](../design/map/CARTOGRAPHIC_BRIEF.md) records them as
Q22–Q36 in section 2, with claims T30–T43 and rules R12–R18. This file keeps
the options that were weighed.

Numbering continues the brief's register: Q22 to Q36 follow its Q1 to Q21.
Citations use the brief's basis key: `ss/<slug>` is
`stories/short_story/<slug>/manuscript.md`. `atlas:N` without a file name is
`atlas/Tessarine_Vault.md`.

## 0. Stale points in the plan, verified

| Plan point | Finding |
|------------|---------|
| §5.3 lists Halix Exchange and Skather-Ait as speculative | Both are primary canon (`CANONICAL_INDEX.md:256-257`). Their insets stay out of Phase 4's scope. Primary-canon interior detail exists if they are wanted later: the "four-kilometer bazaar-ship" and its fourth-deck inheritance quarter (`atlas/Halix_Exchange.md:58-65`), and the pod's coherence-frame mesh (`atlas/Skather-Ait_Pod.md:33-35`). |
| §5.3 Heliodrome deck details | Array Two is primary canon (`ss/the_archivists_wake:158`). Deck Six (its "east residential spine," a "clean amber loop around the residential core"), the west loop, and Stairwell Nine appear only in two drafts: story-0016 (`ss/the_lie_that_learned_the_hallway:142-143,194,228`) and story-0014 (`ss/the_public_weight_of_a_private_lie:142,453`). The plan (lines 145-147) cites only story-0016. The "Deck six" of story-0005 (`ss/the_liturgy_of_rust:90`) is on Ostra-Vael, not the Heliodrome. `atlas/Heliodrome.md` names none of them. |
| `loc-0016`, H-37 Route Chart | Primary canon (`CANONICAL_INDEX.md:258`), `location_type: artifact`. The lint already exempts artifacts from placement (`scripts/lint/cartography_lint.js:12-13,189`). Canon gives it no endpoints ("an internal Helios Drift crossing," `atlas/H_37_Route_Chart.md:52`; "booked for their freight from the inner Drift," `ss/receipt_for_a_voice:159`) and no pull count. See Q32. |
| story-0021, promoted after the plan | Adds a run: Elior Ren from the inner relay to "the Halix relay" on an alternate corridor that "bent twice and paused at a release end" (`ss/receipt_for_a_voice:447-466`). It gives no pull count. Canon does not order it against the breach; story-0022's dependency on story-0021 was removed (`docs/PROCESS_REVIEW_STORY_DRAFTING_2026_10_20.md:442-444`). See Q32. |

Three further findings:

- **A Phase 3 defect that the era control fixes.** The viewer always draws the
  Fourth and Ninth Sleeves as softening (`map/viewer.js:101-102`), while the
  Vault and Drift soundings print their pre-breach values. The current chart
  shows two eras at once.
- **A topology ambiguity in primary canon.** `ss/the_reliquarists_doubt:318-320`
  has Inya walk "out of the audit hall and up through the Vault's middle ring,
  past the silos," then reach "the lintel above the audit hall's outer doors."
  The atlas puts the lintel over the hall's outer doors, at the head of the
  hall (`atlas:71,75`). Story-0022 has Ilka go "down to the head of the hall,
  to the sealed door and the provenance station outside it, where the seal
  ledger still lay open under the lintel" (`ss/spend_what_you_can_afford:979-980`).
  The inset can follow the atlas without drawing Inya's walk. The line is
  flagged here, not resolved.
- **Halix's breach report is not a standing state.** "Two decks have gone to
  full recitation" is "a reported breach condition, not a count of destroyed
  decks" (`atlas/Halix_Exchange.md:87-88`). The After era does not draw it.

## 1. Insets

### Q22. What may inset geometry assert?

- **A (recommended).** Inset geometry is *P.A.* Every element cites its basis
  and is one of two kinds:
  - **Canon:** an element, count, or relation stated in a cited file and line.
  - **Drawing approval:** an arrangement the plate cannot be drawn without,
    such as booth order or arc order. It binds the chart only and yields to
    any later story, as T17's "drawing approved" does.

  Nothing else is drawn. Approved interior arrangements never become working
  canon.
  - Pro: future Vault stories are not held to a booth order no story wrote.
    The lint stays strict.
  - Con: departs from D1, where approved topology is working canon, so the
    brief needs a rule that says so.
- **B.** D1 parity: approved inset topology becomes working canon.
  - Pro: one rule for the chart and the insets.
  - Con: every later Vault or Heliodrome story pays a placement cost against
    arrangements invented for a drawing.
- **C.** Insets as illustration, with no claims and no lint.
  - Pro: least work.
  - Con: nothing would stop an inset from inventing a room.

### Q23. The form of the Vault inset

Canon: a vertical complex, with the audit hall at the base, the middle ring
above it, and the silos above that (`atlas:67`;
`ss/spend_what_you_can_afford:387-388`).

- **A (recommended).** One framed plate at the site. It holds three plans
  stacked in canon order, with the silo bank at the top, the ring in the
  middle, and the hall at the base, joined by the stair. The plate note says
  that up on the plate is the Vault's up, since the chart has no north. The
  silo bank is the top plan, so zooming into it is the path the done-when
  names.
  - Pro: only a plan can show all four lost booths, and the stack follows the
    climb the story makes.
  - Con: three plans on one plate are denser than one section.
- **B.** A section (a cut elevation).
  - Pro: shows the vertical order at a glance.
  - Con: a section cuts through only some booths, so it cannot show all four
    lost ones.
- **C.** A section plus plans.
  - Pro: complete.
  - Con: twice the drawing for little gain.

### Q24. The Vault's elements and inferred arrangements

Approve or strike each row.

| # | Element | Kind | Basis |
|---|---------|------|-------|
| a | Audit hall: sixteen booths along one aisle, with benches, under a low ceiling | Canon | `atlas:75`; `ss/spend_what_you_can_afford:246,343,361`; `ss/the_reliquarists_doubt:142` |
| b | Two rows of eight facing the aisle, numbered 1–8 down one side and 9–16 down the other, so Ten is beside Nine | Drawing approval | Only "Booth Ten, beside Nine" is canon (`ss/spend_what_you_can_afford:367`) |
| c | The provenance station at the head of the hall, outside the outer (lintel) doors, under the lintel | Canon | `atlas:71,75`; `ss/spend_what_you_can_afford:253,914,979-980` |
| d | The service door to the stair at the head of the hall, beside the provenance station | Drawing approval | Canon: the door is "at the head of the stair" and seen from the hall (`ss/spend_what_you_can_afford:379-381`) |
| e | Middle ring: a circle of shelving with an inner curve and an outer curve | Canon | `ss/spend_what_you_can_afford:457,463,482` |
| f | The stair arrives on the ring's inner side, beside two inner-curve shelves | Drawing approval | Canon: "Between the silent shelves and the stair" (`ss/spend_what_you_can_afford:472`) |
| g | A storeroom off the ring | Canon | `ss/spend_what_you_can_afford:921` |
| h | The last flight from the ring to the silo bank | Canon | `ss/spend_what_you_can_afford:498` |
| i | Silo bank: nine housings in a shallow arc | Canon | `atlas:108`; `ss/spend_what_you_can_afford:505` |
| j | Housings numbered I–IX in order along the arc | Drawing approval | Canon gives no order |
| k | The upper doors on the silo bank's outer wall, drawn as one labeled opening because canon gives no count (R2) | Canon (existence) | `atlas:112-113`; `ss/spend_what_you_can_afford:514` |
| l | The lower dock at the base, beside the hall, with no passage drawn to it | Drawing approval | Canon: a "lower dock," reached by going "down" from the silos (`ss/spend_what_you_can_afford:606,843`) |

### Q25. How the lost booths are drawn

Canon: "No one goes where the booths were"
(`ss/spend_what_you_can_afford:403`). They are "four places in a working hall
where the shelving simply declined to continue" (373-374). "The four places
had edges, and the edges moved" (367). After the breach the four "stood where
no one would go" (916).

- **A (recommended).** The Void treatment.
  - Void color, with no grain, linework, numeral, or symbol inside.
  - The neighbors' partitions and the bench line stop short of each place,
    eroded by deterministic noise, so no crisp outline is drawn.
  - The numerals 3, 9, 11, and 14 sit on the aisle on leader lines, as the
    Void Regions' label does.
  - The note reads "Lost to forgetting. No one can go where the booths were.
    The hall is sealed with four null stones inside." No stone symbol is
    drawn inside.
  - Pro: the chart already has one lint-tested symbol for "nothing charted
    inside."
  - Con: each booth reads as a small Void, a stronger echo than canon states
    (the booths were lost to forgetting, not oblivion).
- **B.** Blank paper, as an unsurveyed area.
  - Pro: lighter.
  - Con: blank paper reads as "not yet surveyed," which implies someone could
    survey it. Canon says no one can go there.
- **C.** A dashed outline or a hatch.
  - Con: an outline asserts a stable edge, which canon denies.

### Q26. How the lost silos are drawn

Canon: unlike the booths, the housings still stand. "The Fourth Sleeve
housing stood where it had always stood. It gave back nothing"
(`ss/spend_what_you_can_afford:523`). The Ninth "stood in the arc as brass and
ceramic with nothing in it" (700). "The arc was missing a tooth" (521)
describes what Ilka heard, not what she saw.

- **A (recommended).** All nine housings are drawn in full. Each aperture
  carries a pitch symbol by category, never a value.
  - Before: all nine show the full ring.
  - After:
    - II shows the full ring, a "bound" mark, and the note "HAEL scored at eye
      height" (`atlas:111-112`).
    - V and VII show a broken ring, "reduced pitch" (`atlas:110-111`).
    - IV and IX show no ring, "lost to oblivion; cannot be rebuilt"
      (`atlas:109-110`).
    - I, III, VI, and VIII show numerals only (R5) and the full ring ("Seven
      hold," `ss/spend_what_you_can_afford:12`).
  - Pro: literal to canon, and the empty aperture is the missing tooth.
  - Con: at Z3 the difference between lost and holding is a small symbol.
- **B.** IV and IX drawn as blanks, like the booths.
  - Con: contradicts lines 523 and 700.
- **C.** IV and IX ghosted (a faded housing).
  - Con: fading the brass says the housing is less there. Canon puts the loss
    in the pitch.

### Q27. The lintel

Before: "Spend only what you can afford. Preserve what must endure."
(`atlas:73`; `ss/spend_what_you_can_afford:274`). After, the word *only* is
gone. "There was no mark of a tool"; "between them was a smoothness the length
of one word" (1011-1014; `atlas:114-116`).

- **A (recommended).** The After view prints "Spend," then a blank the width of
  "only," then the rest of the line. It has no strike, brackets, or ellipsis.
  The word is absent from the After view's text, and an accessible label
  describes the smooth space.
  - Pro: draws the stone as it is.
  - Con: a reader may take the gap for a typesetting fault until they read the
    note.
- **B.** Closed up, as the atlas and the story print the reading.
  - Pro: matches the quoted text.
  - Con: loses the one physical fact the chart can show.
- **C.** *only* struck through.
  - Con: a strike is a mark, and canon says there is none.

### Q28. Post-breach notes, and what the Vault inset leaves out

- **Proposed After notes.** Each keeps its canon figure and cites its source.
  - The hall is sealed with four null stones inside, and pledge audit is
    suspended across the outer sleeve (`atlas:99-103`).
  - In the ring, forty pledged stones were lost to null pressure on two
    inner-curve shelves, approximately one hundred sixty were spent into the
    housings without donor consent, and one remains (`atlas:104-107`). The
    word "approximately" stays with the 160.
- **Proposed omissions.** These belong in the panels, which already list the
  events.
  - People: Hael, Fenn, the Vault-Master, and the injured.
  - Objects by ID, such as TES-N3-44217.
  - The deck where the acolyte fell ("It did not remember the hole. There was
    no mark," `ss/spend_what_you_can_afford:561`).
  - The deck where the core lay (601) and the ring floor's lost seams (472).
    Canon does not say whether either recovered.
- **Recommendation:** accept both lists.

### Q29. The Heliodrome inset

Primary canon gives:

- the arrays, plural, with Array Two named (`ss/the_archivists_wake:156,158`);
- mirrors, and the station's song (156);
- a dock with a hatch and a ramp, docked by manual latch (159, 177-178, 207);
- doors and floors that forget (160);
- corridors that "misremember their own geometry" (`atlas/Heliodrome.md:14`),
  and decks that lose their alignment (54).

It gives no deck plan and no shape.

- **A (recommended).** A plate with primary canon only.
  - The interior is marked "not charted: the station's corridors misremember
    their own geometry."
  - A generic hull symbol, *P.A.*, stands for the station.
  - The arrays are one labeled area, since canon gives no count (R2). Array
    Two is the only array marked.
  - The dock and hatch are drawn.
  - The Wake's run ends at its release point, with the note "released a
    hundred meters from Array Two." The plate has no scale bar, so the hundred
    meters is quoted, not drawn.
  - The plate prints out of register, from the station's "spatial
    misalignment" (`bible/ARCHIVISTS_WAKE_STORY_BIBLE.md:33`).
  - "Eight degrees of shear" (`ss/the_archivists_wake:128`) is a reading at
    T1, not a standing value, so it is not printed.
  - Pro: invents nothing.
  - Con: the plate is sparse; most of it says what is not known.
- **B.** A, plus the draft details (Deck Six's east residential spine, the west
  loop, Stairwell Nine) under **+ Speculative**, in the author build only.
  - Pro: the author sees the drafts' claims in place while reconciling them.
  - Con: no draft-only story fact has been drawn so far; Q10 and Q11 drew only
    primary-canon facts. Drawing two unreviewed drafts' geometry adds map
    pressure before their promotion review (plan §10). Their spatial
    relations are also loose: neither draft says which deck the west loop is
    on.
- **C.** Defer the Heliodrome inset.
  - Pro: Phase 4 spends its effort on the Vault.
  - Con: the Wake's route has no Z3 end.

## 2. Era control

### Q30. The default era

- **A (recommended).** After the Tessarine Breach, in both builds. The deep
  link carries the era when it is not the default.
  - Pro: the atlas says the post-breach state "is the Vault's current
    condition and binds later stories" (`atlas:95-97`), so the chart's present
    tense matches it.
  - Con: on opening, the overview's best-known figure, the Drift's 0.65, reads
    "unmeasured." The After view also gives away story-0022's outcome in a
    reader-facing public build. The public panels already list the breach
    events (`scripts/map/build_data.js:64-66`).
- **B.** Before, in both builds.
  - Pro: the opening view shows both canon figures and gives nothing away.
  - Con: presents a superseded state as the current one.
- **C.** After in the author build, Before in the public build.
  - Pro: safe for readers.
  - Con: the two builds open on different worlds. The public panels give away
    the outcome anyway unless they change too.

### Q31. What each era changes

Era values are discrete states. The switch crossfades opacity. No number ever
tweens, and labels swap at the midpoint.

| Element | Before | After | Basis |
|---------|--------|-------|-------|
| Vault sounding | 0.78 · before the Tessarine Breach | *unmeasured*, hatched | R6; `atlas:57-58,125-126` |
| Drift sounding | 0.65 · before the Tessarine Breach | *unmeasured*, hatched | R6; `atlas/Helios_Drift.md:59-60,83-84` |
| Sleeves IV and IX | coherent | softening screen, no figure | R9; `atlas/Helios_Drift.md:82` |
| Outer-sleeve isopleth values | printed | Q31a | `ss/spend_what_you_can_afford:211` ("regional coherence is reduced") |
| Legend note | none | "Tints and isopleths are drawn from soundings taken before the breach." | process review §7, follow-up of October 27 (`docs/PROCESS_REVIEW_STORY_DRAFTING_2026_10_20.md:445-447`) |
| Vault inset | sixteen booths, nine full housings, the lintel with *only* | the states in Q25–Q28 | Q25–Q28 |
| Vault and Drift panels | the pre-breach figure and its note | "Unmeasured since the breach; last measured 0.78, before it." | R6 |
| The Vault–inner relay run, 2 pulls | not drawn | drawn | Q32 |
| story-0022 event pins | not drawn | drawn | Q33 |

Everything else appears in both eras, including *The Archivist's Wake*,
whose order relative to the breach canon does not give.

**Q31a. The outer sleeve's isopleth values in the After era.**

- **A (recommended).** Drop them. A contour value there would state a current
  figure where canon says coherence is reduced and unmeasured. Cost: the baked
  contour lines in that band go unlabeled.
- **B.** Keep them, and rely on the legend note.
- **C.** Drop every isopleth value in the Drift.
  - Pro: matches the whole Drift's sounding going unmeasured.
  - Con: blanks a third of the chart.

## 3. Routes and events

### Q32. Which story routes to draw, and how to draw a route without canon geometry

A pull belongs to a run, not to a leg. Term-0033 defines it as "one
engagement of a memory drive on a corridor run, and the unit in which crews
count a crossing" (`data/lexicon/terms.yaml:395`). A story route is therefore a
run, and its pull count is that run's count.

Recommended:

- ***The Archivist's Wake*.** Drawn as Phase 3 drew it (Q9, R4): a completed
  run, shown as a solid track into the Heliodrome.
  - Its label is "3 pulls" (`ss/the_archivists_wake:131`).
  - Its tail is open, with no origin mark. A note says canon gives no origin.
  - It appears in both eras.
- ***Spend What You Can Afford*.** Elior Ren's run with the seven null stones,
  from the Vault to the Navigant house: "Two pulls"
  (`ss/spend_what_you_can_afford:903`).
  - It appears in the After era only.
  - It is drawn as an intended track, dashed and arrowed.
  - Its note says the run and its cost are not recorded, per
    event-story-0022-008's causal note (`data/timeline/events.yaml:283`).
  - T10 changes from "two pulls from the Vault" to "two pulls on the run that
    left after the breach."
- **Geometry.** A run with canon endpoints is drawn as a straight leg, which
  asserts no shape. A run without an origin is drawn as an open tail from the
  region it starts in.
- **No pull ticks.** Ticks spaced along a line would convert pulls to distance,
  which D5 forbids.
- **Not drawn in Phase 4:**
  - H-37, an artifact with no endpoints and no count.
  - story-0021's alternate corridor. Its endpoints are canon, but it has no
    count and introduces a new place name, "the Halix relay," which needs its
    own placement pass.
- **Unchanged:** the Skather-Ait tether.

Options for the Vault–inner relay leg:

- **A (recommended).** After the breach only, with T10 amended.
- **B.** Both eras, as Phase 3 draws it.
  - Con: the Before view would show a pull count canon never gave for that
    era.

### Q33. Event pins

**Rule:** a pin goes only where canon locates the event. The pin's exact spot
is *P.A.*

| Event | Where | Era |
|-------|-------|-----|
| event-0004, the Gap passage | on the Wake run, inside the Gap | both |
| event-0005, the approach | Heliodrome inset, at the release point near Array Two | both |
| event-0006 and event-0007, docking and departure | Heliodrome inset, at the dock | both |
| event-story-0008-001 to -004 | Vault inset, audit hall (the provenance station is at its head) | both |
| event-story-0022-001 | audit hall | After |
| event-story-0022-002 and -004 to -007 | silo bank | After |
| event-story-0022-003 | silo bank, as a room marker with no spot ("There was no mark") | After |
| event-story-0022-008 | lower dock | After |

**Not pinned:**

- event-0001, which records what the story established, not an event in a
  place;
- event-0002 and event-0003, which happen before the Gap on a run with no
  charted origin (they are listed in the route's panel);
- the events of story-0012, at a station Q11 keeps off the chart;
- the events of story-0013, which canon places only "in the Helios Drift."

**Display:**

- At Z2, one event glyph beside the Vault and one beside the Heliodrome, with
  no count numeral.
- At Z3, one marker per room, listing its events.

**Recommendation:** accept the table and the display rule.

## 4. Z0

### Q34. The universe scaffold

- **A (recommended).** Z0 is a zoom-out level. Below the home view, the margin
  furniture fades, and the scaffold fades in over the margin and the frame,
  around the neatline.
  - The scaffold is an unlabeled field of dark-matter filaments (R8, Q13;
    `mechanics/MEMORY_PHYSICS.md:128-133`) in the chart's inks.
  - It has no nodes, knots, halos, or discs, so nothing reads as another
    galaxy (T12).
  - It has no Heavonly gateways in either build. The gateway count depends on
    the galaxy count the novel has not settled (D4).
  - Dark energy gets no symbol; drawing one would add metaphysics.
  - The home galaxy is the only luminous body. It carries the chart's title,
    "The Known Galaxy," from canon's "the known galaxy"
    (`atlas/Helios_Drift.md:69`; `lore/COSMIC_REGIONS.md:127`).
  - Z0 is identical in both builds.
  - Pro: completes the semantic zoom of plan §2.3.
  - Con: canon describes the scaffold only abstractly, so it must read
    plainly as texture, not geography.
- **B.** A static index diagram in a margin corner.
  - Pro: simple, and plainly furniture.
  - Con: not a zoom level, so §2.3 stops at three levels.
- **C.** Defer Z0 to Phase 5.

**Q34a.** Is the home galaxy labeled at Z0? Recommended: yes, with the chart's
title only.

## 5. Layers and the public build

### Q35. Layer toggles

The live layers can be toggled: routes, event pins, insets, isopleth values,
and the Z0 scaffold. Lanes, eddies, and isopleth lines are baked into the
tiles. Toggling them would need a second tile set, at about twice the render
time (the 65k render takes about 36 minutes on 4 cores).

**Recommendation:** toggles for the five live layers, all on by default and
the same in both builds. No toggles for the baked layers.

### Q36. The public build

Apart from Q29 B's draft details, if that option is chosen, every Phase 4
element above is primary canon. The public build would therefore get:

- the era control;
- the Vault inset;
- the Heliodrome inset's primary content;
- both runs;
- the event pins;
- Z0.

Draft and speculative material is excluded at build time from the data, the
inset rasters, and the tiles; it is never hidden in the browser (D7). The lint
fails if a public pin's event is below working canon, or if a public inset
element cites a draft source.

**Recommendation:** accept. The spoiler question is part of Q30.

## 6. What will be recorded after the answers

- A Phase 4 section in the brief, with decisions Q22–Q36.
- New claims (T30 onward) for each canon inset element and era state, and new
  rules (R12 onward) for:
  - inset authority (Q22);
  - lost places (Q25, Q26);
  - era states (Q31);
  - runs and pulls (Q32);
  - event pins (Q33);
  - Z0 (Q34).
- Amendments to T10 and R4 (Q32), flagged in the PR's Canon note.
- No change to any `canon_tier`, `metadata.status`, locked file, or
  manuscript.

## 7. Technical approach (the agent's call unless the author objects)

- **Insets.** Each inset is a framed plate centered on its site. A Node
  painter renders each plate as its own Deep Zoom pyramid per era, for example
  `vault.before` and `vault.after`.
  - The painter reuses the chart painter's paper, inks, grain, and line
    rendering, evaluated in world space, so neighboring tiles agree at their
    seams and the output is deterministic.
  - The rasters carry no text, because fonts differ between machines. All text
    is a live label in the viewer, as on the chart.
  - Every render takes `--build`.
  - Output goes to `out/map/insets/` (or `insets-public/`). `serve_map.js`
    serves it under a new prefix with the same segment validation and
    extension allowlist as the tiles.
- **Data and lint.**
  - `cartography.yaml` gains lists for insets (each element with its kind and
    basis), era states, and event pins. Routes gain an era and a run note.
  - The schema, `build_data.js`, and the lint are extended to match.
  - The lint fails on any element without a basis.
  - It checks that every number printed in an After note appears in the
    source line it cites.
  - It checks that the two After soundings are the literal "unmeasured," with
    no numeric field.
  - It checks that softening entries carry no figure.
  - It checks that no element or pin sits inside a lost booth or a Void.
- **Viewer.**
  - OpenSeadragon holds the base chart, the inset plates, and the Z0 layer as
    separate images.
  - The maximum zoom rises only while an inset is in view.
  - The era crossfades through image opacity and label swaps.
  - The pure logic goes in `viewer_core.js`, with Node tests: era states,
    plate fades, the era in the hash, and event grouping.
  - Playwright tests cover the era control, the insets, the routes, the pins,
    and Z0.
- **Style frames.** `npm run map:frame` gains `--inset <key> --era <era>`, so
  inset crops can be reviewed before full renders.
