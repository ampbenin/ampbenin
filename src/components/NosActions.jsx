// src/components/NosActions.jsx
import { useState } from "react";

const actions = [
  {
    title: "Projet À l’écoute des jeunes (2023)",
    description:
      "Renforcement de capacités des jeunes filles dans les communes de Tori-Bossito et Kpomassè sur la SSR, la prévention des VBG et l’autonomisation des femmes. Ce projet a duré 6 mois et a permis de former et accompagner plusieurs bénéficiaires.",
    media: "/images/ecoute-jeunes.jpg",
    type: "image",
    theme: "SSR",
  },
  {
    title: "16 jours d’activisme contre les VBG (2024)",
    description:
      "Mobilisation de plus de 200 jeunes volontaires pour une campagne digitale et communautaire de grande envergure. AMP BENIN a été reconnu comme jeune organisation championne par Plan International West and Central Africa.",
    media: "/images/16jours.jpg",
    type: "image",
    report: "/docs/rapport-vbg.pdf",
    theme: "VBG",
  },
  {
    title: "Projet MyCountry229 (2025)",
    description:
      "Campagne nationale digitale innovante mobilisant des centaines de jeunes autour de la citoyenneté, des ODD et de la lutte contre la désinformation. Un projet qui a marqué l’engagement citoyen numérique au Bénin.",
    media: "/images/mycountry.jpg",
    type: "image",
    report: "/docs/rapport-mycountry229.pdf",
    theme: "Citoyenneté",
  },
  {
    title: "Projet SWEED1 (2024) (2023)",
    description:
      "Implication d’AMP BENIN dans les communes de Tori-Bossito et Kpomassè, avec un focus sur le renforcement de capacités et l’autonomisation des femmes, en collaboration avec les guichets uniques de protection sociale.",
    media: "/images/sweed1.jpg",
    type: "image",
    theme: "Autonomisation",
  },
  {
    title: "Projet ARS3 avec PSI/AMBS (2025)",
    description:
      "Partenaire d’exécution dans la commune de Comè (Mono) pour la sensibilisation des communautés, femmes enceintes et jeunes filles à l’accès aux services de santé.",
    media: "/images/ars3.jpg",
    type: "image",
    theme: "SSR",
  },
  {
    title: "Espace jeunesse (2024)",
    description:
      "Création d’un espace dédié aux jeunes pour favoriser leur participation citoyenne, leur accès à l’information et aux ressources éducatives, ainsi que leur engagement actif dans la prévention des VBG et la promotion de la SSR.",
    media: "/images/espace-jeunesse.jpg",
    type: "image",
    theme: "Jeunesse",
  },
];

export default function NosActions() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedTheme, setSelectedTheme] = useState("all");

  const filtered = actions.filter((act) => {
    const yearMatch =
      selectedYear === "all" ||
      (act.title.match(/\((\d{4})\)/) &&
        act.title.match(/\((\d{4})\)/)[1] === selectedYear);
    const themeMatch = selectedTheme === "all" || act.theme === selectedTheme;
    return yearMatch && themeMatch;
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Titre */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-800 animate-bounce">
          Nos expériences en SSR, VBG et mobilisation citoyenne
        </h1>
        <p className="mt-4 text-lg text-gray-600 italic">
          Un parcours d’actions concrètes pour l’autonomisation, la prévention et
          la transformation sociale
        </p>
      </section>

      {/* Filtres */}
      <section className="flex flex-wrap justify-center gap-4 mb-10">
        <select
          className="p-2 rounded-lg border text-gray-700"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value="all">Toutes les années</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2025">2025</option>
        </select>

        <select
          className="p-2 rounded-lg border text-gray-700"
          value={selectedTheme}
          onChange={(e) => setSelectedTheme(e.target.value)}
        >
          <option value="all">Toutes les thématiques</option>
          <option value="SSR">SSR</option>
          <option value="VBG">VBG</option>
          <option value="Citoyenneté">Citoyenneté</option>
          <option value="Autonomisation">Autonomisation</option>
          <option value="Jeunesse">Jeunesse</option>
        </select>
      </section>

      {/* Liste des actions */}
      <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((act) => (
          <div
            key={act.title}
            className="flex flex-col bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="relative group">
              {act.type === "image" ? (
                <img
                  src={act.media}
                  alt={act.title}
                  className="w-full h-60 object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <video
                  src={act.media}
                  controls
                  className="w-full h-60 object-cover"
                />
              )}
              <div className="absolute top-0 left-0 bg-indigo-600 text-white text-sm px-3 py-1 rounded-br-2xl shadow">
                {act.title}
              </div>

              {act.title.match(/\((\d{4})\)/) && (
                <span className="absolute bottom-2 right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-lg shadow">
                  {act.title.match(/\((\d{4})\)/)[1]}
                </span>
              )}
            </div>

            <div className="flex flex-col p-6 flex-grow">
              <p className="text-gray-700 flex-grow line-clamp-4">
                {act.description}
              </p>
              {act.report && (
                <a
                  href={act.report}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-xl shadow hover:bg-indigo-700 transition"
                >
                  📑 Consulter le rapport
                </a>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Section inspiration */}
      <section className="mt-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-indigo-700 mb-4">
          AMP BENIN : Une organisation au service du changement
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Grâce à nos projets et campagnes, nous avons bâti une expertise solide
          en santé sexuelle et reproductive, lutte contre les VBG, autonomisation
          des femmes et mobilisation citoyenne. Nos expériences passées et
          présentes prouvent notre capacité à mener à bien toute initiative
          ambitieuse et inclusive pour le bien-être des communautés.
        </p>
      </section>
    </main>
  );
}
