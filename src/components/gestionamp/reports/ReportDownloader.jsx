import { useEffect, useState } from "react";
import { apiFetch } from "../../../services/gestionamp/api";

export default function ReportDownloader() {
  const [reports, setReports] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const loadReports = () => {
    apiFetch("/api/reports").then(setReports);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    await apiFetch("/api/reports", {
      method: "POST",
      body: JSON.stringify({ year }),
    });
    setLoading(false);
    loadReports();
  };

  const downloadReport = async (id) => {
    const data = await apiFetch(`/api/reports/${id}/download`);
    alert("Rapport généré (PDF à intégrer)");
    console.log(data);
  };

  return (
    <div>
      <h2>Rapports annuels</h2>

      <div>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <button onClick={generateReport} disabled={loading}>
          Générer rapport
        </button>
      </div>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Année</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {reports.map((r) => (
            <tr key={r._id}>
              <td>{r.year}</td>
              <td>{r.status}</td>
              <td>
                {r.status === "VALIDATED" ? (
                  <button onClick={() => downloadReport(r._id)}>
                    Télécharger
                  </button>
                ) : (
                  <span>En attente de validation</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
