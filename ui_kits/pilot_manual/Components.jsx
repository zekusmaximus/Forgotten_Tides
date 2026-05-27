// Pilot Manual — shared primitives.
// All components in this kit are written to live inside a dark void-1 canvas
// and use the Forgotten Tides design tokens from colors_and_type.css.

/* ============================== Eyebrow ============================== */
function Eyebrow({ children, color = "var(--amber)" }) {
  return (
    <div style={{
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color,
      marginBottom: 10,
    }}>{children}</div>
  );
}

/* ============================== Stencil ============================== */
function Stencil({ children, tone = "amber" }) {
  const tones = {
    amber:  { color: "var(--amber)",       border: "var(--amber-low)" },
    danger: { color: "#E5484D",            border: "rgba(229,72,77,0.45)" },
    blue:   { color: "var(--entity-character)", border: "rgba(74,158,255,0.45)" },
    grey:   { color: "var(--ink-3)",       border: "var(--void-5)" },
  };
  const t = tones[tone] || tones.amber;
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.24em",
      textTransform: "uppercase",
      padding: "3px 9px",
      border: `1px solid ${t.border}`,
      color: t.color,
      borderRadius: 2,
      display: "inline-block",
      lineHeight: 1.4,
    }}>{children}</span>
  );
}

/* ============================== Section ============================== */
function Section({ id, num, title, kicker, children }) {
  return (
    <section id={id} style={{ paddingTop: 56, paddingBottom: 8, scrollMarginTop: 80 }}>
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: 18,
        marginBottom: 14,
        paddingBottom: 14,
        borderBottom: "1px solid var(--void-5)",
      }}>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--amber)",
          letterSpacing: "0.18em",
          fontVariantNumeric: "tabular-nums",
          minWidth: 64,
          paddingTop: 6,
        }}>§ {String(num).padStart(2, "0")}</div>
        <div style={{ flex: 1 }}>
          {kicker && <Eyebrow color="var(--ink-4)">{kicker}</Eyebrow>}
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: 36,
            color: "var(--ink-1)",
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-0.005em",
          }}>{title}</h2>
        </div>
      </div>
      <div style={{ paddingLeft: 82 }}>{children}</div>
    </section>
  );
}

/* ============================== Subsection ============================== */
function Sub({ num, title, children }) {
  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: 17,
        color: "var(--ink-1)",
        margin: 0,
        marginBottom: 12,
        letterSpacing: "0.005em",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          color: "var(--ink-4)",
          fontWeight: 500,
          fontSize: 13,
          marginRight: 10,
          letterSpacing: "0.08em",
        }}>{num}</span>
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

/* ============================== Prose ============================== */
function P({ children, dim = false }) {
  return (
    <p style={{
      fontFamily: "var(--font-body)",
      fontSize: 15,
      lineHeight: 1.7,
      color: dim ? "var(--ink-3)" : "var(--ink-2)",
      margin: "0 0 14px",
      maxWidth: "62ch",
    }}>{children}</p>
  );
}

/* ============================== Callout ============================== */
function Callout({ tone = "protocol", title, children }) {
  const tones = {
    protocol:    { c: "var(--entity-character)", label: "PROTOCOL",       bg: "rgba(74,158,255,0.05)",  border: "rgba(74,158,255,0.3)" },
    prohibited:  { c: "#E5484D",                  label: "PROHIBITED",     bg: "rgba(229,72,77,0.05)",   border: "rgba(229,72,77,0.35)" },
    warning:     { c: "#FF8E3C",                  label: "WARNING",        bg: "rgba(255,142,60,0.05)",  border: "rgba(255,142,60,0.3)" },
    canon:       { c: "var(--amber)",             label: "CANON",          bg: "rgba(232,168,86,0.05)",  border: "rgba(232,168,86,0.3)" },
    irrevocable: { c: "#E5484D",                  label: "IRREVOCABLE",    bg: "rgba(229,72,77,0.06)",   border: "rgba(229,72,77,0.45)" },
  };
  const t = tones[tone] || tones.protocol;
  return (
    <div style={{
      border: `1px solid ${t.border}`,
      background: t.bg,
      borderRadius: 4,
      padding: "16px 18px",
      margin: "18px 0",
      position: "relative",
      maxWidth: "62ch",
    }}>
      <div style={{ position: "absolute", top: -8, left: 14 }}>
        <Stencil tone={tone === "prohibited" || tone === "irrevocable" ? "danger" : tone === "warning" ? "amber" : tone === "canon" ? "amber" : "blue"}>
          {title || t.label}
        </Stencil>
      </div>
      <div style={{
        fontFamily: "var(--font-body)",
        fontSize: 14,
        lineHeight: 1.65,
        color: "var(--ink-2)",
        marginTop: 6,
      }}>{children}</div>
    </div>
  );
}

/* ============================== List ============================== */
function List({ items, dim = false }) {
  return (
    <ul style={{
      listStyle: "none",
      padding: 0,
      margin: "8px 0 14px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      maxWidth: "62ch",
    }}>
      {items.map((item, i) => (
        <li key={i} style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          lineHeight: 1.6,
          color: dim ? "var(--ink-3)" : "var(--ink-2)",
          display: "flex",
          gap: 12,
        }}>
          <span style={{ color: "var(--amber-low)", flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 11, paddingTop: 4 }}>—</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ============================== Stepper ============================== */
function Stepper({ steps }) {
  return (
    <ol style={{
      listStyle: "none",
      padding: 0,
      margin: "12px 0 16px",
      display: "flex",
      flexDirection: "column",
      gap: 0,
      maxWidth: "62ch",
      borderTop: "1px solid var(--void-5)",
    }}>
      {steps.map((s, i) => (
        <li key={i} style={{
          display: "grid",
          gridTemplateColumns: "44px 1fr",
          gap: 16,
          padding: "12px 0",
          borderBottom: "1px solid var(--void-5)",
          alignItems: "baseline",
        }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--amber)",
            letterSpacing: "0.1em",
            fontVariantNumeric: "tabular-nums",
            fontWeight: 500,
          }}>{String(i + 1).padStart(2, "0")}</span>
          <span style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--ink-1)",
            lineHeight: 1.5,
          }}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

/* ============================== Definition Term ============================== */
function Term({ name, hint, children }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "minmax(180px, 200px) 1fr",
      gap: 24,
      padding: "12px 0",
      borderBottom: "1px solid var(--void-5)",
      maxWidth: "62ch",
    }}>
      <div>
        <div style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--ink-1)",
        }}>{name}</div>
        {hint && <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--ink-4)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginTop: 3,
        }}>{hint}</div>}
      </div>
      <div style={{
        fontFamily: "var(--font-body)",
        fontSize: 14,
        color: "var(--ink-2)",
        lineHeight: 1.6,
      }}>{children}</div>
    </div>
  );
}

/* ============================== Quote ============================== */
function Quote({ children, cite }) {
  return (
    <blockquote style={{
      margin: "24px 0",
      padding: "0 0 0 24px",
      borderLeft: "1px solid var(--amber)",
      maxWidth: "42ch",
    }}>
      <div style={{
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontWeight: 400,
        fontSize: 22,
        lineHeight: 1.4,
        color: "var(--ink-1)",
      }}>{children}</div>
      {cite && (
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--ink-4)",
          marginTop: 10,
        }}>— {cite}</div>
      )}
    </blockquote>
  );
}

/* ============================== Glossary Chip ============================== */
function Gloss({ children }) {
  return (
    <span style={{
      fontFamily: "var(--font-body)",
      fontSize: "0.95em",
      color: "var(--amber-bright)",
      borderBottom: "1px dotted var(--amber-low)",
      cursor: "help",
      padding: "0 1px",
    }}>{children}</span>
  );
}

/* ============================== Corridor State Card ============================== */
function CorridorStateCard({ state, label, color, indicators, response, signature }) {
  return (
    <div style={{
      border: "1px solid var(--void-5)",
      borderTop: `2px solid ${color}`,
      background: "var(--void-2)",
      borderRadius: 4,
      padding: "18px 18px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            color: color,
            textTransform: "uppercase",
            marginBottom: 4,
          }}>State · {state}</div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 500,
            color: "var(--ink-1)",
            lineHeight: 1.15,
          }}>{label}</div>
        </div>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: color,
          boxShadow: `0 0 12px ${color}66`,
          marginTop: 8,
        }} />
      </div>

      {/* Waveform diagram */}
      <svg viewBox="0 0 200 36" width="100%" height="36" preserveAspectRatio="none">
        {signature(color)}
      </svg>

      {/* Indicators */}
      <div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.18em",
          color: "var(--ink-4)",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>Indicators</div>
        <List items={indicators} dim />
      </div>

      {/* Pilot response */}
      <div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.18em",
          color: color,
          textTransform: "uppercase",
          marginBottom: 6,
        }}>Pilot response</div>
        <div style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--ink-2)",
          lineHeight: 1.55,
        }}>{response}</div>
      </div>
    </div>
  );
}

/* ============================== Anchor Audit Widget ============================== */
function AnchorAuditWidget() {
  const initial = [
    { id: 1, name: "Full name", kind: "basic",       intact: true,  detail: "Rell" },
    { id: 2, name: "Birthplace",          kind: "basic",       intact: true,  detail: "uncertain" },
    { id: 3, name: "First teacher",       kind: "basic",       intact: true,  detail: "—" },
    { id: 4, name: "Sapling on the roof", kind: "ritual",      intact: true,  detail: "trained 4y" },
    { id: 5, name: "Lantern Belt shape",  kind: "ritual",      intact: true,  detail: "—" },
    { id: 6, name: "Mother's hands",      kind: "emotional",   intact: true,  detail: "core" },
    { id: 7, name: "Doorway in rain",     kind: "forbidden",   intact: false, detail: "BURNED · Heliodrome", justBurned: true },
    { id: 8, name: "Sutira's double-hitch", kind: "ritual",    intact: false, detail: "LOST · Lattice Gap" },
  ];
  const [anchors, setAnchors] = React.useState(initial);

  const total = anchors.length;
  const intact = anchors.filter((a) => a.intact).length;
  const burned = anchors.filter((a) => !a.intact).length;
  const stability = Math.round((intact / total) * 100);

  const kindColors = {
    basic:     "var(--entity-character)",
    ritual:    "var(--entity-mechanics)",
    emotional: "var(--amber)",
    forbidden: "#E5484D",
  };

  return (
    <div style={{
      background: "var(--void-2)",
      border: "1px solid var(--void-5)",
      borderRadius: 4,
      padding: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <Eyebrow color="var(--amber)">Anchor audit · live</Eyebrow>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--ink-4)",
          letterSpacing: "0.14em",
        }}>{new Date().toISOString().slice(11,16)} UTC</span>
      </div>

      {/* Summary */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: 38,
          color: "var(--ink-1)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          fontWeight: 500,
        }}>{intact}</span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 18,
          color: "var(--ink-4)",
          fontVariantNumeric: "tabular-nums",
        }}>/ {total}</span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.18em",
          color: "var(--ink-4)",
          textTransform: "uppercase",
          marginLeft: "auto",
        }}>retained</span>
      </div>

      {/* Stability bar */}
      <div style={{
        height: 4,
        background: "var(--void-4)",
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 14,
      }}>
        <div style={{
          width: `${stability}%`,
          height: "100%",
          background: stability > 80 ? "var(--state-stable)"
                    : stability > 60 ? "var(--state-thinning)"
                    : stability > 40 ? "var(--state-raveling)"
                    : "var(--state-collapse)",
          transition: "width 240ms cubic-bezier(0.16,0.84,0.32,1)",
        }} />
      </div>

      {/* Anchor list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {anchors.map((a) => (
          <div
            key={a.id}
            onClick={() => setAnchors((prev) => prev.map((x) => x.id === a.id ? { ...x, intact: !x.intact, justBurned: false } : x))}
            style={{
              display: "grid",
              gridTemplateColumns: "16px 1fr auto",
              gap: 8,
              alignItems: "center",
              padding: "6px 4px",
              cursor: "pointer",
              borderRadius: 2,
              opacity: a.intact ? 1 : 0.42,
              transition: "opacity 240ms",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--void-3)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: kindColors[a.kind],
              opacity: a.intact ? 1 : 0.5,
              border: a.intact ? "none" : "1px dashed rgba(229,72,77,0.7)",
              boxSizing: "border-box",
            }} />
            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: a.intact ? "var(--ink-1)" : "var(--ink-4)",
              textDecoration: a.intact ? "none" : "line-through",
              textDecorationColor: "rgba(229,72,77,0.6)",
              fontStyle: a.intact ? "normal" : "italic",
            }}>{a.name}</div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: a.intact ? "var(--ink-4)" : "#E5484D",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}>{a.detail}</div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: "1px solid var(--void-5)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: burned > 0 ? "#E5484D" : "var(--ink-4)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}>{burned} loss{burned === 1 ? "" : "es"} ledgered</span>
        <button
          onClick={() => setAnchors(initial)}
          style={{
            background: "transparent",
            border: "1px solid var(--void-6)",
            color: "var(--ink-3)",
            padding: "5px 10px",
            borderRadius: 2,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >Reset</button>
      </div>
    </div>
  );
}

/* ============================== Telemetry strip ============================== */
function TelemetryStrip() {
  const fields = [
    { label: "Pilot", value: "Rell · ARCH-CTLP-1192-R", mono: true },
    { label: "Vessel", value: "CCS Heron-of-Three-Names", mono: false },
    { label: "Corridor", value: "Lattice Gap → Heliodrome", mono: false },
    { label: "State", value: "thinning", pill: "thinning" },
  ];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 0,
      borderTop: "1px solid var(--void-5)",
      borderBottom: "1px solid var(--void-5)",
      background: "linear-gradient(180deg, rgba(232,168,86,0.02), transparent 60%), var(--void-2)",
    }}>
      {fields.map((f, i) => (
        <div key={f.label} style={{
          padding: "12px 18px",
          borderRight: i < fields.length - 1 ? "1px solid var(--void-5)" : "none",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.24em",
            color: "var(--ink-4)",
            textTransform: "uppercase",
          }}>{f.label}</div>
          {f.pill
            ? (<div><span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "2px 8px",
                borderRadius: 999,
                color: "var(--state-thinning)",
                border: "1px solid rgba(255,217,61,0.4)",
                background: "rgba(255,217,61,0.08)",
              }}>● {f.value}</span></div>)
            : (<div style={{
                fontFamily: f.mono ? "var(--font-mono)" : "var(--font-body)",
                fontSize: f.mono ? 12 : 13,
                color: "var(--ink-1)",
                lineHeight: 1.3,
              }}>{f.value}</div>)
          }
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  Eyebrow, Stencil, Section, Sub, P, List, Callout, Stepper,
  Term, Quote, Gloss, CorridorStateCard, AnchorAuditWidget, TelemetryStrip,
});
