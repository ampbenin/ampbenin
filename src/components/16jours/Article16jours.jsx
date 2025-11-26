import React from "react";

// Composant React article AMP BENIN — 16 Jours d’Activisme
export default function Article16jours({
  title = "Bilan des éditions précédentes & perspectives 2025 — AMP BENIN",
  intro = `Ce rapport présente le bilan détaillé des éditions précédentes du
  Programme Hybride de Mobilisation Citoyenne contre les VBG mené par
  ACTION MONDE PRODUCTIF (AMP BENIN) et les perspectives pour l'édition 2025.`,
  stats = null,
  testimonials = null,
  gallery = null,
  videos = null,
}) {
  // Données par défaut
  const defaultStats = {
    jeunesMobilises: 600,
    personnesTouches: 80000,
    sessionsTerrain: 18,
    casOrientes: 50,
    enfantsFormes: 20,
  };

  const data = stats || defaultStats;

  const defaultTestimonials = [
    {
      name: "Aminatou, 17 ans - Tori-Bossito",
      role: "Jeune pair éducateur",
      quote:
        "Grâce à la formation, j'ai appris à repérer le cyberharcèlement et à le dénoncer. Maintenant, j'aide mes camarades.",
    },
    {
      name: "M. Kossi - Responsable communautaire, Kpomassè",
      role: "Leader local",
      quote:
        "Les causeries ont changé les mentalités. Les parents appellent désormais le GUPS avant de prendre des décisions hâtives.",
    },
    {
      name: "Sita - Parent, Abomey-Calavi",
      role: "Parent",
      quote:
        "Le BootCamp Village Noël a donné confiance à mon enfant pour parler et protéger ses amis.",
    },
  ];

  const defaultGallery = [
    { id: 1, src: "/images/ateliers1.jpg", alt: "Atelier Tori-Bossito" },
    { id: 2, src: "/images/atelier2.jpg", alt: "Atelier Kpomassè" },
    { id: 3, src: "/images/bootcamp1.jpg", alt: "BootCamp Village Noël" },
    { id: 4, src: "/images/campagnedigitale.jpg", alt: "Campagne digitale" },
  ];

  const defaultVideos = [
    {
      id: "v1",
      src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      title: "Témoignages - Edition 2024",
    },
  ];

  const t = testimonials || defaultTestimonials;
  const g = gallery || defaultGallery;
  const v = videos || defaultVideos;

  return (
    <article className="prose lg:prose-xl mx-auto p-6 md:p-12 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold">{title}</h1>
        <p className="mt-4 text-gray-600">{intro}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-sm">
            Edition : 2023 - 2025
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-green-50 text-green-700 px-3 py-1 text-sm">
            Département : Atlantique
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 text-yellow-700 px-3 py-1 text-sm">
            Partenaire technique : BougeLabs
          </span>
        </div>
      </header>

      {/* ——————— Résumé chiffré ——————— */}
      <section className="mt-8 bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Chiffres clés & impact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Jeunes mobilisés" value={data.jeunesMobilises} />
          <StatCard
            label="Personnes touchées (en ligne)"
            value={data.personnesTouches}
            short
          />
          <StatCard label="Sessions terrain" value={data.sessionsTerrain} />
          <StatCard label="Cas orientés" value={data.casOrientes} />
          <StatCard label="Enfants formés" value={data.enfantsFormes} />
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold">Évaluation synthétique</h3>
          <p className="text-gray-700 mt-2">
            Les évaluations des dernières éditions montrent une amélioration
            mesurable de la connaissance des mécanismes de signalement (+42%),
            ainsi qu’une adoption notable des bonnes pratiques numériques.
          </p>
        </div>
      </section>

      {/* ——————— Témoignages ——————— */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Témoignages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.map((item, idx) => (
            <blockquote
              key={idx}
              className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 shadow-sm"
            >
              <p className="text-gray-800">“{item.quote}”</p>
              <footer className="mt-4 text-sm text-gray-600">
                — <span className="font-semibold">{item.name}</span>,{" "}
                <span>{item.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* ——————— Galerie ——————— */}
      <section
        id="gallery"
        className="mt-10 bg-white rounded-2xl shadow p-6 scroll-m-20"
      >
        <h2 className="text-2xl font-bold mb-4">Galerie média</h2>
        <p className="text-gray-600">
          Photos et vidéos des ateliers, BootCamp et campagnes digitales.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {g.map((img) => (
            <figure
              key={img.id}
              className="overflow-hidden rounded-lg bg-gray-100"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="object-cover w-full h-48 md:h-40 lg:h-36"
              />
              <figcaption className="p-3 text-sm text-gray-600">
                {img.alt}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Vidéos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {v.map((vid) => (
              <div
                key={vid.id}
                className="aspect-video bg-black rounded overflow-hidden"
              >
                <iframe
                  title={vid.title}
                  src={vid.src}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——————— Évaluation détaillée ——————— */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Évaluations & enseignements</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold">Méthodologie d'évaluation</h3>
            <ul className="list-disc list-inside mt-2 text-gray-700">
              <li>Enquêtes avant/après auprès des jeunes</li>
              <li>Entretiens avec leaders communautaires</li>
              <li>Analyse GUPS & INF</li>
              <li>Observation participative</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold">Enseignements clés</h3>
            <ol className="list-decimal list-inside mt-2 text-gray-700">
              <li>La formation augmente les signalements.</li>
              <li>
                Le lien terrain ↔ digital renforce la participation des jeunes.
              </li>
              <li>Impliquer les parents améliore la prévention durable.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* ——————— Prévisions 2025 ——————— */}
      <section className="mt-10 bg-gradient-to-r from-indigo-50 to-white rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">
          Perspectives & prévision pour l'édition 2025
        </h2>

        <ul className="list-disc list-inside mt-3 text-gray-700">
          <li>Mobilisation prévue de 300 jeunes volontaires.</li>
          <li>Objectif : toucher 120 000 personnes via la campagne digitale.</li>
          <li>Extension à 2 nouvelles communes de l'Atlantique.</li>
          <li>
            Renforcement du suivi avec les GUPS pour l’orientation des cas.
          </li>
        </ul>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <ForecastCard title="Jeunes mobilisés" value="300" />
          <ForecastCard title="Audience visée" value="120 000" />
          <ForecastCard title="Communes" value="+2" />
        </div>
      </section>

      {/* ——————— Call to action ——————— */}
      <footer className="mt-12 mb-8 text-center">
        <p className="text-gray-700 mb-4">
          Souhaitez-vous soutenir ou rejoindre AMP BENIN pour l'édition 2025 ?
        </p>

        <div className="flex items-center justify-center gap-4">
          <a
            href="/contact"
            className="inline-block rounded-full bg-blue-600 text-white px-6 py-2 font-semibold shadow hover:bg-blue-700"
          >
            Nous contacter
          </a>

          <a
            href="#gallery"
            className="inline-block rounded-full border border-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-50"
          >
            Voir la galerie
          </a>
        </div>
      </footer>
    </article>
  );
}

// ——————————————————————
// Composants internes
// ——————————————————————

function StatCard({ label, value, short }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-2xl font-bold">
        {short ? formatNumberShort(value) : formatNumber(value)}
      </div>
      <div className="mt-1 text-sm text-gray-600">{label}</div>
    </div>
  );
}

function ForecastCard({ title, value }) {
  return (
    <div className="bg-white rounded-lg p-4 text-center shadow">
      <div className="text-xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-gray-600">{title}</div>
    </div>
  );
}

function formatNumber(n) {
  if (typeof n === "number") return n.toLocaleString();
  return n;
}

function formatNumberShort(n) {
  if (typeof n !== "number") return n;
  if (n >= 1000) return Math.round(n / 1000) + "k";
  return n.toString();
}
