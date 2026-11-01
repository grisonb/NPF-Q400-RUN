/* ==========================================================================
   RUN v1.16 — RECHERCHE D'ADRESSE POSTALE (en ligne seulement)
   --------------------------------------------------------------------------
   La recherche de la loupe reste locale (communes, lieux, terrains). Le texte
   ne part au service d'adresses que sur un toucher de la dernière ligne de la
   liste, jamais à la frappe. Service : géocodage de la Géoplateforme (IGN),
   qui sert la Base Adresse Nationale depuis l'arrêt de api-adresse.data.gouv.fr.
   Envoyés : le texte tapé et le centre fixe de La Réunion (priorité aux
   résultats proches), jamais la position de l'avion.
   ========================================================================== */

const NPF_ADRESSE_URL = 'https://data.geopf.fr/geocodage/search';
const NPF_ADRESSE_REUNION = Object.freeze({ lat: '-21.115', lon: '55.536' });
const NPF_ADRESSE_TEXTE_MIN = 4;
const NPF_ADRESSE_TEXTE_MAX = 200;
const NPF_ADRESSE_DEMANDES = 20;   // le service ne sait pas se limiter à La Réunion : tri ci-dessous
const NPF_ADRESSE_AFFICHEES = 8;
const NPF_ADRESSE_DELAI_MS = 8000;
const NPF_ADRESSE_ZOOM = 14;
let npfAdresseSequence = 0;
let npfAdressePoint = null;

function ajouterNpfAdresseAuxResultats(liste) {
    const texte = String(document.getElementById('search-input')?.value || '').trim();
    if (texte.length < NPF_ADRESSE_TEXTE_MIN) return;
    const li = document.createElement('li');
    li.className = 'search-result-adresse';
    li.textContent = `Chercher l'adresse « ${texte.slice(0, NPF_ADRESSE_TEXTE_MAX)} »`;
    li.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        chercherNpfAdresse(texte.slice(0, NPF_ADRESSE_TEXTE_MAX));
    });
    liste.appendChild(li);
    liste.style.display = 'block';
}

function afficherNpfAdresseMessage(message) {
    const liste = document.getElementById('results-list');
    liste.innerHTML = '';
    const li = document.createElement('li');
    li.className = 'search-result-adresse-message';
    li.textContent = message;
    liste.appendChild(li);
    liste.style.display = 'block';
}

/* Adresses de La Réunion (code commune 974xx) du résultat du service. */
function lireNpfAdresses(donnees) {
    return (Array.isArray(donnees?.features) ? donnees.features : []).map(f => ({
        nom: String(f?.properties?.label || '').trim(),
        commune: String(f?.properties?.citycode || ''),
        lon: Number(f?.geometry?.coordinates?.[0]),
        lat: Number(f?.geometry?.coordinates?.[1])
    })).filter(a => a.nom && a.commune.startsWith('974') && Number.isFinite(a.lat) && Number.isFinite(a.lon))
        .slice(0, NPF_ADRESSE_AFFICHEES);
}

async function chercherNpfAdresse(texte) {
    const sequence = ++npfAdresseSequence;
    namedPlacesSearchSequence += 1;   // la recherche locale en cours ne réécrit plus la liste
    if (!navigator.onLine) {
        afficherNpfAdresseMessage('Recherche d\'adresse disponible seulement en ligne.');
        return;
    }
    afficherNpfAdresseMessage('Recherche de l\'adresse…');
    const parametres = new URLSearchParams({ q: texte, index: 'address', limit: String(NPF_ADRESSE_DEMANDES), ...NPF_ADRESSE_REUNION });
    const controle = new AbortController();
    const minuterie = setTimeout(() => controle.abort(), NPF_ADRESSE_DELAI_MS);
    let adresses = null;
    try {
        const reponse = await fetch(`${NPF_ADRESSE_URL}?${parametres}`, { signal: controle.signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
        if (reponse.ok) adresses = lireNpfAdresses(await reponse.json());
    } catch (_) {}
    clearTimeout(minuterie);
    if (sequence !== npfAdresseSequence) return;
    if (!adresses) {
        afficherNpfAdresseMessage(navigator.onLine ? 'Service d\'adresses injoignable. Réessayez.' : 'Recherche d\'adresse disponible seulement en ligne.');
        return;
    }
    if (!adresses.length) {
        afficherNpfAdresseMessage('Aucune adresse trouvée à La Réunion.');
        return;
    }
    const liste = document.getElementById('results-list');
    liste.innerHTML = '';
    adresses.forEach(a => {
        const li = document.createElement('li');
        li.textContent = a.nom;
        li.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            choisirNpfAdresse(a);
        });
        liste.appendChild(li);
    });
}

/* Direct to : WP du mode navigation, comme un WP perso (le feu en cours est fermé par activateNpfWaypointGoto). */
function npfAdresseDirectTo(a) {
    const point = { lat: a.lat, lon: a.lon, name: a.nom, source: 'adresse', sourceRef: a.nom };
    if (!findNpfWaypointForSource(point)) addNpfWaypoint(point);
    const wp = findNpfWaypointForSource(point);
    return wp ? activateNpfWaypointGoto(wp.id) : false;
}

function choisirNpfAdresse(a) {
    if (!map) return;
    const champ = document.getElementById('search-input');
    const liste = document.getElementById('results-list');
    const effacer = document.getElementById('clear-search');
    if (champ) { champ.value = ''; champ.blur(); }
    if (liste) liste.style.display = 'none';
    if (effacer) effacer.style.display = 'none';
    /* Barre de recherche refermée, comme après le choix d'une cible (src/110) : la carte et la fiche restent libres. */
    document.getElementById('ui-overlay').style.display = 'none';
    document.body?.classList.remove('npf-main-search-open');
    document.getElementById('toggle-search-button')?.classList.remove('active');
    if (currentCommune || selectedAirportDestination) document.getElementById('commune-info-display').style.display = 'flex';
    if (npfAdressePoint) { try { npfAdressePoint.remove(); } catch (_) {} }
    if (centerGpsFollowActive) disableCenterGpsFollow({ keepLiveGps: true });
    const latlng = L.latLng(a.lat, a.lon);
    map.setView(latlng, Math.min(NPF_ADRESSE_ZOOM, map.getMaxZoom()), { animate: false });
    const point = L.circleMarker(latlng, { radius: 8, color: '#ffffff', weight: 2, fillColor: '#e6007e', fillOpacity: 1, interactive: false }).addTo(map);
    npfAdressePoint = point;

    const fiche = document.createElement('div');
    fiche.className = 'npf-adresse-popup';
    const nom = document.createElement('div');
    nom.className = 'npf-adresse-nom';
    nom.textContent = a.nom;
    fiche.appendChild(nom);
    const bouton = (texte, classe, action) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `npf-map-longpress-action ${classe}`;
        b.textContent = texte;
        b.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            try { map.closePopup(); } catch (_) {}
            action();
        });
        fiche.appendChild(b);
    };
    bouton('Créer Feu', 'npf-map-longpress-fire npf-adresse-feu', () => {
        if (isSimulationMode) createSimulatedFireAtPoint(a.lat, a.lon);
        else createManualFireAtLatLng(latlng);
    });
    bouton('WP perso', 'npf-map-longpress-wp-perso npf-adresse-wp', () => ouvrirNpfWpPersoCreation(latlng, a.nom.replace(/\s\d{5}\s/, ' ')));   // sans le code postal : le nom est limité à 40 caractères
    bouton('Direct to', 'npf-adresse-direct', () => npfAdresseDirectTo(a));

    L.popup({ maxWidth: 300, closeButton: true, autoPan: true, keepInView: true, offset: [0, -8] })
        .setLatLng(latlng)
        .setContent(fiche)
        .on('remove', () => {
            if (npfAdressePoint === point) npfAdressePoint = null;
            try { point.remove(); } catch (_) {}
        })
        .openOn(map);
}
