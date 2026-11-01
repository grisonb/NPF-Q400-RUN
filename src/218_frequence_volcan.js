/* ==========================================================================
   RUN v1.16 — FRÉQUENCE VOLCAN : inscription dessinée par l'app (pas dans les
   tuiles), en mer au sud-est du Piton de la Fournaise. Le texte part vers le
   sud-est de son point d'ancrage : il s'éloigne de la côte à toute échelle.
   ========================================================================== */

const NPF_VOLCAN_FREQUENCE_TEXTE = 'VOLCAN : 122.30';
const NPF_VOLCAN_FREQUENCE_POINT = Object.freeze({ lat: -21.40, lon: 55.88 });
const NPF_VOLCAN_FREQUENCE_PANE = 'npfVolcanFrequencePane';

(function attendreCarteVolcan(essai = 0) {
    if (typeof map !== 'undefined' && map && typeof map.whenReady === 'function') {
        map.whenReady(() => {
            map.createPane(NPF_VOLCAN_FREQUENCE_PANE);
            const pane = map.getPane(NPF_VOLCAN_FREQUENCE_PANE);
            pane.style.zIndex = '640';
            pane.style.pointerEvents = 'none';
            L.marker([NPF_VOLCAN_FREQUENCE_POINT.lat, NPF_VOLCAN_FREQUENCE_POINT.lon], {
                pane: NPF_VOLCAN_FREQUENCE_PANE,
                interactive: false,
                keyboard: false,
                icon: L.divIcon({ className: 'npf-volcan-frequence', html: `<span>${NPF_VOLCAN_FREQUENCE_TEXTE}</span>`, iconSize: null, iconAnchor: [0, 0] })
            }).addTo(map);
        });
        return;
    }
    if (essai < 240) setTimeout(() => attendreCarteVolcan(essai + 1), 500);
})();
