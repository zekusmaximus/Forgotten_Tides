# Canon Timeline Review and Draft Placement

Date: 2026-10-21
Scope: the five `primary_canon` stories, the sixteen draft short stories, the
novella `story-0009`, and the novel outline. Every manuscript was read in
full. Entity files, `data/timeline/events.yaml`, the bible, the lore, and
`scripts/checks/timeline_variance.js` were read where they bear on dating.

This document changes no canon. It reads what the locked stories fix, derives
the only ordering they support, and recommends where each unpromoted story
sits relative to that ordering. Every recommendation is the author's to accept
or reject. Items the author must decide are collected in section 8.

Conventions used below: `0001` means `story-0001`, and so on. A citation of
the form `path:line` points at the line in the file as of this review.

---

## 1. Summary

1. **Locked canon fixes two clusters and one interval, nothing more.** The
   Heliodrome cluster (`0001`) and the Tessarine cluster (`0008`, `0013`,
   `0022`, with `0012` as a Black Horizon precedent) are internally ordered,
   and `0022` is fixed at twelve weeks after `0008`. No locked text relates
   the two clusters to each other.
2. **There is no universal calendar, and the repository says so.** `0008`
   explicitly forbids treating "year 2244" as an absolute epoch
   (`stories/short_story/the_reliquarists_doubt/manuscript.md:109`). Every
   story's `T0` is local. The timeline checker sorts all of them as the same
   instant (documented as defect 3.7 in the process review).
3. **Recommended spine:** the Wake first, the Breach later, the novel last.
   Era I (`0001`, `0014`, `0016`), Era II (the Drift ledger: `0013`, `0004`,
   `0015`, `0017`, `0021`, `0008`, with the independent drafts beside them),
   Era III (`0022`), Era IV (`0009` and the Breach's consequences), Era V
   (`0020` and the novel). The Era I to Era III gap is the one open author
   decision the ordering needs; the recommended default is "Wake first,
   months to a few years before the Breach".
4. **One draft has a forced position:** `0021` must sit before `0022`,
   because Elior Ren enters `0021` with eleven anchors and the null-stone run
   after `0022` is locked as "not free"
   (`characters/Elior_Ren.md:62`). `0014` and `0016` are pinned to the days
   after `0001`'s Heliodrome intervention. `0004`, `0015`, `0017`, and `0021`
   form a chain. Everything else floats and can be placed by preference.
5. **Four contradictions block clean placement** and are listed in section 7:
   Solace Hospice is in three different regions across `0003`, `0007`, `0018`,
   and the atlas; `0018` uses `T6` on the bible's scale; `0006` names a
   region that does not exist in `lore/COSMIC_REGIONS.md`; and "cycle" is
   used as a month in prose but parsed as a century by the tooling.

---

## 2. What the Locked Stories Fix

Only `primary_canon` binds. These are the dating facts each locked story
establishes, with the line that establishes them.

### 2.1 The Archivist's Wake (`0001`)

- Local scale `T0` to `T5` per the bible section 1; the frontmatter tags the
  story itself as `Cycle 0`.
- The Heliodrome intervention (Rell's last burn) is `T3`. Docking is `T4`.
  "Three days passed" before departure at `T5`
  (`stories/short_story/the_archivists_wake/manuscript.md:195`).
- Clerics are present at the hatch (`:178`), so the Archivist Orders are on
  station during the aftermath. This is the hook `0014` and `0016` use.
- No reference to Tessarine, the Synod inside the Drift, or any Breach
  consequence. Nothing dates `0001` relative to the Tessarine cluster.

### 2.2 The Reliquarist's Doubt (`0008`)

- One night audit. Inya is twenty-three and eleven months into her vows.
- "The anomaly would surface on the quarterly review in twelve weeks"
  (`the_reliquarists_doubt/manuscript.md:326`). This is the only hard
  interval between two locked stories.
- The donor record "Born Sleeve Four, year 2244" is a civic registry date;
  the story's own continuity note says no universal calendar is implied
  (`:109`, `:204`).
- Deep-past anchor: the harbor colony in the Lattice Gap's near sleeve was
  scoured "a hundred and eighty years before Tellis Aru was born" (`:208`),
  with a forty-year eddy that thinned one hundred forty years before the
  story. Tellis is seventy-one, so the scouring is roughly two hundred fifty
  years before `0008`. This is locked and usable by later stories.
- The unnamed night porter (`:136`) is consistent with Jory Fenn, who had
  been porter for five months at the Breach (`0022`, `:348`). Not a
  contradiction; a quiet continuity.

### 2.3 The Smallest Burn (`0013`)

- One watch. Elior "had waited three years" for his first correction
  (`the_smallest_burn/manuscript.md:124`). Twelve anchors become eleven.
- Must precede `0021` and `0022`, both of which count his eleven anchors.
  `0021` places itself soon after: Tess says he has "flown one supervised
  correction" (`receipt_for_a_voice/manuscript.md:264`).

### 2.4 The Mercy Doctrine (`0012`)

- One rite in the Black Horizon. Nara "had been called novice for five years"
  (`the_mercy_doctrine/manuscript.md:477`).
- The story's continuity note says it does not depend on `0009`. Nothing in
  the text dates it against the Drift clusters. The dull lamps it
  establishes are the housings `0022` treats as known Synod practice, so the
  natural reading is `0012` before `0022`; it is not forced.

### 2.5 Spend What You Can Afford (`0022`)

- "Twelve weeks after the events of story-0008"
  (`spend_what_you_can_afford/manuscript.md:62`, `:158`). Roughly three
  hours of story time.
- Jory Fenn: night porter for five months (`:348`), so he was already at the
  Vault two months before `0008`.
- Elior Ren is at the Vault's lower dock, "younger than his voice" (`:807`),
  with eleven anchors; his null-stone run to the Navigant house happens after
  the story closes and its cost is expected and unfiled.
- "First on-page Synod operation inside the Helios Drift proper"
  (frontmatter `events[0].causal_note`). Consequences left open: two silos
  lost, pledge audit suspended across the outer sleeve, Hael recommended to
  Solace, Jory Fenn held for the Inquisition, Ilka Marsk's standing
  unresolved. These are the latest locked state of the Drift and bind
  anything placed after.

### 2.6 What the locked set does not fix

- The order of the Heliodrome crisis (`0001`) against the Tessarine cluster.
- Any absolute date, year, or era name.
- The meaning of "cycle", "pull", "watch", or "dimming" as units.

---

## 3. The Structural Problem: Local Zeros

Every story's `timeline.chronology` and `events[]` start from its own `T0`.
The shared file `data/timeline/events.yaml` mixes the bible's `T0` to `T5`
with `0008`'s `T0+6h`, `0013`'s `T0+2 pulls`, and `0022`'s `T0+3h`. The
checker maps every `T0` to the same sort key, so `npm run check:timeline`
reports the Breach as simultaneous with the Wake and Inya's audit as
simultaneous with Elior's first correction. The output confirms it:

```
T0    | event-0002               (Wake, corridor instability)
T0    | event-story-0008-001     (Tessarine audit, twelve weeks before the Breach)
T0    | event-story-0012-001     (Black Horizon rite)
T0    | event-story-0013-001     (Elior's first correction)
T0+1h | event-story-0022-001     (the Breach)
T1    | event-0003               (Wake, galley)
```

This is process review defect 3.7, already documented and unfixed. Two
consequences matter for this review:

- The repository cannot currently express "twelve weeks after `0008`" in a
  form the tooling reads. The interval lives only in prose and in
  `causal_note` strings.
- `0018` uses `T6`, `T6+1`, `T6+2` as its timestamps
  (`the_navigator_who_forgot_enough/manuscript.md:57`, `:65`). The parser
  reads `T6` as the step after the bible's `T5`, which would place the
  story the day after Rell leaves the Heliodrome. That is an accident of
  numbering, not a claim the text makes; it should be renumbered to the
  `T0` form before the story is placed or promoted.

### 3.1 Recommended convention

Adopt the fix the process review already proposes, with a concrete shape:

1. Name two reference events in `data/timeline/events.yaml` and nowhere
   else:
   - `HI` (Heliodrome Intervention) = `event-0005`, the bible's `T3`.
   - `TB` (Tessarine Breach) = `event-story-0022-001`.
2. Give every story one optional frontmatter field:

   ```yaml
   timeline:
     anchor:
       event: event-story-0008-004   # a shared event id
       offset: "+12w"                # w, d, h; or "after" / "before"
   ```

   Stories whose placement is only ordinal use `offset: after` or
   `offset: before`. Stories with no constraint omit the field; the checker
   lists them as unplaced instead of pretending they are simultaneous.
3. Teach `timeline_variance.js` to resolve anchors transitively to one of the
   two references, sort by resolved offset, and skip null-dated events in
   the ordering check (the second half of defect 3.7).
4. Leave story-local `T0` chronologies exactly as they are. They describe
   duration, not position.

This keeps "no universal calendar" true. Offsets are relative to events the
author has locked, and the only numeric interval in the system is the one
`0008` and `0022` already state.

### 3.2 Units

Prose uses four duration words the lore never defines:

| Unit | Evidence | Reading that fits every use |
|------|----------|-----------------------------|
| watch | "watch-cycles, four hours apiece" (`the_light_inheritance/manuscript.md:143`) | four hours (explicit in `0004`) |
| pull | "three pulls to reach them" (`0001`); "T0+2 pulls" (`0013`); "three pulls ago" (`0018:188`) | one corridor transit leg, not a clock unit |
| cycle | last recertification "seventy-two cycles prior" (`the_loss_ledger/manuscript.md:167`); Lysa died "two cycles after" (`:420`) yet "died years ago" (`receipt_for_a_voice/manuscript.md:163`); frame retune "every eight or nine cycles", thirteen since, "two seasons" of stretching (`the_light_inheritance/manuscript.md:153`); "end of cycle" deadline two days out (`0002`) | about one standard month. Seventy-two cycles is then six years, which satisfies "years ago"; thirteen cycles against a nine-cycle interval is four months overdue, which satisfies "two seasons" |
| dimming | `0009` scene headers | one Narthex day; local to the novella |

The tooling disagrees with the prose: `timeline_variance.js` parses
`Cycle N` as `N` centuries ("Assuming 1 cycle = 100 years", in
`parseEvent`). Only `0001`'s `Cycle 0` label uses that form, so nothing
breaks today, but the assumption should be deleted or the label changed
before anyone writes `Cycle 1`.

Recommendation: record "cycle = one standard month" as an author decision
in `data/lexicon/terms.yaml` if accepted, and never use `Cycle N` as an era
label again.

---

## 4. Recommended Master Timeline

Eras are reading-order bands, not calendar years. Within an era, the first
column gives the constraint that fixes the position; "floating" means the
text permits any position inside the era.

### Deep past (locked and draft references, oldest first)

| Reference | Source | Tier |
|-----------|--------|------|
| Colonies launched "before the Lattice stabilized, before memory-gravity became doctrine" | `the_anchorless_tide/manuscript.md:39` | draft |
| Ostra-Vael built "in the eighty-fourth year of the Lattice Expansion" | `the_liturgy_of_rust/manuscript.md:80` | draft; the only era-style date in any manuscript |
| Harbor colony scoured, roughly two hundred fifty years before `0008` | `the_reliquarists_doubt/manuscript.md:208` | primary_canon |
| Ebbhaven lost "decades ago" | `the_anchorless_tide/manuscript.md`; `atlas/Ebbhaven.md:9` | draft story, canonical entity |
| The Bleaching, twenty years before `0004` (grandmother died in it four years before Yenu, who is sixteen) | `the_light_inheritance/manuscript.md:85`, `:209`; `lore/MEMORY_ECONOMY.md:87` | lore event; draft dating |
| Vess Cormick's exposure, twenty-three years before `0002` | `memoir_of_a_nobody/manuscript.md:467` | draft |

The Bleaching is the one historical event with both a lore entry and a
numeric distance from a story. If the author wants a second dated reference
besides the Breach, it is the candidate. The novel outline reinterprets it as
the first extraction test; that is draft and does not change its date.

### Era I: The Wake

| Story | Position | Fixed by |
|-------|----------|----------|
| `0001` The Archivist's Wake | `T0` to `T5`; intervention at `T3`; departure `T4` + 3 days | bible section 1; `the_archivists_wake/manuscript.md:195` |
| `0014` The Public Weight of a Private Lie | `T0` = the day after the intervention, so `0001 T3 + 1d`; ends at the next dawn | `the_public_weight_of_a_private_lie/manuscript.md:38`, `:704` |
| `0016` The Lie That Learned the Hallway | after `0014`'s first bulletin and "after the second bulletin cycle"; one station day; so `0001 T3 + 2d` to `+3d`, overlapping Rell's repair days | `the_lie_that_learned_the_hallway/manuscript.md:44`, `:172` |

Both Heliodrome drafts take place while the Canticle crew of `0001` is still
docked. Neither mentions Rell, Sutira, Estavan, or Tari, and Mael's watchlist
forbids placing him in control of them (`characters/Mael_Ivar.md`). That is
the correct discipline and should be kept when either is promoted.

### Era II: The Drift Ledger (between the Wake and the Breach)

Ordered chain (each fixed by the next):

| Story | Position | Fixed by |
|-------|----------|----------|
| `0013` The Smallest Burn | early in Elior's service; before `0021` and `0022` | `receipt_for_a_voice/manuscript.md:264`: "flown one supervised correction" |
| `0004` The Light Inheritance | before `0015` and `0021`; twenty years after the Bleaching | `the_halix_aftermarket/manuscript.md:218` ("heard one cleanly not long ago"); `0021` recalls Aurel Ket's offer |
| `0015` The Halix Aftermarket | shortly after `0004`; after "last season" relative to `0021` | `receipt_for_a_voice/manuscript.md:275` |
| `0017` The Loss Ledger | days before `0021`; H-37 certified roughly six years earlier | `0021:163`, `:165`; `the_loss_ledger/manuscript.md:167` |
| `0021` Receipt for a Voice | immediately after `0017`'s suspension notice; before `0022` | see section 5, `0021` |
| `0008` The Reliquarist's Doubt | `TB - 12w` | locked |

Floating within Era II (placement by preference; see section 5 for each):
`0003`, `0005`, `0006`, `0007`, `0010`, `0011`, `0012`, `0018`, `0019`,
`0002`.

Suggested internal order for the floating set, using only soft evidence:
`0010` near `0004` (Aurel Ket already knows of "an inner-ring lattice node
currently suffering some conceptual drift",
`the_light_inheritance/manuscript.md:335`, which is `0010`'s concealed seam); `0007` before
`0018`; `0012` before `0022`; `0003`, `0005`, `0006`, `0011`, `0019`, `0002`
anywhere.

### Era III: The Breach

| Story | Position |
|-------|----------|
| `0022` Spend What You Can Afford | `TB`; `0008 + 12w`; three hours |

### Era IV: After the Breach

Open consequences from `0022` that any later story inherits: Hael's Solace
transfer (not yet on-page), the Inquisition of Jory Fenn, the Navigant
Sect's judgment of Ilka Marsk, Elior's unfiled cost, the softening Fourth
and Ninth Sleeves, suspended pledge audit, TES-N3-44217 deferred.

| Story | Recommended position | Reason |
|-------|----------------------|--------|
| `0009` The Doctrine of Empty Stars | after `TB`, before the novel | The outline fixes it "after The Archivist's Wake ... before the flagship novel" (`stories/novella/NOVELLA_THE_DOCTRINE_OF_EMPTY_STARS/outline.md:21`). Nothing fixes it against the Breach. Placing it after gives the Canticle recovery mission a motive the locked canon already supplies (null stones in Fleet custody, a Synod agent before the Inquisition) and keeps `0022` as the first Synod action inside the Drift. Placing it before is equally consistent with the text. |

### Era V: The Novel

| Story | Recommended position | Reason |
|-------|----------------------|--------|
| `0020` The Inventory of Absence | immediately before or during the novel's Part Two | The administrative quarantine of a mid-world is the novel's premise (`stories/novel/NOVEL_FORGOTTEN_TIDES/outline.md:68`); `0020` shows its cargo arriving at Heavonly (`the_inventory_of_absence/manuscript.md:36`). The story is a dependency on draft novel context, which is open author decision 5 in the process review. |
| Novel (Forgotten Tides) | last | Outline: the political conflict that "brings the Obsidian Synod forward" |

### 4.1 The one cross-cluster decision

Nothing in locked text orders Era I against Eras II and III. Both readings
are consistent: the Heliodrome crisis before the Breach, or concurrent with
the Drift ledger. The recommended default is Era I first, by months to a few
years, for these reasons:

- `0001` carries the `Cycle 0` label and is the founding story; AGENT.md
  section 1.5 treats it as the baseline everything else extends.
- `0022` is written as an escalation with consequences aimed at later
  stories; `0001` is written as an origin with its aftermath (`0014`,
  `0016`) already drafted.
- The novella outline and the novel both describe themselves as after the
  Wake, and both read more naturally after the Breach as well.
- No Tessarine-cluster story mentions a Heliodrome crisis and no Heliodrome
  story mentions Tessarine. Silence is compatible with either order, so the
  choice costs no rewrites.

If the author prefers the clusters concurrent, nothing above changes except
the `HI` to `TB` offset in `events.yaml`.

---

## 5. Placement of Each Unpromoted Story

Confidence: **fixed** means the text forces the position; **chained** means
it follows from a draft the author would have to promote first; **floating**
means any position in the era is consistent. "Blockers" are contradictions to
resolve before the placement can be recorded in frontmatter; they are not
promotion scores, which belong to `agents/canon_promotion_review_agent.md`.

| ID | Title | Recommended slot | Confidence | Blockers and notes |
|----|-------|------------------|------------|--------------------|
| `0002` | Memoir of a Nobody | Era II, any point; epilogue reaches past every other story | floating | Isolated setting ("stable memory region", `:31`). The epilogue's "years later" publication implies civilization continues undisturbed; it is safest placed so the epilogue lands after the novel or stays undated. If the author wants it tied in, the "reliquary transport accident" twenty-three years earlier (`:467`) could be the Bleaching. |
| `0003` | The Tuner of Last Lights | Era I or II, before `0015` | floating | Solace is placed "on the outer rim of the Helios Drift" (`:12`, `:28`); the atlas puts it at the Lattice Gap's outer sleeve. Resolve before placing (section 7.1). "Daughters in Tess" (`:182`, `:374`) uses Tess as a place name while Tess Vlin is a character; rename one. Indre Vael (twenty-two years at the bench, `:116`) and Lira Voss never meet; fine, but `0003` should not be promoted without reconciling which Remembrancer runs the bench. |
| `0004` | The Light Inheritance | Era II, head of the Drift Clade chain | chained (fixes `0015`, `0021`) | No blockers. Defines the Bleaching at twenty years before itself (`:85`, `:209`); that becomes a dated reference on promotion. Uses "cycle" as a month (`:153`). |
| `0005` | The Liturgy of Rust | Era II, floating; or earlier | floating | "Eighty-fourth year of the Lattice Expansion" (`:80`) is the only era-style date in the corpus; promotion would lock a calendar name the bible does not have. Decide whether "Lattice Expansion" is an era the universe keeps. Kaelen and Vane are already `canonical` entities from a draft story (process review 3.8). The Cleric's zero-anchor "shattering" the eddy is a mechanics question for the promotion review, not a dating one. |
| `0006` | The Anchorless Tide | Era II or earlier, floating | floating | "The Forgotten Tides" is used as a literal region (`:10`, `:35`) that `lore/COSMIC_REGIONS.md` does not list. Either add the region or reword. Ebbhaven (`loc-0009`) is `canonical` while its only story is a draft. Pre-Lattice colonies (`:39`) are a deep-past claim worth keeping if promoted. |
| `0007` | The Hospice Knot | Era I or II, before `0018` | chained (fixes `0018`) | Solace window shows the Lattice Gap (`:489`), matching the atlas but not `0003` or `0018`. The failed evacuation "beyond the Lattice Gap" with six missing pods (`:125`, `:127`) and the novella's Tern Gate evacuation with a closed recovery order (`continuity_brief.md:130`) are different events as written; the author could unify them, which would order `0007` before `0009`. |
| `0009` | The Doctrine of Empty Stars (novella) | Era IV, before the novel | floating within "after Wake, before novel" | Scored separately; the promotion tool does not handle novellas. Veyr, Tovan, Ilet unresolved by design. Ives Mar's lost first-ship anchor must stay lost in any later Canticle story. |
| `0010` | The Error That Remembered Itself | Era II, near `0004` | floating | Sera is twenty-nine (`:205`); the Consortium already has "several nodes under private review" (`:329`), which Aurel Ket's offer in `0004` corroborates. No dating blockers. |
| `0011` | The Quiet Census | Era II, floating | floating | Fully independent: unnamed hull, Remnant Seas, no shared characters. Seventeen watches in the field (`:149`). Place anywhere. |
| `0014` | The Public Weight of a Private Lie | Era I, `0001 T3 + 1d` | fixed | No blockers. Promotion would lock the Heliodrome's "held, not healed" state and the Authority's public phrasing as the aftermath of `0001`. |
| `0015` | The Halix Aftermarket | Era II, shortly after `0004` | chained (needs `0004`) | Tess's "three times in twelve years" (`:736`) gives her bench tenure. Depleted renewal bond must persist into `0021`. |
| `0016` | The Lie That Learned the Hallway | Era I, `0014 + 1d` to `+2d` | fixed (after `0014`) | No blockers. One resident lost behind the duplicated door is a Heliodrome casualty later stories should not erase. |
| `0017` | The Loss Ledger | Era II, days before `0021` | chained (fixes `0021`) | H-37's seventy-two-cycle history (`:167`) only reads as "years" if cycle is a month. Corin under personnel review afterward (`characters/Corin_Tave.md:50`). |
| `0018` | The Navigator Who Forgot Enough | Era II, after `0007` | chained (needs `0007`) | Two blockers: Solace "at the edge of the Void Regions" (`:54`, `:152`) contradicts the atlas and `0003`; timestamps `T6`, `T6+1`, `T6+2` (`:57`, `:65`) sit on the bible's scale and must be renumbered. `characters/Lira_Voss.md:22`, `:34` list only `0007`; the entity file does not yet know this story exists, and its summary does not carry the attenuated bond with Nim. |
| `0019` | The Miniaturist's Name | Era II, floating | floating | Independent of `0004`'s Skather-Ait line, though both show the Lattice absorbing clade miniaturization (`the_light_inheritance/manuscript.md`, recitation; `:240` here). No dating blockers. |
| `0020` | The Inventory of Absence | Era V, at the novel's Part Two | chained (needs the novel's quarantine) | Depends on open author decision 5 (novella and novel dependency policy). Heavonly (`loc-0014`) is `speculative`. If the novel moves, this moves with it. |
| `0021` | Receipt for a Voice | Era II, after `0017`, before `0022` | fixed relative to `0022`; chained on `0004`, `0015`, `0017` | Why before `0022`: Elior's pre-run and post-run audits here count eleven anchors (`:98`, `:117`). `0022` ends with him carrying seven null stones to the Navigant house at an "expected, unfiled" cost, and his entity file forbids making that run free (`characters/Elior_Ren.md:62`). A later `0021` would show him at eleven anchors after the run, which makes the cost free. The ordering `0013`, `0021`, `0022` also reads correctly as character development: the manifest discipline Elior insists on at the Vault (`0022:807` onward) is the one he first demands at Halix. The story also lies before `0022` on Drift evidence: no mention of suspended pledges or lost silos, which the outer sleeve would feel within days. |

### 5.1 Dependency bundles for promotion order

A draft cannot be placed on the shared timeline above a draft it depends on.
These are the bundles, in the order the chain requires:

- **Heliodrome aftermath:** `0014`, then `0016`. Both depend only on `0001`
  (locked). This is the cheapest bundle to promote and the only one that
  extends Era I.
- **Drift Clade ledger:** `0004`, then `0015`, then `0017`, then `0021`.
  `0021` cannot be promoted before all three; `0022` already cross-refs
  `0021` as a prior claim.
- **Solace consent:** `0007`, then `0018`, after the Solace location is
  settled.
- **Independent:** `0002`, `0003`, `0005`, `0006`, `0010`, `0011`, `0019`
  carry no chain. `0003` and `0005` carry naming decisions (section 7).
- **Deferred:** `0009` (novella process) and `0020` (novel dependency
  policy).

---

## 6. Shared Events the Timeline Needs

`data/timeline/events.yaml` currently holds events from `0001`, `0008`,
`0012`, `0013`, and `0022` only. To make the recommended spine machine-
readable without touching prose, the file would gain:

1. Reference tags on `event-0005` (`HI`) and `event-story-0022-001` (`TB`).
2. An `anchor` on `event-story-0008-004` of `event-story-0022-001 -12w`,
   which is the interval both stories already state.
3. An `anchor` on `event-story-0013-003` of `event-story-0022-001 before`.
4. An author-chosen `anchor` on `event-0005` relative to
   `event-story-0022-001` once section 4.1 is decided.

No draft story's events belong in the shared file until it is promoted; the
playbook already says so. The anchors in section 5 are what each promotion
would add.

---

## 7. Contradictions and Gaps Found

Reported, not resolved. None are in locked files except where noted.

### 7.1 Solace Hospice has three locations

- `atlas/Solace_Hospice.md:11`: "orbiting the Lattice Gap's outer sleeve"
  (canonical entity).
- `0007` agrees: the window shows the Lattice Gap
  (`the_hospice_knot/manuscript.md:489`).
- `0003` puts it "on the outer rim of the Helios Drift"
  (`the_tuner_of_last_lights/manuscript.md:12`, `:28`).
- `0018` puts it "at the edge of the Void Regions"; "The Void Regions lay
  beyond the station's outer sleeve"
  (`the_navigator_who_forgot_enough/manuscript.md:54`, `:152`).

The atlas wins by the repository's own rule. `0003` and `0018` need a
one-line fix each, or the author decides Solace has more than one house
(the `0003` text calls it "an outer Remembrancer house", which would
support that). `0022` also recommends Hael "to Solace" from the Helios
Drift; the distance matters for any story that writes the transfer.

### 7.2 `0018` timestamps collide with the bible's scale

`T6`, `T6+1`, `T6+2` (`the_navigator_who_forgot_enough/manuscript.md:57`,
`:65`). Every other story uses `T0`. Renumber.

### 7.3 "The Forgotten Tides" as a region

`the_anchorless_tide/manuscript.md:10`, `:35` treat the universe's title as
a named region of space. `lore/COSMIC_REGIONS.md` lists six regions and this
is not one. Decide whether it is a seventh region, a colloquial name for the
Void Regions or Remnant Seas, or a phrase to cut.

### 7.4 "Cycle" means a month in prose and a century in tooling

See section 3.2. `scripts/checks/timeline_variance.js`, `parseEvent`,
comment "Assuming 1 cycle = 100 years". Prose: `the_loss_ledger/
manuscript.md:167`, `:420`; `receipt_for_a_voice/manuscript.md:163`,
`:165`, `:400`; `the_light_inheritance/manuscript.md:153`.

### 7.5 Era-style dates that would become canon on promotion

- "Eighty-fourth year of the Lattice Expansion"
  (`the_liturgy_of_rust/manuscript.md:80`).
- "Twenty-three years ago" (`memoir_of_a_nobody/manuscript.md:467`) and a
  publication epilogue "years later" (`:577`).
- "Lysa Korr ... died years ago" (`receipt_for_a_voice/manuscript.md:163`)
  against "two cycles after H-37's certification"
  (`the_loss_ledger/manuscript.md:420`) and "seventy-two cycles prior"
  (`:167`). Consistent only under cycle = month.

### 7.6 Entity files behind their stories

- `characters/Lira_Voss.md:22`, `:34` cross-ref `0007` only; `0018` is
  missing, and the bond attenuation `0018` records is not in her
  `continuity.watchlist`.
- `atlas/Solace_Hospice.md` cross-refs `0007` only; `0003` and `0018` are
  set there.
- `characters/Kaelen.md:46`, `characters/Vane.md:41`, `atlas/Ebbhaven.md:23`
  are `canonical` from draft stories (process review 3.8, unchanged).

### 7.7 A naming collision

`0003` uses "Tess" as a place (the daughters are "in Tess"; "the corridor
from Tess is too thin") while `0004`, `0015`, and `0021` have Tess Vlin at
Halix. Not a timeline issue; it will confuse any reader who meets both.

### 7.8 Possible unifications (opportunities, not findings)

- `0007`'s failed evacuation beyond the Lattice Gap (six pods unlocated) and
  `0009`'s Tern Gate evacuation (one late corridor, one missing auxiliary, a
  recovery order quietly closed). Different numbers; same Fleet reflex.
  Unifying them would make `0007` the civilian cost of the case Ives Mar is
  still working in `0009`.
- `0010`'s concealed inner-node drift and the "inner-ring lattice node
  currently suffering some conceptual drift" that Aurel Ket wants to
  stabilize with Yenu's grandmother in `0004` (`:335`). Reading them as the same node
  costs nothing and dates `0010` beside `0004`.
- `0002`'s reliquary transport accident and the Bleaching.

---

## 8. Author Decisions Required

Surfaced per CLAUDE.md; not decided here.

1. **Era I against Era III.** Does the Heliodrome crisis precede the
   Tessarine Breach (recommended), follow it, or run concurrently? This
   sets the `HI` to `TB` offset and nothing else.
2. **The anchor convention** in section 3.1, or an alternative. This is the
   fix for process review 3.7 and is a tooling change the author has not
   yet asked for.
3. **"Cycle = one standard month"** as a lexicon entry, and retirement of
   `Cycle N` as an era label.
4. **Solace Hospice's location** (one house at the Lattice Gap per the atlas,
   or several houses). Affects `0003`, `0018`, and the future Hael transfer.
5. **"The Forgotten Tides" as a region name** (`0006`).
6. **"Lattice Expansion" as a calendar era** (`0005`).
7. **Whether `0009` sits before or after the Breach.** Recommended after.
8. **Whether `0020` may depend on the novel's draft context** (existing open
   decision 5).
9. **Which bundles to promote first.** The Heliodrome aftermath (`0014`,
   `0016`) and the Drift Clade ledger (`0004`, `0015`, `0017`, `0021`) are
   the two that extend the locked spine; the review agent's scored report
   should decide whether they bear the weight.

---

## 9. What Was Not Done

- No manuscript, entity file, lexicon term, or timeline event was edited.
- No `canon_tier` was changed and `promote:story` was not run.
- The checker was run (`npm run check:timeline`: 0 hard failures, 136 soft
  warnings, all of them the four files under `stories/novel/` whose ISO
  `created` date is read as a story date) and `npm run validate:ci` passed on
  the tree as found and again with this document added.
- The novella's twelve scene files were read through
  `continuity_brief.md` and the outline, not scene by scene; nothing in the
  brief dates the novella against the Drift stories, and the outline's
  placement line is quoted above.
- `NOVELLA_FIRST_CORRIDOR`, the test novellas, and the screenplay sample are
  `test` tier or empty and were not placed.
