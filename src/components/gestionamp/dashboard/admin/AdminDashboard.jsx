import { useEffect } from "react";
import { useAuthAMP } from "@/services/gestionamp/useAuthAMP";

// Sous-composants
import AdminStats from "./AdminStats";
import GlobalActivitiesTable from "./GlobalActivitiesTable";
import FinanceGlobalSummary from "./FinanceGlobalSummary";
import ValidationQueue from "./ValidationQueue";
import FilterByYearAndSpace from "./FilterByYearAndSpace";
import UsersTable from "./users/UsersTable";
import AddUserForm from "./users/AddUserForm";

export default function AdminDashboard() {
  const { user, loading } = useAuthAMP(["ADMIN"]);

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <main className="dashboard admin-dashboard">
      <header className="dashboard-header">
        <h1>Dashboard National — AMP BENIN</h1>
        <p>Supervision, gestion et validation des actions nationales</p>
      </header>

      <section className="dashboard-section">
        <AdminStats />
      </section>

      <section className="dashboard-section">
        <h2>Gestion des utilisateurs</h2>
        <AddUserForm />
        <UsersTable />
      </section>

      <section className="dashboard-section">
        <FilterByYearAndSpace />
      </section>

      <section className="dashboard-section">
        <h2>Activités nationales</h2>
        <GlobalActivitiesTable />
      </section>

      <section className="dashboard-section">
        <h2>Finances globales</h2>
        <FinanceGlobalSummary />
      </section>

      <section className="dashboard-section">
        <h2>Validation des activités</h2>
        <ValidationQueue />
      </section>
    </main>
  );
}
