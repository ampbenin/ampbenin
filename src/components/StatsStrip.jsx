// Composant générique de bandeau de statistiques animées, fusionnant
// ArticleStats.jsx et PlaidoyerStats.jsx (quasi-doublons) — voir plan de
// refonte, phase 4. `pillars` est optionnel : PlaidoyerStats affichait en
// plus une grille de 4 cartes thématiques sous les compteurs.
import { useEffect, useRef, useState } from "react";

function useCountUp(target, duration, active) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return count;
}

function StatCard({ value, label, suffix, icon, active }) {
  const count = useCountUp(Number(value) || 0, 1600, active);
  return (
    <div className="stat-card">
      {icon && <span className="stat-icon" aria-hidden="true">{icon}</span>}
      <span className="stat-number">{active ? count : 0}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

const THEMES = {
  green: { number: "#1e5c1e", label: "#4a744a", bg: "#f4fbf4", bgHover: "#e8f5e8", border: "#d4e8d4" },
  purple: { number: "#5a2fa0", label: "#7a5faa", bg: "#f8f4ff", bgHover: "#f0e8ff", border: "#e0d4f8" },
};

export default function StatsStrip({ stats = [], pillars = [], theme = "green" }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  const c = THEMES[theme] || THEMES.green;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (!stats.length) return null;

  return (
    <div
      ref={ref}
      className="stats-strip-wrap"
      aria-label="Chiffres clés"
      style={{
        "--stats-number": c.number,
        "--stats-label": c.label,
        "--stats-bg": c.bg,
        "--stats-bg-hover": c.bgHover,
        "--stats-border": c.border,
      }}
    >
      <div className="stats-strip">
        {stats.map((s, i) => (
          <StatCard key={s.label || i} {...s} active={active} />
        ))}
      </div>

      {pillars.length > 0 && (
        <div className="stats-pillars">
          {pillars.map((p, i) => (
            <div key={p.title || i} className="stats-pillar" style={{ "--accent": p.color || "#2a7a2a" }}>
              {p.icon && <span className="stats-pillar-icon" aria-hidden="true">{p.icon}</span>}
              <strong className="stats-pillar-title">{p.title}</strong>
              <p className="stats-pillar-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .stats-strip-wrap { margin: 2.5rem 0; display: flex; flex-direction: column; gap: 1px; }

        .stats-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--stats-border);
          border: 1px solid var(--stats-border);
          border-radius: 14px;
          overflow: hidden;
        }
        .stats-pillars ~ .stats-strip,
        .stats-strip:has(~ .stats-pillars) { border-radius: 14px 14px 0 0; }
        @media (max-width: 700px) { .stats-strip { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 400px) { .stats-strip { grid-template-columns: 1fr; } }

        .stat-card {
          background: var(--stats-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          padding: 1.5rem 1rem;
          text-align: center;
          transition: background 0.2s;
        }
        .stat-card:hover { background: var(--stats-bg-hover); }
        .stat-icon { font-size: 1.6rem; }
        .stat-number {
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--stats-number);
          line-height: 1;
          font-variant-numeric: tabular-nums;
          font-family: 'Georgia', serif;
        }
        .stat-label {
          font-size: 0.75rem;
          color: var(--stats-label);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          max-width: 130px;
          line-height: 1.3;
        }

        .stats-pillars {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--stats-border);
          border: 1px solid var(--stats-border);
          border-top: none;
          border-radius: 0 0 14px 14px;
          overflow: hidden;
        }
        @media (max-width: 680px) { .stats-pillars { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 380px) { .stats-pillars { grid-template-columns: 1fr; } }

        .stats-pillar {
          background: #fff;
          padding: 1.1rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          border-top: 3px solid var(--accent);
        }
        .stats-pillar-icon { font-size: 1.35rem; }
        .stats-pillar-title { font-size: 0.82rem; color: #2a1a4a; font-weight: 700; line-height: 1.3; }
        .stats-pillar-desc { font-size: 0.74rem; color: #6a5a8a; line-height: 1.5; margin: 0; }
      `}</style>
    </div>
  );
}
