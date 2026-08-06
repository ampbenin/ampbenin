import React, { useEffect, useState } from 'react';
import { useAuthAMP } from '../../../services/gestionamp/useAuthAMP';
import PageZonesEditor from './PageZonesEditor.jsx';
import ArticlesManager from './ArticlesManager.jsx';
import SlugCollectionManager from './SlugCollectionManager.jsx';
import ActionsManager from './ActionsManager.jsx';
import JobPostingsManager from './JobPostingsManager.jsx';
import CampaignEditor from './CampaignEditor.jsx';
import MediaLibrary from './MediaLibrary.jsx';
import ContactManager from '../ContactManager.jsx';
import MemberManager from '../MemberManager.jsx';
import NewsletterManager from '../NewsletterManager.jsx';
import PartnerManager from '../PartnerManager.jsx';
import VolunteerApplicationsInbox from '../VolunteerApplicationsInbox.jsx';
import VolunteersManager from '../../VolunteersManager.jsx';
import VolunteerProgramsManager from '../VolunteerProgramsManager.jsx';
import VolunteerFormTemplatesManager from '../VolunteerFormTemplatesManager.jsx';
import SaveVolunteers from '../../SaveVolunteers.jsx';
import GenerateCertificate from '../../GenerateCertificate.jsx';

const CONTENT_TABS = [
  { id: 'pages', label: 'Pages du site' },
  { id: 'articles', label: 'Articles' },
  { id: 'programmes', label: 'Programmes' },
  { id: 'institutions', label: 'Institutions Spécialisées' },
  { id: 'actions', label: 'Actions / Projets' },
  { id: 'jobs', label: 'Recrutement' },
  { id: 'campaign', label: 'Campagne 16 jours' },
  { id: 'media', label: 'Médiathèque' },
];

const INBOX_TABS = [
  { id: 'contacts', label: 'Contacts' },
  { id: 'members', label: 'Adhésions' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'partners', label: 'Partenariats' },
  { id: 'volunteers', label: 'Candidatures spontanées' },
];

const MISSIONS_TABS = [
  { id: 'volunteer-programs', label: 'Programmes de volontariat' },
  { id: 'volunteer-form-templates', label: 'Modèles de formulaire' },
  { id: 'volunteers-roster', label: 'Volontaires (fichier)' },
  { id: 'save-volunteer', label: 'Enregistrer un volontaire' },
  { id: 'certificates', label: 'Générer attestations' },
];

// Tous les ids d'onglets valides (Contenu + Boîte de réception + Volontaires
// & Missions) — utilisé pour valider un ?tab= venu de l'URL avant de s'y fier.
const ALL_TAB_IDS = [...CONTENT_TABS, ...INBOX_TABS, ...MISSIONS_TABS].map((t) => t.id);

// Lu une seule fois, en initialiseur paresseux de useState (donc pendant le
// rendu, avant peinture) — pas dans un useEffect, pour éviter tout flash
// visible de l'onglet par défaut avant de basculer sur le bon onglet.
function getInitialTab() {
  if (typeof window === 'undefined') return 'pages';
  const tab = new URLSearchParams(window.location.search).get('tab');
  return ALL_TAB_IDS.includes(tab) ? tab : 'pages';
}

export default function AdminShell() {
  // Revalide le token contre le backend (GET /gestionamp/api/auth/me) avant
  // d'afficher quoi que ce soit — évite qu'un token expiré/absent laisse
  // apparaître la coquille de l'admin (menu + contenu) le temps qu'un appel
  // enfant échoue en 401 pour rediriger, et affiche un état de chargement
  // explicite pendant l'attente au lieu de rien (voir l'écran plus bas).
  const { loading: authLoading } = useAuthAMP(['ADMIN', 'EDITOR']);

  const [active, setActiveState] = useState(getInitialTab);
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(localStorage.getItem('amp_role'));
  }, []);

  // Garde l'onglet actif dans l'URL (?tab=...) pour qu'un rafraîchissement
  // de la page reste sur le même onglet au lieu de retomber sur "pages".
  // replaceState (pas pushState) : change l'onglet ne doit pas empiler
  // d'entrées dans l'historique de navigation.
  const setActive = (tabId) => {
    setActiveState(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.replaceState({}, '', url);
  };

  const logout = () => {
    localStorage.removeItem('amp_token');
    localStorage.removeItem('amp_role');
    window.location.href = '/admin/login';
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-600">Chargement de l'espace admin...</p>
        </div>
      </div>
    );
  }

  const NavGroup = ({ title, tabs }) => (
    <div className="mb-4">
      <div className="text-xs uppercase text-violet-200 px-4 mb-1">{title}</div>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => setActive(t.id)}
          className={`w-full text-left px-4 py-2 rounded ${active === t.id ? 'bg-violet-900' : 'hover:bg-violet-600'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <aside className="flex flex-col w-full md:w-64 bg-violet-700 text-white p-4 md:sticky md:top-0 md:h-screen">
        <h2 className="text-xl font-bold mb-6">📊 Admin AMP BENIN</h2>

        <NavGroup title="Contenu" tabs={CONTENT_TABS} />
        <NavGroup title="Boîte de réception" tabs={INBOX_TABS} />
        <NavGroup title="Volontaires & Missions" tabs={MISSIONS_TABS} />

        {role === 'ADMIN' && (
          <div className="mb-4">
            <div className="text-xs uppercase text-violet-200 px-4 mb-1">Gestion AMP</div>
            <a href="/gestionamp/dashboard/admin"
              className="block px-4 py-2 rounded hover:bg-violet-600">
              Activités / Finances / Utilisateurs
            </a>
          </div>
        )}

        <button onClick={logout} className="mt-auto w-full text-left px-4 py-2 rounded bg-red-600 hover:bg-red-700">
          🚪 Déconnexion
        </button>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        {active === 'pages' && <PageZonesEditor />}
        {active === 'articles' && <ArticlesManager />}
        {active === 'programmes' && (
          <SlugCollectionManager endpoint="/api/cms/programmes" label="Programmes" nameField="title" />
        )}
        {active === 'institutions' && (
          <SlugCollectionManager endpoint="/api/cms/institutions" label="Institutions Spécialisées" nameField="name" hasMissions />
        )}
        {active === 'actions' && <ActionsManager />}
        {active === 'jobs' && <JobPostingsManager />}
        {active === 'campaign' && <CampaignEditor />}
        {active === 'media' && <MediaLibrary />}

        {active === 'contacts' && <ContactManager />}
        {active === 'members' && <MemberManager />}
        {active === 'newsletter' && <NewsletterManager />}
        {active === 'partners' && <PartnerManager />}
        {active === 'volunteers' && <VolunteerApplicationsInbox />}

        {active === 'volunteer-programs' && <VolunteerProgramsManager />}
        {active === 'volunteer-form-templates' && <VolunteerFormTemplatesManager />}
        {active === 'volunteers-roster' && <VolunteersManager />}
        {active === 'save-volunteer' && <SaveVolunteers />}
        {active === 'certificates' && <GenerateCertificate />}
      </main>
    </div>
  );
}
