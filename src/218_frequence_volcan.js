/* ==========================================================================
   RUN v1.16 — FRÉQUENCE VOLCAN, dessinée par l'app (pas dans les tuiles), en mer au sud-est du Piton de la Fournaise.
   RUN v1.17 — même présentation et mêmes échelles que les fréquences des terrains (nom puis fréquence, 2 NM et moins) :
   dessin de src/220 (buildNpfOperationalLabelMarker), appelé par refreshAirportOperationalLabels. Emplacement : point en mer
   le plus proche du sommet où l'étiquette (+ 8 px) ne recouvre que la mer à 2 NM, 1 NM et 0,5 NM (tests/pw_v117_volcan.js).
   ========================================================================== */

const NPF_VOLCAN_FREQUENCE = Object.freeze({ nom: 'VOLCAN', valeur: '122.30', lat: -21.3125, lon: 55.8125 });

function addNpfVolcanFrequencyLabel(bounds) {
    const latlng = L.latLng(NPF_VOLCAN_FREQUENCE.lat, NPF_VOLCAN_FREQUENCE.lon);
    if (!bounds.contains(latlng)) return;
    const marker = buildNpfOperationalLabelMarker(latlng, NPF_VOLCAN_FREQUENCE.nom, { type: '', value: NPF_VOLCAN_FREQUENCE.valeur });
    marker._npfVolcanFrequence = true;
    marker.addTo(airportOperationalLabelLayer);
}
