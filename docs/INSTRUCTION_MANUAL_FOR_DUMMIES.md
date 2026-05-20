# Forgotten Tides for Dummies

This is a plain‑English guide for people who are new to the repo but want to create in the **Forgotten Tides** universe with help from AI agents. It explains what the tools do and when you should run them, without editor/owner‑only details.

If you want the deep technical version, see `docs/INSTRUCTION_MANUAL.md`. This file is the friendly “what do I do next?” version.

---

## 1) The 60‑second version (quick start)
1. **Install dependencies once:** `npm install`
2. **Read the core universe rules:** `AGENT.md` (this is the canon bible for tone and metaphysics).
3. **Create or edit content** in the right folder (see section 3).
4. **Run basic checks** before sharing your branch:
   - `npm run lint`
   - `npm run check`
5. **Generate the link map (optional but recommended):** `npm run linkmap:build`
6. **Push your branch** for review.

That’s it. The rest of this document explains *why* these steps matter and what each command does.

---

## 2) What this repo is (in one paragraph)
This repository is a structured story universe. Files aren’t just prose—they’re connected through IDs and references so AI agents and tools can keep the canon consistent. The checks and scripts exist to catch mistakes **before** they become official canon.

---

## 3) Where to put your writing
Use these folders for canon content (each file should have YAML frontmatter):
- **`stories/`** → actual story prose and scenes
- **`lore/`** → worldbuilding, rules of the universe
- **`mechanics/`** → how memory physics, technology, or systems work
- **`atlas/`** → locations and places
- **`factions/`** → organizations or groups
- **`characters/`** → character profiles
- **`manuals/`** and **`design/`** → craft guidance, world design notes

If you’re not sure, put it in `lore/` or `stories/` and label it clearly.

---

## 4) What “frontmatter” is (and why it matters)
Every canon file starts with YAML frontmatter at the top. It’s like a “metadata card” so tools can track canon consistently.

Typical frontmatter includes:
- `id` (the canonical ID — lowercase, like `char-0001`)
- `uuid` (unique ID for tracking)
- `cross_refs` (other canon IDs this file references)
- `metadata.status`

If you don’t include the right fields, the lint scripts will tell you what’s missing.

---

## 5) Core checks (the tools you’ll actually use)
Think of these like spellcheckers for the canon.

### ✅ `npm run lint`
Runs **all lint checks** listed below. This is the “run before you share” command.

### `npm run lint:schema`
**What it does:** Checks your YAML frontmatter against the official schemas.  
**When to run:** Whenever you add or edit canon files.  
**If it fails:** Your metadata is missing or incorrect.

### `npm run lint:refs`
**What it does:** Looks for broken references between files (like linking to a character that doesn’t exist).  
**When to run:** After adding new cross‑references.

### `npm run lint:canonical-refs`
**What it does:** Ensures every reference points to a **valid canonical ID**.  
**When to run:** After adding new characters/places/etc.

### `npm run lint:glossary`
**What it does:** Warns when you use special terms that aren’t in the official glossary.  
**When to run:** After introducing new terminology.

### `npm run lint:canon`
**What it does:** Checks for forbidden narrative moves or canon violations.  
**When to run:** Anytime you add new lore or story content.

---

## 6) Continuity & timeline checks (story‑logic checks)
These catch worldbuilding contradictions *across files*.

### `npm run check:continuity`
**What it does:** Checks character/setting rules for contradictions.  
**When to run:** After writing or editing story content.  
**Output:** `out/reports/continuity.json` (a list of issues).

### `npm run check:timeline`
**What it does:** Checks timeline markers to catch dates/events that conflict.  
**When to run:** After editing anything time‑related.  
**Output:** `out/reports/timeline_variance.json`.

### `npm run check`
**What it does:** Runs **both** continuity and timeline checks.  
**When to run:** This is the “one‑command” version.

> **Plain‑English note:** If a command “fails” (exits non‑zero), it just means the script found something you need to fix. It’s like a red “X” in a test suite.

---

## 7) Link maps & the canon index (how the universe stays connected)
### `npm run linkmap:build`
**What it does:** Rebuilds the canon index and cross‑reference map.  
**Why it matters:** The dashboard and other tools rely on this to know what exists.  
**When to run:** After adding new entities or changing cross‑references.

It writes:
- `REFERENCE_MAP.json` (the main graph)
- `CANONICAL_INDEX.md` (the list of all canon IDs)
- `docs/link_map/LINK_MAP.md` (human‑readable map)

---

## 8) AI‑assisted authoring (useful but optional)
If you want AI agents to help draft or revise, use:

### `node scripts/prompt/orchestrate.js "<request>"`
**What it does:** Runs the built‑in AI prompt system.  
**Example:**  
`node scripts/prompt/orchestrate.js "brainstorm a memory‑driven ritual on a derelict station"`

Outputs are saved to folders like:
- `lore/ideas/`
- `lore/notes/`
- `stories/<type>/<work>/`
- `out/prompts/`

This is optional if you’re writing manually.

---

## 9) The dashboard (visual sanity check)
### `npm run dashboard`
Starts a local server at `http://localhost:8080/dashboard/`.  
Use this to **visualize relationships** and check for missing links.

If nothing shows up, run `npm run linkmap:build` first.

---

## 10) The standard “share your branch” workflow
If you’re preparing work for review:
1. Add or edit files.
2. Run `npm run lint`.
3. Run `npm run check`.
4. Run `npm run linkmap:build` (recommended).
5. Push your branch.

That’s the best way to avoid back‑and‑forth fixes.

---

## 11) Where to look if something fails
- **Schema errors:** The lint output will tell you which frontmatter fields are missing.
- **Broken references:** Open `CANONICAL_INDEX.md` to check IDs.
- **Continuity/timeline issues:** Open the JSON reports in `out/reports/`.

If something isn’t clear, note the file path and the error message when you ask for help.

---

## 12) Friendly glossary of terms
**Canonical ID:** The official unique name for a thing in the universe.  
**Frontmatter:** Metadata block at the top of a file.  
**Lint:** Automated checks for formatting and rules.  
**Continuity:** Making sure the story doesn’t contradict itself.  
**Timeline:** The ordering of events across stories and lore.

---

## 13) You can stop here
If you can:
- edit a file,
- run `npm run lint` and `npm run check`,
- and push a branch,
you’re doing it right.
