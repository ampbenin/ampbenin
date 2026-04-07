// components/JobsCarousel.jsx
import { useState } from "react";

const jobsData = [
  { id: 1, title: "1 Structure pour la réalisation d’études de terrain et la planification du projet NumSAL ", category: "Consultance", location: "Tori-Bossito", file: "https://drive.google.com/file/d/1Ve5iz0Zwodwhwy3av0CfaU4iX6BP-xyU/view?usp=drive_link" },
 // { id: 2, title: "4 Consultants individuels pour la conception de modules pédagogiques en compétences numériques – Projet NumSAL", category: "Consultance", location: "Bénin", file: "https://drive.google.com/file/d/1_lui4qod9aiNgVJgnH7z651T-ERhfaWq/view?usp=drive_link" },
 // { id: 3, title: "2 Coach-formateurs pour l’animation des modules de formation en compétences numériques – Projet NumSAL", category: "Emploi", location: "Bénin", file: "https://drive.google.com/file/d/1BqkU64zoGN8uNjnB5pkG__XaXYnrjLZV/view?usp=sharing" },
  { id: 4, title: "2 Coachs assistants pour l’appui à l’animation des formations en compétences numériques – Projet NumSAL", category: "Emploi", location: "Tori-Bossito", file: "https://drive.google.com/file/d/1qr_tySQgb7HFyfbz2xF9QAtzBn7vk3bg/view?usp=sharing" },
 // { id: 5, title: "1 Éditeur pédagogique pour l’accompagnement à la conception des modules pédagogiques – Projet NumSAL", category: "Emploi", location: "Tori-Bossito", file: "https://drive.google.com/file/d/11b0Qqzv5Zgzep6vPyoBJifS17iszRVpG/view?usp=drive_link" },
  { id: 6, title: "1 Structure spécialisée pour l’installation, la fourniture de connexion internet et la maintenance", category: "Consultance", location: "Bénin", file: "https://drive.google.com/file/d/1qkM_By6IGZvbW2gnV7HmfYtEbsKz7VGn/view?usp=sharing" },
];

export default function JobsCarousel() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedPdf, setSelectedPdf] = useState(null);

  const filteredJobs = jobsData.filter((job) =>
    (filter === "All" || job.category === filter) &&
    job.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full">

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Rechercher une offre..."
          className="w-full md:w-1/2 px-4 py-2 border rounded-lg"
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="px-4 py-2 border rounded-lg"
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">Toutes les catégories</option>
          <option value="Consultance">Consultance</option>
          <option value="Formation">Formation</option>
          <option value="Emploi">Emploi</option>
        </select>
      </div>

{/* Grid responsive */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {filteredJobs.map((job) => (
    <div
      key={job.id}
      className="bg-white rounded-2xl shadow p-6 hover:shadow-xl transition flex flex-col justify-between"
    >
      
      {/* Badge */}
      <span className="inline-block text-xs bg-red-100 text-red-600 px-2 py-1 rounded mb-2 w-fit">
        📄 TDR
      </span>

      <h3 className="text-lg font-semibold text-blue-700 leading-snug">
        {job.title}
      </h3>

      <p className="text-sm text-gray-500 mt-2">
        {job.category} • {job.location}
      </p>

      <div className="mt-4 flex gap-2 flex-wrap">

        {/* Aperçu */}
        <button
          onClick={() => setSelectedPdf(job.file.replace("/view", "/preview"))}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          👁️ Aperçu
        </button>

        {/* Ouvrir */}
        <a
          href={job.file}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 text-sm border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition"
        >
          📥 Télécharger
        </a>

      </div>
    </div>
  ))}
</div>
      {/* Modal */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[90%] h-[90%] relative shadow-lg">

            <button
              onClick={() => setSelectedPdf(null)}
              className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded"
            >
              ✕
            </button>

            <iframe
              src={selectedPdf}
              className="w-full h-full rounded-xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}

