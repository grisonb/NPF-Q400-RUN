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

/* Toucher un point : la fenêtre est ouverte DANS le geste (iPad), puis le PDF y est chargé depuis le cache. */
async function openNpfRunCible(id) {
    const cible = NPF_RUN_CIBLES.find(c => c.id === id);
    if (!cible) return false;
    const fenetre = window.open('', '_blank');
    const blob = await getNpfRunCiblePdfBlob(cible);
    if (blob) {
        const url = URL.createObjectURL(blob);
        if (fenetre) fenetre.location.href = url;
        else window.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 120000);
        return true;
    }
    try { if (fenetre && !fenetre.closed) fenetre.close(); } catch (_) {}
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
function refreshNpfRunCibles() {
    if (typeof map === 'undefined' || !map || typeof L === 'undefined') return;
    if (!npfRunCiblesLayer) npfRunCiblesLayer = L.layerGroup();
    npfRunCiblesLayer.clearLayers();
    let echelle = Infinity;
    try { echelle = getCurrentNpfScaleNm(); } catch (_) {}
    const etiquettes = Number.isFinite(echelle) && echelle <= NPF_RUN_CIBLES_ETIQUETTE_MAX_NM + 0.000001;
    NPF_RUN_CIBLES.forEach(cible => {
        const point = L.circleMarker([cible.lat, cible.lon], {
            radius: 7, color: '#ffffff', weight: 2.5, fillColor: '#e10600', fillOpacity: 1,
            className: 'npf-cible-point', bubblingMouseEvents: false
        });
        point._npfCible = cible.id;
        /* zone de toucher plus large que le point (doigt) */
        const zone = L.circleMarker([cible.lat, cible.lon], { radius: 18, stroke: false, fillOpacity: 0, className: 'npf-cible-zone', bubblingMouseEvents: false });
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

window.openNpfRunCible = openNpfRunCible;
