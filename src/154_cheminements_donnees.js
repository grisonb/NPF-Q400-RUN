/* =========================================================================
   RUN v1.9 — CHEMINEMENTS VERS LES CIRQUES (données) — dessinés par Bastien (25/10/2026)
   RUN v1.10 — 3 itinéraires de plus (Cilaos, Nord par l'ouest, Nord par l'est), cirque d'arrivée de chaque itinéraire
   (« cirque » : mafate, cilaos, salazie, ou '' hors cirque) et contours des 3 cirques (28/10/2026)
   ========================================================================= */
/* Tout part du point officiel de FMEP (pelicanAirports, ARP AIXM). Caps MAGNÉTIQUES et distances saisis par Bastien
 * (cap / dist) ; positions reconstruites DANS l'app avec computeNpfConstantMagneticCourse (même modèle que l'affichage
 * des branches de route WP : cap magnétique constant, déclinaison WMM2025 au point de départ de chaque branche) ;
 * l'app réaffiche les caps et distances saisis à 0,001° et 0,001 Nm près (tests/cdp_v19_reconstruction.js).
 * Une branche = [lat, lon, nom du point, cap magnétique saisi, distance saisie]. Total = somme des distances.
 * Pour ajouter un itinéraire (par exemple vers Cilaos) : une entrée de plus, avec son « cirque » ; rien d'autre à changer. */
const NPF_RUN_CHEMINEMENTS = Object.freeze([
    Object.freeze({
        id: 'mafate-galets',
        cirque: 'mafate',
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
        cirque: 'mafate',
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
        cirque: 'salazie',
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
        cirque: 'salazie',
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
    }),
    /* RUN v1.10 — 3 itinéraires de Bastien (28/10/2026) ; un point à moins de 0,3 NM d'un point déjà enregistré EST ce
     * point (fusion, positions reprises telles quelles) : liste des fusions dans rapports/non_regression_v110.txt. */
    Object.freeze({
        id: 'cilaos',
        cirque: 'cilaos',
        nom: "Cilaos",
        totalNm: 8.5,
        points: Object.freeze([
            [-21.281001, 55.470641, "WP1 au-dessus de La Rivière", 68.2, 3.5],
            [-21.200023, 55.449994, "WP2 entre Piton Cabris et Grand Piton", 6.4, 5]
        ])
    }),
    Object.freeze({
        id: 'nord-ouest',
        cirque: '',
        nom: "Nord par l'ouest",
        totalNm: 38.8,
        points: Object.freeze([
            [-21.283734, 55.340042, "WP1 large L'Étang-Salé", 315.1, 5.3],
            [-21.211237, 55.279961, "WP2 large Les Avirons", 342, 5.5],
            [-21.080780, 55.221007, "WP3 large Saint-Gilles", 356.7, 8.5],
            [-21.021135, 55.227574, "WP4 Boucan-Canot", 25.3, 3.6],
            [-20.927823, 55.286361, "WP5 La Possession", 49.8, 6.5],
            [-20.892557, 55.372989, "WP6 côte ouest de Saint-Denis", 85.7, 5.3],
            [-20.921049, 55.439422, "WP7 au sud de Saint-Denis", 133.9, 4.1]
        ])
    }),
    Object.freeze({
        id: 'nord-est',
        cirque: '',
        nom: "Nord par l'est",
        totalNm: 48.1,
        points: Object.freeze([
            [-21.382852, 55.572469, "WP1", 134.7, 9],
            [-21.395545, 55.651800, "WP2 large Saint-Joseph", 119.4, 4.5],
            [-21.354871, 55.812300, "WP3 Saint-Philippe", 94, 9.3],
            [-21.172336, 55.843765, "WP4 Bois Blanc, Sainte-Rose", 28.9, 11.1],
            [-21.063202, 55.736229, "WP5 Bras-Fusil", 336.8, 8.9],
            [-20.985680, 55.690997, "WP6 Bras-Panon", 350.9, 5.3]
        ])
    })
]);

/* RUN v1.10 — contours des 3 cirques le long des crêtes des remparts (validés par Bastien le 28/10/2026). Calculés UNE
 * FOIS sur le PC (carte/outils_relief/42_contours_cirques.py : bassin versant en amont de la gorge de sortie, relief IGN
 * RGE ALTI de la carte RUN, sorties repérées sur OpenStreetMap ; simplifiés à 120 m) ; [lat, lon], polygone fermé. */
const NPF_RUN_CIRQUES = Object.freeze({
    mafate: Object.freeze({
        nom: 'Mafate',
        contour: Object.freeze([
            [-21.11765, 55.42457], [-21.11669, 55.41993], [-21.10236, 55.40165], [-21.08186, 55.38963], [-21.06904, 55.38740], [-21.06280, 55.38242],
            [-21.05030, 55.38088], [-21.04581, 55.37676], [-21.03957, 55.37830], [-21.03123, 55.38637], [-21.02370, 55.38912], [-21.00159, 55.36680],
            [-20.99278, 55.36371], [-20.98668, 55.35891], [-20.98252, 55.36251], [-20.97875, 55.35933], [-20.98067, 55.36260], [-20.97651, 55.36689],
            [-20.98035, 55.37461], [-20.98949, 55.38302], [-20.99061, 55.38903], [-20.98292, 55.40362], [-20.98292, 55.41959], [-20.98660, 55.42542],
            [-20.98757, 55.43521], [-20.98965, 55.43607], [-20.99141, 55.44070], [-20.99061, 55.44911], [-20.99286, 55.45152], [-20.99253, 55.45392],
            [-20.99662, 55.45761], [-20.99822, 55.45624], [-21.00864, 55.45744], [-21.01457, 55.46104], [-21.02066, 55.46001], [-21.02627, 55.46190],
            [-21.03043, 55.45383], [-21.05735, 55.45435], [-21.06079, 55.45255], [-21.06664, 55.44388], [-21.08178, 55.45735], [-21.08274, 55.46319],
            [-21.08554, 55.46448], [-21.09251, 55.45804], [-21.09355, 55.45504], [-21.09803, 55.45641], [-21.10068, 55.45461], [-21.10804, 55.43967],
            [-21.11205, 55.43590], [-21.11349, 55.42903]
        ])
    }),
    cilaos: Object.freeze({
        nom: 'Cilaos',
        contour: Object.freeze([
            [-21.19658, 55.43899], [-21.19426, 55.43684], [-21.18673, 55.43718], [-21.18505, 55.43229], [-21.17905, 55.42963], [-21.16432, 55.41281],
            [-21.15504, 55.41092], [-21.14799, 55.40543], [-21.13871, 55.40354], [-21.13470, 55.40834], [-21.12686, 55.41006], [-21.12077, 55.41796],
            [-21.11669, 55.42045], [-21.11765, 55.42457], [-21.11349, 55.42903], [-21.11205, 55.43590], [-21.10804, 55.43967], [-21.10068, 55.45461],
            [-21.09803, 55.45641], [-21.09355, 55.45504], [-21.09251, 55.45804], [-21.08594, 55.46371], [-21.08578, 55.46628], [-21.09203, 55.47709],
            [-21.09563, 55.48044], [-21.09931, 55.48010], [-21.10212, 55.48825], [-21.11117, 55.49452], [-21.11741, 55.50190], [-21.13198, 55.50739],
            [-21.14175, 55.50671], [-21.14703, 55.50207], [-21.15376, 55.50087], [-21.15856, 55.50207], [-21.16560, 55.49812], [-21.17761, 55.49520],
            [-21.18281, 55.48997], [-21.18921, 55.47812], [-21.19049, 55.47366], [-21.18921, 55.47091], [-21.19386, 55.46439], [-21.19001, 55.45650],
            [-21.19209, 55.45169], [-21.19530, 55.44929], [-21.19418, 55.44705]
        ])
    }),
    salazie: Object.freeze({
        nom: 'Salazie',
        contour: Object.freeze([
            [-21.10484, 55.49598], [-21.10004, 55.48087], [-21.09563, 55.48044], [-21.09203, 55.47709], [-21.08562, 55.46456], [-21.08274, 55.46319],
            [-21.08178, 55.45735], [-21.06664, 55.44388], [-21.06079, 55.45255], [-21.05735, 55.45435], [-21.03043, 55.45383], [-21.02627, 55.46190],
            [-21.02066, 55.46001], [-21.01457, 55.46104], [-21.00856, 55.46817], [-21.01016, 55.47246], [-21.00023, 55.49975], [-20.99911, 55.50851],
            [-21.00335, 55.51443], [-21.00808, 55.51726], [-21.00471, 55.52859], [-21.00568, 55.53151], [-21.00391, 55.53872], [-21.00584, 55.55280],
            [-21.00007, 55.55623], [-20.99991, 55.56087], [-20.99766, 55.56241], [-20.99253, 55.57391], [-20.99141, 55.57872], [-20.99366, 55.58576],
            [-20.99967, 55.58670], [-21.00119, 55.58507], [-21.00055, 55.58267], [-21.00423, 55.58026], [-21.00600, 55.57443], [-21.01826, 55.55752],
            [-21.02675, 55.55443], [-21.03844, 55.54567], [-21.06215, 55.53606], [-21.06664, 55.53125], [-21.07273, 55.53143], [-21.08298, 55.52490],
            [-21.08490, 55.52731], [-21.08730, 55.52662], [-21.08738, 55.52310], [-21.09331, 55.51675], [-21.09555, 55.50988]
        ])
    })
});
