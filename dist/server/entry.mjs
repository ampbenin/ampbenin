import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_B8hBM36A.mjs';
import { manifest } from './manifest_BvdqG2-f.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/a-propos.astro.mjs');
const _page2 = () => import('./pages/actualites/admimission.astro.mjs');
const _page3 = () => import('./pages/actualites/campagne-mycountry229-paix-benin.astro.mjs');
const _page4 = () => import('./pages/actualites/mycountry229-2025.astro.mjs');
const _page5 = () => import('./pages/actualites.astro.mjs');
const _page6 = () => import('./pages/adhesion.astro.mjs');
const _page7 = () => import('./pages/admimission.astro.mjs');
const _page8 = () => import('./pages/contact.astro.mjs');
const _page9 = () => import('./pages/is/amp-zones.astro.mjs');
const _page10 = () => import('./pages/is/sccs.astro.mjs');
const _page11 = () => import('./pages/is/sepe.astro.mjs');
const _page12 = () => import('./pages/is/sfpf.astro.mjs');
const _page13 = () => import('./pages/is/snie.astro.mjs');
const _page14 = () => import('./pages/is/sspbs.astro.mjs');
const _page15 = () => import('./pages/is.astro.mjs');
const _page16 = () => import('./pages/monattestation.astro.mjs');
const _page17 = () => import('./pages/partenaire.astro.mjs');
const _page18 = () => import('./pages/programmes.astro.mjs');
const _page19 = () => import('./pages/verify/_id_.astro.mjs');
const _page20 = () => import('./pages/volontaires.astro.mjs');
const _page21 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/node.js", _page0],
    ["src/pages/a-propos.astro", _page1],
    ["src/pages/actualites/admimission.astro", _page2],
    ["src/pages/actualites/campagne-mycountry229-paix-benin.astro", _page3],
    ["src/pages/actualites/mycountry229-2025.astro", _page4],
    ["src/pages/actualites.astro", _page5],
    ["src/pages/adhesion.astro", _page6],
    ["src/pages/admimission.astro", _page7],
    ["src/pages/contact.astro", _page8],
    ["src/pages/is/amp-zones.astro", _page9],
    ["src/pages/is/sccs.astro", _page10],
    ["src/pages/is/sepe.astro", _page11],
    ["src/pages/is/sfpf.astro", _page12],
    ["src/pages/is/snie.astro", _page13],
    ["src/pages/is/sspbs.astro", _page14],
    ["src/pages/is/index.astro", _page15],
    ["src/pages/monattestation.astro", _page16],
    ["src/pages/partenaire.astro", _page17],
    ["src/pages/programmes.astro", _page18],
    ["src/pages/verify/[id].astro", _page19],
    ["src/pages/volontaires.astro", _page20],
    ["src/pages/index.astro", _page21]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "mode": "standalone",
    "client": "file:///C:/amp-benin-site/dist/client/",
    "server": "file:///C:/amp-benin-site/dist/server/",
    "host": false,
    "port": 4321,
    "assets": "_astro",
    "experimentalStaticHeaders": false
};
const _exports = createExports(_manifest, _args);
const handler = _exports['handler'];
const startServer = _exports['startServer'];
const options = _exports['options'];
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { handler, options, pageMap, startServer };
