// Écran de chargement plein-cadre partagé — Dashboard/ProgramProgress
// (espace volontaire), SupervisorDashboard, VolunteerProgramEditor,
// AdminDashboard.
//
// Signalé le 2026-08-19 : "si la page ne charge pas encore le backend, la
// page ne se présente pas. On voit seulement le footer rattaché au header
// et quand le backend répond, la page apparait." Cause : chacun de ces
// composants retournait tôt un <p className="...">Chargement...</p> dont
// la classe n'existe QUE dans le <style>{`...`}</style> défini plus bas
// dans le MÊME composant — donc dans la branche JSX atteinte seulement une
// fois les données arrivées. Tant que ça charge, ce <style> n'a jamais été
// monté dans le DOM : le texte de chargement s'affichait sans la moindre
// mise en forme (pas de padding, pas de hauteur), un simple filet de texte
// entre l'en-tête et le pied de page — d'où l'impression de "rien".
//
// Ce composant est entièrement autonome (styles en ligne + sa propre
// balise <style> pour l'animation) : garanti visible quel que soit
// l'endroit où il est monté ou le moment où React l'affiche, jamais
// dépendant d'une feuille de style qui n'a pas encore eu la chance de se
// monter. Les tokens var(--col-*) (src/styles/tokens.css) sont repris
// avec un repli en dur pour les pages qui ne chargent pas ce fichier
// (ex. /admin/dashboard, AdminShell.jsx — CMS, pas de tokens.css).
export default function LoadingSpinner({ message = "Chargement...", error = false }) {
  return (
    <div
      role="status"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "1rem", minHeight: "50vh", padding: "3rem 1.5rem", textAlign: "center",
        color: error ? "#dc2626" : "var(--col-text-muted, #7A7A7A)",
        fontFamily: "inherit",
      }}
    >
      {!error && (
        <div
          aria-hidden="true"
          style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            border: "3px solid rgba(27, 67, 50, 0.15)",
            borderTopColor: "var(--col-primary, #1B4332)",
            animation: "amp-loading-spin 0.8s linear infinite",
          }}
        />
      )}
      <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: error ? 700 : 500 }}>{message}</p>
      <style>{`@keyframes amp-loading-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
