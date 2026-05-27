// Pilot Manual — top-level shell.
// Layout: fixed top classification banner, fixed left rail (wordmark, TOC,
// anchor audit widget), scrollable manual body in the center.

const TOC = [
  { id: "s0",  num: "00", title: "Preface" },
  { id: "s1",  num: "01", title: "The Memory Field" },
  { id: "s2",  num: "02", title: "Memory drives" },
  { id: "s3",  num: "03", title: "Anchor theory" },
  { id: "s4",  num: "04", title: "Corridor states" },
  { id: "s5",  num: "05", title: "Eddies" },
  { id: "s6",  num: "06", title: "Reliquary stones" },
  { id: "s7",  num: "07", title: "Zero-anchoring" },
  { id: "s8",  num: "08", title: "Conceptual drift" },
  { id: "s9",  num: "09", title: "Emergency procedures" },
  { id: "s10", num: "10", title: "Psychological aftercare" },
  { id: "s11", num: "11", title: "Ritual practices" },
  { id: "s12", num: "12", title: "Ethical mandates" },
  { id: "s13", num: "13", title: "Closing charge" },
];

function ClassificationBanner() {
  return (
    <div style={{
      gridColumn: "1 / -1",
      height: 36,
      background: "rgba(229,72,77,0.06)",
      borderBottom: "1px solid rgba(229,72,77,0.25)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      letterSpacing: "0.28em",
      textTransform: "uppercase",
      color: "#E5484D",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle scanline texture */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent 0 2px, rgba(229,72,77,0.04) 2px 3px)",
      }} />
      <span style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%", background: "#E5484D",
          boxShadow: "0 0 8px #E5484D",
          animation: "ftPulse 1.6s ease-in-out infinite",
        }} />
        Restricted — pilot &amp; archivist clearance only
      </span>
      <span style={{ position: "relative" }}>Manual · 0001 · v1.0 · canon-locked</span>
      <style>{`
        @keyframes ftPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

function TopBar() {
  return (
    <div style={{
      gridColumn: "1 / -1",
      height: 72,
      background: "var(--void-2)",
      borderBottom: "1px solid var(--void-5)",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 24,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontSize: 22,
          color: "var(--ink-1)",
          lineHeight: 1,
          letterSpacing: "-0.005em",
        }}>The <span style={{ fontStyle: "italic", color: "var(--amber)" }}>Forgotten</span> Tides</div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.24em",
          color: "var(--ink-4)",
          textTransform: "uppercase",
        }}>Canticle Fleet · Pilot Manual</div>
      </div>

      <div style={{ width: 1, height: 36, background: "var(--void-5)" }} />

      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontSize: 18,
          color: "var(--ink-1)",
          lineHeight: 1.1,
          letterSpacing: "-0.005em",
        }}>Memory Corridor Operations &amp; Anchor Integrity Protocols</div>
        <div style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "var(--ink-4)",
          marginTop: 3,
        }}>Issued jointly by <span style={{ color: "var(--ink-3)" }}>The Canticle Command Authority</span> · <span style={{ color: "var(--ink-3)" }}>The Archivist Orders — Navigant &amp; Continuity Sects</span></div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Stencil>CANON · LOCKED</Stencil>
        <Stencil tone="blue">v1.0 · 2025·12·11</Stencil>
      </div>
    </div>
  );
}

function Sidebar({ activeId, onJump }) {
  return (
    <aside style={{
      background: "var(--void-2)",
      borderRight: "1px solid var(--void-5)",
      padding: "24px 20px 32px",
      display: "flex",
      flexDirection: "column",
      gap: 24,
      overflowY: "auto",
      maxHeight: "100%",
    }}>
      {/* Anchor mark + identity */}
      <div style={{
        padding: "18px 16px",
        border: "1px solid var(--void-5)",
        background: "var(--void-1)",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}>
        <div style={{ color: "var(--amber)", flexShrink: 0 }}>
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="32" cy="32" r="22" opacity="0.5" />
            <circle cx="32" cy="32" r="14" />
            <path d="M 23 18 A 14 14 0 0 1 41 18" opacity="0.25" strokeDasharray="2 3" />
            <circle cx="32" cy="32" r="3" fill="currentColor" stroke="none" />
            <line x1="32" y1="6"  x2="32" y2="10" />
            <line x1="32" y1="54" x2="32" y2="58" />
            <line x1="6"  y1="32" x2="10" y2="32" />
            <line x1="54" y1="32" x2="58" y2="32" />
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-4)" }}>Pilot</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--ink-1)", lineHeight: 1.1 }}>Rell</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>ARCH-CTLP-1192-R</div>
        </div>
      </div>

      {/* Anchor audit widget */}
      <AnchorAuditWidget />

      {/* Table of contents */}
      <nav>
        <Eyebrow color="var(--ink-4)">Contents</Eyebrow>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
          {TOC.map((item) => {
            const active = activeId === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => { e.preventDefault(); onJump(item.id); }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px 1fr",
                    gap: 10,
                    alignItems: "baseline",
                    padding: "8px 10px",
                    textDecoration: "none",
                    borderLeft: active ? "2px solid var(--amber)" : "2px solid transparent",
                    marginLeft: -12,
                    paddingLeft: 10,
                    background: active ? "rgba(232,168,86,0.05)" : "transparent",
                    transition: "background 160ms",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--void-3)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: active ? "var(--amber)" : "var(--ink-4)",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "0.06em",
                  }}>{item.num}</span>
                  <span style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: active ? "var(--ink-1)" : "var(--ink-3)",
                    fontWeight: active ? 500 : 400,
                  }}>{item.title}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footnote */}
      <div style={{
        marginTop: "auto",
        paddingTop: 18,
        borderTop: "1px solid var(--void-5)",
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--ink-5)",
        lineHeight: 1.5,
      }}>
        Issued by Canticle Command<br />
        archived · navigant sect<br />
        unauthorized disclosure risks corridor destabilization
      </div>
    </aside>
  );
}

function Manual() {
  const [activeId, setActiveId] = React.useState("s0");
  const scrollRef = React.useRef(null);

  // Update active TOC entry as the manual scrolls. IntersectionObserver is
  // inert in some sandboxed preview environments, so we use a scroll listener
  // and pick the last section whose top has crossed the reading threshold.
  React.useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll("section[id]"));
    if (!sections.length) return;

    let raf = 0;
    const update = () => {
      const threshold = root.scrollTop + 140;
      let current = sections[0].id;
      for (const s of sections) {
        if (s.offsetTop <= threshold) current = s.id;
        else break;
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; update(); });
    };
    update();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      root.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const onJump = (id) => {
    const el = document.getElementById(id);
    if (el && scrollRef.current) {
      const top = el.getBoundingClientRect().top - scrollRef.current.getBoundingClientRect().top + scrollRef.current.scrollTop - 24;
      scrollRef.current.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateRows: "36px 72px 1fr",
      gridTemplateColumns: "320px 1fr",
      height: "100vh",
      width: "100vw",
      background: "var(--void-1)",
      color: "var(--ink-2)",
      overflow: "hidden",
    }}>
      <ClassificationBanner />
      <TopBar />

      <Sidebar activeId={activeId} onJump={onJump} />

      <main
        ref={scrollRef}
        style={{
          overflowY: "auto",
          background: "var(--void-1)",
          position: "relative",
        }}
      >
        {/* Telemetry strip — sits flush below TopBar, scrolls with content top */}
        <TelemetryStrip />

        <div style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "0 56px",
          position: "relative",
        }}>
          {/* Faint vertical rule mirroring an old-document margin */}
          <div style={{
            position: "absolute",
            left: 56 + 82 - 6,
            top: 0,
            bottom: 80,
            width: 1,
            background: "linear-gradient(180deg, transparent, var(--void-5) 8%, var(--void-5) 92%, transparent)",
            pointerEvents: "none",
            opacity: 0.6,
          }} />
          <Content />
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { Manual, TOC });
