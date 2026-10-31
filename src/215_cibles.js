/* ==========================================================================
   RUN v1.12 — CIBLES (4 points rouges qui ouvrent un PDF)
   --------------------------------------------------------------------------
   Seuls les NOMS et les POSITIONS sont dans l'app (lus dans les PDF de Bastien,
   S / E en degrés et minutes décimales). Les PDF eux-mêmes ne sont PAS dans
   l'app publiée : ils sont sur le VPS, dans un sous-dossier du dossier Doc FdF
   protégé par le même code (section « cibles », src/280), téléchargés une fois
   puis gardés sur l'iPad (cache NPF_RUN_CIBLES_CACHE) pour ouverture hors ligne.
   - point rouge dessiné par l'app, nom en étiquette à 1 NM et moins (comme les
     bases ULM, src/220) ;
   - toucher le point : le PDF depuis le cache ; absent : message clair et
     proposition de téléchargement (code Doc FdF).
   Les cibles ne sont jamais des terrains (aucune liste de terrains, pélicandromes,
   BINGO ni dégagement).
   ========================================================================== */

const NPF_RUN_CIBLES = Object.freeze([
    Object.freeze({ id: 'CILAOS-1', nom: 'CILAOS 1', pdf: 'CILAOS 1.pdf', lat: -(21 + 9.600 / 60), lon: 55 + 27.450 / 60 }),
    Object.freeze({ id: 'CILAOS-2', nom: 'CILAOS 2', pdf: 'CILAOS 2.pdf', lat: -(21 + 10.650 / 60), lon: 55 + 26.500 / 60 }),
    Object.freeze({ id: 'MAFATE-1', nom: 'MAFATE 1', pdf: 'MAFATE 1.pdf', lat: -(21 + 3.950 / 60), lon: 55 + 24.700 / 60 }),
    Object.freeze({ id: 'MAFATE-2', nom: 'MAFATE 2', pdf: 'MAFATE 2.pdf', lat: -(21 + 3.750 / 60), lon: 55 + 24.033 / 60 })
]);
const NPF_RUN_CIBLES_CACHE = 'npf-q400-run-cibles-v1';
const NPF_RUN_CIBLES_ETIQUETTE_MAX_NM = 1;
let npfRunCiblesLayer = null;

/* Adresse locale (jamais demandée au réseau) sous laquelle le PDF d'une cible est gardé dans le cache. */
function getNpfRunCibleCacheUrl(cible) {
    return new URL(`./cibles/${cible.id}.pdf`, window.location.href).toString();
}

async function getNpfRunCiblePdfBlob(cible) {
    if (!cible || typeof caches === 'undefined') return null;
    try {
        const cache = await caches.open(NPF_RUN_CIBLES_CACHE);
        const reponse = await cache.match(getNpfRunCibleCacheUrl(cible));
        return reponse ? await reponse.blob() : null;
    } catch (_) {
        return null;
    }
}

async function countNpfRunCiblesInstallees() {
    let n = 0;
    for (const cible of NPF_RUN_CIBLES) if (await getNpfRunCiblePdfBlob(cible)) n += 1;
    return n;
}

/* Section « cibles » (src/280) : ZIP des 4 PDF vérifié, puis rangé dans le cache (les anciens PDF remplacés seulement
 * quand les 4 nouveaux sont lus et complets). */
async function installNpfServerCibles(cfg, manifest, blob) {
    if (typeof JSZip === 'undefined') throw new Error('JSZip non chargé');
    const zip = await JSZip.loadAsync(blob);
    const pdfs = new Map();
    Object.values(zip.files || {}).forEach(entry => {
        if (!entry.dir && /\.pdf$/i.test(entry.name)) pdfs.set(entry.name.split('/').pop(), entry);
    });
    const lus = [];
    for (const cible of NPF_RUN_CIBLES) {
        const entry = pdfs.get(cible.pdf);
        if (!entry) throw new Error(`PDF absent du paquet : ${cible.nom}`);
        const data = await entry.async('uint8array');
        if (String.fromCharCode(...data.slice(0, 5)) !== '%PDF-') throw new Error(`fichier illisible : ${cible.nom}`);
        lus.push({ cible, data });
    }
    if (lus.length !== Number(manifest.nombreFichiers)) throw new Error(`${lus.length} PDF au lieu de ${manifest.nombreFichiers}`);
    const cache = await caches.open(NPF_RUN_CIBLES_CACHE);
    for (const { cible, data } of lus) {
        await cache.put(getNpfRunCibleCacheUrl(cible), new Response(new Blob([data], { type: 'application/pdf' }), { headers: { 'Content-Type': 'application/pdf' } }));
    }
    const installees = await countNpfRunCiblesInstallees();
    if (installees !== NPF_RUN_CIBLES.length) throw new Error(`vérification : ${installees} PDF au lieu de ${NPF_RUN_CIBLES.length}`);
    return `${installees} PDF`;
}

async function getNpfRunCiblesOldBytes() {
    let total = 0;
    for (const cible of NPF_RUN_CIBLES) {
        const blob = await getNpfRunCiblePdfBlob(cible);
        total += blob ? blob.size : 0;
    }
    return total;
}

/* RUN v1.14 — LECTEUR PDF DES CIBLES (PDF.js 4.10.38, Apache-2.0, dossier pdfjs/ de l'app, mis en cache par le service
 * worker, aucun appel extérieur). Le lecteur natif de Safari dans un iframe affichait le PDF trop petit, sans zoom :
 * chaque page est dessinée sur un canvas à la largeur de la fenêtre ; zoom à deux doigts (x1 à x6) ; déplacement au doigt
 * par le défilement natif ; redessinée nette après le zoom ou une rotation. FdS / GAAR gardent leur visionneuse. */
const NPF_CIBLE_PDF_ZOOM_MAX = 6;
const NPF_CIBLE_PDF_PIXELS_MAX = 8000000;   // pixels par page (mémoire de l'iPad)
const NPF_CIBLE_PDF_ECART_PX = 8;
let npfCiblePdfBiblio = null;
let npfCiblePdfCourant = null;

function getNpfCiblePdfBiblio() {
    if (!npfCiblePdfBiblio) {
        npfCiblePdfBiblio = (async () => {
            const lib = await import(new URL('pdfjs/pdf.min.mjs', window.location.href).toString());
            lib.GlobalWorkerOptions.workerSrc = new URL('pdfjs/pdf.worker.min.mjs', window.location.href).toString();
            return { lib, worker: new lib.PDFWorker() };
        })().catch(error => { npfCiblePdfBiblio = null; throw error; });
    }
    return npfCiblePdfBiblio;
}

function setNpfCiblePdfEtat(texte) {
    const etat = document.getElementById('npf-cible-pdf-etat');
    if (etat) etat.textContent = texte || '';
}

/* Tailles à l'écran de toutes les pages pour le zoom courant (zoom 1 = largeur de la fenêtre). */
function placerNpfCiblePdfPages(pdf) {
    const zone = document.getElementById('npf-cible-pdf-scroll');
    const largeur = zone.clientWidth;
    if (!largeur) return;
    pdf.pages.forEach(p => {
        p.largeur = largeur * pdf.zoom;
        p.hauteur = p.base.height * (p.largeur / p.base.width);
        p.boite.style.width = `${p.largeur}px`;
        p.boite.style.height = `${p.hauteur}px`;
    });
    const pages = document.getElementById('npf-cible-pdf-pages');
    pages.style.width = `${largeur * pdf.zoom}px`;
}

/* Dessin net : sur un canvas à part, qui remplace l'ancien une fois fini (l'ancien reste affiché, agrandi, en attendant). */
async function dessinerNpfCiblePdfPage(pdf, p) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const echelleVoulue = (p.largeur / p.base.width) * dpr;
    const echelle = Math.min(echelleVoulue, Math.sqrt(NPF_CIBLE_PDF_PIXELS_MAX / (p.base.width * p.base.height)));
    if (p.tache) { try { p.tache.cancel(); } catch (_) {} }
    const viewport = p.page.getViewport({ scale: echelle });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const tache = p.page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport });
    p.tache = tache;
    try {
        await tache.promise;
    } catch (error) {
        if (error && error.name === 'RenderingCancelledException') return false;
        throw error;
    }
    if (p.tache !== tache || npfCiblePdfCourant !== pdf) return false;
    p.tache = null;
    p.boite.replaceChildren(canvas);
    p.dessinee = true;
    return true;
}

async function dessinerNpfCiblePdf(pdf) {
    const modal = document.getElementById('npf-cible-viewer-modal');
    const tour = (pdf.tour = (pdf.tour || 0) + 1);
    for (const p of pdf.pages) {
        if (npfCiblePdfCourant !== pdf || pdf.tour !== tour) return;
        await dessinerNpfCiblePdfPage(pdf, p);
        if (modal && npfCiblePdfCourant === pdf) modal.dataset.pagesDessinees = String(pdf.pages.filter(x => x.dessinee).length);
    }
}

function closeNpfRunCibleVisionneuse() {
    const modal = document.getElementById('npf-cible-viewer-modal');
    const pdf = npfCiblePdfCourant;
    npfCiblePdfCourant = null;
    if (pdf) {
        pdf.pages.forEach(p => { if (p.tache) { try { p.tache.cancel(); } catch (_) {} } });
        try { pdf.doc.destroy(); } catch (_) {}
    }
    document.getElementById('npf-cible-pdf-pages')?.replaceChildren();
    setNpfCiblePdfEtat('');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        delete modal.dataset.cible;
        delete modal.dataset.pages;
        delete modal.dataset.pagesDessinees;
    }
}

async function showNpfRunCibleVisionneuse(cible, blob) {
    const modal = document.getElementById('npf-cible-viewer-modal');
    const pagesEl = document.getElementById('npf-cible-pdf-pages');
    if (!modal || !pagesEl) throw new Error('visionneuse PDF indisponible');
    closeNpfRunCibleVisionneuse();
    try { map?.closePopup?.(); } catch (_) {}
    const titre = document.getElementById('npf-cible-viewer-title');
    if (titre) titre.textContent = cible.nom;
    modal.dataset.cible = cible.id;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    setNpfCiblePdfEtat('Ouverture du PDF…');
    try {
        const { lib, worker } = await getNpfCiblePdfBiblio();
        const data = new Uint8Array(await blob.arrayBuffer());
        const doc = await lib.getDocument({ data, worker, isEvalSupported: false }).promise;
        if (modal.dataset.cible !== cible.id) { try { doc.destroy(); } catch (_) {} return false; }
        const pdf = { cible, doc, zoom: 1, pages: [] };
        for (let n = 1; n <= doc.numPages; n += 1) {
            const page = await doc.getPage(n);
            const boite = document.createElement('div');
            boite.className = 'npf-cible-pdf-page';
            pagesEl.appendChild(boite);
            pdf.pages.push({ page, boite, base: page.getViewport({ scale: 1 }), dessinee: false, tache: null });
        }
        npfCiblePdfCourant = pdf;
        modal.dataset.pages = String(doc.numPages);
        setNpfCiblePdfEtat('');
        document.getElementById('npf-cible-pdf-scroll').scrollTo(0, 0);
        placerNpfCiblePdfPages(pdf);
        await dessinerNpfCiblePdf(pdf);
        return true;
    } catch (error) {
        closeNpfRunCibleVisionneuse();
        throw error;
    }
}

/* Zoom : facteur appliqué à partir du point (x, y) de la zone, qui reste sous les doigts. */
function appliquerNpfCiblePdfZoom(pdf, zoom, x, y) {
    const zone = document.getElementById('npf-cible-pdf-scroll');
    const avant = pdf.zoom;
    const nouveau = Math.max(1, Math.min(NPF_CIBLE_PDF_ZOOM_MAX, zoom));
    const contenuX = zone.scrollLeft + x;
    const contenuY = zone.scrollTop + y;
    pdf.zoom = nouveau;
    placerNpfCiblePdfPages(pdf);
    zone.scrollLeft = (contenuX * nouveau) / avant - x;
    zone.scrollTop = (contenuY * nouveau) / avant - y;
    dessinerNpfCiblePdf(pdf).catch(() => {});
}

/* Deux doigts : agrandissement immédiat par transform, tailles réelles et dessin net au lâcher. Un doigt : défilement natif. */
function brancherNpfCiblePdfGestes() {
    const zone = document.getElementById('npf-cible-pdf-scroll');
    const pages = document.getElementById('npf-cible-pdf-pages');
    if (!zone || !pages) return;
    let pince = null;
    const ecart = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const centre = t => {
        const r = zone.getBoundingClientRect();
        return { x: (t[0].clientX + t[1].clientX) / 2 - r.left, y: (t[0].clientY + t[1].clientY) / 2 - r.top };
    };
    zone.addEventListener('touchstart', event => {
        if (event.touches.length !== 2 || !npfCiblePdfCourant) return;
        event.preventDefault();
        const c = centre(event.touches);
        pince = { d0: ecart(event.touches), x: c.x, y: c.y, facteur: 1 };
        pages.style.transformOrigin = `${zone.scrollLeft + c.x}px ${zone.scrollTop + c.y}px`;
    }, { passive: false });
    zone.addEventListener('touchmove', event => {
        if (!pince || event.touches.length < 2) return;
        event.preventDefault();
        const pdf = npfCiblePdfCourant;
        if (!pdf || !pince.d0) return;
        const zoom = Math.max(1, Math.min(NPF_CIBLE_PDF_ZOOM_MAX, pdf.zoom * (ecart(event.touches) / pince.d0)));
        pince.facteur = zoom / pdf.zoom;
        pages.style.transform = `scale(${pince.facteur})`;
    }, { passive: false });
    const finir = event => {
        if (!pince || event.touches.length >= 2) return;
        const { x, y, facteur } = pince;
        pince = null;
        pages.style.transform = '';
        pages.style.transformOrigin = '';
        if (npfCiblePdfCourant && facteur !== 1) appliquerNpfCiblePdfZoom(npfCiblePdfCourant, npfCiblePdfCourant.zoom * facteur, x, y);
    };
    zone.addEventListener('touchend', finir);
    zone.addEventListener('touchcancel', finir);
    /* Safari : pas de zoom de la page entière */
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(type => zone.addEventListener(type, event => event.preventDefault(), { passive: false }));
    window.addEventListener('resize', () => {
        const pdf = npfCiblePdfCourant;
        if (!pdf) return;
        placerNpfCiblePdfPages(pdf);
        dessinerNpfCiblePdf(pdf).catch(() => {});
    });
}

/* Toucher un point : le PDF depuis le cache, dans la visionneuse de l'app (en ligne comme hors ligne). */
async function openNpfRunCible(id) {
    const cible = NPF_RUN_CIBLES.find(c => c.id === id);
    if (!cible) return false;
    const blob = await getNpfRunCiblePdfBlob(cible);
    if (blob) {
        try {
            return await showNpfRunCibleVisionneuse(cible, blob);
        } catch (error) {
            alert(`Ouverture du PDF de ${cible.nom} impossible : ${error.message || error}`);
            return false;
        }
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        alert(`Le PDF de ${cible.nom} n'est pas encore sur cet iPad.\n\nPas de connexion : télécharge les PDF des cibles depuis Gestion des Cartes dès que possible (code Doc FdF).`);
        return false;
    }
    const ok = await npfConfirmInApp(`Le PDF de ${cible.nom} n'est pas encore sur cet iPad.\n\nTélécharger maintenant les PDF des 4 cibles (code Doc FdF demandé) ?`);
    if (!ok) return false;
    const modal = document.getElementById('offline-map-modal');
    if (modal) modal.style.display = 'flex';
    try { document.getElementById('cibles-download-button')?.scrollIntoView({ block: 'center' }); } catch (_) {}
    await runNpfServerMapDownload('cibles');
    return false;
}

/* ---------- dessin : point rouge, nom à 1 NM et moins ---------- */
/* RUN v1.13 — panneau à part, AU-DESSUS des surfaces tactiles des terrains et de la SIA (z660 / z665) et sous le
 * trafic (z675 et plus) : aucune autre couche ne peut prendre le toucher d'une cible. */
const NPF_RUN_CIBLES_PANE = 'npfCiblesPane';
const NPF_RUN_CIBLES_ZONE_RAYON_PX = 26;   // zone de toucher : 52 px de diamètre (44 px au moins)
let npfRunCiblesRenderer = null;

function getNpfRunCiblesRenderer() {
    if (!map.getPane(NPF_RUN_CIBLES_PANE)) {
        map.createPane(NPF_RUN_CIBLES_PANE);
        const pane = map.getPane(NPF_RUN_CIBLES_PANE);
        if (pane) pane.style.zIndex = '668';
    }
    if (!npfRunCiblesRenderer && L.svg) npfRunCiblesRenderer = L.svg({ padding: 0.35, pane: NPF_RUN_CIBLES_PANE });
    return npfRunCiblesRenderer;
}

function refreshNpfRunCibles() {
    if (typeof map === 'undefined' || !map || typeof L === 'undefined') return;
    if (!npfRunCiblesLayer) npfRunCiblesLayer = L.layerGroup();
    const renderer = getNpfRunCiblesRenderer() || undefined;
    npfRunCiblesLayer.clearLayers();
    let echelle = Infinity;
    try { echelle = getCurrentNpfScaleNm(); } catch (_) {}
    const etiquettes = Number.isFinite(echelle) && echelle <= NPF_RUN_CIBLES_ETIQUETTE_MAX_NM + 0.000001;
    NPF_RUN_CIBLES.forEach(cible => {
        const point = L.circleMarker([cible.lat, cible.lon], {
            radius: 7, color: '#ffffff', weight: 2.5, fillColor: '#e10600', fillOpacity: 1,
            className: 'npf-cible-point', bubblingMouseEvents: false, pane: NPF_RUN_CIBLES_PANE, renderer
        });
        point._npfCible = cible.id;
        /* zone de toucher plus large que le point (doigt) */
        const zone = L.circleMarker([cible.lat, cible.lon], { radius: NPF_RUN_CIBLES_ZONE_RAYON_PX, stroke: false, fillColor: '#e10600', fillOpacity: 0, className: 'npf-cible-zone', bubblingMouseEvents: false, pane: NPF_RUN_CIBLES_PANE, renderer });
        const toucher = event => {
            try { event?.originalEvent?.stopPropagation?.(); } catch (_) {}
            openNpfRunCible(cible.id);
        };
        point.on('click', toucher);
        zone.on('click', toucher);
        if (etiquettes) {
            point.bindTooltip(escapeHtml(cible.nom), { permanent: true, direction: 'right', offset: [9, 0], className: 'npf-cible-label', interactive: false });
        }
        zone.addTo(npfRunCiblesLayer);
        point.addTo(npfRunCiblesLayer);
    });
    if (!map.hasLayer(npfRunCiblesLayer)) npfRunCiblesLayer.addTo(map);
}

/* La carte est créée après le chargement du script : on attend qu'elle existe (500 ms entre deux essais, 2 min au plus). */
(function attendreCarteCibles(essai = 0) {
    if (typeof map !== 'undefined' && map && typeof map.whenReady === 'function') {
        map.whenReady(() => {
            refreshNpfRunCibles();
            map.on('zoomend', refreshNpfRunCibles);
        });
        return;
    }
    if (essai < 240) setTimeout(() => attendreCarteCibles(essai + 1), 500);
})();

(function brancherVisionneuseCibles() {
    const brancher = () => {
        document.getElementById('npf-cible-viewer-close')?.addEventListener('click', closeNpfRunCibleVisionneuse);
        brancherNpfCiblePdfGestes();
        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            if (document.getElementById('npf-cible-viewer-modal')?.style.display === 'flex') closeNpfRunCibleVisionneuse();
        });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancher, { once: true });
    else brancher();
})();

window.openNpfRunCible = openNpfRunCible;
window.closeNpfRunCibleVisionneuse = closeNpfRunCibleVisionneuse;
