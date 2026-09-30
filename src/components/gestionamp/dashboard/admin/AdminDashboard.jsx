import { useEffect, useState } from "react";
import { useAuthAMP } from "@/services/gestionamp/useAuthAMP";
import LoadingSpinner from "@/components/shared/LoadingSpinner.jsx";

// Sous-composants
import AdminStats from "./AdminStats";
import GlobalActivitiesTable from "./GlobalActivitiesTable";
import FinanceGlobalSummary from "./FinanceGlobalSummary";
import ValidationQueue from "./ValidationQueue";
import FilterByYearAndSpace from "./FilterByYearAndSpace";
import UsersTable from "./users/UsersTable";
import AddUserForm from "./users/AddUserForm";
import SpacesManager from "./spaces/SpacesManager";

// Onglets du menu latéral — même structure que AdminShell.jsx (CMS) :
// retour utilisateur, 2026-09-30 : "il faut que ca soit un vrai dashboard
// avec un menu à gauche comme le cas du CMS" (au lieu d'une seule page
// avec toutes les sections empilées).
const TABS = [
  { id: "overview", label: "📊 Vue d'ensemble" },
  { id: "spaces", label: "🏛️ Coordinations & Institutions" },
  { id: "users", label: "👤 Utilisateurs" },
  { id: "activities", label: "📋 Activités nationales" },
  { id: "finances", label: "💰 Finances globales" },
  { id: "validation", label: "✅ Validation des activités" },
];

function getInitialTab() {
  if (typeof window === "undefined") return "overview";
  const tab = new URLSearchParams(window.location.search).get("tab");
  return TABS.some((t) => t.id === tab) ? tab : "overview";
}

export default function AdminDashboard() {
  const { user, loading } = useAuthAMP(["ADMIN"]);
  const [active, setActiveState] = useState(getInitialTab);

  // Garde l'onglet actif dans l'URL (?tab=...) — même pattern que
  // AdminShell.jsx, pour qu'un rafraîchissement reste sur le même onglet.
  const setActive = (tabId) => {
    setActiveState(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.replaceState({}, "", url);
  };

  const logout = () => {
    localStorage.removeItem("amp_token");
    localStorage.removeItem("amp_role");
    window.location.href = "/gestionamp/login";
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="admin-dashboard-shell" style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        className="admin-dashboard-sidebar"
        style={{
          width: 260,
          flexShrink: 0,
          background: "#1B4332",
          color: "#fff",
          padding: "1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
          📊 Gestion AMP — National
        </h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                textAlign: "left",
                padding: "0.6rem 0.8rem",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: active === t.id ? "#2D6A4F" : "transparent",
                color: "#fff",
                fontSize: "0.95rem",
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", opacity: 0.7, padding: "0 0.8rem", marginBottom: 4 }}>
            CMS du site
          </div>
          <a
            href="/admin/dashboard"
            style={{ display: "block", padding: "0.6rem 0.8rem", borderRadius: 6, color: "#fff", textDecoration: "none" }}
          >
            Contenu / Recrutement / Boîte de réception
          </a>
        </div>

        <button
          onClick={logout}
          style={{
            marginTop: "auto",
            padding: "0.6rem 0.8rem",
            borderRadius: 6,
            border: "none",
            background: "#B91C1C",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          🚪 Déconnexion
        </button>
      </aside>

      <main className="admin-dashboard-content" style={{ flex: 1, padding: "2rem", overflow: "auto" }}>
        {active === "overview" && (
          <>
            <header className="dashboard-header">
              <h1>Dashboard National — AMP BENIN</h1>
              <p>Supervision, gestion et validation des actions nationales</p>
            </header>
            <section className="dashboard-section">
              <AdminStats />
            </section>
            <section className="dashboard-section">
              <FilterByYearAndSpace />
            </section>
          </>
        )}

        {active === "spaces" && (
          <section className="dashboard-section">
            <h2>🏛️ Gestion des espaces</h2>
            <SpacesManager
              endpoint="coordinations"
              title="Coordinations Communales"
              extraField="commune"
              extraLabel="Commune"
            />
            <SpacesManager
              endpoint="institutions"
              title="Institutions Spécialisées"
              extraField="domaine"
              extraLabel="Domaine"
            />
          </section>
        )}

        {active === "users" && (
          <section className="dashboard-section">
            <h2>👤 Gestion des utilisateurs</h2>
            <AddUserForm />
            <UsersTable />
          </section>
        )}

        {active === "activities" && (
          <section className="dashboard-section">
            <h2>📋 Activités nationales</h2>
            <GlobalActivitiesTable />
          </section>
        )}

        {active === "finances" && (
          <section className="dashboard-section">
            <h2>💰 Finances globales</h2>
            <FinanceGlobalSummary />
          </section>
        )}

        {active === "validation" && (
          <section className="dashboard-section">
            <h2>✅ Validation des activités</h2>
            <ValidationQueue />
          </section>
        )}
      </main>
    </div>
  );
}
