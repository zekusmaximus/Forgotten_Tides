# Source-First Approval for Draft-Origin Entries

This policy covers character, location, and faction profiles and structured
lexicon terms whose claims first appear in a draft story. A link to a draft,
a `first_appearance`, or a `canonical_source` field records provenance; it does
not approve the linked claims.

## Default

- Keep a draft-origin profile at `metadata.status: speculative` and a
  draft-origin lexicon term at `status: draft` while its source story is a
  draft. Do not treat a reference from an approved entry as approval of the
  draft entry's definition or full profile.
- Review the source story and its story or event prerequisites before
  promoting it. Approval of the story opens a separate, claim-by-claim review
  of each linked profile and term; it does not promote those entries
  automatically. Keep unsupported or later-draft details provisional.

## Narrow Independent Approval

An entry may receive independent approval before its source story only for
claims that an existing primary source already establishes. For each such
proposal:

1. Cite the exact supporting passage in a governing bible or mechanics file,
   or in an approved primary-canon story. Match the entry's wording and scope
   to that evidence; remove or isolate details supported only by the draft.
2. Run `npm run report:impact -- --id <entry-id> --include-mentions` and inspect
   its declared dependents. Search prose mentions and lexicon
   `canonical_source` and `related_terms` by hand; the impact report does not
   index all of them. Check whether any primary-canon entry would still rely
   on an unapproved draft claim.
3. Record the proposed tier, wording, source, affected entries, and rationale
   in the editorial review. Obtain explicit author approval for that defined
   scope before changing the entry's status.

A working-lore-backed baseline may be approved separately at
`canon_tier: working_canon`, as with Drift Clades. That does not make its
draft-specific details primary canon. Story and event prerequisite rules remain
governed by the story promotion process.

See [provisional profiles](provisional_profiles.md) and
[working-lore approval decisions](working_lore_approvals.md) for current
applications of this policy.
