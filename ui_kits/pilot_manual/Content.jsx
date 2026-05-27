// Pilot Manual — section content.
// Text adapted from the canonical manuals/PILOT_MANUAL.md in the source repo.
// Structure follows the source 1:1 so pilots cross-referencing the document
// can find the same section numbers.

// ---------- Corridor state waveforms (used by the 4-card row in §4) ----------
const SIG_STABLE   = (c) => (<>
  <path fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" d="M 0 12 L 200 12" />
  <path fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" d="M 0 24 L 200 24" />
</>);
const SIG_THINNING = (c) => (<>
  <path fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" d="M 0 12 Q 25 9 50 12 T 100 12 T 150 12 T 200 12" />
  <path fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" d="M 0 24 Q 25 27 50 24 T 100 24 T 150 24 T 200 24" />
</>);
const SIG_RAVELING = (c) => (<>
  <path fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 4" d="M 0 12 Q 30 6 60 13 T 140 17 T 200 10" />
  <path fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 4" d="M 0 24 Q 30 30 60 23 T 140 19 T 200 26" />
</>);
const SIG_COLLAPSE = (c) => (<>
  <path fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1 5" opacity="0.6" d="M 0 12 Q 30 0 60 18 T 140 24 T 200 8" />
  <path fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1 5" opacity="0.4" d="M 0 24 Q 30 36 60 18 T 140 12 T 200 28" />
  <circle cx="40" cy="6" r="1" fill={c} opacity="0.5" />
  <circle cx="120" cy="28" r="1" fill={c} opacity="0.4" />
  <circle cx="180" cy="14" r="1" fill={c} opacity="0.6" />
</>);

function Content() {
  return (
    <article style={{ paddingBottom: 120 }}>

      {/* ====== Preface ====== */}
      <Section id="s0" num={0} kicker="Preface" title="Purpose of this manual">
        <P>The purpose of this manual is to ensure that all Memory Corridor operations are conducted with maximal coherence, minimal identity loss, and ethically sanctioned memory expenditure.</P>
        <P>Pilots are custodians of the corridor and stewards of their own diminishing selves. This manual exists to keep both intact as long as possible.</P>
        <Quote cite="Archivist Doctrine, Navigant Sect">
          "To navigate is to remember with discipline. To survive is to forget with consent."
        </Quote>
      </Section>

      {/* ====== §1 The Memory Field ====== */}
      <Section id="s1" num={1} kicker="Operational overview" title="The Memory Field">
        <P>Memory is the force that binds spacetime. Forgetting unbinds it.</P>
        <P>Pilots must internalize four operational quantities before stepping into a sensorium ring:</P>
        <List items={[
          <><Gloss>Memory density</Gloss> determines corridor stability.</>,
          <><Gloss>Attention</Gloss> binds coherence.</>,
          <><Gloss>Anchor integrity</Gloss> preserves identity.</>,
          <><Gloss>Memory drives</Gloss> convert recollection into navigable meaning.</>,
        ]} />
        <Callout tone="warning" title="LAW">
          If memory fails, gravity fails, and the corridor dissolves. There is no third state.
        </Callout>
      </Section>

      {/* ====== §2 Memory Drives ====== */}
      <Section id="s2" num={2} kicker="Standard operating procedure" title="Memory drives">
        <P>Memory Drives convert memories into coherence-weight that stabilizes Memory Corridors. The Drive is not a tool you operate; it is a tool that consumes you, in measured doses, while you operate it.</P>

        <Sub num="2.1" title="Valid memory inputs">
          <Term name="Personal memory" hint="default · low risk">Smooth corridor texture, modest coherence yield. Use for routine intra-system traversal.</Term>
          <Term name="Emotional memory" hint="dense · volatile">High coherence per unit, unpredictable behavior in turbulence. Archivist clearance required.</Term>
          <Term name="Civic memory" hint="high mass">Powerful but oversteers; risk of conceptual overshoot. Archivist clearance required.</Term>
          <Term name="Reliquary stones" hint="tuned · preferred">The safest calibrated source. Always use a single stone unless lattice-harmonics permit otherwise.</Term>
        </Sub>

        <Sub num="2.2" title="Absolute prohibitions">
          <Callout tone="prohibited">
            <List items={[
              "Involuntary memory extraction.",
              "Composite memory inputs without tuning.",
              "Burning forbidden anchors.",
              "Zero-anchoring without emergency authorization.",
            ]} />
          </Callout>
        </Sub>

        <Sub num="2.3" title="Drive activation sequence">
          <Stepper steps={[
            "Secure sensorium ring.",
            "Establish anchor audit baseline.",
            "Confirm reliquary tuning (if used).",
            "Initiate meaning-lock.",
            "Engage corridor resonance.",
            "Maintain continual attention-binding.",
            "Monitor conceptual shear readings.",
            "Disengage only when corridor is fully sealed.",
          ]} />
          <Callout tone="warning">
            Failure to follow sequence may induce <Gloss>raveling</Gloss> or catastrophic identity degradation.
          </Callout>
        </Sub>
      </Section>

      {/* ====== §3 Anchor Theory ====== */}
      <Section id="s3" num={3} kicker="Identity preservation during flight" title="Anchor theory">
        <P>Anchors are mental constructs — memories, rituals, or sense-impressions — that maintain pilot coherence under corridor strain. They are also the only currency the Drive accepts.</P>

        <Sub num="3.1" title="Anchor classes">
          <Term name="Basic anchors" hint="default issue">Name, birthplace, habitual memories.</Term>
          <Term name="Ritual anchors" hint="trained">Mnemonic sequences reinforced during Academy preparation.</Term>
          <Term name="Emotional anchors" hint="forbidden">Intimate or foundational memories. Their burn is permanent.</Term>
          <Term name="Ancestral anchors" hint="rare · inherited">Culturally reinforced memories. Treated as civic property.</Term>
        </Sub>

        <Sub num="3.2" title="Anchor audit protocol">
          <P>Pilots must conduct audits before, during, and after every run. The discipline is not optional. The Loss Ledger is consulted at the start of every assignment.</P>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 14, marginBottom: 6 }}>
            <div style={{ border: "1px solid var(--void-5)", background: "var(--void-2)", borderRadius: 4, padding: "14px 16px" }}>
              <Eyebrow color="var(--entity-character)">Pre-run</Eyebrow>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <li style={{ fontSize: 13, color: "var(--ink-2)" }}>Recite anchors in sequence.</li>
                <li style={{ fontSize: 13, color: "var(--ink-2)" }}>Verify sensory recall.</li>
                <li style={{ fontSize: 13, color: "var(--ink-2)" }}>Confirm emotional resonance.</li>
                <li style={{ fontSize: 13, color: "var(--ink-2)" }}>Report distortions to Archivist Lead.</li>
              </ul>
            </div>
            <div style={{ border: "1px solid var(--void-5)", background: "var(--void-2)", borderRadius: 4, padding: "14px 16px" }}>
              <Eyebrow color="var(--state-thinning)">Mid-run · silent</Eyebrow>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <li style={{ fontSize: 13, color: "var(--ink-2)" }}>Check 1 anchor every 30–90 seconds.</li>
                <li style={{ fontSize: 13, color: "var(--ink-2)" }}>Watch for fading.</li>
                <li style={{ fontSize: 13, color: "var(--ink-2)" }}>Watch for blurring.</li>
                <li style={{ fontSize: 13, color: "var(--ink-2)" }}>Watch for resonance mismatch.</li>
              </ul>
            </div>
            <div style={{ border: "1px solid var(--void-5)", background: "var(--void-2)", borderRadius: 4, padding: "14px 16px" }}>
              <Eyebrow color="var(--amber)">Post-run</Eyebrow>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <li style={{ fontSize: 13, color: "var(--ink-2)" }}>Full recitation, witnessed.</li>
                <li style={{ fontSize: 13, color: "var(--ink-2)" }}>Archivist verification.</li>
                <li style={{ fontSize: 13, color: "var(--ink-2)" }}>Cognitive drift assessment.</li>
                <li style={{ fontSize: 13, color: "var(--ink-2)" }}>Memory imprint scan.</li>
              </ul>
            </div>
          </div>
        </Sub>
      </Section>

      {/* ====== §4 Corridor states ====== */}
      <Section id="s4" num={4} kicker="Classification & response" title="Corridor states">
        <P>The Drive will hold any one of four states. Read the corridor's behavior before you read the instruments — by the time the instruments confirm <Gloss>raveling</Gloss>, the pilot already knows.</P>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, margin: "18px 0", maxWidth: "62ch" }}>
          <CorridorStateCard
            state="01" label="Stable" color="var(--state-stable)" signature={SIG_STABLE}
            indicators={["Meaning clear.", "Objects retain physicality.", "Minimal anchor taxation."]}
            response="Maintain standard attention-binding. Continue scheduled mid-run audits."
          />
          <CorridorStateCard
            state="02" label="Thinning" color="var(--state-thinning)" signature={SIG_THINNING}
            indicators={["Surfaces ripple between concepts.", "Limbs drift out of solidity.", "Air vibrates with uneven coherence."]}
            response="Increase attention-binding. Reduce emotional agitation. Light memory input correction."
          />
          <CorridorStateCard
            state="03" label="Raveling" color="var(--state-raveling)" signature={SIG_RAVELING}
            indicators={["Auditory distortion (drive keening).", "Semantic confusion.", "Partial object dissolution.", "Temporal misalignment."]}
            response="Deploy reliquary immediately. Increase memory input. Signal crew for anchor checks. Prepare for emergency drift maneuvers."
          />
          <CorridorStateCard
            state="04" label="Collapse" color="var(--state-collapse)" signature={SIG_COLLAPSE}
            indicators={["Loss of physical definition.", "Loss of personal identity boundaries.", "Rapid anchor burn cascade.", "Spacetime unbinding."]}
            response="No recovery possible. Attempt to eject crew into sealed reality-layer (rarely successful)."
          />
        </div>

        <Callout tone="irrevocable" title="ON RECORD">
          No corridor collapse has ever been reversed.
        </Callout>

        <Quote cite="The Archivist's Wake">
          Thinning presents as "glass one heartbeat, wrinkled membrane the next."
        </Quote>
      </Section>

      {/* ====== §5 Eddies ====== */}
      <Section id="s5" num={5} kicker="Recognition & avoidance" title="Eddies">
        <P>Eddies are forgetting-attractors: localized zones where meaning erodes rapidly. They are not weather. They hunt.</P>

        <Sub num="5.1" title="Characteristics">
          <List items={[
            "Geometric aberrations — corridor curvature becomes non-Euclidean.",
            "Intense conceptual hunger.",
            "Pursuit of memory-mass — they orient toward the drive.",
            "Ability to follow mnemonic wake (canonically observed in the Lattice Gap).",
          ]} />
        </Sub>

        <Sub num="5.2" title="Early warning signs">
          <List items={[
            "Drop in name recall.",
            "Misalignment in sensorium feed.",
            "Corridor drift toward non-Euclidean curvature.",
          ]} />
        </Sub>

        <Sub num="5.3" title="Avoidance protocol">
          <Stepper steps={[
            "Reduce memory leakage.",
            "Tighten attention-binding.",
            "Suppress emotional spikes.",
            "Deploy small, stable reliquary — personal memory preferred.",
            "Alter heading through meaning-gradient variance.",
          ]} />
          <Callout tone="warning" title="REMEMBER">
            Eddies erase meaning first, bodies second. By the time the hull deforms, the crew has already begun to forget why they are there.
          </Callout>
        </Sub>
      </Section>

      {/* ====== §6 Reliquary stones ====== */}
      <Section id="s6" num={6} kicker="Operational use" title="Reliquary stones">
        <P>Reliquaries are condensed, tuned memories used for navigation. Treat each stone as a vow given by the person whose memory it carries.</P>

        <Sub num="6.1" title="Categories">
          <Term name="Personal" hint="stable · gentle">Smooth corridor texture. Use for routine work.</Term>
          <Term name="Civic" hint="powerful · dangerous">Risk of oversteering. Archivist clearance required.</Term>
          <Term name="Ancestral" hint="rare · ritual-restricted">May only be deployed during continuity-locked operations.</Term>
          <Term name="Emotional" hint="unpredictable · high clearance">Cleared only for Quietive-supervised flights.</Term>
        </Sub>

        <Sub num="6.2" title="Best practices">
          <List items={[
            "Personal memories yield smooth corridors.",
            "Civic memories risk oversteering.",
            "Stones must be archivist-tuned before flight.",
            "Use only one stone at a time unless lattice-harmonics permit otherwise.",
          ]} />
          <Callout tone="canon" title="CASE">
            In <em>The Archivist's Wake</em>, a birch-memory stone (a personal recollection of a sapling tended after funerals) stabilized the corridor safely where a civic stone would have oversteered.
          </Callout>
        </Sub>
      </Section>

      {/* ====== §7 Zero-Anchoring ====== */}
      <Section id="s7" num={7} kicker="Prohibition & consequences" title="Zero-anchoring">
        <P>Zero-anchoring is the technique of using the pilot's own identity as raw memory fuel. The drive consumes the self rather than a stored recollection. It works. It is also the surest way to disappear without dying.</P>

        <Callout tone="prohibited" title="LEGAL STATUS">
          Strictly forbidden. Classified as a sacrificial emergency technique. Any pilot found to have zero-anchored outside of full emergency authorization will be remanded to Quietive observation indefinitely.
        </Callout>

        <Sub num="7.2" title="Effects">
          <List items={[
            "Guaranteed anchor burn.",
            "Cognitive void formation.",
            "Long-term dissociation.",
            "Gravitational lightness — measurable.",
            "Increased susceptibility to drift phenomena.",
          ]} />
        </Sub>

        <Sub num="7.3" title="Canonical example">
          <P>Rell's zero-anchor in the Lattice Gap run resulted in:</P>
          <List items={[
            "Loss of Sutira's double-hitch anchor-knot.",
            "Reduced identity stability.",
            "Measurable gravitational thinning around pilot.",
          ]} />
          <Callout tone="irrevocable">
            This is irreversible. No therapy, technology, ritual, memory stone, or Solace rite has ever restored a burned anchor. None will.
          </Callout>
        </Sub>
      </Section>

      {/* ====== §8 Conceptual Drift ====== */}
      <Section id="s8" num={8} kicker="Station & structure protocols" title="Conceptual drift">
        <P>Stations with failing memory coherence show misaligned architecture, malfunctioning orientation, and surfaces that forget their purpose. The Heliodrome is the working example.</P>

        <Sub num="8.1" title="Pilot protocol near drift structures">
          <Stepper steps={[
            "Approach only at reduced velocity.",
            "Deploy reliquaries to local field.",
            "Avoid memory overexpenditure — it can worsen drift.",
            "Prepare for manual docking.",
          ]} />
          <Callout tone="warning">
            No pilot may assume conceptual stability inside drift zones. Floors that forget they are floors will let you through.
          </Callout>
        </Sub>
      </Section>

      {/* ====== §9 Emergency Procedures ====== */}
      <Section id="s9" num={9} kicker="Emergency procedures" title="When the run goes wrong">
        <Sub num="9.1" title="Memory surge response">
          <List items={["Dial back resonance.", "Purge emotional leakage.", "Stabilize with neutral personal memory."]} />
        </Sub>
        <Sub num="9.2" title="Anchor burn event">
          <List items={[
            "Pilot must immediately report loss.",
            "Quietive assigned post-run.",
            "Record anchor in Loss Ledger (mandatory).",
          ]} />
        </Sub>
        <Sub num="9.3" title="Passenger semi-nonphysicality">
          <P dim>Common in thinning corridors.</P>
          <List items={[
            "Increase corridor attention-binding.",
            "Do NOT attempt direct physical force.",
            "Re-stabilize meaning-layer before extraction.",
          ]} />
        </Sub>
        <Sub num="9.4" title="Eddy engagement">
          <P dim>If eddy proximity &lt; 3 AU:</P>
          <List items={[
            "Full crew anchor audit.",
            "Deploy memory stone.",
            "Adjust harmonics away from memory wake.",
            "Prepare for emergency corridor exit.",
          ]} />
        </Sub>
      </Section>

      {/* ====== §10 Psychological Aftercare ====== */}
      <Section id="s10" num={10} kicker="Psychological aftercare" title="After the run">
        <P>Every corridor traversal extracts something. Most extractions are recoverable. Some are not. The protocols in this section distinguish between the two and prescribe care accordingly. No pilot leaves a debrief without a Quietive sign-off.</P>

        <Sub num="10.1" title="Post-run symptoms · normal">
          <P dim>These are expected and resolve within 12–72 hours. They are not, on their own, indicators of anchor burn.</P>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 14,
            marginTop: 12,
            marginBottom: 6,
            maxWidth: "62ch",
          }}>
            {[
              { name: "Mild dissociation",       hint: "first 4 hours",   blurb: "A sense of watching the self from outside. Resolves with rest and ordinary sensory input." },
              { name: "Reduced emotional bandwidth", hint: "first 24 hours", blurb: "Affect feels narrow or filtered. Familiar people may register as merely familiar shapes." },
              { name: "Sensory flattening",      hint: "first 48 hours",  blurb: "Colors muted; taste and scent attenuated. Eat slowly, in company." },
              { name: "Short-term recall gaps",  hint: "first 72 hours",  blurb: "Names, route details, and recent conversation may require effort. Do not force." },
            ].map((s, i) => (
              <div key={i} style={{
                border: "1px solid var(--void-5)",
                background: "var(--void-2)",
                borderRadius: 4,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}>
                <div style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--state-stable)",
                }}>● {s.hint}</div>
                <div style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink-1)",
                }}>{s.name}</div>
                <div style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "var(--ink-3)",
                  lineHeight: 1.55,
                }}>{s.blurb}</div>
              </div>
            ))}
          </div>
        </Sub>

        <Sub num="10.2" title="Anchor burn symptoms · attend immediately">
          <P>Any of the following indicators warrants a same-day Quietive evaluation. They are not "stages of grief" — they are gravitational facts.</P>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 14,
            marginTop: 12,
            marginBottom: 6,
            maxWidth: "62ch",
          }}>
            {[
              { name: "Persistent hollowness",       hint: "beyond 72h", blurb: "A specific shape of absence that does not soften with time." },
              { name: "Missing emotional coloration", hint: "selective",  blurb: "Particular people, places, or vows now register as neutral. The deficit is not the pilot's; it is the universe's, as far as the pilot can sense." },
              { name: "Gravitational thinning",      hint: "measurable", blurb: "Crew report the pilot as 'lighter' to be near. Sensorium scans confirm a reduced mnemonic imprint." },
              { name: "Interpersonal distancing",    hint: "involuntary",blurb: "The pilot avoids proximity to those whose remembered intimacy now feels accessed through fog." },
              { name: "Loss of semantic markers",    hint: "names · songs · routes", blurb: "Specific terms vanish cleanly. The pilot can describe their function but not utter them." },
            ].map((s, i) => (
              <div key={i} style={{
                border: "1px solid rgba(229,72,77,0.25)",
                background: "rgba(229,72,77,0.04)",
                borderRadius: 4,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}>
                <div style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#E5484D",
                }}>● {s.hint}</div>
                <div style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink-1)",
                }}>{s.name}</div>
                <div style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "var(--ink-3)",
                  lineHeight: 1.55,
                }}>{s.blurb}</div>
              </div>
            ))}
          </div>
          <Callout tone="irrevocable" title="ON RECORD">
            A burned anchor does not return. Care is not restoration — it is the work of arranging a life around the void.
          </Callout>
        </Sub>

        <Sub num="10.3" title="Required care">
          <Stepper steps={[
            "Quietive evaluation within 24 hours of debrief.",
            "Memory orientation therapy — six sessions minimum.",
            "Reintegration rituals — see §11.3 (Rite of Release).",
            "Long-term observation if multiple burns occur. Multiple-burn pilots are removed from corridor rotation until a Continuity Cleric clears them.",
          ]} />
        </Sub>
      </Section>

      {/* ====== §11 Ritual Practices ====== */}
      <Section id="s11" num={11} kicker="Ritual practices integrated into flight" title="What the ship sings">
        <P>The Canticle Fleet and the Archivist Orders incorporate rites into corridor operations not as decoration but as infrastructure. A ship that does not sing forgets the shape of itself. Each rite below is canonical, attested in the doctrines of the Navigant and Continuity Sects, and required at the cadence indicated.</P>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginTop: 18,
          marginBottom: 4,
          maxWidth: "62ch",
        }}>
          {[
            {
              num: "11.1",
              name: "Anchor Benediction",
              when: "Before major corridor operations",
              led: "Continuity Cleric, on behalf of the crew",
              intent: "Names each anchor aloud. Verifies emotional resonance one final time. Asks no permission — pronounces standing.",
              line: "\"By name and by weight, I hold what I hold. I name what I will not spend.\"",
            },
            {
              num: "11.2",
              name: "Recitation of Lineages",
              when: "Continuous, near drift zones · sung by archivist crew",
              led: "Archivist watch, in rotation through the run",
              intent: "Stabilizes the meaning-field inside the hull by speaking ancestral names through the ship's intercom. Especially required near the Heliodrome and other conceptually compromised structures.",
              line: "\"Estavan, son of Estavan-before-him; Sutira, of the second house of Ostra-Vael…\"",
            },
            {
              num: "11.3",
              name: "Rite of Release",
              when: "Post-burn, in the first quiet hour after debrief",
              led: "Remembrancer of Solace, with the pilot's full crew present",
              intent: "Permits communal acknowledgment of the loss. Grants emotional contour to the void left behind so the pilot does not have to carry the shape of it alone. Does not restore. Does not promise.",
              line: "\"What you spent, you spent for us. We give the absence a name so you do not have to carry it alone.\"",
            },
          ].map((r) => (
            <div key={r.num} style={{
              border: "1px solid var(--void-5)",
              borderLeft: "2px solid var(--amber)",
              background: "var(--void-2)",
              borderRadius: 4,
              padding: "18px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--amber)",
                  letterSpacing: "0.14em",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 500,
                  minWidth: 36,
                }}>{r.num}</span>
                <h4 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  fontWeight: 500,
                  color: "var(--ink-1)",
                  margin: 0,
                  lineHeight: 1.15,
                  letterSpacing: "-0.005em",
                }}>{r.name}</h4>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                columnGap: 14,
                rowGap: 4,
                paddingLeft: 48,
              }}>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--ink-4)",
                  paddingTop: 3,
                }}>When</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-2)" }}>{r.when}</span>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--ink-4)",
                  paddingTop: 3,
                }}>Led by</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-2)" }}>{r.led}</span>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--ink-4)",
                  paddingTop: 3,
                }}>Intent</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>{r.intent}</span>
              </div>

              <div style={{
                marginTop: 6,
                paddingLeft: 48,
              }}>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 16,
                  color: "var(--amber-bright)",
                  lineHeight: 1.5,
                  borderLeft: "1px solid var(--amber-low)",
                  paddingLeft: 14,
                }}>{r.line}</div>
              </div>
            </div>
          ))}
        </div>

        <Callout tone="canon" title="DOCTRINE">
          A ship is held together by what it remembers to say aloud. Silence is not neutral; it is forgetting in progress.
        </Callout>
      </Section>

      {/* ====== §12 Ethical Mandates ====== */}
      <Section id="s12" num={12} kicker="Binding obligations" title="Ethical mandates">
        <Term name="Proportional expenditure" hint="the first law">Spend only the memory required for survival. Never burn anchors frivolously.</Term>
        <Term name="The doctrine of continuity" hint="with consent">Prioritize communal stability over personal preservation — but with full consent.</Term>
        <Term name="The anti-heresy mandate" hint="absolute">Never encourage forgetting for advantage. Never employ anti-memory techniques. Never tamper with reliquaries in ways that induce drift.</Term>
        <Term name="The mandate of truth" hint="report immediately">Pilots must report anchor loss immediately. Deception endangers reality itself.</Term>
      </Section>

      {/* ====== Closing ====== */}
      <Section id="s13" num={13} kicker="Closing charge" title="To the pilot">
        <Quote cite="Canticle Command Authority">
          "To guide a vessel through the Memory Corridor is to hold the world together by the thread of your own being. To fly is to be unmade slowly. To return is to be remade with what remains."
        </Quote>
        <P>This manual exists so that what remains is enough.</P>
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--void-5)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--ink-4)" }}>End of manual · return to index</span>
          <Stencil>CANON · LOCKED</Stencil>
        </div>
      </Section>

    </article>
  );
}

Object.assign(window, { Content });
