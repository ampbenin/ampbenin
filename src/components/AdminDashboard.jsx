import { useState, useEffect, useRef } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import VolunteersManager from "./VolunteersManager.jsx";
import GenerateCertificate from "./GenerateCertificate.jsx";
import SaveVolunteers from "./SaveVolunteers.jsx";
import CreateMission from "./CreateMission.jsx";

const SECRET_CODE = import.meta.env.PUBLIC_DASHBOARD_CODE;
const IDLE_TIMEOUT = 5 * 60 * 1000;

export default function AdminDashboard() {
  const [active, setActive] = useState("volunteers");
  const [authorized, setAuthorized] = useState(false);
  const [code, setCode] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const idleTimer = useRef(null);

  const handleLogin = () => {
    if (code === SECRET_CODE) {
      setAuthorized(true);
      resetIdleTimer();
    } else {
      alert("Code incorrect, contactez le service technique de AMP BENIN !");
    }
  };

  const handleLogout = () => {
    setAuthorized(false);
    setCode("");
    clearTimeout(idleTimer.current);
  };

  const resetIdleTimer = () => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      alert("Session expirée. Veuillez vous reconnecter.");
      handleLogout();
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    if (!authorized) return;
    const events = ["mousemove", "mousedown", "keypress", "touchstart"];
    const resetTimer = () => resetIdleTimer();
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [authorized]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 text-center">
            🔒 ESPACE ADMIN - AMP BENIN
          </h2>
          <input
            type="password"
            placeholder="Entrez le code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyPress}
            className="border px-3 py-2 rounded mb-4 w-full"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
          >
            Valider
          </button>
        </div>
      </div>
    );
  }

const MenuContent = (
  <div className="flex flex-col h-full justify-between">
    <div className="space-y-2">
      <button
        onClick={() => setActive("volunteers")}
        className={`w-full text-left px-4 py-2 rounded ${
          active === "volunteers" ? "bg-violet-900" : "hover:bg-violet-600"
        }`}
      >
        👥 Gestion Volontaires
      </button>
      <button
        onClick={() => setActive("missions")}
        className={`w-full text-left px-4 py-2 rounded ${
          active === "missions" ? "bg-violet-900" : "hover:bg-violet-600"
        }`}
      >
        🎯 Gestion Missions
      </button>
      <button
        onClick={() => setActive("save")}
        className={`w-full text-left px-4 py-2 rounded ${
          active === "save" ? "bg-violet-900" : "hover:bg-violet-600"
        }`}
      >
        💾 Enregistrer Volontaires
      </button>
      <button
        onClick={() => setActive("cert")}
        className={`w-full text-left px-4 py-2 rounded ${
          active === "cert" ? "bg-violet-900" : "hover:bg-violet-600"
        }`}
      >
        📜 Générer Certificats
      </button>

{/* Nouveau bouton Mon Attestation */}
<button
  onClick={() => window.open("/monattestation", "_blank")}
  className="w-full text-left px-4 py-2 rounded hover:bg-violet-600"
>
  📝 Mon Attestation
</button>
    </div>

    <button
      onClick={handleLogout}
      className="w-full text-left px-4 py-2 rounded bg-red-600 hover:bg-red-700"
    >
      🚪 Déconnexion
    </button>
  </div>
);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-violet-700 text-white p-4 sticky top-0 h-screen">
        <h2 className="text-xl font-bold mb-6">📊 Admin AMP BENIN</h2>
        {MenuContent}
      </aside>

      {/* Sidebar mobile */}
      <div className="md:hidden flex flex-col">
        <div className="bg-violet-700 h-12 flex justify-end items-center px-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          >
            <nav
              className="absolute top-0 left-0 w-64 h-screen bg-violet-700 text-white p-4 flex flex-col z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {MenuContent}
            </nav>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <main className="flex-1 p-6 overflow-auto">
        {active === "volunteers" && <VolunteersManager />}
        {active === "missions" && <CreateMission />}
        {active === "save" && <SaveVolunteers />}
        {active === "cert" && <GenerateCertificate />}
      </main>
    </div>
  );
}
