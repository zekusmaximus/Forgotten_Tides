# Pilot Manual — UI Kit

In-universe operational interface for the **Canticle Fleet Pilot Manual: Memory Corridor Operations & Anchor Integrity Protocols**. Reconstructs the canonical document from the source repo's `manuals/PILOT_MANUAL.md` as a reading + reference interface, not a marketing page.

The vibe: half illuminated manuscript, half terminal readout. Mono-heavy chrome around editorial body copy. Stenciled classification banner at the top, restless faint scanlines on the chrome (very subtle), live anchor-audit widget in the rail.

## Files

- `index.html` — bootstrap; mount point for the React tree
- `Manual.jsx` — shell: header strip + sidebar + scrollable manual content
- `Components.jsx` — shared primitives (Callout, Stepper, CorridorStates, GlossaryChip, AnchorAuditWidget, etc.)
- `Content.jsx` — the manual itself, section by section, composed from the components

## What's real vs. mocked

- **Text is canonical** — lifted directly from `manuals/PILOT_MANUAL.md` in the source repo. Section numbers, wording, prohibitions, and quotations are preserved.
- **Anchor audit widget is functional** — toggle anchors in/out, see the count change live. The widget is the kind of in-flight tool a pilot would actually use mid-corridor.
- **Corridor-state diagrams** are the same diagrammatic motif used in `assets/corridor-diagram.svg`, expanded with response procedures.
