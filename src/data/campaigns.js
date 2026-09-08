// src/data/campaigns.js
// Collectes ("cagnotes") thématiques mises en avant sur /don. Contenu
// 100% hardcodé (pas de CMS, voir mémo architecture) — chaque entrée
// alimente à la fois la carte sur /don et sa page de présentation dédiée
// (/don/campagnes/[slug]).
//
// L'API de dons (server-miss-culture-benin) n'a pas de champ "campagne" :
// `messageTag` est préfixé au champ `message` envoyé à l'API
// (voir DonationTypeform.jsx) pour que l'équipe AMP puisse repérer
// manuellement, dans les dons reçus, ceux destinés à cette collecte —
// il n'y a donc pas de compteur "montant collecté" en temps réel.
//
// `goalText` est volontairement qualitatif plutôt qu'un chiffre inventé :
// à remplacer par un objectif chiffré réel (nombre de kits visé, montant
// cible...) dès qu'AMP BENIN nous le communique.
export const CAMPAIGNS = [
  {
    slug: "kits-scolaires",
    active: true,
    category: "Éducation & Enfance",
    title: "Kits scolaires pour les enfants en difficulté",
    shortDescription:
      "Offrez un kit scolaire complet à un enfant orphelin, démuni ou vulnérable pour qu'il n'aborde pas la rentrée les mains vides.",
    messageTag: "Kits scolaires",
    goalLabel: "Notre objectif",
    goalText:
      "Offrir un kit scolaire complet — cahiers, stylos, ardoise, sac à dos — au plus grand nombre possible d'enfants en situation difficile suivis par AMP BENIN et ses partenaires, avant la rentrée scolaire.",
    intro:
      "Chaque rentrée scolaire, des centaines d'enfants béninois en situation difficile — orphelins recueillis par des proches, enfants de familles démunies, enfants vulnérables suivis par nos institutions spécialisées — risquent de rester sans cahiers, sans stylos, parfois sans cartable. Faute de quelques milliers de FCFA, leur année scolaire commence déjà avec un handicap.",
    story: [
      "AMP BENIN, à travers sa Section d'Éducation et de Promotion de l'Enfance (SEPE-AMP) et ses coordinations locales AMP Zones, va à la rencontre de ces enfants dans plusieurs localités du Bénin — à Cotonou, Porto-Novo, Abomey-Calavi, Tori-Bossito, Kpomassè, Ouidah et Comè, jusqu'à Parakou et Djougou au nord. Beaucoup d'entre eux sont orphelins, démunis ou simplement nés dans des familles qui n'arrivent pas à couvrir les frais de scolarité de base.",
      "Cette collecte permettra de constituer et de distribuer des kits scolaires complets à ces enfants, pour qu'ils puissent suivre les cours dans les mêmes conditions que les autres — avec la dignité et l'égalité des chances que chaque enfant mérite.",
      "Votre don, quel que soit son montant, contribue directement à l'achat du matériel scolaire et à son acheminement jusqu'aux enfants, avec le soutien de nos volontaires sur le terrain.",
    ],
    kitContents: [
      "Cahiers et copies",
      "Stylos, crayons et gomme",
      "Règle et ardoise",
      "Sac à dos",
      "Kit d'hygiène de base",
    ],
  },
];

export const getCampaignBySlug = (slug) => CAMPAIGNS.find((c) => c.slug === slug && c.active);
export const getActiveCampaigns = () => CAMPAIGNS.filter((c) => c.active);
