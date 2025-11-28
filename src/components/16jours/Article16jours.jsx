import React, { useState } from "react";

// Composant principal
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
  const [selectedImage, setSelectedImage] = useState(null);

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
      name: "Mr BONOU - Parent, Abomey-Calavi",
      role: "Parent",
      quote:
        "Le BootCamp Village Noël a donné confiance à mon enfant pour parler et protéger ses amis.",
    },
  ];

  const defaultGallery = [
    { id: 1, src: "/images/16jours/atelier1.webp", alt: "Atelier Tori-Bossito" },
    { id: 2, src: "/images/16jours/atelier2.webp", alt: "Atelier Kpomassè" },
    { id: 3, src: "/images/bootcamp.webp", alt: "BootCamp Village Noël" },
    { id: 4, src: "/images/16jours/campagnedigitale.webp", alt: "Campagne digitale" },
  ];

  const defaultVideos = [
    {
      id: "v1",
      src: "https://www.youtube.com/embed/C9d2Ktpj32c",
      title: "Campagne de sensibilisation en ligne - 2024",
    },
    {
      id: "v2",
      src: "https://www.youtube.com/embed/OA2x8pt68XQ?si=6CqvtmKmANG33cPy",
      title: "Vidéo sensibilisation AMP BENIN",
    },
  ];

  const t = testimonials || defaultTestimonials;
  const g = gallery || defaultGallery;
  const v = videos || defaultVideos;

  return (
    <article className="prose lg:prose-xl mx-auto p-6 md:p-12 max-w-6xl">
      {/* HEADER */}
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold">{title}</h1>
        <p className="mt-4 text-gray-600 text-lg leading-relaxed">{intro}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Tag text="Edition : 2023 - 2025" color="blue" />
          <Tag text="Département : Atlantique" color="green" />
          <Tag text="Partenaire : BougeLabs" color="yellow" />
        </div>
      </header>

      {/* CHIFFRES CLÉS */}
      <section className="mt-10 bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Chiffres clés & impact</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Jeunes mobilisés" value={data.jeunesMobilises} />
          <StatCard label="Personnes touchées (en ligne)" value={data.personnesTouches} short />
          <StatCard label="Sessions terrain" value={data.sessionsTerrain} />
          <StatCard label="Cas orientés" value={data.casOrientes} />
          <StatCard label="Enfants formés" value={data.enfantsFormes} />
        </div>

        <p className="mt-4 text-gray-700">
          Les évaluations montrent une hausse de +42% des signalements et une adoption
          significative des bonnes pratiques numériques.
        </p>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Témoignages</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.map((item, idx) => (
            <blockquote
              key={idx}
              className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 shadow"
            >
              <p className="text-gray-700 italic">“{item.quote}”</p>
              <footer className="mt-3 text-sm text-gray-600">
                — <span className="font-semibold">{item.name}</span>, {item.role}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* GALERIE */}
      <section id="gallery" className="mt-12 bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Galerie média</h2>
        <p className="text-gray-600">Photos et vidéos des ateliers, BootCamp et campagnes digitales.</p>

        {/* IMAGES */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {g.map((img) => (
            <figure
              key={img.id}
              className="overflow-hidden rounded-xl bg-gray-100 cursor-pointer shadow hover:shadow-lg transition"
              onClick={() => setSelectedImage(img.src)}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
              />
              <figcaption className="p-3 text-sm text-gray-600 text-center">
                {img.alt}
              </figcaption>
            </figure>
          ))}
        </div>

        {/* VIDEOS */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-3">Vidéos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {v.map((vid) => (
              <div key={vid.id} className="aspect-video bg-black rounded-xl overflow-hidden shadow">
                <iframe
                  title={vid.title}
                  src={vid.src}
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODAL IMAGE FULLSCREEN */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 bg-white text-black rounded-full p-2 shadow-lg z-50"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>

          <img
            src={selectedImage}
            alt="Zoom"
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-xl"
          />
        </div>
      )}

      {/* ÉVALUATION MÉTHODOLOGIQUE */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Évaluations & enseignements</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Méthodologie d'évaluation">
            <ul className="list-disc list-inside text-gray-700">
              <li>Enquêtes avant / après</li>
              <li>Entretiens leaders communautaires</li>
              <li>Analyse GUPS & INF</li>
              <li>Observation participative</li>
            </ul>
          </Card>

          <Card title="Enseignements clés">
            <ol className="list-decimal list-inside text-gray-700">
              <li>Hausse des signalements</li>
              <li>Renforcement du lien terrain ↔ digital</li>
              <li>Meilleure implication des parents</li>
            </ol>
          </Card>
        </div>
      </section>

      {/* PERSPECTIVES */}
      <section className="mt-12 bg-gradient-to-r from-indigo-50 to-white rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Perspectives 2025</h2>

        <ul className="list-disc list-inside text-gray-700">
          <li>Mobilisation prévue : 300 jeunes volontaires</li>
          <li>Audience visée : 120 000 personnes</li>
          <li>Extension à 2 nouvelles communes</li>
          <li>Renforcement du suivi GUPS</li>
        </ul>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <ForecastCard title="Jeunes mobilisés" value="300" />
          <ForecastCard title="Audience visée" value="120 000" />
          <ForecastCard title="Communes ciblées" value="+2" />
        </div>
      </section>

      {/* CTA */}
      <footer className="mt-14 mb-10 text-center">
        <p className="text-gray-700 mb-4 text-lg">
          Vous souhaitez soutenir ou rejoindre AMP BENIN pour l'édition 2025 ?
        </p>

        <div className="flex items-center justify-center gap-4">
          <a
            href="/contact"
            className="rounded-full bg-blue-600 text-white px-6 py-2 font-semibold shadow hover:bg-blue-700"
          >
            Nous contacter
          </a>

          <a
            href="/16jours"
            className="rounded-full border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
          >
            Voir la page 16 JOURS
          </a>
        </div>
      </footer>
    </article>
  );
}

/* ———————————————— COMPOSANTS INTERNES ———————————————— */

function Tag({ text, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${colors[color]}`}>
      {text}
    </span>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function StatCard({ label, value, short }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center shadow-sm">
      <div className="text-2xl font-bold">
        {short ? formatNumberShort(value) : formatNumber(value)}
      </div>
      <div className="mt-1 text-sm text-gray-600">{label}</div>
    </div>
  );
}

function ForecastCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl p-6 text-center shadow">
      <div className="text-xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-gray-600">{title}</div>
    </div>
  );
}

function formatNumber(n) {
  return typeof n === "number" ? n.toLocaleString() : n;
}

function formatNumberShort(n) {
  if (typeof n !== "number") return n;
  if (n >= 1000) return Math.round(n / 1000) + "k";
  return n.toString();
}
