import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 34, label: "Jeunes au focus groupe", suffix: "", icon: "👥" },
  { value: 20, label: "Relais communautaires formés", suffix: "", icon: "🎓" },
  { value: 300, label: "Jeunes touchés indirectement", suffix: "+", icon: "🌍" },
  { value: 3, label: "Jours de concertation participative", suffix: "", icon: "📅" },
];

function useCountUp(target, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return count;
}

function StatCard({ value, label, suffix, icon, active }) {
  const count = useCountUp(value, 1600, active);
  return (
    <div className="stat-card">
      <span className="stat-icon" aria-hidden="true">{icon}</span>
      <span className="stat-number">
        {active ? count : 0}{suffix}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default function ArticleStats() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="stats-strip" aria-label="Chiffres clés du projet">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} active={active} />
      ))}

      <style>{`
        .stats-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: #d4e8d4;
          border: 1px solid #d4e8d4;
          border-radius: 14px;
          overflow: hidden;
          margin: 2.5rem 0;
        }
        @media (max-width: 700px) {
          .stats-strip { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 400px) {
          .stats-strip { grid-template-columns: 1fr; }
        }

        .stat-card {
          background: #f4fbf4;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          padding: 1.6rem 1rem;
          text-align: center;
          transition: background 0.2s;
        }
        .stat-card:hover { background: #e8f5e8; }

        .stat-icon { font-size: 1.6rem; }
        .stat-number {
          font-size: 2.4rem;
          font-weight: 800;
          color: #1e5c1e;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          font-family: 'Georgia', serif;
        }
        .stat-label {
          font-size: 0.78rem;
          color: #4a744a;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          max-width: 130px;
          line-height: 1.3;
        }
      `}</style>
    </div>
  );
}
