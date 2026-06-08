import { useEffect, useRef, useState } from "react";

const pillars = [
  {
    icon: "🏘️",
    title: "Leaders communautaires",
    desc: "Relais locaux, jeunes et acteurs de la société civile réunis en focus group",
    color: "#7c4fcf",
  },
  {
    icon: "🔍",
    title: "Formes de désinformation identifiées",
    desc: "Rumeurs, contenus manipulés, fausses informations, données hors contexte",
    color: "#cf4f7c",
  },
  {
    icon: "📋",
    title: "Plan de plaidoyer en construction",
    desc: "Document stratégique co-construit pour influencer les décideurs publics",
    color: "#4f7ccf",
  },
  {
    icon: "🤝",
    title: "Approche participative",
    desc: "Co-construction incluant OSC, autorités locales, médias et communautés",
    color: "#4fcfaf",
  },
];

function useCountUp(target, duration = 1600, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return count;
}

function Stat({ value, suffix, label, active }) {
  const n = useCountUp(value, 1500, active);
  return (
    <div className="ps-stat">
      <span className="ps-stat-val">{active ? n : 0}{suffix}</span>
      <span className="ps-stat-lbl">{label}</span>
    </div>
  );
}

export default function PlaidoyerStats() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setActive(true); },
      { threshold: 0.25 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="plaidoyer-stats-wrap">
      {/* Counters */}
      <div className="ps-counters">
        <Stat value={4} suffix="" label="Formes de désinformation cartographiées" active={active} />
        <Stat value={5} suffix="+" label="Stratégies communautaires proposées" active={active} />
        <Stat value={1} suffix="" label="Plan de plaidoyer en cours de rédaction" active={active} />
        <Stat value={4} suffix="" label="Catégories d'acteurs mobilisés" active={active} />
      </div>

      {/* Pillars */}
      <div className="ps-pillars">
        {pillars.map((p) => (
          <div key={p.title} className="ps-pillar" style={{ "--accent": p.color }}>
            <span className="ps-pillar-icon" aria-hidden="true">{p.icon}</span>
            <strong className="ps-pillar-title">{p.title}</strong>
            <p className="ps-pillar-desc">{p.desc}</p>
          </div>
        ))}
      </div>

      <style>{`
        .plaidoyer-stats-wrap {
          margin: 2.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        /* Counters row */
        .ps-counters {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: #e0d4f8;
          border: 1px solid #e0d4f8;
          border-radius: 14px 14px 0 0;
          overflow: hidden;
        }
        @media (max-width: 680px) { .ps-counters { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 380px) { .ps-counters { grid-template-columns: 1fr; } }

        .ps-stat {
          background: #f8f4ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.4rem 0.75rem;
          gap: 0.3rem;
          text-align: center;
          transition: background 0.2s;
        }
        .ps-stat:hover { background: #f0e8ff; }
        .ps-stat-val {
          font-size: 2.2rem;
          font-weight: 800;
          color: #5a2fa0;
          font-variant-numeric: tabular-nums;
          font-family: 'Georgia', serif;
          line-height: 1;
        }
        .ps-stat-lbl {
          font-size: 0.72rem;
          color: #7a5faa;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          max-width: 120px;
          line-height: 1.3;
        }

        /* Pillars row */
        .ps-pillars {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: #e0d4f8;
          border: 1px solid #e0d4f8;
          border-top: none;
          border-radius: 0 0 14px 14px;
          overflow: hidden;
        }
        @media (max-width: 680px) { .ps-pillars { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 380px) { .ps-pillars { grid-template-columns: 1fr; } }

        .ps-pillar {
          background: #fff;
          padding: 1.1rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          border-top: 3px solid var(--accent);
          transition: background 0.2s;
        }
        .ps-pillar:hover { background: #faf8ff; }
        .ps-pillar-icon { font-size: 1.35rem; }
        .ps-pillar-title {
          font-size: 0.82rem;
          color: #2a1a4a;
          font-weight: 700;
          line-height: 1.3;
        }
        .ps-pillar-desc {
          font-size: 0.74rem;
          color: #6a5a8a;
          line-height: 1.5;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
