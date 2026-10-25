/* =========================================================================
   RUN v1.9 — CHEMINEMENTS VERS LES CIRQUES (données) — dessinés par Bastien (25/10/2026)
   ========================================================================= */
/* Tout part du point officiel de FMEP (pelicanAirports, ARP AIXM). Caps MAGNÉTIQUES et distances saisis par Bastien
 * (cap / dist) ; positions reconstruites DANS l'app avec computeNpfConstantMagneticCourse (même modèle que l'affichage
 * des branches de route WP : cap magnétique constant, déclinaison WMM2025 au point de départ de chaque branche) ;
 * l'app réaffiche les caps et distances saisis à 0,001° et 0,001 Nm près (tests/cdp_v19_reconstruction.js).
 * Une branche = [lat, lon, nom du point, cap magnétique saisi, distance saisie]. Total = somme des distances. */
const NPF_RUN_CHEMINEMENTS = Object.freeze([
    Object.freeze({
        id: 'mafate-galets',
        nom: "Mafate par la Rivière des Galets",
        totalNm: 34.6,
        points: Object.freeze([
            [-21.283734, 55.340042, "WP1 large L'Étang-Salé", 315.1, 5.3],
            [-21.211237, 55.279961, "WP2 large Les Avirons", 342, 5.5],
            [-21.080780, 55.221007, "WP3 large Saint-Gilles", 356.7, 8.5],
            [-21.021135, 55.227574, "WP4 Boucan-Canot", 25.3, 3.6],
            [-20.971728, 55.314406, "WP5 embouchure Rivière des Galets", 78, 5.7],
            [-20.975713, 55.355209, "WP6", 115.3, 2.3],
            [-20.998250, 55.386153, "WP7 sous Dos d'Âne", 147.3, 2.2],
            [-21.007906, 55.410835, "WP8 entrée de Mafate", 132.1, 1.5]
        ])
    }),
    Object.freeze({
        id: 'mafate-cilaos',
        nom: "Mafate par Cilaos",
        totalNm: 15.7,
        points: Object.freeze([
            [-21.281001, 55.470641, "WP1 au-dessus de La Rivière", 65.7, 3.5],
            [-21.244068, 55.459729, "WP2 vers L'Entre-Deux", 4.3, 2.3],
            [-21.200023, 55.449994, "WP3 entre Piton Cabris et Grand Piton", 8, 2.7],
            [-21.108495, 55.454013, "WP4 col de Choupette / Marla", 21.9, 5.5],
            [-21.089397, 55.431607, "WP5 La Nouvelle", 331.9, 1.7]
        ])
    }),
    Object.freeze({
        id: 'salazie-cilaos-mafate',
        nom: "Salazie par Cilaos et Mafate",
        totalNm: 19.4,
        points: Object.freeze([
            [-21.281001, 55.470641, "WP1 au-dessus de La Rivière", 65.7, 3.5],
            [-21.244068, 55.459729, "WP2 vers L'Entre-Deux", 4.3, 2.3],
            [-21.200023, 55.449994, "WP3 entre Piton Cabris et Grand Piton", 8, 2.7],
            [-21.108495, 55.454013, "WP4 col de Choupette / Marla", 21.9, 5.5],
            [-21.081427, 55.427541, "WP5 La Nouvelle", 337.1, 2.2],
            [-21.074769, 55.453347, "WP6 col des Bœufs", 94, 1.5],
            [-21.053616, 55.473516, "WP7 Le Bélier", 61.1, 1.7]
        ])
    }),
    Object.freeze({
        id: 'salazie-cotier',
        nom: "Salazie par le côtier",
        totalNm: 57.3,
        points: Object.freeze([
            [-21.359399, 55.511274, "WP1 Saint-Pierre", 135.2, 5.3],
            [-21.382852, 55.572469, "WP2", 132.2, 3.7],
            [-21.395545, 55.651800, "WP3 large Saint-Joseph", 119.6, 4.5],
            [-21.354871, 55.812300, "WP4 Saint-Philippe", 94.6, 9.3],
            [-21.172336, 55.843765, "WP5 Bois Blanc, Sainte-Rose", 28.8, 11.1],
            [-21.063202, 55.736229, "WP6 Bras-Fusil", 336.9, 8.9],
            [-20.985680, 55.690997, "WP7 Bras-Panon", 350.8, 5.3],
            [-20.992710, 55.630813, "WP8", 282.2, 3.4],
            [-21.007903, 55.603129, "WP9", 258.9, 1.8],
            [-21.003893, 55.583980, "WP10", 302, 1.1],
            [-21.016896, 55.561128, "WP11 Îlet Fleurs Jaunes", 258, 1.5],
            [-21.029692, 55.540245, "WP12 Salazie", 256.1, 1.4]
        ])
    })
]);
