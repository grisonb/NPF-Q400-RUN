/* =========================================================================
   RUN v1.9 — CHEMINEMENTS VERS LES CIRQUES : affichage, sélection, calculs
   RUN v1.10 — règle « intelligente » des itinéraires proposés (28/10/2026)
   ========================================================================= */
/*
 * Données : src/154 NPF_RUN_CHEMINEMENTS (7 itinéraires de Bastien, départ FMEP, cirque d'arrivée de chacun) et
 * NPF_RUN_CIRQUES (contours de Mafate, Cilaos, Salazie).
 * - Sans feu : les itinéraires en trait fin en fond (couche npfCheminementsFondLayer), bouton (pastille du bouton du
 *   Calque Routier) pour les afficher / cacher, choix mémorisé (NPF_CHEMINEMENTS_VISIBLES_KEY) ; nom à 2 NM et moins,
 *   au dernier point de chaque itinéraire (v1.10 : deux itinéraires partagent leur début).
 * - Feu placé (v1.10) : itinéraires éligibles = ceux du cirque si le feu est DANS un cirque, tous sinon. Pour chacun,
 *   son point (FMEP exclu) le plus proche du feu ; à moins de 5 NM, l'itinéraire est proposé COUPÉ à ce point, puis en
 *   ligne droite jusqu'au feu. Deux propositions identiques (même suite de points) n'en font qu'une (noms joints).
 *   Étiquette : nom, distance totale, temps à 200 kt, « Rot. ». La plus COURTE est présélectionnée ; la ligne droite
 *   FMEP -> feu reste toujours affichée et sélectionnable (route PÉLIC, src/150) ; sans proposition, elle est choisie.
 * - Sélection en touchant le trait ou l'étiquette, comme les routes PÉLIC de la TEST (vert = choisi, bleu = proposé) ;
 *   toucher la ligne droite la choisit. Un NOUVEAU feu refait le calcul (présélection de la plus courte).
 * - Calculs (src/270 updateCalculatorData) : chemin choisi -> distance totale (Nm arrondi) pour le temps, la rotation
 *   et le BINGO 1 FMEP (bandeau, étiquettes, calculateur) ; BINGO 2 FMEE : ligne droite, inchangé. Le calculateur
 *   affiche le nom du chemin choisi.
 * Les itinéraires ne sont jamais des terrains (aucune liste de terrains, pélicandromes ni dégagement).
 */
const NPF_CHEMINEMENTS_VISIBLES_KEY = 'npfCheminementsVisiblesV1';
const NPF_CHEMINEMENT_FEU_MAX_NM = 5;
const NPF_CHEMINEMENT_ETIQUETTE_MAX_NM = 2;
let npfCheminementsFondLayer = null;
const NPF_CHEMINEMENT_LIGNE_DROITE = 'ligne-droite';
let npfCheminementSelectionId = null;       // null = présélection (la plus courte) ; NPF_CHEMINEMENT_LIGNE_DROITE = ligne droite
let npfCheminementFeuKey = '';
let npfCheminementEtiquettes = [];          // étiquettes des cheminements proposés (placement sans recouvrement)

function readNpfCheminementsVisibles() {
    try { return localStorage.getItem(NPF_CHEMINEMENTS_VISIBLES_KEY) !== 'false'; } catch (_) { return true; }
}

function writeNpfCheminementsVisibles(visibles) {
    try { localStorage.setItem(NPF_CHEMINEMENTS_VISIBLES_KEY, visibles ? 'true' : 'false'); } catch (_) {}
}

function getNpfCheminementDepart() {
    const fmep = getAirportByOaci('FMEP');
    return fmep ? [Number(fmep.lat), Number(fmep.lon)] : null;
}

/* Tracé du cheminement : FMEP puis ses points (branches courtes : segments droits). */
function getNpfCheminementLatLngs(cheminement) {
    const depart = getNpfCheminementDepart();
    const points = cheminement.points.map(p => [p[0], p[1]]);
    return depart ? [depart, ...points] : points;
}

function getNpfFeuKey(commune) {
    const lat = Number(commune?.latitude_mairie);
    const lon = Number(commune?.longitude_mairie);
    return Number.isFinite(lat) && Number.isFinite(lon) ? `${lat.toFixed(5)}|${lon.toFixed(5)}` : '';
}

/* RUN v1.10 — cirque où se trouve un point (contours src/154), ou '' hors des cirques (point dans le polygone). */
function getNpfCirqueDuPoint(lat, lon) {
    const y = Number(lat);
    const x = Number(lon);
    if (!Number.isFinite(y) || !Number.isFinite(x)) return '';
    return Object.keys(NPF_RUN_CIRQUES).find(cle => {
        const c = NPF_RUN_CIRQUES[cle].contour;
        let dedans = false;
        for (let i = 0, j = c.length - 1; i < c.length; j = i, i += 1) {
            if ((c[i][0] > y) !== (c[j][0] > y) && x < (c[j][1] - c[i][1]) * (y - c[i][0]) / (c[j][0] - c[i][0]) + c[i][1]) dedans = !dedans;
        }
        return dedans;
    }) || '';
}

/* RUN v1.10 — propositions pour un feu, de la plus courte à la plus longue : itinéraires éligibles (cirque du feu, ou
 * tous hors des cirques), chacun coupé à son point le plus proche du feu s'il est à moins de 5 NM, puis ligne droite
 * jusqu'au feu ; total = somme des branches (FMEP, points gardés, feu) ; doublons fusionnés. */
function getNpfCheminementsCandidats(lat, lon) {
    const feuLat = Number(lat);
    const feuLon = Number(lon);
    const depart = getNpfCheminementDepart();
    if (!Number.isFinite(feuLat) || !Number.isFinite(feuLon) || !depart) return [];
    const cirque = getNpfCirqueDuPoint(feuLat, feuLon);
    const propositions = [];
    NPF_RUN_CHEMINEMENTS.filter(cheminement => !cirque || cheminement.cirque === cirque).forEach(cheminement => {
        let indexProche = -1;
        let derniereBranche = Infinity;
        cheminement.points.forEach((p, i) => {
            const d = calculateDistanceInNm(p[0], p[1], feuLat, feuLon);
            if (d < derniereBranche) { derniereBranche = d; indexProche = i; }
        });
        if (indexProche < 0 || !(derniereBranche < NPF_CHEMINEMENT_FEU_MAX_NM)) return;
        const points = cheminement.points.slice(0, indexProche + 1);
        const cle = points.map(p => `${p[0]},${p[1]}`).join(';');
        const deja = propositions.find(x => x.cle === cle);
        if (deja) {
            deja.ids.push(cheminement.id);
            deja.noms.push(cheminement.nom);
            return;
        }
        let chemin = 0;
        let precedent = depart;
        points.forEach(p => { chemin += calculateDistanceInNm(precedent[0], precedent[1], p[0], p[1]); precedent = p; });
        propositions.push({ cle, ids: [cheminement.id], noms: [cheminement.nom], points, coupe: indexProche < cheminement.points.length - 1, cirque, derniereBranche, totalNm: chemin + derniereBranche });
    });
    propositions.forEach(p => { p.id = p.ids.join('+'); p.nom = p.noms.join(' / '); });
    return propositions.sort((a, b) => a.totalNm - b.totalNm);
}

/* Nouveau feu : retour à la présélection (le choix du pilote ne survit pas au changement de feu). */
function resetNpfCheminementPourFeu(commune) {
    const key = getNpfFeuKey(commune);
    if (key !== npfCheminementFeuKey) {
        npfCheminementSelectionId = null;
        npfCheminementFeuKey = key;
    }
}

/* Chemin choisi pour le feu affiché, ou null (ligne droite). v1.10 : sans choix du pilote, la plus courte. */
function getNpfCheminementSelectionne() {
    if (typeof currentCommune === 'undefined' || !currentCommune) return null;
    const candidats = getNpfCheminementsCandidats(currentCommune.latitude_mairie, currentCommune.longitude_mairie);
    const choixPilote = getNpfFeuKey(currentCommune) === npfCheminementFeuKey ? npfCheminementSelectionId : null;
    if (choixPilote === NPF_CHEMINEMENT_LIGNE_DROITE) return null;
    return (choixPilote && candidats.find(c => c.id === choixPilote)) || candidats[0] || null;
}

/* Toucher la ligne droite FMEP -> feu (src/150) : elle devient le chemin choisi pour ce feu. */
function selectNpfLigneDroite() {
    npfCheminementSelectionId = NPF_CHEMINEMENT_LIGNE_DROITE;
    if (typeof currentCommune !== 'undefined' && currentCommune) npfCheminementFeuKey = getNpfFeuKey(currentCommune);
}

function selectNpfCheminementFromRoute(id) {
    if (typeof currentCommune === 'undefined' || !currentCommune) return;
    npfCheminementSelectionId = id || null;
    npfCheminementFeuKey = getNpfFeuKey(currentCommune);
    displayCommuneDetails(currentCommune, false);
}

/* Routes des cheminements proposés (même dessin que les routes PÉLIC : vert = choisi, bleu = proposé). Renvoie les
 * points tracés (cadrage de la carte). */
function drawNpfCheminementsVersFeu(lat, lon, layer) {
    const choisi = getNpfCheminementSelectionne();
    /* le chemin choisi est dessiné en DERNIER : son trait et son étiquette passent au-dessus des autres */
    const candidats = getNpfCheminementsCandidats(lat, lon)
        .sort((a, b) => (choisi && a.id === choisi.id ? 1 : 0) - (choisi && b.id === choisi.id ? 1 : 0));
    const traces = [];
    npfCheminementEtiquettes = [];
    candidats.forEach(candidat => {
        const { totalNm } = candidat;
        const latlngs = [...getNpfCheminementLatLngs(candidat), [Number(lat), Number(lon)]];
        traces.push(...latlngs);
        const isSelected = !!choisi && choisi.id === candidat.id;
        const color = isSelected ? '#39ff14' : '#00a8ff';
        L.polyline(latlngs, { color: '#ffffff', weight: 9, opacity: 1, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(layer);
        L.polyline(latlngs, { color, weight: 5, opacity: 1, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(layer);
        const hitbox = L.polyline(latlngs, { color: 'transparent', weight: 24, opacity: 0 }).addTo(layer);
        hitbox._npfCheminementId = candidat.id;
        const choisir = event => {
            try {
                if (event && event.originalEvent && typeof event.originalEvent.stopPropagation === 'function') event.originalEvent.stopPropagation();
            } catch (_) {}
            selectNpfCheminementFromRoute(candidat.id);
        };
        hitbox.on('click', choisir);
        const distance = Math.round(totalNm);
        let rotationLine = '';
        try {
            const rotation = Math.round(calculateRotationTime(distance));
            if (Number.isFinite(rotation) && rotation > 0) rotationLine = `<div class="route-label-sub route-label-rotation">Rot. ${rotation} min</div>`;
        } catch (_) {}
        const dernier = candidat.points[candidat.points.length - 1];
        const tooltip = L.tooltip({
            permanent: true,
            interactive: true,
            direction: 'top',
            offset: [0, -8],
            className: `${isSelected ? 'route-tooltip route-tooltip-selected' : 'route-tooltip route-tooltip-other-pelic'} route-tooltip-clickable npf-cheminement-tooltip`,
            bubblingMouseEvents: false
        }).setLatLng([dernier[0], dernier[1]])
            .setContent(`<div class="route-label-oaci npf-cheminement-nom-route">${escapeHtml(candidat.nom)}</div><div class="route-label-sub">${distance} Nm / ${formatFlightTimeLabel(distance)}</div>${rotationLine}`)
            .addTo(layer);
        tooltip.on('click', choisir);
        tooltip.on('touchstart', choisir);
        npfCheminementEtiquettes.push(tooltip);
    });
    placerNpfCheminementEtiquettes();
    return traces;
}

/* Étiquettes des cheminements proposés sans recouvrement (entre elles et avec les étiquettes de route déjà posées) :
 * chaque étiquette garde son point d'ancrage (dernier point du cheminement) et se décale verticalement (puis
 * latéralement) de la plus petite valeur qui la dégage. Refait à chaque fin de zoom. */
function placerNpfCheminementEtiquettes() {
    if (typeof map === 'undefined' || !map || !npfCheminementEtiquettes.length) return;
    const boites = [];
    const chevauche = b => boites.some(o => b.x < o.x + o.w + 4 && o.x < b.x + b.w + 4 && b.y < o.y + o.h + 4 && o.y < b.y + b.h + 4);
    document.querySelectorAll('.route-tooltip:not(.npf-cheminement-tooltip)').forEach(element => {
        const r = element.getBoundingClientRect();
        if (r.width > 0) boites.push({ x: r.left, y: r.top, w: r.width, h: r.height });
    });
    const carte = map.getContainer().getBoundingClientRect();
    npfCheminementEtiquettes.forEach(tooltip => {
        const element = tooltip.getElement && tooltip.getElement();
        if (!element) return;
        const w = element.offsetWidth || 180;
        const h = element.offsetHeight || 60;
        const ancre = map.latLngToContainerPoint(tooltip.getLatLng());
        const essais = [];
        for (let k = 0; k <= 6; k += 1) {
            [0, -1, 1].forEach(sens => essais.push([sens * (w + 8), -k * (h + 6)]));
            if (k) [0, -1, 1].forEach(sens => essais.push([sens * (w + 8), k * (h + 6)]));
        }
        let choix = essais[0];
        for (const [dx, dy] of essais) {
            const b = { x: carte.left + ancre.x - w / 2 + dx, y: carte.top + ancre.y - 8 - h + dy, w, h };
            if (!chevauche(b)) { choix = [dx, dy]; break; }
        }
        boites.push({ x: carte.left + ancre.x - w / 2 + choix[0], y: carte.top + ancre.y - 8 - h + choix[1], w, h });
        tooltip.options.offset = L.point(choix[0], -8 + choix[1]);
        tooltip.update();
    });
}

/* Tracés de fond (sans feu) : trait fin, nom à 2 NM et moins (v1.10 : au dernier point de l'itinéraire). */
function refreshNpfCheminementsFond() {
    if (typeof map === 'undefined' || !map) return;
    if (!npfCheminementsFondLayer) npfCheminementsFondLayer = L.layerGroup();
    npfCheminementsFondLayer.clearLayers();
    const visibles = readNpfCheminementsVisibles();
    refreshNpfCheminementsBouton(visibles);
    const feu = typeof currentCommune !== 'undefined' && !!currentCommune;
    if (!visibles || feu) {
        if (map.hasLayer(npfCheminementsFondLayer)) map.removeLayer(npfCheminementsFondLayer);
        return;
    }
    let echelle = Infinity;
    try { echelle = getCurrentNpfScaleNm(); } catch (_) {}
    NPF_RUN_CHEMINEMENTS.forEach(cheminement => {
        const latlngs = getNpfCheminementLatLngs(cheminement);
        L.polyline(latlngs, { color: '#ffffff', weight: 4.5, opacity: 0.75, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(npfCheminementsFondLayer);
        L.polyline(latlngs, { color: '#00695c', weight: 2.2, opacity: 0.95, dashArray: '7 5', interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(npfCheminementsFondLayer);
        if (Number.isFinite(echelle) && echelle <= NPF_CHEMINEMENT_ETIQUETTE_MAX_NM + 0.000001) {
            const fin = latlngs[latlngs.length - 1];
            L.marker(fin, {
                interactive: false,
                keyboard: false,
                icon: L.divIcon({ className: 'npf-cheminement-nom-icon', html: `<span class="npf-cheminement-nom">${escapeHtml(cheminement.nom)}</span>`, iconSize: [1, 1], iconAnchor: [0, 0] })
            }).addTo(npfCheminementsFondLayer);
        }
    });
    if (!map.hasLayer(npfCheminementsFondLayer)) npfCheminementsFondLayer.addTo(map);
}

function refreshNpfCheminementsBouton(visibles = readNpfCheminementsVisibles()) {
    const bouton = document.getElementById('cheminements-toggle');
    if (!bouton) return;
    bouton.classList.toggle('is-on', !!visibles);
    bouton.setAttribute('aria-pressed', visibles ? 'true' : 'false');
    const texte = visibles ? 'Itinéraires affichés — toucher pour les cacher' : 'Itinéraires cachés — toucher pour les afficher';
    bouton.title = texte;
    bouton.setAttribute('aria-label', texte);
}

function toggleNpfCheminementsFond(event) {
    if (event) {
        try { event.preventDefault(); event.stopPropagation(); } catch (_) {}
    }
    writeNpfCheminementsVisibles(!readNpfCheminementsVisibles());
    refreshNpfCheminementsFond();
}

function isNpfCheminementsToggleTarget(event) {
    return !!event?.target?.closest?.('#cheminements-toggle');
}

function initNpfCheminements() {
    const bouton = document.getElementById('cheminements-toggle');
    if (bouton && bouton.dataset.bound !== '1') {
        bouton.dataset.bound = '1';
        bouton.addEventListener('click', toggleNpfCheminementsFond);
        refreshNpfCheminementsBouton();
    }
    let tries = 0;
    const attempt = () => {
        tries += 1;
        if (typeof map !== 'undefined' && map && map.on) {
            map.on('zoomend', refreshNpfCheminementsFond);
            map.on('zoomend', () => setTimeout(placerNpfCheminementEtiquettes, 50));
            refreshNpfCheminementsFond();
            return;
        }
        if (tries < 240) setTimeout(attempt, 500);
    };
    setTimeout(attempt, 1200);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNpfCheminements, { once: true });
} else {
    initNpfCheminements();
}
