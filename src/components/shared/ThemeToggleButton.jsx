// src/components/shared/ThemeToggleButton.jsx
// Bouton de bascule mode sombre/clair — réutilisé sur les 3 pages
// concernées (voir src/hooks/useTheme.js). Styles inline neutres, comme
// TruncatedDescription.jsx : les 3 pages hôtes ont des systèmes de style
// différents (CSS custom + Tailwind), ce bouton reste indépendant des deux.
export default function ThemeToggleButton({ theme, onToggle, style = {} }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "2.25rem", height: "2.25rem", borderRadius: "999px", cursor: "pointer",
        border: "1px solid rgba(128,128,128,0.35)", background: "transparent",
        fontSize: "1.1rem", lineHeight: 1, flexShrink: 0,
        ...style,
      }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
